# レスポンシブデザイン仕様書（Responsive Design Specification）

**ドキュメントID:** WUI-RESP-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. ブレークポイント定義

### 1.1 ブレークポイント一覧

| 名称 | 幅 | 対象デバイス | Tailwind クラス |
|------|----|---------|----|
| xs | < 480px | スマートフォン（縦） | デフォルト |
| sm | 480px〜 | スマートフォン（横） | `sm:` |
| md | 768px〜 | タブレット | `md:` |
| lg | 1024px〜 | ノートPC | `lg:` |
| xl | 1280px〜 | デスクトップ | `xl:` |
| 2xl | 1536px〜 | 大型モニター | `2xl:` |

### 1.2 主要デバイス対応

| デバイス | 解像度 | ブレークポイント |
|---------|-------|-------------|
| iPhone SE | 375px | xs |
| iPhone 14 | 390px | xs |
| iPhone 14 Plus | 428px | xs/sm |
| iPad Mini | 768px | md |
| iPad Air | 820px | md |
| iPad Pro 12.9" | 1024px | lg |
| MacBook Air 13" | 1280px | xl |
| Full HD | 1920px | 2xl |

---

## 2. レイアウト変化

### 2.1 全体レイアウト

| ブレークポイント | サイドバー | コンテンツ幅 | 説明 |
|-------------|---------|----------|------|
| xs / sm | 非表示（オーバーレイ） | 100% | ハンバーガーメニュー |
| md | 折りたたみアイコン | calc(100% - 64px) | アイコンのみ表示 |
| lg以上 | 完全表示（240px） | calc(100% - 240px) | 通常レイアウト |

```
モバイル (xs/sm):
┌────────────────────────┐
│ [☰] ロゴ    [🔔][👤]  │  ← ヘッダー
├────────────────────────┤
│                        │
│  メインコンテンツ        │  ← 全幅
│  (100%)                │
│                        │
└────────────────────────┘

タブレット (md):
┌──────────────────────────────┐
│ [☰] ロゴ          [🔔][👤]  │
├────┬─────────────────────────┤
│ 📊 │                         │
│ 📋 │  メインコンテンツ          │
│ ⚙️  │  (calc(100% - 64px))     │
└────┴─────────────────────────┘

デスクトップ (lg+):
┌──────────────────────────────────────┐
│ ロゴ          [パンくず] [🔔][👤]     │
├────────────┬─────────────────────────┤
│ 📊 ダッシュ │                         │
│ 📋 データ  │  メインコンテンツ          │
│ 👥 ユーザ  │  (calc(100% - 240px))    │
│ ⚙️ 設定    │                         │
└────────────┴─────────────────────────┘
```

### 2.2 カードグリッドレイアウト

```jsx
// KPIカード レイアウト
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <KPICard />
  <KPICard />
  <KPICard />
  <KPICard />
</div>
```

| ブレークポイント | カラム数 |
|-------------|--------|
| xs | 1 |
| sm | 2 |
| lg | 4 |

### 2.3 データテーブルのレスポンシブ対応

**デスクトップ (lg+):** 全カラム表示

**タブレット (md):** 一部カラム非表示
```jsx
<th className="hidden md:table-cell">更新日</th>
```

**モバイル (xs/sm):** カード形式に変換
```
モバイル時のカードビュー:
┌──────────────────────────────┐
│ □ サンプルアイテムA   [...]  │
│   ✅ 有効  ・  カテゴリA     │
│   更新: 2026/02/25           │
└──────────────────────────────┘
```

---

## 3. コンポーネント別レスポンシブ仕様

### 3.1 ナビゲーション

| ブレークポイント | 表示形式 |
|-------------|--------|
| xs/sm | ハンバーガーメニュー → オーバーレイドロワー |
| md | アイコンのみのサイドバー（ホバーでラベル表示） |
| lg+ | アイコン+テキストのサイドバー |

**ドロワーアニメーション:**
```css
.drawer {
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
}
.drawer.open {
  transform: translateX(0);
}
```

### 3.2 フォームレイアウト

```jsx
// デスクトップ: 2カラム、モバイル: 1カラム
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField label="氏名" />
  <FormField label="メールアドレス" />
</div>
// 1カラム項目は常に全幅
<div className="md:col-span-2">
  <FormField label="説明" />
</div>
```

### 3.3 モーダルのレスポンシブ

| ブレークポイント | 表示形式 |
|-------------|--------|
| xs/sm | 画面下部からスライドアップ（フルワイド） |
| md+ | 中央配置のモーダルウィンドウ |

```css
/* モバイル: ボトムシート */
@media (max-width: 767px) {
  .modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 16px 16px 0 0;
    max-height: 90vh;
  }
}
```

### 3.4 テーブルページネーション

```jsx
// モバイル: シンプルな前/次ボタン
// デスクトップ: フルページネーション
<div className="flex items-center justify-between">
  <span className="text-sm text-gray-500">
    {/* モバイルでは件数のみ */}
    <span className="hidden sm:inline">
      {totalItems}件中 {startItem}-{endItem}件目
    </span>
  </span>

  <div className="flex gap-2">
    <Button size="sm" disabled={page === 1}>前へ</Button>
    {/* ページ番号はmd以上のみ表示 */}
    <div className="hidden md:flex gap-1">
      {pageNumbers.map(p => <PageButton key={p} page={p} />)}
    </div>
    <Button size="sm" disabled={page === totalPages}>次へ</Button>
  </div>
</div>
```

---

## 4. タッチ操作対応

### 4.1 タッチターゲットサイズ

WCAG 2.5.5（AAA）および Google Material Design 推奨サイズを準拠。

| 要素 | 最小タッチエリア |
|------|--------------|
| ボタン | 44×44px |
| リンク | 44px高さ |
| チェックボックス | 44×44px（見た目は小さくてもタッチエリアは確保） |
| テーブル行アクション | 44×44px |

```css
/* タッチターゲット拡大 */
.action-icon {
  position: relative;
}
.action-icon::after {
  content: '';
  position: absolute;
  inset: -8px;
  /* タッチエリアを拡大 */
}
```

### 4.2 スワイプ操作

| ジェスチャー | 動作 |
|-----------|------|
| 右スワイプ（モバイル） | ドロワーを開く |
| 左スワイプ（ドロワー上） | ドロワーを閉じる |
| プルダウン（一覧上） | データ更新（Pull to Refresh） |

### 4.3 ホバー依存の排除

マウスホバーのみで表示される重要な情報はタッチデバイスでも確認できるようにする。

```jsx
// 悪い例: ホバー時のみツールチップ
<button className="hover:tooltip">操作</button>

// 良い例: タップでも確認可能
<Tooltip content="この操作の説明" triggerMode="hover-or-tap">
  <button>操作</button>
</Tooltip>
```

---

## 5. 印刷対応（オプション）

```css
@media print {
  /* ナビゲーション非表示 */
  header, aside, .no-print { display: none; }

  /* 全幅表示 */
  main { width: 100%; margin: 0; }

  /* カラー印刷対応 */
  .badge { border: 1px solid; }

  /* 改ページ制御 */
  .page-break { page-break-before: always; }
  tr { page-break-inside: avoid; }
}
```

---

## 6. テスト要件

### 6.1 レスポンシブテスト対象ブレークポイント

- 375px（iPhone SE）
- 768px（iPad）
- 1024px（iPad Pro / ノートPC）
- 1280px（デスクトップ）
- 1920px（フルHD）

### 6.2 テストツール

- Chrome DevTools モバイルエミュレーション
- BrowserStack（実機テスト）
- Playwright（`viewport` 設定によるテスト）

---

## 7. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
