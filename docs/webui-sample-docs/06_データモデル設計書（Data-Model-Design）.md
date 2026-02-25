# データモデル設計書（Data Model Design）

**ドキュメントID:** WUI-DATA-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. データモデル概要

### 1.1 採用データベース

| 用途 | DBMS | バージョン |
|------|------|----------|
| メインデータ | PostgreSQL | 16.x |
| キャッシュ・セッション | Redis | 7.x |
| ファイルストレージ | AWS S3 | - |

### 1.2 ER図（エンティティ関連図）

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  users   │       │    items     │       │categories│
│----------│       │--------------│       │----------│
│ id (PK)  │──1:N──│ id (PK)      │──N:1──│ id (PK)  │
│ name     │       │ name         │       │ name     │
│ email    │       │ description  │       │ slug     │
│ password │       │ status       │       │ parent_id│
│ role     │       │ category_id  │       └──────────┘
│ is_active│       │ created_by   │
└──────────┘       │ updated_by   │
     │             └──────────────┘
     │                    │
     │                    │ 1:N
     │             ┌──────▼─────────┐
     │             │   item_tags    │
     │             │----------------│
     │             │ item_id (FK)   │
     │             │ tag_id  (FK)   │
     │             └────────────────┘
     │                    │ N:1
     │             ┌──────▼─────────┐
     │             │      tags      │
     │             │----------------│
     │             │ id (PK)        │
     │             │ name           │
     │             └────────────────┘
     │
     │ 1:N
┌────▼─────────────┐       ┌──────────────────┐
│  notifications   │       │   audit_logs     │
│------------------│       │------------------│
│ id (PK)          │       │ id (PK)          │
│ user_id (FK)     │       │ table_name       │
│ title            │       │ record_id        │
│ message          │       │ action           │
│ type             │       │ old_values       │
│ is_read          │       │ new_values       │
│ created_at       │       │ user_id (FK)     │
└──────────────────┘       │ created_at       │
                            └──────────────────┘
```

---

## 2. テーブル定義

### 2.1 users テーブル

**説明:** ユーザー情報を管理する

```sql
CREATE TABLE users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,  -- bcryptハッシュ
    role        VARCHAR(20)  NOT NULL DEFAULT 'user'
                             CHECK (role IN ('super_admin', 'admin', 'user', 'viewer')),
    avatar_url  VARCHAR(512),
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    last_login  TIMESTAMP WITH TIME ZONE,
    login_count INTEGER     NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE  -- 論理削除
);
```

**インデックス:**

| インデックス名 | カラム | 種類 | 目的 |
|-------------|-------|------|------|
| users_email_idx | email | UNIQUE | メール検索 |
| users_role_idx | role | BTREE | ロール絞り込み |
| users_active_idx | is_active | BTREE | アクティブユーザー絞り込み |

**カラム説明:**

| カラム | データ型 | NULL | 説明 |
|-------|---------|------|------|
| id | UUID | NO | プライマリキー（自動生成） |
| name | VARCHAR(100) | NO | 氏名 |
| email | VARCHAR(255) | NO | メールアドレス（一意） |
| password | VARCHAR(255) | NO | bcryptハッシュ化パスワード |
| role | VARCHAR(20) | NO | ロール：super_admin/admin/user/viewer |
| avatar_url | VARCHAR(512) | YES | アバター画像URL |
| is_active | BOOLEAN | NO | アカウント有効フラグ |
| last_login | TIMESTAMPTZ | YES | 最終ログイン日時 |
| login_count | INTEGER | NO | 累計ログイン回数 |
| locked_until | TIMESTAMPTZ | YES | アカウントロック解除日時 |
| created_at | TIMESTAMPTZ | NO | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | 更新日時（トリガーで自動更新） |
| deleted_at | TIMESTAMPTZ | YES | 論理削除日時 |

---

### 2.2 items テーブル

**説明:** メインのデータエンティティ

```sql
CREATE TABLE items (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'inactive', 'pending')),
    category_id UUID        REFERENCES categories(id) ON DELETE SET NULL,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    metadata    JSONB,      -- 拡張属性
    created_by  UUID        NOT NULL REFERENCES users(id),
    updated_by  UUID        REFERENCES users(id),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE
);
```

**インデックス:**

| インデックス名 | カラム | 種類 |
|-------------|-------|------|
| items_name_idx | name | BTREE |
| items_status_idx | status | BTREE |
| items_category_idx | category_id | BTREE |
| items_created_at_idx | created_at | BTREE |
| items_fulltext_idx | name, description | GIN（全文検索） |

---

### 2.3 categories テーブル

```sql
CREATE TABLE categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id   UUID        REFERENCES categories(id) ON DELETE SET NULL,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

