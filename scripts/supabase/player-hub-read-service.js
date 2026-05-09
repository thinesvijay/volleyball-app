const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_PATH = path.join(PROJECT_ROOT, "supabase", ".env.import");
const DEFAULT_SNAPSHOT_PATH = path.join(
  PROJECT_ROOT,
  "supabase",
  ".tmp",
  "player-hub-supabase-snapshot.json"
);

const PLAYER_HUB_READ_TABLES = [
  {
    table: "app_users",
    collection: "appUsers",
    label: "App users",
    legacyColumn: "username",
    select:
      "username,legacy_username,role,active,can_use_team_builder,can_use_tournaments,updated_at",
    sample: (row) =>
      `${row.username || row.legacy_username || "(unknown)"} - ${row.role || "role?"} - ${
        row.active ? "active" : "inactive"
      }`,
  },
  {
    table: "player_profiles",
    collection: "playerProfiles",
    label: "Player profiles",
    legacyColumn: "legacy_profile_id",
    select: "legacy_profile_id,username,display_name,club_team_name,country,updated_at",
    sample: (row) =>
      `${row.display_name || row.username || "(unnamed)"} - ${
        row.club_team_name || "no team"
      } - ${row.country || "no country"}`,
  },
  {
    table: "club_teams",
    collection: "clubTeams",
    label: "Club teams",
    legacyColumn: "legacy_team_id",
    select: "legacy_team_id,name,country,city,active,updated_at",
    sample: (row) =>
      `${row.name || "(unnamed)"} - ${row.country || "no country"} - ${
        row.active ? "active" : "inactive"
      }`,
  },
  {
    table: "team_profiles",
    collection: "teamProfiles",
    label: "Team profiles",
    legacyColumn: "legacy_team_profile_id",
    select:
      "legacy_team_profile_id,club_team_name,country,captain_username,active,approved,updated_at",
    sample: (row) =>
      `${row.club_team_name || "(unnamed)"} - captain ${
        row.captain_username || "?"
      } - ${row.active ? "active" : "inactive"}`,
  },
  {
    table: "team_members",
    collection: "teamMembers",
    label: "Team members",
    legacyColumn: "legacy_team_member_id",
    select:
      "legacy_team_member_id,legacy_team_profile_id,club_team_name,player_username,player_display_name,member_status,updated_at",
    sample: (row) =>
      `${row.player_display_name || row.player_username || "(player)"} - ${
        row.club_team_name || "team?"
      } - ${row.member_status || "status?"}`,
  },
  {
    table: "team_needs",
    collection: "teamNeeds",
    label: "Team needs",
    legacyColumn: "legacy_need_id",
    select:
      "legacy_need_id,club_team_name,need_type,needed_count,status,visibility,need_context,tournament_name,updated_at",
    sample: (row) =>
      `${row.club_team_name || "team?"} - ${row.need_type || "need"} ${
        row.needed_count || 0
      } - ${row.visibility || "visibility?"}/${row.need_context || "context?"}`,
  },
  {
    table: "roster_drafts",
    collection: "rosterDrafts",
    label: "Roster drafts",
    legacyColumn: "legacy_roster_id",
    select:
      "legacy_roster_id,legacy_plan_id,tournament_name,club_team_name,roster_status,squad_label,updated_at",
    sample: (row) =>
      `${row.tournament_name || "tournament?"} - ${
        row.club_team_name || "team?"
      } - ${row.roster_status || "status?"}`,
  },
  {
    table: "roster_players",
    collection: "rosterPlayers",
    label: "Roster players",
    legacyColumn: "legacy_roster_player_id",
    select:
      "legacy_roster_player_id,legacy_roster_id,player_username,player_display_name,assigned_squad,player_status,updated_at",
    sample: (row) =>
      `${row.player_display_name || row.player_username || "(player)"} - ${
        row.assigned_squad || "squad?"
      } - ${row.player_status || "status?"}`,
  },
  {
    table: "tournaments",
    collection: "tournaments",
    label: "Tournaments",
    legacyColumn: "legacy_tournament_id",
    select: "legacy_tournament_id,name,country,city,status,published,updated_at",
    sample: (row) =>
      `${row.name || "(unnamed)"} - ${row.country || "no country"} - ${
        row.status || "status?"
      }`,
  },
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

function requireSupabaseEnv() {
  const envPath = path.resolve(process.env.SUPABASE_IMPORT_ENV || DEFAULT_ENV_PATH);
  loadEnvFile(envPath);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `Supabase env is not configured. Create ${path.relative(
        PROJECT_ROOT,
        envPath
      )} from supabase/.env.import.example.`
    );
  }

  return {
    envPath,
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function playerHubSnapshotPath() {
  return path.resolve(
    PROJECT_ROOT,
    process.env.PLAYER_HUB_SUPABASE_SNAPSHOT_PATH || DEFAULT_SNAPSHOT_PATH
  );
}

async function fetchRows({ supabaseUrl, serviceRoleKey }, table, select) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`,
      {
        method: "GET",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: "count=exact",
          Range: `${from}-${from + pageSize - 1}`,
          "Range-Unit": "items",
        },
      }
    );

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`${table} read failed: ${response.status} ${body}`);
    }

    const page = body ? JSON.parse(body) : [];
    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function readPlayerHubSupabaseData() {
  const env = requireSupabaseEnv();
  const collections = {};
  const counts = {};
  const tableCounts = {};

  for (const config of PLAYER_HUB_READ_TABLES) {
    const rows = await fetchRows(env, config.table, config.select);
    collections[config.collection] = rows;
    counts[config.collection] = rows.length;
    tableCounts[config.table] = rows.length;
  }

  return {
    meta: {
      createdAt: new Date().toISOString(),
      source: "supabase-dev-readonly",
      envFile: path.relative(PROJECT_ROOT, env.envPath),
      runtime: "local-node",
      appBehaviorChanged: false,
    },
    counts,
    tableCounts,
    collections,
  };
}

function writePlayerHubSupabaseSnapshot(snapshot, outputPath = playerHubSnapshotPath()) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return outputPath;
}

function loadPlayerHubSupabaseSnapshot(snapshotFile = playerHubSnapshotPath()) {
  if (!fs.existsSync(snapshotFile)) return null;
  return JSON.parse(fs.readFileSync(snapshotFile, "utf8"));
}

module.exports = {
  DEFAULT_SNAPSHOT_PATH,
  PLAYER_HUB_READ_TABLES,
  PROJECT_ROOT,
  fetchRows,
  loadEnvFile,
  loadPlayerHubSupabaseSnapshot,
  playerHubSnapshotPath,
  readPlayerHubSupabaseData,
  requireSupabaseEnv,
  writePlayerHubSupabaseSnapshot,
};
