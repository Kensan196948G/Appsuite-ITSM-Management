# セキュリティ設計書（Security Design）

**ドキュメントID:** WUI-SEC-001
**プロジェクト名:** WebUI サンプルシステム
**バージョン:** 1.0.0
**作成日:** 2026-02-25
**最終更新日:** 2026-02-25
**ステータス:** Draft

---

## 1. セキュリティ設計方針

### 1.1 基本方針

- **多層防御（Defense in Depth）**: 単一の防御に依存せず、複数の層でセキュリティを確保する
- **最小権限の原則**: ユーザー・サービスアカウントには必要最小限の権限のみ付与する
- **ゼロトラスト**: 内部ネットワークも信頼しない。すべての通信を認証・認可する
- **セキュア・バイ・デフォルト**: 設定のデフォルト値はより安全な選択肢を採用する

### 1.2 脅威モデル（STRIDE）

| 脅威 | 対策 |
|------|------|
| Spoofing（なりすまし） | JWT認証、二要素認証 |
| Tampering（改ざん） | HTTPS、入力検証、署名付きトークン |
| Repudiation（否認） | 監査ログ、操作履歴の記録 |
| Information Disclosure（情報漏洩） | 暗号化、最小権限、マスキング |
| Denial of Service（サービス妨害） | レート制限、WAF、DDoS対策 |
| Elevation of Privilege（権限昇格） | RBAC、権限チェックの二重実装 |

---

## 2. 認証設計

### 2.1 認証フロー（JWT + リフレッシュトークン）

```
[クライアント]                [APIサーバー]
     │                            │
     ├─POST /auth/login──────────→│
     │  {email, password}         │
     │                      認証処理
     │                      ・パスワード照合（bcrypt）
     │                      ・アカウントロック確認
     │                            │
     │←─200 OK──────────────────┤
     │  {accessToken, refreshToken}
     │                            │
     │  (アクセストークン：1時間)    │
     │  (リフレッシュトークン：30日)  │
     │                            │
     ├─API呼出し──────────────────→│
     │  Authorization: Bearer <accessToken>
     │                      ・トークン検証
     │                      ・権限確認
     │                            │
     ├─(トークン期限切れ)           │
     ├─POST /auth/refresh─────────→│
     │  {refreshToken}            │
     │←─200 OK──────────────────┤
     │  {accessToken: 新トークン}   │
```

### 2.2 JWT設計

**アクセストークンペイロード:**
```json
{
  "sub": "usr_001",
  "email": "user@example.com",
  "role": "user",
  "iat": 1708855200,
  "exp": 1708858800,
  "jti": "token_unique_id"
}
```

**セキュリティ要件:**
- 署名アルゴリズム: **RS256**（非対称鍵）を推奨（最低限 HS256）
- アクセストークン有効期限: **1時間**
- リフレッシュトークン有効期限: **30日**
- リフレッシュトークンはデータベースに保存（失効処理のため）

### 2.3 パスワードポリシー

| 要件 | 設定値 |
|------|-------|
| 最小文字数 | 8文字 |
| 必須文字種 | 大文字・小文字・数字を各1文字以上 |
| 禁止文字列 | ユーザー名を含まない、一般的な辞書語 |
| 履歴制限 | 過去5回のパスワードを再利用不可 |
| ハッシュ | bcrypt（コスト係数: 12） |

### 2.4 ブルートフォース対策

```
ログイン試行監視:
- 同一IPから15分以内に10回失敗 → 30分間IPブロック
- 同一アカウントで5回失敗 → アカウント30分ロック
- ロック通知メールをアカウント所有者に送信
```

---

## 3. 認可設計（RBAC）

### 3.1 ロール定義

| ロール | 説明 |
|-------|------|
| super_admin | システム全体の管理権限 |
| admin | 業務データと一般ユーザーの管理権限 |
| user | 通常業務の実行権限（作成・編集・削除） |
| viewer | 参照のみ |

### 3.2 権限マトリクス

| 操作 | viewer | user | admin | super_admin |
|------|--------|------|-------|-------------|
| データ閲覧 | ○ | ○ | ○ | ○ |
| データ作成 | × | ○ | ○ | ○ |
| データ編集 | × | ○（自分） | ○ | ○ |
| データ削除 | × | ×  | ○ | ○ |
| 一括削除 | × | × | ○ | ○ |
| エクスポート | ○ | ○ | ○ | ○ |
| ユーザー閲覧 | × | × | ○ | ○ |
| ユーザー管理 | × | × | ○ | ○ |
| システム設定 | × | × | × | ○ |
| 監査ログ閲覧 | × | × | × | ○ |

