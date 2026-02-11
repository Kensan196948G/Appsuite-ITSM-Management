/**
 * AppSuite 管理運用システム - API連携モジュール
 */

const ApiConfig = {
    baseUrl: '',
    apiKey: '',
    authMethod: 'bearer',
    timeout: 30000,
    encryptionPassword: null, // 暗号化パスワード（メモリのみ保持）

    /**
     * API設定を暗号化して保存（推奨）
     * @param {string} encryptionPassword - 暗号化パスワード
     */
    async saveEncrypted(encryptionPassword) {
        // パスワード強度チェック
        if (typeof cryptoHelper !== 'undefined') {
            const strengthCheck = cryptoHelper.checkPasswordStrength(encryptionPassword);
            if (!strengthCheck.valid) {
                throw new Error(`暗号化パスワードが不十分です: ${strengthCheck.messages.join(', ')}`);
            }
        }

        this.baseUrl = document.getElementById('apiUrl')?.value || this.baseUrl;
        this.apiKey = document.getElementById('apiKey')?.value || this.apiKey;
        this.authMethod = document.getElementById('authMethod')?.value || this.authMethod;
        this.timeout = parseInt(document.getElementById('timeout')?.value || this.timeout / 1000) * 1000;

        const config = {
            baseUrl: this.baseUrl,
            apiKey: this.apiKey,
            authMethod: this.authMethod,
            timeout: this.timeout,
            savedAt: new Date().toISOString(),
            version: '2.0.0' // 暗号化版
        };

        // JSON文字列化 → 暗号化
        const configJson = JSON.stringify(config);
        const encryptedData = await cryptoHelper.encrypt(configJson, encryptionPassword);

        // sessionStorageに保存（ブラウザクローズで自動削除）
        sessionStorage.setItem('appsuite_api_config_encrypted', encryptedData);

        // 暗号化パスワードをメモリに保持（セッション内のみ）
        this.encryptionPassword = encryptionPassword;

        // 旧localStorage設定を削除（移行）
        if (localStorage.getItem('appsuite_api_config')) {
            localStorage.removeItem('appsuite_api_config');
            console.log('✅ 旧API設定（localStorage）を削除しました');
        }

        showToast('API設定を暗号化して保存しました（セキュア）', 'success');
        console.log('✅ API設定を暗号化して保存しました（sessionStorage）');
    },

    /**
     * API設定を復号化して読込
     * @param {string} encryptionPassword - 復号化パスワード
     * @returns {Promise<boolean>} 成功時true
     */
    async loadEncrypted(encryptionPassword) {
        const encryptedData = sessionStorage.getItem('appsuite_api_config_encrypted');

        if (!encryptedData) {
            console.warn('⚠️ 暗号化された設定が見つかりません');
            return false;
        }

        try {
            // 復号化
            const configJson = await cryptoHelper.decrypt(encryptedData, encryptionPassword);
            const config = JSON.parse(configJson);

            // 設定を復元
            this.baseUrl = config.baseUrl || '';
            this.apiKey = config.apiKey || '';
            this.authMethod = config.authMethod || 'bearer';
            this.timeout = config.timeout || 30000;
            this.encryptionPassword = encryptionPassword;

            // UIに反映
            if (document.getElementById('apiUrl')) {
                document.getElementById('apiUrl').value = this.baseUrl;
            }
            if (document.getElementById('authMethod')) {
                document.getElementById('authMethod').value = this.authMethod;
            }
            if (document.getElementById('timeout')) {
                document.getElementById('timeout').value = this.timeout / 1000;
            }
            if (document.getElementById('apiKeyMasked')) {
                document.getElementById('apiKeyMasked').textContent = this.getApiKeyMasked();
            }

            showToast('API設定を読込みました', 'success');
            console.log('✅ API設定を復号化して読込みました');
            return true;

        } catch (error) {
            console.error('❌ 復号化失敗', error);
            showToast('復号化に失敗しました。パスワードを確認してください。', 'error');
            throw error;
        }
    },

    /**
     * APIキーを取得（マスキング表示用）
     * @returns {string}
     */
    getApiKeyMasked() {
        if (!this.apiKey) return '未設定';
        if (this.apiKey.length <= 8) return '****';
        // 最初の4文字と最後の4文字のみ表示
        const first = this.apiKey.slice(0, 4);
        const last = this.apiKey.slice(-4);
        return `${first}${'*'.repeat(Math.max(0, this.apiKey.length - 8))}${last}`;
    },

    /**
     * 設定をクリア
     */
    clear() {
        sessionStorage.removeItem('appsuite_api_config_encrypted');
        localStorage.removeItem('appsuite_api_config'); // 旧設定も削除
        this.encryptionPassword = null;
        this.baseUrl = '';
        this.apiKey = '';
        this.authMethod = 'bearer';
        this.timeout = 30000;

        showToast('API設定をクリアしました', 'info');
        console.log('✅ API設定をクリアしました');
    },

    /**
     * 自動ロック機能（一定時間後に設定をクリア）
     * @param {number} minutes - 自動ロックまでの分数（デフォルト: 30分）
     */
    enableAutoLock(minutes = 30) {
        const lockTime = minutes * 60 * 1000;

        // 既存のタイマーをクリア
        if (this.autoLockTimer) {
            clearTimeout(this.autoLockTimer);
        }

        this.autoLockTimer = setTimeout(() => {
            console.warn('⚠️ 自動ロック: API設定をクリアします');
            this.clear();
            // ユーザーに通知
            showToast('セキュリティのため、API設定がクリアされました。', 'warning');
        }, lockTime);

        console.log(`🔒 自動ロックを有効化しました（${minutes}分後）`);
    },

    /**
     * 旧localStorage設定から暗号化版への移行
     * @param {string} encryptionPassword - 暗号化パスワード
     */
    async migrateToEncrypted(encryptionPassword) {
        const oldConfig = localStorage.getItem('appsuite_api_config');

        if (!oldConfig) {
            console.log('移行対象の旧設定がありません');
            return false;
        }

        try {
            const config = JSON.parse(oldConfig);

            if (!config.apiKey) {
                console.log('APIキーが設定されていないため移行不要');
                return false;
            }

            // 既存データを復元
            this.baseUrl = config.baseUrl;
            this.apiKey = config.apiKey;
            this.authMethod = config.authMethod || 'bearer';
            this.timeout = config.timeout || 30000;

            // 暗号化して保存
            await this.saveEncrypted(encryptionPassword);

            console.log('✅ 旧API設定から暗号化版への移行完了');
            return true;

        } catch (error) {
            console.error('移行失敗', error);
            throw error;
        }
    },

    save() {
        this.baseUrl = document.getElementById('apiUrl').value;
        this.apiKey = document.getElementById('apiKey').value;
        this.authMethod = document.getElementById('authMethod').value;
        this.timeout = parseInt(document.getElementById('timeout').value) * 1000;

        localStorage.setItem(
            'appsuite_api_config',
            JSON.stringify({
                baseUrl: this.baseUrl,
                apiKey: this.apiKey,
                authMethod: this.authMethod,
                timeout: this.timeout,
            })
        );

        showToast('API設定を保存しました', 'success');
    },

    load() {
        const savedSettings = localStorage.getItem('appsuiteSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            const api = settings.api || {};
            this.baseUrl = api.url || '';
            this.apiKey = api.key || '';
            this.authMethod = api.authMethod || 'bearer';
            this.timeout = (api.timeout || 30) * 1000;
            return;
        }

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
            return;
        }

        try {
            showToast('接続テスト中...', 'info');
            // 実際のAPI接続テスト（デモではシミュレート）
            await new Promise(resolve => setTimeout(resolve, 1000));

            updateConnectionStatus(true);
            document.getElementById('apiStatus').textContent = '接続中';
            document.getElementById('apiStatus').style.color = '#22c55e';
            document.getElementById('lastSync').textContent = new Date().toLocaleString('ja-JP');
            document.getElementById('apiVersion').textContent = 'V7.5';

            showToast('接続成功！', 'success');
        } catch (error) {
            updateConnectionStatus(false);
            document.getElementById('apiStatus').textContent = '接続エラー';
            document.getElementById('apiStatus').style.color = '#ef4444';
            showToast('接続失敗: ' + error.message, 'error');
        }
    },
};

