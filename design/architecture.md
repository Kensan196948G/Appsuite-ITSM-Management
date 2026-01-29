# アーキテクチャ設計書

## ドキュメント情報

| 項目 | 値 |
|------|-----|
| プロジェクト名 | AppSuite ITSM管理システム |
| バージョン | 1.0.0 |
| 作成日 | 2026-01-29 |
| 作成者 | Arch Reviewer Agent |
| ステータス | Draft |

## 1. システムアーキテクチャ

### 1.1 全体構成図

```
┌─────────────────────────────────────────────────────────────────────┐
│                         クライアント環境                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Web Browser                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │                    index.html (SPA)                      │  │  │
│  │  │  ┌──────────┬──────────┬──────────┬──────────────────┐  │  │  │
│  │  │  │ app.js   │auth.js   │modules.js│ dashboard.js     │  │  │  │
│  │  │  ├──────────┼──────────┼──────────┼──────────────────┤  │  │  │
│  │  │  │security.js│utils.js │api.js    │ components.js    │  │  │  │
│  │  │  └──────────┴──────────┴──────────┴──────────────────┘  │  │  │
│  │  │               ▲                                          │  │  │
│  │  │               │ DOM操作・イベント                         │  │  │
│  │  │  ┌──────────────────────────────────────────────────┐   │  │  │
│  │  │  │              styles.css                           │   │  │  │
│  │  │  └──────────────────────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                          │                                     │  │
│  │                          ▼                                     │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │                    localStorage                          │  │  │
│  │  │   users | apps | incidents | changes | logs | settings   │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                               │                                      │
│                               ▼ (オプション: Fetch API)              │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │       DeskNet's Neo REST API        │
              │    (外部連携・データ同期)             │
              └─────────────────────────────────────┘
```

### 1.2 レイヤー構成

```
┌─────────────────────────────────────────────────────────┐
│                 プレゼンテーション層                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │  index.html  │  styles.css  │  components.js       ││
│  │  (構造)        (スタイル)      (UIコンポーネント)    ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                  アプリケーション層                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │  app.js      │  auth.js     │  dashboard.js        ││
│  │  (初期化)      (認証)          (ダッシュボード)       ││
│  ├─────────────────────────────────────────────────────┤│
│  │  modules.js (ビジネスロジック)                       ││
│  │  UserModule | AppModule | IncidentModule | ...      ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                    インフラ層                            │
│  ┌─────────────────────────────────────────────────────┐│
│  │  api.js (データアクセス・API連携)                    ││
│  │  DataStore | ApiClient | ApiSync                    ││
│  ├─────────────────────────────────────────────────────┤│
│  │  security.js │  utils.js                            ││
│  │  (セキュリティ)  (ユーティリティ)                     ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 2. モジュール構成

### 2.1 モジュール一覧

| モジュール | ファイル | 行数 | 責務 |
|-----------|---------|------|------|
| Main | app.js | 250 | アプリケーション初期化・ナビゲーション |
| Auth | auth.js | 601 | 認証・セッション・権限管理 |
| Dashboard | dashboard.js | 1,020 | ダッシュボード・グラフ管理 |
| Modules | modules.js | 1,466 | ビジネスロジック（6モジュール） |
| API | api.js | 537 | データアクセス・外部連携 |
| Security | security.js | 491 | セキュリティ・バリデーション |
| Utils | utils.js | 543 | ユーティリティ関数 |
| Components | components.js | 549 | 共通UIコンポーネント |

### 2.2 依存関係図

```
app.js
  ├─▶ auth.js
  │     └─▶ security.js
  ├─▶ dashboard.js
  │     └─▶ api.js (DataStore)
  ├─▶ modules.js
  │     ├─▶ api.js (DataStore)
  │     ├─▶ components.js
  │     └─▶ utils.js
  └─▶ components.js
        └─▶ utils.js (escapeHtml)
```

## 3. データモデル

### 3.1 エンティティ関連図

```
┌─────────────┐       ┌─────────────┐
│   users     │       │    apps     │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ username    │       │ name        │
│ email       │       │ category    │
│ department  │       │ creator     │
│ role        │       │ records     │
│ status      │       │ status      │
│ lastLogin   │       │ description │
│ passwordHash│       └──────┬──────┘
└──────┬──────┘              │
       │                     │
       │    ┌────────────────┴────────────────┐
       │    │                                  │
       ▼    ▼                                  ▼
┌─────────────────┐                ┌─────────────────┐
│   incidents     │                │    changes      │
├─────────────────┤                ├─────────────────┤
│ id (PK)         │                │ id (PK)         │
│ title           │                │ title           │
│ appId (FK)      │                │ appId (FK)      │
│ priority        │                │ type            │
│ status          │                │ status          │
│ reporter (FK)   │                │ requester (FK)  │
│ assignee (FK)   │                │ approver (FK)   │
│ created         │                │ scheduledDate   │
│ description     │                │ description     │
└─────────────────┘                └─────────────────┘
       │                                  │
       │                                  │
       ▼                                  ▼
