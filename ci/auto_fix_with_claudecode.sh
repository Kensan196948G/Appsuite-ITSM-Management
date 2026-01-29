#!/usr/bin/env bash
# ========================================
# Claude Code CI Repairer (PowerShell Specialist)
# ========================================
# ビルド失敗ログを解析し、最小限の変更で修復する
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
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
BUILD_LOG="${BUILD_LOG:-${PROJECT_ROOT}/build.log}"
CI_LOGS_DIR="${PROJECT_ROOT}/ci_logs"
AGENT_DEF="${PROJECT_ROOT}/.claude/agents/ci-repairer.md"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ========================================
# ディレクトリ準備
# ========================================
mkdir -p "$CI_LOGS_DIR"

# ========================================
# ヘッダー表示
# ========================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🤖 Claude Code CI Repairer${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Timestamp: ${TIMESTAMP}"
echo -e "Build Log: ${BUILD_LOG}"
echo -e "CI Logs: ${CI_LOGS_DIR}"
echo -e "Agent Def: ${AGENT_DEF}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ========================================
# ビルドログ存在確認
# ========================================
if [ ! -f "$BUILD_LOG" ]; then
    echo -e "${RED}❌ Error: Build log not found: $BUILD_LOG${NC}"
    exit 1
fi

# ========================================
# ビルドログサイズ確認
# ========================================
LOG_SIZE=$(stat -f%z "$BUILD_LOG" 2>/dev/null || stat -c%s "$BUILD_LOG" 2>/dev/null || echo 0)
echo -e "${YELLOW}📄 Build log size: $((LOG_SIZE / 1024)) KB${NC}"

if [ "$LOG_SIZE" -gt 1048576 ]; then
    echo -e "${YELLOW}⚠️  Log file is large (>1MB). Truncating to last 5000 lines...${NC}"
    tail -5000 "$BUILD_LOG" > "${BUILD_LOG}.truncated"
    BUILD_LOG="${BUILD_LOG}.truncated"
fi

# ========================================
# ビルドログ保存（証跡）
# ========================================
cp "$BUILD_LOG" "$CI_LOGS_DIR/build_${TIMESTAMP}.log"
echo -e "${GREEN}✅ Build log archived: ci_logs/build_${TIMESTAMP}.log${NC}"
echo ""

# ========================================
# Claude Code 実行
# ========================================
echo -e "${BLUE}🧠 Invoking Claude Code CI Repairer...${NC}"
echo ""

# Claude Code に渡すプロンプトを構築
cat > /tmp/claude_ci_prompt_${TIMESTAMP}.txt << 'PROMPT_EOF'
You are a CI repair agent specialized in PowerShell.

Your role is to analyze the build failure log and apply THE MINIMAL CODE FIX necessary to make the build pass.

## Build Failure Log
---
PROMPT_EOF

# ビルドログの内容を追加
cat "$BUILD_LOG" >> /tmp/claude_ci_prompt_${TIMESTAMP}.txt

cat >> /tmp/claude_ci_prompt_${TIMESTAMP}.txt << 'PROMPT_EOF'
---

## Your Task

1. **Analyze** the log to identify the root cause of the failure
2. **Plan** the minimal fix required (do NOT over-engineer)
3. **Apply** the fix using Edit tool (minimal diff only)
4. **Do NOT**:
   - Refactor unrelated code
   - Add new external dependencies
   - Change design patterns
   - Modify non-PowerShell files (except CI scripts)

## Rules

- Fix ONLY the failing code
- Prefer smallest possible diff
- Focus on:
  - PSScriptAnalyzer errors
  - Pester test failures
  - ESLint errors (JavaScript only)
  - Syntax errors

## Output

After fixing, output a JSON summary:

```json
{
  "status": "FIXED | ABORTED | PARTIAL",
  "summary": "One-line summary of what was fixed",
  "fixes_applied": [
    {"file": "build.ps1", "line": 42, "fix": "description"}
  ],
  "files_modified": ["build.ps1"],
  "next_action": "COMMIT | MANUAL_REVIEW"
}
```

If you cannot fix the issue automatically, set status to "ABORTED" and explain why.

