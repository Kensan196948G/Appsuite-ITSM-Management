# コーディング規約（Coding Standards）

**ドキュメントID:** WUI-CODE-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. 基本方針

- **一貫性**: チーム全員が同じスタイルで記述する
- **可読性**: 書いた当人以外が読んでも理解できるコードを書く
- **自動化**: ESLint / Prettier / TypeScript の設定で自動強制する
- **自己文書化**: 変数名・関数名でコードの意図を表現し、コメントは「なぜ」を説明する

---

## 2. TypeScript 規約

### 2.1 型定義

```typescript
// ✅ 良い例: interface でオブジェクト型を定義
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ✅ 良い例: type でユニオン型・交差型を定義
type UserRole = 'super_admin' | 'admin' | 'user' | 'viewer';
type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiError };

// ❌ 悪い例: any の使用
const user: any = { ... };  // 明確な型を使う

// ❌ 悪い例: 型アサーション（as）の乱用
const name = (response as any).user.name;
```

### 2.2 null/undefined 安全

```typescript
// ✅ Optional Chaining を使用
const userName = user?.profile?.name;

// ✅ Nullish Coalescing を使用
const displayName = user?.name ?? '未設定';

// ❌ ! (non-null assertion) の濫用
const name = user!.name;  // 本当に null でないことが確実な場合のみ
```

### 2.3 非同期処理

```typescript
// ✅ async/await を使用
const fetchUser = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response.data;
};

// ✅ エラーハンドリング
try {
  const user = await fetchUser(id);
} catch (error) {
  if (error instanceof ApiError) {
    // 特定エラーの処理
  }
  throw error;  // 未知のエラーは再throw
}
```

---

## 3. React コンポーネント規約

### 3.1 コンポーネント定義

```typescript
// ✅ 関数コンポーネント + named export
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};

// ❌ クラスコンポーネント（新規作成禁止）
class Button extends React.Component { ... }

// ❌ default export（再エクスポートの追跡が困難）
export default Button;
```

### 3.2 Props の型定義

```typescript
// ✅ コンポーネントと同ファイルに interface を定義
interface DataTableProps<T> {
  /** テーブルに表示するデータ */
  data: T[];
  /** カラム定義 */
  columns: Column<T>[];
  /** ローディング状態 */
  loading?: boolean;
  /** 行クリック時のコールバック */
  onRowClick?: (row: T) => void;
}
```

### 3.3 フック使用規則

```typescript
// ✅ フックは関数の最上位で呼び出す
const MyComponent = () => {
  const [count, setCount] = useState(0);  // ← 最上位
  const user = useAuthStore((state) => state.user);

  // ❌ 条件分岐内でのフック呼び出し禁止
  // if (condition) {
  //   const value = useHook();  // React のルール違反
  // }

  return <div>{count}</div>;
};
```

### 3.4 状態の最小化

```typescript
// ✅ 派生状態は useMemo で計算
const sortedItems = useMemo(
  () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// ❌ 派生状態を useState で管理しない
const [sortedItems, setSortedItems] = useState([]);  // items が変わるたびに同期が必要
```

---

## 4. 命名規則

### 4.1 変数・関数

| 種別 | 規則 | 例 |
|------|------|-----|
| 変数 | camelCase | `userName`, `isLoading` |
| 定数（固定値） | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT = 3` |
| 関数 | camelCase（動詞始まり） | `fetchUser`, `handleClick` |
| イベントハンドラ | `handle` + イベント名 | `handleSubmit`, `handleChange` |
| boolean変数 | `is/has/can/should` + 名詞 | `isVisible`, `hasError` |
| カスタムフック | `use` + 名詞/動詞 | `useAuth`, `useItemFilters` |

### 4.2 コンポーネント・ファイル

| 種別 | 規則 | 例 |
|------|------|-----|
| Reactコンポーネント | PascalCase | `UserProfile`, `DataTable` |
| コンポーネントファイル | PascalCase | `UserProfile.tsx` |
| フックファイル | camelCase（useで始まる） | `useAuth.ts` |
| ユーティリティファイル | camelCase | `dateUtils.ts`, `apiClient.ts` |
| 型定義ファイル | camelCase | `user.types.ts` |
| テストファイル | `*.test.ts(x)` | `Button.test.tsx` |

### 4.3 CSS/Tailwind

```tsx
// ✅ Tailwind ユーティリティクラスを直接使用
<div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow">

// ✅ 複雑な条件スタイルは clsx を使用
import { clsx } from 'clsx';

const buttonClass = clsx(
  'px-4 py-2 rounded font-medium',
  variant === 'primary' && 'bg-blue-600 text-white',
  variant === 'danger' && 'bg-red-600 text-white',
  disabled && 'opacity-50 cursor-not-allowed'
);
```

---

## 5. コメント規約

```typescript
// ✅ 「なぜ」を説明するコメント
// レート制限を避けるために 300ms デバウンスを設定
const debouncedSearch = useDebouncedCallback(onSearch, 300);

// ✅ JSDoc でパブリック API を文書化
/**
 * 日付を指定フォーマットで表示用に変換する
 * @param date - 変換する日付（ISO8601文字列またはDateオブジェクト）
 * @param format - フォーマット種別
 * @param locale - ロケールコード（デフォルト: 'ja'）
 * @returns フォーマットされた日付文字列
 */
export const formatDate = (date: Date | string, format: DateFormat, locale = 'ja'): string => { ... };

// ✅ TODO コメントは番号を付けて追跡可能に
// TODO(#123): バックエンド実装完了後にモックを削除する

// ❌ 何をしているかを説明するだけのコメント
// iを1ずつ増やす
i++;

// ❌ コメントアウトされたコード（Gitで管理するため不要）
// const oldFunction = () => { ... };
```

---

## 6. インポート・エクスポート規約

```typescript
// ✅ インポート順序（ESLint で自動整列）
// 1. Node.js ビルトイン
import path from 'path';
// 2. サードパーティライブラリ
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
// 3. 内部モジュール（パスエイリアス）
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/user';

// ✅ バレルエクスポート（index.ts）
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';
```

---

## 7. Linting・フォーマット設定

### 7.1 ESLint 設定

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 7.2 Prettier 設定

```json
// .prettierrc
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 8. コードレビュー基準

### 8.1 PR 作成ルール

- 1 PR = 1つの目的（機能追加、バグ修正、リファクタリング）
- 変更量は300行以内を目安（超える場合は分割検討）
- PR テンプレートに従って説明を記載する
- セルフレビューを行ってから他者にレビュー依頼

### 8.2 レビューチェックポイント

- [ ] TypeScript エラーがないか
- [ ] テストが書かれているか（カバレッジが低下していないか）
- [ ] アクセシビリティへの配慮があるか
- [ ] セキュリティ上の問題がないか
- [ ] パフォーマンスへの影響はないか
- [ ] 命名が適切か
- [ ] 不要なコメントアウト・デバッグログがないか

---

## 9. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
