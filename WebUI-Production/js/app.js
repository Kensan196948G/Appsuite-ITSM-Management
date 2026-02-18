/**
 * AppSuite 管理運用システム - メインアプリケーション
 * Phase 3 Sprint 1: 認証システム統合
 */

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 認証モジュール初期化
    AuthModule.init();

    // 認証チェック
    if (AuthModule.isAuthenticated()) {
        // 認証済み：アプリケーション初期化
        initApplication();
        AuthModule.hideLoginScreen();
        const user = AuthModule.getCurrentUser();
        if (user) {
            AuthModule.updateUIForUser(user);
        }
    } else {
        // 未認証：ログイン画面表示
        AuthModule.showLoginScreen();
    }
});

// アプリケーション初期化
function initApplication() {
    initNavigation();
    initSidebar();
    initFilters();
    initSettings();
    initApiSync();
    initDashboard();
    refreshAllModules();

    // ワークフローエンジン初期化
    if (typeof WorkflowEngine !== 'undefined') {
        WorkflowEngine.init();
    }

    // 通知システム初期化
    if (typeof NotificationManager !== 'undefined') {
        NotificationManager.init();
    }

    // バックアップマネージャー初期化
    if (typeof BackupManager !== 'undefined') {
        BackupManager.init();
    }

    // パフォーマンス最適化初期化
    if (typeof PerformanceOptimizer !== 'undefined') {
        PerformanceOptimizer.init();
    }

    // ページ離脱時のクリーンアップ
    window.addEventListener('beforeunload', cleanupApplication);
}

// アプリケーションクリーンアップ
function cleanupApplication() {
    if (typeof WorkflowEngine !== 'undefined') {
        WorkflowEngine.cleanup();
    }
    if (typeof NotificationManager !== 'undefined') {
        NotificationManager.cleanup();
    }
    if (typeof BackupManager !== 'undefined') {
        BackupManager.cleanup();
    }
    if (typeof LazyLoader !== 'undefined') {
        LazyLoader.disconnect();
    }
}

// ナビゲーション初期化
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // undefined チェック追加
            if (!item || !item.dataset) {
                console.error('Navigation item or dataset is undefined');
                return;
            }

            const section = item.dataset.section;
            if (!section) {
                console.warn('Section name is undefined for navigation item');
                return;
            }

            showSection(section);

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 1024 && sidebar) {
                sidebar.classList.remove('active');
            }
        });
    });
}

// セクション表示切替
function showSection(sectionName) {
    // CVE-003対策: 認証チェック追加
    if (!AuthModule.isAuthenticated()) {
        console.warn('⚠️ セキュリティ: 未認証アクセスをブロックしました');
        AuthModule.showLoginScreen();
        return;
    }

    // CVE-004対策: 管理者専用機能の権限チェック
    const adminOnlySections = ['users', 'settings'];
    if (adminOnlySections.includes(sectionName)) {
        const user = AuthModule.getCurrentUser();
        if (!user || (user.role !== '管理者' && user.role !== 'administrator')) {
            console.warn('⚠️ セキュリティ: 権限不足のアクセスをブロックしました', {
                user: user ? user.username : 'unknown',
                role: user ? user.role : 'unknown',
                requestedSection: sectionName,
            });
            showToast('この機能は管理者のみ利用可能です', 'error');
            showSection('dashboard'); // ダッシュボードにリダイレクト
            return;
        }
    }

    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => sec.classList.add('hidden'));

    const target = document.getElementById('section-' + sectionName);
    if (target) {
        target.classList.remove('hidden');
    }

    switch (sectionName) {
    case 'dashboard':
        updateDashboard();
        break;
    case 'users':
        UserModule.refresh();
        break;
    case 'apps':
        AppModule.refresh();
        break;
    case 'incidents':
        IncidentModule.refresh();
        break;
    case 'changes':
        ChangeModule.refresh();
        break;
    case 'logs':
        LogModule.refresh();
        break;
    case 'settings':
        SettingsModule.loadToForm();
        break;
    }
}

