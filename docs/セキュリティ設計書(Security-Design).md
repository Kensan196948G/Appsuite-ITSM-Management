# AppSuite管理運用システム セキュリティ設計書

**文書番号**: SEC-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年1月20日

---

## 1. 概要

### 1.1 目的
本文書は、AppSuite管理運用システムのセキュリティ設計・対策について定義する。

### 1.2 セキュリティ方針
- 機密性（Confidentiality）: 認可されたユーザーのみがデータにアクセス可能
- 完全性（Integrity）: データの改ざん防止と検知
- 可用性（Availability）: 正当なユーザーが必要な時にシステムを利用可能

---

## 2. 認証・認可

### 2.1 ユーザー認証

#### 2.1.1 認証方式
| 方式 | 状態 | 説明 |
|------|------|------|
| ユーザーID/パスワード | 実装済み | 基本認証方式 |
| 二要素認証（2FA） | 設定可能 | TOTP対応予定 |
| SSO連携 | 将来予定 | SAML/OAuth2対応予定 |

#### 2.1.2 パスワードポリシー

| 項目 | デフォルト値 | 設定範囲 |
|------|-------------|---------|
| 最小文字数 | 8文字 | 6-32文字 |
| 大文字必須 | 有効 | 有効/無効 |
| 数字必須 | 有効 | 有効/無効 |
| 特殊文字必須 | 無効 | 有効/無効 |
| 有効期限 | 90日 | 0-365日（0は無期限） |

#### 2.1.3 パスワード検証ロジック

```javascript
function validatePassword(password, policy) {
    const errors = [];

    if (password.length < policy.minLength) {
        errors.push(`パスワードは${policy.minLength}文字以上必要です`);
    }

    if (policy.requireUpper && !/[A-Z]/.test(password)) {
        errors.push('大文字を含める必要があります');
    }

    if (policy.requireNumber && !/[0-9]/.test(password)) {
        errors.push('数字を含める必要があります');
    }

    if (policy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('特殊文字を含める必要があります');
    }

    return { valid: errors.length === 0, errors };
}
```

### 2.2 セッション管理

#### 2.2.1 セッション設定

| 項目 | デフォルト値 | 説明 |
|------|-------------|------|
| セッションタイムアウト | 30分 | 無操作時の自動ログアウト |
| 最大同時ログイン数 | 3 | 同一ユーザーの同時セッション数 |
| セッション延長 | 有効 | 操作時のタイムアウト延長 |

#### 2.2.2 セッション管理実装

```javascript
class SessionManager {
    constructor(timeoutMinutes = 30) {
        this.timeoutMs = timeoutMinutes * 60 * 1000;
        this.lastActivity = Date.now();
    }

    updateActivity() {
        this.lastActivity = Date.now();
    }

    isExpired() {
        return Date.now() - this.lastActivity > this.timeoutMs;
    }

    checkSession() {
        if (this.isExpired()) {
            this.logout();
            showToast('warning', 'セッションがタイムアウトしました');
        }
    }
}
```

### 2.3 ログイン制限

#### 2.3.1 ブルートフォース対策

| 項目 | デフォルト値 | 説明 |
|------|-------------|------|
| 失敗許容回数 | 5回 | ロックまでの失敗回数 |
| アカウントロック時間 | 15分 | ロック解除までの時間 |
| IPブロック | 無効 | 同一IPからの試行制限 |

#### 2.3.2 実装例

```javascript
const loginAttempts = new Map();

function checkLoginAttempts(userId) {
    const attempts = loginAttempts.get(userId) || { count: 0, lockedUntil: null };

    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
        throw new Error(`アカウントがロックされています。${remaining}分後に再試行してください`);
    }

    return true;
}

function recordFailedLogin(userId, maxAttempts, lockoutMinutes) {
    const attempts = loginAttempts.get(userId) || { count: 0, lockedUntil: null };
    attempts.count++;

    if (attempts.count >= maxAttempts) {
        attempts.lockedUntil = Date.now() + lockoutMinutes * 60 * 1000;
        attempts.count = 0;
    }

    loginAttempts.set(userId, attempts);
}
```

### 2.4 権限管理（RBAC）

#### 2.4.1 ロール定義

| ロール | 説明 | 権限レベル |
|--------|------|-----------|
| 管理者 | システム全体の管理権限 | フルアクセス |
| ユーザー | 一般的な操作権限 | 制限付きアクセス |

#### 2.4.2 権限マトリクス

