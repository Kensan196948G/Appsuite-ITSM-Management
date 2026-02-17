/**
 * セキュリティユーティリティのテスト
 * WebUI-Production/js/security.js
 */

// security.jsから実際のソースコードをインポート（カバレッジ計測対象）
const { Security, Validator, CsrfProtection, RateLimiter } = require('../WebUI-Production/js/security.js');

// ===================
// テストスイート
// ===================

describe('Security Module', () => {
    describe('escapeHtml', () => {
        test('null/undefined を空文字列に変換', () => {
            expect(Security.escapeHtml(null)).toBe('');
            expect(Security.escapeHtml(undefined)).toBe('');
        });

        test('数値を文字列に変換', () => {
            expect(Security.escapeHtml(123)).toBe('123');
            expect(Security.escapeHtml(0)).toBe('0');
        });

        test('HTMLタグをエスケープ', () => {
            expect(Security.escapeHtml('<script>alert("XSS")</script>')).toBe(
                '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
            );
        });

        test('シングルクォートをエスケープ', () => {
            expect(Security.escapeHtml("It's a test")).toBe("It&#039;s a test");
        });

        test('アンパサンドをエスケープ', () => {
            expect(Security.escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });

        test('イコールをエスケープ', () => {
            expect(Security.escapeHtml('a=b')).toBe('a&#x3D;b');
        });

        test('バッククォートをエスケープ', () => {
            expect(Security.escapeHtml('`template`')).toBe('&#x60;template&#x60;');
        });

        test('通常の文字列は変更しない', () => {
            expect(Security.escapeHtml('Hello World')).toBe('Hello World');
            expect(Security.escapeHtml('日本語テスト')).toBe('日本語テスト');
        });

        test('空文字列は変更しない', () => {
            expect(Security.escapeHtml('')).toBe('');
        });
    });

    describe('unescapeHtml', () => {
        test('エスケープされたHTMLを復元', () => {
            expect(Security.unescapeHtml('&lt;div&gt;')).toBe('<div>');
            expect(Security.unescapeHtml('&quot;text&quot;')).toBe('"text"');
        });

        test('null/undefined を空文字列に変換', () => {
            expect(Security.unescapeHtml(null)).toBe('');
            expect(Security.unescapeHtml(undefined)).toBe('');
            expect(Security.unescapeHtml('')).toBe('');
        });

        test('escapeHtml と unescapeHtml は逆変換', () => {
            const original = '<script>alert("test")</script>';
            const escaped = Security.escapeHtml(original);
            const unescaped = Security.unescapeHtml(escaped);
            expect(unescaped).toBe(original);
        });
    });
});

describe('Validator Module', () => {
    describe('required', () => {
        test('空でない文字列はtrue', () => {
            expect(Validator.required('test')).toBe(true);
            expect(Validator.required('  text  ')).toBe(true);
        });

        test('空文字列/空白のみはfalse', () => {
            expect(Validator.required('')).toBe(false);
            expect(Validator.required('   ')).toBe(false);
        });

        test('null/undefined はfalse', () => {
            expect(Validator.required(null)).toBe(false);
            expect(Validator.required(undefined)).toBe(false);
        });

        test('配列: 空でなければtrue', () => {
            expect(Validator.required([1, 2, 3])).toBe(true);
            expect(Validator.required([])).toBe(false);
        });

        test('数値は常にtrue', () => {
            expect(Validator.required(0)).toBe(true);
            expect(Validator.required(123)).toBe(true);
        });
    });

    describe('minLength', () => {
        test('最小長以上ならtrue', () => {
            expect(Validator.minLength('hello', 3)).toBe(true);
            expect(Validator.minLength('hello', 5)).toBe(true);
        });

        test('最小長未満ならfalse', () => {
            expect(Validator.minLength('hi', 3)).toBe(false);
        });

        test('空/nullはfalse', () => {
            expect(Validator.minLength('', 1)).toBe(false);
            expect(Validator.minLength(null, 1)).toBe(false);
        });
    });

    describe('maxLength', () => {
        test('最大長以下ならtrue', () => {
            expect(Validator.maxLength('hello', 10)).toBe(true);
            expect(Validator.maxLength('hello', 5)).toBe(true);
        });

        test('最大長超過ならfalse', () => {
            expect(Validator.maxLength('hello world', 5)).toBe(false);
        });

        test('空/nullはtrue', () => {
            expect(Validator.maxLength('', 5)).toBe(true);
            expect(Validator.maxLength(null, 5)).toBe(true);
        });
    });

    describe('email', () => {
        test('有効なメールアドレス', () => {
            expect(Validator.email('test@example.com')).toBe(true);
            expect(Validator.email('user.name@domain.co.jp')).toBe(true);
        });

        test('無効なメールアドレス', () => {
            expect(Validator.email('invalid')).toBe(false);
            expect(Validator.email('invalid@')).toBe(false);
            expect(Validator.email('@domain.com')).toBe(false);
            expect(Validator.email('test@domain')).toBe(false);
        });

        test('空/nullはfalse', () => {
            expect(Validator.email('')).toBe(false);
            expect(Validator.email(null)).toBe(false);
        });
    });

    describe('phone', () => {
        test('有効な日本の電話番号', () => {
            expect(Validator.phone('03-1234-5678')).toBe(true);
            expect(Validator.phone('0312345678')).toBe(true);
            expect(Validator.phone('090-1234-5678')).toBe(true);
            expect(Validator.phone('09012345678')).toBe(true);
        });

        test('無効な電話番号', () => {
            expect(Validator.phone('123-456-7890')).toBe(false);
            expect(Validator.phone('abcdefghij')).toBe(false);
        });
    });

    describe('numeric', () => {
        test('数値はtrue', () => {
            expect(Validator.numeric(123)).toBe(true);
            expect(Validator.numeric('456')).toBe(true);
            expect(Validator.numeric(3.14)).toBe(true);
            expect(Validator.numeric('3.14')).toBe(true);
        });

        test('非数値はfalse', () => {
            expect(Validator.numeric('abc')).toBe(false);
            expect(Validator.numeric(NaN)).toBe(false);
            expect(Validator.numeric(Infinity)).toBe(false);
        });
    });

    describe('integer', () => {
        test('整数はtrue', () => {
            expect(Validator.integer(123)).toBe(true);
            expect(Validator.integer('456')).toBe(true);
            expect(Validator.integer(0)).toBe(true);
            expect(Validator.integer(-10)).toBe(true);
        });

        test('小数はfalse', () => {
            expect(Validator.integer(3.14)).toBe(false);
            expect(Validator.integer('3.14')).toBe(false);
        });
    });

    describe('range', () => {
        test('範囲内はtrue', () => {
            expect(Validator.range(5, 1, 10)).toBe(true);
            expect(Validator.range(1, 1, 10)).toBe(true);
            expect(Validator.range(10, 1, 10)).toBe(true);
        });

        test('範囲外はfalse', () => {
            expect(Validator.range(0, 1, 10)).toBe(false);
            expect(Validator.range(11, 1, 10)).toBe(false);
        });
    });

    describe('date', () => {
        test('有効な日付形式（YYYY-MM-DD）', () => {
            expect(Validator.date('2024-01-15')).toBe(true);
            expect(Validator.date('2024-12-31')).toBe(true);
        });

        test('無効な日付形式', () => {
            expect(Validator.date('2024/01/15')).toBe(false);
            expect(Validator.date('15-01-2024')).toBe(false);
            expect(Validator.date('invalid')).toBe(false);
        });

        test('空/nullはfalse', () => {
            expect(Validator.date('')).toBe(false);
            expect(Validator.date(null)).toBe(false);
        });
    });

    describe('url', () => {
        test('有効なURL', () => {
            expect(Validator.url('https://example.com')).toBe(true);
            expect(Validator.url('http://localhost:3000')).toBe(true);
            expect(Validator.url('https://example.com/path?query=1')).toBe(true);
        });

        test('無効なURL', () => {
            expect(Validator.url('invalid')).toBe(false);
            expect(Validator.url('example.com')).toBe(false);
        });
    });

    describe('alphanumeric', () => {
        test('英数字のみはtrue', () => {
            expect(Validator.alphanumeric('abc123')).toBe(true);
            expect(Validator.alphanumeric('ABC')).toBe(true);
            expect(Validator.alphanumeric('123')).toBe(true);
        });

        test('記号/スペース含むとfalse', () => {
            expect(Validator.alphanumeric('abc-123')).toBe(false);
            expect(Validator.alphanumeric('abc 123')).toBe(false);
            expect(Validator.alphanumeric('日本語')).toBe(false);
        });
    });

    describe('containsJapanese', () => {
        test('日本語を含むとtrue', () => {
            expect(Validator.containsJapanese('こんにちは')).toBe(true);
            expect(Validator.containsJapanese('カタカナ')).toBe(true);
            expect(Validator.containsJapanese('漢字')).toBe(true);
            expect(Validator.containsJapanese('Hello日本')).toBe(true);
        });

        test('日本語を含まないとfalse', () => {
            expect(Validator.containsJapanese('Hello')).toBe(false);
            expect(Validator.containsJapanese('123')).toBe(false);
        });
    });

    describe('noForbiddenChars', () => {
        test('禁止文字を含まないとtrue', () => {
            expect(Validator.noForbiddenChars('Hello World')).toBe(true);
            expect(Validator.noForbiddenChars('日本語OK')).toBe(true);
        });

        test('禁止文字を含むとfalse', () => {
            expect(Validator.noForbiddenChars('<script>')).toBe(false);
            expect(Validator.noForbiddenChars('path/to/file')).toBe(false);
            expect(Validator.noForbiddenChars("It's"+ '"test"')).toBe(false);
        });
    });
});

describe('CsrfProtection Module', () => {
    test('トークンの生成と取得', () => {
        const token = CsrfProtection.generateToken();
        expect(token).toBeDefined();
        expect(token.length).toBe(64); // 32バイト = 64文字の16進数
        expect(CsrfProtection.getToken()).toBe(token);
    });

    test('トークンの検証', () => {
        const token = CsrfProtection.generateToken();
        expect(CsrfProtection.verifyToken(token)).toBe(true);
        expect(CsrfProtection.verifyToken('invalid_token')).toBe(false);
    });

    test('トークンがない場合の検証', () => {
        sessionStorage.clear();
        // verifyTokenはstoredTokenがnullの場合falsyを返す
        expect(CsrfProtection.verifyToken('any_token')).toBeFalsy();
    });
});

describe('RateLimiter Module', () => {
    beforeEach(() => {
        RateLimiter.limits.clear();
    });

    test('制限内のリクエストは許可', () => {
        const result = RateLimiter.check('test-key', 3, 60000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
    });

    test('制限超過でブロック', () => {
        // 4回リクエスト（制限は3回）
        RateLimiter.check('test-key', 3, 60000);
        RateLimiter.check('test-key', 3, 60000);
        RateLimiter.check('test-key', 3, 60000);
        const result = RateLimiter.check('test-key', 3, 60000);

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    test('リセットで制限解除', () => {
        // 制限超過させる
        for (let i = 0; i < 5; i++) {
            RateLimiter.check('reset-test', 3, 60000);
        }

        // リセット
        RateLimiter.reset('reset-test');

        // 再度リクエスト可能
        const result = RateLimiter.check('reset-test', 3, 60000);
        expect(result.allowed).toBe(true);
    });

    test('異なるキーは独立して管理', () => {
        // key1を制限超過させる
        for (let i = 0; i < 5; i++) {
            RateLimiter.check('key1', 3, 60000);
        }

        // key2は影響を受けない
        const result = RateLimiter.check('key2', 3, 60000);
        expect(result.allowed).toBe(true);
    });
});
