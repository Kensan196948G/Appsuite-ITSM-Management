#!/bin/bash
# ========================================
# systemdサービスアンインストールスクリプト
# ========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  systemd サービスアンインストール${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# root権限確認
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ このスクリプトはroot権限で実行する必要があります${NC}"
    echo -e "使い方: sudo $0 [dev|prod|both]"
    exit 1
fi

MODE="${1:-both}"

# 開発環境サービスのアンインストール
if [ "$MODE" = "dev" ] || [ "$MODE" = "both" ]; then
    if [ -f /etc/systemd/system/appsuite-itsm-dev.service ]; then
        echo -e "${GREEN}✓ 開発環境サービスをアンインストール中...${NC}"

        # サービス停止
        systemctl stop appsuite-itsm-dev.service 2>/dev/null || true

        # サービス無効化
        systemctl disable appsuite-itsm-dev.service 2>/dev/null || true

        # サービスファイル削除
        rm /etc/systemd/system/appsuite-itsm-dev.service

        echo -e "${GREEN}✅ 開発環境サービスをアンインストールしました${NC}"
    else
        echo -e "${YELLOW}⚠️  開発環境サービスは既にアンインストール済みです${NC}"
    fi
    echo ""
fi

# 本番環境サービスのアンインストール
if [ "$MODE" = "prod" ] || [ "$MODE" = "both" ]; then
    if [ -f /etc/systemd/system/appsuite-itsm-prod.service ]; then
        echo -e "${GREEN}✓ 本番環境サービスをアンインストール中...${NC}"

        # サービス停止
        systemctl stop appsuite-itsm-prod.service 2>/dev/null || true

        # サービス無効化
        systemctl disable appsuite-itsm-prod.service 2>/dev/null || true

        # サービスファイル削除
        rm /etc/systemd/system/appsuite-itsm-prod.service

        echo -e "${GREEN}✅ 本番環境サービスをアンインストールしました${NC}"
    else
        echo -e "${YELLOW}⚠️  本番環境サービスは既にアンインストール済みです${NC}"
    fi
    echo ""
fi

# systemd再読み込み
systemctl daemon-reload

echo -e "${GREEN}✅ アンインストール完了${NC}"
echo ""
