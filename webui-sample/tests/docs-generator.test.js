const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const {
  extractModuleFields,
  extractNamedTable,
  resolveRequirementsSpecPath
} = require(path.resolve(__dirname, "../../tools/generate-webui-docs-metadata.js"));

function readRequirementsSpec() {
  return fs.readFileSync(resolveRequirementsSpecPath(), "utf8");
}

test("extractModuleFields parses user field table", () => {
  const md = readRequirementsSpec();
  const m = extractModuleFields(md, "### 3.2 ユーザー管理機能", "users");
  assert.ok(m);
  assert.equal(m.fields.username, "ユーザー名");
  assert.equal(m.fields.email, "メールアドレス");
  assert.equal(m.schema.username.required, true);
  assert.equal(m.schema.lastLogin.required, false);
  assert.equal(m.schema.role.type, "Enum");
  assert.deepEqual(m.schema.role.enumValues, ["管理者", "ユーザー"]);
});

test("extractNamedTable parses settings category table", () => {
  const md = readRequirementsSpec();
  const t = extractNamedTable(md, "##### 3.7.2.1 API接続設定", "api");
  assert.ok(t);
  assert.equal(t.fields.apiUrl, "DeskNet's Neo APIエンドポイントURL");
  assert.equal(t.schema.authMethod.type, "Enum");
});
