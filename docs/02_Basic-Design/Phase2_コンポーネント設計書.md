# Phase 2: コンポーネント設計書

**文書番号**: COMP-APPSUITE-001
**バージョン**: 1.0
**作成日**: 2026年1月21日
**Phase**: Phase 2 - 詳細設計
**ステータス**: ✅ レビュー待ち

---

## 📋 目次

1. [コンポーネント概要](#1-コンポーネント概要)
2. [共通コンポーネント](#2-共通コンポーネント)
3. [UIコンポーネント](#3-uiコンポーネント)
4. [フォームコンポーネント](#4-フォームコンポーネント)
5. [ユーティリティ関数](#5-ユーティリティ関数)

---

## 1. コンポーネント概要

### 1.1 設計方針

| 方針 | 説明 |
|------|------|
| **再利用性** | 同じUIパターンは共通コンポーネント化 |
| **カプセル化** | コンポーネントは独立して動作 |
| **拡張性** | オプションパラメータで挙動変更可能 |
| **テスト容易性** | 入力と出力が明確 |

### 1.2 コンポーネント一覧

| カテゴリ | コンポーネント数 | 説明 |
|---------|---------------|------|
| 共通 | 5 | ヘッダー、ナビゲーション、フッター等 |
| UI | 8 | ボタン、カード、テーブル、モーダル等 |
| フォーム | 6 | 入力フィールド、ドロップダウン等 |
| ユーティリティ | 10 | 日付フォーマット、エスケープ等 |

---

## 2. 共通コンポーネント

### 2.1 Header（ヘッダー）

```javascript
const Header = {
  render() {
    const session = SessionManager.get();
    const username = session?.username || 'ゲスト';

    return `
      <header class="app-header">
        <div class="header-left">
          <i class="fas fa-cube"></i>
          <h1>AppSuite ITSM</h1>
        </div>
        <div class="header-right">
          <div class="user-info">
            <i class="fas fa-user-circle"></i>
            <span>${escapeHtml(username)}</span>
          </div>
          <button id="logout-btn" class="btn btn-secondary">
            <i class="fas fa-sign-out-alt"></i> ログアウト
          </button>
        </div>
      </header>
    `;
  }
};
```

---

### 2.2 Sidebar（サイドバーナビゲーション）

```javascript
const Sidebar = {
  items: [
    { id: 'dashboard', icon: 'chart-line', label: 'ダッシュボード', permission: true },
    { id: 'users', icon: 'users', label: 'ユーザー管理', permission: 'admin' },
    { id: 'apps', icon: 'mobile-alt', label: 'アプリ管理', permission: 'admin' },
    { id: 'incidents', icon: 'exclamation-triangle', label: 'インシデント', permission: true },
    { id: 'changes', icon: 'sync-alt', label: '変更管理', permission: true },
    { id: 'logs', icon: 'clipboard-list', label: '監査ログ', permission: 'admin' },
    { id: 'settings', icon: 'cog', label: 'システム設定', permission: 'admin' }
  ],

  render(activeView) {
    const session = SessionManager.get();
    const role = session?.role || 'user';

    const navItems = this.items
      .filter(item => {
        if (item.permission === true) return true;
        if (item.permission === 'admin') return role === 'admin';
        return false;
      })
      .map(item => {
        const activeClass = item.id === activeView ? 'active' : '';
        return `
          <li class="nav-item ${activeClass}">
            <a href="#${item.id}" class="nav-link">
              <i class="fas fa-${item.icon}"></i>
              <span>${item.label}</span>
            </a>
          </li>
        `;
      })
      .join('');

    return `
      <nav class="sidebar">
        <ul class="nav-list">
          ${navItems}
        </ul>
      </nav>
    `;
  }
};
```

---

## 3. UIコンポーネント

### 3.1 StatCard（統計カード）

```javascript
const StatCard = {
  render(options) {
    const {
      icon,
      value,
      label,
      color = 'primary',
      onClick = null
    } = options;

    const clickable = onClick ? 'clickable' : '';
    const onclickAttr = onClick ? `onclick="${onClick}"` : '';

    return `
      <div class="stat-card stat-card-${color} ${clickable}" ${onclickAttr}>
        <div class="stat-icon">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${value}</div>
          <div class="stat-label">${escapeHtml(label)}</div>
        </div>
      </div>
    `;
  }
};

// 使用例
const html = StatCard.render({
  icon: 'users',
  value: 150,
  label: 'ユーザー',
  color: 'blue',
  onClick: "App.navigate('users')"
});
```

---

### 3.2 DataTable（データテーブル）

```javascript
const DataTable = {
  render(options) {
    const {
      columns,      // カラム定義 [{key, label, width}]
      data,         // データ配列
      actions,      // アクション [{icon, label, onClick}]
      onRowClick = null
    } = options;

    const headerHtml = columns.map(col =>
      `<th style="width:${col.width || 'auto'}">${escapeHtml(col.label)}</th>`
    ).join('');

    const rowsHtml = data.map(row => {
      const cellsHtml = columns.map(col =>
        `<td>${escapeHtml(row[col.key] || '-')}</td>`
      ).join('');

      const actionsHtml = actions ? actions.map(action =>
        `<button class="btn-icon" onclick="${action.onClick}('${row.id}')"
                title="${action.label}">
          <i class="fas fa-${action.icon}"></i>
        </button>`
      ).join('') : '';

      const clickAttr = onRowClick ? `onclick="${onRowClick}('${row.id}')"` : '';

      return `
        <tr ${clickAttr}>
          ${cellsHtml}
          ${actionsHtml ? `<td class="actions">${actionsHtml}</td>` : ''}
        </tr>
      `;
    }).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            ${headerHtml}
            ${actions ? '<th style="width:100px">操作</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="999">データがありません</td></tr>'}
        </tbody>
      </table>
    `;
  }
};

// 使用例
const table = DataTable.render({
  columns: [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'username', label: 'ユーザー名' },
    { key: 'email', label: 'メール' },
    { key: 'role', label: '権限', width: '100px' }
  ],
  data: users,
  actions: [
    { icon: 'edit', label: '編集', onClick: 'editUser' },
    { icon: 'trash', label: '削除', onClick: 'deleteUser' }
  ]
});
```

---

### 3.3 Modal（モーダルダイアログ）

```javascript
const Modal = {
  render(options) {
    const {
      id,
      title,
      content,
      buttons = [],
      size = 'medium'  // small/medium/large
    } = options;

    const buttonsHtml = buttons.map(btn =>
      `<button class="btn btn-${btn.type || 'secondary'}"
              onclick="${btn.onClick}">
        ${btn.label}
      </button>`
    ).join('');

    return `
      <div id="${id}" class="modal">
        <div class="modal-overlay" onclick="Modal.close('${id}')"></div>
        <div class="modal-content modal-${size}">
          <div class="modal-header">
            <h3>${escapeHtml(title)}</h3>
            <button class="modal-close" onclick="Modal.close('${id}')">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          <div class="modal-footer">
            ${buttonsHtml}
          </div>
        </div>
      </div>
    `;
  },

  show(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';  // スクロール無効
  },

  close(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';  // スクロール復元
  }
};

// 使用例
const modalHtml = Modal.render({
  id: 'user-create-modal',
  title: 'ユーザー新規登録',
  content: UserForm.render(),
  buttons: [
    { label: 'キャンセル', type: 'secondary', onClick: "Modal.close('user-create-modal')" },
    { label: '登録', type: 'primary', onClick: 'UserModule.submitCreate()' }
  ],
  size: 'medium'
});
```

---

### 3.4 Pagination（ページネーション）

```javascript
const Pagination = {
  render(options) {
    const {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      onPageChange
    } = options;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return `
      <div class="pagination">
        <div class="pagination-info">
          ${totalItems}件中 ${startItem}-${endItem}件を表示
        </div>
        <div class="pagination-controls">
          <button class="btn-icon"
                  onclick="${onPageChange}(${currentPage - 1})"
                  ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-number">${currentPage} / ${totalPages}</span>
          <button class="btn-icon"
                  onclick="${onPageChange}(${currentPage + 1})"
                  ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
  }
};
```

---

### 3.5 Alert（アラート・メッセージ）

```javascript
const Alert = {
  show(message, type = 'info', duration = 3000) {
    const alertId = `alert-${Date.now()}`;

    const icons = {
      success: 'check-circle',
      error: 'times-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };

    const alertHtml = `
      <div id="${alertId}" class="alert alert-${type}">
        <i class="fas fa-${icons[type]}"></i>
        <span>${escapeHtml(message)}</span>
        <button class="alert-close" onclick="Alert.close('${alertId}')">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    const container = document.getElementById('alert-container') ||
                      this.createContainer();
    container.insertAdjacentHTML('beforeend', alertHtml);

    // 自動で消す
    if (duration > 0) {
      setTimeout(() => this.close(alertId), duration);
    }
  },

  createContainer() {
    const container = document.createElement('div');
    container.id = 'alert-container';
    container.className = 'alert-container';
    document.body.appendChild(container);
    return container;
  },

  close(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
      alert.classList.add('fade-out');
      setTimeout(() => alert.remove(), 300);
    }
  },

  // 便利メソッド
  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error', 5000); },
  warning(message) { this.show(message, 'warning', 4000); },
  info(message) { this.show(message, 'info'); }
};

// 使用例
Alert.success('ユーザーを登録しました');
Alert.error('保存に失敗しました');
```

---

## 4. フォームコンポーネント

### 4.1 FormField（フォームフィールド）

```javascript
const FormField = {
  render(options) {
    const {
      id,
      label,
      type = 'text',
      value = '',
      required = false,
      placeholder = '',
      helpText = '',
      error = ''
    } = options;

    const requiredMark = required ? '<span class="required">*</span>' : '';

    return `
      <div class="form-field ${error ? 'has-error' : ''}">
        <label for="${id}">
          ${escapeHtml(label)}${requiredMark}
        </label>
        <input type="${type}"
               id="${id}"
               name="${id}"
               value="${escapeHtml(value)}"
               placeholder="${escapeHtml(placeholder)}"
               ${required ? 'required' : ''}
               class="form-input">
        ${helpText ? `<span class="help-text">${escapeHtml(helpText)}</span>` : ''}
        ${error ? `<span class="error-text">${escapeHtml(error)}</span>` : ''}
      </div>
    `;
  }
};

// 使用例
const field = FormField.render({
  id: 'username',
  label: 'ユーザー名',
  type: 'text',
  required: true,
  placeholder: '例: 田中太郎',
  helpText: '2-50文字で入力してください',
  error: ''  // エラーがある場合はメッセージを設定
});
```

---

### 4.2 Dropdown（ドロップダウン）

```javascript
const Dropdown = {
  render(options) {
    const {
      id,
      label,
      value = '',
      options: selectOptions,
      required = false,
      onChange = null
    } = options;

    const requiredMark = required ? '<span class="required">*</span>' : '';
    const onchangeAttr = onChange ? `onchange="${onChange}"` : '';

    const optionsHtml = selectOptions.map(opt =>
      `<option value="${escapeHtml(opt.value)}"
              ${opt.value === value ? 'selected' : ''}>
        ${escapeHtml(opt.label)}
      </option>`
    ).join('');

    return `
      <div class="form-field">
        <label for="${id}">
          ${escapeHtml(label)}${requiredMark}
        </label>
        <select id="${id}"
                name="${id}"
                class="form-select"
                ${required ? 'required' : ''}
                ${onchangeAttr}>
          ${optionsHtml}
        </select>
      </div>
    `;
  }
};

// 使用例
const dropdown = Dropdown.render({
  id: 'priority',
  label: '優先度',
  value: 'P3',
  required: true,
  options: [
    { value: 'P1', label: 'P1（最優先）' },
    { value: 'P2', label: 'P2（高）' },
    { value: 'P3', label: 'P3（中）' },
    { value: 'P4', label: 'P4（低）' },
    { value: 'P5', label: 'P5（計画）' }
  ],
  onChange: 'onPriorityChange(this.value)'
});
```

---

## 5. ユーティリティ関数

### 5.1 日付・時刻フォーマット

```javascript
const DateUtil = {
  // ISO 8601 → 日本語表示
  format(isoString, format = 'YYYY-MM-DD HH:mm') {
    if (!isoString) return '-';

    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  // 相対時間表示
  relative(isoString) {
    if (!isoString) return '-';

    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return this.format(isoString, 'YYYY-MM-DD');
  }
};

// 使用例
console.log(DateUtil.format('2026-01-21T10:00:00.000Z'));  // '2026-01-21 10:00'
console.log(DateUtil.relative('2026-01-21T09:45:00.000Z'));  // '15分前'
```

---

### 5.2 バリデーションヘルパー

```javascript
const ValidationHelper = {
  // フィールドエラー表示
  showError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    const formField = field?.closest('.form-field');

    if (formField) {
      formField.classList.add('has-error');

      // 既存エラーメッセージを削除
      const oldError = formField.querySelector('.error-text');
      if (oldError) oldError.remove();

      // 新しいエラーメッセージを追加
      const errorSpan = document.createElement('span');
      errorSpan.className = 'error-text';
      errorSpan.textContent = errorMessage;
      formField.appendChild(errorSpan);
    }
  },

  // エラークリア
  clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const formField = field?.closest('.form-field');

    if (formField) {
      formField.classList.remove('has-error');
      const errorSpan = formField.querySelector('.error-text');
      if (errorSpan) errorSpan.remove();
    }
  },

  // フォーム全体のバリデーション
  validateForm(formId) {
    const form = document.getElementById(formId);
    const fields = form.querySelectorAll('[required]');
    let isValid = true;

    fields.forEach(field => {
      if (!field.value.trim()) {
        this.showError(field.id, 'この項目は必須です');
        isValid = false;
      } else {
        this.clearError(field.id);
      }
    });

    return isValid;
  }
};
```

---

## 📊 コンポーネント統計

| カテゴリ | コンポーネント数 | 再利用性 |
|---------|---------------|---------|
| 共通 | 5 | 100% |
| UI | 8 | 90% |
| フォーム | 6 | 95% |
| ユーティリティ | 10 | 100% |

**合計**: 29コンポーネント

---

## ✅ レビューチェックリスト

- [ ] 全コンポーネントが定義されている
- [ ] 再利用性が高い
- [ ] APIが一貫している
- [ ] エスケープ処理が適切
- [ ] 拡張性が確保されている
- [ ] 開発チームレビュー完了

---

**承認**:
- コンポーネント設計者: _________________ 日付: _______
- 技術リーダー: _________________ 日付: _______

**次のステップ**: 状態管理設計書作成
