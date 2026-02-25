const STORAGE_KEY = "appsuite-webui-sample-v3";
const INDEXEDDB_SCHEMA_VERSION = 3;

const DOC_FILES = [
  "Phase5_リリース計画書.md","Phase2_画面設計書.md","UAT実施計画書.md","Phase2_状態管理設計書.md","Phase2_完了レポート.md",
  "Phase2_データベース設計書.md","Phase2_テスト設計書.md","Phase2_セキュリティ設計書.md","Phase2_システムアーキテクチャ設計書.md","Phase2_コンポーネント設計書.md",
  "Training-Materials.md","Quick-Start-Guide.md","UAT-Test-Scenarios.md","Production-Environment-Checklist.md","Phase1_データフロー図とシステム構成.md",
  "UAT-Test-Execution-Log.md","Playwright-Test-Results.md","UAT-Manual-Test-Checklist.md","UAT-Execution-Report.md","Implementation-Report.md",
  "Phase1_ステークホルダー分析とヒアリング計画.md","HTTPS設定手順書.md","Performance-Report.md","Operation-Checklist.md","FAQ.md",
  "MCP設定ガイド.md","Incident-Response-Guide.md","Error-Detection-Report.md","E2E-Test-Report.md","Phase1_完了レポート.md",
  "Phase2_API設計書.md","Document-Update-Summary-2026-02-04.md","Appsuite専用運用システム｜詳細機能要件定義.md","Phase1_要件定義書_完成版.md","AppSuite 業務プロセス構築運用.xlsx",
  "API仕様書(API-Specification).md","API-Test-Specification.md","テスト仕様書(Test-Specification).md","セキュリティ設計書(Security-Design).md","システム概要書(System-Overview).md",
  "用語集(Glossary).md","環境確認総括レポート.md","環境構築完了チェックリスト.md","環境構築・並列開発設計書(Environment-Setup-Design).md","詳細設計_APIキー暗号化.md",
  "機能仕様書(Functional-Specification).md","詳細要件定義書(Requirements-Specification).md","ロールバック手順書.md","自動起動設定ガイド(Auto-Start-Guide).md","ユーザーガイド(User-Guide).md",
  "統合監査レポート_2026-02-11.md","データベース設計書(Database-Design).md","画面設計書(Screen-Design).md","デプロイ手順書.md","運用マニュアル(Operation-Manual).md",
  "詳細設計_バックアップ自動化.md","詳細設計_IndexedDB移行.md","開発フェーズ計画書(Development-Phase-Plan).md","開発フェーズ計画書_v2.md","Phase1_ユースケース分析.md","Phase1_機能要件・非機能要件一覧.md"
];

const EXCEL_SHEETS = ["Guide_実践ガイド","NonIT_他部署向けガイド","FlowChart_フロー図","BP_業務プロセス定義","REQ_要件一覧","NFR_非機能要件","Rules_設計ルール","Design_アプリ設計","Test_テストシナリオ","Manual_操作マニュアル","Release_リリースノート","Improve_改善ログ"];

let DEFAULT = createBuiltinDefaultState();

function createBuiltinDefaultState() {
  return {
    connection: { connected: false, status: "未接続", lastSync: "-", version: "-" },
    users: [],
    apps: [],
    incidents: [],
    changes: [],
    logs: [],
    backups: [],
    ops: { daily: [], weekly: [], monthly: [] },
    settings: {
      apiUrl: "", authMethod: "bearer", apiKey: "", timeout: 30, syncInterval: 15,
      systemName: "AppSuite管理運用システム", orgName: "", adminEmail: "", language: "ja", dateFormat: "yyyy-MM-dd", pageSize: 25,
      notifyIncidentNew: true, notifyIncidentHigh: true, notifyChangeApproval: true, notifyChangeComplete: false, smtpHost: "", smtpPort: 587, smtpUser: "", smtpPass: "", smtpSsl: true,
      pwMinLength: 8, pwExpireDays: 90, sessionTimeout: 30, maxSessions: 3, maxLoginAttempts: 5, lockoutDuration: 15, pwRequireUpper: true, pwRequireNumber: true, pwRequireSpecial: false, enableTwoFactor: false,
      incidentAutoAssign: false, incidentDefaultAssignee: "", incidentEscalation: 24, changeRequireApproval: true, changeApprover: "manager", changeLeadTime: 3, allowSkipStatus: false, requireComment: true,
      autoBackup: true, backupInterval: "daily", backupRetention: 7, backupSignatureMode: "sha256", backupHmacSecret: "",
      rolePermissions: {},
      rowLevelRules: { userSelfEditOnlyForUser: true, incidentOwnOrAssignedOnlyForUser: true, changeRequesterOnlyForUser: true },
      customRoles: [],
      docsEditor: { owner: "IT運用管理", reviewCycleDays: 30, note: "", actionCandidates: [] }
    },
    session: { userId: "", role: "管理者" },
    ui: { activeSection: "dashboard", activeSettingsTab: "api", selectedLogId: null, logDetailDiffFilter: "all", filters: { userSearch: "", userStatus: "all", userRole: "all", appSearch: "", appCategory: "all", appStatus: "all", incidentSearch: "", incidentStatus: "all", incidentPriority: "all", changeSearch: "", changeType: "all", changeStatus: "all", logFrom: "", logTo: "", logAction: "all", logTarget: "all", logMeta: "all" } }
  };
}

async function initDefaultsFromMockApi() {
  if (typeof window === "undefined" || !window.AppSuiteMockApi?.loadInitialState) return;
  try {
    const seed = await window.AppSuiteMockApi.loadInitialState();
    DEFAULT = merge(createBuiltinDefaultState(), seed || {});
  } catch (e) {
    console.warn("mock-api seed load failed", e);
    DEFAULT = createBuiltinDefaultState();
  }
}


const FAQS = [
  { q: "API接続が未接続のまま", a: "設定→API接続でURL・キー・認証方式を確認し、接続テストを実行します。" },
  { q: "CSVが文字化けする", a: "FAQ/ユーザーガイドを前提にUTF-8で開く運用を案内します。" },
  { q: "誤って削除した", a: "バックアップから復元。実運用はロールバック手順書に従います。" },
  { q: "セッションタイムアウト", a: "セキュリティ設定のタイムアウト値と利用状況を確認します。" }
];

const Validation = (typeof window !== "undefined" && window.AppSuiteValidation) || null;
const WorkflowRules = (typeof window !== "undefined" && window.AppSuiteWorkflowRules) || null;
const DocsMeta = (typeof window !== "undefined" && window.APPSUITE_DOCS_METADATA) || null;
const MockApi = (typeof window !== "undefined" && window.AppSuiteMockApi) || null;
let Store = null;

let state = loadState();
let timer = null;
let faqIndex = 0;
let modalType = null;
let modalEditId = null;
let lastFocusedBeforeModal = null;
let docsActionDraft = [];
let docsActionValidation = { valid: true, rowErrors: {}, globalErrors: [] };
let mockApiSyncState = { status: "idle", label: "mockApi 未同期", updatedAt: null, category: null, message: "-" };
const $ = {};
const BUILTIN_ROLES = ["管理者", "ユーザー"];
const PERMISSIONS = {
  管理者: {
    usersRead: true, usersWrite: true,
    appsRead: true, appsWrite: true,
    incidentsRead: true, incidentsWrite: true,
    changesRead: true, changesWrite: true, changesApprove: true,
    logsRead: true, logsExport: true, logsMetaView: true,
    settingsRead: true, settingsWrite: true,
    backupRun: true, backupExport: true, backupImport: true
  },
  ユーザー: {
    usersRead: true, usersWrite: false,
    appsRead: true, appsWrite: false,
    incidentsRead: true, incidentsWrite: true,
    changesRead: true, changesWrite: true, changesApprove: false,
    logsRead: true, logsExport: false, logsMetaView: false,
    settingsRead: false, settingsWrite: false,
    backupRun: false, backupExport: false, backupImport: false
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await initDefaultsFromMockApi();
  await initStore();
  cache();
  bind();
  initStaticSelects();
  hydrateSettings();
  populateFilters();
  renderAll();
  $.roleSwitcher.value = state.session?.role || "管理者";
  applyRoleUI();
  refreshMockApiSyncIndicatorFromInfo();
  tickClock();
  setInterval(tickClock, 1000);
  startAutoRefresh();
  syncSidebarA11y();
});

async function initStore() {
  if (typeof window === "undefined" || !window.AppSuiteDataStore) return;
  const useIndexedDb = typeof indexedDB !== "undefined";
  const legacyRaw = (typeof localStorage !== "undefined") ? localStorage.getItem(STORAGE_KEY) : null;
  const backend = useIndexedDb
    ? window.AppSuiteDataStore.createIndexedDBBackend({
        dbName: "AppSuiteWebUISample",
        storeName: "state",
        recordKey: STORAGE_KEY,
        dbVersion: INDEXEDDB_SCHEMA_VERSION,
        migrations: indexedDbMigrations(),
        partitioned: true
      })
    : window.AppSuiteDataStore.createLocalStorageBackend(STORAGE_KEY);
  Store = window.AppSuiteDataStore.createStore({
    backend,
    defaults: DEFAULT,
    merge,
    validateSnapshot: (snap) => Validation ? Validation.validateSnapshot(snap) : { valid: true, errors: [] }
  });
  try {
    state = backend.isAsync ? await Store.loadAsync() : Store.load();
    normalizeRuntimeState();
    if (backend.isAsync && legacyRaw) {
      const hasIdbData = !!state && (
        (Array.isArray(state.users) && state.users.length > 0) ||
        (Array.isArray(state.apps) && state.apps.length > 0) ||
        (Array.isArray(state.logs) && state.logs.length > 0)
      );
      if (!hasIdbData) {
        try {
          const legacyParsed = JSON.parse(legacyRaw);
          const merged = merge(structuredClone(DEFAULT), legacyParsed);
          state = merged;
          normalizeRuntimeState();
          addMigrationAuditLog(merged, "localStorage から IndexedDB へ初回移行");
          Store.saveSafe ? Store.saveSafe(state) : await Store.save(state);
        } catch (e) {
          console.warn("legacy localStorage migration skipped", e);
        }
      }
    }
  } catch (e) {
    console.warn("IndexedDB load failed, fallback to localStorage", e);
    Store = window.AppSuiteDataStore.createStore({
      backend: window.AppSuiteDataStore.createLocalStorageBackend(STORAGE_KEY),
      defaults: DEFAULT,
      merge,
      validateSnapshot: (snap) => Validation ? Validation.validateSnapshot(snap) : { valid: true, errors: [] }
    });
    state = Store.load();
    normalizeRuntimeState();
  }
}

function indexedDbMigrations() {
  return {
    2(ctx) {
      try {
        const stateStore = ctx.tx.objectStore(ctx.storeName);
        const req = stateStore.get(ctx.recordKey);
        req.onsuccess = () => {
          const row = req.result;
          if (!row || !row.payload || typeof row.payload !== "object") return;
          const payload = row.payload;
          let changed = false;
          if (!payload.settings) { payload.settings = {}; changed = true; }
          if (!payload.settings.rolePermissions) { payload.settings.rolePermissions = structuredClone(DEFAULT.settings.rolePermissions); changed = true; }
          if (Array.isArray(payload.backups)) {
            payload.backups = payload.backups.map((b) => ({ integrity: b.integrity || "OK", ...b }));
            changed = true;
          }
          if (payload.ui && payload.ui.selectedLogId === undefined) { payload.ui.selectedLogId = null; changed = true; }
          if (changed) {
            row.payload = payload;
            row.updatedAt = new Date().toISOString();
            stateStore.put(row);
          }
        };
      } catch (e) {
        console.warn("IndexedDB migration v2 skipped", e);
      }
    }
    ,
    3(ctx) {
      try {
        const stateStore = ctx.tx.objectStore(ctx.storeName);
        const req = stateStore.get(ctx.recordKey);
        req.onsuccess = () => {
          const row = req.result;
          if (!row?.payload) return;
          const payload = row.payload;
          payload.settings ||= {};
          if (!payload.settings.rowLevelRules) payload.settings.rowLevelRules = structuredClone(DEFAULT.settings.rowLevelRules);
          if (!("backupSignatureMode" in payload.settings)) payload.settings.backupSignatureMode = DEFAULT.settings.backupSignatureMode;
          if (!("backupHmacSecret" in payload.settings)) payload.settings.backupHmacSecret = DEFAULT.settings.backupHmacSecret;
          row.updatedAt = new Date().toISOString();
          stateStore.put(row);
        };
      } catch (e) {
        console.warn("IndexedDB migration v3 skipped", e);
      }
    }
  };
}

function normalizeRuntimeState() {
  state.settings ||= {};
  state.settings.rolePermissions = merge(structuredClone(DEFAULT.settings.rolePermissions), state.settings.rolePermissions || {});
  state.settings.rowLevelRules = merge(structuredClone(DEFAULT.settings.rowLevelRules), state.settings.rowLevelRules || {});
  state.settings.customRoles = Array.from(new Set((state.settings.customRoles || []).filter((r) => r && !BUILTIN_ROLES.includes(r))));
  state.settings.docsEditor = merge(structuredClone(DEFAULT.settings.docsEditor || {}), state.settings.docsEditor || {});
  if (!Array.isArray(state.settings.docsEditor.actionCandidates)) state.settings.docsEditor.actionCandidates = [];
  if (!("backupSignatureMode" in state.settings)) state.settings.backupSignatureMode = DEFAULT.settings.backupSignatureMode;
  if (!("backupHmacSecret" in state.settings)) state.settings.backupHmacSecret = DEFAULT.settings.backupHmacSecret;
  state.ui ||= {};
  if (!("selectedLogId" in state.ui)) state.ui.selectedLogId = null;
  if (!("logDetailDiffFilter" in state.ui)) state.ui.logDetailDiffFilter = "all";
  state.ui.filters ||= structuredClone(DEFAULT.ui.filters);
  state.backups = (state.backups || []).map((b) => ({ integrity: b.integrity || "OK", ...b }));
}

