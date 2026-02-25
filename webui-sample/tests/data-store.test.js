const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const ds = require(path.resolve(__dirname, "../data-store.js"));

test("store import rejects invalid snapshot", () => {
  let saved = null;
  const store = ds.createStore({
    backend: { load: () => null, save: (v) => { saved = v; }, clear: () => {} },
    defaults: { users: [], apps: [], incidents: [], changes: [], logs: [], settings: {}, ui: {} },
    merge: (a, b) => ({ ...a, ...b }),
    validateSnapshot: () => ({ valid: false, errors: ["bad"] })
  });
  const r = store.importSnapshot({ state: {} });
  assert.equal(r.ok, false);
  assert.equal(saved, null);
});

test("store exportSnapshot uses current schema version", () => {
  const store = ds.createStore({
    backend: { load: () => null, save: () => {}, clear: () => {}, getInfo: () => ({ type: "mock" }) },
    defaults: { users: [], apps: [], incidents: [], changes: [], logs: [], settings: {}, ui: {} },
    merge: (a, b) => ({ ...a, ...b }),
    validateSnapshot: () => ({ valid: true, errors: [] })
  });
  const out = store.exportSnapshot({ users: [] });
  assert.equal(out.schemaVersion, 3);
  assert.equal(store.getBackendInfo().type, "mock");
});
