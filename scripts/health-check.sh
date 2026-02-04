#!/bin/bash

# ============================================
# ヘルスチェックスクリプト
# AppSuite ITSM Management System
# ============================================
#
# このスクリプトは本番環境の健全性を監視します
#
# 使用方法:
#   ./scripts/health-check.sh [options]
#
# オプション:
#   -u, --url URL       チェック対象のURL（デフォルト: https://appsuite-itsm.example.com）
#   -t, --timeout SEC   タイムアウト秒数（デフォルト: 10）
#   -v, --verbose       詳細出力
#   -h, --help          ヘルプ表示
#
# 終了コード:
#   0: 全てのチェック成功
#   1: 1つ以上のチェック失敗
#
# ============================================

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
# デフォルト設定
# ============================================
URL="${URL:-https://appsuite-itsm.example.com}"
TIMEOUT=10
VERBOSE=false
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# ============================================
# ログ出力関数
# ============================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

log_verbose() {
    if $VERBOSE; then
        echo -e "    ${1}"
    fi
}

# ============================================
# 使用方法の表示
# ============================================
show_usage() {
    cat << EOF
使用方法: $0 [OPTIONS]

オプション:
  -u, --url URL       チェック対象のURL（デフォルト: ${URL}）
  -t, --timeout SEC   タイムアウト秒数（デフォルト: ${TIMEOUT}）
  -v, --verbose       詳細出力を表示
  -h, --help          このヘルプを表示

例:
  $0
  $0 -u https://appsuite-itsm.example.com -v
  $0 --url https://appsuite-itsm.example.com --timeout 15

終了コード:
  0: 全てのチェック成功
  1: 1つ以上のチェック失敗

EOF
}

# ============================================
# コマンドライン引数の解析
# ============================================
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--url)
                URL="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                echo "不正なオプション: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# ============================================
# 1. HTTP/HTTPSアクセスチェック
# ============================================
check_http_access() {
    log_info "1. HTTP/HTTPSアクセスチェック..."

    # HTTPSアクセス確認
    local RESPONSE=$(curl -I -s --max-time ${TIMEOUT} "${URL}/" 2>&1)
    local STATUS_CODE=$(echo "$RESPONSE" | grep -oP "HTTP/[0-9.]+ \K[0-9]+" | head -1)

    if [ -n "$STATUS_CODE" ] && [ "$STATUS_CODE" -eq 200 ]; then
        log_success "HTTPSアクセス成功 (ステータスコード: ${STATUS_CODE})"
        log_verbose "URL: ${URL}"
    else
        log_error "HTTPSアクセス失敗 (ステータスコード: ${STATUS_CODE:-N/A})"
        log_verbose "レスポンス: ${RESPONSE}"
    fi

    # HTTP → HTTPSリダイレクト確認
    local HTTP_URL="${URL/https:/http:}"
    local HTTP_RESPONSE=$(curl -I -s --max-time ${TIMEOUT} "${HTTP_URL}/" 2>&1)
    local HTTP_STATUS=$(echo "$HTTP_RESPONSE" | grep -oP "HTTP/[0-9.]+ \K[0-9]+" | head -1)

    if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        if echo "$HTTP_RESPONSE" | grep -iq "location:.*https"; then
            log_success "HTTP → HTTPSリダイレクト: 正常"
        else
            log_warning "HTTP → HTTPSリダイレクト: 設定されていません"
        fi
    else
        log_warning "HTTP → HTTPSリダイレクト: 未設定"
    fi
}

