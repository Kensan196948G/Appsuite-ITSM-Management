# アクセシビリティ仕様書（Accessibility Specification）

**ドキュメントID:** WUI-A11Y-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. 対応方針

### 1.1 準拠基準

本システムは **WCAG 2.1 AA レベル** への準拠を目標とする。

| 基準 | レベル | 内容 |
|------|-------|------|
| WCAG 2.1 A | 必須 | 最低限のアクセシビリティ |
| WCAG 2.1 AA | 必須 | 標準的なアクセシビリティ |
| WCAG 2.1 AAA | 任意 | 高度なアクセシビリティ |

### 1.2 POUR 原則

| 原則 | 説明 |
|------|------|
| Perceivable（知覚可能） | すべての情報・UI要素が知覚できること |
| Operable（操作可能） | キーボードで操作できること |
| Understandable（理解可能） | 内容・操作が理解できること |
| Robust（堅牢） | 支援技術で確実に解釈できること |

---

## 2. 知覚可能（Perceivable）

### 2.1 テキスト代替

| 要素 | 対応 | 実装例 |
|------|------|--------|
| 情報を持つ画像 | alt属性 必須 | `<img alt="グラフ: 月次売上推移" />` |
| 装飾画像 | alt="" | `<img alt="" role="presentation" />` |
| アイコン（単独） | aria-label | `<button aria-label="削除"><TrashIcon /></button>` |
| アイコン+テキスト | aria-hidden | `<TrashIcon aria-hidden="true" /><span>削除</span>` |
| SVGグラフ | title + description | `<svg><title>売上グラフ</title><desc>...</desc></svg>` |

### 2.2 色のみに依存しない情報伝達

- エラー状態は色だけでなく、テキストメッセージ・アイコンを併用する
- ステータスバッジは色＋テキストで表示する

```jsx
// 良い例: 色 + アイコン + テキスト
<Badge variant="danger">
  <AlertCircleIcon aria-hidden="true" />
  エラー
</Badge>

// 悪い例: 色のみ
<span style={{ color: 'red' }} />
```

### 2.3 色コントラスト比

| 要素 | 最低コントラスト比 | 対象レベル |
|------|----------------|---------|
| 通常テキスト（18px未満） | 4.5:1 | AA |
| 大きいテキスト（18px以上） | 3:1 | AA |
| UIコンポーネント・グラフィック | 3:1 | AA |
| 装飾・ロゴ | 不問 | - |

**主要カラーペアのコントラスト比:**

| 前景色 | 背景色 | コントラスト比 | 合否 |
|-------|-------|------------|------|
| #111827（テキスト） | #FFFFFF（背景） | 16.7:1 | ✅ |
| #374151（サブテキスト） | #FFFFFF | 10.7:1 | ✅ |
| #6B7280（プレースホルダー） | #FFFFFF | 5.7:1 | ✅ |
| #FFFFFF | #2563EB（Primary） | 4.7:1 | ✅ |
| #FFFFFF | #DC2626（Danger） | 4.6:1 | ✅ |

---

## 3. 操作可能（Operable）

### 3.1 キーボードナビゲーション

すべての機能はマウスなしでキーボードのみで操作できること。

| キー | 動作 |
|-----|------|
| Tab | フォーカスを次の要素へ |
| Shift+Tab | フォーカスを前の要素へ |
| Enter / Space | ボタン・リンクの実行 |
| ESC | モーダル・ドロップダウンを閉じる |
| ↑↓ | リスト・メニュー内の移動 |
| ←→ | タブ・ラジオボタン間の移動 |
| Home / End | リストの先頭・末尾へ移動 |

### 3.2 フォーカスの可視化

フォーカスインジケータは視覚的に明確に表示すること（ブラウザデフォルトの非表示禁止）。

```css
/* フォーカスリングのカスタマイズ */
:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
  border-radius: 4px;
}

/* マウス操作時はアウトライン非表示（キーボード操作時のみ表示） */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 3.3 フォーカストラップ（モーダル）

モーダル表示中はフォーカスをモーダル内に閉じ込める。

```typescript
// Focus Trap の実装（shadcn/ui の Dialog は自動対応）
// モーダル外のTabキー移動を防止
// ESCキーでモーダルを閉じる
// モーダルオープン時は最初のフォーカス可能要素にフォーカス移動
// モーダルクローズ時はトリガー要素にフォーカスを戻す
```

### 3.4 スキップリンク

キーボードユーザーがナビゲーションをスキップしてメインコンテンツへジャンプできるようにする。

```html
<a href="#main-content" class="skip-link">
  メインコンテンツへスキップ
