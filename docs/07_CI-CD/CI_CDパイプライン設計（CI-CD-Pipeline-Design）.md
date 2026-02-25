# CI/CDパイプライン設計（CI/CD Pipeline Design）
**プロジェクト**: Appsuite専用運用管理システム  
**作成日**: 2026-02-25  

## 1. パイプライン概要
GitHub Actions を使用したCI/CDパイプラインを構築する。

## 2. ワークフロー定義

### 2.1 CI（継続的インテグレーション）
トリガー: `main`, `develop` ブランチへのPush / PR

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 2.2 CD（継続的デプロイメント）
トリガー: `main` ブランチへのマージ（CIパス後）

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: [lint, test, e2e]
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Production
        run: |
          rsync -avz --delete src/ user@server:/var/www/appsuite/
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
```

## 3. 品質ゲート
| チェック項目 | 閾値 | 失敗時の処理 |
|-----------|------|------------|
| ESLintエラー | 0件 | CIブロック |
| 単体テスト | 全件パス | CIブロック |
| カバレッジ | 80%以上 | 警告（ブロックなし） |
| E2Eテスト | 全件パス | CIブロック |
| セキュリティスキャン | 高リスク0件 | CIブロック |