BEGIN YOUR ANALYSIS AND FIX NOW.
PROMPT_EOF

# ========================================
# Claude Code を実行（実際のコマンドは環境に応じて調整）
# ========================================
echo -e "${YELLOW}📝 Generated prompt: /tmp/claude_ci_prompt_${TIMESTAMP}.txt${NC}"
echo ""

# NOTE: 以下は環境に応じて調整してください
# 例1: Claude Code CLI がある場合
if command -v claude &> /dev/null; then
    claude < /tmp/claude_ci_prompt_${TIMESTAMP}.txt > /tmp/claude_ci_output_${TIMESTAMP}.txt 2>&1
    CLAUDE_EXIT_CODE=$?
# 例2: API経由で実行する場合
# elif [ -n "${ANTHROPIC_API_KEY:-}" ]; then
#     curl -X POST https://api.anthropic.com/v1/messages \
#         -H "x-api-key: $ANTHROPIC_API_KEY" \
#         -H "Content-Type: application/json" \
#         -d @/tmp/claude_api_request.json > /tmp/claude_ci_output_${TIMESTAMP}.txt
#     CLAUDE_EXIT_CODE=$?
# 例3: Claude Code Task ツールを使う場合（推奨）
else
    echo -e "${YELLOW}⚠️  Claude Code CLI not found.${NC}"
    echo -e "${YELLOW}   This script is meant to be called FROM Claude Code.${NC}"
    echo -e "${YELLOW}   Expected usage: Claude Code invokes this script after build failure.${NC}"
    echo ""
    echo -e "${BLUE}ℹ️  Generating manual review file instead...${NC}"

    cat > "$CI_LOGS_DIR/manual_review_${TIMESTAMP}.txt" << EOF
Build failed. Manual review required.

Build log: $BUILD_LOG
Timestamp: $TIMESTAMP

Please review the build log and fix the following errors:

$(head -50 "$BUILD_LOG")

... (truncated)

EOF

    echo -e "${GREEN}✅ Manual review file created: ci_logs/manual_review_${TIMESTAMP}.txt${NC}"
    CLAUDE_EXIT_CODE=0
fi

# ========================================
# Claude Code 出力確認
# ========================================
if [ "$CLAUDE_EXIT_CODE" -eq 0 ]; then
    echo -e "${GREEN}✅ Claude Code execution completed${NC}"

    if [ -f /tmp/claude_ci_output_${TIMESTAMP}.txt ]; then
        echo ""
        echo -e "${BLUE}📊 Claude Code Output:${NC}"
        echo -e "${BLUE}----------------------------------------${NC}"
        cat /tmp/claude_ci_output_${TIMESTAMP}.txt
        echo -e "${BLUE}----------------------------------------${NC}"
        echo ""

        # 出力を保存
        cp /tmp/claude_ci_output_${TIMESTAMP}.txt "$CI_LOGS_DIR/claude_output_${TIMESTAMP}.txt"
    fi
else
    echo -e "${RED}❌ Claude Code execution failed with exit code: $CLAUDE_EXIT_CODE${NC}"
    exit 1
fi

# ========================================
# Git差分を保存（証跡）
# ========================================
echo -e "${YELLOW}📝 Saving git diff (証跡)...${NC}"
git diff > "$CI_LOGS_DIR/diff_${TIMESTAMP}.patch"

if [ -s "$CI_LOGS_DIR/diff_${TIMESTAMP}.patch" ]; then
    echo -e "${GREEN}✅ Diff saved: ci_logs/diff_${TIMESTAMP}.patch${NC}"
    echo ""
    echo -e "${BLUE}📋 Diff Summary:${NC}"
    git diff --stat
else
    echo -e "${YELLOW}⚠️  No changes detected${NC}"
fi

# ========================================
# 一時ファイルクリーンアップ
# ========================================
rm -f /tmp/claude_ci_prompt_${TIMESTAMP}.txt
rm -f /tmp/claude_ci_output_${TIMESTAMP}.txt
rm -f "${BUILD_LOG}.truncated" 2>/dev/null || true

# ========================================
# 完了
# ========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ CI Repair completed${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

exit 0
