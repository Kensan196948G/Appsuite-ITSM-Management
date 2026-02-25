# 自動起動設定ガイド（Auto-Start Configuration Guide）

## 文書情報

| 項目 | 内容 |
|------|------|
| 文書名 | 自動起動設定ガイド |
| プロジェクト名 | AppSuite ITSM管理システム |
| バージョン | 1.0 |
| 作成日 | 2026年1月21日 |

---

## 1. 概要

このドキュメントでは、AppSuite ITSM管理システムをOS起動時に自動起動する設定方法を説明します。

### 1.1 自動起動する環境

| 環境 | ポート | プロトコル | 自動起動 |
|------|--------|-----------|----------|
| 開発環境 | 3000 | HTTP | オプション |
| 本番環境 | 8443 | HTTPS | 推奨 |

---

## 2. Windows 自動起動設定

### 2.1 NSSM（Non-Sucking Service Manager）を使用

#### 2.1.1 NSSMのインストール

```powershell
# Chocolateyを使用してインストール
choco install nssm

# または手動ダウンロード
# https://nssm.cc/download
```

#### 2.1.2 開発環境サービス登録（オプション）

```powershell
# サービス作成
nssm install AppSuiteITSM-Dev powershell

# 実行パラメータ設定
nssm set AppSuiteITSM-Dev AppParameters `-ExecutionPolicy Bypass -File "Z:\Appsuite-ITSM-Management\scripts\windows\dev-start.ps1"

# 作業ディレクトリ設定
nssm set AppSuiteITSM-Dev AppDirectory "Z:\Appsuite-ITSM-Management"

# サービス表示名設定
nssm set AppSuiteITSM-Dev DisplayName "AppSuite ITSM [開発]"

# 起動タイプ設定（自動）
nssm set AppSuiteITSM-Dev Start SERVICE_AUTO_START

# サービス開始
nssm start AppSuiteITSM-Dev
```

#### 2.1.3 本番環境サービス登録（推奨）

```powershell
# サービス作成
nssm install AppSuiteITSM-Prod powershell

# 実行パラメータ設定
nssm set AppSuiteITSM-Prod AppParameters `-ExecutionPolicy Bypass -File "Z:\Appsuite-ITSM-Management\scripts\windows\prod-start.ps1"

# 作業ディレクトリ設定
nssm set AppSuiteITSM-Prod AppDirectory "Z:\Appsuite-ITSM-Management"

# サービス表示名設定
nssm set AppSuiteITSM-Prod DisplayName "AppSuite ITSM [本番]"

# 起動タイプ設定（自動）
nssm set AppSuiteITSM-Prod Start SERVICE_AUTO_START

# サービス開始
nssm start AppSuiteITSM-Prod
```

#### 2.1.4 サービス管理コマンド

```powershell
# サービス開始
nssm start AppSuiteITSM-Dev
nssm start AppSuiteITSM-Prod

# サービス停止
nssm stop AppSuiteITSM-Dev
nssm stop AppSuiteITSM-Prod

# サービス再起動
nssm restart AppSuiteITSM-Dev
nssm restart AppSuiteITSM-Prod

# サービス削除
nssm remove AppSuiteITSM-Dev confirm
nssm remove AppSuiteITSM-Prod confirm

# サービス状態確認
nssm status AppSuiteITSM-Dev
nssm status AppSuiteITSM-Prod
```

### 2.2 Windowsタスクスケジューラを使用（代替方法）

#### 2.2.1 開発環境タスク作成

1. タスクスケジューラを開く
2. 「基本タスクの作成」を選択
3. タスク名: `AppSuite ITSM 開発環境`
4. トリガー: `コンピューターの起動時`
5. 操作: `プログラムの開始`
   - プログラム: `powershell.exe`
   - 引数: `-ExecutionPolicy Bypass -File "Z:\Appsuite-ITSM-Management\scripts\windows\dev-start.ps1"`
6. 完了

#### 2.2.2 本番環境タスク作成

1. タスクスケジューラを開く
2. 「基本タスクの作成」を選択
3. タスク名: `AppSuite ITSM 本番環境`
4. トリガー: `コンピューターの起動時`
5. 操作: `プログラムの開始`
   - プログラム: `powershell.exe`
   - 引数: `-ExecutionPolicy Bypass -File "Z:\Appsuite-ITSM-Management\scripts\windows\prod-start.ps1"`
6. 完了

---

## 3. Linux 自動起動設定

### 3.1 systemd サービス作成

#### 3.1.1 開発環境サービスユニット

ファイル作成: `/etc/systemd/system/appsuite-itsm-dev.service`

```ini
[Unit]
Description=AppSuite ITSM Development Environment
Documentation=https://github.com/Kensan196948G/Appsuite-ITSM-Management
After=network.target

[Service]
Type=simple
User=kensan
Group=kensan
WorkingDirectory=/mnt/z/Appsuite-ITSM-Management
ExecStart=/bin/bash /mnt/z/Appsuite-ITSM-Management/scripts/linux/dev-start.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# 環境変数
Environment="NODE_ENV=development"
Environment="PORT=3000"

[Install]
WantedBy=multi-user.target
```

#### 3.1.2 本番環境サービスユニット

ファイル作成: `/etc/systemd/system/appsuite-itsm-prod.service`

