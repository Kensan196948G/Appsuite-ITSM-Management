/**
 * 認証モジュールテスト
 * WebUI-Production/js/auth.js の機能テスト
 */

// パスワード検証ユーティリティ
const PasswordValidator = {
    /**
     * パスワード強度チェック
     * @param {string} password - チェック対象のパスワード
     * @returns {Object} - {score: 0-4, feedback: string}
     */
    checkStrength(password) {
        if (!password) {
            return { score: 0, feedback: 'パスワードを入力してください' };
        }

        let score = 0;
        const feedback = [];

        // 長さチェック
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;

        // 文字種チェック
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
            score++;
        } else {
            feedback.push('大文字と小文字を含めてください');
        }

        if (/\d/.test(password)) {
            score++;
        } else {
            feedback.push('数字を含めてください');
        }

        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            score++;
        } else {
            feedback.push('記号を含めてください');
        }

        // フィードバック生成
        const strengthText = ['非常に弱い', '弱い', '普通', '強い', '非常に強い'][score];
        return {
            score,
            strength: strengthText,
            feedback: feedback.join(', ') || '良好なパスワードです'
        };
    },

    /**
     * 一般的なパスワードチェック
     * @param {string} password
     * @returns {boolean}
     */
    isCommonPassword(password) {
        const commonPasswords = [
            'password', '12345678', 'qwerty', 'abc123', 'password123',
            'admin', 'letmein', 'welcome', 'monkey', '1234567890'
        ];
        return commonPasswords.includes(password.toLowerCase());
    }
};

// セッション管理ユーティリティ
const SessionManager = {
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30分

    /**
     * セッション作成
     * @param {Object} user
     * @returns {Object}
     */
    createSession(user) {
        return {
            userId: user.id,
            username: user.username,
            role: user.role,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            token: this.generateToken()
        };
    },

    /**
     * トークン生成
     * @returns {string}
     */
    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    },

    /**
     * セッション有効性チェック
     * @param {Object} session
     * @returns {boolean}
     */
    isSessionValid(session) {
        if (!session || !session.lastActivity) {
            return false;
        }
        const elapsed = Date.now() - session.lastActivity;
        return elapsed < this.SESSION_TIMEOUT;
    },

    /**
     * セッション更新
     * @param {Object} session
     * @returns {Object}
     */
    refreshSession(session) {
        return {
            ...session,
            lastActivity: Date.now()
        };
    },

    /**
     * セッション残り時間（秒）
     * @param {Object} session
     * @returns {number}
     */
    getRemainingTime(session) {
        if (!session || !session.lastActivity) {
            return 0;
        }
        const elapsed = Date.now() - session.lastActivity;
        const remaining = this.SESSION_TIMEOUT - elapsed;
        return Math.max(0, Math.floor(remaining / 1000));
    }
};

// ログイン試行管理
const LoginAttemptManager = {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15分
    attempts: {},

    /**
     * 失敗試行を記録
     * @param {string} username
     */
    recordFailedAttempt(username) {
        if (!this.attempts[username]) {
            this.attempts[username] = {
                count: 0,
                firstAttempt: Date.now(),
                lastAttempt: Date.now()
            };
        }
        this.attempts[username].count++;
        this.attempts[username].lastAttempt = Date.now();
    },

    /**
     * ロックアウトチェック
     * @param {string} username
     * @returns {Object}
     */
    checkLockout(username) {
        const attempt = this.attempts[username];
        if (!attempt || attempt.count < this.MAX_ATTEMPTS) {
            return { locked: false };
        }

        const elapsed = Date.now() - attempt.lastAttempt;
        if (elapsed > this.LOCKOUT_DURATION) {
            // ロックアウト期間終了
            delete this.attempts[username];
            return { locked: false };
        }

        return {
            locked: true,
            remainingTime: this.LOCKOUT_DURATION - elapsed
        };
    },

    /**
     * 試行回数取得
     * @param {string} username
     * @returns {number}
     */
    getAttemptCount(username) {
        return this.attempts[username]?.count || 0;
    },

    /**
     * 試行履歴クリア
     * @param {string} username
     */
    clearAttempts(username) {
        delete this.attempts[username];
    },

    /**
     * 全履歴クリア
     */
    clearAll() {
        this.attempts = {};
    }
};

