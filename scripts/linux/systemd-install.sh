#!/bin/bash
# ========================================
# systemdサービスインストールスクリプト
# ========================================
# systemdサービスファイルをインストールし、自動起動を設定

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  systemd サービスインストール${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# root権限確認
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ このスクリプトはroot権限で実行する必要があります${NC}"
    echo -e "使い方: sudo $0 [dev|prod|both]"
    exit 1
fi

MODE="${1:-both}"

# 開発環境サービスのインストール
if [ "$MODE" = "dev" ] || [ "$MODE" = "both" ]; then
    echo -e "${GREEN}✓ 開発環境サービスをインストール中...${NC}"

    # サービスファイルをコピー
    cp "$SCRIPT_DIR/systemd/appsuite-itsm-dev.service" /etc/systemd/system/

    # systemd再読み込み
    systemctl daemon-reload

    # サービス有効化
    systemctl enable appsuite-itsm-dev.service

    echo -e "${GREEN}✅ 開発環境サービスインストール完了${NC}"
    echo -e "   サービス名: appsuite-itsm-dev"
    echo -e "   起動: ${YELLOW}sudo systemctl start appsuite-itsm-dev${NC}"
    echo -e "   停止: ${YELLOW}sudo systemctl stop appsuite-itsm-dev${NC}"
    echo -e "   状態確認: ${YELLOW}sudo systemctl status appsuite-itsm-dev${NC}"
    echo ""
fi

# 本番環境サービスのインストール
if [ "$MODE" = "prod" ] || [ "$MODE" = "both" ]; then
    echo -e "${GREEN}✓ 本番環境サービスをインストール中...${NC}"

    # SSL証明書の存在確認
    if [ ! -f "$PROJECT_ROOT/ssl/prod-cert.pem" ] || [ ! -f "$PROJECT_ROOT/ssl/prod-key.pem" ]; then
        echo -e "${YELLOW}⚠️  警告: SSL証明書が見つかりません${NC}"
        echo -e "   先にSSL証明書を生成してください:"
        echo -e "   ${YELLOW}npm run ssl:prod${NC}"
        exit 1
    fi

    # サービスファイルをコピー
    cp "$SCRIPT_DIR/systemd/appsuite-itsm-prod.service" /etc/systemd/system/

    # systemd再読み込み
    systemctl daemon-reload

    # サービス有効化
    systemctl enable appsuite-itsm-prod.service

    echo -e "${GREEN}✅ 本番環境サービスインストール完了${NC}"
    echo -e "   サービス名: appsuite-itsm-prod"
    echo -e "   起動: ${YELLOW}sudo systemctl start appsuite-itsm-prod${NC}"
    echo -e "   停止: ${YELLOW}sudo systemctl stop appsuite-itsm-prod${NC}"
    echo -e "   状態確認: ${YELLOW}sudo systemctl status appsuite-itsm-prod${NC}"
    echo ""
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ すべてのインストールが完了しました${NC}"
echo ""
echo -e "${BLUE}📌 次のステップ:${NC}"
echo -e "   1. サービスを起動:"

if [ "$MODE" = "dev" ] || [ "$MODE" = "both" ]; then
    echo -e "      ${YELLOW}sudo systemctl start appsuite-itsm-dev${NC}"
fi

if [ "$MODE" = "prod" ] || [ "$MODE" = "both" ]; then
    echo -e "      ${YELLOW}sudo systemctl start appsuite-itsm-prod${NC}"
fi

echo -e ""
echo -e "   2. 起動時の自動起動を確認:"
echo -e "      ${YELLOW}systemctl list-unit-files | grep appsuite-itsm${NC}"
echo ""
echo -e "   3. ログを確認:"

if [ "$MODE" = "dev" ] || [ "$MODE" = "both" ]; then
    echo -e "      ${YELLOW}journalctl -u appsuite-itsm-dev -f${NC}"
fi

if [ "$MODE" = "prod" ] || [ "$MODE" = "both" ]; then
    echo -e "      ${YELLOW}journalctl -u appsuite-itsm-prod -f${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
