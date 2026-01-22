/**
 * AppSuite 管理運用システム - ユーティリティ関数
 * Phase 3 Sprint 1: ユーティリティ関数整備
 */

/**
 * 日付フォーマットユーティリティ
 */
const DateUtils = {
    /**
     * 日付をフォーマット
     * @param {Date|string} date - 日付
     * @param {string} format - フォーマット（'yyyy-MM-dd', 'yyyy/MM/dd', etc.）
     * @returns {string} - フォーマットされた日付
     */
    format(date, format = 'yyyy-MM-dd') {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('yyyy', year)
            .replace('MM', month)
            .replace('dd', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    /**
     * 日時をフォーマット
     * @param {Date|string} date - 日付
     * @returns {string} - フォーマットされた日時
     */
    formatDateTime(date) {
        return this.format(date, 'yyyy-MM-dd HH:mm:ss');
    },

    /**
     * 相対時間を取得（〜前）
     * @param {Date|string} date - 日付
     * @returns {string} - 相対時間
     */
    relativeTime(date) {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const now = new Date();
        const diff = now - d;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);

        if (seconds < 60) return 'たった今';
        if (minutes < 60) return `${minutes}分前`;
        if (hours < 24) return `${hours}時間前`;
        if (days < 7) return `${days}日前`;
        if (weeks < 4) return `${weeks}週間前`;
        if (months < 12) return `${months}ヶ月前`;
        return this.format(d);
    },

    /**
     * 今日の日付を取得（yyyy-MM-dd形式）
     * @returns {string} - 今日の日付
     */
    today() {
        return this.format(new Date(), 'yyyy-MM-dd');
    },

    /**
     * 今の日時を取得（yyyy-MM-dd HH:mm:ss形式）
     * @returns {string} - 現在の日時
     */
    now() {
        return this.formatDateTime(new Date());
    }
};

/**
 * 数値フォーマットユーティリティ
 */
const NumberUtils = {
    /**
     * 数値をカンマ区切りでフォーマット
     * @param {number} num - 数値
     * @returns {string} - フォーマットされた数値
     */
    format(num) {
        if (num === null || num === undefined || isNaN(num)) return '';
        return Number(num).toLocaleString('ja-JP');
    },

    /**
     * パーセンテージをフォーマット
     * @param {number} value - 値
     * @param {number} total - 全体
     * @param {number} decimals - 小数点以下桁数
     * @returns {string} - パーセンテージ
     */
    percentage(value, total, decimals = 1) {
        if (!total) return '0%';
        const percent = (value / total) * 100;
        return `${percent.toFixed(decimals)}%`;
    },

    /**
     * バイトサイズをフォーマット
     * @param {number} bytes - バイト数
     * @returns {string} - フォーマットされたサイズ
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
};

/**
 * 文字列ユーティリティ
 */
const StringUtils = {
    /**
     * 文字列を切り詰め
     * @param {string} str - 文字列
     * @param {number} maxLength - 最大長
     * @param {string} suffix - 省略記号
     * @returns {string} - 切り詰められた文字列
     */
    truncate(str, maxLength = 50, suffix = '...') {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    },

    /**
     * キャメルケースに変換
     * @param {string} str - 文字列
     * @returns {string} - キャメルケース
     */
    toCamelCase(str) {
        return str
            .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
            .replace(/^(.)/, (_, c) => c.toLowerCase());
    },

    /**
     * スネークケースに変換
     * @param {string} str - 文字列
     * @returns {string} - スネークケース
     */
    toSnakeCase(str) {
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    },

    /**
     * 空白文字を正規化
     * @param {string} str - 文字列
     * @returns {string} - 正規化された文字列
     */
    normalizeWhitespace(str) {
        if (!str) return '';
        return str.replace(/\s+/g, ' ').trim();
    },

    /**
     * URLパラメータをパース
     * @param {string} queryString - クエリ文字列
     * @returns {Object} - パラメータオブジェクト
     */
    parseQueryString(queryString) {
        const params = {};
        const search = queryString.startsWith('?') ? queryString.slice(1) : queryString;
        search.split('&').forEach(pair => {
            const [key, value] = pair.split('=').map(decodeURIComponent);
            if (key) params[key] = value || '';
        });
        return params;
    },

    /**
     * オブジェクトをクエリ文字列に変換
     * @param {Object} params - パラメータオブジェクト
     * @returns {string} - クエリ文字列
     */
    toQueryString(params) {
        return Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
    }
};

/**
 * 配列ユーティリティ
 */
const ArrayUtils = {
    /**
     * 配列をグループ化
     * @param {Array} array - 配列
     * @param {string|Function} key - グループ化キー
     * @returns {Object} - グループ化されたオブジェクト
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            (result[groupKey] = result[groupKey] || []).push(item);
            return result;
        }, {});
    },

    /**
     * 配列をソート
     * @param {Array} array - 配列
     * @param {string} key - ソートキー
     * @param {string} direction - 方向（'asc' | 'desc'）
     * @returns {Array} - ソートされた配列
     */
    sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            // 日付の場合
            if (valA instanceof Date) valA = valA.getTime();
            if (valB instanceof Date) valB = valB.getTime();

            // 文字列の場合
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /**
     * 重複を除去
     * @param {Array} array - 配列
     * @param {string} key - キー（オブジェクト配列の場合）
     * @returns {Array} - 重複除去された配列
     */
    unique(array, key) {
        if (!key) return [...new Set(array)];
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    },

    /**
     * 配列をチャンクに分割
     * @param {Array} array - 配列
     * @param {number} size - チャンクサイズ
     * @returns {Array} - チャンク配列
     */
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};

/**
 * オブジェクトユーティリティ
 */
const ObjectUtils = {
    /**
     * ディープコピー
     * @param {any} obj - コピー対象
     * @returns {any} - コピー
     */
    deepCopy(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (Array.isArray(obj)) return obj.map(item => this.deepCopy(item));

        const copy = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                copy[key] = this.deepCopy(obj[key]);
            }
        }
        return copy;
    },

    /**
     * オブジェクトのマージ（ディープ）
     * @param {Object} target - ターゲット
     * @param {...Object} sources - ソース
     * @returns {Object} - マージされたオブジェクト
     */
    deepMerge(target, ...sources) {
        if (!sources.length) return target;

        const source = sources.shift();
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        return this.deepMerge(target, ...sources);
    },

    /**
     * オブジェクトかどうか
     * @param {any} item - チェック対象
     * @returns {boolean} - オブジェクトの場合true
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },

    /**
     * オブジェクトが空かどうか
     * @param {Object} obj - チェック対象
     * @returns {boolean} - 空の場合true
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * オブジェクトから指定キーを除外
     * @param {Object} obj - オブジェクト
     * @param {Array} keys - 除外するキー
     * @returns {Object} - 除外されたオブジェクト
     */
    omit(obj, keys) {
        const result = {};
        for (const key in obj) {
            if (!keys.includes(key)) {
                result[key] = obj[key];
            }
        }
        return result;
    },

    /**
     * オブジェクトから指定キーのみ取得
     * @param {Object} obj - オブジェクト
     * @param {Array} keys - 取得するキー
     * @returns {Object} - 取得されたオブジェクト
     */
    pick(obj, keys) {
        const result = {};
        for (const key of keys) {
            if (key in obj) {
                result[key] = obj[key];
            }
        }
        return result;
    }
};