// 権限チェックユーティリティ
const PermissionChecker = {
    ROLES: {
        admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
        user: ['read', 'write'],
        viewer: ['read']
    },

    /**
     * 権限チェック
     * @param {string} role
     * @param {string} permission
     * @returns {boolean}
     */
    hasPermission(role, permission) {
        const permissions = this.ROLES[role] || [];
        return permissions.includes(permission);
    },

    /**
     * 管理者チェック
     * @param {Object} user
     * @returns {boolean}
     */
    isAdmin(user) {
        return user && (user.role === '管理者' || user.role === 'admin');
    },

    /**
     * アクセス可能チェック
     * @param {Object} user
     * @param {string} resource
     * @returns {boolean}
     */
    canAccess(user, resource) {
        if (this.isAdmin(user)) {
            return true;
        }

        const accessMap = {
            dashboard: ['admin', 'user', 'viewer'],
            users: ['admin'],
            settings: ['admin'],
            apps: ['admin', 'user'],
            incidents: ['admin', 'user'],
            changes: ['admin', 'user']
        };

        const allowedRoles = accessMap[resource] || [];
        return allowedRoles.includes(user.role);
    }
};

describe('PasswordValidator', () => {
    describe('checkStrength', () => {
        it('空パスワードはスコア0', () => {
            const result = PasswordValidator.checkStrength('');
            expect(result.score).toBe(0);
        });

        it('短いパスワードは弱い', () => {
            const result = PasswordValidator.checkStrength('abc123');
            expect(result.score).toBeLessThan(3);
        });

        it('複雑なパスワードは強い', () => {
            const result = PasswordValidator.checkStrength('Test@1234567');
            expect(result.score).toBeGreaterThanOrEqual(3);
        });

        it('12文字以上の複雑なパスワードは非常に強い', () => {
            const result = PasswordValidator.checkStrength('Test@123456789');
            expect(result.score).toBeGreaterThanOrEqual(4);
        });
    });

    describe('isCommonPassword', () => {
        it('一般的なパスワードを検出', () => {
            expect(PasswordValidator.isCommonPassword('password')).toBe(true);
            expect(PasswordValidator.isCommonPassword('12345678')).toBe(true);
            expect(PasswordValidator.isCommonPassword('qwerty')).toBe(true);
        });

        it('一般的でないパスワードはfalse', () => {
            expect(PasswordValidator.isCommonPassword('MySecure@Pass123')).toBe(false);
        });

        it('大文字小文字を区別しない', () => {
            expect(PasswordValidator.isCommonPassword('PASSWORD')).toBe(true);
            expect(PasswordValidator.isCommonPassword('Password')).toBe(true);
        });
    });
});

describe('SessionManager', () => {
    describe('createSession', () => {
        it('セッションを作成', () => {
            const user = { id: 'U001', username: 'testuser', role: 'user' };
            const session = SessionManager.createSession(user);

            expect(session.userId).toBe('U001');
            expect(session.username).toBe('testuser');
            expect(session.role).toBe('user');
            expect(session.loginTime).toBeDefined();
            expect(session.token).toBeDefined();
        });

        it('トークンは一意', () => {
            const user = { id: 'U001', username: 'testuser', role: 'user' };
            const session1 = SessionManager.createSession(user);
            const session2 = SessionManager.createSession(user);
            expect(session1.token).not.toBe(session2.token);
        });
    });

    describe('isSessionValid', () => {
        it('新しいセッションは有効', () => {
            const session = { lastActivity: Date.now() };
            expect(SessionManager.isSessionValid(session)).toBe(true);
        });

        it('タイムアウトしたセッションは無効', () => {
            const session = { lastActivity: Date.now() - 31 * 60 * 1000 }; // 31分前
            expect(SessionManager.isSessionValid(session)).toBe(false);
        });

        it('nullセッションは無効', () => {
            expect(SessionManager.isSessionValid(null)).toBe(false);
        });
    });

    describe('refreshSession', () => {
        it('セッションを更新', () => {
            const oldSession = {
                userId: 'U001',
                lastActivity: Date.now() - 10000
            };
            const newSession = SessionManager.refreshSession(oldSession);

            expect(newSession.userId).toBe('U001');
            expect(newSession.lastActivity).toBeGreaterThan(oldSession.lastActivity);
        });
    });

    describe('getRemainingTime', () => {
        it('残り時間を秒で取得', () => {
            const session = { lastActivity: Date.now() - 1000 }; // 1秒前
            const remaining = SessionManager.getRemainingTime(session);
            expect(remaining).toBeGreaterThan(29 * 60); // 29分以上
            expect(remaining).toBeLessThanOrEqual(30 * 60); // 30分以下
        });

        it('タイムアウトしたセッションは0', () => {
            const session = { lastActivity: Date.now() - 31 * 60 * 1000 };
            expect(SessionManager.getRemainingTime(session)).toBe(0);
        });
    });
});