| 機能 | 管理者 | ユーザー |
|------|:------:|:--------:|
| ダッシュボード閲覧 | ○ | ○ |
| ユーザー管理（全体） | ○ | × |
| ユーザー管理（自分） | ○ | ○ |
| アプリ管理 | ○ | ○ |
| インシデント管理 | ○ | ○ |
| 変更管理（申請） | ○ | ○ |
| 変更管理（承認） | ○ | × |
| 監査ログ閲覧 | ○ | △ |
| 監査ログエクスポート | ○ | × |
| システム設定 | ○ | × |

○: 許可、△: 制限付き許可、×: 不許可

#### 2.4.3 権限チェック実装

```javascript
function checkPermission(user, resource, action) {
    const permissions = {
        '管理者': {
            users: ['read', 'create', 'update', 'delete'],
            apps: ['read', 'create', 'update', 'delete'],
            incidents: ['read', 'create', 'update', 'delete'],
            changes: ['read', 'create', 'update', 'delete', 'approve'],
            logs: ['read', 'export'],
            settings: ['read', 'update']
        },
        'ユーザー': {
            users: ['read_own', 'update_own'],
            apps: ['read', 'create', 'update'],
            incidents: ['read', 'create', 'update'],
            changes: ['read', 'create', 'update'],
            logs: ['read'],
            settings: []
        }
    };

    const rolePermissions = permissions[user.role] || {};
    const resourcePermissions = rolePermissions[resource] || [];

    return resourcePermissions.includes(action);
}
```

---

## 3. データ保護

### 3.1 データ暗号化

#### 3.1.1 通信暗号化

| 項目 | 仕様 |
|------|------|
| プロトコル | HTTPS（TLS 1.2以上） |
| 証明書 | 有効なSSL証明書必須 |
| HSTS | 推奨 |

#### 3.1.2 保存データ暗号化

| データ | 暗号化 | 方式 |
|--------|:------:|------|
| パスワード | ○ | ハッシュ化（bcrypt推奨） |
| APIキー | ○ | AES-256 |
| 一般データ | △ | localStorage（平文） |

※将来的にIndexedDBの暗号化対応を検討

#### 3.1.3 機密データの扱い

```javascript
// APIキーの表示/非表示
function toggleApiKey() {
    const input = document.getElementById('apiKey');
    input.type = input.type === 'password' ? 'text' : 'password';
}

// 機密データのマスキング
function maskSensitiveData(data) {
    if (data.length <= 4) return '****';
    return data.substring(0, 2) + '****' + data.substring(data.length - 2);
}
```

### 3.2 入力検証

#### 3.2.1 バリデーションルール

| 項目 | ルール |
|------|--------|
| ユーザー名 | 1-50文字、英数字・アンダースコア |
| メールアドレス | RFC 5322準拠 |
| パスワード | ポリシーに従う |
| 数値入力 | 範囲チェック |
| 日付入力 | 形式チェック |

#### 3.2.2 XSS対策

```javascript
// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 使用例
function displayUserName(name) {
    element.innerHTML = escapeHtml(name);
}
```

#### 3.2.3 SQLインジェクション対策

現行システムはlocalStorageを使用しているため、SQLインジェクションのリスクはありません。
将来のDB移行時には、プリペアドステートメントを使用。

```javascript
// 将来のDB対応例
async function getUser(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    return await db.query(query, [id]);
}
```

### 3.3 CSRF対策

#### 3.3.1 対策方針

| 対策 | 状態 |
|------|------|
| CSRFトークン | 将来実装予定 |
| SameSite Cookie | 推奨設定 |
| Refererチェック | 推奨設定 |

---

## 4. 監査ログ

### 4.1 ログ記録対象

| カテゴリ | 対象イベント |
|----------|-------------|
| 認証 | ログイン成功/失敗、ログアウト |
| ユーザー管理 | 作成、更新、削除 |
| アプリ管理 | 作成、更新、削除 |
| インシデント管理 | 作成、更新、ステータス変更 |
| 変更管理 | 作成、更新、承認、却下 |
| システム設定 | 設定変更 |
| データ操作 | エクスポート、バックアップ、リストア |

### 4.2 ログ項目

| 項目 | 説明 | 必須 |
|------|------|:----:|
| timestamp | 操作日時 | ○ |
| userId | 操作ユーザーID | ○ |
| username | 操作ユーザー名 | ○ |
| action | 操作種別 | ○ |
| target | 対象リソース | ○ |
| targetId | 対象ID | - |
| details | 詳細情報 | - |
| ipAddress | クライアントIP | ○ |
| userAgent | ブラウザ情報 | - |

### 4.3 ログ実装

