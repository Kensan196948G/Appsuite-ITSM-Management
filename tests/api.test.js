/**
 * API連携モジュール テスト
 * DeskNet's Neo API連携機能のユニットテスト
 */

// グローバルモック
global.localStorage = {
    store: {},
    getItem: jest.fn(key => global.localStorage.store[key] || null),
    setItem: jest.fn((key, value) => { global.localStorage.store[key] = value; }),
    removeItem: jest.fn(key => { delete global.localStorage.store[key]; }),
    clear: jest.fn(() => { global.localStorage.store = {}; })
};

global.fetch = jest.fn();
global.showToast = jest.fn();
global.btoa = jest.fn(str => Buffer.from(str).toString('base64'));

// DOM要素のモック
const mockElements = {};
global.document = {
    getElementById: jest.fn(id => {
        if (!mockElements[id]) {
            mockElements[id] = {
                value: '',
                textContent: '',
                style: {},
                innerHTML: '',
                disabled: false,
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                }
            };
        }
        return mockElements[id];
    }),
    addEventListener: jest.fn()
};

// ApiConfig
const ApiConfig = {
    baseUrl: '',
    apiKey: '',
    authMethod: 'bearer',
    timeout: 30000,

    save() {
        this.baseUrl = document.getElementById('apiUrl').value;
        this.apiKey = document.getElementById('apiKey').value;
        this.authMethod = document.getElementById('authMethod').value;
        this.timeout = parseInt(document.getElementById('timeout').value) * 1000;

        localStorage.setItem('appsuite_api_config', JSON.stringify({
            baseUrl: this.baseUrl,
            apiKey: this.apiKey,
            authMethod: this.authMethod,
            timeout: this.timeout
        }));

        showToast('API設定を保存しました', 'success');
    },

    load() {
        const saved = localStorage.getItem('appsuite_api_config');
        if (saved) {
            const config = JSON.parse(saved);
            this.baseUrl = config.baseUrl || '';
            this.apiKey = config.apiKey || '';
            this.authMethod = config.authMethod || 'bearer';
            this.timeout = config.timeout || 30000;
        }
    },

    async test() {
        if (!this.baseUrl) {
            showToast('API URLを入力してください', 'error');
            return false;
        }
        return true;
    }
};

// Api
const Api = {
    async get(endpoint, params = {}) {
        return this.request('GET', endpoint, params);
    },

    async post(endpoint, data = {}) {
        return this.request('POST', endpoint, data);
    },

    async put(endpoint, data = {}) {
        return this.request('PUT', endpoint, data);
    },

    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    },

    async request(method, endpoint, data = {}) {
        const url = new URL(endpoint, ApiConfig.baseUrl);

        const options = {
            method: method,
            headers: this.getHeaders(),
        };

        if (method === 'GET' && Object.keys(data).length > 0) {
            Object.keys(data).forEach(key => url.searchParams.append(key, data[key]));
        } else if (method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ApiConfig.timeout);
        options.signal = controller.signal;

        try {
            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('リクエストがタイムアウトしました');
            }
            throw error;
        }
    },

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        switch (ApiConfig.authMethod) {
        case 'bearer':
            headers['Authorization'] = `Bearer ${ApiConfig.apiKey}`;
            break;
        case 'basic':
            headers['Authorization'] = `Basic ${btoa(ApiConfig.apiKey)}`;
            break;
        case 'apikey':
            headers['X-API-Key'] = ApiConfig.apiKey;
            break;
        }

        return headers;
    }
};

