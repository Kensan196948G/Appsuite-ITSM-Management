(function (global) {
  "use strict";

  const OVERLAY_KEY = "appsuite-webui-mockapi-overlay-v2";
  const LEGACY_OVERLAY_KEY = "appsuite-webui-mockapi-overlay-v1";
  const DATA_FILES = {
    connection: "data/connection.json",
    users: "data/users.json",
    apps: "data/apps.json",
    incidents: "data/incidents.json",
    changes: "data/changes.json",
    logs: "data/logs.json",
    backups: "data/backups.json",
    ops: "data/ops.json",
    settings: "data/settings.json",
    session: "data/session.json",
    ui: "data/ui.json"
  };

  function clone(v) {
    return typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
  }

  function merge(base, patch) {
    if (Array.isArray(base) || Array.isArray(patch)) return patch ?? base;
    if (!base || typeof base !== "object") return patch ?? base;
    const out = { ...base };
    Object.keys(patch || {}).forEach((k) => {
      out[k] = k in base ? merge(base[k], patch[k]) : patch[k];
    });
    return out;
  }

  function readOverlay() {
    try {
      const raw = global.localStorage?.getItem(OVERLAY_KEY);
      if (raw) return JSON.parse(raw);
      const legacyRaw = global.localStorage?.getItem(LEGACY_OVERLAY_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        return {
          version: 2,
          categories: legacy.statePatch ? { legacy: { patch: legacy.statePatch, updatedAt: legacy.updatedAt || null } } : {},
          updatedAt: legacy.updatedAt || null,
          lastWrite: legacy.lastWrite || null
        };
      }
      return { version: 2, categories: {} };
    } catch (_) {
      return { version: 2, categories: {} };
    }
  }

  function writeOverlay(overlay) {
    try {
      global.localStorage?.setItem(OVERLAY_KEY, JSON.stringify(overlay));
      return true;
    } catch (_) {
      return false;
    }
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`mock-api load failed: ${path} (${res.status})`);
    return res.json();
  }

  async function loadSeedState() {
    if (global.APPSUITE_DATA_SEED && typeof global.APPSUITE_DATA_SEED === "object") {
      return clone(global.APPSUITE_DATA_SEED);
    }
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => [key, await fetchJson(path)])
    );
    return Object.fromEntries(entries);
  }

  async function loadInitialState() {
    const seed = await loadSeedState();
    const overlay = readOverlay();
    const statePatch = assembleOverlayPatch(overlay);
    return merge(seed, statePatch);
  }

  function patchState(patch, meta) {
    const overlay = readOverlay();
    overlay.version = 2;
    overlay.categories ||= {};
    const category = String(meta?.category || meta?.target || "misc");
    const current = overlay.categories[category]?.patch || {};
    overlay.categories[category] = {
      patch: merge(current, patch || {}),
      updatedAt: new Date().toISOString(),
      meta: meta ? clone(meta) : null
    };
    overlay.updatedAt = new Date().toISOString();
    if (meta) overlay.lastWrite = { ...meta, at: overlay.updatedAt };
    overlay.history = Array.isArray(overlay.history) ? overlay.history : [];
    overlay.history.unshift({
      category,
      target: meta?.target || null,
      ok: true,
      error: null,
      at: overlay.updatedAt
    });
    overlay.history = overlay.history.slice(0, 20);
    const ok = writeOverlay(overlay);
    if (!ok) {
      overlay.history[0] = { category, target: meta?.target || null, ok: false, error: "localStorage_write_failed", at: overlay.updatedAt };
    }
    return {
      ok,
      updatedAt: overlay.updatedAt,
      category,
      error: ok ? null : "localStorage_write_failed"
    };
  }

  function saveRbacSettings(payload) {
    return patchState(
      {
        settings: {
          rolePermissions: payload.rolePermissions,
          rowLevelRules: payload.rowLevelRules,
          customRoles: payload.customRoles || []
        }
      },
      { target: "rbac", category: "settings/rbac" }
    );
  }

  function saveDocsSettings(payload) {
    return patchState(
      {
        settings: {
          docsEditor: payload
        }
      },
      { target: "docs", category: "settings/docs" }
    );
  }

  function getOverlayInfo() {
    const overlay = readOverlay();
    const categories = Object.keys(overlay.categories || {}).sort().map((key) => ({
      key,
      updatedAt: overlay.categories[key]?.updatedAt || null,
      meta: overlay.categories[key]?.meta || null
    }));
    return {
      hasOverlay: categories.length > 0,
      updatedAt: overlay.updatedAt || null,
      lastWrite: overlay.lastWrite || null,
      categories,
      history: Array.isArray(overlay.history) ? overlay.history : []
    };
  }

  function listCategories() {
    return Object.keys(readOverlay().categories || {}).sort();
  }

  function removeCategory(category) {
    const overlay = readOverlay();
    overlay.version = 2;
    overlay.categories ||= {};
    if (!overlay.categories[category]) {
      return { ok: false, category, updatedAt: overlay.updatedAt || null, error: "category_not_found" };
    }
    delete overlay.categories[category];
    overlay.updatedAt = new Date().toISOString();
    overlay.lastWrite = { target: "removeCategory", category, at: overlay.updatedAt };
    overlay.history = Array.isArray(overlay.history) ? overlay.history : [];
    overlay.history.unshift({ category, target: "removeCategory", ok: true, error: null, at: overlay.updatedAt });
    overlay.history = overlay.history.slice(0, 20);
    const ok = writeOverlay(overlay);
    return { ok, category, updatedAt: overlay.updatedAt, error: ok ? null : "localStorage_write_failed" };
  }

  function resetOverlay() {
    const overlay = { version: 2, categories: {}, updatedAt: new Date().toISOString(), lastWrite: { target: "resetOverlay", at: new Date().toISOString() }, history: [] };
    const ok = writeOverlay(overlay);
    return { ok, category: null, updatedAt: overlay.updatedAt, error: ok ? null : "localStorage_write_failed" };
  }

  function assembleOverlayPatch(overlay) {
    const categories = overlay?.categories || {};
    const keys = Object.keys(categories).sort();
    let patch = {};
    keys.forEach((key) => {
      patch = merge(patch, categories[key]?.patch || {});
    });
    if (overlay?.statePatch) patch = merge(patch, overlay.statePatch);
    return patch;
  }

  global.AppSuiteMockApi = {
    loadInitialState,
    patchState,
    removeCategory,
    resetOverlay,
    listCategories,
    saveRbacSettings,
    saveDocsSettings,
    getOverlayInfo
  };
})(typeof window !== "undefined" ? window : globalThis);
