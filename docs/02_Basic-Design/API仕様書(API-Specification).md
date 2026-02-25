# AppSuite管理運用システム API仕様書

**文書番号**: API-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年1月20日

---

## 1. 概要

### 1.1 目的
本文書は、AppSuite管理運用システムのAPI仕様（内部API及びDeskNet's Neo連携API）を定義する。

### 1.2 API分類

| 分類 | 説明 |
|------|------|
| 内部API | JavaScriptモジュール間のインターフェース |
| 外部API | DeskNet's Neo APIとの連携インターフェース |

---

## 2. 内部API仕様

### 2.1 UserModule（ユーザー管理）

#### 2.1.1 getAll()
**概要**: 全ユーザーを取得

**パラメータ**: なし

**戻り値**:
```javascript
Array<User>
```

**使用例**:
```javascript
const users = UserModule.getAll();
```

#### 2.1.2 getById(id)
**概要**: IDでユーザーを取得

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|:----:|------|
| id | String | ○ | ユーザーID |

**戻り値**:
```javascript
User | undefined
```

#### 2.1.3 create(userData)
**概要**: ユーザーを新規作成

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|:----:|------|
| userData | Object | ○ | ユーザーデータ |

**userData構造**:
```javascript
{
  username: String,    // 必須
  email: String,       // 必須
  department: String,  // 任意
  role: String,        // 必須（'管理者' | 'ユーザー'）
  status: String       // 必須（'active' | 'inactive'）
}
```

**戻り値**:
```javascript
User // 作成されたユーザー（IDを含む）
```

#### 2.1.4 update(id, userData)
**概要**: ユーザーを更新

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|:----:|------|
| id | String | ○ | ユーザーID |
| userData | Object | ○ | 更新データ |

**戻り値**:
```javascript
User // 更新されたユーザー
```

#### 2.1.5 delete(id)
**概要**: ユーザーを削除

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|:----:|------|
| id | String | ○ | ユーザーID |

**戻り値**:
```javascript
Boolean // 成功: true, 失敗: false
```

#### 2.1.6 search(filters)
**概要**: 条件検索

**パラメータ**:
```javascript
{
  keyword: String,     // 検索キーワード
  status: String,      // ステータスフィルタ
  role: String         // 権限フィルタ
}
```

**戻り値**:
```javascript
Array<User> // 検索結果
```

---

### 2.2 AppModule（アプリ管理）

#### 2.2.1 getAll()
**概要**: 全アプリを取得

**戻り値**:
```javascript
Array<App>
```

#### 2.2.2 getById(id)
**概要**: IDでアプリを取得

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|:----:|------|
| id | String | ○ | アプリID |

**戻り値**:
```javascript
App | undefined
```

#### 2.2.3 create(appData)
**概要**: アプリを新規作成

**appData構造**:
```javascript
{
  name: String,        // 必須
  category: String,    // 必須
  creator: String,     // 必須
  description: String, // 任意
  status: String       // 必須
}
```

#### 2.2.4 update(id, appData)
**概要**: アプリを更新

#### 2.2.5 delete(id)
**概要**: アプリを削除

---

### 2.3 IncidentModule（インシデント管理）

#### 2.3.1 getAll()
**概要**: 全インシデントを取得

#### 2.3.2 getById(id)
**概要**: IDでインシデントを取得

#### 2.3.3 create(incidentData)
**概要**: インシデントを新規作成

**incidentData構造**:
```javascript
{
  title: String,       // 必須
  description: String, // 必須
  appId: String,       // 必須
  priority: String,    // 必須（'high' | 'medium' | 'low'）
  reporter: String,    // 必須
  assignee: String     // 任意
}
```

#### 2.3.4 update(id, incidentData)
**概要**: インシデントを更新

#### 2.3.5 updateStatus(id, status)
**概要**: インシデントのステータスを更新

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|:----:|------|
| id | String | ○ | インシデントID |
| status | String | ○ | 新しいステータス |

#### 2.3.6 assign(id, assignee)
**概要**: 担当者を割り当て

#### 2.3.7 getOpenCount()
**概要**: 未解決インシデント数を取得

**戻り値**:
```javascript
Number // 未解決件数
```

---

### 2.4 ChangeModule（変更管理）

#### 2.4.1 getAll()
**概要**: 全変更要求を取得

