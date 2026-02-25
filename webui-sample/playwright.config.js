const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "node tests/serve-static.js",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: true,
    timeout: 15000
  }
});