function addMigrationAuditLog(targetState, message) {
  const user = targetState.users?.find((u) => u.id === targetState.session?.userId) || targetState.users?.[0] || { id: "U0000", username: "system" };
  const logs = Array.isArray(targetState.logs) ? targetState.logs : [];
  logs.unshift({
    id: `LOG-${String(logs.length + 1).padStart(3, "0")}`,
    timestamp: nowSec(),
    userId: user.id || "U0000",
    username: user.username || "system",
    action: "更新",
    target: "システム",
    targetId: "MIGRATION",
    details: message,
    ipAddress: "127.0.0.1",
    meta: { migration: { from: "localStorage", to: "IndexedDB", key: STORAGE_KEY } }
  });
  targetState.logs = logs.slice(0, 150);
}

function cache() {
  const ids = ["pageTitle","sidebar","menuToggle","connectionPill","sidebarConnection","clock","statsGrid","recentLogs","appSummaryList","opsChecklist","qualityCards","faqCard","docsCategoryGrid","docsFileList","docsCountCaption","docsMetaStamp","excelMeta","refreshInterval","refreshNowBtn","quickBackupBtn","globalActionBtn","completeChecklistBtn","faqRandomBtn","roleSwitcher","usersTable","appsTable","incidentsTable","changesTable","logsTable","logDetailPanel","logDetailTitle","logDetailBody","logDetailEmpty","logDetailClose","logDetailDiffFilter","userSearch","userStatusFilter","userRoleFilter","userReset","appSearch","appCategoryFilter","appStatusFilter","appReset","incidentSearch","incidentStatusFilter","incidentPriorityFilter","incidentReset","changeSearch","changeTypeFilter","changeStatusFilter","changeReset","logFrom","logTo","logActionFilter","logTargetFilter","logMetaFilter","logSearchBtn","exportLogsBtn","settingsTabs","pageSizeInfo","apiUrl","authMethod","apiKey","apiTimeout","syncInterval","toggleApiKey","saveApiBtn","testConnectionBtn","apiStatusCards","systemName","orgName","adminEmail","language","dateFormat","pageSize","saveBasicBtn","notifyToggles","smtpHost","smtpPort","smtpUser","smtpPass","smtpSsl","sendTestMailBtn","saveNotifyBtn","pwMinLength","pwExpireDays","sessionTimeout","maxSessions","maxLoginAttempts","lockoutDuration","securityChecks","saveSecurityBtn","securityStatusList","incidentAutoAssign","incidentDefaultAssignee","incidentEscalation","changeRequireApproval","changeApprover","changeLeadTime","allowSkipStatus","requireComment","saveWorkflowBtn","permissionsEditor","rowLevelRulesEditor","docsEditorOwner","docsEditorReviewDays","docsEditorNote","docsActionsTable","docsActionAddBtn","docsActionSortBtn","saveDocsEditorBtn","savePermissionsBtn","autoBackup","backupInterval","backupRetention","backupSignatureMode","backupHmacSecret","saveBackupBtn","createBackupBtn","exportBackupJsonBtn","restoreBackupBtn","backupImportFile","backupHistory","backupImportPreview","approveDemoBtn","mockApiSyncBadge","mockApiSyncMeta","mockApiSyncPanel","mockApiCategorySelect","mockApiRefreshBtn","mockApiRemoveCategoryBtn","mockApiResetOverlayBtn","mockApiSyncHistory","modalBackdrop","modalTitle","modalBody","modalClose","modalCancel","modalSave","toastWrap"];
  ids.forEach((id) => { $[id] = document.getElementById(id); });
}

function bind() {
  document.querySelectorAll(".nav-item").forEach((b) => b.addEventListener("click", () => setSection(b.dataset.section)));
  document.querySelectorAll("[data-jump]").forEach((b) => b.addEventListener("click", () => setSection(b.dataset.jump)));
  document.querySelectorAll("[data-open-modal]").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.openModal)));
  $.menuToggle?.addEventListener("click", () => toggleSidebar());
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-row-action]");
    if (btn) onRowAction(btn);
    const logRow = e.target.closest("[data-log-row]");
    if (logRow && !e.target.closest("details,summary,a,button,input,select,textarea")) openLogDetail(logRow.dataset.logRow);
    if (e.target.closest("[data-close-log-detail]")) closeLogDetail();
    if (window.innerWidth <= 1080 && !$.sidebar.contains(e.target) && e.target !== $.menuToggle) closeSidebar();
  });
  document.addEventListener("keydown", handleGlobalKeydown);
  $.logDetailDiffFilter?.addEventListener("change", (e) => {
    state.ui.logDetailDiffFilter = e.target.value;
    renderLogDetailPanel();
    persist();
  });

  [["userSearch","input","userSearch"],["userStatusFilter","change","userStatus"],["userRoleFilter","change","userRole"],["appSearch","input","appSearch"],["appCategoryFilter","change","appCategory"],["appStatusFilter","change","appStatus"],["incidentSearch","input","incidentSearch"],["incidentStatusFilter","change","incidentStatus"],["incidentPriorityFilter","change","incidentPriority"],["changeSearch","input","changeSearch"],["changeTypeFilter","change","changeType"],["changeStatusFilter","change","changeStatus"],["logFrom","change","logFrom"],["logTo","change","logTo"],["logActionFilter","change","logAction"],["logTargetFilter","change","logTarget"],["logMetaFilter","change","logMeta"]].forEach(([id, evt, key]) => {
    $[id].addEventListener(evt, (e) => { state.ui.filters[key] = e.target.value; renderTablesAndDash(); persist(); });
  });
  $.userReset.addEventListener("click", () => resetFilters("user"));
  $.appReset.addEventListener("click", () => resetFilters("app"));
  $.incidentReset.addEventListener("click", () => resetFilters("incident"));
  $.changeReset.addEventListener("click", () => resetFilters("change"));
  $.logSearchBtn.addEventListener("click", () => { renderLogs(); toast("監査ログを検索しました", "info"); });
  $.exportLogsBtn.addEventListener("click", exportLogsCsv);

  $.refreshInterval.addEventListener("change", startAutoRefresh);
  $.refreshNowBtn.addEventListener("click", () => { refreshDash(true); });
  $.quickBackupBtn.addEventListener("click", createBackup);
  $.completeChecklistBtn.addEventListener("click", completeDailyOps);
  $.faqRandomBtn.addEventListener("click", () => { faqIndex = (faqIndex + 1) % FAQS.length; renderFaq(); });
  $.globalActionBtn.addEventListener("click", () => openModal(({users:"user",apps:"app",incidents:"incident",changes:"change"})[state.ui.activeSection] || "incident"));
  $.roleSwitcher.addEventListener("change", (e) => {
    state.session.role = e.target.value;
    const targetUser = state.users.find((u) => u.role === e.target.value) || state.users[0];
    state.session.userId = targetUser?.id || state.session.userId;
    persist();
    applyRoleUI();
    renderTablesAndDash();
    toast(`ロールを ${e.target.value} に切替`, "info");
  });

  $.settingsTabs.addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) setSettingsTab(t.dataset.tab); });
  $.toggleApiKey.addEventListener("click", () => { $.apiKey.type = $.apiKey.type === "password" ? "text" : "password"; });
  $.saveApiBtn.addEventListener("click", saveApi);
  $.testConnectionBtn.addEventListener("click", testConnection);
  $.saveBasicBtn.addEventListener("click", saveBasic);
  $.sendTestMailBtn.addEventListener("click", () => toast("SMTPテスト送信（デモ）", "info"));
  $.saveNotifyBtn.addEventListener("click", saveNotify);
  $.saveSecurityBtn.addEventListener("click", saveSecurity);
  $.saveWorkflowBtn.addEventListener("click", saveWorkflow);
  $.savePermissionsBtn?.addEventListener("click", savePermissions);
  $.saveDocsEditorBtn?.addEventListener("click", saveDocsEditor);
  $.docsActionAddBtn?.addEventListener("click", () => { docsActionDraft.push(makeDocsActionDraftRow()); docsActionValidation = validateDocsActionDraft(docsActionDraft); renderDocsActionsTable(); });
  $.docsActionSortBtn?.addEventListener("click", () => sortDocsActionDraft());
  $.mockApiRefreshBtn?.addEventListener("click", () => refreshMockApiSyncIndicatorFromInfo(true));
  $.mockApiRemoveCategoryBtn?.addEventListener("click", removeSelectedMockApiCategory);
  $.mockApiResetOverlayBtn?.addEventListener("click", resetMockApiOverlayFromUI);
  $.saveBackupBtn.addEventListener("click", saveBackupSettings);
  $.createBackupBtn.addEventListener("click", createBackup);
  $.exportBackupJsonBtn.addEventListener("click", exportBackupJson);
  $.restoreBackupBtn.addEventListener("click", restoreBackup);
  $.backupImportFile.addEventListener("change", importBackupJson);
  $.approveDemoBtn.addEventListener("click", approveDemo);

  [$.modalClose, $.modalCancel].forEach((b) => b.addEventListener("click", closeModal));
  $.modalBackdrop.addEventListener("click", (e) => { if (e.target === $.modalBackdrop) closeModal(); });
  $.modalSave.addEventListener("click", saveModal);
  window.addEventListener("resize", syncSidebarA11y);
  $.docsActionsTable?.addEventListener("click", onDocsActionsTableClick);
  $.docsActionsTable?.addEventListener("input", onDocsActionsTableInput);
}

function renderAll() {
  syncFilterInputs();
  setSection(state.ui.activeSection || "dashboard");
  setSettingsTab(state.ui.activeSettingsTab || "api");
  renderDashboard();
  renderTablesAndDash();
  renderDocs();
  renderSettingsPanels();
  renderConnectionPill();
}

function renderTablesAndDash() {
  renderUsers();
  renderApps();
  renderIncidents();
  renderChanges();
  renderLogs();
  renderDashboard();
}

function setSection(section) {
  if (section === "settings" && !canPerm("settingsRead")) {
    toast("一般ユーザーはシステム設定を参照できません", "error");
    section = "dashboard";
  }
  if (section === "logs" && !canPerm("logsRead")) {
    toast("監査ログを参照できません", "error");
    section = "dashboard";
  }
  state.ui.activeSection = section;
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.section === section));
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === `screen-${section}`));
  $.pageTitle.textContent = ({dashboard:"ダッシュボード",users:"ユーザー管理",apps:"アプリ管理",incidents:"インシデント管理",changes:"変更管理",logs:"監査ログ",settings:"システム設定"})[section] || "AppSuite管理";
  $.globalActionBtn.textContent = ({users:"新規ユーザー",apps:"新規アプリ",incidents:"新規インシデント",changes:"新規変更要求"})[section] || "新規登録";
  closeSidebar();
  applyRoleUI();
  persist();
}

function setSettingsTab(tab) {
  state.ui.activeSettingsTab = tab;
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".settings-panel").forEach((p) => p.classList.toggle("active", p.dataset.tabPanel === tab));
  persist();
}

function currentUser() {
  return state.users.find((u) => u.id === state.session?.userId) || state.users[0];
}

function isAdmin() {
  return (state.session?.role || currentUser()?.role) === "管理者";
}

function canPerm(key) {
  const role = state.session?.role || currentUser()?.role || "ユーザー";
  const perms = state.settings?.rolePermissions?.[role] || PERMISSIONS[role] || {};
  return Boolean(perms[key]);
}

function applyRoleUI() {
  const admin = isAdmin();
  const settingsNav = document.querySelector('.nav-item[data-section="settings"]');
  if (settingsNav) settingsNav.classList.toggle("is-disabled", !canPerm("settingsRead"));
  if (!admin && state.ui.activeSection === "settings") setSection("dashboard");
  const logExport = $.exportLogsBtn;
  if (logExport) logExport.disabled = !canPerm("logsExport");
  [
    $.saveApiBtn, $.testConnectionBtn, $.saveBasicBtn, $.saveNotifyBtn, $.saveSecurityBtn,
    $.saveWorkflowBtn, $.saveBackupBtn, $.createBackupBtn, $.exportBackupJsonBtn, $.savePermissionsBtn, $.saveDocsEditorBtn,
    $.mockApiRemoveCategoryBtn, $.mockApiResetOverlayBtn
  ].forEach((btn) => { if (btn) btn.disabled = !canPerm("settingsWrite"); });
  if ($.restoreBackupBtn) $.restoreBackupBtn.disabled = !canPerm("backupImport");
  if ($.mockApiRefreshBtn) $.mockApiRefreshBtn.disabled = false;
  if ($.globalActionBtn) $.globalActionBtn.disabled = (state.ui.activeSection === "settings" || state.ui.activeSection === "logs") || (!admin && state.ui.activeSection === "apps");
  if ($.permissionsEditor) $.permissionsEditor.classList.toggle("is-disabled", !canPerm("settingsWrite"));
  if ($.saveDocsEditorBtn) $.saveDocsEditorBtn.disabled = !canPerm("settingsWrite");
}