┌─────────────────────────────────────────────────────┐
│                       logs                           │
├─────────────────────────────────────────────────────┤
│ id (PK) │ timestamp │ userId (FK) │ action │ target │
└─────────────────────────────────────────────────────┘
```

### 3.2 localStorageキー

| キー | 型 | 説明 |
|------|-----|------|
| appsuite_users | Array | ユーザーデータ |
| appsuite_apps | Array | アプリデータ |
| appsuite_incidents | Array | インシデントデータ |
| appsuite_changes | Array | 変更要求データ |
| appsuite_logs | Array | 監査ログ |
| appsuiteSettings | Object | システム設定 |
| appsuite_api_config | Object | API接続設定 |
| appsuite_session | Object | セッション情報 |

## 4. 設計パターン

### 4.1 採用パターン

| パターン | 適用箇所 | 目的 |
|---------|---------|------|
| Module Pattern | 各Moduleオブジェクト | カプセル化・名前空間分離 |
| Singleton | DataStore, AuthModule | 単一インスタンス保証 |
| Observer | イベントリスナー | 疎結合なイベント通知 |
| Repository | DataStore | データアクセス抽象化 |
| Factory | IdUtils | ID生成の統一 |
| Strategy | 認証方式 | 複数認証方式対応 |
| Facade | showToast, openModal | 複雑な処理の簡略化 |

### 4.2 コード例

```javascript
// Module Pattern
const UserModule = {
    refresh() { ... },
    render(users) { ... },
    add() { ... },
    edit(id) { ... },
    delete(id) { ... }
};

// Repository Pattern
const DataStore = {
    users: [],
    create(collection, item) { ... },
    update(collection, id, data) { ... },
    delete(collection, id) { ... },
    save(collection) { ... }
};

// Singleton Pattern
const AuthModule = {
    currentSession: null,
    isAuthenticated() { return !!this.currentSession; },
    login(username, password) { ... },
    logout() { ... }
};
```

## 5. セキュリティアーキテクチャ

### 5.1 認証フロー

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│ ログイン │────▶│ パスワード  │────▶│ セッション  │
│ フォーム │     │ 検証        │     │ 作成        │
└─────────┘     └─────────────┘     └─────────────┘
                      │                    │
                      ▼                    ▼
                ┌─────────────┐     ┌─────────────┐
                │ ロックアウト │     │sessionStorage│
                │ チェック     │     │ 保存         │
                └─────────────┘     └─────────────┘
```

### 5.2 セキュリティ対策

| 対策 | 実装箇所 | 詳細 |
|------|---------|------|
| XSS防止 | security.js | escapeHtml関数 |
| パスワードハッシュ | auth.js | SHA-256 |
| セッション管理 | auth.js | sessionStorage + タイムアウト |
| ブルートフォース対策 | auth.js | 5回失敗で15分ロック |
| 入力検証 | security.js | Validator オブジェクト |

## 6. 拡張性考慮

### 6.1 将来拡張ポイント

| 拡張項目 | 現状 | 拡張方法 |
|---------|------|---------|
| サーバーサイド化 | localStorage | REST API + DB |
| 認証強化 | 独自認証 | SAML/OAuth統合 |
| 通知機能 | トーストのみ | WebSocket + プッシュ |
| マルチ言語 | 日本語のみ | i18nライブラリ導入 |
| テーマ | ダーク/ライト | CSS変数拡張 |

### 6.2 モジュール追加ガイド

新規モジュール追加時のテンプレート:

```javascript
const NewModule = {
    // 必須メソッド
    refresh() {
        const data = DataStore.newEntity;
        this.render(data);
    },

    render(items) {
        // テーブルレンダリング
    },

    showAddModal() {
        // 新規追加モーダル
    },

    add() {
        // データ追加
        LogModule.addLog('create', '対象', 'タイプ', '詳細');
        updateDashboard();
    },

    edit(id) {
        // 編集モーダル
    },

    save(id) {
        // データ更新
        LogModule.addLog('update', '対象', 'タイプ', '詳細');
    },

    delete(id) {
        // データ削除
        LogModule.addLog('delete', '対象', 'タイプ', '詳細');
        updateDashboard();
    }
};
```

## 7. 制約と判断

### 7.1 アーキテクチャ判断記録 (ADR)

| ID | 判断 | 理由 | 代替案 |
|----|------|------|--------|
| ADR-001 | Vanilla JS採用 | 軽量・依存排除 | React/Vue.js |
| ADR-002 | localStorage使用 | サーバーレス運用 | IndexedDB |
| ADR-003 | SPA構成 | UX向上 | MPA |
| ADR-004 | CDN利用 | 簡易デプロイ | npm bundle |

### 7.2 技術的負債

| 項目 | 影響 | 対応優先度 |
|------|------|-----------|
| グローバル関数 | 名前衝突リスク | 中 |
| 型チェックなし | 実行時エラーリスク | 低 |
| テスト不足 | リグレッションリスク | 高 |

---

レビューステータス: **Draft - arch-reviewerによるレビュー待ち**
