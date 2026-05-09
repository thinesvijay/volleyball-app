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

async function callAppsScriptGet(config, params) {
  const url = new URL(config.appsScriptUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("_ts", Date.now().toString());

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`${params.action || "GET"} did not return JSON`);
  }
  if (!response.ok) {
    throw new Error(`${params.action || "GET"} HTTP ${response.status}`);
  }
  return data;
}

function countPlayers(response) {
  if (Array.isArray(response)) return response.length;
  if (Array.isArray(response.players)) return response.players.length;
  return "missing";
}

function countArchived(response) {
  return Array.isArray(response.archivedPlayers)
    ? response.archivedPlayers.length
    : "missing";
}

async function main() {
  console.log("Make Teams Pro Team Builder backend mode check");
  console.log("Read-only: calls Apps Script getPlayers, no writes.");
  console.log("");

  const config = requireAppsScriptEnv();

  const unauthenticated = await callAppsScriptGet(config, {
    action: "getPlayers",
    includeArchived: "true",
  });

  const playerList = await callAppsScriptGet(config, {
    action: "getPlayers",
    includeArchived: "true",
    username: config.username,
    password: config.password,
  });

  const backend = playerList.teamBuilderBackend || "not returned";
  const fallback = !!playerList.teamBuilderBackendFallbackUsed;

  console.log(`Team Builder backend: ${backend}`);
  console.log(`Fallback used: ${fallback ? "true" : "false"}`);
  if (playerList.teamBuilderBackendWarning) {
    console.log(`Warning: ${playerList.teamBuilderBackendWarning}`);
  }
  console.log(`Active players: ${countPlayers(playerList)}`);
  console.log(`Archived players: ${countArchived(playerList)}`);
  console.log(
    `Unauthenticated enforcement: ${
      unauthenticated && unauthenticated.success === false ? "ok" : "check manually"
    }`
  );

  if (playerList.success === false) {
    console.error(playerList.message || "getPlayers returned success=false.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
