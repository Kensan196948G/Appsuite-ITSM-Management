#!/usr/bin/env bash
# ========================================
# Loop Guard - 無限ループ防止機構
# ========================================
# 同じエラーの繰り返しや、最大試行回数を監視
# ========================================

set -euo pipefail

# ========================================
# 色定義
# ========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# 設定
# ========================================
MAX_ATTEMPTS=${MAX_ATTEMPTS:-5}
ATTEMPT_FILE=".ci_attempt"
ERROR_HASH_FILE=".ci_error_hash"
BUILD_LOG="${BUILD_LOG:-build.log}"

# ========================================
# ヘッダー
# ========================================
echo ""
echo -e "${YELLOW}🛡️  Loop Guard - Infinite Loop Prevention${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Max Attempts: $MAX_ATTEMPTS"
echo -e "Build Log: $BUILD_LOG"
echo ""

# ========================================
# Step 1: 試行回数カウント
# ========================================
ATTEMPT=$(cat "$ATTEMPT_FILE" 2>/dev/null || echo 0)
ATTEMPT=$((ATTEMPT + 1))
echo "$ATTEMPT" > "$ATTEMPT_FILE"

echo -e "Current Attempt: ${YELLOW}$ATTEMPT${NC} / $MAX_ATTEMPTS"

if [ "$ATTEMPT" -gt "$MAX_ATTEMPTS" ]; then
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ MAX ATTEMPTS REACHED${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}The CI has attempted to fix the build $MAX_ATTEMPTS times.${NC}"
    echo -e "${RED}Manual intervention is required.${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo -e "  1. Review build.log"
    echo -e "  2. Review ci_logs/ for details"
    echo -e "  3. Fix the issue manually"
    echo -e "  4. Reset attempt counter: rm $ATTEMPT_FILE $ERROR_HASH_FILE"
    echo ""
    exit 1
fi

# ========================================
# Step 2: エラーハッシュチェック（同じエラーの繰り返し検出）
# ========================================
if [ -f "$BUILD_LOG" ]; then
    # ビルドログのハッシュを計算
    if command -v sha1sum &> /dev/null; then
        HASH=$(sha1sum "$BUILD_LOG" | awk '{print $1}')
    elif command -v shasum &> /dev/null; then
        HASH=$(shasum "$BUILD_LOG" | awk '{print $1}')
    else
        echo -e "${YELLOW}⚠️  SHA checksum tool not found. Skipping hash check.${NC}"
        HASH=""
    fi

    if [ -n "$HASH" ]; then
        echo -e "Error Hash: ${HASH:0:16}..."

        if [ -f "$ERROR_HASH_FILE" ]; then
            LAST_HASH=$(cat "$ERROR_HASH_FILE")

            if [ "$HASH" = "$LAST_HASH" ]; then
                echo ""
                echo -e "${RED}========================================${NC}"
                echo -e "${RED}❌ SAME ERROR REPEATED${NC}"
                echo -e "${RED}========================================${NC}"
                echo -e "${RED}The same error occurred twice in a row.${NC}"
                echo -e "${RED}The CI auto-fix is not making progress.${NC}"
                echo ""
                echo -e "${YELLOW}📋 Likely Causes:${NC}"
                echo -e "  - The fix is incorrect"
                echo -e "  - The error requires design changes"
                echo -e "  - External dependency issue"
                echo ""
                echo -e "${YELLOW}📋 Next Steps:${NC}"
                echo -e "  1. Review ci_logs/diff_*.patch for recent changes"
                echo -e "  2. Review build.log for root cause"
                echo -e "  3. Revert changes if necessary: git reset --hard HEAD~1"
                echo -e "  4. Fix manually and reset: rm $ATTEMPT_FILE $ERROR_HASH_FILE"
                echo ""
                exit 1
            fi
        fi

        # 新しいハッシュを保存
        echo "$HASH" > "$ERROR_HASH_FILE"
        echo -e "${GREEN}✅ Error hash saved${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Build log not found. Skipping hash check.${NC}"
fi

# ========================================
# Step 3: 連続失敗回数チェック（オプション）
# ========================================
CONSECUTIVE_FAILURES_FILE=".ci_consecutive_failures"
CONSECUTIVE_FAILURES=$(cat "$CONSECUTIVE_FAILURES_FILE" 2>/dev/null || echo 0)
CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
echo "$CONSECUTIVE_FAILURES" > "$CONSECUTIVE_FAILURES_FILE"

echo -e "Consecutive Failures: ${YELLOW}$CONSECUTIVE_FAILURES${NC}"

if [ "$CONSECUTIVE_FAILURES" -ge 3 ]; then
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}⚠️  WARNING: 3 CONSECUTIVE FAILURES${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "${YELLOW}The CI has failed 3 times in a row.${NC}"
    echo -e "${YELLOW}Consider manual intervention if this continues.${NC}"
    echo ""
fi

# ========================================
# Step 4: ガード通過
# ========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Loop Guard PASSED${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Attempt $ATTEMPT/$MAX_ATTEMPTS is allowed to proceed.${NC}"
echo ""

exit 0
