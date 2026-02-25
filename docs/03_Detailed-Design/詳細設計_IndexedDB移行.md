# localStorage → IndexedDB 移行 詳細設計書

**作成日**: 2026-02-11
**対象フェーズ**: Phase 6 Sprint 6-1
**実装期間**: 7-10日
**優先度**: P2（中期対応）

---

## 1. 背景と目的

### 1.1 現状の課題

| 項目 | localStorage | 課題 |
|------|-------------|------|
| **容量制限** | 5MB（ブラウザ依存） | 大規模運用で数ヶ月で上限到達 |
| **並行アクセス** | 制御なし | 複数タブでデータ喪失リスク |
| **トランザクション** | 非対応 | データ整合性の保証なし |
| **非同期処理** | 同期のみ | UIブロックリスク |
| **インデックス** | 非対応 | 検索・フィルタが非効率 |

### 1.2 IndexedDB のメリット

| 項目 | IndexedDB | メリット |
|------|----------|---------|
| **容量** | 無制限（ディスク容量依存） | 大規模データ対応 |
| **並行アクセス** | トランザクション対応 | データ整合性保証 |
| **非同期処理** | Promise/async-await | UIブロック回避 |
| **インデックス** | 複数インデックス対応 | 高速検索 |
| **複雑なクエリ** | カーソル、範囲検索 | 柔軟なデータ操作 |

### 1.3 移行目標

- Phase 6（2026-03-01～03-31）で移行完了
- 既存データの完全移行（データ損失ゼロ）
- 既存API互換性維持（modules.js の変更最小化）

---

## 2. アーキテクチャ設計

### 2.1 StorageAdapter パターン

```
Application Layer
  ↓
StorageAdapter Interface (storage-adapter.js)
  ↓
  ├─ LocalStorageAdapter (現行)
  └─ IndexedDBAdapter (新規) ← Phase 6で実装
```

**設計思想**:
- ストレージ実装を抽象化
- 将来的にサーバーサイドDB（MySQL/PostgreSQL）への移行も容易

### 2.2 ファイル構成

```
WebUI-Production/js/
├── storage/
│   ├── storage-adapter.js         # 抽象インターフェース
│   ├── localstorage-adapter.js    # localStorage実装（現行）
│   ├── indexeddb-adapter.js       # IndexedDB実装（新規）
│   ├── migration-tool.js          # データ移行ツール
│   └── storage-config.js          # ストレージ選択設定
├── modules.js                      # 既存モジュール（修正最小化）
└── api.js                          # 既存APIクライアント（修正最小化）
```

---

## 3. データベーススキーマ設計

### 3.1 データベース名

**Database Name**: `appsuite_itsm_db`
**Version**: 1

### 3.2 オブジェクトストア（テーブル）定義

#### 3.2.1 users（ユーザー）

```javascript
objectStore: "users"
keyPath: "id"
autoIncrement: false
indexes:
  - username (unique)
  - email (unique)
  - department
  - role
  - status
```

**スキーマ**:
```javascript
{
  id: "U000001",              // Primary Key
  username: "admin",          // Index (unique)
  password: "hashed...",
  email: "admin@example.com", // Index (unique)
  fullName: "管理者",
  department: "情報システム部",  // Index
  role: "administrator",       // Index
  status: "active",            // Index
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-02-11T10:00:00Z"
}
```

#### 3.2.2 apps（アプリ）

```javascript
objectStore: "apps"
keyPath: "id"
indexes:
  - name
  - category
  - status
  - creator
```

**スキーマ**:
```javascript
{
  id: "A000001",
  name: "営業管理",
  category: "業務管理",        // Index
  description: "...",
  creator: "U000001",         // Index
  recordCount: 1500,
  status: "active",           // Index
  createdAt: "2026-01-15T00:00:00Z"
}
```

#### 3.2.3 incidents（インシデント）

```javascript
objectStore: "incidents"
keyPath: "id"
indexes:
  - title
  - appId
  - priority
  - status
  - reporter
  - assignee
  - createdAt
  - compound: [status, priority]  // 複合インデックス
```

**スキーマ**:
```javascript
{
  id: "INC-000001",
  title: "ログインエラー",
  description: "...",
  appId: "A000001",           // Index
  priority: "high",           // Index
  status: "open",             // Index
  reporter: "U000002",        // Index
  assignee: "U000001",        // Index
  createdAt: "2026-02-10T10:00:00Z", // Index
  updatedAt: "2026-02-11T10:00:00Z"
}
```

#### 3.2.4 changes（変更要求）

```javascript
objectStore: "changes"
keyPath: "id"
indexes:
  - title
  - appId
  - type
  - status
  - requester
  - approver
  - createdAt
```

