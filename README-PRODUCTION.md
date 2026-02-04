# 本番環境セットアップガイド

**文書番号**: SETUP-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年2月4日
**対象**: AppSuite ITSM Management System Phase 5

---

## 目次

1. [概要](#1-概要)
2. [前提条件](#2-前提条件)
3. [セットアップ手順](#3-セットアップ手順)
4. [HTTPS化](#4-https化)
5. [デプロイ](#5-デプロイ)
6. [動作確認](#6-動作確認)
7. [トラブルシューティング](#7-トラブルシューティング)
8. [メンテナンス](#8-メンテナンス)

---

## 1. 概要

このガイドは、AppSuite ITSM管理システムを本番環境にデプロイするための手順を説明します。

### 主要タスク

```
1. 環境準備（サーバー、Webサーバー、SSL証明書）
2. HTTPS設定（Apache/Nginx）
3. ファイルデプロイ
4. 動作確認
5. 監視設定
```

### 想定時間

- 初回セットアップ: 2-3時間
- 2回目以降のデプロイ: 15-30分

---

## 2. 前提条件

### 2.1 サーバー要件

| 項目 | 要件 |
|------|------|
| OS | Ubuntu 22.04 LTS / CentOS 8+ / Windows Server 2022 |
| CPU | 2コア以上 |
| メモリ | 4GB以上 |
| ディスク | 20GB以上（SSD推奨） |
| ネットワーク | 100Mbps以上、固定IPアドレス |

### 2.2 ソフトウェア要件

| ソフトウェア | バージョン |
|------------|----------|
| Webサーバー | Apache 2.4.58+ または Nginx 1.24+ |
| OpenSSL | 1.1.1+ |
| curl | 7.0+ |
| rsync | 3.0+ |
| Git | 2.0+ |

### 2.3 ドメイン・SSL証明書

- 独自ドメイン取得済み
- DNS設定済み（Aレコード）
- SSL証明書（Let's Encryptまたは商用CA）

---

## 3. セットアップ手順

### 3.1 サーバー初期設定

#### Ubuntu/Debian の場合

```bash
# システムアップデート
sudo apt-get update && sudo apt-get upgrade -y

# 必要なパッケージのインストール
sudo apt-get install -y apache2 openssl curl rsync git

# Apache モジュールの有効化
sudo a2enmod ssl headers rewrite deflate expires

# ファイアウォール設定
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### CentOS/RHEL の場合

```bash
# システムアップデート
sudo yum update -y

# 必要なパッケージのインストール
sudo yum install -y httpd mod_ssl openssl curl rsync git

# ファイアウォール設定
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Apache 起動・自動起動設定
sudo systemctl start httpd
sudo systemctl enable httpd
```

### 3.2 ディレクトリ構造の作成

```bash
# アプリケーションディレクトリ
sudo mkdir -p /var/www/appsuite-itsm

# バックアップディレクトリ
sudo mkdir -p /var/backups/appsuite-itsm

# ログディレクトリ（自動作成される場合もある）
sudo mkdir -p /var/log/appsuite-itsm

# 権限設定
sudo chown -R www-data:www-data /var/www/appsuite-itsm
sudo chown -R $USER:$USER /var/backups/appsuite-itsm
```

### 3.3 環境変数の設定

```bash
# 環境変数テンプレートをコピー
cp config/.env.production.template config/.env.production

# 環境変数を編集（実際の値に変更）
vi config/.env.production
```

**編集項目**:
- `PRODUCTION_HOST`: 本番サーバーのドメイン名
- `PRODUCTION_USER`: SSH接続用ユーザー名
- `EMAIL`: SSL証明書用メールアドレス
- その他、環境に応じた設定

```bash
# 環境変数ファイルの権限設定（機密情報保護）
chmod 600 config/.env.production
```

---

## 4. HTTPS化

### 4.1 SSL証明書の取得

#### オプション1: Let's Encrypt（推奨・無料）

```bash
# certbotのインストール（Ubuntu/Debian）
sudo apt-get install -y certbot python3-certbot-apache

# 証明書の取得（自動設定）
sudo certbot --apache -d appsuite-itsm.example.com --email admin@example.com --agree-tos --redirect

# 自動更新の設定（cron）
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 更新テスト
sudo certbot renew --dry-run
```

#### オプション2: スクリプトを使用（推奨）

```bash
# SSL証明書生成スクリプトの実行
./scripts/generate-ssl-cert.sh letsencrypt

# プロンプトに従って入力
# - ドメイン名: appsuite-itsm.example.com
# - メールアドレス: admin@example.com
```

#### オプション3: 自己署名証明書（開発環境のみ）

```bash
# 自己署名証明書生成スクリプトの実行
./scripts/generate-ssl-cert.sh selfsigned

# 生成された証明書を確認
ls -la ssl-certs/
```

### 4.2 Webサーバー設定

#### Apache の場合

```bash
# 設定ファイルをコピー
sudo cp config/apache/appsuite-itsm.conf /etc/apache2/sites-available/

# 設定ファイルを編集（ドメイン名、証明書パスを実際の値に変更）
sudo vi /etc/apache2/sites-available/appsuite-itsm.conf

# 設定を有効化
sudo a2ensite appsuite-itsm.conf

# デフォルトサイトを無効化（オプション）
sudo a2dissite 000-default.conf

# 設定をテスト
sudo apache2ctl configtest

# Apacheを再起動
sudo systemctl restart apache2
```

#### Nginx の場合

```bash
# 設定ファイルをコピー
sudo cp config/nginx/appsuite-itsm.conf /etc/nginx/sites-available/

# 設定ファイルを編集（ドメイン名、証明書パスを実際の値に変更）
sudo vi /etc/nginx/sites-available/appsuite-itsm.conf

# シンボリックリンクを作成
sudo ln -s /etc/nginx/sites-available/appsuite-itsm.conf /etc/nginx/sites-enabled/

# デフォルトサイトを削除（オプション）
sudo rm /etc/nginx/sites-enabled/default

# 設定をテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl restart nginx
```

### 4.3 セキュリティヘッダーの確認

```bash
# セキュリティヘッダーの確認
curl -I https://appsuite-itsm.example.com/

# 期待される出力:
# HTTP/2 200
# strict-transport-security: max-age=31536000; includeSubDomains
# x-content-type-options: nosniff
# x-frame-options: SAMEORIGIN
# content-security-policy: ...
```

---

## 5. デプロイ

### 5.1 手動デプロイ

#### ステップ1: ファイルの転送

```bash
# プロジェクトディレクトリに移動
cd /path/to/Appsuite-ITSM-Management

# rsyncでファイルを転送
rsync -avz --delete \
    --exclude='.git' \
    --exclude='docs' \
    --exclude='node_modules' \
    WebUI-Production/ user@appsuite-itsm.example.com:/tmp/appsuite-itsm-new/
```

#### ステップ2: サーバー側での配置

```bash
# 本番サーバーにSSH接続
ssh user@appsuite-itsm.example.com

# バックアップの作成
sudo tar -czf /var/backups/appsuite-itsm/backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    -C /var/www appsuite-itsm

# 既存ファイルの削除
sudo rm -rf /var/www/appsuite-itsm

# 新バージョンの配置
sudo cp -r /tmp/appsuite-itsm-new /var/www/appsuite-itsm

# 権限設定
sudo chown -R www-data:www-data /var/www/appsuite-itsm
sudo find /var/www/appsuite-itsm -type d -exec chmod 755 {} \;
sudo find /var/www/appsuite-itsm -type f -exec chmod 644 {} \;

# Webサーバー再起動
sudo systemctl restart apache2  # または nginx

# 一時ファイルの削除
sudo rm -rf /tmp/appsuite-itsm-new
```

### 5.2 自動デプロイスクリプト（推奨）

```bash
# デプロイスクリプトの実行
./scripts/deploy-production.sh

# プロンプトに従って確認
# - 事前チェックが自動実行される
# - バックアップが自動作成される
# - ファイルが自動転送・配置される
# - Webサーバーが自動再起動される
# - 動作確認が自動実行される
```

**デプロイスクリプトの機能**:
- ✓ 事前チェック（Git、SSH、ディスク容量）
- ✓ 自動バックアップ（7世代保持）
- ✓ ファイル転送・配置
- ✓ 権限設定
- ✓ Webサーバー再起動
- ✓ 動作確認
- ✓ ロールバック機能

---

## 6. 動作確認

### 6.1 基本動作確認

```bash
# HTTPSアクセス確認
curl -I https://appsuite-itsm.example.com/

# 期待される出力: HTTP/2 200 OK

# コンテンツ確認
curl -s https://appsuite-itsm.example.com/ | grep "AppSuite"

# 期待される出力: AppSuiteを含むHTML
```

### 6.2 ヘルスチェックスクリプト（推奨）

```bash
# ヘルスチェックスクリプトの実行
./scripts/health-check.sh -u https://appsuite-itsm.example.com -v

# チェック項目:
# ✓ HTTP/HTTPSアクセス
# ✓ レスポンスタイム
# ✓ SSL証明書
# ✓ セキュリティヘッダー
# ✓ コンテンツ
```

### 6.3 ブラウザでの確認

1. **HTTPSアクセス**: `https://appsuite-itsm.example.com/`
2. **ダッシュボード表示**: トップページが表示されることを確認
3. **開発者ツール**: F12 → Console → エラーがないことを確認
4. **レスポンシブ**: ブラウザ幅を変更してレイアウトを確認

### 6.4 機能確認チェックリスト

- [ ] ユーザー管理（CRUD操作）
- [ ] アプリ管理（CRUD操作）
- [ ] インシデント管理（CRUD操作）
- [ ] 変更管理（CRUD操作）
- [ ] 監査ログ（記録・検索・エクスポート）
- [ ] システム設定（各種設定変更）
- [ ] バックアップ/リストア

---

## 7. トラブルシューティング

### 7.1 よくある問題

#### 問題1: 403 Forbidden エラー

**原因**: ファイル権限が不正

**解決策**:
```bash
sudo chown -R www-data:www-data /var/www/appsuite-itsm
sudo find /var/www/appsuite-itsm -type d -exec chmod 755 {} \;
sudo find /var/www/appsuite-itsm -type f -exec chmod 644 {} \;
sudo systemctl restart apache2
```

#### 問題2: SSL証明書エラー

**原因**: 証明書の有効期限切れまたは設定ミス

**解決策**:
```bash
# 証明書の確認
sudo openssl x509 -in /etc/letsencrypt/live/domain/fullchain.pem -noout -dates

# 証明書の更新
sudo certbot renew
sudo systemctl restart apache2
```

#### 問題3: CSS/JSが読み込まれない

**原因**: ファイルパスが不正、キャッシュ問題

**解決策**:
```bash
# ファイルの存在確認
ls -la /var/www/appsuite-itsm/css/
ls -la /var/www/appsuite-itsm/js/

# ブラウザのキャッシュをクリア
# Ctrl + Shift + Del → キャッシュクリア

# Webサーバーのキャッシュをクリア（Apacheの場合）
sudo service apache2 reload
```

### 7.2 ログ確認

```bash
# Apacheのエラーログ
sudo tail -f /var/log/apache2/error.log

# Nginxのエラーログ
sudo tail -f /var/log/nginx/error.log

# デプロイログ
sudo tail -f /var/log/appsuite-itsm-deploy.log
```

### 7.3 ロールバック

```bash
# 最新バックアップの確認
ls -lt /var/backups/appsuite-itsm/ | head -n 5

# ロールバック実行
BACKUP_FILE=/var/backups/appsuite-itsm/backup_20260204_090000.tar.gz

sudo rm -rf /var/www/appsuite-itsm
sudo tar -xzf $BACKUP_FILE -C /var/www/
sudo chown -R www-data:www-data /var/www/appsuite-itsm
sudo systemctl restart apache2
```

---

## 8. メンテナンス

### 8.1 日次作業

| 作業 | コマンド | 頻度 |
|------|---------|------|
| ヘルスチェック | `./scripts/health-check.sh` | 毎日 |
| ログ確認 | `sudo tail -n 100 /var/log/apache2/error.log` | 毎日 |
| バックアップ確認 | `ls -la /var/backups/appsuite-itsm/` | 毎日 |

### 8.2 週次作業

| 作業 | コマンド | 頻度 |
|------|---------|------|
| SSL証明書確認 | `sudo certbot certificates` | 毎週 |
| ディスク容量確認 | `df -h` | 毎週 |
| システム更新 | `sudo apt-get update && sudo apt-get upgrade` | 毎週 |

### 8.3 月次作業

| 作業 | コマンド | 頻度 |
|------|---------|------|
| ログローテーション | `sudo logrotate -f /etc/logrotate.conf` | 毎月 |
| バックアップ世代整理 | `find /var/backups -mtime +30 -delete` | 毎月 |
| セキュリティ監査 | SSL Labs、SecurityHeaders.com | 毎月 |

### 8.4 自動化設定（cron）

```bash
# crontabを編集
crontab -e

# 以下を追加

# 毎日午前3時にヘルスチェック
0 3 * * * /path/to/scripts/health-check.sh >> /var/log/health-check.log 2>&1

# 毎日午前2時にバックアップ（手動バックアップの場合）
0 2 * * * tar -czf /var/backups/appsuite-itsm/backup_$(date +\%Y\%m\%d).tar.gz /var/www/appsuite-itsm

# 毎週日曜午前4時に古いバックアップを削除（30日以上前）
0 4 * * 0 find /var/backups/appsuite-itsm -name "backup_*.tar.gz" -mtime +30 -delete
```

---

## 9. セキュリティベストプラクティス

### 9.1 必須対応

- ✓ HTTPS化（Let's Encrypt）
- ✓ セキュリティヘッダー設定（7種類）
- ✓ ファイアウォール設定（ポート80/443のみ開放）
- ✓ SSH鍵認証（パスワード認証無効化）
- ✓ 定期的なシステム更新
- ✓ SSL証明書の自動更新

### 9.2 推奨対応

- Basic認証の追加（社内ネットワーク以外からのアクセス制限）
- Fail2ban導入（ブルートフォース対策）
- 侵入検知システム（IDS）の導入
- セキュリティ監査ツールの定期実行

---

## 10. サポート・問い合わせ

### 緊急時連絡先

| 役割 | 連絡先 | 対応時間 |
|------|--------|---------|
| システム管理者 | admin@example.com | 24時間 |
| インフラ担当 | infra@example.com | 24時間 |
| 開発チーム | dev@example.com | 平日9-18時 |

### 参考ドキュメント

- [Phase 5 リリース計画書](docs/Phase5_リリース計画書.md)
- [デプロイ手順書](docs/デプロイ手順書.md)
- [セキュリティ設計書](docs/セキュリティ設計書(Security-Design).md)
- [運用マニュアル](docs/運用マニュアル(Operation-Manual).md)

---

## 付録

### A. 便利なコマンド一覧

```bash
# SSL証明書情報の確認
openssl x509 -in /etc/letsencrypt/live/domain/fullchain.pem -noout -text

# Webサーバーの設定テスト
sudo apache2ctl configtest  # Apache
sudo nginx -t                # Nginx

# ポート確認
sudo netstat -tulpn | grep -E ':(80|443)'

# プロセス確認
ps aux | grep -E 'apache2|nginx'

# ディスク使用率確認
df -h

# メモリ使用率確認
free -h

# CPU使用率確認
top -bn1 | head -n 5

# ログのリアルタイム監視
sudo tail -f /var/log/apache2/error.log
```

### B. 設定ファイルの場所

| ファイル | パス |
|---------|------|
| Apache設定 | `/etc/apache2/sites-available/appsuite-itsm.conf` |
| Nginx設定 | `/etc/nginx/sites-available/appsuite-itsm.conf` |
| SSL証明書 | `/etc/letsencrypt/live/domain/` |
| アプリケーション | `/var/www/appsuite-itsm/` |
| バックアップ | `/var/backups/appsuite-itsm/` |
| ログ | `/var/log/apache2/` または `/var/log/nginx/` |

---

**文書履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2026-02-04 | 初版作成 | システム管理者 |

---

**次のステップ**: セットアップを開始してください！
