# API仕様書（API Specification）

**ドキュメントID:** WUI-API-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. API基本仕様

### 1.1 ベースURL

| 環境 | URL |
|------|-----|
| 開発 | `http://localhost:3000/api/v1` |
| ステージング | `https://staging.example.com/api/v1` |
| 本番 | `https://api.example.com/api/v1` |

### 1.2 プロトコル・フォーマット

- **プロトコル:** HTTPS（本番・ステージング）
- **データ形式:** JSON（Content-Type: application/json）
- **文字コード:** UTF-8
- **APIバージョン:** URLパスにバージョン番号（v1）を含む

### 1.3 認証方式

```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

- アクセストークン有効期限: 1時間
- リフレッシュトークン有効期限: 30日
- トークン更新エンドポイント: `POST /auth/refresh`

### 1.4 共通レスポンス形式

**成功レスポンス:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-25T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**一覧レスポンス（ページネーション付き）:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  },
  "meta": {
    "timestamp": "2026-02-25T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**エラーレスポンス:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-25T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### 1.5 HTTPステータスコード

| コード | 意味 | 使用場面 |
|--------|------|---------|
| 200 | OK | 取得・更新成功 |
| 201 | Created | 新規作成成功 |
| 204 | No Content | 削除成功 |
| 400 | Bad Request | リクエスト不正・バリデーションエラー |
| 401 | Unauthorized | 未認証 |
| 403 | Forbidden | 権限不足 |
| 404 | Not Found | リソース未存在 |
| 409 | Conflict | データ競合（重複等） |
| 422 | Unprocessable Entity | ビジネスロジックエラー |
| 429 | Too Many Requests | レート制限超過 |
| 500 | Internal Server Error | サーバーエラー |

---

## 2. 認証 API

### 2.1 POST /auth/login - ログイン

**説明:** メールアドレスとパスワードで認証する

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "rememberMe": false
}
```

