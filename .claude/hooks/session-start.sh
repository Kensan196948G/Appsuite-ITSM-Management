#!/bin/bash
# ========================================
# SessionStart Hook - 並列開発環境初期化
# ========================================
# セッション開始時に実行されるフック
# - Git状態確認
# - Worktree確認
# - コンフリクトチェック

# プロジェクトルートを取得
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}[SessionStart Hook]${NC} 並列開発環境を初期化中..."

# Git状態確認
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "  📌 現在のブランチ: ${YELLOW}${CURRENT_BRANCH}${NC}"

    # 変更の確認
    if ! git diff --quiet; then
        echo -e "  ${YELLOW}⚠️  未コミットの変更があります${NC}"
    fi

    # Worktreeリスト表示
    WORKTREE_COUNT=$(git worktree list | wc -l)
    if [ $WORKTREE_COUNT -gt 1 ]; then
        echo -e "  🌳 アクティブなWorktree: ${WORKTREE_COUNT}個"
    fi
else
    echo -e "  ${RED}⚠️  Gitリポジトリではありません${NC}"
fi

# 並列開発のためのロックファイルチェック
LOCK_DIR=".claude/locks"
mkdir -p "$LOCK_DIR"

# 古いロックファイルのクリーンアップ（24時間以上前のもの）
find "$LOCK_DIR" -type f -name "*.lock" -mtime +1 -delete 2>/dev/null

echo -e "${GREEN}[SessionStart Hook]${NC} 初期化完了"
echo ""
