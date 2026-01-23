#!/bin/bash
# ========================================
# Code Review Runner
# ========================================
# 手動またはCIから code-reviewer を実行するスクリプト
# ========================================

set -euo pipefail

# ========================================
# 色定義
# ========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# 設定
# ========================================
PROJECT_ROOT="/mnt/LinuxHDD/Appsuite-ITSM-Management"
REVIEW_DIR="$PROJECT_ROOT/reviews/automated"
CHECKLIST="$PROJECT_ROOT/.claude/review_checklist.yaml"
AGENT_DEF="$PROJECT_ROOT/.claude/agents/code-reviewer.md"

# ========================================
# 使い方
# ========================================
usage() {
    cat << EOF
使い方: $0 <target_file> [feature_name]

引数:
  target_file   : レビュー対象ファイル（例: WebUI-Sample/js/modules.js）
  feature_name  : 機能名（省略時はファイル名から自動判定）

例:
  $0 WebUI-Sample/js/modules.js IncidentModule
  $0 WebUI-Sample/js/auth.js
  $0 WebUI-Production/js/security.js

環境変数:
  AUTO_FIX=true  : FAIL時に自動修正を試みる（実験的機能）
EOF
    exit 1
}

# ========================================
# 引数チェック
# ========================================
if [ $# -lt 1 ]; then
    usage
fi

TARGET_FILE="$1"
FEATURE_NAME="${2:-$(basename "$TARGET_FILE" .js)}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ========================================
# ファイル存在確認
# ========================================
if [ ! -f "$TARGET_FILE" ]; then
    echo -e "${RED}❌ エラー: ファイルが存在しません: $TARGET_FILE${NC}"
    exit 1
fi

# ========================================
# ヘッダー表示
# ========================================
echo ""
echo -e "${BLUE}========================================"
echo "🔍 自動コードレビュー実行"
echo -e "========================================${NC}"
echo -e "📄 対象ファイル: ${GREEN}$TARGET_FILE${NC}"
echo -e "🎯 機能名: ${GREEN}$FEATURE_NAME${NC}"
echo -e "⏰ 実行時刻: ${TIMESTAMP}"
echo -e "📋 チェックリスト: $CHECKLIST"
echo -e "🤖 SubAgent定義: $AGENT_DEF"
echo -e "${BLUE}========================================${NC}"
echo ""

# ========================================
# レビュー結果ファイルパス
# ========================================
REVIEW_JSON="$REVIEW_DIR/${TIMESTAMP}_${FEATURE_NAME}_result.json"
REVIEW_MD="$REVIEW_DIR/${TIMESTAMP}_${FEATURE_NAME}_result.md"

# ========================================
# レビュー情報ファイル作成
# ========================================
REVIEW_INFO="$REVIEW_DIR/.review_context_${TIMESTAMP}.json"

cat > "$REVIEW_INFO" << EOF
{
  "timestamp": "$TIMESTAMP",
  "target_file": "$TARGET_FILE",
  "feature_name": "$FEATURE_NAME",
  "checklist": "$CHECKLIST",
  "agent_definition": "$AGENT_DEF",
  "output_json": "$REVIEW_JSON",
  "output_md": "$REVIEW_MD",
  "status": "IN_PROGRESS"
}
EOF

echo -e "${YELLOW}📝 レビューコンテキスト作成: $REVIEW_INFO${NC}"
echo ""

# ========================================
# Claude Code でのレビュー実行指示
# ========================================
cat << EOF
========================================
🤖 次のステップ
========================================

Claude Code で以下を実行してください：

1. code-reviewer SubAgent を起動
   → Task ツールで subagent_type="code-reviewer" を指定

2. 以下の情報を渡す：
   - 対象ファイル: $TARGET_FILE
   - チェックリスト: $CHECKLIST
   - SubAgent定義: $AGENT_DEF

3. レビュー結果をJSON形式で取得

4. 結果を以下に保存：
   - JSON: $REVIEW_JSON
   - Markdown: $REVIEW_MD

========================================
📊 レビュー結果の判定基準
========================================

PASS:
  ✅ blocking_issues = 0
  ✅ warnings = 0
  ✅ すべての conformance が PASS

PASS_WITH_WARNINGS:
  ⚠️  blocking_issues = 0
  ⚠️  warnings ≥ 1
  ✅ すべての conformance が PASS

FAIL:
  ❌ blocking_issues ≥ 1
  または
  ❌ security_conformance = FAIL
  または
  ❌ itsm_conformance = FAIL

========================================
🔧 FAIL時のアクション
========================================

1. blocking_issues を確認
2. recommended_fixes を参照
3. コード修正
4. 再レビュー実行

========================================
EOF

# ========================================
# 待機（手動実行用）
# ========================================
if [ "${AUTO_REVIEW:-false}" != "true" ]; then
    echo ""
    echo -e "${YELLOW}ℹ️  このスクリプトはレビュー準備のみを行います${NC}"
    echo -e "${YELLOW}   実際のレビューは Claude Code で実行してください${NC}"
    echo ""
fi

# ========================================
# 終了
# ========================================
exit 0
