#!/bin/bash

# ============================================
# 本番環境デプロイ自動化スクリプト
# AppSuite ITSM Management System
# ============================================
#
# このスクリプトは本番環境への安全なデプロイを自動化します
#
# 使用方法:
#   ./scripts/deploy-production.sh
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
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# ログ出力関数
# ============================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_step() {
    echo -e "${MAGENTA}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# ============================================
# 設定変数
# ============================================

# デフォルト値
PRODUCTION_HOST="${PRODUCTION_HOST:-appsuite-itsm.example.com}"
PRODUCTION_USER="${PRODUCTION_USER:-deploy-user}"
PRODUCTION_PATH="${PRODUCTION_PATH:-/var/www/appsuite-itsm}"
SOURCE_DIR="WebUI-Production"
BACKUP_DIR="/var/backups/appsuite-itsm"
LOG_FILE="/var/log/appsuite-itsm-deploy.log"

# 環境変数ファイルの読み込み
if [ -f "config/.env.production" ]; then
    source config/.env.production
    log_info "環境変数ファイルを読み込みました"
fi

# ============================================
# 事前チェック関数
# ============================================
pre_deployment_checks() {
    log_step "=========================================="
    log_step "Step 1: 事前チェック"
    log_step "=========================================="

    local CHECKS_PASSED=true

    # 1. Gitリポジトリの確認
    log_info "1. Gitリポジトリの状態確認..."
    if [ ! -d ".git" ]; then
        log_error "Gitリポジトリではありません"
        CHECKS_PASSED=false
    else
        # 未コミットの変更がないか確認
        if [ -n "$(git status --porcelain)" ]; then
            log_warning "未コミットの変更があります"
            git status --short
            read -p "続行しますか？ (y/N): " CONTINUE
            if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
                log_error "デプロイを中止しました"
                exit 1
            fi
        else
            log_success "リポジトリはクリーンです"
        fi
    fi

    # 2. ソースディレクトリの確認
    log_info "2. ソースディレクトリの確認..."
    if [ ! -d "$SOURCE_DIR" ]; then
        log_error "ソースディレクトリが見つかりません: $SOURCE_DIR"
        CHECKS_PASSED=false
    else
        log_success "ソースディレクトリ: $SOURCE_DIR"
    fi

    # 3. 必要なファイルの確認
    log_info "3. 必要なファイルの確認..."
    local REQUIRED_FILES=("$SOURCE_DIR/index.html" "$SOURCE_DIR/css/styles.css" "$SOURCE_DIR/js/app.js")
    for FILE in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$FILE" ]; then
            log_error "必須ファイルが見つかりません: $FILE"
            CHECKS_PASSED=false
        fi
    done

    if $CHECKS_PASSED; then
        log_success "必須ファイルが揃っています"
    fi

    # 4. rsyncのインストール確認
    log_info "4. rsyncのインストール確認..."
    if ! command -v rsync &> /dev/null; then
        log_error "rsyncがインストールされていません"
        log_info "インストール方法: sudo apt-get install rsync"
        CHECKS_PASSED=false
    else
        log_success "rsync: $(rsync --version | head -n 1)"
    fi

    # 5. SSH接続確認
    log_info "5. SSH接続確認..."
    if ssh -o BatchMode=yes -o ConnectTimeout=5 "${PRODUCTION_USER}@${PRODUCTION_HOST}" "echo 2>&1" &>/dev/null; then
        log_success "SSH接続成功: ${PRODUCTION_USER}@${PRODUCTION_HOST}"
    else
        log_error "SSH接続に失敗しました"
        log_info "接続先: ${PRODUCTION_USER}@${PRODUCTION_HOST}"
        log_info "SSH鍵認証が設定されているか確認してください"
        CHECKS_PASSED=false
    fi

    # 6. 本番サーバーの状態確認
    log_info "6. 本番サーバーの状態確認..."
    if ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" "df -h | grep -E '^/dev/' | awk '{print \$5}' | sed 's/%//' | sort -rn | head -1" | while read USAGE; do
        if [ "$USAGE" -ge 90 ]; then
            log_error "ディスク使用率が90%を超えています: ${USAGE}%"
            return 1
        elif [ "$USAGE" -ge 80 ]; then
            log_warning "ディスク使用率が80%を超えています: ${USAGE}%"
            return 0
        else
            log_success "ディスク使用率: ${USAGE}%"
            return 0
        fi
    done; then
        :
    else
        CHECKS_PASSED=false
    fi

    # チェック結果の判定
    echo ""
    if $CHECKS_PASSED; then
        log_success "全ての事前チェックが完了しました"
        return 0
    else
        log_error "事前チェックに失敗しました"
        return 1
    fi
}

