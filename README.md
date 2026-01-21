# AppSuite ITSM管理システム

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Web-lightgrey.svg)

**DeskNet's Neo AppSuite連携 ITサービス管理システム**

</div>

---

## 📋 概要

AppSuite ITSM管理システムは、DeskNet's Neo AppSuiteで作成された業務アプリケーションを一元管理するためのWebベースの管理ツールです。ITIL®フレームワークに準拠したITサービスマネジメント機能を提供し、組織のIT運用を効率化します。

### 主な特徴

- 🚀 **シンプルな導入**: サーバー不要、ブラウザで即座に利用可能
- 🔗 **DeskNet's Neo連携**: AppSuiteとシームレスに連携
- 📊 **ダッシュボード**: リアルタイムの統計情報表示
- 🔒 **セキュリティ**: 監査ログ、権限管理、暗号化対応
- 📱 **レスポンシブ**: デスクトップ・タブレット・モバイル対応

---

## 🎯 機能一覧

| 機能 | 説明 |
|------|------|
| **ダッシュボード** | システム全体の統計情報、最近の操作ログ、アプリ概要を表示 |
| **ユーザー管理** | ユーザーの追加・編集・削除、権限管理（管理者/ユーザー） |
| **アプリ管理** | AppSuiteアプリの登録・稼働状況管理・カテゴリ分類 |
| **インシデント管理** | 障害・不具合の記録、優先度設定、担当者割当、対応追跡 |
| **変更管理** | 機能追加・改善要求の登録、承認ワークフロー |
| **監査ログ** | 全操作履歴の記録、検索、CSVエクスポート |
| **システム設定** | API接続、セキュリティ、通知、バックアップ設定 |

---

## 🚀 クイックスタート

### 方法1: ローカルファイルとして使用

1. リポジトリをクローンまたはダウンロード
2. `WebUI-Sample/index.html` をブラウザで開く
3. 即座に使用開始！

```bash
git clone https://github.com/your-repo/Appsuite-ITSM-Management.git
cd Appsuite-ITSM-Management/WebUI-Sample
# ブラウザでindex.htmlを開く
```

### 方法2: 簡易Webサーバーで起動

```bash
# Node.jsがインストールされている場合
cd WebUI-Sample
npx http-server -p 8080

# ブラウザで http://localhost:8080 にアクセス
```

### 方法3: 本番環境へのデプロイ

Apache/Nginx等のWebサーバーに配置してください。
詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照。

---

## 📁 プロジェクト構造

```
Appsuite-ITSM-Management/
├── 📄 CLAUDE.md                  # AI開発アシスタント向けガイド
├── 📄 README.md                  # このファイル
├── 📄 DEPLOYMENT.md              # 本番稼働ガイド
├── 📄 Appsuite_ITSM_Processes.md # ITSMプロセスドキュメント
│
├── 📁 docs/                      # 設計書・仕様書
│   ├── システム概要書(System-Overview).md
│   ├── 機能仕様書(Functional-Specification).md
│   ├── 詳細要件定義書(Requirements-Specification).md
│   ├── 開発フェーズ計画書(Development-Phase-Plan).md
│   ├── API仕様書(API-Specification).md
│   ├── データベース設計書(Database-Design).md
│   ├── 画面設計書(Screen-Design).md
│   ├── セキュリティ設計書(Security-Design).md
│   ├── テスト仕様書(Test-Specification).md
│   ├── 運用マニュアル(Operation-Manual).md
│   ├── ユーザーガイド(User-Guide).md
│   └── 用語集(Glossary).md
│
└── 📁 WebUI-Sample/              # メインアプリケーション
    ├── index.html                # メインHTML（SPA）
    ├── css/
    │   └── styles.css            # スタイルシート
    ├── js/
    │   ├── api.js                # API連携モジュール
    │   ├── modules.js            # 機能モジュール
    │   └── app.js                # メインアプリケーション
    ├── README.md
    └── DEPLOYMENT.md
```

---

## 🛠 技術スタック

