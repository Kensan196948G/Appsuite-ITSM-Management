# AppSuite管理運用システム データベース設計書

**文書番号**: DB-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年1月20日

---

## 1. 概要

### 1.1 目的
本文書は、AppSuite管理運用システムのデータ構造を定義する。

### 1.2 データストア
現行システムではブラウザのlocalStorageを使用。将来的にはサーバーサイドデータベースへの移行を想定。

---

## 2. データモデル概要

### 2.1 エンティティ関連図（ER図）

```
┌─────────────┐       ┌─────────────┐
│   users     │       │    apps     │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ username    │       │ name        │
│ email       │       │ category    │
│ department  │       │ creator     │◄──┐
│ role        │       │ recordCount │   │
│ status      │       │ status      │   │
│ lastLogin   │       │ description │   │
│ createdAt   │       │ createdAt   │   │
│ updatedAt   │       │ updatedAt   │   │
└─────────────┘       └─────────────┘   │
      │                      │          │
      │                      │          │
      │ 1:N                  │ 1:N      │
      ▼                      ▼          │
┌─────────────┐       ┌─────────────┐   │
│  incidents  │       │   changes   │   │
├─────────────┤       ├─────────────┤   │
│ id (PK)     │       │ id (PK)     │   │
│ title       │       │ title       │   │
│ description │       │ description │   │
│ appId (FK)  │───────│ appId (FK)  │───┤
│ priority    │       │ type        │   │
│ status      │       │ status      │   │
│ reporter    │       │ requester   │   │
│ assignee    │       │ approver    │   │
│ reportedAt  │       │ plannedDate │   │
│ resolvedAt  │       │ completedDate│  │
│ createdAt   │       │ createdAt   │   │
│ updatedAt   │       │ updatedAt   │   │
└─────────────┘       └─────────────┘   │
                                        │
┌─────────────┐       ┌─────────────┐   │
│    logs     │       │  settings   │   │
├─────────────┤       ├─────────────┤   │
│ id (PK)     │       │ key (PK)    │   │
│ timestamp   │       │ value       │   │
│ userId      │───────│ category    │   │
│ username    │       │ updatedAt   │   │
│ action      │       └─────────────┘   │
│ target      │                         │
│ targetId    │─────────────────────────┘
│ details     │
│ ipAddress   │
└─────────────┘
```

---

## 3. テーブル定義

### 3.1 users（ユーザー）

**テーブル概要**: システムユーザー情報を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|----------|----------|:----:|-----------|------|
| id | VARCHAR(10) | NO | 自動採番 | ユーザーID（PK） |
| username | VARCHAR(50) | NO | - | ユーザー名 |
| email | VARCHAR(100) | NO | - | メールアドレス |
| department | VARCHAR(50) | YES | NULL | 部署名 |
| role | ENUM | NO | 'ユーザー' | 権限 |
| status | ENUM | NO | 'active' | ステータス |
| lastLogin | DATETIME | YES | NULL | 最終ログイン日時 |
| createdAt | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**ENUM定義**

| カラム | 許容値 |
|--------|--------|
| role | '管理者', 'ユーザー' |
| status | 'active', 'inactive' |

**インデックス**

| インデックス名 | カラム | 種類 |
|---------------|--------|------|
| PRIMARY | id | PRIMARY |
| idx_users_email | email | UNIQUE |
| idx_users_status | status | INDEX |

**サンプルデータ**
```json
{
  "id": "U0001",
  "username": "admin",
  "email": "admin@example.com",
  "department": "IT部",
  "role": "管理者",
  "status": "active",
  "lastLogin": "2026-01-20T10:30:00",
  "createdAt": "2026-01-01T00:00:00",
  "updatedAt": "2026-01-20T10:30:00"
}
```

---

### 3.2 apps（アプリ）

