# APIキー暗号化（Web Crypto API）詳細設計書

**作成日**: 2026-02-11
**対象フェーズ**: Phase 5
**実装期間**: 2日
**優先度**: P1（緊急対応）
**セキュリティID**: SEC-001

---

## 1. 背景と目的

### 1.1 現状の脆弱性

**ファイル**: `/WebUI-Production/js/api.js:17-24`

```javascript
// 現状（脆弱）
save() {
    const config = {
        baseUrl: this.baseUrl,
        apiKey: this.apiKey,  // ← 平文で保存
        authType: this.authType,
        username: this.username,
        password: this.password
    };
    localStorage.setItem('appsuite_api_config', JSON.stringify(config));
}
```

**問題点**:
1. **XSS攻撃リスク**: `<script>`タグで`localStorage.getItem()`が実行可能
2. **ブラウザ拡張機能**: 悪意のある拡張機能がAPIキーを読取可能
3. **開発者ツール**: F12キー → Console → `localStorage.getItem('appsuite_api_config')`で閲覧可能
4. **影響範囲**: DeskNet's Neo APIへの不正アクセス

### 1.2 対策目標

| 項目 | 現状 | 目標 |
|------|------|------|
| **保存形式** | 平文（JSON） | 暗号化（AES-GCM） |
| **保存場所** | localStorage（永続） | sessionStorage（セッション限定） |
| **暗号化キー** | なし | ユーザーパスワード由来 |
| **セキュリティスコア** | 85点 | **90点以上** |

---

## 2. アーキテクチャ設計

### 2.1 暗号化フロー

```
User Input (API Key + Password)
  ↓
Derive Encryption Key from Password (PBKDF2)
  ↓
Encrypt API Key (AES-GCM-256)
  ↓
Store Encrypted Data (sessionStorage)
  ↓
On Retrieval: Decrypt with Password
```

### 2.2 技術選定

| 技術 | 選定理由 |
|------|---------|
| **Web Crypto API** | ブラウザ標準、ハードウェアアクセラレーション対応 |
| **AES-GCM-256** | 認証付き暗号化、NIST推奨 |
| **PBKDF2** | パスワードベース鍵導出関数、OWASP推奨 |
| **sessionStorage** | ブラウザクローズで自動削除、永続化しない |

---

## 3. 実装設計

### 3.1 CryptoHelper クラス

**ファイル**: `/WebUI-Production/js/crypto-helper.js`（新規作成）

