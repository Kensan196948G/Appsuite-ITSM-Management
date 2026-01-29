#!/bin/bash
# ========================================
# Post-Implementation Hook
# ========================================
# 実装完了後に自動的にcode-reviewerを起動する
# Trigger: Edit/Write操作完了後
# ========================================

set -euo pipefail

# ========================================
# 設定
# ========================================
PROJECT_ROOT="/mnt/LinuxHDD/Appsuite-ITSM-Management"
REVIEW_DIR="$PROJECT_ROOT/reviews/automated"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ========================================
# 引数取得
# ========================================
CHANGED_FILE="${1:-}"
OPERATION="${2:-}"

if [ -z "$CHANGED_FILE" ]; then
    echo "⚠️  変更ファイルが指定されていません"
    exit 0
fi

# ========================================
# レビュー対象判定
# ========================================
# JavaScriptファイルのみレビュー対象
if [[ ! "$CHANGED_FILE" =~ \.js$ ]]; then
    echo "ℹ️  JavaScriptファイルではないためスキップ: $CHANGED_FILE"
    exit 0
fi

# node_modules, tests配下は除外
if [[ "$CHANGED_FILE" =~ node_modules ]] || [[ "$CHANGED_FILE" =~ /tests/ ]]; then
    echo "ℹ️  除外ディレクトリのためスキップ: $CHANGED_FILE"
    exit 0
fi

# ========================================
# 機能名抽出
# ========================================
FEATURE_NAME=$(basename "$CHANGED_FILE" .js)

# ========================================
# ログ出力
# ========================================
echo ""
echo "========================================" echo "🔍 自動レビューゲート起動"
echo "========================================echo "📄 対象ファイル: $CHANGED_FILE"
echo "⚙️  操作: $OPERATION"
echo "🎯 機能名: $FEATURE_NAME"
echo "⏰ 実行時刻: $TIMESTAMP"
echo "========================================"
echo ""

# ========================================
# レビュー結果ファイルパス
# ========================================
REVIEW_JSON="$REVIEW_DIR/${TIMESTAMP}_${FEATURE_NAME}_result.json"
REVIEW_MD="$REVIEW_DIR/${TIMESTAMP}_${FEATURE_NAME}_result.md"

# ========================================
# レビュー実行通知
# ========================================
echo "🤖 code-reviewer SubAgent を起動します..."
echo ""
echo "   対象: $CHANGED_FILE"
echo "   結果: $REVIEW_JSON"
echo ""

# ========================================
# 実際のレビュー実行はClaude側で実施
# ここではフラグファイルを作成して通知
# ========================================
REVIEW_REQUEST="$REVIEW_DIR/.pending_review_${TIMESTAMP}.json"

cat > "$REVIEW_REQUEST" << EOF
{
  "timestamp": "$TIMESTAMP",
  "file": "$CHANGED_FILE",
  "operation": "$OPERATION",
  "feature_name": "$FEATURE_NAME",
  "status": "PENDING",
  "output_json": "$REVIEW_JSON",
  "output_md": "$REVIEW_MD"
}
EOF

echo "✅ レビューリクエスト作成: $REVIEW_REQUEST"
echo ""
echo "========================================# ========================================
# 終了
# ========================================
exit 0