// API通信クラス
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
            if (error.name === 'AbortError') {
                throw new Error('リクエストがタイムアウトしました');
            }
            throw error;
        }
    },

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
    },
};

// データストア（永続化対応）
const DataStore = {
    // ストレージキー
    STORAGE_KEYS: {
        users: 'appsuite_users',
        apps: 'appsuite_apps',
        incidents: 'appsuite_incidents',
        changes: 'appsuite_changes',
        logs: 'appsuite_logs',
    },

    // デフォルトデータ
    _defaults: {
        users: [
            {
                id: 'U0000',
                username: 'admin',
                email: 'admin@example.com',
                department: '情報システム部',
                role: '管理者',
                status: 'active',
                lastLogin: '2026-01-23 22:00',
                passwordHash: '8e351ab841a352a5b034de6a319ff1f9254fbdb26cc323ad7cb14ae7b66190bf:afdba3a0d9a45f65487bfd23bdec0d17', // admin（SHA-256+salt）
            },
            {
                id: 'U0001',
                username: '山田太郎',
                email: 'yamada@example.com',
                department: '情報システム部',
                role: '管理者',
                status: 'active',
                lastLogin: '2026-01-19 09:30',
                passwordHash: 'ebdcf98c50ee94d0b27a5c250b196546fc059e1f2aa22d09be2ceb857f0658ae:1240a07482dee323ed73d80aaf330e24', // demo（SHA-256+salt）
            },
            {
                id: 'U0002',
                username: '鈴木花子',
                email: 'suzuki@example.com',
                department: '営業部',
                role: 'ユーザー',
                status: 'active',
                lastLogin: '2026-01-19 08:45',
                passwordHash: 'ebdcf98c50ee94d0b27a5c250b196546fc059e1f2aa22d09be2ceb857f0658ae:1240a07482dee323ed73d80aaf330e24', // demo（SHA-256+salt）
            },
            {
                id: 'U0003',
                username: '佐藤一郎',
                email: 'sato@example.com',
                department: '総務部',
                role: 'ユーザー',
                status: 'active',
                lastLogin: '2026-01-18 17:20',
                passwordHash: 'ebdcf98c50ee94d0b27a5c250b196546fc059e1f2aa22d09be2ceb857f0658ae:1240a07482dee323ed73d80aaf330e24', // demo（SHA-256+salt）
            },
            {
                id: 'U0004',
                username: '田中美咲',
                email: 'tanaka@example.com',
                department: '開発部',
                role: '管理者',
                status: 'active',
                lastLogin: '2026-01-19 10:15',
                passwordHash: 'ebdcf98c50ee94d0b27a5c250b196546fc059e1f2aa22d09be2ceb857f0658ae:1240a07482dee323ed73d80aaf330e24', // demo（SHA-256+salt）
            },
            {
                id: 'U0005',
                username: '高橋健二',
                email: 'takahashi@example.com',
                department: '情報システム部',
                role: 'ユーザー',
                status: 'inactive',
                lastLogin: '2026-01-10 14:00',
                passwordHash: 'ebdcf98c50ee94d0b27a5c250b196546fc059e1f2aa22d09be2ceb857f0658ae:1240a07482dee323ed73d80aaf330e24', // demo（SHA-256+salt）
            },
            {
                id: 'U0006',
                username: '伊藤真由',
                email: 'ito@example.com',
                department: '経理部',
                role: 'ユーザー',
                status: 'active',
                lastLogin: '2026-01-19 09:00',
                passwordHash: 'ebdcf98c50ee94d0b27a5c250b196546fc059e1f2aa22d09be2ceb857f0658ae:1240a07482dee323ed73d80aaf330e24', // demo（SHA-256+salt）
            },
            {
                id: 'U0007',
                username: '渡辺大輔',
                email: 'watanabe@example.com',
                department: '営業部',
                role: 'ユーザー',
                status: 'active',
                lastLogin: '2026-01-18 16:30',
                passwordHash: 'ebdcf98c50ee94d0b27a5c250b196546fc059e1f2aa22d09be2ceb857f0658ae:1240a07482dee323ed73d80aaf330e24', // demo（SHA-256+salt）
            },
        ],
        apps: [
            {
                id: 'APP001',
                name: '勤怠管理',
                category: '業務管理',
                creator: '山田太郎',
                records: 1250,
                status: 'active',
                updated: '2026-01-19',
            },
            {
                id: 'APP002',
                name: '経費精算申請',
                category: '申請・承認',
                creator: '田中美咲',
                records: 856,
                status: 'active',
                updated: '2026-01-18',
            },
            {
                id: 'APP003',
                name: '顧客管理',
                category: 'データ管理',
                creator: '鈴木花子',
                records: 3420,
                status: 'active',
                updated: '2026-01-19',
            },
            {
                id: 'APP004',
                name: '備品貸出管理',
                category: '業務管理',
                creator: '佐藤一郎',
                records: 234,
                status: 'active',
                updated: '2026-01-17',
            },
            {
                id: 'APP005',
                name: '休暇申請',
                category: '申請・承認',
                creator: '山田太郎',
                records: 567,
                status: 'active',
                updated: '2026-01-16',
            },
            {
                id: 'APP006',
                name: '会議室予約',
                category: '業務管理',
                creator: '田中美咲',
                records: 1890,
                status: 'maintenance',
                updated: '2026-01-15',
            },
            {
                id: 'APP007',
                name: '在庫管理',
                category: 'データ管理',
                creator: '高橋健二',
                records: 4521,
                status: 'active',
                updated: '2026-01-19',
            },
        ],
        incidents: [
            {
                id: 'INC001',
                title: '勤怠管理アプリでデータが保存されない',
                appId: 'APP001',
                appName: '勤怠管理',
                priority: 'high',
                status: 'in_progress',
                reporter: '鈴木花子',
                assignee: '山田太郎',
                created: '2026-01-19',
                description: '出勤打刻後、データが保存されずエラーが発生する',
            },
            {
                id: 'INC002',
                title: '経費精算の承認ボタンが反応しない',
                appId: 'APP002',
                appName: '経費精算申請',
                priority: 'medium',
                status: 'open',
                reporter: '佐藤一郎',
                assignee: '-',
                created: '2026-01-19',
                description: '承認ボタンをクリックしても何も起こらない',
            },
            {
                id: 'INC003',
                title: '顧客検索が遅い',
                appId: 'APP003',
                appName: '顧客管理',
                priority: 'low',
                status: 'resolved',
                reporter: '渡辺大輔',
                assignee: '田中美咲',
                created: '2026-01-18',
                description: '検索に10秒以上かかることがある',
            },
            {
                id: 'INC004',
                title: '会議室予約の表示エラー',
                appId: 'APP006',
                appName: '会議室予約',
                priority: 'medium',
                status: 'closed',
                reporter: '伊藤真由',
                assignee: '高橋健二',
                created: '2026-01-17',
                description: '予約一覧が正しく表示されない問題',
            },
        ],
        changes: [
            {
                id: 'CHG001',
                title: '勤怠管理に残業申請機能を追加',
                appId: 'APP001',
                appName: '勤怠管理',
                type: 'feature',
                status: 'approved',
                requester: '佐藤一郎',
                scheduled: '2026-02-01',
                description: '残業時間の事前申請・承認機能を追加したい',
            },
            {
                id: 'CHG002',
                title: '経費精算の領収書アップロード機能改善',
                appId: 'APP002',
                appName: '経費精算申請',
                type: 'improvement',
                status: 'in_progress',
                requester: '鈴木花子',
                scheduled: '2026-01-25',
                description: '複数ファイルの一括アップロードに対応',
            },
            {
                id: 'CHG003',
                title: '顧客管理の検索条件追加',
                appId: 'APP003',
                appName: '顧客管理',
                type: 'modification',
                status: 'pending',
                requester: '渡辺大輔',
                scheduled: '2026-02-10',
                description: '取引先担当者での検索を可能にしたい',
            },
            {
                id: 'CHG004',
                title: '在庫管理のバーコード読取不具合修正',
                appId: 'APP007',
                appName: '在庫管理',
                type: 'bugfix',
                status: 'completed',
                requester: '高橋健二',
                scheduled: '2026-01-15',
                description: '一部バーコードが読み取れない問題を修正',
            },
            {
                id: 'CHG005',
                title: '休暇申請に半休機能追加',
                appId: 'APP005',
                appName: '休暇申請',
                type: 'feature',
                status: 'draft',
                requester: '伊藤真由',
                scheduled: '-',
                description: '午前休・午後休の選択を可能にしたい',
            },
        ],
        logs: [
            {
                timestamp: '2026-01-19 10:30:15',
                user: '山田太郎',
                action: 'login',
                target: 'システム',
                targetType: 'system',
                detail: 'ログイン成功',
                ip: '192.168.1.100',
            },
            {
                timestamp: '2026-01-19 10:25:00',
                user: '田中美咲',
                action: 'update',
                target: '経費精算申請',
                targetType: 'app',
                detail: 'アプリ設定を更新',
                ip: '192.168.1.105',
            },
            {
                timestamp: '2026-01-19 10:20:30',
                user: '鈴木花子',
                action: 'create',
                target: '顧客管理',
                targetType: 'app',
                detail: '新規レコード追加（顧客ID: C1234）',
                ip: '192.168.1.110',
            },
            {
                timestamp: '2026-01-19 10:15:00',
                user: '佐藤一郎',
                action: 'export',
                target: '備品貸出管理',
                targetType: 'app',
                detail: 'CSVエクスポート実行',
                ip: '192.168.1.115',
            },
            {
                timestamp: '2026-01-19 09:45:00',
                user: '山田太郎',
                action: 'create',
                target: 'ユーザー',
                targetType: 'user',
                detail: '新規ユーザー追加: 伊藤真由',
                ip: '192.168.1.100',
            },
            {
                timestamp: '2026-01-19 09:30:00',
                user: '田中美咲',
                action: 'login',
                target: 'システム',
                targetType: 'system',
                detail: 'ログイン成功',
                ip: '192.168.1.105',
            },
            {
                timestamp: '2026-01-18 17:30:00',
                user: '高橋健二',
                action: 'logout',
                target: 'システム',
                targetType: 'system',
                detail: 'ログアウト',
                ip: '192.168.1.120',
            },
            {
                timestamp: '2026-01-18 17:00:00',
                user: '渡辺大輔',
                action: 'update',
                target: '顧客管理',
                targetType: 'app',
                detail: 'レコード更新（顧客ID: C0891）',
                ip: '192.168.1.125',
            },
            {
                timestamp: '2026-01-18 16:30:00',
                user: '伊藤真由',
                action: 'delete',
                target: '経費精算申請',
                targetType: 'app',
                detail: 'レコード削除（申請ID: E0234）',
                ip: '192.168.1.130',
            },
        ],
    },

    // データ配列（メモリ上）
    users: [],
    apps: [],
    incidents: [],
    changes: [],
    logs: [],

    /**
     * 初期化：localStorageからデータを読み込む
     */
    init() {
        // CVE-004対策: セキュリティ警告
        // localStorageは平文でデータを保存するため、機密情報の保存には適していません。
        // 本番環境では以下の対策を実施してください：
        // 1. HTTPS必須（HTTPSでない場合、ネットワーク盗聴のリスク）
        // 2. IndexedDBへの移行を検討（Web Crypto APIで暗号化可能）
        // 3. サーバーサイドでのデータ管理を推奨
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            console.warn(
                '%c⚠️ セキュリティ警告',
                'background: #ff6b6b; color: white; font-weight: bold; padding: 4px 8px; border-radius: 3px;',
                '\n本番環境ではHTTPSを使用してください。\nlocalStorageは平文保存のため、HTTPSなしではデータ漏洩のリスクがあります。'
            );
        }

        console.info(
            '%cℹ️ データストレージ情報',
            'background: #4dabf7; color: white; font-weight: bold; padding: 4px 8px; border-radius: 3px;',
            '\nlocalStorageを使用しています（開発環境向け）。\n本番環境では暗号化されたIndexedDBまたはサーバーサイドストレージへの移行を推奨します。'
        );

        const collections = ['users', 'apps', 'incidents', 'changes', 'logs'];
        collections.forEach(collection => {
            const saved = localStorage.getItem(this.STORAGE_KEYS[collection]);
            if (saved) {
                try {
                    this[collection] = JSON.parse(saved);
                } catch (e) {
                    console.error(`Failed to load ${collection}:`, e);
                    this[collection] = [...this._defaults[collection]];
                }
            } else {
                this[collection] = [...this._defaults[collection]];
            }
        });
    },

    /**
     * データをlocalStorageに保存
     * @param {string} collection - コレクション名
     */
    save(collection) {
        if (this.STORAGE_KEYS[collection]) {
            try {
                localStorage.setItem(
                    this.STORAGE_KEYS[collection],
                    JSON.stringify(this[collection])
                );
            } catch (e) {
                console.error(`Failed to save ${collection}:`, e);
                showToast('データの保存に失敗しました', 'error');
            }
        }
    },

    /**
     * 全データを保存
     */
    saveAll() {
        Object.keys(this.STORAGE_KEYS).forEach(collection => this.save(collection));
    },

    /**
     * IDでアイテムを検索
     * @param {string} collection - コレクション名
     * @param {string} id - ID
     * @returns {Object|null} - アイテムまたはnull
     */
    findById(collection, id) {
        return this[collection]?.find(item => item.id === id) || null;
    },

    /**
     * 条件でアイテムを検索
     * @param {string} collection - コレクション名
     * @param {Function} predicate - 検索条件
     * @returns {Array} - 検索結果
     */
    findWhere(collection, predicate) {
        return this[collection]?.filter(predicate) || [];
    },

    /**
     * アイテムを作成
     * @param {string} collection - コレクション名
     * @param {Object} item - 新規アイテム
     * @returns {Object} - 作成されたアイテム
     */
    create(collection, item) {
        this[collection].push(item);
        this.save(collection);
        return item;
    },

    /**
     * アイテムを更新
     * @param {string} collection - コレクション名
     * @param {string} id - ID
     * @param {Object} updates - 更新内容
     * @returns {Object|null} - 更新されたアイテムまたはnull
     */
    update(collection, id, updates) {
        const index = this[collection]?.findIndex(item => item.id === id);
        if (index === -1 || index === undefined) {
            return null;
        }

        this[collection][index] = { ...this[collection][index], ...updates };
        this.save(collection);
        return this[collection][index];
    },

    /**
     * アイテムを削除
     * @param {string} collection - コレクション名
     * @param {string} id - ID
     * @returns {boolean} - 削除成功の場合true
     */
    delete(collection, id) {
        const index = this[collection]?.findIndex(item => item.id === id);
        if (index === -1 || index === undefined) {
            return false;
        }

        this[collection].splice(index, 1);
        this.save(collection);
        return true;
    },

    /**
     * データをリセット（デフォルトに戻す）
     * @param {string} collection - コレクション名（省略時は全て）
     */
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

    /**
     * 統計情報を取得
     * @returns {Object} - 統計情報
     */
    getStats() {
        return {
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => u.status === 'active').length,
            totalApps: this.apps.length,
            activeApps: this.apps.filter(a => a.status === 'active').length,
            openIncidents: this.incidents.filter(i => i.status !== 'closed').length,
            pendingChanges: this.changes.filter(c => c.status === 'pending').length,
        };
    },

    /**
     * 全データをエクスポート
     * @returns {Object} - 全データ
     */
    exportAll() {
        return {
            users: this.users,
            apps: this.apps,
            incidents: this.incidents,
            changes: this.changes,
            logs: this.logs,
            exportedAt: new Date().toISOString(),
        };
    },

    /**
     * データをインポート
     * @param {Object} data - インポートデータ
     */
    importAll(data) {
        if (data.users) {
            this.users = data.users;
        }
        if (data.apps) {
            this.apps = data.apps;
        }
        if (data.incidents) {
            this.incidents = data.incidents;
        }
        if (data.changes) {
            this.changes = data.changes;
        }
        if (data.logs) {
            this.logs = data.logs;
        }
        this.saveAll();
    },
};