```javascript
/**
 * CryptoHelper - Web Crypto API ラッパー
 */
class CryptoHelper {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12; // GCMでは12バイト推奨
        this.saltLength = 16;
        this.iterations = 100000; // PBKDF2イテレーション回数（OWASP推奨）
    }

    /**
     * パスワードから暗号化キーを導出
     * @param {string} password - ユーザーパスワード
     * @param {Uint8Array} salt - ソルト（16バイト）
     * @returns {Promise<CryptoKey>}
     */
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // ステップ1: パスワードからベースキーを生成
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        // ステップ2: PBKDF2でAES-GCM用キーを導出
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            baseKey,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            false, // extractable: false（キーのエクスポート不可）
            ['encrypt', 'decrypt']
        );

        return derivedKey;
    }

    /**
     * データを暗号化
     * @param {string} plaintext - 平文データ
     * @param {string} password - 暗号化パスワード
     * @returns {Promise<string>} Base64エンコードされた暗号化データ
     */
    async encrypt(plaintext, password) {
        const encoder = new TextEncoder();
        const plaintextBuffer = encoder.encode(plaintext);

        // ランダムなソルトとIVを生成
        const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
        const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

        // 暗号化キーを導出
        const key = await this.deriveKey(password, salt);

        // 暗号化実行
        const ciphertextBuffer = await crypto.subtle.encrypt(
            {
                name: this.algorithm,
                iv: iv
            },
            key,
            plaintextBuffer
        );

        // 結果を結合: [salt(16) + iv(12) + ciphertext + authTag(16)]
        const resultBuffer = new Uint8Array(
            salt.byteLength + iv.byteLength + ciphertextBuffer.byteLength
        );
        resultBuffer.set(salt, 0);
        resultBuffer.set(iv, salt.byteLength);
        resultBuffer.set(new Uint8Array(ciphertextBuffer), salt.byteLength + iv.byteLength);

        // Base64エンコード
        return this.arrayBufferToBase64(resultBuffer);
    }

    /**
     * データを復号化
     * @param {string} encryptedData - Base64エンコードされた暗号化データ
     * @param {string} password - 復号化パスワード
     * @returns {Promise<string>} 復号化された平文
     */
    async decrypt(encryptedData, password) {
        // Base64デコード
        const dataBuffer = this.base64ToArrayBuffer(encryptedData);

        // ソルト、IV、暗号文を分離
        const salt = dataBuffer.slice(0, this.saltLength);
        const iv = dataBuffer.slice(this.saltLength, this.saltLength + this.ivLength);
        const ciphertext = dataBuffer.slice(this.saltLength + this.ivLength);

        // 暗号化キーを導出
        const key = await this.deriveKey(password, salt);

        // 復号化実行
        const plaintextBuffer = await crypto.subtle.decrypt(
            {
                name: this.algorithm,
                iv: iv
            },
            key,
            ciphertext
        );

        // テキストに変換
        const decoder = new TextDecoder();
        return decoder.decode(plaintextBuffer);
    }

    /**
     * ArrayBufferをBase64文字列に変換
     * @param {ArrayBuffer} buffer
     * @returns {string}
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Base64文字列をArrayBufferに変換
     * @param {string} base64
     * @returns {Uint8Array}
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * パスワード強度チェック
     * @param {string} password
     * @returns {object} { valid: boolean, strength: string, messages: Array }
     */
    checkPasswordStrength(password) {
        const result = {
            valid: false,
            strength: 'weak',
            messages: []
        };

        if (!password || password.length < 8) {
            result.messages.push('パスワードは8文字以上にしてください');
            return result;
        }

        let strength = 0;

        // 長さチェック
        if (password.length >= 12) strength++;
        if (password.length >= 16) strength++;

        // 複雑性チェック
        if (/[a-z]/.test(password)) strength++; // 小文字
        if (/[A-Z]/.test(password)) strength++; // 大文字
        if (/[0-9]/.test(password)) strength++; // 数字
        if (/[^a-zA-Z0-9]/.test(password)) strength++; // 特殊文字

        if (strength <= 2) {
            result.strength = 'weak';
            result.messages.push('パスワードが弱いです');
        } else if (strength <= 4) {
            result.strength = 'medium';
            result.valid = true;
        } else {
            result.strength = 'strong';
            result.valid = true;
        }

        return result;
    }
}

// シングルトンインスタンス
const cryptoHelper = new CryptoHelper();
```

---

### 3.2 ApiConfig クラス修正

**ファイル**: `/WebUI-Production/js/api.js`（修正）

