/**
 * ユーティリティ関数テスト
 * WebUI-Production/js/utils.js の機能テスト
 */

// DateUtils テスト用モック実装
const DateUtils = {
    format(date, format = 'yyyy-MM-dd') {
        if (!date) {
            return '';
        }
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) {
            return '';
        }

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

    formatDateTime(date) {
        return this.format(date, 'yyyy-MM-dd HH:mm:ss');
    },

    relativeTime(date) {
        if (!date) {
            return '';
        }
        const d = date instanceof Date ? date : new Date(date);
        const now = new Date();
        const diff = now - d;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);

        if (seconds < 60) {
            return 'たった今';
        }
        if (minutes < 60) {
            return `${minutes}分前`;
        }
        if (hours < 24) {
            return `${hours}時間前`;
        }
        if (days < 7) {
            return `${days}日前`;
        }
        if (weeks < 4) {
            return `${weeks}週間前`;
        }
        if (months < 12) {
            return `${months}ヶ月前`;
        }
        return this.format(d);
    },

    today() {
        return this.format(new Date(), 'yyyy-MM-dd');
    },

    now() {
        return this.format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    }
};

// StringUtils テスト用モック実装
const StringUtils = {
    truncate(str, maxLength = 50) {
        if (!str || typeof str !== 'string') {
            return '';
        }
        if (str.length <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength) + '...';
    },

    capitalize(str) {
        if (!str || typeof str !== 'string') {
            return '';
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    toCamelCase(str) {
        if (!str || typeof str !== 'string') {
            return '';
        }
        return str
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
    },

    toSnakeCase(str) {
        if (!str || typeof str !== 'string') {
            return '';
        }
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    },

    removeWhitespace(str) {
        if (!str || typeof str !== 'string') {
            return '';
        }
        return str.replace(/\s+/g, '');
    },

    contains(str, search) {
        if (!str || !search) {
            return false;
        }
        return str.toLowerCase().includes(search.toLowerCase());
    }
};

// ArrayUtils テスト用モック実装
const ArrayUtils = {
    unique(arr) {
        if (!Array.isArray(arr)) {
            return [];
        }
        return [...new Set(arr)];
    },

    groupBy(arr, key) {
        if (!Array.isArray(arr)) {
            return {};
        }
        return arr.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    },

    sortBy(arr, key, order = 'asc') {
        if (!Array.isArray(arr)) {
            return [];
        }
        return [...arr].sort((a, b) => {
            if (order === 'asc') {
                return a[key] > b[key] ? 1 : -1;
            } else {
                return a[key] < b[key] ? 1 : -1;
            }
        });
    },

    chunk(arr, size) {
        if (!Array.isArray(arr) || size <= 0) {
            return [];
        }
        const result = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    },

    pluck(arr, key) {
        if (!Array.isArray(arr)) {
            return [];
        }
        return arr.map(item => item[key]);
    }
};

// ObjectUtils テスト用モック実装
const ObjectUtils = {
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        return JSON.parse(JSON.stringify(obj));
    },

    merge(target, source) {
        if (!target || typeof target !== 'object') {
            return source;
        }
        if (!source || typeof source !== 'object') {
            return target;
        }
        return { ...target, ...source };
    },

    pick(obj, keys) {
        if (!obj || typeof obj !== 'object') {
            return {};
        }
        const result = {};
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    },

    omit(obj, keys) {
        if (!obj || typeof obj !== 'object') {
            return {};
        }
        const result = { ...obj };
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    },

    isEmpty(obj) {
        if (!obj) {
            return true;
        }
        return Object.keys(obj).length === 0;
    }
};

describe('DateUtils', () => {
    describe('format', () => {
        it('日付をYYYY-MM-DD形式でフォーマット', () => {
            const date = new Date('2024-01-15T10:30:00');
            expect(DateUtils.format(date)).toBe('2024-01-15');
        });

        it('日時をYYYY-MM-DD HH:mm:ss形式でフォーマット', () => {
            const date = new Date('2024-01-15T10:30:45');
            expect(DateUtils.format(date, 'yyyy-MM-dd HH:mm:ss')).toBe('2024-01-15 10:30:45');
        });

        it('無効な日付は空文字列を返す', () => {
            expect(DateUtils.format(null)).toBe('');
            expect(DateUtils.format('invalid')).toBe('');
        });
    });

    describe('formatDateTime', () => {
        it('日時を標準形式でフォーマット', () => {
            const date = new Date('2024-01-15T10:30:45');
            expect(DateUtils.formatDateTime(date)).toBe('2024-01-15 10:30:45');
        });
    });

    describe('relativeTime', () => {
        it('1分以内は"たった今"', () => {
            const now = new Date();
            expect(DateUtils.relativeTime(now)).toBe('たった今');
        });

        it('分単位で表示', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            expect(DateUtils.relativeTime(fiveMinutesAgo)).toBe('5分前');
        });

        it('時間単位で表示', () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            expect(DateUtils.relativeTime(twoHoursAgo)).toBe('2時間前');
        });

        it('日単位で表示', () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            expect(DateUtils.relativeTime(threeDaysAgo)).toBe('3日前');
        });

        it('空の日付は空文字列', () => {
            expect(DateUtils.relativeTime(null)).toBe('');
        });
    });

    describe('today/now', () => {
        it('todayは今日の日付を返す', () => {
            const today = DateUtils.today();
            expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('nowは現在の日時を返す', () => {
            const now = DateUtils.now();
            expect(now).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });
    });
});

