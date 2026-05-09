const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_PATH = path.join(PROJECT_ROOT, "supabase", ".env.import");
const ACTION = "getPlayerHubSnapshot";

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

async function callSnapshot(config) {
  const response = await fetch(`${config.appsScriptUrl}?_ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: ACTION,
      username: config.username,
      password: config.password,
    }),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`${ACTION} did not return JSON`);
  }

  if (!response.ok) {
    throw new Error(`${ACTION} HTTP ${response.status}`);
  }
  return data;
}

function countField(snapshot, field) {
  return Array.isArray(snapshot[field]) ? snapshot[field].length : "missing";
}

async function main() {
  console.log("Make Teams Pro Player Hub backend mode check");
  console.log("Read-only: calls Apps Script getPlayerHubSnapshot, no writes.");
  console.log("");

  const config = requireAppsScriptEnv();
  const snapshot = await callSnapshot(config);

  console.log(`Success: ${snapshot.success === false ? "false" : "true"}`);
  console.log(`Snapshot source: ${snapshot.snapshotSource || "not returned"}`);
  console.log(
    `Fallback used: ${snapshot.snapshotFallbackUsed ? "true" : "false"}`
  );
  if (snapshot.snapshotWarning) console.log(`Warning: ${snapshot.snapshotWarning}`);

  console.log("Key counts:");
  for (const field of [
    "availableClubs",
    "teamNeeds",
    "myTeams",
    "tournamentAvailability",
    "plannedTeams",
    "rosterDraftsForPlayer",
  ]) {
    console.log(`  - ${field}: ${countField(snapshot, field)}`);
  }

  if (snapshot.success === false || snapshot.snapshotFallbackUsed) {
    process.exitCode = snapshot.success === false ? 1 : 0;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
