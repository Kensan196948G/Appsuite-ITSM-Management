/**
 * Sprint 3-5 機能テスト
 * WorkflowEngine, NotificationManager, BackupManager, Performance modules
 */

// setup.jsで設定されたモックを使用

// ========================================
// WorkflowEngine テスト
// ========================================
describe('WorkflowEngine', () => {
    // シンプルなWorkflowEngineモック
    const WorkflowEngine = {
        INCIDENT_TRANSITIONS: {
            open: ['in_progress', 'closed'],
            in_progress: ['resolved', 'open'],
            resolved: ['closed', 'in_progress'],
            closed: ['in_progress']
        },
        CHANGE_TRANSITIONS: {
            draft: ['pending'],
            pending: ['approved', 'rejected'],
            approved: ['in_progress'],
            in_progress: ['completed'],
            completed: [],
            rejected: []
        },
        SLA_DEFINITIONS: {
            high: { response: 1 * 60 * 60 * 1000, resolution: 4 * 60 * 60 * 1000 },
            medium: { response: 4 * 60 * 60 * 1000, resolution: 24 * 60 * 60 * 1000 },
            low: { response: 24 * 60 * 60 * 1000, resolution: 72 * 60 * 60 * 1000 }
        },

        isValidIncidentTransition(from, to) {
            if (from === to) return true;
            const allowed = this.INCIDENT_TRANSITIONS[from];
            return allowed ? allowed.includes(to) : false;
        },

        isValidChangeTransition(from, to) {
            if (from === to) return true;
            const allowed = this.CHANGE_TRANSITIONS[from];
            return allowed ? allowed.includes(to) : false;
        },

        getSlaStatus(incident) {
            if (!incident || !incident.priority || !incident.created) {
                return { status: 'unknown', responseRemaining: 0, resolutionRemaining: 0 };
            }

            const sla = this.SLA_DEFINITIONS[incident.priority];
            if (!sla) {
                return { status: 'unknown', responseRemaining: 0, resolutionRemaining: 0 };
            }

            const createdTime = new Date(incident.created).getTime();
            const now = Date.now();
            const elapsed = now - createdTime;

            const responseRemaining = sla.response - elapsed;
            const resolutionRemaining = sla.resolution - elapsed;

            let status = 'ok';
            if (resolutionRemaining < 0) {
                status = 'breach';
            } else if (responseRemaining < 0) {
                status = 'warning';
            }

            return {
                status,
                responseRemaining: Math.max(0, responseRemaining),
                resolutionRemaining: Math.max(0, resolutionRemaining)
            };
        }
    };

    describe('isValidIncidentTransition', () => {
        test('open から in_progress への遷移は有効', () => {
            expect(WorkflowEngine.isValidIncidentTransition('open', 'in_progress')).toBe(true);
        });

        test('open から closed への遷移は有効', () => {
            expect(WorkflowEngine.isValidIncidentTransition('open', 'closed')).toBe(true);
        });

        test('in_progress から resolved への遷移は有効', () => {
            expect(WorkflowEngine.isValidIncidentTransition('in_progress', 'resolved')).toBe(true);
        });

        test('resolved から open への遷移は無効', () => {
            expect(WorkflowEngine.isValidIncidentTransition('resolved', 'open')).toBe(false);
        });

        test('同じステータスへの遷移は有効', () => {
            expect(WorkflowEngine.isValidIncidentTransition('open', 'open')).toBe(true);
        });

        test('closed から in_progress への再オープンは有効', () => {
            expect(WorkflowEngine.isValidIncidentTransition('closed', 'in_progress')).toBe(true);
        });
    });

    describe('isValidChangeTransition', () => {
        test('draft から pending への遷移は有効', () => {
            expect(WorkflowEngine.isValidChangeTransition('draft', 'pending')).toBe(true);
        });

        test('pending から approved への遷移は有効', () => {
            expect(WorkflowEngine.isValidChangeTransition('pending', 'approved')).toBe(true);
        });

        test('pending から rejected への遷移は有効', () => {
            expect(WorkflowEngine.isValidChangeTransition('pending', 'rejected')).toBe(true);
        });

        test('approved から in_progress への遷移は有効', () => {
            expect(WorkflowEngine.isValidChangeTransition('approved', 'in_progress')).toBe(true);
        });

        test('completed からの遷移は無効', () => {
            expect(WorkflowEngine.isValidChangeTransition('completed', 'in_progress')).toBe(false);
        });

        test('rejected からの遷移は無効', () => {
            expect(WorkflowEngine.isValidChangeTransition('rejected', 'pending')).toBe(false);
        });
    });

    describe('getSlaStatus', () => {
        test('高優先度のSLA定義が正しい', () => {
            expect(WorkflowEngine.SLA_DEFINITIONS.high.response).toBe(1 * 60 * 60 * 1000);
            expect(WorkflowEngine.SLA_DEFINITIONS.high.resolution).toBe(4 * 60 * 60 * 1000);
        });

        test('中優先度のSLA定義が正しい', () => {
            expect(WorkflowEngine.SLA_DEFINITIONS.medium.response).toBe(4 * 60 * 60 * 1000);
            expect(WorkflowEngine.SLA_DEFINITIONS.medium.resolution).toBe(24 * 60 * 60 * 1000);
        });

        test('低優先度のSLA定義が正しい', () => {
            expect(WorkflowEngine.SLA_DEFINITIONS.low.response).toBe(24 * 60 * 60 * 1000);
            expect(WorkflowEngine.SLA_DEFINITIONS.low.resolution).toBe(72 * 60 * 60 * 1000);
        });

        test('新規インシデントのSLAステータスは ok', () => {
            const incident = {
                priority: 'high',
                created: new Date().toISOString()
            };
            const status = WorkflowEngine.getSlaStatus(incident);
            expect(status.status).toBe('ok');
            expect(status.responseRemaining).toBeGreaterThan(0);
        });

        test('無効なインシデントは unknown を返す', () => {
            const status = WorkflowEngine.getSlaStatus(null);
            expect(status.status).toBe('unknown');
        });
    });
});

