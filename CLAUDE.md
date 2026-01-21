# CLAUDE.md - AppSuite ITSM管理システム プロジェクトガイド

このファイルはClaude（AI）がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

**AppSuite管理運用システム**は、DeskNet's Neo AppSuiteで作成された業務アプリケーションを一元管理するWebベースのITSM（ITサービス管理）ツールです。

### 主要機能
- **ダッシュボード**: システム全体の統計情報表示（ユーザー数、アプリ数、インシデント、変更要求）
- **ユーザー管理**: ユーザーアカウントのCRUD操作、権限管理（管理者/ユーザー）
- **アプリ管理**: AppSuiteアプリの一覧管理、稼働状況把握
- **インシデント管理**: 障害・不具合の記録と対応追跡（ITILベース）
- **変更管理**: 機能追加・改善要求の承認フロー
- **監査ログ**: 全操作履歴の記録・検索・エクスポート
- **システム設定**: API接続、セキュリティ、通知、ワークフロー設定

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | HTML5, CSS3, JavaScript (Vanilla ES6+) |
| アイコン | Font Awesome 6.4.0 (CDN) |
| データストレージ | localStorage (ブラウザ内蔵) |
| 外部連携 | DeskNet's Neo REST API (オプション) |

## プロジェクト構造

```
Appsuite-ITSM-Management/
├── CLAUDE.md                    # このファイル（AIガイド）
├── README.md                    # プロジェクト説明
├── DEPLOYMENT.md                # 本番稼働ガイド
├── Appsuite_ITSM_Processes.md   # ITSMプロセスドキュメント
├── docs/                        # 設計書・仕様書
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
└── WebUI-Sample/                # メインアプリケーション
    ├── index.html               # メインHTML（SPA）
    ├── css/
    │   └── styles.css           # スタイルシート
    ├── js/
    │   ├── api.js               # DeskNet's Neo API連携
    │   ├── modules.js           # 機能モジュール（User/App/Incident/Change/Log/Settings）
    │   └── app.js               # メインアプリケーションロジック
    ├── README.md
    └── DEPLOYMENT.md
```

## 開発フェーズ

プロジェクトは6フェーズ・24週間で計画されています（`docs/開発フェーズ計画書`参照）:

1. **Phase 0**: 準備 (2週間) - 環境構築、チーム編成
2. **Phase 1**: 要件定義 (3週間) - 要件整理、モックアップ
3. **Phase 2**: 設計 (4週間) - 基本設計・詳細設計
4. **Phase 3**: 開発 (10週間) - 5スプリント×2週間
5. **Phase 4**: テスト (3週間) - 結合/システム/UAT
6. **Phase 5**: リリース (2週間) - デプロイ、トレーニング

## コーディング規約

### JavaScript
- ES6+構文使用（アロー関数、テンプレートリテラル、const/let）
- モジュールパターンで機能を分離（例: `UserModule`, `AppModule`）
- 関数名: camelCase（例: `getUserById`, `createIncident`）
- クラス名: PascalCase（例: `ApiClient`, `SessionManager`）

### CSS
- CSS変数を使用（`:root`で定義）
- BEM命名規則を参考にしたクラス名
- レスポンシブ対応（ブレークポイント: 1024px, 768px, 480px）

### HTML
- セマンティックHTML5タグを使用
- アクセシビリティ考慮（aria属性、適切なラベル）

## データモデル

### 主要エンティティ

| エンティティ | IDプレフィックス | 主要フィールド |
|-------------|-----------------|---------------|
| users | U | id, username, email, department, role, status |
| apps | A | id, name, category, creator, recordCount, status |
| incidents | INC- | id, title, appId, priority, status, reporter, assignee |
| changes | CHG- | id, title, appId, type, status, requester, approver |
| logs | LOG- | id, timestamp, userId, action, target, details |
| settings | - | key-value形式（カテゴリ別） |

### localStorageキー
- `appsuite_users`, `appsuite_apps`, `appsuite_incidents`
- `appsuite_changes`, `appsuite_logs`, `appsuite_settings`

## API連携

DeskNet's Neo APIとの連携（オプション）:
- エンドポイント: `https://{domain}.desknets.com/cgi-bin/dneo/zap.cgi`
- 認証方式: Bearer Token / Basic認証 / APIキー
- 主要コマンド: `getuser`, `getapps`, `test`

## 開発時の注意点

### セキュリティ
- XSS対策: `escapeHtml`関数で出力エスケープ
- 入力バリデーション: すべての入力フィールドで検証
- 機密データ（APIキー等）はマスキング表示

### パフォーマンス
- 初期表示: 3秒以内
- ページング: 1ページ25件（設定変更可）
- ログ上限: 10,000件（自動削除）

### ブラウザ対応
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## テスト方法

1. **ユニットテスト**: 各モジュールの関数単位でテスト
2. **画面テスト**: レスポンシブ確認（デスクトップ/タブレット/モバイル）
3. **機能テスト**: CRUD操作、検索・フィルタ、ワークフロー

テストケース一覧は `docs/テスト仕様書(Test-Specification).md` を参照。

## 実行方法

### ローカル開発
```bash
# WebUI-Sampleディレクトリでindex.htmlをブラウザで開く
# または簡易Webサーバーを起動
npx http-server WebUI-Sample -p 8080
```

### 本番デプロイ
1. Apache/Nginx等のWebサーバーにファイルを配置
2. HTTPS化（本番環境では必須）
3. 適切なセキュリティヘッダー設定

詳細は `DEPLOYMENT.md` を参照。

## トラブルシューティング

| 問題 | 解決策 |
|------|--------|
| 画面が表示されない | JavaScript有効化、キャッシュクリア |
| データが消えた | バックアップからリストア、シークレットモード確認 |
| API接続エラー | URL、APIキー、認証方式を確認 |

## 関連ドキュメント

開発作業時は以下のドキュメントを参照:
- 機能追加: `docs/機能仕様書(Functional-Specification).md`
- API追加: `docs/API仕様書(API-Specification).md`
- 画面変更: `docs/画面設計書(Screen-Design).md`
- セキュリティ: `docs/セキュリティ設計書(Security-Design).md`

## お問い合わせ

- 技術的な質問: システム管理者
- ドキュメント問題: Issue作成
