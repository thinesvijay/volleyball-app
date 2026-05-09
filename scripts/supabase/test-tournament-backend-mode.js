const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_PATH = path.join(PROJECT_ROOT, "supabase", ".env.import");

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

  return { appsScriptUrl, username, password };
}

async function callAppsScript(config, body) {
  const response = await fetch(`${config.appsScriptUrl}?_ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`${body.action} did not return JSON`);
  }

  if (!response.ok) {
    throw new Error(`${body.action} HTTP ${response.status}`);
  }

  return data;
}

function count(value) {
  return Array.isArray(value) ? value.length : "missing";
}

async function main() {
  console.log("Make Teams Pro Tournament backend mode check");
  console.log("Read-only: calls Apps Script tournament list actions, no writes.");
  console.log("");

  const config = requireAppsScriptEnv();

  const publicList = await callAppsScript(config, {
    action: "listPublicTournaments",
  });

  const privateList = await callAppsScript(config, {
    action: "listTournaments",
    username: config.username,
    password: config.password,
  });

  const backend =
    privateList.tournamentBackend ||
    publicList.tournamentBackend ||
    "not returned";
  const fallback =
    privateList.tournamentBackendFallbackUsed ||
    publicList.tournamentBackendFallbackUsed ||
    false;

  console.log(`Tournament backend: ${backend}`);
  console.log(`Fallback used: ${fallback ? "true" : "false"}`);
  if (privateList.tournamentBackendWarning) {
    console.log(`Private warning: ${privateList.tournamentBackendWarning}`);
  }
  if (publicList.tournamentBackendWarning) {
    console.log(`Public warning: ${publicList.tournamentBackendWarning}`);
  }
  console.log(`Private tournaments: ${count(privateList.tournaments)}`);
  console.log(`Public tournaments: ${count(publicList.tournaments)}`);

  if (publicList.success === false || privateList.success === false) {
    console.error("A tournament list action returned success=false.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