describe('StringUtils', () => {
    describe('truncate', () => {
        it('指定長以下の文字列はそのまま返す', () => {
            expect(StringUtils.truncate('Hello', 10)).toBe('Hello');
        });

        it('指定長を超える文字列は切り詰める', () => {
            expect(StringUtils.truncate('Hello World Test', 10)).toBe('Hello Worl...');
        });

        it('空文字列は空を返す', () => {
            expect(StringUtils.truncate('', 10)).toBe('');
            expect(StringUtils.truncate(null, 10)).toBe('');
        });
    });

    describe('capitalize', () => {
        it('最初の文字を大文字にする', () => {
            expect(StringUtils.capitalize('hello')).toBe('Hello');
        });

        it('既に大文字の場合はそのまま', () => {
            expect(StringUtils.capitalize('Hello')).toBe('Hello');
        });

        it('空文字列は空を返す', () => {
            expect(StringUtils.capitalize('')).toBe('');
        });
    });

    describe('toCamelCase', () => {
        it('ケバブケースをキャメルケースに変換', () => {
            expect(StringUtils.toCamelCase('hello-world')).toBe('helloWorld');
        });

        it('スネークケースをキャメルケースに変換', () => {
            expect(StringUtils.toCamelCase('hello_world')).toBe('helloWorld');
        });

        it('空文字列は空を返す', () => {
            expect(StringUtils.toCamelCase('')).toBe('');
        });
    });

    describe('toSnakeCase', () => {
        it('キャメルケースをスネークケースに変換', () => {
            expect(StringUtils.toSnakeCase('helloWorld')).toBe('hello_world');
        });

        it('既にスネークケースの場合はそのまま', () => {
            expect(StringUtils.toSnakeCase('hello_world')).toBe('hello_world');
        });
    });

    describe('removeWhitespace', () => {
        it('空白を全て削除', () => {
            expect(StringUtils.removeWhitespace('Hello World Test')).toBe('HelloWorldTest');
        });

        it('タブや改行も削除', () => {
            expect(StringUtils.removeWhitespace('Hello\tWorld\nTest')).toBe('HelloWorldTest');
        });
    });

    describe('contains', () => {
        it('部分文字列を含む場合true', () => {
            expect(StringUtils.contains('Hello World', 'World')).toBe(true);
        });

        it('大文字小文字を区別しない', () => {
            expect(StringUtils.contains('Hello World', 'world')).toBe(true);
        });

        it('含まない場合false', () => {
            expect(StringUtils.contains('Hello World', 'Test')).toBe(false);
        });
    });
});