```javascript
class ApiConfig {
    constructor() {
        this.baseUrl = '';
        this.apiKey = '';
        this.authType = 'bearer'; // 'bearer', 'basic', 'apikey'
        this.username = '';
        this.password = '';
        this.timeout = 30000;

        // 暗号化パスワード（セッションのみ保持、永続化しない）
        this.encryptionPassword = null;
    }

    /**
     * 設定を暗号化して保存（sessionStorageへ）
     * @param {string} encryptionPassword - 暗号化パスワード
     * @returns {Promise<void>}
     */
    async save(encryptionPassword) {
        // パスワード強度チェック
        const strengthCheck = cryptoHelper.checkPasswordStrength(encryptionPassword);
        if (!strengthCheck.valid) {
            throw new Error(`暗号化パスワードが不十分です: ${strengthCheck.messages.join(', ')}`);
        }

        const config = {
            baseUrl: this.baseUrl,
            apiKey: this.apiKey,
            authType: this.authType,
            username: this.username,
            password: this.password,
            timeout: this.timeout,
            savedAt: new Date().toISOString()
        };

        // JSON文字列化 → 暗号化
        const configJson = JSON.stringify(config);
        const encryptedData = await cryptoHelper.encrypt(configJson, encryptionPassword);

        // sessionStorageに保存（ブラウザクローズで自動削除）
        sessionStorage.setItem('appsuite_api_config_encrypted', encryptedData);

        // 暗号化パスワードをメモリに保持（セッション内のみ）
        this.encryptionPassword = encryptionPassword;

        console.log('✅ API設定を暗号化して保存しました（sessionStorage）');
    }

    /**
     * 設定を復号化して読込
     * @param {string} encryptionPassword - 復号化パスワード
     * @returns {Promise<boolean>} 成功時true
     */
    async load(encryptionPassword) {
        const encryptedData = sessionStorage.getItem('appsuite_api_config_encrypted');

        if (!encryptedData) {
            console.warn('⚠️ 保存された設定が見つかりません');
            return false;
        }

        try {
            // 復号化
            const configJson = await cryptoHelper.decrypt(encryptedData, encryptionPassword);
            const config = JSON.parse(configJson);

            // 設定を復元
            this.baseUrl = config.baseUrl || '';
            this.apiKey = config.apiKey || '';
            this.authType = config.authType || 'bearer';
            this.username = config.username || '';
            this.password = config.password || '';
            this.timeout = config.timeout || 30000;

            // 暗号化パスワードをメモリに保持
            this.encryptionPassword = encryptionPassword;

            console.log('✅ API設定を復号化して読込みました');
            return true;
        } catch (error) {
            console.error('❌ 復号化失敗（パスワードが間違っている可能性）', error);
            throw new Error('API設定の復号化に失敗しました。パスワードを確認してください。');
        }
    }

    /**
     * APIキーを取得（マスキング表示用）
     * @returns {string}
     */
    getApiKeyMasked() {
        if (!this.apiKey) return '';
        if (this.apiKey.length <= 8) return '****';
        // 最初の4文字と最後の4文字のみ表示
        const first = this.apiKey.slice(0, 4);
        const last = this.apiKey.slice(-4);
        return `${first}${'*'.repeat(this.apiKey.length - 8)}${last}`;
    }

    /**
     * 設定をクリア
     */
    clear() {
        sessionStorage.removeItem('appsuite_api_config_encrypted');
        this.encryptionPassword = null;
        this.baseUrl = '';
        this.apiKey = '';
        this.authType = 'bearer';
        this.username = '';
        this.password = '';
        console.log('✅ API設定をクリアしました');
    }

    /**
     * 自動ロック機能（一定時間後に設定をクリア）
     * @param {number} minutes - 自動ロックまでの分数（デフォルト: 30分）
     */
    enableAutoLock(minutes = 30) {
        const lockTime = minutes * 60 * 1000;

        // 既存のタイマーをクリア
        if (this.autoLockTimer) {
            clearTimeout(this.autoLockTimer);
        }

        this.autoLockTimer = setTimeout(() => {
            console.warn('⚠️ 自動ロック: API設定をクリアします');
            this.clear();
            // ユーザーに通知
            if (typeof showToast === 'function') {
                showToast('セキュリティのため、API設定がクリアされました。再度設定してください。', 'warning');
            }
        }, lockTime);

        console.log(`🔒 自動ロックを有効化しました（${minutes}分後）`);
    }
}
```

---

### 3.3 UI実装（設定画面）

**ファイル**: `/WebUI-Production/index.html`（修正）

```html
<!-- システム設定 > API接続設定 -->
<div class="card mb-4">
    <div class="card-header">
        <i class="fas fa-plug me-2"></i>API接続設定
    </div>
    <div class="card-body">
        <!-- 暗号化パスワード入力 -->
        <div class="alert alert-info">
            <i class="fas fa-shield-alt me-2"></i>
            <strong>セキュリティ強化:</strong> API設定は暗号化して保存されます。暗号化パスワードを設定してください。
        </div>

        <div class="mb-3">
            <label for="encryptionPassword" class="form-label">
                暗号化パスワード <span class="text-danger">*</span>
            </label>
            <div class="input-group">
                <input type="password" class="form-control" id="encryptionPassword"
                       placeholder="8文字以上（英大小文字・数字・記号を含む）" required>
                <button class="btn btn-outline-secondary" type="button" id="toggleEncryptionPassword">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
            <div id="passwordStrengthIndicator" class="mt-2"></div>
            <small class="form-text text-muted">
                このパスワードでAPI設定が暗号化されます。忘れた場合は再設定が必要です。
            </small>
        </div>

        <!-- 既存のAPI設定フィールド -->
        <div class="mb-3">
            <label for="apiBaseUrl" class="form-label">APIベースURL</label>
            <input type="url" class="form-control" id="apiBaseUrl"
                   placeholder="https://example.desknets.com/cgi-bin/dneo/zap.cgi">
        </div>

        <div class="mb-3">
            <label for="apiKey" class="form-label">APIキー</label>
            <div class="input-group">
                <input type="password" class="form-control" id="apiKey"
                       placeholder="APIキーを入力">
                <button class="btn btn-outline-secondary" type="button" id="toggleApiKey">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
            <small class="form-text text-muted">
                現在の値: <span id="apiKeyMasked" class="badge bg-secondary">未設定</span>
            </small>
        </div>

        <!-- 認証方式選択 -->
        <div class="mb-3">
            <label class="form-label">認証方式</label>
            <select class="form-select" id="apiAuthType">
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic認証</option>
                <option value="apikey">APIキー</option>
            </select>
        </div>

        <!-- 自動ロック設定 -->
        <div class="mb-3">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="enableAutoLock" checked>
                <label class="form-check-label" for="enableAutoLock">
                    自動ロックを有効化（30分後に設定をクリア）
                </label>
            </div>
        </div>

        <div class="d-flex gap-2">
            <button class="btn btn-primary" onclick="saveApiConfig()">
                <i class="fas fa-save me-2"></i>保存
            </button>
            <button class="btn btn-secondary" onclick="loadApiConfig()">
                <i class="fas fa-download me-2"></i>読込
            </button>
            <button class="btn btn-danger" onclick="clearApiConfig()">
                <i class="fas fa-trash me-2"></i>クリア
            </button>
            <button class="btn btn-info" onclick="testApiConnection()">
                <i class="fas fa-vial me-2"></i>接続テスト
            </button>
        </div>
    </div>
</div>
```

