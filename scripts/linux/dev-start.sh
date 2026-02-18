#!/bin/bash
# ========================================
# AppSuite ITSM 開発環境起動スクリプト
# ========================================

PORT=3100
ENV_NAME="開発"

# 動的IPアドレス取得
LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
LOCAL_IP="${LOCAL_IP:-127.0.0.1}"

echo "========================================"
echo "  AppSuite ITSM Management System"
echo "  [$ENV_NAME] 環境起動中..."
echo "========================================"
echo ""
echo "📌 設定情報:"
echo "   環境: $ENV_NAME"
echo "   ポート: $PORT"
echo "   プロトコル: HTTP"
echo ""
echo "🌐 アクセスURL:"
echo "   ローカル: http://localhost:$PORT"
echo "   LAN: http://${LOCAL_IP}:$PORT"
echo ""
echo "📌 ポート情報:"
echo "   このプロジェクト専用ポート（変更不可）: $PORT"
echo ""
echo "========================================"
echo ""

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# WebUI-Productionディレクトリに移動
cd "$PROJECT_ROOT/WebUI-Production"

echo "🚀 サーバー起動中..."
echo ""

# http-serverを起動（キャッシュ無効、CORS有効）
npx http-server -p $PORT -c-1 --cors

echo ""
echo "サーバーを停止しました。"
