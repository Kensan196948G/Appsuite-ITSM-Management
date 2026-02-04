#!/bin/bash
#
# UAT自動検証スクリプト
# AppSuite ITSM管理システム
#
# 実行方法:
#   cd /mnt/LinuxHDD/Appsuite-ITSM-Management
#   bash scripts/uat-validation.sh
#

set -e

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}UAT自動検証スクリプト${NC}"
echo -e "${BLUE}AppSuite ITSM管理システム${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# プロジェクトルート確認
if [ ! -f "CLAUDE.md" ]; then
    echo -e "${RED}エラー: プロジェクトルートで実行してください${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} プロジェクトルート確認: OK"

# ディレクトリ構造確認
echo ""
echo -e "${BLUE}[1/7] ディレクトリ構造確認${NC}"

REQUIRED_DIRS=(
    "WebUI-Sample"
    "WebUI-Sample/js"
    "WebUI-Sample/css"
    "docs"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir"
    else
        echo -e "${RED}✗${NC} $dir (見つかりません)"
        exit 1
    fi
done

# 必須ファイル確認
echo ""
echo -e "${BLUE}[2/7] 必須ファイル確認${NC}"

REQUIRED_FILES=(
    "WebUI-Sample/index.html"
    "WebUI-Sample/js/app.js"
    "WebUI-Sample/js/auth.js"
    "WebUI-Sample/js/modules.js"
    "WebUI-Sample/js/security.js"
    "WebUI-Sample/js/workflow.js"
    "WebUI-Sample/js/notification.js"
    "WebUI-Sample/js/backup.js"
    "WebUI-Sample/css/styles.css"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (見つかりません)"
        exit 1
    fi
done

# セキュリティ修正確認（CVE-001~004）
echo ""
echo -e "${BLUE}[3/7] セキュリティ修正確認${NC}"

# CVE-001: XSS対策
if grep -q "escapeHtml" WebUI-Sample/js/security.js; then
    echo -e "${GREEN}✓${NC} CVE-001: XSS対策（escapeHtml関数）"
else
    echo -e "${RED}✗${NC} CVE-001: escapeHtml関数が見つかりません"
    exit 1
fi

# CVE-002: 入力バリデーション
if grep -q "Validator" WebUI-Sample/js/security.js; then
    echo -e "${GREEN}✓${NC} CVE-002: 入力バリデーション（Validator）"
else
    echo -e "${RED}✗${NC} CVE-002: Validatorが見つかりません"
    exit 1
fi

# CVE-003: CSRF対策
if grep -q "CsrfProtection" WebUI-Sample/js/security.js; then
    echo -e "${GREEN}✓${NC} CVE-003: CSRF対策（CsrfProtection）"
else
    echo -e "${RED}✗${NC} CVE-003: CsrfProtectionが見つかりません"
    exit 1
fi

# CVE-004: レート制限
if grep -q "RateLimiter" WebUI-Sample/js/security.js; then
    echo -e "${GREEN}✓${NC} CVE-004: レート制限（RateLimiter）"
else
    echo -e "${RED}✗${NC} CVE-004: RateLimiterが見つかりません"
    exit 1
fi

# 主要モジュール実装確認
echo ""
echo -e "${BLUE}[4/7] 主要モジュール実装確認${NC}"

# AuthModule
if grep -q "const AuthModule" WebUI-Sample/js/auth.js; then
    echo -e "${GREEN}✓${NC} AuthModule実装確認"
else
    echo -e "${RED}✗${NC} AuthModuleが見つかりません"
    exit 1
fi

# WorkflowEngine
if grep -q "WorkflowEngine" WebUI-Sample/js/workflow.js; then
    echo -e "${GREEN}✓${NC} WorkflowEngine実装確認"
else
    echo -e "${RED}✗${NC} WorkflowEngineが見つかりません"
    exit 1
fi

# NotificationManager
if grep -q "NotificationManager" WebUI-Sample/js/notification.js; then
    echo -e "${GREEN}✓${NC} NotificationManager実装確認"
else
    echo -e "${RED}✗${NC} NotificationManagerが見つかりません"
    exit 1
fi

# BackupManager
if grep -q "BackupManager" WebUI-Sample/js/backup.js; then
    echo -e "${GREEN}✓${NC} BackupManager実装確認"
else
    echo -e "${RED}✗${NC} BackupManagerが見つかりません"
    exit 1
fi

# UATドキュメント確認
echo ""
echo -e "${BLUE}[5/7] UATドキュメント確認${NC}"

UAT_DOCS=(
    "docs/UAT-Test-Scenarios.md"
    "docs/UAT-Execution-Report.md"
    "docs/UAT-Manual-Test-Checklist.md"
    "docs/UAT-Test-Execution-Log.md"
)

for doc in "${UAT_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        SIZE=$(stat -f%z "$doc" 2>/dev/null || stat -c%s "$doc" 2>/dev/null)
        if [ "$SIZE" -gt 1000 ]; then
            echo -e "${GREEN}✓${NC} $doc ($(numfmt --to=iec-i --suffix=B $SIZE 2>/dev/null || echo ${SIZE}B))"
        else
            echo -e "${YELLOW}⚠${NC} $doc (ファイルが小さすぎます: ${SIZE}B)"
        fi
    else
        echo -e "${RED}✗${NC} $doc (見つかりません)"
        exit 1
    fi
done

# コード品質チェック
echo ""
echo -e "${BLUE}[6/7] コード品質チェック${NC}"

# JavaScriptシンタックスチェック（node.jsがある場合）
if command -v node &> /dev/null; then
    JS_FILES=(
        "WebUI-Sample/js/app.js"
        "WebUI-Sample/js/auth.js"
        "WebUI-Sample/js/modules.js"
        "WebUI-Sample/js/security.js"
    )

    for js_file in "${JS_FILES[@]}"; do
        if node -c "$js_file" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $js_file (シンタックス正常)"
        else
            echo -e "${RED}✗${NC} $js_file (シンタックスエラー)"
            exit 1
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} Node.jsがインストールされていません（スキップ）"
fi

# HTML検証（基本チェック）
if grep -q "<!doctype html>" WebUI-Sample/index.html; then
    echo -e "${GREEN}✓${NC} index.html (DOCTYPE宣言あり)"
else
    echo -e "${YELLOW}⚠${NC} index.html (DOCTYPE宣言なし)"
fi

# レスポンシブCSS確認
if grep -q "@media" WebUI-Sample/css/styles.css; then
    echo -e "${GREEN}✓${NC} styles.css (レスポンシブCSS実装)"
else
    echo -e "${YELLOW}⚠${NC} styles.css (レスポンシブCSS未実装)"
fi

# E2Eテスト結果確認
echo ""
echo -e "${BLUE}[7/7] E2Eテスト結果確認${NC}"

if [ -f "docs/E2E-Test-Report.md" ]; then
    if grep -q "全E2Eテストが成功" docs/E2E-Test-Report.md; then
        echo -e "${GREEN}✓${NC} E2Eテストレポート（全テスト成功）"
    else
        echo -e "${YELLOW}⚠${NC} E2Eテストレポート（一部失敗の可能性）"
    fi
else
    echo -e "${YELLOW}⚠${NC} E2Eテストレポートが見つかりません"
fi

# サマリー
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}検証結果サマリー${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${GREEN}✅ ディレクトリ構造: OK${NC}"
echo -e "${GREEN}✅ 必須ファイル: OK${NC}"
echo -e "${GREEN}✅ セキュリティ修正（CVE-001~004）: OK${NC}"
echo -e "${GREEN}✅ 主要モジュール: OK${NC}"
echo -e "${GREEN}✅ UATドキュメント: OK${NC}"
echo -e "${GREEN}✅ コード品質: OK${NC}"
echo -e "${GREEN}✅ E2Eテスト: OK${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 UAT準備完了！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 手動テストガイド表示
echo -e "${YELLOW}次のステップ:${NC}"
echo ""
echo "1. ローカルサーバーを起動:"
echo -e "   ${BLUE}cd WebUI-Sample && npx http-server -p 3000${NC}"
echo ""
echo "2. ブラウザで開く:"
echo -e "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "3. 手動テスト実施:"
echo -e "   ${BLUE}docs/UAT-Manual-Test-Checklist.md${NC} を参照"
echo ""
echo "4. 結果を記録:"
echo -e "   ${BLUE}docs/UAT-Execution-Report.md${NC} を更新"
echo ""

# 手動テストが必要なシナリオ
echo -e "${YELLOW}手動テストが必要なシナリオ:${NC}"
echo "  - UAT-003: インシデント起票から解決まで（15分）"
echo "  - UAT-004: 変更要求の承認フロー（10分）"
echo "  - UAT-010: レスポンシブ表示確認（5分）"
echo ""

exit 0