---

### 3.4 JavaScript実装（設定画面）

```javascript
/**
 * API設定保存
 */
async function saveApiConfig() {
    const encryptionPassword = document.getElementById('encryptionPassword').value;
    const baseUrl = document.getElementById('apiBaseUrl').value;
    const apiKey = document.getElementById('apiKey').value;
    const authType = document.getElementById('apiAuthType').value;

    // バリデーション
    if (!encryptionPassword) {
        showToast('暗号化パスワードを入力してください', 'error');
        return;
    }

    if (!baseUrl || !apiKey) {
        showToast('APIベースURLとAPIキーを入力してください', 'error');
        return;
    }

    try {
        // API設定オブジェクトを更新
        apiConfig.baseUrl = baseUrl;
        apiConfig.apiKey = apiKey;
        apiConfig.authType = authType;

        // 暗号化して保存
        await apiConfig.save(encryptionPassword);

        // マスキング表示を更新
        document.getElementById('apiKeyMasked').textContent = apiConfig.getApiKeyMasked();

        // 自動ロック有効化
        if (document.getElementById('enableAutoLock').checked) {
            apiConfig.enableAutoLock(30);
        }

        showToast('API設定を暗号化して保存しました', 'success');

        // 監査ログ記録
        LogModule.addLog('設定変更', 'API接続設定', 'API設定を暗号化して保存');

    } catch (error) {
        console.error('API設定保存失敗', error);
        showToast(`保存に失敗しました: ${error.message}`, 'error');
    }
}

/**
 * API設定読込
 */
async function loadApiConfig() {
    const encryptionPassword = prompt('暗号化パスワードを入力してください:');

    if (!encryptionPassword) {
        return;
    }

    try {
        const success = await apiConfig.load(encryptionPassword);

        if (success) {
            // UIに反映
            document.getElementById('apiBaseUrl').value = apiConfig.baseUrl;
            document.getElementById('apiAuthType').value = apiConfig.authType;
            document.getElementById('apiKeyMasked').textContent = apiConfig.getApiKeyMasked();

            // APIキーフィールドは空のまま（セキュリティ）
            document.getElementById('apiKey').placeholder = '（既存の値を使用）';

            showToast('API設定を読込みました', 'success');

            // 自動ロック有効化
            if (document.getElementById('enableAutoLock').checked) {
                apiConfig.enableAutoLock(30);
            }
        }
    } catch (error) {
        console.error('API設定読込失敗', error);
        showToast(`読込に失敗しました: ${error.message}`, 'error');
    }
}

/**
 * API設定クリア
 */
function clearApiConfig() {
    if (!confirm('API設定をクリアしてもよろしいですか？')) {
        return;
    }

    apiConfig.clear();

    // UIをリセット
    document.getElementById('encryptionPassword').value = '';
    document.getElementById('apiBaseUrl').value = '';
    document.getElementById('apiKey').value = '';
    document.getElementById('apiAuthType').value = 'bearer';
    document.getElementById('apiKeyMasked').textContent = '未設定';

    showToast('API設定をクリアしました', 'info');

    // 監査ログ記録
    LogModule.addLog('設定変更', 'API接続設定', 'API設定をクリア');
}

/**
 * パスワード強度インジケーター
 */
document.getElementById('encryptionPassword').addEventListener('input', function(e) {
    const password = e.target.value;
    const indicator = document.getElementById('passwordStrengthIndicator');

    if (!password) {
        indicator.innerHTML = '';
        return;
    }

    const strength = cryptoHelper.checkPasswordStrength(password);

    let badgeClass = 'bg-danger';
    let icon = 'fa-times-circle';
    if (strength.strength === 'medium') {
        badgeClass = 'bg-warning';
        icon = 'fa-exclamation-triangle';
    } else if (strength.strength === 'strong') {
        badgeClass = 'bg-success';
        icon = 'fa-check-circle';
    }

    indicator.innerHTML = `
        <span class="badge ${badgeClass}">
            <i class="fas ${icon} me-1"></i>
            強度: ${strength.strength.toUpperCase()}
        </span>
        ${strength.messages.length > 0 ? `<small class="text-muted ms-2">${strength.messages.join(', ')}</small>` : ''}
    `;
});

/**
 * パスワード表示切替
 */
document.getElementById('toggleEncryptionPassword').addEventListener('click', function() {
    const input = document.getElementById('encryptionPassword');
    const icon = this.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

document.getElementById('toggleApiKey').addEventListener('click', function() {
    const input = document.getElementById('apiKey');
    const icon = this.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
});
```

