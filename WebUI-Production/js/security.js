/**
 * AppSuite 管理運用システム - セキュリティユーティリティ
 * Phase 3 Sprint 1: セキュリティ強化
 */

const Security = {
    /**
     * HTMLエスケープ（XSS対策）
     * @param {string} str - エスケープする文字列
     * @returns {string} - エスケープされた文字列
     */
    escapeHtml(str) {
        if (str === null || str === undefined) {
            return '';
        }
        if (typeof str !== 'string') {
            str = String(str);
        }

        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;',
        };

        return str.replace(/[&<>"'`=/]/g, char => escapeMap[char]);
    },

    /**
     * HTMLアンエスケープ
     * @param {string} str - アンエスケープする文字列
     * @returns {string} - アンエスケープされた文字列
     */
    unescapeHtml(str) {
        if (!str) {
            return '';
        }

        const unescapeMap = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#039;': "'",
            '&#x2F;': '/',
            '&#x60;': '`',
            '&#x3D;': '=',
        };

        return str.replace(
            /&amp;|&lt;|&gt;|&quot;|&#039;|&#x2F;|&#x60;|&#x3D;/g,
            match => unescapeMap[match]
        );
    },

    /**
     * 安全なHTML生成（テンプレートリテラル用タグ関数）
     * @param {Array} strings - テンプレート文字列配列
     * @param {...any} values - 挿入値
     * @returns {string} - エスケープされたHTML
     */
    html(strings, ...values) {
        return strings.reduce((result, str, i) => {
            const value = values[i - 1];
            const escaped = this.escapeHtml(value);
            return result + escaped + str;
        });
    },

    /**
     * URLエンコード
     * @param {string} str - エンコードする文字列
     * @returns {string} - エンコードされた文字列
     */
    encodeUrl(str) {
        return encodeURIComponent(str);
    },

    /**
     * SQLインジェクション対策（クライアント側参考実装）
     * @param {string} str - サニタイズする文字列
     * @returns {string} - サニタイズされた文字列
     */
    sanitizeSql(str) {
        if (!str) {
            return '';
        }
        // シングルクォートをエスケープ
        return str.replace(/'/g, "''");
    },
};

/**
 * 入力バリデーションモジュール
 */
const Validator = {
    /**
     * 必須チェック
     * @param {any} value - チェックする値
     * @returns {boolean} - 値がある場合true
     */
    required(value) {
        if (value === null || value === undefined) {
            return false;
        }
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return true;
    },

    /**
     * 最小長チェック
     * @param {string} value - チェックする値
     * @param {number} min - 最小長
     * @returns {boolean} - 条件を満たす場合true
     */
    minLength(value, min) {
        if (!value) {
            return false;
        }
        return String(value).length >= min;
    },

    /**
     * 最大長チェック
     * @param {string} value - チェックする値
     * @param {number} max - 最大長
     * @returns {boolean} - 条件を満たす場合true
     */
    maxLength(value, max) {
        if (!value) {
            return true;
        }
        return String(value).length <= max;
    },

    /**
     * メールアドレス形式チェック
     * @param {string} email - チェックするメールアドレス
     * @returns {boolean} - 有効な形式の場合true
     */
    email(email) {
        if (!email) {
            return false;
        }
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    },

    /**
     * 電話番号形式チェック（日本）
     * @param {string} phone - チェックする電話番号
     * @returns {boolean} - 有効な形式の場合true
     */
    phone(phone) {
        if (!phone) {
            return false;
        }
        // ハイフンあり・なし両対応
        const pattern = /^0\d{1,4}-?\d{1,4}-?\d{4}$/;
        return pattern.test(phone.replace(/\s/g, ''));
    },

    /**
     * 数値チェック
     * @param {any} value - チェックする値
     * @returns {boolean} - 数値の場合true
     */
    numeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * 整数チェック
     * @param {any} value - チェックする値
     * @returns {boolean} - 整数の場合true
     */
    integer(value) {
        return Number.isInteger(Number(value));
    },

    /**
     * 範囲チェック
     * @param {number} value - チェックする値
     * @param {number} min - 最小値
     * @param {number} max - 最大値
     * @returns {boolean} - 範囲内の場合true
     */
    range(value, min, max) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
    },

    /**
     * 正規表現チェック
     * @param {string} value - チェックする値
     * @param {RegExp} pattern - 正規表現パターン
     * @returns {boolean} - パターンにマッチする場合true
     */
    pattern(value, pattern) {
        if (!value) {
            return false;
        }
        return pattern.test(value);
    },

    /**
     * 日付形式チェック（YYYY-MM-DD）
     * @param {string} date - チェックする日付文字列
     * @returns {boolean} - 有効な日付の場合true
     */
    date(date) {
        if (!date) {
            return false;
        }
        const pattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!pattern.test(date)) {
            return false;
        }

        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    },

    /**
     * 日時形式チェック（YYYY-MM-DD HH:mm）
     * @param {string} datetime - チェックする日時文字列
     * @returns {boolean} - 有効な日時の場合true
     */
    datetime(datetime) {
        if (!datetime) {
            return false;
        }
        const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
        if (!pattern.test(datetime)) {
            return false;
        }

        const d = new Date(datetime.replace(' ', 'T'));
        return d instanceof Date && !isNaN(d);
    },

    /**
     * URL形式チェック
     * @param {string} url - チェックするURL
     * @returns {boolean} - 有効なURLの場合true
     */
    url(url) {
        if (!url) {
            return false;
        }
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * 英数字のみチェック
     * @param {string} value - チェックする値
     * @returns {boolean} - 英数字のみの場合true
     */
    alphanumeric(value) {
        if (!value) {
            return false;
        }
        return /^[a-zA-Z0-9]+$/.test(value);
    },

    /**
     * 日本語を含むかチェック
     * @param {string} value - チェックする値
     * @returns {boolean} - 日本語を含む場合true
     */
    containsJapanese(value) {
        if (!value) {
            return false;
        }
        return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(value);
    },

    /**
     * 禁止文字チェック
     * @param {string} value - チェックする値
     * @param {string} chars - 禁止文字（文字列）
     * @returns {boolean} - 禁止文字を含まない場合true
     */
    noForbiddenChars(value, chars = '<>"\'/\\') {
        if (!value) {
            return true;
        }
        const pattern = new RegExp(`[${chars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
        return !pattern.test(value);
    },
};

/**
 * フォームバリデーションヘルパー
 */
const FormValidator = {
    /**
     * フォームバリデーション実行
     * @param {HTMLFormElement} form - フォーム要素
     * @param {Object} rules - バリデーションルール
     * @returns {Object} - バリデーション結果
     */
    validate(form, rules) {
        const errors = {};
        let isValid = true;

        for (const [fieldName, fieldRules] of Object.entries(rules)) {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (!input) {
                continue;
            }

            const value = input.value;
            const fieldErrors = [];

            for (const rule of fieldRules) {
                const { type, message, params } = rule;

                let valid = true;
                switch (type) {
                    case 'required':
                        valid = Validator.required(value);
                        break;
                    case 'minLength':
                        valid = Validator.minLength(value, params.min);
                        break;
                    case 'maxLength':
                        valid = Validator.maxLength(value, params.max);
                        break;
                    case 'email':
                        valid = !value || Validator.email(value);
                        break;
                    case 'pattern':
                        valid = !value || Validator.pattern(value, params.pattern);
                        break;
                    case 'range':
                        valid = !value || Validator.range(value, params.min, params.max);
                        break;
                    case 'custom':
                        valid = params.fn(value, form);
                        break;
                }

                if (!valid) {
                    fieldErrors.push(message);
                    isValid = false;
                }
            }

            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
            }
        }

        return { isValid, errors };
    },

    /**
     * エラー表示
     * @param {HTMLFormElement} form - フォーム要素
     * @param {Object} errors - エラーオブジェクト
     */
    showErrors(form, errors) {
        // 既存のエラー表示をクリア
        form.querySelectorAll('.field-error').forEach(el => el.remove());
        form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

        for (const [fieldName, messages] of Object.entries(errors)) {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (!input) {
                continue;
            }

            input.classList.add('input-error');

            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = messages[0]; // 最初のエラーのみ表示
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
    },

    /**
     * エラークリア
     * @param {HTMLFormElement} form - フォーム要素
     */
    clearErrors(form) {
        form.querySelectorAll('.field-error').forEach(el => el.remove());
        form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    },
};

/**
 * CSRFトークン管理（将来のサーバー連携用）
 */
const CsrfProtection = {
    tokenKey: 'csrf_token',

    /**
     * トークン生成
     * @returns {string} - CSRFトークン
     */
    generateToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        sessionStorage.setItem(this.tokenKey, token);
        return token;
    },

    /**
     * トークン取得
     * @returns {string|null} - 保存されているトークン
     */
    getToken() {
        return sessionStorage.getItem(this.tokenKey);
    },

    /**
     * トークン検証
     * @param {string} token - 検証するトークン
     * @returns {boolean} - 有効な場合true
     */
    verifyToken(token) {
        const storedToken = this.getToken();
        return storedToken && storedToken === token;
    },

    /**
     * フォームにトークンを追加
     * @param {HTMLFormElement} form - フォーム要素
     */
    addToForm(form) {
        let input = form.querySelector('input[name="csrf_token"]');
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'csrf_token';
            form.appendChild(input);
        }
        input.value = this.getToken() || this.generateToken();
    },
};

/**
 * レート制限（ブルートフォース対策）
 */
const RateLimiter = {
    limits: new Map(),

    /**
     * レート制限チェック
     * @param {string} key - 識別キー
     * @param {number} maxRequests - 最大リクエスト数
     * @param {number} windowMs - 時間窓（ミリ秒）
     * @returns {Object} - 制限情報
     */
    check(key, maxRequests = 10, windowMs = 60000) {
        const now = Date.now();
        let record = this.limits.get(key);

        if (!record) {
            record = { requests: [], blocked: false, blockUntil: 0 };
            this.limits.set(key, record);
        }

        // ブロック中かチェック
        if (record.blocked && now < record.blockUntil) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: record.blockUntil,
            };
        }

        // ブロック解除
        if (record.blocked && now >= record.blockUntil) {
            record.blocked = false;
            record.requests = [];
        }

        // 古いリクエストを削除
        record.requests = record.requests.filter(time => now - time < windowMs);

        // リクエスト追加
        record.requests.push(now);

        // 制限超過チェック
        if (record.requests.length > maxRequests) {
            record.blocked = true;
            record.blockUntil = now + windowMs;
            return {
                allowed: false,
                remaining: 0,
                resetAt: record.blockUntil,
            };
        }

        return {
            allowed: true,
            remaining: maxRequests - record.requests.length,
            resetAt: now + windowMs,
        };
    },

    /**
     * リセット
     * @param {string} key - 識別キー
     */
    reset(key) {
        this.limits.delete(key);
    },
};

// グローバル関数としてエクスポート（既存コードとの互換性）
function escapeHtml(str) {
    return Security.escapeHtml(str);
}

function sanitizeInput(str) {
    return Security.escapeHtml(str);
}

// Node.js (Jest) 環境向けエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Security,
        Validator,
        FormValidator,
        CsrfProtection,
        RateLimiter,
        escapeHtml,
        sanitizeInput,
    };
}