// サイドバー初期化
function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    document.addEventListener('click', e => {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// フィルター初期化
function initFilters() {
    // ユーザー検索・フィルター
    document.getElementById('userSearch').addEventListener('input', () => UserModule.filter());
    document
        .getElementById('userStatusFilter')
        .addEventListener('change', () => UserModule.filter());
    document.getElementById('userRoleFilter').addEventListener('change', () => UserModule.filter());

    // アプリ検索・フィルター
    document.getElementById('appSearch').addEventListener('input', () => AppModule.filter());
    document
        .getElementById('appCategoryFilter')
        .addEventListener('change', () => AppModule.filter());
    document.getElementById('appStatusFilter').addEventListener('change', () => AppModule.filter());

    // インシデント検索・フィルター
    document
        .getElementById('incidentSearch')
        .addEventListener('input', () => IncidentModule.filter());
    document
        .getElementById('incidentPriorityFilter')
        .addEventListener('change', () => IncidentModule.filter());
    document
        .getElementById('incidentStatusFilter')
        .addEventListener('change', () => IncidentModule.filter());

    // 変更要求検索・フィルター
    document.getElementById('changeSearch').addEventListener('input', () => ChangeModule.filter());
    document
        .getElementById('changeTypeFilter')
        .addEventListener('change', () => ChangeModule.filter());
    document
        .getElementById('changeStatusFilter')
        .addEventListener('change', () => ChangeModule.filter());
}

// API設定読み込み（互換性のため残す）
function loadApiConfig() {
    // 設定モジュールで管理するため、この関数は互換性のために残す
}

// 設定初期化
function initSettings() {
    SettingsModule.initTabs();
    SettingsModule.loadToForm();
}

// ダッシュボード初期化
function initDashboard() {
    updateDashboard();

    // DashboardManager初期化（Chart.js読み込み後）
    if (typeof DashboardManager !== 'undefined') {
        DashboardManager.init();

        // KPIウィジェット初期化
        if (typeof KPIWidget !== 'undefined') {
            KPIWidget.render();
        }

        // クイックアクション初期化
        if (typeof QuickActions !== 'undefined') {
            QuickActions.render();
        }

        // システムステータス初期化
        if (typeof SystemStatus !== 'undefined') {
            SystemStatus.render();
        }
    }
}

// ダッシュボード更新
function updateDashboard() {
    const stats = DataStore.getStats();
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('activeUsers').textContent = stats.activeUsers;
    document.getElementById('totalApps').textContent = stats.totalApps;
    document.getElementById('activeApps').textContent = stats.activeApps;
    document.getElementById('openIncidents').textContent = stats.openIncidents;
    document.getElementById('pendingChanges').textContent = stats.pendingChanges;

    // 最近のログ
    LogModule.renderRecent();

    // アプリサマリー
    renderAppSummary();

    // ウィジェット更新
    if (typeof KPIWidget !== 'undefined') {
        KPIWidget.render();
    }
    if (typeof SystemStatus !== 'undefined') {
        SystemStatus.render();
    }
}

// アプリサマリー表示
function renderAppSummary() {
    const container = document.getElementById('appSummary');
    const apps = [...DataStore.apps]
        .sort((a, b) => new Date(b.updated) - new Date(a.updated))
        .slice(0, 5);
    container.innerHTML = apps
        .map(
            app => `
        <div class="app-summary-item">
            <span class="app-name">${escapeHtml(app.name)}</span>
            <span class="app-records">${app.records.toLocaleString()}件</span>
            <span class="badge ${AppModule.getStatusBadge(app.status)}">${AppModule.getStatusText(app.status)}</span>
        </div>
    `
        )
        .join('');
}

// 全モジュール初期化
function refreshAllModules() {
    UserModule.refresh();
    AppModule.refresh();
    IncidentModule.refresh();
    ChangeModule.refresh();
    LogModule.refresh();
}

// モーダル関連
function openModal(title, bodyContent, buttons = []) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyContent;

    const footer = document.getElementById('modalFooter');
    footer.innerHTML = buttons
        .map(
            btn => `<button class="btn ${btn.class}" onclick="${btn.onclick}">${btn.text}</button>`
        )
        .join('');

    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// モーダルオーバーレイクリックで閉じる
document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) {
        closeModal();
    }
});

// 認証後のアプリケーション起動（AuthModuleから呼び出される）
function startApplicationAfterLogin() {
    initApplication();
}
