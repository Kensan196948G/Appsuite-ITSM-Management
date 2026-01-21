# 環境構築・並列開発設計書（Environment Setup & Parallel Development Design）

## 文書情報

| 項目 | 内容 |
|------|------|
| 文書名 | 環境構築・並列開発設計書 |
| プロジェクト名 | AppSuite ITSM管理システム |
| バージョン | 1.0 |
| 作成日 | 2026年1月21日 |
| 最終更新日 | 2026年1月21日 |

---

## 1. プロジェクト概要

### 1.1 設計の目的
本設計書は、AppSuite ITSM管理システムの開発において、以下の機能を実現するための環境構築と並列開発の仕組みを定義します:

1. **全SubAgent機能（7体構成）**: 専門化されたAIエージェントによる並列開発
2. **全Hooks機能**: 並列実行開発、コンフリクト防止
3. **Git WorkTree機能**: ブランチごとの作業ディレクトリ管理
4. **全MCP機能**: 外部サービスとの統合
5. **環境分離**: 開発環境と本番環境の完全分離

### 1.2 システム環境

| 項目 | 設定値 |
|------|--------|
| OS | Windows 11（Linux共有フォルダ） |
| LAN IP | 192.168.0.145 |
| 開発環境ポート | 3000 (HTTP) |
| 本番環境ポート | 8443 (HTTPS) |
| 開発環境URL | http://localhost:3000 (ローカル)<br>http://192.168.0.145:3000 (LAN) |
| 本番環境URL | https://localhost:8443 (ローカル)<br>https://192.168.0.145:8443 (LAN) |
| Node.js | Windows/Linux両対応 |
| Git | Worktree対応 |

---

## 2. Claude Code 設定

### 2.1 MCP（Model Context Protocol）設定

#### 2.1.1 設定済みMCPサーバー

| MCPサーバー | 用途 | 設定状況 |
|------------|------|----------|
| context7 | ドキュメント検索 | ✅ 設定済み |
| memory | 永続的メモリ | ✅ 設定済み |
| chrome-devtools | ブラウザ自動化 | ✅ 設定済み |
| github | GitHub API連携 | ✅ 設定済み（要トークン設定） |
| sequential-thinking | 詳細思考プロセス | ✅ 設定済み |

#### 2.1.2 MCP設定ファイル
**場所**: `~/.claude/.mcp.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": ["-y", "@upstash/context7-mcp@latest", "--api-key", "ctx7sk-..."],
      "env": {}
    },
    "memory": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {}
    },
    "chrome-devtools": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": ["-y", "@modelcontextprotocol/server-chrome-devtools"],
      "env": {}
    },
    "github": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": ""
      }
    },
    "sequential-thinking": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {}
    }
  }
}
```

### 2.2 Permissions設定

Git Worktree対応のため、以下を追加済み:
- `Bash(git worktree:*)`

### 2.3 有効化されたプラグイン

| プラグイン | 用途 |
|-----------|------|
| frontend-design | フロントエンド開発 |
| code-review | コードレビュー |
| serena | ドキュメント生成 |
| playwright | E2Eテスト |
| code-simplifier | コード簡素化 |

---

## 3. SubAgent構成（7体構成）

### 3.1 SubAgentの役割

| # | Agent名 | 役割 | 専門領域 |
|---|---------|------|----------|
| 1 | **Bash Agent** | コマンド実行 | Git操作、ビルド、デプロイ |
| 2 | **General Purpose Agent** | 汎用タスク | 複雑な調査、マルチステップ処理 |
| 3 | **Statusline Setup Agent** | ステータスライン設定 | Claude Code UI設定 |
| 4 | **Explore Agent** | コードベース探索 | ファイル検索、構造分析 |
| 5 | **Plan Agent** | 実装計画 | アーキテクチャ設計、タスク分解 |
| 6 | **Claude Code Guide Agent** | ガイド | Claude Code機能説明 |
| 7 | **Code Simplifier Agent** | コード簡素化 | リファクタリング、最適化 |

### 3.2 SubAgent設定ファイル

**場所**: `Z:\Appsuite-ITSM-Management\.claude\agents\` (これから作成)

各AgentのYAML設定例:
```yaml
# bash-agent.yml
name: Bash Specialist
description: Git operations and command execution specialist
tools:
  - Bash
  - Read
  - Write