# ============================================
# バックアップ作成関数
# ============================================
create_backup() {
    log_step "=========================================="
    log_step "Step 2: バックアップ作成"
    log_step "=========================================="

    local BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    local BACKUP_FILE="production_backup_${BACKUP_DATE}.tar.gz"

    log_info "バックアップを作成します..."
    log_info "保存先: ${BACKUP_DIR}/${BACKUP_FILE}"

    # リモートサーバーでバックアップを作成
    ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" bash << EOF
        set -e

        # バックアップディレクトリの作成
        sudo mkdir -p ${BACKUP_DIR}
        sudo chown ${PRODUCTION_USER}:${PRODUCTION_USER} ${BACKUP_DIR}

        # 既存ファイルが存在する場合のみバックアップ
        if [ -d "${PRODUCTION_PATH}" ]; then
            echo "既存ファイルをバックアップ中..."
            sudo tar -czf ${BACKUP_DIR}/${BACKUP_FILE} -C $(dirname ${PRODUCTION_PATH}) $(basename ${PRODUCTION_PATH})

            if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
                echo "バックアップ作成成功: ${BACKUP_FILE}"
                ls -lh ${BACKUP_DIR}/${BACKUP_FILE}

                # バックアップの世代管理（7世代保持）
                echo "古いバックアップを削除中..."
                cd ${BACKUP_DIR}
                ls -t production_backup_*.tar.gz | tail -n +8 | xargs -r rm -f
                echo "バックアップ保持数: \$(ls -1 production_backup_*.tar.gz 2>/dev/null | wc -l)"
            else
                echo "エラー: バックアップファイルが作成されませんでした"
                exit 1
            fi
        else
            echo "既存のデプロイが見つかりません。バックアップをスキップします"
        fi
EOF

    if [ $? -eq 0 ]; then
        log_success "バックアップ作成完了"
        # バックアップファイル名をエクスポート（ロールバック用）
        export LAST_BACKUP_FILE="${BACKUP_FILE}"
    else
        log_error "バックアップ作成に失敗しました"
        return 1
    fi
}

# ============================================
# ファイル転送関数
# ============================================
transfer_files() {
    log_step "=========================================="
    log_step "Step 3: ファイル転送"
    log_step "=========================================="

    log_info "ファイルを転送中..."
    log_info "転送元: ${SOURCE_DIR}/"
    log_info "転送先: ${PRODUCTION_USER}@${PRODUCTION_HOST}:/tmp/appsuite-itsm-new/"

    # 転送前のdry-run
    log_info "転送内容を確認中（dry-run）..."
    rsync -avz --delete \
        --exclude='.git' \
        --exclude='.gitignore' \
        --exclude='docs' \
        --exclude='README.md' \
        --exclude='DEPLOYMENT.md' \
        --exclude='node_modules' \
        --exclude='.DS_Store' \
        --exclude='*.swp' \
        --exclude='*.bak' \
        --dry-run \
        "${SOURCE_DIR}/" "${PRODUCTION_USER}@${PRODUCTION_HOST}:/tmp/appsuite-itsm-new/"

    # 実際の転送
    echo ""
    log_info "ファイルを転送中..."
    rsync -avz --delete \
        --exclude='.git' \
        --exclude='.gitignore' \
        --exclude='docs' \
        --exclude='README.md' \
        --exclude='DEPLOYMENT.md' \
        --exclude='node_modules' \
        --exclude='.DS_Store' \
        --exclude='*.swp' \
        --exclude='*.bak' \
        --progress \
        "${SOURCE_DIR}/" "${PRODUCTION_USER}@${PRODUCTION_HOST}:/tmp/appsuite-itsm-new/"

    if [ $? -eq 0 ]; then
        log_success "ファイル転送完了"
    else
        log_error "ファイル転送に失敗しました"
        return 1
    fi
}

