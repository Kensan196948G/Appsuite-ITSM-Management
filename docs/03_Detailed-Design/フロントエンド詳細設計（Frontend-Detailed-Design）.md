# フロントエンド詳細設計（Frontend Detailed Design）
**プロジェクト**: Appsuite専用運用管理システム  
**作成日**: 2026-02-25  

## 1. 技術スタック
| 分類 | 技術 | バージョン | 選定理由 |
|------|------|----------|----------|
| マークアップ | HTML5 | - | 標準仕様 |
| スタイリング | CSS3 + カスタムCSS | - | 軽量・依存なし |
| スクリプト | Vanilla JavaScript | ES2022 | フレームワーク不要・軽量 |
| アイコン | Font Awesome | 6.4.0 (CDN) | 豊富なアイコンセット |
| グラフ | Chart.js | 4.x (CDN) | 軽量・多機能 |

## 2. ディレクトリ構成
```
/src
├── index.html          # エントリポイント（ログイン画面）
├── dashboard.html      # ダッシュボード
├── users.html          # ユーザー管理
├── apps.html           # アプリ管理
├── incidents.html      # インシデント管理
├── changes.html        # 変更管理
├── audit.html          # 監査ログ
├── settings.html       # システム設定
├── css/
│   ├── base.css        # 共通スタイル・変数定義
│   ├── layout.css      # レイアウト
│   ├── components.css  # UIコンポーネント
│   └── pages/          # ページ別スタイル
├── js/
│   ├── api.js          # API通信共通処理
│   ├── auth.js         # 認証管理
│   ├── storage.js      # IndexedDB操作
│   ├── utils.js        # ユーティリティ関数
│   └── pages/          # ページ別ロジック
└── assets/
    ├── icons/          # カスタムアイコン
    └── images/         # 画像リソース
```

## 3. コンポーネント設計

### 3.1 共通コンポーネント
| コンポーネント | 説明 | 使用ページ |
|-------------|------|----------|
| Sidebar | サイドナビゲーション | 全ページ |
| Header | トップバー（ユーザー情報・通知） | 全ページ |
| Modal | ポップアップダイアログ | 全ページ |
| DataTable | データ一覧テーブル（ソート・ページング） | 全一覧ページ |
| Toast | 操作結果通知 | 全ページ |
| Breadcrumb | パンくずリスト | 全ページ |
| LoadingSpinner | ローディング表示 | 全ページ |

### 3.2 状態管理
- グローバル状態: `window.AppState` オブジェクト
- セッション情報: IndexedDB（暗号化）
- UI状態: 各ページのローカル変数

## 4. API通信設計（api.js）
```javascript
// APIリクエスト共通処理
async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = await getStoredToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-CSRF-Token': getCSRFToken()
    },
    body: data ? JSON.stringify(data) : null
  });
  if (!response.ok) handleAPIError(response);
  return response.json();
}
```

## 5. エラーハンドリング設計
| エラー種別 | 処理方法 | ユーザー通知 |
|-----------|---------|------------|
| APIエラー (4xx) | ログ記録 + エラーメッセージ表示 | Toast通知 |
| APIエラー (5xx) | ログ記録 + リトライ処理 | Toast通知 + サポート連絡先表示 |
| 認証エラー (401) | セッション削除 + ログインページ遷移 | モーダル表示 |
| ネットワークエラー | オフラインモード切替 | バナー表示 |
| バリデーションエラー | フォームフィールドハイライト | インラインエラー |