#### 3.2.5 logs（監査ログ）

```javascript
objectStore: "logs"
keyPath: "id"
indexes:
  - timestamp (descending)
  - userId
  - action
  - target
  - compound: [userId, timestamp]
```

**スキーマ**:
```javascript
{
  id: "LOG-000001",
  timestamp: "2026-02-11T10:00:00Z", // Index (desc)
  userId: "U000001",                 // Index
  username: "admin",
  action: "login",                   // Index
  target: "authentication",          // Index
  details: "ログイン成功",
  ipAddress: "192.168.1.100"
}
```

#### 3.2.6 settings（システム設定）

```javascript
objectStore: "settings"
keyPath: "key"
```

**スキーマ**:
```javascript
{
  key: "api.baseUrl",          // Primary Key
  value: "https://example.com",
  category: "api",
  updatedAt: "2026-02-11T10:00:00Z"
}
```

---

## 4. StorageAdapter インターフェース設計

### 4.1 抽象インターフェース

**ファイル**: `storage-adapter.js`

```javascript
/**
 * StorageAdapter Abstract Interface
 */
class StorageAdapter {
    /**
     * 初期化
     * @returns {Promise<void>}
     */
    async init() {
        throw new Error('Not implemented');
    }

    /**
     * データ作成
     * @param {string} collection - コレクション名（users/apps/incidents等）
     * @param {object} data - データオブジェクト
     * @returns {Promise<object>} 作成されたデータ
     */
    async create(collection, data) {
        throw new Error('Not implemented');
    }

    /**
     * データ読取（ID指定）
     * @param {string} collection
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    async findById(collection, id) {
        throw new Error('Not implemented');
    }

    /**
     * データ読取（条件指定）
     * @param {string} collection
     * @param {object} query - 検索条件 {field: value}
     * @returns {Promise<Array>}
     */
    async findWhere(collection, query) {
        throw new Error('Not implemented');
    }

    /**
     * データ更新
     * @param {string} collection
     * @param {string} id
     * @param {object} updates
     * @returns {Promise<object|null>}
     */
    async update(collection, id, updates) {
        throw new Error('Not implemented');
    }

    /**
     * データ削除
     * @param {string} collection
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async delete(collection, id) {
        throw new Error('Not implemented');
    }

    /**
     * 全データ取得
     * @param {string} collection
     * @returns {Promise<Array>}
     */
    async findAll(collection) {
        throw new Error('Not implemented');
    }

    /**
     * データ数取得
     * @param {string} collection
     * @returns {Promise<number>}
     */
    async count(collection) {
        throw new Error('Not implemented');
    }

    /**
     * トランザクション開始
     * @param {Array<string>} collections
     * @param {string} mode - 'readonly' | 'readwrite'
     * @returns {Promise<Transaction>}
     */
    async transaction(collections, mode) {
        throw new Error('Not implemented');
    }
}

export default StorageAdapter;
```

---

## 5. IndexedDBAdapter 実装設計

### 5.1 データベース初期化

