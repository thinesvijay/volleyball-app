const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_PATH = path.join(PROJECT_ROOT, "supabase", ".env.import");
const DEFAULT_EXPORT_PATH = path.join(
  PROJECT_ROOT,
  "supabase",
  ".tmp",
  "full-backend-export.json"
);

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

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function exportPath() {
  return path.resolve(
    PROJECT_ROOT,
    process.env.SUPABASE_ALL_EXPORT_PATH ||
      process.env.PLAYER_HUB_EXPORT_PATH ||
      DEFAULT_EXPORT_PATH
  );
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required in supabase/.env.import for full export.`);
  }
  return value;
}

async function main() {
  const envPath = path.resolve(process.env.SUPABASE_IMPORT_ENV || DEFAULT_ENV_PATH);
  loadEnvFile(envPath);

  const url = requireEnv("APPS_SCRIPT_WEB_APP_URL");
  const username = requireEnv("APPS_SCRIPT_ADMIN_USERNAME");
  const password = requireEnv("APPS_SCRIPT_ADMIN_PASSWORD");
  const outPath = exportPath();

  console.log("Exporting full Google Sheets backend data through Apps Script admin action.");
  const response = await fetch(`${url}?_ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "exportAllSheetsDataForSupabaseMigration",
      username,
      password,
    }),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error("Apps Script full export did not return JSON.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Apps Script full export failed: ${response.status}`);
  }

  ensureDir(outPath);
  fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`);

  console.log(`Full backend export written: ${outPath}`);
  console.log(JSON.stringify(data.counts || {}, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