#### 2.4.2 getById(id)
**概要**: IDで変更要求を取得

#### 2.4.3 create(changeData)
**概要**: 変更要求を新規作成

**changeData構造**:
```javascript
{
  title: String,       // 必須
  description: String, // 必須
  appId: String,       // 必須
  type: String,        // 必須
  requester: String,   // 必須
  plannedDate: String  // 任意
}
```

#### 2.4.4 approve(id, approver)
**概要**: 変更要求を承認

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|:----:|------|
| id | String | ○ | 変更要求ID |
| approver | String | ○ | 承認者 |

#### 2.4.5 reject(id, reason)
**概要**: 変更要求を却下

#### 2.4.6 complete(id)
**概要**: 変更を完了

#### 2.4.7 getPendingCount()
**概要**: 保留中の変更数を取得

---

### 2.5 LogModule（監査ログ）

#### 2.5.1 getAll()
**概要**: 全ログを取得

#### 2.5.2 search(filters)
**概要**: 条件検索

**filters構造**:
```javascript
{
  dateFrom: Date,      // 開始日
  dateTo: Date,        // 終了日
  action: String,      // 操作タイプ
  target: String       // 対象
}
```

#### 2.5.3 add(logData)
**概要**: ログを記録

**logData構造**:
```javascript
{
  userId: String,      // 必須
  username: String,    // 必須
  action: String,      // 必須
  target: String,      // 必須
  targetId: String,    // 任意
  details: String,     // 任意
  ipAddress: String    // 必須
}
```

#### 2.5.4 export(filters)
**概要**: ログをCSVエクスポート

**戻り値**:
```javascript
Blob // CSVファイルBlob
```

---

### 2.6 SettingsModule（システム設定）

#### 2.6.1 get(key)
**概要**: 設定値を取得

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|:----:|------|
| key | String | ○ | 設定キー |

**戻り値**:
```javascript
any // 設定値
```

#### 2.6.2 set(key, value)
**概要**: 設定値を保存

#### 2.6.3 getCategory(category)
**概要**: カテゴリ内の全設定を取得

**戻り値**:
```javascript
Object // 設定オブジェクト
```

#### 2.6.4 saveApi()
**概要**: API設定を保存

#### 2.6.5 saveGeneral()
**概要**: 基本設定を保存

#### 2.6.6 saveNotification()
**概要**: 通知設定を保存

#### 2.6.7 saveSecurity()
**概要**: セキュリティ設定を保存

#### 2.6.8 saveWorkflow()
**概要**: ワークフロー設定を保存

#### 2.6.9 testApi()
**概要**: API接続テスト

**戻り値**:
```javascript
Promise<{success: Boolean, message: String}>
```

#### 2.6.10 createBackup()
**概要**: バックアップを作成

**戻り値**:
```javascript
Blob // JSONファイルBlob
```

#### 2.6.11 restoreBackup(file)
**概要**: バックアップから復元

**パラメータ**:
| 名前 | 型 | 必須 | 説明 |
|------|-----|:----:|------|
| file | File | ○ | JSONファイル |

---

## 3. DeskNet's Neo API連携

### 3.1 認証

#### 3.1.1 Bearer Token認証
```http
GET /api/v1/users HTTP/1.1
Host: your-domain.desknets.com
Authorization: Bearer {token}
```

#### 3.1.2 Basic認証
```http
GET /api/v1/users HTTP/1.1
Host: your-domain.desknets.com
Authorization: Basic {base64(username:password)}
```

#### 3.1.3 APIキー認証
```http
GET /api/v1/users HTTP/1.1
Host: your-domain.desknets.com
X-API-Key: {apikey}
```

### 3.2 エンドポイント

#### 3.2.1 ユーザー情報取得
**エンドポイント**: `GET /cgi-bin/dneo/zap.cgi`

**パラメータ**:
| 名前 | 値 | 説明 |
|------|-----|------|
| cmd | getuser | コマンド |

**レスポンス**:
```json
{
  "status": "success",
  "users": [
    {
      "userid": "U0001",
      "name": "山田太郎",
      "email": "yamada@example.com",
      "dept": "IT部"
    }
  ]
}
```

#### 3.2.2 AppSuiteアプリ情報取得
**エンドポイント**: `GET /cgi-bin/dneo/zap.cgi`

**パラメータ**:
| 名前 | 値 | 説明 |
|------|-----|------|
| cmd | getapps | コマンド |

