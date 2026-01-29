/**
 * AppSuite ITSM管理システム - パフォーマンス最適化モジュール
 * Sprint 5: API強化、キャッシュ、遅延読み込み、メトリクス
 */

// ========================================
// APIキャッシュマネージャー
// ========================================
const ApiCache = {
    cache: new Map(),
    maxAge: 5 * 60 * 1000, // デフォルト5分
    maxSize: 100, // 最大キャッシュエントリ数

    /**
     * キャッシュからデータを取得
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {return null;}

        // 有効期限チェック
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        entry.hits++;
        return entry.data;
    },

    /**
     * キャッシュにデータを保存
     */
    set(key, data, ttl = this.maxAge) {
        // キャッシュサイズ制限
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            createdAt: Date.now(),
            expiresAt: Date.now() + ttl,
            hits: 0
        });
    },

    /**
     * キャッシュを無効化
     */
    invalidate(keyPattern) {
        if (typeof keyPattern === 'string') {
            this.cache.delete(keyPattern);
        } else if (keyPattern instanceof RegExp) {
            for (const key of this.cache.keys()) {
                if (keyPattern.test(key)) {
                    this.cache.delete(key);
                }
            }
        }
    },

    /**
     * 全キャッシュをクリア
     */
    clear() {
        this.cache.clear();
    },

    /**
     * 最も古いエントリを削除
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    },

    /**
     * キャッシュ統計を取得
     */
    getStats() {
        let totalHits = 0;
        let expiredCount = 0;
        const now = Date.now();

        for (const entry of this.cache.values()) {
            totalHits += entry.hits;
            if (now > entry.expiresAt) {expiredCount++;}
        }

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            totalHits,
            expiredCount
        };
    }
};

// ========================================
// リクエスト重複排除
// ========================================
const RequestDeduplicator = {
    pending: new Map(),

    /**
     * リクエストを実行（重複は排除）
     */
    async execute(key, requestFn) {
        // 同じリクエストが進行中の場合は待機
        if (this.pending.has(key)) {
            return this.pending.get(key);
        }

        const promise = requestFn()
            .finally(() => {
                this.pending.delete(key);
            });

        this.pending.set(key, promise);
        return promise;
    },

    /**
     * 進行中のリクエスト数を取得
     */
    getPendingCount() {
        return this.pending.size;
    }
};

