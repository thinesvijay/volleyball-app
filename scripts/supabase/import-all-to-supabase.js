const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

process.env.PLAYER_HUB_EXPORT_PATH =
  process.env.SUPABASE_ALL_EXPORT_PATH ||
  process.env.PLAYER_HUB_EXPORT_PATH ||
  path.join(PROJECT_ROOT, "supabase", ".tmp", "full-backend-export.json");

require("./import-player-hub-to-supabase");