```javascript
/**
 * IndexedDBAdapter Implementation
 */
class IndexedDBAdapter extends StorageAdapter {
    constructor() {
        super();
        this.dbName = 'appsuite_itsm_db';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // users オブジェクトストア作成
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'id' });
                    usersStore.createIndex('username', 'username', { unique: true });
                    usersStore.createIndex('email', 'email', { unique: true });
                    usersStore.createIndex('department', 'department', { unique: false });
                    usersStore.createIndex('role', 'role', { unique: false });
                    usersStore.createIndex('status', 'status', { unique: false });
                }

                // apps オブジェクトストア作成
                if (!db.objectStoreNames.contains('apps')) {
                    const appsStore = db.createObjectStore('apps', { keyPath: 'id' });
                    appsStore.createIndex('name', 'name', { unique: false });
                    appsStore.createIndex('category', 'category', { unique: false });
                    appsStore.createIndex('status', 'status', { unique: false });
                    appsStore.createIndex('creator', 'creator', { unique: false });
                }

                // incidents オブジェクトストア作成
                if (!db.objectStoreNames.contains('incidents')) {
                    const incidentsStore = db.createObjectStore('incidents', { keyPath: 'id' });
                    incidentsStore.createIndex('title', 'title', { unique: false });
                    incidentsStore.createIndex('appId', 'appId', { unique: false });
                    incidentsStore.createIndex('priority', 'priority', { unique: false });
                    incidentsStore.createIndex('status', 'status', { unique: false });
                    incidentsStore.createIndex('reporter', 'reporter', { unique: false });
                    incidentsStore.createIndex('assignee', 'assignee', { unique: false });
                    incidentsStore.createIndex('createdAt', 'createdAt', { unique: false });
                    // 複合インデックス
                    incidentsStore.createIndex('status_priority', ['status', 'priority'], { unique: false });
                }

                // changes オブジェクトストア作成
                if (!db.objectStoreNames.contains('changes')) {
                    const changesStore = db.createObjectStore('changes', { keyPath: 'id' });
                    changesStore.createIndex('title', 'title', { unique: false });
                    changesStore.createIndex('appId', 'appId', { unique: false });
                    changesStore.createIndex('type', 'type', { unique: false });
                    changesStore.createIndex('status', 'status', { unique: false });
                    changesStore.createIndex('requester', 'requester', { unique: false });
                    changesStore.createIndex('approver', 'approver', { unique: false });
                }

                // logs オブジェクトストア作成
                if (!db.objectStoreNames.contains('logs')) {
                    const logsStore = db.createObjectStore('logs', { keyPath: 'id' });
                    logsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    logsStore.createIndex('userId', 'userId', { unique: false });
                    logsStore.createIndex('action', 'action', { unique: false });
                    logsStore.createIndex('target', 'target', { unique: false });
                    logsStore.createIndex('userId_timestamp', ['userId', 'timestamp'], { unique: false });
                }

                // settings オブジェクトストア作成
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async create(collection, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([collection], 'readwrite');
            const store = transaction.objectStore(collection);
            const request = store.add(data);

            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    async findById(collection, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([collection], 'readonly');
            const store = transaction.objectStore(collection);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async findWhere(collection, query) {
        // インデックスを使用した高速検索
        const results = [];
        const transaction = this.db.transaction([collection], 'readonly');
        const store = transaction.objectStore(collection);

        // クエリの最初のキーでインデックス検索
        const queryKeys = Object.keys(query);
        if (queryKeys.length > 0 && store.indexNames.contains(queryKeys[0])) {
            const index = store.index(queryKeys[0]);
            const request = index.openCursor(IDBKeyRange.only(query[queryKeys[0]]));

            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        // 追加の条件でフィルタリング
                        const item = cursor.value;
                        let match = true;
                        for (const key of queryKeys) {
                            if (item[key] !== query[key]) {
                                match = false;
                                break;
                            }
                        }
                        if (match) results.push(item);
                        cursor.continue();
                    } else {
                        resolve(results);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } else {
            // インデックスなしの場合は全件走査（フォールバック）
            return this.findAll(collection).then(items =>
                items.filter(item => {
                    for (const key in query) {
                        if (item[key] !== query[key]) return false;
                    }
                    return true;
                })
            );
        }
    }

    async update(collection, id, updates) {
        const item = await this.findById(collection, id);
        if (!item) return null;

        const updated = { ...item, ...updates, updatedAt: new Date().toISOString() };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([collection], 'readwrite');
            const store = transaction.objectStore(collection);
            const request = store.put(updated);

            request.onsuccess = () => resolve(updated);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(collection, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([collection], 'readwrite');
            const store = transaction.objectStore(collection);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async findAll(collection) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([collection], 'readonly');
            const store = transaction.objectStore(collection);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async count(collection) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([collection], 'readonly');
            const store = transaction.objectStore(collection);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

export default IndexedDBAdapter;
```

---

## 6. データ移行ツール設計

### 6.1 移行ツール実装

**ファイル**: `migration-tool.js`

