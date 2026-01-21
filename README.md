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

### 推奨方法: 起動スクリプトを使用（開発/本番環境対応）

#### Windows環境

```powershell
# リポジトリをクローン
git clone https://github.com/Kensan196948G/Appsuite-ITSM-Management.git
cd Appsuite-ITSM-Management

# 依存関係インストール
npm install

# 開発環境起動（HTTP、ポート3000）
npm run dev:win

# または本番環境起動（HTTPS、ポート8443）
npm run prod:win
```

#### Linux環境

```bash
# リポジトリをクローン
git clone https://github.com/Kensan196948G/Appsuite-ITSM-Management.git
cd Appsuite-ITSM-Management

# 依存関係インストール
npm install

# 開発環境起動（HTTP、ポート3000）
npm run dev:linux

# または本番環境起動（HTTPS、ポート8443）
npm run prod:linux
```

#### アクセスURL

| 環境 | ローカル | LAN |
|------|---------|-----|
| 開発環境 | http://localhost:3000 | http://192.168.0.145:3000 |
| 本番環境 | https://localhost:8443 | https://192.168.0.145:8443 |

**注**: 本番環境は自己署名SSL証明書を使用しています。ブラウザで警告が表示されますが、安全性を確認の上で承認してください。

---

### 方法2: ローカルファイルとして使用

1. `WebUI-Sample/index.html` をブラウザで開く
2. 即座に使用開始！

---

### 方法3: 本番環境へのデプロイ

Apache/Nginx等のWebサーバーに配置してください。
詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) または [自動起動設定ガイド](./docs/自動起動設定ガイド(Auto-Start-Guide).md) を参照。

---

## 📁 プロジェクト構造

```
Appsuite-ITSM-Management/
├── 📄 CLAUDE.md                  # AI開発アシスタント向けガイド
├── 📄 README.md                  # このファイル
├── 📄 DEPLOYMENT.md              # 本番稼働ガイド
├── 📄 Appsuite_ITSM_Processes.md # ITSMプロセスドキュメント
├── 📄 package.json               # Node.js依存関係・スクリプト定義
├── 📄 .gitignore                 # Git除外ファイル設定
│
├── 📁 .claude/                   # Claude Code設定
│   └── agents/                   # SubAgent設定（7体構成）
│       ├── bash-agent.yml        # Git/CLI操作専門
│       ├── general-agent.yml     # 汎用タスク
│       ├── statusline-agent.yml  # UI設定
│       ├── explore-agent.yml     # コード探索
│       ├── plan-agent.yml        # 設計・計画
│       ├── guide-agent.yml       # ガイド・ヘルプ
│       └── simplifier-agent.yml  # リファクタリング
│
├── 📁 docs/                      # 設計書・仕様書
│   ├── システム概要書(System-Overview).md
│   ├── 機能仕様書(Functional-Specification).md
│   ├── 詳細要件定義書(Requirements-Specification).md
│   ├── 開発フェーズ計画書(Development-Phase-Plan).md
│   ├── 環境構築・並列開発設計書(Environment-Setup-Design).md ⭐NEW
│   ├── 自動起動設定ガイド(Auto-Start-Guide).md ⭐NEW
│   ├── API仕様書(API-Specification).md
│   ├── データベース設計書(Database-Design).md
│   ├── 画面設計書(Screen-Design).md
│   ├── セキュリティ設計書(Security-Design).md
│   ├── テスト仕様書(Test-Specification).md
│   ├── 運用マニュアル(Operation-Manual).md
│   ├── ユーザーガイド(User-Guide).md
│   └── 用語集(Glossary).md
│
├── 📁 WebUI-Sample/              # 開発環境（HTTP:3000）
│   ├── index.html                # メインHTML（SPA）
│   ├── css/styles.css            # スタイルシート
│   ├── js/
│   │   ├── api.js                # API連携モジュール
│   │   ├── modules.js            # 機能モジュール
│   │   └── app.js                # メインアプリケーション
│   ├── README.md
│   └── DEPLOYMENT.md
│
├── 📁 WebUI-Production/          # 本番環境（HTTPS:8443）⭐NEW
│   └── (WebUI-Sampleと同じ構成)
│
├── 📁 scripts/                   # 起動スクリプト ⭐NEW
│   ├── windows/
│   │   ├── dev-start.ps1         # Windows開発環境起動
│   │   └── prod-start.ps1        # Windows本番環境起動
│   └── linux/
│       ├── dev-start.sh          # Linux開発環境起動
│       └── prod-start.sh         # Linux本番環境起動
│
├── 📁 ssl/                       # SSL証明書（自己署名）⭐NEW
│   ├── dev-cert.pem              # 開発環境証明書
│   ├── dev-key.pem               # 開発環境秘密鍵
│   ├── prod-cert.pem             # 本番環境証明書
│   └── prod-key.pem              # 本番環境秘密鍵
│
├── 📁 config/                    # 環境設定ファイル ⭐NEW
│   ├── dev-config.json           # 開発環境設定
│   └── prod-config.json          # 本番環境設定
│
└── 📁 worktrees/                 # Git Worktree作業ディレクトリ ⭐NEW
    └── (ブランチ別の作業スペース)
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

### 📘 設計・仕様書

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

### 🛠 開発・運用ガイド

| ドキュメント | 説明 |
|-------------|------|
| [開発フェーズ計画書](./docs/開発フェーズ計画書(Development-Phase-Plan).md) | 開発スケジュール（Phase 0-Extended追加） |
| [環境構築・並列開発設計書](./docs/環境構築・並列開発設計書(Environment-Setup-Design).md) ⭐ | SubAgent、Git Worktree、環境分離 |
| [自動起動設定ガイド](./docs/自動起動設定ガイド(Auto-Start-Guide).md) ⭐ | Windows/Linux自動起動設定 |
| [運用マニュアル](./docs/運用マニュアル(Operation-Manual).md) | 日常運用手順 |
| [ユーザーガイド](./docs/ユーザーガイド(User-Guide).md) | エンドユーザー向けガイド |
| [用語集](./docs/用語集(Glossary).md) | 専門用語の解説 |

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
| 1.1.0 | 2026-01-21 | **Phase 0-Extended完了**<br>- 7つのSubAgent設定追加<br>- Git Worktree対応<br>- 開発/本番環境分離<br>- Windows/Linux起動スクリプト<br>- SSL証明書（自己署名）<br>- 自動起動設定ガイド |
| 1.0.0 | 2026-01-20 | 初版リリース |

---

<div align="center">

**Built with ❤️ for ITSM**

</div>
