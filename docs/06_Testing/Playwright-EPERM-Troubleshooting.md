# Playwright 実行時 `spawn EPERM` 切り分け手順（Windows）

更新日: 2026-02-24
対象: `WebUI-Sample`

## 現象

- `npx playwright test` 実行時に `Error: spawn EPERM`

## 主な原因候補

1. PowerShell 実行ポリシーで `.ps1` 実行が拒否されている
2. セキュリティソフト/EDR が `node` または Playwright browser 起動をブロック
3. Playwright ブラウザ未導入（実行ファイル未配置）
4. 権限不足のディレクトリから起動している

## 切り分け手順

### 1. 実行方法を `cmd` 経由に変える

PowerShell で `.ps1` ラッパー回避:

```powershell
cmd /c npx playwright test
```

### 2. Node/Playwright の起動確認

```powershell
node -v
cd WebUI-Sample
npx playwright --version
```

### 3. ブラウザ導入確認

```powershell
cd WebUI-Sample
npx playwright install chromium
```

### 4. 実行ポリシー確認（PowerShell）

```powershell
Get-ExecutionPolicy -List
```

必要に応じて組織ポリシー範囲を確認（ローカル変更不可の場合あり）。

### 5. セキュリティソフト影響確認

- `node.exe`
- `playwright.cmd`
- Playwright が展開したブラウザ実行ファイル

上記がブロックされていないかログ/通知を確認。

## 推奨実行手順（このプロジェクト）

```powershell
cd WebUI-Sample
npm run data:verify
npm run test:e2e:win
```

## 追加確認（失敗時）

- `npx playwright test -g "モバイルメニュー"` のように1件だけ実行
- `npx playwright test --headed` でブラウザ起動可否確認
- `npm run test:e2e:win:headed` で `cmd /c` 経由の headed 実行確認
- `tests/serve-static.js` 単体起動確認