</a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #2563EB;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 9999;
}

.skip-link:focus {
  top: 0;
}
```

---

## 4. 理解可能（Understandable）

### 4.1 ページの言語設定

```html
<html lang="ja">
<!-- ページ内で言語が変わる部分 -->
<span lang="en">Lorem ipsum</span>
```

### 4.2 フォームのアクセシビリティ

```jsx
// ラベルと入力要素を明示的に関連付ける
<FormField id="email-field">
  <label htmlFor="email-field">
    メールアドレス
    <span aria-hidden="true" className="required-mark">*</span>
    <span className="sr-only">（必須）</span>
  </label>
  <input
    id="email-field"
    type="email"
    aria-required="true"
    aria-describedby="email-error email-help"
    aria-invalid={!!errors.email}
  />
  {errors.email && (
    <p id="email-error" role="alert" aria-live="polite">
      {errors.email}
    </p>
  )}
  <p id="email-help" className="helper-text">
    登録済みのメールアドレスを入力してください
  </p>
</FormField>
```

### 4.3 エラーメッセージの明確さ

| 悪い例 | 良い例 |
|-------|-------|
| 「エラー」 | 「メールアドレスの形式が正しくありません（例: user@example.com）」 |
| 「入力が不正です」 | 「パスワードは8文字以上で、大文字・小文字・数字を含める必要があります」 |
| 「接続失敗」 | 「サーバーとの接続に失敗しました。ネットワークを確認して再試行してください」 |

---

## 5. 堅牢（Robust）

### 5.1 ARIA ランドマーク

```html
<header role="banner">
  <nav role="navigation" aria-label="メインナビゲーション">
    <!-- サイドバーナビ -->
  </nav>
</header>

<main id="main-content" role="main">
  <!-- メインコンテンツ -->
</main>

<aside role="complementary" aria-label="通知パネル">
  <!-- サイドパネル -->
</aside>

<footer role="contentinfo">
  <!-- フッター -->
</footer>
```

### 5.2 ライブリージョン（動的コンテンツ通知）

```jsx
// 成功・エラー通知
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// 緊急の通知（フォームエラー等）
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// ローディング状態
<div aria-busy={isLoading} aria-label="データ読み込み中">
  {isLoading ? <Spinner /> : <DataTable />}
</div>
```

### 5.3 インタラクティブコンポーネントのARIA

**テーブル:**
```html
<table role="grid" aria-label="データ一覧">
  <thead>
    <tr>
      <th scope="col" aria-sort="descending">
        <button>更新日 <span aria-hidden="true">↓</span></button>
      </th>
    </tr>
  </thead>
</table>
```

**タブ:**
```html
<div role="tablist" aria-label="データ詳細タブ">
  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">
    基本情報
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2">
    関連データ
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  <!-- コンテンツ -->
</div>
```

---

## 6. スクリーンリーダー対応

### 6.1 対象スクリーンリーダー

| スクリーンリーダー | OS | ブラウザ | 優先度 |
|----------------|-----|---------|-------|
| NVDA | Windows | Chrome | 高 |
| JAWS | Windows | Chrome/Edge | 高 |
| VoiceOver | macOS/iOS | Safari | 高 |
| TalkBack | Android | Chrome | 中 |

### 6.2 視覚的に非表示だがスクリーンリーダーには読ませる

```css
/* Screen reader only クラス */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## 7. アクセシビリティテスト計画

### 7.1 自動テスト

```bash
# axe-core による自動チェック
npm install @axe-core/playwright

# Playwright テストに組み込み
import { checkA11y } from 'axe-playwright';
test('ダッシュボード a11y', async ({ page }) => {
  await page.goto('/dashboard');
  await checkA11y(page);
});
```

### 7.2 手動テスト項目

- [ ] キーボードのみですべての機能が操作できる
- [ ] フォーカスインジケータがすべての要素で表示される
- [ ] スキップリンクが機能する
- [ ] スクリーンリーダーで意味のある読み上げがされる
- [ ] エラーメッセージがスクリーンリーダーで読み上げられる
- [ ] モーダル開閉時のフォーカス管理が適切
- [ ] 色のコントラストが十分である

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
