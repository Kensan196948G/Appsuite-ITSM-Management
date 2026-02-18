#!/bin/bash

# ============================================
# SSL証明書生成スクリプト
# AppSuite ITSM Management System
# ============================================
#
# このスクリプトは以下の機能を提供します：
# 1. Let's Encrypt証明書の取得（本番環境）
# 2. 自己署名証明書の生成（開発環境）
# 3. 証明書の自動更新設定
#
# 使用方法:
#   ./scripts/generate-ssl-cert.sh [letsencrypt|selfsigned]
#
# ============================================

set -e  # エラーが発生したら即座に終了
set -u  # 未定義変数の使用でエラー

# ============================================
# カラー定義
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# ログ出力関数
# ============================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# 使用方法の表示
# ============================================
show_usage() {
    cat << EOF
使用方法: $0 [MODE]

MODE:
  letsencrypt    Let's Encrypt証明書を取得（本番環境）
  selfsigned     自己署名証明書を生成（開発環境・対話形式）
  prod           本番用自己署名証明書を自動生成（非対話・SAN対応）
  renew          Let's Encrypt証明書を更新
  help           このヘルプを表示

例:
  $0 letsencrypt
  $0 selfsigned
  $0 prod
  $0 renew

EOF
}

# ============================================
# 環境変数の読み込み
# ============================================
load_config() {
    log_info "設定ファイルの読み込み中..."

    # デフォルト値
    DOMAIN="${DOMAIN:-appsuite-itsm.example.com}"
    EMAIL="${EMAIL:-admin@example.com}"
    COUNTRY="${COUNTRY:-JP}"
    STATE="${STATE:-Tokyo}"
    CITY="${CITY:-Chiyoda-ku}"
    ORGANIZATION="${ORGANIZATION:-Example Company}"
    ORGANIZATIONAL_UNIT="${ORGANIZATIONAL_UNIT:-IT Department}"

    # 環境変数ファイルが存在する場合は読み込み
    if [ -f "config/.env.production" ]; then
        source config/.env.production
        log_success "環境変数ファイルを読み込みました"
    else
        log_warning "環境変数ファイルが見つかりません。デフォルト値を使用します"
    fi

    log_info "ドメイン名: ${DOMAIN}"
    log_info "メールアドレス: ${EMAIL}"
}

# ============================================
# Let's Encrypt証明書の取得
# ============================================
generate_letsencrypt() {
    log_info "=========================================="
    log_info "Let's Encrypt証明書の取得を開始します"
    log_info "=========================================="

    # certbotのインストール確認
    if ! command -v certbot &> /dev/null; then
        log_error "certbotがインストールされていません"
        log_info "インストール方法:"
        log_info "  Ubuntu/Debian: sudo apt-get install certbot python3-certbot-apache"
        log_info "  CentOS/RHEL: sudo yum install certbot python3-certbot-apache"
        exit 1
    fi

    # Webサーバーの検出
    if command -v apache2 &> /dev/null; then
        WEBSERVER="apache"
        log_info "Apacheが検出されました"
    elif command -v nginx &> /dev/null; then
        WEBSERVER="nginx"
        log_info "Nginxが検出されました"
    else
        log_error "Webサーバーが検出されませんでした"
        exit 1
    fi

    # ドメインとメールアドレスの確認
    echo ""
    read -p "ドメイン名 [${DOMAIN}]: " INPUT_DOMAIN
    DOMAIN=${INPUT_DOMAIN:-$DOMAIN}

    read -p "メールアドレス [${EMAIL}]: " INPUT_EMAIL
    EMAIL=${INPUT_EMAIL:-$EMAIL}

    log_info "ドメイン: ${DOMAIN}"
    log_info "メール: ${EMAIL}"

    # 確認
    echo ""
    read -p "上記の設定で証明書を取得しますか？ (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        log_warning "処理を中止しました"
        exit 0
    fi

    # 証明書の取得
    log_info "証明書を取得中..."

    if [ "$WEBSERVER" = "apache" ]; then
        sudo certbot --apache \
            -d "${DOMAIN}" \
            --email "${EMAIL}" \
            --agree-tos \
            --no-eff-email \
            --redirect
    else
        sudo certbot --nginx \
            -d "${DOMAIN}" \
            --email "${EMAIL}" \
            --agree-tos \
            --no-eff-email \
            --redirect
    fi

    if [ $? -eq 0 ]; then
        log_success "証明書の取得に成功しました"
        log_info "証明書の保存先: /etc/letsencrypt/live/${DOMAIN}/"

        # 証明書情報の表示
        echo ""
        log_info "証明書情報:"
        sudo certbot certificates -d "${DOMAIN}"

        # 自動更新の設定
        setup_auto_renewal
    else
        log_error "証明書の取得に失敗しました"
        exit 1
    fi
}