**レスポンス**:
```json
{
  "status": "success",
  "apps": [
    {
      "appid": "A0001",
      "name": "勤怠管理",
      "recordcount": 150
    }
  ]
}
```

### 3.3 API通信モジュール（api.js）

#### 3.3.1 ApiClient クラス

```javascript
class ApiClient {
    constructor(baseUrl, authMethod, credentials) {
        this.baseUrl = baseUrl;
        this.authMethod = authMethod;
        this.credentials = credentials;
    }

    async request(endpoint, options = {}) {
        const headers = this.getAuthHeaders();
        const response = await fetch(this.baseUrl + endpoint, {
            ...options,
            headers: { ...headers, ...options.headers }
        });
        return response.json();
    }

    getAuthHeaders() {
        switch (this.authMethod) {
            case 'bearer':
                return { 'Authorization': `Bearer ${this.credentials.token}` };
            case 'basic':
                return { 'Authorization': `Basic ${btoa(this.credentials.username + ':' + this.credentials.password)}` };
            case 'apikey':
                return { 'X-API-Key': this.credentials.apiKey };
        }
    }

    async testConnection() {
        try {
            const response = await this.request('?cmd=test');
            return { success: response.status === 'success' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
```

### 3.4 同期処理

#### 3.4.1 ユーザー同期
```javascript
async function syncUsers() {
    const apiClient = getApiClient();
    const response = await apiClient.request('?cmd=getuser');

    if (response.status === 'success') {
        const remoteUsers = response.users;
        // ローカルデータと同期
        mergeuserData(remoteUsers);
    }
}
```

#### 3.4.2 自動同期
```javascript
function startAutoSync(intervalMinutes) {
    if (intervalMinutes > 0) {
        setInterval(async () => {
            await syncUsers();
            await syncApps();
        }, intervalMinutes * 60 * 1000);
    }
}
```

---

## 4. エラーハンドリング

### 4.1 エラーコード

| コード | 名前 | 説明 |
|--------|------|------|
| E001 | VALIDATION_ERROR | 入力値検証エラー |
| E002 | NOT_FOUND | データが見つからない |
| E003 | DUPLICATE | 重複エラー |
| E004 | AUTH_ERROR | 認証エラー |
| E005 | NETWORK_ERROR | ネットワークエラー |
| E006 | STORAGE_ERROR | ストレージエラー |
| E007 | API_ERROR | API通信エラー |

### 4.2 エラーレスポンス形式

```javascript
{
  success: false,
  error: {
    code: 'E001',
    message: 'ユーザー名は必須です',
    field: 'username'
  }
}
```

### 4.3 例外処理

```javascript
try {
    const result = await UserModule.create(userData);
    showToast('success', 'ユーザーを作成しました');
} catch (error) {
    showToast('error', error.message);
    console.error('Error:', error);
}
```

---

## 5. データ型定義

### 5.1 User型

```typescript
interface User {
    id: string;
    username: string;
    email: string;
    department?: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive';
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}
```

### 5.2 App型

```typescript
interface App {
    id: string;
    name: string;
    category: 'business' | 'approval' | 'data' | 'other';
    creator: string;
    recordCount: number;
    status: 'active' | 'maintenance' | 'inactive';
    description?: string;
    createdAt: string;
    updatedAt: string;
}
```

### 5.3 Incident型

```typescript
interface Incident {
    id: string;
    title: string;
    description: string;
    appId: string;
    priority: 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    reporter: string;
    assignee?: string;
    reportedAt: string;
    resolvedAt?: string;
    createdAt: string;
    updatedAt: string;
}
```

### 5.4 Change型

```typescript
interface Change {
    id: string;
    title: string;
    description: string;
    appId: string;
    type: 'feature' | 'modification' | 'bugfix' | 'improvement';
    status: 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
    requester: string;
    approver?: string;
    plannedDate?: string;
    completedDate?: string;
    createdAt: string;
    updatedAt: string;
}
```

### 5.5 Log型

```typescript
interface Log {
    id: string;
    timestamp: string;
    userId: string;
    username: string;
    action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'export';
    target: 'user' | 'app' | 'incident' | 'change' | 'system';
    targetId?: string;
    details?: string;
    ipAddress: string;
}
```

---

**文書履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2026-01-20 | 初版作成 | - |
