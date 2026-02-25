# HTTPS設定手順書

**作成日**: 2026-02-11
**対象環境**: 本番環境（192.168.0.185:8443）
**SSL証明書**: 自己署名証明書（365日有効）

---

## 1. 概要

本番環境でHTTPSを有効化し、暗号化通信を実現します。

### 前提条件

- Nginxがインストール済み
- SSL証明書が生成済み（`ssl/prod-cert.pem`, `ssl/prod-key.pem`）
- ポート443（または8443）が開放済み

---

## 2. SSL証明書の確認

### 2.1 証明書ファイルの確認

```bash
ls -lh ssl/
# 以下のファイルが存在することを確認:
# - prod-cert.pem (約1.8KB)
# - prod-key.pem (約3.2KB)
```

### 2.2 証明書の内容確認

```bash
# 証明書の詳細表示
openssl x509 -in ssl/prod-cert.pem -text -noout

# 有効期限確認
openssl x509 -in ssl/prod-cert.pem -noout -dates
```

**期待される出力**:
```
notBefore=Feb 11 00:48:XX 2026 GMT
notAfter=Feb 11 00:48:XX 2027 GMT
```

---

## 3. Nginx設定

### 3.1 設定ファイルの配置

#### オプションA: Nginxシステムディレクトリに配置（推奨）

```bash
# 設定ファイルをコピー
sudo cp config/nginx/appsuite-itsm.conf /etc/nginx/sites-available/

# シンボリックリンクを作成
sudo ln -s /etc/nginx/sites-available/appsuite-itsm.conf /etc/nginx/sites-enabled/

# 設定をテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl restart nginx
```

#### オプションB: プロジェクトディレクトリから直接参照

```bash
# nginx.confに以下を追加:
# include /mnt/LinuxHDD/Appsuite-ITSM-Management/config/nginx/appsuite-itsm.conf;

sudo systemctl restart nginx
```

### 3.2 設定内容の確認

```bash
# 設定ファイルの構文チェック
sudo nginx -t

# 期待される出力:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

## 4. ファイアウォール設定

### 4.1 ポート開放（UFW使用の場合）

```bash
# HTTPS（443）を開放
sudo ufw allow 443/tcp
sudo ufw allow 8443/tcp  # カスタムポートの場合

# HTTP（80）も開放（HTTPSリダイレクト用）
sudo ufw allow 80/tcp

# 設定確認
sudo ufw status
```

### 4.2 ポート開放（iptables使用の場合）

```bash
# HTTPS（443）を開放
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8443 -j ACCEPT

# 設定を永続化
sudo iptables-save > /etc/iptables/rules.v4
```

---

## 5. 動作確認

### 5.1 HTTPS接続テスト

```bash
# ローカルからHTTPS接続テスト
curl -k https://192.168.0.185:443/

# カスタムポート（8443）の場合
curl -k https://192.168.0.185:8443/

# 期待される出力: index.htmlの内容
```

**注意**: `-k`オプションは自己署名証明書を許可します。

### 5.2 ブラウザからのアクセス

1. ブラウザで以下にアクセス:
   ```
   https://192.168.0.185:443/
   ```

2. 自己署名証明書の警告が表示される:
   - **Chrome**: 「この接続ではプライバシーが保護されません」
   - **Firefox**: 「警告: 潜在的なセキュリティリスクあり」
   - **Edge**: 「接続がプライベートではありません」

3. 警告を承認して続行:
   - Chrome: 「詳細設定」→「192.168.0.185にアクセスする（安全ではありません）」
   - Firefox: 「詳細情報」→「危険性を承知で続行」
   - Edge: 「詳細情報」→「Webページへ移動（非推奨）」

4. AppSuite ITSM管理システムのログイン画面が表示されることを確認

### 5.3 HTTPSリダイレクトの確認

```bash
# HTTPアクセスがHTTPSにリダイレクトされるか確認
curl -I http://192.168.0.185:80/

# 期待される出力:
# HTTP/1.1 301 Moved Permanently
# Location: https://192.168.0.185/
```

---

## 6. セキュリティヘッダーの確認

```bash
# セキュリティヘッダーが設定されているか確認
curl -k -I https://192.168.0.185:443/ | grep -E "Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options"

# 期待される出力:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'; ...
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
```

---

## 7. トラブルシューティング

### 7.1 Nginx起動失敗

**問題**: `nginx -t` でエラー

**原因**: 設定ファイルの構文エラー

**解決策**:
```bash
# エラーログ確認
sudo tail -20 /var/log/nginx/error.log

# 設定ファイルの構文チェック
sudo nginx -t -c /etc/nginx/nginx.conf
```

### 7.2 SSL証明書エラー

**問題**: `SSL: error:0200100D:system library:fopen:Permission denied`

**原因**: 証明書ファイルの権限不足

**解決策**:
```bash
# 証明書ファイルの権限確認
ls -l ssl/prod-*.pem

# 権限修正（必要に応じて）
chmod 644 ssl/prod-cert.pem
chmod 600 ssl/prod-key.pem
```

### 7.3 ポート443がすでに使用中

**問題**: `bind() to 0.0.0.0:443 failed`

**原因**: 他のプロセスがポート443を使用中

**解決策**:
```bash
# ポート443を使用中のプロセス確認
sudo lsof -i :443

# 既存のNginxを停止
sudo systemctl stop nginx

# または別のポート（8443）を使用
# appsuite-itsm.conf の listen 443 を listen 8443 に変更
```

### 7.4 ブラウザで接続できない

**問題**: ブラウザでアクセスできない

**解決策**:
```bash
# Nginxステータス確認
sudo systemctl status nginx

# エラーログ確認
sudo tail -f /var/log/nginx/appsuite-itsm-error.log

# ファイアウォール確認
sudo ufw status
```

---

## 8. Let's Encrypt への移行（本番環境推奨）

自己署名証明書の代わりに、Let's Encryptの無料SSL証明書を使用することを推奨します。

### 8.1 Certbot インストール

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### 8.2 証明書取得

```bash
# Certbotで証明書を自動取得・設定
sudo certbot --nginx -d appsuite-itsm.example.com

# 自動更新の確認
sudo certbot renew --dry-run
```

### 8.3 自動更新設定

```bash
# cronで毎日証明書の自動更新を確認
sudo crontab -e

# 以下を追加:
# 0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 9. 本番稼働チェックリスト

- [ ] SSL証明書生成完了
- [ ] Nginx設定ファイル配置完了
- [ ] Nginx再起動成功
- [ ] ファイアウォール設定完了
- [ ] HTTPS接続テスト成功
- [ ] HTTPSリダイレクト確認
- [ ] セキュリティヘッダー確認
- [ ] ブラウザアクセステスト完了
- [ ] 運用マニュアル更新

---

## 10. 参考資料

- [Nginx公式ドキュメント](https://nginx.org/en/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt公式サイト](https://letsencrypt.org/)

---

**作成者**: Lead Agent
**承認者**: Ops Agent（承認待ち）
**実施予定**: Phase 5（2026-02-15）
