#!/bin/bash
# ============================================
# AppSuite ITSM 初期セットアップスクリプト
# git clone 後に実行してください
# Windows Git Bash / Linux 両対応
# ============================================
#
# 実行方法:
#   bash scripts/setup.sh
#
# このスクリプトは以下を自動で行います:
#   1. OS/環境の検出
#   2. 動的IPアドレスの取得
#   3. SSL証明書の生成（ssl/prod-cert.pem, ssl/prod-key.pem）
#   4. Git Worktreeのセットアップ（既存の場合はスキップ）
#   5. 起動方法の表示
# ============================================

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ログ関数
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERR]${NC}  $1"; }
step()    { echo -e "\n${CYAN}━━━ $1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ============================================
# プロジェクトルートの取得
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   AppSuite ITSM 初期セットアップ         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
info "プロジェクトルート: $PROJECT_ROOT"

# ============================================
# STEP 1: OS / 環境の検出
# ============================================
step "STEP 1: 環境検出"

IS_WINDOWS=false
IS_GIT_BASH=false
IS_LINUX=false

if [[ "${OSTYPE:-}" == "msys" ]] || [[ "${MSYSTEM:-}" =~ ^MINGW ]]; then
    IS_WINDOWS=true
    IS_GIT_BASH=true
    info "検出: Windows Git Bash ($MSYSTEM)"
elif [[ "${OSTYPE:-}" == "cygwin" ]]; then
    IS_WINDOWS=true
    info "検出: Cygwin"
elif [[ "$(uname -s 2>/dev/null)" == "Linux" ]]; then
    IS_LINUX=true
    info "検出: Linux ($(uname -r))"
elif [[ "$(uname -s 2>/dev/null)" == "Darwin" ]]; then
    info "検出: macOS"
else
    warn "OS検出不明 — Linuxとして処理を継続します"
    IS_LINUX=true
fi

# ============================================
# STEP 2: 動的IPアドレスの取得
# ============================================
step "STEP 2: IPアドレス検出"

LOCAL_IP=""

if $IS_WINDOWS; then
    # Windows Git Bash: powershell.exe を利用
    LOCAL_IP=$(powershell.exe -NoProfile -Command \
        "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.IPAddress -notlike '127.*' -and \$_.IPAddress -notlike '169.254.*' } | Sort-Object PrefixLength | Select-Object -First 1).IPAddress" \
        2>/dev/null | tr -d '\r\n' || true)
fi

# Linuxまたはフォールバック
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null \
        | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1)
fi
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
LOCAL_IP="${LOCAL_IP:-127.0.0.1}"

success "IPアドレス: $LOCAL_IP"

# ============================================
# STEP 3: SSL証明書の生成
# ============================================
step "STEP 3: SSL証明書の生成"

CERT_DIR="$PROJECT_ROOT/ssl"
CERT_FILE="$CERT_DIR/prod-cert.pem"
KEY_FILE="$CERT_DIR/prod-key.pem"

if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    warn "SSL証明書が既に存在します（スキップ）"
    info "  証明書: $CERT_FILE"
    info "  秘密鍵: $KEY_FILE"
    info "  再生成する場合は ssl/ ディレクトリを削除してから再実行してください"
else
    if ! command -v openssl &> /dev/null; then
        error "OpenSSLが見つかりません"
        if $IS_WINDOWS; then
            info "Git for Windows に同梱の openssl.exe を確認してください"
        else
            info "インストール: sudo apt-get install openssl"
        fi
        exit 1
    fi

    mkdir -p "$CERT_DIR"

    # Windows Git Bash のパス変換を無効化
    if $IS_GIT_BASH; then
        export MSYS_NO_PATHCONV=1
        export MSYS2_ARG_CONV_EXCL="*"
    fi

    # OpenSSL 設定ファイル（SAN対応）
    TMPCONF=$(mktemp /tmp/openssl-setup-XXXXXX.cnf)
    cat > "$TMPCONF" << SSLCONF