function renderDashboard() {
  const userTotal = state.users.length;
  const activeUsers = state.users.filter((u) => u.status === "有効").length;
  const appTotal = state.apps.length;
  const activeApps = state.apps.filter((a) => a.status === "稼働中").length;
  const unresolved = state.incidents.filter((i) => i.status !== "クローズ").length;
  const pending = state.changes.filter((c) => c.status === "承認待ち").length;
  const cards = [
    ["👥","総ユーザー数",userTotal,"users","linear-gradient(135deg,#3b82f6,#1d4ed8)","DASH-001"],
    ["✓","有効ユーザー",activeUsers,"status=active","linear-gradient(135deg,#22c55e,#16a34a)","DASH-001"],
    ["📱","アプリ数",appTotal,"apps","linear-gradient(135deg,#8b5cf6,#6d28d9)","DASH-001"],
    ["▶","稼働中アプリ",activeApps,"status=active","linear-gradient(135deg,#06b6d4,#0891b2)","DASH-004"],
    ["⚠","未解決インシデント",unresolved,"status≠closed","linear-gradient(135deg,#ef4444,#dc2626)","INC"],
    ["🔀","保留中の変更",pending,"status=pending","linear-gradient(135deg,#f59e0b,#d97706)","CHG"]
  ];
  $.statsGrid.innerHTML = cards.map((c) => `
    <article class="stat-card">
      <div class="stat-top">
        <div class="stat-icon" style="background:${c[4]}">${c[0]}</div>
        <span class="badge ${c[1].includes("インシデント") || c[1].includes("変更") ? "warning" : "info"}">${c[5]}</span>
      </div>
      <div class="stat-value">${c[2]}</div>
      <div class="stat-label">${c[1]}</div>
      <div class="stat-meta">${c[3]}</div>
    </article>`).join("");

  $.recentLogs.innerHTML = visibleLogs().slice(0, 5).map((l) => `
    <div class="timeline-item"><time>${h(l.timestamp)}</time><strong>${h(l.username)} / ${h(l.action)} / ${h(l.target)}</strong><div>${h(l.details)}</div></div>
  `).join("");

  $.appSummaryList.innerHTML = state.apps.filter((a) => a.status === "稼働中").sort((a, b) => b.recordCount - a.recordCount).slice(0, 4).map((a) => `
    <div class="summary-item">
      <div><strong>${h(a.name)}</strong><div class="meta">${h(a.category)} / 作成者 ${h(a.creator)}</div></div>
      <div style="text-align:right"><div>${Number(a.recordCount).toLocaleString()}件</div><small>${h(a.updatedAt)}</small></div>
    </div>`).join("");

  $.opsChecklist.innerHTML = [["日次運用", state.ops.daily],["週次運用", state.ops.weekly],["月次運用", state.ops.monthly]].map(([title, items]) => `
    <div class="ops-col"><h4>${title}</h4><ul>${items.map((i) => `<li class="${i.done ? "done" : ""}">${h(i.text)}</li>`).join("")}</ul></div>
  `).join("");

  $.qualityCards.innerHTML = qualityRows().map((q) => `
    <div class="quality-card"><header><strong>${q.label}</strong><span class="badge ${q.cls}">${q.status}</span></header><p>${q.note}</p></div>
  `).join("");
  renderFaq();
}

function qualityRows() {
  return [
    { label: "E2E Test", status: "成功", cls: "success", note: "認証/ワークフロー/通知/バックアップ連携" },
    { label: "UAT", status: "実施済", cls: "success", note: "UAT計画・シナリオ・実行ログ・レポート反映" },
    { label: "Performance", status: "監視中", cls: "warning", note: "初期表示/検索応答/リソース監視" },
    { label: "Security", status: "対策済", cls: "success", note: "HTTPS・監査証跡・APIキー暗号化設計反映" }
  ];
}

function renderFaq() {
  const f = FAQS[faqIndex % FAQS.length];
  $.faqCard.innerHTML = `<div class="q">Q. ${h(f.q)}</div><div class="a">${h(f.a)}</div>`;
}

function renderDocs() {
  $.docsCountCaption.textContent = `参照ファイル: ${DOC_FILES.length}件（Excel含む）`;
  $.docsFileList.innerHTML = DOC_FILES.map((f) => `<li>${h(f)}</li>`).join("");
  const groups = [
    ["要件/仕様/設計", /(要件|仕様|設計|Screen|Functional|Database|API)/i],
    ["フェーズ/計画", /Phase|開発フェーズ計画/],
    ["テスト/UAT", /Test|UAT|Playwright|E2E/],
    ["運用/環境/デプロイ", /運用|Checklist|デプロイ|ロールバック|HTTPS|環境|Quick-Start|Auto-Start/],
    ["セキュリティ/監査/障害", /Security|セキュリティ|監査|Incident-Response|統合監査|Error-Detection/],
    ["ガイド/FAQ/教育", /Guide|FAQ|Training|MCP|用語集/]
  ];
  $.docsCategoryGrid.innerHTML = groups.map(([name, re]) => {
    const items = DOC_FILES.filter((f) => re.test(f));
    return `<div class="docs-category"><h4>${name}</h4><p><span class="count">${items.length}</span> 件</p><p>${items.slice(0,3).map(h).join(" / ")}${items.length > 3 ? " ..." : ""}</p></div>`;
  }).join("");
  $.docsMetaStamp.textContent = DocsMeta?.generatedAt ? `docs metadata generated: ${DocsMeta.generatedAt}` : "docs metadata: fallback (静的定義)";
  const docsEditor = state.settings?.docsEditor || {};
  const actionCount = Array.isArray(docsEditor.actionCandidates) ? docsEditor.actionCandidates.length : 0;
  $.excelMeta.innerHTML = `<strong>Excelテンプレート参照:</strong> AppSuite 業務プロセス構築運用.xlsx<br>シート数 ${EXCEL_SHEETS.length}（${EXCEL_SHEETS.slice(0, 6).join(" / ")} ...）<br>業務プロセス定義・要件一覧・非機能要件・設計ルール・テストシナリオ・改善ログをUIに反映。<br><span class="caption">Docs候補 ${actionCount}件 / 担当 ${h(docsEditor.owner || "-")} / 周期 ${h(String(docsEditor.reviewCycleDays || "-"))}日</span>`;
}

