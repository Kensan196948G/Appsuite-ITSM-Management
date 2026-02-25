# WebUI Sample: mock-api と DataStore の責務整理

更新日: 2026-02-24

## 公式化方針（Sprint 1 決定）

- 正式WebUI候補（開発の正本）は `webui-sample/` とする
- `webui-sample/` 以外の旧サンプル (`webui-sample/WebUI-Sample2/`, `webui-sample/WebUI-Sample-ITSM/`) は比較・参照用として凍結する
- 新規実装・修正・テスト追加は原則 `webui-sample/` のみで実施する
- `tools/` の生成スクリプトは `webui-sample/` を優先対象として扱う

## 目的

`WebUI-Sample` はブラウザ単体で動作するサンプルだが、将来の本番API差し替えを見据えて責務を分離する。

## 責務分担

### `mock-api.js`

- 初期データ seed の供給 (`data/*.json` / `data/seed.js`)
- デモ用の設定オーバーレイ保存（`localStorage`）
- UI から見た「外部APIらしい入口」の提供

扱うデータの基本方針:
- 初期 seed: `data/*.json`
- 変更差分: `localStorage` の overlay (`statePatch`)

### `data-store.js`

- アプリ状態全体の永続化（`IndexedDB` / `localStorage`）
- バックエンド差し替え（同期/非同期）を吸収
- スナップショットの import/export と検証フック

扱うデータの基本方針:
- 実行中 state の保存先
- IndexedDB パーティション保存の実装詳細

### `app.js`

- UI状態管理（表示中画面、フィルタ、モーダルなど）
- ユーザー操作 -> 状態更新 -> 描画
- 監査ログ記録
- `DataStore` と `mock-api` の呼び分け

## 現在の保存フロー（設定系）

1. `app.js` でフォーム値を `state.settings` に反映
2. `persist()` で `DataStore` に state 全体を保存
3. `mockApi.patchState({ settings: ... })` で設定差分を overlay 保存

この二重保存により:
- `DataStore`: 実行時状態の完全保存
- `mock-api`: 初期データとの差分・本番APIの置換ポイント

## 今後の整理候補

- `mock-api` の `statePatch` をカテゴリ単位ストアへ分割（競合回避）
- `app.js` の保存ロジックを `SettingsService` 相当へ分離
- 本物API接続時は `mock-api` と同一インターフェースで差し替える
