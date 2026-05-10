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

const TABLE_COLUMNS = {
  app_users: [
    "legacy_username",
    "username",
    "password_hash",
    "role",
    "display_name",
    "email",
    "phone",
    "active",
    "archived_at",
    "can_request_team_profile",
    "can_use_team_builder",
    "can_use_tournaments",
    "can_create_tournaments",
    "spreadsheet_id",
    "skill_view",
    "skill_scale",
  ],
  team_builder_players: [
    "legacy_player_id",
    "owner_username",
    "owner_display_name",
    "active",
    "name",
    "skill",
    "cannot_play_with",
    "club",
    "notes",
    "metadata",
    "created_at",
    "updated_at",
  ],
  team_builder_saved_teams: [
    "legacy_saved_team_id",
    "owner_username",
    "label",
    "teams_json",
    "created_at",
    "updated_at",
  ],
  club_teams: ["legacy_team_id", "name", "country", "city", "active"],
  player_profiles: [
    "legacy_profile_id",
    "user_id",
    "username",
    "first_name",
    "last_name",
    "display_name",
    "email",
    "phone",
    "country",
    "region",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "club_or_team",
    "team_note",
    "profile_type",
    "free_agent",
    "primary_role",
    "secondary_role",
    "custom_role",
    "level",
    "availability",
    "looking_for_team",
    "available_as_substitute",
    "can_guest_for_teams",
    "interested_abroad",
    "public_visible",
    "approved",
  ],
  access_requests: [
    "legacy_request_id",
    "user_id",
    "username",
    "display_name",
    "email",
    "request_type",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "message",
    "status",
    "admin_note",
    "reviewed_by_username",
    "reviewed_at",
  ],
  team_profiles: [
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "country",
    "captain_user_id",
    "captain_username",
    "captain_display_name",
    "team_level",
    "team_description",
    "contact_note",
    "needs_players",
    "needs_text",
    "active",
    "public_visible",
    "approved",
  ],
  team_identity_change_requests: [
    "legacy_request_id",
    "club_team_id",
    "legacy_team_id",
    "current_name",
    "requested_name",
    "current_country",
    "requested_country",
    "current_city",
    "requested_city",
    "requested_by_user_id",
    "requested_by_username",
    "reason",
    "status",
    "admin_note",
    "reviewed_by_username",
    "reviewed_at",
  ],
  team_members: [
    "legacy_team_member_id",
    "team_profile_id",
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "captain_user_id",
    "captain_username",
    "player_user_id",
    "player_username",
    "player_display_name",
    "player_email",
    "player_phone",
    "player_country",
    "source_interest_id",
    "legacy_source_interest_id",
    "member_status",
    "confirmed_by_username",
    "confirmed_at",
  ],
  team_membership_requests: [
    "legacy_request_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "player_user_id",
    "player_username",
    "player_display_name",
    "player_email",
    "player_phone",
    "player_country",
    "legacy_player_profile_id",
    "status",
    "requested_at",
    "reviewed_by_username",
    "reviewed_at",
    "review_note",
  ],
  tournaments: [
    "legacy_tournament_id",
    "name",
    "country",
    "city",
    "start_date",
    "end_date",
    "registration_deadline",
    "visibility",
    "status",
    "organizer_username",
    "public_code",
    "published",
    "published_at",
    "tournament_json",
  ],
  team_needs: [
    "legacy_need_id",
    "team_profile_id",
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "captain_user_id",
    "captain_username",
    "need_type",
    "need_text",
    "needed_count",
    "status",
    "visibility",
    "is_published",
    "need_context",
    "tournament_id",
    "legacy_tournament_id",
    "tournament_name",
    "squad_label",
    "class_name",
    "deadline_at",
    "source_type",
    "published_at",
    "public_visible",
    "approved",
  ],
  team_need_interests: [
    "legacy_interest_id",
    "need_id",
    "legacy_need_id",
    "team_profile_id",
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "player_user_id",
    "player_username",
    "player_display_name",
    "player_email",
    "player_phone",
    "player_country",
    "message",
    "status",
    "reviewed_by_username",
    "reviewed_at",
  ],
  tournament_events: [
    "legacy_plan_id",
    "tournament_id",
    "legacy_tournament_id",
    "tournament_name",
    "team_profile_id",
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "captain_user_id",
    "captain_username",
    "squad_label",
    "class_name",
    "status",
    "deadline_at",
    "note",
  ],
  tournament_availability: [
    "legacy_availability_id",
    "event_id",
    "legacy_plan_id",
    "tournament_id",
    "legacy_tournament_id",
    "tournament_name",
    "team_profile_id",
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "player_user_id",
    "player_username",
    "player_display_name",
    "player_email",
    "player_phone",
    "player_country",
    "response_status",
    "preferred_squad",
    "player_note",
    "requested_by_username",
    "requested_at",
    "responded_at",
  ],
  tournament_squad_planning: [
    "legacy_planning_id",
    "event_id",
    "legacy_plan_id",
    "tournament_id",
    "legacy_tournament_id",
    "tournament_name",
    "team_profile_id",
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "player_user_id",
    "player_username",
    "player_display_name",
    "player_country",
    "availability_status",
    "preferred_squad",
    "assigned_squad",
    "planning_status",
    "assigned_by_username",
    "assigned_at",
  ],
  roster_drafts: [
    "legacy_roster_id",
    "event_id",
    "legacy_plan_id",
    "tournament_id",
    "legacy_tournament_id",
    "tournament_name",
    "team_profile_id",
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "squad_label",
    "captain_user_id",
    "captain_username",
    "roster_status",
    "submitted_by_username",
    "submitted_at",
    "reviewed_by_username",
    "reviewed_at",
    "admin_note",
    "locked_at",
    "locked_by_username",
    "lock_reason",
  ],
  roster_players: [
    "legacy_roster_player_id",
    "roster_id",
    "legacy_roster_id",
    "event_id",
    "legacy_plan_id",
    "tournament_id",
    "legacy_tournament_id",
    "tournament_name",
    "team_profile_id",
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "squad_label",
    "player_user_id",
    "player_username",
    "player_display_name",
    "player_country",
    "assigned_squad",
    "roster_role",
    "source",
    "player_status",
    "added_by_username",
    "added_at",
  ],
  official_rosters: [
    "legacy_official_roster_id",
    "draft_id",
    "legacy_draft_id",
    "tournament_id",
    "legacy_tournament_id",
    "tournament_name",
    "club_team_id",
    "legacy_team_id",
    "team_name",
    "squad_label",
    "group_name",
    "player_user_id",
    "player_username",
    "player_display_name",
    "player_country",
    "status",
    "locked_at",
    "locked_by_username",
  ],
  event_comments: [
    "legacy_comment_id",
    "event_id",
    "legacy_plan_id",
    "team_profile_id",
    "legacy_team_profile_id",
    "club_team_id",
    "legacy_club_team_id",
    "club_team_name",
    "user_id",
    "username",
    "display_name",
    "message",
    "active",
  ],
  audit_log: [
    "actor_user_id",
    "actor_username",
    "action",
    "entity_table",
    "entity_id",
    "legacy_entity_id",
    "metadata",
  ],
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

function inputPath() {
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

function nullableText(value) {
  const next = text(value);
  return next ? next : null;
}

function stringList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean);
  }
  return text(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function lowerUsername(value) {
  return text(value).toLowerCase();
}

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes", "y", "on", "active", "approved"].includes(normalized);
}

