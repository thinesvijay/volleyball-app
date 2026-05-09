const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_PATH = path.join(PROJECT_ROOT, "supabase", ".env.import");
const SNAPSHOT_ACTION = "getPlayerHubSnapshot";

const REQUIRED_FIELDS = [
  "profile",
  "availableClubs",
  "teamNeeds",
  "myTeams",
  "tournamentAvailability",
];

const ARRAY_FIELDS = [
  "availableClubs",
  "accessRequests",
  "myTeams",
  "teamMembershipRequests",
  "teamNeeds",
  "myTeamNeedInterests",
  "tournamentAvailability",
  "plannedTeams",
  "rosterDraftsForPlayer",
];

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

async function callAppsScript(config, action) {
  const response = await fetch(`${config.appsScriptUrl}?_ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action,
      username: config.username,
      password: config.password,
    }),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`${action} did not return JSON`);
  }

  if (!response.ok) {
    throw new Error(`${action} HTTP ${response.status}`);
  }

  return data;
}

function sourceLabel(snapshot) {
  return (
    snapshot.source ||
    snapshot.snapshotSource ||
    (snapshot.meta && snapshot.meta.source) ||
    "not returned; check Apps Script logs for [Snapshot] source ..."
  );
}

function countValue(snapshot, field) {
  return Array.isArray(snapshot[field]) ? snapshot[field].length : "missing";
}

function validateSnapshotShape(snapshot) {
  const missing = [];

  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(snapshot, field)) {
      missing.push(field);
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(snapshot[field])) {
      missing.push(`${field}[]`);
    }
  }

  if (
    snapshot.captainTeamControl !== null &&
    snapshot.captainTeamControl !== undefined &&
    typeof snapshot.captainTeamControl !== "object"
  ) {
    missing.push("captainTeamControl object");
  }

  if (
    snapshot.adminCounts !== null &&
    snapshot.adminCounts !== undefined &&
    typeof snapshot.adminCounts !== "object"
  ) {
    missing.push("adminCounts object");
  }

  return missing;
}

async function main() {
  console.log("Make Teams Pro Player Hub snapshot source test");
  console.log("Read-only: calls Apps Script getPlayerHubSnapshot, no writes.");
  console.log("");

  const config = requireAppsScriptEnv();
  const snapshot = await callAppsScript(config, SNAPSHOT_ACTION);
  const missing = validateSnapshotShape(snapshot);

  console.log(`Action: ${SNAPSHOT_ACTION}`);
  console.log(`Success: ${snapshot.success === false ? "false" : "true"}`);
  console.log(`Source: ${sourceLabel(snapshot)}`);
  console.log(`Shape valid: ${missing.length ? "false" : "true"}`);

  console.log("Key counts:");
  for (const field of ARRAY_FIELDS) {
    console.log(`  - ${field}: ${countValue(snapshot, field)}`);
  }

  console.log(
    `  - captainTeamControl: ${
      snapshot.captainTeamControl ? "present" : "empty"
    }`
  );
  console.log(`  - adminCounts: ${snapshot.adminCounts ? "present" : "empty"}`);

  if (snapshot.success === false) {
    console.log(`Message: ${snapshot.message || "Snapshot returned success false"}`);
    process.exitCode = 1;
    return;
  }

  if (missing.length) {
    console.log("");
    console.log("Missing or invalid fields:");
    for (const field of missing) console.log(`  - ${field}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