// DataStore
const DataStore = {
    STORAGE_KEYS: {
        users: 'appsuite_users',
        apps: 'appsuite_apps',
        incidents: 'appsuite_incidents',
        changes: 'appsuite_changes',
        logs: 'appsuite_logs'
    },

    _defaults: {
        users: [
            { id: 'U0001', username: 'テストユーザー', email: 'test@example.com', department: 'テスト部', role: 'ユーザー', status: 'active' }
        ],
        apps: [
            { id: 'APP001', name: 'テストアプリ', category: 'テスト', creator: 'テスト', records: 100, status: 'active' }
        ],
        incidents: [],
        changes: [],
        logs: []
    },

    users: [],
    apps: [],
    incidents: [],
    changes: [],
    logs: [],

    init() {
        const collections = ['users', 'apps', 'incidents', 'changes', 'logs'];
        collections.forEach(collection => {
            const saved = localStorage.getItem(this.STORAGE_KEYS[collection]);
            if (saved) {
                try {
                    this[collection] = JSON.parse(saved);
                } catch (e) {
                    this[collection] = [...this._defaults[collection]];
                }
            } else {
                this[collection] = [...this._defaults[collection]];
            }
        });
    },

    save(collection) {
        if (this.STORAGE_KEYS[collection]) {
            localStorage.setItem(this.STORAGE_KEYS[collection], JSON.stringify(this[collection]));
        }
    },

    saveAll() {
        Object.keys(this.STORAGE_KEYS).forEach(collection => this.save(collection));
    },

    findById(collection, id) {
        return this[collection]?.find(item => item.id === id) || null;
    },

    findWhere(collection, predicate) {
        return this[collection]?.filter(predicate) || [];
    },

    create(collection, item) {
        this[collection].push(item);
        this.save(collection);
        return item;
    },

    update(collection, id, updates) {
        const index = this[collection]?.findIndex(item => item.id === id);
        if (index === -1 || index === undefined) return null;

        this[collection][index] = { ...this[collection][index], ...updates };
        this.save(collection);
        return this[collection][index];
    },

    delete(collection, id) {
        const index = this[collection]?.findIndex(item => item.id === id);
        if (index === -1 || index === undefined) return false;

        this[collection].splice(index, 1);
        this.save(collection);
        return true;
    },

    reset(collection) {
        if (collection) {
            this[collection] = [...this._defaults[collection]];
            this.save(collection);
        } else {
            Object.keys(this.STORAGE_KEYS).forEach(c => {
                this[c] = [...this._defaults[c]];
                localStorage.removeItem(this.STORAGE_KEYS[c]);
            });
        }
    },

    getStats() {
        return {
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => u.status === 'active').length,
            totalApps: this.apps.length,
            activeApps: this.apps.filter(a => a.status === 'active').length,
            openIncidents: this.incidents.filter(i => i.status !== 'closed').length,
            pendingChanges: this.changes.filter(c => c.status === 'pending').length
        };
    },

    exportAll() {
        return {
            users: this.users,
            apps: this.apps,
            incidents: this.incidents,
            changes: this.changes,
            logs: this.logs,
            exportedAt: new Date().toISOString()
        };
    },

    importAll(data) {
        if (data.users) this.users = data.users;
        if (data.apps) this.apps = data.apps;
        if (data.incidents) this.incidents = data.incidents;
        if (data.changes) this.changes = data.changes;
        if (data.logs) this.logs = data.logs;
        this.saveAll();
    }
};

// =====================================
// テストスイート
// =====================================

describe('ApiConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.store = {};
        ApiConfig.baseUrl = '';
        ApiConfig.apiKey = '';
        ApiConfig.authMethod = 'bearer';
        ApiConfig.timeout = 30000;
    });

    describe('save', () => {
        test('設定をlocalStorageに保存する', () => {
            // DOM要素のモックを直接設定
            document.getElementById = jest.fn(id => {
                const elements = {
                    apiUrl: { value: 'https://api.example.com' },
                    apiKey: { value: 'test-api-key' },
                    authMethod: { value: 'bearer' },
                    timeout: { value: '30' }
                };
                return elements[id] || { value: '' };
            });

            ApiConfig.save();

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'appsuite_api_config',
                expect.any(String)
            );
            expect(showToast).toHaveBeenCalledWith('API設定を保存しました', 'success');
        });
    });

    describe('load', () => {
        test('保存された設定を読み込む', () => {
            const savedConfig = {
                baseUrl: 'https://saved.example.com',
                apiKey: 'saved-key',
                authMethod: 'basic',
                timeout: 60000
            };
            // getItemモックを設定して保存済みデータを返す
            localStorage.getItem.mockReturnValueOnce(JSON.stringify(savedConfig));

            ApiConfig.load();

            expect(ApiConfig.baseUrl).toBe('https://saved.example.com');
            expect(ApiConfig.apiKey).toBe('saved-key');
            expect(ApiConfig.authMethod).toBe('basic');
            expect(ApiConfig.timeout).toBe(60000);
        });

        test('設定がない場合はデフォルト値を使用', () => {
            localStorage.getItem.mockReturnValueOnce(null);

            ApiConfig.load();

            expect(ApiConfig.baseUrl).toBe('');
            expect(ApiConfig.apiKey).toBe('');
            expect(ApiConfig.authMethod).toBe('bearer');
            expect(ApiConfig.timeout).toBe(30000);
        });
    });

    describe('test', () => {
        test('URLがない場合はエラーを表示', async () => {
            ApiConfig.baseUrl = '';

            const result = await ApiConfig.test();

            expect(result).toBe(false);
            expect(showToast).toHaveBeenCalledWith('API URLを入力してください', 'error');
        });

        test('URLがある場合はtrueを返す', async () => {
            ApiConfig.baseUrl = 'https://api.example.com';

            const result = await ApiConfig.test();

            expect(result).toBe(true);
        });
    });
});