```ini
[Unit]
Description=AppSuite ITSM Production Environment
Documentation=https://github.com/Kensan196948G/Appsuite-ITSM-Management
After=network.target

[Service]
Type=simple
User=kensan
Group=kensan
WorkingDirectory=/mnt/z/Appsuite-ITSM-Management
ExecStart=/bin/bash /mnt/z/Appsuite-ITSM-Management/scripts/linux/prod-start.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# 環境変数
Environment="NODE_ENV=production"
Environment="PORT=8443"

[Install]
WantedBy=multi-user.target
```

#### 3.1.3 サービス有効化と起動

```bash
# サービスファイルの権限設定
sudo chmod 644 /etc/systemd/system/appsuite-itsm-dev.service
sudo chmod 644 /etc/systemd/system/appsuite-itsm-prod.service

# systemdをリロード
sudo systemctl daemon-reload

# サービス有効化（自動起動）
sudo systemctl enable appsuite-itsm-dev
sudo systemctl enable appsuite-itsm-prod

# サービス開始
sudo systemctl start appsuite-itsm-dev
sudo systemctl start appsuite-itsm-prod

# サービス状態確認
sudo systemctl status appsuite-itsm-dev
sudo systemctl status appsuite-itsm-prod
```

#### 3.1.4 サービス管理コマンド

```bash
# サービス開始
sudo systemctl start appsuite-itsm-dev
sudo systemctl start appsuite-itsm-prod

# サービス停止
sudo systemctl stop appsuite-itsm-dev
sudo systemctl stop appsuite-itsm-prod

# サービス再起動
sudo systemctl restart appsuite-itsm-dev
sudo systemctl restart appsuite-itsm-prod

# サービス状態確認
sudo systemctl status appsuite-itsm-dev
sudo systemctl status appsuite-itsm-prod

# ログ確認
sudo journalctl -u appsuite-itsm-dev -f
sudo journalctl -u appsuite-itsm-prod -f

# サービス無効化（自動起動停止）
sudo systemctl disable appsuite-itsm-dev
sudo systemctl disable appsuite-itsm-prod
```

---

## 4. 動作確認

### 4.1 サービス起動確認

#### Windows
```powershell
# サービス状態確認
Get-Service -Name AppSuiteITSM-*

# または
nssm status AppSuiteITSM-Dev
nssm status AppSuiteITSM-Prod
```

#### Linux
```bash
# サービス状態確認
sudo systemctl status appsuite-itsm-dev
sudo systemctl status appsuite-itsm-prod
```

### 4.2 Webアクセス確認

#### 開発環境
```
http://localhost:3000
http://192.168.0.185:3000
```

#### 本番環境
```
https://localhost:8443
https://192.168.0.185:8443
```

### 4.3 ポート使用確認

#### Windows
```powershell
netstat -ano | findstr "3000"
netstat -ano | findstr "8443"
```

#### Linux
```bash
sudo netstat -tulpn | grep 3000
sudo netstat -tulpn | grep 8443
```

---

## 5. トラブルシューティング

### 5.1 サービスが起動しない

#### 原因1: ポート競合
```bash
# ポート使用状況確認
# Windows
netstat -ano | findstr "3000"

# Linux
sudo lsof -i :3000
```

**解決策**: 使用中のプロセスを終了するか、ポート番号を変更

#### 原因2: パーミッション不足
```bash
# Linux: スクリプトに実行権限を付与
chmod +x scripts/linux/*.sh
```

#### 原因3: Node.jsが見つからない
```bash
# Node.jsのインストール確認
node --version
npm --version
```

**解決策**: Node.jsをインストールまたはパスを設定

### 5.2 ログ確認方法

#### Windows（NSSMサービス）
```powershell
# イベントビューア
eventvwr.msc

# または PowerShell
Get-EventLog -LogName Application -Source AppSuiteITSM-* -Newest 50
```

#### Linux（systemd）
```bash
# リアルタイムログ表示
sudo journalctl -u appsuite-itsm-dev -f
sudo journalctl -u appsuite-itsm-prod -f

# 最新50行表示
sudo journalctl -u appsuite-itsm-dev -n 50
sudo journalctl -u appsuite-itsm-prod -n 50
```

---

## 6. セキュリティ考慮事項

### 6.1 ファイアウォール設定

#### Windows Firewall
```powershell
# 開発環境ポート許可
New-NetFirewallRule -DisplayName "AppSuite ITSM Dev" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# 本番環境ポート許可
New-NetFirewallRule -DisplayName "AppSuite ITSM Prod" -Direction Inbound -LocalPort 8443 -Protocol TCP -Action Allow
```

#### Linux iptables
```bash
# 開発環境ポート許可
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT

# 本番環境ポート許可
sudo iptables -A INPUT -p tcp --dport 8443 -j ACCEPT

# 設定保存
sudo iptables-save > /etc/iptables/rules.v4
```

### 6.2 SSL証明書管理

- 自己署名証明書は365日で期限切れ
- 期限切れ前に再生成が必要
- 本番運用時は正式な証明書（Let's Encrypt等）推奨

---

## 7. まとめ

### 7.1 推奨設定

| 環境 | Windows | Linux | 自動起動 |
|------|---------|-------|----------|
| 開発環境 | NSSM（オプション） | systemd（オプション） | 不要 |
| 本番環境 | NSSM | systemd | **必須** |

### 7.2 次のステップ

1. サービス登録完了後、OS再起動テスト
2. 自動起動確認
3. アクセステスト
4. ログ確認

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|------------|------|----------|--------|
| 1.0 | 2026/01/21 | 初版作成 | Claude Sonnet 4.5 |
