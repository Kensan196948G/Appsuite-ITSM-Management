# テスト仕様書（Test Specification）

**ドキュメントID:** WUI-TEST-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. テスト戦略

### 1.1 テストピラミッド

```
           ▲
          /E2E\      少数・高コスト
         /──────\    シナリオテスト
        /統合テスト\   中程度
       /────────────\  APIテスト・コンポーネント結合
      /ユニットテスト  \ 多数・低コスト
     /────────────────\ 関数・コンポーネント単体
```

| テスト種別 | 目標比率 | ツール |
|---------|---------|-------|
| ユニットテスト | 70% | Vitest + Testing Library |
| 統合テスト | 20% | Vitest + Testing Library |
| E2Eテスト | 10% | Playwright |

### 1.2 カバレッジ目標

| 対象 | 目標 |
|------|------|
| 全体ステートメントカバレッジ | 80%以上 |
| ユーティリティ関数 | 95%以上 |
| APIクライアント | 90%以上 |
| UIコンポーネント | 80%以上 |
| ページコンポーネント | 70%以上 |

---

## 2. ユニットテスト

### 2.1 テスト対象と範囲

| 対象 | テスト内容 |
|------|---------|
| ユーティリティ関数 | 入力/出力の正確性、エッジケース |
| カスタムフック | 状態変化、副作用 |
| Zustandストア | アクションの動作 |
| Zodスキーマ | バリデーションロジック |
| 日付/数値フォーマット | 各ロケールでの出力 |

### 2.2 ユニットテスト実装例

```typescript
// lib/utils/__tests__/date.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '../date';

describe('formatDate', () => {
  const testDate = new Date('2026-02-25T10:00:00Z');

  it('日本語の短い日付形式', () => {
    expect(formatDate(testDate, 'short', 'ja')).toBe('2026/02/25');
  });

  it('英語（US）の短い日付形式', () => {
    expect(formatDate(testDate, 'short', 'en-US')).toBe('02/25/2026');
  });

  it('相対時間（1時間前）', () => {
    const oneHourAgo = new Date(Date.now() - 3600000);
    expect(formatDate(oneHourAgo, 'relative', 'ja')).toBe('1時間前');
  });
});
```

### 2.3 カスタムフックのテスト

```typescript
// hooks/__tests__/useItemFilters.test.ts
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useItemFilters } from '../useItemFilters';

describe('useItemFilters', () => {
  it('デフォルト値が正しく設定される', () => {
    const { result } = renderHook(() => useItemFilters(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.pageSize).toBe(20);
  });

  it('検索クエリ変更でページが1にリセットされる', () => {
    const { result } = renderHook(() => useItemFilters(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/?page=3']}>{children}</MemoryRouter>
      ),
    });
    act(() => {
      result.current.setFilters({ search: 'test' });
    });
    expect(result.current.filters.page).toBe(1);
  });
});
```

---

## 3. コンポーネントテスト

### 3.1 テスト環境設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/test/**'],
    },
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 3.2 コンポーネントテスト例

```typescript
// components/ui/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('テキストが表示される', () => {
    render(<Button>保存</Button>);
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  it('無効状態でクリック不可', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>保存</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('ローディング状態でスピナー表示', () => {
    render(<Button loading>保存</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

### 3.3 MSW（Mock Service Worker）によるAPIモック

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/items', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;

    return HttpResponse.json({
      success: true,
      data: mockItems,
      pagination: { page, pageSize: 20, totalItems: 100, totalPages: 5 },
    });
  }),

  http.post('/api/v1/items', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { success: true, data: { id: 'new_id', ...body } },
      { status: 201 }
    );
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'test@example.com' && password === 'Password123!') {
      return HttpResponse.json({ success: true, data: mockAuthResponse });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS' } },
      { status: 401 }
    );
  }),
];
```

---

## 4. E2Eテスト

### 4.1 テストシナリオ一覧

| シナリオID | シナリオ名 | 優先度 |
|----------|---------|-------|
| E2E-001 | ログイン・ログアウト | 高 |
| E2E-002 | データ一覧表示・検索・フィルター | 高 |
| E2E-003 | データ新規作成 | 高 |
| E2E-004 | データ編集 | 高 |
| E2E-005 | データ削除（確認ダイアログ） | 高 |
| E2E-006 | ページネーション操作 | 中 |
| E2E-007 | キーボードナビゲーション | 中 |
| E2E-008 | レスポンシブ表示確認 | 中 |
| E2E-009 | エラー状態表示 | 低 |
| E2E-010 | データエクスポート | 低 |

### 4.2 E2Eテスト実装例

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('認証', () => {
  test('正常ログイン・ダッシュボード遷移', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード').fill('Password123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
  });

  test('ログイン失敗時のエラー表示', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('wrong@example.com');
    await page.getByLabel('パスワード').fill('WrongPass!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByRole('alert')).toContainText('メールアドレスまたはパスワードが正しくありません');
  });
});
```

```typescript
// e2e/data.spec.ts
test.describe('データ管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);  // 共通ログイン処理
  });

  test('データ新規作成', async ({ page }) => {
    await page.goto('/data');
    await page.getByRole('button', { name: '新規作成' }).click();

    await page.getByLabel('名前').fill('テストアイテム');
    await page.getByLabel('カテゴリ').selectOption('category_001');
    await page.getByRole('button', { name: '保存' }).click();

    await expect(page.getByRole('alert')).toContainText('データを作成しました');
    await expect(page.getByText('テストアイテム')).toBeVisible();
  });
});
```

### 4.3 E2E テスト設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'safari', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
```

---

## 5. アクセシビリティテスト

```typescript
// e2e/accessibility.spec.ts
import { checkA11y, injectAxe } from 'axe-playwright';

test('ダッシュボード アクセシビリティ', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard');
  await injectAxe(page);
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

---

## 6. パフォーマンステスト

### 6.1 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### 6.2 k6 負荷テスト

```javascript
// load-tests/items-api.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // ランプアップ
    { duration: '5m', target: 100 },   // 定常状態
    { duration: '2m', target: 0 },     // ランプダウン
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95%が500ms以内
    http_req_failed: ['rate<0.01'],    // エラー率1%以下
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/items`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

## 7. テスト実行・CI統合

### 7.1 ローカル実行

```bash
# ユニット・統合テスト
npm run test               # 監視モード
npm run test:run           # 一回実行
npm run test:coverage      # カバレッジレポート

# E2Eテスト
npm run test:e2e           # ヘッドレス実行
npm run test:e2e:ui        # UIモード（デバッグ）
```

### 7.2 CI/CDパイプライン統合

```yaml
# .github/workflows/test.yml
test:
  steps:
    - name: Unit & Integration Tests
      run: npm run test:coverage
    - name: Upload Coverage
      uses: codecov/codecov-action@v3
    - name: E2E Tests
      run: npx playwright test
    - name: Upload E2E Report
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: playwright-report/
```

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
