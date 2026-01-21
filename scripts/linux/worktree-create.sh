#!/bin/bash
# ========================================
# Git Worktree作成スクリプト
# ========================================
# 使い方: ./worktree-create.sh <branch-name> [base-branch]

set -e  # エラーで停止

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# 引数チェック
if [ -z "$1" ]; then
    echo -e "${RED}❌ エラー: ブランチ名を指定してください${NC}"
    echo "使い方: $0 <branch-name> [base-branch]"
    echo "例: $0 feature-user-auth main"
    exit 1
fi

BRANCH_NAME="$1"
BASE_BRANCH="${2:-main}"
WORKTREE_PATH="worktrees/$BRANCH_NAME"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Git Worktree 作成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "  ブランチ名: ${YELLOW}${BRANCH_NAME}${NC}"
echo -e "  ベースブランチ: ${YELLOW}${BASE_BRANCH}${NC}"
echo -e "  Worktreeパス: ${YELLOW}${WORKTREE_PATH}${NC}"
echo ""

# Worktreeディレクトリの存在確認
if [ -d "$WORKTREE_PATH" ]; then
    echo -e "${RED}❌ エラー: Worktree既に存在します: ${WORKTREE_PATH}${NC}"
    exit 1
fi

# ブランチの存在確認
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo -e "${YELLOW}⚠️  ブランチ '$BRANCH_NAME' は既に存在します${NC}"
    echo -e "   既存のブランチでWorktreeを作成します..."
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
    echo -e "${GREEN}✓ 新しいブランチ '$BRANCH_NAME' を作成します${NC}"
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" "$BASE_BRANCH"
fi

echo ""
echo -e "${GREEN}✅ Worktree作成完了！${NC}"
echo ""
echo -e "${BLUE}📌 次のステップ:${NC}"
echo -e "   1. cd $WORKTREE_PATH"
echo -e "   2. 作業を開始"
echo -e "   3. git add/commit/push"
echo ""
echo -e "${BLUE}🌳 現在のWorktree一覧:${NC}"
git worktree list
echo ""
