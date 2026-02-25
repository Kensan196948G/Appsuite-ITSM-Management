# WebUI Sample `data/*.json` 更新フロー（運用手順）

更新日: 2026-02-24
対象: `WebUI-Sample/data/*`

## 目的

初期表示データ（seed）を安全に更新し、`file://` 直開きと `mock-api` 両方で整合を保つ。

## 更新対象

- `WebUI-Sample/data/*.json`
- `WebUI-Sample/data/seed.js`（フォールバック用）

## 推奨手順

1. JSON を更新する

- 例: `WebUI-Sample/data/settings.json`
- 例: `WebUI-Sample/data/users.json`

2. 構造検証を実行する

```powershell
cd WebUI-Sample
npm run data:verify
```

任意（docs metadata 更新がある場合）:

```powershell
npm run docs:meta
npm run data:verify
```

3. `seed.js` を再生成する

```powershell
cd WebUI-Sample
npm run data:seed
```

4. ブラウザ確認を行う

- `index.html` を開いて主要ビューを確認
- 設定画面の mockApi 同期バッジが期待どおり表示されるか確認

## 注意点

- `data/*.json` は seed（初期状態）であり、実行中の変更は `DataStore` / `mock-api overlay` に保存される
- `seed.js` を再生成しないと `file://` 直開き時に古い初期値のままになる場合がある
- `settings.json` の `docsEditor` は Docs エディタ初期表示に使われる

## 変更時の最低確認項目

- `users.json`, `apps.json`, `logs.json` が配列形式
- `settings.json` に `rolePermissions`, `rowLevelRules`, `docsEditor` が存在
- `docs-metadata.generated.js` がある場合、`settings.json` と主要モジュール列定義の整合チェックが通る
- `ui.json` に `filters` が存在
