# システム概要設計（System Overview Design）
**プロジェクト**: Appsuite専用運用管理システム  
**バージョン**: 1.0  
**作成日**: 2026-02-25  

## 1. システム構成概要

```
[ブラウザ (HTML5 / JavaScript)]
        ↓ HTTPS
[Webサーバー (Apache / Nginx)]
        ↓
[静的ファイル (HTML/CSS/JS)]
        ↓ REST API
[DeskNet's Neo API Server]
        ↓
[DeskNet's Neo Database]
        
[ローカルストレージ (IndexedDB)]
← APIキー暗号化保存
← 設定データ永続化
```

## 2. モジュール構成

| モジュール名 | 担当機能 | 主要ファイル |
|------------|---------|------------|
| dashboard.js | ダッシュボード表示・統計計算 | dashboard.html, dashboard.js |
| user-management.js | ユーザーCRUD・権限管理 | users.html, users.js |
| app-management.js | アプリ情報管理・API連携 | apps.html, apps.js |
| incident.js | インシデントチケット管理 | incidents.html, incidents.js |
| change.js | 変更管理・承認ワークフロー | changes.html, changes.js |
| audit.js | 監査ログ記録・検索 | audit.html, audit.js |
| settings.js | システム設定管理 | settings.html, settings.js |
| api.js | DeskNet's Neo API通信共通処理 | api.js |
| auth.js | 認証・セッション管理 | auth.js |
| storage.js | IndexedDB操作共通処理 | storage.js |

## 3. データフロー

### 3.1 ダッシュボードデータ取得フロー
1. ページ読込時にapi.js経由でDeskNet's Neo APIを呼出
2. レスポンスをlocalStorage/IndexedDBにキャッシュ
3. Chart.jsでグラフ描画
4. 30秒ごとに自動更新

### 3.2 認証フロー
1. ログインページでID/PW入力
2. DeskNet's Neo認証APIで検証
3. セッショントークンをIndexedDBに暗号化保存
4. 全リクエストヘッダーにトークン付与
5. セッションタイムアウト時は自動ログアウト

## 4. 外部連携

| 連携先 | 連携方式 | 認証方式 | 用途 |
|--------|---------|---------|------|
| DeskNet's Neo API | REST API (JSON) | API Key + Bearer Token | ユーザー・アプリ情報取得 |
| SMTP Server | メール送信 | SMTP Auth | インシデント通知 |
