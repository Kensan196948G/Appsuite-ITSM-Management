#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

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
const files = ["connection","users","apps","incidents","changes","logs","backups","ops","settings","session","ui"];

function readJson(name) {
  const p = path.join(dataDir, `${name}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function buildSeed() {
  return Object.fromEntries(files.map((name) => [name, readJson(name)]));
}

function writeSeed(seed) {
  const out = `(function(g){ g.APPSUITE_DATA_SEED = ${JSON.stringify(seed, null, 2)}; })(typeof window !== 'undefined' ? window : globalThis);\n`;
  fs.writeFileSync(path.join(dataDir, "seed.js"), out, "utf8");
}

function main() {
  const seed = buildSeed();
  writeSeed(seed);
  console.log(`Generated ${path.relative(process.cwd(), path.join(dataDir, "seed.js"))} from ${files.length} JSON files.`);
}

main();
