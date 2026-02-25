# コーディング規約（Coding Standards）
**プロジェクト**: Appsuite専用運用管理システム  
**作成日**: 2026-02-25  

## 1. JavaScript規約

### 1.1 基本ルール
- ES2022構文を使用
- `var`禁止、`const`/`let`のみ使用
- セミコロン必須
- シングルクォート推奨

### 1.2 命名規則
| 種別 | 規則 | 例 |
|------|------|-----|
| 変数・関数 | camelCase | `getUserList()` |
| クラス | PascalCase | `UserManager` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| プライベート | `_` プレフィックス | `_internalMethod()` |
| ファイル | kebab-case | `user-management.js` |

### 1.3 関数設計
- 1関数1責務
- 引数は最大4個まで（超える場合はオブジェクト渡し）
- 非同期処理は `async/await` を使用
- JSDocコメントを必須とする

```javascript
/**
 * ユーザーリストを取得する
 * @param {Object} filters - フィルター条件
 * @param {string} filters.role - ロール（admin/user/viewer）
 * @param {boolean} filters.isActive - アクティブフラグ
 * @returns {Promise<Array<User>>} ユーザーリスト
 */
async function getUserList(filters = {}) {
  // 実装
}
```

## 2. HTML/CSS規約

### 2.1 HTML
- セマンティックHTMLタグを積極使用（`<main>`, `<section>`, `<article>` 等）
- WAI-ARIA属性でアクセシビリティ確保
- インデント: 2スペース

### 2.2 CSS
- BEM命名規則: `.block__element--modifier`
- CSS変数（カスタムプロパティ）でテーマ管理
- `:root` に共通変数を定義

```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --spacing-base: 1rem;
  --font-size-base: 14px;
}
```

## 3. セキュリティコーディング規約
- `innerHTML` 禁止（XSS対策）→ `textContent` または `createElement` を使用
- ユーザー入力は必ずサニタイズ
- 機密情報（APIキー等）をソースコードに直書き禁止
- `eval()` 禁止
- `document.write()` 禁止

## 4. コードレビューチェックリスト
- [ ] 命名規則に従っているか
- [ ] エラーハンドリングが適切か
- [ ] 認証・認可チェックが実装されているか
- [ ] XSS/CSRF対策が施されているか
- [ ] パフォーマンスに問題はないか（不要なDOM操作等）
- [ ] JSDocコメントが記述されているか
- [ ] 単体テストが追加されているか
