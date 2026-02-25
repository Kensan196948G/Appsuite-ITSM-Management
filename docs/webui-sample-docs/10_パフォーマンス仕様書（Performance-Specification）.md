# パフォーマンス仕様書（Performance Specification）

**ドキュメントID:** WUI-PERF-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. パフォーマンス目標値

### 1.1 Core Web Vitals（Google 指標）

| 指標 | 説明 | 目標値（Good） | 許容値（Needs Improvement） |
|------|------|-------------|--------------------------|
| LCP（Largest Contentful Paint） | 最大コンテンツの表示時間 | < 2.5秒 | < 4.0秒 |
| FID（First Input Delay） | 最初の入力への応答時間 | < 100ms | < 300ms |
| CLS（Cumulative Layout Shift） | 累積レイアウトシフト | < 0.1 | < 0.25 |
| FCP（First Contentful Paint） | 最初のコンテンツ表示時間 | < 1.8秒 | < 3.0秒 |
| TTFB（Time to First Byte） | 最初のバイト受信時間 | < 600ms | < 1800ms |
| INP（Interaction to Next Paint） | インタラクション応答時間 | < 200ms | < 500ms |

### 1.2 APIパフォーマンス目標

| エンドポイント種別 | 95パーセンタイル | 99パーセンタイル |
|----------------|--------------|--------------|
| 一覧取得 | < 500ms | < 1000ms |
| 詳細取得 | < 200ms | < 500ms |
| 作成・更新 | < 300ms | < 800ms |
| 削除 | < 200ms | < 500ms |
| エクスポート（100件以下） | < 2000ms | < 5000ms |

### 1.3 負荷目標

| 指標 | 目標値 |
|------|-------|
| 同時アクティブユーザー | 500ユーザー |
| 1時間あたりリクエスト数 | 50,000 リクエスト |
| データ量 | 10万件まで性能劣化なし |

---

## 2. フロントエンド最適化

### 2.1 バンドルサイズ目標

| バンドル | 目標サイズ（gzip後） |
|--------|-----------------|
| main.js（初期ロード） | < 100KB |
| vendor.js（共通ライブラリ） | < 200KB |
| 各ページチャンク | < 50KB |
| 合計初期ロード | < 300KB |

### 2.2 コード分割戦略

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // vendorチャンク
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query', 'axios'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'chart-vendor': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
```

### 2.3 画像最適化

| 対策 | 内容 |
|------|------|
| 形式 | WebP/AVIF 優先（JPEG/PNG フォールバック） |
| 遅延読み込み | `loading="lazy"` 属性 + Intersection Observer |
| サイズ最適化 | `srcset` によるレスポンシブ画像 |
| アイコン | SVG スプライト または Font Awesome |
| アバター | CDN経由で最適化配信 |

### 2.4 キャッシュ戦略

```
# Nginx キャッシュ設定
location /assets/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location /index.html {
  expires -1;
  add_header Cache-Control "no-store, no-cache";
}

location /api/ {
  add_header Cache-Control "no-store";
}
```

**TanStack Query キャッシュ設定:**

| データ種別 | staleTime | gcTime | 備考 |
|----------|----------|--------|------|
| ユーザー情報（自分） | 5分 | 10分 | - |
| データ一覧 | 2分 | 5分 | フィルター変更で無効化 |
| データ詳細 | 5分 | 10分 | - |
| カテゴリ一覧 | 30分 | 60分 | 変更頻度低 |
| ダッシュボードKPI | 1分 | 3分 | 頻繁更新 |
| 通知未読数 | 30秒 | 1分 | リアルタイム性重視 |

---

## 3. レンダリング最適化

### 3.1 React 最適化

| 技法 | 適用場面 |
|------|---------|
| `React.memo` | 親の再レンダリングで不要な再描画が起きるコンポーネント |
| `useMemo` | 計算コストの高い値の再計算防止 |
| `useCallback` | 子コンポーネントに渡す関数の再生成防止 |
| 仮想リスト | 1000件以上のリスト表示（`@tanstack/react-virtual`） |
| `Suspense` + `lazy` | ページコンポーネントの遅延ロード |

### 3.2 大規模リスト仮想化

```typescript
// 1000件以上のリストには仮想スクロールを適用
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedList = ({ items }: { items: Item[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,  // 1行の高さ
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: `${virtualRow.start}px`,
              width: '100%',
            }}
          >
            <ItemRow item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 4. APIサーバー最適化

### 4.1 データベースクエリ最適化

```sql
-- 一覧取得の最適化例（インデックス活用）
EXPLAIN ANALYZE
SELECT i.*, c.name as category_name
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.deleted_at IS NULL
  AND i.status = 'active'
  AND i.name ILIKE '%search%'
ORDER BY i.created_at DESC
LIMIT 20 OFFSET 0;
-- → 複合インデックス (deleted_at, status, created_at) を作成
```

**N+1問題の防止:**
- Prisma の `include` による JOIN ロード
- リレーション取得は必要なフィールドのみ `select`

### 4.2 レスポンスキャッシュ

| エンドポイント | キャッシュ | TTL |
|-------------|---------|-----|
| GET /categories | Redis | 30分 |
| GET /items?（一覧） | Redis | 2分 |
| GET /dashboard/stats | Redis | 1分 |
| PUT/POST/DELETE | キャッシュなし | - |

### 4.3 ページネーション最適化

```typescript
// カーソルベースページネーション（大量データ対応）
// OFFSETパジネーションは大量データで性能劣化するため
// カーソルベースに切り替え可能な設計にする

interface CursorPaginationParams {
  cursor?: string;  // 最後のアイテムID
  limit: number;
  direction: 'next' | 'prev';
}
```

---

## 5. パフォーマンス計測・監視

### 5.1 計測ツール

| ツール | 用途 | 実施タイミング |
|-------|------|--------------|
| Lighthouse | Core Web Vitals計測 | CI/CD毎（自動） |
| WebPageTest | リアルユーザー計測 | 週次 |
| Datadog RUM | リアルユーザー監視 | 常時 |
| k6 | 負荷テスト | リリース前 |
| Clinic.js | Node.jsパフォーマンスプロファイル | ボトルネック調査時 |

### 5.2 パフォーマンスバジェット

CIパイプラインでバジェット超過時にビルドを失敗させる。

```json
// lighthouse.config.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 200}]
      }
    }
  }
}
```

---

## 6. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
