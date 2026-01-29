# DeskNet's Neo API テスト仕様書

**作成日**: 2026-01-29
**バージョン**: 1.0.0

---

## 概要

AppSuite ITSM管理システムとDeskNet's Neo APIの連携テスト仕様を定義します。

## API接続設定

| 項目 | 設定値 |
|------|--------|
| エンドポイント | `https://{domain}.desknets.com/cgi-bin/dneo/zap.cgi` |
| 認証方式 | Bearer Token / Basic認証 / APIキー |
| タイムアウト | 30秒（デフォルト） |
| 対応バージョン | DeskNet's Neo V7.0以降 |

---

## テストケース一覧

### 1. 接続テスト (ApiConfig.test)

| ID | テストケース | 前提条件 | 期待結果 |
|----|------------|---------|---------|
| API-001 | 有効なURL・認証で接続 | 正しいAPI URL、有効なトークン | 接続成功、ステータス「接続中」表示 |
| API-002 | 無効なURLで接続 | 不正なURL | エラーメッセージ表示 |
| API-003 | 無効なトークンで接続 | 正しいURL、無効なトークン | 401 Unauthorized |
| API-004 | タイムアウト発生 | 遅延サーバー | 「リクエストがタイムアウトしました」 |
| API-005 | URL未入力で接続 | 空のURL | 「API URLを入力してください」 |

### 2. 認証方式テスト (Api.getHeaders)

| ID | テストケース | 認証方式 | 期待されるヘッダー |
|----|------------|---------|------------------|
| AUTH-001 | Bearer Token | bearer | `Authorization: Bearer {token}` |
| AUTH-002 | Basic認証 | basic | `Authorization: Basic {base64}` |
| AUTH-003 | APIキー | apikey | `X-API-Key: {key}` |

### 3. ユーザー同期テスト (ApiSync.syncUsers)

| ID | テストケース | APIレスポンス | 期待結果 |
|----|------------|--------------|---------|
| SYNC-001 | 正常同期 | `{status: 'success', users: [...]}` | ユーザーリスト更新 |
| SYNC-002 | 空のユーザー | `{status: 'success', users: []}` | 空リストで更新 |
| SYNC-003 | エラーレスポンス | `{status: 'error'}` | エラー通知表示 |
| SYNC-004 | 不正なフォーマット | `{users: null}` | 例外処理実行 |

### 4. アプリ同期テスト (ApiSync.syncApps)

| ID | テストケース | APIレスポンス | 期待結果 |
|----|------------|--------------|---------|
| SYNC-005 | 正常同期 | `{status: 'success', apps: [...]}` | アプリリスト更新 |
| SYNC-006 | 空のアプリ | `{status: 'success', apps: []}` | 空リストで更新 |
| SYNC-007 | エラーレスポンス | `{status: 'error'}` | エラー通知表示 |

### 5. 自動同期テスト (ApiSync.startAutoSync)

| ID | テストケース | 設定 | 期待結果 |
|----|------------|-----|---------|
| AUTO-001 | 5分間隔 | syncInterval: 5 | 5分ごとに同期実行 |
| AUTO-002 | 同期停止 | stopAutoSync() | タイマーキャンセル |
| AUTO-003 | 間隔0 | syncInterval: 0 | 自動同期なし |

### 6. DataStore テスト

| ID | テストケース | 操作 | 期待結果 |
|----|------------|-----|---------|
| DS-001 | データ作成 | create('users', newUser) | localStorage保存 |
| DS-002 | データ更新 | update('users', id, updates) | 更新反映 |
| DS-003 | データ削除 | delete('users', id) | 削除反映 |
| DS-004 | ID検索 | findById('users', id) | 該当アイテム返却 |
| DS-005 | 条件検索 | findWhere('users', predicate) | フィルタ結果 |
| DS-006 | データリセット | reset() | デフォルト値復元 |
| DS-007 | 全データエクスポート | exportAll() | JSON出力 |
| DS-008 | データインポート | importAll(data) | データ復元 |

---

## モックサーバー設定

### テスト用レスポンス

```javascript
// ユーザー取得成功
const mockUsersResponse = {
    status: 'success',
    users: [
        { userid: 'U001', name: '山田太郎', email: 'yamada@example.com', dept: '情報システム部' },
        { userid: 'U002', name: '鈴木花子', email: 'suzuki@example.com', dept: '営業部' }
    ]
};

// アプリ取得成功
const mockAppsResponse = {
    status: 'success',
    apps: [
        { appid: 'APP001', name: '勤怠管理', recordcount: 1250 },
        { appid: 'APP002', name: '経費精算', recordcount: 856 }
    ]
};

// エラーレスポンス
const mockErrorResponse = {
    status: 'error',
    message: 'Authentication failed'
};
```

---

## 実接続テスト手順

### 前提条件
1. DeskNet's Neo V7.0以降のサーバーへのアクセス権
2. 有効なAPIキー（システム管理者権限）
3. ネットワーク接続

### テスト手順

1. **API設定入力**
   - システム設定 → API接続タブを開く
   - API URLを入力（例: `https://demo.desknets.com/cgi-bin/dneo/zap.cgi`）
   - APIキーを入力
   - 認証方式を選択

2. **接続テスト実行**
   - 「接続テスト」ボタンをクリック
   - 接続ステータスが「接続中」に変わることを確認
   - APIバージョンが表示されることを確認

3. **手動同期実行**
   - 「手動同期」ボタンをクリック
   - ユーザー管理・アプリ管理のデータが更新されることを確認
   - 「同期が完了しました」トースト表示確認

4. **自動同期確認**
   - 同期間隔を「5分」に設定
   - 5分後に自動同期が実行されることを確認

---

## エラーハンドリング確認

| エラー種別 | 原因 | 表示メッセージ |
|-----------|------|--------------|
| Network Error | サーバー到達不可 | 「接続失敗: Network Error」 |
| 401 Unauthorized | 認証エラー | 「接続失敗: HTTP 401」 |
| 403 Forbidden | 権限不足 | 「接続失敗: HTTP 403」 |
| 500 Internal Server Error | サーバーエラー | 「接続失敗: HTTP 500」 |
| Timeout | タイムアウト | 「リクエストがタイムアウトしました」 |

---

## 合格基準

- [ ] 全接続テスト（API-001〜005）がパス
- [ ] 全認証方式テスト（AUTH-001〜003）がパス
- [ ] 全同期テスト（SYNC-001〜007）がパス
- [ ] 自動同期テスト（AUTO-001〜003）がパス
- [ ] DataStoreテスト（DS-001〜008）がパス
- [ ] エラーハンドリングが適切に動作

---

**テスト実施者**: ________________
**テスト日**: ________________
**結果**: □ 合格 / □ 不合格
