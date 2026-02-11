/**
 * AppSuite 管理運用システム - 認証モジュール
 * Phase 3 Sprint 1: 認証システム実装
 */

const AuthModule = {
    // セッション設定
    SESSION_KEY: 'appsuite_session',
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30分（ミリ秒）
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15分（ミリ秒）

    // 現在のセッション
    currentSession: null,

    /**
     * 初期化
     */
    init() {
        this.loadSession();
        this.setupSessionTimeout();
        this.setupActivityListener();
    },

    /**
     * ログイン処理
     * @param {string} username - ユーザー名
     * @param {string} password - パスワード
     * @returns {Object} - ログイン結果
     */
    async login(username, password) {
        // 入力バリデーション
        if (!username || !password) {
            return { success: false, error: 'ユーザー名とパスワードを入力してください' };
        }

        // ロックアウトチェック
        const lockoutInfo = this.checkLockout(username);
        if (lockoutInfo.locked) {
            const remainingMinutes = Math.ceil(lockoutInfo.remainingTime / 60000);
            return {
                success: false,
                error: `アカウントがロックされています。${remainingMinutes}分後に再試行してください`,
            };
        }

        // ユーザー検索
        const user = DataStore.users.find(u => u.username === username || u.email === username);

        if (!user) {
            this.recordFailedAttempt(username);
            return { success: false, error: 'ユーザー名またはパスワードが正しくありません' };
        }

        // ステータスチェック
        if (user.status !== 'active') {
            return { success: false, error: 'このアカウントは無効化されています' };
        }

        // パスワード検証（デモ環境では簡易チェック）
        const isValidPassword = await this.verifyPassword(password, user.passwordHash || 'demo');
        if (!isValidPassword) {
            this.recordFailedAttempt(username);
            const attempts = this.getFailedAttempts(username);
            const remaining = this.MAX_LOGIN_ATTEMPTS - attempts;
            return {
                success: false,
                error: `ユーザー名またはパスワードが正しくありません（残り${remaining}回）`,
            };
        }

        // ログイン成功
        this.clearFailedAttempts(username);
        const session = this.createSession(user);
        this.saveSession(session);

        // ログ記録
        LogModule.addLog('login', 'システム', 'system', `ログイン成功: ${user.username}`);

        // 最終ログイン更新
        user.lastLogin = new Date().toLocaleString('ja-JP');

        return { success: true, user: this.sanitizeUser(user), session };
    },

    /**
     * ログアウト処理
     */
    logout() {
        const user = this.getCurrentUser();
        if (user) {
            LogModule.addLog('logout', 'システム', 'system', `ログアウト: ${user.username}`);
        }

        this.clearSession();
        this.showLoginScreen();
    },

    /**
     * セッション作成
     * @param {Object} user - ユーザーオブジェクト
     * @returns {Object} - セッションオブジェクト
     */
    createSession(user) {
        const now = Date.now();
        return {
            id: this.generateSessionId(),
            userId: user.id,
            username: user.username,
            role: user.role,
            department: user.department,
            createdAt: now,
            expiresAt: now + this.SESSION_TIMEOUT,
            lastActivity: now,
        };
    },

    /**
     * セッションID生成
     * @returns {string} - ユニークなセッションID
     */
    generateSessionId() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    /**
     * セッション保存
     * @param {Object} session - セッションオブジェクト
     */
    saveSession(session) {
        this.currentSession = session;
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    },

    /**
     * セッション読み込み
     */
    loadSession() {
        const saved = sessionStorage.getItem(this.SESSION_KEY);
        if (saved) {
            const session = JSON.parse(saved);
            if (this.isSessionValid(session)) {
                this.currentSession = session;
                return true;
            }
            this.clearSession();
        }
        return false;
    },

    /**
     * セッション有効性チェック
     * @param {Object} session - セッションオブジェクト
     * @returns {boolean} - 有効な場合true
     */
    isSessionValid(session) {
        if (!session) {
            return false;
        }
        const now = Date.now();
        return session.expiresAt > now;
    },

    /**
     * セッションクリア
     */
    clearSession() {
        this.currentSession = null;
        sessionStorage.removeItem(this.SESSION_KEY);
    },

    /**
     * セッション更新（アクティビティ延長）
     */
    refreshSession() {
        if (this.currentSession) {
            const now = Date.now();
            this.currentSession.lastActivity = now;
            this.currentSession.expiresAt = now + this.SESSION_TIMEOUT;
            this.saveSession(this.currentSession);
        }
    },

    /**
     * 認証済みかチェック
     * @returns {boolean} - 認証済みの場合true
     */
    isAuthenticated() {
        return this.currentSession !== null && this.isSessionValid(this.currentSession);
    },

    /**
     * 現在のユーザー取得
     * @returns {Object|null} - ユーザーオブジェクトまたはnull
     */
    getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }
        const user = DataStore.users.find(u => u.id === this.currentSession.userId);
        return user ? this.sanitizeUser(user) : null;
    },

    /**
     * 権限チェック
     * @param {string} permission - 必要な権限
     * @returns {boolean} - 権限がある場合true
     */
    hasPermission(permission) {
        if (!this.isAuthenticated()) {
            return false;
        }

        const permissions = {
            // 管理者のみ
            admin: ['管理者'],
            'user.create': ['管理者'],
            'user.delete': ['管理者'],
            'settings.edit': ['管理者'],
            'log.export': ['管理者'],

            // 管理者とユーザー
            'user.view': ['管理者', 'ユーザー'],
            'app.view': ['管理者', 'ユーザー'],
            'incident.view': ['管理者', 'ユーザー'],
            'incident.create': ['管理者', 'ユーザー'],
            'change.view': ['管理者', 'ユーザー'],
            'change.create': ['管理者', 'ユーザー'],
        };

        const allowedRoles = permissions[permission];
        if (!allowedRoles) {
            return true;
        } // 未定義の権限は許可

        return allowedRoles.includes(this.currentSession.role);
    },

    /**
     * 権限チェック（UIガード用）
     * @param {string} permission - 必要な権限
     * @param {Function} callback - 権限がある場合に実行する関数
     */
    requirePermission(permission, callback) {
        if (this.hasPermission(permission)) {
            callback();
        } else {
            showToast('この操作を行う権限がありません', 'error');
        }
    },

    /**
     * パスワード検証（SHA-256ベースの簡易実装）
     * @param {string} password - 入力パスワード
     * @param {string} hash - 保存されているハッシュ
     * @returns {Promise<boolean>} - 一致する場合true
     */
    async verifyPassword(password, storedHashWithSalt) {
        // 本番環境：SHA-256ハッシュ + salt比較
        // フォーマット: "hash:salt"
        if (!storedHashWithSalt || typeof storedHashWithSalt !== 'string') {
            return false;
        }

        const parts = storedHashWithSalt.split(':');
        if (parts.length !== 2) {
            // 旧フォーマット（salt無し）との後方互換性
            // セキュリティ警告: 旧フォーマットは脆弱なため、パスワード再設定を推奨
            console.warn('⚠️ セキュリティ警告: 旧形式のパスワードハッシュが検出されました。パスワードを再設定してください。');
            const inputHash = await this.hashPasswordLegacy(password);
            return inputHash === storedHashWithSalt;
        }

        const [storedHash, salt] = parts;
        const inputHash = await this.hashPassword(password, salt);
        return inputHash === storedHash;
    },

    /**
     * パスワードハッシュ化（SHA-256 + ランダムsalt）
     * @param {string} password - パスワード
     * @param {string} [salt] - salt（省略時は新規生成）
     * @returns {Promise<string>} - ハッシュ値（フォーマット: "hash:salt"）
     */
    async hashPassword(password, salt = null) {
        // saltが指定されていない場合は新規生成（128ビット = 32文字の16進数）
        if (!salt) {
            const saltArray = new Uint8Array(16);
            crypto.getRandomValues(saltArray);
            salt = Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // saltを指定された場合（検証時）はハッシュのみ返す
        // saltを生成した場合（登録時）は"hash:salt"形式で返す
        if (arguments.length > 1) {
            return hash;
        } else {
            return `${hash}:${salt}`;
        }
    },

    /**
     * パスワードハッシュ化（旧方式・互換性のため残存）
     * @deprecated セキュリティ上の理由により非推奨。hashPassword()を使用してください。
     * @param {string} password - パスワード
     * @returns {Promise<string>} - ハッシュ値
     */
    async hashPasswordLegacy(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'appsuite_salt_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * ログイン失敗記録
     * @param {string} username - ユーザー名
     */
    recordFailedAttempt(username) {
        const key = `login_attempts_${username}`;
        const data = JSON.parse(localStorage.getItem(key) || '{"attempts":0,"firstAttempt":0}');

        const now = Date.now();
        if (now - data.firstAttempt > this.LOCKOUT_DURATION) {
            // ロックアウト期間経過後はリセット
            data.attempts = 1;
            data.firstAttempt = now;
        } else {
            data.attempts++;
        }
        data.lastAttempt = now;

        localStorage.setItem(key, JSON.stringify(data));

        // ロックアウト時にログ記録
        if (data.attempts >= this.MAX_LOGIN_ATTEMPTS) {
            LogModule.addLog(
                'security',
                'システム',
                'system',
                `アカウントロック: ${username} (${this.MAX_LOGIN_ATTEMPTS}回の失敗)`
            );
        }
    },

    /**
     * 失敗回数取得
     * @param {string} username - ユーザー名
     * @returns {number} - 失敗回数
     */
    getFailedAttempts(username) {
        const key = `login_attempts_${username}`;
        const data = JSON.parse(localStorage.getItem(key) || '{"attempts":0}');
        return data.attempts;
    },

    /**
     * ロックアウトチェック
     * @param {string} username - ユーザー名
     * @returns {Object} - ロックアウト情報
     */
    checkLockout(username) {
        const key = `login_attempts_${username}`;
        const data = JSON.parse(localStorage.getItem(key) || '{"attempts":0,"lastAttempt":0}');

        const now = Date.now();
        const timeSinceLastAttempt = now - data.lastAttempt;

        if (
            data.attempts >= this.MAX_LOGIN_ATTEMPTS &&
            timeSinceLastAttempt < this.LOCKOUT_DURATION
        ) {
            return {
                locked: true,
                remainingTime: this.LOCKOUT_DURATION - timeSinceLastAttempt,
            };
        }

        return { locked: false };
    },

    /**
     * 失敗記録クリア
     * @param {string} username - ユーザー名
     */
    clearFailedAttempts(username) {
        localStorage.removeItem(`login_attempts_${username}`);
    },

    /**
     * ユーザー情報のサニタイズ（機密情報除去）
     * @param {Object} user - ユーザーオブジェクト
     * @returns {Object} - サニタイズされたユーザー
     */
    sanitizeUser(user) {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
    },

    /**
     * セッションタイムアウト設定
     */
    setupSessionTimeout() {
        setInterval(() => {
            if (this.currentSession && !this.isSessionValid(this.currentSession)) {
                showToast('セッションがタイムアウトしました', 'warning');
                this.logout();
            }
        }, 60000); // 1分ごとにチェック
    },

    /**
     * アクティビティリスナー設定
     */
    setupActivityListener() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const handler = () => {
            if (this.isAuthenticated()) {
                this.refreshSession();
            }
        };

        events.forEach(event => {
            document.addEventListener(event, handler, { passive: true });
        });
    },

    /**
     * ログイン画面表示
     */
    showLoginScreen() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('active');
        }
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginError').textContent = '';
    },

    /**
     * ログイン画面非表示
     */
    hideLoginScreen() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('active');
        }
    },

    /**
     * ログインフォーム送信処理
     */
    async handleLoginSubmit(event) {
        event.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorElement = document.getElementById('loginError');
        const submitButton = event.target.querySelector('button[type="submit"]');

        // ボタン無効化
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ログイン中...';

        try {
            const result = await this.login(username, password);

            if (result.success) {
                this.hideLoginScreen();
                this.updateUIForUser(result.user);
                showToast(`ようこそ、${result.user.username}さん`, 'success');

                // アプリケーション初期化
                if (typeof startApplicationAfterLogin === 'function') {
                    startApplicationAfterLogin();
                } else if (typeof updateDashboard === 'function') {
                    updateDashboard();
                }
            } else {
                errorElement.textContent = result.error;
                document.getElementById('loginPassword').value = '';
            }
        } catch (error) {
            errorElement.textContent = 'ログイン処理中にエラーが発生しました';
            console.error('Login error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> ログイン';
        }
    },

    /**
     * ユーザー情報でUI更新
     * @param {Object} user - ユーザーオブジェクト
     */
    updateUIForUser(user) {
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement) {
            currentUserElement.textContent = user.username;
        }

        // 権限に基づくUI制御
        this.applyPermissionBasedUI();
    },

    /**
     * 権限ベースのUI制御
     */
    applyPermissionBasedUI() {
        // 管理者専用機能の表示/非表示
        const adminOnlyElements = document.querySelectorAll('[data-permission="admin"]');
        adminOnlyElements.forEach(el => {
            el.style.display = this.hasPermission('admin') ? '' : 'none';
        });

        // ユーザー作成ボタン
        const addUserButton = document.getElementById('addUserButton');
        if (addUserButton) {
            addUserButton.style.display = this.hasPermission('user.create') ? '' : 'none';
        }

        // 設定エクスポートボタン
        const exportButtons = document.querySelectorAll('[data-permission="log.export"]');
        exportButtons.forEach(el => {
            el.style.display = this.hasPermission('log.export') ? '' : 'none';
        });
    },
};

