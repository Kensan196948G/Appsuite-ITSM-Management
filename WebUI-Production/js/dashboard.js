/**
 * AppSuite 管理運用システム - ダッシュボードモジュール
 * Phase 3 Sprint 2: ダッシュボード強化・リアルタイム更新・グラフ/チャート
 */

/**
 * ダッシュボードマネージャー
 * グラフ、リアルタイム更新、ウィジェット管理を統括
 */
const DashboardManager = {
    // 更新間隔（ミリ秒）
    UPDATE_INTERVAL: 30000, // 30秒

    // 更新タイマーID
    updateTimer: null,

    // Chart.jsインスタンス
    charts: {
        incidentTrend: null,
        appStatus: null,
        incidentPriority: null,
        changeType: null,
        weeklyActivity: null,
    },

    // ウィジェット設定
    widgets: [],

    /**
     * 初期化
     */
    init() {
        this.loadWidgetSettings();
        this.initCharts();
        this.startAutoUpdate();
        this.initWidgetControls();

        // ページ離脱時にタイマー停止
        window.addEventListener('beforeunload', () => this.stopAutoUpdate());
    },

    /**
     * グラフ初期化
     */
    initCharts() {
        // Chart.jsが読み込まれているか確認
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Charts will not be displayed.');
            return;
        }

        // グローバル設定
        Chart.defaults.font.family = "'Noto Sans JP', 'Hiragino Sans', sans-serif";
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;

        // 各チャートを初期化
        this.initIncidentTrendChart();
        this.initAppStatusChart();
        this.initIncidentPriorityChart();
        this.initChangeTypeChart();
        this.initWeeklyActivityChart();
    },

    /**
     * インシデントトレンドチャート（折れ線グラフ）
     */
    initIncidentTrendChart() {
        const ctx = document.getElementById('incidentTrendChart');
        if (!ctx) {
            return;
        }

        const data = this.getIncidentTrendData();

        this.charts.incidentTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: '新規',
                        data: data.newIncidents,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: '解決済み',
                        data: data.resolvedIncidents,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'インシデント推移（過去7日間）',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                },
            },
        });
    },

    /**
     * アプリステータス分布チャート（ドーナツ）
     */
    initAppStatusChart() {
        const ctx = document.getElementById('appStatusChart');
        if (!ctx) {
            return;
        }

        const data = this.getAppStatusData();

        this.charts.appStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['稼働中', 'メンテナンス', '停止中'],
                datasets: [
                    {
                        data: [data.active, data.maintenance, data.inactive],
                        backgroundColor: ['#10b981', '#f59e0b', '#6b7280'],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'アプリ稼働状況',
                    },
                },
                cutout: '60%',
            },
        });
    },

    /**
     * インシデント優先度分布チャート（円グラフ）
     */
    initIncidentPriorityChart() {
        const ctx = document.getElementById('incidentPriorityChart');
        if (!ctx) {
            return;
        }

        const data = this.getIncidentPriorityData();

        this.charts.incidentPriority = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['高', '中', '低'],
                datasets: [
                    {
                        data: [data.high, data.medium, data.low],
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'インシデント優先度',
                    },
                },
            },
        });
    },

    /**
     * 変更タイプ分布チャート（棒グラフ）
     */
    initChangeTypeChart() {
        const ctx = document.getElementById('changeTypeChart');
        if (!ctx) {
            return;
        }

        const data = this.getChangeTypeData();

        this.charts.changeType = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['機能追加', '機能変更', 'バグ修正', '改善'],
                datasets: [
                    {
                        label: '件数',
                        data: [data.feature, data.modification, data.bugfix, data.improvement],
                        backgroundColor: ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'],
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: '変更要求タイプ別',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                },
            },
        });
    },

    /**
     * 週間アクティビティチャート（複合グラフ）
     */
    initWeeklyActivityChart() {
        const ctx = document.getElementById('weeklyActivityChart');
        if (!ctx) {
            return;
        }

        const data = this.getWeeklyActivityData();

        this.charts.weeklyActivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'ログイン',
                        data: data.logins,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderRadius: 4,
                    },
                    {
                        label: '操作',
                        data: data.actions,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: '週間アクティビティ',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    },

    /**
     * インシデントトレンドデータ取得
     */
    getIncidentTrendData() {
        const incidents = DataStore.incidents || [];
        const labels = [];
        const newIncidents = [];
        const resolvedIncidents = [];

        // 過去7日間のデータを生成
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = DateUtils.format(date, 'MM/dd');
            labels.push(dateStr);

            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            // その日に作成されたインシデント
            const created = incidents.filter(inc => {
                const createdDate = new Date(inc.created);
                return createdDate >= dayStart && createdDate <= dayEnd;
            }).length;
            newIncidents.push(created);

            // その日に解決されたインシデント
            const resolved = incidents.filter(inc => {
                if (!inc.resolvedAt) {
                    return false;
                }
                const resolvedDate = new Date(inc.resolvedAt);
                return resolvedDate >= dayStart && resolvedDate <= dayEnd;
            }).length;
            resolvedIncidents.push(resolved);
        }

        return { labels, newIncidents, resolvedIncidents };
    },

    /**
     * アプリステータスデータ取得
     */
    getAppStatusData() {
        const apps = DataStore.apps || [];
        return {
            active: apps.filter(a => a.status === 'active').length,
            maintenance: apps.filter(a => a.status === 'maintenance').length,
            inactive: apps.filter(a => a.status === 'inactive').length,
        };
    },

    /**
     * インシデント優先度データ取得
     */
    getIncidentPriorityData() {
        const incidents = DataStore.incidents || [];
        const openIncidents = incidents.filter(i => i.status !== 'closed');
        return {
            high: openIncidents.filter(i => i.priority === 'high').length,
            medium: openIncidents.filter(i => i.priority === 'medium').length,
            low: openIncidents.filter(i => i.priority === 'low').length,
        };
    },

    /**
     * 変更タイプデータ取得
     */
    getChangeTypeData() {
        const changes = DataStore.changes || [];
        return {
            feature: changes.filter(c => c.type === 'feature').length,
            modification: changes.filter(c => c.type === 'modification').length,
            bugfix: changes.filter(c => c.type === 'bugfix').length,
            improvement: changes.filter(c => c.type === 'improvement').length,
        };
    },

    /**
     * 週間アクティビティデータ取得
     */
    getWeeklyActivityData() {
        const logs = DataStore.logs || [];
        const labels = [];
        const logins = [];
        const actions = [];

        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(dayNames[date.getDay()]);

            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayLogs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= dayStart && logDate <= dayEnd;
            });

            logins.push(dayLogs.filter(l => l.action === 'login').length);
            actions.push(dayLogs.filter(l => l.action !== 'login' && l.action !== 'logout').length);
        }

        return { labels, logins, actions };
    },

    /**
     * 全チャートを更新
     */
    updateCharts() {
        if (!this.charts.incidentTrend) {
            return;
        }

        // インシデントトレンド更新
        const trendData = this.getIncidentTrendData();
        this.charts.incidentTrend.data.labels = trendData.labels;
        this.charts.incidentTrend.data.datasets[0].data = trendData.newIncidents;
        this.charts.incidentTrend.data.datasets[1].data = trendData.resolvedIncidents;
        this.charts.incidentTrend.update('none');

        // アプリステータス更新
        const appData = this.getAppStatusData();
        this.charts.appStatus.data.datasets[0].data = [
            appData.active,
            appData.maintenance,
            appData.inactive,
        ];
        this.charts.appStatus.update('none');

        // インシデント優先度更新
        const priorityData = this.getIncidentPriorityData();
        this.charts.incidentPriority.data.datasets[0].data = [
            priorityData.high,
            priorityData.medium,
            priorityData.low,
        ];
        this.charts.incidentPriority.update('none');

        // 変更タイプ更新
        const changeData = this.getChangeTypeData();
        this.charts.changeType.data.datasets[0].data = [
            changeData.feature,
            changeData.modification,
            changeData.bugfix,
            changeData.improvement,
        ];
        this.charts.changeType.update('none');

        // 週間アクティビティ更新
        const activityData = this.getWeeklyActivityData();
        this.charts.weeklyActivity.data.labels = activityData.labels;
        this.charts.weeklyActivity.data.datasets[0].data = activityData.logins;
        this.charts.weeklyActivity.data.datasets[1].data = activityData.actions;
        this.charts.weeklyActivity.update('none');
    },

    /**
     * 自動更新開始
     */
    startAutoUpdate() {
        if (this.updateTimer) {
            return;
        }

        this.updateTimer = setInterval(() => {
            this.refresh();
        }, this.UPDATE_INTERVAL);

        // 更新インジケーター表示
        this.updateLastRefreshTime();
    },

    /**
     * 自動更新停止
     */
    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    },

    /**
     * 手動更新
     */
    refresh() {
        // 統計カード更新
        this.updateStatCards();

        // チャート更新
        this.updateCharts();

        // 最近のログ更新
        if (typeof LogModule !== 'undefined') {
            LogModule.renderRecent();
        }

        // アプリサマリー更新
        if (typeof renderAppSummary === 'function') {
            renderAppSummary();
        }

        // 最終更新時刻更新
        this.updateLastRefreshTime();

        // 更新アニメーション
        this.showRefreshAnimation();
    },

    /**
     * 統計カード更新
     */
    updateStatCards() {
        const stats = DataStore.getStats();

        // アニメーション付きで数値更新
        this.animateNumber('totalUsers', stats.totalUsers);
        this.animateNumber('activeUsers', stats.activeUsers);
        this.animateNumber('totalApps', stats.totalApps);
        this.animateNumber('activeApps', stats.activeApps);
        this.animateNumber('openIncidents', stats.openIncidents);
        this.animateNumber('pendingChanges', stats.pendingChanges);
    },

    /**
     * 数値のアニメーション更新
     */
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }

        const currentValue = parseInt(element.textContent) || 0;
        const diff = targetValue - currentValue;

        if (diff === 0) {
            return;
        }

        const duration = 500;
        const startTime = performance.now();

        const animate = currentTime => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // イージング関数（easeOutQuad）
            const eased = 1 - (1 - progress) * (1 - progress);

            const value = Math.round(currentValue + diff * eased);
            element.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    /**
     * 最終更新時刻を更新
     */
    updateLastRefreshTime() {
        const element = document.getElementById('lastRefreshTime');
        if (element) {
            element.textContent = DateUtils.format(new Date(), 'HH:mm:ss');
        }
    },

    /**
     * 更新アニメーション表示
     */
    showRefreshAnimation() {
        const btn = document.getElementById('refreshDashboard');
        if (btn) {
            btn.classList.add('refreshing');
            setTimeout(() => btn.classList.remove('refreshing'), 1000);
        }
    },

    /**
     * ウィジェット設定読み込み
     */
    loadWidgetSettings() {
        const saved = localStorage.getItem('appsuite_dashboard_widgets');
        if (saved) {
            try {
                this.widgets = JSON.parse(saved);
            } catch (e) {
                this.widgets = this.getDefaultWidgets();
            }
        } else {
            this.widgets = this.getDefaultWidgets();
        }
    },

    /**
     * デフォルトウィジェット設定
     */
    getDefaultWidgets() {
        return [
            { id: 'stats', name: '統計カード', visible: true, order: 1 },
            { id: 'incidentTrend', name: 'インシデント推移', visible: true, order: 2 },
            { id: 'appStatus', name: 'アプリ稼働状況', visible: true, order: 3 },
            { id: 'incidentPriority', name: 'インシデント優先度', visible: true, order: 4 },
            { id: 'changeType', name: '変更要求タイプ', visible: true, order: 5 },
            { id: 'weeklyActivity', name: '週間アクティビティ', visible: true, order: 6 },
            { id: 'recentLogs', name: '最近の操作ログ', visible: true, order: 7 },
            { id: 'appSummary', name: 'アプリ一覧', visible: true, order: 8 },
        ];
    },

    /**
     * ウィジェット設定保存
     */
    saveWidgetSettings() {
        localStorage.setItem('appsuite_dashboard_widgets', JSON.stringify(this.widgets));
    },

    /**
     * ウィジェット表示/非表示切替
     */
    toggleWidget(widgetId) {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (widget) {
            widget.visible = !widget.visible;
            this.saveWidgetSettings();
            this.applyWidgetVisibility();
        }
    },

    /**
     * ウィジェット表示状態を適用
     */
    applyWidgetVisibility() {
        this.widgets.forEach(widget => {
            const element = document.getElementById(`widget-${widget.id}`);
            if (element) {
                element.style.display = widget.visible ? '' : 'none';
            }
        });
    },

    /**
     * ウィジェットコントロール初期化
     */
    initWidgetControls() {
        const container = document.getElementById('widgetControlList');
        if (!container) {
            return;
        }

        container.innerHTML = this.widgets
            .map(
                widget => `
            <label class="widget-control-item">
                <input type="checkbox"
                       ${widget.visible ? 'checked' : ''}
                       onchange="DashboardManager.toggleWidget('${widget.id}')">
                <span>${escapeHtml(widget.name)}</span>
            </label>
        `
            )
            .join('');
    },

    /**
     * ウィジェット設定モーダルを開く
     */
    openWidgetSettings() {
        Modal.open({
            title: 'ダッシュボード設定',
            content: `
                <div class="widget-settings">
                    <p>表示するウィジェットを選択してください：</p>
                    <div class="widget-control-list" id="widgetControlList"></div>
                    <div class="widget-settings-actions">
                        <button class="btn btn-secondary btn-sm" onclick="DashboardManager.resetWidgets()">
                            <i class="fas fa-undo"></i> デフォルトに戻す
                        </button>
                    </div>
                </div>
            `,
            size: 'small',
            buttons: [
                {
                    text: '閉じる',
                    class: 'btn-primary',
                    onclick: 'Modal.close()',
                },
            ],
        });

        this.initWidgetControls();
    },

    /**
     * ウィジェット設定をリセット
     */
    resetWidgets() {
        this.widgets = this.getDefaultWidgets();
        this.saveWidgetSettings();
        this.applyWidgetVisibility();
        this.initWidgetControls();
        Toast.success('ウィジェット設定をリセットしました');
    },

    /**
     * 更新間隔設定
     */
    setUpdateInterval(interval) {
        this.UPDATE_INTERVAL = interval;
        this.stopAutoUpdate();
        if (interval > 0) {
            this.startAutoUpdate();
        }
    },

    /**
     * クリーンアップ（チャートの破棄）
     */
    destroy() {
        this.stopAutoUpdate();
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    },
};

