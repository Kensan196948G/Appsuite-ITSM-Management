# 🛂 自動レビューゲートシステム

**Appsuite-ITSM-Management** プロジェクト専用の自動コードレビューシステム

---

## 🎯 システム概要

このシステムは、Claude Code の SubAgent機能を活用した**自動品質ゲート**です。

### 目的

1. ✅ **実装が仕様・設計・運用要件に準拠しているかを自動検査**
2. ❌ **致命的欠陥を次工程に絶対に流さない**
3. 📋 **監査・証跡としてレビュー結果を保存**

### 特徴

- 🤖 **24時間稼働** - 人間レビュアーが不在でも動作
- 📊 **定量的判定** - 感情に左右されない機械的ゲート
- 🔍 **ITSM特化** - ITILプロセス・ISO20000/27001準拠を自動チェック
- 🛡️ **セキュリティ最優先** - XSS/CSRF/権限チェック漏れは即FAIL
- 📄 **監査証跡** - すべてのレビュー結果をJSON/Markdownで保存

---

## 📁 ディレクトリ構造

```
.claude/
├── README.md                      # このファイル
├── agents/
│   └── code-reviewer.md           # SubAgent定義（レビュアー役割）
├── hooks/
│   └── post-implementation.sh     # 実装完了後の自動起動Hook
├── review_checklist.yaml          # レビュー観点チェックリスト
└── run-review.sh                  # 手動レビュー実行スクリプト

reviews/
└── automated/
    ├── 20260123_143022_IncidentModule_result.json
    ├── 20260123_143022_IncidentModule_result.md
    └── ...                        # レビュー結果の蓄積
```

---

## 🚀 使用方法

### 方法1: 手動レビュー実行

```bash
# 基本的な使い方
./.claude/run-review.sh WebUI-Sample/js/modules.js IncidentModule

# ファイルのみ指定（機能名は自動判定）
./.claude/run-review.sh WebUI-Sample/js/auth.js

# 例: 新規実装したファイルをレビュー
./.claude/run-review.sh WebUI-Sample/js/my-new-module.js MyNewModule
```

### 方法2: Claude Code から直接実行

#### Step 1: SubAgent起動

Claude Codeで以下のように依頼：

```
code-reviewer SubAgentを起動して、
WebUI-Sample/js/modules.jsの IncidentModule をレビューしてください。

レビュー観点は .claude/review_checklist.yaml を参照し、
結果は reviews/automated/ に保存してください。
```

#### Step 2: レビュー結果確認

```bash
# 最新のレビュー結果を確認
ls -lt reviews/automated/*.json | head -1 | xargs cat | jq .

# Markdown形式で確認
ls -lt reviews/automated/*.md | head -1 | xargs cat
```

---

## 🔍 レビュー観点（10カテゴリ）

### CRITICAL（致命的）
1. **仕様準拠** - ITIL/要件定義に準拠しているか
2. **セキュリティ** - XSS/CSRF/権限チェック（最重要）
3. **ログ・証跡** - 監査ログが残るか（ISO20000/27001対応）
4. **権限・SoD** - 職務分離が適切か
5. **ITSM準拠** - ステータス遷移・SLA管理・承認フロー

### HIGH（重要）
6. **例外処理** - エラーハンドリングが適切か
7. **データ整合性** - データ保存・削除が安全か

### MEDIUM（推奨）
8. **UI/UX** - フィードバック・ローディング表示
9. **将来変更耐性** - ハードコード排除・モジュール分離
10. **テスト容易性** - 単体テスト可能な構造か

---

## 📊 判定基準

### ✅ PASS（合格）
- `blocking_issues` = 0
- `warnings` = 0
- すべての `conformance` が PASS

→ **次工程（テスト設計）へ自動進行**

### ⚠️ PASS_WITH_WARNINGS（条件付き合格）
- `blocking_issues` = 0
- `warnings` ≥ 1
- すべての `conformance` が PASS

→ **人間による最終確認が推奨されるが、次工程へ進行可**

### ❌ FAIL（不合格）
以下のいずれか1つでも該当：
- `blocking_issues` ≥ 1
- `security_conformance` = FAIL（セキュリティは絶対）
- `itsm_conformance` = FAIL（ITSM要件違反）

→ **実装者に自動差し戻し**

---

## 🔧 レビュー結果フォーマット

### JSON形式

```json
{
  "result": "PASS | FAIL | PASS_WITH_WARNINGS",
  "summary": "総評（1〜3行）",
  "blocking_issues": [
    "XSS対策（escapeHtml）が不足しています - security.js:42"
  ],
  "warnings": [
    "エラー時のToast通知が推奨されます"
  ],
  "recommended_fixes": [
    "行42: escapeHtml(user.name) に修正してください",
    "行58: showToast('エラー', 'error') を追加してください"
  ],
  "reviewed_files": [
    "WebUI-Sample/js/modules.js"
  ],
  "spec_conformance": "PASS",
  "security_conformance": "FAIL",
  "itsm_conformance": "PASS"
}
```

