# デプロイメント仕様書（Deployment Specification）

**ドキュメントID:** WUI-DEPLOY-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. 環境定義

### 1.1 環境一覧

| 環境 | 目的 | URL | 更新タイミング |
|------|------|-----|------------|
| development | 開発・動作確認 | http://localhost:5173 | 手動 |
| staging | QA・UAT | https://staging.example.com | PR マージ時（main） |
| production | 本番 | https://app.example.com | タグ付け時（v*.*.*） |

### 1.2 環境変数管理

| 変数 | development | staging | production |
|------|------------|---------|-----------|
| `VITE_APP_ENV` | development | staging | production |
| `VITE_API_BASE_URL` | http://localhost:3000/api/v1 | https://api-stg.example.com/v1 | https://api.example.com/v1 |
| `VITE_SENTRY_DSN` | 未設定 | 設定 | 設定 |

---

## 2. ビルド仕様

### 2.1 ビルドコマンド

```bash
# 本番ビルド
npm run build

# ビルド出力確認
npm run preview
```

### 2.2 ビルド設定（vite.config.ts）

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,        // 本番: false（セキュリティ）、staging: true
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // console.log 除去
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // コンテンツハッシュ付きファイル名（キャッシュバスティング）
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
```

### 2.3 ビルド成果物

```
dist/
├── index.html           # エントリーHTML
├── assets/
│   ├── main-[hash].js   # メインバンドル
│   ├── vendor-[hash].js # ベンダーバンドル
│   ├── *.css            # スタイルシート
│   └── *.png/svg        # 静的アセット
└── favicon.ico
```

---

## 3. Docker コンテナ化

### 3.1 フロントエンド Dockerfile

```dockerfile
# ---- ビルドステージ ----
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false

COPY . .
RUN npm run build

# ---- 実行ステージ ----
FROM nginx:1.25-alpine AS production

# カスタム Nginx 設定
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ビルド成果物をコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# 非rootユーザーで実行
RUN addgroup -g 1001 -S nginx-group && \
    adduser -u 1001 -S nginx-user -G nginx-group
USER nginx-user

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### 3.2 Nginx 設定

```nginx
# nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA ルーティング（history API フォールバック）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静的アセット（長期キャッシュ）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
        gzip_static on;
    }

    # ヘルスチェック
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    # セキュリティヘッダー
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## 4. CI/CD パイプライン

### 4.1 GitHub Actions ワークフロー

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]         # staging
    tags: ['v*.*.*']          # production
  pull_request:
    branches: [main]         # PR チェック

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/frontend

jobs:
  # ── テスト ────────────────────────────────────────────
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:run -- --coverage
      - name: E2E Tests
        run: |
          npx playwright install --with-deps chromium
          npm run test:e2e

  # ── ビルド・プッシュ ──────────────────────────────────
  build:
    needs: test
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha,prefix=,suffix=,format=short
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ── Staging デプロイ ──────────────────────────────────
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster staging-cluster \
            --service frontend-service \
            --force-new-deployment

  # ── Production デプロイ ───────────────────────────────
  deploy-production:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster production-cluster \
            --service frontend-service \
            --force-new-deployment
      - name: Create GitHub Release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
```

---

## 5. デプロイ手順（手動）

### 5.1 通常リリース手順

```bash
# 1. 最新の main ブランチをチェックアウト
git checkout main && git pull origin main

# 2. バージョンタグ作成
git tag -a v1.2.0 -m "Release v1.2.0: 新機能追加"
git push origin v1.2.0

# 3. CI/CD パイプラインの完了を確認
# GitHub Actions の production デプロイジョブが成功することを確認

# 4. 本番環境での動作確認
# https://app.example.com にアクセスして主要機能を確認
```

### 5.2 緊急デプロイ（ホットフィックス）

```bash
# 1. main から hotfix ブランチ作成
git checkout -b hotfix/critical-bug main

# 2. 修正実装・コミット
git commit -m "fix: 緊急修正の内容"

# 3. main にマージ
git checkout main
git merge hotfix/critical-bug

# 4. タグ付け・プッシュ
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin main v1.2.1
```

---

## 6. ロールバック手順

### 6.1 自動ロールバック条件

- デプロイ後5分以内にヘルスチェック失敗が続く場合
- エラー率が5%を超える場合

### 6.2 手動ロールバック

```bash
# ECS タスク定義の以前のリビジョンに戻す
aws ecs update-service \
  --cluster production-cluster \
  --service frontend-service \
  --task-definition frontend-task:PREVIOUS_REVISION

# または 以前のイメージタグを指定
aws ecs update-service \
  --cluster production-cluster \
  --service frontend-service \
  --task-definition "$(aws ecs describe-task-definition \
    --task-definition frontend-task \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)"
```

---

## 7. デプロイ後確認チェックリスト

### 7.1 基本動作確認

- [ ] ログイン画面が表示される
- [ ] ログインが正常に完了する
- [ ] ダッシュボードが表示される
- [ ] データ一覧が取得できる
- [ ] データ作成・編集・削除が動作する

### 7.2 パフォーマンス確認

- [ ] Lighthouse スコアが目標値以上
- [ ] API レスポンス時間が正常範囲内

### 7.3 エラー監視確認

- [ ] Sentry にエラーが急増していない
- [ ] CloudWatch ログにエラーがない
- [ ] アラートが発報していない

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
