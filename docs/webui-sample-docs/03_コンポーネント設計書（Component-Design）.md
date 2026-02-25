# コンポーネント設計書（Component Design Document）

**ドキュメントID:** WUI-COMP-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. コンポーネント設計方針

### 1.1 基本原則

- **Atomic Design** パターンを採用（Atoms → Molecules → Organisms → Templates → Pages）
- **単一責任原則**: 1コンポーネント1責任
- **再利用性**: 汎用コンポーネントは `components/ui/` に配置
- **型安全**: すべてのProps/Emitsに TypeScript 型定義必須
- **アクセシビリティ**: ARIA属性の適切な付与

### 1.2 コンポーネント分類

```
src/
├── components/
│   ├── ui/           # Atoms: 基本UIコンポーネント
│   ├── common/       # Molecules: 複合コンポーネント
│   ├── layout/       # レイアウトコンポーネント
│   ├── features/     # Organisms: 機能コンポーネント
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── data/
│   │   └── settings/
│   └── pages/        # ページコンポーネント
```

---

## 2. 基本UIコンポーネント（Atoms）

### 2.1 Button コンポーネント

**ファイル:** `components/ui/Button.tsx`

**Props定義:**
```typescript
interface ButtonProps {
  /** ボタンのラベルテキスト */
  children: React.ReactNode;
  /** ボタンの種別 */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  /** ボタンのサイズ */
  size?: 'sm' | 'md' | 'lg';
  /** 無効状態 */
  disabled?: boolean;
  /** ローディング状態 */
  loading?: boolean;
  /** アイコン（左側） */
  leftIcon?: React.ReactNode;
  /** アイコン（右側） */
  rightIcon?: React.ReactNode;
  /** クリックハンドラ */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** HTMLのtype属性 */
  type?: 'button' | 'submit' | 'reset';
  /** 追加CSSクラス */
  className?: string;
  /** アクセシビリティラベル（アイコンのみの場合必須） */
  'aria-label'?: string;
}
```

**スタイル仕様:**

| variant | 背景色 | テキスト色 | ホバー |
|---------|------|----------|-------|
| primary | #2563EB | white | #1D4ED8 |
| secondary | #F3F4F6 | #374151 | #E5E7EB |
| danger | #DC2626 | white | #B91C1C |
| ghost | transparent | #374151 | #F9FAFB |
| link | transparent | #2563EB | underline |

| size | パディング | フォントサイズ | 高さ |
|------|----------|------------|------|
| sm | 8px 12px | 12px | 32px |
| md | 10px 16px | 14px | 40px |
| lg | 12px 24px | 16px | 48px |

---

### 2.2 Input コンポーネント

**ファイル:** `components/ui/Input.tsx`

**Props定義:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** ラベルテキスト */
  label?: string;
  /** エラーメッセージ */
  error?: string;
  /** ヘルプテキスト */
  helperText?: string;
  /** 必須フラグ */
  required?: boolean;
  /** 左側アイコン */
  leftIcon?: React.ReactNode;
  /** 右側アドオン */
  rightAddon?: React.ReactNode;
  /** フルワイド */
  fullWidth?: boolean;
}
```

**状態別スタイル:**

| 状態 | ボーダー色 | 背景色 |
|------|----------|-------|
| 通常 | #D1D5DB | white |
| フォーカス | #2563EB | white |
| エラー | #DC2626 | #FEF2F2 |
| 無効 | #E5E7EB | #F9FAFB |

---

### 2.3 Select コンポーネント

**ファイル:** `components/ui/Select.tsx`

**Props定義:**
```typescript
interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;  // 検索可能なセレクト
  multiple?: boolean;    // 複数選択
}
```

---

### 2.4 Badge コンポーネント

**ファイル:** `components/ui/Badge.tsx`

**Props定義:**
```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;  // ドットのみ表示
}
```

**variant別カラー:**

| variant | 背景色 | テキスト色 | 用途 |
|---------|------|----------|------|
| default | #F3F4F6 | #374151 | 一般的なラベル |
| success | #D1FAE5 | #065F46 | 成功・有効 |
| warning | #FEF3C7 | #92400E | 警告・保留 |
| danger | #FEE2E2 | #991B1B | エラー・無効 |
| info | #DBEAFE | #1E40AF | 情報・通知 |

---

### 2.5 Modal コンポーネント

**ファイル:** `components/ui/Modal.tsx`

**Props定義:**
```typescript
interface ModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** 閉じるハンドラ */
  onClose: () => void;
  /** タイトル */
  title?: string;
  /** サイズ */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 背景クリックで閉じる */
  closeOnOverlayClick?: boolean;
  /** ESCキーで閉じる */
  closeOnEsc?: boolean;
  /** フッター */
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

**サイズ定義:**

| size | 幅 |
|------|-----|
| sm | 400px |
| md | 560px |
| lg | 720px |
| xl | 960px |
| full | 100vw × 100vh |

---

## 3. 複合コンポーネント（Molecules）

### 3.1 SearchBar コンポーネント

**ファイル:** `components/common/SearchBar.tsx`

**Props定義:**
```typescript
interface SearchBarProps {
  /** 検索クエリ */
  value: string;
  /** 変更ハンドラ */
  onChange: (value: string) => void;
  /** プレースホルダー */
  placeholder?: string;
  /** デバウンス時間（ms） */
  debounceMs?: number;
  /** ローディング状態 */
  loading?: boolean;
  /** クリアボタン表示 */
  clearable?: boolean;
}
```

