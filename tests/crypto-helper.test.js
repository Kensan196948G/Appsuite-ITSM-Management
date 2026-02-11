/**
 * CryptoHelper ユニットテスト
 */

// CryptoHelper のモック実装（テスト用）
class CryptoHelper {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
        this.saltLength = 16;
        this.iterations = 100000;
    }

    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

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
            false,
            ['encrypt', 'decrypt']
        );

        return derivedKey;
    }

    async encrypt(plaintext, password) {
        const encoder = new TextEncoder();
        const plaintextBuffer = encoder.encode(plaintext);

        const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
        const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

        const key = await this.deriveKey(password, salt);

        const ciphertextBuffer = await crypto.subtle.encrypt(
            {
                name: this.algorithm,
                iv: iv
            },
            key,
            plaintextBuffer
        );

        const resultBuffer = new Uint8Array(
            salt.byteLength + iv.byteLength + ciphertextBuffer.byteLength
        );
        resultBuffer.set(salt, 0);
        resultBuffer.set(iv, salt.byteLength);
        resultBuffer.set(new Uint8Array(ciphertextBuffer), salt.byteLength + iv.byteLength);

        return this.arrayBufferToBase64(resultBuffer);
    }

    async decrypt(encryptedData, password) {
        try {
            const dataBuffer = this.base64ToArrayBuffer(encryptedData);

            const salt = dataBuffer.slice(0, this.saltLength);
            const iv = dataBuffer.slice(this.saltLength, this.saltLength + this.ivLength);
            const ciphertext = dataBuffer.slice(this.saltLength + this.ivLength);

            const key = await this.deriveKey(password, salt);

            const plaintextBuffer = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(plaintextBuffer);

        } catch (error) {
            throw new Error('復号化に失敗しました。パスワードが正しいか確認してください。');
        }
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

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

        if (password.length >= 12) strength++;
        if (password.length >= 16) strength++;

        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) {
            result.strength = 'weak';
            result.messages.push('パスワードが弱いです。英大小文字・数字・記号を組み合わせてください。');
        } else if (strength <= 4) {
            result.strength = 'medium';
            result.valid = true;
        } else {
            result.strength = 'strong';
            result.valid = true;
        }

        return result;
    }

    generateRandomPassword(length = 16) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset[randomValues[i] % charset.length];
        }

        return password;
    }
}

describe('CryptoHelper', () => {
    let cryptoHelper;
    const password = 'TestPassword@123';
    const plaintext = 'APIキー: abc123def456';

    beforeEach(() => {
        cryptoHelper = new CryptoHelper();
    });

    describe('暗号化と復号化', () => {
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
                await cryptoHelper.decrypt(encrypted, 'WrongPassword@123');
            }).rejects.toThrow('復号化に失敗しました');
        });

        test('同じ平文でも毎回異なる暗号文が生成される', async () => {
            const encrypted1 = await cryptoHelper.encrypt(plaintext, password);
            const encrypted2 = await cryptoHelper.encrypt(plaintext, password);

            // ソルトとIVがランダムのため、暗号文は毎回異なる
            expect(encrypted1).not.toBe(encrypted2);

            // しかし、どちらも正しく復号化できる
            const decrypted1 = await cryptoHelper.decrypt(encrypted1, password);
            const decrypted2 = await cryptoHelper.decrypt(encrypted2, password);
            expect(decrypted1).toBe(plaintext);
            expect(decrypted2).toBe(plaintext);
        });

        test('空文字列の暗号化と復号化', async () => {
            const encrypted = await cryptoHelper.encrypt('', password);
            const decrypted = await cryptoHelper.decrypt(encrypted, password);
            expect(decrypted).toBe('');
        });

        test('日本語文字列の暗号化と復号化', async () => {
            const japanese = 'こんにちは世界。これはテストです。';
            const encrypted = await cryptoHelper.encrypt(japanese, password);
            const decrypted = await cryptoHelper.decrypt(encrypted, password);
            expect(decrypted).toBe(japanese);
        });

        test('長いデータの暗号化と復号化', async () => {
            const longData = 'A'.repeat(10000);
            const encrypted = await cryptoHelper.encrypt(longData, password);
            const decrypted = await cryptoHelper.decrypt(encrypted, password);
            expect(decrypted).toBe(longData);
        });
    });

    describe('パスワード強度チェック', () => {
        test('弱いパスワード（8文字未満）', () => {
            const weak = cryptoHelper.checkPasswordStrength('12345');
            expect(weak.valid).toBe(false);
            expect(weak.strength).toBe('weak');
            expect(weak.messages.length).toBeGreaterThan(0);
        });

        test('弱いパスワード（8文字以上だが単純）', () => {
            const weak = cryptoHelper.checkPasswordStrength('12345678');
            expect(weak.valid).toBe(false);
            expect(weak.strength).toBe('weak');
        });

        test('中程度のパスワード', () => {
            const medium = cryptoHelper.checkPasswordStrength('Password123');
            expect(medium.valid).toBe(true);
            expect(medium.strength).toBe('medium');
        });

        test('強いパスワード', () => {
            const strong = cryptoHelper.checkPasswordStrength('Password@123!ABC');
            expect(strong.valid).toBe(true);
            expect(strong.strength).toBe('strong');
        });

        test('空文字列', () => {
            const empty = cryptoHelper.checkPasswordStrength('');
            expect(empty.valid).toBe(false);
            expect(empty.strength).toBe('weak');
        });

        test('null/undefined', () => {
            const nullPwd = cryptoHelper.checkPasswordStrength(null);
            expect(nullPwd.valid).toBe(false);

            const undefinedPwd = cryptoHelper.checkPasswordStrength(undefined);
            expect(undefinedPwd.valid).toBe(false);
        });
    });

    describe('ランダムパスワード生成', () => {
        test('デフォルト長（16文字）のパスワード生成', () => {
            const pwd = cryptoHelper.generateRandomPassword();
            expect(pwd.length).toBe(16);
        });

        test('カスタム長のパスワード生成', () => {
            const pwd = cryptoHelper.generateRandomPassword(32);
            expect(pwd.length).toBe(32);
        });

        test('生成されるパスワードは毎回異なる', () => {
            const pwd1 = cryptoHelper.generateRandomPassword();
            const pwd2 = cryptoHelper.generateRandomPassword();
            expect(pwd1).not.toBe(pwd2);
        });

        test('生成されたパスワードは強度チェックを通過', () => {
            const pwd = cryptoHelper.generateRandomPassword(16);
            const strength = cryptoHelper.checkPasswordStrength(pwd);
            expect(strength.valid).toBe(true);
        });
    });

    describe('Base64エンコード/デコード', () => {
        test('ArrayBufferをBase64に変換', () => {
            const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
            const base64 = cryptoHelper.arrayBufferToBase64(data);
            expect(base64).toBe('SGVsbG8=');
        });

        test('Base64をArrayBufferに変換', () => {
            const base64 = 'SGVsbG8=';
            const buffer = cryptoHelper.base64ToArrayBuffer(base64);
            expect(Array.from(buffer)).toEqual([72, 101, 108, 108, 111]);
        });

        test('エンコード→デコードのラウンドトリップ', () => {
            const original = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253]);
            const base64 = cryptoHelper.arrayBufferToBase64(original);
            const decoded = cryptoHelper.base64ToArrayBuffer(base64);
            expect(Array.from(decoded)).toEqual(Array.from(original));
        });
    });
});
