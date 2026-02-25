# ルーティング設計書（Routing Design）

**ドキュメントID:** WUI-ROUTE-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. ルーティング基本方針

- **React Router v6** を使用
- **History API** ベースのルーティング（ハッシュルーティング不使用）
- **コード分割（Lazy Loading）**: ページコンポーネントは遅延ロード
- **認証ガード**: 保護されたルートへの未認証アクセスはログイン画面にリダイレクト
- **権限ガード**: ロール不足時は403エラー画面を表示

---

## 2. ルート定義一覧

### 2.1 公開ルート（認証不要）

| パス | コンポーネント | 説明 |
|------|------------|------|
| `/login` | LoginPage | ログイン画面 |
| `/reset-password` | ResetPasswordPage | パスワードリセット要求 |
| `/reset-password/confirm` | ResetPasswordConfirmPage | パスワードリセット確定 |
| `/auth/callback` | AuthCallbackPage | OAuth2コールバック |
| `/404` | NotFoundPage | 404エラー |
| `/500` | ServerErrorPage | 500エラー |
| `/maintenance` | MaintenancePage | メンテナンス画面 |

### 2.2 保護ルート（認証必要）

| パス | コンポーネント | 必要ロール | 説明 |
|------|------------|----------|------|
| `/` | redirect → `/dashboard` | user以上 | ルートリダイレクト |
| `/dashboard` | DashboardPage | user以上 | ダッシュボード |
| `/data` | DataListPage | user以上 | データ一覧 |
| `/data/new` | DataCreatePage | user以上 | データ新規作成 |
| `/data/:id` | DataDetailPage | user以上 | データ詳細 |
| `/data/:id/edit` | DataEditPage | user以上 | データ編集 |
| `/notifications` | NotificationsPage | user以上 | 通知一覧 |
| `/settings/profile` | ProfileSettingsPage | user以上 | プロフィール設定 |
| `/settings/security` | SecuritySettingsPage | user以上 | セキュリティ設定 |
| `/settings/preferences` | PreferencesPage | user以上 | 表示設定 |
| `/admin/users` | UserManagementPage | admin以上 | ユーザー管理 |
| `/admin/users/new` | UserCreatePage | admin以上 | ユーザー作成 |
| `/admin/users/:id/edit` | UserEditPage | admin以上 | ユーザー編集 |
| `/admin/categories` | CategoryManagementPage | admin以上 | カテゴリ管理 |
| `/admin/logs` | AuditLogPage | super_admin | 監査ログ |
| `/admin/system` | SystemSettingsPage | super_admin | システム設定 |

---

## 3. ルーター実装

### 3.1 ルーター設定

```typescript
// router/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// 遅延ロード
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const DataListPage = lazy(() => import('@/pages/data/DataListPage'));
// ... 他のページ

const router = createBrowserRouter([
  // 公開ルート
  {
    path: '/login',
    element: (
      <GuestGuard>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </GuestGuard>
    ),
  },

  // 保護ルート（共通レイアウト）
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>,
          },
          {
            path: 'data',
            children: [
              {
                index: true,
                element: <Suspense fallback={<PageLoader />}><DataListPage /></Suspense>,
              },
              {
                path: 'new',
                element: <Suspense fallback={<PageLoader />}><DataCreatePage /></Suspense>,
              },
              {
                path: ':id',
                element: <Suspense fallback={<PageLoader />}><DataDetailPage /></Suspense>,
              },
              {
                path: ':id/edit',
                element: <Suspense fallback={<PageLoader />}><DataEditPage /></Suspense>,
              },
            ],
          },
          // 管理者ルート
          {
            path: 'admin',
            element: <RoleGuard allowedRoles={['admin', 'super_admin']} />,
            children: [
              {
                path: 'users',
                element: <Suspense fallback={<PageLoader />}><UserManagementPage /></Suspense>,
              },
              // ...
            ],
          },
        ],
      },
    ],
  },

  // エラーページ
  { path: '/404', element: <NotFoundPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '*', element: <Navigate to="/404" replace /> },
]);
```

---

## 4. 認証ガードコンポーネント

### 4.1 AuthGuard

```typescript
// router/guards/AuthGuard.tsx
const AuthGuard = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    // ログイン後に元のURLへリダイレクトするため、現在のURLを保持
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
```

### 4.2 RoleGuard

```typescript
// router/guards/RoleGuard.tsx
interface RoleGuardProps {
  allowedRoles: UserRole[];
}

const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
```

### 4.3 GuestGuard（ログイン済みユーザーをリダイレクト）

```typescript
// router/guards/GuestGuard.tsx
const GuestGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

---

## 5. ナビゲーションユーティリティ

### 5.1 カスタムフック

```typescript
// hooks/useNavigate.ts
export function useAppNavigate() {
  const navigate = useNavigate();

  return {
    toLogin: (from?: string) => navigate('/login', { state: { from } }),
    toDashboard: () => navigate('/dashboard'),
    toDataList: (filters?: ItemFilters) => {
      const params = new URLSearchParams(
        Object.entries(filters || {})
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      );
      navigate(`/data?${params.toString()}`);
    },
    toDataDetail: (id: string) => navigate(`/data/${id}`),
    toDataEdit: (id: string) => navigate(`/data/${id}/edit`),
    back: () => navigate(-1),
  };
}
```

---

## 6. パンくずリスト自動生成

```typescript
// hooks/useBreadcrumbs.ts
const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ label: 'ホーム', href: '/dashboard' }],
  '/data': [
    { label: 'ホーム', href: '/dashboard' },
    { label: 'データ管理', href: '/data' },
  ],
  '/data/:id': [
    { label: 'ホーム', href: '/dashboard' },
    { label: 'データ管理', href: '/data' },
    { label: 'データ詳細' },
  ],
  '/data/:id/edit': [
    { label: 'ホーム', href: '/dashboard' },
    { label: 'データ管理', href: '/data' },
    { label: 'データ詳細', href: '/data/:id' },
    { label: '編集' },
  ],
  '/admin/users': [
    { label: 'ホーム', href: '/dashboard' },
    { label: '管理', href: '/admin' },
    { label: 'ユーザー管理' },
  ],
};
```

---

## 7. ルーティングのSEO・パフォーマンス考慮

### 7.1 コード分割戦略

| バンドル名 | 含まれるページ | 分割単位 |
|----------|------------|---------|
| main | アプリケーションコア | 常時読み込み |
| auth | ログイン・パスワードリセット | 認証前 |
| dashboard | ダッシュボード | ルートレベル |
| data | データ管理系ページ | ルートグループ |
| admin | 管理者ページ | ロールベース |
| settings | 設定ページ群 | ルートグループ |

### 7.2 プリフェッチ戦略

- ダッシュボードへのログイン後、データ管理・設定ページをバックグラウンドプリフェッチ
- ホバー時に関連ページのコードをプリフェッチ（`<Link>`のhover event）

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
