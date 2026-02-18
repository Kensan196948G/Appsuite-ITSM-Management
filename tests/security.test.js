/**
 * セキュリティユーティリティのテスト
 * WebUI-Production/js/security.js
 */

const {
    Security,
    Validator,
    FormValidator,
    CsrfProtection,
    RateLimiter,
    escapeHtml,
    sanitizeInput
} = require('../WebUI-Production/js/security.js');

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

    describe('html (tagged template literal)', () => {
        test('テンプレートリテラルの値をエスケープ', () => {
            const xss = '<script>alert("xss")</script>';
            const result = Security.html`<div>${xss}</div>`;
            expect(result).toBe('<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;</div>');
        });

        test('複数の値をエスケープ', () => {
            const a = '<a>';
            const b = '"b"';
            const result = Security.html`${a} and ${b}`;
            expect(result).toBe('&lt;a&gt; and &quot;b&quot;');
        });

        test('値なしの場合はそのまま返す', () => {
            const result = Security.html`hello world`;
            expect(result).toBe('hello world');
        });
    });

    describe('encodeUrl', () => {
        test('スペースをURLエンコード', () => {
            expect(Security.encodeUrl('hello world')).toBe('hello%20world');
        });

        test('特殊文字をURLエンコード', () => {
            expect(Security.encodeUrl('a=1&b=2')).toBe('a%3D1%26b%3D2');
        });

        test('日本語をエンコード', () => {
            const encoded = Security.encodeUrl('日本語');
            expect(encoded).not.toBe('日本語');
            expect(encoded.length).toBeGreaterThan(0);
        });
    });

    describe('sanitizeSql', () => {
        test('シングルクォートをエスケープ', () => {
            expect(Security.sanitizeSql("It's a test")).toBe("It''s a test");
        });

        test('複数のシングルクォートをエスケープ', () => {
            expect(Security.sanitizeSql("a'b'c")).toBe("a''b''c");
        });

        test('空/nullは空文字列を返す', () => {
            expect(Security.sanitizeSql('')).toBe('');
            expect(Security.sanitizeSql(null)).toBe('');
            expect(Security.sanitizeSql(undefined)).toBe('');
        });

        test('クォートなし文字列は変更しない', () => {
            expect(Security.sanitizeSql('normal text')).toBe('normal text');
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

        test('空/nullはfalse', () => {
            expect(Validator.phone('')).toBe(false);
            expect(Validator.phone(null)).toBe(false);
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

    describe('pattern', () => {
        test('パターンにマッチするとtrue', () => {
            expect(Validator.pattern('abc123', /^[a-z0-9]+$/)).toBe(true);
            expect(Validator.pattern('2024-01-01', /^\d{4}-\d{2}-\d{2}$/)).toBe(true);
        });

        test('パターンにマッチしないとfalse', () => {
            expect(Validator.pattern('ABC', /^[a-z]+$/)).toBe(false);
            expect(Validator.pattern('invalid-date', /^\d{4}-\d{2}-\d{2}$/)).toBe(false);
        });

        test('空/nullはfalse', () => {
            expect(Validator.pattern('', /^.+$/)).toBe(false);
            expect(Validator.pattern(null, /^.+$/)).toBe(false);
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

    describe('datetime', () => {
        test('有効な日時形式（YYYY-MM-DD HH:mm）', () => {
            expect(Validator.datetime('2024-01-15 09:30')).toBe(true);
            expect(Validator.datetime('2024-12-31 23:59')).toBe(true);
        });

        test('無効な日時形式', () => {
            expect(Validator.datetime('2024-01-15T09:30')).toBe(false);
            expect(Validator.datetime('2024/01/15 09:30')).toBe(false);
            expect(Validator.datetime('invalid')).toBe(false);
        });

        test('空/nullはfalse', () => {
            expect(Validator.datetime('')).toBe(false);
            expect(Validator.datetime(null)).toBe(false);
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

        test('空/nullはfalse', () => {
            expect(Validator.url('')).toBe(false);
            expect(Validator.url(null)).toBe(false);
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

        test('空/nullはfalse', () => {
            expect(Validator.alphanumeric('')).toBe(false);
            expect(Validator.alphanumeric(null)).toBe(false);
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

        test('空/nullはfalse', () => {
            expect(Validator.containsJapanese('')).toBe(false);
            expect(Validator.containsJapanese(null)).toBe(false);
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
            expect(Validator.noForbiddenChars("It's" + '"test"')).toBe(false);
        });

        test('空/nullはtrue（禁止文字なし）', () => {
            expect(Validator.noForbiddenChars('')).toBe(true);
            expect(Validator.noForbiddenChars(null)).toBe(true);
        });
    });
});

describe('FormValidator Module', () => {
    let form;

    beforeEach(() => {
        form = document.createElement('form');
        document.body.appendChild(form);
    });

    afterEach(() => {
        document.body.removeChild(form);
    });

    function addInput(parentForm, name, value) {
        const input = document.createElement('input');
        input.name = name;
        input.value = value || '';
        parentForm.appendChild(input);
        return input;
    }

    describe('validate', () => {
        test('required ルール - 空の値はエラー', () => {
            addInput(form, 'username', '');
            const result = FormValidator.validate(form, {
                username: [{ type: 'required', message: '必須です' }]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.username).toContain('必須です');
        });

        test('required ルール - 値があれば有効', () => {
            addInput(form, 'username', 'admin');
            const result = FormValidator.validate(form, {
                username: [{ type: 'required', message: '必須です' }]
            });
            expect(result.isValid).toBe(true);
            expect(result.errors.username).toBeUndefined();
        });

        test('minLength ルール', () => {
            addInput(form, 'password', 'ab');
            const result = FormValidator.validate(form, {
                password: [{ type: 'minLength', message: '最低3文字', params: { min: 3 } }]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.password).toContain('最低3文字');
        });

        test('maxLength ルール', () => {
            addInput(form, 'name', 'toolongname');
            const result = FormValidator.validate(form, {
                name: [{ type: 'maxLength', message: '最大5文字', params: { max: 5 } }]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.name).toContain('最大5文字');
        });

        test('email ルール - 無効なメール', () => {
            addInput(form, 'email', 'invalid-email');
            const result = FormValidator.validate(form, {
                email: [{ type: 'email', message: 'メール形式が不正' }]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.email).toContain('メール形式が不正');
        });

        test('email ルール - 空は有効（任意フィールド扱い）', () => {
            addInput(form, 'email', '');
            const result = FormValidator.validate(form, {
                email: [{ type: 'email', message: 'メール形式が不正' }]
            });
            expect(result.isValid).toBe(true);
        });

        test('pattern ルール - マッチしない', () => {
            addInput(form, 'code', 'ABC123');
            const result = FormValidator.validate(form, {
                code: [{ type: 'pattern', message: '英小文字のみ', params: { pattern: /^[a-z]+$/ } }]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.code).toContain('英小文字のみ');
        });

        test('range ルール - 範囲外', () => {
            addInput(form, 'age', '200');
            const result = FormValidator.validate(form, {
                age: [{ type: 'range', message: '0〜150の範囲', params: { min: 0, max: 150 } }]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.age).toContain('0〜150の範囲');
        });

        test('custom ルール - カスタム関数でfalse', () => {
            addInput(form, 'field', 'bad');
            const result = FormValidator.validate(form, {
                field: [{
                    type: 'custom',
                    message: 'カスタムエラー',
                    params: { fn: (val) => val === 'good' }
                }]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.field).toContain('カスタムエラー');
        });

        test('custom ルール - カスタム関数でtrue', () => {
            addInput(form, 'field', 'good');
            const result = FormValidator.validate(form, {
                field: [{
                    type: 'custom',
                    message: 'カスタムエラー',
                    params: { fn: (val) => val === 'good' }
                }]
            });
            expect(result.isValid).toBe(true);
        });

        test('存在しないフィールドはスキップ', () => {
            const result = FormValidator.validate(form, {
                nonexistent: [{ type: 'required', message: '必須' }]
            });
            expect(result.isValid).toBe(true);
        });

        test('複数ルールで全エラーを収集', () => {
            addInput(form, 'text', '');
            const result = FormValidator.validate(form, {
                text: [
                    { type: 'required', message: '必須エラー' },
                    { type: 'minLength', message: '長さエラー', params: { min: 5 } }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.text.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('showErrors', () => {
        test('エラーメッセージがDOMに追加される', () => {
            const input = addInput(form, 'username', '');
            FormValidator.showErrors(form, { username: ['このフィールドは必須です'] });

            expect(input.classList.contains('input-error')).toBe(true);
            const errorDiv = form.querySelector('.field-error');
            expect(errorDiv).not.toBeNull();
            expect(errorDiv.textContent).toBe('このフィールドは必須です');
        });

        test('既存のエラーが上書きされる', () => {
            addInput(form, 'email', '');

            FormValidator.showErrors(form, { email: ['最初のエラー'] });
            FormValidator.showErrors(form, { email: ['新しいエラー'] });

            const errors = form.querySelectorAll('.field-error');
            expect(errors.length).toBe(1);
            expect(errors[0].textContent).toBe('新しいエラー');
        });

        test('存在しないフィールドはスキップ', () => {
            FormValidator.showErrors(form, { nonexistent: ['エラー'] });
            expect(form.querySelectorAll('.field-error').length).toBe(0);
        });
    });

    describe('clearErrors', () => {
        test('エラー表示をクリアする', () => {
            const input = addInput(form, 'username', '');
            FormValidator.showErrors(form, { username: ['エラー'] });

            expect(form.querySelector('.field-error')).not.toBeNull();
            FormValidator.clearErrors(form);

            expect(form.querySelector('.field-error')).toBeNull();
            expect(input.classList.contains('input-error')).toBe(false);
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
        expect(CsrfProtection.verifyToken('any_token')).toBeFalsy();
    });

    describe('addToForm', () => {
        let csrfForm;

        beforeEach(() => {
            csrfForm = document.createElement('form');
            document.body.appendChild(csrfForm);
            CsrfProtection.generateToken(); // 事前にトークンを生成
        });

        afterEach(() => {
            document.body.removeChild(csrfForm);
        });

        test('フォームにCSRFトークン隠しフィールドが追加される', () => {
            CsrfProtection.addToForm(csrfForm);

            const input = csrfForm.querySelector('input[name="csrf_token"]');
            expect(input).not.toBeNull();
            expect(input.type).toBe('hidden');
            expect(input.value).toBeTruthy();
        });

        test('既存のフォームフィールドは再利用される（重複しない）', () => {
            CsrfProtection.addToForm(csrfForm);
            CsrfProtection.addToForm(csrfForm);

            const inputs = csrfForm.querySelectorAll('input[name="csrf_token"]');
            expect(inputs.length).toBe(1);
        });

        test('トークンがない場合は新規生成してフィールドに設定', () => {
            sessionStorage.clear();
            CsrfProtection.addToForm(csrfForm);

            const input = csrfForm.querySelector('input[name="csrf_token"]');
            expect(input).not.toBeNull();
            expect(input.value.length).toBe(64);
        });
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
        RateLimiter.check('test-key', 3, 60000);
        RateLimiter.check('test-key', 3, 60000);
        RateLimiter.check('test-key', 3, 60000);
        const result = RateLimiter.check('test-key', 3, 60000);

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    test('ブロック中のリクエストはresetAtを含む', () => {
        for (let i = 0; i <= 3; i++) {
            RateLimiter.check('block-test', 3, 60000);
        }
        const blocked = RateLimiter.check('block-test', 3, 60000);
        expect(blocked.allowed).toBe(false);
        expect(blocked.resetAt).toBeGreaterThan(Date.now());
    });

    test('リセットで制限解除', () => {
        for (let i = 0; i < 5; i++) {
            RateLimiter.check('reset-test', 3, 60000);
        }
        RateLimiter.reset('reset-test');

        const result = RateLimiter.check('reset-test', 3, 60000);
        expect(result.allowed).toBe(true);
    });

    test('異なるキーは独立して管理', () => {
        for (let i = 0; i < 5; i++) {
            RateLimiter.check('key1', 3, 60000);
        }
        const result = RateLimiter.check('key2', 3, 60000);
        expect(result.allowed).toBe(true);
    });

    test('ブロック期限切れ後はリセットされて許可される', () => {
        // 期限切れのブロック状態を手動設定（1秒前に期限切れ）
        RateLimiter.limits.set('expired-key', {
            requests: [],
            blocked: true,
            blockUntil: Date.now() - 1000
        });

        const result = RateLimiter.check('expired-key', 3, 60000);
        expect(result.allowed).toBe(true);
    });
});

describe('グローバル関数', () => {
    test('escapeHtml はSecurity.escapeHtmlと同じ動作', () => {
        expect(escapeHtml('<b>test</b>')).toBe('&lt;b&gt;test&lt;&#x2F;b&gt;');
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml('safe text')).toBe('safe text');
    });

    test('sanitizeInput はSecurity.escapeHtmlと同じ動作', () => {
        expect(sanitizeInput('<b>test</b>')).toBe('&lt;b&gt;test&lt;&#x2F;b&gt;');
        expect(sanitizeInput(null)).toBe('');
        expect(sanitizeInput('safe text')).toBe('safe text');
    });
});