// パスワード強度チェッカー
const PasswordValidator = {
    /**
     * パスワード強度チェック
     * @param {string} password - パスワード
     * @returns {Object} - チェック結果
     */
    check(password) {
        const result = {
            valid: true,
            score: 0,
            errors: [],
            strength: 'weak',
        };

        // 最小長チェック（8文字以上）
        if (password.length < 8) {
            result.valid = false;
            result.errors.push('パスワードは8文字以上必要です');
        } else {
            result.score += 1;
        }

        // 大文字チェック
        if (!/[A-Z]/.test(password)) {
            result.errors.push('大文字を含めてください');
        } else {
            result.score += 1;
        }

        // 小文字チェック
        if (!/[a-z]/.test(password)) {
            result.errors.push('小文字を含めてください');
        } else {
            result.score += 1;
        }

        // 数字チェック
        if (!/[0-9]/.test(password)) {
            result.errors.push('数字を含めてください');
        } else {
            result.score += 1;
        }

        // 特殊文字チェック
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            result.errors.push('特殊文字を含めてください');
        } else {
            result.score += 1;
        }

        // 12文字以上でボーナス
        if (password.length >= 12) {
            result.score += 1;
        }

        // 強度判定
        if (result.score >= 5) {
            result.strength = 'strong';
        } else if (result.score >= 3) {
            result.strength = 'medium';
        } else {
            result.strength = 'weak';
        }

        return result;
    },

    /**
     * 強度バー更新
     * @param {string} password - パスワード
     * @param {HTMLElement} barElement - プログレスバー要素
     * @param {HTMLElement} textElement - テキスト要素
     */
    updateStrengthUI(password, barElement, textElement) {
        const result = this.check(password);

        const colors = {
            weak: '#ef4444',
            medium: '#f59e0b',
            strong: '#22c55e',
        };

        const labels = {
            weak: '弱い',
            medium: '普通',
            strong: '強い',
        };

        const widths = {
            weak: '33%',
            medium: '66%',
            strong: '100%',
        };

        if (barElement) {
            barElement.style.width = widths[result.strength];
            barElement.style.backgroundColor = colors[result.strength];
        }

        if (textElement) {
            textElement.textContent = labels[result.strength];
            textElement.style.color = colors[result.strength];
        }
    },
};

// グローバル関数（HTML onclick用）
function handleLogin(event) {
    AuthModule.handleLoginSubmit(event);
}

function handleLogout() {
    AuthModule.logout();
}

// Export to global scope
window.AuthModule = AuthModule;
window.PasswordValidator = PasswordValidator;
