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

function booleanLabel(value) {
  return value ? "true" : "false";
}

async function main() {
  console.log("Make Teams Pro Auth backend mode check");
  console.log("Read-only: calls login/profile/trainer list, no writes.");
  console.log("");

  const config = requireAppsScriptEnv();

  const login = await callGet(config, {
    action: "login",
    username: config.username,
    password: config.password,
  });

  const profile = await callGet(config, {
    action: "getProfile",
    username: config.username,
    password: config.password,
  });

  const trainerList = await callPost(config, {
    action: "listTrainerUsers",
    username: config.username,
    password: config.password,
  });

  const backend =
    login.authBackend || profile.authBackend || trainerList.authBackend || "not returned";
  const fallback =
    !!login.authBackendFallbackUsed ||
    !!profile.authBackendFallbackUsed ||
    !!trainerList.authBackendFallbackUsed;

  const loginProfile = login.profile || {};
  const access = loginProfile.access || {};
  const users = Array.isArray(trainerList.users) ? trainerList.users : [];
  const firstTrainer = users[0] || {};

  console.log(`Auth backend: ${backend}`);
  console.log(`Fallback used: ${booleanLabel(fallback)}`);
  if (login.authBackendWarning) console.log(`Login warning: ${login.authBackendWarning}`);
  if (profile.authBackendWarning) console.log(`Profile warning: ${profile.authBackendWarning}`);
  if (trainerList.authBackendWarning) {
    console.log(`Trainer list warning: ${trainerList.authBackendWarning}`);
  }
  console.log(`Login success: ${booleanLabel(login.success)}`);
  console.log(`Profile logged in: ${booleanLabel(profile.loggedIn)}`);
  console.log(`Role: ${loginProfile.role || profile.role || "missing"}`);
  console.log(`Access fields: teamBuilder=${booleanLabel(access.teamBuilder)} tournaments=${booleanLabel(access.tournaments)}`);
  console.log(`Trainer users: ${users.length}`);
  console.log(
    `Trainer access fields present: ${firstTrainer.access ? "true" : users.length ? "false" : "no trainer rows"}`
  );

  if (!login.success || !profile.loggedIn || trainerList.success === false) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
