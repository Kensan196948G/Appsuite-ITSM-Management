/**
 * モジュールテスト
 * WebUI-Production/js/modules.js の機能テスト
 */

// テスト用のモックDataStore
const DataStore = {
    users: [],
    apps: [],
    incidents: [],
    changes: [],
    logs: []
};

// メール検証関数（modules.jsから）
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// escapeHtml関数（security.jsから）
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);

    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    return str.replace(/[&<>"'`=\/]/g, char => escapeMap[char]);
}

// IncidentModuleのステータス遷移検証ロジック
const StatusTransitions = {
    incident: {
        open: ['in_progress', 'closed'],
        in_progress: ['resolved', 'open'],
        resolved: ['closed', 'in_progress'],
        closed: ['in_progress']
    },

    isValidTransition(currentStatus, nextStatus) {
        if (currentStatus === nextStatus) {
            return true;
        }
        const transitions = this.incident;
        return (transitions[currentStatus] || []).includes(nextStatus);
    }
};

// ID生成ヘルパー
const IdGenerator = {
    generateUserId(currentCount) {
        return 'U' + String(currentCount + 1).padStart(4, '0');
    },

    generateAppId(currentCount) {
        return 'APP' + String(currentCount + 1).padStart(3, '0');
    },

    generateIncidentId(currentCount) {
        return 'INC' + String(currentCount + 1).padStart(3, '0');
    },

    generateChangeId(currentCount) {
        return 'CHG' + String(currentCount + 1).padStart(3, '0');
    }
};

// 日付フォーマットヘルパー
const DateHelper = {
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    formatTimestamp(date) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
};

// バイトサイズフォーマット（SettingsModuleから）
const ByteFormatter = {
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// バッジクラス取得ヘルパー
const BadgeHelper = {
    getIncidentPriorityBadge(priority) {
        const badges = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-info' };
        return badges[priority] || 'badge-secondary';
    },

    getIncidentStatusBadge(status) {
        const badges = {
            open: 'badge-danger',
            in_progress: 'badge-warning',
            resolved: 'badge-info',
            closed: 'badge-success'
        };
        return badges[status] || 'badge-secondary';
    },

    getAppStatusBadge(status) {
        const badges = {
            active: 'badge-success',
            maintenance: 'badge-warning',
            inactive: 'badge-secondary'
        };
        return badges[status] || 'badge-secondary';
    },

    getLogActionBadge(action) {
        const badges = {
            login: 'badge-success',
            logout: 'badge-secondary',
            create: 'badge-info',
            update: 'badge-warning',
            delete: 'badge-danger',
            export: 'badge-info'
        };
        return badges[action] || 'badge-secondary';
    },

    getChangeTypeBadge(type) {
        const badges = {
            feature: 'badge-success',
            improvement: 'badge-info',
            modification: 'badge-warning',
            bugfix: 'badge-danger'
        };
        return badges[type] || 'badge-secondary';
    },

    getChangeStatusBadge(status) {
        const badges = {
            draft: 'badge-secondary',
            pending: 'badge-warning',
            approved: 'badge-info',
            in_progress: 'badge-primary',
            completed: 'badge-success',
            rejected: 'badge-danger'
        };
        return badges[status] || 'badge-secondary';
    }
};

// テキスト取得ヘルパー
const TextHelper = {
    getIncidentPriorityText(priority) {
        const texts = { high: '高', medium: '中', low: '低' };
        return texts[priority] || priority;
    },

    getIncidentStatusText(status) {
        const texts = {
            open: 'オープン',
            in_progress: '対応中',
            resolved: '解決済',
            closed: 'クローズ'
        };
        return texts[status] || status;
    },

    getAppStatusText(status) {
        const texts = {
            active: '稼働中',
            maintenance: 'メンテナンス',
            inactive: '停止中'
        };
        return texts[status] || status;
    },

    getLogActionText(action) {
        const texts = {
            login: 'ログイン',
            logout: 'ログアウト',
            create: '作成',
            update: '更新',
            delete: '削除',
            export: 'エクスポート'
        };
        return texts[action] || action;
    },

    getChangeTypeText(type) {
        const texts = {
            feature: '新機能',
            improvement: '改善',
            modification: '変更',
            bugfix: 'バグ修正'
        };
        return texts[type] || type;
    },

    getChangeStatusText(status) {
        const texts = {
            draft: '下書き',
            pending: '申請中',
            approved: '承認済',
            in_progress: '実施中',
            completed: '完了',
            rejected: '却下'
        };
        return texts[status] || status;
    }
};

// ===================
// テストスイート
// ===================

describe('Email Validation', () => {
    test('有効なメールアドレス', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('test.user@domain.co.jp')).toBe(true);
        expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    test('無効なメールアドレス', () => {
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('@domain.com')).toBe(false);
        expect(isValidEmail('user@domain')).toBe(false);
        expect(isValidEmail('user domain@example.com')).toBe(false);
    });
});

describe('XSS Protection (escapeHtml)', () => {
    test('XSS攻撃パターンをエスケープ', () => {
        // Script injection - タグがエスケープされる
        expect(escapeHtml('<script>alert("XSS")</script>')).not.toContain('<script>');
        expect(escapeHtml('<script>alert("XSS")</script>')).toContain('&lt;script&gt;');

        // Event handler injection - HTMLタグとして解釈されなくなる
        const imgResult = escapeHtml('<img onerror="alert(1)">');
        expect(imgResult).toContain('&lt;img'); // タグがエスケープされる
        expect(imgResult).not.toMatch(/^<img/); // 生のHTMLタグではない

        // Attribute injection - クォートがエスケープされる
        expect(escapeHtml('" onclick="alert(1)"')).toContain('&quot;');
        expect(escapeHtml('" onclick="alert(1)"')).not.toMatch(/^"/);
    });

    test('日本語文字列は変更しない', () => {
        expect(escapeHtml('こんにちは世界')).toBe('こんにちは世界');
        expect(escapeHtml('ユーザー名: 田中太郎')).toBe('ユーザー名: 田中太郎');
    });

    test('IDやユーザー名に使用される値', () => {
        expect(escapeHtml('U0001')).toBe('U0001');
        expect(escapeHtml('APP001')).toBe('APP001');
        expect(escapeHtml('INC001')).toBe('INC001');
    });
});

describe('Incident Status Transitions', () => {
    test('同じステータスへの遷移は常に有効', () => {
        expect(StatusTransitions.isValidTransition('open', 'open')).toBe(true);
        expect(StatusTransitions.isValidTransition('in_progress', 'in_progress')).toBe(true);
        expect(StatusTransitions.isValidTransition('closed', 'closed')).toBe(true);
    });

    test('有効なステータス遷移', () => {
        // open から
        expect(StatusTransitions.isValidTransition('open', 'in_progress')).toBe(true);
        expect(StatusTransitions.isValidTransition('open', 'closed')).toBe(true);

        // in_progress から
        expect(StatusTransitions.isValidTransition('in_progress', 'resolved')).toBe(true);
        expect(StatusTransitions.isValidTransition('in_progress', 'open')).toBe(true);

        // resolved から
        expect(StatusTransitions.isValidTransition('resolved', 'closed')).toBe(true);
        expect(StatusTransitions.isValidTransition('resolved', 'in_progress')).toBe(true);

        // closed から（再オープン）
        expect(StatusTransitions.isValidTransition('closed', 'in_progress')).toBe(true);
    });

    test('無効なステータス遷移', () => {
        // open から直接 resolved にはできない
        expect(StatusTransitions.isValidTransition('open', 'resolved')).toBe(false);

        // resolved から直接 open にはできない
        expect(StatusTransitions.isValidTransition('resolved', 'open')).toBe(false);

        // closed から直接 open にはできない
        expect(StatusTransitions.isValidTransition('closed', 'open')).toBe(false);
    });
});

describe('ID Generation', () => {
    test('ユーザーID生成', () => {
        expect(IdGenerator.generateUserId(0)).toBe('U0001');
        expect(IdGenerator.generateUserId(9)).toBe('U0010');
        expect(IdGenerator.generateUserId(99)).toBe('U0100');
        expect(IdGenerator.generateUserId(999)).toBe('U1000');
    });

    test('アプリID生成', () => {
        expect(IdGenerator.generateAppId(0)).toBe('APP001');
        expect(IdGenerator.generateAppId(9)).toBe('APP010');
        expect(IdGenerator.generateAppId(99)).toBe('APP100');
    });

    test('インシデントID生成', () => {
        expect(IdGenerator.generateIncidentId(0)).toBe('INC001');
        expect(IdGenerator.generateIncidentId(9)).toBe('INC010');
        expect(IdGenerator.generateIncidentId(99)).toBe('INC100');
    });

    test('変更要求ID生成', () => {
        expect(IdGenerator.generateChangeId(0)).toBe('CHG001');
        expect(IdGenerator.generateChangeId(9)).toBe('CHG010');
        expect(IdGenerator.generateChangeId(99)).toBe('CHG100');
    });
});

describe('Date Formatting', () => {
    test('日付フォーマット（YYYY-MM-DD）', () => {
        const date = new Date('2024-01-15T10:30:00');
        expect(DateHelper.formatDate(date)).toBe('2024-01-15');
    });

    test('タイムスタンプフォーマット', () => {
        const date = new Date('2024-01-15T10:30:45');
        expect(DateHelper.formatTimestamp(date)).toBe('2024-01-15 10:30:45');
    });

    test('パディング処理', () => {
        const date = new Date('2024-03-05T09:05:05');
        expect(DateHelper.formatTimestamp(date)).toBe('2024-03-05 09:05:05');
    });
});

describe('Byte Size Formatting', () => {
    test('バイト単位', () => {
        expect(ByteFormatter.formatBytes(0)).toBe('0 Bytes');
        expect(ByteFormatter.formatBytes(500)).toBe('500 Bytes');
    });

    test('KB単位', () => {
        expect(ByteFormatter.formatBytes(1024)).toBe('1 KB');
        expect(ByteFormatter.formatBytes(1536)).toBe('1.5 KB');
    });

    test('MB単位', () => {
        expect(ByteFormatter.formatBytes(1048576)).toBe('1 MB');
        expect(ByteFormatter.formatBytes(1572864)).toBe('1.5 MB');
    });

    test('GB単位', () => {
        expect(ByteFormatter.formatBytes(1073741824)).toBe('1 GB');
    });
});

describe('Badge Classes', () => {
    describe('インシデント優先度', () => {
        test('高優先度は badge-danger', () => {
            expect(BadgeHelper.getIncidentPriorityBadge('high')).toBe('badge-danger');
        });

        test('中優先度は badge-warning', () => {
            expect(BadgeHelper.getIncidentPriorityBadge('medium')).toBe('badge-warning');
        });

        test('低優先度は badge-info', () => {
            expect(BadgeHelper.getIncidentPriorityBadge('low')).toBe('badge-info');
        });

        test('不明な優先度は badge-secondary', () => {
            expect(BadgeHelper.getIncidentPriorityBadge('unknown')).toBe('badge-secondary');
        });
    });

    describe('インシデントステータス', () => {
        test('オープンは badge-danger', () => {
            expect(BadgeHelper.getIncidentStatusBadge('open')).toBe('badge-danger');
        });

        test('対応中は badge-warning', () => {
            expect(BadgeHelper.getIncidentStatusBadge('in_progress')).toBe('badge-warning');
        });

        test('解決済は badge-info', () => {
            expect(BadgeHelper.getIncidentStatusBadge('resolved')).toBe('badge-info');
        });

        test('クローズは badge-success', () => {
            expect(BadgeHelper.getIncidentStatusBadge('closed')).toBe('badge-success');
        });
    });

    describe('アプリステータス', () => {
        test('稼働中は badge-success', () => {
            expect(BadgeHelper.getAppStatusBadge('active')).toBe('badge-success');
        });

        test('メンテナンスは badge-warning', () => {
            expect(BadgeHelper.getAppStatusBadge('maintenance')).toBe('badge-warning');
        });

        test('停止中は badge-secondary', () => {
            expect(BadgeHelper.getAppStatusBadge('inactive')).toBe('badge-secondary');
        });
    });

    describe('ログアクション', () => {
        test('ログインは badge-success', () => {
            expect(BadgeHelper.getLogActionBadge('login')).toBe('badge-success');
        });

        test('削除は badge-danger', () => {
            expect(BadgeHelper.getLogActionBadge('delete')).toBe('badge-danger');
        });
    });

    describe('変更種別', () => {
        test('新機能は badge-success', () => {
            expect(BadgeHelper.getChangeTypeBadge('feature')).toBe('badge-success');
        });

        test('バグ修正は badge-danger', () => {
            expect(BadgeHelper.getChangeTypeBadge('bugfix')).toBe('badge-danger');
        });
    });
});

describe('Text Labels', () => {
    describe('インシデント優先度テキスト', () => {
        test('優先度の日本語変換', () => {
            expect(TextHelper.getIncidentPriorityText('high')).toBe('高');
            expect(TextHelper.getIncidentPriorityText('medium')).toBe('中');
            expect(TextHelper.getIncidentPriorityText('low')).toBe('低');
        });

        test('不明な値はそのまま返す', () => {
            expect(TextHelper.getIncidentPriorityText('unknown')).toBe('unknown');
        });
    });

    describe('インシデントステータステキスト', () => {
        test('ステータスの日本語変換', () => {
            expect(TextHelper.getIncidentStatusText('open')).toBe('オープン');
            expect(TextHelper.getIncidentStatusText('in_progress')).toBe('対応中');
            expect(TextHelper.getIncidentStatusText('resolved')).toBe('解決済');
            expect(TextHelper.getIncidentStatusText('closed')).toBe('クローズ');
        });
    });

    describe('アプリステータステキスト', () => {
        test('ステータスの日本語変換', () => {
            expect(TextHelper.getAppStatusText('active')).toBe('稼働中');
            expect(TextHelper.getAppStatusText('maintenance')).toBe('メンテナンス');
            expect(TextHelper.getAppStatusText('inactive')).toBe('停止中');
        });
    });

    describe('ログアクションテキスト', () => {
        test('アクションの日本語変換', () => {
            expect(TextHelper.getLogActionText('login')).toBe('ログイン');
            expect(TextHelper.getLogActionText('create')).toBe('作成');
            expect(TextHelper.getLogActionText('update')).toBe('更新');
            expect(TextHelper.getLogActionText('delete')).toBe('削除');
            expect(TextHelper.getLogActionText('export')).toBe('エクスポート');
        });
    });

    describe('変更種別テキスト', () => {
        test('種別の日本語変換', () => {
            expect(TextHelper.getChangeTypeText('feature')).toBe('新機能');
            expect(TextHelper.getChangeTypeText('improvement')).toBe('改善');
            expect(TextHelper.getChangeTypeText('modification')).toBe('変更');
            expect(TextHelper.getChangeTypeText('bugfix')).toBe('バグ修正');
        });
    });

    describe('変更ステータステキスト', () => {
        test('ステータスの日本語変換', () => {
            expect(TextHelper.getChangeStatusText('draft')).toBe('下書き');
            expect(TextHelper.getChangeStatusText('pending')).toBe('申請中');
            expect(TextHelper.getChangeStatusText('approved')).toBe('承認済');
            expect(TextHelper.getChangeStatusText('in_progress')).toBe('実施中');
            expect(TextHelper.getChangeStatusText('completed')).toBe('完了');
            expect(TextHelper.getChangeStatusText('rejected')).toBe('却下');
        });
    });
});

describe('DataStore Operations', () => {
    beforeEach(() => {
        // DataStoreをリセット
        DataStore.users = [];
        DataStore.apps = [];
        DataStore.incidents = [];
        DataStore.changes = [];
        DataStore.logs = [];
    });

    test('ユーザーの追加と検索', () => {
        const user = {
            id: 'U0001',
            username: 'testuser',
            email: 'test@example.com',
            department: '情報システム部',
            role: 'ユーザー',
            status: 'active',
            lastLogin: '-'
        };

        DataStore.users.push(user);

        expect(DataStore.users.length).toBe(1);
        expect(DataStore.users.find(u => u.id === 'U0001')).toEqual(user);
    });

    test('アプリの追加と検索', () => {
        const app = {
            id: 'APP001',
            name: 'テストアプリ',
            category: '業務管理',
            creator: 'admin',
            records: 100,
            status: 'active',
            updated: '2024-01-15'
        };

        DataStore.apps.push(app);

        expect(DataStore.apps.length).toBe(1);
        expect(DataStore.apps.find(a => a.id === 'APP001')).toEqual(app);
    });

    test('インシデントのフィルタリング', () => {
        DataStore.incidents = [
            { id: 'INC001', title: 'Issue 1', priority: 'high', status: 'open' },
            { id: 'INC002', title: 'Issue 2', priority: 'low', status: 'closed' },
            { id: 'INC003', title: 'Issue 3', priority: 'high', status: 'in_progress' }
        ];

        // 高優先度でフィルタ
        const highPriority = DataStore.incidents.filter(i => i.priority === 'high');
        expect(highPriority.length).toBe(2);

        // オープンでフィルタ
        const openIncidents = DataStore.incidents.filter(i => i.status === 'open');
        expect(openIncidents.length).toBe(1);
    });

    test('ログの追加（先頭に挿入）', () => {
        const log1 = { timestamp: '2024-01-15 10:00:00', action: 'login', user: 'user1' };
        const log2 = { timestamp: '2024-01-15 11:00:00', action: 'create', user: 'user1' };

        DataStore.logs.unshift(log1);
        DataStore.logs.unshift(log2);

        // 最新のログが先頭
        expect(DataStore.logs[0]).toEqual(log2);
        expect(DataStore.logs[1]).toEqual(log1);
    });
});
