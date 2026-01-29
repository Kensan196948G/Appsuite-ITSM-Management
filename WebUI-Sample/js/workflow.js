/**
 * WorkflowEngine - ワークフローエンジン
 *
 * ステータス遷移管理、SLA監視、エスカレーション処理を担当
 *
 * @version 1.0.0
 * @since Sprint 3
 */

const WorkflowEngine = {
    // ========================================
    // 設定定数
    // ========================================

    /** SLA監視間隔（ミリ秒）- 1分 */
    SLA_CHECK_INTERVAL: 60000,

    /** SLA監視タイマーID */
    slaTimerId: null,

    /** 初期化済みフラグ */
    initialized: false,

    // ========================================
    // ステータス遷移ルール
    // ========================================

    /**
     * インシデントステータス遷移ルール
     * キー: 現在のステータス
     * 値: 遷移可能なステータスの配列
     */
    INCIDENT_TRANSITIONS: {
        open: ['in_progress', 'closed'],
        in_progress: ['resolved', 'open'],
        resolved: ['closed', 'in_progress'],
        closed: ['in_progress']
    },

    /**
     * インシデントステータスの表示名
     */
    INCIDENT_STATUS_LABELS: {
        open: 'オープン',
        in_progress: '対応中',
        resolved: '解決済み',
        closed: 'クローズ'
    },

    /**
     * 変更要求ステータス遷移ルール
     */
    CHANGE_TRANSITIONS: {
        draft: ['pending'],
        pending: ['approved', 'rejected'],
        approved: ['in_progress'],
        in_progress: ['completed'],
        completed: [],
        rejected: []
    },

    /**
     * 変更要求ステータスの表示名
     */
    CHANGE_STATUS_LABELS: {
        draft: '下書き',
        pending: '承認待ち',
        approved: '承認済み',
        in_progress: '実施中',
        completed: '完了',
        rejected: '却下'
    },

    // ========================================
    // SLA定義
    // ========================================

    /**
     * SLA定義（ミリ秒）
     * response: 応答時間（最初の対応まで）
     * resolution: 解決時間（クローズまで）
     */
    SLA_DEFINITIONS: {
        high: {
            response: 1 * 60 * 60 * 1000,      // 1時間
            resolution: 4 * 60 * 60 * 1000     // 4時間
        },
        medium: {
            response: 4 * 60 * 60 * 1000,      // 4時間
            resolution: 24 * 60 * 60 * 1000    // 24時間
        },
        low: {
            response: 24 * 60 * 60 * 1000,     // 24時間
            resolution: 72 * 60 * 60 * 1000    // 72時間
        }
    },

    // ========================================
    // 初期化・クリーンアップ
    // ========================================

    /**
     * ワークフローエンジンを初期化
     */
    init() {
        if (this.initialized) {
            console.warn('WorkflowEngine: 既に初期化されています');
            return;
        }

        console.log('WorkflowEngine: 初期化開始');

        // SLA監視を開始
        this.startSlaMonitoring();

        this.initialized = true;
        console.log('WorkflowEngine: 初期化完了');
    },

    /**
     * クリーンアップ処理
     */
    cleanup() {
        this.stopSlaMonitoring();
        this.initialized = false;
        console.log('WorkflowEngine: クリーンアップ完了');
    },

    // ========================================
    // ステータス遷移検証
    // ========================================

    /**
     * インシデントのステータス遷移を検証
     * @param {string} fromStatus - 現在のステータス
     * @param {string} toStatus - 遷移先ステータス
     * @returns {Object} { valid: boolean, message: string }
     */
    isValidIncidentTransition(fromStatus, toStatus) {
        // 同一ステータスへの遷移は常に許可
        if (fromStatus === toStatus) {
            return { valid: true, message: '' };
        }

        const allowedTransitions = this.INCIDENT_TRANSITIONS[fromStatus] || [];
        const valid = allowedTransitions.includes(toStatus);

        if (valid) {
            return { valid: true, message: '' };
        }

        const fromLabel = this.INCIDENT_STATUS_LABELS[fromStatus] || fromStatus;
        const toLabel = this.INCIDENT_STATUS_LABELS[toStatus] || toStatus;

        return {
            valid: false,
            message: `「${fromLabel}」から「${toLabel}」への遷移は許可されていません`
        };
    },

    /**
     * 変更要求のステータス遷移を検証
     * @param {string} fromStatus - 現在のステータス
     * @param {string} toStatus - 遷移先ステータス
     * @returns {Object} { valid: boolean, message: string }
     */
    isValidChangeTransition(fromStatus, toStatus) {
        // 同一ステータスへの遷移は常に許可
        if (fromStatus === toStatus) {
            return { valid: true, message: '' };
        }

        const allowedTransitions = this.CHANGE_TRANSITIONS[fromStatus] || [];
        const valid = allowedTransitions.includes(toStatus);

        if (valid) {
            return { valid: true, message: '' };
        }

        const fromLabel = this.CHANGE_STATUS_LABELS[fromStatus] || fromStatus;
        const toLabel = this.CHANGE_STATUS_LABELS[toStatus] || toStatus;

        return {
            valid: false,
            message: `「${fromLabel}」から「${toLabel}」への遷移は許可されていません`
        };
    },

    /**
     * 利用可能な遷移先を取得
     * @param {string} type - 'incident' または 'change'
     * @param {string} currentStatus - 現在のステータス
     * @returns {Array<{value: string, label: string}>} 遷移可能なステータス一覧
     */
    getAvailableTransitions(type, currentStatus) {
        let transitions, labels;

        if (type === 'incident') {
            transitions = this.INCIDENT_TRANSITIONS[currentStatus] || [];
            labels = this.INCIDENT_STATUS_LABELS;
        } else if (type === 'change') {
            transitions = this.CHANGE_TRANSITIONS[currentStatus] || [];
            labels = this.CHANGE_STATUS_LABELS;
        } else {
            return [];
        }

        // 現在のステータスも選択肢に含める
        const result = [{
            value: currentStatus,
            label: labels[currentStatus] || currentStatus
        }];

        transitions.forEach(status => {
            result.push({
                value: status,
                label: labels[status] || status
            });
        });

        return result;
    },

    // ========================================
    // SLA管理
    // ========================================

    /**
     * SLA監視を開始
     */
    startSlaMonitoring() {
        if (this.slaTimerId) {
            console.warn('WorkflowEngine: SLA監視は既に開始されています');
            return;
        }

        // 初回チェック
        this.checkSlaViolations();

        // 定期チェック開始
        this.slaTimerId = setInterval(() => {
            this.checkSlaViolations();
            this.processEscalations();
        }, this.SLA_CHECK_INTERVAL);

        console.log('WorkflowEngine: SLA監視を開始しました（間隔: 1分）');
    },

    /**
     * SLA監視を停止
     */
    stopSlaMonitoring() {
        if (this.slaTimerId) {
            clearInterval(this.slaTimerId);
            this.slaTimerId = null;
            console.log('WorkflowEngine: SLA監視を停止しました');
        }
    },

    /**
     * インシデントのSLAステータスを取得
     * @param {Object} incident - インシデントオブジェクト
     * @returns {Object} { status: 'ok'|'warning'|'breach', remaining: number|null, deadline: Date|null, message: string }
     */
    getSlaStatus(incident) {
        // クローズ済みまたは解決済みはSLA対象外
        if (incident.status === 'closed' || incident.status === 'resolved') {
            return {
                status: 'completed',
                remaining: null,
                deadline: null,
                message: 'SLA評価完了'
            };
        }

        const priority = incident.priority || 'medium';
        const sla = this.SLA_DEFINITIONS[priority];

        if (!sla) {
            return {
                status: 'unknown',
                remaining: null,
                deadline: null,
                message: 'SLA定義なし'
            };
        }

        // 作成日時を取得
        const created = new Date(incident.created || incident.createdAt || incident.reportedAt);
        if (isNaN(created.getTime())) {
            return {
                status: 'unknown',
                remaining: null,
                deadline: null,
                message: '作成日時不明'
            };
        }

        const now = new Date();
        const deadline = new Date(created.getTime() + sla.resolution);
        const remaining = deadline.getTime() - now.getTime();

        let status = 'ok';
        let message = '';

        if (remaining <= 0) {
            status = 'breach';
            message = `SLA超過: ${this.formatDuration(Math.abs(remaining))}超過`;
        } else if (remaining <= sla.resolution * 0.25) {
            status = 'warning';
            message = `SLA警告: 残り${this.formatDuration(remaining)}`;
        } else {
            message = `残り${this.formatDuration(remaining)}`;
        }

        return { status, remaining, deadline, message };
    },

    /**
     * SLA期限を計算
     * @param {Object} incident - インシデントオブジェクト
     * @returns {Object} { response: Date, resolution: Date }
     */
    calculateSlaDeadline(incident) {
        const priority = incident.priority || 'medium';
        const sla = this.SLA_DEFINITIONS[priority];
        const created = new Date(incident.created || incident.createdAt || incident.reportedAt);

        return {
            response: new Date(created.getTime() + sla.response),
            resolution: new Date(created.getTime() + sla.resolution)
        };
    },

    /**
     * SLA違反をチェック
     * @returns {Object} { violations: Array, warnings: Array }
     */
    checkSlaViolations() {
        // DataStoreが利用可能かチェック
        if (typeof DataStore === 'undefined' || !DataStore.incidents) {
            return { violations: [], warnings: [] };
        }

        const activeIncidents = DataStore.incidents.filter(i =>
            i.status !== 'closed' && i.status !== 'resolved'
        );

        const violations = [];
        const warnings = [];

        activeIncidents.forEach(incident => {
            const slaStatus = this.getSlaStatus(incident);

            if (slaStatus.status === 'breach') {
                violations.push({
                    incident,
                    slaStatus
                });
            } else if (slaStatus.status === 'warning') {
                warnings.push({
                    incident,
                    slaStatus
                });
            }
        });

        // 通知処理（NotificationManagerが利用可能な場合）
        if (typeof NotificationManager !== 'undefined') {
            if (violations.length > 0) {
                NotificationManager.notifySlaViolation(violations.map(v => v.incident));
            }
            if (warnings.length > 0) {
                NotificationManager.notifySlaWarning(warnings.map(w => w.incident));
            }
        }

        return { violations, warnings };
    },

    // ========================================
    // エスカレーション処理
    // ========================================

    /**
     * エスカレーション処理を実行
     */
    processEscalations() {
        // DataStoreとSettingsModuleが利用可能かチェック
        if (typeof DataStore === 'undefined' || !DataStore.incidents) {
            return;
        }

        // 設定からエスカレーション期限を取得
        let escalationHours = 24; // デフォルト24時間
        if (typeof SettingsModule !== 'undefined') {
            const settings = SettingsModule.load();
            escalationHours = settings.workflow?.incidentEscalation || 24;
        }

        const escalationMs = escalationHours * 60 * 60 * 1000;

        // オープン状態かつ未エスカレートのインシデントを取得
        const candidates = DataStore.incidents.filter(i =>
            i.status === 'open' && !i.escalated
        );

        const now = new Date();

        candidates.forEach(incident => {
            const created = new Date(incident.created || incident.createdAt || incident.reportedAt);

            if (now.getTime() - created.getTime() > escalationMs) {
                this.escalateIncident(incident);
            }
        });
    },

    /**
     * インシデントをエスカレート
     * @param {Object} incident - インシデントオブジェクト
     */
    escalateIncident(incident) {
        incident.escalated = true;
        incident.escalatedAt = new Date().toISOString();

        // 自動アサイン（設定がある場合）
        if (typeof SettingsModule !== 'undefined') {
            const settings = SettingsModule.load();
            if (settings.workflow?.incidentAutoAssign && settings.workflow?.incidentDefaultAssignee) {
                incident.assignee = settings.workflow.incidentDefaultAssignee;
            }
        }

        // 通知
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.notifyEscalation(incident);
        }

        // ログ記録
        if (typeof LogModule !== 'undefined') {
            LogModule.addLog('escalation', 'インシデント', 'incident',
                `エスカレーション: ${incident.id} - ${incident.title}`);
        }

        console.log(`WorkflowEngine: インシデント ${incident.id} をエスカレートしました`);
    },

    /**
     * エスカレーションレベルを取得
     * @param {Object} incident - インシデントオブジェクト
     * @returns {number} エスカレーションレベル（0-3）
     */
    getEscalationLevel(incident) {
        if (!incident.escalated) {
            return 0; // 未エスカレート
        }

        const escalatedAt = new Date(incident.escalatedAt);
        const now = new Date();
        const hoursSinceEscalation = (now.getTime() - escalatedAt.getTime()) / (60 * 60 * 1000);

        if (hoursSinceEscalation < 2) {
            return 1; // レベル1: エスカレート直後
        } else if (hoursSinceEscalation < 8) {
            return 2; // レベル2: 2-8時間
        } else {
            return 3; // レベル3: 8時間以上
        }
    },

    // ========================================
    // ユーティリティ
    // ========================================

    /**
     * 時間をフォーマット
     * @param {number} ms - ミリ秒
     * @returns {string} フォーマットされた時間文字列
     */
    formatDuration(ms) {
        if (ms < 0) {ms = 0;}

        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days}日${remainingHours}時間`;
        } else if (hours > 0) {
            return `${hours}時間${minutes}分`;
        } else {
            return `${minutes}分`;
        }
    },

    /**
     * ステータスバッジのクラスを取得
     * @param {string} slaStatus - SLAステータス
     * @returns {string} CSSクラス名
     */
    getSlaStatusBadgeClass(slaStatus) {
        switch (slaStatus) {
        case 'ok':
            return 'badge-success';
        case 'warning':
            return 'badge-warning';
        case 'breach':
            return 'badge-danger';
        case 'completed':
            return 'badge-info';
        default:
            return 'badge-secondary';
        }
    },

    /**
     * ステータスバッジのアイコンを取得
     * @param {string} slaStatus - SLAステータス
     * @returns {string} Font Awesomeアイコンクラス
     */
    getSlaStatusIcon(slaStatus) {
        switch (slaStatus) {
        case 'ok':
            return 'fa-check-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'breach':
            return 'fa-times-circle';
        case 'completed':
            return 'fa-flag-checkered';
        default:
            return 'fa-question-circle';
        }
    }
};

// グローバルに公開
window.WorkflowEngine = WorkflowEngine;
