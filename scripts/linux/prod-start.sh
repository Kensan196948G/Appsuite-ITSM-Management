#!/bin/bash
# ========================================
# AppSuite ITSM 本番環境起動スクリプト
# ========================================

PORT=8443
ENV_NAME="本番"

echo "========================================"
echo "  AppSuite ITSM Management System"
echo "  [$ENV_NAME] 環境起動中..."
echo "========================================"
echo ""
echo "📌 設定情報:"
echo "   環境: $ENV_NAME"
echo "   ポート: $PORT"
echo "   プロトコル: HTTPS (SSL/TLS)"
echo ""
echo "🌐 アクセスURL:"
echo "   ローカル: https://localhost:$PORT"
echo "   LAN: https://172.23.10.109:$PORT"
echo ""
echo "⚠️  注意事項:"
echo "   - 自己署名SSL証明書を使用しています"
echo "   - ブラウザで「安全でない」警告が表示されます"
echo "   - 警告を承認してアクセスしてください"
echo ""
echo "========================================"
echo ""

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# SSL証明書パスを設定
CERT_PATH="$PROJECT_ROOT/ssl/prod-cert.pem"
KEY_PATH="$PROJECT_ROOT/ssl/prod-key.pem"

# SSL証明書の存在確認
if [ ! -f "$CERT_PATH" ]; then
    echo "❌ エラー: SSL証明書が見つかりません: $CERT_PATH"
    exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
    echo "❌ エラー: SSL秘密鍵が見つかりません: $KEY_PATH"
    exit 1
fi

# WebUI-Productionディレクトリに移動
cd "$PROJECT_ROOT/WebUI-Production"

echo "🔒 HTTPSサーバー起動中..."
echo ""

# http-serverをHTTPSモードで起動
npx http-server -p $PORT --ssl --cert "$CERT_PATH" --key "$KEY_PATH"

echo ""
echo "サーバーを停止しました。"