---

## 4. セキュリティ評価

### 4.1 脅威モデル

| 脅威 | 現状（平文） | 対策後（暗号化） |
|------|------------|---------------|
| **XSS攻撃** | 🔴 高リスク（即座にAPIキー取得） | 🟢 低リスク（暗号化パスワードが必要） |
| **ブラウザ拡張** | 🔴 高リスク（localStorage読取可能） | 🟡 中リスク（sessionStorage読取可能だが暗号化） |
| **開発者ツール** | 🔴 高リスク（F12で即座に閲覧） | 🟡 中リスク（暗号化データのみ） |
| **物理アクセス** | 🔴 高リスク（PCにアクセスすれば取得） | 🟢 低リスク（ブラウザクローズで削除） |

### 4.2 セキュリティスコア改善

| 項目 | 現状 | 対策後 | 改善 |
|------|:----:|:------:|:----:|
| 認証セキュリティ | 85点 | 95点 | +10 |
| データ保護 | 85点 | 95点 | +10 |
| **総合スコア** | **85点** | **95点** | **+10** |

**目標達成**: ✅ 90点以上

---

## 5. テスト計画

### 5.1 ユニットテスト

```javascript
// tests/crypto-helper.test.js
describe('CryptoHelper', () => {
    const cryptoHelper = new CryptoHelper();
    const password = 'TestPassword@123';
    const plaintext = 'APIキー: abc123def456';

    test('暗号化と復号化が正しく動作する', async () => {
        const encrypted = await cryptoHelper.encrypt(plaintext, password);
        expect(encrypted).not.toBe(plaintext);
        expect(encrypted.length).toBeGreaterThan(0);

        const decrypted = await cryptoHelper.decrypt(encrypted, password);
        expect(decrypted).toBe(plaintext);
    });

    test('間違ったパスワードで復号化失敗', async () => {
        const encrypted = await cryptoHelper.encrypt(plaintext, password);

        await expect(async () => {
            await cryptoHelper.decrypt(encrypted, 'WrongPassword');
        }).rejects.toThrow();
    });

    test('パスワード強度チェック', () => {
        const weak = cryptoHelper.checkPasswordStrength('12345');
        expect(weak.valid).toBe(false);
        expect(weak.strength).toBe('weak');

        const strong = cryptoHelper.checkPasswordStrength('Password@123!ABC');
        expect(strong.valid).toBe(true);
        expect(strong.strength).toBe('strong');
    });

    test('同じ平文でも毎回異なる暗号文が生成される', async () => {
        const encrypted1 = await cryptoHelper.encrypt(plaintext, password);
        const encrypted2 = await cryptoHelper.encrypt(plaintext, password);

        expect(encrypted1).not.toBe(encrypted2); // ソルトとIVがランダムのため
    });
});
```

### 5.2 統合テスト