// ========================================
// リトライ機構付きAPIクライアント
// ========================================
const EnhancedApi = {
    defaultRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,

    /**
     * リトライ付きGETリクエスト
     */
    async get(endpoint, options = {}) {
        const cacheKey = `GET:${endpoint}:${JSON.stringify(options.params || {})}`;

        // キャッシュチェック
        if (options.cache !== false) {
            const cached = ApiCache.get(cacheKey);
            if (cached) {
                PerformanceMetrics.recordCacheHit();
                return cached;
            }
        }

        const result = await this.requestWithRetry('GET', endpoint, options);

        // キャッシュに保存
        if (options.cache !== false) {
            ApiCache.set(cacheKey, result, options.cacheTtl);
        }

        return result;
    },

    /**
     * POSTリクエスト（キャッシュなし）
     */
    async post(endpoint, data, options = {}) {
        return this.requestWithRetry('POST', endpoint, { ...options, data });
    },

    /**
     * PUTリクエスト
     */
    async put(endpoint, data, options = {}) {
        return this.requestWithRetry('PUT', endpoint, { ...options, data });
    },

    /**
     * DELETEリクエスト
     */
    async delete(endpoint, options = {}) {
        return this.requestWithRetry('DELETE', endpoint, options);
    },

    /**
     * リトライ付きリクエスト実行
     */
    async requestWithRetry(method, endpoint, options = {}) {
        const maxRetries = options.retries ?? this.defaultRetries;
        const requestKey = `${method}:${endpoint}:${Date.now()}`;

        return RequestDeduplicator.execute(requestKey, async () => {
            let lastError;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const startTime = performance.now();
                    const result = await this.executeRequest(method, endpoint, options);
                    const duration = performance.now() - startTime;

                    PerformanceMetrics.recordApiCall(endpoint, duration, true);
                    return result;
                } catch (error) {
                    lastError = error;
                    PerformanceMetrics.recordApiCall(endpoint, 0, false);

                    // リトライ不可能なエラー
                    if (this.isNonRetryableError(error)) {
                        throw error;
                    }

                    // 最後の試行でない場合は待機
                    if (attempt < maxRetries) {
                        const delay = this.calculateDelay(attempt);
                        console.log(`[EnhancedApi] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
                        await this.sleep(delay);
                    }
                }
            }

            throw lastError;
        });
    },

    /**
     * 実際のリクエスト実行
     */
    async executeRequest(method, endpoint, options) {
        // ApiConfigが存在しない場合のフォールバック
        const baseUrl = typeof ApiConfig !== 'undefined' ? ApiConfig.baseUrl : '';
        const timeout = options.timeout || (typeof ApiConfig !== 'undefined' ? ApiConfig.timeout : 30000);

        if (!baseUrl) {
            // ローカルデモモード - DataStoreを使用
            return this.handleLocalRequest(method, endpoint, options);
        }

        const url = new URL(endpoint, baseUrl);
        const headers = this.getHeaders();

        const fetchOptions = {
            method,
            headers
        };

        if (options.params && method === 'GET') {
            Object.entries(options.params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }

        if (options.data && method !== 'GET') {
            fetchOptions.body = JSON.stringify(options.data);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        fetchOptions.signal = controller.signal;

        try {
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                throw error;
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

    /**
     * ローカルリクエスト処理（デモモード）
     */
    handleLocalRequest(method, endpoint, options) {
        // DataStoreを使用したローカル処理
        const segments = endpoint.split('/').filter(Boolean);
        const resource = segments[0];
        const id = segments[1];

        if (typeof DataStore === 'undefined') {
            throw new Error('DataStore is not available');
        }

        switch (method) {
        case 'GET':
            if (id) {
                return DataStore.findById(resource, id);
            }
            return DataStore[resource] || [];

        case 'POST':
            return DataStore.create(resource, options.data);

        case 'PUT':
            return DataStore.update(resource, id, options.data);

        case 'DELETE':
            return DataStore.delete(resource, id);

        default:
            throw new Error(`Unsupported method: ${method}`);
        }
    },

    /**
     * リクエストヘッダー取得
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (typeof ApiConfig !== 'undefined' && ApiConfig.apiKey) {
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
        }

        return headers;
    },

    /**
     * リトライ不可能なエラーか判定
     */
    isNonRetryableError(error) {
        // 4xx系エラー（認証エラーなど）はリトライしない
        if (error.status >= 400 && error.status < 500) {
            return true;
        }
        return false;
    },

    /**
     * 指数バックオフでディレイを計算
     */
    calculateDelay(attempt) {
        const delay = this.baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        return Math.min(delay + jitter, this.maxDelay);
    },

    /**
     * スリープ
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// ========================================
// パフォーマンスメトリクス
// ========================================
const PerformanceMetrics = {
    metrics: {
        apiCalls: [],
        cacheHits: 0,
        cacheMisses: 0,
        renderTimes: [],
        errors: []
    },
    maxHistory: 100,

    /**
     * API呼び出しを記録
     */
    recordApiCall(endpoint, duration, success) {
        this.metrics.apiCalls.push({
            endpoint,
            duration,
            success,
            timestamp: Date.now()
        });

        // 履歴制限
        if (this.metrics.apiCalls.length > this.maxHistory) {
            this.metrics.apiCalls.shift();
        }

        if (!success) {
            this.metrics.cacheMisses++;
        }
    },

    /**
     * キャッシュヒットを記録
     */
    recordCacheHit() {
        this.metrics.cacheHits++;
    },

    /**
     * レンダリング時間を記録
     */
    recordRenderTime(component, duration) {
        this.metrics.renderTimes.push({
            component,
            duration,
            timestamp: Date.now()
        });

        if (this.metrics.renderTimes.length > this.maxHistory) {
            this.metrics.renderTimes.shift();
        }
    },

    /**
     * エラーを記録
     */
    recordError(error, context) {
        this.metrics.errors.push({
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now()
        });

        if (this.metrics.errors.length > this.maxHistory) {
            this.metrics.errors.shift();
        }
    },

    /**
     * 統計を取得
     */
    getStats() {
        const apiCalls = this.metrics.apiCalls;
        const successfulCalls = apiCalls.filter(c => c.success);

        return {
            totalApiCalls: apiCalls.length,
            successfulApiCalls: successfulCalls.length,
            failedApiCalls: apiCalls.length - successfulCalls.length,
            averageResponseTime: successfulCalls.length > 0
                ? successfulCalls.reduce((sum, c) => sum + c.duration, 0) / successfulCalls.length
                : 0,
            cacheHitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0
                ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
                : 0,
            cacheHits: this.metrics.cacheHits,
            cacheMisses: this.metrics.cacheMisses,
            recentErrors: this.metrics.errors.slice(-10)
        };
    },

    /**
     * メトリクスをリセット
     */
    reset() {
        this.metrics = {
            apiCalls: [],
            cacheHits: 0,
            cacheMisses: 0,
            renderTimes: [],
            errors: []
        };
    }
};

// ========================================
// 遅延読み込みユーティリティ
// ========================================
const LazyLoader = {
    observers: new Map(),

    /**
     * 要素の遅延読み込みを設定
     */
    observe(element, callback, options = {}) {
        if (!('IntersectionObserver' in window)) {
            // フォールバック: 即座に実行
            callback(element);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                    this.observers.delete(element);
                }
            });
        }, {
            rootMargin: options.rootMargin || '100px',
            threshold: options.threshold || 0.1
        });

        observer.observe(element);
        this.observers.set(element, observer);
    },

    /**
     * 監視を解除
     */
    unobserve(element) {
        const observer = this.observers.get(element);
        if (observer) {
            observer.unobserve(element);
            this.observers.delete(element);
        }
    },

    /**
     * 全ての監視を解除
     */
    disconnect() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
};

// ========================================
// デバウンス・スロットル
// ========================================
const RateLimitUtils = {
    /**
     * デバウンス
     */
    debounce(fn, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * スロットル
     */
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

    /**
     * 一定時間後に1回だけ実行
     */
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

// ========================================
// メモ化ユーティリティ
// ========================================
const Memoize = {
    /**
     * 関数の結果をメモ化
     */
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

    /**
     * TTL付きメモ化
     */
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

// ========================================
// パフォーマンスモニター
// ========================================
const PerformanceMonitor = {
    enabled: true,
    marks: new Map(),

    /**
     * 計測開始
     */
    start(name) {
        if (!this.enabled) {return;}
        this.marks.set(name, performance.now());
    },

    /**
     * 計測終了して時間を返す
     */
    end(name) {
        if (!this.enabled) {return 0;}

        const startTime = this.marks.get(name);
        if (!startTime) {return 0;}

        const duration = performance.now() - startTime;
        this.marks.delete(name);

        PerformanceMetrics.recordRenderTime(name, duration);
        return duration;
    },

    /**
     * 関数の実行時間を計測
     */
    measure(name, fn) {
        this.start(name);
        const result = fn();
        const duration = this.end(name);

        if (duration > 100) {
            console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
        }

        return result;
    },

    /**
     * 非同期関数の実行時間を計測
     */
    async measureAsync(name, fn) {
        this.start(name);
        try {
            return await fn();
        } finally {
            const duration = this.end(name);
            if (duration > 100) {
                console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
            }
        }
    }
};

// ========================================
// 初期化
// ========================================
const PerformanceOptimizer = {
    init() {
        console.log('[PerformanceOptimizer] 初期化完了');

        // 定期的なキャッシュクリーンアップ
        setInterval(() => {
            const stats = ApiCache.getStats();
            if (stats.expiredCount > 0) {
                console.log(`[PerformanceOptimizer] Cleaning ${stats.expiredCount} expired cache entries`);
                // 期限切れエントリを削除
                for (const [key, entry] of ApiCache.cache.entries()) {
                    if (Date.now() > entry.expiresAt) {
                        ApiCache.cache.delete(key);
                    }
                }
            }
        }, 60000); // 1分ごと
    },

    /**
     * パフォーマンスレポートを取得
     */
    getReport() {
        return {
            cache: ApiCache.getStats(),
            metrics: PerformanceMetrics.getStats(),
            pendingRequests: RequestDeduplicator.getPendingCount()
        };
    },

    /**
     * 全てリセット
     */
    reset() {
        ApiCache.clear();
        PerformanceMetrics.reset();
    }
};

// グローバルエクスポート
if (typeof window !== 'undefined') {
    window.ApiCache = ApiCache;
    window.EnhancedApi = EnhancedApi;
    window.PerformanceMetrics = PerformanceMetrics;
    window.LazyLoader = LazyLoader;
    window.RateLimitUtils = RateLimitUtils;
    window.Memoize = Memoize;
    window.PerformanceMonitor = PerformanceMonitor;
    window.PerformanceOptimizer = PerformanceOptimizer;
}