# ============================================
# 2. レスポンスタイム測定
# ============================================
check_response_time() {
    log_info "2. レスポンスタイム測定..."

    local RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' --max-time ${TIMEOUT} "${URL}/" 2>/dev/null || echo "timeout")

    if [ "$RESPONSE_TIME" = "timeout" ]; then
        log_error "レスポンスタイムアウト (${TIMEOUT}秒超過)"
    else
        local RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
        log_verbose "レスポンスタイム: ${RESPONSE_MS}ms"

        if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
            log_success "レスポンスタイム: ${RESPONSE_MS}ms (高速)"
        elif (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
            log_success "レスポンスタイム: ${RESPONSE_MS}ms (正常)"
        elif (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
            log_warning "レスポンスタイム: ${RESPONSE_MS}ms (やや遅い)"
        else
            log_error "レスポンスタイム: ${RESPONSE_MS}ms (遅い)"
        fi
    fi
}

# ============================================
# 3. SSL証明書の確認
# ============================================
check_ssl_certificate() {
    log_info "3. SSL証明書の確認..."

    # SSL証明書情報の取得
    local DOMAIN=$(echo "$URL" | sed -e 's|^https://||' -e 's|/.*||')
    local CERT_INFO=$(echo | openssl s_client -servername "${DOMAIN}" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

    if [ -n "$CERT_INFO" ]; then
        # 有効期限の取得
        local NOT_AFTER=$(echo "$CERT_INFO" | grep "notAfter=" | cut -d= -f2)
        local EXPIRY_DATE=$(date -d "$NOT_AFTER" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$NOT_AFTER" +%s 2>/dev/null)
        local CURRENT_DATE=$(date +%s)
        local DAYS_UNTIL_EXPIRY=$(( (EXPIRY_DATE - CURRENT_DATE) / 86400 ))

        log_verbose "有効期限: ${NOT_AFTER}"
        log_verbose "残り日数: ${DAYS_UNTIL_EXPIRY}日"

        if [ $DAYS_UNTIL_EXPIRY -lt 0 ]; then
            log_error "SSL証明書: 期限切れ (${DAYS_UNTIL_EXPIRY}日前に失効)"
        elif [ $DAYS_UNTIL_EXPIRY -lt 7 ]; then
            log_error "SSL証明書: まもなく期限切れ (残り${DAYS_UNTIL_EXPIRY}日)"
        elif [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
            log_warning "SSL証明書: 更新推奨 (残り${DAYS_UNTIL_EXPIRY}日)"
        else
            log_success "SSL証明書: 有効 (残り${DAYS_UNTIL_EXPIRY}日)"
        fi

        # SSL プロトコルバージョン確認
        local SSL_PROTOCOL=$(echo | openssl s_client -connect "${DOMAIN}:443" 2>/dev/null | grep "Protocol" | awk '{print $3}')
        log_verbose "SSLプロトコル: ${SSL_PROTOCOL}"

    else
        log_error "SSL証明書: 取得できませんでした"
    fi
}

# ============================================
# 4. セキュリティヘッダーの確認
# ============================================
check_security_headers() {
    log_info "4. セキュリティヘッダーの確認..."

    local HEADERS=$(curl -I -s --max-time ${TIMEOUT} "${URL}/" 2>/dev/null)

    # 必須ヘッダーのチェック
    local REQUIRED_HEADERS=(
        "Strict-Transport-Security"
        "X-Content-Type-Options"
        "X-Frame-Options"
        "Content-Security-Policy"
    )

    local MISSING_HEADERS=()

    for HEADER in "${REQUIRED_HEADERS[@]}"; do
        if echo "$HEADERS" | grep -iq "$HEADER"; then
            log_verbose "  ✓ ${HEADER}: 設定済み"
        else
            MISSING_HEADERS+=("$HEADER")
        fi
    done

    if [ ${#MISSING_HEADERS[@]} -eq 0 ]; then
        log_success "セキュリティヘッダー: 全て設定済み"
    else
        log_warning "セキュリティヘッダー: 一部未設定 (${MISSING_HEADERS[*]})"
    fi
}

# ============================================
# 5. コンテンツの確認
# ============================================
check_content() {
    log_info "5. コンテンツの確認..."

    local CONTENT=$(curl -s --max-time ${TIMEOUT} "${URL}/" 2>/dev/null)

    # 期待されるキーワードの確認
    if echo "$CONTENT" | grep -q "AppSuite"; then
        log_success "コンテンツ: 正常（AppSuiteキーワード検出）"
    else
        log_warning "コンテンツ: 期待されるキーワードが見つかりません"
    fi

    # HTMLの構造確認
    if echo "$CONTENT" | grep -q "<!DOCTYPE html>"; then
        log_verbose "  ✓ HTML DOCTYPE宣言: 正常"
    else
        log_verbose "  ⚠ HTML DOCTYPE宣言: 見つかりません"
    fi

    # JavaScriptの読み込み確認
    if echo "$CONTENT" | grep -q "<script.*src=.*app.js"; then
        log_verbose "  ✓ JavaScriptファイル: 参照あり"
    else
        log_verbose "  ⚠ JavaScriptファイル: 参照なし"
    fi
}

# ============================================
# 6. サーバーリソースの確認（ローカル環境の場合）
# ============================================
check_server_resources() {
    # ローカル環境でのみ実行
    if [ "$URL" = "http://localhost" ] || [ "$URL" = "https://localhost" ]; then
        log_info "6. サーバーリソースの確認..."

        # CPU使用率
        local CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
        log_verbose "CPU使用率: ${CPU_USAGE}%"

        if (( $(echo "$CPU_USAGE < 80" | bc -l) )); then
            log_success "CPU使用率: ${CPU_USAGE}% (正常)"
        else
            log_warning "CPU使用率: ${CPU_USAGE}% (高負荷)"
        fi

        # メモリ使用率
        local MEM_USAGE=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
        log_verbose "メモリ使用率: ${MEM_USAGE}%"

        if (( $(echo "$MEM_USAGE < 90" | bc -l) )); then
            log_success "メモリ使用率: ${MEM_USAGE}% (正常)"
        else
            log_warning "メモリ使用率: ${MEM_USAGE}% (高負荷)"
        fi

        # ディスク使用率
        local DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
        log_verbose "ディスク使用率: ${DISK_USAGE}%"

        if [ "$DISK_USAGE" -lt 80 ]; then
            log_success "ディスク使用率: ${DISK_USAGE}% (正常)"
        elif [ "$DISK_USAGE" -lt 90 ]; then
            log_warning "ディスク使用率: ${DISK_USAGE}% (要注意)"
        else
            log_error "ディスク使用率: ${DISK_USAGE}% (危険)"
        fi
    fi
}

# ============================================
# 7. 全体サマリーの表示
# ============================================
show_summary() {
    echo ""
    echo "=========================================="
    echo "ヘルスチェック結果サマリー"
    echo "=========================================="
    echo -e "${GREEN}成功:${NC} ${CHECKS_PASSED} 件"
    echo -e "${YELLOW}警告:${NC} ${CHECKS_WARNING} 件"
    echo -e "${RED}失敗:${NC} ${CHECKS_FAILED} 件"
    echo "=========================================="
    echo ""

    if [ $CHECKS_FAILED -eq 0 ]; then
        if [ $CHECKS_WARNING -eq 0 ]; then
            echo -e "${GREEN}✓ システムは正常に動作しています${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ システムは動作していますが、警告があります${NC}"
            return 0
        fi
    else
        echo -e "${RED}✗ システムに問題があります${NC}"
        return 1
    fi
}

# ============================================
# メイン処理
# ============================================
main() {
    echo ""
    echo "=========================================="
    echo "ヘルスチェックスクリプト"
    echo "AppSuite ITSM Management System"
    echo "=========================================="
    echo ""
    echo "チェック対象: ${URL}"
    echo "タイムアウト: ${TIMEOUT}秒"
    echo "実行日時: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # 各チェックの実行
    check_http_access
    check_response_time
    check_ssl_certificate
    check_security_headers
    check_content
    check_server_resources

    # サマリー表示
    show_summary
}

# コマンドライン引数の解析
parse_arguments "$@"

# スクリプトの実行
main

# 終了コードの設定
if [ $CHECKS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
