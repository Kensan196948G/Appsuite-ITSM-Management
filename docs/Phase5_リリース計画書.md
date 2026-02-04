# Phase 5 リリース計画書

**文書番号**: REL-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年2月4日
**対象フェーズ**: Phase 5（リリースフェーズ）
**期間**: 2週間（Week 25-26）

---

## 目次

1. [概要](#1-概要)
2. [リリーススケジュール](#2-リリーススケジュール)
3. [本番環境仕様](#3-本番環境仕様)
4. [デプロイ手順](#4-デプロイ手順)
5. [リスク管理](#5-リスク管理)
6. [リリース後の運用](#6-リリース後の運用)
7. [体制と連絡先](#7-体制と連絡先)
8. [承認](#8-承認)

---

## 1. 概要

### 1.1 目的

Phase 4（テストフェーズ）完了後、AppSuite管理運用システムを本番環境に安全かつ確実にデプロイし、運用を開始する。

### 1.2 適用範囲

- ステージング環境でのリハーサルデプロイ
- 本番環境への正式デプロイ
- リリース後の初期運用（1週間）

### 1.3 前提条件

| 項目 | 状態 |
|------|------|
| Phase 4テスト完了 | ✓ 必須 |
| 重大バグゼロ | ✓ 必須 |
| 高優先度バグゼロ | ✓ 必須 |
| UAT合格 | ✓ 必須 |
| 運用マニュアル整備 | ✓ 必須 |
| 本番環境準備完了 | ✓ 必須 |

### 1.4 成功基準

| 項目 | 基準 |
|------|------|
| デプロイ成功率 | 100% |
| 初期障害発生率 | 0件（重大・高優先度） |
| 初期表示速度 | 3秒以内 |
| ユーザーログイン成功率 | 100% |
| リリース後24時間の稼働率 | 99.9%以上 |

---

## 2. リリーススケジュール

### 2.1 全体スケジュール

```
Phase 5: リリースフェーズ（2週間）
├── Week 25: リハーサル・準備
│   ├── Day 1-2: ステージング環境デプロイ・検証
│   ├── Day 3: 最終確認テスト
│   ├── Day 4: 運用者トレーニング
│   └── Day 5: リリース判定会議
│
└── Week 26: 本番リリース・初期運用
    ├── Day 1: 本番デプロイ（月曜日推奨）
    ├── Day 2-3: 初期監視・サポート
    ├── Day 4-5: 安定運用移行
    └── Day 5: プロジェクト完了報告
```

### 2.2 詳細スケジュール

#### Week 25（リハーサル週）

| 日 | 時間 | タスク | 担当 | 成果物 |
|----|------|--------|------|--------|
| Day 1 | 09:00-10:00 | キックオフMTG | 全員 | 議事録 |
| Day 1 | 10:00-12:00 | ステージング環境構築 | インフラ | ステージング環境 |
| Day 1 | 13:00-17:00 | ステージングデプロイ実行 | BE開発者 | デプロイ完了報告 |
| Day 2 | 09:00-12:00 | スモークテスト | QA | テスト結果 |
| Day 2 | 13:00-17:00 | 統合動作確認 | QA/開発者 | 確認結果 |
| Day 3 | 09:00-12:00 | 最終確認テスト | QA | テスト報告書 |
| Day 3 | 13:00-17:00 | ドキュメント最終確認 | ライター | 最終版ドキュメント |
| Day 4 | 09:00-12:00 | 運用者トレーニング（座学） | PM/アーキテクト | トレーニング資料 |
| Day 4 | 13:00-17:00 | 運用者トレーニング（実習） | PM/アーキテクト | 実習完了証 |
| Day 5 | 09:00-11:00 | リリース判定会議 | 全員+承認者 | リリース判定書 |
| Day 5 | 13:00-17:00 | 本番デプロイ準備 | BE開発者 | デプロイパッケージ |

#### Week 26（本番リリース週）

| 日 | 時間 | タスク | 担当 | 成果物 |
|----|------|--------|------|--------|
| Day 1 (月) | 08:00-08:30 | リリース前最終確認 | 全員 | 確認チェックリスト |
| Day 1 | 09:00-10:00 | 本番デプロイ開始 | BE開発者 | - |
| Day 1 | 10:00-11:00 | 本番デプロイ検証 | QA | 検証結果 |
| Day 1 | 11:00-12:00 | リリース完了報告 | PM | リリース報告書 |
| Day 1 | 13:00-17:00 | 初期監視（集中） | 全員 | 監視ログ |
| Day 2-3 | 終日 | 通常監視・サポート | 全員 | サポート記録 |
| Day 4-5 | 終日 | 安定運用監視 | 運用チーム | 運用報告 |
| Day 5 | 16:00-17:00 | プロジェクト完了報告会 | 全員 | 完了報告書 |

### 2.3 マイルストーン

| マイルストーン | 予定日時 | 判定基準 |
|---------------|---------|---------|
| **M5-1**: ステージングデプロイ完了 | Week 25 Day 1 17:00 | 全機能が動作確認済み |
| **M5-2**: 最終確認テスト合格 | Week 25 Day 3 17:00 | 重大バグゼロ |
| **M5-3**: リリース判定承認 | Week 25 Day 5 11:00 | 承認者の承認取得 |
| **M5-4**: 本番デプロイ完了 | Week 26 Day 1 11:00 | デプロイ・検証完了 |
| **M5-5**: プロジェクト完了 | Week 26 Day 5 17:00 | 完了報告書提出 |

### 2.4 ロールバック判断基準

以下のいずれかに該当する場合、ロールバックを検討：

| 基準 | 判断者 |
|------|--------|
| デプロイ中に重大エラーが発生 | PM + インフラ担当 |
| 本番環境での起動不可 | PM |
| セキュリティ脆弱性の発見 | PM + セキュリティ担当 |
| データ消失・破損の発生 | PM（即座にロールバック） |
| 主要機能（ダッシュボード、ユーザー管理）が動作不可 | PM |
| リリース後1時間で3件以上の不具合報告 | PM |

**ロールバック判断時間**: デプロイ後1時間以内に判断

---

## 3. 本番環境仕様

### 3.1 サーバー構成

#### 3.1.1 推奨構成（Webサーバー方式）

| 項目 | 仕様 |
|------|------|
| **Webサーバー** | Apache 2.4.58+ / Nginx 1.24+ |
| **OS** | Ubuntu 22.04 LTS / CentOS 8+ / Windows Server 2022 |
| **CPU** | 2コア以上 |
| **メモリ** | 4GB以上 |
| **ストレージ** | 20GB以上（SSD推奨） |
| **ネットワーク** | 100Mbps以上 |

#### 3.1.2 ディレクトリ構成

```
【Apache】
/var/www/html/appsuite-itsm/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   ├── modules.js
│   ├── security.js
│   └── app.js
└── .htaccess

【Nginx】
/usr/share/nginx/html/appsuite-itsm/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── api.js
    ├── modules.js
    ├── security.js
    └── app.js
```

### 3.2 HTTPS設定

#### 3.2.1 必須要件

| 項目 | 要件 |
|------|------|
| **プロトコル** | TLS 1.2 以上（TLS 1.3推奨） |
| **証明書** | 信頼できるCA発行の有効な証明書 |
| **証明書有効期限** | 最低3ヶ月以上の残存期間 |
| **暗号化スイート** | 強固な暗号化スイート（AES256-GCM推奨） |

#### 3.2.2 Apache HTTPS設定例

```apache
<VirtualHost *:443>
    ServerName appsuite-itsm.example.com
    DocumentRoot /var/www/html/appsuite-itsm

    SSLEngine on
    SSLProtocol -all +TLSv1.2 +TLSv1.3
    SSLCipherSuite HIGH:!aNULL:!MD5:!RC4
    SSLCertificateFile /etc/ssl/certs/appsuite-itsm.crt
    SSLCertificateKeyFile /etc/ssl/private/appsuite-itsm.key
    SSLCertificateChainFile /etc/ssl/certs/chain.crt

    # セキュリティヘッダー
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Content-Security-Policy "default-src 'self' https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data:;"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"

    <Directory /var/www/html/appsuite-itsm>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/appsuite-itsm-error.log
    CustomLog ${APACHE_LOG_DIR}/appsuite-itsm-access.log combined
</VirtualHost>

# HTTP → HTTPS リダイレクト
<VirtualHost *:80>
    ServerName appsuite-itsm.example.com
    Redirect permanent / https://appsuite-itsm.example.com/
</VirtualHost>
```

#### 3.2.3 Nginx HTTPS設定例

```nginx
server {
    listen 443 ssl http2;
    server_name appsuite-itsm.example.com;
    root /usr/share/nginx/html/appsuite-itsm;
    index index.html;

    # SSL設定
    ssl_certificate /etc/nginx/ssl/appsuite-itsm.crt;
    ssl_certificate_key /etc/nginx/ssl/appsuite-itsm.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5:!RC4;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # セキュリティヘッダー
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self' https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data:;" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # キャッシュ設定
    location ~* \.(css|js)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # アクセスログ
    access_log /var/log/nginx/appsuite-itsm-access.log;
    error_log /var/log/nginx/appsuite-itsm-error.log;
}

# HTTP → HTTPS リダイレクト
server {
    listen 80;
    server_name appsuite-itsm.example.com;
    return 301 https://$server_name$request_uri;
}
```

### 3.3 セキュリティヘッダー詳細

| ヘッダー | 設定値 | 目的 |
|---------|--------|------|
| **Strict-Transport-Security (HSTS)** | `max-age=31536000; includeSubDomains` | HTTPS強制、中間者攻撃防止 |
| **X-Content-Type-Options** | `nosniff` | MIMEタイプスニッフィング防止 |
| **X-Frame-Options** | `SAMEORIGIN` | クリックジャッキング防止 |
| **X-XSS-Protection** | `1; mode=block` | XSS攻撃防止（旧ブラウザ対応） |
| **Content-Security-Policy** | `default-src 'self'...` | XSS・インジェクション攻撃防止 |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | リファラー情報の制限 |
| **Permissions-Policy** | `geolocation=(), microphone=()...` | 不要なブラウザAPI制限 |

### 3.4 バックアップスケジュール

| バックアップ種別 | 頻度 | 保持期間 | 実施時刻 |
|----------------|------|---------|---------|
| **自動バックアップ** | 毎日 | 7世代 | 毎日 2:00 AM |
| **週次バックアップ** | 週1回 | 4週間（4世代） | 毎週日曜 3:00 AM |
| **月次バックアップ** | 月1回 | 12ヶ月（12世代） | 毎月1日 4:00 AM |

**バックアップ対象**:
- ユーザーデータ（localStorage）
- システム設定
- 監査ログ

**バックアップ方法**:
- システム設定画面からJSONエクスポート
- 外部ストレージへの自動転送（オプション）

### 3.5 監視・アラート設定

#### 3.5.1 監視項目

| 項目 | 監視内容 | 閾値 | アラート通知先 |
|------|---------|------|--------------|
| **サーバー稼働** | HTTP/HTTPS応答 | 5分間無応答 | 運用チーム（即時） |
| **CPU使用率** | サーバーCPU | 80%超過5分継続 | インフラ担当 |
| **メモリ使用率** | サーバーメモリ | 90%超過 | インフラ担当 |
| **ディスク使用率** | ストレージ容量 | 85%超過 | インフラ担当 |
| **SSL証明書** | 有効期限 | 残30日以下 | インフラ担当 |
| **エラーログ** | アプリケーションエラー | 10件/時間 | 開発チーム |
| **アクセス数** | 異常アクセス | 平常時の3倍 | セキュリティ担当 |

#### 3.5.2 監視ツール（推奨）

- Nagios / Zabbix（サーバー監視）
- UptimeRobot（外形監視）
- Google Analytics（アクセス解析）
- 社内監視ツール

---

## 4. デプロイ手順

### 4.1 ステージングデプロイ手順

#### 4.1.1 事前準備

```bash
# 1. ステージングサーバーへSSH接続
ssh user@staging-server

# 2. 現在の状態確認
sudo systemctl status apache2  # または nginx

# 3. バックアップディレクトリ作成
sudo mkdir -p /var/backups/appsuite-itsm
```

#### 4.1.2 デプロイ実行

```bash
# 1. ソースコードをステージングサーバーに転送
cd /path/to/Appsuite-ITSM-Management
rsync -avz --exclude='.git' --exclude='docs' \
    WebUI-Production/ user@staging-server:/tmp/appsuite-itsm/

# 2. ステージングサーバーで作業
ssh user@staging-server

# 3. 既存ファイルのバックアップ（存在する場合）
sudo cp -r /var/www/html/appsuite-itsm \
    /var/backups/appsuite-itsm/backup_$(date +%Y%m%d_%H%M%S)

# 4. ファイルの配置
sudo rm -rf /var/www/html/appsuite-itsm
sudo cp -r /tmp/appsuite-itsm /var/www/html/appsuite-itsm

# 5. 権限設定
sudo chown -R www-data:www-data /var/www/html/appsuite-itsm
sudo chmod -R 755 /var/www/html/appsuite-itsm
sudo chmod 644 /var/www/html/appsuite-itsm/index.html

# 6. Webサーバー設定確認
sudo apache2ctl configtest  # Apache の場合
sudo nginx -t                # Nginx の場合

# 7. Webサーバー再起動
sudo systemctl restart apache2  # Apache
sudo systemctl restart nginx    # Nginx

# 8. デプロイ確認
curl -I https://staging.example.com/appsuite-itsm/
```

#### 4.1.3 動作確認チェックリスト

- [ ] HTTPSでアクセス可能
- [ ] ダッシュボード画面が表示される
- [ ] セキュリティヘッダーが正しく設定されている
- [ ] すべてのリソース（CSS/JS）が読み込まれる
- [ ] コンソールエラーがない
- [ ] ユーザー管理機能が動作する
- [ ] アプリ管理機能が動作する
- [ ] インシデント管理機能が動作する
- [ ] 変更管理機能が動作する
- [ ] 監査ログ機能が動作する
- [ ] システム設定機能が動作する
- [ ] バックアップ/リストアが動作する

### 4.2 本番デプロイ手順

#### 4.2.1 デプロイ前チェックリスト

**実施日**: Week 26 Day 1（月曜日）08:00-08:30

| No. | 確認項目 | 確認者 | 状態 |
|-----|---------|--------|------|
| 1 | ステージング環境で全機能動作確認済み | QA | □ |
| 2 | リリース判定会議で承認取得済み | PM | □ |
| 3 | 本番サーバーへのアクセス権限確認 | インフラ | □ |
| 4 | デプロイパッケージの最終確認 | BE開発者 | □ |
| 5 | バックアップ取得完了 | インフラ | □ |
| 6 | ロールバック手順の確認 | 全員 | □ |
| 7 | 関係者への事前通知完了 | PM | □ |
| 8 | サポート体制の確認 | 全員 | □ |
| 9 | SSL証明書の有効期限確認（3ヶ月以上） | インフラ | □ |
| 10 | DNSレコードの確認 | インフラ | □ |

#### 4.2.2 本番デプロイ実行（詳細版）

**実施日時**: Week 26 Day 1（月曜日）09:00-10:00
**担当**: BE開発者、インフラ担当
**立会**: PM、QA

```bash
# ========================================
# Step 1: 本番サーバーへ接続
# ========================================
ssh user@production-server

# ========================================
# Step 2: 現在の状態確認
# ========================================
# Webサーバー稼働状況
sudo systemctl status apache2  # または nginx

# ディスク容量確認
df -h

# 現在のバージョン確認（存在する場合）
ls -la /var/www/html/appsuite-itsm/

# ========================================
# Step 3: メンテナンスモード設定（オプション）
# ========================================
# 一時的なメンテナンスページを表示
sudo cp /var/www/html/maintenance.html /var/www/html/index.html

# ========================================
# Step 4: 完全バックアップ取得
# ========================================
# タイムスタンプ付きバックアップ
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
sudo mkdir -p /var/backups/appsuite-itsm

# 既存ファイルのバックアップ（存在する場合）
if [ -d "/var/www/html/appsuite-itsm" ]; then
    sudo tar -czf /var/backups/appsuite-itsm/backup_${BACKUP_DATE}.tar.gz \
        -C /var/www/html appsuite-itsm
    echo "Backup created: backup_${BACKUP_DATE}.tar.gz"
fi

# バックアップの確認
ls -lh /var/backups/appsuite-itsm/backup_${BACKUP_DATE}.tar.gz

# ========================================
# Step 5: ソースコードの転送
# ========================================
# ローカル環境から実行
cd /path/to/Appsuite-ITSM-Management

# 転送前に最終確認
echo "以下のファイルを転送します:"
ls -la WebUI-Production/

# rsyncで転送（除外ファイル指定）
rsync -avz --delete \
    --exclude='.git' \
    --exclude='docs' \
    --exclude='README.md' \
    --exclude='DEPLOYMENT.md' \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    WebUI-Production/ user@production-server:/tmp/appsuite-itsm-new/

# ========================================
# Step 6: 本番サーバーでファイル配置
# ========================================
# 本番サーバーで作業
ssh user@production-server

# 転送ファイルの確認
ls -la /tmp/appsuite-itsm-new/

# 既存ディレクトリの削除（バックアップ済み）
sudo rm -rf /var/www/html/appsuite-itsm

# 新バージョンの配置
sudo cp -r /tmp/appsuite-itsm-new /var/www/html/appsuite-itsm

# ========================================
# Step 7: 権限設定
# ========================================
# 所有者設定
sudo chown -R www-data:www-data /var/www/html/appsuite-itsm

# ディレクトリ権限: 755
sudo find /var/www/html/appsuite-itsm -type d -exec chmod 755 {} \;

# ファイル権限: 644
sudo find /var/www/html/appsuite-itsm -type f -exec chmod 644 {} \;

# 権限確認
ls -la /var/www/html/appsuite-itsm/

# ========================================
# Step 8: Webサーバー設定確認
# ========================================
# 設定ファイルのシンタックスチェック
sudo apache2ctl configtest  # Apache の場合
sudo nginx -t                # Nginx の場合

# エラーがある場合は修正してから次へ進む

# ========================================
# Step 9: Webサーバー再起動
# ========================================
# 再起動前のログ確認
sudo tail -f /var/log/apache2/error.log &  # Apache
# または
sudo tail -f /var/log/nginx/error.log &    # Nginx

# Webサーバー再起動
sudo systemctl restart apache2  # Apache
sudo systemctl restart nginx    # Nginx

# 再起動確認
sudo systemctl status apache2   # Apache
sudo systemctl status nginx     # Nginx

# ========================================
# Step 10: デプロイ確認
# ========================================
# HTTPSアクセス確認
curl -I https://appsuite-itsm.example.com/

# セキュリティヘッダー確認
curl -I https://appsuite-itsm.example.com/ | grep -E "(Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options|Content-Security-Policy)"

# HTMLコンテンツ取得確認
curl -s https://appsuite-itsm.example.com/ | head -n 20

# ========================================
# Step 11: 一時ファイルの削除
# ========================================
sudo rm -rf /tmp/appsuite-itsm-new

# ========================================
# Step 12: デプロイ完了ログ
# ========================================
echo "Deployment completed at $(date)" | sudo tee -a /var/log/appsuite-itsm-deploy.log
```

#### 4.2.3 デプロイ後検証（詳細版）

**実施日時**: Week 26 Day 1 10:00-11:00
**担当**: QA、全開発者

##### ① 基本動作確認

```bash
# 1. HTTPSアクセス確認
curl -I https://appsuite-itsm.example.com/
# 期待: HTTP/2 200 OK

# 2. セキュリティヘッダー確認
curl -I https://appsuite-itsm.example.com/ | grep "Strict-Transport-Security"
# 期待: Strict-Transport-Security: max-age=31536000; includeSubDomains

# 3. リダイレクト確認（HTTP → HTTPS）
curl -I http://appsuite-itsm.example.com/
# 期待: HTTP/1.1 301 Moved Permanently
#       Location: https://appsuite-itsm.example.com/
```

##### ② 機能検証チェックリスト

| No. | 検証項目 | 手順 | 期待結果 | 結果 | 確認者 |
|-----|---------|------|---------|------|--------|
| 1 | ダッシュボード表示 | トップページにアクセス | 統計カードが表示される | □ | QA |
| 2 | ユーザー管理 | ユーザー一覧を表示 | ユーザーリストが表示される | □ | QA |
| 3 | ユーザー新規登録 | テストユーザーを登録 | 登録成功メッセージ | □ | QA |
| 4 | アプリ管理 | アプリ一覧を表示 | アプリリストが表示される | □ | QA |
| 5 | インシデント管理 | インシデント一覧を表示 | インシデントリストが表示される | □ | QA |
| 6 | 変更管理 | 変更要求一覧を表示 | 変更要求リストが表示される | □ | QA |
| 7 | 監査ログ | ログ一覧を表示 | 操作ログが表示される | □ | QA |
| 8 | バックアップ | バックアップを作成 | JSONファイルダウンロード | □ | QA |
| 9 | リストア | バックアップからリストア | データ復元成功 | □ | QA |
| 10 | API接続テスト | 接続テストを実行 | 接続成功メッセージ | □ | QA |
| 11 | レスポンシブ | モバイルサイズで表示 | 適切にレイアウト調整 | □ | QA |
| 12 | ブラウザ互換性 | Chrome/Firefox/Edgeで動作確認 | 全ブラウザで正常動作 | □ | QA |

##### ③ 性能確認

```bash
# ページ読み込み速度確認（curl使用）
time curl -s https://appsuite-itsm.example.com/ > /dev/null
# 期待: real時間が3秒以内

# または、ブラウザの開発者ツールで確認
# Chrome: F12 → Network → Reload
# 期待: DOMContentLoaded < 3s
```

##### ④ ログ確認

```bash
# エラーログ確認（直近100行）
sudo tail -n 100 /var/log/apache2/error.log    # Apache
sudo tail -n 100 /var/log/nginx/error.log      # Nginx

# アクセスログ確認
sudo tail -n 50 /var/log/apache2/access.log    # Apache
sudo tail -n 50 /var/log/nginx/access.log      # Nginx

# 期待: 重大なエラーがないこと
```

##### ⑤ セキュリティ確認

```bash
# SSL Labs テスト（オプション）
# https://www.ssllabs.com/ssltest/analyze.html?d=appsuite-itsm.example.com
# 期待: A評価以上

# セキュリティヘッダーチェック（securityheaders.com）
# https://securityheaders.com/?q=https://appsuite-itsm.example.com
# 期待: A評価以上
```

### 4.3 ロールバック手順

**実施条件**: デプロイ後に重大な問題が発生した場合

#### 4.3.1 緊急ロールバック（15分以内）

```bash
# ========================================
# Step 1: 本番サーバーへ接続
# ========================================
ssh user@production-server

# ========================================
# Step 2: 最新バックアップの確認
# ========================================
ls -lt /var/backups/appsuite-itsm/ | head -n 5

# 最新バックアップのファイル名を確認
BACKUP_FILE=$(ls -t /var/backups/appsuite-itsm/*.tar.gz | head -n 1)
echo "Rollback to: $BACKUP_FILE"

# ========================================
# Step 3: 現在のバージョンを退避
# ========================================
ROLLBACK_DATE=$(date +%Y%m%d_%H%M%S)
sudo mv /var/www/html/appsuite-itsm \
    /var/www/html/appsuite-itsm.failed_${ROLLBACK_DATE}

# ========================================
# Step 4: バックアップからリストア
# ========================================
sudo tar -xzf $BACKUP_FILE -C /var/www/html/

# ========================================
# Step 5: 権限設定
# ========================================
sudo chown -R www-data:www-data /var/www/html/appsuite-itsm
sudo find /var/www/html/appsuite-itsm -type d -exec chmod 755 {} \;
sudo find /var/www/html/appsuite-itsm -type f -exec chmod 644 {} \;

# ========================================
# Step 6: Webサーバー再起動
# ========================================
sudo systemctl restart apache2  # Apache
sudo systemctl restart nginx    # Nginx

# ========================================
# Step 7: ロールバック確認
# ========================================
curl -I https://appsuite-itsm.example.com/

# ========================================
# Step 8: ロールバック完了ログ
# ========================================
echo "Rollback completed at $(date)" | sudo tee -a /var/log/appsuite-itsm-deploy.log
```

#### 4.3.2 ロールバック後の対応

1. **関係者への通知**
   - PM: ステークホルダーへロールバック実施を報告
   - 運用チーム: ユーザーへの周知

2. **原因調査**
   - 開発チーム: ログ分析、問題の特定
   - QA: 再現テスト

3. **修正と再デプロイ計画**
   - 問題修正後、再度ステージング環境でテスト
   - リリース判定会議で再承認
   - 再デプロイ日程の調整

---

## 5. リスク管理

### 5.1 想定リスクと対策

| ID | リスク | 影響度 | 発生確率 | 影響範囲 | 事前対策 | 発生時対応 |
|----|--------|:------:|:--------:|---------|---------|-----------|
| **R01** | デプロイ中のサーバー障害 | 高 | 低 | 全機能 | ステージング環境でリハーサル実施 | 即座にロールバック |
| **R02** | SSL証明書の問題 | 高 | 低 | アクセス不可 | 事前に証明書の有効期限・設定確認 | 証明書再発行・再設定 |
| **R03** | 権限設定ミス | 中 | 中 | 一部機能 | デプロイ手順書に権限設定を明記 | 権限を修正して再起動 |
| **R04** | ブラウザキャッシュ問題 | 低 | 高 | ユーザー体験 | キャッシュバスティングの実装 | ユーザーにキャッシュクリアを案内 |
| **R05** | DeskNet's Neo API接続エラー | 中 | 中 | API連携機能 | API接続設定の事前確認 | API設定を再確認・修正 |
| **R06** | データ移行の問題 | 高 | 低 | データ整合性 | バックアップからリストア手順の確認 | バックアップから復元 |
| **R07** | 性能劣化 | 中 | 低 | ユーザー体験 | 性能テストの実施 | サーバーリソース増強 |
| **R08** | セキュリティ脆弱性の発見 | 高 | 低 | セキュリティ | セキュリティテストの実施 | 即座にパッチ適用 |
| **R09** | ユーザーの誤操作 | 中 | 中 | データ | トレーニング実施、操作マニュアル整備 | バックアップから復元 |
| **R10** | 想定外のブラウザ互換性問題 | 低 | 低 | 一部ユーザー | 互換性テストの実施 | 対応ブラウザの案内 |

### 5.2 緊急連絡体制

#### 5.2.1 連絡フロー

```
【重大障害発生時】
  ↓
①発見者 → PM（即座に連絡）
  ↓
②PM → 技術リード・インフラ担当（同時連絡）
  ↓
③PM → ステークホルダー（状況報告）
  ↓
④技術チーム → 原因調査・対応
  ↓
⑤PM → ステークホルダー（復旧報告）
```

#### 5.2.2 連絡先一覧

| 役割 | 氏名 | 連絡先（メール） | 連絡先（電話） | 対応時間 |
|------|------|-----------------|---------------|---------|
| プロジェクトマネージャー | - | pm@example.com | 090-xxxx-xxxx | 24時間 |
| システムアーキテクト | - | architect@example.com | 090-xxxx-xxxx | 平日9-18時 |
| インフラ担当 | - | infra@example.com | 090-xxxx-xxxx | 24時間 |
| フロントエンド開発リード | - | fe-lead@example.com | 090-xxxx-xxxx | 平日9-18時 |
| バックエンド開発リード | - | be-lead@example.com | 090-xxxx-xxxx | 平日9-18時 |
| QAリード | - | qa-lead@example.com | 090-xxxx-xxxx | 平日9-18時 |
| ステークホルダー | - | stakeholder@example.com | 090-xxxx-xxxx | 平日9-18時 |

### 5.3 インシデント対応フロー

#### 5.3.1 障害レベル定義

| レベル | 定義 | 対応時間 | 対応者 |
|--------|------|---------|--------|
| **重大（Critical）** | 全機能停止、データ消失 | 即座（15分以内） | 全員 |
| **高（High）** | 主要機能停止、大多数のユーザーに影響 | 1時間以内 | PM + 技術リード |
| **中（Medium）** | 一部機能の問題、回避策あり | 4時間以内 | 担当開発者 |
| **低（Low）** | 軽微な問題、影響限定的 | 24時間以内 | 担当開発者 |

#### 5.3.2 インシデント対応手順

```
Step 1: 検知・報告（5分）
  └─ 発見者がPMに報告、チャットで共有

Step 2: 影響度評価（10分）
  └─ PMと技術リードで障害レベルを判定

Step 3: 初動対応（15-60分）
  ├─ 重大: ロールバック判断
  ├─ 高: 緊急修正またはロールバック
  └─ 中/低: 原因調査・修正計画

Step 4: 原因調査（並行実施）
  └─ ログ分析、再現テスト

Step 5: 恒久対応（1-24時間）
  └─ 修正、テスト、再デプロイ

Step 6: 報告・振り返り（翌日）
  └─ インシデントレポート作成、再発防止策
```

---

## 6. リリース後の運用

### 6.1 初日の監視項目

**実施日**: Week 26 Day 1（リリース日）13:00-17:00

| 時刻 | 監視項目 | 確認内容 | 担当 |
|------|---------|---------|------|
| 毎正時 | システム稼働 | HTTPSアクセス、応答時間 | 全員持ち回り |
| 毎正時 | エラーログ | 新規エラーの有無 | 開発者 |
| 毎30分 | ユーザーアクセス | アクセス数、エラー率 | QA |
| 毎時間 | サーバーリソース | CPU、メモリ、ディスク使用率 | インフラ |
| 随時 | ユーザーフィードバック | 問い合わせ、不具合報告 | サポート担当 |

### 6.2 1週間の監視スケジュール

| 日 | 重点監視項目 | 頻度 | 担当 |
|----|-------------|------|------|
| **Day 1（月）** | 全機能、エラーログ、アクセス | 毎時間 | 全員 |
| **Day 2（火）** | エラーログ、ユーザーフィードバック | 毎2時間 | 開発者・サポート |
| **Day 3（水）** | エラーログ、性能 | 毎4時間 | 開発者・インフラ |
| **Day 4（木）** | エラーログ、バックアップ | 1日2回（朝・夕） | 運用チーム |
| **Day 5（金）** | エラーログ、統計 | 1日2回（朝・夕） | 運用チーム |
| **Day 6-7（土日）** | 重大エラーのみ | オンコール対応 | オンコール担当 |

### 6.3 ユーザーサポート体制

#### 6.3.1 サポート窓口

| サポート種別 | 連絡先 | 対応時間 | 対応内容 |
|-------------|--------|---------|---------|
| **メールサポート** | support@example.com | 平日9:00-18:00 | 一般的な問い合わせ、操作方法 |
| **緊急サポート** | 090-xxxx-xxxx | 24時間 | 重大障害のみ |
| **チャットサポート** | 社内チャット | 平日9:00-18:00 | 簡易的な問い合わせ |

#### 6.3.2 問い合わせ対応フロー

```
ユーザーからの問い合わせ
  ↓
①一次対応（サポート担当）
  ├─ 操作方法 → ユーザーガイド案内で解決
  ├─ 軽微な問題 → その場で解決
  └─ 技術的問題 → 開発チームへエスカレーション
      ↓
②二次対応（開発チーム）
  ├─ バグ → 修正計画を立てる
  ├─ 仕様確認 → 回答を準備
  └─ 機能要望 → 変更管理プロセスへ
      ↓
③回答・フォローアップ
  └─ ユーザーへ回答、満足度確認
```

### 6.4 フィードバック収集方法

#### 6.4.1 アンケート実施

**実施タイミング**: リリース後1週間

**対象**: 全ユーザー（想定20-50名）

**質問項目**:
1. システムの使いやすさ（5段階評価）
2. 表示速度への満足度（5段階評価）
3. よく使う機能
4. 改善してほしい点（自由記述）
5. バグや不具合の有無（自由記述）

**集計方法**: Googleフォーム、社内アンケートツール

#### 6.4.2 定例フィードバック会議

| 会議 | 頻度 | 参加者 | 内容 |
|------|------|--------|------|
| **初期フィードバック会議** | リリース後3日目 | 運用チーム、PM | 初期の問題点を共有 |
| **週次フィードバック会議** | 毎週金曜 | 運用チーム、開発チーム | 1週間の振り返り |
| **月次レビュー** | 毎月第1金曜 | 全員 | 運用状況、改善計画 |

### 6.5 運用引き継ぎ

#### 6.5.1 引き継ぎスケジュール

| 日 | 時間 | 内容 | 参加者 |
|----|------|------|--------|
| Week 25 Day 4 | 09:00-12:00 | 運用トレーニング（座学） | 運用チーム、PM、アーキテクト |
| Week 25 Day 4 | 13:00-17:00 | 運用トレーニング（実習） | 運用チーム、開発者 |
| Week 26 Day 1 | 13:00-17:00 | 初日立ち会い運用 | 運用チーム、開発者全員 |
| Week 26 Day 2-3 | 終日 | 並走運用 | 運用チーム、開発者1名 |
| Week 26 Day 4以降 | - | 独立運用開始 | 運用チーム（開発者はバックアップ） |

#### 6.5.2 引き継ぎ資料

| 資料名 | 内容 | 担当 |
|--------|------|------|
| 運用マニュアル | 日常運用手順 | ライター |
| トラブルシューティングガイド | よくある問題と対処法 | QA |
| デプロイ手順書 | デプロイ・ロールバック手順 | BE開発者 |
| API連携ガイド | DeskNet's Neo連携設定 | BE開発者 |
| バックアップ・リストアガイド | バックアップ運用 | インフラ |

---

## 7. 体制と連絡先

### 7.1 リリース体制

| 役割 | 氏名 | 責任範囲 |
|------|------|---------|
| **プロジェクトマネージャー** | - | 全体統括、意思決定、ステークホルダー対応 |
| **システムアーキテクト** | - | 技術的判断、設計確認 |
| **インフラ担当** | - | サーバー構築、ネットワーク、監視設定 |
| **フロントエンド開発リード** | - | UI/UX最終確認、フロントエンド不具合対応 |
| **バックエンド開発リード** | - | デプロイ実行、API連携確認 |
| **QAリード** | - | デプロイ後検証、品質保証 |
| **テクニカルライター** | - | ドキュメント最終確認、ユーザーガイド |
| **運用チーム** | - | 日常運用、ユーザーサポート |

### 7.2 緊急連絡先（再掲）

| 役割 | メール | 電話 | 対応時間 |
|------|--------|------|---------|
| PM | pm@example.com | 090-xxxx-xxxx | 24時間 |
| アーキテクト | architect@example.com | 090-xxxx-xxxx | 平日9-18時 |
| インフラ | infra@example.com | 090-xxxx-xxxx | 24時間 |
| 開発リード | dev-lead@example.com | 090-xxxx-xxxx | 平日9-18時 |
| QA | qa-lead@example.com | 090-xxxx-xxxx | 平日9-18時 |

### 7.3 オンコール体制

| 期間 | 担当 | バックアップ |
|------|------|------------|
| Week 26 Day 1 | PM + インフラ | 開発リード |
| Week 26 Day 2-5 | インフラ | PM |
| Week 27以降 | 運用チーム | インフラ |

---

## 8. 承認

### 8.1 承認フロー

| 承認段階 | 承認者 | 承認内容 | 予定日 |
|---------|--------|---------|--------|
| **ステージングデプロイ承認** | PM | ステージング環境へのデプロイ | Week 25 Day 1 |
| **リリース判定承認** | PM + ステークホルダー | 本番リリースの最終承認 | Week 25 Day 5 |
| **本番デプロイ実行承認** | PM | 本番デプロイ開始の承認 | Week 26 Day 1 |

### 8.2 承認記録

| 承認日 | 承認者 | 署名 | 備考 |
|--------|--------|------|------|
| YYYY/MM/DD | - | - | - |
| YYYY/MM/DD | - | - | - |
| YYYY/MM/DD | - | - | - |

---

## 付録

### A. チェックリスト一覧

- [デプロイ前チェックリスト](#421-デプロイ前チェックリスト)
- [デプロイ後検証チェックリスト](#②-機能検証チェックリスト)
- [動作確認チェックリスト](#413-動作確認チェックリスト)

### B. 関連ドキュメント

- デプロイ手順書.md（詳細版）
- ロールバック手順書.md
- 運用マニュアル(Operation-Manual).md
- ユーザーガイド(User-Guide).md
- DEPLOYMENT.md

### C. 用語集

| 用語 | 説明 |
|------|------|
| ステージング環境 | 本番環境と同等の構成を持つテスト環境 |
| ロールバック | 問題発生時に前バージョンに戻すこと |
| スモークテスト | 基本的な動作確認を行う簡易テスト |
| HSTS | HTTP Strict Transport Security（HTTPS強制） |
| CSP | Content Security Policy（コンテンツセキュリティポリシー） |

---

**文書履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2026-02-04 | 初版作成 | システム管理者 |

---

**次のステップ**: [デプロイ手順書.md](./デプロイ手順書.md)、[ロールバック手順書.md](./ロールバック手順書.md)
