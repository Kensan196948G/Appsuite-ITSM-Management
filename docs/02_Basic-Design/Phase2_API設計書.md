# Phase 2: API設計書（DeskNet's Neo連携）

**文書番号**: API-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年1月21日
**Phase**: Phase 2 - 基本設計
**ステータス**: ✅ レビュー待ち

---

## 📋 目次

1. [API概要](#1-api概要)
2. [認証方式](#2-認証方式)
3. [エンドポイント一覧](#3-エンドポイント一覧)
4. [リクエスト・レスポンス仕様](#4-リクエストレスポンス仕様)
5. [エラーハンドリング](#5-エラーハンドリング)
6. [実装例](#6-実装例)

---

## 1. API概要

### 1.1 DeskNet's Neo API概要

**ベースURL**: `https://{domain}.desknets.com/cgi-bin/dneo/zap.cgi`

**プロトコル**: HTTPS (TLS 1.2+)

**データフォーマット**: JSON

**文字エンコーディング**: UTF-8

### 1.2 利用目的

| 機能 | 目的 |
|------|------|
| **ユーザー同期** | DeskNet's Neoのユーザー情報を取得・同期 |
| **アプリ一覧取得** | AppSuiteアプリの一覧を取得 |
| **接続テスト** | API接続の疎通確認 |

**注**: 初期バージョンでは**読み取り専用**。書き込み操作は将来の拡張機能。

---

## 2. 認証方式

### 2.1 サポートする認証方式

#### 2.1.1 Bearer Token認証（推奨）

**ヘッダー**:
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**特徴**:
- ✅ セキュア（トークンベース）
- ✅ 有効期限管理が容易
- ⚠️ トークン取得が必要

#### 2.1.2 Basic認証

**ヘッダー**:
```http
Authorization: Basic {base64_encoded_credentials}
Content-Type: application/json
```

**credentials**: `username:password`をBase64エンコード

**特徴**:
- ✅ シンプル
- ⚠️ パスワードの保存が必要
- ⚠️ セキュリティリスクが高い

#### 2.1.3 APIキー認証

**ヘッダー**:
```http
X-API-Key: {api_key}
Content-Type: application/json
```

**特徴**:
- ✅ シンプル
- ✅ アプリケーション専用
- ⚠️ キーの漏洩リスク

### 2.2 認証方式の選択

**設定画面で選択可能**:
- デフォルト: Bearer Token
- 代替: Basic認証、APIキー

---

## 3. エンドポイント一覧

### 3.1 ユーザー情報取得

**エンドポイント**: `/cgi-bin/dneo/zap.cgi`

**メソッド**: POST

**コマンド**: `getuser`

**リクエストパラメータ**:
```json
{
  "command": "getuser",
  "userId": "optional_user_id"
}
```

**レスポンス**:
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "DN001",
        "name": "田中太郎",
        "email": "tanaka@example.com",
        "department": "IT管理部",
        "status": "active"
      }
    ]
  }
}
```

---

### 3.2 アプリ一覧取得

**エンドポイント**: `/cgi-bin/dneo/zap.cgi`

**メソッド**: POST

**コマンド**: `getapps`

**リクエストパラメータ**:
```json
{
  "command": "getapps"
}
```

**レスポンス**:
```json
{
  "status": "success",
  "data": {
    "apps": [
      {
        "id": "APP001",
        "name": "経費精算システム",
        "category": "財務",
        "recordCount": 1523,
        "status": "active",
        "createdAt": "2025-06-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 3.3 接続テスト

**エンドポイント**: `/cgi-bin/dneo/zap.cgi`

**メソッド**: POST

**コマンド**: `test`

**リクエストパラメータ**:
```json
{
  "command": "test"
}
```

**レスポンス**:
```json
{
  "status": "success",
  "message": "Connection successful",
  "timestamp": "2026-01-21T10:00:00Z"
}
```

---

## 4. リクエスト・レスポンス仕様

### 4.1 共通ヘッダー

#### リクエストヘッダー

```http
POST /cgi-bin/dneo/zap.cgi HTTP/1.1
Host: example.desknets.com
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
User-Agent: AppSuite-ITSM/1.0
```

#### レスポンスヘッダー

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Date: Tue, 21 Jan 2026 10:00:00 GMT
```

### 4.2 エラーレスポンス

#### 認証エラー（401）

```json
{
  "status": "error",
  "error": {
    "code": "AUTH_ERROR",
    "message": "認証に失敗しました",
    "details": "トークンが無効または期限切れです"
  }
}
```

#### リソース不在（404）

```json
{
  "status": "error",
  "error": {
    "code": "NOT_FOUND",
    "message": "リソースが見つかりません",
    "details": "指定されたユーザーIDが存在しません"
  }
}
```

#### サーバーエラー（500）

```json
{
  "status": "error",
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "サーバーエラーが発生しました",
    "details": "一時的なエラーです。時間をおいて再試行してください"
  }
}
```

---

## 5. エラーハンドリング

### 5.1 エラー種別

| エラーコード | HTTPステータス | 説明 | 対処 |
|------------|--------------|------|------|
| **AUTH_ERROR** | 401 | 認証エラー | 再認証が必要 |
| **FORBIDDEN** | 403 | 権限不足 | アクセス権限を確認 |
| **NOT_FOUND** | 404 | リソース不在 | パラメータを確認 |
| **VALIDATION_ERROR** | 400 | バリデーションエラー | 入力値を確認 |
| **RATE_LIMIT** | 429 | レート制限 | 時間をおいて再試行 |
| **INTERNAL_ERROR** | 500 | サーバーエラー | 再試行、管理者に連絡 |
| **NETWORK_ERROR** | - | ネットワークエラー | 接続を確認 |
| **TIMEOUT** | 408 | タイムアウト | 再試行 |

### 5.2 リトライ戦略

```javascript
async function apiCallWithRetry(apiCall, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // リトライ対象のエラーかチェック
      if (error.code === 'AUTH_ERROR' || error.code === 'VALIDATION_ERROR') {
        throw error;  // 再試行しても解決しないエラー
      }

      // 指数バックオフ
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;  // 2秒, 4秒, 8秒
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
```

---

## 6. 実装例

### 6.1 ApiClientクラス設計

```javascript
// api.js

class ApiClient {
  constructor() {
    this.baseUrl = null;
    this.authType = null;
    this.credentials = {};
    this.loadSettings();
  }

  // 設定読み込み
  loadSettings() {
    const settings = SettingsModule.get('api');
    if (settings && settings.enabled) {
      this.baseUrl = settings.endpoint;
      this.authType = settings.authType;
      this.credentials = settings.credentials;
    }
  }

  // 認証ヘッダー生成
  getAuthHeaders() {
    switch (this.authType) {
      case 'bearer':
        return {
          'Authorization': `Bearer ${this.credentials.token}`
        };

      case 'basic':
        const basicAuth = btoa(`${this.credentials.username}:${this.credentials.password}`);
        return {
          'Authorization': `Basic ${basicAuth}`
        };

      case 'apikey':
        return {
          'X-API-Key': this.credentials.apiKey
        };

      default:
        return {};
    }
  }

  // 汎用APIコール
  async call(command, params = {}) {
    if (!this.baseUrl) {
      throw new Error('API設定が無効です');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.getAuthHeaders()
    };

    const body = JSON.stringify({
      command,
      ...params
    });

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body,
        timeout: 30000  // 30秒タイムアウト
      });

      if (!response.ok) {
        throw await this.handleHttpError(response);
      }

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error.message);
      }

      return data;
    } catch (error) {
      console.error('API Call Error:', error);
      throw error;
    }
  }

  // HTTPエラー処理
  async handleHttpError(response) {
    const errorData = await response.json().catch(() => ({}));

    return {
      code: errorData.error?.code || 'HTTP_ERROR',
      message: errorData.error?.message || `HTTPエラー: ${response.status}`,
      status: response.status
    };
  }

  // ユーザー情報取得
  async getUsers(userId = null) {
    return await this.call('getuser', userId ? { userId } : {});
  }

  // アプリ一覧取得
  async getApps() {
    return await this.call('getapps');
  }

  // 接続テスト
  async testConnection() {
    return await this.call('test');
  }
}

// グローバルインスタンス
const apiClient = new ApiClient();
```

### 6.2 使用例

```javascript
// ユーザー同期
async function syncUsersFromDeskNet() {
  try {
    const response = await apiClient.getUsers();

    if (response.status === 'success') {
      const externalUsers = response.data.users;

      // ローカルユーザーとマージ
      externalUsers.forEach(extUser => {
        // 既存ユーザーの確認
        const existingUser = UserModule.getByEmail(extUser.email);

        if (existingUser) {
          // 更新
          UserModule.update(existingUser.id, {
            username: extUser.name,
            department: extUser.department
          });
        } else {
          // 新規作成
          UserModule.create({
            username: extUser.name,
            email: extUser.email,
            department: extUser.department,
            role: 'user',  // デフォルト
            password: generateTemporaryPassword()
          });
        }
      });

      return { success: true, count: externalUsers.length };
    }
  } catch (error) {
    console.error('User sync failed:', error);
    return { success: false, error: error.message };
  }
}

// 接続テスト
async function testApiConnection() {
  const testButton = document.getElementById('test-api-btn');
  const resultDiv = document.getElementById('api-test-result');

  testButton.disabled = true;
  resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> テスト中...';

  try {
    const response = await apiClient.testConnection();

    if (response.status === 'success') {
      resultDiv.innerHTML = '<i class="fas fa-check-circle" style="color:green"></i> 接続成功';
    }
  } catch (error) {
    resultDiv.innerHTML = `<i class="fas fa-times-circle" style="color:red"></i> 接続失敗: ${error.message}`;
  } finally {
    testButton.disabled = false;
  }
}
```

---

## 📊 API使用頻度の想定

| API | 呼び出し頻度 | タイミング |
|-----|------------|-----------|
| **testConnection** | 低（週1回程度） | 設定画面で手動実行 |
| **getUsers** | 低（日1回程度） | 手動同期ボタンクリック時 |
| **getApps** | 低（日1回程度） | 手動同期ボタンクリック時 |

**レート制限考慮**: 過度な呼び出しを避けるため、手動実行のみ実装

---

## ✅ レビューチェックリスト

- [ ] エンドポイントが明確
- [ ] 認証方式が適切
- [ ] エラーハンドリングが網羅的
- [ ] セキュリティが考慮されている
- [ ] 実装例が明確
- [ ] 技術リーダーレビュー完了

---

**承認**:
- API設計者: _________________ 日付: _______
- 技術リーダー: _________________ 日付: _______

**次のステップ**: セキュリティ設計書作成