[req]
default_bits       = 4096
default_md         = sha256
distinguished_name = req_distinguished_name
x509_extensions    = v3_ca
prompt             = no

[req_distinguished_name]
C  = JP
ST = Tokyo
L  = Chiyoda-ku
O  = AppSuite ITSM
OU = IT Department
CN = localhost

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

    info "RSA 4096bit 秘密鍵を生成中..."
    openssl genrsa -out "$KEY_FILE" 4096 2>/dev/null

    info "自己署名証明書（SAN: localhost, 127.0.0.1, $LOCAL_IP）を生成中..."
    openssl req -new -x509 \
        -days 825 \
        -key "$KEY_FILE" \
        -out "$CERT_FILE" \
        -config "$TMPCONF" 2>/dev/null

    rm -f "$TMPCONF"

    # Windows Git Bash の環境変数を解除
    if $IS_GIT_BASH; then
        unset MSYS_NO_PATHCONV MSYS2_ARG_CONV_EXCL 2>/dev/null || true
    fi

    # Linux では権限を設定
    if $IS_LINUX; then
        chmod 600 "$KEY_FILE"
        chmod 644 "$CERT_FILE"
    fi

    success "SSL証明書を生成しました"
    info "  証明書: $CERT_FILE"
    info "  秘密鍵: $KEY_FILE"
fi

# ============================================
# STEP 4: Git Worktree のセットアップ
# ============================================
step "STEP 4: Git Worktree セットアップ"

cd "$PROJECT_ROOT"

setup_worktree() {
    local BRANCH="$1"
    local WPATH="worktrees/$BRANCH"
    if [ -d "$WPATH" ]; then
        warn "Worktree 既存: $WPATH （スキップ）"
    elif git show-ref --verify --quiet "refs/heads/$BRANCH" 2>/dev/null; then
        git worktree add "$WPATH" "$BRANCH"
        success "Worktree 追加: $WPATH (既存ブランチ)"
    else
        git worktree add -b "$BRANCH" "$WPATH" main 2>/dev/null || \
        git worktree add "$WPATH" --detach 2>/dev/null || \
        warn "Worktree 作成をスキップ: $WPATH"
        success "Worktree 追加: $WPATH (新規ブランチ)"
    fi
}

setup_worktree "phase5-release"
setup_worktree "windows-env"

echo ""
info "現在のWorktree一覧:"
git worktree list

# ============================================
# STEP 5: セットアップ完了サマリー
# ============================================
step "セットアップ完了"

DEV_PORT=3100
PROD_PORT=8443

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ セットアップが完了しました！                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📌 アクセスURL:${NC}"
echo -e "   開発環境 (HTTP):  ${CYAN}http://localhost:${DEV_PORT}${NC}"
echo -e "              LAN:  ${CYAN}http://${LOCAL_IP}:${DEV_PORT}${NC}"
echo -e "   本番環境 (HTTPS): ${CYAN}https://localhost:${PROD_PORT}${NC}"
echo -e "              LAN:  ${CYAN}https://${LOCAL_IP}:${PROD_PORT}${NC}"
echo ""
echo -e "${YELLOW}🚀 起動方法:${NC}"
if $IS_WINDOWS; then
    echo -e "   開発: ${CYAN}powershell -File scripts/windows/dev-start.ps1${NC}"
    echo -e "   本番: ${CYAN}powershell -File scripts/windows/prod-start.ps1${NC}"
else
    echo -e "   開発: ${CYAN}bash scripts/linux/dev-start.sh${NC}"
    echo -e "   本番: ${CYAN}bash scripts/linux/prod-start.sh${NC}"
fi
echo ""
echo -e "${YELLOW}⚠️  注意事項:${NC}"
echo -e "   - 本番(HTTPS)は自己署名証明書のため、ブラウザ警告が表示されます"
echo -e "   - ssl/*.pem は .gitignore で除外されています（コミット不要）"
echo -e "   - IPアドレスが変わった場合は ssl/ を削除して再実行してください"
echo ""
