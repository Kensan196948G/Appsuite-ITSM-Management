# 状態管理設計書（State Management Design）

**ドキュメントID:** WUI-STATE-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. 状態管理戦略

### 1.1 状態の分類

| 種類 | 管理方法 | 例 |
|------|---------|-----|
| ローカルUI状態 | `useState` / `useReducer` | モーダルの開閉、フォーム入力値 |
| グローバルUI状態 | Zustand | 認証状態、テーマ、言語設定、通知 |
| サーバー状態 | TanStack Query | API取得データ、キャッシュ |
| URLパラメータ状態 | React Router | 検索クエリ、ページ番号、フィルター |
| フォーム状態 | React Hook Form | フォームの値・バリデーション |

### 1.2 状態管理方針

- **最小限のグローバル状態**: グローバル状態に格納するのは、複数コンポーネント間で共有が必要なものに限定する
- **サーバー状態はTanStack Query**: APIデータはTanStack Queryのキャッシュで管理し、Zustandに複製しない
- **URLファースト**: 検索条件・フィルター・ページネーションはURLパラメータに持つ（ブラウザの戻る・共有に対応）

---

## 2. Zustand ストア定義

### 2.1 authStore - 認証状態

**ファイル:** `stores/authStore.ts`

```typescript
interface AuthState {
  // 状態
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;

  // アクション
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  initialize: () => Promise<void>;
}
```

**永続化:** `localStorage`（`accessToken` を除く一部情報）

**初期化フロー:**
```
アプリ起動
    │
    ▼
localStorage からトークン取得
    │
    ├── トークンあり → APIで検証 → ユーザー情報復元
    │
    └── トークンなし → 未認証状態のまま
```

---

### 2.2 uiStore - UI状態

**ファイル:** `stores/uiStore.ts`

```typescript
interface UIState {
  // サイドバー
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // テーマ
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // グローバルローディング
  globalLoadingCount: number;
  startLoading: () => void;
  stopLoading: () => void;

  // トースト通知
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;  // ms（デフォルト: 4000）
}
```

---

### 2.3 notificationStore - 通知状態

**ファイル:** `stores/notificationStore.ts`

```typescript
interface NotificationState {
  unreadCount: number;
  isPanelOpen: boolean;

  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
}
```

---

## 3. TanStack Query 設定

### 3.1 クエリキー規約

```typescript
// クエリキーファクトリー
export const queryKeys = {
  // ユーザー
  users: {
    all: ['users'] as const,
    list: (filters?: UserFilters) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    me: ['users', 'me'] as const,
  },
  // アイテム
  items: {
    all: ['items'] as const,
    list: (filters?: ItemFilters) => ['items', 'list', filters] as const,
    detail: (id: string) => ['items', 'detail', id] as const,
  },
  // 通知
  notifications: {
    all: ['notifications'] as const,
    list: (page?: number) => ['notifications', 'list', page] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
} as const;
```

### 3.2 グローバル設定

```typescript
// lib/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5分間はキャッシュを新鮮とみなす
      gcTime: 10 * 60 * 1000,         // 10分後にキャッシュを破棄
      retry: 3,                        // エラー時3回リトライ
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: true,      // ウィンドウフォーカス時に再取得
    },
    mutations: {
      retry: 0,                        // ミューテーションはリトライしない
    },
  },
});
```

### 3.3 カスタムフック定義

**アイテム一覧取得:**
```typescript
// hooks/useItems.ts
export function useItems(filters: ItemFilters) {
  return useQuery({
    queryKey: queryKeys.items.list(filters),
    queryFn: () => itemsApi.getList(filters),
    placeholderData: keepPreviousData,  // ページネーション時に前のデータ表示
  });
}
```

**アイテム作成:**
```typescript
export function useCreateItem() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (data: CreateItemInput) => itemsApi.create(data),
    onSuccess: () => {
      // 一覧キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      addToast({ type: 'success', title: 'データを作成しました' });
    },
    onError: (error: ApiError) => {
      addToast({ type: 'error', title: 'エラーが発生しました', message: error.message });
    },
  });
}
```

---

## 4. React Hook Form 設定

### 4.1 フォームスキーマ定義（Zod）

```typescript
// lib/validations/item.ts
import { z } from 'zod';

export const createItemSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内で入力してください'),
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  status: z.enum(['active', 'inactive', 'pending'], {
    required_error: 'ステータスは必須です',
  }),
  category: z
    .string()
    .uuid('有効なカテゴリを選択してください'),
  tags: z
    .array(z.string())
    .max(10, 'タグは10個以内で設定してください')
    .optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
```

### 4.2 フォームフック使用例

```typescript
// components/features/data/ItemForm.tsx
const form = useForm<CreateItemInput>({
  resolver: zodResolver(createItemSchema),
  defaultValues: {
    name: '',
    status: 'active',
    tags: [],
  },
});
```

---

## 5. URLパラメータ状態管理

### 5.1 カスタムフック

```typescript
// hooks/useItemFilters.ts
export function useItemFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ItemFilters = {
    page: Number(searchParams.get('page')) || 1,
    pageSize: Number(searchParams.get('pageSize')) || 20,
    search: searchParams.get('search') || '',
    status: searchParams.get('status') as ItemStatus || undefined,
    category: searchParams.get('category') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };

  const setFilters = (newFilters: Partial<ItemFilters>) => {
    const updated = { ...filters, ...newFilters };
    // pageを1に戻す（検索条件変更時）
    if (newFilters.search !== undefined || newFilters.status !== undefined) {
      updated.page = 1;
    }
    setSearchParams(
      Object.entries(updated)
        .filter(([_, v]) => v !== undefined && v !== '' && v !== 1)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
    );
  };

  return { filters, setFilters };
}
```

---

## 6. 状態遷移図（認証フロー）

```
[未認証]
  │
  ├──[ログインフォーム送信]──→ [ローディング]
  │                                │
  │                          ┌─────┴─────┐
  │                          │           │
  │                       [成功]       [失敗]
  │                          │           │
  │                    [認証済み状態]  [エラー表示]
  │                          │           │
  │                          │        [未認証に戻る]
  │                          │
  ├──[トークン期限切れ]──→ [自動リフレッシュ]
  │                          │
  │                   ┌──────┴──────┐
  │                   │             │
  │                [成功]         [失敗]
  │                   │             │
  │            [認証継続]      [強制ログアウト]
  │
  └──[ログアウト]──→ [未認証]
```

---

## 7. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