// ========================================
// BackupManager テスト
// ========================================
describe('BackupManager', () => {
    // シンプルなBackupManagerモック
    const BackupManager = {
        VERSION: '2.0.0',
        SCHEMA: {
            requiredFields: ['version', 'timestamp'],
            dataFields: ['settings', 'users', 'apps', 'incidents', 'changes', 'logs']
        },

        calculateChecksum(data) {
            const str = JSON.stringify({
                users: data.users?.length || 0,
                apps: data.apps?.length || 0,
                incidents: data.incidents?.length || 0,
                changes: data.changes?.length || 0,
                logs: data.logs?.length || 0,
                timestamp: data.timestamp
            });

            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(16);
        },

        validateBackup(data) {
            const errors = [];
            const warnings = [];

            for (const field of this.SCHEMA.requiredFields) {
                if (!data[field]) {
                    errors.push(`必須フィールド "${field}" がありません`);
                }
            }

            for (const field of this.SCHEMA.dataFields) {
                if (data[field] !== undefined) {
                    if (field === 'settings') {
                        if (typeof data[field] !== 'object' || Array.isArray(data[field])) {
                            errors.push(`"${field}" は設定オブジェクトである必要があります`);
                        }
                    } else {
                        if (!Array.isArray(data[field])) {
                            errors.push(`"${field}" は配列である必要があります`);
                        }
                    }
                }
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings
            };
        },

        mergeArrays(existing, incoming, idField = 'id') {
            const existingMap = new Map(existing.map(item => [item[idField], item]));
            for (const item of incoming) {
                existingMap.set(item[idField], item);
            }
            return Array.from(existingMap.values());
        }
    };

    describe('validateBackup', () => {
        test('有効なバックアップは valid: true を返す', () => {
            const backup = {
                version: '2.0.0',
                timestamp: new Date().toISOString(),
                users: [],
                apps: [],
                incidents: [],
                changes: [],
                logs: [],
                settings: {}
            };
            const result = BackupManager.validateBackup(backup);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('version がないバックアップは無効', () => {
            const backup = {
                timestamp: new Date().toISOString()
            };
            const result = BackupManager.validateBackup(backup);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('必須フィールド "version" がありません');
        });

        test('timestamp がないバックアップは無効', () => {
            const backup = {
                version: '2.0.0'
            };
            const result = BackupManager.validateBackup(backup);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('必須フィールド "timestamp" がありません');
        });

        test('users が配列でない場合は無効', () => {
            const backup = {
                version: '2.0.0',
                timestamp: new Date().toISOString(),
                users: 'not an array'
            };
            const result = BackupManager.validateBackup(backup);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('"users" は配列である必要があります');
        });

        test('settings がオブジェクトでない場合は無効', () => {
            const backup = {
                version: '2.0.0',
                timestamp: new Date().toISOString(),
                settings: []
            };
            const result = BackupManager.validateBackup(backup);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('"settings" は設定オブジェクトである必要があります');
        });
    });

    describe('calculateChecksum', () => {
        test('同じデータは同じチェックサムを返す', () => {
            const data = {
                users: [1, 2, 3],
                apps: [1, 2],
                incidents: [],
                changes: [],
                logs: [],
                timestamp: '2026-01-29T00:00:00Z'
            };
            const checksum1 = BackupManager.calculateChecksum(data);
            const checksum2 = BackupManager.calculateChecksum(data);
            expect(checksum1).toBe(checksum2);
        });

        test('異なるデータは異なるチェックサムを返す', () => {
            const data1 = {
                users: [1, 2, 3],
                timestamp: '2026-01-29T00:00:00Z'
            };
            const data2 = {
                users: [1, 2],
                timestamp: '2026-01-29T00:00:00Z'
            };
            const checksum1 = BackupManager.calculateChecksum(data1);
            const checksum2 = BackupManager.calculateChecksum(data2);
            expect(checksum1).not.toBe(checksum2);
        });
    });

    describe('mergeArrays', () => {
        test('既存と新規をIDでマージする', () => {
            const existing = [
                { id: '1', name: 'A' },
                { id: '2', name: 'B' }
            ];
            const incoming = [
                { id: '2', name: 'B-updated' },
                { id: '3', name: 'C' }
            ];
            const result = BackupManager.mergeArrays(existing, incoming);
            expect(result).toHaveLength(3);
            expect(result.find(i => i.id === '2').name).toBe('B-updated');
            expect(result.find(i => i.id === '3').name).toBe('C');
        });

        test('重複がない場合は全て追加', () => {
            const existing = [{ id: '1', name: 'A' }];
            const incoming = [{ id: '2', name: 'B' }];
            const result = BackupManager.mergeArrays(existing, incoming);
            expect(result).toHaveLength(2);
        });

        test('カスタムIDフィールドを使用', () => {
            const existing = [{ key: 'a', value: 1 }];
            const incoming = [{ key: 'a', value: 2 }];
            const result = BackupManager.mergeArrays(existing, incoming, 'key');
            expect(result).toHaveLength(1);
            expect(result[0].value).toBe(2);
        });
    });
});

// ========================================
// ApiCache テスト
// ========================================
describe('ApiCache', () => {
    const ApiCache = {
        cache: new Map(),
        maxAge: 5 * 60 * 1000,
        maxSize: 100,

        get(key) {
            const entry = this.cache.get(key);
            if (!entry) return null;
            if (Date.now() > entry.expiresAt) {
                this.cache.delete(key);
                return null;
            }
            entry.hits++;
            return entry.data;
        },

        set(key, data, ttl = this.maxAge) {
            if (this.cache.size >= this.maxSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            this.cache.set(key, {
                data,
                createdAt: Date.now(),
                expiresAt: Date.now() + ttl,
                hits: 0
            });
        },

        invalidate(keyPattern) {
            if (typeof keyPattern === 'string') {
                this.cache.delete(keyPattern);
            }
        },

        clear() {
            this.cache.clear();
        },

        getStats() {
            let totalHits = 0;
            for (const entry of this.cache.values()) {
                totalHits += entry.hits;
            }
            return {
                size: this.cache.size,
                maxSize: this.maxSize,
                totalHits
            };
        }
    };

    beforeEach(() => {
        ApiCache.clear();
    });

    test('データを保存して取得できる', () => {
        ApiCache.set('test-key', { data: 'test' });
        const result = ApiCache.get('test-key');
        expect(result).toEqual({ data: 'test' });
    });

    test('存在しないキーはnullを返す', () => {
        const result = ApiCache.get('non-existent');
        expect(result).toBeNull();
    });

    test('invalidate でキーを削除できる', () => {
        ApiCache.set('test-key', { data: 'test' });
        ApiCache.invalidate('test-key');
        expect(ApiCache.get('test-key')).toBeNull();
    });

    test('clear で全てのキャッシュをクリアできる', () => {
        ApiCache.set('key1', 'data1');
        ApiCache.set('key2', 'data2');
        ApiCache.clear();
        expect(ApiCache.getStats().size).toBe(0);
    });

    test('getStats が正しい統計を返す', () => {
        ApiCache.set('key1', 'data1');
        ApiCache.set('key2', 'data2');
        ApiCache.get('key1'); // ヒット
        const stats = ApiCache.getStats();
        expect(stats.size).toBe(2);
        expect(stats.totalHits).toBe(1);
    });
});

// ========================================
// RateLimitUtils テスト
// ========================================
describe('RateLimitUtils', () => {
    const RateLimitUtils = {
        debounce(fn, delay) {
            let timeoutId;
            return function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
        },

        throttle(fn, limit) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        once(fn) {
            let called = false;
            return function (...args) {
                if (!called) {
                    called = true;
                    return fn.apply(this, args);
                }
            };
        }
    };

    describe('once', () => {
        test('関数を1回だけ実行する', () => {
            const mockFn = jest.fn(() => 'result');
            const onceFn = RateLimitUtils.once(mockFn);

            expect(onceFn()).toBe('result');
            expect(onceFn()).toBeUndefined();
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('引数を正しく渡す', () => {
            const mockFn = jest.fn((a, b) => a + b);
            const onceFn = RateLimitUtils.once(mockFn);

            expect(onceFn(1, 2)).toBe(3);
            expect(mockFn).toHaveBeenCalledWith(1, 2);
        });
    });

    describe('debounce', () => {
        jest.useFakeTimers();

        test('指定時間後に1回だけ実行される', () => {
            const mockFn = jest.fn();
            const debouncedFn = RateLimitUtils.debounce(mockFn, 100);

            debouncedFn();
            debouncedFn();
            debouncedFn();

            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);

            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        afterEach(() => {
            jest.useRealTimers();
        });
    });

    describe('throttle', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('制限時間内は1回だけ実行される', () => {
            const mockFn = jest.fn();
            const throttledFn = RateLimitUtils.throttle(mockFn, 100);

            throttledFn();
            throttledFn();
            throttledFn();

            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('制限時間後は再度実行できる', () => {
            const mockFn = jest.fn();
            const throttledFn = RateLimitUtils.throttle(mockFn, 100);

            throttledFn();
            expect(mockFn).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(100);
            throttledFn();
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
    });
});

// ========================================
// Memoize テスト
// ========================================
describe('Memoize', () => {
    const Memoize = {
        fn(fn, keyFn) {
            const cache = new Map();
            return function (...args) {
                const key = keyFn ? keyFn(...args) : JSON.stringify(args);
                if (cache.has(key)) {
                    return cache.get(key);
                }
                const result = fn.apply(this, args);
                cache.set(key, result);
                return result;
            };
        },

        withTtl(fn, ttl, keyFn) {
            const cache = new Map();
            return function (...args) {
                const key = keyFn ? keyFn(...args) : JSON.stringify(args);
                const entry = cache.get(key);
                if (entry && Date.now() < entry.expiresAt) {
                    return entry.value;
                }
                const result = fn.apply(this, args);
                cache.set(key, {
                    value: result,
                    expiresAt: Date.now() + ttl
                });
                return result;
            };
        }
    };

    describe('fn', () => {
        test('同じ引数で関数を1回だけ実行する', () => {
            const expensive = jest.fn((x) => x * 2);
            const memoized = Memoize.fn(expensive);

            expect(memoized(5)).toBe(10);
            expect(memoized(5)).toBe(10);
            expect(expensive).toHaveBeenCalledTimes(1);
        });

        test('異なる引数では再実行する', () => {
            const expensive = jest.fn((x) => x * 2);
            const memoized = Memoize.fn(expensive);

            expect(memoized(5)).toBe(10);
            expect(memoized(10)).toBe(20);
            expect(expensive).toHaveBeenCalledTimes(2);
        });

        test('カスタムキー関数を使用できる', () => {
            const expensive = jest.fn((obj) => obj.value * 2);
            const memoized = Memoize.fn(expensive, (obj) => obj.id);

            expect(memoized({ id: 1, value: 5 })).toBe(10);
            expect(memoized({ id: 1, value: 100 })).toBe(10); // キャッシュヒット
            expect(expensive).toHaveBeenCalledTimes(1);
        });
    });
});

// ========================================
// NotificationManager テスト
// ========================================
describe('NotificationManager', () => {
    const NotificationManager = {
        STORAGE_KEY: 'appsuite_notifications',
        MAX_HISTORY: 100,
        history: [],

        loadHistory() {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            this.history = saved ? JSON.parse(saved) : [];
            return this.history;
        },

        saveHistory() {
            if (this.history.length > this.MAX_HISTORY) {
                this.history = this.history.slice(0, this.MAX_HISTORY);
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
        },

        addNotification(notification) {
            this.history.unshift({
                ...notification,
                id: 'N-' + Date.now(),
                timestamp: new Date().toISOString(),
                read: false
            });
            this.saveHistory();
        },

        markAsRead(id) {
            const notification = this.history.find(n => n.id === id);
            if (notification) {
                notification.read = true;
                this.saveHistory();
            }
        },

        getUnreadCount() {
            return this.history.filter(n => !n.read).length;
        },

        clearAll() {
            this.history = [];
            this.saveHistory();
        }
    };

    beforeEach(() => {
        NotificationManager.history = [];
        localStorage.clear();
    });

    test('通知を追加できる', () => {
        NotificationManager.addNotification({
            title: 'テスト通知',
            body: 'テスト内容',
            type: 'info'
        });
        expect(NotificationManager.history).toHaveLength(1);
        expect(NotificationManager.history[0].title).toBe('テスト通知');
    });

    test('未読カウントが正しい', () => {
        NotificationManager.addNotification({ title: '通知1' });
        NotificationManager.addNotification({ title: '通知2' });
        expect(NotificationManager.getUnreadCount()).toBe(2);
    });

    test('既読にできる', () => {
        NotificationManager.addNotification({ title: '通知1' });
        const id = NotificationManager.history[0].id;
        NotificationManager.markAsRead(id);
        expect(NotificationManager.getUnreadCount()).toBe(0);
    });

    test('全てクリアできる', () => {
        NotificationManager.addNotification({ title: '通知1' });
        NotificationManager.addNotification({ title: '通知2' });
        NotificationManager.clearAll();
        expect(NotificationManager.history).toHaveLength(0);
    });

    test('履歴は最大100件まで保持', () => {
        for (let i = 0; i < 110; i++) {
            NotificationManager.addNotification({ title: `通知${i}` });
        }
        NotificationManager.saveHistory();
        expect(NotificationManager.history.length).toBeLessThanOrEqual(100);
    });
});
