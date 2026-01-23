#!/bin/bash
# ========================================
# Git Worktree一覧表示スクリプト
# ========================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Git Worktree 一覧${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Worktree一覧取得
WORKTREES=$(git worktree list --porcelain)

if [ -z "$WORKTREES" ]; then
    echo -e "${YELLOW}Worktreeがありません${NC}"
    exit 0
fi

# パース用の変数
worktree_path=""
worktree_branch=""
worktree_head=""

echo "$WORKTREES" | while IFS= read -r line; do
    if [[ $line == worktree* ]]; then
        worktree_path=$(echo "$line" | awk '{print $2}')
    elif [[ $line == branch* ]]; then
        worktree_branch=$(echo "$line" | awk -F'/' '{print $NF}')
    elif [[ $line == HEAD* ]]; then
        worktree_head=$(echo "$line" | awk '{print $2}' | cut -c1-7)
    elif [[ -z $line ]] && [[ -n $worktree_path ]]; then
        # 情報表示
        if [[ $worktree_path == $(pwd) ]]; then
            echo -e "${GREEN}➤ ${worktree_path}${NC}"
        else
            echo -e "  ${worktree_path}"
        fi
        echo -e "     ブランチ: ${YELLOW}${worktree_branch:-detached}${NC}"
        echo -e "     HEAD: ${worktree_head}"
        echo ""

        # リセット
        worktree_path=""
        worktree_branch=""
        worktree_head=""
    fi
done

# 統計情報
WORKTREE_COUNT=$(git worktree list | wc -l)
echo -e "${BLUE}📊 統計:${NC} 合計 ${YELLOW}${WORKTREE_COUNT}${NC} 個のWorktree"
echo ""
