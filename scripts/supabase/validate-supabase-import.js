const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ENV_PATH = path.join(PROJECT_ROOT, "supabase", ".env.import");
const DEFAULT_EXPORT_PATH = path.join(
  PROJECT_ROOT,
  "supabase",
  ".tmp",
  "player-hub-export.json"
);

const TABLES = [
  "app_users",
  "player_profiles",
  "club_teams",
  "team_identity_change_requests",
  "access_requests",
  "team_profiles",
  "team_members",
  "team_membership_requests",
  "team_needs",
  "team_need_interests",
  "tournaments",
  "tournament_events",
  "tournament_availability",
  "tournament_squad_planning",
  "roster_drafts",
  "roster_players",
  "official_rosters",
  "event_comments",
  "audit_log",
];

const EXPORT_TO_TABLE = {
  clubTeams: "club_teams",
  playerProfiles: "player_profiles",
  accessRequests: "access_requests",
  teamIdentityChangeRequests: "team_identity_change_requests",
  teamProfiles: "team_profiles",
  teamNeeds: "team_needs",
  teamNeedInterests: "team_need_interests",
  teamMembers: "team_members",
  teamMembershipRequests: "team_membership_requests",
  tournaments: "tournaments",
  tournamentEvents: "tournament_events",
  tournamentAvailability: "tournament_availability",
  tournamentSquadPlanning: "tournament_squad_planning",
  rosterDrafts: "roster_drafts",
  rosterPlayers: "roster_players",
  officialRosters: "official_rosters",
  eventComments: "event_comments",
};

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

async function countTable(supabaseUrl, serviceRoleKey, table) {
  const response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/rest/v1/${table}?select=id&limit=1`, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "count=exact",
    },
  });

  const body = await response.text();
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `${table} count failed: ${response.status}. Check that SUPABASE_SERVICE_ROLE_KEY is the Supabase service_role key, not the anon/public key. If the key is correct, run supabase/import-service-role-grants.sql once in the Supabase SQL editor for the dev project. ${body}`
      );
    }
    throw new Error(`${table} count failed: ${response.status} ${body}`);
  }

  const contentRange = response.headers.get("content-range") || "";
  const match = contentRange.match(/\/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function loadExpectedCounts() {
  const exportPath = path.resolve(
    PROJECT_ROOT,
    process.env.PLAYER_HUB_EXPORT_PATH || DEFAULT_EXPORT_PATH
  );
  if (!fs.existsSync(exportPath)) return null;
  const data = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  const expected = {};
  for (const [collectionKey, table] of Object.entries(EXPORT_TO_TABLE)) {
    const rows = data.collections && data.collections[collectionKey];
    if (Array.isArray(rows)) expected[table] = rows.length;
  }
  return { exportPath, expected };
}

async function main() {
  const envPath = path.resolve(process.env.SUPABASE_IMPORT_ENV || DEFAULT_ENV_PATH);
  loadEnvFile(envPath);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const strictCounts =
    String(process.env.SUPABASE_VALIDATE_STRICT_COUNTS || "true").toLowerCase() !==
    "false";
  if (!supabaseUrl || !serviceRoleKey) {
    console.log("Supabase validation env is not configured. No remote check was run.");
    console.log(`Create ${path.relative(PROJECT_ROOT, envPath)} from supabase/.env.import.example.`);
    return;
  }

  const expectedInfo = loadExpectedCounts();
  if (expectedInfo) {
    console.log(`Comparing against export file: ${expectedInfo.exportPath}`);
  } else {
    console.log("No export JSON found; printing Supabase row counts only.");
  }

  const results = [];
  for (const table of TABLES) {
    const count = await countTable(supabaseUrl, serviceRoleKey, table);
    const expected = expectedInfo ? expectedInfo.expected[table] : undefined;
    const status =
      expected === undefined ? "count-only" : count >= expected ? "ok" : "below-export";
    results.push({ table, count, expected, status });
  }

  console.table(results);

  const failures = results.filter((result) => result.status === "below-export");
  if (failures.length) {
    if (strictCounts) {
      console.log("Some Supabase tables have fewer rows than the current export.");
      process.exitCode = 1;
    } else {
      console.log(
        "Some Supabase tables have fewer rows than the export, which is expected during dry-run because no rows are written."
      );
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
