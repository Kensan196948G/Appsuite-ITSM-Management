(function (global) {
  "use strict";

  const DocsMeta = global.APPSUITE_DOCS_METADATA || null;

  const enums = {
    userRole: ["管理者", "ユーザー"],
    userStatus: ["有効", "無効"],
    appCategory: ["業務管理", "申請・承認", "データ管理", "その他"],
    appStatus: ["稼働中", "メンテナンス", "停止中"],
    incidentPriority: ["高", "中", "低"],
    incidentStatus: ["オープン", "対応中", "解決済み", "クローズ"],
    changeType: ["機能追加", "機能変更", "バグ修正", "改善"],
    changeStatus: ["下書き", "承認待ち", "承認済み", "実装中", "完了", "却下"],
    authMethod: ["bearer", "basic", "apikey"]
  };

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));
  }

  function maxLen(v, n) {
    return String(v || "").length <= n;
  }

  function inEnum(v, list) {
    return list.includes(v);
  }

  function docsModuleKey(type) {
    return ({ user: "users", app: "apps", incident: "incidents", change: "changes", log: "logs" })[type];
  }

  function docsFieldSchema(type) {
    return DocsMeta?.modules?.[docsModuleKey(type)]?.schema || null;
  }

  function typeMatches(value, dataType) {
    if (value === undefined || value === null || value === "") return true;
    if (value === "-") return true;
    const t = String(dataType || "").toLowerCase();
    if (t.includes("string") || t.includes("enum")) return true;
    if (t.includes("number")) return !Number.isNaN(Number(value));
    if (t.includes("boolean")) return typeof value === "boolean";
    if (t.includes("date")) {
      return !Number.isNaN(Date.parse(String(value).replace(" ", "T")));
    }
    return true;
  }

  function applyDocsRules(type, rec, push, ctx) {
    const schema = docsFieldSchema(type);
    if (!schema) return;
    const editable = Array.isArray(ctx?.editableKeys) ? new Set(ctx.editableKeys) : null;
    Object.entries(schema).forEach(([key, rule]) => {
      if (editable && !editable.has(key)) return;
      const value = rec[key];
      if (rule.required && !String(value ?? "").trim()) {
        push(key, `${key} は必須です（docs定義）`);
        return;
      }
      if (!typeMatches(value, rule.type)) {
        push(key, `${key} の型が不正です（${rule.type}）`);
      }
      if (Array.isArray(rule.enumValues) && rule.enumValues.length && String(value || "").trim()) {
        if (!rule.enumValues.includes(String(value))) {
          push(key, `${key} の値が docs の列挙値に一致しません`);
        }
      }
      if (rule.maxLength && String(value || "").length > Number(rule.maxLength)) {
        push(key, `${key} は ${rule.maxLength} 文字以内です`);
      }
    });
  }

  function normalizeSettingsEnumValue(key, value) {
    const v = String(value);
    const maps = {
      authMethod: { "Bearer Token": "bearer", "Basic認証": "basic", "APIキー": "apikey", bearer: "bearer", basic: "basic", apikey: "apikey" },
      language: { "日本語": "ja", English: "en", ja: "ja", en: "en" },
      backupInterval: { daily: "daily", weekly: "weekly", monthly: "monthly" },
      theme: { light: "light", dark: "dark", system: "system" }
    };
    return maps[key]?.[v] ?? v;
  }

  function validateRecord(type, rec, ctx) {
    const errors = [];
    const fieldErrors = {};
    const push = (key, msg) => {
      errors.push(msg);
      if (key && !fieldErrors[key]) fieldErrors[key] = msg;
    };
    const req = (key, label) => { if (!String(rec[key] ?? "").trim()) push(key, `${label} は必須です`); };

    if (type === "user") {
      req("username", "ユーザー名");
      req("email", "メール");
      req("role", "権限");
      req("status", "ステータス");
      if (rec.email && !isEmail(rec.email)) push("email", "メール形式が不正です");
      if (rec.username && !maxLen(rec.username, 50)) push("username", "ユーザー名は50文字以内です");
      if (rec.department && !maxLen(rec.department, 100)) push("department", "部署は100文字以内です");
      if (rec.role && !inEnum(rec.role, enums.userRole)) push("role", "権限の値が不正です");
      if (rec.status && !inEnum(rec.status, enums.userStatus)) push("status", "ステータスの値が不正です");
    }
    if (type === "app") {
      req("name", "アプリ名");
      req("category", "カテゴリ");
      req("creator", "作成者");
      req("status", "ステータス");
      if (rec.name && !maxLen(rec.name, 100)) push("name", "アプリ名は100文字以内です");
      if (rec.description && !maxLen(rec.description, 500)) push("description", "説明は500文字以内です");
      if (rec.category && !inEnum(rec.category, enums.appCategory)) push("category", "カテゴリの値が不正です");
      if (rec.status && !inEnum(rec.status, enums.appStatus)) push("status", "ステータスの値が不正です");
      if (rec.recordCount !== undefined && rec.recordCount !== "" && Number(rec.recordCount) < 0) push("recordCount", "レコード数は0以上です");
    }
    if (type === "incident") {
      req("title", "タイトル");
      req("description", "詳細説明");
      req("appId", "対象アプリ");
      req("priority", "優先度");
      req("status", "ステータス");
      req("reporter", "報告者");
      if (rec.title && !maxLen(rec.title, 120)) push("title", "タイトルは120文字以内です");
      if (rec.description && !maxLen(rec.description, 1000)) push("description", "詳細説明は1000文字以内です");
      if (rec.priority && !inEnum(rec.priority, enums.incidentPriority)) push("priority", "優先度の値が不正です");
      if (rec.status && !inEnum(rec.status, enums.incidentStatus)) push("status", "ステータスの値が不正です");
      if (ctx && ctx.appIds && rec.appId && !ctx.appIds.includes(rec.appId)) push("appId", "対象アプリIDが存在しません");
    }
    if (type === "change") {
      req("title", "タイトル");
      req("description", "詳細説明");
      req("appId", "対象アプリ");
      req("type", "タイプ");
      req("status", "ステータス");
      req("requester", "申請者");
      if (rec.title && !maxLen(rec.title, 120)) push("title", "タイトルは120文字以内です");
      if (rec.description && !maxLen(rec.description, 1000)) push("description", "詳細説明は1000文字以内です");
      if (rec.type && !inEnum(rec.type, enums.changeType)) push("type", "タイプの値が不正です");
      if (rec.status && !inEnum(rec.status, enums.changeStatus)) push("status", "ステータスの値が不正です");
      if (ctx && ctx.appIds && rec.appId && !ctx.appIds.includes(rec.appId)) push("appId", "対象アプリIDが存在しません");
    }
    applyDocsRules(type, rec, push, ctx);
    return { valid: errors.length === 0, errors, fieldErrors };
  }

  function validateSettings(settings) {
    const errors = [];
    if (!String(settings.systemName || "").trim()) errors.push("システム名は必須です");
    if (!String(settings.adminEmail || "").trim() || !isEmail(settings.adminEmail)) errors.push("管理者メール形式が不正です");
    if (!inEnum(settings.authMethod, enums.authMethod)) errors.push("認証方式が不正です");
    ["timeout", "syncInterval", "pageSize", "pwMinLength", "pwExpireDays", "sessionTimeout", "maxSessions", "maxLoginAttempts", "lockoutDuration", "incidentEscalation", "changeLeadTime", "backupRetention"].forEach((k) => {
      if (Number(settings[k]) < 0 || Number.isNaN(Number(settings[k]))) errors.push(`${k} の数値が不正です`);
    });
    const docsSchema = DocsMeta?.settings?.schema || {};
    Object.entries(docsSchema).forEach(([key, rule]) => {
      if (!(key in settings)) return;
      if (!typeMatches(settings[key], rule.type)) errors.push(`${key} の型が不正です（docs定義 ${rule.type}）`);
      if (Array.isArray(rule.enumValues) && rule.enumValues.length && String(settings[key] ?? "").trim()) {
        const actual = normalizeSettingsEnumValue(key, settings[key]);
        const docsEnum = rule.enumValues.map((x) => normalizeSettingsEnumValue(key, x));
        if (!docsEnum.includes(actual)) errors.push(`${key} の値が docs の列挙値に一致しません`);
      }
    });
    if (!["none", "sha256", "hmac-sha256"].includes(String(settings.backupSignatureMode || "sha256"))) {
      errors.push("backupSignatureMode の値が不正です");
    }
    return { valid: errors.length === 0, errors };
  }

  function validateSnapshot(snapshot) {
    const errors = [];
    if (!snapshot || typeof snapshot !== "object") return { valid: false, errors: ["スナップショット形式が不正です"] };
    ["users", "apps", "incidents", "changes", "logs", "settings", "ui"].forEach((k) => {
      if (!(k in snapshot)) errors.push(`${k} が不足しています`);
    });
    if (!Array.isArray(snapshot.users)) errors.push("users は配列である必要があります");
    if (!Array.isArray(snapshot.apps)) errors.push("apps は配列である必要があります");
    if (!Array.isArray(snapshot.logs)) errors.push("logs は配列である必要があります");
    if (snapshot.users && Array.isArray(snapshot.users)) {
      snapshot.users.forEach((u, i) => {
        const r = validateRecord("user", u);
        if (!r.valid) errors.push(`users[${i}]: ${r.errors[0]}`);
      });
    }
    if (snapshot.settings) {
      const r = validateSettings(snapshot.settings);
      if (!r.valid) errors.push(...r.errors.slice(0, 3));
    }
    return { valid: errors.length === 0, errors };
  }

  function diffObject(before, after, fields) {
    const keys = fields || Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
    const diff = {};
    keys.forEach((k) => {
      if (JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k])) {
        diff[k] = { before: before?.[k], after: after?.[k] };
      }
    });
    return diff;
  }

  const api = { enums, validateRecord, validateSettings, validateSnapshot, diffObject };
  global.AppSuiteValidation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