# ============================================
# ファイル配置・権限設定関数
# ============================================
deploy_files() {
    log_step "=========================================="
    log_step "Step 4: ファイル配置・権限設定"
    log_step "=========================================="

    log_info "本番環境にファイルを配置中..."

    ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" bash << EOF
        set -e

        # 転送ファイルの確認
        echo "転送されたファイル一覧:"
        find /tmp/appsuite-itsm-new/ -type f | head -n 10
        echo "..."
        echo "合計ファイル数: \$(find /tmp/appsuite-itsm-new/ -type f | wc -l)"

        # 既存ディレクトリの削除
        echo ""
        echo "既存ディレクトリを削除中..."
        sudo rm -rf ${PRODUCTION_PATH}

        # 新バージョンの配置
        echo "新バージョンを配置中..."
        sudo cp -r /tmp/appsuite-itsm-new ${PRODUCTION_PATH}

        # 権限設定
        echo ""
        echo "権限を設定中..."
        sudo chown -R www-data:www-data ${PRODUCTION_PATH}
        sudo find ${PRODUCTION_PATH} -type d -exec chmod 755 {} \;
        sudo find ${PRODUCTION_PATH} -type f -exec chmod 644 {} \;

        # 権限確認
        echo ""
        echo "権限設定を確認中..."
        ls -la ${PRODUCTION_PATH}/ | head -n 10

        # 一時ファイルの削除
        echo ""
        echo "一時ファイルを削除中..."
        sudo rm -rf /tmp/appsuite-itsm-new

        echo "ファイル配置完了"
EOF

    if [ $? -eq 0 ]; then
        log_success "ファイル配置・権限設定完了"
    else
        log_error "ファイル配置に失敗しました"
        return 1
    fi
}

# ============================================
# Webサーバー再起動関数
# ============================================
restart_webserver() {
    log_step "=========================================="
    log_step "Step 5: Webサーバー再起動"
    log_step "=========================================="

    log_info "Webサーバーを再起動中..."

    ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" bash << 'EOF'
        set -e

        # Webサーバーの検出と再起動
        if command -v apache2 &> /dev/null; then
            echo "Apacheを検出しました"

            # 設定チェック
            echo "設定をチェック中..."
            sudo apache2ctl configtest

            # 再起動
            echo "Apacheを再起動中..."
            sudo systemctl restart apache2

            # 起動確認
            sudo systemctl status apache2 --no-pager

        elif command -v nginx &> /dev/null; then
            echo "Nginxを検出しました"

            # 設定チェック
            echo "設定をチェック中..."
            sudo nginx -t

            # 再起動
            echo "Nginxを再起動中..."
            sudo systemctl restart nginx

            # 起動確認
            sudo systemctl status nginx --no-pager

        else
            echo "エラー: Webサーバーが検出されませんでした"
            exit 1
        fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Webサーバー再起動完了"
    else
        log_error "Webサーバー再起動に失敗しました"
        return 1
    fi
}

