#!/bin/bash
# ========================================
# AppSuite ITSM 開発環境起動スクリプト
# ========================================

PORT=3100
ENV_NAME="開発"

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
echo "   LAN: http://192.168.0.145:$PORT"
echo ""
echo "📌 ポート情報:"
echo "   このプロジェクト専用ポート（変更不可）: $PORT"
echo ""
echo "========================================"
echo ""

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# WebUI-Sampleディレクトリに移動
cd "$PROJECT_ROOT/WebUI-Sample"

echo "🚀 サーバー起動中..."
echo ""

# http-serverを起動（キャッシュ無効、CORS有効）
npx http-server -p $PORT -c-1 --cors

echo ""
echo "サーバーを停止しました。"
