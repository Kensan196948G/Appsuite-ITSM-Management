# Phase 2: 状態管理設計書

**文書番号**: STATE-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年1月21日
**Phase**: Phase 2 - 詳細設計
**ステータス**: ✅ レビュー待ち

---

## 📋 目次

1. [状態管理概要](#1-状態管理概要)
2. [状態の種類](#2-状態の種類)
3. [セッション状態](#3-セッション状態)
4. [アプリケーション状態](#4-アプリケーション状態)
5. [UI状態](#5-ui状態)
6. [状態の同期](#6-状態の同期)

---

## 1. 状態管理概要

### 1.1 状態管理の目的

| 目的 | 説明 |
|------|------|
| **一貫性** | アプリケーション全体で状態を一元管理 |
| **予測可能性** | 状態の変更フローが明確 |
| **デバッグ容易性** | 状態の変化を追跡可能 |
| **パフォーマンス** | 不要な再描画を防ぐ |

### 1.2 状態管理パターン

**採用パターン**: **シンプルなObserverパターン**

理由:
- Vanilla JavaScriptでの実装が容易
- 複雑なライブラリ（Redux等）不要
- 学習コストが低い
- 保守性が高い

---

## 2. 状態の種類

### 2.1 状態の分類

```
状態
├── セッション状態（sessionStorage）
│   ├── 認証情報
│   ├── 現在のユーザー
│   └── セッション有効期限
│
├── アプリケーション状態（メモリ）
│   ├── 現在のビュー
│   ├── データキャッシュ
│   └── フィルタ・検索条件
│
└── UI状態（メモリ）
    ├── モーダルの開閉状態
    ├── ページング情報
    └── ソート状態
```

---

## 3. セッション状態

### 3.1 SessionState設計

```javascript
const SessionState = {
  // セッション状態の構造
  state: {
    isAuthenticated: false,
    user: null,
    loginTime: null,
    expiresAt: null
  },

  // 初期化
  init() {
    const sessionData = sessionStorage.getItem('appsuite_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);

      // 有効期限チェック
      if (new Date(session.expiresAt) > new Date()) {
        this.state = {
          isAuthenticated: true,
          user: {
            id: session.userId,
            username: session.username,
            role: session.role
          },
          loginTime: session.loginTime,
          expiresAt: session.expiresAt
        };
      } else {
        this.clear();
      }
    }
  },

  // ログイン
  login(user) {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    this.state = {
      isAuthenticated: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      loginTime: new Date().toISOString(),
      expiresAt
    };

    // sessionStorageに保存
    sessionStorage.setItem('appsuite_session', JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
      loginTime: this.state.loginTime,
      expiresAt
    }));

    // 監査ログ
    LogModule.log('LOGIN', 'SESSION', user.id);
  },

  // ログアウト
  logout() {
    const userId = this.state.user?.id;

    this.clear();

    // 監査ログ
    if (userId) {
      LogModule.log('LOGOUT', 'SESSION', userId);
    }
  },

  // クリア
  clear() {
    this.state = {
      isAuthenticated: false,
      user: null,
      loginTime: null,
      expiresAt: null
    };
    sessionStorage.removeItem('appsuite_session');
  },

  // 認証確認
  isAuthenticated() {
    return this.state.isAuthenticated;
  },

  // 権限確認
  hasRole(role) {
    return this.state.user?.role === role;
  }
};
```

---

## 4. アプリケーション状態

### 4.1 AppState設計

```javascript
const AppState = {
  // アプリケーション状態
  state: {
    currentView: 'dashboard',
    previousView: null,
    dataCache: {},
    filters: {},
    searchQuery: '',
    pagination: {
      currentPage: 1,
      itemsPerPage: 25
    }
  },

  // 購読者（Observer）
  subscribers: [],

  // 状態変更
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    // 購読者に通知
    this.notify(oldState, this.state);
  },

  // ビュー変更
  setView(viewName) {
    this.setState({
      previousView: this.state.currentView,
      currentView: viewName,
      // ビュー変更時にページをリセット
      pagination: {
        ...this.state.pagination,
        currentPage: 1
      }
    });
  },

  // フィルタ設定
  setFilter(key, value) {
    this.setState({
      filters: {
        ...this.state.filters,
        [key]: value
      },
      // フィルタ変更時にページをリセット
      pagination: {
        ...this.state.pagination,
        currentPage: 1
      }
    });
  },

  // ページ変更
  setPage(pageNumber) {
    this.setState({
      pagination: {
        ...this.state.pagination,
        currentPage: pageNumber
      }
    });
  },

  // 購読（状態変更の監視）
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      // 購読解除
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  },

  // 通知
  notify(oldState, newState) {
    this.subscribers.forEach(callback => {
      callback(newState, oldState);
    });
  }
};

// 使用例
AppState.subscribe((newState, oldState) => {
  if (newState.currentView !== oldState.currentView) {
    console.log('View changed:', oldState.currentView, '->', newState.currentView);
    App.render();  // 画面再描画
  }
});
```

---

## 5. UI状態

### 5.1 UIState設計

```javascript
const UIState = {
  state: {
    modals: {},          // モーダルの開閉状態
    loading: false,      // ローディング状態
    sidebarOpen: true,   // サイドバーの開閉
    activeTooltip: null  // アクティブなツールチップ
  },

  // モーダル開閉
  openModal(modalId) {
    this.state.modals[modalId] = true;
    Modal.show(modalId);
  },

  closeModal(modalId) {
    this.state.modals[modalId] = false;
    Modal.close(modalId);
  },

  isModalOpen(modalId) {
    return this.state.modals[modalId] || false;
  },

  // ローディング状態
  setLoading(isLoading) {
    this.state.loading = isLoading;

    const loadingOverlay = document.getElementById('loading-overlay');
    if (isLoading) {
      loadingOverlay?.classList.add('active');
    } else {
      loadingOverlay?.classList.remove('active');
    }
  },

  // サイドバートグル
  toggleSidebar() {
    this.state.sidebarOpen = !this.state.sidebarOpen;
    document.querySelector('.sidebar')?.classList.toggle('collapsed');
  }
};
```

---

## 6. 状態の同期

### 6.1 状態同期フロー

```
┌──────────────┐
│ユーザー操作  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│イベントハンドラ  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│状態更新          │
│AppState.setState()│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│購読者に通知      │
│notify()          │
└──────┬───────────┘
       │
       ├─→ UI再描画
       ├─→ データ再読み込み
       └─→ ログ記録
```

### 6.2 実装例

```javascript
// ユーザー一覧画面の状態管理

class UserListView {
  constructor() {
    // 状態変更を購読
    this.unsubscribe = AppState.subscribe((newState, oldState) => {
      // フィルタ変更時
      if (newState.filters !== oldState.filters) {
        this.reload();
      }

      // ページ変更時
      if (newState.pagination.currentPage !== oldState.pagination.currentPage) {
        this.reload();
      }
    });
  }

  // データ読み込み
  reload() {
    const { filters, searchQuery, pagination } = AppState.state;

    // ユーザー取得
    let users = UserModule.getAll();

    // 検索フィルタ適用
    if (searchQuery) {
      users = users.filter(u =>
        u.username.includes(searchQuery) ||
        u.email.includes(searchQuery)
      );
    }

    // ステータスフィルタ
    if (filters.status && filters.status !== 'all') {
      users = users.filter(u => u.status === filters.status);
    }

    // ページング
    const { currentPage, itemsPerPage } = pagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

    // 画面描画
    this.render(paginatedUsers, users.length);
  }

  render(users, totalCount) {
    // HTML生成
    const html = DataTable.render({
      columns: [...],
      data: users,
      actions: [...]
    });

    document.getElementById('user-table-container').innerHTML = html;
  }

  // クリーンアップ
  destroy() {
    this.unsubscribe();  // 購読解除
  }
}
```

---

## 📊 状態管理評価

### 長所

| 項目 | 説明 |
|------|------|
| **シンプル** | 複雑なライブラリ不要 |
| **軽量** | オーバーヘッドが小さい |
| **デバッグ容易** | 状態の変化が追跡しやすい |

### 短所と対策

| 短所 | 対策 |
|------|------|
| **タイムトラベル不可** | デバッグ時は状態ログを記録 |
| **複雑な状態管理困難** | 現時点の要件では問題なし |

---

## ✅ レビューチェックリスト

- [ ] 状態管理パターンが適切
- [ ] 状態の種類が明確
- [ ] 状態変更フローが理解しやすい
- [ ] パフォーマンスが考慮されている
- [ ] 技術リーダーレビュー完了

---

**承認**:
- 状態管理設計者: _________________ 日付: _______
- 技術リーダー: _________________ 日付: _______

**次のステップ**: テスト設計書作成
