const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function resolveRequirementsSpecPath() {
  const candidates = [
    path.join(repoRoot, "docs", "01_Requirements", "詳細要件定義書(Requirements-Specification).md"),
    path.join(repoRoot, "docs", "詳細要件定義書(Requirements-Specification).md")
  ];
  const hit = candidates.find((p) => fs.existsSync(p));
  if (!hit) {
    throw new Error("Requirements spec not found. Checked: " + candidates.map((p) => path.relative(repoRoot, p)).join(", "));
  }
  return hit;
}

function resolveWebUiOutPath() {
  const candidates = [
    path.join(repoRoot, "webui-sample", "docs-metadata.generated.js"),
    path.join(repoRoot, "WebUI-Sample", "docs-metadata.generated.js")
  ];
  const hit = candidates.find((p) => fs.existsSync(path.dirname(p)));
  if (!hit) {
    throw new Error("WebUI output directory not found. Checked: " + candidates.map((p) => path.relative(repoRoot, path.dirname(p))).join(", "));
  }
  return hit;
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function parseEnumValues(desc) {
  const m = String(desc || "").match(/（([^）]+)）/);
  if (!m) return null;
  if (!/[\/、,]/.test(m[1])) return null;
  return m[1].split(/[\/、,]\s*/).map((v) => v.trim()).filter(Boolean);
}

function parseMaxLength(desc) {
  const m = String(desc || "").match(/(\d+)\s*文字以内/);
  return m ? Number(m[1]) : null;
}

function extractModuleFields(md, sectionTitle, mapKey) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.includes(sectionTitle));
  if (start < 0) return null;
  const fieldHeader = lines.findIndex((l, i) => i > start && l.includes("データ項目"));
  if (fieldHeader < 0) return null;
  const tableStart = lines.findIndex((l, i) => i > fieldHeader && /^\|/.test(l));
  if (tableStart < 0) return null;
  const fields = {};
  const schema = {};
  for (let i = tableStart + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!/^\|/.test(line)) break;
    const cols = line.split("|").map((x) => x.trim()).filter(Boolean);
    if (cols.length >= 4) {
      const [fieldName, dataType, requiredRaw, desc] = cols;
      fields[fieldName] = desc;
      schema[fieldName] = {
        type: dataType,
        required: ["○", "必須", "true", "TRUE"].includes(requiredRaw),
        enumValues: parseEnumValues(desc),
        maxLength: parseMaxLength(desc)
      };
    }
  }
  return { key: mapKey, title: sectionTitle.replace(/^###\s*/, ""), fields, schema };
}

function extractNamedTable(md, sectionTitle, mapKey) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.includes(sectionTitle));
  if (start < 0) return null;
  const tableStart = lines.findIndex((l, i) => i > start && /^\|/.test(l));
  if (tableStart < 0) return null;
  const fields = {};
  const schema = {};
  for (let i = tableStart + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!/^\|/.test(line)) break;
    const cols = line.split("|").map((x) => x.trim()).filter(Boolean);
    if (cols.length >= 4) {
      const [fieldName, dataType, defaultValue, desc] = cols;
      fields[fieldName] = desc;
      schema[fieldName] = {
        type: dataType,
        required: ["-", ""].includes(defaultValue) ? false : false,
        enumValues: parseEnumValues(desc),
        maxLength: parseMaxLength(desc),
        defaultValue
      };
    }
  }
  return { key: mapKey, title: sectionTitle.replace(/^#####\s*/, ""), fields, schema };
}

function generate() {
  const reqPath = resolveRequirementsSpecPath();
  const outPath = resolveWebUiOutPath();
  const md = read(reqPath);
  const modules = {};
  const settingsCategories = {};
  [
    ["### 3.2 ユーザー管理機能", "users"],
    ["### 3.3 アプリ管理機能", "apps"],
    ["### 3.4 インシデント管理機能", "incidents"],
    ["### 3.5 変更管理機能", "changes"],
    ["### 3.6 監査ログ機能", "logs"]
  ].forEach(([title, key]) => {
    const m = extractModuleFields(md, title, key);
    if (m) modules[key] = { title: m.title, fields: m.fields, schema: m.schema };
  });

  [
    ["##### 3.7.2.1 API接続設定", "api"],
    ["##### 3.7.2.2 基本設定", "basic"],
    ["##### 3.7.2.3 通知設定", "notify"],
    ["##### 3.7.2.4 セキュリティ設定", "security"],
    ["##### 3.7.2.5 ワークフロー設定", "workflow"],
    ["##### 3.7.2.6 バックアップ設定", "backup"]
  ].forEach(([title, key]) => {
    const t = extractNamedTable(md, title, key);
    if (t) settingsCategories[key] = { title: t.title, fields: t.fields, schema: t.schema };
  });

  const settingsSchema = {};
  Object.values(settingsCategories).forEach((cat) => {
    Object.assign(settingsSchema, cat.schema || {});
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    sources: [path.relative(repoRoot, reqPath).replace(/\\/g, "/")],
    modules,
    settings: { categories: settingsCategories, schema: settingsSchema }
  };

  const js = `(function (global) {\n  "use strict";\n  global.APPSUITE_DOCS_METADATA = ${JSON.stringify(payload, null, 2)};\n})(typeof window !== "undefined" ? window : globalThis);\n`;
  fs.writeFileSync(outPath, js, "utf8");
  console.log(`generated: ${path.relative(repoRoot, outPath)}`);
}

if (require.main === module) generate();

module.exports = {
  extractModuleFields,
  extractNamedTable,
  generate,
  parseEnumValues,
  parseMaxLength,
  resolveRequirementsSpecPath,
  resolveWebUiOutPath
};