function intValue(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dateOrNull(value) {
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function oneOf(value, allowed, fallback) {
  const normalized = text(value).toUpperCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function stableLegacyId(prefix, parts) {
  const cleaned = parts.map((part) => text(part).toLowerCase()).filter(Boolean);
  return cleaned.length ? `${prefix}-${cleaned.join("-")}` : null;
}

function addUniqueBy(array, row, key) {
  if (!row || !row[key]) return;
  if (array.some((existing) => existing[key] === row[key])) return;
  array.push(row);
}

function normalizeRowsForTable(rows, columns) {
  if (!Array.isArray(columns) || !columns.length) {
    throw new Error("Importer table columns are missing.");
  }

  const importTimestamp = new Date().toISOString();
  const booleanDefaults = new Map([
    ["active", true],
    ["published", false],
    ["approved", false],
    ["public_visible", false],
    ["free_agent", false],
    ["looking_for_team", false],
    ["available_as_substitute", false],
    ["can_guest_for_teams", false],
    ["interested_abroad", false],
    ["needs_players", false],
    ["is_published", false],
    ["can_request_team_profile", false],
    ["can_use_team_builder", false],
    ["can_use_tournaments", false],
    ["can_create_tournaments", false],
  ]);

  return (rows || []).filter(Boolean).map((row) => {
    const normalized = {};
    for (const column of columns) {
      if (Object.prototype.hasOwnProperty.call(row, column)) {
        normalized[column] = row[column] === undefined ? null : row[column];
      } else {
        normalized[column] = null;
      }
    }
    if (columns.includes("created_at")) {
      normalized.created_at = dateOrNull(normalized.created_at) || importTimestamp;
    }
    if (columns.includes("updated_at")) {
      normalized.updated_at =
        dateOrNull(normalized.updated_at) || normalized.created_at || importTimestamp;
    }
    if (columns.includes("metadata") && normalized.metadata == null) {
      normalized.metadata = {};
    }
    if (columns.includes("teams_json") && normalized.teams_json == null) {
      normalized.teams_json = [];
    }
    if (columns.includes("cannot_play_with") && normalized.cannot_play_with == null) {
      normalized.cannot_play_with = [];
    }
    for (const [column, fallback] of booleanDefaults.entries()) {
      if (columns.includes(column) && normalized[column] == null) {
        normalized[column] = fallback;
      }
    }
    return normalized;
  });
}

function validateConsistentRowKeys(table, rows, columns) {
  const expected = columns.join("\u0001");
  rows.forEach((row, index) => {
    const actualColumns = Object.keys(row);
    const actual = actualColumns.join("\u0001");
    if (actual !== expected) {
      throw new Error(
        `${table} row ${index + 1} has inconsistent columns. Expected ${columns.join(", ")}; got ${actualColumns.join(", ")}`
      );
    }

    for (const column of columns) {
      if (row[column] === undefined) {
        throw new Error(`${table} row ${index + 1} column ${column} is undefined after normalization.`);
      }
    }
  });
}

class SupabaseRest {
  constructor(url, serviceRoleKey, dryRun) {
    this.url = url.replace(/\/+$/, "");
    this.serviceRoleKey = serviceRoleKey;
    this.dryRun = dryRun;
  }

  async upsert(table, rows, onConflict) {
    const columns = TABLE_COLUMNS[table];
    if (!columns) {
      throw new Error(`No explicit import column list configured for ${table}.`);
    }

    const cleanRows = normalizeRowsForTable(rows, columns);
    validateConsistentRowKeys(table, cleanRows, columns);

    console.log(
      `[${this.dryRun ? "dry-run" : "import"}] ${table}: rows=${cleanRows.length}, conflict=${onConflict}`
    );

    if (!cleanRows.length) return [];
    if (this.dryRun) {
      return cleanRows.map((row, index) => ({ id: `dry-run-${table}-${index}`, ...row }));
    }

    const response = await fetch(
      `${this.url}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
      {
        method: "POST",
        headers: {
          apikey: this.serviceRoleKey,
          Authorization: `Bearer ${this.serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(cleanRows),
      }
    );

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`${table} upsert failed: ${response.status} ${body}`);
    }
    return body ? JSON.parse(body) : [];
  }
}

function collect(data) {
  const c = data.collections || {};
  const rosterDrafts = [...(c.rosterDrafts || [])];
  const rosterPlayersFromDrafts = [];
  for (const roster of rosterDrafts) {
    const players = Array.isArray(roster.players) ? roster.players : [];
    for (const player of players) {
      rosterPlayersFromDrafts.push({
        ...player,
        rosterId: pick(roster, ["rosterId", "RosterId", "id"]),
        planId: pick(roster, ["planId", "PlanId", "legacyPlanId"]),
        tournamentId: pick(roster, ["tournamentId", "TournamentId"]),
        tournamentName: pick(roster, ["tournamentName", "TournamentName"]),
        teamProfileId: pick(roster, ["teamProfileId", "TeamProfileId"]),
        clubTeamId: pick(roster, ["clubTeamId", "ClubTeamId"]),
        clubTeamName: pick(roster, ["clubTeamName", "ClubTeamName"]),
        squadLabel: pick(roster, ["squadLabel", "SquadLabel"]),
      });
    }
  }

  return {
    users: c.users || [],
    teamBuilderPlayers: c.teamBuilderPlayers || [],
    teamBuilderSavedTeams: c.teamBuilderSavedTeams || [],
    clubTeams: c.clubTeams || [],
    playerProfiles: c.playerProfiles || [],
    accessRequests: c.accessRequests || [],
    teamIdentityChangeRequests: c.teamIdentityChangeRequests || [],
    teamProfiles: c.teamProfiles || [],
    teamNeeds: c.teamNeeds || [],
    teamNeedInterests: c.teamNeedInterests || [],
    teamMembers: c.teamMembers || [],
    teamMembershipRequests: c.teamMembershipRequests || [],
    tournaments: c.tournaments || [],
    tournamentEvents: c.tournamentEvents || [],
    tournamentAvailability: c.tournamentAvailability || [],
    tournamentSquadPlanning: c.tournamentSquadPlanning || [],
    rosterDrafts,
    rosterPlayers: [...(c.rosterPlayers || []), ...rosterPlayersFromDrafts],
    officialRosters: c.officialRosters || [],
    eventComments: c.eventComments || [],
    auditLogs: c.auditLogs || [],
  };
}

function buildUsers(collections) {
  const users = [];
  const byUsername = new Map();

  function remember(username, patch = {}) {
    const normalized = lowerUsername(username);
    if (!normalized) return;
    const existing = byUsername.get(normalized) || {
      legacy_username: normalized,
      username: normalized,
      role: "player",
      active: true,
      can_use_team_builder: false,
      can_use_tournaments: false,
    };
    byUsername.set(normalized, { ...existing, ...patch, username: normalized });
  }

  for (const profile of collections.playerProfiles) {
    const username = pick(profile, ["username", "Username"]);
    remember(username, {
      legacy_username: text(username).toLowerCase(),
      role: oneOf(pick(profile, ["role", "Role"], "player"), ["ADMIN", "TRAINER", "PLAYER"], "PLAYER").toLowerCase(),
      display_name: nullableText(pick(profile, ["displayName", "DisplayName"])),
      email: nullableText(pick(profile, ["email", "Email"])),
      phone: nullableText(pick(profile, ["phone", "Phone"])),
      active: bool(pick(profile, ["active", "Active"], true), true),
      can_use_team_builder: bool(
        pick(profile, ["canUseTeamBuilder", "CanUseTeamBuilder"], false),
        false
      ),
      can_use_tournaments: bool(
        pick(profile, ["canUseTournaments", "CanUseTournaments"], false),
        false
      ),
    });
  }

  const usernameFields = [
    [collections.accessRequests, ["username", "Username"]],
    [collections.teamIdentityChangeRequests, ["requestedByUsername", "RequestedByUsername"]],
    [collections.teamProfiles, ["captainUsername", "CaptainUsername"]],
    [collections.teamNeeds, ["captainUsername", "CaptainUsername"]],
    [collections.teamNeedInterests, ["playerUsername", "PlayerUsername"]],
    [collections.teamMembers, ["captainUsername", "CaptainUsername"]],
    [collections.teamMembers, ["playerUsername", "PlayerUsername"]],
    [collections.teamMembershipRequests, ["playerUsername", "PlayerUsername"]],
    [collections.tournamentEvents, ["captainUsername", "CaptainUsername"]],
    [collections.tournamentAvailability, ["playerUsername", "PlayerUsername"]],
    [collections.tournamentAvailability, ["requestedBy", "RequestedBy"]],
    [collections.tournamentSquadPlanning, ["playerUsername", "PlayerUsername"]],
    [collections.tournamentSquadPlanning, ["assignedBy", "AssignedBy"]],
    [collections.rosterDrafts, ["captainUsername", "CaptainUsername"]],
    [collections.rosterDrafts, ["submittedBy", "SubmittedBy"]],
    [collections.rosterDrafts, ["reviewedBy", "ReviewedBy"]],
    [collections.rosterDrafts, ["lockedBy", "LockedBy"]],
    [collections.rosterPlayers, ["playerUsername", "PlayerUsername"]],
    [collections.rosterPlayers, ["addedBy", "AddedBy"]],
    [collections.officialRosters, ["playerUsername", "PlayerUsername"]],
    [collections.officialRosters, ["lockedBy", "LockedBy"]],
    [collections.eventComments, ["username", "Username"]],
  ];

  for (const [rows, keys] of usernameFields) {
    for (const row of rows || []) remember(pick(row, keys));
  }

  for (const user of collections.users || []) {
    const username = pick(user, ["username", "Username", "legacyUsername", "LegacyUsername"]);
    const normalized = lowerUsername(username);
    if (!normalized) continue;
    const role = oneOf(pick(user, ["role", "Role"], "PLAYER"), ["ADMIN", "TRAINER", "PLAYER"], "PLAYER").toLowerCase();
    remember(normalized, {
      legacy_username: nullableText(pick(user, ["legacyUsername", "LegacyUsername"], username)) || normalized,
      password_hash: nullableText(pick(user, ["passwordHash", "PasswordHash", "password", "Password", "password_hash"])),
      role,
      display_name: nullableText(pick(user, ["displayName", "DisplayName", "name", "Name"])),
      email: nullableText(pick(user, ["email", "Email"])),
      phone: nullableText(pick(user, ["phone", "Phone"])),
      active: bool(pick(user, ["active", "Active"], true), true),
      archived_at: dateOrNull(pick(user, ["archivedAt", "ArchivedAt", "archived_at"])),
      can_request_team_profile: bool(
        pick(user, ["canRequestTeamProfile", "CanRequestTeamProfile"], false),
        false
      ),
      can_use_team_builder:
        role === "admin" ||
        bool(pick(user, ["canUseTeamBuilder", "CanUseTeamBuilder"], false), false),
      can_use_tournaments:
        role === "admin" ||
        bool(pick(user, ["canUseTournaments", "CanUseTournaments"], false), false),
      can_create_tournaments:
        role === "admin" ||
        bool(pick(user, ["canCreateTournaments", "CanCreateTournaments"], false), false),
      spreadsheet_id: nullableText(pick(user, ["spreadsheetId", "SpreadsheetId", "spreadsheet_id"])),
      skill_view: nullableText(pick(user, ["skillView", "SkillView"], "numbers")),
      skill_scale: intValue(pick(user, ["skillScale", "SkillScale"], 5), 5),
      created_at: dateOrNull(pick(user, ["createdAt", "CreatedAt"])) || undefined,
      updated_at: dateOrNull(pick(user, ["updatedAt", "UpdatedAt"])) || undefined,
    });
  }

  for (const user of byUsername.values()) users.push(user);
  return users;
}

function buildTournaments(collections) {
  const tournaments = [];
  const seen = new Map();
  const skipped = [];

  function normalizeTournamentJson(item, legacyId, name, status, visibility, organizerUsername, publicCode, published, publishedAt) {
    const rawJson = pick(item, ["tournamentJson", "TournamentJson"], null);
    let tournamentJson = rawJson && typeof rawJson === "object" ? { ...rawJson } : null;
    if (!tournamentJson && typeof rawJson === "string" && rawJson.trim()) {
      try {
        tournamentJson = JSON.parse(rawJson);
      } catch (error) {
        tournamentJson = null;
      }
    }
    tournamentJson = tournamentJson || { ...item };
    tournamentJson.id = tournamentJson.id || legacyId;
    tournamentJson.tournamentId = tournamentJson.tournamentId || legacyId;
    tournamentJson.TournamentId = tournamentJson.TournamentId || legacyId;
    tournamentJson.name = tournamentJson.name || name;
    tournamentJson.status = tournamentJson.status || status;
    tournamentJson.visibility = tournamentJson.visibility || visibility;
    tournamentJson.organizerUsername =
      tournamentJson.organizerUsername || organizerUsername;
    tournamentJson.ownerUsername = tournamentJson.ownerUsername || organizerUsername;
    tournamentJson.publicCode = tournamentJson.publicCode || publicCode || "";
    tournamentJson.published = bool(tournamentJson.published, published);
    tournamentJson.publishedAt = tournamentJson.publishedAt || publishedAt || "";
    return tournamentJson;
  }

  (collections.tournaments || []).forEach((item, index) => {
    const legacyId = nullableText(pick(item, ["tournamentId", "TournamentId", "id", "Id"]));
    const name = text(pick(item, ["name", "Name", "tournamentName", "TournamentName"], "Untitled tournament"));
    if (!legacyId) {
      skipped.push({ index: index + 1, reason: "missing legacy tournament id", name });
      return;
    }
    if (seen.has(legacyId)) {
      skipped.push({
        index: index + 1,
        reason: `duplicate legacy tournament id; kept export row ${seen.get(legacyId)}`,
        id: legacyId,
        name,
      });
      return;
    }
    seen.set(legacyId, index + 1);

    const published = bool(pick(item, ["published", "Published"], false), false);
    const status =
      nullableText(pick(item, ["status", "Status"])) ||
      (published ? "published" : "draft");
    const visibility =
      nullableText(pick(item, ["visibility", "Visibility"])) ||
      (published ? "public" : "private");
    const organizerUsername = nullableText(
      pick(item, ["organizerUsername", "OrganizerUsername", "ownerUsername", "OwnerUsername"])
    );
    const publicCode = nullableText(pick(item, ["publicCode", "PublicCode"]));
    const publishedAt = dateOrNull(pick(item, ["publishedAt", "PublishedAt"]));

    addUniqueBy(
      tournaments,
      {
        legacy_tournament_id: legacyId,
        name,
        country: nullableText(pick(item, ["country", "Country"])),
        city: nullableText(pick(item, ["city", "City"])),
        start_date: nullableText(pick(item, ["startDate", "StartDate"])),
        end_date: nullableText(pick(item, ["endDate", "EndDate"])),
        registration_deadline: dateOrNull(pick(item, ["registrationDeadline", "RegistrationDeadline"])),
        visibility,
        status,
        organizer_username: organizerUsername,
        public_code: publicCode,
        published,
        published_at: publishedAt,
        tournament_json: normalizeTournamentJson(
          item,
          legacyId,
          name,
          status,
          visibility,
          organizerUsername,
          publicCode,
          published,
          publishedAt
        ),
      },
      "legacy_tournament_id"
    );
  });

  const tournamentSources = [
    collections.teamNeeds,
    collections.tournamentEvents,
    collections.tournamentAvailability,
    collections.tournamentSquadPlanning,
    collections.rosterDrafts,
    collections.rosterPlayers,
    collections.officialRosters,
  ];

  for (const rows of tournamentSources) {
    for (const item of rows || []) {
      const legacy = nullableText(pick(item, ["tournamentId", "TournamentId"]));
      const name = nullableText(pick(item, ["tournamentName", "TournamentName", "name", "Name"]));
      if (!legacy || !name) continue;
      addUniqueBy(
        tournaments,
        {
          legacy_tournament_id: legacy,
          name,
          status: "shadow-import",
          visibility: "private",
          published: false,
          tournament_json: {
            id: legacy,
            tournamentId: legacy,
            TournamentId: legacy,
            name,
            status: "shadow-import",
            visibility: "private",
            published: false,
          },
        },
        "legacy_tournament_id"
      );
    }
  }
  if (skipped.length) {
    console.log("Skipped exported tournament rows:");
    skipped.forEach((item) => {
      console.log(`- row ${item.index}: ${item.reason}${item.id ? ` (${item.id})` : ""}${item.name ? ` ${item.name}` : ""}`);
    });
  }
  return tournaments;
}

function idMap(rows, legacyKey) {
  const map = new Map();
  for (const row of rows || []) {
    if (row[legacyKey]) map.set(String(row[legacyKey]), row.id);
  }
  return map;
}

function usernameMap(rows) {
  const map = new Map();
  for (const row of rows || []) {
    if (row.username) map.set(String(row.username).toLowerCase(), row.id);
  }
  return map;
}

function normalizeNeedVisibility(item) {
  const visibility = text(pick(item, ["visibility", "Visibility"])).toLowerCase();
  if (visibility === "published") return "published";
  return bool(pick(item, ["isPublished", "IsPublished"], false), false)
    ? "published"
    : "internal";
}

function normalizeNeedContext(item) {
  const context = text(pick(item, ["needContext", "NeedContext"])).toLowerCase();
  if (["general", "training", "tournament"].includes(context)) return context;
  return normalizeNeedVisibility(item) === "published" ? "tournament" : "general";
}

async function main() {
  const envPath = path.resolve(process.env.SUPABASE_IMPORT_ENV || DEFAULT_ENV_PATH);
  loadEnvFile(envPath);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dryRun = String(process.env.SUPABASE_IMPORT_DRY_RUN || "true").toLowerCase() !== "false";
  const sourcePath = inputPath();

  if (!fs.existsSync(sourcePath)) {
    console.log(`Export file not found: ${sourcePath}`);
    console.log("Run the matching Supabase export script first, or create the JSON manually.");
    return;
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.log("Supabase import env is not configured. No import was run.");
    console.log(`Create ${path.relative(PROJECT_ROOT, envPath)} from supabase/.env.import.example.`);
    return;
  }

  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const collections = collect(source);
  const db = new SupabaseRest(supabaseUrl, serviceRoleKey, dryRun);

  console.log(dryRun ? "Running Supabase import dry-run." : "Running Supabase import.");

  const appUsers = await db.upsert("app_users", buildUsers(collections), "username");
  const usersByUsername = usernameMap(appUsers);

  await db.upsert(
    "team_builder_players",
    collections.teamBuilderPlayers
      .map((player) => {
        const ownerUsername = lowerUsername(
          pick(player, ["ownerUsername", "OwnerUsername"], "__main__")
        ) || "__main__";
        const name = text(pick(player, ["name", "Name"]));
        return {
          legacy_player_id:
            nullableText(pick(player, ["legacyPlayerId", "LegacyPlayerId", "playerId", "PlayerId"])) ||
            stableLegacyId("team-builder-player", [ownerUsername, name]),
          owner_username: ownerUsername,
          owner_display_name: nullableText(
            pick(player, ["ownerDisplayName", "OwnerDisplayName"], ownerUsername)
          ),
          active: bool(pick(player, ["active", "Active"], true), true),
          name,
          skill: intValue(pick(player, ["skill", "Skill"], 1), 1),
          cannot_play_with: stringList(pick(player, ["cannot", "Cannot", "cannotPlayWith", "CannotPlayWith"], "")),
          club: nullableText(pick(player, ["club", "Club"])),
          notes: nullableText(pick(player, ["notes", "Notes"])),
          metadata: {
            spreadsheetId: nullableText(pick(player, ["spreadsheetId", "SpreadsheetId"])),
          },
          created_at: dateOrNull(pick(player, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(player, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_player_id && row.owner_username && row.name),
    "legacy_player_id"
  );

  await db.upsert(
    "team_builder_saved_teams",
    collections.teamBuilderSavedTeams
      .map((saved) => {
        const ownerUsername = lowerUsername(
          pick(saved, ["ownerUsername", "OwnerUsername"], "__main__")
        ) || "__main__";
        return {
          legacy_saved_team_id:
            nullableText(pick(saved, ["legacySavedTeamId", "LegacySavedTeamId", "savedTeamId", "SavedTeamId"])) ||
            stableLegacyId("team-builder-saved-teams", [ownerUsername, pick(saved, ["label", "Label"], "current")]),
          owner_username: ownerUsername,
          label: nullableText(pick(saved, ["label", "Label"], "Current teams")),
          teams_json: Array.isArray(saved.teams)
            ? saved.teams
            : pick(saved, ["teamsJson", "TeamsJson"], []),
          created_at: dateOrNull(pick(saved, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(saved, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_saved_team_id && row.owner_username),
    "legacy_saved_team_id"
  );

  const clubTeams = await db.upsert(
    "club_teams",
    collections.clubTeams.map((team) => ({
      legacy_team_id: nullableText(pick(team, ["teamId", "TeamId", "legacyTeamId"])),
      name: text(pick(team, ["name", "Name"], "Unnamed team")),
      country: nullableText(pick(team, ["country", "Country"])),
      city: nullableText(pick(team, ["city", "City"])),
      active: bool(pick(team, ["active", "Active"], true), true),
      created_at: dateOrNull(pick(team, ["createdAt", "CreatedAt"])) || undefined,
      updated_at: dateOrNull(pick(team, ["updatedAt", "UpdatedAt"])) || undefined,
    })).filter((row) => row.legacy_team_id && row.name),
    "legacy_team_id"
  );
  const teamsByLegacyId = idMap(clubTeams, "legacy_team_id");

  const tournaments = await db.upsert(
    "tournaments",
    buildTournaments(collections).filter((row) => row.legacy_tournament_id && row.name),
    "legacy_tournament_id"
  );
  const tournamentsByLegacyId = idMap(tournaments, "legacy_tournament_id");

  await db.upsert(
    "player_profiles",
    collections.playerProfiles
      .map((profile) => {
        const username = lowerUsername(pick(profile, ["username", "Username"]));
        const legacyProfileId =
          nullableText(pick(profile, ["profileId", "ProfileId"])) ||
          stableLegacyId("profile", [username]);
        const legacyClubTeamId = nullableText(pick(profile, ["clubTeamId", "ClubTeamId"]));
        return {
          legacy_profile_id: legacyProfileId,
          user_id: usersByUsername.get(username) || null,
          username,
          first_name: nullableText(pick(profile, ["firstName", "FirstName"])),
          last_name: nullableText(pick(profile, ["lastName", "LastName"])),
          display_name: text(pick(profile, ["displayName", "DisplayName"], username)),
          email: nullableText(pick(profile, ["email", "Email"])),
          phone: nullableText(pick(profile, ["phone", "Phone"])),
          country: nullableText(pick(profile, ["country", "Country"])),
          region: nullableText(pick(profile, ["region", "Region"])),
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(profile, ["clubTeamName", "ClubTeamName"])),
          club_or_team: nullableText(pick(profile, ["clubOrTeam", "ClubOrTeam"])),
          team_note: nullableText(pick(profile, ["teamNote", "TeamNote"])),
          profile_type: text(pick(profile, ["profileType", "ProfileType"], "Player")),
          free_agent: bool(pick(profile, ["freeAgent", "FreeAgent"], false), false),
          primary_role: nullableText(pick(profile, ["primaryRole", "PrimaryRole"])),
          secondary_role: nullableText(pick(profile, ["secondaryRole", "SecondaryRole"])),
          custom_role: nullableText(pick(profile, ["customRole", "CustomRole"])),
          level: nullableText(pick(profile, ["level", "Level"])),
          availability: nullableText(pick(profile, ["availability", "Availability"])),
          looking_for_team: bool(pick(profile, ["lookingForTeam", "LookingForTeam"], false), false),
          available_as_substitute: bool(pick(profile, ["availableAsSubstitute", "AvailableAsSubstitute"], false), false),
          can_guest_for_teams: bool(pick(profile, ["canGuestForTeams", "CanGuestForTeams"], false), false),
          interested_abroad: bool(pick(profile, ["interestedAbroad", "InterestedAbroad"], false), false),
          public_visible: bool(pick(profile, ["publicVisible", "PublicVisible"], false), false),
          approved: bool(pick(profile, ["approved", "Approved"], false), false),
          created_at: dateOrNull(pick(profile, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(profile, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_profile_id && row.username),
    "legacy_profile_id"
  );

  await db.upsert(
    "access_requests",
    collections.accessRequests
      .map((request) => {
        const username = lowerUsername(pick(request, ["username", "Username"]));
        const legacyClubTeamId = nullableText(pick(request, ["clubTeamId", "ClubTeamId"]));
        return {
          legacy_request_id:
            nullableText(pick(request, ["requestId", "RequestId"])) ||
            stableLegacyId("access", [
              username,
              pick(request, ["requestType", "RequestType"]),
              pick(request, ["createdAt", "CreatedAt"]),
            ]),
          user_id: usersByUsername.get(username) || null,
          username,
          display_name: nullableText(pick(request, ["displayName", "DisplayName"])),
          email: nullableText(pick(request, ["email", "Email"])),
          request_type: oneOf(pick(request, ["requestType", "RequestType"]), ["CAPTAIN", "TRAINER", "ORGANIZER"], "CAPTAIN"),
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(request, ["clubTeamName", "ClubTeamName"])),
          message: nullableText(pick(request, ["message", "Message"])),
          status: oneOf(pick(request, ["status", "Status"]), ["PENDING", "APPROVED", "REJECTED"], "PENDING"),
          admin_note: nullableText(pick(request, ["adminNote", "AdminNote"])),
          reviewed_by_username: nullableText(pick(request, ["reviewedBy", "ReviewedBy"])),
          reviewed_at: dateOrNull(pick(request, ["reviewedAt", "ReviewedAt"])),
          created_at: dateOrNull(pick(request, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(request, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_request_id && row.username),
    "legacy_request_id"
  );

  await db.upsert(
    "team_identity_change_requests",
    collections.teamIdentityChangeRequests
      .map((request) => {
        const legacyTeamId = nullableText(pick(request, ["teamId", "TeamId"]));
        const requestedBy = lowerUsername(pick(request, ["requestedByUsername", "RequestedByUsername"]));
        return {
          legacy_request_id: nullableText(pick(request, ["requestId", "RequestId"])),
          club_team_id: teamsByLegacyId.get(legacyTeamId) || null,
          legacy_team_id: legacyTeamId,
          current_name: nullableText(pick(request, ["currentName", "CurrentName"])),
          requested_name: nullableText(pick(request, ["requestedName", "RequestedName"])),
          current_country: nullableText(pick(request, ["currentCountry", "CurrentCountry"])),
          requested_country: nullableText(pick(request, ["requestedCountry", "RequestedCountry"])),
          current_city: nullableText(pick(request, ["currentCity", "CurrentCity"])),
          requested_city: nullableText(pick(request, ["requestedCity", "RequestedCity"])),
          requested_by_user_id: usersByUsername.get(requestedBy) || null,
          requested_by_username: requestedBy,
          reason: nullableText(pick(request, ["reason", "Reason"])),
          status: oneOf(pick(request, ["status", "Status"]), ["PENDING", "APPROVED", "REJECTED"], "PENDING"),
          admin_note: nullableText(pick(request, ["adminNote", "AdminNote"])),
          reviewed_by_username: nullableText(pick(request, ["reviewedBy", "ReviewedBy"])),
          reviewed_at: dateOrNull(pick(request, ["reviewedAt", "ReviewedAt"])),
          created_at: dateOrNull(pick(request, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(request, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_request_id && row.requested_by_username),
    "legacy_request_id"
  );

  const teamProfiles = await db.upsert(
    "team_profiles",
    collections.teamProfiles
      .map((profile) => {
        const legacyClubTeamId = nullableText(pick(profile, ["clubTeamId", "ClubTeamId"]));
        const captainUsername = lowerUsername(pick(profile, ["captainUsername", "CaptainUsername"]));
        return {
          legacy_team_profile_id: nullableText(pick(profile, ["teamProfileId", "TeamProfileId"])),
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(profile, ["clubTeamName", "ClubTeamName"])),
          country: nullableText(pick(profile, ["country", "Country"])),
          captain_user_id: usersByUsername.get(captainUsername) || null,
          captain_username: captainUsername,
          captain_display_name: nullableText(pick(profile, ["captainDisplayName", "CaptainDisplayName"])),
          team_level: nullableText(pick(profile, ["teamLevel", "TeamLevel"])),
          team_description: nullableText(pick(profile, ["teamDescription", "TeamDescription"])),
          contact_note: nullableText(pick(profile, ["contactNote", "ContactNote"])),
          needs_players: bool(pick(profile, ["needsPlayers", "NeedsPlayers"], false), false),
          needs_text: nullableText(pick(profile, ["needsText", "NeedsText"])),
          active: bool(pick(profile, ["active", "Active"], true), true),
          public_visible: bool(pick(profile, ["publicVisible", "PublicVisible"], false), false),
          approved: bool(pick(profile, ["approved", "Approved"], false), false),
          created_at: dateOrNull(pick(profile, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(profile, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_team_profile_id && row.captain_username),
    "legacy_team_profile_id"
  );
  const teamProfilesByLegacyId = idMap(teamProfiles, "legacy_team_profile_id");

  const teamNeeds = await db.upsert(
    "team_needs",
    collections.teamNeeds
      .map((need) => {
        const legacyTeamProfileId = nullableText(pick(need, ["teamProfileId", "TeamProfileId"]));
        const legacyClubTeamId = nullableText(pick(need, ["clubTeamId", "ClubTeamId"]));
        const legacyTournamentId = nullableText(pick(need, ["tournamentId", "TournamentId"]));
        const captainUsername = lowerUsername(pick(need, ["captainUsername", "CaptainUsername"]));
        return {
          legacy_need_id: nullableText(pick(need, ["needId", "NeedId"])),
          team_profile_id: teamProfilesByLegacyId.get(legacyTeamProfileId) || null,
          legacy_team_profile_id: legacyTeamProfileId,
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(need, ["clubTeamName", "ClubTeamName"])),
          captain_user_id: usersByUsername.get(captainUsername) || null,
          captain_username: captainUsername,
          need_type: oneOf(pick(need, ["needType", "NeedType"]), ["PLAYER", "SUBSTITUTE", "TRAINING_PLAYER"], "PLAYER"),
          need_text: nullableText(pick(need, ["needText", "NeedText"])),
          needed_count: Math.max(intValue(pick(need, ["neededCount", "NeededCount"], 1), 1), 1),
          status: oneOf(pick(need, ["status", "Status"]), ["OPEN", "CLOSED", "ARCHIVED"], "OPEN"),
          visibility: normalizeNeedVisibility(need),
          is_published: bool(pick(need, ["isPublished", "IsPublished"], false), false),
          need_context: normalizeNeedContext(need),
          tournament_id: tournamentsByLegacyId.get(legacyTournamentId) || null,
          legacy_tournament_id: legacyTournamentId,
          tournament_name: nullableText(pick(need, ["tournamentName", "TournamentName"])),
          squad_label: nullableText(pick(need, ["squadLabel", "SquadLabel"])),
          class_name: nullableText(pick(need, ["className", "ClassName"])),
          deadline_at: dateOrNull(pick(need, ["deadlineAt", "DeadlineAt"])),
          source_type: nullableText(pick(need, ["sourceType", "SourceType"])),
          published_at: dateOrNull(pick(need, ["publishedAt", "PublishedAt"])),
          public_visible: bool(pick(need, ["publicVisible", "PublicVisible"], false), false),
          approved: bool(pick(need, ["approved", "Approved"], false), false),
          created_at: dateOrNull(pick(need, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(need, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_need_id),
    "legacy_need_id"
  );
  const teamNeedsByLegacyId = idMap(teamNeeds, "legacy_need_id");

  await db.upsert(
    "team_need_interests",
    collections.teamNeedInterests
      .map((interest) => {
        const legacyNeedId = nullableText(pick(interest, ["needId", "NeedId"]));
        const legacyTeamProfileId = nullableText(pick(interest, ["teamProfileId", "TeamProfileId"]));
        const legacyClubTeamId = nullableText(pick(interest, ["clubTeamId", "ClubTeamId"]));
        const playerUsername = lowerUsername(pick(interest, ["playerUsername", "PlayerUsername"]));
        return {
          legacy_interest_id: nullableText(pick(interest, ["interestId", "InterestId"])),
          need_id: teamNeedsByLegacyId.get(legacyNeedId) || null,
          legacy_need_id: legacyNeedId,
          team_profile_id: teamProfilesByLegacyId.get(legacyTeamProfileId) || null,
          legacy_team_profile_id: legacyTeamProfileId,
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(interest, ["clubTeamName", "ClubTeamName"])),
          player_user_id: usersByUsername.get(playerUsername) || null,
          player_username: playerUsername,
          player_display_name: nullableText(pick(interest, ["playerDisplayName", "PlayerDisplayName"])),
          player_email: nullableText(pick(interest, ["playerEmail", "PlayerEmail"])),
          player_phone: nullableText(pick(interest, ["playerPhone", "PlayerPhone"])),
          player_country: nullableText(pick(interest, ["playerCountry", "PlayerCountry"])),
          message: nullableText(pick(interest, ["message", "Message"])),
          status: oneOf(pick(interest, ["status", "Status"]), ["PENDING", "ACCEPTED", "DECLINED", "CANCELLED"], "PENDING"),
          reviewed_by_username: nullableText(pick(interest, ["reviewedBy", "ReviewedBy"])),
          reviewed_at: dateOrNull(pick(interest, ["reviewedAt", "ReviewedAt"])),
          created_at: dateOrNull(pick(interest, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(interest, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_interest_id && row.player_username),
    "legacy_interest_id"
  );

  await db.upsert(
    "team_members",
    collections.teamMembers
      .map((member) => {
        const legacyTeamProfileId = nullableText(pick(member, ["teamProfileId", "TeamProfileId"]));
        const legacyClubTeamId = nullableText(pick(member, ["clubTeamId", "ClubTeamId"]));
        const captainUsername = lowerUsername(pick(member, ["captainUsername", "CaptainUsername"]));
        const playerUsername = lowerUsername(pick(member, ["playerUsername", "PlayerUsername"]));
        return {
          legacy_team_member_id: nullableText(pick(member, ["teamMemberId", "TeamMemberId"])),
          team_profile_id: teamProfilesByLegacyId.get(legacyTeamProfileId) || null,
          legacy_team_profile_id: legacyTeamProfileId,
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(member, ["clubTeamName", "ClubTeamName"])),
          captain_user_id: usersByUsername.get(captainUsername) || null,
          captain_username: captainUsername,
          player_user_id: usersByUsername.get(playerUsername) || null,
          player_username: playerUsername,
          player_display_name: nullableText(pick(member, ["playerDisplayName", "PlayerDisplayName"])),
          player_email: nullableText(pick(member, ["playerEmail", "PlayerEmail"])),
          player_phone: nullableText(pick(member, ["playerPhone", "PlayerPhone"])),
          player_country: nullableText(pick(member, ["playerCountry", "PlayerCountry"])),
          legacy_source_interest_id: nullableText(pick(member, ["sourceInterestId", "SourceInterestId"])),
          member_status: oneOf(pick(member, ["memberStatus", "MemberStatus"], "ACTIVE"), ["ACTIVE", "REMOVED", "ARCHIVED"], "ACTIVE"),
          confirmed_by_username: nullableText(pick(member, ["confirmedBy", "ConfirmedBy"])),
          confirmed_at: dateOrNull(pick(member, ["confirmedAt", "ConfirmedAt"])),
          created_at: dateOrNull(pick(member, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(member, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_team_member_id && row.player_username),
    "legacy_team_member_id"
  );

  await db.upsert(
    "team_membership_requests",
    collections.teamMembershipRequests
      .map((request) => {
        const legacyClubTeamId = nullableText(pick(request, ["clubTeamId", "ClubTeamId"]));
        const playerUsername = lowerUsername(pick(request, ["playerUsername", "PlayerUsername"]));
        return {
          legacy_request_id: nullableText(pick(request, ["requestId", "RequestId"])),
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(request, ["clubTeamName", "ClubTeamName"])),
          player_user_id: usersByUsername.get(playerUsername) || null,
          player_username: playerUsername,
          player_display_name: nullableText(pick(request, ["playerDisplayName", "PlayerDisplayName"])),
          player_email: nullableText(pick(request, ["playerEmail", "PlayerEmail"])),
          player_phone: nullableText(pick(request, ["playerPhone", "PlayerPhone"])),
          player_country: nullableText(pick(request, ["playerCountry", "PlayerCountry"])),
          legacy_player_profile_id: nullableText(pick(request, ["playerProfileId", "PlayerProfileId"])),
          status: oneOf(pick(request, ["status", "Status"]), ["PENDING", "APPROVED", "REJECTED", "CANCELLED"], "PENDING"),
          requested_at: dateOrNull(pick(request, ["requestedAt", "RequestedAt"])),
          reviewed_by_username: nullableText(pick(request, ["reviewedBy", "ReviewedBy"])),
          reviewed_at: dateOrNull(pick(request, ["reviewedAt", "ReviewedAt"])),
          review_note: nullableText(pick(request, ["reviewNote", "ReviewNote"])),
          created_at: dateOrNull(pick(request, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(request, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_request_id && row.player_username),
    "legacy_request_id"
  );

  const events = await db.upsert(
    "tournament_events",
    collections.tournamentEvents
      .map((event) => {
        const legacyPlanId = nullableText(pick(event, ["planId", "PlanId"]));
        const legacyTournamentId = nullableText(pick(event, ["tournamentId", "TournamentId"]));
        const legacyTeamProfileId = nullableText(pick(event, ["teamProfileId", "TeamProfileId"]));
        const legacyClubTeamId = nullableText(pick(event, ["clubTeamId", "ClubTeamId"]));
        const captainUsername = lowerUsername(pick(event, ["captainUsername", "CaptainUsername"]));
        return {
          legacy_plan_id: legacyPlanId,
          tournament_id: tournamentsByLegacyId.get(legacyTournamentId) || null,
          legacy_tournament_id: legacyTournamentId,
          tournament_name: nullableText(pick(event, ["tournamentName", "TournamentName"])),
          team_profile_id: teamProfilesByLegacyId.get(legacyTeamProfileId) || null,
          legacy_team_profile_id: legacyTeamProfileId,
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(event, ["clubTeamName", "ClubTeamName"])),
          captain_user_id: usersByUsername.get(captainUsername) || null,
          captain_username: captainUsername,
          squad_label: nullableText(pick(event, ["squadLabel", "SquadLabel"])),
          class_name: nullableText(pick(event, ["className", "ClassName"])),
          status: oneOf(pick(event, ["planStatus", "PlanStatus", "status", "Status"]), ["DRAFT", "INVITING", "READY", "CANCELLED"], "INVITING"),
          deadline_at: dateOrNull(pick(event, ["deadlineAt", "DeadlineAt"])),
          note: nullableText(pick(event, ["note", "Note"])),
          created_at: dateOrNull(pick(event, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(event, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_plan_id),
    "legacy_plan_id"
  );
  const eventsByLegacyId = idMap(events, "legacy_plan_id");

  await db.upsert(
    "tournament_availability",
    collections.tournamentAvailability
      .map((availability) => {
        const legacyPlanId = nullableText(pick(availability, ["planId", "PlanId"]));
        const legacyTournamentId = nullableText(pick(availability, ["tournamentId", "TournamentId"]));
        const legacyTeamProfileId = nullableText(pick(availability, ["teamProfileId", "TeamProfileId"]));
        const legacyClubTeamId = nullableText(pick(availability, ["clubTeamId", "ClubTeamId"]));
        const playerUsername = lowerUsername(pick(availability, ["playerUsername", "PlayerUsername"]));
        return {
          legacy_availability_id: nullableText(pick(availability, ["availabilityId", "AvailabilityId"])),
          event_id: eventsByLegacyId.get(legacyPlanId) || null,
          legacy_plan_id: legacyPlanId,
          tournament_id: tournamentsByLegacyId.get(legacyTournamentId) || null,
          legacy_tournament_id: legacyTournamentId,
          tournament_name: nullableText(pick(availability, ["tournamentName", "TournamentName"])),
          team_profile_id: teamProfilesByLegacyId.get(legacyTeamProfileId) || null,
          legacy_team_profile_id: legacyTeamProfileId,
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(availability, ["clubTeamName", "ClubTeamName"])),
          player_user_id: usersByUsername.get(playerUsername) || null,
          player_username: playerUsername,
          player_display_name: nullableText(pick(availability, ["playerDisplayName", "PlayerDisplayName"])),
          player_email: nullableText(pick(availability, ["playerEmail", "PlayerEmail"])),
          player_phone: nullableText(pick(availability, ["playerPhone", "PlayerPhone"])),
          player_country: nullableText(pick(availability, ["playerCountry", "PlayerCountry"])),
          response_status: oneOf(pick(availability, ["responseStatus", "ResponseStatus"]), ["PENDING", "YES", "NO", "MAYBE"], "PENDING"),
          preferred_squad: oneOf(pick(availability, ["preferredSquad", "PreferredSquad"]), ["A", "B", "C", "RESERVE", "NO_PREFERENCE"], "NO_PREFERENCE"),
          player_note: nullableText(pick(availability, ["playerNote", "PlayerNote"])),
          requested_by_username: nullableText(pick(availability, ["requestedBy", "RequestedBy"])),
          requested_at: dateOrNull(pick(availability, ["requestedAt", "RequestedAt"])),
          responded_at: dateOrNull(pick(availability, ["respondedAt", "RespondedAt"])),
          created_at: dateOrNull(pick(availability, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(availability, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_availability_id && row.player_username),
    "legacy_availability_id"
  );

  await db.upsert(
    "tournament_squad_planning",
    collections.tournamentSquadPlanning
      .map((planning) => {
        const legacyPlanId = nullableText(pick(planning, ["planId", "PlanId"]));
        const legacyTournamentId = nullableText(pick(planning, ["tournamentId", "TournamentId"]));
        const legacyTeamProfileId = nullableText(pick(planning, ["teamProfileId", "TeamProfileId"]));
        const legacyClubTeamId = nullableText(pick(planning, ["clubTeamId", "ClubTeamId"]));
        const playerUsername = lowerUsername(pick(planning, ["playerUsername", "PlayerUsername"]));
        return {
          legacy_planning_id: nullableText(pick(planning, ["planningId", "PlanningId"])),
          event_id: eventsByLegacyId.get(legacyPlanId) || null,
          legacy_plan_id: legacyPlanId,
          tournament_id: tournamentsByLegacyId.get(legacyTournamentId) || null,
          legacy_tournament_id: legacyTournamentId,
          tournament_name: nullableText(pick(planning, ["tournamentName", "TournamentName"])),
          team_profile_id: teamProfilesByLegacyId.get(legacyTeamProfileId) || null,
          legacy_team_profile_id: legacyTeamProfileId,
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(planning, ["clubTeamName", "ClubTeamName"])),
          player_user_id: usersByUsername.get(playerUsername) || null,
          player_username: playerUsername,
          player_display_name: nullableText(pick(planning, ["playerDisplayName", "PlayerDisplayName"])),
          player_country: nullableText(pick(planning, ["playerCountry", "PlayerCountry"])),
          availability_status: oneOf(pick(planning, ["availabilityStatus", "AvailabilityStatus"]), ["YES", "MAYBE", "PENDING"], "PENDING"),
          preferred_squad: oneOf(pick(planning, ["preferredSquad", "PreferredSquad"]), ["A", "B", "C", "RESERVE", "NO_PREFERENCE"], "NO_PREFERENCE"),
          assigned_squad: oneOf(pick(planning, ["assignedSquad", "AssignedSquad"]), ["A", "B", "C", "RESERVE", "UNASSIGNED"], "UNASSIGNED"),
          planning_status: oneOf(pick(planning, ["planningStatus", "PlanningStatus"]), ["PLANNED", "REMOVED"], "PLANNED"),
          assigned_by_username: nullableText(pick(planning, ["assignedBy", "AssignedBy"])),
          assigned_at: dateOrNull(pick(planning, ["assignedAt", "AssignedAt"])),
          created_at: dateOrNull(pick(planning, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(planning, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_planning_id && row.player_username),
    "legacy_planning_id"
  );

  const rosterDrafts = await db.upsert(
    "roster_drafts",
    collections.rosterDrafts
      .map((roster) => {
        const legacyPlanId = nullableText(pick(roster, ["planId", "PlanId"]));
        const legacyTournamentId = nullableText(pick(roster, ["tournamentId", "TournamentId"]));
        const legacyTeamProfileId = nullableText(pick(roster, ["teamProfileId", "TeamProfileId"]));
        const legacyClubTeamId = nullableText(pick(roster, ["clubTeamId", "ClubTeamId"]));
        const captainUsername = lowerUsername(pick(roster, ["captainUsername", "CaptainUsername"]));
        return {
          legacy_roster_id: nullableText(pick(roster, ["rosterId", "RosterId", "draftId", "DraftId"])),
          event_id: eventsByLegacyId.get(legacyPlanId) || null,
          legacy_plan_id: legacyPlanId,
          tournament_id: tournamentsByLegacyId.get(legacyTournamentId) || null,
          legacy_tournament_id: legacyTournamentId,
          tournament_name: nullableText(pick(roster, ["tournamentName", "TournamentName"])),
          team_profile_id: teamProfilesByLegacyId.get(legacyTeamProfileId) || null,
          legacy_team_profile_id: legacyTeamProfileId,
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(roster, ["clubTeamName", "ClubTeamName"])),
          squad_label: nullableText(pick(roster, ["squadLabel", "SquadLabel"])),
          captain_user_id: usersByUsername.get(captainUsername) || null,
          captain_username: captainUsername,
          roster_status: oneOf(pick(roster, ["rosterStatus", "RosterStatus", "status", "Status"]), ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "LOCKED", "CANCELLED"], "DRAFT"),
          submitted_by_username: nullableText(pick(roster, ["submittedBy", "SubmittedBy"])),
          submitted_at: dateOrNull(pick(roster, ["submittedAt", "SubmittedAt"])),
          reviewed_by_username: nullableText(pick(roster, ["reviewedBy", "ReviewedBy"])),
          reviewed_at: dateOrNull(pick(roster, ["reviewedAt", "ReviewedAt"])),
          admin_note: nullableText(pick(roster, ["adminNote", "AdminNote"])),
          locked_at: dateOrNull(pick(roster, ["lockedAt", "LockedAt"])),
          locked_by_username: nullableText(pick(roster, ["lockedBy", "LockedBy"])),
          lock_reason: nullableText(pick(roster, ["lockReason", "LockReason"])),
          created_at: dateOrNull(pick(roster, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(roster, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_roster_id),
    "legacy_roster_id"
  );
  const rosterDraftsByLegacyId = idMap(rosterDrafts, "legacy_roster_id");

  await db.upsert(
    "roster_players",
    collections.rosterPlayers
      .map((player) => {
        const legacyRosterId = nullableText(pick(player, ["rosterId", "RosterId", "draftId", "DraftId"]));
        const legacyPlanId = nullableText(pick(player, ["planId", "PlanId"]));
        const legacyTournamentId = nullableText(pick(player, ["tournamentId", "TournamentId"]));
        const legacyTeamProfileId = nullableText(pick(player, ["teamProfileId", "TeamProfileId"]));
        const legacyClubTeamId = nullableText(pick(player, ["clubTeamId", "ClubTeamId"]));
        const playerUsername = lowerUsername(pick(player, ["playerUsername", "PlayerUsername"]));
        return {
          legacy_roster_player_id:
            nullableText(pick(player, ["rosterPlayerId", "RosterPlayerId"])) ||
            stableLegacyId("roster-player", [legacyRosterId, playerUsername]),
          roster_id: rosterDraftsByLegacyId.get(legacyRosterId) || null,
          legacy_roster_id: legacyRosterId,
          event_id: eventsByLegacyId.get(legacyPlanId) || null,
          legacy_plan_id: legacyPlanId,
          tournament_id: tournamentsByLegacyId.get(legacyTournamentId) || null,
          legacy_tournament_id: legacyTournamentId,
          tournament_name: nullableText(pick(player, ["tournamentName", "TournamentName"])),
          team_profile_id: teamProfilesByLegacyId.get(legacyTeamProfileId) || null,
          legacy_team_profile_id: legacyTeamProfileId,
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(player, ["clubTeamName", "ClubTeamName"])),
          squad_label: nullableText(pick(player, ["squadLabel", "SquadLabel"])),
          player_user_id: usersByUsername.get(playerUsername) || null,
          player_username: playerUsername,
          player_display_name: nullableText(pick(player, ["playerDisplayName", "PlayerDisplayName"])),
          player_country: nullableText(pick(player, ["playerCountry", "PlayerCountry"])),
          assigned_squad: oneOf(pick(player, ["assignedSquad", "AssignedSquad"]), ["A", "B", "C", "RESERVE"], "RESERVE"),
          roster_role: oneOf(pick(player, ["rosterRole", "RosterRole"]), ["PLAYER", "RESERVE"], "PLAYER"),
          source: oneOf(pick(player, ["source", "Source"]), ["SQUAD_PLANNING", "MANUAL_LATER"], "SQUAD_PLANNING"),
          player_status: oneOf(pick(player, ["playerStatus", "PlayerStatus"]), ["ACTIVE", "REMOVED"], "ACTIVE"),
          added_by_username: nullableText(pick(player, ["addedBy", "AddedBy"])),
          added_at: dateOrNull(pick(player, ["addedAt", "AddedAt"])),
          created_at: dateOrNull(pick(player, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(player, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_roster_player_id && row.player_username),
    "legacy_roster_player_id"
  );

  await db.upsert(
    "official_rosters",
    collections.officialRosters
      .map((player) => {
        const legacyDraftId = nullableText(pick(player, ["draftId", "DraftId", "rosterId", "RosterId"]));
        const legacyTournamentId = nullableText(pick(player, ["tournamentId", "TournamentId"]));
        const legacyTeamId = nullableText(pick(player, ["teamId", "TeamId", "clubTeamId", "ClubTeamId"]));
        const playerUsername = lowerUsername(pick(player, ["playerUsername", "PlayerUsername"]));
        return {
          legacy_official_roster_id: nullableText(pick(player, ["officialRosterId", "OfficialRosterId"])),
          draft_id: rosterDraftsByLegacyId.get(legacyDraftId) || null,
          legacy_draft_id: legacyDraftId,
          tournament_id: tournamentsByLegacyId.get(legacyTournamentId) || null,
          legacy_tournament_id: legacyTournamentId,
          tournament_name: nullableText(pick(player, ["tournamentName", "TournamentName"])),
          club_team_id: teamsByLegacyId.get(legacyTeamId) || null,
          legacy_team_id: legacyTeamId,
          team_name: nullableText(pick(player, ["teamName", "TeamName", "clubTeamName", "ClubTeamName"])),
          squad_label: nullableText(pick(player, ["squadLabel", "SquadLabel"])),
          group_name: nullableText(pick(player, ["groupName", "GroupName"])),
          player_user_id: usersByUsername.get(playerUsername) || null,
          player_username: playerUsername,
          player_display_name: nullableText(pick(player, ["playerDisplayName", "PlayerDisplayName"])),
          player_country: nullableText(pick(player, ["playerCountry", "PlayerCountry"])),
          status: "LOCKED",
          locked_at: dateOrNull(pick(player, ["lockedAt", "LockedAt"])),
          locked_by_username: nullableText(pick(player, ["lockedBy", "LockedBy"])),
          created_at: dateOrNull(pick(player, ["createdAt", "CreatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_official_roster_id && row.player_username),
    "legacy_official_roster_id"
  );

  await db.upsert(
    "event_comments",
    collections.eventComments
      .map((comment) => {
        const legacyPlanId = nullableText(pick(comment, ["planId", "PlanId"]));
        const legacyTeamProfileId = nullableText(pick(comment, ["teamProfileId", "TeamProfileId"]));
        const legacyClubTeamId = nullableText(pick(comment, ["clubTeamId", "ClubTeamId"]));
        const username = lowerUsername(pick(comment, ["username", "Username"]));
        return {
          legacy_comment_id: nullableText(pick(comment, ["commentId", "CommentId"])),
          event_id: eventsByLegacyId.get(legacyPlanId) || null,
          legacy_plan_id: legacyPlanId,
          team_profile_id: teamProfilesByLegacyId.get(legacyTeamProfileId) || null,
          legacy_team_profile_id: legacyTeamProfileId,
          club_team_id: teamsByLegacyId.get(legacyClubTeamId) || null,
          legacy_club_team_id: legacyClubTeamId,
          club_team_name: nullableText(pick(comment, ["clubTeamName", "ClubTeamName"])),
          user_id: usersByUsername.get(username) || null,
          username,
          display_name: nullableText(pick(comment, ["displayName", "DisplayName"])),
          message: text(pick(comment, ["message", "Message"])),
          active: bool(pick(comment, ["active", "Active"], true), true),
          created_at: dateOrNull(pick(comment, ["createdAt", "CreatedAt"])) || undefined,
          updated_at: dateOrNull(pick(comment, ["updatedAt", "UpdatedAt"])) || undefined,
        };
      })
      .filter((row) => row.legacy_comment_id && row.username && row.message),
    "legacy_comment_id"
  );

  console.log(dryRun ? "Dry-run complete. No Supabase rows were changed." : "Import complete.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
