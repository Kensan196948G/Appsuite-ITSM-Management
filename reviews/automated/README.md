# 📊 自動レビュー結果保存ディレクトリ

このディレクトリには、code-reviewer SubAgentによる自動コードレビューの結果が保存されます。

## ファイル命名規則

```
YYYYMMDD_HHMMSS_機能名_result.json
YYYYMMDD_HHMMSS_機能名_result.md
```

**例**:
- `20260123_143022_IncidentModule_result.json`
- `20260123_143022_IncidentModule_result.md`

## 保存期間

- **推奨**: 1年間保存（ISO20000/27001監査対応）
- **アーカイブ**: 月次で過去データをアーカイブ推奨

## ディレクトリ構造（推奨）

```
reviews/automated/
├── 2026/
│   ├── 01/  # 1月
│   │   ├── 20260123_143022_IncidentModule_result.json
│   │   ├── 20260123_143022_IncidentModule_result.md
│   │   └── ...
│   ├── 02/  # 2月
│   └── ...
└── archives/
    ├── 2025.tar.gz
    └── ...
```

## 結果の確認方法

### 最新のレビュー結果を確認

```bash
# JSON形式で確認
ls -t *.json | head -1 | xargs cat | jq .

# Markdown形式で確認
ls -t *.md | head -1 | xargs cat
```

### 特定の機能のレビュー結果を検索

```bash
# IncidentModuleのレビュー結果を検索
ls *IncidentModule*.json

# 失敗したレビューを検索
grep -l '"result": "FAIL"' *.json
```

### 統計情報の取得

```bash
# PASS/FAIL/PASS_WITH_WARNINGSの件数集計
cat *.json | jq -r .result | sort | uniq -c

# セキュリティ準拠率
cat *.json | jq -r .security_conformance | grep PASS | wc -l
```

## サンプルファイル

`.sample_result.json` がサンプルファイルとして配置されています。

## 注意事項

- ❌ このディレクトリのファイルは手動で削除しないでください
- ✅ アーカイブスクリプトを使用して整理してください
- 📋 監査対応のため、必要な期間は保存してください

---

**Version**: 1.0
**Last Updated**: 2026-01-23