function renderUsers() {
  const f = state.ui.filters;
  const q = f.userSearch.toLowerCase().trim();
  const rows = state.users.filter((u) =>
    (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
    (f.userStatus === "all" || u.status === f.userStatus) &&
    (f.userRole === "all" || u.role === f.userRole)
  );
  $.usersTable.innerHTML = table(colLabels("users", ["id","username","email","department","role","status","lastLogin","updatedAt"]).concat(["操作"]), rows.map((u) => [
    u.id, u.username, u.email, u.department || "-", badge(u.role, u.role === "管理者" ? "violet" : "secondary"),
    badge(u.status, u.status === "有効" ? "success" : "secondary"), u.lastLogin || "-", u.updatedAt || "-", rowActions("user", u.id)
  ]));
}

function renderApps() {
  const f = state.ui.filters;
  const q = f.appSearch.toLowerCase().trim();
  const rows = state.apps.filter((a) =>
    (!q || a.name.toLowerCase().includes(q)) &&
    (f.appCategory === "all" || a.category === f.appCategory) &&
    (f.appStatus === "all" || a.status === f.appStatus)
  );
  $.appsTable.innerHTML = table(colLabels("apps", ["id","name","category","creator","recordCount","status","updatedAt","description"]).concat(["操作"]), rows.map((a) => [
    a.id, a.name, badge(a.category, "info"), a.creator, `${Number(a.recordCount).toLocaleString()}件`, badge(a.status, appStatusCls(a.status)), a.updatedAt || "-", a.description || "-", rowActions("app", a.id)
  ]));
}

function renderIncidents() {
  const f = state.ui.filters;
  const q = f.incidentSearch.toLowerCase().trim();
  const rows = state.incidents.filter((i) =>
    (!q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) &&
    (f.incidentStatus === "all" || i.status === f.incidentStatus) &&
    (f.incidentPriority === "all" || i.priority === f.incidentPriority)
  );
  $.incidentsTable.innerHTML = table(colLabels("incidents", ["id","title","appId","priority","status","reporter","assignee","reportedAt","resolvedAt"]).concat(["操作"]), rows.map((i) => [
    i.id, i.title, appName(i.appId), badge(`${prioDot(i.priority)} ${i.priority}`, prioCls(i.priority)), badge(`${statusDot(i.status)} ${i.status}`, incCls(i.status)),
    i.reporter, i.assignee || "-", i.reportedAt, i.resolvedAt || "-", rowActions("incident", i.id)
  ]));
}

function renderChanges() {
  const f = state.ui.filters;
  const q = f.changeSearch.toLowerCase().trim();
  const rows = state.changes.filter((c) =>
    (!q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) &&
    (f.changeType === "all" || c.type === f.changeType) &&
    (f.changeStatus === "all" || c.status === f.changeStatus)
  );
  $.changesTable.innerHTML = table(colLabels("changes", ["id","title","appId","type","status","requester","approver","plannedDate","completedDate"]).concat(["操作"]), rows.map((c) => [
    c.id, c.title, appName(c.appId), badge(c.type, changeTypeCls(c.type)), badge(c.status, changeStatusCls(c.status)), c.requester, c.approver || "-", c.plannedDate || "-", c.completedDate || "-", rowActions("change", c.id)
  ]));
}

function renderLogs() {
  const f = state.ui.filters;
  const rows = visibleLogs().filter((l) => {
    const d = l.timestamp.slice(0, 10);
    const metaType = detectMetaType(l.meta);
    return (!f.logFrom || d >= f.logFrom) &&
      (!f.logTo || d <= f.logTo) &&
      (f.logAction === "all" || l.action === f.logAction) &&
      (f.logTarget === "all" || l.target === f.logTarget) &&
      ((f.logMeta || "all") === "all" || metaType === f.logMeta);
  });
  const baseCols = ["timestamp","userId","username","action","target","targetId","details","ipAddress"];
  const cols = canPerm("logsMetaView") ? baseCols.concat(["meta"]) : baseCols;
  $.logsTable.innerHTML = renderLogsTable(cols, rows);
  if (state.ui.selectedLogId && !rows.some((l) => l.id === state.ui.selectedLogId)) {
    state.ui.selectedLogId = null;
  }
  renderLogDetailPanel();
  $.pageSizeInfo.textContent = String(state.settings.pageSize);
}

function renderLogsTable(cols, rows) {
  const labels = colLabels("logs", cols);
  const body = rows.length ? rows.map((l) => {
    const cells = [l.timestamp, l.userId, l.username, badge(l.action, logCls(l.action)), l.target, l.targetId || "-", l.details, l.ipAddress];
    if (canPerm("logsMetaView")) cells.push(renderLogMetaCell(l.meta));
    const selected = state.ui.selectedLogId === l.id ? " class=\"selected-row\"" : "";
    return `<tr data-log-row="${ha(l.id)}"${selected}>${cells.map((v) => `<td>${isHtml(v) ? v : h(String(v ?? ""))}</td>`).join("")}</tr>`;
  }).join("") : `<tr><td colspan="${cols.length}">該当データがありません</td></tr>`;
  return `<div class="table-wrap"><table class="table"><thead><tr>${labels.map((c) => `<th>${h(c)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderLogMetaCell(meta) {
  if (!meta) return `<span class="badge secondary">-</span>`;
  if (meta.diff && typeof meta.diff === "object") {
    const entries = Object.entries(meta.diff);
    const previewRows = entries.slice(0, 8).map(([k, v]) => `<tr><td>${h(k)}</td><td>${h(JSON.stringify(v.before))}</td><td>${h(JSON.stringify(v.after))}</td></tr>`).join("");
    return `<details><summary>diff (${entries.length})</summary><table class="diff-table"><thead><tr><th>field</th><th>before</th><th>after</th></tr></thead><tbody>${previewRows}</tbody></table><pre class="json-view">${h(JSON.stringify(meta, null, 2))}</pre></details>`;
  }
  return `<details><summary>meta</summary><pre class="json-view">${h(JSON.stringify(meta, null, 2))}</pre></details>`;
}

function detectMetaType(meta) {
  if (!meta) return "none";
  if (meta.diff) return "diff";
  const s = JSON.stringify(meta);
  if (/backup|restore|RESTORE|インポート|エクスポート/i.test(s)) return "backup";
  if (/CFG-|apiUrl|sessionTimeout|backupRetention|systemName|adminEmail/i.test(s)) return "settings";
  return "other";
}

function openLogDetail(logId) {
  state.ui.selectedLogId = logId;
  renderLogDetailPanel();
  renderLogs();
}

function closeLogDetail() {
  state.ui.selectedLogId = null;
  renderLogDetailPanel();
  renderLogs();
}

function renderLogDetailPanel() {
  if (!$.logDetailPanel) return;
  const canView = canPerm("logsMetaView");
  const log = (state.logs || []).find((l) => l.id === state.ui.selectedLogId);
  $.logDetailPanel.classList.toggle("hidden", !canView);
  if (!canView) return;
  if (!log) {
    $.logDetailEmpty?.classList.remove("hidden");
    if ($.logDetailTitle) $.logDetailTitle.textContent = "監査ログ詳細";
    if ($.logDetailBody) $.logDetailBody.innerHTML = "";
    return;
  }
  $.logDetailEmpty?.classList.add("hidden");
  if ($.logDetailDiffFilter) $.logDetailDiffFilter.value = state.ui.logDetailDiffFilter || "all";
  $.logDetailTitle.textContent = `${log.id} / ${log.action}`;
  $.logDetailBody.innerHTML = `
    <div class="log-detail-meta">
      <div><strong>日時</strong><span>${h(log.timestamp)}</span></div>
      <div><strong>ユーザー</strong><span>${h(log.username)} (${h(log.userId || "-")})</span></div>
      <div><strong>対象</strong><span>${h(log.target)} / ${h(log.targetId || "-")}</span></div>
      <div><strong>詳細</strong><span>${h(log.details || "-")}</span></div>
      <div><strong>IP</strong><span>${h(log.ipAddress || "-")}</span></div>
    </div>
    ${renderMetaDiffPanel(log.meta)}
  `;
}

function renderMetaDiffPanel(meta) {
  if (!meta) return `<div class="note-box">meta はありません</div>`;
  const diff = meta.diff && typeof meta.diff === "object" ? meta.diff : null;
  const mode = state.ui.logDetailDiffFilter || "all";
  const rows = diff ? Object.entries(diff).filter(([_, v]) => {
    if (mode === "beforeOnly") return v.before !== undefined && v.after === undefined;
    if (mode === "afterOnly") return v.before === undefined && v.after !== undefined;
    return true;
  }) : [];
  const diffPanel = diff ? `<div class="diff-compare">
    <header><h4>差分比較</h4><div class="diff-row">
      <span>before</span><span>after</span>
    </div></header>
    <div class="diff-columns">
      ${rows.map(([k, v]) => `<article class="diff-row ${v.before === undefined ? "after-only" : ""} ${v.after === undefined ? "before-only" : ""}">
        <div class="diff-field"><strong>${h(k)}</strong><span>${typeLabel(v)}</span></div>
        <div class="diff-value">${renderDiffValue(v.before)}</div>
        <div class="diff-value">${renderDiffValue(v.after)}</div>
      </article>`).join("")}
      ${rows.length === 0 ? `<div class="caption">表示対象の差分がありません</div>` : ""}
    </div>
  </div>` : "";
  return `${diffPanel}<details open><summary>meta JSON</summary><pre class="json-view">${h(JSON.stringify(meta, null, 2))}</pre></details>`;
}

function diffValueType(a, b) {
  const v = a !== undefined ? a : b;
  if (typeof v === "boolean") return "diff-bool";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(v)) return "diff-date";
  return "diff-generic";
}

function renderDiffValue(v) {
  if (v === undefined) return `<span class="diff-empty">-</span>`;
  if (typeof v === "boolean") return `<span class="badge ${v ? "success" : "secondary"}">${v ? "true" : "false"}</span>`;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return `<time>${h(v)}</time>`;
  return h(jsonLine(v));
}

function typeLabel(v) {
  const t = diffValueType(v.before, v.after);
  if (t === "diff-bool") return "Bool";
  if (t === "diff-date") return "Date";
  return "Value";
}

function jsonLine(v) {
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

function table(cols, rows) {
  return `<div class="table-wrap"><table class="table"><thead><tr>${cols.map((c) => `<th>${h(c)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr>${r.map((v) => `<td>${isHtml(v) ? v : h(String(v ?? ""))}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}">該当データがありません</td></tr>`}</tbody></table></div>`;
}

function rowActions(type, id) {
  if (!canEditRecord(type, id)) return `<span class="badge secondary">閲覧のみ</span>`;
  return `<div class="actions"><button data-row-action="edit" data-row-type="${type}" data-row-id="${id}">編集</button><button data-row-action="delete" data-row-type="${type}" data-row-id="${id}">削除</button></div>`;
}

function canEditRecord(type) {
  const id = arguments[1];
  const me = currentUser();
  const rr = state.settings?.rowLevelRules || DEFAULT.settings.rowLevelRules;
  if (type === "user") {
    if (canPerm("usersWrite")) return true;
    if (!rr.userSelfEditOnlyForUser) return false;
    return !!id && me?.id === id;
  }
  if (type === "app") return canPerm("appsWrite");
  if (type === "incident") {
    if (!canPerm("incidentsWrite")) return false;
    if (isAdmin()) return true;
    if (!rr.incidentOwnOrAssignedOnlyForUser) return true;
    const row = state.incidents.find((r) => r.id === id);
    return !!row && (row.reporter === me.username || row.assignee === me.username);
  }
  if (type === "change") {
    if (!canPerm("changesWrite")) return false;
    if (isAdmin()) return true;
    if (!rr.changeRequesterOnlyForUser) return true;
    const row = state.changes.find((r) => r.id === id);
    return !!row && row.requester === me.username;
  }
  return false;
}

function visibleLogs() {
  const admin = isAdmin();
  const me = currentUser();
  const rows = sortDesc(state.logs, "timestamp");
  return admin ? rows : rows.filter((l) => l.userId === me.id || l.username === me.username);
}

function onRowAction(btn) {
  const { rowAction, rowType, rowId } = btn.dataset;
  if (rowAction === "edit") return openModal(rowType, rowId);
  if (rowAction === "delete") return deleteRecord(rowType, rowId);
}

function deleteRecord(type, id) {
  if (!canEditRecord(type, id)) return toast("この操作は許可されていません", "error");
  const map = { user: "users", app: "apps", incident: "incidents", change: "changes" };
  const key = map[type];
  if (!key) return;
  const before = state[key].length;
  state[key] = state[key].filter((r) => r.id !== id);
  if (state[key].length === before) return;
  addLog(currentUser().username, "削除", targetName(type), id, `${id} を削除`);
  persist();
  populateFilters();
  renderTablesAndDash();
  toast(`${id} を削除しました`, "warning");
}

function openModal(type, editId = null) {
  if (!canEditRecord(type, editId)) return toast("この操作は許可されていません", "error");
  const cfg = modalConfig(type);
  if (!cfg) return;
  modalType = type;
  modalEditId = editId;
  const rec = editId ? cfg.list.find((x) => x.id === editId) : null;
  $.modalTitle.textContent = `${rec ? "編集" : "新規"}${cfg.title}`;
  $.modalBody.innerHTML = `<div class="form-grid">${cfg.fields.map((f) => modalField(f, rec || {})).join("")}</div>`;
  bindModalLiveValidation();
  lastFocusedBeforeModal = document.activeElement;
  $.modalBackdrop.classList.remove("hidden");
  $.modalBackdrop.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    getFocusableElements($.modalBackdrop)[0]?.focus();
  });
}

function closeModal() {
  $.modalBackdrop.classList.add("hidden");
  $.modalBackdrop.setAttribute("aria-hidden", "true");
  modalType = null;
  modalEditId = null;
  if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === "function") lastFocusedBeforeModal.focus();
  lastFocusedBeforeModal = null;
}

function modalConfig(type) {
  if (type === "user") return { title: "ユーザー", list: state.users, fields: [
    { key: "username", label: "ユーザー名", type: "text", req: 1 }, { key: "email", label: "メール", type: "email", req: 1 }, { key: "department", label: "部署", type: "text" },
    { key: "role", label: "権限", type: "select", opts: ["管理者","ユーザー"], req: 1 }, { key: "status", label: "ステータス", type: "select", opts: ["有効","無効"], req: 1 }
  ]};
  if (type === "app") return { title: "アプリ", list: state.apps, fields: [
    { key: "name", label: "アプリ名", type: "text", req: 1 }, { key: "category", label: "カテゴリ", type: "select", opts: ["業務管理","申請・承認","データ管理","その他"], req: 1 },
    { key: "creator", label: "作成者", type: "text", req: 1 }, { key: "recordCount", label: "レコード数", type: "number" }, { key: "status", label: "ステータス", type: "select", opts: ["稼働中","メンテナンス","停止中"], req: 1 },
    { key: "description", label: "説明", type: "textarea" }
  ]};
  if (type === "incident") return { title: "インシデント", list: state.incidents, fields: [
    { key: "title", label: "タイトル", type: "text", req: 1 }, { key: "description", label: "詳細説明", type: "textarea", req: 1 },
    { key: "appId", label: "対象アプリ", type: "select", opts: state.apps.map((a) => ({ value: a.id, label: `${a.id} / ${a.name}` })), req: 1 },
    { key: "priority", label: "優先度", type: "select", opts: ["高","中","低"], req: 1 }, { key: "status", label: "ステータス", type: "select", opts: ["オープン","対応中","解決済み","クローズ"], req: 1 },
    { key: "reporter", label: "報告者", type: "text", req: 1 }, { key: "assignee", label: "担当者", type: "text" }
  ]};
  if (type === "change") return { title: "変更要求", list: state.changes, fields: [
    { key: "title", label: "タイトル", type: "text", req: 1 }, { key: "description", label: "詳細説明", type: "textarea", req: 1 },
    { key: "appId", label: "対象アプリ", type: "select", opts: state.apps.map((a) => ({ value: a.id, label: `${a.id} / ${a.name}` })), req: 1 },
    { key: "type", label: "タイプ", type: "select", opts: ["機能追加","機能変更","バグ修正","改善"], req: 1 }, { key: "status", label: "ステータス", type: "select", opts: ["下書き","承認待ち","承認済み","実装中","完了","却下"], req: 1 },
    { key: "requester", label: "申請者", type: "text", req: 1 }, { key: "approver", label: "承認者", type: "text" }, { key: "plannedDate", label: "予定実施日", type: "date" }
  ]};
  return null;
}

function modalField(f, rec) {
  const v = rec[f.key] ?? (f.type === "select" ? (typeof f.opts[0] === "string" ? f.opts[0] : f.opts[0].value) : "");
  if (f.type === "textarea") return `<label>${f.label}${f.req ? " *" : ""}<textarea rows="4" data-form-key="${f.key}">${h(v)}</textarea><div class="field-error" data-field-error="${f.key}"></div></label>`;
  if (f.type === "select") {
    const opts = f.opts.map((o) => typeof o === "string" ? { value: o, label: o } : o);
    return `<label>${f.label}${f.req ? " *" : ""}<select data-form-key="${f.key}">${opts.map((o) => `<option value="${ha(o.value)}" ${String(v) === String(o.value) ? "selected" : ""}>${h(o.label)}</option>`).join("")}</select><div class="field-error" data-field-error="${f.key}"></div></label>`;
  }
  return `<label>${f.label}${f.req ? " *" : ""}<input type="${f.type}" data-form-key="${f.key}" value="${ha(v ?? "")}" /><div class="field-error" data-field-error="${f.key}"></div></label>`;
}

function saveModal() {
  if (!modalType) return;
  if (!canPerm("appsWrite") && modalType === "app") return toast("一般ユーザーはアプリ管理を編集できません", "error");
  const cfg = modalConfig(modalType);
  const val = {};
  clearModalFieldErrors();
  $.modalBody.querySelectorAll("[data-form-key]").forEach((el) => { val[el.dataset.formKey] = el.type === "number" ? Number(el.value || 0) : el.value.trim(); });
  const requiredField = cfg.fields.find((f) => f.req && !String(val[f.key] || "").trim());
  if (requiredField) {
    setModalFieldErrors({ [requiredField.key]: `${requiredField.label} は必須です` });
    focusFirstModalError({ [requiredField.key]: "required" });
    return toast("必須項目を入力してください", "error");
  }
  const vr = Validation ? Validation.validateRecord(modalType, val, { appIds: state.apps.map((a) => a.id), editableKeys: cfg.fields.map((f) => f.key) }) : { valid: true, errors: [] };
  if (!vr.valid) {
    setModalFieldErrors(vr.fieldErrors || {});
    focusFirstModalError(vr.fieldErrors || {});
    return toast(vr.errors[0], "error");
  }
  if ((modalType === "incident" || modalType === "change") && modalEditId && WorkflowRules) {
    const listKey = modalType === "incident" ? "incidents" : "changes";
    const old = state[listKey].find((r) => r.id === modalEditId);
    const result = WorkflowRules.canTransition(modalType, old?.status, val.status, { allowSkipStatus: modalType === "change" ? state.settings.allowSkipStatus : false });
    if (!result.ok) {
      setModalFieldErrors({ status: result.reason });
      focusFirstModalError({ status: result.reason });
      return toast(result.reason, "error");
    }
  }

  if (modalType === "user") upsert("users", val, "U", (v, old) => ({ ...old, ...v, createdAt: old?.createdAt || today(), updatedAt: today(), lastLogin: old?.lastLogin || "-" }));
  if (modalType === "app") upsert("apps", val, "A", (v, old) => ({ ...old, ...v, recordCount: Number(v.recordCount || old?.recordCount || 0), createdAt: old?.createdAt || today(), updatedAt: today() }));
  if (modalType === "incident") upsert("incidents", val, "INC-", (v, old) => ({ ...old, ...v, reportedAt: old?.reportedAt || nowMin(), resolvedAt: (v.status === "解決済み" || v.status === "クローズ") ? (old?.resolvedAt || nowMin()) : (old?.resolvedAt || "") }));
  if (modalType === "change") upsert("changes", val, "CHG-", (v, old) => ({ ...old, ...v, completedDate: v.status === "完了" ? (old?.completedDate || today()) : (old?.completedDate || "") }));

  closeModal();
  populateFilters();
  renderTablesAndDash();
  toast(`${cfg.title}を保存しました`, "success");
}

function clearModalFieldErrors() {
  $.modalBody.querySelectorAll("[data-field-error]").forEach((n) => { n.textContent = ""; n.classList.remove("active"); });
  $.modalBody.querySelectorAll("[data-form-key]").forEach((n) => n.classList.remove("input-error"));
}

function setModalFieldErrors(fieldErrors) {
  Object.entries(fieldErrors || {}).forEach(([key, msg]) => {
    const node = $.modalBody.querySelector(`[data-field-error="${CSS.escape(key)}"]`);
    if (node) { node.textContent = msg; node.classList.add("active"); }
    const input = $.modalBody.querySelector(`[data-form-key="${CSS.escape(key)}"]`);
    if (input) input.classList.add("input-error");
  });
}

function bindModalLiveValidation() {
  $.modalBody.querySelectorAll("[data-form-key]").forEach((el) => {
    const evt = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(evt, () => validateModalRealtime(el.dataset.formKey));
  });
}

function validateModalRealtime(focusKey) {
  if (!modalType) return;
  const values = {};
  $.modalBody.querySelectorAll("[data-form-key]").forEach((el) => { values[el.dataset.formKey] = el.type === "number" ? Number(el.value || 0) : el.value.trim(); });
  clearModalFieldErrors();
  const cfg = modalConfig(modalType);
  const r = Validation ? Validation.validateRecord(modalType, values, { appIds: state.apps.map((a) => a.id), editableKeys: cfg?.fields?.map((f) => f.key) || [] }) : { valid: true, fieldErrors: {} };
  if (!r.valid) setModalFieldErrors(r.fieldErrors || {});
  if (focusKey && r.fieldErrors && r.fieldErrors[focusKey]) focusFirstModalError({ [focusKey]: r.fieldErrors[focusKey] }, false);
}

function focusFirstModalError(fieldErrors, smooth = true) {
  const firstKey = Object.keys(fieldErrors || {})[0];
  if (!firstKey) return;
  const input = $.modalBody.querySelector(`[data-form-key="${CSS.escape(firstKey)}"]`);
  if (!input) return;
  input.focus();
  input.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
}

function upsert(key, values, prefix, mapFn) {
  const idx = modalEditId ? state[key].findIndex((r) => r.id === modalEditId) : -1;
  if (idx >= 0) {
    const old = state[key][idx];
    const next = { ...mapFn(values, old), id: old.id };
    state[key][idx] = next;
    addLog(currentUser().username, "更新", targetKeyName(key), old.id, `${old.id} を更新`, { diff: Validation ? Validation.diffObject(old, next) : undefined });
  } else {
    const id = nextId(prefix, state[key]);
    const next = { ...mapFn(values, null), id };
    state[key].unshift(next);
    addLog(currentUser().username, "作成", targetKeyName(key), id, `${id} を作成`, { created: next });
  }
  persist();
}

function hydrateSettings() {
  const s = state.settings;
  $.apiUrl.value = s.apiUrl; $.authMethod.value = s.authMethod; $.apiKey.value = s.apiKey; $.apiTimeout.value = s.timeout; $.syncInterval.value = s.syncInterval;
  $.systemName.value = s.systemName; $.orgName.value = s.orgName; $.adminEmail.value = s.adminEmail; $.language.value = s.language; $.dateFormat.value = s.dateFormat; $.pageSize.value = s.pageSize;
  $.smtpHost.value = s.smtpHost; $.smtpPort.value = s.smtpPort; $.smtpUser.value = s.smtpUser; $.smtpPass.value = s.smtpPass; $.smtpSsl.checked = s.smtpSsl;
  $.pwMinLength.value = s.pwMinLength; $.pwExpireDays.value = s.pwExpireDays; $.sessionTimeout.value = s.sessionTimeout; $.maxSessions.value = s.maxSessions; $.maxLoginAttempts.value = s.maxLoginAttempts; $.lockoutDuration.value = s.lockoutDuration;
  $.incidentAutoAssign.checked = s.incidentAutoAssign; $.incidentDefaultAssignee.value = s.incidentDefaultAssignee; $.incidentEscalation.value = s.incidentEscalation;
  $.changeRequireApproval.checked = s.changeRequireApproval; $.changeApprover.value = s.changeApprover; $.changeLeadTime.value = s.changeLeadTime; $.allowSkipStatus.checked = s.allowSkipStatus; $.requireComment.checked = s.requireComment;
  $.autoBackup.checked = s.autoBackup; $.backupInterval.value = s.backupInterval; $.backupRetention.value = s.backupRetention;
  if ($.backupSignatureMode) $.backupSignatureMode.value = s.backupSignatureMode || "sha256";
  if ($.backupHmacSecret) $.backupHmacSecret.value = s.backupHmacSecret || "";
  renderNotifyToggles();
  renderSecurityToggles();
}

function renderNotifyToggles() {
  const keys = [["notifyIncidentNew","新規インシデント通知"],["notifyIncidentHigh","高優先度通知"],["notifyChangeApproval","承認依頼通知"],["notifyChangeComplete","変更完了通知"]];
  $.notifyToggles.innerHTML = keys.map(([k, label]) => `<div class="check-row"><label><input type="checkbox" data-nt="${k}" ${state.settings[k] ? "checked" : ""}/> ${label}</label><span class="badge ${state.settings[k] ? "success" : "secondary"}">${state.settings[k] ? "ON" : "OFF"}</span></div>`).join("");
  $.notifyToggles.querySelectorAll("[data-nt]").forEach((c) => c.addEventListener("change", () => { state.settings[c.dataset.nt] = c.checked; persist(); renderNotifyToggles(); }));
}

function renderSecurityToggles() {
  const keys = [["pwRequireUpper","大文字必須"],["pwRequireNumber","数字必須"],["pwRequireSpecial","特殊文字必須"],["enableTwoFactor","二要素認証"]];
  $.securityChecks.innerHTML = keys.map(([k, label]) => `<div class="check-row"><label><input type="checkbox" data-sec="${k}" ${state.settings[k] ? "checked" : ""}/> ${label}</label><span class="badge ${state.settings[k] ? "success" : "secondary"}">${state.settings[k] ? "ON" : "OFF"}</span></div>`).join("");
  $.securityChecks.querySelectorAll("[data-sec]").forEach((c) => c.addEventListener("change", () => { state.settings[c.dataset.sec] = c.checked; persist(); renderSecurityToggles(); renderSecurityStatusPanel(); }));
}

function renderSettingsPanels() {
  hydrateSettings();
  renderApiStatus();
  renderSecurityStatusPanel();
  renderPermissionsEditor();
  renderDocsEditorForm();
  renderBackupHistory();
  renderConnectionPill();
  renderMockApiSyncStatus();
  renderMockApiSyncPanel();
}

function renderDocsEditorForm() {
  const d = state.settings?.docsEditor || DEFAULT.settings.docsEditor || {};
  if ($.docsEditorOwner) $.docsEditorOwner.value = d.owner || "";
  if ($.docsEditorReviewDays) $.docsEditorReviewDays.value = Number(d.reviewCycleDays || 30);
  if ($.docsEditorNote) $.docsEditorNote.value = d.note || "";
  docsActionDraft = (d.actionCandidates || []).map((row, i) => sanitizeDocsActionRow(row, i));
  docsActionValidation = validateDocsActionDraft(docsActionDraft);
  renderDocsActionsTable();
}

function makeDocsActionDraftRow() {
  return { id: `DOC-ACT-${String(Date.now()).slice(-6)}`, title: "", owner: "", status: "候補", note: "" };
}

function sanitizeDocsActionRow(row, index) {
  return {
    id: String(row?.id || `DOC-ACT-${String(index + 1).padStart(3, "0")}`),
    title: String(row?.title || "").trim(),
    owner: String(row?.owner || "").trim(),
    status: String(row?.status || "候補").trim(),
    note: String(row?.note || "").trim()
  };
}

function renderDocsActionsTable() {
  if (!$.docsActionsTable) return;
  const err = docsActionValidation || { rowErrors: {}, globalErrors: [] };
  const head = `<thead><tr><th>ID</th><th>タイトル</th><th>担当</th><th>状態</th><th>メモ</th><th>操作</th></tr></thead>`;
  const body = docsActionDraft.length ? docsActionDraft.map((row, index) => `
    <tr data-docs-row="${index}">
      <td><input data-docs-col="id" class="${err.rowErrors[index]?.id ? "input-error" : ""}" value="${ha(row.id)}" />${err.rowErrors[index]?.id ? `<div class="field-error active">${h(err.rowErrors[index].id)}</div>` : ""}</td>
      <td><input data-docs-col="title" class="${err.rowErrors[index]?.title ? "input-error" : ""}" value="${ha(row.title)}" />${err.rowErrors[index]?.title ? `<div class="field-error active">${h(err.rowErrors[index].title)}</div>` : ""}</td>
      <td><input data-docs-col="owner" class="${err.rowErrors[index]?.owner ? "input-error" : ""}" value="${ha(row.owner)}" />${err.rowErrors[index]?.owner ? `<div class="field-error active">${h(err.rowErrors[index].owner)}</div>` : ""}</td>
      <td>
        <select data-docs-col="status">
          ${["候補","レビュー待ち","進行中","完了","保留"].map((s) => `<option value="${ha(s)}" ${row.status === s ? "selected" : ""}>${h(s)}</option>`).join("")}
        </select>
      </td>
      <td><input data-docs-col="note" value="${ha(row.note)}" />${err.rowErrors[index]?.note ? `<div class="field-error active">${h(err.rowErrors[index].note)}</div>` : ""}</td>
      <td>
        <div class="actions">
          <button type="button" data-docs-action="up" data-docs-index="${index}">↑</button>
          <button type="button" data-docs-action="down" data-docs-index="${index}">↓</button>
          <button type="button" data-docs-action="delete" data-docs-index="${index}">削除</button>
        </div>
      </td>
    </tr>`).join("") : `<tr><td colspan="6">候補がありません。行追加で登録してください。</td></tr>`;
  const globalErrors = (err.globalErrors || []).length ? `<div class="field-error active">${err.globalErrors.map(h).join(" / ")}</div>` : "";
  $.docsActionsTable.innerHTML = `${globalErrors}<table class="table">${head}<tbody>${body}</tbody></table>`;
}

function captureDocsTableFocus() {
  const el = document.activeElement;
  if (!$.docsActionsTable || !el || !$.docsActionsTable.contains(el)) return null;
  return {
    row: el.closest("[data-docs-row]")?.dataset.docsRow || null,
    col: el.dataset.docsCol || null,
    tag: el.tagName,
    start: typeof el.selectionStart === "number" ? el.selectionStart : null,
    end: typeof el.selectionEnd === "number" ? el.selectionEnd : null
  };
}

function restoreDocsTableFocus(snapshot) {
  if (!snapshot?.row || !snapshot?.col) return;
  const selector = `[data-docs-row="${CSS.escape(String(snapshot.row))}"] [data-docs-col="${CSS.escape(String(snapshot.col))}"]`;
  const el = $.docsActionsTable?.querySelector(selector);
  if (!el) return;
  el.focus();
  if (snapshot.tag === "INPUT" && typeof snapshot.start === "number" && typeof el.setSelectionRange === "function") {
    el.setSelectionRange(snapshot.start, snapshot.end ?? snapshot.start);
  }
}

function rerenderDocsActionsTablePreservingFocus() {
  const snapshot = captureDocsTableFocus();
  renderDocsActionsTable();
  restoreDocsTableFocus(snapshot);
}

function onDocsActionsTableClick(e) {
  const btn = e.target.closest("[data-docs-action]");
  if (!btn) return;
  const index = Number(btn.dataset.docsIndex);
  if (Number.isNaN(index)) return;
  if (btn.dataset.docsAction === "delete") docsActionDraft.splice(index, 1);
  if (btn.dataset.docsAction === "up" && index > 0) [docsActionDraft[index - 1], docsActionDraft[index]] = [docsActionDraft[index], docsActionDraft[index - 1]];
  if (btn.dataset.docsAction === "down" && index < docsActionDraft.length - 1) [docsActionDraft[index + 1], docsActionDraft[index]] = [docsActionDraft[index], docsActionDraft[index + 1]];
  docsActionValidation = validateDocsActionDraft(docsActionDraft);
  rerenderDocsActionsTablePreservingFocus();
}

function onDocsActionsTableInput(e) {
  const rowEl = e.target.closest("[data-docs-row]");
  if (!rowEl || !e.target.matches("[data-docs-col]")) return;
  const idx = Number(rowEl.dataset.docsRow);
  if (Number.isNaN(idx) || !docsActionDraft[idx]) return;
  docsActionDraft[idx][e.target.dataset.docsCol] = String(e.target.value || "");
  docsActionValidation = validateDocsActionDraft(docsActionDraft);
  rerenderDocsActionsTablePreservingFocus();
}

function sortDocsActionDraft() {
  docsActionDraft = [...docsActionDraft].sort((a, b) =>
    `${a.owner}|${a.status}|${a.title}`.localeCompare(`${b.owner}|${b.status}|${b.title}`, "ja")
  );
  docsActionValidation = validateDocsActionDraft(docsActionDraft);
  renderDocsActionsTable();
}

function validateDocsActionDraft(rows) {
  const rowErrors = {};
  const globalErrors = [];
  const seen = new Map();
  (rows || []).forEach((r, index) => {
    const errs = {};
    if (!String(r.id || "").trim()) errs.id = "IDは必須です";
    if (!String(r.title || "").trim()) errs.title = "タイトルは必須です";
    if (!String(r.owner || "").trim()) errs.owner = "担当は必須です";
    const key = String(r.id || "").trim();
    if (key) {
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push(index);
    }
    if (Object.keys(errs).length) rowErrors[index] = errs;
  });
  [...seen.entries()].forEach(([id, idxs]) => {
    if (idxs.length <= 1) return;
    idxs.forEach((i) => {
      rowErrors[i] ||= {};
      rowErrors[i].id = `ID重複: ${id}`;
    });
    globalErrors.push(`重複ID: ${id}`);
  });
  return { valid: Object.keys(rowErrors).length === 0 && globalErrors.length === 0, rowErrors, globalErrors };
}

function renderMockApiSyncStatus() {
  if (!$.mockApiSyncBadge || !$.mockApiSyncMeta) return;
  const cls = mockApiSyncState.status === "ok" ? "success" : mockApiSyncState.status === "error" ? "danger" : "secondary";
  $.mockApiSyncBadge.className = `badge ${cls}`;
  $.mockApiSyncBadge.textContent = mockApiSyncState.label;
  $.mockApiSyncMeta.textContent = mockApiSyncState.message || "overlay: -";
}

function renderMockApiSyncPanel() {
  if (!$.mockApiCategorySelect || !$.mockApiSyncHistory) return;
  try {
    const info = MockApi?.getOverlayInfo?.();
    const categories = info?.categories || [];
    const current = $.mockApiCategorySelect.value;
    $.mockApiCategorySelect.innerHTML = `<option value="">カテゴリを選択</option>${categories.map((c) => `<option value="${ha(c.key)}">${h(c.key)}</option>`).join("")}`;
    if ([...$.mockApiCategorySelect.options].some((o) => o.value === current)) $.mockApiCategorySelect.value = current;
    const history = info?.history || [];
    $.mockApiSyncHistory.innerHTML = history.length
      ? history.map((hRow) => `<div class="backup-item"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><strong>${h(hRow.category || "-")}</strong><span class="badge ${hRow.ok ? "success" : "danger"}">${hRow.ok ? "OK" : "NG"}</span></div><div style="margin-top:6px;color:var(--muted);font-size:0.82rem">${h(hRow.at || "-")} / target=${h(hRow.target || "-")}</div>${hRow.error ? `<div class="field-error active">${h(hRow.error)}</div>` : ""}</div>`).join("")
      : `<div class="note-box">同期履歴はありません</div>`;
  } catch (e) {
    $.mockApiSyncHistory.innerHTML = `<div class="note-box warning">mockApi 情報取得に失敗: ${h(e.message)}</div>`;
  }
}

function setMockApiSyncStatus(result, fallback) {
  const ok = !!result?.ok;
  mockApiSyncState = {
    status: ok ? "ok" : "error",
    label: ok ? "mockApi 同期OK" : "mockApi 同期NG",
    updatedAt: result?.updatedAt || null,
    category: result?.category || fallback?.category || null,
    message: ok
      ? `overlay: ${result?.category || fallback?.category || "-"} / ${result?.updatedAt || "-"}`
      : `overlay: ${result?.category || fallback?.category || "-"} / ${result?.error || "unknown"}`
  };
  renderMockApiSyncStatus();
  renderMockApiSyncPanel();
}

function refreshMockApiSyncIndicatorFromInfo(showToast = false) {
  try {
    const info = MockApi?.getOverlayInfo?.();
    if (!info) return;
    mockApiSyncState = info.hasOverlay
      ? {
          status: "ok",
          label: "mockApi オーバーレイ有効",
          updatedAt: info.updatedAt || null,
          category: info.lastWrite?.category || info.lastWrite?.target || null,
          message: `overlay: ${(info.lastWrite?.category || info.lastWrite?.target || "-")} / ${info.updatedAt || "-"}`
        }
      : {
          status: "idle",
          label: "mockApi 未同期",
          updatedAt: null,
          category: null,
          message: "overlay: -"
        };
    renderMockApiSyncStatus();
    renderMockApiSyncPanel();
    if (showToast) toast("mockApi 同期情報を再読込しました", "info");
  } catch (_) {
    // noop
  }
}

function removeSelectedMockApiCategory() {
  const category = $.mockApiCategorySelect?.value;
  if (!category) return toast("削除するカテゴリを選択してください", "error");
  if (!confirm(`overlay カテゴリ "${category}" を削除しますか？`)) return;
  const result = MockApi?.removeCategory?.(category);
  setMockApiSyncStatus(result, { category });
  refreshMockApiSyncIndicatorFromInfo();
  toast(result?.ok ? `カテゴリ ${category} を削除しました` : `カテゴリ削除失敗: ${result?.error || "unknown"}`, result?.ok ? "success" : "error");
}

function resetMockApiOverlayFromUI() {
  if (!confirm("mockApi overlay を全体リセットしますか？")) return;
  const result = MockApi?.resetOverlay?.();
  setMockApiSyncStatus(result, { category: "-" });
  refreshMockApiSyncIndicatorFromInfo();
  toast(result?.ok ? "mockApi overlay をリセットしました" : `overlay リセット失敗: ${result?.error || "unknown"}`, result?.ok ? "success" : "error");
}

function persistStateOnly() {
  persist();
}

function persistSettingsOverlayToMockApi(keys, metaTarget = "settings") {
  try {
    if (!MockApi?.patchState) return;
    const patch = { settings: {} };
    keys.forEach((k) => { patch.settings[k] = structuredClone(state.settings[k]); });
    const category = `settings/${String(metaTarget).replace(/^settings-?/, "")}`;
    const result = MockApi.patchState(patch, { target: metaTarget, category, keys });
    setMockApiSyncStatus(result, { category });
    return result;
  } catch (e) {
    console.warn("mockApi settings patch failed", e);
    setMockApiSyncStatus({ ok: false, error: e.message || "patch_failed" }, { category: metaTarget });
  }
}

function persistStateAndSettingsOverlay(keys, metaTarget) {
  persistStateOnly();
  persistSettingsOverlayToMockApi(keys, metaTarget);
}

function saveApi() {
  if (!canPerm("settingsWrite")) return toast("管理者のみ設定変更できます", "error");
  const before = { ...state.settings };
  state.settings.apiUrl = $.apiUrl.value.trim();
  state.settings.authMethod = $.authMethod.value;
  state.settings.apiKey = $.apiKey.value.trim();
  state.settings.timeout = Number($.apiTimeout.value || 30);
  state.settings.syncInterval = Number($.syncInterval.value || 15);
  const sr = Validation ? Validation.validateSettings(state.settings) : { valid: true, errors: [] };
  if (!sr.valid) { Object.assign(state.settings, before); return toast(sr.errors[0], "error"); }
  addLog(currentUser().username, "更新", "設定", "CFG-API", "API接続設定を保存", { diff: Validation ? Validation.diffObject(before, state.settings, ["apiUrl","authMethod","timeout","syncInterval"]) : undefined });
  persistStateAndSettingsOverlay(["apiUrl","authMethod","apiKey","timeout","syncInterval"], "settings-api");
  renderApiStatus();
  renderLogs();
  renderDashboard();
  toast("API接続設定を保存しました", "success");
}

function testConnection() {
  if (!canPerm("settingsWrite")) return toast("管理者のみ接続テストできます", "error");
  saveApi();
  const ok = !!(state.settings.apiUrl && state.settings.apiKey);
  state.connection.connected = ok;
  state.connection.status = ok ? "接続済み" : "未接続";
  state.connection.lastSync = ok ? nowMin() : "-";
  state.connection.version = ok ? "DeskNet's Neo v7.4 (demo)" : "-";
  addLog(currentUser().username, "更新", "設定", "CFG-API", ok ? "接続テスト成功" : "接続テスト失敗", { result: ok, apiUrl: state.settings.apiUrl, authMethod: state.settings.authMethod });
  persistStateOnly();
  try {
    const r = MockApi?.patchState?.({ connection: structuredClone(state.connection) }, { target: "connection-test", category: "connection/runtime" });
    if (r) setMockApiSyncStatus(r, { category: "connection/runtime" });
  } catch (e) {
    console.warn("mockApi connection patch failed", e);
    setMockApiSyncStatus({ ok: false, error: e.message || "patch_failed" }, { category: "connection/runtime" });
  }
  renderApiStatus();
  renderConnectionPill();
  renderLogs();
  renderDashboard();
  toast(ok ? "API接続テスト成功（デモ）" : "接続テスト失敗（URL/APIキー確認）", ok ? "success" : "error");
}

function saveBasic() {
  if (!canPerm("settingsWrite")) return toast("管理者のみ設定変更できます", "error");
  const before = { ...state.settings };
  Object.assign(state.settings, { systemName: $.systemName.value.trim(), orgName: $.orgName.value.trim(), adminEmail: $.adminEmail.value.trim(), language: $.language.value, dateFormat: $.dateFormat.value.trim(), pageSize: Number($.pageSize.value || 25) });
  const sr = Validation ? Validation.validateSettings(state.settings) : { valid: true, errors: [] };
  if (!sr.valid) { Object.assign(state.settings, before); return toast(sr.errors[0], "error"); }
  addLog(currentUser().username, "更新", "設定", "CFG-BASIC", "基本設定を保存", { diff: Validation ? Validation.diffObject(before, state.settings, ["systemName","orgName","adminEmail","language","dateFormat","pageSize"]) : undefined });
  persistStateAndSettingsOverlay(["systemName","orgName","adminEmail","language","dateFormat","pageSize"], "settings-basic"); renderLogs(); toast("基本設定を保存しました", "success");
}

function saveNotify() {
  if (!canPerm("settingsWrite")) return toast("管理者のみ設定変更できます", "error");
  const before = { ...state.settings };
  Object.assign(state.settings, { smtpHost: $.smtpHost.value.trim(), smtpPort: Number($.smtpPort.value || 587), smtpUser: $.smtpUser.value.trim(), smtpPass: $.smtpPass.value, smtpSsl: $.smtpSsl.checked });
  addLog(currentUser().username, "更新", "設定", "CFG-NOTIFY", "通知設定を保存", { diff: Validation ? Validation.diffObject(before, state.settings, ["smtpHost","smtpPort","smtpUser","smtpSsl","notifyIncidentNew","notifyIncidentHigh","notifyChangeApproval","notifyChangeComplete"]) : undefined });
  persistStateAndSettingsOverlay(["smtpHost","smtpPort","smtpUser","smtpPass","smtpSsl","notifyIncidentNew","notifyIncidentHigh","notifyChangeApproval","notifyChangeComplete"], "settings-notify"); renderLogs(); toast("通知設定を保存しました", "success");
}

function saveSecurity() {
  if (!canPerm("settingsWrite")) return toast("管理者のみ設定変更できます", "error");
  const before = { ...state.settings };
  Object.assign(state.settings, { pwMinLength: Number($.pwMinLength.value || 8), pwExpireDays: Number($.pwExpireDays.value || 90), sessionTimeout: Number($.sessionTimeout.value || 30), maxSessions: Number($.maxSessions.value || 3), maxLoginAttempts: Number($.maxLoginAttempts.value || 5), lockoutDuration: Number($.lockoutDuration.value || 15) });
  const sr = Validation ? Validation.validateSettings(state.settings) : { valid: true, errors: [] };
  if (!sr.valid) { Object.assign(state.settings, before); return toast(sr.errors[0], "error"); }
  addLog(currentUser().username, "更新", "設定", "CFG-SEC", "セキュリティ設定を保存", { diff: Validation ? Validation.diffObject(before, state.settings, ["pwMinLength","pwExpireDays","sessionTimeout","maxSessions","maxLoginAttempts","lockoutDuration","pwRequireUpper","pwRequireNumber","pwRequireSpecial","enableTwoFactor"]) : undefined });
  persistStateAndSettingsOverlay(["pwMinLength","pwExpireDays","sessionTimeout","maxSessions","maxLoginAttempts","lockoutDuration","pwRequireUpper","pwRequireNumber","pwRequireSpecial","enableTwoFactor"], "settings-security"); renderSecurityStatusPanel(); renderLogs(); toast("セキュリティ設定を保存しました", "success");
}

function saveWorkflow() {
  if (!canPerm("settingsWrite")) return toast("管理者のみ設定変更できます", "error");
  const before = { ...state.settings };
  Object.assign(state.settings, { incidentAutoAssign: $.incidentAutoAssign.checked, incidentDefaultAssignee: $.incidentDefaultAssignee.value, incidentEscalation: Number($.incidentEscalation.value || 24), changeRequireApproval: $.changeRequireApproval.checked, changeApprover: $.changeApprover.value, changeLeadTime: Number($.changeLeadTime.value || 3), allowSkipStatus: $.allowSkipStatus.checked, requireComment: $.requireComment.checked });
  addLog(currentUser().username, "更新", "設定", "CFG-WF", "ワークフロー設定を保存", { diff: Validation ? Validation.diffObject(before, state.settings, ["incidentAutoAssign","incidentDefaultAssignee","incidentEscalation","changeRequireApproval","changeApprover","changeLeadTime","allowSkipStatus","requireComment"]) : undefined });
  persistStateAndSettingsOverlay(["incidentAutoAssign","incidentDefaultAssignee","incidentEscalation","changeRequireApproval","changeApprover","changeLeadTime","allowSkipStatus","requireComment"], "settings-workflow"); renderLogs(); toast("ワークフロー設定を保存しました", "success");
}

function saveBackupSettings() {
  if (!canPerm("settingsWrite")) return toast("管理者のみ設定変更できます", "error");
  const before = { ...state.settings };
  Object.assign(state.settings, {
    autoBackup: $.autoBackup.checked,
    backupInterval: $.backupInterval.value,
    backupRetention: Number($.backupRetention.value || 7),
    backupSignatureMode: $.backupSignatureMode?.value || "sha256",
    backupHmacSecret: $.backupHmacSecret?.value || ""
  });
  if (state.settings.backupSignatureMode === "hmac-sha256" && !String(state.settings.backupHmacSecret || "").trim()) {
    Object.assign(state.settings, before);
    return toast("HMAC-SHA256 を利用する場合は HMAC秘密鍵を入力してください", "error");
  }
  state.backups = state.backups.slice(0, Math.max(1, state.settings.backupRetention));
  addLog(currentUser().username, "更新", "設定", "CFG-BK", "バックアップ設定を保存", { diff: Validation ? Validation.diffObject(before, state.settings, ["autoBackup","backupInterval","backupRetention","backupSignatureMode"]) : undefined });
  persistStateAndSettingsOverlay(["autoBackup","backupInterval","backupRetention","backupSignatureMode","backupHmacSecret"], "settings-backup"); renderBackupHistory(); renderLogs(); toast("バックアップ設定を保存しました", "success");
}

function createBackup() {
  if (!canPerm("backupRun")) return toast("管理者のみバックアップできます", "error");
  const t = nowMin();
  state.backups.unshift({ id: `BK-${t.replace(/[ :]/g, "-")}`, time: t, type: "manual", size: `${(1.6 + Math.random() * 0.4).toFixed(1)}MB`, status: "成功", integrity: "OK" });
  state.backups = state.backups.slice(0, Math.max(1, state.settings.backupRetention));
  addLog(currentUser().username, "作成", "バックアップ", state.backups[0].id, "手動バックアップ作成", { backup: state.backups[0] });
  persist(); renderBackupHistory(); renderLogs(); renderDashboard(); toast("バックアップを作成しました（デモ）", "success");
}

function restoreBackup() {
  if (!canPerm("backupImport")) return toast("管理者のみインポートできます", "error");
  $.backupImportFile.value = "";
  if ($.backupImportPreview) { $.backupImportPreview.classList.add("hidden"); $.backupImportPreview.innerHTML = ""; }
  $.backupImportFile.click();
}

function approveDemo() {
  const c = state.changes.find((x) => x.status === "承認待ち");
  if (!c) return toast("承認待ちの変更要求がありません", "info");
  if (WorkflowRules) {
    const tr = WorkflowRules.canTransition("change", c.status, "承認済み", { allowSkipStatus: state.settings.allowSkipStatus });
    if (!tr.ok) return toast(tr.reason, "error");
  }
  const before = { ...c };
  c.status = "承認済み";
  c.approver = state.settings.changeApprover;
  addLog(currentUser().username, "更新", "変更要求", c.id, `${c.id} を承認済みへ変更`, { diff: Validation ? Validation.diffObject(before, c) : undefined });
  persist(); renderChanges(); renderDashboard(); renderLogs(); toast(`${c.id} を承認しました`, "success");
}

function initStaticSelects() {
  selectFill($.authMethod, [{ value: "bearer", label: "Bearer Token" }, { value: "basic", label: "Basic認証" }, { value: "apikey", label: "APIキー" }]);
  selectFill($.language, [{ value: "ja", label: "日本語" }, { value: "en", label: "English" }]);
  selectFill($.changeApprover, [{ value: "manager", label: "manager" }, { value: "admin", label: "admin" }]);
  selectFill($.backupInterval, [{ value: "daily", label: "daily" }, { value: "weekly", label: "weekly" }, { value: "monthly", label: "monthly" }]);
}

function populateFilters() {
  selectFill($.userStatusFilter, ["有効","無効"], "ステータス: すべて");
  selectFill($.userRoleFilter, ["管理者","ユーザー"], "権限: すべて");
  selectFill($.appCategoryFilter, uniq(state.apps.map((a) => a.category)), "カテゴリ: すべて");
  selectFill($.appStatusFilter, uniq(state.apps.map((a) => a.status)), "状態: すべて");
  selectFill($.incidentStatusFilter, ["オープン","対応中","解決済み","クローズ"], "ステータス: すべて");
  selectFill($.incidentPriorityFilter, ["高","中","低"], "優先度: すべて");
  selectFill($.changeTypeFilter, ["機能追加","機能変更","バグ修正","改善"], "タイプ: すべて");
  selectFill($.changeStatusFilter, ["下書き","承認待ち","承認済み","実装中","完了","却下"], "ステータス: すべて");
  selectFill($.logActionFilter, uniq(state.logs.map((l) => l.action)), "操作タイプ: すべて");
  selectFill($.logTargetFilter, uniq(state.logs.map((l) => l.target)), "対象: すべて");
  selectFill($.incidentDefaultAssignee, state.users.filter((u) => u.status === "有効").map((u) => ({ value: u.username, label: u.username })));
  if ($.logMetaFilter) $.logMetaFilter.value = state.ui.filters.logMeta || "all";
}

function syncFilterInputs() {
  const f = state.ui.filters;
  [["userSearch",f.userSearch],["userStatusFilter",f.userStatus],["userRoleFilter",f.userRole],["appSearch",f.appSearch],["appCategoryFilter",f.appCategory],["appStatusFilter",f.appStatus],["incidentSearch",f.incidentSearch],["incidentStatusFilter",f.incidentStatus],["incidentPriorityFilter",f.incidentPriority],["changeSearch",f.changeSearch],["changeTypeFilter",f.changeType],["changeStatusFilter",f.changeStatus],["logFrom",f.logFrom],["logTo",f.logTo],["logActionFilter",f.logAction],["logTargetFilter",f.logTarget],["logMetaFilter",f.logMeta]].forEach(([id,v]) => { if ($[id]) $[id].value = v ?? ""; });
}

function resetFilters(kind) {
  if (kind === "user") Object.assign(state.ui.filters, { userSearch: "", userStatus: "all", userRole: "all" });
  if (kind === "app") Object.assign(state.ui.filters, { appSearch: "", appCategory: "all", appStatus: "all" });
  if (kind === "incident") Object.assign(state.ui.filters, { incidentSearch: "", incidentStatus: "all", incidentPriority: "all" });
  if (kind === "change") Object.assign(state.ui.filters, { changeSearch: "", changeType: "all", changeStatus: "all" });
  if (kind === "log") Object.assign(state.ui.filters, { logFrom: "", logTo: "", logAction: "all", logTarget: "all", logMeta: "all" });
  syncFilterInputs();
  renderTablesAndDash();
  persist();
}

function renderApiStatus() {
  const s = state.settings;
  const authLabel = ({ bearer: "Bearer Token", basic: "Basic認証", apikey: "APIキー" })[s.authMethod] || s.authMethod;
  const rows = [
    ["API接続", state.connection.status, state.connection.connected ? "success" : "warning"],
    ["最終同期", state.connection.lastSync, "info"],
    ["バージョン", state.connection.version, "secondary"],
    ["認証方式", authLabel, "info"],
    ["APIキー暗号化", "設計反映（詳細設計_APIキー暗号化）", "success"],
    ["IndexedDB移行", "詳細設計あり（段階移行）", "violet"]
  ];
  $.apiStatusCards.innerHTML = rows.map((r) => `<div class="status-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><strong>${h(r[0])}</strong><span class="badge ${r[2]}">${h(r[1])}</span></div></div>`).join("");
}

function renderSecurityStatusPanel() {
  const s = state.settings;
  const rows = [
    ["HTTPS運用", "設定手順書あり / 本番推奨", "success"],
    ["監査証跡", `${state.logs.length}件記録`, "info"],
    ["セッション管理", `${s.sessionTimeout}分 / 最大${s.maxSessions}セッション`, "warning"],
    ["パスワードポリシー", `最小${s.pwMinLength}文字・期限${s.pwExpireDays}日`, "info"],
    ["二要素認証", s.enableTwoFactor ? "有効" : "無効", s.enableTwoFactor ? "success" : "secondary"],
    ["統合監査", "統合監査レポート 2026-02-11 参照", "violet"]
  ];
  $.securityStatusList.innerHTML = rows.map((r) => `<div class="status-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><strong>${h(r[0])}</strong><span class="badge ${r[2]}">${h(r[1])}</span></div></div>`).join("");
}

function permissionKeys() {
  return [
    ["usersRead","ユーザー閲覧"],["usersWrite","ユーザー編集"],
    ["appsRead","アプリ閲覧"],["appsWrite","アプリ編集"],
    ["incidentsRead","インシデント閲覧"],["incidentsWrite","インシデント編集"],
    ["changesRead","変更閲覧"],["changesWrite","変更編集"],["changesApprove","変更承認"],
    ["logsRead","監査ログ閲覧"],["logsExport","監査ログCSV出力"],["logsMetaView","監査ログmeta表示"],
    ["settingsRead","設定閲覧"],["settingsWrite","設定編集"],
    ["backupRun","バックアップ作成"],["backupExport","バックアップExport"],["backupImport","バックアップImport"]
  ];
}

function renderPermissionsEditor() {
  if (!$.permissionsEditor) return;
  const roles = getRoleList();
  const rows = permissionKeys();
  $.permissionsEditor.innerHTML = `
    <div class="note-box">ロール定義を設定値として管理します。行単位制御（自分のデータのみ等）は別途業務ルールとして適用されます。</div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>機能</th>${roles.map((r) => `<th>${h(r)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map(([key, label]) => `<tr>
            <td><code>${h(key)}</code><div class="caption">${h(label)}</div></td>
            ${roles.map((role) => {
              const checked = !!(state.settings.rolePermissions?.[role]?.[key]);
              return `<td><label class="inline-check"><input type="checkbox" data-perm-role="${ha(role)}" data-perm-key="${ha(key)}" ${checked ? "checked" : ""} /> ${checked ? "許可" : "禁止"}</label></td>`;
            }).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
  renderRowLevelRulesEditor();
  renderCustomRoleControls();
}

function getRoleList() {
  const custom = state.settings.customRoles || [];
  return Array.from(new Set([...BUILTIN_ROLES, ...custom]));
}

function renderCustomRoleControls() {
  if (!$.permissionsEditor) return;
  const containerId = "customRoleControls";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    $.permissionsEditor.appendChild(container);
  }
  const roleOptions = getRoleList().map((r) => `<option value="${ha(r)}">${h(r)}</option>`).join("");
  container.innerHTML = `
    <div class="form-grid">
      <label>新規ロール名<input id="customRoleName" type="text" placeholder="例: 監査担当" /></label>
      <label>コピー元ロール<select id="customRoleBase">${roleOptions}</select></label>
      <button class="btn primary" id="addCustomRoleBtn">ロール作成</button>
      <label>削除候補<select id="customRoleDelete">${state.settings.customRoles.map((r) => `<option value="${ha(r)}">${h(r)}</option>`).join("")}</select></label>
      <button class="btn ghost" id="removeCustomRoleBtn">ロール削除</button>
    </div>
  `;
  document.getElementById("addCustomRoleBtn")?.addEventListener("click", addCustomRoleFromUI);
  document.getElementById("removeCustomRoleBtn")?.addEventListener("click", removeCustomRoleFromUI);
}

function addCustomRoleFromUI() {
  const input = document.getElementById("customRoleName");
  const base = document.getElementById("customRoleBase")?.value;
  if (!input) return;
  const name = input.value.trim();
  if (!name) return toast("ロール名を入力してください", "error");
  if (BUILTIN_ROLES.includes(name) || (state.settings.customRoles || []).includes(name)) return toast("ロール名が重複しています", "error");
  addCustomRole(name, base);
}

function addCustomRole(name, base) {
  const basePermissions = state.settings.rolePermissions?.[base] || state.settings.rolePermissions?.[BUILTIN_ROLES[0]] || {};
  state.settings.rolePermissions[name] = structuredClone(basePermissions);
  state.settings.customRoles = [...new Set([...(state.settings.customRoles || []), name])];
  persist();
  renderPermissionsEditor();
  toast(`${name} ロールを作成しました`, "success");
}

function removeCustomRoleFromUI() {
  const select = document.getElementById("customRoleDelete");
  if (!select) return;
  const name = select.value;
  if (!name) return;
  removeCustomRole(name);
}

function removeCustomRole(name) {
  state.settings.customRoles = (state.settings.customRoles || []).filter((r) => r !== name);
  delete state.settings.rolePermissions[name];
  persist();
  renderPermissionsEditor();
  toast(`${name} ロールを削除しました`, "info");
}

function renderRowLevelRulesEditor() {
  if (!$.rowLevelRulesEditor) return;
  const rr = state.settings.rowLevelRules || DEFAULT.settings.rowLevelRules;
  const items = [
    ["userSelfEditOnlyForUser", "一般ユーザーは自分のユーザー行のみ編集可"],
    ["incidentOwnOrAssignedOnlyForUser", "一般ユーザーは担当/報告インシデントのみ編集可"],
    ["changeRequesterOnlyForUser", "一般ユーザーは自分が申請した変更要求のみ編集可"]
  ];
  $.rowLevelRulesEditor.innerHTML = `<div class="checklist">${
    items.map(([k, label]) => `<div class="check-row"><label><input type="checkbox" data-row-rule="${ha(k)}" ${rr[k] ? "checked" : ""}/> ${h(label)}</label><span class="badge ${rr[k] ? "success" : "secondary"}">${rr[k] ? "ON" : "OFF"}</span></div>`).join("")
  }</div>`;
}

function collectPermissionSettingsFromUI() {
  const next = merge(structuredClone(DEFAULT.settings.rolePermissions), {});
  $.permissionsEditor?.querySelectorAll("[data-perm-role][data-perm-key]").forEach((el) => {
    const role = el.dataset.permRole;
    const key = el.dataset.permKey;
    next[role] ||= {};
    next[role][key] = !!el.checked;
  });
  return next;
}

function savePermissions() {
  if (!canPerm("settingsWrite")) return toast("管理者のみ設定変更できます", "error");
  const before = structuredClone(state.settings.rolePermissions || {});
  const beforeRules = structuredClone(state.settings.rowLevelRules || {});
  const next = collectPermissionSettingsFromUI();
  const nextRules = merge(structuredClone(DEFAULT.settings.rowLevelRules), {});
  $.rowLevelRulesEditor?.querySelectorAll("[data-row-rule]").forEach((el) => { nextRules[el.dataset.rowRule] = !!el.checked; });
  state.settings.rolePermissions = next;
  state.settings.rowLevelRules = nextRules;
  addLog(currentUser().username, "更新", "設定", "CFG-PERM", "権限設定を保存", {
    diff: Validation ? { ...Validation.diffObject(before, next), rowLevelRules: Validation.diffObject(beforeRules, nextRules) } : undefined
  });
  persistStateOnly();
  persistSettingsOverlayToMockApi(["rolePermissions","rowLevelRules","customRoles"], "settings-rbac");
  applyRoleUI();
  renderTablesAndDash();
  renderLogs();
  toast("権限設定を保存しました", "success");
}

function saveDocsEditor() {
  if (!canPerm("settingsWrite")) return toast("管理者のみ設定変更できます", "error");
  try {
    const actions = docsActionDraft.map((row, index) => sanitizeDocsActionRow(row, index));
    docsActionValidation = validateDocsActionDraft(actions);
    renderDocsActionsTable();
    if (!docsActionValidation.valid) {
      const firstErrRow = Number(Object.keys(docsActionValidation.rowErrors || {})[0] || 0);
      $.docsActionsTable?.querySelector(`[data-docs-row="${firstErrRow}"] input, [data-docs-row="${firstErrRow}"] select`)?.focus();
      throw new Error("Docs アクション候補に入力不備があります");
    }
    const before = structuredClone(state.settings.docsEditor || {});
    state.settings.docsEditor = {
      owner: $.docsEditorOwner?.value?.trim() || "",
      reviewCycleDays: Number($.docsEditorReviewDays?.value || 30),
      note: $.docsEditorNote?.value?.trim() || "",
      actionCandidates: actions
    };
    addLog(currentUser().username, "更新", "設定", "CFG-DOCS", "Docsエディタ設定を保存", {
      diff: Validation ? Validation.diffObject(before, state.settings.docsEditor) : undefined
    });
    persistStateOnly();
    persistSettingsOverlayToMockApi(["docsEditor"], "settings-docs");
    renderDocsEditorForm();
    renderDocs();
    renderLogs();
    toast("Docs 設定を保存しました", "success");
  } catch (e) {
    toast(`Docs 設定保存エラー: ${e.message}`, "error");
  }
}

function renderBackupHistory() {
  $.backupHistory.innerHTML = state.backups.map((b) => `<div class="backup-item"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><strong>${h(b.id)}</strong><span class="badge ${b.status === "成功" ? "success" : "danger"}">${h(b.status)}</span></div><div style="margin-top:6px;color:var(--muted);font-size:0.82rem">${h(b.time)} / ${h(b.type)} / ${h(b.size)}</div><div style="margin-top:6px"><span class="badge ${(b.integrity || "OK") === "OK" ? "success" : "danger"}">整合性: ${h(b.integrity || "OK")}</span></div></div>`).join("");
}

function renderConnectionPill() {
  $.connectionPill.classList.toggle("connected", state.connection.connected);
  $.connectionPill.querySelector("span:last-child").textContent = `API ${state.connection.status}`;
  $.sidebarConnection.textContent = state.connection.status;
}

function refreshDash(toastOn = false) {
  if (state.connection.connected) state.connection.lastSync = nowMin();
  persist();
  renderDashboard();
  renderConnectionPill();
  if (toastOn) toast("ダッシュボードを更新しました", "info");
}

function startAutoRefresh() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => refreshDash(false), Number($.refreshInterval.value || 30) * 1000);
}

function completeDailyOps() {
  let changed = false;
  state.ops.daily = state.ops.daily.map((i) => (i.done ? i : (changed = true, { ...i, done: true })));
  if (!changed) return toast("日次チェックはすでに完了済みです", "info");
  addLog(currentUser().username, "更新", "運用", "OPS-DAILY", "日次運用チェック完了");
  persist(); renderDashboard(); renderLogs(); toast("日次運用チェックを記録しました", "success");
}

function exportLogsCsv() {
  if (!canPerm("logsExport")) return toast("一般ユーザーはCSVエクスポートできません", "error");
  const rows = sortDesc(state.logs, "timestamp").filter((l) => {
    const f = state.ui.filters;
    const d = l.timestamp.slice(0, 10);
    return (!f.logFrom || d >= f.logFrom) && (!f.logTo || d <= f.logTo) && (f.logAction === "all" || l.action === f.logAction) && (f.logTarget === "all" || l.target === f.logTarget);
  });
  const keys = ["timestamp","userId","username","action","target","targetId","details","ipAddress"];
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => csvCell(r[k] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  addLog(currentUser().username, "エクスポート", "監査ログ", "-", `${rows.length}件をCSV出力`, { count: rows.length, filters: { ...state.ui.filters } });
  persist(); renderLogs(); renderDashboard(); toast(`監査ログをCSV出力しました（${rows.length}件）`, "success");
}

async function exportBackupJson() {
  if (!canPerm("backupExport")) return toast("管理者のみバックアップをエクスポートできます", "error");
  const snapshot = Store ? Store.exportSnapshot(state) : { state, exportedAt: new Date().toISOString(), schemaVersion: 3 };
  const signature = await signBackupSnapshot(snapshot, state.settings);
  if (signature?.error) {
    return toast(`署名作成失敗: ${signature.error === "secret_missing" ? "HMAC秘密鍵が未設定です" : signature.error}`, "error");
  }
  if (signature) snapshot.signature = signature;
  const text = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appsuite-backup-${new Date().toISOString().replace(/[:]/g, "-").slice(0, 19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addLog(currentUser().username, "エクスポート", "バックアップ", "-", "バックアップJSONエクスポート", { bytes: text.length, signature: signature ? { algorithm: signature.algorithm, verified: true } : { algorithm: "none", verified: true } });
  persist();
  renderLogs();
}

function importBackupJson(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const res = Store ? Store.importSnapshot(parsed) : { ok: true, state: parsed.state || parsed };
      if (!res.ok) return toast(`インポート失敗: ${res.errors[0]}`, "error");
      const preview = await buildImportPreview(parsed, res.state, file);
      if ($.backupImportPreview) { $.backupImportPreview.classList.remove("hidden"); $.backupImportPreview.innerHTML = preview.html; }
      if (preview.signature && preview.signature.ok === false) {
        return toast(`署名検証失敗: ${preview.signature.reason}`, "error");
      }
      if (!confirm(`バックアップをインポートしますか？\nusers=${preview.counts.users}, apps=${preview.counts.apps}, logs=${preview.counts.logs}`)) {
        return toast("インポートをキャンセルしました", "info");
      }
      state = res.state;
      state.backups = (state.backups || []).map((b) => ({ integrity: b.integrity || "OK", ...b }));
      persist();
      populateFilters();
      renderAll();
      addLog(currentUser().username, "更新", "システム", "RESTORE", "バックアップJSONインポート", {
        fileName: file.name,
        size: file.size,
        preview: preview.counts,
        signature: preview.signature ? { ok: preview.signature.ok, algorithm: preview.signature.algorithm, reason: preview.signature.reason || null } : null
      });
      persist();
      renderLogs();
      toast("バックアップJSONをインポートしました", "success");
    } catch (err) {
      toast(`JSON解析失敗: ${err.message}`, "error");
    }
  };
  reader.readAsText(file, "utf-8");
}

function validateBackupPayload(parsed) {
  try {
    const snap = parsed?.state || parsed;
    if (!snap || typeof snap !== "object") return { ok: false, reason: "JSON形式が不正" };
    if (!Array.isArray(snap.users)) return { ok: false, reason: "users が不足" };
    if (!Array.isArray(snap.logs)) return { ok: false, reason: "logs が不足" };
    if (!snap.settings || typeof snap.settings !== "object") return { ok: false, reason: "settings が不足" };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

async function buildImportPreview(parsed, importedState, file) {
  const counts = {
    users: importedState?.users?.length || 0,
    apps: importedState?.apps?.length || 0,
    incidents: importedState?.incidents?.length || 0,
    changes: importedState?.changes?.length || 0,
    logs: importedState?.logs?.length || 0
  };
  const check = validateBackupPayload(parsed);
  const sig = await verifyBackupSignature(parsed, state.settings);
  const sigBadge = !sig ? `<span class="badge secondary">署名: なし</span>` : `<span class="badge ${sig.ok ? "success" : "danger"}">署名: ${sig.ok ? "OK" : "NG"}</span>${sig.algorithm ? ` <code>${h(sig.algorithm)}</code>` : ""}${sig.reason ? ` ${h(sig.reason)}` : ""}`;
  return {
    counts,
    signature: sig,
    html: `<strong>インポートプレビュー</strong><br>file: ${h(file.name)} (${file.size} bytes)<br>users:${counts.users} / apps:${counts.apps} / incidents:${counts.incidents} / changes:${counts.changes} / logs:${counts.logs}<br><span class="badge ${check.ok ? "success" : "danger"}">整合性: ${check.ok ? "OK" : "NG"}</span>${check.ok ? "" : " " + h(check.reason)}<br>${sigBadge}`
  };
}

async function signBackupSnapshot(snapshot, settings) {
  if (!window.crypto?.subtle) return null;
  const mode = settings?.backupSignatureMode || "sha256";
  if (mode === "none") return null;
  const payload = buildSignableBackupPayload(snapshot);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  if (mode === "hmac-sha256") {
    const secret = String(settings?.backupHmacSecret || "");
    if (!secret) return { algorithm: "HMAC-SHA256", error: "secret_missing", signedAt: new Date().toISOString() };
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoded);
    return { algorithm: "HMAC-SHA256", hash: bufToHex(sig), signedAt: new Date().toISOString() };
  }
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return { algorithm: "SHA-256", hash: bufToHex(digest), signedAt: new Date().toISOString() };
}

async function verifyBackupSignature(snapshot, settings) {
  const sig = snapshot?.signature;
  if (!sig) return null;
  if (!window.crypto?.subtle) return { ok: false, algorithm: sig.algorithm || "-", reason: "Web Crypto 非対応" };
  if (!sig.hash) return { ok: false, algorithm: sig.algorithm || "-", reason: "署名形式が不正" };
  const payload = buildSignableBackupPayload(snapshot);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  if (sig.algorithm === "SHA-256") {
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    const actual = bufToHex(digest);
    return { ok: actual === sig.hash, algorithm: sig.algorithm, reason: actual === sig.hash ? "" : "ハッシュ不一致" };
  }
  if (sig.algorithm === "HMAC-SHA256") {
    const secret = String(settings?.backupHmacSecret || "");
    if (!secret) return { ok: false, algorithm: sig.algorithm, reason: "HMAC秘密鍵未設定" };
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = await crypto.subtle.sign("HMAC", key, encoded);
    const actual = bufToHex(mac);
    return { ok: actual === sig.hash, algorithm: sig.algorithm, reason: actual === sig.hash ? "" : "HMAC不一致" };
  }
  return { ok: false, algorithm: sig.algorithm || "-", reason: "未対応の署名方式" };
}

function buildSignableBackupPayload(snapshot) {
  const clone = structuredClone(snapshot || {});
  delete clone.signature;
  return sortObjectDeep(clone);
}

function sortObjectDeep(v) {
  if (Array.isArray(v)) return v.map(sortObjectDeep);
  if (!v || typeof v !== "object") return v;
  return Object.keys(v).sort().reduce((acc, key) => {
    acc[key] = sortObjectDeep(v[key]);
    return acc;
  }, {});
}

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function addLog(username, action, target, targetId, details, meta) {
  const user = state.users.find((u) => u.username === username) || state.users[0];
  state.logs.unshift({ id: `LOG-${String(state.logs.length + 1).padStart(3, "0")}`, timestamp: nowSec(), userId: user?.id || "U0000", username, action, target, targetId, details, ipAddress: "192.168.0.10", meta: meta || null });
  state.logs = state.logs.slice(0, 150);
}

function nextId(prefix, list) {
  if (prefix === "U") return `U${String(Math.max(0, ...list.map((r) => Number(String(r.id).replace(/^U/, "")) || 0)) + 1).padStart(4, "0")}`;
  if (prefix === "A") return `A${String(Math.max(0, ...list.map((r) => Number(String(r.id).replace(/^A/, "")) || 0)) + 1).padStart(4, "0")}`;
  return `${prefix}${String(Math.max(0, ...list.map((r) => Number(String(r.id).replace(/^\\D+-?/, "")) || 0)) + 1).padStart(3, "0")}`;
}

function targetName(type) { return ({ user: "ユーザー", app: "アプリ", incident: "インシデント", change: "変更要求" })[type] || "システム"; }
function targetKeyName(key) { return ({ users: "ユーザー", apps: "アプリ", incidents: "インシデント", changes: "変更要求" })[key] || "システム"; }

function selectFill(el, items, allLabel) {
  if (!el) return;
  const current = el.value;
  const arr = (items || []).map((x) => typeof x === "string" ? { value: x, label: x } : x);
  el.innerHTML = `${allLabel !== undefined ? `<option value="all">${h(allLabel)}</option>` : ""}${arr.map((o) => `<option value="${ha(o.value)}">${h(o.label)}</option>`).join("")}`;
  if ([...el.options].some((o) => o.value === current)) el.value = current;
}

function sortDesc(arr, key) { return [...arr].sort((a, b) => String(b[key]).localeCompare(String(a[key]))); }
function uniq(arr) { return [...new Set(arr)]; }
function appName(id) { return state.apps.find((a) => a.id === id)?.name || id || "-"; }
function badge(text, cls) { return `<span class="badge ${cls}">${h(text)}</span>`; }
function colLabels(moduleKey, keys) {
  const map = DocsMeta?.modules?.[moduleKey]?.fields || {};
  return keys.map((k) => {
    const v = map[k];
    return (typeof v === "string" && v.length <= 20) ? v : k;
  });
}
function appStatusCls(s) { return s === "稼働中" ? "success" : s === "メンテナンス" ? "warning" : "secondary"; }
function prioCls(s) { return s === "高" ? "danger" : s === "中" ? "warning" : "info"; }
function incCls(s) { return ({ "オープン": "danger", "対応中": "warning", "解決済み": "info", "クローズ": "success" })[s] || "secondary"; }
function changeTypeCls(s) { return ({ "機能追加": "success", "機能変更": "info", "バグ修正": "danger", "改善": "violet" })[s] || "secondary"; }
function changeStatusCls(s) { return ({ "下書き": "secondary", "承認待ち": "warning", "承認済み": "info", "実装中": "violet", "完了": "success", "却下": "danger" })[s] || "secondary"; }
function logCls(s) { return ({ "ログイン": "info", "ログアウト": "secondary", "作成": "success", "更新": "warning", "削除": "danger", "エクスポート": "violet" })[s] || "secondary"; }
function prioDot(s) { return s === "高" ? "🔴" : s === "中" ? "🟡" : "🔵"; }
function statusDot(s) { return s === "オープン" ? "🔴" : s === "対応中" ? "🟡" : s === "解決済み" ? "🔵" : "🟢"; }
function isHtml(v) { return typeof v === "string" && /<[^>]+>/.test(v); }

function tickClock() { $.clock.textContent = new Date().toLocaleTimeString("ja-JP", { hour12: false }); }
function today() { return nowMin().slice(0, 10); }
function nowMin() { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`; }
function nowSec() { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; }
function p2(n) { return String(n).padStart(2, "0"); }

function csvCell(v) { const s = String(v).replace(/"/g, "\"\""); return /[",\n]/.test(s) ? `"${s}"` : s; }
function toast(msg, type = "info") { const n = document.createElement("div"); n.className = `toast ${type}`; n.textContent = msg; $.toastWrap.appendChild(n); setTimeout(() => n.remove(), 2800); }
function h(v) { return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function ha(v) { return h(v); }

function loadState() {
  try {
    if (Store) return Store.load();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT);
    return merge(structuredClone(DEFAULT), JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT);
  }
}

function handleGlobalKeydown(e) {
  if (e.key === "Escape") {
    if (isModalOpen()) {
      e.preventDefault();
      closeModal();
      return;
    }
    if ($.sidebar?.classList.contains("open")) {
      closeSidebar();
      $.menuToggle?.focus();
      return;
    }
  }
  if (e.key === "Tab" && isModalOpen()) trapModalFocus(e);
}

function toggleSidebar(force) {
  if (!$.sidebar) return;
  const next = typeof force === "boolean" ? force : !$.sidebar.classList.contains("open");
  $.sidebar.classList.toggle("open", next);
  syncSidebarA11y();
  if (next && window.innerWidth <= 1080) {
    $.sidebar.querySelector(".nav-item.active, .nav-item")?.focus();
  }
}

function closeSidebar() {
  if (!$.sidebar) return;
  $.sidebar.classList.remove("open");
  syncSidebarA11y();
}

function syncSidebarA11y() {
  if (!$.menuToggle || !$.sidebar) return;
  const open = $.sidebar.classList.contains("open");
  const mobile = window.innerWidth <= 1080;
  $.menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  $.sidebar.setAttribute("aria-hidden", mobile && !open ? "true" : "false");
}

function isModalOpen() {
  return !!$.modalBackdrop && !$.modalBackdrop.classList.contains("hidden");
}

function getFocusableElements(root) {
  if (!root) return [];
  return [...root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && !el.hidden && el.offsetParent !== null);
}

function trapModalFocus(e) {
  const items = getFocusableElements($.modalBackdrop);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
    return;
  }
  if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function persist() {
  if (Store) {
    if (typeof Store.saveSafe === "function") return Store.saveSafe(state);
    try {
      const r = Store.save(state);
      if (r && typeof r.then === "function") r.catch(() => {});
      return;
    } catch (_) { /* ignore */ }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function merge(base, patch) {
  if (Array.isArray(base) || Array.isArray(patch)) return patch ?? base;
  if (!base || typeof base !== "object") return patch ?? base;
  const out = { ...base };
  Object.keys(patch || {}).forEach((k) => { out[k] = k in base ? merge(base[k], patch[k]) : patch[k]; });
  return out;
}
