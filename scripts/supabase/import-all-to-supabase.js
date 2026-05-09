const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const fullExportPath =
  process.env.SUPABASE_ALL_EXPORT_PATH ||
  path.join(PROJECT_ROOT, "supabase", ".tmp", "full-backend-export.json");

process.env.PLAYER_HUB_EXPORT_PATH = fullExportPath;

console.log(`Full backend import path: ${path.resolve(PROJECT_ROOT, fullExportPath)}`);

require("./import-player-hub-to-supabase");
