# WebUI Sample mock-api インターフェース仕様（型定義相当）

更新日: 2026-02-24
対象: `WebUI-Sample/mock-api.js`

## 目的

`mock-api` を将来の本物APIアダプタへ差し替えやすくするため、`app.js` が期待する関数シグネチャと戻り値形式を固定化する。

## API 一覧

### `loadInitialState(): Promise<object>`

初期 state を返す。内部では `data/*.json` と overlay（差分）をマージする。

戻り値:

```js
{
  connection: {...},
  users: [...],
  apps: [...],
  incidents: [...],
  changes: [...],
  logs: [...],
  backups: [...],
  ops: {...},
  settings: {...},
  session: {...},
  ui: {...}
}
```

### `patchState(patch, meta?): PatchResult`

差分 patch をカテゴリ単位 overlay として保存する。

引数:

```js
patch: object
meta?: {
  target?: string,    // 呼び出し元機能識別子
  category?: string,  // overlayカテゴリ（例: settings/api）
  keys?: string[]     // 更新キー一覧（任意）
}
```

戻り値（固定）:

```js
{
  ok: boolean,
  updatedAt: string | null,  // ISO8601
  category: string | null,
  error: string | null       // ok=false のときエラーコード
}
```

### `getOverlayInfo(): OverlayInfo`

overlay 状態を UI 表示/診断向けに返す。

戻り値:

```js
{
  hasOverlay: boolean,
  updatedAt: string | null,
  lastWrite: {
    target?: string,
    category?: string,
    at?: string
  } | null,
  categories: Array<{
    key: string,
    updatedAt: string | null,
    meta: object | null
  }>
}
```

### `listCategories(): string[]`

現在保存されている overlay カテゴリ一覧を返す。

### `removeCategory(category): PatchResult`

指定カテゴリの overlay patch を削除する（カテゴリ単位の巻き戻し）。

### `resetOverlay(): PatchResult`

overlay 全体を初期化する（seed のみの状態に戻す）。

## 互換方針

- 既存 `statePatch` 一括保存形式（v1 overlay）は読み込み時のみ互換サポート
- 新規書き込みはカテゴリ分割 overlay（v2）を使用

## 本物APIアダプタ差し替え時の要件

- `patchState()` は同じ戻り値形式を返す
- `loadInitialState()` は `app.js` 既定 state 構造にマージ可能な JSON を返す
- エラー時でも `patchState()` は例外より戻り値（`ok=false`）を優先
