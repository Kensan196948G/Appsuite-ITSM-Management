/**
 * Jest テストセットアップファイル
 * テスト実行前の共通設定と初期化
 */

// グローバルモックの設定

// localStorageのモック
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: jest.fn((i) => Object.keys(store)[i] || null),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// sessionStorageのモック
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: jest.fn((i) => Object.keys(store)[i] || null),
    };
})();

Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
});

// TextEncoder/TextDecoder のポリフィル（Node.js 11+で標準提供）
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Web Crypto API のモック（実際の crypto.subtle を使用）
const { webcrypto } = require('crypto');
Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: (arr) => {
            return webcrypto.getRandomValues(arr);
        },
        subtle: webcrypto.subtle
    },
});

// console.error をモック（エラーログのテスト用）
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
};

// テスト前にストレージをクリア
beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
});

// グローバルヘルパー関数
global.createMockElement = (tagName, attributes = {}) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'textContent') {
            element.textContent = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    return element;
};
