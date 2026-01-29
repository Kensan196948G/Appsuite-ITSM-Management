# Phase 2: システムアーキテクチャ設計書

**文書番号**: ARCH-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年1月21日
**Phase**: Phase 2 - 基本設計
**ステータス**: ✅ レビュー待ち

---

## 📋 文書管理情報

| 項目 | 内容 |
|------|------|
| プロジェクト名 | AppSuite ITSM Management System |
| 作成者 | アーキテクトチーム |
| レビュアー | 技術リーダー、IT管理者 |
| 承認者 | IT部門マネージャー |
| 配布先 | 開発チーム、プロジェクトメンバー |
| 機密区分 | 社内限定 |

---

## 📖 目次

1. [アーキテクチャ概要](#1-アーキテクチャ概要)
2. [アーキテクチャパターン](#2-アーキテクチャパターン)
3. [レイヤー構成](#3-レイヤー構成)
4. [モジュール設計](#4-モジュール設計)
5. [データフロー](#5-データフロー)
6. [技術スタック](#6-技術スタック)
7. [開発環境・本番環境](#7-開発環境本番環境)
8. [拡張性と保守性](#8-拡張性と保守性)

---

## 1. アーキテクチャ概要

### 1.1 設計方針

本システムは、**クライアントサイド完結型のSPA（シングルページアプリケーション）**として設計します。

**主要な設計原則**:
1. **シンプルさ**: サーバーサイド処理を持たず、ブラウザ内で完結
2. **モジュール性**: 機能ごとに独立したモジュール構成
3. **保守性**: 明確な責任分離と可読性の高いコード
4. **拡張性**: 将来的な機能追加を容易にする設計
5. **セキュリティ**: XSS対策、入力バリデーション、アクセス制御

### 1.2 アーキテクチャ特性

| 特性 | 説明 | 実現方法 |
|------|------|---------|
| **可用性** | ネットワーク障害時もオフラインで動作 | localStorage、静的ファイル配信 |
| **パフォーマンス** | 高速な画面遷移 | SPAによるページリロード不要 |
| **スケーラビリティ** | 水平スケール可能 | 静的ファイルのCDN配信対応 |
| **セキュリティ** | 安全なデータ管理 | XSS対策、入力検証、HTTPS |
| **保守性** | メンテナンスしやすいコード | モジュール分離、コメント |

---

## 2. アーキテクチャパターン

### 2.1 採用パターン: レイヤードアーキテクチャ + モジュールパターン

```
┌──────────────────────────────────────────────────────┐
│                Presentation Layer                    │
│           (UI Components & Event Handlers)           │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│              Application Layer                       │
│         (Business Logic & Modules)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │UserModule  │  │AppModule   │  │IncModule   │    │
│  ├────────────┤  ├────────────┤  ├────────────┤    │
│  │ChangeModule│  │LogModule   │  │SettModule  │    │
│  └────────────┘  └────────────┘  └────────────┘    │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│               Data Access Layer                      │
│          (localStorage Manager)                      │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│                Data Store Layer                      │
│                (localStorage)                        │
└──────────────────────────────────────────────────────┘
```

### 2.2 パターンの選択理由

| パターン | 理由 |
|---------|------|
| **レイヤードアーキテクチャ** | 責任の明確な分離、テストしやすさ、保守性 |
| **モジュールパターン** | 機能の独立性、名前空間の汚染防止 |
| **SPA（Single Page Application）** | 高速なUI、ネイティブアプリに近いUX |

---

## 3. レイヤー構成

### 3.1 Presentation Layer（プレゼンテーション層）

**責務**: ユーザーとの対話、UI表示、イベントハンドリング

#### 構成要素
```javascript
// app.js - メインアプリケーションロジック
class App {
  constructor() {
    this.currentView = 'dashboard';
    this.currentUser = null;
  }

  // ルーティング
  navigate(view) { }

  // 画面レンダリング
  render() { }

  // イベント登録
  attachEventListeners() { }
}
```

**主要機能**:
- ルーティング（画面遷移制御）
- テンプレートレンダリング
- イベントハンドリング
- ユーザー入力の検証（クライアント側）

---

### 3.2 Application Layer（アプリケーション層）

**責務**: ビジネスロジック、データ処理、バリデーション

#### モジュール構成
```javascript
// modules.js

// ユーザー管理モジュール
const UserModule = {
  getAll() { },
  getById(id) { },
  create(userData) { },
  update(id, userData) { },
  delete(id) { },
  validate(userData) { },
  search(query) { }
};

// アプリ管理モジュール
const AppModule = {
  // 同様のCRUD操作
};

// インシデント管理モジュール
const IncidentModule = {
  // CRUD + ステータス管理
  changeStatus(id, status) { },
  assignTo(id, userId) { }
};

// 変更管理モジュール
const ChangeModule = {
  // CRUD + 承認フロー
  approve(id, approverId, comment) { },
  reject(id, approverId, reason) { }
};

// 監査ログモジュール
const LogModule = {
  log(action, target, details) { },
  search(filters) { }
};

// システム設定モジュール
const SettingsModule = {
  get(key) { },
  set(key, value) { }
};
```

**主要機能**:
- データのCRUD操作
- ビジネスルールの適用
- データ検証・バリデーション
- データ変換・フォーマット

---

### 3.3 Data Access Layer（データアクセス層）

**責務**: データの永続化、CRUD操作の抽象化

```javascript
// localStorage Manager

const DataStore = {
  // 読み取り
  read(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('DataStore read error:', error);
      return null;
    }
  },

  // 書き込み
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('DataStore write error:', error);
      return false;
    }
  },

  // 削除
  remove(key) {
    localStorage.removeItem(key);
  },

  // 全データクリア
  clear() {
    // システムキーのみクリア
    const keys = ['appsuite_users', 'appsuite_apps',
                  'appsuite_incidents', 'appsuite_changes',
                  'appsuite_logs', 'appsuite_settings'];
    keys.forEach(key => this.remove(key));
  }
};
```

**主要機能**:
- localStorageの読み書き
- JSONシリアライズ/デシリアライズ
- エラーハンドリング
- トランザクション管理（簡易版）

---

### 3.4 Data Store Layer（データストア層）

**責備**: データの物理的な保存

**使用技術**: localStorage API

**データキー**:
- `appsuite_users`: ユーザー情報
- `appsuite_apps`: アプリ情報
- `appsuite_incidents`: インシデント情報
- `appsuite_changes`: 変更要求情報
- `appsuite_logs`: 監査ログ
- `appsuite_settings`: システム設定

---

## 4. モジュール設計

### 4.1 モジュール一覧

| モジュール名 | ファイル | 責務 | 依存関係 |
|------------|---------|------|---------|
| **App** | app.js | アプリケーション制御、ルーティング | 全モジュール |
| **UserModule** | modules.js | ユーザー管理 | DataStore |
| **AppModule** | modules.js | アプリ管理 | DataStore |
| **IncidentModule** | modules.js | インシデント管理 | DataStore, LogModule |
| **ChangeModule** | modules.js | 変更管理 | DataStore, LogModule |
| **LogModule** | modules.js | 監査ログ | DataStore |
| **SettingsModule** | modules.js | システム設定 | DataStore |
| **ApiClient** | api.js | 外部API連携（オプション） | SettingsModule |
| **DataStore** | modules.js | データアクセス | localStorage |

### 4.2 モジュール間の依存関係

```
         App (app.js)
          │
          ├─→ UserModule ────┐
          ├─→ AppModule  ────┤
          ├─→ IncidentModule ┼─→ LogModule
          ├─→ ChangeModule ──┤
          ├─→ LogModule ─────┤
          └─→ SettingsModule ┘
                              │
                              ▼
                          DataStore
                              │
                              ▼
                        localStorage
```

### 4.3 モジュールパターンの実装

```javascript
// モジュールパターン（IIFE + クロージャ）
const UserModule = (function() {
  // プライベート変数
  const STORAGE_KEY = 'appsuite_users';

  // プライベート関数
  function generateId() {
    const users = getAll();
    const maxId = users.length > 0
      ? Math.max(...users.map(u => parseInt(u.id.substring(1))))
      : 0;
    return `U${String(maxId + 1).padStart(4, '0')}`;
  }

  // パブリックAPI
  return {
    getAll() {
      return DataStore.read(STORAGE_KEY) || [];
    },

    getById(id) {
      const users = this.getAll();
      return users.find(u => u.id === id);
    },

    create(userData) {
      const users = this.getAll();
      const newUser = {
        id: generateId(),
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.push(newUser);
      DataStore.write(STORAGE_KEY, users);
      LogModule.log('CREATE', 'USER', newUser);
      return newUser;
    },

    // 他のメソッド...
  };
})();
```

---

## 5. データフロー

### 5.1 ユーザー操作からデータ更新までのフロー

```
┌──────────────┐
│ユーザー操作  │ (例: 「新規登録」ボタンクリック)
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│Event Handler         │ (Presentation Layer)
│- 入力値取得          │
│- クライアント検証    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│Module (Business Logic│ (Application Layer)
│- データ検証          │
│- ビジネスルール適用  │
│- ID自動採番          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│DataStore             │ (Data Access Layer)
│- JSONシリアライズ    │
│- localStorage書き込み│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│localStorage          │ (Data Store Layer)
│- データ永続化        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│LogModule             │ (監査ログ記録)
│- 操作記録            │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│UI更新                │ (Presentation Layer)
│- 成功メッセージ表示  │
│- 一覧画面再描画      │
└──────────────────────┘
```

### 5.2 データ読み取りフロー

```
┌──────────────┐
│ページ表示要求│
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│App.render()          │
│- ビュー特定          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│Module.getAll()       │
│- データ取得          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│DataStore.read()      │
│- localStorage読み取り│
│- JSONパース          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│データ整形・フィルタ  │
│- ページング          │
│- ソート              │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│HTML生成・描画        │
│- テンプレート適用    │
│- DOM更新             │
└──────────────────────┘
```

---

## 6. 技術スタック

### 6.1 フロントエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **HTML** | HTML5 | - | マークアップ |
| **CSS** | CSS3 + CSS Variables | - | スタイリング |
| **JavaScript** | Vanilla ES6+ | ES2015+ | アプリケーションロジック |
| **アイコン** | Font Awesome | 6.4.0 | UIアイコン |

### 6.2 データ管理

| 技術 | 用途 | 容量制限 |
|------|------|---------|
| **localStorage** | クライアントサイドストレージ | 5-10MB（ブラウザ依存） |

### 6.3 外部連携（オプション）

| API | 用途 | プロトコル |
|-----|------|-----------|
| **DeskNet's Neo API** | ユーザー・アプリ情報同期 | REST/HTTPS |

### 6.4 開発ツール

| ツール | 用途 |
|--------|------|
| **http-server** | 開発サーバー（Node.js） |
| **Git** | バージョン管理 |
| **Git Worktree** | 並列開発 |
| **Browser DevTools** | デバッグ |

---

## 7. 開発環境・本番環境

### 7.1 環境設定

| 項目 | 開発環境【開発】 | 本番環境【本番】 |
|------|---------------|---------------|
| **プロトコル** | HTTP | HTTPS (TLS 1.2+) |
| **ポート番号** | **3100（固定）** | **8443（固定）** |
| **ホスト** | localhost | localhost |
| **LAN IP** | 172.23.10.109 | 172.23.10.109 |
| **URL** | http://localhost:3100<br>http://172.23.10.109:3100 | https://localhost:8443<br>https://172.23.10.109:8443 |
| **SSL証明書** | 不要 | 自己署名証明書 |
| **サンプルデータ** | 有効 | 無効 |
| **デバッグ** | 有効 | 無効 |
| **キャッシュ** | 無効 | 有効（86400秒） |
| **CORS** | 有効（*） | 制限あり |

**⚠️ 重要**: ポート番号は**開発途中で変更しません**。他のプロジェクトとの重複を避けるため、これらのポートは本プロジェクト専用です。

### 7.2 環境分離の実装

#### ディレクトリ構造
```
Appsuite-ITSM-Management/
├── WebUI-Sample/        # 開発環境
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       ├── modules.js
│       └── api.js
│
└── WebUI-Production/    # 本番環境
    ├── index.html       (サンプルデータ無効版)
    ├── css/styles.css   (圧縮版)
    └── js/
        ├── app.js       (デバッグ無効版)
        ├── modules.js
        └── api.js
```

#### 環境判定
```javascript
// 環境判定ロジック
const ENV = {
  isDevelopment: () => window.location.port === '3100',
  isProduction: () => window.location.port === '8443',

  // デバッグログ
  log(...args) {
    if (this.isDevelopment()) {
      console.log(...args);
    }
  }
};
```

---

## 8. 拡張性と保守性

### 8.1 拡張性の確保

#### 8.1.1 新機能追加のしやすさ
```javascript
// 新しいモジュールの追加例
const ReportModule = (function() {
  return {
    generateIncidentReport(startDate, endDate) {
      const incidents = IncidentModule.getAll();
      // レポート生成ロジック
    }
  };
})();
```

#### 8.1.2 外部システム連携の拡張
```javascript
// api.js - 新しいAPI追加
const ApiClient = {
  // DeskNet's Neo API
  desknet: { /* 既存 */ },

  // 新しいAPI追加例
  slack: {
    sendNotification(message) {
      // Slack通知実装
    }
  }
};
```

### 8.2 保守性の確保

#### 8.2.1 コーディング規約
- **命名規則**: camelCase（変数・関数）、PascalCase（クラス）
- **コメント**: JSDoc形式のコメント
- **ファイル構成**: 機能ごとにモジュール分離
- **エラーハンドリング**: try-catchの統一的な使用

#### 8.2.2 ドキュメント
- **コードコメント**: 複雑なロジックには詳細コメント
- **README**: 各ディレクトリにREADME.md
- **設計書**: 本ドキュメント + 詳細設計書

#### 8.2.3 テスト容易性
```javascript
// モジュールは独立してテスト可能
describe('UserModule', () => {
  it('should create a new user', () => {
    const userData = { username: 'test', email: 'test@example.com' };
    const user = UserModule.create(userData);
    expect(user.id).toMatch(/^U\d{4}$/);
  });
});
```

---

## 📊 アーキテクチャ評価

### 長所

| 項目 | 説明 |
|------|------|
| **シンプル** | サーバーレス、デプロイが容易 |
| **高速** | ページリロード不要、ローカルデータアクセス |
| **オフライン対応** | ネットワーク不要で動作可能 |
| **コスト効率** | サーバー運用コスト不要 |
| **セキュリティ** | サーバー攻撃のリスクなし |

### 短所と対策

| 短所 | 対策 |
|------|------|
| **データ容量制限** | 10,000件上限、古いログ自動削除 |
| **データ共有不可** | 将来的にサーバー連携を検討 |
| **JavaScript無効環境** | 警告メッセージ表示、対象外とする |

---

## ✅ レビューチェックリスト

- [ ] アーキテクチャパターンが適切
- [ ] レイヤー分離が明確
- [ ] モジュール設計が合理的
- [ ] データフローが理解しやすい
- [ ] 技術スタックが要件を満たす
- [ ] 拡張性が確保されている
- [ ] 保守性が確保されている
- [ ] 技術リーダーレビュー完了
- [ ] ステークホルダー承認

---

**承認**:
- システムアーキテクト: _________________ 日付: _______
- 技術リーダー: _________________ 日付: _______
- IT部門マネージャー: _________________ 日付: _______

---

**次のステップ**: データベース設計書作成
