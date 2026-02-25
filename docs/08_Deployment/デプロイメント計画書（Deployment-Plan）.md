# デプロイメント計画書（Deployment Plan）
**プロジェクト**: Appsuite専用運用管理システム  
**作成日**: 2026-02-25  

## 1. デプロイメント環境

| 環境 | 用途 | サーバー | URL |
|------|------|---------|-----|
| 開発環境 | 開発・単体テスト | localhost | http://localhost:3000 |
| ステージング | 統合テスト・UAT | ステージングサーバー | https://staging-appsuite.example.com |
| 本番環境 | 本番稼働 | 本番サーバー | https://appsuite.example.com |

## 2. 本番環境要件
| 項目 | 要件 |
|------|------|
| OS | Ubuntu 22.04 LTS |
| Webサーバー | Nginx 1.24+ |
| SSL証明書 | Let's Encrypt（自動更新） |
| ディスク容量 | 最低 5GB |
| メモリ | 最低 2GB RAM |

## 3. デプロイ手順（Nginx）

### 3.1 Nginx設定
```nginx
server {
    listen 443 ssl http2;
    server_name appsuite.example.com;
    
    ssl_certificate /etc/letsencrypt/live/appsuite.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appsuite.example.com/privkey.pem;
    
    root /var/www/appsuite;
    index index.html;
    
    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com;";
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # キャッシュ設定
    location ~* \.(js|css|png|jpg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP→HTTPS リダイレクト
server {
    listen 80;
    server_name appsuite.example.com;
    return 301 https://$host$request_uri;
}
```

## 4. ロールバック手順
1. 現バージョンのバックアップ確認
2. 前バージョンのファイル復元: `cp -r /backup/appsuite_prev/* /var/www/appsuite/`
3. Nginx設定確認: `nginx -t`
4. Nginx再起動: `systemctl reload nginx`
5. 動作確認後、インシデント記録

## 5. デプロイ後確認チェックリスト
- [ ] HTTPS接続確認
- [ ] ログインページ表示確認
- [ ] 認証フロー動作確認
- [ ] 主要機能の画面確認
- [ ] エラーログ確認
- [ ] パフォーマンス確認（Lighthouse実行）