# ============================================
# 自己署名証明書の生成
# ============================================
generate_selfsigned() {
    log_info "=========================================="
    log_info "自己署名証明書の生成を開始します"
    log_info "=========================================="
    log_warning "この証明書は開発環境でのみ使用してください"
    log_warning "本番環境では信頼できるCA発行の証明書を使用してください"

    # OpenSSLのインストール確認
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSLがインストールされていません"
        log_info "インストール方法:"
        log_info "  Ubuntu/Debian: sudo apt-get install openssl"
        log_info "  CentOS/RHEL: sudo yum install openssl"
        exit 1
    fi

    # ディレクトリの作成
    CERT_DIR="./ssl-certs"
    mkdir -p "${CERT_DIR}"
    log_info "証明書保存先: ${CERT_DIR}"

    # ドメイン名の入力
    echo ""
    read -p "ドメイン名 [${DOMAIN}]: " INPUT_DOMAIN
    DOMAIN=${INPUT_DOMAIN:-$DOMAIN}

    # 証明書情報の入力
    echo ""
    log_info "証明書情報を入力してください:"
    read -p "国コード (C) [${COUNTRY}]: " INPUT_COUNTRY
    COUNTRY=${INPUT_COUNTRY:-$COUNTRY}

    read -p "都道府県 (ST) [${STATE}]: " INPUT_STATE
    STATE=${INPUT_STATE:-$STATE}

    read -p "市区町村 (L) [${CITY}]: " INPUT_CITY
    CITY=${INPUT_CITY:-$CITY}

    read -p "組織名 (O) [${ORGANIZATION}]: " INPUT_ORG
    ORGANIZATION=${INPUT_ORG:-$ORGANIZATION}

    read -p "部署名 (OU) [${ORGANIZATIONAL_UNIT}]: " INPUT_OU
    ORGANIZATIONAL_UNIT=${INPUT_OU:-$ORGANIZATIONAL_UNIT}

    # 確認
    echo ""
    log_info "証明書情報:"
    log_info "  C  = ${COUNTRY}"
    log_info "  ST = ${STATE}"
    log_info "  L  = ${CITY}"
    log_info "  O  = ${ORGANIZATION}"
    log_info "  OU = ${ORGANIZATIONAL_UNIT}"
    log_info "  CN = ${DOMAIN}"

    read -p "上記の設定で証明書を生成しますか？ (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        log_warning "処理を中止しました"
        exit 0
    fi

    # 秘密鍵の生成（2048ビットRSA）
    log_info "秘密鍵を生成中..."
    openssl genrsa -out "${CERT_DIR}/appsuite-itsm.key" 2048

    # CSR（証明書署名要求）の生成
    log_info "CSRを生成中..."
    openssl req -new \
        -key "${CERT_DIR}/appsuite-itsm.key" \
        -out "${CERT_DIR}/appsuite-itsm.csr" \
        -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORGANIZATION}/OU=${ORGANIZATIONAL_UNIT}/CN=${DOMAIN}"

    # 自己署名証明書の生成（有効期限365日）
    log_info "自己署名証明書を生成中..."
    openssl x509 -req \
        -days 365 \
        -in "${CERT_DIR}/appsuite-itsm.csr" \
        -signkey "${CERT_DIR}/appsuite-itsm.key" \
        -out "${CERT_DIR}/appsuite-itsm.crt"

    # 権限設定
    chmod 600 "${CERT_DIR}/appsuite-itsm.key"
    chmod 644 "${CERT_DIR}/appsuite-itsm.crt"

    log_success "証明書の生成に成功しました"
    log_info "証明書の保存先:"
    log_info "  秘密鍵: ${CERT_DIR}/appsuite-itsm.key"
    log_info "  証明書: ${CERT_DIR}/appsuite-itsm.crt"

    # 証明書情報の表示
    echo ""
    log_info "証明書情報:"
    openssl x509 -in "${CERT_DIR}/appsuite-itsm.crt" -noout -text

    # 使用方法の表示
    echo ""
    log_info "=========================================="
    log_info "Webサーバーへの設定方法"
    log_info "=========================================="

    echo ""
    log_info "【Apacheの場合】"
    echo "1. 証明書をコピー:"
    echo "   sudo cp ${CERT_DIR}/appsuite-itsm.crt /etc/ssl/certs/"
    echo "   sudo cp ${CERT_DIR}/appsuite-itsm.key /etc/ssl/private/"
    echo ""
    echo "2. 設定ファイルを編集:"
    echo "   SSLCertificateFile /etc/ssl/certs/appsuite-itsm.crt"
    echo "   SSLCertificateKeyFile /etc/ssl/private/appsuite-itsm.key"
    echo ""
    echo "3. Apacheを再起動:"
    echo "   sudo systemctl restart apache2"

    echo ""
    log_info "【Nginxの場合】"
    echo "1. 証明書をコピー:"
    echo "   sudo cp ${CERT_DIR}/appsuite-itsm.crt /etc/nginx/ssl/"
    echo "   sudo cp ${CERT_DIR}/appsuite-itsm.key /etc/nginx/ssl/"
    echo ""
    echo "2. 設定ファイルを編集:"
    echo "   ssl_certificate /etc/nginx/ssl/appsuite-itsm.crt;"
    echo "   ssl_certificate_key /etc/nginx/ssl/appsuite-itsm.key;"
    echo ""
    echo "3. Nginxを再起動:"
    echo "   sudo systemctl restart nginx"

    echo ""
    log_warning "ブラウザで自己署名証明書の警告が表示されます"
    log_warning "開発環境でのみ使用し、警告を無視してアクセスしてください"
}

