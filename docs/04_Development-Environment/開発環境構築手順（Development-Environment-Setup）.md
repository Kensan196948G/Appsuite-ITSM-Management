# 開発環境構築手順（Development Environment Setup）
**プロジェクト**: Appsuite専用運用管理システム  
**作成日**: 2026-02-25  

## 1. 前提条件
| ソフトウェア | バージョン | 用途 |
|------------|----------|------|
| Node.js | 18.x 以上 | 開発サーバー（http-server） |
| npm | 9.x 以上 | パッケージ管理 |
| Git | 2.x 以上 | バージョン管理 |
| VSCode | 最新版 | 推奨エディタ |
| Chrome / Edge | 最新版 | 開発・デバッグ |

## 2. セットアップ手順

### 2.1 リポジトリクローン
```bash
git clone <repository-url>
cd Appsuite-Management-Sample
```

### 2.2 依存パッケージインストール
```bash
npm install
```

### 2.3 開発サーバー起動
```bash
npm run dev
# または
npx http-server src/ -p 3000 --cors
```

### 2.4 ブラウザでアクセス
```
http://localhost:3000
```

## 3. 環境変数設定
開発環境用に `.env.development` を作成:
```env
API_BASE_URL=https://your-desknet-instance.com/api
API_KEY=your-development-api-key
SESSION_TIMEOUT=28800
DEBUG_MODE=true
```

## 4. VSCode推奨拡張機能
| 拡張機能 | 用途 |
|---------|------|
| ESLint | JavaScript静的解析 |
| Prettier | コードフォーマット |
| Live Server | ホットリロード開発サーバー |
| GitLens | Git操作強化 |
| REST Client | API動作確認 |

## 5. ブランチ戦略
```
main          ← 本番リリースブランチ
develop       ← 開発統合ブランチ
feature/xxx   ← 機能開発ブランチ
hotfix/xxx    ← 緊急修正ブランチ
release/x.x.x ← リリース準備ブランチ
```

## 6. コミットメッセージ規約
```
feat:     新機能追加
fix:      バグ修正
docs:     ドキュメント更新
style:    コードスタイル変更（機能変更なし）
refactor: リファクタリング
test:     テストコード追加・修正
chore:    ビルド設定・依存関係更新
```