/**
 * KPIウィジェット
 * 重要業績評価指標の表示
 */
const KPIWidget = {
    /**
     * KPIデータを計算
     */
    calculate() {
        const incidents = DataStore.incidents || [];
        const changes = DataStore.changes || [];

        // 平均解決時間（時間）
        const resolvedIncidents = incidents.filter(i => i.resolvedAt && i.created);
        let avgResolutionTime = 0;
        if (resolvedIncidents.length > 0) {
            const totalTime = resolvedIncidents.reduce((sum, inc) => {
                return sum + (new Date(inc.resolvedAt) - new Date(inc.created));
            }, 0);
            avgResolutionTime =
                Math.round((totalTime / resolvedIncidents.length / (1000 * 60 * 60)) * 10) / 10;
        }

        // SLA達成率（24時間以内に解決した割合）
        const slaTarget = 24 * 60 * 60 * 1000; // 24時間
        const withinSla = resolvedIncidents.filter(inc => {
            const resolutionTime = new Date(inc.resolvedAt) - new Date(inc.created);
            return resolutionTime <= slaTarget;
        }).length;
        const slaRate =
            resolvedIncidents.length > 0
                ? Math.round((withinSla / resolvedIncidents.length) * 100)
                : 100;

        // 変更成功率
        const completedChanges = changes.filter(c => c.status === 'completed');
        const failedChanges = changes.filter(c => c.status === 'rejected');
        const changeSuccessRate =
            completedChanges.length + failedChanges.length > 0
                ? Math.round(
                      (completedChanges.length / (completedChanges.length + failedChanges.length)) *
                          100
                  )
                : 100;

        // 今月のインシデント数
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyIncidents = incidents.filter(i => new Date(i.created) >= monthStart).length;

        return {
            avgResolutionTime,
            slaRate,
            changeSuccessRate,
            monthlyIncidents,
        };
    },

    /**
     * KPIウィジェットをレンダリング
     */
    render() {
        const container = document.getElementById('kpiWidget');
        if (!container) {
            return;
        }

        const kpi = this.calculate();

        container.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-item">
                    <div class="kpi-value">${kpi.avgResolutionTime}<small>時間</small></div>
                    <div class="kpi-label">平均解決時間</div>
                    <div class="kpi-trend ${kpi.avgResolutionTime <= 8 ? 'good' : 'warning'}">
                        <i class="fas fa-${kpi.avgResolutionTime <= 8 ? 'arrow-down' : 'arrow-up'}"></i>
                    </div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-value">${kpi.slaRate}<small>%</small></div>
                    <div class="kpi-label">SLA達成率</div>
                    <div class="kpi-trend ${kpi.slaRate >= 90 ? 'good' : 'warning'}">
                        <i class="fas fa-${kpi.slaRate >= 90 ? 'check' : 'exclamation'}"></i>
                    </div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-value">${kpi.changeSuccessRate}<small>%</small></div>
                    <div class="kpi-label">変更成功率</div>
                    <div class="kpi-trend ${kpi.changeSuccessRate >= 95 ? 'good' : 'warning'}">
                        <i class="fas fa-${kpi.changeSuccessRate >= 95 ? 'check' : 'exclamation'}"></i>
                    </div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-value">${kpi.monthlyIncidents}</div>
                    <div class="kpi-label">今月のインシデント</div>
                    <div class="kpi-trend neutral">
                        <i class="fas fa-chart-line"></i>
                    </div>
                </div>
            </div>
        `;
    },
};

/**
 * クイックアクションウィジェット
 */
const QuickActions = {
    /**
     * レンダリング
     */
    render() {
        const container = document.getElementById('quickActions');
        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="quick-actions-grid">
                <button class="quick-action-btn" onclick="QuickActions.newIncident()">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>新規インシデント</span>
                </button>
                <button class="quick-action-btn" onclick="QuickActions.newChange()">
                    <i class="fas fa-code-branch"></i>
                    <span>新規変更要求</span>
                </button>
                <button class="quick-action-btn" onclick="QuickActions.viewMyTasks()">
                    <i class="fas fa-tasks"></i>
                    <span>担当タスク</span>
                </button>
                <button class="quick-action-btn" onclick="QuickActions.viewReports()">
                    <i class="fas fa-chart-bar"></i>
                    <span>レポート</span>
                </button>
            </div>
        `;
    },

    /**
     * 新規インシデント作成
     */
    newIncident() {
        // インシデントセクションに移動して新規モーダルを開く
        showSection('incidents');
        document.querySelector('[data-section="incidents"]').classList.add('active');
        setTimeout(() => IncidentModule.showAddModal(), 100);
    },

    /**
     * 新規変更要求作成
     */
    newChange() {
        showSection('changes');
        document.querySelector('[data-section="changes"]').classList.add('active');
        setTimeout(() => ChangeModule.showAddModal(), 100);
    },

    /**
     * 担当タスク表示
     */
    viewMyTasks() {
        const currentUser = AuthModule.getCurrentUser();
        if (!currentUser) {
            return;
        }

        const myIncidents = (DataStore.incidents || []).filter(
            i => i.assignee === currentUser.username && i.status !== 'closed'
        );
        const myChanges = (DataStore.changes || []).filter(
            c => c.assignee === currentUser.username && c.status !== 'completed'
        );

        let content = '<div class="my-tasks">';

        if (myIncidents.length === 0 && myChanges.length === 0) {
            content += '<p class="text-muted">担当タスクはありません</p>';
        } else {
            if (myIncidents.length > 0) {
                content += '<h4><i class="fas fa-exclamation-triangle"></i> インシデント</h4>';
                content += '<ul class="task-list">';
                myIncidents.forEach(inc => {
                    content += `
                        <li class="task-item priority-${inc.priority}">
                            <span class="task-id">${escapeHtml(inc.id)}</span>
                            <span class="task-title">${escapeHtml(inc.title)}</span>
                            <span class="badge badge-${inc.priority}">${inc.priority}</span>
                        </li>
                    `;
                });
                content += '</ul>';
            }

            if (myChanges.length > 0) {
                content += '<h4><i class="fas fa-code-branch"></i> 変更要求</h4>';
                content += '<ul class="task-list">';
                myChanges.forEach(chg => {
                    content += `
                        <li class="task-item">
                            <span class="task-id">${escapeHtml(chg.id)}</span>
                            <span class="task-title">${escapeHtml(chg.title)}</span>
                            <span class="badge">${escapeHtml(chg.status)}</span>
                        </li>
                    `;
                });
                content += '</ul>';
            }
        }

        content += '</div>';

        Modal.open({
            title: '担当タスク一覧',
            content: content,
            size: 'medium',
            buttons: [
                {
                    text: '閉じる',
                    class: 'btn-primary',
                    onclick: 'Modal.close()',
                },
            ],
        });
    },

    /**
     * レポート表示
     */
    viewReports() {
        Modal.open({
            title: 'レポート',
            content: `
                <div class="reports-menu">
                    <button class="btn btn-block" onclick="QuickActions.generateIncidentReport()">
                        <i class="fas fa-file-pdf"></i> インシデントレポート
                    </button>
                    <button class="btn btn-block" onclick="QuickActions.generateChangeReport()">
                        <i class="fas fa-file-pdf"></i> 変更管理レポート
                    </button>
                    <button class="btn btn-block" onclick="QuickActions.generateActivityReport()">
                        <i class="fas fa-file-pdf"></i> アクティビティレポート
                    </button>
                </div>
            `,
            size: 'small',
            buttons: [
                {
                    text: '閉じる',
                    class: 'btn-secondary',
                    onclick: 'Modal.close()',
                },
            ],
        });
    },

    /**
     * CSV ダウンロードユーティリティ
     * @param {string} filename - ファイル名
     * @param {string[][]} rows - 行データ（配列の配列）
     */
    _downloadCsv(filename, rows) {
        const bom = '\uFEFF'; // BOM for Excel UTF-8 compatibility
        const csv = bom + rows
            .map(row => row.map(cell => {
                const str = String(cell == null ? '' : cell);
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            }).join(','))
            .join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * インシデントレポート生成（CSV エクスポート）
     */
    generateIncidentReport() {
        const incidents = DataStore.incidents || [];
        const now = DateUtils.format(new Date(), 'YYYY-MM-DD');
        const header = ['ID', 'タイトル', 'アプリID', '優先度', 'ステータス', '報告者', '担当者', '作成日時', '解決日時'];
        const rows = [header, ...incidents.map(inc => [
            inc.id, inc.title, inc.appId, inc.priority, inc.status,
            inc.reporter, inc.assignee || '', inc.created, inc.resolvedAt || '',
        ])];
        this._downloadCsv(`incident-report-${now}.csv`, rows);
        Toast.success(`インシデントレポートをエクスポートしました（${incidents.length}件）`);
    },

    /**
     * 変更管理レポート生成（CSV エクスポート）
     */
    generateChangeReport() {
        const changes = DataStore.changes || [];
        const now = DateUtils.format(new Date(), 'YYYY-MM-DD');
        const header = ['ID', 'タイトル', 'アプリID', '種別', 'ステータス', '申請者', '承認者', '作成日時'];
        const rows = [header, ...changes.map(chg => [
            chg.id, chg.title, chg.appId, chg.type, chg.status,
            chg.requester, chg.approver || '', chg.created,
        ])];
        this._downloadCsv(`change-report-${now}.csv`, rows);
        Toast.success(`変更管理レポートをエクスポートしました（${changes.length}件）`);
    },

    /**
     * アクティビティレポート生成（CSV エクスポート）
     */
    generateActivityReport() {
        const logs = DataStore.logs || [];
        const now = DateUtils.format(new Date(), 'YYYY-MM-DD');
        const header = ['ログID', '日時', 'ユーザーID', 'アクション', '対象', '詳細'];
        const rows = [header, ...logs.map(log => [
            log.id, log.timestamp, log.userId, log.action, log.target || '', log.details || '',
        ])];
        this._downloadCsv(`activity-report-${now}.csv`, rows);
        Toast.success(`アクティビティレポートをエクスポートしました（${logs.length}件）`);
    },
};

/**
 * システムステータスウィジェット
 */
const SystemStatus = {
    /**
     * レンダリング
     */
    render() {
        const container = document.getElementById('systemStatus');
        if (!container) {
            return;
        }

        const status = this.getStatus();

        container.innerHTML = `
            <div class="system-status-grid">
                <div class="status-indicator ${status.api}">
                    <i class="fas fa-plug"></i>
                    <span>API接続</span>
                </div>
                <div class="status-indicator ${status.storage}">
                    <i class="fas fa-database"></i>
                    <span>ストレージ</span>
                </div>
                <div class="status-indicator ${status.sync}">
                    <i class="fas fa-sync"></i>
                    <span>同期</span>
                </div>
            </div>
            <div class="storage-usage">
                <div class="storage-label">
                    <span>ストレージ使用量</span>
                    <span>${status.storageUsed} / ${status.storageMax}</span>
                </div>
                <div class="storage-bar">
                    <div class="storage-fill" style="width: ${status.storagePercent}%"></div>
                </div>
            </div>
        `;
    },

    /**
     * ステータス取得
     */
    getStatus() {
        // localStorage使用量を計算
        let totalSize = 0;
        for (const key in localStorage) {
            if (
                Object.prototype.hasOwnProperty.call(localStorage, key) &&
                key.startsWith('appsuite_')
            ) {
                totalSize += (localStorage.getItem(key) || '').length * 2; // UTF-16
            }
        }

        const maxSize = 5 * 1024 * 1024; // 5MB（一般的なlocalStorage上限）
        const usedKB = Math.round(totalSize / 1024);
        const maxKB = Math.round(maxSize / 1024);
        const percent = Math.round((totalSize / maxSize) * 100);

        return {
            api: 'offline', // 実際の接続状態に応じて変更
            storage: percent < 80 ? 'online' : 'warning',
            sync: 'offline',
            storageUsed: `${usedKB}KB`,
            storageMax: `${maxKB}KB`,
            storagePercent: percent,
        };
    },
};

// Export to global scope
window.DashboardManager = DashboardManager;
window.KPIWidget = KPIWidget;
window.QuickActions = QuickActions;
window.SystemStatus = SystemStatus;

// 初期化はapp.jsから呼び出される