// DataStore初期化
DataStore.init();

const ApiSync = {
    isReadOnly: false,
    timerId: null,

    loadSettings() {
        const savedSettings = localStorage.getItem('appsuiteSettings');
        const settings = savedSettings ? JSON.parse(savedSettings) : {};
        return settings.api || {};
    },

    applySettings() {
        const apiSettings = this.loadSettings();
        ApiConfig.baseUrl = apiSettings.url || '';
        ApiConfig.apiKey = apiSettings.key || '';
        ApiConfig.authMethod = apiSettings.authMethod || 'bearer';
        ApiConfig.timeout = (apiSettings.timeout || 30) * 1000;

        this.isReadOnly = Boolean(apiSettings.url);
        this.applyReadOnlyState();

        this.stopAutoSync();
        const interval = parseInt(apiSettings.syncInterval || 0);
        if (apiSettings.url && interval > 0) {
            this.startAutoSync(interval);
        }
    },

    applyReadOnlyState() {
        const addUserButton = document.getElementById('addUserButton');
        const addAppButton = document.getElementById('addAppButton');
        if (addUserButton) {
            addUserButton.disabled = this.isReadOnly;
        }
        if (addAppButton) {
            addAppButton.disabled = this.isReadOnly;
        }

        if (window.UserModule) {
            UserModule.refresh();
        }
        if (window.AppModule) {
            AppModule.refresh();
        }
    },

    startAutoSync(intervalMinutes) {
        this.timerId = setInterval(
            async () => {
                await this.syncAll();
            },
            intervalMinutes * 60 * 1000
        );
    },

    stopAutoSync() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    },

    async syncAll() {
        if (!ApiConfig.baseUrl) {
            showToast('API URLが未設定です', 'error');
            return;
        }

        try {
            await this.syncUsers();
            await this.syncApps();
            updateConnectionStatus(true);
            document.getElementById('apiStatus').textContent = '接続中';
            document.getElementById('apiStatus').style.color = '#22c55e';
            document.getElementById('lastSync').textContent = new Date().toLocaleString('ja-JP');
            if (window.updateDashboard) {
                updateDashboard();
            }
            showToast('同期が完了しました', 'success');
        } catch (error) {
            updateConnectionStatus(false);
            showToast('同期に失敗しました: ' + error.message, 'error');
        }
    },

    async syncUsers() {
        const response = await Api.get('', { cmd: 'getuser' });
        if (response.status !== 'success' || !Array.isArray(response.users)) {
            throw new Error('ユーザー同期に失敗しました');
        }

        DataStore.users = response.users.map(user => ({
            id: user.userid,
            username: user.name,
            email: user.email,
            department: user.dept || '',
            role: 'ユーザー',
            status: 'active',
            lastLogin: '-',
        }));
        if (window.UserModule) {
            UserModule.refresh();
        }
    },

    async syncApps() {
        const response = await Api.get('', { cmd: 'getapps' });
        if (response.status !== 'success' || !Array.isArray(response.apps)) {
            throw new Error('アプリ同期に失敗しました');
        }

        const today = new Date().toISOString().split('T')[0];
        DataStore.apps = response.apps.map(app => ({
            id: app.appid,
            name: app.name,
            category: 'その他',
            creator: '',
            records: app.recordcount || 0,
            status: 'active',
            updated: today,
            description: '',
        }));
        if (window.AppModule) {
            AppModule.refresh();
        }
    },
};

function initApiSync() {
    ApiSync.applySettings();
}

// ユーティリティ
function updateConnectionStatus(connected) {
    const status = document.getElementById('connectionStatus');
    if (connected) {
        status.innerHTML = '<i class="fas fa-circle"></i> 接続中';
        status.classList.add('connected');
    } else {
        status.innerHTML = '<i class="fas fa-circle"></i> 未接続';
        status.classList.remove('connected');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function toggleApiKey() {
    const input = document.getElementById('apiKey');
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Export to global scope for testing
window.DataStore = DataStore;
window.ApiConfig = ApiConfig;
window.ApiSync = ApiSync;
