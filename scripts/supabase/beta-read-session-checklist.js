const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_PATH = path.join(PROJECT_ROOT, "supabase", ".env.import");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
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
  return true;
}

function present(name) {
  return process.env[name] ? "set" : "missing";
}

function main() {
  const envPath = path.resolve(process.env.SUPABASE_IMPORT_ENV || DEFAULT_ENV_PATH);
  const envLoaded = loadEnvFile(envPath);

  console.log("Make Teams Pro Supabase Player Hub read beta checklist");
  console.log("Manual only: this script does not change Apps Script properties.");
  console.log("");
  console.log(`Env file: ${path.relative(PROJECT_ROOT, envPath)} (${envLoaded ? "found" : "missing"})`);
  console.log(`APPS_SCRIPT_WEB_APP_URL: ${present("APPS_SCRIPT_WEB_APP_URL")}`);
  console.log(`APPS_SCRIPT_ADMIN_USERNAME: ${present("APPS_SCRIPT_ADMIN_USERNAME")}`);
  console.log(`APPS_SCRIPT_ADMIN_PASSWORD: ${present("APPS_SCRIPT_ADMIN_PASSWORD")}`);
  console.log("");
  console.log("Beta session steps:");
  console.log("1. Confirm SUPABASE_PLAYER_HUB_READS_ENABLED=false in Apps Script.");
  console.log("2. Run: npm.cmd run supabase:test:apps-script-diagnostic");
  console.log("3. Set SUPABASE_PLAYER_HUB_READS_ENABLED=true in Apps Script.");
  console.log("4. Open local app, login Admin, open Player Hub, check dashboards.");
  console.log("5. Run: npm.cmd run supabase:test:player-hub-snapshot-source");
  console.log("6. Run: npm.cmd run test:e2e");
  console.log("7. Set SUPABASE_PLAYER_HUB_READS_ENABLED=false immediately.");
  console.log("8. Run: npm.cmd run supabase:test:apps-script-diagnostic");
  console.log("");
  console.log("Rollback is always: SUPABASE_PLAYER_HUB_READS_ENABLED=false");
}

main();