# ============================================
# 本番用自己署名証明書の自動生成（SAN対応・非対話形式）
# Windows Git Bash / Linux 両対応
# ============================================
generate_prod_selfsigned() {
    log_info "=========================================="
    log_info "本番用自己署名証明書の生成を開始します"
    log_info "=========================================="
    log_warning "この証明書はローカル/LAN環境でのみ使用してください"

    # OpenSSLのインストール確認
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSLがインストールされていません"
        exit 1
    fi

    # スクリプトのディレクトリからプロジェクトルートを取得
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
    CERT_DIR="$PROJECT_ROOT/ssl"

    # ssl/ ディレクトリを作成
    mkdir -p "$CERT_DIR"
    log_info "証明書保存先: $CERT_DIR"

    # 動的IPアドレスの取得
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1)
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    LOCAL_IP="${LOCAL_IP:-127.0.0.1}"
    log_info "検出されたIPアドレス: $LOCAL_IP"

    # Windows Git Bash判定（MSYS_NO_PATHCONV でパス変換を無効化）
    if [[ "${OSTYPE:-}" == "msys" ]] || [[ "${MSYSTEM:-}" == "MINGW64" ]] || [[ "${MSYSTEM:-}" == "MINGW32" ]]; then
        log_info "Windows Git Bash を検出 — MSYS_NO_PATHCONV=1 を適用します"
        export MSYS_NO_PATHCONV=1
        export MSYS2_ARG_CONV_EXCL="*"
    fi

    # OpenSSL 設定ファイルをtempに作成（SAN対応）
    TMPCONF=$(mktemp /tmp/openssl-san-XXXXXX.cnf)
    cat > "$TMPCONF" << SSLCONF
[req]
default_bits       = 4096
default_md         = sha256
distinguished_name = req_distinguished_name
req_extensions     = v3_req
x509_extensions    = v3_ca
prompt             = no

[req_distinguished_name]
C  = JP
ST = Tokyo
L  = Chiyoda-ku
O  = AppSuite ITSM
OU = IT Department
CN = localhost

[v3_req]
subjectAltName = @alt_names

[v3_ca]
subjectAltName         = @alt_names
basicConstraints       = CA:FALSE
keyUsage               = digitalSignature, keyEncipherment
extendedKeyUsage       = serverAuth

