(function (global) {
  "use strict";

  const transitions = {
    incident: {
      "オープン": ["対応中"],
      "対応中": ["解決済み", "オープン"],
      "解決済み": ["クローズ", "対応中"],
      "クローズ": []
    },
    change: {
      "下書き": ["承認待ち"],
      "承認待ち": ["承認済み", "却下"],
      "承認済み": ["実装中"],
      "実装中": ["完了"],
      "完了": [],
      "却下": []
    }
  };

  function canTransition(type, from, to, opts) {
    if (from === to) return { ok: true };
    if (opts && opts.allowSkipStatus) return { ok: true };
    const allowed = transitions[type]?.[from] || [];
    return allowed.includes(to)
      ? { ok: true }
      : { ok: false, reason: `${type} のステータス遷移 ${from} → ${to} は許可されていません` };
  }

  const api = { transitions, canTransition };
  global.AppSuiteWorkflowRules = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
