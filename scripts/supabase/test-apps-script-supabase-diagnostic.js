const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_PATH = path.join(PROJECT_ROOT, "supabase", ".env.import");
const DIAGNOSTIC_ACTION = "testSupabasePlayerHubSnapshot";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function requireAppsScriptEnv() {
  const envPath = path.resolve(process.env.SUPABASE_IMPORT_ENV || DEFAULT_ENV_PATH);
  loadEnvFile(envPath);

  const missing = [];
  const appsScriptUrl = process.env.APPS_SCRIPT_WEB_APP_URL;
  const username = process.env.APPS_SCRIPT_ADMIN_USERNAME;
  const password = process.env.APPS_SCRIPT_ADMIN_PASSWORD;

  if (!appsScriptUrl) missing.push("APPS_SCRIPT_WEB_APP_URL");
  if (!username) missing.push("APPS_SCRIPT_ADMIN_USERNAME");
  if (!password) missing.push("APPS_SCRIPT_ADMIN_PASSWORD");

  if (missing.length) {
    throw new Error(
      `Missing ${missing.join(", ")}. Fill ${path.relative(
        PROJECT_ROOT,
        envPath
      )} and keep it gitignored.`
    );
  }

  return {
    appsScriptUrl,
    username,
    password,
  };
}

async function callDiagnostic(config) {
  const response = await fetch(`${config.appsScriptUrl}?_ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: DIAGNOSTIC_ACTION,
      username: config.username,
      password: config.password,
    }),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`${DIAGNOSTIC_ACTION} did not return JSON`);
  }

  if (!response.ok) {
    throw new Error(`${DIAGNOSTIC_ACTION} HTTP ${response.status}`);
  }

  return data;
}

function printCounts(counts) {
  const entries = Object.entries(counts || {});
  if (!entries.length) {
    console.log("Counts: none returned");
    return;
  }

  console.log("Counts:");
  for (const [key, value] of entries) {
    console.log(`  - ${key}: ${value}`);
  }
}

async function main() {
  console.log("Make Teams Pro Apps Script Supabase diagnostic");
  console.log("Read-only: no React changes, no Supabase writes.");
  console.log("");

  const config = requireAppsScriptEnv();
  const result = await callDiagnostic(config);

  console.log(`Action: ${DIAGNOSTIC_ACTION}`);
  console.log(`Success: ${result.success === false ? "false" : "true"}`);
  console.log(`Supabase reads enabled: ${result.enabled ? "true" : "false"}`);

  if (result.message) {
    console.log(`Message: ${result.message}`);
  }

  if (result.enabled) {
    printCounts(result.counts);
  }

  if (result.success === false) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
