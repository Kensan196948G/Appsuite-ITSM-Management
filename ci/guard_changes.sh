#!/bin/bash
# guard_changes.sh - 変更ガード機能
#
# 目的: CIパイプラインでの変更が安全な範囲内であることを確認
#
# 機能:
#   - 差分行数の制限チェック
#   - 重要ファイルの変更検知
#   - 同じエラーの繰り返し検知
#   - 無限ループ防止
#
# 使用方法:
#   ./ci/guard_changes.sh [check_type]
#   check_type: diff | critical | loop | all (デフォルト: all)

set -euo pipefail

# 設定
MAX_DIFF_LINES="${MAX_DIFF_LINES:-20}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-5}"
CI_LOG_DIR="${CI_LOG_DIR:-ci_logs}"

# 重要ファイルリスト（変更には承認が必要）
CRITICAL_FILES=(
    "package.json"
    "package-lock.json"
    ".claude/settings.json"
    ".github/workflows/*.yml"
    "config/*.json"
)

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

# 差分行数チェック
check_diff_lines() {
    log_check "差分行数をチェック中..."

    local diff_stat
    diff_stat=$(git diff --stat 2>/dev/null || echo "")

    if [[ -z "$diff_stat" ]]; then
        log_info "変更なし"
        return 0
    fi

    # 追加・削除行数を取得
    local insertions deletions
    insertions=$(echo "$diff_stat" | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
    deletions=$(echo "$diff_stat" | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")

    local total_changes=$((insertions + deletions))

    log_info "変更: +$insertions -$deletions (合計: $total_changes行)"

    if [[ $total_changes -gt $MAX_DIFF_LINES ]]; then
        log_error "差分が上限を超えています: $total_changes > $MAX_DIFF_LINES"
        return 1
    fi

    log_info "差分チェック: OK"
    return 0
}

# 重要ファイル変更チェック
check_critical_files() {
    log_check "重要ファイルの変更をチェック中..."

    local changed_files
    changed_files=$(git diff --name-only 2>/dev/null || echo "")

    if [[ -z "$changed_files" ]]; then
        log_info "変更されたファイルなし"
        return 0
    fi

    local critical_changes=()

    for file in $changed_files; do
        for pattern in "${CRITICAL_FILES[@]}"; do
            if [[ "$file" == $pattern ]]; then
                critical_changes+=("$file")
            fi
        done
    done

    if [[ ${#critical_changes[@]} -gt 0 ]]; then
        log_warn "重要ファイルが変更されています:"
        for cf in "${critical_changes[@]}"; do
            log_warn "  - $cf"
        done
        log_warn "これらの変更には手動での確認が必要です"
        return 2  # 警告（エラーではない）
    fi

    log_info "重要ファイルチェック: OK"
    return 0
}

# 無限ループ検知
check_loop_detection() {
    log_check "無限ループをチェック中..."

    local attempt_file="${CI_LOG_DIR}/.attempt_count"
    local error_hash_file="${CI_LOG_DIR}/.last_error_hash"

    if [[ ! -f "$attempt_file" ]]; then
        log_info "試行回数: 0"
        return 0
    fi

    local attempt_count
    attempt_count=$(cat "$attempt_file")

    log_info "試行回数: $attempt_count / $MAX_ATTEMPTS"

    if [[ $attempt_count -ge $MAX_ATTEMPTS ]]; then
        log_error "最大試行回数に達しました"
        log_error "自動修復を停止し、手動対応が必要です"
        return 1
    fi

    # エラーハッシュの重複チェック
    if [[ -f "$error_hash_file" ]]; then
        local hash_count
        hash_count=$(sort "$error_hash_file" 2>/dev/null | uniq -c | sort -rn | head -1 | awk '{print $1}' || echo "0")

        if [[ $hash_count -ge 3 ]]; then
            log_error "同じエラーが3回以上発生しています"
            log_error "根本的な問題を手動で調査してください"
            return 1
        fi
    fi

    log_info "ループ検知チェック: OK"
    return 0
}

# 全チェック実行
check_all() {
    local exit_code=0

    log_info "=== 変更ガードチェック開始 ==="

    check_diff_lines || exit_code=1
    check_critical_files || { [[ $? -eq 2 ]] && log_warn "重要ファイル警告"; } || exit_code=1
    check_loop_detection || exit_code=1

    if [[ $exit_code -eq 0 ]]; then
        log_info "=== 全チェック完了: PASS ==="
    else
        log_error "=== チェック失敗: FAIL ==="
    fi

    return $exit_code
}

# ガードリセット（成功時に呼び出す）
reset_guards() {
    log_info "ガードカウンターをリセット中..."

    rm -f "${CI_LOG_DIR}/.attempt_count"
    rm -f "${CI_LOG_DIR}/.last_error_hash"

    log_info "リセット完了"
}

# 使用方法表示
show_usage() {
    echo "使用方法: $0 [check_type]"
    echo ""
    echo "check_type:"
    echo "  diff      - 差分行数チェック"
    echo "  critical  - 重要ファイル変更チェック"
    echo "  loop      - 無限ループ検知"
    echo "  all       - 全チェック（デフォルト）"
    echo "  reset     - ガードカウンターリセット"
    echo ""
    echo "環境変数:"
    echo "  MAX_DIFF_LINES - 許容差分行数（デフォルト: 20）"
    echo "  MAX_ATTEMPTS   - 最大試行回数（デフォルト: 5）"
    echo "  CI_LOG_DIR     - ログディレクトリ（デフォルト: ci_logs）"
}

# メイン処理
main() {
    local check_type="${1:-all}"

    mkdir -p "$CI_LOG_DIR"

    case "$check_type" in
        diff)
            check_diff_lines
            ;;
        critical)
            check_critical_files
            ;;
        loop)
            check_loop_detection
            ;;
        all)
            check_all
            ;;
        reset)
            reset_guards
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            log_error "不明なチェックタイプ: $check_type"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