/**
 * ストレージユーティリティ
 */
const StorageUtils = {
    /**
     * localStorageに保存
     * @param {string} key - キー
     * @param {any} value - 値
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage save error:', e);
        }
    },

    /**
     * localStorageから取得
     * @param {string} key - キー
     * @param {any} defaultValue - デフォルト値
     * @returns {any} - 値
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage read error:', e);
            return defaultValue;
        }
    },

    /**
     * localStorageから削除
     * @param {string} key - キー
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage remove error:', e);
        }
    },

    /**
     * localStorageをクリア（プレフィックス付き）
     * @param {string} prefix - プレフィックス
     */
    clearByPrefix(prefix) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
    },

    /**
     * 使用量を取得（概算）
     * @returns {Object} - 使用量情報
     */
    getUsage() {
        let total = 0;
        for (const key in localStorage) {
            if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
                total += localStorage[key].length * 2; // UTF-16
            }
        }
        return {
            used: total,
            usedFormatted: NumberUtils.formatBytes(total),
            max: 5 * 1024 * 1024, // 5MB想定
            percentage: (total / (5 * 1024 * 1024)) * 100
        };
    }
};

/**
 * デバウンス・スロットル
 */
const FunctionUtils = {
    /**
     * デバウンス
     * @param {Function} fn - 関数
     * @param {number} wait - 待機時間（ミリ秒）
     * @returns {Function} - デバウンスされた関数
     */
    debounce(fn, wait = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), wait);
        };
    },

    /**
     * スロットル
     * @param {Function} fn - 関数
     * @param {number} limit - 制限時間（ミリ秒）
     * @returns {Function} - スロットルされた関数
     */
    throttle(fn, limit = 300) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }
};

/**
 * ID生成ユーティリティ
 */
const IdUtils = {
    /**
     * UUIDを生成
     * @returns {string} - UUID
     */
    uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    /**
     * 連番IDを生成
     * @param {string} prefix - プレフィックス
     * @param {Array} existingItems - 既存アイテム
     * @param {number} padLength - パディング長
     * @returns {string} - 生成されたID
     */
    sequential(prefix, existingItems, padLength = 4) {
        const maxNum = existingItems.reduce((max, item) => {
            const match = item.id.match(new RegExp(`^${prefix}(\\d+)$`));
            if (match) {
                const num = parseInt(match[1], 10);
                return Math.max(max, num);
            }
            return max;
        }, 0);

        return prefix + String(maxNum + 1).padStart(padLength, '0');
    }
};

// グローバルにエクスポート
window.DateUtils = DateUtils;
window.NumberUtils = NumberUtils;
window.StringUtils = StringUtils;
window.ArrayUtils = ArrayUtils;
window.ObjectUtils = ObjectUtils;
window.StorageUtils = StorageUtils;
window.FunctionUtils = FunctionUtils;
window.IdUtils = IdUtils;
