const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const rules = require(path.resolve(__dirname, "../workflow-rules.js"));

test("incident allows open to in-progress", () => {
  assert.equal(rules.canTransition("incident", "オープン", "対応中").ok, true);
});

test("incident rejects open to closed", () => {
  assert.equal(rules.canTransition("incident", "オープン", "クローズ").ok, false);
});

test("change allows skip when configured", () => {
  assert.equal(rules.canTransition("change", "下書き", "完了", { allowSkipStatus: true }).ok, true);
});