describe('Api', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        ApiConfig.baseUrl = 'https://api.example.com';
        ApiConfig.apiKey = 'test-key';
        ApiConfig.authMethod = 'bearer';
        ApiConfig.timeout = 30000;
    });

    describe('getHeaders', () => {
        test('Bearer認証ヘッダーを生成', () => {
            ApiConfig.authMethod = 'bearer';
            ApiConfig.apiKey = 'my-token';

            const headers = Api.getHeaders();

            expect(headers['Authorization']).toBe('Bearer my-token');
            expect(headers['Content-Type']).toBe('application/json');
        });

        test('Basic認証ヘッダーを生成', () => {
            ApiConfig.authMethod = 'basic';
            ApiConfig.apiKey = 'user:pass';

            const headers = Api.getHeaders();

            expect(headers['Authorization']).toMatch(/^Basic /);
        });

        test('APIキーヘッダーを生成', () => {
            ApiConfig.authMethod = 'apikey';
            ApiConfig.apiKey = 'my-api-key';

            const headers = Api.getHeaders();

            expect(headers['X-API-Key']).toBe('my-api-key');
        });
    });

    describe('request', () => {
        test('GETリクエストを送信', async () => {
            const mockResponse = { status: 'success', data: [] };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await Api.get('/users', { page: 1 });

            expect(fetch).toHaveBeenCalled();
            expect(result).toEqual(mockResponse);
        });

        test('POSTリクエストを送信', async () => {
            const mockResponse = { status: 'success', id: 1 };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await Api.post('/users', { name: 'Test' });

            expect(fetch).toHaveBeenCalled();
            const [, options] = fetch.mock.calls[0];
            expect(options.method).toBe('POST');
            expect(options.body).toBe(JSON.stringify({ name: 'Test' }));
        });

        test('HTTPエラーを処理', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            });

            await expect(Api.get('/protected')).rejects.toThrow('HTTP 401: Unauthorized');
        });

        test('タイムアウトを処理', async () => {
            ApiConfig.timeout = 100;
            fetch.mockImplementationOnce(() =>
                new Promise((_, reject) => {
                    const error = new Error('Aborted');
                    error.name = 'AbortError';
                    setTimeout(() => reject(error), 150);
                })
            );

            await expect(Api.get('/slow')).rejects.toThrow('リクエストがタイムアウトしました');
        });
    });
});

