#!/bin/bash
# auto_fix_with_claudecode.sh - Claude Code統合の自動修復スクリプト
#
# 目的: CI/CDパイプラインでテスト失敗時にClaude Codeを使用して自動修復を試みる
#
# 使用方法:
#   ./ci/auto_fix_with_claudecode.sh [error_log_file]
#
# 環境変数:
#   MAX_FIX_ATTEMPTS - 最大修復試行回数（デフォルト: 5）
#   DIFF_LINE_LIMIT - 許容する差分行数上限（デフォルト: 20）
#   CI_LOG_DIR - ログ出力ディレクトリ（デフォルト: ci_logs）

set -euo pipefail

# 設定
MAX_FIX_ATTEMPTS="${MAX_FIX_ATTEMPTS:-5}"
DIFF_LINE_LIMIT="${DIFF_LINE_LIMIT:-20}"
CI_LOG_DIR="${CI_LOG_DIR:-ci_logs}"
ERROR_HASH_FILE="${CI_LOG_DIR}/.last_error_hash"
ATTEMPT_COUNT_FILE="${CI_LOG_DIR}/.attempt_count"

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ログディレクトリ作成
mkdir -p "$CI_LOG_DIR"

# エラーログファイル
ERROR_LOG="${1:-}"
if [[ -z "$ERROR_LOG" ]]; then
    log_error "エラーログファイルが指定されていません"
    echo "使用方法: $0 <error_log_file>"
    exit 1
fi

if [[ ! -f "$ERROR_LOG" ]]; then
    log_error "エラーログファイルが存在しません: $ERROR_LOG"
    exit 1
fi

# エラーハッシュ計算（同じエラーの繰り返し検出用）
calculate_error_hash() {
    # エラーメッセージの特徴的な部分を抽出してハッシュ化
    grep -E "(Error|Failed|error:|FAIL)" "$ERROR_LOG" | head -20 | sha256sum | cut -d' ' -f1
}

# 試行回数管理
get_attempt_count() {
    if [[ -f "$ATTEMPT_COUNT_FILE" ]]; then
        cat "$ATTEMPT_COUNT_FILE"
    else
        echo "0"
    fi
}

increment_attempt_count() {
    local count
    count=$(get_attempt_count)
    echo $((count + 1)) > "$ATTEMPT_COUNT_FILE"
}

reset_attempt_count() {
    echo "0" > "$ATTEMPT_COUNT_FILE"
}

# 同じエラーの繰り返しを検出
check_same_error() {
    local current_hash
    current_hash=$(calculate_error_hash)

    if [[ -f "$ERROR_HASH_FILE" ]]; then
        local last_hash
        last_hash=$(cat "$ERROR_HASH_FILE")
        if [[ "$current_hash" == "$last_hash" ]]; then
            log_warn "同じエラーが繰り返されています"
            return 0  # 同じエラー
        fi
    fi

    echo "$current_hash" > "$ERROR_HASH_FILE"
    return 1  # 新しいエラー
}

# 修復試行前のガードチェック
guard_check() {
    local attempt_count
    attempt_count=$(get_attempt_count)

    log_info "修復試行回数: $attempt_count / $MAX_FIX_ATTEMPTS"

    # 最大試行回数チェック
    if [[ $attempt_count -ge $MAX_FIX_ATTEMPTS ]]; then
        log_error "最大修復試行回数に達しました（$MAX_FIX_ATTEMPTS回）"
        log_error "手動での修正が必要です"
        return 1
    fi

    # 同じエラーの繰り返しチェック
    if check_same_error; then
        local same_error_count
        same_error_count=$((attempt_count + 1))
        if [[ $same_error_count -ge 3 ]]; then
            log_error "同じエラーが3回以上繰り返されています"
            log_error "自動修復では解決できない可能性があります"
            return 1
        fi
    else
        # 新しいエラーの場合、カウントをリセット
        reset_attempt_count
    fi

    return 0
}

# Claude Codeで修復を実行
run_claude_code_fix() {
    local error_content
    error_content=$(cat "$ERROR_LOG")

    log_info "Claude Codeによる自動修復を開始..."

    # Claude Code CLIが利用可能か確認
    if ! command -v claude &> /dev/null; then
        log_error "Claude Code CLIがインストールされていません"
        return 1
    fi

    # 修復プロンプトを作成
    local fix_prompt
    fix_prompt="以下のテストエラーを分析し、修正してください。
変更は最小限に留め、既存のコードスタイルを維持してください。

エラーログ:
\`\`\`
$error_content
\`\`\`

修正する際の注意点:
1. エラーの根本原因を特定すること
2. 他の機能に影響を与えないこと
3. テストが通ることを確認すること
4. 差分は${DIFF_LINE_LIMIT}行以内に収めること"

    # Claude Codeを実行
    local fix_log="${CI_LOG_DIR}/fix_attempt_$(date +%Y%m%d_%H%M%S).log"

    if claude --print "$fix_prompt" > "$fix_log" 2>&1; then
        log_info "Claude Code修復提案を作成しました: $fix_log"
        return 0
    else
        log_error "Claude Code実行に失敗しました"
        return 1
    fi
}

# 差分サイズチェック
check_diff_size() {
    local diff_lines
    diff_lines=$(git diff --stat | tail -1 | grep -oE '[0-9]+' | head -1 || echo "0")

    log_info "変更差分: ${diff_lines}行"

    if [[ $diff_lines -gt $DIFF_LINE_LIMIT ]]; then
        log_error "差分が上限を超えています（${diff_lines}行 > ${DIFF_LINE_LIMIT}行）"
        log_error "変更をロールバックします"
        git checkout -- .
        return 1
    fi

    return 0
}

# メイン処理
main() {
    log_info "=== 自動修復スクリプト開始 ==="
    log_info "エラーログ: $ERROR_LOG"

    # ガードチェック
    if ! guard_check; then
        log_error "ガードチェック失敗 - 自動修復を中止"
        exit 1
    fi

    # 試行回数をインクリメント
    increment_attempt_count

    # Claude Codeで修復
    if ! run_claude_code_fix; then
        log_error "修復に失敗しました"
        exit 1
    fi

    # 差分サイズチェック
    if ! check_diff_size; then
        log_error "差分サイズチェック失敗"
        exit 1
    fi

    log_info "=== 自動修復スクリプト完了 ==="
    log_info "修復後のテストを実行してください"
}

main "$@"