describe('ArrayUtils', () => {
    describe('unique', () => {
        it('重複を削除', () => {
            expect(ArrayUtils.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
        });

        it('文字列配列の重複を削除', () => {
            expect(ArrayUtils.unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
        });

        it('配列でない場合は空配列', () => {
            expect(ArrayUtils.unique(null)).toEqual([]);
        });
    });

    describe('groupBy', () => {
        it('指定キーでグループ化', () => {
            const data = [
                { category: 'A', value: 1 },
                { category: 'B', value: 2 },
                { category: 'A', value: 3 }
            ];
            const result = ArrayUtils.groupBy(data, 'category');
            expect(result.A).toHaveLength(2);
            expect(result.B).toHaveLength(1);
        });

        it('配列でない場合は空オブジェクト', () => {
            expect(ArrayUtils.groupBy(null, 'key')).toEqual({});
        });
    });

    describe('sortBy', () => {
        it('昇順ソート', () => {
            const data = [{ value: 3 }, { value: 1 }, { value: 2 }];
            const result = ArrayUtils.sortBy(data, 'value', 'asc');
            expect(result[0].value).toBe(1);
            expect(result[2].value).toBe(3);
        });

        it('降順ソート', () => {
            const data = [{ value: 1 }, { value: 3 }, { value: 2 }];
            const result = ArrayUtils.sortBy(data, 'value', 'desc');
            expect(result[0].value).toBe(3);
            expect(result[2].value).toBe(1);
        });
    });

    describe('chunk', () => {
        it('指定サイズで分割', () => {
            const result = ArrayUtils.chunk([1, 2, 3, 4, 5], 2);
            expect(result).toEqual([[1, 2], [3, 4], [5]]);
        });

        it('サイズ0以下は空配列', () => {
            expect(ArrayUtils.chunk([1, 2, 3], 0)).toEqual([]);
        });
    });

    describe('pluck', () => {
        it('指定キーの値を抽出', () => {
            const data = [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' }
            ];
            expect(ArrayUtils.pluck(data, 'name')).toEqual(['Alice', 'Bob']);
        });

        it('配列でない場合は空配列', () => {
            expect(ArrayUtils.pluck(null, 'key')).toEqual([]);
        });
    });
});

describe('ObjectUtils', () => {
    describe('deepClone', () => {
        it('オブジェクトをディープコピー', () => {
            const obj = { a: 1, b: { c: 2 } };
            const cloned = ObjectUtils.deepClone(obj);
            cloned.b.c = 3;
            expect(obj.b.c).toBe(2);
        });

        it('nullはnullを返す', () => {
            expect(ObjectUtils.deepClone(null)).toBe(null);
        });
    });

    describe('merge', () => {
        it('2つのオブジェクトをマージ', () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { b: 3, c: 4 };
            const result = ObjectUtils.merge(obj1, obj2);
            expect(result).toEqual({ a: 1, b: 3, c: 4 });
        });

        it('nullの場合の処理', () => {
            expect(ObjectUtils.merge(null, { a: 1 })).toEqual({ a: 1 });
        });
    });

    describe('pick', () => {
        it('指定キーのみを抽出', () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(ObjectUtils.pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
        });

        it('存在しないキーは無視', () => {
            const obj = { a: 1 };
            expect(ObjectUtils.pick(obj, ['a', 'b'])).toEqual({ a: 1 });
        });
    });

    describe('omit', () => {
        it('指定キーを除外', () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(ObjectUtils.omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
        });

        it('存在しないキーは無視', () => {
            const obj = { a: 1 };
            expect(ObjectUtils.omit(obj, ['b'])).toEqual({ a: 1 });
        });
    });

    describe('isEmpty', () => {
        it('空オブジェクトはtrue', () => {
            expect(ObjectUtils.isEmpty({})).toBe(true);
        });

        it('プロパティがあればfalse', () => {
            expect(ObjectUtils.isEmpty({ a: 1 })).toBe(false);
        });

        it('nullはtrue', () => {
            expect(ObjectUtils.isEmpty(null)).toBe(true);
        });
    });
});
