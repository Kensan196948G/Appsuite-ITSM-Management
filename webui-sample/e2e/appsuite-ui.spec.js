const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/index.html");
});

test("ロール切替で権限制御が反映される", async ({ page }) => {
  const roleSwitcher = page.locator("#roleSwitcher");
  await roleSwitcher.selectOption("ユーザー");

  await expect(page.locator("#exportLogsBtn")).toBeDisabled();
  await expect(page.locator(".nav-item[data-section='settings']")).toHaveClass(/is-disabled/);

  await page.locator(".nav-item[data-section='settings']").click({ force: true });
  await expect(page.locator("#pageTitle")).toHaveText("ダッシュボード");
});

test("変更要求の不正ステータス遷移は拒否される", async ({ page }) => {
  await page.locator(".nav-item[data-section='changes']").click();
  await page.locator("#changesTable [data-row-action='edit']").first().click();

  const statusSelect = page.locator("#modalBody [data-form-key='status']");
  await statusSelect.selectOption("完了");
  await page.locator("#modalSave").click();

  await expect(page.locator("#modalBody [data-field-error='status']")).not.toHaveText("");
  await expect(page.locator("#modalBackdrop")).not.toHaveClass(/hidden/);
});

test("バックアップ JSON の export/import が実行できる", async ({ page }) => {
  await page.locator(".nav-item[data-section='settings']").click();
  await page.locator(".tab[data-tab='backup']").click();

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportBackupJsonBtn").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("appsuite-backup-");

  const snapshot = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "AppSuite WebUI Sample",
    state: {
      connection: { connected: false, status: "未接続", lastSync: "-", version: "-" },
      users: [{ id: "U0999", username: "e2e-user", email: "e2e@example.local", department: "QA", role: "管理者", status: "有効", lastLogin: "-", createdAt: "2026-02-24", updatedAt: "2026-02-24" }],
      apps: [],
      incidents: [],
      changes: [],
      logs: [],
      backups: [],
      ops: { daily: [], weekly: [], monthly: [] },
      settings: {
        apiUrl: "https://neo.example.local/api", authMethod: "bearer", apiKey: "sample", timeout: 30, syncInterval: 15,
        systemName: "AppSuite管理運用システム", orgName: "E2E", adminEmail: "admin@example.local", language: "ja", dateFormat: "yyyy-MM-dd", pageSize: 25,
        notifyIncidentNew: true, notifyIncidentHigh: true, notifyChangeApproval: true, notifyChangeComplete: false, smtpHost: "smtp", smtpPort: 587, smtpUser: "u", smtpPass: "p", smtpSsl: true,
        pwMinLength: 8, pwExpireDays: 90, sessionTimeout: 30, maxSessions: 3, maxLoginAttempts: 5, lockoutDuration: 15, pwRequireUpper: true, pwRequireNumber: true, pwRequireSpecial: false, enableTwoFactor: false,
        incidentAutoAssign: false, incidentDefaultAssignee: "admin", incidentEscalation: 24, changeRequireApproval: true, changeApprover: "manager", changeLeadTime: 3, allowSkipStatus: false, requireComment: true,
        autoBackup: true, backupInterval: "daily", backupRetention: 7
      },
      session: { userId: "U0999", role: "管理者" },
      ui: { activeSection: "dashboard", activeSettingsTab: "api", filters: { userSearch: "", userStatus: "all", userRole: "all", appSearch: "", appCategory: "all", appStatus: "all", incidentSearch: "", incidentStatus: "all", incidentPriority: "all", changeSearch: "", changeType: "all", changeStatus: "all", logFrom: "", logTo: "", logAction: "all", logTarget: "all" } }
    }
  };

  page.once("dialog", (d) => d.accept());
  await page.setInputFiles("#backupImportFile", {
    name: "backup-e2e.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(snapshot), "utf8")
  });

  await page.locator(".nav-item[data-section='users']").click();
  await expect(page.locator("#usersTable")).toContainText("e2e-user");
  await expect(page.locator("#backupImportPreview")).toContainText("インポートプレビュー");
});

test("一般ユーザーは自分の変更要求のみ編集できる", async ({ page }) => {
  await page.locator("#roleSwitcher").selectOption("ユーザー");
  await page.locator(".nav-item[data-section='changes']").click();
  await expect(page.locator("#changesTable")).toContainText("閲覧のみ");
});

test("ユーザーCRUDと設定保存が動作する", async ({ page }) => {
  await page.locator(".nav-item[data-section='users']").click();
  await page.locator("button[data-open-modal='user']").click();
  await page.locator("#modalBody [data-form-key='username']").fill("pw-e2e");
  await page.locator("#modalBody [data-form-key='email']").fill("pw-e2e@example.local");
  await page.locator("#modalBody [data-form-key='department']").fill("QA");
  await page.locator("#modalSave").click();
  await expect(page.locator("#usersTable")).toContainText("pw-e2e");

  await page.locator(".nav-item[data-section='settings']").click();
  await page.locator(".tab[data-tab='basic']").click();
  await page.locator("#systemName").fill("AppSuite管理運用システム E2E");
  await page.locator("#saveBasicBtn").click();
  await expect(page.locator("#logsTable")).toContainText("CFG-BASIC");
});

test("モーダルのリアルタイムバリデーションが表示される", async ({ page }) => {
  await page.locator(".nav-item[data-section='users']").click();
  await page.locator("button[data-open-modal='user']").click();
  const email = page.locator("#modalBody [data-form-key='email']");
  await email.fill("bad-email");
  await email.blur();
  await expect(page.locator("#modalBody [data-field-error='email']")).not.toHaveText("");
});

test("監査ログ行クリックで詳細パネルが表示される", async ({ page }) => {
  await page.locator(".nav-item[data-section='logs']").click();
  await page.locator("#logsTable tbody tr").first().click();
  await expect(page.locator("#logDetailPanel")).not.toHaveClass(/hidden/);
  await expect(page.locator("#logDetailTitle")).not.toHaveText("監査ログ詳細");
});

test("権限設定タブで権限を保存できる", async ({ page }) => {
  await page.locator(".nav-item[data-section='settings']").click();
  await page.locator(".tab[data-tab='permissions']").click();
  const target = page.locator("[data-perm-role='ユーザー'][data-perm-key='logsMetaView']");
  await target.check();
  await page.locator("#savePermissionsBtn").click();
  await page.locator("#roleSwitcher").selectOption("ユーザー");
  await page.locator(".nav-item[data-section='logs']").click();
  await expect(page.locator("#logsTable")).toContainText("meta");
});

test("モバイルメニューの aria-expanded が切り替わる", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  const menuToggle = page.locator("#menuToggle");
  await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
  await menuToggle.click();
  await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
});

test("モーダルでフォーカストラップが機能する", async ({ page }) => {
  await page.locator(".nav-item[data-section='users']").click();
  const openBtn = page.locator("button[data-open-modal='user']");
  await openBtn.focus();
  await openBtn.click();

  const firstFocusable = page.locator("#modalClose");
  await expect(firstFocusable).toBeFocused();
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  await expect(page.locator("#modalSave")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(firstFocusable).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(openBtn).toBeFocused();
});

test("一般ユーザーで設定保存ボタンが無効化される", async ({ page }) => {
  await page.locator(".nav-item[data-section='settings']").click({ force: true });
  await page.locator("#roleSwitcher").selectOption("ユーザー");
  await expect(page.locator("#savePermissionsBtn")).toBeDisabled();
  await expect(page.locator("#saveDocsEditorBtn")).toBeDisabled();
  await expect(page.locator("#saveBackupBtn")).toBeDisabled();
});
