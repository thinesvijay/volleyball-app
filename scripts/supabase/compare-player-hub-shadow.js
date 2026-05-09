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

const COMPARE_TABLES = [
  {
    table: "app_users",
    exportKey: "appUsers",
    legacyColumn: "username",
    select: "username,legacy_username",
  },
  {
    table: "player_profiles",
    exportKey: "playerProfiles",
    legacyColumn: "legacy_profile_id",
    select: "legacy_profile_id,username",
  },
  {
    table: "club_teams",
    exportKey: "clubTeams",
    legacyColumn: "legacy_team_id",
    select: "legacy_team_id,name",
  },
  {
    table: "team_profiles",
    exportKey: "teamProfiles",
    legacyColumn: "legacy_team_profile_id",
    select: "legacy_team_profile_id,club_team_name",
  },
  {
    table: "team_members",
    exportKey: "teamMembers",
    legacyColumn: "legacy_team_member_id",
    select: "legacy_team_member_id,player_username",
  },
  {
    table: "team_needs",
    exportKey: "teamNeeds",
    legacyColumn: "legacy_need_id",
    select: "legacy_need_id,club_team_name",
  },
  {
    table: "roster_drafts",
    exportKey: "rosterDrafts",
    legacyColumn: "legacy_roster_id",
    select: "legacy_roster_id,tournament_name",
  },
  {
    table: "roster_players",
    exportKey: "rosterPlayers",
    legacyColumn: "legacy_roster_player_id",
    select: "legacy_roster_player_id,player_username",
  },
  {
    table: "tournaments",
    exportKey: "tournaments",
    legacyColumn: "legacy_tournament_id",
    select: "legacy_tournament_id,name",
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

function exportPath() {
  return path.resolve(
    PROJECT_ROOT,
    process.env.PLAYER_HUB_EXPORT_PATH || DEFAULT_EXPORT_PATH
  );
}

function pick(item, keys, fallback = "") {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null && item[key] !== "") {
      return item[key];
    }
  }
  return fallback;
}

