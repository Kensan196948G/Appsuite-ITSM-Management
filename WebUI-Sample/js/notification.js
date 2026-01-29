/**
 * NotificationManager - 通知システム
 *
 * ブラウザ通知API統合、通知履歴管理、UIレンダリングを担当
 *
 * @version 1.0.0
 * @since Sprint 3
 */

const NotificationManager = {
    // ========================================
    // 設定定数
    // ========================================

    /** 通知履歴のlocalStorageキー */
    STORAGE_KEY: 'appsuite_notifications',

    /** 通知履歴の最大保持数 */
    MAX_HISTORY: 100,

    /** 通知パネルが開いているか */
    isPanelOpen: false,

    /** ブラウザ通知の許可状態 */
    permission: null,

    /** 通知履歴 */
    history: [],

    /** 初期化済みフラグ */
    initialized: false,

    /** 最後の通知ID（重複防止用） */
    lastNotificationIds: new Set(),

    // ========================================
    // 初期化・クリーンアップ
    // ========================================

    /**
     * 通知システムを初期化
     */
    init() {
        if (this.initialized) {
            console.warn('NotificationManager: 既に初期化されています');
            return;
        }

        console.log('NotificationManager: 初期化開始');

        // 履歴を読み込み
        this.loadHistory();

        // ブラウザ通知のサポート確認
        if ('Notification' in window) {
            this.permission = Notification.permission;
        } else {
            this.permission = 'unsupported';
        }

        // 通知ベルをレンダリング
        this.renderNotificationBell();

        this.initialized = true;
        console.log('NotificationManager: 初期化完了（権限: ' + this.permission + '）');
    },

    /**
     * クリーンアップ処理
     */
    cleanup() {
        this.saveHistory();
        this.initialized = false;
        console.log('NotificationManager: クリーンアップ完了');
    },

    // ========================================
    // 権限管理
    // ========================================

    /**
     * ブラウザ通知の許可をリクエスト
     * @returns {Promise<string>} 許可状態
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            if (typeof showToast === 'function') {
                showToast('このブラウザはデスクトップ通知をサポートしていません', 'warning');
            }
            return 'unsupported';
        }

        try {
            const result = await Notification.requestPermission();
            this.permission = result;

            if (typeof showToast === 'function') {
                if (result === 'granted') {
                    showToast('デスクトップ通知が有効になりました', 'success');
                } else if (result === 'denied') {
                    showToast('通知が拒否されました。ブラウザの設定から変更できます。', 'warning');
                }
            }

            return result;
        } catch (error) {
            console.error('NotificationManager: 権限リクエストエラー', error);
            return 'error';
        }
    },

    // ========================================
    // 通知送信
    // ========================================

    /**
     * 通知を送信（汎用）
     * @param {Object} options - 通知オプション
     * @param {string} options.title - タイトル
     * @param {string} options.body - 本文
     * @param {string} options.type - 通知タイプ
     * @param {string} [options.icon] - アイコンURL
     * @param {Object} [options.data] - 追加データ
     * @param {boolean} [options.silent=false] - Toastを表示しない
     */
    send(options) {
        const { title, body, type, icon, data, silent = false } = options;

        // 設定チェック
        if (!this.isEnabled(type)) {
            return;
        }

        // 重複チェック（同じIDの通知を短時間で繰り返さない）
        const notificationKey = `${type}_${data?.id || ''}_${Math.floor(Date.now() / 60000)}`;
        if (this.lastNotificationIds.has(notificationKey)) {
            return;
        }
        this.lastNotificationIds.add(notificationKey);

        // 古いキーを削除（最大50件保持）
        if (this.lastNotificationIds.size > 50) {
            const iterator = this.lastNotificationIds.values();
            this.lastNotificationIds.delete(iterator.next().value);
        }

        // 通知オブジェクトを作成
        const notification = {
            id: this.generateId(),
            title,
            body,
            type,
            data: data || {},
            timestamp: new Date().toISOString(),
            read: false
        };

        // 履歴に追加
        this.addToHistory(notification);

        // ブラウザ通知を送信
        if (this.permission === 'granted') {
            try {
                const browserNotif = new Notification(title, {
                    body,
                    icon: icon || '/favicon.ico',
                    tag: notification.id,
                    requireInteraction: type === 'high_priority' || type === 'sla_violation'
                });

                browserNotif.onclick = () => {
                    window.focus();
                    if (data?.section && typeof showSection === 'function') {
                        showSection(data.section);
                    }
                    browserNotif.close();
                };

                // 自動クローズ（5秒後）
                setTimeout(() => browserNotif.close(), 5000);
            } catch (error) {
                console.error('NotificationManager: ブラウザ通知送信エラー', error);
            }
        }

        // Toast表示
        if (!silent && typeof showToast === 'function') {
            const toastType = this.getToastType(type);
            showToast(body, toastType, 5000);
        }

        // UI更新
        this.renderNotificationBell();
    },

    /**
     * 通知タイプからToastタイプを取得
     * @param {string} type - 通知タイプ
     * @returns {string} Toastタイプ
     */
    getToastType(type) {
        switch (type) {
        case 'sla_violation':
        case 'high_priority':
        case 'escalation':
            return 'error';
        case 'sla_warning':
            return 'warning';
        case 'change_approved':
        case 'incident_resolved':
            return 'success';
        default:
            return 'info';
        }
    },

    // ========================================
    // 通知トリガー
    // ========================================

    /**
     * 新規インシデント通知
     * @param {Object} incident - インシデントオブジェクト
     */
    notifyIncidentCreated(incident) {
        this.send({
            title: '新規インシデント',
            body: `${incident.id}: ${incident.title}`,
            type: 'incident_new',
            data: { section: 'incidents', id: incident.id }
        });
    },

    /**
     * 高優先度インシデント通知
     * @param {Object} incident - インシデントオブジェクト
     */
    notifyHighPriorityIncident(incident) {
        this.send({
            title: '緊急: 高優先度インシデント',
            body: `${incident.id}: ${incident.title}`,
            type: 'high_priority',
            data: { section: 'incidents', id: incident.id }
        });
    },

    /**
     * 担当者割当通知
     * @param {Object} incident - インシデントオブジェクト
     */
    notifyAssignment(incident) {
        this.send({
            title: 'インシデント割当',
            body: `${incident.id} が ${incident.assignee} に割り当てられました`,
            type: 'assignment',
            data: { section: 'incidents', id: incident.id }
        });
    },

    /**
     * ステータス変更通知
     * @param {Object} item - アイテムオブジェクト
     * @param {string} type - 'incident' または 'change'
     * @param {string} newStatus - 新しいステータス
     */
    notifyStatusChange(item, type, newStatus) {
        const typeLabel = type === 'incident' ? 'インシデント' : '変更要求';
        const statusLabel = this.getStatusLabel(type, newStatus);

        this.send({
            title: `${typeLabel}ステータス更新`,
            body: `${item.id}: ${statusLabel}`,
            type: `${type}_status_change`,
            data: { section: type === 'incident' ? 'incidents' : 'changes', id: item.id }
        });
    },

    /**
     * SLA警告通知
     * @param {Array} incidents - 警告対象のインシデント配列
     */
    notifySlaWarning(incidents) {
        if (incidents.length === 0) {return;}

        this.send({
            title: 'SLA警告',
            body: `${incidents.length}件のインシデントがSLA期限に近づいています`,
            type: 'sla_warning',
            data: { section: 'incidents', ids: incidents.map(i => i.id) }
        });
    },

    /**
     * SLA違反通知
     * @param {Array} incidents - 違反インシデント配列
     */
    notifySlaViolation(incidents) {
        if (incidents.length === 0) {return;}

        this.send({
            title: 'SLA違反',
            body: `${incidents.length}件のインシデントがSLAを超過しています`,
            type: 'sla_violation',
            data: { section: 'incidents', ids: incidents.map(i => i.id) }
        });
    },

    /**
     * 変更要求承認依頼通知
     * @param {Object} change - 変更要求オブジェクト
     */
    notifyChangeApproval(change) {
        this.send({
            title: '承認依頼',
            body: `${change.id}: ${change.title} の承認が必要です`,
            type: 'change_approval',
            data: { section: 'changes', id: change.id }
        });
    },

    /**
     * 変更要求承認完了通知
     * @param {Object} change - 変更要求オブジェクト
     * @param {string} decision - 'approved' または 'rejected'
     */
    notifyChangeDecision(change, decision) {
        const isApproved = decision === 'approved';

        this.send({
            title: isApproved ? '変更要求承認' : '変更要求却下',
            body: `${change.id}: ${change.title}`,
            type: isApproved ? 'change_approved' : 'change_rejected',
            data: { section: 'changes', id: change.id }
        });
    },

    /**
     * エスカレーション通知
     * @param {Object} incident - インシデントオブジェクト
     */
    notifyEscalation(incident) {
        this.send({
            title: 'エスカレーション',
            body: `${incident.id}: ${incident.title} がエスカレートされました`,
            type: 'escalation',
            data: { section: 'incidents', id: incident.id }
        });
    },

    // ========================================
    // 履歴管理
    // ========================================

    /**
     * 履歴を読み込み
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            this.history = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('NotificationManager: 履歴読み込みエラー', error);
            this.history = [];
        }
    },

    /**
     * 履歴を保存
     */
    saveHistory() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
        } catch (error) {
            console.error('NotificationManager: 履歴保存エラー', error);
        }
    },

    /**
     * 履歴に追加
     * @param {Object} notification - 通知オブジェクト
     */
    addToHistory(notification) {
        this.history.unshift(notification);

        // 上限を超えたら古いものを削除
        if (this.history.length > this.MAX_HISTORY) {
            this.history = this.history.slice(0, this.MAX_HISTORY);
        }

        this.saveHistory();
    },

    /**
     * 履歴を取得
     * @param {Object} [filter] - フィルタ条件
     * @returns {Array} 通知履歴
     */
    getHistory(filter = {}) {
        let result = [...this.history];

        if (filter.type) {
            result = result.filter(n => n.type === filter.type);
        }

        if (filter.unreadOnly) {
            result = result.filter(n => !n.read);
        }

        if (filter.limit) {
            result = result.slice(0, filter.limit);
        }

        return result;
    },

    /**
     * 履歴をクリア
     */
    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderNotificationBell();

        if (typeof showToast === 'function') {
            showToast('通知履歴をクリアしました', 'success');
        }
    },

    /**
     * 通知を既読にする
     * @param {string} id - 通知ID
     */
    markAsRead(id) {
        const notification = this.history.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.saveHistory();
            this.renderNotificationBell();
        }
    },

    /**
     * すべての通知を既読にする
     */
    markAllAsRead() {
        this.history.forEach(n => n.read = true);
        this.saveHistory();
        this.renderNotificationBell();
    },

    /**
     * 未読数を取得
     * @returns {number} 未読数
     */
    getUnreadCount() {
        return this.history.filter(n => !n.read).length;
    },

    // ========================================
    // UI
    // ========================================

    /**
     * 通知ベルをレンダリング
     */
    renderNotificationBell() {
        const bellElement = document.getElementById('notificationBell');
        if (!bellElement) {return;}

        const unread = this.getUnreadCount();
        let badge = bellElement.querySelector('.notification-badge');

        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            bellElement.appendChild(badge);
        }

        badge.textContent = unread > 99 ? '99+' : unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
    },

    /**
     * 通知パネルを開く
     */
    openNotificationPanel() {
        // 既存のパネルがあれば削除
        const existingPanel = document.getElementById('notificationPanel');
        if (existingPanel) {
            existingPanel.remove();
            this.isPanelOpen = false;
            return;
        }

        // 権限がない場合はリクエスト
        if (this.permission === 'default') {
            this.requestPermission();
        }

        // パネルを作成
        const panel = document.createElement('div');
        panel.id = 'notificationPanel';
        panel.className = 'notification-panel';

        const notifications = this.getHistory({ limit: 20 });

        panel.innerHTML = `
            <div class="notification-panel-header">
                <h3>通知</h3>
                <div class="notification-panel-actions">
                    <button class="btn btn-sm" onclick="NotificationManager.markAllAsRead()">
                        <i class="fas fa-check-double"></i> すべて既読
                    </button>
                    <button class="btn btn-sm" onclick="NotificationManager.clearHistory()">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm" onclick="NotificationManager.closeNotificationPanel()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="notification-panel-body">
                ${notifications.length === 0
        ? '<p class="notification-empty">通知はありません</p>'
        : notifications.map(n => this.renderNotificationItem(n)).join('')
}
            </div>
            <div class="notification-panel-footer">
                ${this.permission !== 'granted'
        ? `<button class="btn btn-primary btn-sm" onclick="NotificationManager.requestPermission()">
                        <i class="fas fa-bell"></i> デスクトップ通知を有効化
                       </button>`
        : '<span class="text-muted"><i class="fas fa-check"></i> デスクトップ通知: 有効</span>'
}
            </div>
        `;

        // ベルボタンの位置を基準にパネルを配置
        const bellElement = document.getElementById('notificationBell');
        if (bellElement) {
            const rect = bellElement.getBoundingClientRect();
            panel.style.position = 'fixed';
            panel.style.top = (rect.bottom + 10) + 'px';
            panel.style.right = '20px';
        }

        document.body.appendChild(panel);
        this.isPanelOpen = true;

        // パネル外クリックで閉じる
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick);
        }, 100);
    },

    /**
     * 通知パネルを閉じる
     */
    closeNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.remove();
        }
        this.isPanelOpen = false;
        document.removeEventListener('click', this.handleOutsideClick);
    },

    /**
     * パネル外クリックハンドラ
     * @param {Event} event - クリックイベント
     */
    handleOutsideClick(event) {
        const panel = document.getElementById('notificationPanel');
        const bell = document.getElementById('notificationBell');

        if (panel && !panel.contains(event.target) && !bell?.contains(event.target)) {
            NotificationManager.closeNotificationPanel();
        }
    },

    /**
     * 通知アイテムをレンダリング
     * @param {Object} notification - 通知オブジェクト
     * @returns {string} HTML文字列
     */
    renderNotificationItem(notification) {
        const icon = this.getNotificationIcon(notification.type);
        const timeAgo = this.formatTimeAgo(notification.timestamp);
        const readClass = notification.read ? 'read' : 'unread';

        return `
            <div class="notification-item ${readClass}" onclick="NotificationManager.handleNotificationClick('${notification.id}')">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${this.escapeHtml(notification.title)}</div>
                    <div class="notification-body">${this.escapeHtml(notification.body)}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
            </div>
        `;
    },

    /**
     * 通知クリックハンドラ
     * @param {string} id - 通知ID
     */
    handleNotificationClick(id) {
        const notification = this.history.find(n => n.id === id);
        if (!notification) {return;}

        // 既読にする
        this.markAsRead(id);

        // セクションに移動
        if (notification.data?.section && typeof showSection === 'function') {
            showSection(notification.data.section);
        }

        // パネルを閉じる
        this.closeNotificationPanel();
    },

    /**
     * 通知アイコンを取得
     * @param {string} type - 通知タイプ
     * @returns {string} アイコンクラス
     */
    getNotificationIcon(type) {
        const icons = {
            incident_new: 'fa-exclamation-circle',
            high_priority: 'fa-fire',
            assignment: 'fa-user-check',
            incident_status_change: 'fa-exchange-alt',
            change_status_change: 'fa-exchange-alt',
            sla_warning: 'fa-clock',
            sla_violation: 'fa-exclamation-triangle',
            change_approval: 'fa-clipboard-check',
            change_approved: 'fa-check-circle',
            change_rejected: 'fa-times-circle',
            escalation: 'fa-arrow-up'
        };

        return icons[type] || 'fa-bell';
    },

    /**
     * ステータスラベルを取得
     * @param {string} type - 'incident' または 'change'
     * @param {string} status - ステータス値
     * @returns {string} ステータスラベル
     */
    getStatusLabel(type, status) {
        if (typeof WorkflowEngine !== 'undefined') {
            if (type === 'incident') {
                return WorkflowEngine.INCIDENT_STATUS_LABELS[status] || status;
            } else {
                return WorkflowEngine.CHANGE_STATUS_LABELS[status] || status;
            }
        }
        return status;
    },

    // ========================================
    // 設定連携
    // ========================================

    /**
     * 通知タイプが有効かチェック
     * @param {string} type - 通知タイプ
     * @returns {boolean} 有効かどうか
     */
    isEnabled(type) {
        // SettingsModuleが利用可能な場合は設定をチェック
        if (typeof SettingsModule !== 'undefined') {
            const settings = SettingsModule.load();
            const notification = settings.notification || {};

            // タイプ別の設定マッピング
            const settingMap = {
                incident_new: notification.notifyIncidentNew !== false,
                high_priority: notification.notifyIncidentHigh !== false,
                sla_warning: notification.notifyIncidentNew !== false,
                sla_violation: notification.notifyIncidentNew !== false,
                change_approval: notification.notifyChangeApproval !== false,
                change_approved: notification.notifyChangeComplete !== false,
                change_rejected: notification.notifyChangeComplete !== false,
                escalation: notification.notifyIncidentNew !== false
            };

            return settingMap[type] !== false;
        }

        // SettingsModuleがない場合はすべて有効
        return true;
    },

    // ========================================
    // ユーティリティ
    // ========================================

    /**
     * ユニークIDを生成
     * @returns {string} ID
     */
    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 相対時間をフォーマット
     * @param {string} timestamp - タイムスタンプ
     * @returns {string} 相対時間
     */
    formatTimeAgo(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'たった今';
        } else if (diffMins < 60) {
            return `${diffMins}分前`;
        } else if (diffHours < 24) {
            return `${diffHours}時間前`;
        } else if (diffDays < 7) {
            return `${diffDays}日前`;
        } else {
            return date.toLocaleDateString('ja-JP');
        }
    },

    /**
     * HTMLエスケープ
     * @param {string} str - 文字列
     * @returns {string} エスケープされた文字列
     */
    escapeHtml(str) {
        if (typeof str !== 'string') {return '';}
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// グローバルに公開
window.NotificationManager = NotificationManager;