### Markdown形式

自動生成される人間が読みやすい形式。

---

## 🪝 Hooks連携（自動化）

### 実装完了トリガ

```
WHEN: code-implementer が「実装完了」と宣言
THEN:
  1. post-implementation.sh が自動起動
  2. レビューリクエストファイル作成
  3. code-reviewer SubAgent を自動起動
  4. レビュー結果を reviews/automated/ に保存
```

### レビュー結果ハンドリング

```
IF result == FAIL:
  → code-implementer に自動差し戻し
  → blocking_issues をそのまま渡す
  → 修正後、再レビュー

IF result == PASS_WITH_WARNINGS:
  → 人に通知（Slack/メール）
  → 次工程へ進めても OK

IF result == PASS:
  → test-designer を自動起動
  → テスト設計フェーズへ
```

---

## 🎯 運用ポリシー

### 厳格性
- ❌ **「甘いレビュー」は絶対にしない**
- ❓ **迷った場合は FAIL 側に倒す**
- 📋 **仕様・設計に書いていないことは「未実装」と見なす**
- 🔮 **将来の事故を想像する**

### セキュリティ最優先
- セキュリティ違反は**即FAIL**（例外なし）
- XSS/CSRF/インジェクション対策が不足 → **即FAIL**
- 権限チェック漏れ → **即FAIL**

### ITSM準拠
- ITILプロセスからの逸脱 → **FAIL**
- 監査ログ不足 → **FAIL**
- ワークフロー違反 → **FAIL**

---

## 📈 監査・証跡保存

すべてのレビュー結果は以下のルールで保存されます：

### ファイル命名規則

```
reviews/automated/YYYYMMDD_HHMMSS_機能名_result.json
reviews/automated/YYYYMMDD_HHMMSS_機能名_result.md
```

### 保存期間

- **1年間保存**（ISO20000/27001監査対応）
- 月次でアーカイブ推奨

### 目的

- ISO20000 / ISO27001 監査対応
- 開発品質のトレーサビリティ確保
- 「誰も見てないが、証跡はある」状態の実現
- 将来の品質改善のためのデータ蓄積

---

## 🌟 ベストプラクティス

### 1. 実装前にレビュー観点を確認

```bash
cat .claude/review_checklist.yaml | grep "description:"
```

これにより、「後からNGになる」を防げます。

### 2. 小さい単位で頻繁にレビュー

- ❌ 1000行実装してから1回レビュー
- ✅ 100行実装ごとにレビュー

### 3. FAIL時は素直に修正

- ❌ 「これくらいいいでしょ」は事故の元
- ✅ blocking_issuesは必ず全て修正

### 4. 定期的にチェックリストを見直し

プロジェクトの成熟に応じて、レビュー観点を追加・調整します。

---

## 🔄 全体オーケストレーション

```
[ spec-planner ]
       ↓
[ arch-reviewer ]    ← 設計レビューゲート
       ↓
[ code-implementer ]
       ↓
[ code-reviewer ]    ← ★この自動レビューゲート
       ↓
[ test-designer ]
       ↓
[ test-reviewer ]    ← テスト観点レビューゲート
       ↓
[ ci-specialist ]
```

---

## 💡 トラブルシューティング

### Q1: レビューがFAILしたが理由が分からない

```bash
# 最新のレビュー結果を詳細表示
cat $(ls -t reviews/automated/*.json | head -1) | jq .blocking_issues
```

### Q2: レビュー結果が保存されない

```bash
# ディレクトリの権限確認
ls -ld reviews/automated/

# 書き込み権限がない場合
chmod 755 reviews/automated/
```

### Q3: SubAgentが起動しない

1. `.claude/agents/code-reviewer.md` が存在するか確認
2. Claude Codeのバージョン確認
3. Task ツールで `subagent_type="code-reviewer"` を明示的に指定

---

## 📚 参考資料

- [開発フェーズ計画書](../docs/開発フェーズ計画書(Development-Phase-Plan).md)
- [セキュリティ設計書](../docs/セキュリティ設計書(Security-Design).md)
- [機能仕様書](../docs/機能仕様書(Functional-Specification).md)
- [ITSMプロセスドキュメント](../Appsuite_ITSM_Processes.md)

---

## ☕ 最後に

この自動レビューゲートは、

- 🤖 **文句を言わない**
- 🌙 **夜中も働く**
- 📄 **証跡も残す**

**AI品質保証部** です。

うまく育てれば、**あなたのプロジェクトはほぼ事故らなくなります。**

---

**Version**: 1.0
**Last Updated**: 2026-01-23
**Author**: Claude Sonnet 4.5 (1M context)
**License**: MIT