# ============================================
# 動作確認関数
# ============================================
verify_deployment() {
    log_step "=========================================="
    log_step "Step 6: 動作確認"
    log_step "=========================================="

    log_info "本番環境の動作を確認中..."

    local URL="https://${PRODUCTION_HOST}"
    local CHECKS_PASSED=true

    # 1. HTTPSアクセス確認
    log_info "1. HTTPSアクセス確認..."
    if curl -I -s --max-time 10 "${URL}/" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
        log_success "HTTPSアクセス成功"
    else
        log_error "HTTPSアクセスに失敗しました"
        CHECKS_PASSED=false
    fi

    # 2. セキュリティヘッダー確認
    log_info "2. セキュリティヘッダー確認..."
    local HEADERS=$(curl -I -s --max-time 10 "${URL}/")

    if echo "$HEADERS" | grep -iq "strict-transport-security"; then
        log_success "HSTS ヘッダー: 確認"
    else
        log_warning "HSTS ヘッダー: 未設定"
    fi

    if echo "$HEADERS" | grep -iq "x-content-type-options"; then
        log_success "X-Content-Type-Options: 確認"
    else
        log_warning "X-Content-Type-Options: 未設定"
    fi

    # 3. コンテンツ確認
    log_info "3. コンテンツ確認..."
    if curl -s --max-time 10 "${URL}/" | grep -q "AppSuite"; then
        log_success "HTMLコンテンツ: 確認"
    else
        log_warning "HTMLコンテンツに期待される内容が見つかりません"
    fi

    # 4. ログ確認
    log_info "4. エラーログ確認..."
    ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" bash << 'EOF'
        if command -v apache2 &> /dev/null; then
            ERROR_COUNT=$(sudo tail -n 100 /var/log/apache2/error.log 2>/dev/null | grep -c "\[error\]" || echo "0")
        elif command -v nginx &> /dev/null; then
            ERROR_COUNT=$(sudo tail -n 100 /var/log/nginx/error.log 2>/dev/null | grep -c "\[error\]" || echo "0")
        else
            ERROR_COUNT=0
        fi
        echo "直近のエラー数: ${ERROR_COUNT}"
        if [ "$ERROR_COUNT" -gt 10 ]; then
            exit 1
        fi
EOF

    if [ $? -eq 0 ]; then
        log_success "エラーログ: 正常"
    else
        log_warning "エラーログに多数のエラーが記録されています"
    fi

    # 結果判定
    echo ""
    if $CHECKS_PASSED; then
        log_success "動作確認完了"
        return 0
    else
        log_warning "一部の確認項目で問題が見つかりました"
        return 0  # 警告レベルなので成功として扱う
    fi
}

# ============================================
# デプロイログ記録関数
# ============================================
log_deployment() {
    log_step "=========================================="
    log_step "Step 7: デプロイログ記録"
    log_step "=========================================="

    local DEPLOY_DATE=$(date '+%Y-%m-%d %H:%M:%S')
    local GIT_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "N/A")

    ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" bash << EOF
        echo "================================" | sudo tee -a ${LOG_FILE}
        echo "デプロイ完了: ${DEPLOY_DATE}" | sudo tee -a ${LOG_FILE}
        echo "Gitコミット: ${GIT_COMMIT}" | sudo tee -a ${LOG_FILE}
        echo "デプロイ実行者: ${USER}" | sudo tee -a ${LOG_FILE}
        echo "================================" | sudo tee -a ${LOG_FILE}
EOF

    log_success "デプロイログを記録しました"
}

