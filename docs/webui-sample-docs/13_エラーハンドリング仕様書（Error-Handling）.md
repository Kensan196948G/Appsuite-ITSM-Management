# エラーハンドリング仕様書（Error Handling Specification）

**ドキュメントID:** WUI-ERR-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. エラー分類

### 1.1 エラー種別

| 種別 | 発生源 | 例 |
|------|-------|-----|
| ネットワークエラー | 通信失敗 | タイムアウト、接続拒否 |
| APIエラー | サーバーレスポンス | 400/401/403/404/500 |
| バリデーションエラー | フォーム入力 | 必須未入力、形式不正 |
| ビジネスロジックエラー | 業務ルール違反 | 重複登録、権限不足 |
| フロントエンドエラー | JS実行時 | 予期しない例外 |
| 認証エラー | セッション | トークン期限切れ、不正 |

---

## 2. エラーコード定義

### 2.1 APIエラーコード

| エラーコード | HTTPステータス | 意味 | ユーザー向けメッセージ |
|-----------|------------|------|-----------------|
| `VALIDATION_ERROR` | 400 | 入力値が不正 | （フィールド別メッセージ） |
| `UNAUTHORIZED` | 401 | 未認証 | 「ログインが必要です」 |
| `FORBIDDEN` | 403 | 権限不足 | 「この操作を行う権限がありません」 |
| `NOT_FOUND` | 404 | リソース未存在 | 「指定されたデータが見つかりません」 |
| `CONFLICT` | 409 | データ競合 | 「既に同じデータが存在します」 |
| `BUSINESS_ERROR` | 422 | ビジネスルール違反 | （内容依存） |
| `RATE_LIMIT_EXCEEDED` | 429 | レート制限超過 | 「しばらく待ってから再試行してください」 |
| `INTERNAL_ERROR` | 500 | サーバーエラー | 「システムエラーが発生しました」 |
| `SERVICE_UNAVAILABLE` | 503 | サービス停止中 | 「現在サービスをご利用いただけません」 |
| `NETWORK_ERROR` | - | ネットワーク接続失敗 | 「接続できませんでした。ネットワークをご確認ください」 |
| `TIMEOUT_ERROR` | - | タイムアウト | 「応答がありませんでした。しばらくしてから再試行してください」 |

---

## 3. フロントエンドエラーハンドリング実装

### 3.1 Axiosインターセプタ

```typescript
// lib/api/interceptors.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// リクエストインターセプタ
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// レスポンスインターセプタ
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401: トークンリフレッシュ試行
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await useAuthStore.getState().refreshToken();
        const newToken = useAuthStore.getState().accessToken;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // リフレッシュ失敗: ログアウト
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    // ネットワークエラー
    if (!error.response) {
      throw new NetworkError('ネットワーク接続を確認してください');
    }

    // APIエラーを標準化
    throw normalizeApiError(error.response);
  }
);
```

### 3.2 エラークラス定義

```typescript
// lib/errors.ts

class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class NetworkError extends AppError {
  constructor(message = 'ネットワークエラーが発生しました') {
    super(message, 'NETWORK_ERROR');
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public fieldErrors: Record<string, string>
  ) {
    super(message, 'VALIDATION_ERROR', 400, fieldErrors);
  }
}

class AuthError extends AppError {
  constructor(message = 'ログインが必要です') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'この操作を行う権限がありません') {
    super(message, 'FORBIDDEN', 403);
  }
}
```

### 3.3 エラーバウンダリー（React Error Boundary）

```typescript
// components/common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Sentryへのエラー報告
    Sentry.captureException(error, { extra: errorInfo });
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## 4. エラー表示UI仕様

### 4.1 エラー表示方法の選択基準

| エラー種別 | 表示方法 | 理由 |
|----------|---------|------|
| フォームバリデーション | インラインエラー | 該当フィールドの直近に表示 |
| API成功/失敗通知 | トーストメッセージ | 一時的な通知 |
| 操作不可エラー | インラインバナー | 操作前に確認が必要 |
| 重大なエラー | フルページエラー画面 | 継続操作が不可能な場合 |
| 予期しないJSエラー | フォールバックUI | Error Boundary で捕捉 |

### 4.2 トーストメッセージ仕様

```typescript
interface Toast {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;        // 詳細メッセージ（任意）
  duration?: number;       // 表示時間（ms）デフォルト: 4000
  action?: {               // アクションボタン（任意）
    label: string;
    onClick: () => void;
  };
}
```

| type | アイコン | 色 | 自動クローズ |
|------|---------|----|---------  |
| success | ✅ | 緑 | 4秒 |
| error | ❌ | 赤 | 手動クローズ |
| warning | ⚠️ | 黄 | 6秒 |
| info | ℹ️ | 青 | 4秒 |

### 4.3 フォームエラー表示

```jsx
// フィールドレベルエラー
<div className="form-field">
  <input
    aria-invalid={!!errors.email}
    aria-describedby="email-error"
    className={errors.email ? 'border-red-500' : ''}
  />
  {errors.email && (
    <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">
      <AlertCircleIcon className="inline mr-1" aria-hidden="true" />
      {errors.email.message}
    </p>
  )}
</div>

// フォームレベルエラー（一般エラー）
{errors.root && (
  <div className="bg-red-50 border border-red-200 rounded p-3 mb-4" role="alert">
    <p className="text-red-800">{errors.root.message}</p>
  </div>
)}
```

### 4.4 フルページエラー画面

**404エラー:**
```
┌─────────────────────────────────────────┐
│                                          │
│              404                        │
│       ページが見つかりません              │
│                                          │
│  お探しのページは存在しないか、移動した    │
│  可能性があります。                       │
│                                          │
│  [← トップページへ戻る]                  │
│                                          │
└─────────────────────────────────────────┘
```

**500エラー:**
```
┌─────────────────────────────────────────┐
│                                          │
│              500                        │
│    システムエラーが発生しました            │
│                                          │
│  ご不便をおかけして申し訳ありません。      │
│  問題が解決しない場合は管理者に           │
│  お問い合わせください。                   │
│                                          │
│  エラーID: ERR-2026-0225-001            │
│                                          │
│  [ページを再読み込み] [トップへ戻る]      │
│                                          │
└─────────────────────────────────────────┘
```

---

## 5. エラーロギング

### 5.1 フロントエンドエラーログ

```typescript
// lib/errorLogger.ts
export const logError = (error: Error, context?: Record<string, unknown>) => {
  // 開発環境: コンソール出力
  if (import.meta.env.DEV) {
    console.error('[Error]', error, context);
  }

  // 本番環境: Sentryへ送信
  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  }
};
```

### 5.2 エラーログに含める情報

| 情報 | 説明 |
|------|------|
| エラーメッセージ | エラーの内容 |
| スタックトレース | 発生箇所の特定 |
| ユーザーID | 再現性確認（匿名化可） |
| リクエストURL | 発生したページ/API |
| タイムスタンプ | 発生日時 |
| ブラウザ/OS情報 | 環境の特定 |
| 操作履歴（直前5操作） | 再現手順の特定 |

---

## 6. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
