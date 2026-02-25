# データモデル設計（Data Model Design）
**プロジェクト**: Appsuite専用運用管理システム  
**作成日**: 2026-02-25  

## 1. ローカルデータストレージ設計（IndexedDB）

### 1.1 users ストア
```json
{
  "id": "string (UUID)",
  "username": "string",
  "email": "string",
  "displayName": "string",
  "role": "admin | user | viewer",
  "department": "string",
  "isActive": "boolean",
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

### 1.2 apps ストア
```json
{
  "id": "string (UUID)",
  "appId": "string (DeskNet's Neo App ID)",
  "name": "string",
  "description": "string",
  "category": "string",
  "status": "active | inactive | maintenance",
  "owner": "string (user ID)",
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

### 1.3 incidents ストア
```json
{
  "id": "string (UUID)",
  "title": "string",
  "description": "string",
  "priority": "critical | high | medium | low",
  "status": "open | in-progress | resolved | closed",
  "assignee": "string (user ID)",
  "relatedApp": "string (app ID)",
  "createdBy": "string (user ID)",
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime",
  "resolvedAt": "ISO8601 datetime | null"
}
```

### 1.4 changes ストア
```json
{
  "id": "string (UUID)",
  "title": "string",
  "description": "string",
  "type": "normal | emergency | standard",
  "risk": "high | medium | low",
  "status": "draft | pending | approved | implementing | completed | rejected",
  "approvers": ["string (user IDs)"],
  "requestedBy": "string (user ID)",
  "scheduledDate": "ISO8601 datetime",
  "createdAt": "ISO8601 datetime"
}
```

### 1.5 auditLogs ストア
```json
{
  "id": "string (UUID)",
  "userId": "string",
  "action": "string",
  "resource": "string",
  "resourceId": "string",
  "details": "object",
  "ipAddress": "string",
  "userAgent": "string",
  "timestamp": "ISO8601 datetime"
}
```

## 2. 設定データ（localStorage）

| キー | 型 | 説明 |
|------|-----|------|
| `appsuite_api_endpoint` | string | DeskNet's Neo APIエンドポイントURL |
| `appsuite_api_key_encrypted` | string | 暗号化されたAPIキー |
| `appsuite_session_token` | string | 認証トークン |
| `appsuite_settings` | JSON | システム設定全般 |
| `appsuite_user_preferences` | JSON | ユーザー個別設定 |
