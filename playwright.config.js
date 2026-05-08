const { defineConfig, devices } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

loadLocalEnv();
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 90 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm.cmd start",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      BROWSER: "none",
      CI: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, ".env.e2e");
  if (!fs.existsSync(envPath)) {
    process.env.E2E_ENV_FILE_LOADED = "false";
    console.warn("Skipping auth flows because .env.e2e is missing.");
    return;
  }

  process.env.E2E_ENV_FILE_LOADED = "true";
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