### 3.3 フロントエンドでの権限チェック

```typescript
// hooks/usePermission.ts
export function usePermission() {
  const { user } = useAuthStore();

  const can = (action: Action, resource: Resource): boolean => {
    if (!user) return false;
    return checkPermission(user.role, action, resource);
  };

  return { can };
}

// 使用例
const { can } = usePermission();
{can('delete', 'items') && <Button variant="danger">削除</Button>}
```

**注意:** フロントエンドの権限チェックはUX目的のみ。実際の権限制御はAPIサーバー側で必ず実施。

---

## 4. 通信セキュリティ

### 4.1 HTTPS設定

- **TLSバージョン:** TLS 1.2以上（TLS 1.0/1.1は無効化）
- **暗号スイート:** AES-128-GCM以上
- **証明書:** Let's Encrypt または商用証明書（2048bit RSA以上）
- **HSTS:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

### 4.2 セキュリティヘッダー

```
# Nginx 設定例
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://cdn.example.com;
  connect-src 'self' https://api.example.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
";
```

---

## 5. 入力検証・出力エスケープ

### 5.1 XSS対策

| 対策 | 実装 |
|------|------|
| 出力エスケープ | React の JSX による自動エスケープ |
| 危険なHTML | `dangerouslySetInnerHTML` 使用禁止（例外時はDOMPurify） |
| CSP | `script-src 'self'`でインラインスクリプト禁止 |
| HTTPOnly Cookie | セッションCookieはJSからアクセス不可に設定 |

### 5.2 CSRF対策

- **SameSite Cookie属性**: `SameSite=Strict` または `SameSite=Lax`
- **CSRFトークン**: 状態変更APIリクエストにCSRFトークン必須
- **カスタムリクエストヘッダー**: `X-Requested-With: XMLHttpRequest`

### 5.3 SQLインジェクション対策

- **Prisma ORM** のパラメータ化クエリを使用
- 生SQLが必要な場合は `$executeRaw` + パラメータバインディングを使用
- ユーザー入力を直接SQL文に埋め込まない

---

## 6. 機密データ管理

### 6.1 フロントエンドでの機密データ取り扱い

| データ | 保存場所 | 注意事項 |
|--------|---------|---------|
| アクセストークン | メモリ（Zustand） | localStorageに保存しない |
| リフレッシュトークン | HttpOnly Cookie | JSからアクセス不可 |
| パスワード | 保存しない | - |
| 個人情報 | メモリのみ | 永続化しない |

### 6.2 ログでの機密データマスキング

```typescript
// ログ出力時にマスキング
const maskSensitiveFields = (obj: Record<string, unknown>) => {
  const sensitiveFields = ['password', 'token', 'secret', 'creditCard'];
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
      return { ...acc, [key]: '***MASKED***' };
    }
    return { ...acc, [key]: value };
  }, {});
};
```

---

## 7. セキュリティ監査・テスト

### 7.1 定期セキュリティ対応

| 対応 | 頻度 |
|------|------|
| 依存パッケージ脆弱性スキャン（npm audit） | 毎日（CI/CD） |
| OWASP ZAP による動的スキャン | リリース前 |
| 手動ペネトレーションテスト | 年1回 |
| セキュリティコードレビュー | PR毎 |

### 7.2 OWASP Top 10 対応チェックリスト

| # | 脅威 | 対応状況 |
|---|------|---------|
| A01 | アクセス制御の欠陥 | RBAC実装 |
| A02 | 暗号化の失敗 | HTTPS + bcrypt |
| A03 | インジェクション | ORM使用 + 入力検証 |
| A04 | 安全でない設計 | 脅威モデリング実施 |
| A05 | セキュリティの設定ミス | セキュリティヘッダー設定 |
| A06 | 脆弱なコンポーネント | 定期スキャン |
| A07 | 認証・認可の失敗 | JWT + MFA |
| A08 | ソフトウェアの整合性 | SRI + 署名検証 |
| A09 | ログ・監視の失敗 | 構造化ログ + SIEM |
| A10 | サーバーサイドリクエストフォージェリ | URL許可リスト |

---

## 8. 改訂履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-25 | 初版作成 | システム管理者 |
