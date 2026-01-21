#!/bin/bash
# ========================================
# Git Worktree削除スクリプト
# ========================================
# 使い方: ./worktree-remove.sh <branch-name>

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

if [ -z "$1" ]; then
    echo -e "${RED}❌ エラー: ブランチ名を指定してください${NC}"
    echo "使い方: $0 <branch-name>"
    exit 1
fi

BRANCH_NAME="$1"
WORKTREE_PATH="worktrees/$BRANCH_NAME"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Git Worktree 削除${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ ! -d "$WORKTREE_PATH" ]; then
    echo -e "${RED}❌ エラー: Worktreeが見つかりません: ${WORKTREE_PATH}${NC}"
    exit 1
fi

# 未コミットの変更確認
cd "$WORKTREE_PATH"
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  警告: 未コミットの変更があります${NC}"
    git status --short
    echo ""
    read -p "本当に削除しますか？ (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}キャンセルしました${NC}"
        exit 0
    fi
fi

cd "$PROJECT_ROOT"

# Worktree削除
echo -e "${GREEN}✓ Worktreeを削除中...${NC}"
git worktree remove "$WORKTREE_PATH" --force

# ブランチ削除確認
read -p "ブランチ '$BRANCH_NAME' も削除しますか？ (yes/no): " delete_branch
if [ "$delete_branch" = "yes" ]; then
    git branch -D "$BRANCH_NAME"
    echo -e "${GREEN}✓ ブランチも削除しました${NC}"
fi

echo ""
echo -e "${GREEN}✅ Worktree削除完了！${NC}"
echo ""
echo -e "${BLUE}🌳 残りのWorktree一覧:${NC}"
git worktree list
echo ""