**レスポンス（200 OK）:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
    "expiresIn": 3600,
    "user": {
      "id": "usr_001",
      "name": "山田 太郎",
      "email": "user@example.com",
      "role": "user",
      "avatarUrl": "https://example.com/avatar/001.png"
    }
  }
}
```

**エラーケース:**

| ステータス | エラーコード | 説明 |
|----------|------------|------|
| 400 | VALIDATION_ERROR | メールアドレス・パスワード形式不正 |
| 401 | INVALID_CREDENTIALS | 認証情報不一致 |
| 423 | ACCOUNT_LOCKED | アカウントロック中 |

---

### 2.2 POST /auth/logout - ログアウト

**説明:** セッション・トークンを無効化する

**リクエストヘッダー:** `Authorization: Bearer <token>` 必須

**リクエストボディ:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**レスポンス（204 No Content）:** なし

---

### 2.3 POST /auth/refresh - トークンリフレッシュ

**リクエスト:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**レスポンス（200 OK）:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

---

### 2.4 POST /auth/password-reset/request - パスワードリセット要求

**リクエスト:**
```json
{
  "email": "user@example.com"
}
```

**レスポンス（200 OK）:**
```json
{
  "success": true,
  "data": {
    "message": "パスワードリセットメールを送信しました"
  }
}
```

---

### 2.5 POST /auth/password-reset/confirm - パスワードリセット確定

**リクエスト:**
```json
{
  "token": "reset_token_abc123",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

---

## 3. データ管理 API

### 3.1 GET /items - データ一覧取得

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|----|----|----------|------|
| page | integer | × | 1 | ページ番号 |
| pageSize | integer | × | 20 | 1ページあたりの件数（最大100） |
| search | string | × | - | 全文検索キーワード |
| status | string | × | - | ステータスフィルタ（active/inactive/pending） |
| category | string | × | - | カテゴリフィルタ |
| sortBy | string | × | createdAt | ソートキー |
| sortOrder | string | × | desc | ソート方向（asc/desc） |
| createdFrom | date | × | - | 作成日（開始）YYYY-MM-DD |
| createdTo | date | × | - | 作成日（終了）YYYY-MM-DD |

**リクエスト例:**
```
GET /api/v1/items?page=1&pageSize=20&search=sample&status=active&sortBy=name&sortOrder=asc
```

**レスポンス（200 OK）:**
```json
{
  "success": true,
  "data": [
    {
      "id": "item_001",
      "name": "サンプルアイテムA",
      "description": "説明テキスト",
      "status": "active",
      "category": "category_001",
      "categoryName": "カテゴリA",
      "tags": ["tag1", "tag2"],
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-02-25T10:00:00Z",
      "createdBy": {
        "id": "usr_001",
        "name": "山田 太郎"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

---

### 3.2 GET /items/:id - データ詳細取得

**パスパラメータ:** `id` - アイテムID

**レスポンス（200 OK）:**
```json
{
  "success": true,
  "data": {
    "id": "item_001",
    "name": "サンプルアイテムA",
    "description": "詳細な説明テキスト",
    "status": "active",
    "category": "category_001",
    "categoryName": "カテゴリA",
    "tags": ["tag1", "tag2"],
    "attachments": [
      {
        "id": "att_001",
        "fileName": "document.pdf",
        "fileSize": 1024000,
        "fileUrl": "https://cdn.example.com/files/document.pdf",
        "uploadedAt": "2026-02-01T00:00:00Z"
      }
    ],
    "relatedItems": [
      {
        "id": "item_002",
        "name": "関連アイテムB"
      }
    ],
    "auditLog": [
      {
        "action": "updated",
        "user": { "id": "usr_001", "name": "山田 太郎" },
        "timestamp": "2026-02-25T10:00:00Z",
        "changes": { "status": { "from": "inactive", "to": "active" } }
      }
    ],
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-02-25T10:00:00Z"
  }
}
```

---

### 3.3 POST /items - データ新規作成

**リクエスト:**
```json
{
  "name": "新しいアイテム",
  "description": "説明テキスト",
  "status": "active",
  "category": "category_001",
  "tags": ["tag1", "tag2"]
}
```

**バリデーション:**

| フィールド | 必須 | ルール |
|----------|------|-------|
| name | ○ | 1〜100文字 |
| description | × | 最大1000文字 |
| status | ○ | active/inactive/pending のいずれか |
| category | ○ | 存在するカテゴリIDであること |
| tags | × | 最大10個、各タグ最大50文字 |

**レスポンス（201 Created）:**
```json
{
  "success": true,
  "data": {
    "id": "item_new",
    "name": "新しいアイテム",
    ...
  }
}
```

---

### 3.4 PUT /items/:id - データ更新

**リクエスト:** POST /items と同様のボディ

**レスポンス（200 OK）:** 更新後のアイテムデータ

---

### 3.5 DELETE /items/:id - データ削除

**レスポンス（204 No Content）:** なし

---

### 3.6 DELETE /items - 一括削除

**リクエスト:**
```json
{
  "ids": ["item_001", "item_002", "item_003"]
}
```

**レスポンス（200 OK）:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 3,
    "failedIds": []
  }
}
```

---

### 3.7 GET /items/export - データエクスポート

**クエリパラメータ:**

| パラメータ | 型 | 説明 |
|----------|----|----|
| format | string | csv/excel/pdf |
| ids | string | カンマ区切りID（省略時は全件） |
| （検索パラメータ） | - | 一覧と同様のフィルタ |

**レスポンス:** ファイルダウンロード（Content-Disposition: attachment）

---

## 4. ユーザー管理 API（管理者のみ）

### 4.1 GET /admin/users - ユーザー一覧

### 4.2 POST /admin/users - ユーザー作成

**リクエスト:**
```json
{
  "name": "新規ユーザー",
  "email": "newuser@example.com",
  "role": "user",
  "sendInvite": true
}
```

### 4.3 PUT /admin/users/:id - ユーザー更新

### 4.4 DELETE /admin/users/:id - ユーザー削除

### 4.5 PUT /admin/users/:id/role - ロール変更

---

## 5. 通知 API

### 5.1 GET /notifications - 通知一覧

**クエリパラメータ:** page, pageSize, unreadOnly（boolean）

### 5.2 PUT /notifications/:id/read - 既読化

### 5.3 PUT /notifications/read-all - 全件既読化

---

## 6. レート制限

| エンドポイント | 制限 | 時間枠 |
|-------------|------|-------|
| POST /auth/login | 10回 | 15分 |
| POST /auth/password-reset/request | 3回 | 1時間 |
| その他すべて | 1000回 | 1時間 |

**レート制限超過時のレスポンスヘッダー:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706178000
Retry-After: 3600
```

---

## 7. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