| カテゴリ | 技術 |
|----------|------|
| **フロントエンド** | HTML5, CSS3, JavaScript (Vanilla ES6+) |
| **UIコンポーネント** | カスタムCSS（レスポンシブ対応） |
| **アイコン** | Font Awesome 6.4.0 (CDN) |
| **データストレージ** | localStorage (ブラウザ内蔵) |
| **外部連携** | DeskNet's Neo REST API |

---

## 🌐 ブラウザ対応

| ブラウザ | バージョン | 対応状況 |
|----------|-----------|:--------:|
| Google Chrome | 90+ | ✅ 推奨 |
| Mozilla Firefox | 88+ | ✅ 対応 |
| Microsoft Edge | 90+ | ✅ 対応 |
| Safari | 14+ | ✅ 対応 |

---

## 📊 DeskNet's Neo API連携

DeskNet's Neo V7.0以降と連携可能です。

### 設定手順

1. DeskNet's Neo管理画面でAPIキーを発行
2. システム設定 → API接続タブを開く
3. API URL、認証情報を入力
4. 「接続テスト」で確認
5. 「保存」をクリック

### 対応認証方式

- Bearer Token（推奨）
- Basic認証
- APIキー認証

---

## 📖 ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [システム概要書](./docs/システム概要書(System-Overview).md) | システム全体像、構成図 |
| [機能仕様書](./docs/機能仕様書(Functional-Specification).md) | 各機能の詳細仕様 |
| [詳細要件定義書](./docs/詳細要件定義書(Requirements-Specification).md) | 機能・非機能要件 |
| [API仕様書](./docs/API仕様書(API-Specification).md) | 内部API・外部API仕様 |
| [データベース設計書](./docs/データベース設計書(Database-Design).md) | データモデル、テーブル定義 |
| [画面設計書](./docs/画面設計書(Screen-Design).md) | UIデザイン、画面遷移 |
| [セキュリティ設計書](./docs/セキュリティ設計書(Security-Design).md) | セキュリティ対策 |
| [テスト仕様書](./docs/テスト仕様書(Test-Specification).md) | テストケース一覧 |
| [運用マニュアル](./docs/運用マニュアル(Operation-Manual).md) | 日常運用手順 |
| [ユーザーガイド](./docs/ユーザーガイド(User-Guide).md) | エンドユーザー向けガイド |
| [用語集](./docs/用語集(Glossary).md) | 専門用語の解説 |
| [開発フェーズ計画書](./docs/開発フェーズ計画書(Development-Phase-Plan).md) | 開発スケジュール |

---

## 🔧 開発

### 開発環境構築

```bash
# リポジトリをクローン
git clone https://github.com/your-repo/Appsuite-ITSM-Management.git
cd Appsuite-ITSM-Management

# 開発用サーバー起動
cd WebUI-Sample
npx http-server -p 8080 --cors

# http://localhost:8080 でアクセス
```

### コーディング規約

- **JavaScript**: ES6+構文、モジュールパターン使用
- **CSS**: CSS変数使用、BEM風命名規則
- **HTML**: セマンティックHTML5、アクセシビリティ考慮

詳細は [CLAUDE.md](./CLAUDE.md) を参照。

---

## 🧪 テスト

テストケースは [テスト仕様書](./docs/テスト仕様書(Test-Specification).md) に記載されています。

### テストカテゴリ

- **機能テスト**: 各機能のCRUD操作、検索、フィルタ
- **画面テスト**: レスポンシブデザイン、モーダル、通知
- **セキュリティテスト**: XSS対策、セッション管理
- **性能テスト**: 初期表示速度、大量データ表示
- **互換性テスト**: 各ブラウザでの動作確認

---

## 📦 バックアップ・リストア

### バックアップ作成

1. システム設定 → バックアップタブを開く
2. 「バックアップ作成」をクリック
3. JSONファイルがダウンロードされる

### リストア実行

1. バックアップファイルを選択
2. 「リストア実行」をクリック
3. 確認後、データが復元される

---

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

## 📞 サポート

- **技術的な質問**: Issue作成
- **バグ報告**: Issue作成（テンプレート使用）
- **機能要望**: Issue作成

---

## 🔄 更新履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0.0 | 2026-01-20 | 初版リリース |

---

<div align="center">

**Built with ❤️ for ITSM**

</div>