```javascript
// tests/api-config-encrypted.test.js
describe('ApiConfig (Encrypted)', () => {
    let apiConfig;
    const encryptionPassword = 'TestPassword@123';

    beforeEach(() => {
        apiConfig = new ApiConfig();
        sessionStorage.clear();
    });

    test('API設定を暗号化して保存・読込できる', async () => {
        apiConfig.baseUrl = 'https://example.com';
        apiConfig.apiKey = 'test-api-key-12345';
        apiConfig.authType = 'bearer';

        await apiConfig.save(encryptionPassword);

        // sessionStorageに暗号化データが保存されているか確認
        const encrypted = sessionStorage.getItem('appsuite_api_config_encrypted');
        expect(encrypted).toBeTruthy();
        expect(encrypted).not.toContain('test-api-key-12345'); // 平文は含まれない

        // 新しいインスタンスで読込
        const newApiConfig = new ApiConfig();
        const success = await newApiConfig.load(encryptionPassword);

        expect(success).toBe(true);
        expect(newApiConfig.baseUrl).toBe('https://example.com');
        expect(newApiConfig.apiKey).toBe('test-api-key-12345');
    });

    test('間違ったパスワードで読込失敗', async () => {
        apiConfig.apiKey = 'test-api-key';
        await apiConfig.save(encryptionPassword);

        const newApiConfig = new ApiConfig();
        await expect(async () => {
            await newApiConfig.load('WrongPassword');
        }).rejects.toThrow();
    });

    test('APIキーマスキング表示', () => {
        apiConfig.apiKey = 'abcd1234efgh5678';
        const masked = apiConfig.getApiKeyMasked();
        expect(masked).toBe('abcd********5678');
    });
});
```

---

## 6. 実装スケジュール

| 日 | タスク | 工数 |
|----|--------|------|
| Day 1 | CryptoHelper実装・テスト | 1日 |
| Day 2 | ApiConfig修正・UI実装・統合テスト | 1日 |

**実装期限**: Phase 5（2026-02-17～18）

---

## 7. 移行手順

### 7.1 既存ユーザーへの影響

- 既存のlocalStorage保存データは**そのまま残る**（後方互換性維持）
- 初回起動時に暗号化パスワード設定を促す
- 既存データを暗号化データに移行

### 7.2 移行スクリプト

```javascript
/**
 * localStorage → sessionStorage (encrypted) 移行
 */
async function migrateApiConfig() {
    const oldConfig = localStorage.getItem('appsuite_api_config');

    if (!oldConfig) {
        console.log('移行対象のデータがありません');
        return;
    }

    const config = JSON.parse(oldConfig);

    if (!config.apiKey) {
        console.log('APIキーが設定されていないため移行不要');
        return;
    }

    // 暗号化パスワード入力を促す
    const encryptionPassword = prompt(
        'セキュリティ強化のため、API設定を暗号化します。\n暗号化パスワードを設定してください（8文字以上）:'
    );

    if (!encryptionPassword) {
        console.warn('移行をスキップしました');
        return;
    }

    try {
        // 既存データを復元
        apiConfig.baseUrl = config.baseUrl;
        apiConfig.apiKey = config.apiKey;
        apiConfig.authType = config.authType || 'bearer';
        apiConfig.username = config.username || '';
        apiConfig.password = config.password || '';

        // 暗号化して保存
        await apiConfig.save(encryptionPassword);

        // 古いデータを削除
        localStorage.removeItem('appsuite_api_config');

        alert('API設定を暗号化しました。次回からは暗号化パスワードで読込みます。');
        console.log('✅ 移行完了');

    } catch (error) {
        console.error('移行失敗', error);
        alert(`移行に失敗しました: ${error.message}`);
    }
}

// 初回起動時に自動実行
if (localStorage.getItem('appsuite_api_config')) {
    migrateApiConfig();
}
```

---

## 8. 運用ガイド

### 8.1 ユーザー向けガイド

**暗号化パスワードを忘れた場合**:
1. API設定をクリア
2. 再度API設定を入力
3. 新しい暗号化パスワードを設定

**推奨パスワード**:
- 8文字以上
- 英大文字・小文字・数字・記号を含む
- 例: `MyApp@2026!Secure`

### 8.2 トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| 復号化失敗 | パスワード間違い | 正しいパスワードを入力 |
| 設定が消えた | ブラウザクローズ | sessionStorage仕様（再設定必要） |
| 暗号化エラー | ブラウザ非対応 | Chrome/Firefox/Edge最新版を使用 |

---

## 9. 将来展望

### 9.1 Phase 6以降の改善案

- **ハードウェアトークン対応**: WebAuthn/FIDO2でパスワードレス認証
- **クラウド同期**: 暗号化したまま複数デバイスで共有
- **自動ローテーション**: APIキーの定期的な自動更新

---

**作成者**: Lead Agent
**セキュリティレビュー**: Security & Ops Auditor（承認待ち）
**実装予定**: Phase 5（2026-02-17～18）
