#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function resolveDataDir() {
  const candidates = [
    path.join(process.cwd(), "WebUI-Sample", "data"),
    path.join(process.cwd(), "data"),
    path.join(__dirname, "..", "WebUI-Sample", "data")
  ];
  const hit = candidates.find((p) => fs.existsSync(path.join(p, "settings.json")));
  if (!hit) throw new Error("WebUI-Sample/data directory not found");
  return hit;
}
const dataDir = resolveDataDir();
const required = ["connection","users","apps","incidents","changes","logs","backups","ops","settings","session","ui"];

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), "utf8"));
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function resolveWebUiDir() {
  return path.dirname(dataDir);
}

function loadDocsMetaIfExists() {
  const p = path.join(resolveWebUiDir(), "docs-metadata.generated.js");
  if (!fs.existsSync(p)) return null;
  const code = fs.readFileSync(p, "utf8");
  const sandbox = { window: {}, globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 2000 });
  return sandbox.window.APPSUITE_DOCS_METADATA || sandbox.globalThis.APPSUITE_DOCS_METADATA || null;
}

function verifyDocsEditorRows(rows) {
  const ids = new Set();
  for (const [i, row] of (rows || []).entries()) {
    assert(String(row.id || "").trim(), `docsEditor.actionCandidates[${i}].id is required`);
    assert(String(row.title || "").trim(), `docsEditor.actionCandidates[${i}].title is required`);
    assert(String(row.owner || "").trim(), `docsEditor.actionCandidates[${i}].owner is required`);
    const id = String(row.id).trim();
    assert(!ids.has(id), `docsEditor.actionCandidates duplicate id: ${id}`);
    ids.add(id);
  }
}

function main() {
  const missing = required.filter((name) => !fs.existsSync(path.join(dataDir, `${name}.json`)));
  assert(missing.length === 0, `Missing files: ${missing.join(", ")}`);

  const data = Object.fromEntries(required.map((name) => [name, readJson(`${name}.json`)]));
  assert(Array.isArray(data.users), "users.json must be an array");
  assert(Array.isArray(data.apps), "apps.json must be an array");
  assert(Array.isArray(data.logs), "logs.json must be an array");
  assert(data.settings && typeof data.settings === "object", "settings.json must be an object");
  assert(data.ui && typeof data.ui === "object", "ui.json must be an object");
  assert(data.settings.rolePermissions && typeof data.settings.rolePermissions === "object", "settings.rolePermissions missing");
  assert(data.settings.rowLevelRules && typeof data.settings.rowLevelRules === "object", "settings.rowLevelRules missing");
  assert(data.settings.docsEditor && typeof data.settings.docsEditor === "object", "settings.docsEditor missing");
  assert(Array.isArray(data.settings.docsEditor.actionCandidates), "settings.docsEditor.actionCandidates must be array");
  verifyDocsEditorRows(data.settings.docsEditor.actionCandidates);

  const docsMeta = loadDocsMetaIfExists();
  if (docsMeta) {
    const settingsSchema = docsMeta.settings?.schema || {};
    const mustMatchSettingsKeys = [
      "apiUrl","authMethod","timeout","syncInterval",
      "systemName","adminEmail","language","dateFormat","pageSize",
      "smtpHost","smtpPort",
      "pwMinLength","sessionTimeout","maxLoginAttempts",
      "incidentEscalation","changeLeadTime",
      "autoBackup","backupInterval","backupRetention"
    ];
    mustMatchSettingsKeys.forEach((key) => {
      assert(key in data.settings, `settings.json missing key: ${key}`);
      assert(key in settingsSchema, `docs metadata settings.schema missing key: ${key}`);
    });
    const moduleMap = {
      users: data.users[0],
      apps: data.apps[0],
      incidents: data.incidents[0],
      changes: data.changes[0],
      logs: data.logs[0]
    };
    Object.entries(moduleMap).forEach(([moduleKey, sample]) => {
      if (!sample || !docsMeta.modules?.[moduleKey]?.fields) return;
      Object.keys(sample).forEach((field) => {
        assert(field in docsMeta.modules[moduleKey].fields || field === "meta" || field === "integrity", `docs metadata field missing: modules.${moduleKey}.fields.${field}`);
      });
    });
  }

  if (fs.existsSync(path.join(dataDir, "seed.js"))) {
    const seedText = fs.readFileSync(path.join(dataDir, "seed.js"), "utf8");
    assert(seedText.includes("APPSUITE_DATA_SEED"), "seed.js does not export APPSUITE_DATA_SEED");
  }

  console.log("WebUI data verification passed.");
}

main();