### 2.4 tags テーブル

```sql
CREATE TABLE tags (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50)  NOT NULL UNIQUE,
    color       VARCHAR(7),  -- HEXカラーコード（例: #FF5733）
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 2.5 item_tags テーブル（中間テーブル）

```sql
CREATE TABLE item_tags (
    item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);
```

---

### 2.6 notifications テーブル

```sql
CREATE TABLE notifications (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    message     TEXT,
    type        VARCHAR(30)  NOT NULL  -- info/success/warning/error
                             CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read     BOOLEAN     NOT NULL DEFAULT false,
    link_url    VARCHAR(512),         -- クリック時の遷移先URL
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    read_at     TIMESTAMP WITH TIME ZONE
);
```

---

### 2.7 audit_logs テーブル

```sql
CREATE TABLE audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name  VARCHAR(100) NOT NULL,
    record_id   UUID        NOT NULL,
    action      VARCHAR(10)  NOT NULL  -- CREATE/UPDATE/DELETE
                             CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    old_values  JSONB,
    new_values  JSONB,
    user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

### 2.8 refresh_tokens テーブル

```sql
CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked  BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used   TIMESTAMP WITH TIME ZONE
);
```

---

## 3. Redis データ構造

### 3.1 セッション管理

```
キー: session:{session_id}
型: Hash
TTL: 3600秒（1時間、設定変更可能）
フィールド:
  user_id: "usr_001"
  role: "user"
  email: "user@example.com"
  created_at: "2026-02-25T10:00:00Z"
```

### 3.2 レート制限

```
キー: ratelimit:{ip_address}:{endpoint}
型: String（カウンター）
TTL: 900秒（15分）
値: リクエスト回数
```

### 3.3 メールキャッシュ

```
キー: reset_token:{token}
型: String
TTL: 3600秒（1時間）
値: user_id
```

---

## 4. フロントエンドデータモデル（TypeScript型定義）

### 4.1 User型

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user' | 'viewer';
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;   // ISO8601
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Item型

```typescript
interface Item {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'pending';
  category?: Category;
  tags: Tag[];
  metadata?: Record<string, unknown>;
  createdBy: Pick<User, 'id' | 'name'>;
  updatedBy?: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 Category型

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: Category[];
}
```

### 4.4 Pagination型

```typescript
interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
```

---

## 5. データ整合性・制約

### 5.1 外部キー制約

| テーブル | カラム | 参照先 | 削除時 |
|---------|-------|-------|-------|
| items | category_id | categories.id | SET NULL |
| items | created_by | users.id | RESTRICT |
| item_tags | item_id | items.id | CASCADE |
| item_tags | tag_id | tags.id | CASCADE |
| notifications | user_id | users.id | CASCADE |
| audit_logs | user_id | users.id | SET NULL |
| refresh_tokens | user_id | users.id | CASCADE |

### 5.2 論理削除ポリシー

- `users` および `items` テーブルは論理削除（`deleted_at`カラム）を採用
- 論理削除されたレコードはAPIレスポンスに含めない
- 物理削除は管理者操作または定期バッチのみ

### 5.3 自動更新トリガー

```sql
-- updated_at の自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 6. マイグレーション管理

- ツール: **Prisma Migrate**
- マイグレーションファイル: `prisma/migrations/`
- 命名規則: `{timestamp}_{description}`（例: `20260225000000_initial_schema`）
- ロールバック: 別途ロールバックスクリプトを用意

---

## 7. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