function text(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function lowerUsername(value) {
  return text(value).toLowerCase();
}

function stableLegacyId(prefix, parts) {
  const cleaned = parts.map((part) => text(part).toLowerCase()).filter(Boolean);
  return cleaned.length ? `${prefix}-${cleaned.join("-")}` : "";
}

function addUnique(set, value) {
  const next = text(value);
  if (next) set.add(next);
}

function buildExpectedUsers(collections) {
  const users = new Set();
  const usernameSources = [
    [collections.playerProfiles, ["username", "Username"]],
    [collections.accessRequests, ["username", "Username"]],
    [collections.teamProfiles, ["captainUsername", "CaptainUsername"]],
    [collections.teamNeeds, ["captainUsername", "CaptainUsername"]],
    [collections.teamMembers, ["captainUsername", "CaptainUsername"]],
    [collections.teamMembers, ["playerUsername", "PlayerUsername"]],
    [collections.teamNeedInterests, ["playerUsername", "PlayerUsername"]],
    [collections.rosterDrafts, ["captainUsername", "CaptainUsername"]],
    [collections.rosterPlayers, ["playerUsername", "PlayerUsername"]],
  ];

  for (const [rows, keys] of usernameSources) {
    for (const row of rows || []) addUnique(users, lowerUsername(pick(row, keys)));
  }

  return users;
}

function buildExpectedTournaments(collections) {
  const tournaments = new Set();
  const sources = [
    collections.tournaments,
    collections.teamNeeds,
    collections.tournamentEvents,
    collections.tournamentAvailability,
    collections.tournamentSquadPlanning,
    collections.rosterDrafts,
    collections.rosterPlayers,
  ];

  for (const rows of sources) {
    for (const row of rows || []) addUnique(tournaments, pick(row, ["tournamentId", "TournamentId"]));
  }

  return tournaments;
}

function buildExpectedRosterPlayers(collections) {
  const players = new Set();
  for (const row of collections.rosterPlayers || []) {
    addUnique(
      players,
      pick(row, ["rosterPlayerId", "RosterPlayerId"]) ||
        stableLegacyId("roster-player", [
          pick(row, ["rosterId", "RosterId", "draftId", "DraftId"]),
          pick(row, ["playerUsername", "PlayerUsername"]),
        ])
    );
  }

  for (const roster of collections.rosterDrafts || []) {
    const rosterId = pick(roster, ["rosterId", "RosterId", "draftId", "DraftId", "id"]);
    for (const player of roster.players || []) {
      addUnique(
        players,
        pick(player, ["rosterPlayerId", "RosterPlayerId"]) ||
          stableLegacyId("roster-player", [
            rosterId,
            pick(player, ["playerUsername", "PlayerUsername"]),
          ])
      );
    }
  }

  return players;
}

function buildExpectedSets(exportData) {
  const c = exportData.collections || {};
  return {
    appUsers: buildExpectedUsers(c),
    playerProfiles: new Set(
      (c.playerProfiles || [])
        .map((row) => pick(row, ["profileId", "ProfileId"]) || stableLegacyId("profile", [pick(row, ["username", "Username"])]))
        .filter(Boolean)
    ),
    clubTeams: new Set((c.clubTeams || []).map((row) => pick(row, ["teamId", "TeamId"])).filter(Boolean)),
    teamProfiles: new Set(
      (c.teamProfiles || []).map((row) => pick(row, ["teamProfileId", "TeamProfileId"])).filter(Boolean)
    ),
    teamMembers: new Set(
      (c.teamMembers || []).map((row) => pick(row, ["teamMemberId", "TeamMemberId"])).filter(Boolean)
    ),
    teamNeeds: new Set((c.teamNeeds || []).map((row) => pick(row, ["needId", "NeedId"])).filter(Boolean)),
    rosterDrafts: new Set(
      (c.rosterDrafts || []).map((row) => pick(row, ["rosterId", "RosterId", "draftId", "DraftId"])).filter(Boolean)
    ),
    rosterPlayers: buildExpectedRosterPlayers(c),
    tournaments: buildExpectedTournaments(c),
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

function difference(left, right) {
  const result = [];
  for (const value of left) {
    if (!right.has(value)) result.push(value);
  }
  return result.sort();
}

async function main() {
  const env = requireEnv();
  const sourcePath = exportPath();
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Export JSON not found: ${sourcePath}. Run npm.cmd run supabase:export:player-hub first.`);
  }

  const exportData = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const expectedSets = buildExpectedSets(exportData);

  console.log("Make Teams Pro Supabase shadow comparison");
  console.log(`Export file: ${sourcePath}`);
  console.log("Read-only: no app behavior changes, no writes.");
  console.log("");

  const summary = [];
  const failures = [];

  for (const config of COMPARE_TABLES) {
    const rows = await fetchRows(env, config.table, config.select);
    const actual = new Set(
      rows.map((row) => text(row[config.legacyColumn])).filter(Boolean)
    );
    const expected = expectedSets[config.exportKey] || new Set();
    const missing = difference(expected, actual);
    const extra = difference(actual, expected);
    const status = missing.length ? "missing" : extra.length ? "extra-ok" : "ok";

    summary.push({
      table: config.table,
      exportRows: expected.size,
      supabaseRows: actual.size,
      missing: missing.length,
      extra: extra.length,
      status,
    });

    if (missing.length) {
      failures.push({ table: config.table, missing });
    }
  }

  console.table(summary);

  if (failures.length) {
    console.log("");
    console.log("Missing legacy IDs:");
    for (const failure of failures) {
      console.log(`- ${failure.table}: ${failure.missing.slice(0, 10).join(", ")}`);
      if (failure.missing.length > 10) {
        console.log(`  ...and ${failure.missing.length - 10} more`);
      }
    }
    process.exitCode = 1;
  } else {
    console.log("");
    console.log("Comparison passed: every exported legacy ID exists in Supabase.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