describe('DataStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.store = {};
        DataStore.users = [];
        DataStore.apps = [];
        DataStore.incidents = [];
        DataStore.changes = [];
        DataStore.logs = [];
    });

    describe('init', () => {
        test('デフォルトデータで初期化', () => {
            localStorage.getItem.mockReturnValue(null);

            DataStore.init();

            expect(DataStore.users.length).toBeGreaterThan(0);
            expect(DataStore.apps.length).toBeGreaterThan(0);
        });

        test('保存されたデータを読み込む', () => {
            const savedUsers = [
                { id: 'U999', username: '保存ユーザー', email: 'saved@example.com' }
            ];
            // コレクション名に応じてモック値を返す
            localStorage.getItem.mockImplementation(key => {
                if (key === 'appsuite_users') {
                    return JSON.stringify(savedUsers);
                }
                return null;
            });

            DataStore.init();

            expect(DataStore.users).toEqual(savedUsers);
        });
    });

    describe('CRUD操作', () => {
        beforeEach(() => {
            DataStore.init();
        });

        test('create: 新規アイテムを作成', () => {
            const newUser = { id: 'U999', username: '新規ユーザー', email: 'new@example.com' };

            const result = DataStore.create('users', newUser);

            expect(result).toEqual(newUser);
            expect(DataStore.users).toContainEqual(newUser);
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        test('findById: IDでアイテムを検索', () => {
            DataStore.users = [
                { id: 'U001', username: 'ユーザー1' },
                { id: 'U002', username: 'ユーザー2' }
            ];

            const result = DataStore.findById('users', 'U002');

            expect(result).toEqual({ id: 'U002', username: 'ユーザー2' });
        });

        test('findById: 存在しないIDはnullを返す', () => {
            DataStore.users = [{ id: 'U001', username: 'ユーザー1' }];

            const result = DataStore.findById('users', 'U999');

            expect(result).toBeNull();
        });

        test('findWhere: 条件でアイテムを検索', () => {
            DataStore.users = [
                { id: 'U001', status: 'active' },
                { id: 'U002', status: 'inactive' },
                { id: 'U003', status: 'active' }
            ];

            const result = DataStore.findWhere('users', u => u.status === 'active');

            expect(result.length).toBe(2);
        });

        test('update: アイテムを更新', () => {
            DataStore.users = [{ id: 'U001', username: '元の名前', email: 'old@example.com' }];

            const result = DataStore.update('users', 'U001', { username: '新しい名前' });

            expect(result.username).toBe('新しい名前');
            expect(result.email).toBe('old@example.com');
        });

        test('update: 存在しないIDはnullを返す', () => {
            DataStore.users = [{ id: 'U001', username: 'ユーザー' }];

            const result = DataStore.update('users', 'U999', { username: '更新' });

            expect(result).toBeNull();
        });

        test('delete: アイテムを削除', () => {
            DataStore.users = [
                { id: 'U001', username: 'ユーザー1' },
                { id: 'U002', username: 'ユーザー2' }
            ];

            const result = DataStore.delete('users', 'U001');

            expect(result).toBe(true);
            expect(DataStore.users.length).toBe(1);
            expect(DataStore.findById('users', 'U001')).toBeNull();
        });

        test('delete: 存在しないIDはfalseを返す', () => {
            DataStore.users = [{ id: 'U001', username: 'ユーザー' }];

            const result = DataStore.delete('users', 'U999');

            expect(result).toBe(false);
        });
    });

    describe('reset', () => {
        test('特定コレクションをリセット', () => {
            DataStore.users = [{ id: 'U999', username: 'カスタム' }];

            DataStore.reset('users');

            expect(DataStore.users).toEqual(DataStore._defaults.users);
        });

        test('全コレクションをリセット', () => {
            DataStore.users = [];
            DataStore.apps = [];

            DataStore.reset();

            expect(DataStore.users).toEqual(DataStore._defaults.users);
            expect(DataStore.apps).toEqual(DataStore._defaults.apps);
        });
    });

    describe('getStats', () => {
        test('統計情報を取得', () => {
            DataStore.users = [
                { id: 'U001', status: 'active' },
                { id: 'U002', status: 'active' },
                { id: 'U003', status: 'inactive' }
            ];
            DataStore.apps = [
                { id: 'A001', status: 'active' },
                { id: 'A002', status: 'maintenance' }
            ];
            DataStore.incidents = [
                { id: 'INC001', status: 'open' },
                { id: 'INC002', status: 'closed' }
            ];
            DataStore.changes = [
                { id: 'CHG001', status: 'pending' },
                { id: 'CHG002', status: 'approved' }
            ];

            const stats = DataStore.getStats();

            expect(stats.totalUsers).toBe(3);
            expect(stats.activeUsers).toBe(2);
            expect(stats.totalApps).toBe(2);
            expect(stats.activeApps).toBe(1);
            expect(stats.openIncidents).toBe(1);
            expect(stats.pendingChanges).toBe(1);
        });
    });

    describe('exportAll / importAll', () => {
        test('全データをエクスポート', () => {
            DataStore.users = [{ id: 'U001', username: 'テスト' }];
            DataStore.apps = [{ id: 'A001', name: 'テストアプリ' }];

            const exported = DataStore.exportAll();

            expect(exported.users).toEqual(DataStore.users);
            expect(exported.apps).toEqual(DataStore.apps);
            expect(exported.exportedAt).toBeDefined();
        });

        test('データをインポート', () => {
            const importData = {
                users: [{ id: 'U999', username: 'インポートユーザー' }],
                apps: [{ id: 'A999', name: 'インポートアプリ' }]
            };

            DataStore.importAll(importData);

            expect(DataStore.users).toEqual(importData.users);
            expect(DataStore.apps).toEqual(importData.apps);
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });
});

// モックレスポンステスト
describe('API Mock Responses', () => {
    const mockUsersResponse = {
        status: 'success',
        users: [
            { userid: 'U001', name: '山田太郎', email: 'yamada@example.com', dept: '情報システム部' },
            { userid: 'U002', name: '鈴木花子', email: 'suzuki@example.com', dept: '営業部' }
        ]
    };

    const mockAppsResponse = {
        status: 'success',
        apps: [
            { appid: 'APP001', name: '勤怠管理', recordcount: 1250 },
            { appid: 'APP002', name: '経費精算', recordcount: 856 }
        ]
    };

    const mockErrorResponse = {
        status: 'error',
        message: 'Authentication failed'
    };

    test('ユーザー取得成功レスポンスの形式', () => {
        expect(mockUsersResponse.status).toBe('success');
        expect(Array.isArray(mockUsersResponse.users)).toBe(true);
        expect(mockUsersResponse.users[0]).toHaveProperty('userid');
        expect(mockUsersResponse.users[0]).toHaveProperty('name');
        expect(mockUsersResponse.users[0]).toHaveProperty('email');
    });

    test('アプリ取得成功レスポンスの形式', () => {
        expect(mockAppsResponse.status).toBe('success');
        expect(Array.isArray(mockAppsResponse.apps)).toBe(true);
        expect(mockAppsResponse.apps[0]).toHaveProperty('appid');
        expect(mockAppsResponse.apps[0]).toHaveProperty('name');
        expect(mockAppsResponse.apps[0]).toHaveProperty('recordcount');
    });

    test('エラーレスポンスの形式', () => {
        expect(mockErrorResponse.status).toBe('error');
        expect(mockErrorResponse.message).toBeDefined();
    });
});
