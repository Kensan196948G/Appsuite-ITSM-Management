# Phase 2: データベース設計書（localStorage）

**文書番号**: DB-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年1月21日
**Phase**: Phase 2 - 基本設計
**ステータス**: ✅ レビュー待ち

---

## 📋 目次

1. [設計概要](#1-設計概要)
2. [エンティティ定義](#2-エンティティ定義)
3. [データストア構造](#3-データストア構造)
4. [インデックス戦略](#4-インデックス戦略)
5. [データ整合性](#5-データ整合性)
6. [容量管理](#6-容量管理)
7. [マイグレーション](#7-マイグレーション)

---

## 1. 設計概要

### 1.1 データストア選択理由

**localStorage**を採用する理由：
- ✅ サーバーレスで動作可能
- ✅ オフライン対応
- ✅ 高速なデータアクセス
- ✅ 実装がシンプル
- ⚠️ 容量制限（5-10MB）あり

### 1.2 設計方針

| 方針 | 説明 |
|------|------|
| **正規化** | 適度な正規化（第3正規形）でデータ重複を最小化 |
| **参照整合性** | アプリケーション層で整合性を保証 |
| **ID戦略** | プレフィックス付き連番（例: U0001, A0001） |
| **日時管理** | ISO 8601形式（例: 2026-01-21T10:00:00.000Z） |
| **削除方式** | 物理削除（論理削除は容量制限により不採用） |

---

## 2. エンティティ定義

### 2.1 users（ユーザー）

**localStorageキー**: `appsuite_users`

#### スキーマ定義

```typescript
interface User {
  // 主キー
  id: string;              // "U0001", "U0002", ... (自動採番)

  // 基本情報
  username: string;        // ユーザー名 (2-50文字)
  email: string;           // メールアドレス (RFC準拠、UNIQUE)
  passwordHash: string;    // パスワードハッシュ (bcrypt)

  // 組織情報
  department: string;      // 部署名 (1-100文字)
  role: 'admin' | 'user';  // 権限

  // ステータス
  status: 'active' | 'inactive';  // アカウント状態

  // メタ情報
  lastLogin: string | null;       // 最終ログイン日時 (ISO 8601)
  createdAt: string;              // 作成日時 (ISO 8601)
  updatedAt: string;              // 更新日時 (ISO 8601)
}
```

#### サンプルデータ

```json
{
  "id": "U0001",
  "username": "田中太郎",
  "email": "tanaka@example.com",
  "passwordHash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "department": "IT管理部",
  "role": "admin",
  "status": "active",
  "lastLogin": "2026-01-21T09:00:00.000Z",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-21T09:00:00.000Z"
}
```

#### 制約

| 項目 | 制約 |
|------|------|
| **id** | 必須、一意、"U" + 4桁連番 |
| **username** | 必須、2-50文字 |
| **email** | 必須、一意、RFC準拠 |
| **passwordHash** | 必須、bcryptハッシュ |
| **department** | 必須、1-100文字 |
| **role** | 必須、'admin' または 'user' |
| **status** | 必須、デフォルト'active' |

---

### 2.2 apps（アプリケーション）

**localStorageキー**: `appsuite_apps`

#### スキーマ定義

```typescript
interface App {
  // 主キー
  id: string;              // "A0001", "A0002", ... (自動採番)

  // 基本情報
  name: string;            // アプリ名 (1-100文字)
  description: string;     // 説明 (0-500文字)
  category: string;        // カテゴリ

  // 統計情報
  recordCount: number;     // レコード数

  // 関連情報
  creator: string;         // 作成者のユーザーID (FK: users.id)

  // ステータス
  status: 'active' | 'maintenance' | 'inactive';

  // メタ情報
  createdAt: string;       // 作成日時 (ISO 8601)
  updatedAt: string;       // 更新日時 (ISO 8601)
}
```

#### サンプルデータ

```json
{
  "id": "A0001",
  "name": "経費精算システム",
  "description": "社員の経費申請・承認を管理するアプリ",
  "category": "財務",
  "recordCount": 1523,
  "creator": "U0001",
  "status": "active",
  "createdAt": "2025-06-01T00:00:00.000Z",
  "updatedAt": "2026-01-20T15:30:00.000Z"
}
```

#### 制約

| 項目 | 制約 |
|------|------|
| **id** | 必須、一意、"A" + 4桁連番 |
| **name** | 必須、1-100文字 |
| **category** | 必須、選択肢から選択 |
| **creator** | 必須、外部キー（users.id） |
| **recordCount** | 必須、0以上の整数 |
| **status** | 必須、デフォルト'active' |

---

### 2.3 incidents（インシデント）

**localStorageキー**: `appsuite_incidents`

#### スキーマ定義

```typescript
interface Incident {
  // 主キー
  id: string;              // "INC-20260121-001" (日付ベース連番)

  // 基本情報
  title: string;           // タイトル (1-100文字)
  description: string;     // 詳細説明 (1-2000文字)

  // 分類
  appId: string;           // 関連アプリID (FK: apps.id)
  category: 'hardware' | 'software' | 'network' | 'other';
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

  // ステータス
  status: 'new' | 'in_progress' | 'resolved' | 'closed';

  // 担当情報
  reporter: string;        // 報告者のユーザーID (FK: users.id)
  assignee: string | null; // 担当者のユーザーID (FK: users.id)

  // コメント
  comments: Comment[];     // コメント配列

  // メタ情報
  createdAt: string;       // 作成日時 (ISO 8601)
  updatedAt: string;       // 更新日時 (ISO 8601)
  resolvedAt: string | null;  // 解決日時 (ISO 8601)
  closedAt: string | null;    // クローズ日時 (ISO 8601)
}

interface Comment {
  id: string;              // コメントID
  userId: string;          // コメント投稿者ID (FK: users.id)
  content: string;         // コメント内容 (1-1000文字)
  createdAt: string;       // 投稿日時 (ISO 8601)
}
```

#### サンプルデータ

```json
{
  "id": "INC-20260121-001",
  "title": "経費精算システムにログインできない",
  "description": "本日9時頃から経費精算システムにログインしようとすると「認証エラー」が表示される",
  "appId": "A0001",
  "category": "software",
  "priority": "P2",
  "status": "in_progress",
  "reporter": "U0002",
  "assignee": "U0001",
  "comments": [
    {
      "id": "C0001",
      "userId": "U0001",
      "content": "調査を開始します。認証サーバーのログを確認中。",
      "createdAt": "2026-01-21T09:15:00.000Z"
    }
  ],
  "createdAt": "2026-01-21T09:00:00.000Z",
  "updatedAt": "2026-01-21T09:15:00.000Z",
  "resolvedAt": null,
  "closedAt": null
}
```

#### 制約

| 項目 | 制約 |
|------|------|
| **id** | 必須、一意、"INC-YYYYMMDD-連番" |
| **title** | 必須、1-100文字 |
| **description** | 必須、1-2000文字 |
| **appId** | 必須、外部キー（apps.id） |
| **priority** | 必須、P1-P5 |
| **status** | 必須、デフォルト'new' |
| **reporter** | 必須、外部キー（users.id） |

---

### 2.4 changes（変更要求）

**localStorageキー**: `appsuite_changes`

#### スキーマ定義

```typescript
interface Change {
  // 主キー
  id: string;              // "CHG-20260121-001" (日付ベース連番)

  // 基本情報
  title: string;           // タイトル (1-100文字)
  description: string;     // 詳細説明 (1-2000文字)

  // 分類
  appId: string;           // 関連アプリID (FK: apps.id)
  type: 'standard' | 'normal' | 'emergency';
  risk: 'low' | 'medium' | 'high';

  // ステータス
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'implemented' | 'closed';

  // 担当情報
  requester: string;       // 申請者のユーザーID (FK: users.id)
  approver: string | null; // 承認者のユーザーID (FK: users.id)
  implementer: string | null;  // 実装者のユーザーID (FK: users.id)

  // スケジュール
  scheduledDate: string | null;  // 実施予定日 (ISO 8601 Date)
  implementedDate: string | null; // 実施日 (ISO 8601 Date)

  // 承認情報
  approvalComment: string | null;  // 承認/却下コメント

  // メタ情報
  createdAt: string;       // 作成日時 (ISO 8601)
  updatedAt: string;       // 更新日時 (ISO 8601)
}
```

#### サンプルデータ

```json
{
  "id": "CHG-20260121-001",
  "title": "経費精算システムに承認者追加機能を実装",
  "description": "複数段階の承認フローに対応するため、承認者を追加できる機能を実装する",
  "appId": "A0001",
  "type": "normal",
  "risk": "medium",
  "status": "pending",
  "requester": "U0003",
  "approver": null,
  "implementer": null,
  "scheduledDate": "2026-02-01",
  "implementedDate": null,
  "approvalComment": null,
  "createdAt": "2026-01-21T10:00:00.000Z",
  "updatedAt": "2026-01-21T10:00:00.000Z"
}
```

#### 制約

| 項目 | 制約 |
|------|------|
| **id** | 必須、一意、"CHG-YYYYMMDD-連番" |
| **title** | 必須、1-100文字 |
| **description** | 必須、1-2000文字 |
| **appId** | 必須、外部キー（apps.id） |
| **type** | 必須、デフォルト'normal' |
| **risk** | 必須、デフォルト'medium' |
| **status** | 必須、デフォルト'draft' |
| **requester** | 必須、外部キー（users.id） |

---

### 2.5 logs（監査ログ）

**localStorageキー**: `appsuite_logs`

#### スキーマ定義

```typescript
interface Log {
  // 主キー
  id: string;              // "LOG-" + UUID (自動生成)

  // ログ情報
  timestamp: string;       // タイムスタンプ (ISO 8601)
  userId: string;          // 操作者のユーザーID (FK: users.id)
  action: string;          // 操作種別 (CREATE/READ/UPDATE/DELETE/LOGIN/LOGOUT)
  target: string;          // 操作対象 (USER/APP/INCIDENT/CHANGE/SETTING)
  targetId: string | null; // 操作対象のID

  // 詳細情報
  details: string;         // 詳細情報 (JSON文字列、0-1000文字)
  ipAddress: string | null;    // IPアドレス
  userAgent: string | null;    // ユーザーエージェント
}
```

#### サンプルデータ

```json
{
  "id": "LOG-550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-21T10:00:00.000Z",
  "userId": "U0001",
  "action": "CREATE",
  "target": "INCIDENT",
  "targetId": "INC-20260121-001",
  "details": "{\"title\":\"経費精算システムにログインできない\",\"priority\":\"P2\"}",
  "ipAddress": "192.168.0.185",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}
```

#### 制約

| 項目 | 制約 |
|------|------|
| **id** | 必須、一意、"LOG-" + UUID |
| **timestamp** | 必須、ISO 8601形式 |
| **userId** | 必須、外部キー（users.id） |
| **action** | 必須、定義済み操作のみ |
| **target** | 必須、定義済みエンティティのみ |
| **details** | オプション、JSON文字列 |

---

### 2.6 settings（システム設定）

**localStorageキー**: `appsuite_settings`

#### スキーマ定義

```typescript
interface Settings {
  // API設定
  api: {
    enabled: boolean;
    endpoint: string;
    authType: 'bearer' | 'basic' | 'apikey';
    credentials: {
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
    };
  };

  // セキュリティ設定
  security: {
    sessionTimeout: number;      // 分単位
    passwordMinLength: number;
    requireStrongPassword: boolean;
  };

  // UI設定
  ui: {
    itemsPerPage: number;        // ページング件数
    dateFormat: string;          // 日付フォーマット
    theme: 'light' | 'dark';
  };

  // 通知設定
  notifications: {
    enabled: boolean;
    email: {
      enabled: boolean;
      recipients: string[];
    };
  };
}
```

#### サンプルデータ

```json
{
  "api": {
    "enabled": false,
    "endpoint": "https://example.desknets.com/cgi-bin/dneo/zap.cgi",
    "authType": "bearer",
    "credentials": {}
  },
  "security": {
    "sessionTimeout": 30,
    "passwordMinLength": 8,
    "requireStrongPassword": true
  },
  "ui": {
    "itemsPerPage": 25,
    "dateFormat": "YYYY-MM-DD HH:mm",
    "theme": "light"
  },
  "notifications": {
    "enabled": false,
    "email": {
      "enabled": false,
      "recipients": []
    }
  }
}
```

---

## 3. データストア構造

### 3.1 localStorageキー一覧

| キー名 | データ型 | 説明 | 推定サイズ |
|--------|---------|------|-----------|
| `appsuite_users` | Array<User> | ユーザー情報 | ~500KB (1,000件) |
| `appsuite_apps` | Array<App> | アプリ情報 | ~200KB (500件) |
| `appsuite_incidents` | Array<Incident> | インシデント情報 | ~6MB (10,000件) |
| `appsuite_changes` | Array<Change> | 変更要求情報 | ~700KB (1,000件) |
| `appsuite_logs` | Array<Log> | 監査ログ | ~3MB (10,000件) |
| `appsuite_settings` | Settings | システム設定 | ~10KB |
| **合計** | - | - | **~10.4MB** |

### 3.2 データアクセスパターン

```javascript
// 読み取り
const users = JSON.parse(localStorage.getItem('appsuite_users')) || [];

// 書き込み
localStorage.setItem('appsuite_users', JSON.stringify(users));

// 削除
localStorage.removeItem('appsuite_users');

// 全クリア（注意）
localStorage.clear();  // すべてのlocalStorageデータが削除される
```

---

## 4. インデックス戦略

### 4.1 インデックス相当の実装

localStorageにはインデックス機能がないため、アプリケーション層で以下を実装：

#### ID検索の最適化

```javascript
// Map構造でキャッシュ
const userMap = new Map();
users.forEach(u => userMap.set(u.id, u));

// O(1)でアクセス
const user = userMap.get('U0001');
```

#### 複合検索の最適化

```javascript
// ステータス別インデックス
const incidentsByStatus = {
  new: [],
  in_progress: [],
  resolved: [],
  closed: []
};

incidents.forEach(inc => {
  incidentsByStatus[inc.status].push(inc);
});
```

---

## 5. データ整合性

### 5.1 参照整合性チェック

```javascript
// 削除時の整合性チェック
function deleteApp(appId) {
  // 関連するインシデントの確認
  const relatedIncidents = incidents.filter(i => i.appId === appId);
  if (relatedIncidents.length > 0) {
    throw new Error('このアプリに関連するインシデントが存在します');
  }

  // 関連する変更要求の確認
  const relatedChanges = changes.filter(c => c.appId === appId);
  if (relatedChanges.length > 0) {
    throw new Error('このアプリに関連する変更要求が存在します');
  }

  // 削除実行
  apps = apps.filter(a => a.id !== appId);
  DataStore.write('appsuite_apps', apps);
}
```

### 5.2 トランザクション相当の実装

```javascript
// 簡易トランザクション
function transaction(operations) {
  // 現在のデータをバックアップ
  const backup = {
    users: DataStore.read('appsuite_users'),
    apps: DataStore.read('appsuite_apps'),
    // ...
  };

  try {
    // 操作実行
    operations.forEach(op => op());
    return true;
  } catch (error) {
    // ロールバック
    Object.keys(backup).forEach(key => {
      DataStore.write(`appsuite_${key}`, backup[key]);
    });
    throw error;
  }
}
```

---

## 6. 容量管理

### 6.1 容量制限対策

| 対策 | 説明 |
|------|------|
| **ログ上限** | 監査ログは10,000件まで、古いものから自動削除 |
| **インシデント上限** | 10,000件まで、クローズ済みは定期的にアーカイブ |
| **コメント制限** | 1インシデントあたり最大50コメント |
| **データ圧縮** | 不要な空白の削除、短縮キー名の使用 |

### 6.2 容量監視

```javascript
function checkStorageUsage() {
  let totalSize = 0;

  for (let key in localStorage) {
    if (key.startsWith('appsuite_')) {
      const size = new Blob([localStorage.getItem(key)]).size;
      totalSize += size;
    }
  }

  const usagePercent = (totalSize / (5 * 1024 * 1024)) * 100;  // 5MB基準

  if (usagePercent > 80) {
    console.warn(`localStorage使用率: ${usagePercent.toFixed(1)}%`);
    // 古いログの削除を実行
    cleanupOldLogs();
  }

  return { totalSize, usagePercent };
}
```

---

## 7. マイグレーション

### 7.1 バージョン管理

```javascript
const DB_VERSION = '1.0.0';

function checkAndMigrate() {
  const currentVersion = DataStore.read('appsuite_db_version') || '0.0.0';

  if (currentVersion < '1.0.0') {
    migrateToV1();
  }

  DataStore.write('appsuite_db_version', DB_VERSION);
}
```

### 7.2 マイグレーション例

```javascript
function migrateToV1() {
  // 旧形式のデータを新形式に変換
  const oldUsers = DataStore.read('users');  // 旧キー名

  if (oldUsers) {
    const newUsers = oldUsers.map(u => ({
      ...u,
      status: u.status || 'active',  // デフォルト値追加
      lastLogin: u.lastLogin || null
    }));

    DataStore.write('appsuite_users', newUsers);
    DataStore.remove('users');  // 旧キー削除
  }
}
```

---

## 📊 設計評価

### 長所

| 項目 | 説明 |
|------|------|
| **シンプル** | 複雑なDB設定不要 |
| **高速** | メモリアクセス、サーバー通信なし |
| **オフライン** | ネットワーク不要で動作 |

### 短所と対策

| 短所 | 対策 |
|------|------|
| **容量制限** | 上限10,000件、古いデータ自動削除 |
| **同時アクセス** | 単一タブ前提、複数タブは非対応 |
| **データ共有** | 将来的にサーバー連携を検討 |

---

## ✅ レビューチェックリスト

- [ ] 全エンティティが定義されている
- [ ] スキーマが明確
- [ ] 制約が適切
- [ ] 参照整合性が考慮されている
- [ ] 容量管理が適切
- [ ] マイグレーション戦略が明確
- [ ] 技術リーダーレビュー完了

---

**承認**:
- データベース設計者: _________________ 日付: _______
- 技術リーダー: _________________ 日付: _______

**次のステップ**: API設計書作成
