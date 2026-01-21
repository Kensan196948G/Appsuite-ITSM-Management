# MCP（Model Context Protocol）設定ガイド

## 概要

このプロジェクトでは以下のMCPサーバーを利用しています。

## 設定済みMCPサーバー一覧

### 1. GitHub MCP
**機能**: GitHub API連携（リポジトリ操作、PR管理、Issue管理）
- コマンド: `@anthropic/mcp-server-github`
- 必要な環境変数: `GITHUB_TOKEN`

### 2. Brave Search MCP
**機能**: Web検索機能
- コマンド: `@anthropic/mcp-server-brave-search`
- 必要な環境変数: `BRAVE_API_KEY`

### 3. Context7 MCP
**機能**: ドキュメント検索・ライブラリ情報取得
- コマンド: `@upstash/context7-mcp`
- 環境変数: 不要

### 4. Playwright MCP
**機能**: ブラウザ自動化・E2Eテスト
- コマンド: `@anthropic/mcp-server-playwright`
- 環境変数: 不要

### 5. Memory MCP
**機能**: セッション間のメモリ永続化
- コマンド: `@modelcontextprotocol/server-memory`
- メモリファイル: `.claude/memory.json`

### 6. Sequential Thinking MCP
**機能**: 段階的思考プロセスの記録
- コマンド: `@modelcontextprotocol/server-sequential-thinking`
- 環境変数: 不要

### 7. Claude in Chrome MCP
**機能**: Chrome DevToolsとの連携
- コマンド: `@anthropic/mcp-server-claude-in-chrome`
- 環境変数: 不要
- 備考: Chromeブラウザ拡張機能のインストールが必要

### 8. Claude Mem Plugin
**機能**: プラグインベースのメモリ管理
- プラグイン名: `claude-mem@thedotmack`
- グローバル設定で有効化済み

## 環境変数設定

### Linux/Mac
```bash
# ~/.bashrc または ~/.zshrc に追加
export GITHUB_TOKEN="your_github_token_here"
export BRAVE_API_KEY="your_brave_api_key_here"
```

### Windows (PowerShell)
```powershell
# プロファイルファイルに追加
$env:GITHUB_TOKEN="your_github_token_here"
$env:BRAVE_API_KEY="your_brave_api_key_here"
```

## 設定ファイルの場所

### グローバル設定
- **Linux/Mac**: `~/.claude/mcp.json`
- **Windows**: `%USERPROFILE%\.claude\mcp.json`

### プロジェクトローカル設定
- `.claude/mcp.json`（このプロジェクト専用の設定）

## トラブルシューティング

### MCPサーバーが起動しない場合
1. Node.js（v16以上）がインストールされているか確認
2. 環境変数が正しく設定されているか確認
3. `npx`コマンドが利用可能か確認

### GitHub MCPが動作しない
- GitHubトークンの権限を確認（repo, read:org, read:user など）
- トークンの有効期限を確認

### Brave Search MCPが動作しない
- Brave Search APIキーが有効か確認
- APIの利用制限に達していないか確認

### Claude in Chromeが動作しない
- Chrome拡張機能がインストールされているか確認
- 拡張機能が有効化されているか確認
- Chromeブラウザが起動しているか確認

## 使用例

### GitHub MCP使用例
```
「このリポジトリのPR一覧を取得してください」
「Issue #123の詳細を確認してください」
```

### Brave Search MCP使用例
```
「最新のReact 19の機能について検索してください」
「Node.js 22の新機能を調べてください」
```

### Context7 MCP使用例
```
「Expressフレームワークのドキュメントを参照してください」
「axios の最新の使い方を教えてください」
```

### Playwright MCP使用例
```
「このWebページのスクリーンショットを撮影してください」
「フォームの自動入力テストを作成してください」
```

## 追加のMCPサーバー

必要に応じて以下のMCPサーバーも追加可能です：

- **SQLite MCP**: ローカルデータベース操作
- **Filesystem MCP**: ファイルシステム操作
- **Puppeteer MCP**: ブラウザ自動化（Playwright代替）
- **Docker MCP**: Docker操作

## 参考リンク

- [Anthropic MCP公式ドキュメント](https://github.com/anthropics/anthropic-sdk-typescript)
- [MCP Server GitHub](https://github.com/anthropics/mcp-servers)
