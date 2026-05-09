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
    process.env.PLAYER_HUB_EXPORT_PATH || DEFAULT_EXPORT_PATH
  );
}

async function callAppsScript(action, payload = {}) {
  const url = process.env.APPS_SCRIPT_WEB_APP_URL;
  const username = process.env.APPS_SCRIPT_ADMIN_USERNAME;
  const password = process.env.APPS_SCRIPT_ADMIN_PASSWORD;
  const response = await fetch(`${url}?_ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action,
      username,
      password,
      ...payload,
    }),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`${action} did not return JSON`);
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `${action} failed`);
  }

  return data;
}

async function optionalCall(action, outputKey, selector, notes) {
  try {
    const data = await callAppsScript(action);
    return {
      key: outputKey,
      value: selector(data),
      error: "",
    };
  } catch (error) {
    notes.push(`${outputKey}: ${error.message}`);
    return {
      key: outputKey,
      value: [],
      error: error.message,
    };
  }
}

async function main() {
  const envPath = path.resolve(process.env.SUPABASE_IMPORT_ENV || DEFAULT_ENV_PATH);
  loadEnvFile(envPath);

  const outPath = exportPath();
  const notes = [];
  const hasAppsScriptConfig =
    !!process.env.APPS_SCRIPT_WEB_APP_URL &&
    !!process.env.APPS_SCRIPT_ADMIN_USERNAME &&
    !!process.env.APPS_SCRIPT_ADMIN_PASSWORD;

  const exportData = {
    meta: {
      createdAt: new Date().toISOString(),
      source: "apps-script",
      mode: hasAppsScriptConfig ? "apps-script-admin-actions" : "manual-template",
      appBehaviorChanged: false,
    },
    collections: {
      clubTeams: [],
      playerProfiles: [],
      accessRequests: [],
      teamIdentityChangeRequests: [],
      teamProfiles: [],
      teamNeeds: [],
      teamNeedInterests: [],
      teamMembers: [],
      teamMembershipRequests: [],
      tournaments: [],
      tournamentEvents: [],
      tournamentAvailability: [],
      tournamentSquadPlanning: [],
      rosterDrafts: [],
      rosterPlayers: [],
      officialRosters: [],
      eventComments: [],
    },
    unavailableFromCurrentAppsScriptActions: [],
    notes: [],
  };

  if (!hasAppsScriptConfig) {
    exportData.notes.push(
      "Apps Script admin credentials were not configured. Fill supabase/.env.import or edit this JSON manually from Sheet exports."
    );
    exportData.unavailableFromCurrentAppsScriptActions.push(
      "users",
      "teamNeeds",
      "tournaments",
      "tournamentEvents",
      "tournamentAvailability",
      "tournamentSquadPlanning",
      "rosterPlayers",
      "officialRosters",
      "eventComments"
    );
    ensureDir(outPath);
    fs.writeFileSync(outPath, `${JSON.stringify(exportData, null, 2)}\n`);
    console.log(`Created manual import template: ${outPath}`);
    console.log("No Apps Script request was made because credentials are missing.");
    return;
  }

  const calls = [
    optionalCall("listClubTeamsAdmin", "clubTeams", (data) => data.teams || [], notes),
    optionalCall(
      "listPlayerProfilesForAdmin",
      "playerProfiles",
      (data) => data.profiles || [],
      notes
    ),
    optionalCall(
      "listAccessRequestsAdmin",
      "accessRequests",
      (data) => data.requests || [],
      notes
    ),
    optionalCall(
      "listTeamIdentityChangeRequests",
      "teamIdentityChangeRequests",
      (data) => data.requests || [],
      notes
    ),
    optionalCall(
      "listTeamProfilesAdmin",
      "teamProfiles",
      (data) => data.teamProfiles || [],
      notes
    ),
    optionalCall(
      "listVisibleTeamNeeds",
      "publishedTeamNeeds",
      (data) => data.needs || [],
      notes
    ),
    optionalCall(
      "listTeamNeedInterestsAdmin",
      "teamNeedInterests",
      (data) => data.interests || [],
      notes
    ),
    optionalCall("listTeamMembersAdmin", "teamMembers", (data) => data.members || [], notes),
    optionalCall(
      "listTeamMembershipRequestsAdmin",
      "teamMembershipRequests",
      (data) => data.requests || [],
      notes
    ),
    optionalCall(
      "listSubmittedRosterDraftsForReview",
      "rosterDrafts",
      (data) => data.rosters || [],
      notes
    ),
  ];

  const results = await Promise.all(calls);
  for (const result of results) {
    if (result.key === "publishedTeamNeeds") {
      exportData.collections.teamNeeds = result.value;
    } else {
      exportData.collections[result.key] = result.value;
    }
  }

  exportData.unavailableFromCurrentAppsScriptActions.push(
    "users",
    "allInternalTeamNeedsWithoutManualSheetExport",
    "tournaments",
    "tournamentEvents",
    "tournamentAvailability",
    "tournamentSquadPlanning",
    "rosterPlayers",
    "officialRosters",
    "eventComments"
  );
  exportData.notes = notes;

  ensureDir(outPath);
  fs.writeFileSync(outPath, `${JSON.stringify(exportData, null, 2)}\n`);

  const counts = Object.fromEntries(
    Object.entries(exportData.collections).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.length : 0,
    ])
  );
  console.log(`Export written: ${outPath}`);
  console.log(JSON.stringify(counts, null, 2));
  if (notes.length) {
    console.log("Warnings:");
    notes.forEach((note) => console.log(`- ${note}`));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
