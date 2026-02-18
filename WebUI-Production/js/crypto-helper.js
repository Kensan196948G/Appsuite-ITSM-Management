/**
 * CryptoHelper - Web Crypto API ラッパー
 *
 * APIキー等の機密情報を暗号化・復号化するためのユーティリティクラス
 * AES-GCM-256 + PBKDF2 による安全な暗号化を提供
 *
 * @version 1.0.0
 * @license MIT
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
                hash: 'SHA-256',
            },
            baseKey,
            {
                name: this.algorithm,
                length: this.keyLength,
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
                iv: iv,
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
        try {
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
                    iv: iv,
                },
                key,
                ciphertext
            );

            // テキストに変換
            const decoder = new TextDecoder();
            return decoder.decode(plaintextBuffer);
        } catch (error) {
            console.error('復号化エラー:', error);
            throw new Error('復号化に失敗しました。パスワードが正しいか確認してください。');
        }
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
            messages: [],
        };

        if (!password || password.length < 8) {
            result.messages.push('パスワードは8文字以上にしてください');
            return result;
        }

        let strength = 0;

        // 長さチェック
        if (password.length >= 12) {
            strength++;
        }
        if (password.length >= 16) {
            strength++;
        }

        // 複雑性チェック
        if (/[a-z]/.test(password)) {
            strength++;
        } // 小文字
        if (/[A-Z]/.test(password)) {
            strength++;
        } // 大文字
        if (/[0-9]/.test(password)) {
            strength++;
        } // 数字
        if (/[^a-zA-Z0-9]/.test(password)) {
            strength++;
        } // 特殊文字

        if (strength <= 2) {
            result.strength = 'weak';
            result.messages.push(
                'パスワードが弱いです。英大小文字・数字・記号を組み合わせてください。'
            );
        } else if (strength <= 4) {
            result.strength = 'medium';
            result.valid = true;
        } else {
            result.strength = 'strong';
            result.valid = true;
        }

        return result;
    }

    /**
     * ランダムなパスワードを生成
     * @param {number} length - パスワード長（デフォルト: 16）
     * @returns {string}
     */
    generateRandomPassword(length = 16) {
        const charset =
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset[randomValues[i] % charset.length];
        }

        return password;
    }
}

// シングルトンインスタンス
const cryptoHelper = new CryptoHelper();

// Node.js (Jest) 環境向けエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CryptoHelper, cryptoHelper };
}