**動作仕様:**
- デフォルトデバウンス: 300ms
- ローディング中: 右側スピナー表示
- 値がある場合: クリアボタン（×）表示
- フォーカス時: アウトライン表示

---

### 3.2 DataTable コンポーネント

**ファイル:** `components/common/DataTable.tsx`

**Props定義:**
```typescript
interface Column<T> {
  /** 列のキー */
  key: keyof T | string;
  /** ヘッダーラベル */
  header: string;
  /** ソート可否 */
  sortable?: boolean;
  /** カスタムレンダラー */
  render?: (value: unknown, row: T) => React.ReactNode;
  /** 幅 */
  width?: string;
  /** 配置 */
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  /** データ配列 */
  data: T[];
  /** 列定義 */
  columns: Column<T>[];
  /** ローディング状態 */
  loading?: boolean;
  /** 空状態メッセージ */
  emptyMessage?: string;
  /** 行クリックハンドラ */
  onRowClick?: (row: T) => void;
  /** チェックボックス選択 */
  selectable?: boolean;
  /** 選択行 */
  selectedRows?: T[];
  /** 選択変更ハンドラ */
  onSelectionChange?: (rows: T[]) => void;
  /** ソート設定 */
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
  /** ソート変更ハンドラ */
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
}
```

---

### 3.3 Pagination コンポーネント

**ファイル:** `components/common/Pagination.tsx`

**Props定義:**
```typescript
interface PaginationProps {
  /** 現在ページ（1始まり） */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 1ページあたりの件数 */
  pageSize: number;
  /** 総件数 */
  totalItems: number;
  /** ページ変更ハンドラ */
  onPageChange: (page: number) => void;
  /** ページサイズ変更ハンドラ */
  onPageSizeChange?: (size: number) => void;
  /** 表示するページ数（省略時: 5） */
  siblingCount?: number;
}
```

---

### 3.4 FormField コンポーネント

**ファイル:** `components/common/FormField.tsx`

**Props定義:**
```typescript
interface FormFieldProps {
  /** フィールドID */
  id: string;
  /** ラベル */
  label: string;
  /** 必須フラグ */
  required?: boolean;
  /** エラーメッセージ */
  error?: string;
  /** ヘルプテキスト */
  helperText?: string;
  children: React.ReactNode;
}
```

---

## 4. 機能コンポーネント（Organisms）

### 4.1 LoginForm コンポーネント

**ファイル:** `components/features/auth/LoginForm.tsx`

**Props定義:**
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}
```

**内部状態:**
```typescript
interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  errors: { email?: string; password?: string; general?: string };
}
```

---

### 4.2 DataList コンポーネント

**ファイル:** `components/features/data/DataList.tsx`

**Props定義:**
```typescript
interface DataListProps {
  /** フィルター変更時コールバック */
  onFilterChange?: (filters: DataFilters) => void;
  /** 初期フィルター設定 */
  initialFilters?: Partial<DataFilters>;
}
```

**内包コンポーネント:**
- SearchBar（検索）
- FilterPanel（フィルター群）
- DataTable（テーブル）
- Pagination（ページネーション）
- BulkActionBar（一括操作バー）

---

### 4.3 NotificationPanel コンポーネント

**ファイル:** `components/features/notifications/NotificationPanel.tsx`

**Props定義:**
```typescript
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}
```

---

## 5. レイアウトコンポーネント

### 5.1 AppLayout

**ファイル:** `components/layout/AppLayout.tsx`

**Props定義:**
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
}
```

**内包コンポーネント:**
- Header
- Sidebar
- MainContent
- Footer

### 5.2 PageHeader

**ファイル:** `components/layout/PageHeader.tsx`

**Props定義:**
```typescript
interface PageHeaderProps {
  /** ページタイトル */
  title: string;
  /** サブタイトル */
  subtitle?: string;
  /** パンくずリスト */
  breadcrumbs?: { label: string; href?: string }[];
  /** アクションボタン群 */
  actions?: React.ReactNode;
}
```

---

## 6. コンポーネント状態管理パターン

### 6.1 ローカル状態

単一コンポーネント内で完結する状態は `useState` / `useReducer` を使用。

### 6.2 グローバル状態

複数コンポーネント間で共有する状態は Zustand ストアを使用。

```typescript
// 例: 認証状態
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}
```

### 6.3 サーバー状態

APIから取得するデータは React Query（TanStack Query）を使用。

```typescript
// 例: データ一覧取得
const { data, isLoading, error } = useQuery({
  queryKey: ['data', filters],
  queryFn: () => fetchDataList(filters),
  staleTime: 5 * 60 * 1000,  // 5分
});
```

---

## 7. アクセシビリティ要件

すべてのコンポーネントは以下のアクセシビリティ要件を満たすこと。

| 要件 | 説明 |
|------|------|
| キーボード操作 | Tab/Enter/Spaceによる操作必須 |
| スクリーンリーダー | ARIA ラベル・ロールの適切な付与 |
| フォーカス管理 | モーダル開閉時のフォーカス管理 |
| 色のコントラスト | WCAG AA 基準（4.5:1以上） |
| フォームエラー | aria-describedby でエラーと入力を関連付け |

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