model: haiku  # 高速・低コスト
```

---

## 4. Git Worktree構成

### 4.1 Worktreeの概念

Git Worktreeは、1つのリポジトリで複数のブランチを同時に作業ディレクトリとして持つ機能です。

```
Appsuite-ITSM-Management/  (main)
├── worktrees/
│   ├── feature-user-management/  (feature/user-management)
│   ├── feature-incident-management/  (feature/incident-management)
│   ├── feature-change-management/  (feature/change-management)
│   ├── hotfix-dashboard-bug/  (hotfix/dashboard-bug)
│   └── dev-environment-setup/  (dev/environment-setup)
```

### 4.2 Worktree運用ルール

| ルール | 説明 |
|--------|------|
| ブランチ命名 | `feature/*`, `hotfix/*`, `dev/*`, `release/*` |
| Worktreeディレクトリ | `worktrees/<branch-name>/` |
| 並列作業数 | 最大5つまで（リソース管理） |
| コンフリクト防止 | Hooks機能で事前チェック |

### 4.3 Worktree管理コマンド

```bash
# 新しいWorktreeを作成
git worktree add worktrees/feature-xxx -b feature/xxx

# Worktree一覧表示
git worktree list

# Worktree削除
git worktree remove worktrees/feature-xxx

# Worktree修復
git worktree prune
```

---

## 5. Hooks機能設計

### 5.1 Hooks機能の目的

1. **並列実行管理**: 複数のWorktreeで同時作業時の調整
2. **コンフリクト防止**: ファイル編集前のチェック
3. **自動化**: テスト、ビルド、リント実行

### 5.2 Hooks種類

| Hook種別 | タイミング | 用途 |
|----------|-----------|------|
| UserPromptSubmit | ユーザー入力時 | タスク開始ログ |
| PreToolUse | ツール実行前 | Gitステータス確認 |
| PostToolUse | ツール実行後 | テスト自動実行 |
| PostToolUseFailure | ツール失敗時 | エラーログ記録 |

### 5.3 Hooks設定

**場所**: `~/.claude/settings.json` の `hooks` セクション

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "git status --short",
        "statusMessage": "Checking Git status..."
      }]
    }],
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "npm run lint",
        "statusMessage": "Running linter..."
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "echo '🚀 Starting task...'",
        "statusMessage": "Initializing..."
      }]
    }]
  }
}
```

---

## 6. 開発環境と本番環境の分離

### 6.1 環境分離設計

```
Appsuite-ITSM-Management/
├── WebUI-Sample/          # 既存（開発環境として使用）
├── WebUI-Production/      # 新規作成（本番環境）
├── scripts/
│   ├── windows/
│   │   ├── dev-start.ps1      # 開発環境起動（Windows）
│   │   └── prod-start.ps1     # 本番環境起動（Windows）
│   └── linux/
│       ├── dev-start.sh       # 開発環境起動（Linux）
│       └── prod-start.sh      # 本番環境起動（Linux）
├── ssl/
│   ├── dev-cert.pem          # 開発用自己署名証明書
│   ├── dev-key.pem           # 開発用秘密鍵
│   ├── prod-cert.pem         # 本番用自己署名証明書
│   └── prod-key.pem          # 本番用秘密鍵
└── config/
    ├── dev-config.json       # 開発環境設定
    └── prod-config.json      # 本番環境設定
```

### 6.2 環境別設定

#### 6.2.1 開発環境（WebUI-Sample）

| 項目 | 設定値 |
|------|--------|
| ポート | 3000 |
| プロトコル | HTTP |
| データ | サンプルデータ多数 |
| ログレベル | DEBUG |
| ホットリロード | 有効 |
| ソースマップ | 有効 |

#### 6.2.2 本番環境（WebUI-Production）

| 項目 | 設定値 |
|------|--------|
| ポート | 8443 |
| プロトコル | HTTPS（自己署名SSL） |
| データ | 初期データのみ |
| ログレベル | INFO |
| ホットリロード | 無効 |
| ソースマップ | 無効 |
| 圧縮 | 有効（gzip） |

### 6.3 SSL証明書生成

```bash
# 開発環境用
openssl req -x509 -newkey rsa:4096 -keyout ssl/dev-key.pem -out ssl/dev-cert.pem -days 365 -nodes -subj "/CN=localhost"

# 本番環境用
openssl req -x509 -newkey rsa:4096 -keyout ssl/prod-key.pem -out ssl/prod-cert.pem -days 365 -nodes -subj "/CN=192.168.0.145"
```

---

## 7. Node.js環境構成

### 7.1 Windows/Linux両対応

```
node_modules/          # 共通（シンボリックリンクまたはコピー）
├── node_modules-windows/  # Windows専用モジュール
└── node_modules-linux/    # Linux専用モジュール
```

### 7.2 package.json スクリプト

```json
{
  "scripts": {
    "dev:win": "node scripts/windows/dev-start.js",
    "dev:linux": "node scripts/linux/dev-start.js",
    "prod:win": "node scripts/windows/prod-start.js",
    "prod:linux": "node scripts/linux/prod-start.js",
    "ssl:gen": "node scripts/generate-ssl.js",
    "install:win": "npm install --platform=win32",
    "install:linux": "npm install --platform=linux"
  }
}
```

---

## 8. 起動スクリプト設計

### 8.1 Windows PowerShell スクリプト

#### dev-start.ps1（開発環境）
```powershell
# 開発環境起動スクリプト
$PORT = 3000
$ENV = "development"

Write-Host "🚀 Starting Development Environment..." -ForegroundColor Green
Write-Host "   Port: $PORT" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:$PORT" -ForegroundColor Cyan
Write-Host "   LAN: http://192.168.0.145:$PORT" -ForegroundColor Cyan

# Node.jsサーバー起動
Set-Location WebUI-Sample
npx http-server -p $PORT -c-1 --cors

Read-Host "Press Enter to stop server"
```

#### prod-start.ps1（本番環境）
```powershell
# 本番環境起動スクリプト
$PORT = 8443
$ENV = "production"

Write-Host "🔒 Starting Production Environment..." -ForegroundColor Green
Write-Host "   Port: $PORT" -ForegroundColor Cyan
Write-Host "   URL: https://localhost:$PORT" -ForegroundColor Cyan
Write-Host "   LAN: https://192.168.0.145:$PORT" -ForegroundColor Cyan

# HTTPS Node.jsサーバー起動
Set-Location WebUI-Production
npx http-server -p $PORT --ssl --cert ../ssl/prod-cert.pem --key ../ssl/prod-key.pem

Read-Host "Press Enter to stop server"
```

### 8.2 Linux Shell スクリプト

#### dev-start.sh（開発環境）
```bash
#!/bin/bash
PORT=3000
ENV="development"

echo "🚀 Starting Development Environment..."
echo "   Port: $PORT"
echo "   URL: http://localhost:$PORT"
echo "   LAN: http://192.168.0.145:$PORT"

cd WebUI-Sample
npx http-server -p $PORT -c-1 --cors
```

#### prod-start.sh（本番環境）
```bash
#!/bin/bash
PORT=8443
ENV="production"

echo "🔒 Starting Production Environment..."
echo "   Port: $PORT"
echo "   URL: https://localhost:$PORT"
echo "   LAN: https://192.168.0.145:$PORT"

cd WebUI-Production
npx http-server -p $PORT --ssl --cert ../ssl/prod-cert.pem --key ../ssl/prod-key.pem
```

---

## 9. 自動起動設定

### 9.1 Windows サービス登録

#### NSSM（Non-Sucking Service Manager）を使用

```powershell
# NSSMインストール（Chocolatey使用）
choco install nssm

# 開発環境サービス登録
nssm install AppSuiteITSM-Dev "C:\Program Files\nodejs\node.exe" "C:\path\to\scripts\windows\dev-start.js"
nssm set AppSuiteITSM-Dev AppDirectory "Z:\Appsuite-ITSM-Management"
nssm set AppSuiteITSM-Dev DisplayName "AppSuite ITSM [開発]"
nssm set AppSuiteITSM-Dev Start SERVICE_AUTO_START

# 本番環境サービス登録
nssm install AppSuiteITSM-Prod "C:\Program Files\nodejs\node.exe" "C:\path\to\scripts\windows\prod-start.js"
nssm set AppSuiteITSM-Prod AppDirectory "Z:\Appsuite-ITSM-Management"
nssm set AppSuiteITSM-Prod DisplayName "AppSuite ITSM [本番]"
nssm set AppSuiteITSM-Prod Start SERVICE_AUTO_START
```

### 9.2 Linux systemd設定

#### /etc/systemd/system/appsuite-itsm-dev.service
```ini
[Unit]
Description=AppSuite ITSM Development Environment
After=network.target

[Service]
Type=simple
User=kensan
WorkingDirectory=/mnt/z/Appsuite-ITSM-Management
ExecStart=/usr/bin/node scripts/linux/dev-start.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

#### /etc/systemd/system/appsuite-itsm-prod.service
```ini
[Unit]
Description=AppSuite ITSM Production Environment
After=network.target

[Service]
Type=simple
User=kensan
WorkingDirectory=/mnt/z/Appsuite-ITSM-Management
ExecStart=/usr/bin/node scripts/linux/prod-start.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

#### systemdサービス有効化
```bash
sudo systemctl daemon-reload
sudo systemctl enable appsuite-itsm-dev
sudo systemctl enable appsuite-itsm-prod
sudo systemctl start appsuite-itsm-dev
sudo systemctl start appsuite-itsm-prod
```

---

## 10. ブックマーク設定

### 10.1 ブラウザブックマーク

| 環境 | URL | 表示名 |
|------|-----|--------|
| 開発（ローカル） | http://localhost:3000 | [開発] AppSuite ITSM (localhost) |
| 開発（LAN） | http://192.168.0.145:3000 | [開発] AppSuite ITSM (LAN) |
| 本番（ローカル） | https://localhost:8443 | [本番] AppSuite ITSM (localhost) |
| 本番（LAN） | https://192.168.0.145:8443 | [本番] AppSuite ITSM (LAN) |

---

## 11. 並列開発ワークフロー

### 11.1 開発フロー例

```
1. 新機能開発開始
   ↓
2. Git Worktree作成
   git worktree add worktrees/feature-xxx -b feature/xxx
   ↓
3. Claude Code SubAgentに作業依頼
   "Plan AgentでXXX機能を設計してください"
   ↓
4. SubAgentが並列で作業
   - Explore Agent: 既存コード調査
   - Plan Agent: 実装計画作成
   - Bash Agent: Git操作、ビルド
   ↓
5. Hooks機能が自動実行
   - PreToolUse: コンフリクトチェック
   - PostToolUse: テスト実行
   ↓
6. Code Review Agent: レビュー
   ↓
7. メインブランチへマージ
   git checkout main
   git merge feature/xxx
   ↓
8. Worktree削除
   git worktree remove worktrees/feature-xxx
```

### 11.2 並列開発の利点

| 項目 | 従来 | 並列開発 |
|------|------|----------|
| ブランチ切り替え | 必要 | 不要 |
| 複数機能同時開発 | 困難 | 容易 |
| コンフリクトリスク | 高 | 低（Hooksで防止） |
| 生産性 | 標準 | 2-3倍向上 |

---

## 12. 次の開発ステップ

### Phase 0-Extended: 環境構築強化（2週間）

| ステップ | タスク | 担当 | 成果物 |
|---------|--------|------|--------|
| 1 | Git リポジトリ初期化 | 開発者 | .gitリポジトリ |
| 2 | Worktree構造セットアップ | 開発者 | worktrees/ディレクトリ |
| 3 | SubAgent設定ファイル作成 | 開発者 | .claude/agents/*.yml |
| 4 | Hooks機能実装 | 開発者 | settings.json更新 |
| 5 | 開発/本番環境分離 | 開発者 | WebUI-Production/ |
| 6 | SSL証明書生成 | 開発者 | ssl/*.pem |
| 7 | 起動スクリプト作成 | 開発者 | scripts/windows/*.ps1<br>scripts/linux/*.sh |
| 8 | 自動起動設定 | 開発者 | Windowsサービス/systemdユニット |
| 9 | 動作確認テスト | 全員 | テスト報告書 |
| 10 | ドキュメント更新 | 開発者 | README.md更新 |

---

## 13. トラブルシューティング

### 13.1 よくある問題

| 問題 | 原因 | 解決策 |
|------|------|--------|
| Worktree作成失敗 | ブランチ名重複 | 別のブランチ名を使用 |
| ポート競合 | 既に使用中 | `netstat -ano`で確認し、プロセス終了 |
| SSL証明書エラー | 自己署名証明書 | ブラウザで例外許可 |
| Hooks実行失敗 | コマンドパス不正 | フルパスで指定 |
| MCP接続エラー | npmパッケージ未インストール | `npx -y`で自動インストール |

### 13.2 ログ確認

| 環境 | ログファイル |
|------|-------------|
| Claude Code | ~/.claude/history.jsonl |
| 開発環境 | WebUI-Sample/logs/dev.log |
| 本番環境 | WebUI-Production/logs/prod.log |
| Windows Service | Windowsイベントビューア |
| Linux systemd | `journalctl -u appsuite-itsm-*` |

---

## 14. セキュリティ考慮事項

### 14.1 自己署名SSL証明書

- 開発環境では問題なし
- 本番環境（社内利用）ではCA証明書を配布推奨
- 外部公開時は正式な証明書（Let's Encrypt等）を使用

### 14.2 アクセス制限

- ファイアウォールでポート制限
- Windows Firewall / iptables設定
- LAN内アクセスのみ許可

### 14.3 認証・認可

- 開発環境: 基本認証（Basic Auth）
- 本番環境: DeskNet's Neo連携認証

---

## 15. 関連ドキュメント

- [開発フェーズ計画書（更新版）](./開発フェーズ計画書(Development-Phase-Plan).md)
- [システム概要書](./システム概要書(System-Overview).md)
- [API仕様書](./API仕様書(API-Specification).md)
- [セキュリティ設計書](./セキュリティ設計書(Security-Design).md)
- [運用マニュアル](./運用マニュアル(Operation-Manual).md)

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|------------|------|----------|--------|
| 1.0 | 2026/01/21 | 初版作成 | Claude Sonnet 4.5 |
