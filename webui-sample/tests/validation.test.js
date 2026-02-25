const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const validation = require(path.resolve(__dirname, "../validation.js"));

test("user validation rejects invalid email", () => {
  const r = validation.validateRecord("user", { username: "a", email: "bad", role: "管理者", status: "有効" });
  assert.equal(r.valid, false);
});

test("change validation accepts valid payload", () => {
  const r = validation.validateRecord("change", {
    title: "x", description: "y", appId: "A0001", type: "改善", status: "承認待ち", requester: "admin"
  }, { appIds: ["A0001"] });
  assert.equal(r.valid, true);
});

test("snapshot validation checks required keys", () => {
  const r = validation.validateSnapshot({});
  assert.equal(r.valid, false);
  assert.ok(r.errors.length > 0);
});

test("validation reads docs metadata schema when provided", () => {
  const modPath = path.resolve(__dirname, "../validation.js");
  delete require.cache[modPath];
  global.APPSUITE_DOCS_METADATA = {
    modules: {
      users: {
        schema: {
          status: { type: "Enum", required: true, enumValues: ["有効", "無効"] }
        }
      }
    }
  };
  const v = require(modPath);
  const r = v.validateRecord("user", { username: "a", email: "a@example.local", role: "管理者", status: "未知" });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(" "), /docs|列挙値/);
  delete global.APPSUITE_DOCS_METADATA;
  delete require.cache[modPath];
});

test("settings validation reads docs settings schema when provided", () => {
  const modPath = path.resolve(__dirname, "../validation.js");
  delete require.cache[modPath];
  global.APPSUITE_DOCS_METADATA = {
    settings: {
      schema: {
        authMethod: { type: "Enum", enumValues: ["bearer", "basic", "apikey"] }
      }
    }
  };
  const v = require(modPath);
  const r = v.validateSettings({
    systemName: "x", adminEmail: "a@example.com", authMethod: "invalid",
    timeout: 1, syncInterval: 1, pageSize: 10, pwMinLength: 8, pwExpireDays: 1, sessionTimeout: 10,
    maxSessions: 1, maxLoginAttempts: 1, lockoutDuration: 1, incidentEscalation: 1, changeLeadTime: 1, backupRetention: 1,
    backupSignatureMode: "sha256"
  });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(" "), /authMethod|docs/);
  delete global.APPSUITE_DOCS_METADATA;
  delete require.cache[modPath];
});
