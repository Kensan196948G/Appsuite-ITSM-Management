# セキュリティ詳細設計（Security Detailed Design）
**プロジェクト**: Appsuite専用運用管理システム  
**作成日**: 2026-02-25  

## 1. 認証・認可設計

### 1.1 認証方式
- **方式**: セッションベース認証 + DeskNet's Neo OAuth連携
- **セッション管理**: IndexedDBにAES-256暗号化保存
- **トークン有効期限**: デフォルト8時間（設定変更可）

### 1.2 権限マトリクス
| 機能 | 管理者 | 一般ユーザー | 閲覧者 |
|------|--------|------------|--------|
| ユーザー管理 | ✅ | ❌ | ❌ |
| アプリ管理 | ✅ | ✅（担当のみ） | 閲覧のみ |
| インシデント管理 | ✅ | ✅ | 閲覧のみ |
| 変更管理 | ✅ | ✅（申請のみ） | 閲覧のみ |
| 監査ログ | ✅ | 自分のみ | ❌ |
| システム設定 | ✅ | ❌ | ❌ |

## 2. 通信セキュリティ
- **HTTPS強制**: HTTPアクセスを自動リダイレクト
- **TLS**: 1.2以上必須
- **CORS**: 許可ドメインの厳格な管理
- **CSP（Content Security Policy）**: `script-src 'self'` 設定

## 3. データ保護
### 3.1 APIキー保護
```javascript
// AES-256-GCMによるAPIキー暗号化
async function encryptAPIKey(apiKey) {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    key,
    new TextEncoder().encode(apiKey)
  );
  return encrypted;
}
```

### 3.2 XSS対策
- DOM操作はinnerHTMLを使用せず、textContent/createElementを使用
- 入力値のサニタイズ処理を全フォームに適用

### 3.3 CSRF対策
- ダブルサブミットCookieパターン実装
- 状態変更リクエストに必ずCSRFトークン付与

## 4. 監査ログ設計
| ログ項目 | 記録タイミング | 保持期間 |
|---------|-------------|---------|
| ログイン/ログアウト | 発生時 | 90日 |
| ユーザー作成/変更/削除 | 発生時 | 90日 |
| アプリ登録/変更/削除 | 発生時 | 90日 |
| インシデント操作 | 発生時 | 90日 |
| 変更管理操作 | 発生時 | 1年 |
| 設定変更 | 発生時 | 1年 |
