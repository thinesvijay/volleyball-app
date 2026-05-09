const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_PATH = path.join(PROJECT_ROOT, "supabase", ".env.import");

const INSPECT_TABLES = [
  {
    table: "app_users",
    label: "App users",
    select:
      "username,legacy_username,role,active,can_use_team_builder,can_use_tournaments,updated_at",
    sample: (row) =>
      `${row.username || row.legacy_username || "(unknown)"} · ${row.role || "role?"} · ${row.active ? "active" : "inactive"}`,
  },
  {
    table: "player_profiles",
    label: "Player profiles",
    select: "legacy_profile_id,username,display_name,club_team_name,country,updated_at",
    sample: (row) =>
      `${row.display_name || row.username || "(unnamed)"} · ${row.club_team_name || "no team"} · ${row.country || "no country"}`,
  },
  {
    table: "club_teams",
    label: "Club teams",
    select: "legacy_team_id,name,country,city,active,updated_at",
    sample: (row) =>
      `${row.name || "(unnamed)"} · ${row.country || "no country"} · ${row.active ? "active" : "inactive"}`,
  },
  {
    table: "team_profiles",
    label: "Team profiles",
    select:
      "legacy_team_profile_id,club_team_name,country,captain_username,active,approved,updated_at",
    sample: (row) =>
      `${row.club_team_name || "(unnamed)"} · captain ${row.captain_username || "?"} · ${row.active ? "active" : "inactive"}`,
  },
  {
    table: "team_members",
    label: "Team members",
    select:
      "legacy_team_member_id,legacy_team_profile_id,club_team_name,player_username,player_display_name,member_status,updated_at",
    sample: (row) =>
      `${row.player_display_name || row.player_username || "(player)"} · ${row.club_team_name || "team?"} · ${row.member_status || "status?"}`,
  },
  {
    table: "team_needs",
    label: "Team needs",
    select:
      "legacy_need_id,club_team_name,need_type,needed_count,status,visibility,need_context,tournament_name,updated_at",
    sample: (row) =>
      `${row.club_team_name || "team?"} · ${row.need_type || "need"} ${row.needed_count || 0} · ${row.visibility || "visibility?"}/${row.need_context || "context?"}`,
  },
  {
    table: "roster_drafts",
    label: "Roster drafts",
    select:
      "legacy_roster_id,legacy_plan_id,tournament_name,club_team_name,roster_status,squad_label,updated_at",
    sample: (row) =>
      `${row.tournament_name || "tournament?"} · ${row.club_team_name || "team?"} · ${row.roster_status || "status?"}`,
  },
  {
    table: "roster_players",
    label: "Roster players",
    select:
      "legacy_roster_player_id,legacy_roster_id,player_username,player_display_name,assigned_squad,player_status,updated_at",
    sample: (row) =>
      `${row.player_display_name || row.player_username || "(player)"} · ${row.assigned_squad || "squad?"} · ${row.player_status || "status?"}`,
  },
  {
    table: "tournaments",
    label: "Tournaments",
    select: "legacy_tournament_id,name,country,city,status,published,updated_at",
    sample: (row) =>
      `${row.name || "(unnamed)"} · ${row.country || "no country"} · ${row.status || "status?"}`,
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

function requireEnv() {
  const envPath = path.resolve(process.env.SUPABASE_IMPORT_ENV || DEFAULT_ENV_PATH);
  loadEnvFile(envPath);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `Supabase env is not configured. Create ${path.relative(PROJECT_ROOT, envPath)} from supabase/.env.import.example.`
    );
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    serviceRoleKey,
  };
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

async function main() {
  const env = requireEnv();
  console.log("Make Teams Pro Supabase Player Hub inspection");
  console.log("Read-only: no app behavior changes, no writes.");
  console.log("");

  const summary = [];
  for (const config of INSPECT_TABLES) {
    const rows = await fetchRows(env, config.table, config.select);
    summary.push({
      table: config.table,
      label: config.label,
      rows: rows.length,
    });

    const samples = rows.slice(0, 3).map(config.sample);
    if (samples.length) {
      console.log(`${config.label}: ${rows.length}`);
      for (const sample of samples) console.log(`  - ${sample}`);
    } else {
      console.log(`${config.label}: 0`);
    }
  }

  console.log("");
  console.table(summary);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
