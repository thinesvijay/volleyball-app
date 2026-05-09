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

async function readJson(response, label) {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`${label} did not return JSON`);
  }
  if (!response.ok) {
    throw new Error(`${label} HTTP ${response.status}`);
  }
  return data;
}

async function callGet(config, params) {
  const url = new URL(config.appsScriptUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("_ts", Date.now().toString());
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  return readJson(response, params.action || "GET");
}

async function callPost(config, body) {
  const response = await fetch(`${config.appsScriptUrl}?_ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return readJson(response, body.action || "POST");
}

function count(value) {
  return Array.isArray(value) ? value.length : "missing";
}

function bool(value) {
  return value ? "true" : "false";
}

async function main() {
  console.log("Make Teams Pro full backend mode check");
  console.log("Read-only: calls Apps Script backend surfaces, no writes.");
  console.log("");

  const config = requireAppsScriptEnv();
  const authPayload = {
    username: config.username,
    password: config.password,
  };

  const login = await callGet(config, {
    action: "login",
    ...authPayload,
  });
  const profile = await callGet(config, {
    action: "getProfile",
    ...authPayload,
  });
  const playerHub = await callPost(config, {
    action: "getPlayerHubSnapshot",
    ...authPayload,
  });
  const teamBuilder = await callGet(config, {
    action: "getPlayers",
    includeArchived: "true",
    ...authPayload,
  });
  const tournaments = await callPost(config, {
    action: "listTournaments",
    ...authPayload,
  });
  const publicTournaments = await callPost(config, {
    action: "listPublicTournaments",
  });
  const trainers = await callPost(config, {
    action: "listTrainerUsers",
    ...authPayload,
  });

  const authBackend =
    login.authBackend || profile.authBackend || trainers.authBackend || "not returned";
  const playerHubSource = playerHub.snapshotSource || "not returned";
  const teamBuilderBackend = teamBuilder.teamBuilderBackend || "not returned";
  const tournamentBackend =
    tournaments.tournamentBackend ||
    publicTournaments.tournamentBackend ||
    "not returned";

  console.log(`Auth backend: ${authBackend}`);
  console.log(`Player Hub snapshot source: ${playerHubSource}`);
  console.log(`Team Builder backend: ${teamBuilderBackend}`);
  console.log(`Tournament backend: ${tournamentBackend}`);
  console.log("");
  console.log(`Login success: ${bool(login.success)}`);
  console.log(`Profile logged in: ${bool(profile.loggedIn)}`);
  console.log(`Team Builder active players: ${count(teamBuilder.players)}`);
  console.log(`Team Builder archived players: ${count(teamBuilder.archivedPlayers)}`);
  console.log(`Private tournaments: ${count(tournaments.tournaments)}`);
  console.log(`Public tournaments: ${count(publicTournaments.tournaments)}`);
  console.log(`Trainer users: ${count(trainers.users)}`);
  console.log(`Player Hub team needs: ${count(playerHub.teamNeeds)}`);

  const fallbackUsed =
    !!login.authBackendFallbackUsed ||
    !!profile.authBackendFallbackUsed ||
    !!trainers.authBackendFallbackUsed ||
    !!playerHub.snapshotFallbackUsed ||
    !!teamBuilder.teamBuilderBackendFallbackUsed ||
    !!tournaments.tournamentBackendFallbackUsed ||
    !!publicTournaments.tournamentBackendFallbackUsed;

  console.log(`Fallback used by any surface: ${bool(fallbackUsed)}`);

  if (
    !login.success ||
    !profile.loggedIn ||
    playerHub.success === false ||
    teamBuilder.success === false ||
    tournaments.success === false ||
    publicTournaments.success === false ||
    trainers.success === false
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