**テーブル概要**: AppSuiteアプリ情報を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|----------|----------|:----:|-----------|------|
| id | VARCHAR(10) | NO | 自動採番 | アプリID（PK） |
| name | VARCHAR(100) | NO | - | アプリ名 |
| category | ENUM | NO | - | カテゴリ |
| creator | VARCHAR(50) | NO | - | 作成者 |
| recordCount | INT | YES | 0 | レコード数 |
| status | ENUM | NO | 'active' | ステータス |
| description | TEXT | YES | NULL | 説明 |
| createdAt | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**ENUM定義**

| カラム | 許容値 |
|--------|--------|
| category | '業務管理', '申請・承認', 'データ管理', 'その他' |
| status | 'active', 'maintenance', 'inactive' |

**サンプルデータ**
```json
{
  "id": "A0001",
  "name": "勤怠管理アプリ",
  "category": "業務管理",
  "creator": "admin",
  "recordCount": 150,
  "status": "active",
  "description": "従業員の勤怠を管理するアプリ",
  "createdAt": "2026-01-01T00:00:00",
  "updatedAt": "2026-01-20T09:00:00"
}
```

---

### 3.3 incidents（インシデント）

**テーブル概要**: インシデント情報を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|----------|----------|:----:|-----------|------|
| id | VARCHAR(10) | NO | 自動採番 | インシデントID（PK） |
| title | VARCHAR(100) | NO | - | タイトル |
| description | TEXT | NO | - | 詳細説明 |
| appId | VARCHAR(10) | NO | - | 対象アプリID（FK） |
| priority | ENUM | NO | 'medium' | 優先度 |
| status | ENUM | NO | 'open' | ステータス |
| reporter | VARCHAR(50) | NO | - | 報告者 |
| assignee | VARCHAR(50) | YES | NULL | 担当者 |
| reportedAt | DATETIME | NO | CURRENT_TIMESTAMP | 報告日時 |
| resolvedAt | DATETIME | YES | NULL | 解決日時 |
| createdAt | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**ENUM定義**

| カラム | 許容値 |
|--------|--------|
| priority | 'high', 'medium', 'low' |
| status | 'open', 'in_progress', 'resolved', 'closed' |

**外部キー**

| 制約名 | カラム | 参照テーブル | 参照カラム |
|--------|--------|-------------|-----------|
| fk_incidents_app | appId | apps | id |

**サンプルデータ**
```json
{
  "id": "INC-0001",
  "title": "ログインできない",
  "description": "勤怠管理アプリにログインできない問題が発生",
  "appId": "A0001",
  "priority": "high",
  "status": "in_progress",
  "reporter": "user1",
  "assignee": "admin",
  "reportedAt": "2026-01-20T09:00:00",
  "resolvedAt": null,
  "createdAt": "2026-01-20T09:00:00",
  "updatedAt": "2026-01-20T10:00:00"
}
```

---

### 3.4 changes（変更要求）

**テーブル概要**: 変更要求情報を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|----------|----------|:----:|-----------|------|
| id | VARCHAR(10) | NO | 自動採番 | 変更要求ID（PK） |
| title | VARCHAR(100) | NO | - | タイトル |
| description | TEXT | NO | - | 詳細説明 |
| appId | VARCHAR(10) | NO | - | 対象アプリID（FK） |
| type | ENUM | NO | - | タイプ |
| status | ENUM | NO | 'draft' | ステータス |
| requester | VARCHAR(50) | NO | - | 申請者 |
| approver | VARCHAR(50) | YES | NULL | 承認者 |
| plannedDate | DATE | YES | NULL | 予定実施日 |
| completedDate | DATE | YES | NULL | 完了日 |
| createdAt | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updatedAt | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**ENUM定義**

| カラム | 許容値 |
|--------|--------|
| type | 'feature', 'modification', 'bugfix', 'improvement' |
| status | 'draft', 'pending', 'approved', 'in_progress', 'completed', 'rejected' |

**サンプルデータ**
```json
{
  "id": "CHG-0001",
  "title": "月次レポート機能追加",
  "description": "勤怠データの月次レポート出力機能を追加",
  "appId": "A0001",
  "type": "feature",
  "status": "pending",
  "requester": "user1",
  "approver": null,
  "plannedDate": "2026-02-01",
  "completedDate": null,
  "createdAt": "2026-01-15T00:00:00",
  "updatedAt": "2026-01-18T00:00:00"
}
```