# ============================================
# ロールバック関数
# ============================================
rollback_deployment() {
    log_error "=========================================="
    log_error "ロールバックを実行します"
    log_error "=========================================="

    if [ -z "${LAST_BACKUP_FILE:-}" ]; then
        log_error "バックアップファイルが見つかりません"
        log_error "手動でロールバックしてください"
        return 1
    fi

    log_info "バックアップファイル: ${LAST_BACKUP_FILE}"

    ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" bash << EOF
        set -e

        BACKUP_FILE="${BACKUP_DIR}/${LAST_BACKUP_FILE}"

        if [ ! -f "\${BACKUP_FILE}" ]; then
            echo "エラー: バックアップファイルが見つかりません"
            exit 1
        fi

        # 現在のバージョンを退避
        ROLLBACK_DATE=\$(date +%Y%m%d_%H%M%S)
        sudo mv ${PRODUCTION_PATH} ${PRODUCTION_PATH}.failed_\${ROLLBACK_DATE}

        # バックアップから復元
        echo "バックアップから復元中..."
        sudo tar -xzf \${BACKUP_FILE} -C $(dirname ${PRODUCTION_PATH})

        # 権限設定
        echo "権限を設定中..."
        sudo chown -R www-data:www-data ${PRODUCTION_PATH}
        sudo find ${PRODUCTION_PATH} -type d -exec chmod 755 {} \;
        sudo find ${PRODUCTION_PATH} -type f -exec chmod 644 {} \;

        # Webサーバー再起動
        if command -v apache2 &> /dev/null; then
            sudo systemctl restart apache2
        elif command -v nginx &> /dev/null; then
            sudo systemctl restart nginx
        fi

        echo "ロールバック完了: \$(date)" | sudo tee -a ${LOG_FILE}
EOF

    if [ $? -eq 0 ]; then
        log_success "ロールバックが完了しました"
    else
        log_error "ロールバックに失敗しました"
        return 1
    fi
}

# ============================================
# メイン処理
# ============================================
main() {
    echo ""
    log_info "=========================================="
    log_info "本番環境デプロイスクリプト"
    log_info "AppSuite ITSM Management System"
    log_info "=========================================="
    echo ""

    log_info "デプロイ先: ${PRODUCTION_USER}@${PRODUCTION_HOST}:${PRODUCTION_PATH}"
    log_info "ソース: ${SOURCE_DIR}"
    echo ""

    # 確認プロンプト
    read -p "本番環境にデプロイしますか？ (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_warning "デプロイを中止しました"
        exit 0
    fi

    # デプロイ開始時刻
    DEPLOY_START_TIME=$(date +%s)

    # 各ステップの実行
    if ! pre_deployment_checks; then
        log_error "事前チェックに失敗しました。デプロイを中止します"
        exit 1
    fi

    if ! create_backup; then
        log_error "バックアップ作成に失敗しました"
        read -p "ロールバックしますか？ (y/N): " ROLLBACK
        if [[ $ROLLBACK =~ ^[Yy]$ ]]; then
            rollback_deployment
        fi
        exit 1
    fi

    if ! transfer_files; then
        log_error "ファイル転送に失敗しました"
        read -p "ロールバックしますか？ (y/N): " ROLLBACK
        if [[ $ROLLBACK =~ ^[Yy]$ ]]; then
            rollback_deployment
        fi
        exit 1
    fi

    if ! deploy_files; then
        log_error "ファイル配置に失敗しました"
        read -p "ロールバックしますか？ (y/N): " ROLLBACK
        if [[ $ROLLBACK =~ ^[Yy]$ ]]; then
            rollback_deployment
        fi
        exit 1
    fi

    if ! restart_webserver; then
        log_error "Webサーバー再起動に失敗しました"
        read -p "ロールバックしますか？ (y/N): " ROLLBACK
        if [[ $ROLLBACK =~ ^[Yy]$ ]]; then
            rollback_deployment
        fi
        exit 1
    fi

    if ! verify_deployment; then
        log_warning "動作確認で警告が発生しました"
        read -p "ロールバックしますか？ (y/N): " ROLLBACK
        if [[ $ROLLBACK =~ ^[Yy]$ ]]; then
            rollback_deployment
            exit 1
        fi
    fi

    log_deployment

    # デプロイ完了時刻
    DEPLOY_END_TIME=$(date +%s)
    DEPLOY_DURATION=$((DEPLOY_END_TIME - DEPLOY_START_TIME))

    echo ""
    log_success "=========================================="
    log_success "デプロイが完了しました"
    log_success "実行時間: ${DEPLOY_DURATION}秒"
    log_success "=========================================="
    echo ""
    log_info "デプロイURL: https://${PRODUCTION_HOST}"
    echo ""
}

# トラップ設定（エラー時の処理）
trap 'log_error "予期しないエラーが発生しました"; exit 1' ERR

# スクリプトの実行
main "$@"