[alt_names]
DNS.1 = localhost
IP.1  = 127.0.0.1
IP.2  = $LOCAL_IP
SSLCONF

    log_info "秘密鍵（RSA 4096bit）を生成中..."
    openssl genrsa -out "$CERT_DIR/prod-key.pem" 4096 2>/dev/null

    log_info "自己署名証明書（SAN対応・有効期限825日）を生成中..."
    openssl req -new -x509 \
        -days 825 \
        -key "$CERT_DIR/prod-key.pem" \
        -out "$CERT_DIR/prod-cert.pem" \
        -config "$TMPCONF" 2>/dev/null

    rm -f "$TMPCONF"

    # Windows Git Bash環境変数を元に戻す
    unset MSYS_NO_PATHCONV 2>/dev/null || true
    unset MSYS2_ARG_CONV_EXCL 2>/dev/null || true

    # 権限設定（Linux のみ）
    if [[ "${OSTYPE:-}" != "msys" ]] && [[ -z "${MSYSTEM:-}" ]]; then
        chmod 600 "$CERT_DIR/prod-key.pem"
        chmod 644 "$CERT_DIR/prod-cert.pem"
    fi

    log_success "証明書の生成に成功しました"
    log_info "  秘密鍵: $CERT_DIR/prod-key.pem"
    log_info "  証明書: $CERT_DIR/prod-cert.pem"

    # SAN情報を表示
    echo ""
    log_info "証明書のSAN（Subject Alternative Name）:"
    openssl x509 -in "$CERT_DIR/prod-cert.pem" -noout -ext subjectAltName 2>/dev/null || \
        openssl x509 -in "$CERT_DIR/prod-cert.pem" -noout -text 2>/dev/null | grep -A2 "Subject Alternative"

    echo ""
    log_info "起動方法: ./scripts/windows/prod-start.ps1 または ./scripts/linux/prod-start.sh"
    log_warning "ブラウザで「安全でない」警告が表示されます — 警告を承認してアクセスしてください"
}

# ============================================
# 証明書の自動更新設定
# ============================================
setup_auto_renewal() {
    log_info "=========================================="
    log_info "証明書の自動更新を設定します"
    log_info "=========================================="

    # crontabの確認
    if ! command -v crontab &> /dev/null; then
        log_warning "crontabが見つかりません。手動で更新を実行してください"
        return
    fi

    # 既存のcrontabを確認
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_info "既に自動更新が設定されています"
    else
        # crontabに追加（毎日午前3時に更新チェック）
        log_info "crontabに自動更新を追加中..."
        (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload apache2 || systemctl reload nginx'") | crontab -
        log_success "自動更新を設定しました（毎日午前3時）"
    fi

    # テスト実行
    echo ""
    log_info "更新テストを実行しますか？"
    read -p "テストを実行 (y/N): " RUN_TEST
    if [[ $RUN_TEST =~ ^[Yy]$ ]]; then
        log_info "更新テストを実行中..."
        sudo certbot renew --dry-run

        if [ $? -eq 0 ]; then
            log_success "更新テストに成功しました"
        else
            log_error "更新テストに失敗しました"
        fi
    fi
}

# ============================================
# 証明書の手動更新
# ============================================
renew_certificate() {
    log_info "=========================================="
    log_info "証明書の更新を開始します"
    log_info "=========================================="

    # certbotのインストール確認
    if ! command -v certbot &> /dev/null; then
        log_error "certbotがインストールされていません"
        exit 1
    fi

    # 証明書の更新
    log_info "証明書を更新中..."
    sudo certbot renew

    if [ $? -eq 0 ]; then
        log_success "証明書の更新に成功しました"

        # Webサーバーの再起動
        if command -v apache2 &> /dev/null; then
            log_info "Apacheを再起動中..."
            sudo systemctl reload apache2
        elif command -v nginx &> /dev/null; then
            log_info "Nginxを再起動中..."
            sudo systemctl reload nginx
        fi

        log_success "Webサーバーを再起動しました"

        # 証明書情報の表示
        echo ""
        log_info "証明書情報:"
        sudo certbot certificates
    else
        log_error "証明書の更新に失敗しました"
        exit 1
    fi
}

# ============================================
# メイン処理
# ============================================
main() {
    echo ""
    log_info "=========================================="
    log_info "SSL証明書生成スクリプト"
    log_info "AppSuite ITSM Management System"
    log_info "=========================================="
    echo ""

    # 引数のチェック
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi

    MODE=$1

    case $MODE in
        letsencrypt)
            load_config
            generate_letsencrypt
            ;;
        selfsigned)
            load_config
            generate_selfsigned
            ;;
        prod)
            generate_prod_selfsigned
            ;;
        renew)
            renew_certificate
            ;;
        help)
            show_usage
            exit 0
            ;;
        *)
            log_error "不正なモード: ${MODE}"
            show_usage
            exit 1
            ;;
    esac

    echo ""
    log_success "=========================================="
    log_success "処理が完了しました"
    log_success "=========================================="
}

# スクリプトの実行
main "$@"