```javascript
/**
 * localStorage → IndexedDB データ移行ツール
 */
class MigrationTool {
    constructor(sourceAdapter, targetAdapter) {
        this.source = sourceAdapter; // LocalStorageAdapter
        this.target = targetAdapter; // IndexedDBAdapter
        this.collections = ['users', 'apps', 'incidents', 'changes', 'logs', 'settings'];
    }

    /**
     * 全データ移行
     * @returns {Promise<object>} 移行結果
     */
    async migrateAll() {
        const result = {
            success: true,
            collections: {},
            errors: [],
            startTime: new Date(),
            endTime: null
        };

        console.log('📦 Migration started...');

        for (const collection of this.collections) {
            try {
                const migratedCount = await this.migrateCollection(collection);
                result.collections[collection] = {
                    status: 'success',
                    count: migratedCount
                };
                console.log(`✅ ${collection}: ${migratedCount} records migrated`);
            } catch (error) {
                result.success = false;
                result.collections[collection] = {
                    status: 'failed',
                    error: error.message
                };
                result.errors.push({ collection, error: error.message });
                console.error(`❌ ${collection}: migration failed`, error);
            }
        }

        result.endTime = new Date();
        result.duration = result.endTime - result.startTime;

        console.log(`📦 Migration completed in ${result.duration}ms`);
        return result;
    }

    /**
     * 単一コレクションの移行
     * @param {string} collection
     * @returns {Promise<number>} 移行件数
     */
    async migrateCollection(collection) {
        const items = await this.source.findAll(collection);
        let count = 0;

        for (const item of items) {
            await this.target.create(collection, item);
            count++;
        }

        return count;
    }

    /**
     * データ整合性検証
     * @returns {Promise<object>} 検証結果
     */
    async validate() {
        const result = {
            valid: true,
            collections: {},
            mismatches: []
        };

        for (const collection of this.collections) {
            const sourceCount = await this.source.count(collection);
            const targetCount = await this.target.count(collection);

            result.collections[collection] = {
                source: sourceCount,
                target: targetCount,
                match: sourceCount === targetCount
            };

            if (sourceCount !== targetCount) {
                result.valid = false;
                result.mismatches.push({
                    collection,
                    sourceCount,
                    targetCount,
                    diff: targetCount - sourceCount
                });
            }
        }

        return result;
    }

    /**
     * ロールバック（IndexedDBを削除、localStorageを復元）
     * @returns {Promise<void>}
     */
    async rollback() {
        console.warn('⚠️  Rolling back migration...');
        // IndexedDBを削除
        await new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase('appsuite_itsm_db');
            request.onsuccess = () => {
                console.log('✅ IndexedDB deleted');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });

        console.log('✅ Rollback completed. localStorage is still intact.');
    }
}

export default MigrationTool;
```

---

## 7. 実装計画

### 7.1 実装スケジュール（7-10日）

| 日 | タスク | 担当 | 工数 |
|----|--------|------|------|
| Day 1-2 | StorageAdapter インターフェース設計・実装 | Dev | 2日 |
| Day 3-5 | IndexedDBAdapter 実装・テスト | Dev | 3日 |
| Day 6 | MigrationTool 実装・テスト | Dev | 1日 |
| Day 7 | modules.js の StorageAdapter統合 | Dev | 1日 |
| Day 8 | 統合テスト・パフォーマンステスト | QA | 1日 |
| Day 9 | 本番移行リハーサル | Ops | 1日 |
| Day 10 | 本番移行・監視 | All | 1日 |

### 7.2 リスクと対応

| リスク | 発生確率 | 影響度 | 対応策 |
|--------|---------|--------|--------|
| 移行中のデータ損失 | 低 | 致命的 | 移行前バックアップ必須、検証ステップ追加 |
| パフォーマンス劣化 | 中 | 高 | ベンチマークテスト、インデックス最適化 |
| ブラウザ互換性問題 | 低 | 中 | IndexedDB Polyfill導入（Safari対応） |
| 移行時間超過 | 中 | 中 | 夜間メンテナンス時間帯に実施 |

---

## 8. テスト計画

### 8.1 ユニットテスト

```javascript
// tests/storage/indexeddb-adapter.test.js
describe('IndexedDBAdapter', () => {
    let adapter;

    beforeEach(async () => {
        adapter = new IndexedDBAdapter();
        await adapter.init();
    });

    afterEach(async () => {
        await indexedDB.deleteDatabase('appsuite_itsm_db');
    });

    test('create: ユーザーを作成できる', async () => {
        const user = {
            id: 'U000001',
            username: 'testuser',
            email: 'test@example.com'
        };
        const created = await adapter.create('users', user);
        expect(created).toEqual(user);
    });

    test('findById: IDでユーザーを検索できる', async () => {
        const user = await adapter.create('users', { id: 'U000001', username: 'test' });
        const found = await adapter.findById('users', 'U000001');
        expect(found.username).toBe('test');
    });

    test('findWhere: インデックスで高速検索できる', async () => {
        await adapter.create('users', { id: 'U000001', department: 'IT' });
        await adapter.create('users', { id: 'U000002', department: 'IT' });
        await adapter.create('users', { id: 'U000003', department: 'Sales' });

        const itUsers = await adapter.findWhere('users', { department: 'IT' });
        expect(itUsers.length).toBe(2);
    });

    test('update: ユーザーを更新できる', async () => {
        await adapter.create('users', { id: 'U000001', username: 'old' });
        const updated = await adapter.update('users', 'U000001', { username: 'new' });
        expect(updated.username).toBe('new');
    });

    test('delete: ユーザーを削除できる', async () => {
        await adapter.create('users', { id: 'U000001', username: 'test' });
        const result = await adapter.delete('users', 'U000001');
        expect(result).toBe(true);

        const found = await adapter.findById('users', 'U000001');
        expect(found).toBeNull();
    });
});
```

