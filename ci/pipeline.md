# CI/CD パイプライン設計書

## 概要

AppSuite ITSM管理システムのCI/CDパイプラインは、GitHub Actions と Claude Code の統合により、自動テスト・自動修復・品質ゲートを実現します。

## パイプラインアーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions Workflow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────────┐  │
│  │  Lint   │───▶│  Test   │───▶│ Security │───▶│   Build     │  │
│  └─────────┘    └─────────┘    └──────────┘    └─────────────┘  │
│       │              │              │                  │         │
│       ▼              ▼              ▼                  ▼         │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────────┐  │
│  │ESLint   │    │ Jest    │    │npm audit │    │File Check   │  │
│  │Check    │    │Coverage │    │OWASP     │    │Validation   │  │
│  └─────────┘    └─────────┘    └──────────┘    └─────────────┘  │
│                                                                   │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼ (失敗時)
            ┌───────────────────────────────────┐
            │     自動修復CIループ               │
            │  (Claude Code Integration)         │
            ├───────────────────────────────────┤
            │  1. エラーログ解析                 │
            │  2. ガードチェック                 │
            │  3. Claude Code修復               │
            │  4. 差分検証                       │
            │  5. 再テスト                       │
            └───────────────────────────────────┘
```

## ステージ詳細

### 1. Lint ステージ

**目的**: コード品質とスタイルの一貫性を確保

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm run lint
```

**品質ゲート**:
- ESLint エラー: 0件
- ESLint 警告: 10件以下

### 2. Test ステージ

**目的**: 機能の正常動作を検証

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm test -- --coverage
```

**品質ゲート**:
- 全テスト成功
- カバレッジ: 70%以上

### 3. Security ステージ

**目的**: セキュリティ脆弱性の検出

```yaml
security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm audit --audit-level=high
```

**品質ゲート**:
- Critical 脆弱性: 0件
- High 脆弱性: 0件

### 4. Build ステージ

**目的**: デプロイ可能なアーティファクトの生成

```yaml
build:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: ./ci/build.ps1 -Task build -Environment prod
```

**品質ゲート**:
- 必須ファイル存在確認
- 設定ファイル整合性検証

## 自動修復CIループ

### 概要

テスト失敗時にClaude Codeを使用して自動修復を試みるループ処理です。

### フロー

```
テスト失敗
    │
    ▼
┌─────────────────────┐
│ ガードチェック       │
│ - 試行回数 < 5      │
│ - 同じエラー < 3回  │
│ - 差分 < 20行       │
└─────────────────────┘
    │
    ├─NG─▶ 手動対応通知
    │
    ▼ OK
┌─────────────────────┐
│ Claude Code修復     │
│ - エラー分析         │
│ - 修正コード生成     │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 差分検証             │
│ - 変更行数チェック   │
│ - 重要ファイル確認   │
└─────────────────────┘
    │
    ├─NG─▶ ロールバック
    │
    ▼ OK
┌─────────────────────┐
│ 再テスト             │
└─────────────────────┘
    │
    ├─成功─▶ コミット・プッシュ
    │
    └─失敗─▶ ループ継続（最大5回）
```

### ガード条件

| 条件 | 値 | 説明 |
|------|----|----|
| MAX_FIX_ATTEMPTS | 5 | 最大修復試行回数 |
| DIFF_LINE_LIMIT | 20 | 許容差分行数 |
| SAME_ERROR_LIMIT | 3 | 同じエラーの許容繰り返し回数 |

### スクリプト

| スクリプト | 説明 |
|-----------|------|
| `ci/auto_fix_with_claudecode.sh` | 自動修復メイン処理 |
| `ci/guard_changes.sh` | 変更ガード・安全チェック |
| `ci/build.ps1` | Windows用ビルドスクリプト |

## 環境別パイプライン

### 開発環境 (dev)

```
push to feature/* ─▶ Lint ─▶ Test ─▶ [自動修復ループ]
```

### ステージング環境 (staging)

```
PR to develop ─▶ Lint ─▶ Test ─▶ Security ─▶ Build
```

### 本番環境 (prod)

```
PR to main ─▶ Lint ─▶ Test ─▶ Security ─▶ Build ─▶ Deploy ─▶ Verify
```

## 通知設定

| イベント | 通知先 | 方法 |
|---------|--------|------|
| ビルド成功 | チーム | Slack/Teams |
| ビルド失敗 | 担当者 | Slack/Teams + Email |
| 自動修復成功 | チーム | Slack |
| 自動修復限界到達 | 管理者 | Slack + Email + Issue作成 |

## 成果物

| 成果物 | パス | 保持期間 |
|--------|------|---------|
| Lintログ | `ci_logs/lint_*.log` | 7日 |
| テストログ | `ci_logs/test_*.log` | 7日 |
| カバレッジ | `coverage/` | 30日 |
| セキュリティログ | `ci_logs/security_*.log` | 30日 |
| ビルドログ | `ci_logs/build_*.log` | 7日 |

## メトリクス

### 収集メトリクス

- ビルド成功率
- 平均ビルド時間
- テストカバレッジ推移
- 自動修復成功率
- 脆弱性検出数推移

### SLA目標

| メトリクス | 目標 |
|-----------|------|
| ビルド成功率 | 95%以上 |
| 平均ビルド時間 | 5分以内 |
| テストカバレッジ | 70%以上 |
| 自動修復成功率 | 60%以上 |

## 関連ドキュメント

- [GitHub Actions ワークフロー](.github/workflows/auto-fix-loop.yml)
- [テスト仕様書](../docs/テスト仕様書(Test-Specification).md)
- [セキュリティ設計書](../docs/セキュリティ設計書(Security-Design).md)

---

最終更新: 2026-01-29
作成者: CI Specialist Agent
