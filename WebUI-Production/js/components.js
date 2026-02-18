/**
 * AppSuite 管理運用システム - 共通コンポーネント
 * Phase 3 Sprint 1: 共通コンポーネント実装
 */

/**
 * ページネーションコンポーネント
 */
const Pagination = {
    /**
     * ページネーションを生成
     * @param {Object} options - オプション
     * @param {number} options.currentPage - 現在のページ
     * @param {number} options.totalItems - 総アイテム数
     * @param {number} options.itemsPerPage - 1ページあたりのアイテム数
     * @param {Function} options.onPageChange - ページ変更時のコールバック
     * @returns {string} - HTML文字列
     */
    render(options) {
        const { currentPage, totalItems, itemsPerPage, containerId } = options;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages <= 1) {
            return '';
        }

        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);

        let html = `
            <div class="pagination-container">
                <div class="pagination-info">
                    ${totalItems}件中 ${startItem}-${endItem}件を表示
                </div>
                <div class="pagination-controls">
        `;

        // 前へボタン
        html += `
            <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}"
                    onclick="Pagination.goToPage('${containerId}', ${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // ページ番号
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="Pagination.goToPage('${containerId}', 1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}"
                        onclick="Pagination.goToPage('${containerId}', ${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="Pagination.goToPage('${containerId}', ${totalPages})">${totalPages}</button>`;
        }

        // 次へボタン
        html += `
            <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}"
                    onclick="Pagination.goToPage('${containerId}', ${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        html += `
                </div>
            </div>
        `;

        return html;
    },

    // ページ変更ハンドラー（各モジュールで上書き可能）
    handlers: {},

    /**
     * ハンドラーを登録
     * @param {string} containerId - コンテナID
     * @param {Function} handler - ページ変更ハンドラー
     */
    registerHandler(containerId, handler) {
        this.handlers[containerId] = handler;
    },

    /**
     * 指定ページに移動
     * @param {string} containerId - コンテナID
     * @param {number} page - ページ番号
     */
    goToPage(containerId, page) {
        const handler = this.handlers[containerId];
        if (handler) {
            handler(page);
        }
    },
};

/**
 * モーダルコンポーネント
 */
const Modal = {
    /**
     * モーダルを開く
     * @param {Object} options - オプション
     * @param {string} options.title - タイトル
     * @param {string} options.content - HTML内容
     * @param {Array} options.buttons - ボタン配列
     * @param {string} options.size - サイズ（'small', 'medium', 'large'）
     * @param {Function} options.onClose - 閉じた時のコールバック
     */
    open(options) {
        const { title, content, buttons = [], size = 'medium', onClose } = options;

        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;

        const footer = document.getElementById('modalFooter');
        footer.innerHTML = buttons
            .map(btn => {
                const onclick =
                    typeof btn.onclick === 'function'
                        ? `(${btn.onclick.toString()})()`
                        : btn.onclick;
                return `<button class="btn ${escapeHtml(btn.class || '')}" onclick="${escapeHtml(onclick)}">${escapeHtml(btn.text)}</button>`;
            })
            .join('');

        const modal = document.getElementById('modal');
        modal.className = `modal modal-${size}`;

        document.getElementById('modalOverlay').classList.add('active');

        this.onCloseCallback = onClose;
    },

    /**
     * モーダルを閉じる
     */
    close() {
        document.getElementById('modalOverlay').classList.remove('active');

        if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null;
        }
    },

    /**
     * 確認ダイアログを表示
     * @param {string} message - メッセージ
     * @param {Function} onConfirm - 確認時のコールバック
     * @param {Function} onCancel - キャンセル時のコールバック
     */
    confirm(message, onConfirm, onCancel) {
        this.open({
            title: '確認',
            content: `<p>${escapeHtml(message)}</p>`,
            size: 'small',
            buttons: [
                {
                    text: 'キャンセル',
                    class: 'btn-secondary',
                    onclick: () => {
                        Modal.close();
                        if (onCancel) {
                            onCancel();
                        }
                    },
                },
                {
                    text: '確認',
                    class: 'btn-primary',
                    onclick: () => {
                        Modal.close();
                        if (onConfirm) {
                            onConfirm();
                        }
                    },
                },
            ],
        });
    },

    /**
     * アラートダイアログを表示
     * @param {string} message - メッセージ
     * @param {string} type - タイプ（'info', 'success', 'warning', 'error'）
     */
    alert(message, type = 'info') {
        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
        };

        const colors = {
            info: 'var(--info-color)',
            success: 'var(--success-color)',
            warning: 'var(--warning-color)',
            error: 'var(--danger-color)',
        };

        this.open({
            title: type === 'error' ? 'エラー' : type === 'warning' ? '警告' : 'お知らせ',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas ${icons[type]}" style="font-size: 48px; color: ${colors[type]}; margin-bottom: 16px;"></i>
                    <p style="margin: 0;">${escapeHtml(message)}</p>
                </div>
            `,
            size: 'small',
            buttons: [
                {
                    text: 'OK',
                    class: 'btn-primary',
                    onclick: 'Modal.close()',
                },
            ],
        });
    },
};

/**
 * トーストコンポーネント（強化版）
 */