### 8.2 パフォーマンステスト

```javascript
// tests/storage/performance.test.js
describe('Storage Performance', () => {
    test('10,000件のインシデント書込み', async () => {
        const adapter = new IndexedDBAdapter();
        await adapter.init();

        const startTime = performance.now();
        for (let i = 0; i < 10000; i++) {
            await adapter.create('incidents', {
                id: `INC-${String(i).padStart(6, '0')}`,
                title: `Test Incident ${i}`,
                status: 'open',
                priority: 'medium'
            });
        }
        const endTime = performance.now();

        console.log(`10,000件書込み: ${(endTime - startTime).toFixed(2)}ms`);
        expect(endTime - startTime).toBeLessThan(5000); // 5秒以内
    });

    test('インデックス検索（10,000件中）', async () => {
        // ... 10,000件書込み済み前提

        const startTime = performance.now();
        const results = await adapter.findWhere('incidents', { status: 'open' });
        const endTime = performance.now();

        console.log(`インデックス検索: ${(endTime - startTime).toFixed(2)}ms`);
        expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });
});
```

---

## 9. 本番移行手順

### 9.1 移行前チェックリスト

- [ ] localStorage のフルバックアップ取得
- [ ] ユーザーへの事前通知（メンテナンス時間）
- [ ] 移行スクリプトの動作確認（テスト環境）
- [ ] ロールバック手順の確認

### 9.2 移行手順

```javascript
// 本番移行スクリプト
(async function migrate() {
    console.log('=== AppSuite ITSM データ移行開始 ===');

    // Step 1: バックアップ
    console.log('Step 1: バックアップ作成中...');
    const backup = DataStore.exportAll();
    localStorage.setItem('appsuite_backup_' + Date.now(), backup);
    console.log('✅ バックアップ完了');

    // Step 2: IndexedDB初期化
    console.log('Step 2: IndexedDB初期化中...');
    const indexedDBAdapter = new IndexedDBAdapter();
    await indexedDBAdapter.init();
    console.log('✅ IndexedDB初期化完了');

    // Step 3: データ移行
    console.log('Step 3: データ移行中...');
    const localStorageAdapter = new LocalStorageAdapter();
    const migrationTool = new MigrationTool(localStorageAdapter, indexedDBAdapter);
    const result = await migrationTool.migrateAll();

    if (!result.success) {
        console.error('❌ 移行失敗', result.errors);
        await migrationTool.rollback();
        return;
    }
    console.log('✅ データ移行完了');

    // Step 4: 検証
    console.log('Step 4: データ整合性検証中...');
    const validation = await migrationTool.validate();
    if (!validation.valid) {
        console.error('❌ 検証失敗', validation.mismatches);
        await migrationTool.rollback();
        return;
    }
    console.log('✅ データ整合性検証完了');

    // Step 5: ストレージ切替
    console.log('Step 5: ストレージ切替中...');
    StorageConfig.setAdapter('indexeddb');
    localStorage.setItem('appsuite_storage_type', 'indexeddb');
    console.log('✅ ストレージ切替完了');

    console.log('=== データ移行完了 ===');
    console.log('移行結果:', result);
})();
```

### 9.3 移行後確認

- [ ] 全機能の動作確認（ユーザー管理、インシデント管理等）
- [ ] パフォーマンス確認（初期表示3秒以内）
- [ ] 複数タブでの並行アクセステスト
- [ ] ユーザーからのフィードバック収集

### 9.4 ロールバック手順

移行失敗時は以下の手順でロールバック：

```javascript
// ロールバック実行
await migrationTool.rollback();
StorageConfig.setAdapter('localstorage');
localStorage.setItem('appsuite_storage_type', 'localstorage');
location.reload();
```

---

## 10. 将来展望

### 10.1 サーバーサイドDB移行（Phase 7以降）

IndexedDBAdapter を実装したことで、将来的に以下への移行も容易：

```
StorageAdapter Interface
  ↓
  ├─ LocalStorageAdapter
  ├─ IndexedDBAdapter
  └─ ServerDBAdapter (Phase 7で実装)
        ↓
        MySQL/PostgreSQL REST API
```

### 10.2 オフライン対応

IndexedDB + Service Worker で完全オフライン対応も可能：

- データをIndexedDBにキャッシュ
- オフライン時はIndexedDBから読取
- オンライン復帰時にサーバー同期

---

**作成者**: Lead Agent
**承認者**: アーキテクチャレビュー担当（承認待ち）
**実装予定**: Phase 6 Sprint 6-1（2026-03-01～03-31）