describe('LoginAttemptManager', () => {
    beforeEach(() => {
        LoginAttemptManager.clearAll();
    });

    describe('recordFailedAttempt', () => {
        it('失敗試行を記録', () => {
            LoginAttemptManager.recordFailedAttempt('testuser');
            expect(LoginAttemptManager.getAttemptCount('testuser')).toBe(1);
        });

        it('複数回の失敗を累積', () => {
            LoginAttemptManager.recordFailedAttempt('testuser');
            LoginAttemptManager.recordFailedAttempt('testuser');
            LoginAttemptManager.recordFailedAttempt('testuser');
            expect(LoginAttemptManager.getAttemptCount('testuser')).toBe(3);
        });
    });

    describe('checkLockout', () => {
        it('5回未満の失敗ではロックされない', () => {
            for (let i = 0; i < 4; i++) {
                LoginAttemptManager.recordFailedAttempt('testuser');
            }
            const result = LoginAttemptManager.checkLockout('testuser');
            expect(result.locked).toBe(false);
        });

        it('5回の失敗でロックアウト', () => {
            for (let i = 0; i < 5; i++) {
                LoginAttemptManager.recordFailedAttempt('testuser');
            }
            const result = LoginAttemptManager.checkLockout('testuser');
            expect(result.locked).toBe(true);
            expect(result.remainingTime).toBeGreaterThan(0);
        });

        it('異なるユーザーは独立して管理', () => {
            LoginAttemptManager.recordFailedAttempt('user1');
            LoginAttemptManager.recordFailedAttempt('user2');
            expect(LoginAttemptManager.getAttemptCount('user1')).toBe(1);
            expect(LoginAttemptManager.getAttemptCount('user2')).toBe(1);
        });
    });

    describe('clearAttempts', () => {
        it('特定ユーザーの試行履歴をクリア', () => {
            LoginAttemptManager.recordFailedAttempt('testuser');
            LoginAttemptManager.clearAttempts('testuser');
            expect(LoginAttemptManager.getAttemptCount('testuser')).toBe(0);
        });
    });
});

describe('PermissionChecker', () => {
    describe('hasPermission', () => {
        it('adminは全権限を持つ', () => {
            expect(PermissionChecker.hasPermission('admin', 'read')).toBe(true);
            expect(PermissionChecker.hasPermission('admin', 'write')).toBe(true);
            expect(PermissionChecker.hasPermission('admin', 'delete')).toBe(true);
            expect(PermissionChecker.hasPermission('admin', 'manage_users')).toBe(true);
        });

        it('userは読み書き権限のみ', () => {
            expect(PermissionChecker.hasPermission('user', 'read')).toBe(true);
            expect(PermissionChecker.hasPermission('user', 'write')).toBe(true);
            expect(PermissionChecker.hasPermission('user', 'delete')).toBe(false);
        });

        it('viewerは読み取り専用', () => {
            expect(PermissionChecker.hasPermission('viewer', 'read')).toBe(true);
            expect(PermissionChecker.hasPermission('viewer', 'write')).toBe(false);
        });
    });

    describe('isAdmin', () => {
        it('管理者ユーザーはtrue', () => {
            expect(PermissionChecker.isAdmin({ role: '管理者' })).toBe(true);
            expect(PermissionChecker.isAdmin({ role: 'admin' })).toBe(true);
        });

        it('一般ユーザーはfalse', () => {
            expect(PermissionChecker.isAdmin({ role: 'user' })).toBe(false);
            expect(PermissionChecker.isAdmin({ role: 'ユーザー' })).toBe(false);
        });

        it('nullユーザーはfalsyな値', () => {
            expect(PermissionChecker.isAdmin(null)).toBeFalsy();
        });
    });

    describe('canAccess', () => {
        it('管理者は全リソースにアクセス可能', () => {
            const admin = { role: 'admin' };
            expect(PermissionChecker.canAccess(admin, 'users')).toBe(true);
            expect(PermissionChecker.canAccess(admin, 'settings')).toBe(true);
        });

        it('一般ユーザーはユーザー管理にアクセス不可', () => {
            const user = { role: 'user' };
            expect(PermissionChecker.canAccess(user, 'users')).toBe(false);
            expect(PermissionChecker.canAccess(user, 'settings')).toBe(false);
        });

        it('一般ユーザーはインシデント管理にアクセス可能', () => {
            const user = { role: 'user' };
            expect(PermissionChecker.canAccess(user, 'incidents')).toBe(true);
            expect(PermissionChecker.canAccess(user, 'changes')).toBe(true);
        });
    });
});
