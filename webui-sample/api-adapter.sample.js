(function (global) {
  "use strict";

  // Sample adapter with the same interface as mock-api.js.
  // Replace internals with real HTTP calls while preserving return shapes.

  async function loadInitialState() {
    // Example:
    // const res = await fetch("/api/webui/initial-state");
    // if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // return res.json();
    return global.APPSUITE_DATA_SEED ? structuredClone(global.APPSUITE_DATA_SEED) : {};
  }

  function patchState(_patch, meta) {
    return {
      ok: false,
      updatedAt: new Date().toISOString(),
      category: meta?.category || meta?.target || null,
      error: "not_implemented"
    };
  }

  function getOverlayInfo() {
    return {
      hasOverlay: false,
      updatedAt: null,
      lastWrite: null,
      categories: [],
      history: []
    };
  }

  function removeCategory(category) {
    return {
      ok: false,
      updatedAt: new Date().toISOString(),
      category: category || null,
      error: "not_implemented"
    };
  }

  function resetOverlay() {
    return {
      ok: false,
      updatedAt: new Date().toISOString(),
      category: null,
      error: "not_implemented"
    };
  }

  function listCategories() {
    return [];
  }

  global.AppSuiteApiAdapterSample = {
    loadInitialState,
    patchState,
    getOverlayInfo,
    removeCategory,
    resetOverlay,
    listCategories
  };
})(typeof window !== "undefined" ? window : globalThis);