---

### 3.5 logs（監査ログ）

**テーブル概要**: システム操作ログを管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|----------|----------|:----:|-----------|------|
| id | VARCHAR(20) | NO | 自動採番 | ログID（PK） |
| timestamp | DATETIME | NO | CURRENT_TIMESTAMP | 操作日時 |
| userId | VARCHAR(10) | NO | - | 操作ユーザーID |
| username | VARCHAR(50) | NO | - | 操作ユーザー名 |
| action | ENUM | NO | - | 操作タイプ |
| target | ENUM | NO | - | 対象 |
| targetId | VARCHAR(10) | YES | NULL | 対象ID |
| details | TEXT | YES | NULL | 詳細情報 |
| ipAddress | VARCHAR(45) | NO | - | IPアドレス |

**ENUM定義**

| カラム | 許容値 |
|--------|--------|
| action | 'login', 'logout', 'create', 'update', 'delete', 'export' |
| target | 'user', 'app', 'incident', 'change', 'system' |

**インデックス**

| インデックス名 | カラム | 種類 |
|---------------|--------|------|
| PRIMARY | id | PRIMARY |
| idx_logs_timestamp | timestamp | INDEX |
| idx_logs_userId | userId | INDEX |
| idx_logs_action | action | INDEX |

**サンプルデータ**
```json
{
  "id": "LOG-20260120-0001",
  "timestamp": "2026-01-20T10:30:00",
  "userId": "U0001",
  "username": "admin",
  "action": "create",
  "target": "user",
  "targetId": "U0005",
  "details": "新規ユーザー作成: user5",
  "ipAddress": "192.168.1.100"
}
```

---

### 3.6 settings（設定）

**テーブル概要**: システム設定を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|----------|----------|:----:|-----------|------|
| key | VARCHAR(50) | NO | - | 設定キー（PK） |
| value | TEXT | YES | NULL | 設定値 |
| category | VARCHAR(20) | NO | - | カテゴリ |
| updatedAt | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**カテゴリ一覧**

| カテゴリ | 説明 |
|----------|------|
| api | API接続設定 |
| general | 基本設定 |
| notification | 通知設定 |
| security | セキュリティ設定 |
| workflow | ワークフロー設定 |
| backup | バックアップ設定 |

**設定キー一覧**

| キー | カテゴリ | データ型 | 説明 |
|------|----------|----------|------|
| apiUrl | api | String | APIエンドポイントURL |
| apiKey | api | String | APIキー |
| authMethod | api | Enum | 認証方式 |
| timeout | api | Number | タイムアウト（秒） |
| syncInterval | api | Number | 同期間隔（分） |
| systemName | general | String | システム名 |
| orgName | general | String | 組織名 |
| adminEmail | general | String | 管理者メール |
| theme | general | Enum | テーマ |
| language | general | Enum | 言語 |
| dateFormat | general | String | 日付形式 |
| pageSize | general | Number | 表示件数 |
| notifyIncidentNew | notification | Boolean | 新規インシデント通知 |
| notifyIncidentHigh | notification | Boolean | 高優先度通知 |
| notifyChangeApproval | notification | Boolean | 承認依頼通知 |
| notifyChangeComplete | notification | Boolean | 変更完了通知 |
| smtpHost | notification | String | SMTPホスト |
| smtpPort | notification | Number | SMTPポート |
| smtpUser | notification | String | SMTPユーザー |
| smtpPass | notification | String | SMTPパスワード |
| smtpSsl | notification | Boolean | SSL使用 |
| pwMinLength | security | Number | パスワード最小文字数 |
| pwRequireUpper | security | Boolean | 大文字必須 |
| pwRequireNumber | security | Boolean | 数字必須 |
| pwRequireSpecial | security | Boolean | 特殊文字必須 |
| pwExpireDays | security | Number | 有効期限 |
| sessionTimeout | security | Number | セッションタイムアウト |
| maxSessions | security | Number | 最大同時ログイン |
| enableTwoFactor | security | Boolean | 二要素認証 |
| maxLoginAttempts | security | Number | 失敗許容回数 |
| lockoutDuration | security | Number | ロック時間 |
| incidentAutoAssign | workflow | Boolean | 自動割当 |
| incidentDefaultAssignee | workflow | String | デフォルト担当者 |
| incidentEscalation | workflow | Number | エスカレーション期限 |
| changeRequireApproval | workflow | Boolean | 承認必須 |
| changeApprover | workflow | String | 承認者 |
| changeLeadTime | workflow | Number | リードタイム |
| allowSkipStatus | workflow | Boolean | ステータススキップ |
| requireComment | workflow | Boolean | コメント必須 |
| autoBackup | backup | Boolean | 自動バックアップ |
| backupInterval | backup | Enum | バックアップ間隔 |
| backupRetention | backup | Number | 保持世代数 |