const Toast = {
    container: null,
    queue: [],
    maxVisible: 5,

    /**
     * 初期化
     */
    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    /**
     * トーストを表示
     * @param {string} message - メッセージ
     * @param {string} type - タイプ（'success', 'error', 'warning', 'info'）
     * @param {number} duration - 表示時間（ミリ秒）
     */
    show(message, type = 'info', duration = 3000) {
        if (!this.container) {
            this.init();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span class="toast-message">${escapeHtml(message)}</span>
            <button class="toast-close" onclick="Toast.dismiss(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // アニメーション開始
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自動削除
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        // 最大数を超えたら古いものを削除
        const toasts = this.container.querySelectorAll('.toast');
        if (toasts.length > this.maxVisible) {
            this.dismiss(toasts[0]);
        }
    },

    /**
     * トーストを削除
     * @param {HTMLElement} toast - トースト要素
     */
    dismiss(toast) {
        if (!toast || !toast.parentElement) {
            return;
        }

        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    },

    /**
     * 全トーストをクリア
     */
    clear() {
        if (!this.container) {
            return;
        }
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.dismiss(toast));
    },

    // ショートカットメソッド
    success(message, duration) {
        this.show(message, 'success', duration);
    },
    error(message, duration) {
        this.show(message, 'error', duration);
    },
    warning(message, duration) {
        this.show(message, 'warning', duration);
    },
    info(message, duration) {
        this.show(message, 'info', duration);
    },
};

/**
 * ローディングコンポーネント
 */
const Loading = {
    overlay: null,

    /**
     * ローディング表示
     * @param {string} message - メッセージ
     */
    show(message = '読み込み中...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${escapeHtml(message)}</p>
                </div>
            `;
            document.body.appendChild(this.overlay);
        } else {
            this.overlay.querySelector('.loading-message').textContent = message;
        }

        this.overlay.classList.add('active');
    },

    /**
     * ローディング非表示
     */
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    },

    /**
     * メッセージ更新
     * @param {string} message - 新しいメッセージ
     */
    updateMessage(message) {
        if (this.overlay) {
            this.overlay.querySelector('.loading-message').textContent = message;
        }
    },
};

/**
 * タブコンポーネント
 */
const Tabs = {
    /**
     * タブを初期化
     * @param {string} containerId - タブコンテナのID
     * @param {Function} onChange - タブ変更時のコールバック
     */
    init(containerId, onChange) {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        const tabs = container.querySelectorAll('.tab-button');
        const panels = container.querySelectorAll('.tab-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab;

                // タブ切り替え
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // パネル切り替え
                panels.forEach(p => {
                    p.classList.toggle('active', p.id === targetId);
                });

                if (onChange) {
                    onChange(targetId);
                }
            });
        });
    },
};

/**
 * ドロップダウンコンポーネント
 */
const Dropdown = {
    activeDropdown: null,

    /**
     * 初期化
     */
    init() {
        document.addEventListener('click', e => {
            if (this.activeDropdown && !this.activeDropdown.contains(e.target)) {
                this.close();
            }
        });
    },

    /**
     * ドロップダウンを開く
     * @param {HTMLElement} trigger - トリガー要素
     * @param {HTMLElement} dropdown - ドロップダウン要素
     */
    open(trigger, dropdown) {
        if (this.activeDropdown) {
            this.close();
        }

        dropdown.classList.add('active');
        this.activeDropdown = dropdown;

        // 位置調整
        const rect = trigger.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 8}px`;
        dropdown.style.left = `${rect.left}px`;
    },

    /**
     * ドロップダウンを閉じる
     */
    close() {
        if (this.activeDropdown) {
            this.activeDropdown.classList.remove('active');
            this.activeDropdown = null;
        }
    },

    /**
     * トグル
     * @param {HTMLElement} trigger - トリガー要素
     * @param {HTMLElement} dropdown - ドロップダウン要素
     */
    toggle(trigger, dropdown) {
        if (dropdown.classList.contains('active')) {
            this.close();
        } else {
            this.open(trigger, dropdown);
        }
    },
};

/**
 * テーブルソートコンポーネント
 */
const TableSort = {
    /**
     * テーブルをソート可能にする
     * @param {string} tableId - テーブルID
     * @param {Function} onSort - ソート時のコールバック
     */
    init(tableId, onSort) {
        const table = document.getElementById(tableId);
        if (!table) {
            return;
        }

        const headers = table.querySelectorAll('th[data-sortable]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                const currentDir = header.dataset.sortDir || 'none';
                const newDir = currentDir === 'asc' ? 'desc' : 'asc';

                // 他のヘッダーのソート状態をリセット
                headers.forEach(h => {
                    h.dataset.sortDir = 'none';
                    h.classList.remove('sort-asc', 'sort-desc');
                });

                // 現在のヘッダーのソート状態を設定
                header.dataset.sortDir = newDir;
                header.classList.add(`sort-${newDir}`);

                if (onSort) {
                    onSort(column, newDir);
                }
            });
        });
    },
};

/**
 * 検索ハイライトコンポーネント
 */
const SearchHighlight = {
    /**
     * テキスト内の検索文字列をハイライト
     * @param {string} text - 対象テキスト
     * @param {string} search - 検索文字列
     * @returns {string} - ハイライトされたHTML
     */
    highlight(text, search) {
        if (!search || !text) {
            return escapeHtml(text);
        }

        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearch})`, 'gi');
        const escaped = escapeHtml(text);

        return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
    },
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
    Dropdown.init();
});