```javascript
function addAuditLog(action, target, targetId, details) {
    const log = {
        id: generateLogId(),
        timestamp: new Date().toISOString(),
        userId: getCurrentUser().id,
        username: getCurrentUser().username,
        action: action,
        target: target,
        targetId: targetId,
        details: details,
        ipAddress: getClientIP(),
        userAgent: navigator.userAgent
    };

    const logs = JSON.parse(localStorage.getItem('appsuite_logs') || '[]');
    logs.unshift(log);

    // ログ上限管理（10000件）
    if (logs.length > 10000) {
        logs.splice(10000);
    }

    localStorage.setItem('appsuite_logs', JSON.stringify(logs));
}
```

### 4.4 ログ保持・管理

| 項目 | 設定 |
|------|------|
| 保持期間 | 90日（設定変更可能） |
| 最大件数 | 10000件 |
| 自動削除 | 古いログから順次削除 |
| エクスポート | CSV形式対応 |

---

## 5. バックアップ・復旧

### 5.1 バックアップ方針

| 項目 | 設定 |
|------|------|
| 自動バックアップ | 毎日（設定変更可能） |
| 保持世代 | 7世代 |
| 形式 | JSON |

### 5.2 バックアップ実装

```javascript
function createBackup() {
    const backup = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data: {
            users: JSON.parse(localStorage.getItem('appsuite_users') || '[]'),
            apps: JSON.parse(localStorage.getItem('appsuite_apps') || '[]'),
            incidents: JSON.parse(localStorage.getItem('appsuite_incidents') || '[]'),
            changes: JSON.parse(localStorage.getItem('appsuite_changes') || '[]'),
            logs: JSON.parse(localStorage.getItem('appsuite_logs') || '[]'),
            settings: JSON.parse(localStorage.getItem('appsuite_settings') || '{}')
        }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const filename = `appsuite_backup_${formatDate(new Date())}.json`;

    downloadBlob(blob, filename);
    addAuditLog('export', 'system', null, 'バックアップ作成');
}
```

### 5.3 リストア手順

1. バックアップファイルを選択
2. ファイル形式・バージョン検証
3. 確認ダイアログ表示
4. 既存データをクリア
5. バックアップデータを復元
6. 監査ログに記録

```javascript
async function restoreBackup(file) {
    try {
        const content = await file.text();
        const backup = JSON.parse(content);

        // バージョンチェック
        if (!backup.version || !backup.data) {
            throw new Error('無効なバックアップファイルです');
        }

        // 確認
        if (!confirm('現在のデータは全て上書きされます。続行しますか？')) {
            return;
        }

        // リストア実行
        Object.keys(backup.data).forEach(key => {
            localStorage.setItem(`appsuite_${key}`, JSON.stringify(backup.data[key]));
        });

        addAuditLog('import', 'system', null, `リストア実行: ${backup.exportedAt}`);
        showToast('success', 'リストアが完了しました');
        location.reload();

    } catch (error) {
        showToast('error', `リストア失敗: ${error.message}`);
    }
}
```

---

## 6. セキュリティチェックリスト

### 6.1 開発時チェックリスト

| No. | 項目 | 確認 |
|-----|------|:----:|
| 1 | 入力値は全て検証されているか | □ |
| 2 | 出力時にHTMLエスケープされているか | □ |
| 3 | 機密データはマスキングされているか | □ |
| 4 | エラーメッセージで内部情報を漏らしていないか | □ |
| 5 | 権限チェックが実装されているか | □ |
| 6 | 操作ログが記録されているか | □ |

### 6.2 運用時チェックリスト

| No. | 項目 | 頻度 | 確認 |
|-----|------|------|:----:|
| 1 | 監査ログの定期確認 | 週次 | □ |
| 2 | バックアップの確認 | 日次 | □ |
| 3 | 不正アクセスの監視 | 日次 | □ |
| 4 | パスワード期限切れユーザーの確認 | 月次 | □ |
| 5 | 不要アカウントの棚卸 | 月次 | □ |

### 6.3 インシデント対応

| フェーズ | 対応内容 |
|---------|----------|
| 検知 | 監査ログ監視、異常検知 |
| 初動対応 | 影響範囲特定、一時対策 |
| 原因調査 | ログ分析、原因特定 |
| 復旧 | システム復旧、データ復旧 |
| 再発防止 | 対策実施、ドキュメント更新 |

---

## 7. コンプライアンス

### 7.1 対応規格・法令

| 規格・法令 | 対応状況 |
|-----------|----------|
| 個人情報保護法 | 対応必要 |
| ISO 27001 | 参考準拠 |
| ITIL | インシデント/変更管理準拠 |

### 7.2 個人情報の取り扱い

| データ種別 | 取り扱い |
|-----------|----------|
| ユーザー名 | 業務上必要な範囲で保持 |
| メールアドレス | 通知目的で利用 |
| IPアドレス | 監査ログで保持 |
| 操作履歴 | 90日間保持後削除 |

---

**文書履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2026-01-20 | 初版作成 | - |