---

## 4. localStorageキー構造

### 4.1 キー一覧

| キー名 | データ型 | 説明 |
|--------|----------|------|
| appsuite_users | Array | ユーザーデータ配列 |
| appsuite_apps | Array | アプリデータ配列 |
| appsuite_incidents | Array | インシデントデータ配列 |
| appsuite_changes | Array | 変更要求データ配列 |
| appsuite_logs | Array | 監査ログデータ配列 |
| appsuite_settings | Object | 設定データオブジェクト |

### 4.2 データ保存形式

```javascript
// 保存
localStorage.setItem('appsuite_users', JSON.stringify(usersArray));

// 取得
const users = JSON.parse(localStorage.getItem('appsuite_users') || '[]');
```

### 4.3 容量管理

| 項目 | 値 |
|------|-----|
| localStorage上限 | 5MB（ブラウザ依存） |
| 推奨最大レコード数/テーブル | 1000件 |
| ログ保持件数 | 10000件（超過時古いものから削除） |

---

## 5. ID採番ルール

### 5.1 各エンティティのID形式

| エンティティ | プレフィックス | 形式 | 例 |
|-------------|---------------|------|-----|
| users | U | U + 4桁連番 | U0001 |
| apps | A | A + 4桁連番 | A0001 |
| incidents | INC- | INC- + 4桁連番 | INC-0001 |
| changes | CHG- | CHG- + 4桁連番 | CHG-0001 |
| logs | LOG- | LOG- + 日付 + 4桁連番 | LOG-20260120-0001 |

### 5.2 採番ロジック

```javascript
function generateId(prefix, items) {
    const maxId = items.reduce((max, item) => {
        const num = parseInt(item.id.replace(/\D/g, ''));
        return num > max ? num : max;
    }, 0);
    return prefix + String(maxId + 1).padStart(4, '0');
}
```

---

## 6. データ移行計画

### 6.1 将来のデータベース移行

| フェーズ | 内容 | データベース |
|---------|------|-------------|
| Phase 1 | 現行（localStorage） | ブラウザ内蔵 |
| Phase 2 | SQLite | SQLite3 |
| Phase 3 | 本番DB | MySQL / PostgreSQL |

### 6.2 移行スクリプト（予定）

```javascript
// localStorageからDBへの移行
async function migrateToDatabase() {
    const users = JSON.parse(localStorage.getItem('appsuite_users') || '[]');
    const apps = JSON.parse(localStorage.getItem('appsuite_apps') || '[]');
    // ... 各テーブルへINSERT
}
```

---

## 7. バックアップ形式

### 7.1 エクスポート形式

```json
{
  "exportedAt": "2026-01-20T10:00:00Z",
  "version": "1.0",
  "data": {
    "users": [...],
    "apps": [...],
    "incidents": [...],
    "changes": [...],
    "logs": [...],
    "settings": {...}
  }
}
```

### 7.2 ファイル名規則

```
appsuite_backup_YYYYMMDD_HHMMSS.json
例: appsuite_backup_20260120_100000.json
```

---

**文書履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2026-01-20 | 初版作成 | - |
