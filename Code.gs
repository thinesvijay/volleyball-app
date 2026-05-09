function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";

  if (action === "getPlayers") {
    var context = resolveRequestContext(e ? e.parameter : {});
    var getPlayersAccessError = enforceModuleAccessForAction_(action, e ? e.parameter : {});
    if (getPlayersAccessError) {
      return jsonResponse(getPlayersAccessError);
    }
    var includeArchived =
      e &&
      e.parameter &&
      (String(e.parameter.includeArchived || "") === "1" ||
        String(e.parameter.includeArchived || "").toLowerCase() === "true");

    return jsonResponse(getPlayers(context, includeArchived));
  }

  if (action === "login") {
    return jsonResponse(loginUser(e ? e.parameter : {}));
  }

  if (action === "getProfile") {
    var profileContext = resolveRequestContext(e ? e.parameter : {});
    return jsonResponse(getProfile(profileContext));
  }

  if (action === "getMyPlayerProfile") {
    return jsonResponse(getMyPlayerProfile(e ? e.parameter : {}));
  }

  if (action === "getPlayerHubSnapshot") {
    return jsonResponse(getPlayerHubSnapshot(e ? e.parameter : {}));
  }

  if (action === "testSupabasePlayerHubSnapshot") {
    return jsonResponse(testSupabasePlayerHubSnapshot(e ? e.parameter : {}));
  }

  if (action === "listClubTeams") {
    return jsonResponse(listClubTeams(e ? e.parameter : {}));
  }

  if (action === "getPublicTournament" || action === "listPublicTournaments") {
    return jsonResponse(handleTournamentAction_(action, e ? e.parameter : {}));
  }

  return jsonResponse({ ok: true, message: "API running" });
}

function doPost(e) {
  var data = parsePostData_(e);
  var moduleAccessError = enforceModuleAccessForAction_(data.action, data);
  if (moduleAccessError) {
    return jsonResponse(moduleAccessError);
  }

  if (data.action === "generate") {
    var generateContext = resolveRequestContext(data);
    if (!generateContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }

    return jsonResponse(
      generateFromSelection(
        data.players || [],
        data.previousTeams || [],
        data.teamCount || 2
      )
    );
  }

  if (data.action === "addPlayer") {
    var addContext = resolveRequestContext(data);
    if (!addContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(addPlayer(addContext, data.player));
  }

  if (data.action === "saveSkills") {
    var skillContext = resolveRequestContext(data);
    if (!skillContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    saveSkills(skillContext, data.players || []);
    return jsonResponse({ success: true });
  }

  if (data.action === "updatePlayerName") {
    var renameContext = resolveRequestContext(data);
    if (!renameContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    updatePlayerName(renameContext, data.oldName, data.newName);
    return jsonResponse({ success: true });
  }

  if (data.action === "updatePlayer") {
    var updateContext = resolveRequestContext(data);
    if (!updateContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(updatePlayer(updateContext, data.oldName, data.player || {}));
  }

  if (data.action === "archivePlayer") {
    var archivePlayerContext = resolveRequestContext(data);
    if (!archivePlayerContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(archivePlayer(archivePlayerContext, data.playerName));
  }

  if (data.action === "restorePlayer") {
    var restorePlayerContext = resolveRequestContext(data);
    if (!restorePlayerContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(restorePlayer(restorePlayerContext, data.playerName));
  }

  if (data.action === "saveTeams") {
    var teamsContext = resolveRequestContext(data);
    if (!teamsContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    saveTeams(teamsContext, data.teams || []);
    return jsonResponse({ success: true });
  }

  if (data.action === "saveUserSettings") {
    return jsonResponse(saveUserSettings(data));
  }

  if (data.action === "registerPlayerAccount") {
    return jsonResponse(registerPlayerAccount(data));
  }

  if (data.action === "getMyPlayerProfile") {
    return jsonResponse(getMyPlayerProfile(data));
  }

  if (data.action === "getPlayerHubSnapshot") {
    return jsonResponse(getPlayerHubSnapshot(data));
  }

  if (data.action === "testSupabasePlayerHubSnapshot") {
    return jsonResponse(testSupabasePlayerHubSnapshot(data));
  }

  if (data.action === "listEventComments") {
    return jsonResponse(listEventComments(data));
  }

  if (data.action === "addEventComment") {
    return jsonResponse(addEventComment(data));
  }

  if (data.action === "archiveEventComment") {
    return jsonResponse(archiveEventComment(data));
  }

  if (data.action === "saveMyPlayerProfile") {
    return jsonResponse(saveMyPlayerProfile(data));
  }

  if (data.action === "listPlayerProfilesForAdmin") {
    return jsonResponse(listPlayerProfilesForAdmin(data));
  }

  if (data.action === "updatePlayerProfileAdminStatus") {
    return jsonResponse(updatePlayerProfileAdminStatus(data));
  }

  if (data.action === "resetPlayerPassword") {
    return jsonResponse(resetPlayerPassword(data));
  }

  if (data.action === "listClubTeams") {
    return jsonResponse(listClubTeams(data));
  }

  if (data.action === "listClubTeamsAdmin") {
    return jsonResponse(listClubTeamsAdmin(data));
  }

  if (data.action === "saveClubTeamAdmin") {
    return jsonResponse(saveClubTeamAdmin(data));
  }

  if (data.action === "deactivateClubTeamAdmin") {
    return jsonResponse(deactivateClubTeamAdmin(data));
  }

  if (data.action === "requestTeamIdentityChange") {
    return jsonResponse(requestTeamIdentityChange(data));
  }

  if (data.action === "listTeamIdentityChangeRequests") {
    return jsonResponse(listTeamIdentityChangeRequests(data));
  }

  if (data.action === "reviewTeamIdentityChangeRequest") {
    return jsonResponse(reviewTeamIdentityChangeRequest(data));
  }

  if (data.action === "createAccessRequest") {
    return jsonResponse(createAccessRequest(data));
  }

  if (data.action === "listMyAccessRequests") {
    return jsonResponse(listMyAccessRequests(data));
  }

  if (data.action === "listAccessRequestsAdmin") {
    return jsonResponse(listAccessRequestsAdmin(data));
  }

  if (data.action === "reviewAccessRequestAdmin") {
    return jsonResponse(reviewAccessRequestAdmin(data));
  }

  if (data.action === "getMyTeamProfile") {
    return jsonResponse(getMyTeamProfile(data));
  }

  if (data.action === "saveMyTeamProfile") {
    return jsonResponse(saveMyTeamProfile(data));
  }

  if (data.action === "createOrUpdateTeamNeed") {
    return jsonResponse(createOrUpdateTeamNeed(data));
  }

  if (data.action === "closeTeamNeed") {
    return jsonResponse(closeTeamNeed(data));
  }

  if (data.action === "listVisibleTeamNeeds") {
    return jsonResponse(listVisibleTeamNeeds(data));
  }

  if (data.action === "listTeamProfilesAdmin") {
    return jsonResponse(listTeamProfilesAdmin(data));
  }

  if (data.action === "updateTeamProfileAdmin") {
    return jsonResponse(updateTeamProfileAdmin(data));
  }

  if (data.action === "createTeamNeedInterest") {
    return jsonResponse(createTeamNeedInterest(data));
  }

  if (data.action === "listMyTeamNeedInterests") {
    return jsonResponse(listMyTeamNeedInterests(data));
  }

  if (data.action === "listTeamNeedInterestsForCaptain") {
    return jsonResponse(listTeamNeedInterestsForCaptain(data));
  }

  if (data.action === "reviewTeamNeedInterest") {
    return jsonResponse(reviewTeamNeedInterest(data));
  }

  if (data.action === "listTeamNeedInterestsAdmin") {
    return jsonResponse(listTeamNeedInterestsAdmin(data));
  }

  if (data.action === "addTeamMemberFromInterest") {
    return jsonResponse(addTeamMemberFromInterest(data));
  }

  if (data.action === "listMyTeamMembersForCaptain") {
    return jsonResponse(listMyTeamMembersForCaptain(data));
  }

  if (data.action === "listMyConfirmedTeamsForPlayer") {
    return jsonResponse(listMyConfirmedTeamsForPlayer(data));
  }

  if (data.action === "removeTeamMember") {
    return jsonResponse(removeTeamMember(data));
  }

  if (data.action === "listTeamMembersAdmin") {
    return jsonResponse(listTeamMembersAdmin(data));
  }

  if (data.action === "createOrUpdateTeamMembershipRequest") {
    return jsonResponse(createOrUpdateTeamMembershipRequest(data));
  }

  if (data.action === "listMyTeamMembershipRequests") {
    return jsonResponse(listMyTeamMembershipRequests(data));
  }

  if (data.action === "listMembershipRequestsForCaptain") {
    return jsonResponse(listMembershipRequestsForCaptain(data));
  }

  if (data.action === "reviewTeamMembershipRequest") {
    return jsonResponse(reviewTeamMembershipRequest(data));
  }

  if (data.action === "cancelMyTeamMembershipRequest") {
    return jsonResponse(cancelMyTeamMembershipRequest(data));
  }

  if (data.action === "listTeamMembershipRequestsAdmin") {
    return jsonResponse(listTeamMembershipRequestsAdmin(data));
  }

  if (data.action === "createTournamentTeamPlan") {
    return jsonResponse(createTournamentTeamPlan(data));
  }

  if (data.action === "listMyTournamentTeamPlansForCaptain") {
    return jsonResponse(listMyTournamentTeamPlansForCaptain(data));
  }

  if (data.action === "listMyTournamentAvailabilityForPlayer") {
    return jsonResponse(listMyTournamentAvailabilityForPlayer(data));
  }

  if (data.action === "listMyTournamentSquadPlanningForPlayer") {
    return jsonResponse(listMyTournamentSquadPlanningForPlayer(data));
  }

  if (data.action === "updateTournamentAvailabilityResponse") {
    return jsonResponse(updateTournamentAvailabilityResponse(data));
  }

  if (data.action === "listTournamentAvailabilityForCaptain") {
    return jsonResponse(listTournamentAvailabilityForCaptain(data));
  }

  if (data.action === "updateTournamentPlanStatus") {
    return jsonResponse(updateTournamentPlanStatus(data));
  }

  if (data.action === "syncSquadPlanningFromAvailability") {
    return jsonResponse(syncSquadPlanningFromAvailability(data));
  }

  if (data.action === "listTournamentSquadPlanningForCaptain") {
    return jsonResponse(listTournamentSquadPlanningForCaptain(data));
  }

  if (data.action === "assignPlayerToSquad") {
    return jsonResponse(assignPlayerToSquad(data));
  }

  if (data.action === "removePlayerFromSquadPlanning") {
    return jsonResponse(removePlayerFromSquadPlanning(data));
  }

  if (data.action === "createOrUpdateRosterDraftFromSquadPlanning") {
    return jsonResponse(createOrUpdateRosterDraftFromSquadPlanning(data));
  }

  if (data.action === "listRosterDraftForCaptain") {
    return jsonResponse(listRosterDraftForCaptain(data));
  }

  if (data.action === "submitRosterDraft") {
    return jsonResponse(submitRosterDraft(data));
  }

  if (data.action === "removePlayerFromRosterDraft") {
    return jsonResponse(removePlayerFromRosterDraft(data));
  }

  if (data.action === "cancelRosterDraft") {
    return jsonResponse(cancelRosterDraft(data));
  }

  if (data.action === "listMyRosterStatusForPlayer") {
    return jsonResponse(listMyRosterStatusForPlayer(data));
  }

  if (data.action === "listRosterDraftAdmin") {
    return jsonResponse(listRosterDraftAdmin(data));
  }

  if (data.action === "listSubmittedRosterDraftsForReview") {
    return jsonResponse(listSubmittedRosterDraftsForReview(data));
  }

  if (data.action === "reviewRosterDraft") {
    return jsonResponse(reviewRosterDraft(data));
  }

  if (data.action === "lockOfficialRoster") {
    return jsonResponse(lockOfficialRoster(data));
  }

  if (data.action === "createTrainerUser") {
    return jsonResponse(createTrainerUserRecordFromAdmin(data));
  }

  if (data.action === "listTrainerUsers") {
    return jsonResponse(listTrainerUsers(data));
  }

  if (data.action === "updateTrainerAccess") {
    return jsonResponse(updateTrainerAccess(data));
  }

  if (data.action === "updateTrainerStatus") {
    return jsonResponse(updateTrainerStatus(data));
  }

  if (data.action === "resetTrainerPassword") {
    return jsonResponse(resetTrainerPassword(data));
  }

  if (data.action === "archiveTrainerUser") {
    return jsonResponse(archiveTrainerUser(data));
  }

  if (data.action === "restoreTrainerUser") {
    return jsonResponse(restoreTrainerUser(data));
  }

  if (
    data.action === "listTournaments" ||
    data.action === "getTournament" ||
    data.action === "saveTournament" ||
    data.action === "publishTournament" ||
    data.action === "unpublishTournament" ||
    data.action === "deleteTournament" ||
    data.action === "cleanupMyDraftTournaments" ||
    data.action === "getPublicTournament" ||
    data.action === "listPublicTournaments"
  ) {
    return jsonResponse(handleTournamentAction_(data.action, data));
  }

  return jsonResponse({ success: false, message: "Unknown action" });
}

function parsePostData_(e) {
  var data = {};

  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (key) {
      data[key] = e.parameter[key];
    });
  }

  var body = e && e.postData && e.postData.contents ? e.postData.contents : "";

  if (body) {
    try {
      var json = JSON.parse(body);
      data = Object.assign({}, data, json || {});
    } catch (err) {
      // Form encoded requests are already available in e.parameter.
    }
  }

  if (typeof data.players === "string") {
    try {
      data.players = JSON.parse(data.players);
    } catch (err) {}
  }

  if (typeof data.previousTeams === "string") {
    try {
      data.previousTeams = JSON.parse(data.previousTeams);
    } catch (err) {}
  }

  if (typeof data.teams === "string") {
    try {
      data.teams = JSON.parse(data.teams);
    } catch (err) {}
  }

  if (typeof data.player === "string") {
    try {
      data.player = JSON.parse(data.player);
    } catch (err) {}
  }

  if (typeof data.profile === "string") {
    try {
      data.profile = JSON.parse(data.profile);
    } catch (err) {}
  }

  if (typeof data.clubTeam === "string") {
    try {
      data.clubTeam = JSON.parse(data.clubTeam);
    } catch (err) {}
  }

  if (typeof data.tournament === "string") {
    try {
      data.tournament = JSON.parse(data.tournament);
    } catch (err) {}
  }

  return data;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🏐 Volleyball")
    .addItem("Generer lag", "generateTraining")
    .addToUi();
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function normalizeClub(value) {
  return String(value || "").trim();
}

function parseCannotList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
}

function normalizeSkillView(value) {
  var skillView = String(value || "numbers").trim().toLowerCase();
  return skillView === "colors" ? "colors" : "numbers";
}

function normalizeSkillScale(value) {
  var parsed = Number(value) || 5;
  return [3, 5].indexOf(parsed) !== -1 ? parsed : 5;
}

function normalizeTrainerCopyMode(value) {
  var mode = String(value || "main").trim().toLowerCase();
  if (mode === "blank") return "blank";
  if (mode === "trainer") return "trainer";
  return "main";
}

function normalizeTeamNameByIndex(index) {
  return "Team " + String.fromCharCode(65 + index);
}

function rotateArray(arr) {
  if (!arr || arr.length <= 1) return arr;

  var offset = Math.floor(Math.random() * arr.length);
  if (offset === 0) return arr;

  return arr.slice(offset).concat(arr.slice(0, offset));
}

function preparePlayerPool(players, rotateMode) {
  var grouped = {};

  players.forEach(function (player) {
    var skill = Number(player.skill) || 1;
    if (!grouped[skill]) grouped[skill] = [];
    grouped[skill].push(player);
  });

  var skills = Object.keys(grouped)
    .map(Number)
    .sort(function (a, b) {
      return b - a;
    });

  var ordered = [];

  skills.forEach(function (skill) {
    var group = grouped[skill].slice().sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });

    if (rotateMode) {
      group = rotateArray(group);
    }

    group.forEach(function (player) {
      ordered.push(player);
    });
  });

  return ordered;
}

function countConflicts(team, player) {
  var playerCannot = (player.cannot || []).map(function (name) {
    return normalizeName(name);
  });
  var playerName = normalizeName(player.name);

  var conflicts = 0;

  team.forEach(function (existingPlayer) {
    var existingName = normalizeName(existingPlayer.name);
    var existingCannot = (existingPlayer.cannot || []).map(function (name) {
      return normalizeName(name);
    });

    if (
      playerCannot.indexOf(existingName) !== -1 ||
      existingCannot.indexOf(playerName) !== -1
    ) {
      conflicts += 1;
    }
  });

  return conflicts;
}

function chooseBestTeamIndex(teams, player, rotateMode) {
  var bestScore = Infinity;
  var candidates = [];

  for (var i = 0; i < teams.length; i++) {
    var team = teams[i];
    var teamSize = team.length;
    var teamSkill = team.reduce(function (sum, p) {
      return sum + Number(p.skill || 0);
    }, 0);
    var cannotConflicts = countConflicts(team, player);

    var score = cannotConflicts * 1000000 + teamSize * 1000 + teamSkill;

    if (score < bestScore) {
      bestScore = score;
      candidates = [i];
    } else if (score === bestScore) {
      candidates.push(i);
    }
  }

  if (rotateMode && candidates.length > 1) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  return candidates[0];
}

function getMainSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

var USER_HEADERS_ = [
  "Username",
  "Password",
  "Role",
  "SpreadsheetId",
  "SkillView",
  "SkillScale",
  "Active",
  "CanUseTeamBuilder",
  "CanUseTournaments"
];

var USER_COL_ = {
  USERNAME: 1,
  PASSWORD: 2,
  ROLE: 3,
  SPREADSHEET_ID: 4,
  SKILL_VIEW: 5,
  SKILL_SCALE: 6,
  ACTIVE: 7,
  CAN_USE_TEAM_BUILDER: 8,
  CAN_USE_TOURNAMENTS: 9
};

var TEAM_BUILDER_ACCESS_ACTIONS_ = {
  getPlayers: true,
  generate: true,
  addPlayer: true,
  saveSkills: true,
  updatePlayerName: true,
  updatePlayer: true,
  archivePlayer: true,
  restorePlayer: true,
  saveTeams: true
};

var TOURNAMENT_ACCESS_ACTIONS_ = {
  listTournaments: true,
  getTournament: true,
  saveTournament: true,
  publishTournament: true,
  unpublishTournament: true,
  deleteTournament: true,
  cleanupMyDraftTournaments: true
};

function blankValue_(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function parseAccessBoolean_(value, fallback) {
  if (blankValue_(value)) return !!fallback;
  if (value === false || value === 0) return false;

  var text = String(value).trim().toLowerCase();
  if (["false", "0", "no", "n", "off", "inactive", "unpublished"].indexOf(text) >= 0) {
    return false;
  }

  return truthy_(value);
}

function isAdminUser_(user) {
  return String((user && user.role) || "").trim().toLowerCase() === "admin";
}

function userCanUseTeamBuilder_(user) {
  if (!user) return false;
  if (isAdminUser_(user)) return true;
  return parseAccessBoolean_(user.canUseTeamBuilder, true);
}

function userCanUseTournaments_(user) {
  if (!user) return false;
  if (isAdminUser_(user)) return true;
  return parseAccessBoolean_(user.canUseTournaments, false);
}

function userAccessPayload_(user) {
  return {
    teamBuilder: userCanUseTeamBuilder_(user),
    tournaments: userCanUseTournaments_(user)
  };
}

function ensureUsersSheetSchema_(sheet) {
  if (sheet.getMaxColumns() < USER_HEADERS_.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      USER_HEADERS_.length - sheet.getMaxColumns()
    );
  }

  sheet.getRange(1, 1, 1, USER_HEADERS_.length).setValues([USER_HEADERS_]);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return sheet;

  var rowCount = lastRow - 1;
  var roles = sheet.getRange(2, USER_COL_.ROLE, rowCount, 1).getValues();
  var accessRange = sheet.getRange(
    2,
    USER_COL_.CAN_USE_TEAM_BUILDER,
    rowCount,
    2
  );
  var accessValues = accessRange.getValues();
  var changed = false;

  for (var i = 0; i < rowCount; i++) {
    var role = String(roles[i][0] || "trainer").trim().toLowerCase();

    if (role === "admin") {
      if (accessValues[i][0] !== true || accessValues[i][1] !== true) {
        accessValues[i][0] = true;
        accessValues[i][1] = true;
        changed = true;
      }
      continue;
    }

    if (blankValue_(accessValues[i][0])) {
      accessValues[i][0] = true;
      changed = true;
    }

    if (blankValue_(accessValues[i][1])) {
      accessValues[i][1] = false;
      changed = true;
    }
  }

  if (changed) accessRange.setValues(accessValues);

  return sheet;
}

function getUsersSheet() {
  var ss = getMainSpreadsheet();
  var sheet = ss.getSheetByName("Users");

  if (!sheet) {
    sheet = ss.insertSheet("Users");
  }

  return ensureUsersSheetSchema_(sheet);
}

function hashPassword(password) {
  var raw = String(password || "");
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    raw,
    Utilities.Charset.UTF_8
  );

  return bytes
    .map(function (b) {
      var value = (b + 256) % 256;
      var hex = value.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("");
}

function isProbablyHashedPassword(value) {
  return /^[a-f0-9]{64}$/i.test(String(value || "").trim());
}

function passwordsMatch(inputPassword, storedPassword) {
  var input = String(inputPassword || "");
  var stored = String(storedPassword || "").trim();

  if (!stored) return false;

  if (isProbablyHashedPassword(stored)) {
    return hashPassword(input) === stored;
  }

  return input === stored;
}

function setUserPasswordHash(rowNumber, plainPassword) {
  var sheet = getUsersSheet();
  sheet.getRange(rowNumber, 2).setValue(hashPassword(plainPassword));
}

function maybeUpgradeUserPasswordHash(user, inputPassword) {
  if (!user) return;
  if (isProbablyHashedPassword(user.password)) return;

  var plain = String(inputPassword || "");
  if (!plain) return;

  setUserPasswordHash(user.rowNumber, plain);
  user.password = hashPassword(plain);
}

function getUserRecords() {
  var sheet = getUsersSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, USER_HEADERS_.length).getValues();

  return values.map(function (row, index) {
    var role = String(row[2] || "trainer").trim().toLowerCase() || "trainer";
    var isAdmin = role === "admin";
    var canUseTeamBuilder = isAdmin
      ? true
      : parseAccessBoolean_(row[7], true);
    var canUseTournaments = isAdmin
      ? true
      : parseAccessBoolean_(row[8], false);

    return {
      rowNumber: index + 2,
      username: String(row[0] || "").trim(),
      password: String(row[1] || "").trim(),
      role: role,
      spreadsheetId: String(row[3] || "").trim(),
      skillView: normalizeSkillView(row[4]),
      skillScale: normalizeSkillScale(row[5]),
      active: parseAccessBoolean_(row[6], false),
      canUseTeamBuilder: canUseTeamBuilder,
      canUseTournaments: canUseTournaments,
      access: {
        teamBuilder: canUseTeamBuilder,
        tournaments: canUseTournaments
      }
    };
  });
}

function usernameExists(username) {
  var normalized = String(username || "").trim();
  if (!normalized) return false;

  var users = getUserRecords();
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === normalized) {
      return true;
    }
  }

  return false;
}

function findUser(username, password) {
  var normalizedUsername = String(username || "").trim().toLowerCase();
  var normalizedPassword = String(password || "").trim();

  if (!normalizedUsername || !normalizedPassword) return null;

  var users = getUserRecords();

  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    if (
      user.active &&
      user.role !== "archived" &&
      String(user.username || "").trim().toLowerCase() === normalizedUsername &&
      passwordsMatch(normalizedPassword, user.password)
    ) {
      maybeUpgradeUserPasswordHash(user, normalizedPassword);
      return user;
    }
  }

  return null;
}

function getUserByUsername(username) {
  var normalizedUsername = String(username || "").trim();
  if (!normalizedUsername) return null;

  var users = getUserRecords();
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === normalizedUsername) {
      return users[i];
    }
  }

  return null;
}

function requireAdmin(data) {
  var user = findUser(
    data && data.username ? data.username : "",
    data && data.password ? data.password : ""
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid username or password",
      admin: null
    };
  }

  if (!isAdminUser_(user)) {
    return {
      success: false,
      message: "Only admin can do this action",
      admin: null
    };
  }

  return {
    success: true,
    admin: user
  };
}

function requireRosterReviewer_(data) {
  var context = resolveRequestContext(data || {});
  if (!context || !context.authenticated || !context.user) {
    return {
      success: false,
      message: "Login required",
      user: null
    };
  }

  if (!isAdminUser_(context.user) && !userCanUseTournaments_(context.user)) {
    return {
      success: false,
      message: "Tournament or admin access required.",
      user: null
    };
  }

  return {
    success: true,
    user: context.user,
    context: context
  };
}

function openSpreadsheetForUser(user) {
  if (!user || !user.spreadsheetId) {
    if (user && !isAdminUser_(user) && userCanUseTeamBuilder_(user)) {
      ensureBlankTrainerSpreadsheetForUser_(user);
      if (user.spreadsheetId) {
        return SpreadsheetApp.openById(user.spreadsheetId);
      }
    }

    return getMainSpreadsheet();
  }

  return SpreadsheetApp.openById(user.spreadsheetId);
}

function resolveRequestContext(source) {
  var username = source && source.username ? source.username : "";
  var password = source && source.password ? source.password : "";
  var user = findUser(username, password);

  if (user) {
    return {
      authenticated: true,
      user: user,
      spreadsheet: openSpreadsheetForUser(user)
    };
  }

  return {
    authenticated: false,
    user: null,
    spreadsheet: null
  };
}

function enforceModuleAccessForAction_(action, source) {
  if (!TEAM_BUILDER_ACCESS_ACTIONS_[action] && !TOURNAMENT_ACCESS_ACTIONS_[action]) {
    return null;
  }

  var context = resolveRequestContext(source || {});
  if (!context || !context.authenticated || !context.user) {
    return null;
  }

  if (
    TEAM_BUILDER_ACCESS_ACTIONS_[action] &&
    !userCanUseTeamBuilder_(context.user)
  ) {
    return {
      success: false,
      message: "Team Builder access required"
    };
  }

  if (
    TOURNAMENT_ACCESS_ACTIONS_[action] &&
    !userCanUseTournaments_(context.user)
  ) {
    return {
      success: false,
      message: "Tournament access required"
    };
  }

  return null;
}

function ensurePlayersSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("Players");

  if (!sheet) {
    sheet = spreadsheet.insertSheet("Players");
    sheet.getRange(1, 1, 1, 5).setValues([[
      "Active",
      "Name",
      "Skill",
      "CannotPlayWith",
      "Club"
    ]]);
  }

  if (sheet.getLastColumn() < 5) {
    sheet.insertColumnsAfter(sheet.getLastColumn(), 5 - sheet.getLastColumn());
  }

  writePlayersHeader(sheet);
  return sheet;
}

function ensureTeamsSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("Teams");

  if (!sheet) {
    sheet = spreadsheet.insertSheet("Teams");
  }

  return sheet;
}

function writePlayersHeader(sheet) {
  sheet.getRange(1, 1, 1, 5).setValues([[
    "Active",
    "Name",
    "Skill",
    "CannotPlayWith",
    "Club"
  ]]);
}

function copyPlayersBetweenSpreadsheets(sourceSpreadsheet, targetSpreadsheet) {
  var sourceSheet = ensurePlayersSheet(sourceSpreadsheet);
  var targetSheet = ensurePlayersSheet(targetSpreadsheet);

  targetSheet.clear();
  writePlayersHeader(targetSheet);

  var lastRow = sourceSheet.getLastRow();
  if (lastRow < 2) return;

  var values = sourceSheet.getRange(2, 1, lastRow - 1, 5).getValues();
  if (values.length > 0) {
    targetSheet.getRange(2, 1, values.length, 5).setValues(values);
  }
}

function copyPlayersFromMainToSpreadsheet(targetSpreadsheet) {
  copyPlayersBetweenSpreadsheets(getMainSpreadsheet(), targetSpreadsheet);
}

function copyPlayersFromExistingTrainerToSpreadsheet(targetSpreadsheet, trainerUsername) {
  var sourceUser = getUserByUsername(trainerUsername);

  if (!sourceUser) {
    throw new Error("Source trainer not found");
  }

  if (sourceUser.role !== "trainer") {
    throw new Error("Source user must be an active trainer");
  }

  if (!sourceUser.active) {
    throw new Error("Source trainer must be active");
  }

  if (!sourceUser.spreadsheetId) {
    throw new Error("Source trainer has no spreadsheet");
  }

  var sourceSpreadsheet = SpreadsheetApp.openById(sourceUser.spreadsheetId);
  copyPlayersBetweenSpreadsheets(sourceSpreadsheet, targetSpreadsheet);
}

function createTrainerSpreadsheet(username, copyMode, copyFromTrainerUsername) {
  var safeUsername = String(username || "").trim() || "trainer";
  var trainerSpreadsheet = SpreadsheetApp.create("volleyball_" + safeUsername);

  var firstSheet = trainerSpreadsheet.getSheets()[0];
  firstSheet.setName("Players");
  writePlayersHeader(firstSheet);

  ensureTeamsSheet(trainerSpreadsheet);

  if (copyMode === "main") {
    copyPlayersFromMainToSpreadsheet(trainerSpreadsheet);
  } else if (copyMode === "trainer") {
    copyPlayersFromExistingTrainerToSpreadsheet(
      trainerSpreadsheet,
      copyFromTrainerUsername
    );
  }

  return trainerSpreadsheet;
}

function createBlankTrainerSpreadsheet_(username) {
  return createTrainerSpreadsheet(username, "blank", "");
}

function ensureBlankTrainerSpreadsheetForUser_(user) {
  if (!user) return "";

  var currentSpreadsheetId = String(user.spreadsheetId || "").trim();
  if (currentSpreadsheetId) return currentSpreadsheetId;

  var trainerSpreadsheet = createBlankTrainerSpreadsheet_(user.username);
  var spreadsheetId = trainerSpreadsheet.getId();

  var usersSheet = getUsersSheet();
  usersSheet
    .getRange(user.rowNumber, USER_COL_.SPREADSHEET_ID)
    .setValue(spreadsheetId);

  user.spreadsheetId = spreadsheetId;
  return spreadsheetId;
}

function createTrainerUserRecordFromAdmin(data) {
  var adminCheck = requireAdmin(data);
  if (!adminCheck.success) {
    return {
      success: false,
      message: adminCheck.message
    };
  }

  var username = String(data && data.newUsername ? data.newUsername : "").trim();
  var password = String(data && data.newPassword ? data.newPassword : "").trim();
  var role = "trainer";
  var skillView = normalizeSkillView(data && data.skillView ? data.skillView : "numbers");
  var skillScale = normalizeSkillScale(data && data.skillScale ? data.skillScale : 5);
  var active = data && data.active == 0 ? 0 : 1;
  var canUseTeamBuilder = parseAccessBoolean_(
    data && data.canUseTeamBuilder !== undefined
      ? data.canUseTeamBuilder
      : data && data.access
        ? data.access.teamBuilder
        : "",
    true
  );
  var canUseTournaments = parseAccessBoolean_(
    data && data.canUseTournaments !== undefined
      ? data.canUseTournaments
      : data && data.access
        ? data.access.tournaments
        : "",
    false
  );
  var copyMode = normalizeTrainerCopyMode(data && data.copyMode ? data.copyMode : "main");
  var copyFromTrainerUsername = String(
    data && data.copyFromTrainerUsername ? data.copyFromTrainerUsername : ""
  ).trim();

  if (!username) {
    return {
      success: false,
      message: "Username is required"
    };
  }

  if (!password) {
    return {
      success: false,
      message: "Password is required"
    };
  }

  if (usernameExists(username)) {
    return {
      success: false,
      message: "Username already exists"
    };
  }

  if (copyMode === "trainer" && !copyFromTrainerUsername) {
    return {
      success: false,
      message: "copyFromTrainerUsername is required"
    };
  }

  try {
    var trainerSpreadsheet = createTrainerSpreadsheet(
      username,
      copyMode,
      copyFromTrainerUsername
    );

    var usersSheet = getUsersSheet();

    usersSheet.appendRow([
      username,
      hashPassword(password),
      role,
      trainerSpreadsheet.getId(),
      skillView,
      skillScale,
      active,
      canUseTeamBuilder,
      canUseTournaments
    ]);

    return {
      success: true,
      user: {
        username: username,
        role: role,
        spreadsheetId: trainerSpreadsheet.getId(),
        spreadsheetUrl: trainerSpreadsheet.getUrl(),
        skillView: skillView,
        skillScale: skillScale,
        active: active,
        canUseTeamBuilder: canUseTeamBuilder,
        canUseTournaments: canUseTournaments,
        access: {
          teamBuilder: canUseTeamBuilder,
          tournaments: canUseTournaments
        },
        copyMode: copyMode,
        copyFromTrainerUsername: copyFromTrainerUsername
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error && error.message ? error.message : "Could not create trainer"
    };
  }
}

function listTrainerUsers(data) {
  var adminCheck = requireAdmin(data);
  if (!adminCheck.success) {
    return {
      success: false,
      message: adminCheck.message,
      users: []
    };
  }

  var users = getUserRecords()
    .filter(function (user) {
      return user.role === "trainer" || user.role === "archived";
    })
    .map(function (user) {
      return {
        username: user.username,
        role: user.role,
        spreadsheetId: user.spreadsheetId,
        spreadsheetUrl: user.spreadsheetId
          ? "https://docs.google.com/spreadsheets/d/" + user.spreadsheetId + "/edit"
          : "",
        skillView: user.skillView || "numbers",
        skillScale: normalizeSkillScale(user.skillScale),
        active: !!user.active,
        canUseTeamBuilder: !!user.canUseTeamBuilder,
        canUseTournaments: !!user.canUseTournaments,
        access: {
          teamBuilder: !!user.canUseTeamBuilder,
          tournaments: !!user.canUseTournaments
        }
      };
    });

  return {
    success: true,
    users: users
  };
}

function updateTrainerAccess(data) {
  var admin = findUser(
    data && data.username ? data.username : "",
    data && data.password ? data.password : ""
  );

  if (!admin) {
    return {
      success: false,
      message: "Invalid username or password"
    };
  }

  if (!isAdminUser_(admin)) {
    return {
      success: false,
      message: "Admin access required"
    };
  }

  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();
  if (!targetUsername) {
    return {
      success: false,
      message: "targetUsername is required"
    };
  }

  var users = getUserRecords();
  var targetUser = null;
  var normalizedTargetUsername = targetUsername.toLowerCase();

  for (var i = 0; i < users.length; i++) {
    if (users[i].username.toLowerCase() === normalizedTargetUsername) {
      targetUser = users[i];
      break;
    }
  }

  if (!targetUser) {
    return {
      success: false,
      message: "User not found"
    };
  }

  var canUseTeamBuilder = parseAccessBoolean_(data && data.canUseTeamBuilder, false);
  var canUseTournaments = parseAccessBoolean_(data && data.canUseTournaments, false);

  if (isAdminUser_(targetUser)) {
    canUseTeamBuilder = true;
    canUseTournaments = true;
  }

  var sheet = getUsersSheet();
  sheet
    .getRange(targetUser.rowNumber, USER_COL_.CAN_USE_TEAM_BUILDER, 1, 2)
    .setValues([[canUseTeamBuilder, canUseTournaments]]);

  return {
    success: true,
    username: targetUser.username,
    canUseTeamBuilder: canUseTeamBuilder,
    canUseTournaments: canUseTournaments,
    access: {
      teamBuilder: canUseTeamBuilder,
      tournaments: canUseTournaments
    }
  };
}

function updateTrainerStatus(data) {
  var adminCheck = requireAdmin(data);
  if (!adminCheck.success) {
    return {
      success: false,
      message: adminCheck.message
    };
  }

  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();
  var active = data && data.active == 1 ? 1 : 0;

  if (!targetUsername) {
    return {
      success: false,
      message: "targetUsername is required"
    };
  }

  var user = getUserByUsername(targetUsername);
  if (!user) {
    return {
      success: false,
      message: "Trainer not found"
    };
  }

  if (user.role !== "trainer") {
    return {
      success: false,
      message: "Only active trainer users can be updated here"
    };
  }

  var sheet = getUsersSheet();
  sheet.getRange(user.rowNumber, 7).setValue(active);

  return {
    success: true,
    message: active ? "Trainer activated" : "Trainer deactivated"
  };
}

function resetTrainerPassword(data) {
  var adminCheck = requireAdmin(data);
  if (!adminCheck.success) {
    return {
      success: false,
      message: adminCheck.message
    };
  }

  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();
  var newPassword = String(data && data.newPassword ? data.newPassword : "").trim();

  if (!targetUsername) {
    return {
      success: false,
      message: "targetUsername is required"
    };
  }

  if (!newPassword) {
    return {
      success: false,
      message: "newPassword is required"
    };
  }

  var user = getUserByUsername(targetUsername);
  if (!user) {
    return {
      success: false,
      message: "Trainer not found"
    };
  }

  if (user.role !== "trainer") {
    return {
      success: false,
      message: "Only active trainer users can be updated here"
    };
  }

  setUserPasswordHash(user.rowNumber, newPassword);

  return {
    success: true,
    message: "Password updated"
  };
}

function archiveTrainerUser(data) {
  var adminCheck = requireAdmin(data);
  if (!adminCheck.success) {
    return {
      success: false,
      message: adminCheck.message
    };
  }

  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();

  if (!targetUsername) {
    return {
      success: false,
      message: "targetUsername is required"
    };
  }

  var user = getUserByUsername(targetUsername);
  if (!user) {
    return {
      success: false,
      message: "Trainer not found"
    };
  }

  if (user.role !== "trainer") {
    return {
      success: false,
      message: "Only trainer users can be archived"
    };
  }

  var sheet = getUsersSheet();
  sheet.getRange(user.rowNumber, 3).setValue("archived");
  sheet.getRange(user.rowNumber, 7).setValue(0);

  return {
    success: true,
    message: "Trainer archived"
  };
}

function restoreTrainerUser(data) {
  var adminCheck = requireAdmin(data);
  if (!adminCheck.success) {
    return {
      success: false,
      message: adminCheck.message
    };
  }

  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();

  if (!targetUsername) {
    return {
      success: false,
      message: "targetUsername is required"
    };
  }

  var user = getUserByUsername(targetUsername);
  if (!user) {
    return {
      success: false,
      message: "Trainer not found"
    };
  }

  if (user.role !== "archived") {
    return {
      success: false,
      message: "Only archived users can be restored"
    };
  }

  var sheet = getUsersSheet();
  sheet.getRange(user.rowNumber, 3).setValue("trainer");
  sheet.getRange(user.rowNumber, 7).setValue(1);

  return {
    success: true,
    message: "Trainer restored"
  };
}

function mapPlayerRow(row) {
  return {
    active: row[0] == 1,
    name: String(row[1] || "").trim(),
    skill: Number(row[2]) || 1,
    cannot: parseCannotList(row[3]),
    club: normalizeClub(row[4])
  };
}

function getPlayers(context, includeArchived) {
  if (!context || !context.authenticated || !context.spreadsheet) {
    return {
      success: false,
      message: "Login required"
    };
  }

  var sheet = ensurePlayersSheet(context.spreadsheet);
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    if (includeArchived) {
      return {
        players: [],
        archivedPlayers: []
      };
    }
    return [];
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var mapped = data
    .map(mapPlayerRow)
    .filter(function (player) {
      return String(player.name || "").trim();
    });

  if (includeArchived) {
    return {
      players: mapped.filter(function (player) {
        return player.active;
      }),
      archivedPlayers: mapped.filter(function (player) {
        return !player.active;
      })
    };
  }

  return mapped.filter(function (player) {
    return player.active;
  });
}

function getProfile(context) {
  if (!context || !context.user) {
    return {
      loggedIn: false,
      role: "guest",
      settings: {
        skillView: "numbers",
        skillScale: 5
      }
    };
  }

  context.user = syncApprovedAccessRequestsForUser_(context.user);
  var access = userAccessPayload_(context.user);

  return {
    loggedIn: true,
    username: context.user.username,
    role: context.user.role,
    canUseTeamBuilder: access.teamBuilder,
    canUseTournaments: access.tournaments,
    access: access,
    settings: {
      skillView: context.user.skillView || "numbers",
      skillScale: normalizeSkillScale(context.user.skillScale)
    }
  };
}

function loginUser(params) {
  var user = findUser(
    params && params.username ? params.username : "",
    params && params.password ? params.password : ""
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid username or password"
    };
  }

  user = syncApprovedAccessRequestsForUser_(user);
  var access = userAccessPayload_(user);

  return {
    success: true,
    profile: {
      username: user.username,
      role: user.role,
      canUseTeamBuilder: access.teamBuilder,
      canUseTournaments: access.tournaments,
      access: access,
      settings: {
        skillView: user.skillView || "numbers",
        skillScale: normalizeSkillScale(user.skillScale)
      }
    }
  };
}

function saveUserSettings(data) {
  var user = findUser(
    data && data.username ? data.username : "",
    data && data.password ? data.password : ""
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid username or password"
    };
  }

  var skillView = normalizeSkillView(data.skillView || "numbers");
  var skillScale = normalizeSkillScale(data.skillScale || 5);

  var sheet = getUsersSheet();
  sheet.getRange(user.rowNumber, 5).setValue(skillView);
  sheet.getRange(user.rowNumber, 6).setValue(skillScale);

  return {
    success: true,
    settings: {
      skillView: skillView,
      skillScale: skillScale
    }
  };
}

function generateTraining() {
  var playersResult = getPlayers({
    authenticated: true,
    spreadsheet: getMainSpreadsheet()
  }, false);

  var activePlayers = Array.isArray(playersResult) ? playersResult : [];
  var teamCount = Math.max(2, Math.floor(activePlayers.length / 4));
  var teams = buildTeams(activePlayers, teamCount, false);

  var output = [];

  teams.forEach(function (team, i) {
    var total = team.reduce(function (sum, p) {
      return sum + Number(p.skill || 0);
    }, 0);

    output.push([normalizeTeamNameByIndex(i), "", "Total: " + total]);

    team.forEach(function (player) {
      output.push([normalizeTeamNameByIndex(i), player.name, player.skill]);
    });

    output.push(["", "", ""]);
  });

  var ss = getMainSpreadsheet();
  var sheet = ensureTeamsSheet(ss);
  sheet.clear();

  if (output.length > 0) {
    sheet.getRange(1, 1, output.length, 3).setValues(output);
  }
}

function generateWebTeams() {
  var playersResult = getPlayers({
    authenticated: true,
    spreadsheet: getMainSpreadsheet()
  }, false);

  var activePlayers = Array.isArray(playersResult) ? playersResult : [];
  var teamCount = Math.max(2, Math.floor(activePlayers.length / 4));
  return formatTeams(buildTeams(activePlayers, teamCount, false));
}

function generateFromSelection(players, previousTeams, teamCount) {
  players = Array.isArray(players) ? players : [];
  previousTeams = Array.isArray(previousTeams) ? previousTeams : [];
  teamCount = Number(teamCount) || 2;

  if (!players.length) return [];

  teamCount = Math.max(2, Math.min(teamCount, players.length));

  var teams = [];
  for (var t = 0; t < teamCount; t++) {
    teams.push([]);
  }

  var selectedNames = {};
  players.forEach(function (p) {
    selectedNames[String(p.name || "").trim()] = true;
  });

  var lockedPlayers = [];
  var previousUnlocked = [];

  previousTeams.forEach(function (team, teamIndex) {
    (team.players || []).forEach(function (player) {
      var playerName = String(player.name || "").trim();
      if (!selectedNames[playerName]) return;

      var normalizedPlayer = {
        name: playerName,
        skill: Number(player.skill) || 1,
        cannot: Array.isArray(player.cannot) ? player.cannot : [],
        locked: !!player.locked,
        club: normalizeClub(player.club)
      };

      if (normalizedPlayer.locked) {
        lockedPlayers.push({
          name: normalizedPlayer.name,
          skill: normalizedPlayer.skill,
          cannot: normalizedPlayer.cannot,
          locked: true,
          teamIndex: Math.min(teamIndex, teamCount - 1),
          club: normalizedPlayer.club
        });
      } else {
        previousUnlocked.push({
          name: normalizedPlayer.name,
          skill: normalizedPlayer.skill,
          cannot: normalizedPlayer.cannot,
          locked: false,
          club: normalizedPlayer.club
        });
      }
    });
  });

  lockedPlayers.forEach(function (player) {
    teams[player.teamIndex].push({
      name: player.name,
      skill: player.skill,
      cannot: player.cannot,
      locked: true,
      club: player.club
    });
  });

  var previousNames = {};
  lockedPlayers.forEach(function (p) {
    previousNames[p.name] = true;
  });
  previousUnlocked.forEach(function (p) {
    previousNames[p.name] = true;
  });

  var newPlayers = players
    .filter(function (player) {
      return !previousNames[String(player.name || "").trim()];
    })
    .map(function (player) {
      return {
        name: String(player.name || "").trim(),
        skill: Number(player.skill) || 1,
        cannot: Array.isArray(player.cannot) ? player.cannot : [],
        locked: false,
        club: normalizeClub(player.club)
      };
    });

  var pool = previousUnlocked.concat(newPlayers);
  var rotateMode = previousTeams.length === 0;
  var orderedPool = preparePlayerPool(pool, rotateMode);

  orderedPool.forEach(function (player) {
    var bestTeamIndex = chooseBestTeamIndex(teams, player, rotateMode);

    teams[bestTeamIndex].push({
      name: player.name,
      skill: player.skill,
      cannot: player.cannot,
      locked: false,
      club: player.club
    });
  });

  return formatTeams(teams);
}

function formatTeams(teams) {
  return teams.map(function (team, i) {
    return {
      name: normalizeTeamNameByIndex(i),
      total: team.reduce(function (sum, p) {
        return sum + (Number(p.skill) || 0);
      }, 0),
      players: team.map(function (player) {
        return {
          name: player.name,
          skill: Number(player.skill) || 1,
          cannot: Array.isArray(player.cannot) ? player.cannot : [],
          locked: !!player.locked,
          club: normalizeClub(player.club)
        };
      })
    };
  });
}

function buildTeams(players, teamCount, rotateMode) {
  players = Array.isArray(players) ? players.slice() : [];
  teamCount = Number(teamCount) || 2;

  if (!players.length) return [];

  teamCount = Math.max(2, Math.min(teamCount, players.length));

  var orderedPlayers = preparePlayerPool(players, !!rotateMode);
  var teams = [];
  for (var i = 0; i < teamCount; i++) {
    teams.push([]);
  }

  orderedPlayers.forEach(function (player) {
    var bestTeamIndex = chooseBestTeamIndex(teams, player, !!rotateMode);
    teams[bestTeamIndex].push(player);
  });

  return teams;
}

function saveSkills(context, players) {
  var spreadsheet = context && context.spreadsheet
    ? context.spreadsheet
    : null;

  if (!spreadsheet) return;

  var sheet = ensurePlayersSheet(spreadsheet);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var rowName = data[i][1];
    var updated = players.find(function (p) {
      return p.name === rowName;
    });

    if (updated) {
      sheet.getRange(i + 1, 3).setValue(Number(updated.skill) || 1);
    }
  }
}

function saveTeams(context, currentTeams) {
  var spreadsheet = context && context.spreadsheet
    ? context.spreadsheet
    : null;

  if (!spreadsheet) return;

  var sheet = ensureTeamsSheet(spreadsheet);
  sheet.clear();

  var output = [];

  currentTeams.forEach(function (team) {
    output.push([team.name, "", ""]);

    (team.players || []).forEach(function (player) {
      output.push([
        player.name,
        Number(player.skill) || 1,
        player.locked ? "LOCKED" : ""
      ]);
    });

    output.push(["", "", ""]);
  });

  if (output.length > 0) {
    sheet.getRange(1, 1, output.length, 3).setValues(output);
  }
}

function addPlayer(context, player) {
  if (!player || !player.name) {
    return {
      success: false,
      message: "Player name is required"
    };
  }

  var spreadsheet = context && context.spreadsheet
    ? context.spreadsheet
    : null;

  if (!spreadsheet) {
    return {
      success: false,
      message: "Spreadsheet not found"
    };
  }

  var sheet = ensurePlayersSheet(spreadsheet);
  var name = String(player.name || "").trim();
  var skill = Number(player.skill) || 1;
  var club = normalizeClub(player.club);

  if (!name) {
    return {
      success: false,
      message: "Player name is required"
    };
  }

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1] || "").trim() === name) {
      return {
        success: false,
        message: "Player name already exists"
      };
    }
  }

  sheet.appendRow([
    1,
    name,
    skill,
    "",
    club
  ]);

  return {
    success: true
  };
}

function updatePlayerName(context, oldName, newName) {
  if (!oldName || !newName) return;

  var spreadsheet = context && context.spreadsheet
    ? context.spreadsheet
    : null;

  if (!spreadsheet) return;

  var sheet = ensurePlayersSheet(spreadsheet);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === oldName) {
      sheet.getRange(i + 1, 2).setValue(newName);
      return;
    }
  }
}

function updatePlayer(context, oldName, player) {
  if (!oldName || !player || !player.name) {
    return {
      success: false,
      message: "Missing player data"
    };
  }

  var spreadsheet = context && context.spreadsheet
    ? context.spreadsheet
    : null;

  if (!spreadsheet) {
    return {
      success: false,
      message: "Spreadsheet not found"
    };
  }

  var sheet = ensurePlayersSheet(spreadsheet);
  var data = sheet.getDataRange().getValues();
  var newName = String(player.name || "").trim();
  var newSkill = Number(player.skill) || 1;
  var newClub = normalizeClub(player.club);

  if (!newName) {
    return {
      success: false,
      message: "Player name is required"
    };
  }

  for (var i = 1; i < data.length; i++) {
    var rowName = String(data[i][1] || "").trim();
    if (rowName === newName && rowName !== String(oldName || "").trim()) {
      return {
        success: false,
        message: "Player name already exists"
      };
    }
  }

  for (var j = 1; j < data.length; j++) {
    if (String(data[j][1] || "").trim() === String(oldName || "").trim()) {
      sheet.getRange(j + 1, 2).setValue(newName);
      sheet.getRange(j + 1, 3).setValue(newSkill);
      sheet.getRange(j + 1, 5).setValue(newClub);
      return {
        success: true
      };
    }
  }

  return {
    success: false,
    message: "Player not found"
  };
}

function archivePlayer(context, playerName) {
  var spreadsheet = context && context.spreadsheet
    ? context.spreadsheet
    : null;

  if (!spreadsheet) {
    return {
      success: false,
      message: "Spreadsheet not found"
    };
  }

  var name = String(playerName || "").trim();
  if (!name) {
    return {
      success: false,
      message: "playerName is required"
    };
  }

  var sheet = ensurePlayersSheet(spreadsheet);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1] || "").trim() === name) {
      sheet.getRange(i + 1, 1).setValue(0);
      return {
        success: true
      };
    }
  }

  return {
    success: false,
    message: "Player not found"
  };
}

function restorePlayer(context, playerName) {
  var spreadsheet = context && context.spreadsheet
    ? context.spreadsheet
    : null;

  if (!spreadsheet) {
    return {
      success: false,
      message: "Spreadsheet not found"
    };
  }

  var name = String(playerName || "").trim();
  if (!name) {
    return {
      success: false,
      message: "playerName is required"
    };
  }

  var sheet = ensurePlayersSheet(spreadsheet);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1] || "").trim() === name) {
      sheet.getRange(i + 1, 1).setValue(1);
      return {
        success: true
      };
    }
  }

  return {
    success: false,
    message: "Player not found"
  };
}

/* =========================
   PLAYER & TEAM HUB PROFILE
   First private profile step only
   ========================= */

var PLAYER_PROFILES_SHEET_ = "PlayerProfiles";
var PLAYER_PROFILE_HEADERS_ = [
  "ProfileId",
  "Username",
  "FirstName",
  "LastName",
  "DisplayName",
  "Email",
  "Phone",
  "Country",
  "ClubOrTeam",
  "ClubTeamId",
  "ClubTeamName",
  "TeamNote",
  "ProfileType",
  "FreeAgent",
  "Region",
  "PrimaryRole",
  "SecondaryRole",
  "CustomRole",
  "Level",
  "Availability",
  "LookingForTeam",
  "AvailableAsSubstitute",
  "CanGuestForTeams",
  "InterestedAbroad",
  "PublicVisible",
  "Approved",
  "CreatedAt",
  "UpdatedAt"
];

function getPlayerProfilesSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    PLAYER_PROFILES_SHEET_,
    PLAYER_PROFILE_HEADERS_
  );
}

function playerHubUsername_(user) {
  return String((user && (user.username || user.Username)) || "").trim();
}

function playerProfileRows_() {
  var sheet = getPlayerProfilesSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), PLAYER_PROFILE_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function findPlayerProfileRowByUsername_(username) {
  var target = String(username || "").trim().toLowerCase();
  if (!target) return null;

  var rows = playerProfileRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].Username || "").trim().toLowerCase() === target) {
      return rows[i];
    }
  }

  return null;
}

function defaultPlayerProfileForUser_(user) {
  return {
    profileId: "",
    username: playerHubUsername_(user),
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    country: "",
    clubOrTeam: "",
    clubTeamId: "",
    clubTeamName: "",
    teamNote: "",
    profileType: "Player",
    freeAgent: false,
    region: "",
    primaryRole: "",
    secondaryRole: "",
    customRole: "",
    level: "",
    availability: "",
    lookingForTeam: false,
    availableAsSubstitute: false,
    canGuestForTeams: false,
    interestedAbroad: false,
    publicVisible: false,
    approved: false,
    createdAt: "",
    updatedAt: ""
  };
}

function playerProfileFromRow_(row, user) {
  var profile = defaultPlayerProfileForUser_(user);
  if (!row) return profile;

  var legacyRegion = String(row.Region || "").trim();
  var country = String(row.Country || "").trim() || legacyRegion;
  var profileType = String(row.ProfileType || "").trim();
  var legacyClubNote = String(row.ClubOrTeam || "").trim();
  var teamNote = String(row.TeamNote || "").trim() || legacyClubNote;
  var firstName = String(row.FirstName || "").trim();
  var lastName = String(row.LastName || "").trim();
  var displayName =
    String(row.DisplayName || "").trim() ||
    [firstName, lastName].filter(Boolean).join(" ");

  return {
    profileId: String(row.ProfileId || "").trim(),
    username: playerHubUsername_(user),
    firstName: firstName,
    lastName: lastName,
    displayName: displayName,
    email: String(row.Email || "").trim(),
    phone: String(row.Phone || "").trim(),
    country: country,
    clubOrTeam: legacyClubNote,
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    teamNote: teamNote,
    profileType: profileType === "Captain" ? "Captain" : "Player",
    freeAgent: truthy_(row.FreeAgent),
    region: legacyRegion,
    primaryRole: String(row.PrimaryRole || "").trim(),
    secondaryRole: String(row.SecondaryRole || "").trim(),
    customRole: String(row.CustomRole || "").trim(),
    level: String(row.Level || "").trim(),
    availability: String(row.Availability || "").trim(),
    lookingForTeam: truthy_(row.LookingForTeam),
    availableAsSubstitute: truthy_(row.AvailableAsSubstitute),
    canGuestForTeams: truthy_(row.CanGuestForTeams),
    interestedAbroad: truthy_(row.InterestedAbroad),
    publicVisible: truthy_(row.PublicVisible),
    approved: truthy_(row.Approved),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function playerProfileText_(value, maxLength) {
  var text = String(value || "").trim();
  var limit = Number(maxLength) || 200;
  return text.length > limit ? text.slice(0, limit) : text;
}

function buildPlayerProfileForSave_(incoming, existingRow, user) {
  var now = new Date().toISOString();
  var existingProfile = playerProfileFromRow_(existingRow, user);
  var safeIncoming = incoming && typeof incoming === "object" ? incoming : {};
  var selectedClubTeam = getActiveClubTeamById_(safeIncoming.clubTeamId);
  var selectedClubTeamId = selectedClubTeam ? selectedClubTeam.teamId : "";
  var selectedClubTeamName = selectedClubTeam ? selectedClubTeam.name : "";
  var teamNote = playerProfileText_(
    safeIncoming.teamNote || safeIncoming.clubOrTeam,
    160
  );
  var freeAgent = truthy_(safeIncoming.freeAgent);
  var firstName = playerProfileText_(
    safeIncoming.firstName || existingProfile.firstName,
    80
  );
  var lastName = playerProfileText_(
    safeIncoming.lastName || existingProfile.lastName,
    80
  );
  var displayName = playerProfileText_(
    safeIncoming.displayName ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      existingProfile.displayName,
    120
  );

  if (freeAgent) {
    selectedClubTeamId = "";
    selectedClubTeamName = "";
  }

  return {
    profileId:
      existingProfile.profileId ||
      "profile-" + Utilities.getUuid(),
    username: playerHubUsername_(user),
    firstName: firstName,
    lastName: lastName,
    displayName: displayName,
    email: playerProfileText_(safeIncoming.email, 160),
    phone: playerProfileText_(safeIncoming.phone, 80),
    country: playerProfileText_(
      safeIncoming.country || safeIncoming.region || existingProfile.country,
      120
    ),
    clubOrTeam: teamNote,
    clubTeamId: selectedClubTeamId,
    clubTeamName: selectedClubTeamName,
    teamNote: teamNote,
    profileType:
      String(safeIncoming.profileType || "").trim() === "Captain"
        ? "Captain"
        : "Player",
    freeAgent: freeAgent,
    region: playerProfileText_(
      safeIncoming.region || existingProfile.region,
      120
    ),
    primaryRole: playerProfileText_(
      safeIncoming.primaryRole || existingProfile.primaryRole,
      80
    ),
    secondaryRole: playerProfileText_(
      safeIncoming.secondaryRole || existingProfile.secondaryRole,
      120
    ),
    customRole: playerProfileText_(
      safeIncoming.customRole ||
        (safeIncoming.primaryRole === "Custom" ? safeIncoming.secondaryRole : "") ||
        existingProfile.customRole,
      120
    ),
    level: playerProfileText_(safeIncoming.level || existingProfile.level, 80),
    availability: playerProfileText_(safeIncoming.availability, 240),
    lookingForTeam: truthy_(safeIncoming.lookingForTeam),
    availableAsSubstitute: truthy_(safeIncoming.availableAsSubstitute),
    canGuestForTeams: truthy_(safeIncoming.canGuestForTeams),
    interestedAbroad: truthy_(safeIncoming.interestedAbroad),
    publicVisible: truthy_(safeIncoming.publicVisible),
    approved: !!existingProfile.approved,
    createdAt: existingProfile.createdAt || now,
    updatedAt: now
  };
}

function playerProfileColumnValue_(header, profile) {
  if (header === "ProfileId") return profile.profileId || "";
  if (header === "Username") return profile.username || "";
  if (header === "FirstName") return profile.firstName || "";
  if (header === "LastName") return profile.lastName || "";
  if (header === "DisplayName") return profile.displayName || "";
  if (header === "Email") return profile.email || "";
  if (header === "Phone") return profile.phone || "";
  if (header === "Country") return profile.country || "";
  if (header === "ClubOrTeam") return profile.clubOrTeam || "";
  if (header === "ClubTeamId") return profile.clubTeamId || "";
  if (header === "ClubTeamName") return profile.clubTeamName || "";
  if (header === "TeamNote") return profile.teamNote || "";
  if (header === "ProfileType") return profile.profileType || "Player";
  if (header === "FreeAgent") return profile.freeAgent ? "TRUE" : "FALSE";
  if (header === "Region") return profile.region || "";
  if (header === "PrimaryRole") return profile.primaryRole || "";
  if (header === "SecondaryRole") return profile.secondaryRole || "";
  if (header === "CustomRole") return profile.customRole || "";
  if (header === "Level") return profile.level || "";
  if (header === "Availability") return profile.availability || "";
  if (header === "LookingForTeam") return profile.lookingForTeam ? "TRUE" : "FALSE";
  if (header === "AvailableAsSubstitute") {
    return profile.availableAsSubstitute ? "TRUE" : "FALSE";
  }
  if (header === "CanGuestForTeams") return profile.canGuestForTeams ? "TRUE" : "FALSE";
  if (header === "InterestedAbroad") return profile.interestedAbroad ? "TRUE" : "FALSE";
  if (header === "PublicVisible") return profile.publicVisible ? "TRUE" : "FALSE";
  if (header === "Approved") return profile.approved ? "TRUE" : "FALSE";
  if (header === "CreatedAt") return profile.createdAt || "";
  if (header === "UpdatedAt") return profile.updatedAt || "";
  return "";
}

function writePlayerProfileRow_(profile, existingRow) {
  var sheet = getPlayerProfilesSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return playerProfileColumnValue_(header, profile);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return profile;
}

function playerProfileEmailExists_(email) {
  var target = String(email || "").trim().toLowerCase();
  if (!target) return false;

  var rows = playerProfileRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].Email || "").trim().toLowerCase() === target) {
      return true;
    }
  }

  return false;
}

/* =========================
   OFFICIAL CLUB / TEAM LIST
   Admin-controlled selectable list only
   ========================= */

var CLUB_TEAMS_SHEET_ = "ClubTeams";
var CLUB_TEAM_HEADERS_ = [
  "TeamId",
  "Name",
  "Country",
  "City",
  "Active",
  "CreatedAt",
  "UpdatedAt"
];

function getClubTeamsSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    CLUB_TEAMS_SHEET_,
    CLUB_TEAM_HEADERS_
  );
}

function clubTeamText_(value, maxLength) {
  var text = String(value || "").trim();
  var limit = Number(maxLength) || 160;
  return text.length > limit ? text.slice(0, limit) : text;
}

function clubTeamRows_() {
  var sheet = getClubTeamsSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), CLUB_TEAM_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function clubTeamFromRow_(row) {
  if (!row) return null;

  return {
    teamId: String(row.TeamId || "").trim(),
    name: String(row.Name || "").trim(),
    country: String(row.Country || "").trim(),
    city: String(row.City || "").trim(),
    active: row.Active === "" || row.Active === undefined || row.Active === null
      ? true
      : truthy_(row.Active),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function clubTeamColumnValue_(header, team) {
  if (header === "TeamId") return team.teamId || "";
  if (header === "Name") return team.name || "";
  if (header === "Country") return team.country || "";
  if (header === "City") return team.city || "";
  if (header === "Active") return team.active ? "TRUE" : "FALSE";
  if (header === "CreatedAt") return team.createdAt || "";
  if (header === "UpdatedAt") return team.updatedAt || "";
  return "";
}

function writeClubTeamRow_(team, existingRow) {
  var sheet = getClubTeamsSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return clubTeamColumnValue_(header, team);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return team;
}

function findClubTeamRowById_(teamId) {
  var target = String(teamId || "").trim();
  if (!target) return null;

  var rows = clubTeamRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].TeamId || "").trim() === target) {
      return rows[i];
    }
  }

  return null;
}

function getActiveClubTeamById_(teamId) {
  var row = findClubTeamRowById_(teamId);
  var team = clubTeamFromRow_(row);
  return team && team.active ? team : null;
}

function clubTeamNameKey_(value) {
  return String(value || "").trim().toLowerCase();
}

function findClubTeamNameMatch_(name, excludeTeamId, activeOnly) {
  var targetName = clubTeamNameKey_(name);
  var excludedId = String(excludeTeamId || "").trim();
  if (!targetName) return null;

  var rows = clubTeamRows_();
  for (var i = 0; i < rows.length; i++) {
    var existing = clubTeamFromRow_(rows[i]);
    if (!existing) continue;
    if (String(existing.teamId || "").trim() === excludedId) continue;
    if (activeOnly && !existing.active) continue;

    if (clubTeamNameKey_(existing.name) === targetName) {
      return rows[i];
    }
  }

  return null;
}

function sortClubTeams_(teams) {
  return teams.sort(function (a, b) {
    if (!!a.active !== !!b.active) return a.active ? -1 : 1;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function listClubTeams(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var teams = clubTeamRows_()
      .map(clubTeamFromRow_)
      .filter(function (team) {
        return team && team.teamId && team.name && team.active;
      });

    return {
      success: true,
      teams: sortClubTeams_(teams)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load club/team list"
    };
  }
}

function listClubTeamsAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var teams = clubTeamRows_()
      .map(clubTeamFromRow_)
      .filter(function (team) {
        return team && team.teamId && team.name;
      });

    return {
      success: true,
      teams: sortClubTeams_(teams)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load club/team admin list"
    };
  }
}

function saveClubTeamAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var incoming = data && data.clubTeam && typeof data.clubTeam === "object"
      ? data.clubTeam
      : data || {};
    var teamId = clubTeamText_(incoming.teamId || incoming.TeamId, 120);
    var existingRow = teamId ? findClubTeamRowById_(teamId) : null;
    var incomingName = clubTeamText_(incoming.name || incoming.Name, 160);
    var activeDuplicateRow = findClubTeamNameMatch_(
      incomingName,
      teamId,
      true
    );
    var inactiveNameMatchRow = findClubTeamNameMatch_(
      incomingName,
      teamId,
      false
    );

    if (!incomingName) {
      return {
        success: false,
        message: "Club/team name is required"
      };
    }

    if (activeDuplicateRow) {
      return {
        success: false,
        message: "This club/team already exists."
      };
    }

    if (!existingRow && inactiveNameMatchRow) {
      var inactiveMatch = clubTeamFromRow_(inactiveNameMatchRow);
      if (inactiveMatch && !inactiveMatch.active) {
        existingRow = inactiveNameMatchRow;
        teamId = inactiveMatch.teamId;
      }
    }

    var existingTeam = clubTeamFromRow_(existingRow) || {};
    var now = new Date().toISOString();
    var team = {
      teamId: teamId || "team-" + Utilities.getUuid(),
      name: incomingName,
      country: clubTeamText_(incoming.country || incoming.Country, 120),
      city: clubTeamText_(incoming.city || incoming.City, 120),
      active:
        incoming.active === undefined && incoming.Active === undefined
          ? existingTeam.active !== undefined
            ? !!existingTeam.active
            : true
          : truthy_(incoming.active !== undefined ? incoming.active : incoming.Active),
      createdAt: existingTeam.createdAt || now,
      updatedAt: now
    };

    writeClubTeamRow_(team, existingRow);

    return {
      success: true,
      team: team
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not save club/team"
    };
  }
}

function deactivateClubTeamAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var teamId = clubTeamText_(
      data && (data.teamId || data.TeamId || data.clubTeamId),
      120
    );
    var row = findClubTeamRowById_(teamId);
    if (!row) {
      return {
        success: false,
        message: "Club/team not found"
      };
    }

    var team = clubTeamFromRow_(row);
    var nextActive = data && data.active !== undefined ? truthy_(data.active) : false;
    if (nextActive && findClubTeamNameMatch_(team.name, team.teamId, true)) {
      return {
        success: false,
        message: "This club/team already exists."
      };
    }

    team.active = nextActive;
    team.updatedAt = new Date().toISOString();
    writeClubTeamRow_(team, row);

    return {
      success: true,
      team: team
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not update club/team"
    };
  }
}

/* =========================
   TEAM IDENTITY CHANGE REQUESTS
   Captain-requested, admin-reviewed
   ========================= */

var TEAM_CHANGE_REQUESTS_SHEET_ = "TeamChangeRequests";
var TEAM_CHANGE_REQUEST_HEADERS_ = [
  "RequestId",
  "TeamId",
  "CurrentName",
  "RequestedName",
  "CurrentCountry",
  "RequestedCountry",
  "CurrentCity",
  "RequestedCity",
  "RequestedByUsername",
  "Reason",
  "Status",
  "AdminNote",
  "CreatedAt",
  "ReviewedAt",
  "ReviewedBy"
];

function getTeamChangeRequestsSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TEAM_CHANGE_REQUESTS_SHEET_,
    TEAM_CHANGE_REQUEST_HEADERS_
  );
}

function normalizeTeamChangeRequestStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "APPROVED" || text === "REJECTED") return text;
  return "PENDING";
}

function teamChangeRequestRows_() {
  var sheet = getTeamChangeRequestsSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TEAM_CHANGE_REQUEST_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function teamChangeRequestFromRow_(row) {
  if (!row) return null;

  return {
    requestId: String(row.RequestId || "").trim(),
    teamId: String(row.TeamId || "").trim(),
    currentName: String(row.CurrentName || "").trim(),
    requestedName: String(row.RequestedName || "").trim(),
    currentCountry: String(row.CurrentCountry || "").trim(),
    requestedCountry: String(row.RequestedCountry || "").trim(),
    currentCity: String(row.CurrentCity || "").trim(),
    requestedCity: String(row.RequestedCity || "").trim(),
    requestedByUsername: String(row.RequestedByUsername || "").trim(),
    reason: String(row.Reason || "").trim(),
    status: normalizeTeamChangeRequestStatus_(row.Status),
    adminNote: String(row.AdminNote || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    reviewedAt: String(row.ReviewedAt || "").trim(),
    reviewedBy: String(row.ReviewedBy || "").trim()
  };
}

function teamChangeRequestColumnValue_(header, request) {
  if (header === "RequestId") return request.requestId || "";
  if (header === "TeamId") return request.teamId || "";
  if (header === "CurrentName") return request.currentName || "";
  if (header === "RequestedName") return request.requestedName || "";
  if (header === "CurrentCountry") return request.currentCountry || "";
  if (header === "RequestedCountry") return request.requestedCountry || "";
  if (header === "CurrentCity") return request.currentCity || "";
  if (header === "RequestedCity") return request.requestedCity || "";
  if (header === "RequestedByUsername") return request.requestedByUsername || "";
  if (header === "Reason") return request.reason || "";
  if (header === "Status") return request.status || "PENDING";
  if (header === "AdminNote") return request.adminNote || "";
  if (header === "CreatedAt") return request.createdAt || "";
  if (header === "ReviewedAt") return request.reviewedAt || "";
  if (header === "ReviewedBy") return request.reviewedBy || "";
  return "";
}

function writeTeamChangeRequestRow_(request, existingRow) {
  var sheet = getTeamChangeRequestsSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return teamChangeRequestColumnValue_(header, request);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return request;
}

function findTeamChangeRequestRowById_(requestId) {
  var target = String(requestId || "").trim();
  if (!target) return null;

  var rows = teamChangeRequestRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].RequestId || "").trim() === target) return rows[i];
  }
  return null;
}

function pendingTeamChangeRequestRowForTeam_(teamId) {
  var target = String(teamId || "").trim();
  if (!target) return null;

  var rows = teamChangeRequestRows_();
  for (var i = 0; i < rows.length; i++) {
    var request = teamChangeRequestFromRow_(rows[i]);
    if (request && request.teamId === target && request.status === "PENDING") {
      return rows[i];
    }
  }
  return null;
}

function sortTeamChangeRequests_(requests) {
  return requests.sort(function (a, b) {
    var aTime = Date.parse(a.reviewedAt || a.createdAt || "") || 0;
    var bTime = Date.parse(b.reviewedAt || b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

function updateSheetClubTeamReferences_(
  sheetName,
  teamId,
  nextName,
  nextCountry,
  now,
  updateCountry
) {
  var ss = getMainSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;

  var lastCol = Math.max(1, sheet.getLastColumn());
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var teamIdIndex = headers.indexOf("ClubTeamId");
  if (teamIdIndex < 0) return;

  var nameIndex = headers.indexOf("ClubTeamName");
  var countryIndex = headers.indexOf("Country");
  var updatedAtIndex = headers.indexOf("UpdatedAt");
  var valuesRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol);
  var values = valuesRange.getValues();
  var changed = false;

  for (var rowIndex = 0; rowIndex < values.length; rowIndex++) {
    if (String(values[rowIndex][teamIdIndex] || "").trim() !== String(teamId || "").trim()) {
      continue;
    }

    if (nameIndex >= 0) {
      values[rowIndex][nameIndex] = nextName || "";
      changed = true;
    }

    if (updateCountry && countryIndex >= 0) {
      values[rowIndex][countryIndex] = nextCountry || "";
      changed = true;
    }

    if (updatedAtIndex >= 0) {
      values[rowIndex][updatedAtIndex] = now || "";
      changed = true;
    }
  }

  if (changed) valuesRange.setValues(values);
}

function updateClubTeamIdentityReferences_(teamId, nextName, nextCountry, now) {
  updateSheetClubTeamReferences_("PlayerProfiles", teamId, nextName, nextCountry, now, false);
  updateSheetClubTeamReferences_(TEAM_PROFILES_SHEET_, teamId, nextName, nextCountry, now, true);
  updateSheetClubTeamReferences_(TEAM_NEEDS_SHEET_, teamId, nextName, nextCountry, now, false);
  updateSheetClubTeamReferences_(TEAM_NEED_INTERESTS_SHEET_, teamId, nextName, nextCountry, now, false);
  updateSheetClubTeamReferences_(TEAM_MEMBERS_SHEET_, teamId, nextName, nextCountry, now, false);
  updateSheetClubTeamReferences_(TEAM_MEMBERSHIP_REQUESTS_SHEET_, teamId, nextName, nextCountry, now, false);
  updateSheetClubTeamReferences_("TournamentTeamPlans", teamId, nextName, nextCountry, now, false);
  updateSheetClubTeamReferences_("TournamentAvailability", teamId, nextName, nextCountry, now, false);
  updateSheetClubTeamReferences_("TournamentSquadPlanning", teamId, nextName, nextCountry, now, false);
  updateSheetClubTeamReferences_("TournamentRosters", teamId, nextName, nextCountry, now, false);
  updateSheetClubTeamReferences_("TournamentRosterPlayers", teamId, nextName, nextCountry, now, false);
}

function requestTeamIdentityChange(data) {
  try {
    var captainCheck = teamProfileContextForCaptain_(data || {});
    if (!captainCheck.success) return captainCheck;

    var officialRow = findClubTeamRowById_(captainCheck.clubTeam.teamId);
    var officialTeam = clubTeamFromRow_(officialRow);
    if (!officialTeam) {
      return {
        success: false,
        message: "Official club/team not found."
      };
    }

    if (pendingTeamChangeRequestRowForTeam_(officialTeam.teamId)) {
      return {
        success: false,
        message: "Identity change already pending."
      };
    }

    var incoming = data && data.request && typeof data.request === "object"
      ? data.request
      : data || {};
    var requestedName = clubTeamText_(
      incoming.requestedName || incoming.name || officialTeam.name,
      160
    );
    var requestedCountry = clubTeamText_(
      incoming.requestedCountry || incoming.country || officialTeam.country,
      120
    );
    var requestedCity = clubTeamText_(
      incoming.requestedCity || incoming.city || officialTeam.city,
      120
    );

    if (!requestedName) {
      return {
        success: false,
        message: "Team name is required."
      };
    }

    var nameChanged =
      clubTeamNameKey_(requestedName) !== clubTeamNameKey_(officialTeam.name);
    var countryChanged =
      String(requestedCountry || "").trim() !== String(officialTeam.country || "").trim();
    var cityChanged =
      String(requestedCity || "").trim() !== String(officialTeam.city || "").trim();

    if (!nameChanged && !countryChanged && !cityChanged) {
      return {
        success: false,
        message: "No identity change requested."
      };
    }

    if (nameChanged && findClubTeamNameMatch_(requestedName, officialTeam.teamId, true)) {
      return {
        success: false,
        message: "This club/team already exists."
      };
    }

    var now = new Date().toISOString();
    var request = {
      requestId: "team-change-" + Utilities.getUuid(),
      teamId: officialTeam.teamId,
      currentName: officialTeam.name,
      requestedName: requestedName,
      currentCountry: officialTeam.country,
      requestedCountry: requestedCountry,
      currentCity: officialTeam.city,
      requestedCity: requestedCity,
      requestedByUsername: playerHubUsername_(captainCheck.context.user),
      reason: clubTeamText_(incoming.reason, 500),
      status: "PENDING",
      adminNote: "",
      createdAt: now,
      reviewedAt: "",
      reviewedBy: ""
    };

    writeTeamChangeRequestRow_(request, null);

    return {
      success: true,
      request: request,
      message: "Identity change request sent."
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not request identity change."
    };
  }
}

function listTeamIdentityChangeRequests(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var username = playerHubUsername_(context.user).toLowerCase();
    var isAdmin = isAdminUser_(context.user);
    var allowedTeamId = "";

    if (!isAdmin) {
      var captainCheck = teamProfileContextForCaptain_(data || {});
      if (!captainCheck.success) {
        return {
          success: true,
          requests: []
        };
      }
      allowedTeamId = captainCheck.clubTeam.teamId;
    }

    var requests = teamChangeRequestRows_()
      .map(teamChangeRequestFromRow_)
      .filter(Boolean)
      .filter(function (request) {
        if (isAdmin) return true;
        return (
          request.teamId === allowedTeamId ||
          String(request.requestedByUsername || "").trim().toLowerCase() === username
        );
      });

    return {
      success: true,
      requests: sortTeamChangeRequests_(requests)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team identity requests."
    };
  }
}

function reviewTeamIdentityChangeRequest(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var requestId = String(data && data.requestId || "").trim();
    var row = findTeamChangeRequestRowById_(requestId);
    var request = teamChangeRequestFromRow_(row);
    if (!request) {
      return {
        success: false,
        message: "Identity request not found."
      };
    }

    if (request.status !== "PENDING") {
      return {
        success: false,
        message: "Identity request has already been reviewed."
      };
    }

    var decision = String(data && (data.decision || data.status) || "")
      .trim()
      .toUpperCase();
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return {
        success: false,
        message: "Review decision must be APPROVED or REJECTED."
      };
    }

    var now = new Date().toISOString();
    if (decision === "APPROVED") {
      var officialRow = findClubTeamRowById_(request.teamId);
      var officialTeam = clubTeamFromRow_(officialRow);
      if (!officialTeam) {
        return {
          success: false,
          message: "Official club/team not found."
        };
      }

      var requestedName = clubTeamText_(request.requestedName || officialTeam.name, 160);
      if (!requestedName) {
        return {
          success: false,
          message: "Requested team name is required."
        };
      }

      if (
        clubTeamNameKey_(requestedName) !== clubTeamNameKey_(officialTeam.name) &&
        findClubTeamNameMatch_(requestedName, officialTeam.teamId, true)
      ) {
        return {
          success: false,
          message: "This club/team already exists."
        };
      }

      officialTeam.name = requestedName;
      officialTeam.country = clubTeamText_(
        request.requestedCountry || officialTeam.country,
        120
      );
      officialTeam.city = clubTeamText_(request.requestedCity || officialTeam.city, 120);
      officialTeam.updatedAt = now;
      writeClubTeamRow_(officialTeam, officialRow);
      updateClubTeamIdentityReferences_(
        officialTeam.teamId,
        officialTeam.name,
        officialTeam.country,
        now
      );
    }

    request.status = decision;
    request.adminNote = clubTeamText_(data && data.adminNote, 500);
    request.reviewedAt = now;
    request.reviewedBy = playerHubUsername_(adminCheck.admin);
    writeTeamChangeRequestRow_(request, row);

    return {
      success: true,
      request: request,
      message:
        decision === "APPROVED"
          ? "Identity change approved."
          : "Identity change rejected."
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not review identity change request."
    };
  }
}

/* =========================
   PLAYER HUB ACCESS REQUESTS
   Request-only layer, admin-reviewed
   ========================= */

var ACCESS_REQUESTS_SHEET_ = "AccessRequests";
var ACCESS_REQUEST_HEADERS_ = [
  "RequestId",
  "Username",
  "DisplayName",
  "Email",
  "RequestType",
  "ClubTeamId",
  "ClubTeamName",
  "Message",
  "Status",
  "AdminNote",
  "CreatedAt",
  "UpdatedAt",
  "ReviewedBy",
  "ReviewedAt"
];

function getAccessRequestsSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    ACCESS_REQUESTS_SHEET_,
    ACCESS_REQUEST_HEADERS_
  );
}

function normalizeAccessRequestType_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "CAPTAIN" || text === "TRAINER" || text === "ORGANIZER") {
    return text;
  }
  return "";
}

function normalizeAccessRequestStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "APPROVED" || text === "REJECTED") return text;
  return "PENDING";
}

function accessRequestRows_() {
  var sheet = getAccessRequestsSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), ACCESS_REQUEST_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function accessRequestFromRow_(row) {
  if (!row) return null;
  return {
    requestId: String(row.RequestId || "").trim(),
    username: String(row.Username || "").trim(),
    displayName: String(row.DisplayName || "").trim(),
    email: String(row.Email || "").trim(),
    requestType: normalizeAccessRequestType_(row.RequestType),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    message: String(row.Message || "").trim(),
    status: normalizeAccessRequestStatus_(row.Status),
    adminNote: String(row.AdminNote || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim(),
    reviewedBy: String(row.ReviewedBy || "").trim(),
    reviewedAt: String(row.ReviewedAt || "").trim()
  };
}

function accessRequestColumnValue_(header, request) {
  if (header === "RequestId") return request.requestId || "";
  if (header === "Username") return request.username || "";
  if (header === "DisplayName") return request.displayName || "";
  if (header === "Email") return request.email || "";
  if (header === "RequestType") return request.requestType || "";
  if (header === "ClubTeamId") return request.clubTeamId || "";
  if (header === "ClubTeamName") return request.clubTeamName || "";
  if (header === "Message") return request.message || "";
  if (header === "Status") return request.status || "PENDING";
  if (header === "AdminNote") return request.adminNote || "";
  if (header === "CreatedAt") return request.createdAt || "";
  if (header === "UpdatedAt") return request.updatedAt || "";
  if (header === "ReviewedBy") return request.reviewedBy || "";
  if (header === "ReviewedAt") return request.reviewedAt || "";
  return "";
}

function writeAccessRequestRow_(request, existingRow) {
  var sheet = getAccessRequestsSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return accessRequestColumnValue_(header, request);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return request;
}

function findAccessRequestRowById_(requestId) {
  var target = String(requestId || "").trim();
  if (!target) return null;

  var rows = accessRequestRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].RequestId || "").trim() === target) return rows[i];
  }

  return null;
}

function sortAccessRequests_(requests) {
  return requests.sort(function (a, b) {
    var aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
    var bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

function accessRequestProfileForUser_(user) {
  var username = playerHubUsername_(user);
  var profileRow = findPlayerProfileRowByUsername_(username);
  return playerProfileFromRow_(profileRow, user);
}

function accessRequestClubPayload_(data, profile, requestType) {
  var incomingClubTeamId = String(data && data.clubTeamId || "").trim();
  var selectedTeam = incomingClubTeamId
    ? getActiveClubTeamById_(incomingClubTeamId)
    : null;
  var profileClubTeamId = String((profile && profile.clubTeamId) || "").trim();

  if (!selectedTeam && profileClubTeamId) {
    selectedTeam = getActiveClubTeamById_(profileClubTeamId);
  }

  if (selectedTeam) {
    return {
      clubTeamId: selectedTeam.teamId,
      clubTeamName: selectedTeam.name
    };
  }

  if (
    requestType === "ORGANIZER" &&
    data &&
    String(data.clubTeamName || "").trim()
  ) {
    return {
      clubTeamId: "",
      clubTeamName: playerProfileText_(data.clubTeamName, 160)
    };
  }

  return {
    clubTeamId: "",
    clubTeamName: ""
  };
}

function userHasPendingAccessRequest_(username, requestType) {
  var targetUsername = String(username || "").trim().toLowerCase();
  var targetType = normalizeAccessRequestType_(requestType);
  if (!targetUsername || !targetType) return false;

  var rows = accessRequestRows_();
  for (var i = 0; i < rows.length; i++) {
    var request = accessRequestFromRow_(rows[i]);
    if (!request) continue;
    if (
      String(request.username || "").trim().toLowerCase() === targetUsername &&
      request.requestType === targetType &&
      request.status === "PENDING"
    ) {
      return true;
    }
  }

  return false;
}

function createAccessRequest(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var requestType = normalizeAccessRequestType_(data && data.requestType);
    if (!requestType) {
      return {
        success: false,
        message: "Invalid access request type"
      };
    }

    var username = playerHubUsername_(context.user);
    if (userHasPendingAccessRequest_(username, requestType)) {
      return {
        success: false,
        message: "You already have a pending request for this access."
      };
    }

    var profile = accessRequestProfileForUser_(context.user);
    var clubPayload = accessRequestClubPayload_(data || {}, profile, requestType);
    var now = new Date().toISOString();
    var request = {
      requestId: "access-" + Utilities.getUuid(),
      username: username,
      displayName: playerProfileText_(profile.displayName, 120),
      email: playerProfileText_(profile.email || username, 160),
      requestType: requestType,
      clubTeamId: clubPayload.clubTeamId,
      clubTeamName: clubPayload.clubTeamName,
      message: playerProfileText_(data && data.message, 500),
      status: "PENDING",
      adminNote: "",
      createdAt: now,
      updatedAt: now,
      reviewedBy: "",
      reviewedAt: ""
    };

    writeAccessRequestRow_(request, null);

    return {
      success: true,
      request: request
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not create access request"
    };
  }
}

function listMyAccessRequests(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var username = playerHubUsername_(context.user).toLowerCase();
    var requests = accessRequestRows_()
      .map(accessRequestFromRow_)
      .filter(function (request) {
        return (
          request &&
          String(request.username || "").trim().toLowerCase() === username
        );
      });

    return {
      success: true,
      requests: sortAccessRequests_(requests)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load access requests"
    };
  }
}

function accessRequestClubKey_(request) {
  if (!request) return "";
  var id = String(request.clubTeamId || "").trim().toLowerCase();
  if (id) return "id:" + id;
  var name = String(request.clubTeamName || "").trim().toLowerCase();
  return name ? "name:" + name : "";
}

function addAccessRequestAdminWarnings_(requests) {
  var approvedByClub = {};
  requests.forEach(function (request) {
    if (!request || request.status !== "APPROVED") return;
    if (request.requestType !== "CAPTAIN" && request.requestType !== "TRAINER") return;

    var key = accessRequestClubKey_(request);
    if (!key) return;
    if (!approvedByClub[key]) approvedByClub[key] = [];
    approvedByClub[key].push(request);
  });

  return requests.map(function (request) {
    if (!request) return request;
    if (request.requestType !== "CAPTAIN" && request.requestType !== "TRAINER") {
      return request;
    }

    var key = accessRequestClubKey_(request);
    var matches = key ? approvedByClub[key] || [] : [];
    var otherMatches = matches.filter(function (match) {
      return match.requestId !== request.requestId;
    });

    if (!otherMatches.length) return request;

    var names = otherMatches.slice(0, 3).map(function (match) {
      return (match.displayName || match.username || "User") + " (" + match.requestType + ")";
    });

    return Object.assign({}, request, {
      warning:
        "This club/team already has approved captain/trainer access: " +
        names.join(", ")
    });
  });
}

function listAccessRequestsAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var requests = accessRequestRows_()
      .map(accessRequestFromRow_)
      .filter(Boolean);

    return {
      success: true,
      requests: sortAccessRequests_(addAccessRequestAdminWarnings_(requests))
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load access requests"
    };
  }
}

function applyApprovedAccessRequest_(request) {
  if (!request || request.status !== "APPROVED") return;
  if (request.requestType !== "TRAINER" && request.requestType !== "ORGANIZER") {
    return;
  }

  var user = getUserByUsernameCaseInsensitive_(request.username);
  if (!user) {
    throw new Error("Request user not found");
  }

  var nextTeamBuilder = request.requestType === "TRAINER"
    ? true
    : userCanUseTeamBuilder_(user);
  var nextTournaments = request.requestType === "ORGANIZER"
    ? true
    : userCanUseTournaments_(user);

  if (request.requestType === "TRAINER") {
    ensureBlankTrainerSpreadsheetForUser_(user);
  }

  var sheet = getUsersSheet();
  sheet
    .getRange(user.rowNumber, USER_COL_.CAN_USE_TEAM_BUILDER, 1, 2)
    .setValues([[nextTeamBuilder, nextTournaments]]);
}

function approvedAccessForUsername_(username) {
  var targetUsername = String(username || "").trim().toLowerCase();
  var access = {
    teamBuilder: false,
    tournaments: false
  };

  if (!targetUsername) return access;

  var rows = accessRequestRows_();
  for (var i = 0; i < rows.length; i++) {
    var request = accessRequestFromRow_(rows[i]);
    if (!request || request.status !== "APPROVED") continue;
    if (String(request.username || "").trim().toLowerCase() !== targetUsername) {
      continue;
    }

    if (request.requestType === "TRAINER") {
      access.teamBuilder = true;
    }

    if (request.requestType === "ORGANIZER") {
      access.tournaments = true;
    }
  }

  return access;
}

function syncApprovedAccessRequestsForUser_(user) {
  if (!user || !user.username) return user;

  var approvedAccess = approvedAccessForUsername_(user.username);
  var nextTeamBuilder = approvedAccess.teamBuilder
    ? true
    : userCanUseTeamBuilder_(user);
  var nextTournaments = approvedAccess.tournaments
    ? true
    : userCanUseTournaments_(user);

  if (approvedAccess.teamBuilder) {
    ensureBlankTrainerSpreadsheetForUser_(user);
  }

  if (
    nextTeamBuilder !== userCanUseTeamBuilder_(user) ||
    nextTournaments !== userCanUseTournaments_(user)
  ) {
    var sheet = getUsersSheet();
    sheet
      .getRange(user.rowNumber, USER_COL_.CAN_USE_TEAM_BUILDER, 1, 2)
      .setValues([[nextTeamBuilder, nextTournaments]]);
  }

  user.canUseTeamBuilder = nextTeamBuilder;
  user.canUseTournaments = nextTournaments;
  user.access = {
    teamBuilder: nextTeamBuilder,
    tournaments: nextTournaments
  };

  return user;
}

function reviewAccessRequestAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var requestId = String(data && data.requestId || "").trim();
    var nextStatus = normalizeAccessRequestStatus_(data && data.status);
    if (!requestId) {
      return {
        success: false,
        message: "requestId is required"
      };
    }

    if (nextStatus !== "APPROVED" && nextStatus !== "REJECTED") {
      return {
        success: false,
        message: "Request must be approved or rejected"
      };
    }

    var row = findAccessRequestRowById_(requestId);
    if (!row) {
      return {
        success: false,
        message: "Access request not found"
      };
    }

    var request = accessRequestFromRow_(row);
    if (!request) {
      return {
        success: false,
        message: "Access request not found"
      };
    }

    var now = new Date().toISOString();
    request.status = nextStatus;
    request.adminNote = playerProfileText_(data && data.adminNote, 500);
    request.updatedAt = now;
    request.reviewedBy = adminCheck.admin.username || "";
    request.reviewedAt = now;

    if (request.status === "APPROVED") {
      applyApprovedAccessRequest_(request);
    }

    writeAccessRequestRow_(request, row);

    return {
      success: true,
      request: addAccessRequestAdminWarnings_([request])[0]
    };
  } catch (err) {
    return {
      success: false,
      message: err && err.message ? err.message : "Could not review access request"
    };
  }
}

/* =========================
   PLAYER & TEAM HUB TEAM PROFILES
   Captain-managed beta only
   ========================= */

var TEAM_PROFILES_SHEET_ = "TeamProfiles";
var TEAM_PROFILE_HEADERS_ = [
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "Country",
  "CaptainUsername",
  "CaptainDisplayName",
  "TeamLevel",
  "TeamDescription",
  "ContactNote",
  "NeedsPlayers",
  "NeedsText",
  "Active",
  "PublicVisible",
  "Approved",
  "CreatedAt",
  "UpdatedAt"
];

var TEAM_NEEDS_SHEET_ = "TeamNeeds";
var TEAM_NEED_HEADERS_ = [
  "NeedId",
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "CaptainUsername",
  "NeedType",
  "NeedText",
  "NeededCount",
  "Status",
  "Visibility",
  "IsPublished",
  "NeedContext",
  "TournamentId",
  "TournamentName",
  "SquadLabel",
  "ClassName",
  "DeadlineAt",
  "SourceType",
  "PublishedAt",
  "PublicVisible",
  "Approved",
  "CreatedAt",
  "UpdatedAt"
];

var TEAM_NEED_INTERESTS_SHEET_ = "TeamNeedInterests";
var TEAM_NEED_INTEREST_HEADERS_ = [
  "InterestId",
  "NeedId",
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "PlayerUsername",
  "PlayerDisplayName",
  "PlayerEmail",
  "PlayerPhone",
  "PlayerCountry",
  "Message",
  "Status",
  "CreatedAt",
  "UpdatedAt",
  "ReviewedBy",
  "ReviewedAt"
];

var TEAM_MEMBERS_SHEET_ = "TeamMembers";
var TEAM_MEMBER_HEADERS_ = [
  "TeamMemberId",
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "CaptainUsername",
  "PlayerUsername",
  "PlayerDisplayName",
  "PlayerEmail",
  "PlayerPhone",
  "PlayerCountry",
  "SourceInterestId",
  "MemberStatus",
  "ConfirmedBy",
  "ConfirmedAt",
  "CreatedAt",
  "UpdatedAt"
];

var TEAM_MEMBERSHIP_REQUESTS_SHEET_ = "TeamMembershipRequests";
var TEAM_MEMBERSHIP_REQUEST_HEADERS_ = [
  "RequestId",
  "ClubTeamId",
  "ClubTeamName",
  "PlayerUsername",
  "PlayerDisplayName",
  "PlayerEmail",
  "PlayerPhone",
  "PlayerCountry",
  "PlayerProfileId",
  "Status",
  "RequestedAt",
  "ReviewedBy",
  "ReviewedAt",
  "ReviewNote",
  "CreatedAt",
  "UpdatedAt"
];

function getTeamProfilesSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TEAM_PROFILES_SHEET_,
    TEAM_PROFILE_HEADERS_
  );
}

function getTeamNeedsSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TEAM_NEEDS_SHEET_,
    TEAM_NEED_HEADERS_
  );
}

function getTeamNeedInterestsSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TEAM_NEED_INTERESTS_SHEET_,
    TEAM_NEED_INTEREST_HEADERS_
  );
}

function getTeamMembersSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TEAM_MEMBERS_SHEET_,
    TEAM_MEMBER_HEADERS_
  );
}

function getTeamMembershipRequestsSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TEAM_MEMBERSHIP_REQUESTS_SHEET_,
    TEAM_MEMBERSHIP_REQUEST_HEADERS_
  );
}

function normalizeTeamNeedType_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (
    text === "PLAYER" ||
    text === "SUBSTITUTE" ||
    text === "TRAINING_PLAYER"
  ) {
    return text;
  }
  return "PLAYER";
}

function normalizeTeamNeedStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "CLOSED" || text === "ARCHIVED") return text;
  return "OPEN";
}

function normalizeTeamNeedVisibility_(value) {
  var text = String(value || "").trim().toLowerCase();
  if (text === "published" || text === "public" || text === "external") {
    return "published";
  }
  return "internal";
}

function normalizeTeamNeedContext_(value) {
  var text = String(value || "").trim().toLowerCase();
  if (text === "tournament" || text === "event") return "tournament";
  if (text === "training" || text === "practice") return "training";
  return "general";
}

function normalizeTeamNeedInterestStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "ACCEPTED" || text === "DECLINED" || text === "CANCELLED") {
    return text;
  }
  return "PENDING";
}

function normalizeTeamMemberStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "REMOVED" || text === "ARCHIVED") return text;
  return "ACTIVE";
}

function normalizeTeamMembershipRequestStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (
    text === "APPROVED" ||
    text === "REJECTED" ||
    text === "CANCELLED"
  ) {
    return text;
  }
  return "PENDING";
}

function teamProfileRows_() {
  var sheet = getTeamProfilesSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TEAM_PROFILE_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function teamNeedsRows_() {
  var sheet = getTeamNeedsSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TEAM_NEED_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function teamNeedInterestRows_() {
  var sheet = getTeamNeedInterestsSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TEAM_NEED_INTEREST_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function teamMemberRows_() {
  var sheet = getTeamMembersSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TEAM_MEMBER_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function teamMembershipRequestRows_() {
  var sheet = getTeamMembershipRequestsSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(
    sheet.getLastColumn(),
    TEAM_MEMBERSHIP_REQUEST_HEADERS_.length
  );
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function teamProfileFromRow_(row) {
  if (!row) return null;

  return {
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    country: String(row.Country || "").trim(),
    captainUsername: String(row.CaptainUsername || "").trim(),
    captainDisplayName: String(row.CaptainDisplayName || "").trim(),
    teamLevel: String(row.TeamLevel || "").trim(),
    teamDescription: String(row.TeamDescription || "").trim(),
    contactNote: String(row.ContactNote || "").trim(),
    needsPlayers: truthy_(row.NeedsPlayers),
    needsText: String(row.NeedsText || "").trim(),
    active: row.Active === "" || row.Active === undefined || row.Active === null
      ? true
      : truthy_(row.Active),
    publicVisible: truthy_(row.PublicVisible),
    approved: truthy_(row.Approved),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function teamNeedFromRow_(row) {
  if (!row) return null;

  var rowIsPublished = truthy_(row.IsPublished);
  var rowNeedContext = normalizeTeamNeedContext_(row.NeedContext);
  var rowTournamentId = String(row.TournamentId || "").trim();
  var rowTournamentName = String(row.TournamentName || "").trim();
  var rowVisibility = normalizeTeamNeedVisibility_(row.Visibility);
  if (
    !String(row.Visibility || "").trim() &&
    rowIsPublished &&
    rowNeedContext === "tournament" &&
    (rowTournamentId || rowTournamentName)
  ) {
    rowVisibility = "published";
  }

  return {
    needId: String(row.NeedId || "").trim(),
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    captainUsername: String(row.CaptainUsername || "").trim(),
    needType: normalizeTeamNeedType_(row.NeedType),
    needText: String(row.NeedText || "").trim(),
    neededCount: Number(row.NeededCount) || 1,
    status: normalizeTeamNeedStatus_(row.Status),
    visibility: rowVisibility,
    isPublished: rowIsPublished,
    needContext: rowNeedContext,
    tournamentId: rowTournamentId,
    tournamentName: rowTournamentName,
    squadLabel: String(row.SquadLabel || "").trim(),
    className: String(row.ClassName || "").trim(),
    deadlineAt: String(row.DeadlineAt || "").trim(),
    sourceType: String(row.SourceType || "").trim(),
    publishedAt: String(row.PublishedAt || "").trim(),
    publicVisible: truthy_(row.PublicVisible),
    approved: truthy_(row.Approved),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function teamNeedInterestFromRow_(row) {
  if (!row) return null;

  return {
    interestId: String(row.InterestId || "").trim(),
    needId: String(row.NeedId || "").trim(),
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    playerUsername: String(row.PlayerUsername || "").trim(),
    playerDisplayName: String(row.PlayerDisplayName || "").trim(),
    playerEmail: String(row.PlayerEmail || "").trim(),
    playerPhone: String(row.PlayerPhone || "").trim(),
    playerCountry: String(row.PlayerCountry || "").trim(),
    message: String(row.Message || "").trim(),
    status: normalizeTeamNeedInterestStatus_(row.Status),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim(),
    reviewedBy: String(row.ReviewedBy || "").trim(),
    reviewedAt: String(row.ReviewedAt || "").trim()
  };
}

function teamMemberFromRow_(row) {
  if (!row) return null;

  return {
    teamMemberId: String(row.TeamMemberId || "").trim(),
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    captainUsername: String(row.CaptainUsername || "").trim(),
    playerUsername: String(row.PlayerUsername || "").trim(),
    playerDisplayName: String(row.PlayerDisplayName || "").trim(),
    playerEmail: String(row.PlayerEmail || "").trim(),
    playerPhone: String(row.PlayerPhone || "").trim(),
    playerCountry: String(row.PlayerCountry || "").trim(),
    sourceInterestId: String(row.SourceInterestId || "").trim(),
    memberStatus: normalizeTeamMemberStatus_(row.MemberStatus),
    confirmedBy: String(row.ConfirmedBy || "").trim(),
    confirmedAt: String(row.ConfirmedAt || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function teamMembershipRequestFromRow_(row) {
  if (!row) return null;

  return {
    requestId: String(row.RequestId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    playerUsername: String(row.PlayerUsername || "").trim(),
    playerDisplayName: String(row.PlayerDisplayName || "").trim(),
    playerEmail: String(row.PlayerEmail || "").trim(),
    playerPhone: String(row.PlayerPhone || "").trim(),
    playerCountry: String(row.PlayerCountry || "").trim(),
    playerProfileId: String(row.PlayerProfileId || "").trim(),
    status: normalizeTeamMembershipRequestStatus_(row.Status),
    requestedAt: String(row.RequestedAt || "").trim(),
    reviewedBy: String(row.ReviewedBy || "").trim(),
    reviewedAt: String(row.ReviewedAt || "").trim(),
    reviewNote: String(row.ReviewNote || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function enrichTeamNeedInterestWithPlayerProfile_(interest) {
  if (!interest) return interest;

  var row = findPlayerProfileRowByUsername_(interest.playerUsername);
  var profile = playerProfileFromRow_(row, { username: interest.playerUsername });
  return Object.assign({}, interest, {
    playerClubTeamName: profile && !profile.freeAgent
      ? profile.clubTeamName || profile.teamNote || ""
      : "No fixed club/team"
  });
}

function enrichTeamMembershipRequestWithProfile_(request) {
  if (!request) return request;

  var profileRow = findPlayerProfileRowByUsername_(request.playerUsername);
  var profile = playerProfileFromRow_(profileRow, {
    username: request.playerUsername
  });
  var activeMemberRow = findActiveTeamMemberForClubRow_(
    request.clubTeamId,
    request.playerUsername
  );
  return Object.assign({}, request, {
    playerDisplayName:
      request.playerDisplayName || (profile && profile.displayName) || "",
    playerEmail: request.playerEmail || (profile && profile.email) || "",
    playerPhone: request.playerPhone || (profile && profile.phone) || "",
    playerCountry: request.playerCountry || (profile && profile.country) || "",
    alreadyConfirmed: !!activeMemberRow
  });
}

function enrichTeamMemberWithPlayerProfile_(member) {
  if (!member) return member;

  var row = findPlayerProfileRowByUsername_(member.playerUsername);
  var profile = playerProfileFromRow_(row, { username: member.playerUsername });
  var teamProfile = teamProfileFromRow_(findTeamProfileRowById_(member.teamProfileId));
  var clubTeam = getActiveClubTeamById_(member.clubTeamId) || {};
  return Object.assign({}, member, {
    playerDisplayName:
      member.playerDisplayName || (profile && profile.displayName) || "",
    playerEmail: member.playerEmail || (profile && profile.email) || "",
    playerPhone: member.playerPhone || (profile && profile.phone) || "",
    playerCountry: member.playerCountry || (profile && profile.country) || "",
    teamCountry: (teamProfile && teamProfile.country) || clubTeam.country || "",
    playerClubTeamName: profile && !profile.freeAgent
      ? profile.clubTeamName || profile.teamNote || ""
      : "No fixed club/team"
  });
}

function teamProfileColumnValue_(header, profile) {
  if (header === "TeamProfileId") return profile.teamProfileId || "";
  if (header === "ClubTeamId") return profile.clubTeamId || "";
  if (header === "ClubTeamName") return profile.clubTeamName || "";
  if (header === "Country") return profile.country || "";
  if (header === "CaptainUsername") return profile.captainUsername || "";
  if (header === "CaptainDisplayName") return profile.captainDisplayName || "";
  if (header === "TeamLevel") return profile.teamLevel || "";
  if (header === "TeamDescription") return profile.teamDescription || "";
  if (header === "ContactNote") return profile.contactNote || "";
  if (header === "NeedsPlayers") return profile.needsPlayers ? "TRUE" : "FALSE";
  if (header === "NeedsText") return profile.needsText || "";
  if (header === "Active") return profile.active ? "TRUE" : "FALSE";
  if (header === "PublicVisible") return profile.publicVisible ? "TRUE" : "FALSE";
  if (header === "Approved") return profile.approved ? "TRUE" : "FALSE";
  if (header === "CreatedAt") return profile.createdAt || "";
  if (header === "UpdatedAt") return profile.updatedAt || "";
  return "";
}

function teamNeedColumnValue_(header, need) {
  if (header === "NeedId") return need.needId || "";
  if (header === "TeamProfileId") return need.teamProfileId || "";
  if (header === "ClubTeamId") return need.clubTeamId || "";
  if (header === "ClubTeamName") return need.clubTeamName || "";
  if (header === "CaptainUsername") return need.captainUsername || "";
  if (header === "NeedType") return need.needType || "PLAYER";
  if (header === "NeedText") return need.needText || "";
  if (header === "NeededCount") return Number(need.neededCount) || 1;
  if (header === "Status") return need.status || "OPEN";
  if (header === "Visibility") return need.visibility || "internal";
  if (header === "IsPublished") return need.isPublished ? "TRUE" : "FALSE";
  if (header === "NeedContext") return need.needContext || "general";
  if (header === "TournamentId") return need.tournamentId || "";
  if (header === "TournamentName") return need.tournamentName || "";
  if (header === "SquadLabel") return need.squadLabel || "";
  if (header === "ClassName") return need.className || "";
  if (header === "DeadlineAt") return need.deadlineAt || "";
  if (header === "SourceType") return need.sourceType || "";
  if (header === "PublishedAt") return need.publishedAt || "";
  if (header === "PublicVisible") return need.publicVisible ? "TRUE" : "FALSE";
  if (header === "Approved") return need.approved ? "TRUE" : "FALSE";
  if (header === "CreatedAt") return need.createdAt || "";
  if (header === "UpdatedAt") return need.updatedAt || "";
  return "";
}

function teamNeedInterestColumnValue_(header, interest) {
  if (header === "InterestId") return interest.interestId || "";
  if (header === "NeedId") return interest.needId || "";
  if (header === "TeamProfileId") return interest.teamProfileId || "";
  if (header === "ClubTeamId") return interest.clubTeamId || "";
  if (header === "ClubTeamName") return interest.clubTeamName || "";
  if (header === "PlayerUsername") return interest.playerUsername || "";
  if (header === "PlayerDisplayName") return interest.playerDisplayName || "";
  if (header === "PlayerEmail") return interest.playerEmail || "";
  if (header === "PlayerPhone") return interest.playerPhone || "";
  if (header === "PlayerCountry") return interest.playerCountry || "";
  if (header === "Message") return interest.message || "";
  if (header === "Status") return interest.status || "PENDING";
  if (header === "CreatedAt") return interest.createdAt || "";
  if (header === "UpdatedAt") return interest.updatedAt || "";
  if (header === "ReviewedBy") return interest.reviewedBy || "";
  if (header === "ReviewedAt") return interest.reviewedAt || "";
  return "";
}

function teamMemberColumnValue_(header, member) {
  if (header === "TeamMemberId") return member.teamMemberId || "";
  if (header === "TeamProfileId") return member.teamProfileId || "";
  if (header === "ClubTeamId") return member.clubTeamId || "";
  if (header === "ClubTeamName") return member.clubTeamName || "";
  if (header === "CaptainUsername") return member.captainUsername || "";
  if (header === "PlayerUsername") return member.playerUsername || "";
  if (header === "PlayerDisplayName") return member.playerDisplayName || "";
  if (header === "PlayerEmail") return member.playerEmail || "";
  if (header === "PlayerPhone") return member.playerPhone || "";
  if (header === "PlayerCountry") return member.playerCountry || "";
  if (header === "SourceInterestId") return member.sourceInterestId || "";
  if (header === "MemberStatus") return member.memberStatus || "ACTIVE";
  if (header === "ConfirmedBy") return member.confirmedBy || "";
  if (header === "ConfirmedAt") return member.confirmedAt || "";
  if (header === "CreatedAt") return member.createdAt || "";
  if (header === "UpdatedAt") return member.updatedAt || "";
  return "";
}

function teamMembershipRequestColumnValue_(header, request) {
  if (header === "RequestId") return request.requestId || "";
  if (header === "ClubTeamId") return request.clubTeamId || "";
  if (header === "ClubTeamName") return request.clubTeamName || "";
  if (header === "PlayerUsername") return request.playerUsername || "";
  if (header === "PlayerDisplayName") return request.playerDisplayName || "";
  if (header === "PlayerEmail") return request.playerEmail || "";
  if (header === "PlayerPhone") return request.playerPhone || "";
  if (header === "PlayerCountry") return request.playerCountry || "";
  if (header === "PlayerProfileId") return request.playerProfileId || "";
  if (header === "Status") return request.status || "PENDING";
  if (header === "RequestedAt") return request.requestedAt || "";
  if (header === "ReviewedBy") return request.reviewedBy || "";
  if (header === "ReviewedAt") return request.reviewedAt || "";
  if (header === "ReviewNote") return request.reviewNote || "";
  if (header === "CreatedAt") return request.createdAt || "";
  if (header === "UpdatedAt") return request.updatedAt || "";
  return "";
}

function writeTeamProfileRow_(profile, existingRow) {
  var sheet = getTeamProfilesSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return teamProfileColumnValue_(header, profile);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return profile;
}

function writeTeamNeedRow_(need, existingRow) {
  var sheet = getTeamNeedsSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return teamNeedColumnValue_(header, need);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return need;
}

function writeTeamNeedInterestRow_(interest, existingRow) {
  var sheet = getTeamNeedInterestsSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return teamNeedInterestColumnValue_(header, interest);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return interest;
}

function writeTeamMemberRow_(member, existingRow) {
  var sheet = getTeamMembersSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return teamMemberColumnValue_(header, member);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return member;
}

function writeTeamMembershipRequestRow_(request, existingRow) {
  var sheet = getTeamMembershipRequestsSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return teamMembershipRequestColumnValue_(header, request);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return request;
}

function findTeamProfileRowByCaptainAndClub_(username, clubTeamId) {
  var targetUsername = String(username || "").trim().toLowerCase();
  var targetClubTeamId = String(clubTeamId || "").trim();
  var rows = teamProfileRows_();
  for (var i = 0; i < rows.length; i++) {
    if (
      String(rows[i].CaptainUsername || "").trim().toLowerCase() === targetUsername &&
      String(rows[i].ClubTeamId || "").trim() === targetClubTeamId
    ) {
      return rows[i];
    }
  }
  return null;
}

function findTeamProfileRowById_(teamProfileId) {
  var target = String(teamProfileId || "").trim();
  if (!target) return null;

  var rows = teamProfileRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].TeamProfileId || "").trim() === target) return rows[i];
  }
  return null;
}

function findTeamNeedRowById_(needId) {
  var target = String(needId || "").trim();
  if (!target) return null;

  var rows = teamNeedsRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].NeedId || "").trim() === target) return rows[i];
  }
  return null;
}

function findTeamNeedInterestRowById_(interestId) {
  var target = String(interestId || "").trim();
  if (!target) return null;

  var rows = teamNeedInterestRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].InterestId || "").trim() === target) return rows[i];
  }
  return null;
}

function findTeamMemberRowById_(teamMemberId) {
  var target = String(teamMemberId || "").trim();
  if (!target) return null;

  var rows = teamMemberRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].TeamMemberId || "").trim() === target) return rows[i];
  }
  return null;
}

function findActiveTeamMemberRow_(teamProfileId, playerUsername) {
  var targetTeamProfileId = String(teamProfileId || "").trim();
  var targetUsername = String(playerUsername || "").trim().toLowerCase();
  if (!targetTeamProfileId || !targetUsername) return null;

  var rows = teamMemberRows_();
  for (var i = 0; i < rows.length; i++) {
    var member = teamMemberFromRow_(rows[i]);
    if (
      member &&
      member.teamProfileId === targetTeamProfileId &&
      String(member.playerUsername || "").trim().toLowerCase() === targetUsername &&
      member.memberStatus === "ACTIVE"
    ) {
      return rows[i];
    }
  }
  return null;
}

function findActiveTeamMemberForClubRow_(clubTeamId, playerUsername) {
  var targetClubTeamId = String(clubTeamId || "").trim();
  var targetUsername = String(playerUsername || "").trim().toLowerCase();
  if (!targetClubTeamId || !targetUsername) return null;

  var rows = teamMemberRows_();
  for (var i = 0; i < rows.length; i++) {
    var member = teamMemberFromRow_(rows[i]);
    if (
      member &&
      member.clubTeamId === targetClubTeamId &&
      String(member.playerUsername || "").trim().toLowerCase() === targetUsername &&
      member.memberStatus === "ACTIVE"
    ) {
      return rows[i];
    }
  }
  return null;
}

function findTeamMembershipRequestRowById_(requestId) {
  var target = String(requestId || "").trim();
  if (!target) return null;

  var rows = teamMembershipRequestRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].RequestId || "").trim() === target) return rows[i];
  }
  return null;
}

function pendingTeamMembershipRequestRow_(playerUsername, clubTeamId) {
  var targetUsername = String(playerUsername || "").trim().toLowerCase();
  var targetClubTeamId = String(clubTeamId || "").trim();
  if (!targetUsername || !targetClubTeamId) return null;

  var rows = teamMembershipRequestRows_();
  for (var i = 0; i < rows.length; i++) {
    var request = teamMembershipRequestFromRow_(rows[i]);
    if (
      request &&
      request.status === "PENDING" &&
      request.clubTeamId === targetClubTeamId &&
      String(request.playerUsername || "").trim().toLowerCase() === targetUsername
    ) {
      return rows[i];
    }
  }
  return null;
}

function cancelPendingTeamMembershipRequests_(playerUsername, exceptClubTeamId) {
  var targetUsername = String(playerUsername || "").trim().toLowerCase();
  var keepClubTeamId = String(exceptClubTeamId || "").trim();
  if (!targetUsername) return;

  var now = new Date().toISOString();
  teamMembershipRequestRows_().forEach(function (row) {
    var request = teamMembershipRequestFromRow_(row);
    if (
      request &&
      request.status === "PENDING" &&
      String(request.playerUsername || "").trim().toLowerCase() === targetUsername &&
      request.clubTeamId !== keepClubTeamId
    ) {
      request.status = "CANCELLED";
      request.updatedAt = now;
      writeTeamMembershipRequestRow_(request, row);
    }
  });
}

function userHasApprovedCaptainForClub_(username, clubTeamId, clubTeamName) {
  var targetUsername = String(username || "").trim().toLowerCase();
  var targetClubTeamId = String(clubTeamId || "").trim();
  var targetClubTeamName = String(clubTeamName || "").trim().toLowerCase();
  if (!targetUsername || !targetClubTeamId) return false;

  var rows = accessRequestRows_();
  for (var i = 0; i < rows.length; i++) {
    var request = accessRequestFromRow_(rows[i]);
    if (!request || request.status !== "APPROVED") continue;
    if (request.requestType !== "CAPTAIN") continue;
    if (String(request.username || "").trim().toLowerCase() !== targetUsername) {
      continue;
    }
    if (String(request.clubTeamId || "").trim() === targetClubTeamId) return true;
    if (
      !String(request.clubTeamId || "").trim() &&
      targetClubTeamName &&
      String(request.clubTeamName || "").trim().toLowerCase() === targetClubTeamName
    ) {
      return true;
    }
  }

  return false;
}

function teamProfileContextForCaptain_(data) {
  var context = resolveRequestContext(data || {});
  if (!context || !context.authenticated || !context.user) {
    return {
      success: false,
      message: "Login required"
    };
  }

  var profile = accessRequestProfileForUser_(context.user);
  if (!profile || profile.freeAgent || !profile.clubTeamId) {
    return {
      success: false,
      message: "Select a club/team in your player profile first."
    };
  }

  var selectedTeam = getActiveClubTeamById_(profile.clubTeamId);
  if (!selectedTeam) {
    return {
      success: false,
      message: "Selected club/team is no longer active."
    };
  }

  var username = playerHubUsername_(context.user);
  if (!userHasApprovedCaptainForClub_(username, selectedTeam.teamId, selectedTeam.name)) {
    return {
      success: false,
      message: "Captain approval required."
    };
  }

  return {
    success: true,
    context: context,
    playerProfile: profile,
    clubTeam: selectedTeam
  };
}

function buildTeamProfileForSave_(incoming, existingRow, captainContext) {
  var now = new Date().toISOString();
  var existing = teamProfileFromRow_(existingRow);
  var safeIncoming = incoming && typeof incoming === "object" ? incoming : {};
  var profile = captainContext.playerProfile;
  var team = captainContext.clubTeam;

  return {
    teamProfileId:
      (existing && existing.teamProfileId) ||
      "team-profile-" + Utilities.getUuid(),
    clubTeamId: team.teamId,
    clubTeamName: team.name,
    country: playerProfileText_(
      team.country || (existing && existing.country) || profile.country,
      120
    ),
    captainUsername: playerHubUsername_(captainContext.context.user),
    captainDisplayName: playerProfileText_(profile.displayName, 120),
    teamLevel: playerProfileText_(safeIncoming.teamLevel, 80),
    teamDescription: playerProfileText_(safeIncoming.teamDescription, 500),
    contactNote: playerProfileText_(safeIncoming.contactNote, 240),
    needsPlayers: truthy_(safeIncoming.needsPlayers),
    needsText: playerProfileText_(safeIncoming.needsText, 240),
    active: safeIncoming.active === undefined ? true : truthy_(safeIncoming.active),
    publicVisible: existing ? !!existing.publicVisible : false,
    approved: existing ? !!existing.approved : false,
    createdAt: existing && existing.createdAt ? existing.createdAt : now,
    updatedAt: now
  };
}

function teamNeedsForProfile_(teamProfileId) {
  var target = String(teamProfileId || "").trim();
  if (!target) return [];

  var needs = teamNeedsRows_()
    .map(teamNeedFromRow_)
    .filter(function (need) {
      return need && String(need.teamProfileId || "").trim() === target;
    })
    .sort(function (a, b) {
      var aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      var bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      return bTime - aTime;
    });

  return decorateTeamNeedsWithInterestCounts_(needs);
}

function teamNeedInterestCountsMap_(needIds) {
  var ids = {};
  (needIds || []).forEach(function (needId) {
    var id = String(needId || "").trim();
    if (id) ids[id] = true;
  });

  var counts = {};
  teamNeedInterestRows_()
    .map(teamNeedInterestFromRow_)
    .filter(function (interest) {
      return interest && ids[interest.needId];
    })
    .forEach(function (interest) {
      var needId = String(interest.needId || "").trim();
      if (!counts[needId]) {
        counts[needId] = {
          acceptedCount: 0,
          pendingCount: 0
        };
      }
      if (interest.status === "ACCEPTED") {
        counts[needId].acceptedCount += 1;
      }
      if (interest.status === "PENDING") {
        counts[needId].pendingCount += 1;
      }
    });

  return counts;
}

function decorateTeamNeedsWithInterestCounts_(needs) {
  var safeNeeds = (needs || []).filter(Boolean);
  var counts = teamNeedInterestCountsMap_(
    safeNeeds.map(function (need) {
      return need.needId;
    })
  );
  var profilesById = {};
  teamProfileRows_()
    .map(teamProfileFromRow_)
    .filter(Boolean)
    .forEach(function (profile) {
      profilesById[profile.teamProfileId] = profile;
    });
  var clubTeamsById = {};
  clubTeamRows_()
    .map(clubTeamFromRow_)
    .filter(Boolean)
    .forEach(function (team) {
      clubTeamsById[team.teamId] = team;
    });
  var playerProfilesByUsername = {};
  playerProfileRows_()
    .map(function (row) {
      return playerProfileFromRow_(row, { username: row.Username });
    })
    .filter(Boolean)
    .forEach(function (profile) {
      playerProfilesByUsername[String(profile.username || "").trim().toLowerCase()] =
        profile;
    });

  return safeNeeds.map(function (need) {
    var needId = String(need.needId || "").trim();
    var profile = profilesById[String(need.teamProfileId || "").trim()] || {};
    var clubTeam = clubTeamsById[String(need.clubTeamId || "").trim()] || {};
    var captainProfile =
      playerProfilesByUsername[
        String(need.captainUsername || "").trim().toLowerCase()
      ] || {};
    var needCounts = counts[needId] || {};
    var neededCount = Math.max(1, Number(need.neededCount) || 1);
    var acceptedCount = Number(needCounts.acceptedCount) || 0;
    var pendingCount = Number(needCounts.pendingCount) || 0;
    var remainingCount = Math.max(neededCount - acceptedCount, 0);

    return Object.assign({}, need, {
      neededCount: neededCount,
      acceptedCount: acceptedCount,
      pendingCount: pendingCount,
      remainingCount: remainingCount,
      filled: remainingCount <= 0,
      country: profile.country || clubTeam.country || captainProfile.country || "",
      captainDisplayName:
        profile.captainDisplayName || captainProfile.displayName || ""
    });
  });
}

function teamNeedInterestsForNeedIds_(needIds) {
  var ids = {};
  (needIds || []).forEach(function (needId) {
    var id = String(needId || "").trim();
    if (id) ids[id] = true;
  });

  return teamNeedInterestRows_()
    .map(teamNeedInterestFromRow_)
    .filter(function (interest) {
      return interest && ids[String(interest.needId || "").trim()];
    })
    .sort(function (a, b) {
      var aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      var bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      return bTime - aTime;
    });
}

function userPendingInterestForNeed_(username, needId) {
  var targetUsername = String(username || "").trim().toLowerCase();
  var targetNeedId = String(needId || "").trim();
  if (!targetUsername || !targetNeedId) return null;

  var rows = teamNeedInterestRows_();
  for (var i = 0; i < rows.length; i++) {
    var interest = teamNeedInterestFromRow_(rows[i]);
    if (
      interest &&
      interest.needId === targetNeedId &&
      String(interest.playerUsername || "").trim().toLowerCase() === targetUsername &&
      interest.status === "PENDING"
    ) {
      return interest;
    }
  }

  return null;
}

function latestUserInterestForNeed_(username, needId) {
  var targetUsername = String(username || "").trim().toLowerCase();
  var targetNeedId = String(needId || "").trim();
  if (!targetUsername || !targetNeedId) return null;

  var interests = teamNeedInterestRows_()
    .map(teamNeedInterestFromRow_)
    .filter(function (interest) {
      return (
        interest &&
        interest.needId === targetNeedId &&
        String(interest.playerUsername || "").trim().toLowerCase() === targetUsername
      );
    })
    .sort(function (a, b) {
      var aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      var bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      return bTime - aTime;
    });

  return interests[0] || null;
}

function safeTeamNeedForListing_(need, username) {
  var currentUsername = String(username || "").trim().toLowerCase();
  var latestInterest = latestUserInterestForNeed_(currentUsername, need.needId);
  var ownTeamNeed =
    currentUsername &&
    String(need.captainUsername || "").trim().toLowerCase() === currentUsername;

  return Object.assign({}, need, {
    ownTeamNeed: ownTeamNeed,
    myInterestStatus: latestInterest ? latestInterest.status : "",
    myInterestId: latestInterest ? latestInterest.interestId : ""
  });
}

function isPublishedTournamentTeamNeed_(need) {
  if (!need) return false;
  if (normalizeTeamNeedStatus_(need.status) !== "OPEN") return false;
  if (normalizeTeamNeedVisibility_(need.visibility) !== "published") return false;
  if (!truthy_(need.isPublished)) return false;
  if (normalizeTeamNeedContext_(need.needContext) !== "tournament") return false;
  return Boolean(
    String(need.tournamentId || "").trim() ||
      String(need.tournamentName || "").trim()
  );
}

function getMyTeamProfile(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var profile = accessRequestProfileForUser_(context.user);
    var selectedTeam = profile && profile.clubTeamId
      ? getActiveClubTeamById_(profile.clubTeamId)
      : null;
    var username = playerHubUsername_(context.user);
    var canManage = !!(
      selectedTeam &&
      userHasApprovedCaptainForClub_(username, selectedTeam.teamId, selectedTeam.name)
    );
    var teamProfileRow = canManage
      ? findTeamProfileRowByCaptainAndClub_(username, selectedTeam.teamId)
      : null;
    var teamProfile = teamProfileFromRow_(teamProfileRow);

    return {
      success: true,
      canManageTeamProfile: canManage,
      message: canManage
        ? ""
        : selectedTeam
          ? "Captain approval required."
          : "Select a club/team in your player profile first.",
      teamProfile: teamProfile,
      needs: teamProfile ? teamNeedsForProfile_(teamProfile.teamProfileId) : [],
      interests: teamProfile
        ? teamNeedInterestsForNeedIds_(
            teamNeedsForProfile_(teamProfile.teamProfileId).map(function (need) {
              return need.needId;
            })
          ).map(enrichTeamNeedInterestWithPlayerProfile_)
        : []
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team profile"
    };
  }
}

function saveMyTeamProfile(data) {
  try {
    var captainCheck = teamProfileContextForCaptain_(data || {});
    if (!captainCheck.success) return captainCheck;

    var username = playerHubUsername_(captainCheck.context.user);
    var clubTeamId = captainCheck.clubTeam.teamId;
    var existingRow = findTeamProfileRowByCaptainAndClub_(username, clubTeamId);
    var teamProfile = buildTeamProfileForSave_(
      data && data.teamProfile,
      existingRow,
      captainCheck
    );
    writeTeamProfileRow_(teamProfile, existingRow);

    return {
      success: true,
      teamProfile: teamProfile,
      needs: teamNeedsForProfile_(teamProfile.teamProfileId)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not save team profile"
    };
  }
}

function createOrUpdateTeamNeed(data) {
  try {
    var captainCheck = teamProfileContextForCaptain_(data || {});
    if (!captainCheck.success) return captainCheck;

    var username = playerHubUsername_(captainCheck.context.user);
    var existingProfileRow = findTeamProfileRowByCaptainAndClub_(
      username,
      captainCheck.clubTeam.teamId
    );
    var teamProfile = teamProfileFromRow_(existingProfileRow);
    if (!teamProfile) {
      return {
        success: false,
        message: "Create your team profile first."
      };
    }

    var incoming = data && data.need && typeof data.need === "object"
      ? data.need
      : {};
    var existingNeedRow = incoming.needId
      ? findTeamNeedRowById_(incoming.needId)
      : null;
    var existingNeed = teamNeedFromRow_(existingNeedRow);
    if (
      existingNeed &&
      (existingNeed.teamProfileId !== teamProfile.teamProfileId ||
        String(existingNeed.captainUsername || "").trim().toLowerCase() !==
          username.toLowerCase())
    ) {
      return {
        success: false,
        message: "Cannot edit this team need."
      };
    }

    var now = new Date().toISOString();
    var requestedVisibility =
      incoming.visibility !== undefined ||
      incoming.Visibility !== undefined ||
      incoming.isPublished !== undefined ||
      incoming.IsPublished !== undefined
        ? normalizeTeamNeedVisibility_(
            firstValue_(
              incoming.visibility,
              incoming.Visibility,
              truthy_(incoming.isPublished || incoming.IsPublished)
                ? "published"
                : "internal"
            )
          )
        : existingNeed
          ? existingNeed.visibility
          : "internal";
    var requestedContext =
      incoming.needContext !== undefined || incoming.NeedContext !== undefined
        ? normalizeTeamNeedContext_(
            firstValue_(incoming.needContext, incoming.NeedContext)
          )
        : existingNeed
          ? existingNeed.needContext
          : "general";
    var requestedIsPublished =
      requestedVisibility === "published" ||
      truthy_(incoming.isPublished || incoming.IsPublished);
    var tournamentId = String(
      firstValue_(
        incoming.tournamentId,
        incoming.TournamentId,
        existingNeed && existingNeed.tournamentId,
        ""
      )
    ).trim();
    var tournamentName = playerProfileText_(
      firstValue_(
        incoming.tournamentName,
        incoming.TournamentName,
        existingNeed && existingNeed.tournamentName,
        ""
      ),
      180
    );

    if (requestedIsPublished || requestedVisibility === "published") {
      requestedVisibility = "published";
      requestedContext = "tournament";
      if (!tournamentId && !tournamentName) {
        return {
          success: false,
          message: "Select a tournament before publishing a player ad."
        };
      }
    }

    var need = {
      needId:
        (existingNeed && existingNeed.needId) ||
        "team-need-" + Utilities.getUuid(),
      teamProfileId: teamProfile.teamProfileId,
      clubTeamId: teamProfile.clubTeamId,
      clubTeamName: teamProfile.clubTeamName,
      captainUsername: username,
      needType: normalizeTeamNeedType_(incoming.needType),
      needText: playerProfileText_(incoming.needText, 280),
      neededCount: Math.max(1, Math.min(20, Number(incoming.neededCount) || 1)),
      status: normalizeTeamNeedStatus_(incoming.status || "OPEN"),
      visibility: requestedVisibility,
      isPublished: requestedVisibility === "published" && requestedIsPublished,
      needContext: requestedContext,
      tournamentId: tournamentId,
      tournamentName: tournamentName,
      squadLabel: playerProfileText_(
        firstValue_(
          incoming.squadLabel,
          incoming.SquadLabel,
          existingNeed && existingNeed.squadLabel,
          ""
        ),
        80
      ),
      className: playerProfileText_(
        firstValue_(
          incoming.className,
          incoming.ClassName,
          existingNeed && existingNeed.className,
          ""
        ),
        120
      ),
      deadlineAt: playerProfileText_(
        firstValue_(
          incoming.deadlineAt,
          incoming.DeadlineAt,
          existingNeed && existingNeed.deadlineAt,
          ""
        ),
        80
      ),
      sourceType:
        requestedVisibility === "published"
          ? "TOURNAMENT_AD"
          : (existingNeed && existingNeed.sourceType) || "TEAM_NEED",
      publishedAt:
        requestedVisibility === "published"
          ? (existingNeed && existingNeed.publishedAt) || now
          : "",
      publicVisible: existingNeed ? !!existingNeed.publicVisible : false,
      approved: existingNeed ? !!existingNeed.approved : false,
      createdAt: existingNeed && existingNeed.createdAt ? existingNeed.createdAt : now,
      updatedAt: now
    };

    writeTeamNeedRow_(need, existingNeedRow);

    return {
      success: true,
      need: need,
      needs: teamNeedsForProfile_(teamProfile.teamProfileId)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not save team need"
    };
  }
}

function closeTeamNeed(data) {
  try {
    var captainCheck = teamProfileContextForCaptain_(data || {});
    if (!captainCheck.success) return captainCheck;

    var needId = String(data && data.needId || "").trim();
    var row = findTeamNeedRowById_(needId);
    var need = teamNeedFromRow_(row);
    var username = playerHubUsername_(captainCheck.context.user).toLowerCase();
    if (!need || String(need.captainUsername || "").trim().toLowerCase() !== username) {
      return {
        success: false,
        message: "Team need not found"
      };
    }

    need.status = "CLOSED";
    need.updatedAt = new Date().toISOString();
    writeTeamNeedRow_(need, row);

    return {
      success: true,
      need: decorateTeamNeedsWithInterestCounts_([need])[0]
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not close team need"
    };
  }
}

function listVisibleTeamNeeds(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var username = playerHubUsername_(context.user);
    var needs = decorateTeamNeedsWithInterestCounts_(
      teamNeedsRows_()
      .map(teamNeedFromRow_)
      .filter(function (need) {
        return isPublishedTournamentTeamNeed_(need);
      })
    )
      .map(function (need) {
        return safeTeamNeedForListing_(need, username);
      })
      .sort(function (a, b) {
        var aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
        var bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
        return bTime - aTime;
      });

    return {
      success: true,
      needs: needs
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team needs"
    };
  }
}

function createTeamNeedInterest(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var needId = String(data && data.needId || "").trim();
    var row = findTeamNeedRowById_(needId);
    var need = teamNeedFromRow_(row);
    if (!need || need.status !== "OPEN") {
      return {
        success: false,
        message: "Player ad is not open."
      };
    }

    if (!isPublishedTournamentTeamNeed_(need)) {
      return {
        success: false,
        message: "This player ad is not open."
      };
    }

    var username = playerHubUsername_(context.user);
    if (
      String(need.captainUsername || "").trim().toLowerCase() ===
      username.toLowerCase()
    ) {
      return {
        success: false,
        message: "You cannot send interest to your own team need."
      };
    }

    if (userPendingInterestForNeed_(username, need.needId)) {
      return {
        success: false,
        message: "You already have a pending interest for this need."
      };
    }

    var countedNeed = decorateTeamNeedsWithInterestCounts_([need])[0];
    if (countedNeed && countedNeed.remainingCount <= 0) {
      return {
        success: false,
        message: "This team need is filled."
      };
    }

    var profile = accessRequestProfileForUser_(context.user);
    var now = new Date().toISOString();
    var interest = {
      interestId: "team-interest-" + Utilities.getUuid(),
      needId: need.needId,
      teamProfileId: need.teamProfileId,
      clubTeamId: need.clubTeamId,
      clubTeamName: need.clubTeamName,
      playerUsername: username,
      playerDisplayName: playerProfileText_(profile.displayName, 120),
      playerEmail: playerProfileText_(profile.email, 160),
      playerPhone: playerProfileText_(profile.phone, 80),
      playerCountry: playerProfileText_(profile.country, 120),
      message: playerProfileText_(data && data.message, 500),
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
      reviewedBy: "",
      reviewedAt: ""
    };

    writeTeamNeedInterestRow_(interest, null);

    return {
      success: true,
      message: "Interest sent.",
      interest: enrichTeamNeedInterestWithPlayerProfile_(interest)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not send interest"
    };
  }
}

function listMyTeamNeedInterests(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var username = playerHubUsername_(context.user).toLowerCase();
    var interests = teamNeedInterestRows_()
      .map(teamNeedInterestFromRow_)
      .filter(function (interest) {
        return (
          interest &&
          String(interest.playerUsername || "").trim().toLowerCase() === username
        );
      });

    return {
      success: true,
      interests: interests
        .map(enrichTeamNeedInterestWithPlayerProfile_)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team interests"
    };
  }
}

function captainCanManageNeed_(user, need) {
  if (!user || !need) return false;
  var username = playerHubUsername_(user);
  var ownsNeed =
    String(need.captainUsername || "").trim().toLowerCase() ===
    username.toLowerCase();
  var teamProfile = teamProfileFromRow_(
    findTeamProfileRowByCaptainAndClub_(username, need.clubTeamId)
  );
  var ownsTeamProfile =
    teamProfile &&
    String(teamProfile.teamProfileId || "").trim() ===
      String(need.teamProfileId || "").trim();

  if (!ownsNeed && !ownsTeamProfile) {
    return false;
  }
  return userHasApprovedCaptainForClub_(
    username,
    need.clubTeamId,
    need.clubTeamName
  );
}

function captainCanManageTeamProfile_(user, teamProfile) {
  if (!user || !teamProfile) return false;
  var username = playerHubUsername_(user);
  var ownsProfile =
    String(teamProfile.captainUsername || "").trim().toLowerCase() ===
    username.toLowerCase();
  var captainProfile = teamProfileFromRow_(
    findTeamProfileRowByCaptainAndClub_(username, teamProfile.clubTeamId)
  );
  var managesProfile =
    captainProfile &&
    String(captainProfile.teamProfileId || "").trim() ===
      String(teamProfile.teamProfileId || "").trim();

  if (!ownsProfile && !managesProfile) {
    return false;
  }

  return userHasApprovedCaptainForClub_(
    username,
    teamProfile.clubTeamId,
    teamProfile.clubTeamName
  );
}

function listTeamNeedInterestsForCaptain(data) {
  try {
    var captainCheck = teamProfileContextForCaptain_(data || {});
    if (!captainCheck.success) return captainCheck;

    var requestedNeedId = String(data && data.needId || "").trim();
    if (requestedNeedId) {
      var requestedNeed = teamNeedFromRow_(findTeamNeedRowById_(requestedNeedId));
      if (!requestedNeed) {
        return {
          success: true,
          interests: []
        };
      }
      if (!captainCanManageNeed_(captainCheck.context.user, requestedNeed)) {
        return {
          success: false,
          message: "Captain access required."
        };
      }

      return {
        success: true,
        interests: teamNeedInterestsForNeedIds_([requestedNeed.needId]).map(
          enrichTeamNeedInterestWithPlayerProfile_
        )
      };
    }

    var username = playerHubUsername_(captainCheck.context.user).toLowerCase();
    var teamProfile = teamProfileFromRow_(
      findTeamProfileRowByCaptainAndClub_(username, captainCheck.clubTeam.teamId)
    );
    if (!teamProfile) {
      return {
        success: true,
        interests: []
      };
    }

    var myNeedIds = {};
    teamNeedsForProfile_(teamProfile.teamProfileId).forEach(function (need) {
      myNeedIds[need.needId] = true;
    });

    var interests = teamNeedInterestsForNeedIds_(Object.keys(myNeedIds));

    return {
      success: true,
      interests: interests.map(enrichTeamNeedInterestWithPlayerProfile_)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team need interests"
    };
  }
}

function reviewTeamNeedInterest(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var interestId = String(data && data.interestId || "").trim();
    var nextStatus = normalizeTeamNeedInterestStatus_(data && data.status);
    if (nextStatus !== "ACCEPTED" && nextStatus !== "DECLINED") {
      return {
        success: false,
        message: "Interest must be accepted or declined."
      };
    }

    var row = findTeamNeedInterestRowById_(interestId);
    var interest = teamNeedInterestFromRow_(row);
    var needRow = interest ? findTeamNeedRowById_(interest.needId) : null;
    var need = teamNeedFromRow_(needRow);
    if (!interest || !need || !captainCanManageNeed_(context.user, need)) {
      return {
        success: false,
        message: "Captain access required."
      };
    }

    var now = new Date().toISOString();
    interest.status = nextStatus;
    interest.updatedAt = now;
    interest.reviewedBy = playerHubUsername_(context.user);
    interest.reviewedAt = now;
    writeTeamNeedInterestRow_(interest, row);

    return {
      success: true,
      interest: enrichTeamNeedInterestWithPlayerProfile_(interest),
      need: decorateTeamNeedsWithInterestCounts_([need])[0],
      interests: teamNeedInterestsForNeedIds_([need.needId]).map(
        enrichTeamNeedInterestWithPlayerProfile_
      )
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not review interest"
    };
  }
}

function listTeamNeedInterestsAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    return {
      success: true,
      interests: teamNeedInterestRows_()
        .map(teamNeedInterestFromRow_)
        .filter(Boolean)
        .map(enrichTeamNeedInterestWithPlayerProfile_)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team need interests"
    };
  }
}

function teamMembersForProfile_(teamProfileId, activeOnly) {
  var target = String(teamProfileId || "").trim();
  if (!target) return [];

  return teamMemberRows_()
    .map(teamMemberFromRow_)
    .filter(function (member) {
      return (
        member &&
        member.teamProfileId === target &&
        (!activeOnly || member.memberStatus === "ACTIVE")
      );
    })
    .map(enrichTeamMemberWithPlayerProfile_)
    .sort(function (a, b) {
      var aTime = Date.parse(a.updatedAt || a.confirmedAt || a.createdAt || "") || 0;
      var bTime = Date.parse(b.updatedAt || b.confirmedAt || b.createdAt || "") || 0;
      return bTime - aTime;
    });
}

function teamMembersForPlayer_(username, activeOnly) {
  var targetUsername = String(username || "").trim().toLowerCase();
  if (!targetUsername) return [];

  return teamMemberRows_()
    .map(teamMemberFromRow_)
    .filter(function (member) {
      return (
        member &&
        String(member.playerUsername || "").trim().toLowerCase() === targetUsername &&
        (!activeOnly || member.memberStatus === "ACTIVE")
      );
    })
    .map(enrichTeamMemberWithPlayerProfile_)
    .sort(function (a, b) {
      var aTime = Date.parse(a.updatedAt || a.confirmedAt || a.createdAt || "") || 0;
      var bTime = Date.parse(b.updatedAt || b.confirmedAt || b.createdAt || "") || 0;
      return bTime - aTime;
    });
}

function addTeamMemberFromInterest(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var interestId = String(data && data.interestId || "").trim();
    var interestRow = findTeamNeedInterestRowById_(interestId);
    var interest = teamNeedInterestFromRow_(interestRow);
    var need = interest ? teamNeedFromRow_(findTeamNeedRowById_(interest.needId)) : null;
    var teamProfile = need
      ? teamProfileFromRow_(findTeamProfileRowById_(need.teamProfileId))
      : null;

    if (!interest || !need || !teamProfile) {
      return {
        success: false,
        message: "Accepted interest not found."
      };
    }

    if (interest.status !== "ACCEPTED") {
      return {
        success: false,
        message: "Interest must be accepted first."
      };
    }

    if (!captainCanManageNeed_(context.user, need)) {
      return {
        success: false,
        message: "Captain access required."
      };
    }

    var existingActiveRow = findActiveTeamMemberRow_(
      teamProfile.teamProfileId,
      interest.playerUsername
    );
    if (existingActiveRow) {
      var existingMember = teamMemberFromRow_(existingActiveRow);
      return {
        success: true,
        message: "Player is already a team member.",
        member: enrichTeamMemberWithPlayerProfile_(existingMember),
        members: teamMembersForProfile_(teamProfile.teamProfileId, true)
      };
    }

    var profileRow = findPlayerProfileRowByUsername_(interest.playerUsername);
    var playerProfile = playerProfileFromRow_(profileRow, {
      username: interest.playerUsername
    });
    var now = new Date().toISOString();
    var member = {
      teamMemberId: "team-member-" + Utilities.getUuid(),
      teamProfileId: teamProfile.teamProfileId,
      clubTeamId: teamProfile.clubTeamId,
      clubTeamName: teamProfile.clubTeamName,
      captainUsername: teamProfile.captainUsername,
      playerUsername: interest.playerUsername,
      playerDisplayName:
        playerProfileText_(interest.playerDisplayName, 120) ||
        playerProfileText_(playerProfile.displayName, 120),
      playerEmail:
        playerProfileText_(interest.playerEmail, 160) ||
        playerProfileText_(playerProfile.email, 160),
      playerPhone:
        playerProfileText_(interest.playerPhone, 80) ||
        playerProfileText_(playerProfile.phone, 80),
      playerCountry:
        playerProfileText_(interest.playerCountry, 120) ||
        playerProfileText_(playerProfile.country, 120),
      sourceInterestId: interest.interestId,
      memberStatus: "ACTIVE",
      confirmedBy: playerHubUsername_(context.user),
      confirmedAt: now,
      createdAt: now,
      updatedAt: now
    };

    writeTeamMemberRow_(member, null);

    return {
      success: true,
      message: "Player added to team.",
      member: enrichTeamMemberWithPlayerProfile_(member),
      members: teamMembersForProfile_(teamProfile.teamProfileId, true)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not add team member"
    };
  }
}

function listMyTeamMembersForCaptain(data) {
  try {
    var captainCheck = teamProfileContextForCaptain_(data || {});
    if (!captainCheck.success) return captainCheck;

    var username = playerHubUsername_(captainCheck.context.user);
    var teamProfile = teamProfileFromRow_(
      findTeamProfileRowByCaptainAndClub_(username, captainCheck.clubTeam.teamId)
    );

    return {
      success: true,
      members: teamProfile
        ? teamMembersForProfile_(teamProfile.teamProfileId, true)
        : []
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team members"
    };
  }
}

function listMyConfirmedTeamsForPlayer(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    return {
      success: true,
      teams: teamMembersForPlayer_(playerHubUsername_(context.user), true)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load confirmed teams"
    };
  }
}

function removeTeamMember(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var teamMemberId = String(data && data.teamMemberId || "").trim();
    var row = findTeamMemberRowById_(teamMemberId);
    var member = teamMemberFromRow_(row);
    var teamProfile = member
      ? teamProfileFromRow_(findTeamProfileRowById_(member.teamProfileId))
      : null;

    if (!member || !teamProfile) {
      return {
        success: false,
        message: "Team member not found"
      };
    }

    var userIsAdmin = isAdminUser_(context.user);
    if (!userIsAdmin && !captainCanManageTeamProfile_(context.user, teamProfile)) {
      return {
        success: false,
        message: "Captain access required."
      };
    }

    var requestedStatus = normalizeTeamMemberStatus_(data && data.memberStatus);
    member.memberStatus = userIsAdmin && requestedStatus === "ARCHIVED"
      ? "ARCHIVED"
      : "REMOVED";
    member.updatedAt = new Date().toISOString();
    writeTeamMemberRow_(member, row);

    return {
      success: true,
      message: member.memberStatus === "ARCHIVED"
        ? "Team member archived."
        : "Team member removed.",
      member: enrichTeamMemberWithPlayerProfile_(member),
      members: teamMembersForProfile_(teamProfile.teamProfileId, true)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not remove team member"
    };
  }
}

function listTeamMembersAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    return {
      success: true,
      members: teamMemberRows_()
        .map(teamMemberFromRow_)
        .filter(Boolean)
        .map(enrichTeamMemberWithPlayerProfile_)
        .sort(function (a, b) {
          var aTime = Date.parse(a.updatedAt || a.confirmedAt || a.createdAt || "") || 0;
          var bTime = Date.parse(b.updatedAt || b.confirmedAt || b.createdAt || "") || 0;
          return bTime - aTime;
        })
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team members"
    };
  }
}

function sortTeamMembershipRequests_(requests) {
  return (requests || []).sort(function (a, b) {
    var aTime = Date.parse(a.updatedAt || a.requestedAt || a.createdAt || "") || 0;
    var bTime = Date.parse(b.updatedAt || b.requestedAt || b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

function buildTeamMembershipRequestForProfile_(profile, existingRow) {
  var now = new Date().toISOString();
  var existing = teamMembershipRequestFromRow_(existingRow);
  return {
    requestId:
      (existing && existing.requestId) ||
      "team-membership-" + Utilities.getUuid(),
    clubTeamId: profile.clubTeamId || "",
    clubTeamName: profile.clubTeamName || "",
    playerUsername: profile.username || "",
    playerDisplayName: playerProfileText_(profile.displayName, 120),
    playerEmail: playerProfileText_(profile.email, 160),
    playerPhone: playerProfileText_(profile.phone, 80),
    playerCountry: playerProfileText_(profile.country, 120),
    playerProfileId: profile.profileId || "",
    status: "PENDING",
    requestedAt:
      existing && existing.requestedAt ? existing.requestedAt : now,
    reviewedBy: "",
    reviewedAt: "",
    reviewNote: "",
    createdAt: existing && existing.createdAt ? existing.createdAt : now,
    updatedAt: now
  };
}

function syncTeamMembershipRequestForProfile_(user, profile) {
  var username = playerHubUsername_(user);
  var selectedClubTeamId = String((profile && profile.clubTeamId) || "").trim();

  if (!profile || profile.freeAgent || !selectedClubTeamId) {
    cancelPendingTeamMembershipRequests_(username, "");
    return null;
  }

  var selectedTeam = getActiveClubTeamById_(selectedClubTeamId);
  if (!selectedTeam) {
    cancelPendingTeamMembershipRequests_(username, "");
    return null;
  }

  cancelPendingTeamMembershipRequests_(username, selectedTeam.teamId);

  var existingPendingRow = pendingTeamMembershipRequestRow_(
    username,
    selectedTeam.teamId
  );

  if (findActiveTeamMemberForClubRow_(selectedTeam.teamId, username)) {
    if (existingPendingRow) {
      var confirmedRequest = teamMembershipRequestFromRow_(existingPendingRow);
      confirmedRequest.status = "APPROVED";
      confirmedRequest.reviewedBy = confirmedRequest.reviewedBy || "system";
      confirmedRequest.reviewedAt =
        confirmedRequest.reviewedAt || new Date().toISOString();
      confirmedRequest.updatedAt = new Date().toISOString();
      writeTeamMembershipRequestRow_(confirmedRequest, existingPendingRow);
      return enrichTeamMembershipRequestWithProfile_(confirmedRequest);
    }
    return null;
  }

  var request = buildTeamMembershipRequestForProfile_(
    Object.assign({}, profile, {
      clubTeamId: selectedTeam.teamId,
      clubTeamName: selectedTeam.name
    }),
    existingPendingRow
  );
  writeTeamMembershipRequestRow_(request, existingPendingRow);
  return enrichTeamMembershipRequestWithProfile_(request);
}

function createOrUpdateTeamMembershipRequest(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var profile = accessRequestProfileForUser_(context.user);
    var incomingClubTeamId = String(data && data.clubTeamId || "").trim();
    if (incomingClubTeamId) {
      var selectedTeam = getActiveClubTeamById_(incomingClubTeamId);
      if (!selectedTeam) {
        return {
          success: false,
          message: "Selected club/team is no longer active."
        };
      }
      profile.clubTeamId = selectedTeam.teamId;
      profile.clubTeamName = selectedTeam.name;
      profile.freeAgent = false;
    }

    var request = syncTeamMembershipRequestForProfile_(context.user, profile);
    return {
      success: true,
      request: request,
      requests: teamMembershipRequestsForPlayer_(
        playerHubUsername_(context.user)
      )
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not create team membership request"
    };
  }
}

function teamMembershipRequestsForPlayer_(username) {
  var targetUsername = String(username || "").trim().toLowerCase();
  if (!targetUsername) return [];

  return sortTeamMembershipRequests_(
    teamMembershipRequestRows_()
      .map(teamMembershipRequestFromRow_)
      .filter(function (request) {
        return (
          request &&
          String(request.playerUsername || "").trim().toLowerCase() ===
            targetUsername
        );
      })
      .map(enrichTeamMembershipRequestWithProfile_)
  );
}

function listMyTeamMembershipRequests(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    return {
      success: true,
      requests: teamMembershipRequestsForPlayer_(playerHubUsername_(context.user))
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team membership requests"
    };
  }
}

function listMembershipRequestsForCaptain(data) {
  try {
    var captainCheck = teamProfileContextForCaptain_(data || {});
    if (!captainCheck.success) return captainCheck;

    var clubTeamId = captainCheck.clubTeam.teamId;
    var requests = teamMembershipRequestRows_()
      .map(teamMembershipRequestFromRow_)
      .filter(function (request) {
        return request && request.clubTeamId === clubTeamId;
      })
      .map(enrichTeamMembershipRequestWithProfile_);

    return {
      success: true,
      requests: sortTeamMembershipRequests_(requests)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load membership requests"
    };
  }
}

function teamMemberFromMembershipRequest_(request, teamProfile, user) {
  var now = new Date().toISOString();
  return {
    teamMemberId: "team-member-" + Utilities.getUuid(),
    teamProfileId: teamProfile.teamProfileId,
    clubTeamId: teamProfile.clubTeamId,
    clubTeamName: teamProfile.clubTeamName,
    captainUsername: teamProfile.captainUsername,
    playerUsername: request.playerUsername,
    playerDisplayName: playerProfileText_(request.playerDisplayName, 120),
    playerEmail: playerProfileText_(request.playerEmail, 160),
    playerPhone: playerProfileText_(request.playerPhone, 80),
    playerCountry: playerProfileText_(request.playerCountry, 120),
    sourceInterestId: "PROFILE_REQUEST",
    memberStatus: "ACTIVE",
    confirmedBy: playerHubUsername_(user),
    confirmedAt: now,
    createdAt: now,
    updatedAt: now
  };
}

function reviewTeamMembershipRequest(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var requestId = String(data && data.requestId || "").trim();
    var nextStatus = normalizeTeamMembershipRequestStatus_(data && data.status);
    if (nextStatus !== "APPROVED" && nextStatus !== "REJECTED") {
      return {
        success: false,
        message: "Request must be approved or rejected."
      };
    }

    var row = findTeamMembershipRequestRowById_(requestId);
    var request = teamMembershipRequestFromRow_(row);
    if (!request) {
      return {
        success: false,
        message: "Membership request not found"
      };
    }

    if (
      !userHasApprovedCaptainForClub_(
        playerHubUsername_(context.user),
        request.clubTeamId,
        request.clubTeamName
      )
    ) {
      return {
        success: false,
        message: "Captain access required."
      };
    }

    var member = null;
    if (nextStatus === "APPROVED") {
      var username = playerHubUsername_(context.user);
      var teamProfile = teamProfileFromRow_(
        findTeamProfileRowByCaptainAndClub_(username, request.clubTeamId)
      );
      if (!teamProfile) {
        return {
          success: false,
          message: "Create your team profile first."
        };
      }

      var existingActiveRow = findActiveTeamMemberForClubRow_(
        request.clubTeamId,
        request.playerUsername
      );
      if (existingActiveRow) {
        member = teamMemberFromRow_(existingActiveRow);
      } else {
        member = teamMemberFromMembershipRequest_(request, teamProfile, context.user);
        writeTeamMemberRow_(member, null);
      }
    }

    var now = new Date().toISOString();
    request.status = nextStatus;
    request.reviewedBy = playerHubUsername_(context.user);
    request.reviewedAt = now;
    request.reviewNote = playerProfileText_(data && data.reviewNote, 240);
    request.updatedAt = now;
    writeTeamMembershipRequestRow_(request, row);

    return {
      success: true,
      request: enrichTeamMembershipRequestWithProfile_(request),
      member: member ? enrichTeamMemberWithPlayerProfile_(member) : null,
      requests: listMembershipRequestsForCaptain(data).requests || []
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not review membership request"
    };
  }
}

function cancelMyTeamMembershipRequest(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var requestId = String(data && data.requestId || "").trim();
    var row = findTeamMembershipRequestRowById_(requestId);
    var request = teamMembershipRequestFromRow_(row);
    var username = playerHubUsername_(context.user).toLowerCase();
    if (
      !request ||
      String(request.playerUsername || "").trim().toLowerCase() !== username
    ) {
      return {
        success: false,
        message: "Membership request not found"
      };
    }

    if (request.status === "PENDING") {
      request.status = "CANCELLED";
      request.updatedAt = new Date().toISOString();
      writeTeamMembershipRequestRow_(request, row);
    }

    return {
      success: true,
      request: enrichTeamMembershipRequestWithProfile_(request),
      requests: teamMembershipRequestsForPlayer_(username)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not cancel membership request"
    };
  }
}

function listTeamMembershipRequestsAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    return {
      success: true,
      requests: sortTeamMembershipRequests_(
        teamMembershipRequestRows_()
          .map(teamMembershipRequestFromRow_)
          .filter(Boolean)
          .map(enrichTeamMembershipRequestWithProfile_)
      )
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team membership requests"
    };
  }
}

/* =========================
   PLAYER & TEAM HUB TOURNAMENT AVAILABILITY
   Planning beta only, not roster/history
   ========================= */

var TOURNAMENT_TEAM_PLANS_SHEET_ = "TournamentTeamPlans";
var TOURNAMENT_TEAM_PLAN_HEADERS_ = [
  "PlanId",
  "TournamentId",
  "TournamentName",
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "CaptainUsername",
  "SquadLabel",
  "ClassName",
  "PlanStatus",
  "DeadlineAt",
  "Note",
  "CreatedAt",
  "UpdatedAt"
];

var TOURNAMENT_AVAILABILITY_SHEET_ = "TournamentAvailability";
var TOURNAMENT_AVAILABILITY_HEADERS_ = [
  "AvailabilityId",
  "PlanId",
  "TournamentId",
  "TournamentName",
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "PlayerUsername",
  "PlayerDisplayName",
  "PlayerEmail",
  "PlayerPhone",
  "PlayerCountry",
  "ResponseStatus",
  "PreferredSquad",
  "PlayerNote",
  "RequestedBy",
  "RequestedAt",
  "RespondedAt",
  "CreatedAt",
  "UpdatedAt"
];

var TOURNAMENT_SQUAD_PLANNING_SHEET_ = "TournamentSquadPlanning";
var TOURNAMENT_SQUAD_PLANNING_HEADERS_ = [
  "PlanningId",
  "PlanId",
  "TournamentId",
  "TournamentName",
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "PlayerUsername",
  "PlayerDisplayName",
  "PlayerCountry",
  "AvailabilityStatus",
  "PreferredSquad",
  "AssignedSquad",
  "PlanningStatus",
  "AssignedBy",
  "AssignedAt",
  "CreatedAt",
  "UpdatedAt"
];

var TOURNAMENT_ROSTERS_SHEET_ = "TournamentRosters";
var TOURNAMENT_ROSTER_HEADERS_ = [
  "RosterId",
  "PlanId",
  "TournamentId",
  "TournamentName",
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "SquadLabel",
  "CaptainUsername",
  "RosterStatus",
  "SubmittedBy",
  "SubmittedAt",
  "ReviewedBy",
  "ReviewedAt",
  "AdminNote",
  "LockedAt",
  "LockedBy",
  "LockReason",
  "CreatedAt",
  "UpdatedAt"
];

var TOURNAMENT_ROSTER_PLAYERS_SHEET_ = "TournamentRosterPlayers";
var TOURNAMENT_ROSTER_PLAYER_HEADERS_ = [
  "RosterPlayerId",
  "RosterId",
  "PlanId",
  "TournamentId",
  "TournamentName",
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "SquadLabel",
  "PlayerUsername",
  "PlayerDisplayName",
  "PlayerCountry",
  "AssignedSquad",
  "RosterRole",
  "Source",
  "PlayerStatus",
  "AddedBy",
  "AddedAt",
  "CreatedAt",
  "UpdatedAt"
];

var OFFICIAL_ROSTERS_SHEET_ = "OfficialRosters";
var OFFICIAL_ROSTER_HEADERS_ = [
  "OfficialRosterId",
  "DraftId",
  "TournamentId",
  "TournamentName",
  "TeamId",
  "TeamName",
  "SquadLabel",
  "GroupName",
  "PlayerUsername",
  "PlayerDisplayName",
  "PlayerCountry",
  "Status",
  "LockedAt",
  "LockedBy",
  "CreatedAt"
];

var TEAM_EVENT_COMMENTS_SHEET_ = "TeamEventComments";
var TEAM_EVENT_COMMENT_HEADERS_ = [
  "CommentId",
  "PlanId",
  "TeamProfileId",
  "ClubTeamId",
  "ClubTeamName",
  "Username",
  "DisplayName",
  "Message",
  "CreatedAt",
  "UpdatedAt",
  "Active"
];

function getTournamentTeamPlansSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TOURNAMENT_TEAM_PLANS_SHEET_,
    TOURNAMENT_TEAM_PLAN_HEADERS_
  );
}

function getTournamentAvailabilitySheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TOURNAMENT_AVAILABILITY_SHEET_,
    TOURNAMENT_AVAILABILITY_HEADERS_
  );
}

function getTournamentSquadPlanningSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TOURNAMENT_SQUAD_PLANNING_SHEET_,
    TOURNAMENT_SQUAD_PLANNING_HEADERS_
  );
}

function getTournamentRostersSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TOURNAMENT_ROSTERS_SHEET_,
    TOURNAMENT_ROSTER_HEADERS_
  );
}

function getTournamentRosterPlayersSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TOURNAMENT_ROSTER_PLAYERS_SHEET_,
    TOURNAMENT_ROSTER_PLAYER_HEADERS_
  );
}

function getOfficialRostersSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    OFFICIAL_ROSTERS_SHEET_,
    OFFICIAL_ROSTER_HEADERS_
  );
}

function getTeamEventCommentsSheet_() {
  return ensureSheetWithHeaders_(
    getMainSpreadsheet(),
    TEAM_EVENT_COMMENTS_SHEET_,
    TEAM_EVENT_COMMENT_HEADERS_
  );
}

function normalizeTournamentPlanStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "DRAFT" || text === "READY" || text === "CANCELLED") {
    return text;
  }
  return "INVITING";
}

function normalizeTournamentAvailabilityStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "YES" || text === "NO" || text === "MAYBE") return text;
  return "PENDING";
}

function normalizePreferredSquad_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "A" || text === "B" || text === "C" || text === "RESERVE") return text;
  return "NO_PREFERENCE";
}

function normalizeAssignedSquad_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "A" || text === "B" || text === "C" || text === "RESERVE") {
    return text;
  }
  return "UNASSIGNED";
}

function normalizeTournamentSquadPlanningStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (text === "REMOVED") return "REMOVED";
  return "PLANNED";
}

function normalizeTournamentRosterStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  if (
    text === "SUBMITTED" ||
    text === "APPROVED" ||
    text === "REJECTED" ||
    text === "LOCKED" ||
    text === "CHANGE_REQUESTED" ||
    text === "CANCELLED"
  ) {
    return text;
  }
  return "DRAFT";
}

function normalizeTournamentRosterRole_(value) {
  var text = String(value || "").trim().toUpperCase();
  return text === "RESERVE" ? "RESERVE" : "PLAYER";
}

function normalizeTournamentRosterSource_(value) {
  var text = String(value || "").trim().toUpperCase();
  return text === "MANUAL_LATER" ? "MANUAL_LATER" : "SQUAD_PLANNING";
}

function normalizeTournamentRosterPlayerStatus_(value) {
  var text = String(value || "").trim().toUpperCase();
  return text === "REMOVED" ? "REMOVED" : "ACTIVE";
}

function tournamentTeamPlanRows_() {
  var sheet = getTournamentTeamPlansSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TOURNAMENT_TEAM_PLAN_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function tournamentAvailabilityRows_() {
  var sheet = getTournamentAvailabilitySheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TOURNAMENT_AVAILABILITY_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function tournamentSquadPlanningRows_() {
  var sheet = getTournamentSquadPlanningSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TOURNAMENT_SQUAD_PLANNING_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function tournamentRosterRows_() {
  var sheet = getTournamentRostersSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TOURNAMENT_ROSTER_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function tournamentRosterPlayerRows_() {
  var sheet = getTournamentRosterPlayersSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(
    sheet.getLastColumn(),
    TOURNAMENT_ROSTER_PLAYER_HEADERS_.length
  );
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function officialRosterRows_() {
  var sheet = getOfficialRostersSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), OFFICIAL_ROSTER_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function teamEventCommentRows_() {
  var sheet = getTeamEventCommentsSheet_();
  if (sheet.getLastRow() < 2) return [];

  var lastCol = Math.max(sheet.getLastColumn(), TEAM_EVENT_COMMENT_HEADERS_.length);
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
}

function tournamentTeamPlanFromRow_(row) {
  if (!row) return null;
  return {
    planId: String(row.PlanId || "").trim(),
    tournamentId: String(row.TournamentId || "").trim(),
    tournamentName: String(row.TournamentName || "").trim(),
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    captainUsername: String(row.CaptainUsername || "").trim(),
    squadLabel: String(row.SquadLabel || "").trim(),
    className: String(row.ClassName || "").trim(),
    planStatus: normalizeTournamentPlanStatus_(row.PlanStatus),
    deadlineAt: String(row.DeadlineAt || "").trim(),
    note: String(row.Note || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function tournamentAvailabilityFromRow_(row) {
  if (!row) return null;
  return {
    availabilityId: String(row.AvailabilityId || "").trim(),
    planId: String(row.PlanId || "").trim(),
    tournamentId: String(row.TournamentId || "").trim(),
    tournamentName: String(row.TournamentName || "").trim(),
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    playerUsername: String(row.PlayerUsername || "").trim(),
    playerDisplayName: String(row.PlayerDisplayName || "").trim(),
    playerEmail: String(row.PlayerEmail || "").trim(),
    playerPhone: String(row.PlayerPhone || "").trim(),
    playerCountry: String(row.PlayerCountry || "").trim(),
    responseStatus: normalizeTournamentAvailabilityStatus_(row.ResponseStatus),
    preferredSquad: normalizePreferredSquad_(row.PreferredSquad),
    playerNote: String(row.PlayerNote || "").trim(),
    requestedBy: String(row.RequestedBy || "").trim(),
    requestedAt: String(row.RequestedAt || "").trim(),
    respondedAt: String(row.RespondedAt || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function tournamentSquadPlanningFromRow_(row) {
  if (!row) return null;
  return {
    planningId: String(row.PlanningId || "").trim(),
    planId: String(row.PlanId || "").trim(),
    tournamentId: String(row.TournamentId || "").trim(),
    tournamentName: String(row.TournamentName || "").trim(),
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    playerUsername: String(row.PlayerUsername || "").trim(),
    playerDisplayName: String(row.PlayerDisplayName || "").trim(),
    playerCountry: String(row.PlayerCountry || "").trim(),
    availabilityStatus: normalizeTournamentAvailabilityStatus_(row.AvailabilityStatus),
    preferredSquad: normalizePreferredSquad_(row.PreferredSquad),
    assignedSquad: normalizeAssignedSquad_(row.AssignedSquad),
    planningStatus: normalizeTournamentSquadPlanningStatus_(row.PlanningStatus),
    assignedBy: String(row.AssignedBy || "").trim(),
    assignedAt: String(row.AssignedAt || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function tournamentRosterFromRow_(row) {
  if (!row) return null;
  return {
    rosterId: String(row.RosterId || "").trim(),
    planId: String(row.PlanId || "").trim(),
    tournamentId: String(row.TournamentId || "").trim(),
    tournamentName: String(row.TournamentName || "").trim(),
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    squadLabel: String(row.SquadLabel || "").trim(),
    captainUsername: String(row.CaptainUsername || "").trim(),
    rosterStatus: normalizeTournamentRosterStatus_(row.RosterStatus),
    submittedBy: String(row.SubmittedBy || "").trim(),
    submittedAt: String(row.SubmittedAt || "").trim(),
    reviewedBy: String(row.ReviewedBy || "").trim(),
    reviewedAt: String(row.ReviewedAt || "").trim(),
    adminNote: String(row.AdminNote || "").trim(),
    lockedAt: String(row.LockedAt || "").trim(),
    lockedBy: String(row.LockedBy || "").trim(),
    lockReason: String(row.LockReason || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function tournamentRosterPlayerFromRow_(row) {
  if (!row) return null;
  return {
    rosterPlayerId: String(row.RosterPlayerId || "").trim(),
    rosterId: String(row.RosterId || "").trim(),
    planId: String(row.PlanId || "").trim(),
    tournamentId: String(row.TournamentId || "").trim(),
    tournamentName: String(row.TournamentName || "").trim(),
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    squadLabel: String(row.SquadLabel || "").trim(),
    playerUsername: String(row.PlayerUsername || "").trim(),
    playerDisplayName: String(row.PlayerDisplayName || "").trim(),
    playerCountry: String(row.PlayerCountry || "").trim(),
    assignedSquad: normalizeAssignedSquad_(row.AssignedSquad),
    rosterRole: normalizeTournamentRosterRole_(row.RosterRole),
    source: normalizeTournamentRosterSource_(row.Source),
    playerStatus: normalizeTournamentRosterPlayerStatus_(row.PlayerStatus),
    addedBy: String(row.AddedBy || "").trim(),
    addedAt: String(row.AddedAt || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim()
  };
}

function officialRosterFromRow_(row) {
  if (!row) return null;
  return {
    officialRosterId: String(row.OfficialRosterId || "").trim(),
    draftId: String(row.DraftId || "").trim(),
    tournamentId: String(row.TournamentId || "").trim(),
    tournamentName: String(row.TournamentName || "").trim(),
    teamId: String(row.TeamId || "").trim(),
    teamName: String(row.TeamName || "").trim(),
    squadLabel: String(row.SquadLabel || "").trim(),
    groupName: String(row.GroupName || "").trim(),
    playerUsername: String(row.PlayerUsername || "").trim(),
    playerDisplayName: String(row.PlayerDisplayName || "").trim(),
    playerCountry: String(row.PlayerCountry || "").trim(),
    status: String(row.Status || "LOCKED").trim().toUpperCase() || "LOCKED",
    lockedAt: String(row.LockedAt || "").trim(),
    lockedBy: String(row.LockedBy || "").trim(),
    createdAt: String(row.CreatedAt || "").trim()
  };
}

function teamEventCommentFromRow_(row) {
  if (!row) return null;
  return {
    commentId: String(row.CommentId || "").trim(),
    planId: String(row.PlanId || "").trim(),
    teamProfileId: String(row.TeamProfileId || "").trim(),
    clubTeamId: String(row.ClubTeamId || "").trim(),
    clubTeamName: String(row.ClubTeamName || "").trim(),
    username: String(row.Username || "").trim(),
    displayName: String(row.DisplayName || "").trim(),
    message: String(row.Message || "").trim(),
    createdAt: String(row.CreatedAt || "").trim(),
    updatedAt: String(row.UpdatedAt || "").trim(),
    active: row.Active === "" || row.Active === undefined ? true : truthy_(row.Active)
  };
}

function tournamentTeamPlanColumnValue_(header, plan) {
  if (header === "PlanId") return plan.planId || "";
  if (header === "TournamentId") return plan.tournamentId || "";
  if (header === "TournamentName") return plan.tournamentName || "";
  if (header === "TeamProfileId") return plan.teamProfileId || "";
  if (header === "ClubTeamId") return plan.clubTeamId || "";
  if (header === "ClubTeamName") return plan.clubTeamName || "";
  if (header === "CaptainUsername") return plan.captainUsername || "";
  if (header === "SquadLabel") return plan.squadLabel || "";
  if (header === "ClassName") return plan.className || "";
  if (header === "PlanStatus") return plan.planStatus || "INVITING";
  if (header === "DeadlineAt") return plan.deadlineAt || "";
  if (header === "Note") return plan.note || "";
  if (header === "CreatedAt") return plan.createdAt || "";
  if (header === "UpdatedAt") return plan.updatedAt || "";
  return "";
}

function tournamentAvailabilityColumnValue_(header, availability) {
  if (header === "AvailabilityId") return availability.availabilityId || "";
  if (header === "PlanId") return availability.planId || "";
  if (header === "TournamentId") return availability.tournamentId || "";
  if (header === "TournamentName") return availability.tournamentName || "";
  if (header === "TeamProfileId") return availability.teamProfileId || "";
  if (header === "ClubTeamId") return availability.clubTeamId || "";
  if (header === "ClubTeamName") return availability.clubTeamName || "";
  if (header === "PlayerUsername") return availability.playerUsername || "";
  if (header === "PlayerDisplayName") return availability.playerDisplayName || "";
  if (header === "PlayerEmail") return availability.playerEmail || "";
  if (header === "PlayerPhone") return availability.playerPhone || "";
  if (header === "PlayerCountry") return availability.playerCountry || "";
  if (header === "ResponseStatus") return availability.responseStatus || "PENDING";
  if (header === "PreferredSquad") return availability.preferredSquad || "NO_PREFERENCE";
  if (header === "PlayerNote") return availability.playerNote || "";
  if (header === "RequestedBy") return availability.requestedBy || "";
  if (header === "RequestedAt") return availability.requestedAt || "";
  if (header === "RespondedAt") return availability.respondedAt || "";
  if (header === "CreatedAt") return availability.createdAt || "";
  if (header === "UpdatedAt") return availability.updatedAt || "";
  return "";
}

function tournamentSquadPlanningColumnValue_(header, planning) {
  if (header === "PlanningId") return planning.planningId || "";
  if (header === "PlanId") return planning.planId || "";
  if (header === "TournamentId") return planning.tournamentId || "";
  if (header === "TournamentName") return planning.tournamentName || "";
  if (header === "TeamProfileId") return planning.teamProfileId || "";
  if (header === "ClubTeamId") return planning.clubTeamId || "";
  if (header === "ClubTeamName") return planning.clubTeamName || "";
  if (header === "PlayerUsername") return planning.playerUsername || "";
  if (header === "PlayerDisplayName") return planning.playerDisplayName || "";
  if (header === "PlayerCountry") return planning.playerCountry || "";
  if (header === "AvailabilityStatus") return planning.availabilityStatus || "PENDING";
  if (header === "PreferredSquad") return planning.preferredSquad || "NO_PREFERENCE";
  if (header === "AssignedSquad") return planning.assignedSquad || "UNASSIGNED";
  if (header === "PlanningStatus") return planning.planningStatus || "PLANNED";
  if (header === "AssignedBy") return planning.assignedBy || "";
  if (header === "AssignedAt") return planning.assignedAt || "";
  if (header === "CreatedAt") return planning.createdAt || "";
  if (header === "UpdatedAt") return planning.updatedAt || "";
  return "";
}

function tournamentRosterColumnValue_(header, roster) {
  if (header === "RosterId") return roster.rosterId || "";
  if (header === "PlanId") return roster.planId || "";
  if (header === "TournamentId") return roster.tournamentId || "";
  if (header === "TournamentName") return roster.tournamentName || "";
  if (header === "TeamProfileId") return roster.teamProfileId || "";
  if (header === "ClubTeamId") return roster.clubTeamId || "";
  if (header === "ClubTeamName") return roster.clubTeamName || "";
  if (header === "SquadLabel") return roster.squadLabel || "";
  if (header === "CaptainUsername") return roster.captainUsername || "";
  if (header === "RosterStatus") return roster.rosterStatus || "DRAFT";
  if (header === "SubmittedBy") return roster.submittedBy || "";
  if (header === "SubmittedAt") return roster.submittedAt || "";
  if (header === "ReviewedBy") return roster.reviewedBy || "";
  if (header === "ReviewedAt") return roster.reviewedAt || "";
  if (header === "AdminNote") return roster.adminNote || "";
  if (header === "LockedAt") return roster.lockedAt || "";
  if (header === "LockedBy") return roster.lockedBy || "";
  if (header === "LockReason") return roster.lockReason || "";
  if (header === "CreatedAt") return roster.createdAt || "";
  if (header === "UpdatedAt") return roster.updatedAt || "";
  return "";
}

function tournamentRosterPlayerColumnValue_(header, player) {
  if (header === "RosterPlayerId") return player.rosterPlayerId || "";
  if (header === "RosterId") return player.rosterId || "";
  if (header === "PlanId") return player.planId || "";
  if (header === "TournamentId") return player.tournamentId || "";
  if (header === "TournamentName") return player.tournamentName || "";
  if (header === "TeamProfileId") return player.teamProfileId || "";
  if (header === "ClubTeamId") return player.clubTeamId || "";
  if (header === "ClubTeamName") return player.clubTeamName || "";
  if (header === "SquadLabel") return player.squadLabel || "";
  if (header === "PlayerUsername") return player.playerUsername || "";
  if (header === "PlayerDisplayName") return player.playerDisplayName || "";
  if (header === "PlayerCountry") return player.playerCountry || "";
  if (header === "AssignedSquad") return player.assignedSquad || "UNASSIGNED";
  if (header === "RosterRole") return player.rosterRole || "PLAYER";
  if (header === "Source") return player.source || "SQUAD_PLANNING";
  if (header === "PlayerStatus") return player.playerStatus || "ACTIVE";
  if (header === "AddedBy") return player.addedBy || "";
  if (header === "AddedAt") return player.addedAt || "";
  if (header === "CreatedAt") return player.createdAt || "";
  if (header === "UpdatedAt") return player.updatedAt || "";
  return "";
}

function officialRosterColumnValue_(header, row) {
  if (header === "OfficialRosterId") return row.officialRosterId || "";
  if (header === "DraftId") return row.draftId || "";
  if (header === "TournamentId") return row.tournamentId || "";
  if (header === "TournamentName") return row.tournamentName || "";
  if (header === "TeamId") return row.teamId || "";
  if (header === "TeamName") return row.teamName || "";
  if (header === "SquadLabel") return row.squadLabel || "";
  if (header === "GroupName") return row.groupName || "";
  if (header === "PlayerUsername") return row.playerUsername || "";
  if (header === "PlayerDisplayName") return row.playerDisplayName || "";
  if (header === "PlayerCountry") return row.playerCountry || "";
  if (header === "Status") return row.status || "LOCKED";
  if (header === "LockedAt") return row.lockedAt || "";
  if (header === "LockedBy") return row.lockedBy || "";
  if (header === "CreatedAt") return row.createdAt || "";
  return "";
}

function teamEventCommentColumnValue_(header, comment) {
  if (header === "CommentId") return comment.commentId || "";
  if (header === "PlanId") return comment.planId || "";
  if (header === "TeamProfileId") return comment.teamProfileId || "";
  if (header === "ClubTeamId") return comment.clubTeamId || "";
  if (header === "ClubTeamName") return comment.clubTeamName || "";
  if (header === "Username") return comment.username || "";
  if (header === "DisplayName") return comment.displayName || "";
  if (header === "Message") return comment.message || "";
  if (header === "CreatedAt") return comment.createdAt || "";
  if (header === "UpdatedAt") return comment.updatedAt || "";
  if (header === "Active") return comment.active !== false;
  return "";
}

function writeTournamentTeamPlanRow_(plan, existingRow) {
  var sheet = getTournamentTeamPlansSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return tournamentTeamPlanColumnValue_(header, plan);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return plan;
}

function writeTournamentAvailabilityRow_(availability, existingRow) {
  var sheet = getTournamentAvailabilitySheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return tournamentAvailabilityColumnValue_(header, availability);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return availability;
}

function writeTournamentSquadPlanningRow_(planning, existingRow) {
  var sheet = getTournamentSquadPlanningSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return tournamentSquadPlanningColumnValue_(header, planning);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return planning;
}

function writeTournamentRosterRow_(roster, existingRow) {
  var sheet = getTournamentRostersSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return tournamentRosterColumnValue_(header, roster);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return roster;
}

function writeTournamentRosterPlayerRow_(player, existingRow) {
  var sheet = getTournamentRosterPlayersSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return tournamentRosterPlayerColumnValue_(header, player);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return player;
}

function writeOfficialRosterRow_(row, existingRow) {
  var sheet = getOfficialRostersSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return officialRosterColumnValue_(header, row);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return row;
}

function writeTeamEventCommentRow_(comment, existingRow) {
  var sheet = getTeamEventCommentsSheet_();
  var headers = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var rowValues = headers.map(function (header) {
    return teamEventCommentColumnValue_(header, comment);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return comment;
}

function findTournamentTeamPlanRowById_(planId) {
  var target = String(planId || "").trim();
  if (!target) return null;

  var rows = tournamentTeamPlanRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].PlanId || "").trim() === target) return rows[i];
  }
  return null;
}

function findTournamentSquadPlanningRowById_(planningId) {
  var target = String(planningId || "").trim();
  if (!target) return null;

  var rows = tournamentSquadPlanningRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].PlanningId || "").trim() === target) return rows[i];
  }
  return null;
}

function findTournamentSquadPlanningRowByPlanAndPlayer_(planId, playerUsername) {
  var targetPlanId = String(planId || "").trim();
  var targetUsername = String(playerUsername || "").trim().toLowerCase();
  if (!targetPlanId || !targetUsername) return null;

  var rows = tournamentSquadPlanningRows_();
  for (var i = 0; i < rows.length; i++) {
    var planning = tournamentSquadPlanningFromRow_(rows[i]);
    if (
      planning &&
      planning.planId === targetPlanId &&
      String(planning.playerUsername || "").trim().toLowerCase() === targetUsername
    ) {
      return rows[i];
    }
  }
  return null;
}

function findTournamentAvailabilityRowById_(availabilityId) {
  var target = String(availabilityId || "").trim();
  if (!target) return null;

  var rows = tournamentAvailabilityRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].AvailabilityId || "").trim() === target) return rows[i];
  }
  return null;
}

function findTournamentAvailabilityRowByPlanAndPlayer_(planId, playerUsername) {
  var targetPlanId = String(planId || "").trim();
  var targetUsername = String(playerUsername || "").trim().toLowerCase();
  if (!targetPlanId || !targetUsername) return null;

  var rows = tournamentAvailabilityRows_();
  for (var i = 0; i < rows.length; i++) {
    var availability = tournamentAvailabilityFromRow_(rows[i]);
    if (
      availability &&
      availability.planId === targetPlanId &&
      String(availability.playerUsername || "").trim().toLowerCase() === targetUsername
    ) {
      return rows[i];
    }
  }
  return null;
}

function findTournamentRosterRowById_(rosterId) {
  var target = String(rosterId || "").trim();
  if (!target) return null;

  var rows = tournamentRosterRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].RosterId || "").trim() === target) return rows[i];
  }
  return null;
}

function findTournamentRosterRowByPlanId_(planId) {
  var targetPlanId = String(planId || "").trim();
  if (!targetPlanId) return null;

  var rows = tournamentRosterRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].PlanId || "").trim() === targetPlanId) return rows[i];
  }
  return null;
}

function findTournamentRosterPlayerRowById_(rosterPlayerId) {
  var target = String(rosterPlayerId || "").trim();
  if (!target) return null;

  var rows = tournamentRosterPlayerRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].RosterPlayerId || "").trim() === target) return rows[i];
  }
  return null;
}

function findTournamentRosterPlayerRowByRosterAndPlayer_(rosterId, playerUsername) {
  var targetRosterId = String(rosterId || "").trim();
  var targetUsername = String(playerUsername || "").trim().toLowerCase();
  if (!targetRosterId || !targetUsername) return null;

  var rows = tournamentRosterPlayerRows_();
  for (var i = 0; i < rows.length; i++) {
    var player = tournamentRosterPlayerFromRow_(rows[i]);
    if (
      player &&
      player.rosterId === targetRosterId &&
      String(player.playerUsername || "").trim().toLowerCase() === targetUsername
    ) {
      return rows[i];
    }
  }
  return null;
}

function findTeamEventCommentRowById_(commentId) {
  var target = String(commentId || "").trim();
  if (!target) return null;

  var rows = teamEventCommentRows_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].CommentId || "").trim() === target) return rows[i];
  }
  return null;
}

function tournamentPlanResponseSummary_(planId) {
  var summary = {
    yes: 0,
    maybe: 0,
    no: 0,
    pending: 0,
    total: 0
  };
  var targetPlanId = String(planId || "").trim();
  if (!targetPlanId) return summary;

  tournamentAvailabilityRows_()
    .map(tournamentAvailabilityFromRow_)
    .filter(function (availability) {
      return availability && availability.planId === targetPlanId;
    })
    .forEach(function (availability) {
      summary.total += 1;
      if (availability.responseStatus === "YES") summary.yes += 1;
      else if (availability.responseStatus === "MAYBE") summary.maybe += 1;
      else if (availability.responseStatus === "NO") summary.no += 1;
      else summary.pending += 1;
    });

  return summary;
}

function enrichTournamentAvailabilityWithPlan_(availability) {
  if (!availability) return availability;
  var plan = tournamentTeamPlanFromRow_(findTournamentTeamPlanRowById_(availability.planId));
  return Object.assign({}, availability, {
    squadLabel: plan ? plan.squadLabel : "",
    className: plan ? plan.className : "",
    deadlineAt: plan ? plan.deadlineAt : "",
    planStatus: plan ? plan.planStatus : ""
  });
}

function decorateTournamentTeamPlan_(plan) {
  if (!plan) return plan;
  return Object.assign({}, plan, {
    responseSummary: tournamentPlanResponseSummary_(plan.planId)
  });
}

function tournamentPlanRowsForTeamProfile_(teamProfileId) {
  var targetTeamProfileId = String(teamProfileId || "").trim();
  if (!targetTeamProfileId) return [];

  return tournamentTeamPlanRows_()
    .map(tournamentTeamPlanFromRow_)
    .filter(function (plan) {
      return plan && plan.teamProfileId === targetTeamProfileId;
    })
    .map(decorateTournamentTeamPlan_)
    .sort(function (a, b) {
      var aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      var bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      return bTime - aTime;
    });
}

function tournamentAvailabilityForPlan_(planId) {
  var targetPlanId = String(planId || "").trim();
  if (!targetPlanId) return [];

  return tournamentAvailabilityRows_()
    .map(tournamentAvailabilityFromRow_)
    .filter(function (availability) {
      return availability && availability.planId === targetPlanId;
    })
    .map(enrichTournamentAvailabilityWithPlan_)
    .sort(function (a, b) {
      var aName = String(a.playerDisplayName || a.playerUsername || "");
      var bName = String(b.playerDisplayName || b.playerUsername || "");
      return aName.localeCompare(bName);
    });
}

function tournamentSquadPlanningForPlan_(planId, includeRemoved) {
  var targetPlanId = String(planId || "").trim();
  if (!targetPlanId) return [];

  return tournamentSquadPlanningRows_()
    .map(tournamentSquadPlanningFromRow_)
    .filter(function (planning) {
      return (
        planning &&
        planning.planId === targetPlanId &&
        (includeRemoved || planning.planningStatus === "PLANNED")
      );
    })
    .sort(function (a, b) {
      var aName = String(a.playerDisplayName || a.playerUsername || "");
      var bName = String(b.playerDisplayName || b.playerUsername || "");
      return aName.localeCompare(bName);
    });
}

function tournamentRosterPlayersForRoster_(rosterId, activeOnly) {
  var targetRosterId = String(rosterId || "").trim();
  if (!targetRosterId) return [];

  return tournamentRosterPlayerRows_()
    .map(tournamentRosterPlayerFromRow_)
    .filter(function (player) {
      return (
        player &&
        player.rosterId === targetRosterId &&
        (!activeOnly || player.playerStatus === "ACTIVE")
      );
    })
    .sort(function (a, b) {
      var squadOrder = { A: 1, B: 2, C: 3, RESERVE: 4, UNASSIGNED: 5 };
      var squadDiff =
        (squadOrder[a.assignedSquad] || 99) - (squadOrder[b.assignedSquad] || 99);
      if (squadDiff !== 0) return squadDiff;
      var aName = String(a.playerDisplayName || a.playerUsername || "");
      var bName = String(b.playerDisplayName || b.playerUsername || "");
      return aName.localeCompare(bName);
    });
}

function officialRosterRowsForDraft_(draftId) {
  var targetDraftId = String(draftId || "").trim();
  if (!targetDraftId) return [];

  return officialRosterRows_()
    .map(officialRosterFromRow_)
    .filter(function (row) {
      return row && row.draftId === targetDraftId && row.status === "LOCKED";
    })
    .sort(function (a, b) {
      var squadOrder = {
        "Team A": 1,
        "Team B": 2,
        "Team C": 3,
        Reserve: 4
      };
      var squadDiff =
        (squadOrder[a.groupName] || 99) - (squadOrder[b.groupName] || 99);
      if (squadDiff !== 0) return squadDiff;
      var aName = String(a.playerDisplayName || a.playerUsername || "");
      var bName = String(b.playerDisplayName || b.playerUsername || "");
      return aName.localeCompare(bName);
    });
}

function officialRosterGroupName_(assignedSquad) {
  var squad = normalizeAssignedSquad_(assignedSquad);
  if (squad === "A" || squad === "B" || squad === "C") return "Team " + squad;
  if (squad === "RESERVE") return "Reserve";
  return "Unassigned";
}

function decorateTournamentRoster_(roster) {
  if (!roster) return roster;
  var players = tournamentRosterPlayersForRoster_(roster.rosterId, true);
  var officialPlayers = officialRosterRowsForDraft_(roster.rosterId);
  return Object.assign({}, roster, {
    players: players,
    playerCount: players.length,
    officialPlayers: officialPlayers,
    officialPlayerCount: officialPlayers.length
  });
}

function tournamentRosterPayloadForPlan_(plan) {
  var roster = tournamentRosterFromRow_(findTournamentRosterRowByPlanId_(plan.planId));
  return {
    success: true,
    plan: decorateTournamentTeamPlan_(plan),
    roster: roster ? decorateTournamentRoster_(roster) : null,
    players: roster ? tournamentRosterPlayersForRoster_(roster.rosterId, true) : []
  };
}

function tournamentPlanHasLockedRoster_(planId) {
  var roster = tournamentRosterFromRow_(findTournamentRosterRowByPlanId_(planId));
  return !!(roster && roster.rosterStatus === "LOCKED");
}

function userCanLockOfficialRoster_(user, roster) {
  if (!user || !roster) return false;
  if (isAdminUser_(user) || userCanUseTournaments_(user)) return true;

  var teamProfile = teamProfileFromRow_(
    findTeamProfileRowById_(roster.teamProfileId)
  );
  return captainCanManageTeamProfile_(user, teamProfile);
}

function rosterRoleForAssignedSquad_(assignedSquad) {
  return normalizeAssignedSquad_(assignedSquad) === "RESERVE" ? "RESERVE" : "PLAYER";
}

function assignedSquadPlanningForRoster_(plan) {
  if (!plan) return [];

  syncSquadPlanningForPlan_(plan);
  var seen = {};
  return tournamentSquadPlanningForPlan_(plan.planId, false).filter(function (planning) {
    if (!planning || planning.planningStatus !== "PLANNED") return false;
    if (planning.availabilityStatus !== "YES" && planning.availabilityStatus !== "MAYBE") {
      return false;
    }

    var assignedSquad = normalizeAssignedSquad_(planning.assignedSquad);
    if (
      assignedSquad !== "A" &&
      assignedSquad !== "B" &&
      assignedSquad !== "C" &&
      assignedSquad !== "RESERVE"
    ) {
      return false;
    }

    var playerKey = String(planning.playerUsername || "").trim().toLowerCase();
    if (!playerKey || seen[playerKey]) return false;
    seen[playerKey] = true;
    return true;
  });
}

function captainTournamentPlanByIdContext_(data) {
  var context = resolveRequestContext(data || {});
  if (!context || !context.authenticated || !context.user) {
    return {
      success: false,
      message: "Login required"
    };
  }

  var planId = String(data && data.planId || "").trim();
  var plan = tournamentTeamPlanFromRow_(findTournamentTeamPlanRowById_(planId));
  if (!plan || !captainCanManageTournamentPlan_(context.user, plan)) {
    return {
      success: false,
      message: "Captain access required."
    };
  }

  return {
    success: true,
    context: context,
    plan: plan
  };
}

function syncSquadPlanningForPlan_(plan, username) {
  if (!plan) return [];

  var now = new Date().toISOString();
  var changed = false;
  var availability = tournamentAvailabilityForPlan_(plan.planId);
  var availabilityByUsername = {};

  availability.forEach(function (item) {
    var playerUsername = String(item.playerUsername || "").trim().toLowerCase();
    if (playerUsername) availabilityByUsername[playerUsername] = item;
    if (item.responseStatus !== "YES" && item.responseStatus !== "MAYBE") return;

    var existingRow = findTournamentSquadPlanningRowByPlanAndPlayer_(
      plan.planId,
      item.playerUsername
    );
    var existing = tournamentSquadPlanningFromRow_(existingRow);
    if (existing && existing.planningStatus === "REMOVED") return;

    var planning = existing || {
      planningId: "squad-planning-" + Utilities.getUuid(),
      planId: plan.planId,
      tournamentId: plan.tournamentId,
      tournamentName: plan.tournamentName,
      teamProfileId: plan.teamProfileId,
      clubTeamId: plan.clubTeamId,
      clubTeamName: plan.clubTeamName,
      playerUsername: item.playerUsername,
      assignedSquad: "UNASSIGNED",
      planningStatus: "PLANNED",
      assignedBy: "",
      assignedAt: "",
      createdAt: now
    };

    planning.tournamentId = plan.tournamentId;
    planning.tournamentName = plan.tournamentName;
    planning.teamProfileId = plan.teamProfileId;
    planning.clubTeamId = plan.clubTeamId;
    planning.clubTeamName = plan.clubTeamName;
    planning.playerDisplayName = playerProfileText_(item.playerDisplayName, 120);
    planning.playerCountry = playerProfileText_(item.playerCountry, 120);
    planning.availabilityStatus = item.responseStatus;
    planning.preferredSquad = item.preferredSquad;
    planning.planningStatus = "PLANNED";
    planning.updatedAt = now;

    writeTournamentSquadPlanningRow_(planning, existingRow);
    changed = true;
  });

  tournamentSquadPlanningRows_()
    .filter(function (row) {
      return String(row.PlanId || "").trim() === plan.planId;
    })
    .forEach(function (row) {
      var planning = tournamentSquadPlanningFromRow_(row);
      if (!planning || planning.planningStatus !== "PLANNED") return;

      var playerAvailability =
        availabilityByUsername[String(planning.playerUsername || "").trim().toLowerCase()];
      if (
        !playerAvailability ||
        (playerAvailability.responseStatus !== "YES" &&
          playerAvailability.responseStatus !== "MAYBE")
      ) {
        planning.planningStatus = "REMOVED";
        planning.updatedAt = now;
        writeTournamentSquadPlanningRow_(planning, row);
        changed = true;
      }
    });

  return tournamentSquadPlanningForPlan_(plan.planId, false);
}

function captainTournamentPlanContext_(data) {
  var captainCheck = teamProfileContextForCaptain_(data || {});
  if (!captainCheck.success) return captainCheck;

  var username = playerHubUsername_(captainCheck.context.user);
  var teamProfile = teamProfileFromRow_(
    findTeamProfileRowByCaptainAndClub_(username, captainCheck.clubTeam.teamId)
  );
  if (!teamProfile) {
    return {
      success: false,
      message: "Create your team profile first."
    };
  }

  return {
    success: true,
    context: captainCheck.context,
    playerProfile: captainCheck.playerProfile,
    clubTeam: captainCheck.clubTeam,
    teamProfile: teamProfile
  };
}

function captainCanManageTournamentPlan_(user, plan) {
  if (!user || !plan) return false;
  var teamProfile = teamProfileFromRow_(findTeamProfileRowById_(plan.teamProfileId));
  return captainCanManageTeamProfile_(user, teamProfile);
}

function tournamentNameForPlan_(tournament) {
  return playerProfileText_(
    (tournament && (tournament.publicTitle || tournament.name)) || "",
    180
  );
}

function tournamentAvailabilityParticipantFromCaptain_(captainContext) {
  if (!captainContext || !captainContext.context || !captainContext.context.user) {
    return null;
  }

  var user = captainContext.context.user;
  if (user.active === false) return null;

  var username = playerHubUsername_(user);
  if (!username) return null;

  var profile =
    captainContext.playerProfile ||
    playerProfileFromRow_(findPlayerProfileRowByUsername_(username), user);
  var teamProfile = captainContext.teamProfile || {};

  return {
    memberStatus: "ACTIVE",
    playerUsername: username,
    playerDisplayName: playerProfileText_(
      (profile && profile.displayName) ||
        teamProfile.captainDisplayName ||
        username,
      120
    ),
    playerEmail: playerProfileText_((profile && profile.email) || "", 160),
    playerPhone: playerProfileText_((profile && profile.phone) || "", 80),
    playerCountry: playerProfileText_(
      (profile && profile.country) || teamProfile.country || "",
      120
    )
  };
}

function tournamentAvailabilityInvitees_(members, captainContext) {
  var invitees = [];
  var seen = {};

  function addInvitee(member) {
    if (!member || member.memberStatus !== "ACTIVE") return;
    var username = String(member.playerUsername || "").trim();
    var key = username.toLowerCase();
    if (!key || seen[key]) return;
    seen[key] = true;
    invitees.push(member);
  }

  (members || []).forEach(addInvitee);
  addInvitee(tournamentAvailabilityParticipantFromCaptain_(captainContext));

  return invitees;
}

function createPendingAvailabilityForPlan_(plan, members, requestedBy) {
  var now = new Date().toISOString();
  var created = [];

  (members || []).forEach(function (member) {
    if (!member || member.memberStatus !== "ACTIVE") return;
    if (findTournamentAvailabilityRowByPlanAndPlayer_(plan.planId, member.playerUsername)) {
      return;
    }

    var availability = {
      availabilityId: "availability-" + Utilities.getUuid(),
      planId: plan.planId,
      tournamentId: plan.tournamentId,
      tournamentName: plan.tournamentName,
      teamProfileId: plan.teamProfileId,
      clubTeamId: plan.clubTeamId,
      clubTeamName: plan.clubTeamName,
      playerUsername: member.playerUsername,
      playerDisplayName: playerProfileText_(member.playerDisplayName, 120),
      playerEmail: playerProfileText_(member.playerEmail, 160),
      playerPhone: playerProfileText_(member.playerPhone, 80),
      playerCountry: playerProfileText_(member.playerCountry, 120),
      responseStatus: "PENDING",
      preferredSquad: "NO_PREFERENCE",
      playerNote: "",
      requestedBy: requestedBy,
      requestedAt: now,
      respondedAt: "",
      createdAt: now,
      updatedAt: now
    };
    writeTournamentAvailabilityRow_(availability, null);
    created.push(availability);
  });

  return created;
}

function createTournamentTeamPlan(data) {
  try {
    var captainContext = captainTournamentPlanContext_(data || {});
    if (!captainContext.success) return captainContext;

    var tournamentId = String(data && data.tournamentId || "").trim();
    var tournamentRow = findTournamentRowById_(tournamentId);
    var tournament = tournamentRow ? tournamentFromRow_(tournamentRow) : null;
    if (!tournament) {
      return {
        success: false,
        message: "Select an existing tournament."
      };
    }

    var activeMembers = teamMembersForProfile_(
      captainContext.teamProfile.teamProfileId,
      true
    );
    var invitees = tournamentAvailabilityInvitees_(activeMembers, captainContext);
    if (!invitees.length) {
      return {
        success: false,
        message: "No active players found for this team."
      };
    }

    var now = new Date().toISOString();
    var rawSquadLabel = playerProfileText_(data && data.squadLabel, 40);
    var squadLabel = rawSquadLabel || "A";
    var plan = {
      planId: "tournament-plan-" + Utilities.getUuid(),
      tournamentId: tournament.id,
      tournamentName: tournamentNameForPlan_(tournament),
      teamProfileId: captainContext.teamProfile.teamProfileId,
      clubTeamId: captainContext.teamProfile.clubTeamId,
      clubTeamName: captainContext.teamProfile.clubTeamName,
      captainUsername: playerHubUsername_(captainContext.context.user),
      squadLabel: squadLabel,
      className: playerProfileText_(data && data.className, 80),
      planStatus: normalizeTournamentPlanStatus_(data && data.planStatus),
      deadlineAt: playerProfileText_(data && data.deadlineAt, 80),
      note: playerProfileText_(data && data.note, 500),
      createdAt: now,
      updatedAt: now
    };

    writeTournamentTeamPlanRow_(plan, null);
    createPendingAvailabilityForPlan_(
      plan,
      invitees,
      playerHubUsername_(captainContext.context.user)
    );

    return {
      success: true,
      plan: decorateTournamentTeamPlan_(plan),
      plans: tournamentPlanRowsForTeamProfile_(captainContext.teamProfile.teamProfileId),
      availability: tournamentAvailabilityForPlan_(plan.planId)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not create tournament plan"
    };
  }
}

function listMyTournamentTeamPlansForCaptain(data) {
  try {
    var captainContext = captainTournamentPlanContext_(data || {});
    if (!captainContext.success) return captainContext;

    return {
      success: true,
      plans: tournamentPlanRowsForTeamProfile_(captainContext.teamProfile.teamProfileId)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load tournament plans"
    };
  }
}

function listMyTournamentAvailabilityForPlayer(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var username = playerHubUsername_(context.user).toLowerCase();
    var availability = tournamentAvailabilityRows_()
      .map(tournamentAvailabilityFromRow_)
      .filter(function (item) {
        return (
          item &&
          String(item.playerUsername || "").trim().toLowerCase() === username
        );
      })
      .map(enrichTournamentAvailabilityWithPlan_)
      .sort(function (a, b) {
        var aTime = Date.parse(a.updatedAt || a.requestedAt || a.createdAt || "") || 0;
        var bTime = Date.parse(b.updatedAt || b.requestedAt || b.createdAt || "") || 0;
        return bTime - aTime;
      });

    return {
      success: true,
      availability: availability
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load tournament availability"
    };
  }
}

function listMyTournamentSquadPlanningForPlayer(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var username = playerHubUsername_(context.user).toLowerCase();
    var planning = tournamentSquadPlanningRows_()
      .map(tournamentSquadPlanningFromRow_)
      .filter(function (item) {
        if (!item || item.planningStatus !== "PLANNED") return false;
        if (String(item.playerUsername || "").trim().toLowerCase() !== username) {
          return false;
        }
        if (item.availabilityStatus !== "YES" && item.availabilityStatus !== "MAYBE") {
          return false;
        }
        return normalizeAssignedSquad_(item.assignedSquad) !== "UNASSIGNED";
      })
      .sort(function (a, b) {
        var aTime = Date.parse(a.updatedAt || a.assignedAt || a.createdAt || "") || 0;
        var bTime = Date.parse(b.updatedAt || b.assignedAt || b.createdAt || "") || 0;
        return bTime - aTime;
      });

    return {
      success: true,
      planning: planning
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load planned teams"
    };
  }
}

function updateTournamentAvailabilityResponse(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var availabilityId = String(data && data.availabilityId || "").trim();
    var row = findTournamentAvailabilityRowById_(availabilityId);
    var availability = tournamentAvailabilityFromRow_(row);
    var username = playerHubUsername_(context.user).toLowerCase();
    if (
      !availability ||
      String(availability.playerUsername || "").trim().toLowerCase() !== username
    ) {
      return {
        success: false,
        message: "Availability request not found"
      };
    }

    var now = new Date().toISOString();
    availability.responseStatus = normalizeTournamentAvailabilityStatus_(
      data && data.responseStatus
    );
    availability.preferredSquad = normalizePreferredSquad_(data && data.preferredSquad);
    availability.playerNote = playerProfileText_(data && data.playerNote, 300);
    availability.respondedAt = now;
    availability.updatedAt = now;
    writeTournamentAvailabilityRow_(availability, row);

    return {
      success: true,
      availability: enrichTournamentAvailabilityWithPlan_(availability)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not update availability"
    };
  }
}

function listTournamentAvailabilityForCaptain(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var planId = String(data && data.planId || "").trim();
    var plan = tournamentTeamPlanFromRow_(findTournamentTeamPlanRowById_(planId));
    if (!plan || !captainCanManageTournamentPlan_(context.user, plan)) {
      return {
        success: false,
        message: "Captain access required."
      };
    }

    return {
      success: true,
      availability: tournamentAvailabilityForPlan_(plan.planId),
      plan: decorateTournamentTeamPlan_(plan)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load tournament responses"
    };
  }
}

function tournamentPlanCommentContext_(data) {
  var context = resolveRequestContext(data || {});
  if (!context || !context.authenticated || !context.user) {
    return {
      success: false,
      message: "Login required"
    };
  }

  var planId = String(data && (data.planId || data.eventId) || "").trim();
  var plan = tournamentTeamPlanFromRow_(findTournamentTeamPlanRowById_(planId));
  if (!plan) {
    return {
      success: false,
      message: "Event not found"
    };
  }

  var user = context.user;
  var username = playerHubUsername_(user);
  var usernameKey = String(username || "").trim().toLowerCase();
  var invitedRow = findTournamentAvailabilityRowByPlanAndPlayer_(plan.planId, username);
  var canAccess =
    isAdminUser_(user) ||
    userCanUseTournaments_(user) ||
    captainCanManageTournamentPlan_(user, plan) ||
    !!invitedRow;

  if (!usernameKey || !canAccess) {
    return {
      success: false,
      message: "Event access required"
    };
  }

  return {
    success: true,
    context: context,
    plan: plan,
    username: username
  };
}

function commentsForTournamentPlan_(planId) {
  var targetPlanId = String(planId || "").trim();
  if (!targetPlanId) return [];

  return teamEventCommentRows_()
    .map(teamEventCommentFromRow_)
    .filter(function (comment) {
      return comment && comment.active !== false && comment.planId === targetPlanId;
    })
    .sort(function (a, b) {
      var aTime = Date.parse(a.createdAt || "") || 0;
      var bTime = Date.parse(b.createdAt || "") || 0;
      return aTime - bTime;
    });
}

function listEventComments(data) {
  try {
    var eventContext = tournamentPlanCommentContext_(data || {});
    if (!eventContext.success) return eventContext;

    return {
      success: true,
      comments: commentsForTournamentPlan_(eventContext.plan.planId)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load comments"
    };
  }
}

function addEventComment(data) {
  try {
    var eventContext = tournamentPlanCommentContext_(data || {});
    if (!eventContext.success) return eventContext;

    var message = playerProfileText_(data && data.message, 500);
    if (!message) {
      return {
        success: false,
        message: "Comment cannot be empty"
      };
    }

    var user = eventContext.context.user;
    var profile = playerProfileFromRow_(
      findPlayerProfileRowByUsername_(eventContext.username),
      user
    );
    var now = new Date().toISOString();
    var comment = {
      commentId: "event-comment-" + Utilities.getUuid(),
      planId: eventContext.plan.planId,
      teamProfileId: eventContext.plan.teamProfileId,
      clubTeamId: eventContext.plan.clubTeamId,
      clubTeamName: eventContext.plan.clubTeamName,
      username: eventContext.username,
      displayName: playerProfileText_(
        (profile && profile.displayName) || eventContext.username,
        120
      ),
      message: message,
      createdAt: now,
      updatedAt: now,
      active: true
    };

    writeTeamEventCommentRow_(comment, null);

    return {
      success: true,
      comment: comment,
      comments: commentsForTournamentPlan_(eventContext.plan.planId)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not add comment"
    };
  }
}

function archiveEventComment(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var row = findTeamEventCommentRowById_(data && data.commentId);
    var comment = teamEventCommentFromRow_(row);
    if (!comment) {
      return {
        success: false,
        message: "Comment not found"
      };
    }

    var plan = tournamentTeamPlanFromRow_(findTournamentTeamPlanRowById_(comment.planId));
    var usernameKey = playerHubUsername_(context.user).toLowerCase();
    var commentUsernameKey = String(comment.username || "").trim().toLowerCase();
    var canArchive =
      usernameKey === commentUsernameKey ||
      isAdminUser_(context.user) ||
      userCanUseTournaments_(context.user) ||
      captainCanManageTournamentPlan_(context.user, plan);

    if (!canArchive) {
      return {
        success: false,
        message: "Comment access required"
      };
    }

    comment.active = false;
    comment.updatedAt = new Date().toISOString();
    writeTeamEventCommentRow_(comment, row);

    return {
      success: true,
      comment: comment,
      comments: commentsForTournamentPlan_(comment.planId)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not remove comment"
    };
  }
}

function updateTournamentPlanStatus(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var planId = String(data && data.planId || "").trim();
    var row = findTournamentTeamPlanRowById_(planId);
    var plan = tournamentTeamPlanFromRow_(row);
    if (!plan || !captainCanManageTournamentPlan_(context.user, plan)) {
      return {
        success: false,
        message: "Captain access required."
      };
    }

    plan.planStatus = normalizeTournamentPlanStatus_(data && data.planStatus);
    plan.updatedAt = new Date().toISOString();
    writeTournamentTeamPlanRow_(plan, row);

    return {
      success: true,
      plan: decorateTournamentTeamPlan_(plan)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not update tournament plan"
    };
  }
}

function squadPlanningResponseForPlan_(plan) {
  syncSquadPlanningForPlan_(plan);
  return {
    success: true,
    plan: decorateTournamentTeamPlan_(plan),
    availability: tournamentAvailabilityForPlan_(plan.planId),
    planning: tournamentSquadPlanningForPlan_(plan.planId, false)
  };
}

function syncSquadPlanningFromAvailability(data) {
  try {
    var planContext = captainTournamentPlanByIdContext_(data || {});
    if (!planContext.success) return planContext;

    return squadPlanningResponseForPlan_(planContext.plan);
  } catch (err) {
    return {
      success: false,
      message: "Could not sync squad planning"
    };
  }
}

function listTournamentSquadPlanningForCaptain(data) {
  try {
    var planContext = captainTournamentPlanByIdContext_(data || {});
    if (!planContext.success) return planContext;

    return squadPlanningResponseForPlan_(planContext.plan);
  } catch (err) {
    return {
      success: false,
      message: "Could not load squad planning"
    };
  }
}

function assignPlayerToSquad(data) {
  try {
    var planContext = captainTournamentPlanByIdContext_(data || {});
    if (!planContext.success) return planContext;

    var plan = planContext.plan;
    if (tournamentPlanHasLockedRoster_(plan.planId)) {
      return {
        success: false,
        message: "Roster is locked."
      };
    }

    var playerUsername = String(data && data.playerUsername || "").trim();
    var availabilityRow = findTournamentAvailabilityRowByPlanAndPlayer_(
      plan.planId,
      playerUsername
    );
    var availability = tournamentAvailabilityFromRow_(availabilityRow);
    if (
      !availability ||
      (availability.responseStatus !== "YES" && availability.responseStatus !== "MAYBE")
    ) {
      return {
        success: false,
        message: "Only players who answered Yes or Maybe can be planned."
      };
    }

    var now = new Date().toISOString();
    var assignedSquad = normalizeAssignedSquad_(data && data.assignedSquad);
    var existingRow = findTournamentSquadPlanningRowByPlanAndPlayer_(
      plan.planId,
      availability.playerUsername
    );
    var existing = tournamentSquadPlanningFromRow_(existingRow);
    var planning = existing || {
      planningId: "squad-planning-" + Utilities.getUuid(),
      planId: plan.planId,
      createdAt: now
    };

    planning.tournamentId = plan.tournamentId;
    planning.tournamentName = plan.tournamentName;
    planning.teamProfileId = plan.teamProfileId;
    planning.clubTeamId = plan.clubTeamId;
    planning.clubTeamName = plan.clubTeamName;
    planning.playerUsername = availability.playerUsername;
    planning.playerDisplayName = playerProfileText_(availability.playerDisplayName, 120);
    planning.playerCountry = playerProfileText_(availability.playerCountry, 120);
    planning.availabilityStatus = availability.responseStatus;
    planning.preferredSquad = availability.preferredSquad;
    planning.assignedSquad = assignedSquad;
    planning.planningStatus = "PLANNED";
    planning.assignedBy = playerHubUsername_(planContext.context.user);
    planning.assignedAt = now;
    planning.updatedAt = now;

    writeTournamentSquadPlanningRow_(planning, existingRow);
    return squadPlanningResponseForPlan_(plan);
  } catch (err) {
    return {
      success: false,
      message: "Could not assign player"
    };
  }
}

function removePlayerFromSquadPlanning(data) {
  try {
    var planContext = captainTournamentPlanByIdContext_(data || {});
    if (!planContext.success) return planContext;

    var plan = planContext.plan;
    if (tournamentPlanHasLockedRoster_(plan.planId)) {
      return {
        success: false,
        message: "Roster is locked."
      };
    }

    var planningId = String(data && data.planningId || "").trim();
    var row = planningId
      ? findTournamentSquadPlanningRowById_(planningId)
      : findTournamentSquadPlanningRowByPlanAndPlayer_(
          plan.planId,
          data && data.playerUsername
        );
    var planning = tournamentSquadPlanningFromRow_(row);
    if (!planning || planning.planId !== plan.planId) {
      return {
        success: false,
        message: "Planning item not found"
      };
    }

    planning.planningStatus = "REMOVED";
    planning.updatedAt = new Date().toISOString();
    writeTournamentSquadPlanningRow_(planning, row);
    return squadPlanningResponseForPlan_(plan);
  } catch (err) {
    return {
      success: false,
      message: "Could not remove player from planning"
    };
  }
}

function createOrUpdateRosterDraftFromSquadPlanning(data) {
  try {
    var planContext = captainTournamentPlanByIdContext_(data || {});
    if (!planContext.success) return planContext;

    var plan = planContext.plan;
    var assignedPlanning = assignedSquadPlanningForRoster_(plan);
    if (!assignedPlanning.length) {
      return {
        success: false,
        message: "Assign players to A, B, C or Reserve before building roster draft."
      };
    }

    var now = new Date().toISOString();
    var existingRosterRow = findTournamentRosterRowByPlanId_(plan.planId);
    var existingRoster = tournamentRosterFromRow_(existingRosterRow);
    if (
      existingRoster &&
      (existingRoster.rosterStatus === "SUBMITTED" ||
        existingRoster.rosterStatus === "APPROVED" ||
        existingRoster.rosterStatus === "LOCKED")
    ) {
      return {
        success: false,
        message: "Submitted roster draft cannot be edited yet."
      };
    }

    var roster = existingRoster || {
      rosterId: "tournament-roster-" + Utilities.getUuid(),
      planId: plan.planId,
      createdAt: now
    };
    roster.planId = plan.planId;
    roster.tournamentId = plan.tournamentId;
    roster.tournamentName = plan.tournamentName;
    roster.teamProfileId = plan.teamProfileId;
    roster.clubTeamId = plan.clubTeamId;
    roster.clubTeamName = plan.clubTeamName;
    roster.squadLabel = plan.squadLabel;
    roster.captainUsername = plan.captainUsername;
    roster.rosterStatus = existingRoster && existingRoster.rosterStatus === "CHANGE_REQUESTED"
      ? "CHANGE_REQUESTED"
      : "DRAFT";
    roster.submittedBy = "";
    roster.submittedAt = "";
    roster.reviewedBy = "";
    roster.reviewedAt = "";
    roster.adminNote = "";
    roster.lockedAt = roster.lockedAt || "";
    roster.lockedBy = roster.lockedBy || "";
    roster.lockReason = roster.lockReason || "";
    roster.updatedAt = now;

    writeTournamentRosterRow_(roster, existingRosterRow);

    var assignedByUsername = {};
    assignedPlanning.forEach(function (planning) {
      var playerKey = String(planning.playerUsername || "").trim().toLowerCase();
      if (playerKey) assignedByUsername[playerKey] = planning;
    });

    tournamentRosterPlayersForRoster_(roster.rosterId, false).forEach(function (player) {
      var playerKey = String(player.playerUsername || "").trim().toLowerCase();
      if (!playerKey || assignedByUsername[playerKey]) return;
      if (player.playerStatus !== "ACTIVE") return;
      var playerRow = findTournamentRosterPlayerRowById_(player.rosterPlayerId);
      player.playerStatus = "REMOVED";
      player.updatedAt = now;
      writeTournamentRosterPlayerRow_(player, playerRow);
    });

    assignedPlanning.forEach(function (planning) {
      var playerKey = String(planning.playerUsername || "").trim().toLowerCase();
      if (!playerKey) return;

      var existingPlayerRow = findTournamentRosterPlayerRowByRosterAndPlayer_(
        roster.rosterId,
        planning.playerUsername
      );
      var existingPlayer = tournamentRosterPlayerFromRow_(existingPlayerRow);
      var rosterPlayer = existingPlayer || {
        rosterPlayerId: "tournament-roster-player-" + Utilities.getUuid(),
        rosterId: roster.rosterId,
        planId: plan.planId,
        createdAt: now,
        addedAt: now
      };

      rosterPlayer.rosterId = roster.rosterId;
      rosterPlayer.planId = plan.planId;
      rosterPlayer.tournamentId = plan.tournamentId;
      rosterPlayer.tournamentName = plan.tournamentName;
      rosterPlayer.teamProfileId = plan.teamProfileId;
      rosterPlayer.clubTeamId = plan.clubTeamId;
      rosterPlayer.clubTeamName = plan.clubTeamName;
      rosterPlayer.squadLabel = plan.squadLabel;
      rosterPlayer.playerUsername = planning.playerUsername;
      rosterPlayer.playerDisplayName = playerProfileText_(
        planning.playerDisplayName || planning.playerUsername,
        120
      );
      rosterPlayer.playerCountry = playerProfileText_(planning.playerCountry, 120);
      rosterPlayer.assignedSquad = normalizeAssignedSquad_(planning.assignedSquad);
      rosterPlayer.rosterRole = rosterRoleForAssignedSquad_(planning.assignedSquad);
      rosterPlayer.source = "SQUAD_PLANNING";
      rosterPlayer.playerStatus = "ACTIVE";
      rosterPlayer.addedBy = playerHubUsername_(planContext.context.user);
      rosterPlayer.addedAt = rosterPlayer.addedAt || now;
      rosterPlayer.updatedAt = now;

      writeTournamentRosterPlayerRow_(rosterPlayer, existingPlayerRow);
    });

    return tournamentRosterPayloadForPlan_(plan);
  } catch (err) {
    return {
      success: false,
      message: "Could not build roster draft"
    };
  }
}

function listRosterDraftForCaptain(data) {
  try {
    var planContext = captainTournamentPlanByIdContext_(data || {});
    if (!planContext.success) return planContext;

    return tournamentRosterPayloadForPlan_(planContext.plan);
  } catch (err) {
    return {
      success: false,
      message: "Could not load roster draft"
    };
  }
}

function submitRosterDraft(data) {
  try {
    var planContext = captainTournamentPlanByIdContext_(data || {});
    if (!planContext.success) return planContext;

    var plan = planContext.plan;
    var row = findTournamentRosterRowByPlanId_(plan.planId);
    var roster = tournamentRosterFromRow_(row);
    if (!roster) {
      return {
        success: false,
        message: "Build roster draft first."
      };
    }
    if (
      roster.rosterStatus === "APPROVED" ||
      roster.rosterStatus === "LOCKED" ||
      roster.rosterStatus === "CANCELLED"
    ) {
      return {
        success: false,
        message: "Roster draft cannot be submitted."
      };
    }

    var players = tournamentRosterPlayersForRoster_(roster.rosterId, true);
    if (!players.length) {
      return {
        success: false,
        message: "Roster draft needs at least one player."
      };
    }

    var now = new Date().toISOString();
    roster.rosterStatus = "SUBMITTED";
    roster.submittedBy = playerHubUsername_(planContext.context.user);
    roster.submittedAt = now;
    roster.reviewedBy = "";
    roster.reviewedAt = "";
    roster.adminNote = "";
    roster.updatedAt = now;
    writeTournamentRosterRow_(roster, row);

    return tournamentRosterPayloadForPlan_(plan);
  } catch (err) {
    return {
      success: false,
      message: "Could not submit roster draft"
    };
  }
}

function removePlayerFromRosterDraft(data) {
  try {
    var planContext = captainTournamentPlanByIdContext_(data || {});
    if (!planContext.success) return planContext;

    var plan = planContext.plan;
    var roster = tournamentRosterFromRow_(findTournamentRosterRowByPlanId_(plan.planId));
    if (!roster) {
      return {
        success: false,
        message: "Roster draft not found."
      };
    }
    if (roster.rosterStatus !== "DRAFT" && roster.rosterStatus !== "CHANGE_REQUESTED") {
      return {
        success: false,
        message: "Only draft rosters can be edited."
      };
    }

    var rosterPlayerId = String(data && data.rosterPlayerId || "").trim();
    var row = rosterPlayerId
      ? findTournamentRosterPlayerRowById_(rosterPlayerId)
      : findTournamentRosterPlayerRowByRosterAndPlayer_(
          roster.rosterId,
          data && data.playerUsername
        );
    var player = tournamentRosterPlayerFromRow_(row);
    if (!player || player.rosterId !== roster.rosterId) {
      return {
        success: false,
        message: "Roster player not found."
      };
    }

    player.playerStatus = "REMOVED";
    player.updatedAt = new Date().toISOString();
    writeTournamentRosterPlayerRow_(player, row);

    return tournamentRosterPayloadForPlan_(plan);
  } catch (err) {
    return {
      success: false,
      message: "Could not remove player from roster draft"
    };
  }
}

function cancelRosterDraft(data) {
  try {
    var planContext = captainTournamentPlanByIdContext_(data || {});
    if (!planContext.success) return planContext;

    var plan = planContext.plan;
    var row = findTournamentRosterRowByPlanId_(plan.planId);
    var roster = tournamentRosterFromRow_(row);
    if (!roster) {
      return {
        success: false,
        message: "Roster draft not found."
      };
    }

    if (
      roster.rosterStatus === "LOCKED" ||
      roster.rosterStatus === "SUBMITTED" ||
      roster.rosterStatus === "APPROVED"
    ) {
      return {
        success: false,
        message: "Submitted roster draft cannot be cancelled here."
      };
    }

    var now = new Date().toISOString();
    roster.rosterStatus = "CANCELLED";
    roster.updatedAt = now;
    writeTournamentRosterRow_(roster, row);

    tournamentRosterPlayersForRoster_(roster.rosterId, false).forEach(function (player) {
      if (player.playerStatus !== "ACTIVE") return;
      var playerRow = findTournamentRosterPlayerRowById_(player.rosterPlayerId);
      player.playerStatus = "REMOVED";
      player.updatedAt = now;
      writeTournamentRosterPlayerRow_(player, playerRow);
    });

    return tournamentRosterPayloadForPlan_(plan);
  } catch (err) {
    return {
      success: false,
      message: "Could not cancel roster draft"
    };
  }
}

function listMyRosterStatusForPlayer(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var username = playerHubUsername_(context.user).toLowerCase();
    var rostersById = {};
    tournamentRosterRows_().forEach(function (row) {
      var roster = tournamentRosterFromRow_(row);
      if (roster && roster.rosterId) rostersById[roster.rosterId] = roster;
    });

    var rosters = tournamentRosterPlayerRows_()
      .map(tournamentRosterPlayerFromRow_)
      .filter(function (player) {
        return (
          player &&
          player.playerStatus === "ACTIVE" &&
          String(player.playerUsername || "").trim().toLowerCase() === username
        );
      })
      .map(function (player) {
        var roster = rostersById[player.rosterId] || {};
        return Object.assign({}, roster, {
          rosterPlayer: player,
          assignedSquad: player.assignedSquad,
          rosterRole: player.rosterRole
        });
      })
      .sort(function (a, b) {
        var aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
        var bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
        return bTime - aTime;
      });

    return {
      success: true,
      rosters: rosters
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load roster status"
    };
  }
}

function listRosterDraftAdmin(data) {
  return listSubmittedRosterDraftsForReview(data);
}

function listSubmittedRosterDraftsForReview(data) {
  try {
    var reviewerCheck = requireRosterReviewer_(data || {});
    if (!reviewerCheck.success) {
      return {
        success: false,
        message: reviewerCheck.message
      };
    }

    var reviewStatuses = {
      SUBMITTED: true,
      APPROVED: true,
      REJECTED: true,
      LOCKED: true
    };
    var rosters = tournamentRosterRows_()
      .map(tournamentRosterFromRow_)
      .filter(Boolean)
      .filter(function (roster) {
        return !!reviewStatuses[roster.rosterStatus];
      })
      .map(decorateTournamentRoster_)
      .sort(function (a, b) {
        var aTime = Date.parse(a.updatedAt || a.submittedAt || a.createdAt || "") || 0;
        var bTime = Date.parse(b.updatedAt || b.submittedAt || b.createdAt || "") || 0;
        return bTime - aTime;
      });

    return {
      success: true,
      rosters: rosters
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load roster drafts"
    };
  }
}

function reviewRosterDraft(data) {
  try {
    var reviewerCheck = requireRosterReviewer_(data || {});
    if (!reviewerCheck.success) return reviewerCheck;

    var draftId = String(
      data && (data.draftId || data.rosterId || data.planId) || ""
    ).trim();
    var row = findTournamentRosterRowById_(draftId);
    var roster = tournamentRosterFromRow_(row);
    if (!roster && draftId) {
      row = findTournamentRosterRowByPlanId_(draftId);
      roster = tournamentRosterFromRow_(row);
    }
    if (!roster) {
      return {
        success: false,
        message: "Roster draft not found."
      };
    }

    var decision = String(data && data.decision || "").trim().toUpperCase();
    if (decision === "APPROVE") decision = "APPROVED";
    if (decision === "REJECT") decision = "REJECTED";
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return {
        success: false,
        message: "Choose approve or reject."
      };
    }
    if (roster.rosterStatus !== "SUBMITTED") {
      return {
        success: false,
        message: "Only submitted roster drafts can be reviewed."
      };
    }

    var players = tournamentRosterPlayersForRoster_(roster.rosterId, true);
    if (decision === "APPROVED" && !players.length) {
      return {
        success: false,
        message: "Roster draft needs at least one player."
      };
    }

    var now = new Date().toISOString();
    roster.rosterStatus = decision;
    roster.reviewedBy = playerHubUsername_(reviewerCheck.user);
    roster.reviewedAt = now;
    roster.adminNote = playerProfileText_(data && data.adminNote, 500);
    roster.updatedAt = now;
    writeTournamentRosterRow_(roster, row);

    return {
      success: true,
      roster: decorateTournamentRoster_(roster),
      players: tournamentRosterPlayersForRoster_(roster.rosterId, true)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not review roster draft"
    };
  }
}

function lockOfficialRoster(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var draftId = String(
      data && (data.draftId || data.rosterId || data.planId) || ""
    ).trim();
    var row = findTournamentRosterRowById_(draftId);
    var roster = tournamentRosterFromRow_(row);
    if (!roster && draftId) {
      row = findTournamentRosterRowByPlanId_(draftId);
      roster = tournamentRosterFromRow_(row);
    }
    if (!roster) {
      return {
        success: false,
        message: "Roster draft not found."
      };
    }
    if (!userCanLockOfficialRoster_(context.user, roster)) {
      return {
        success: false,
        message: "Captain, tournament or admin access required."
      };
    }

    if (roster.rosterStatus === "LOCKED") {
      return {
        success: true,
        roster: decorateTournamentRoster_(roster),
        officialPlayers: officialRosterRowsForDraft_(roster.rosterId)
      };
    }
    if (roster.rosterStatus !== "APPROVED") {
      return {
        success: false,
        message: "Approve the roster draft before locking."
      };
    }

    var players = tournamentRosterPlayersForRoster_(roster.rosterId, true);
    if (!players.length) {
      return {
        success: false,
        message: "Roster draft needs at least one player."
      };
    }

    var now = new Date().toISOString();
    var lockedBy = playerHubUsername_(context.user);
    var existingOfficialRows = officialRosterRowsForDraft_(roster.rosterId);
    if (!existingOfficialRows.length) {
      players.forEach(function (player) {
        writeOfficialRosterRow_(
          {
            officialRosterId: "official-roster-" + roster.rosterId,
            draftId: roster.rosterId,
            tournamentId: roster.tournamentId,
            tournamentName: roster.tournamentName,
            teamId: roster.clubTeamId || roster.teamProfileId,
            teamName: roster.clubTeamName,
            squadLabel: roster.squadLabel,
            groupName: officialRosterGroupName_(player.assignedSquad),
            playerUsername: player.playerUsername,
            playerDisplayName: player.playerDisplayName,
            playerCountry: player.playerCountry,
            status: "LOCKED",
            lockedAt: now,
            lockedBy: lockedBy,
            createdAt: now
          },
          null
        );
      });
    }

    roster.rosterStatus = "LOCKED";
    roster.lockedAt = now;
    roster.lockedBy = lockedBy;
    roster.lockReason = playerProfileText_(data && data.adminNote, 500);
    roster.updatedAt = now;
    writeTournamentRosterRow_(roster, row);

    return {
      success: true,
      roster: decorateTournamentRoster_(roster),
      players: tournamentRosterPlayersForRoster_(roster.rosterId, true),
      officialPlayers: officialRosterRowsForDraft_(roster.rosterId)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not lock official roster"
    };
  }
}

function listTeamProfilesAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var needs = teamNeedsRows_().map(teamNeedFromRow_).filter(Boolean);
    var needsByProfile = {};
    needs.forEach(function (need) {
      if (!needsByProfile[need.teamProfileId]) needsByProfile[need.teamProfileId] = [];
      needsByProfile[need.teamProfileId].push(need);
    });

    var profiles = teamProfileRows_()
      .map(teamProfileFromRow_)
      .filter(Boolean)
      .map(function (profile) {
        var profileNeeds = needsByProfile[profile.teamProfileId] || [];
        return Object.assign({}, profile, {
          needsCount: profileNeeds.length,
          openNeedsCount: profileNeeds.filter(function (need) {
            return need.status === "OPEN";
          }).length
        });
      })
      .sort(function (a, b) {
        var aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
        var bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
        return bTime - aTime;
      });

    return {
      success: true,
      teamProfiles: profiles
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load team profiles"
    };
  }
}

function updateTeamProfileAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var teamProfileId = String(data && data.teamProfileId || "").trim();
    var row = findTeamProfileRowById_(teamProfileId);
    var profile = teamProfileFromRow_(row);
    if (!profile) {
      return {
        success: false,
        message: "Team profile not found"
      };
    }

    if (data && data.active !== undefined) profile.active = truthy_(data.active);
    if (data && data.publicVisible !== undefined) {
      profile.publicVisible = truthy_(data.publicVisible);
    }
    if (data && data.approved !== undefined) profile.approved = truthy_(data.approved);
    profile.updatedAt = new Date().toISOString();
    writeTeamProfileRow_(profile, row);

    return {
      success: true,
      teamProfile: profile
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not update team profile"
    };
  }
}

function usernameExistsCaseInsensitive_(username) {
  var normalized = String(username || "").trim().toLowerCase();
  if (!normalized) return false;

  var users = getUserRecords();
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].username || "").trim().toLowerCase() === normalized) {
      return true;
    }
  }

  return false;
}

function getUserByUsernameCaseInsensitive_(username) {
  var normalized = String(username || "").trim().toLowerCase();
  if (!normalized) return null;

  var users = getUserRecords();
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].username || "").trim().toLowerCase() === normalized) {
      return users[i];
    }
  }

  return null;
}

function normalizeRegistrationEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeRegistrationUsername_(value) {
  return String(value || "").trim().toLowerCase();
}

function registrationUsernameValidationMessage_(username) {
  var value = String(username || "");
  if (!value) return "Username is required";
  if (value.length < 4 || value.length > 20) {
    return "Username must be 4–20 characters.";
  }
  if (!/^[a-z]/.test(value)) {
    return "Username must start with a letter.";
  }
  if (!/^[a-z0-9._-]+$/.test(value)) {
    return "Username can only use letters, numbers, dot, underscore or hyphen.";
  }
  return "";
}

function registerPlayerAccount(data) {
  try {
    var username = normalizeRegistrationUsername_(data && data.username);
    var firstName = playerProfileText_(data && data.firstName, 80);
    var lastName = playerProfileText_(data && data.lastName, 80);
    var displayName = playerProfileText_(
      [firstName, lastName].filter(Boolean).join(" "),
      120
    );
    var email = normalizeRegistrationEmail_(data && data.email);
    var password = String((data && data.password) || "").trim();
    var usernameValidationMessage = registrationUsernameValidationMessage_(username);

    if (!firstName || !lastName) {
      return {
        success: false,
        message: "First name and last name are required."
      };
    }

    if (usernameValidationMessage) {
      return {
        success: false,
        message: usernameValidationMessage
      };
    }

    if (email && email.indexOf("@") === -1) {
      return {
        success: false,
        message: "Please enter a valid email address"
      };
    }

    if (!password) {
      return {
        success: false,
        message: "Password is required"
      };
    }

    if (usernameExistsCaseInsensitive_(username)) {
      return {
        success: false,
        message: "Username already exists"
      };
    }

    if (
      email &&
      (usernameExistsCaseInsensitive_(email) || playerProfileEmailExists_(email))
    ) {
      return {
        success: false,
        message: "A player account with this email already exists"
      };
    }

    var usersSheet = getUsersSheet();
    usersSheet.appendRow([
      username,
      hashPassword(password),
      "player",
      "",
      "numbers",
      5,
      true,
      false,
      false
    ]);

    var profile = buildPlayerProfileForSave_(
      {
        firstName: firstName,
        lastName: lastName,
        displayName: displayName,
        email: email,
        phone: data && data.phone,
        country: data && data.country,
        clubOrTeam: data && data.clubOrTeam,
        profileType: "Player",
        freeAgent: data && data.freeAgent,
        canGuestForTeams: false,
        interestedAbroad: false,
        publicVisible: false
      },
      null,
      { username: username }
    );

    profile.publicVisible = false;
    profile.approved = false;
    profile.profileType = "Player";
    writePlayerProfileRow_(profile, null);

    return {
      success: true,
      message: "Player profile created. You can now log in with your username.",
      username: username
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not create player profile"
    };
  }
}

function getMyPlayerProfile(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var username = playerHubUsername_(context.user);
    var row = findPlayerProfileRowByUsername_(username);

    return {
      success: true,
      profile: playerProfileFromRow_(row, context.user)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load player profile"
    };
  }
}

function safeSnapshotCall_(fallback, callback) {
  try {
    var result = callback();
    if (result && result.success === false) return fallback;
    return result || fallback;
  } catch (err) {
    return fallback;
  }
}

function playerHubSnapshotLog_(message) {
  try {
    console.log(message);
  } catch (err) {}
  try {
    Logger.log(message);
  } catch (err2) {}
}

function playerHubSnapshotTimer_() {
  var now = Date.now();
  return {
    start: now,
    last: now
  };
}

function playerHubSnapshotStep_(timer, label) {
  var now = Date.now();
  playerHubSnapshotLog_("[Snapshot] " + label + " " + (now - timer.last) + "ms");
  timer.last = now;
}

function playerHubSnapshotTotal_(timer) {
  playerHubSnapshotLog_("[Snapshot] total " + (Date.now() - timer.start) + "ms");
}

function playerHubSnapshotContext_(user) {
  return {
    spreadsheet: getMainSpreadsheet(),
    user: user,
    rows: {},
    data: {},
    maps: {}
  };
}

function playerHubSnapshotRows_(ctx, sheetName, headers, label) {
  if (ctx.rows[sheetName]) return ctx.rows[sheetName];

  var sheet = ctx.spreadsheet.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) {
    ctx.rows[sheetName] = [];
    playerHubSnapshotLog_("[Snapshot] " + label + " rows=0");
    return ctx.rows[sheetName];
  }

  var lastCol = Math.max(sheet.getLastColumn(), headers.length);
  var sheetHeaders = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  ctx.rows[sheetName] = values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    sheetHeaders.forEach(function (header, columnIndex) {
      if (header) record[header] = row[columnIndex];
    });
    return record;
  });
  playerHubSnapshotLog_(
    "[Snapshot] " + label + " rows=" + ctx.rows[sheetName].length
  );
  return ctx.rows[sheetName];
}

function playerHubSnapshotData_(ctx, key, sheetName, headers, label, mapper) {
  if (ctx.data[key]) return ctx.data[key];
  ctx.data[key] = playerHubSnapshotRows_(ctx, sheetName, headers, label)
    .map(mapper)
    .filter(Boolean);
  return ctx.data[key];
}

function playerHubSnapshotUsernameKey_(value) {
  return String(value || "").trim().toLowerCase();
}

function playerHubSnapshotSortRecent_(items) {
  return (items || []).sort(function (a, b) {
    var aTime =
      Date.parse(a.updatedAt || a.reviewedAt || a.confirmedAt || a.createdAt || "") || 0;
    var bTime =
      Date.parse(b.updatedAt || b.reviewedAt || b.confirmedAt || b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

function playerHubSnapshotProfiles_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "profiles",
    PLAYER_PROFILES_SHEET_,
    PLAYER_PROFILE_HEADERS_,
    "PlayerProfiles",
    function (row) {
      return playerProfileFromRow_(row, { username: row.Username });
    }
  );
}

function playerHubSnapshotClubs_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "clubs",
    CLUB_TEAMS_SHEET_,
    CLUB_TEAM_HEADERS_,
    "ClubTeams",
    clubTeamFromRow_
  );
}

function playerHubSnapshotAccessRequests_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "accessRequests",
    ACCESS_REQUESTS_SHEET_,
    ACCESS_REQUEST_HEADERS_,
    "AccessRequests",
    accessRequestFromRow_
  );
}

function playerHubSnapshotTeamProfiles_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "teamProfiles",
    TEAM_PROFILES_SHEET_,
    TEAM_PROFILE_HEADERS_,
    "TeamProfiles",
    teamProfileFromRow_
  );
}

function playerHubSnapshotTeamNeeds_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "teamNeeds",
    TEAM_NEEDS_SHEET_,
    TEAM_NEED_HEADERS_,
    "TeamNeeds",
    teamNeedFromRow_
  );
}

function playerHubSnapshotTeamNeedInterests_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "teamNeedInterests",
    TEAM_NEED_INTERESTS_SHEET_,
    TEAM_NEED_INTEREST_HEADERS_,
    "TeamNeedInterests",
    teamNeedInterestFromRow_
  );
}

function playerHubSnapshotTeamMembers_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "teamMembers",
    TEAM_MEMBERS_SHEET_,
    TEAM_MEMBER_HEADERS_,
    "TeamMembers",
    teamMemberFromRow_
  );
}

function playerHubSnapshotMembershipRequests_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "membershipRequests",
    TEAM_MEMBERSHIP_REQUESTS_SHEET_,
    TEAM_MEMBERSHIP_REQUEST_HEADERS_,
    "TeamMembershipRequests",
    teamMembershipRequestFromRow_
  );
}

function playerHubSnapshotTeamChangeRequests_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "teamChangeRequests",
    TEAM_CHANGE_REQUESTS_SHEET_,
    TEAM_CHANGE_REQUEST_HEADERS_,
    "TeamChangeRequests",
    teamChangeRequestFromRow_
  );
}

function playerHubSnapshotTournamentPlans_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "tournamentPlans",
    TOURNAMENT_TEAM_PLANS_SHEET_,
    TOURNAMENT_TEAM_PLAN_HEADERS_,
    "TournamentPlans",
    tournamentTeamPlanFromRow_
  );
}

function playerHubSnapshotTournamentAvailability_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "tournamentAvailability",
    TOURNAMENT_AVAILABILITY_SHEET_,
    TOURNAMENT_AVAILABILITY_HEADERS_,
    "TournamentAvailability",
    tournamentAvailabilityFromRow_
  );
}

function playerHubSnapshotSquadPlanning_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "squadPlanning",
    TOURNAMENT_SQUAD_PLANNING_SHEET_,
    TOURNAMENT_SQUAD_PLANNING_HEADERS_,
    "TournamentSquadPlanning",
    tournamentSquadPlanningFromRow_
  );
}

function playerHubSnapshotRosters_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "rosters",
    TOURNAMENT_ROSTERS_SHEET_,
    TOURNAMENT_ROSTER_HEADERS_,
    "RosterDrafts",
    tournamentRosterFromRow_
  );
}

function playerHubSnapshotRosterPlayers_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "rosterPlayers",
    TOURNAMENT_ROSTER_PLAYERS_SHEET_,
    TOURNAMENT_ROSTER_PLAYER_HEADERS_,
    "RosterPlayers",
    tournamentRosterPlayerFromRow_
  );
}

function playerHubSnapshotProfilesByUsername_(ctx) {
  if (ctx.maps.profilesByUsername) return ctx.maps.profilesByUsername;
  var map = {};
  playerHubSnapshotProfiles_(ctx).forEach(function (profile) {
    var key = playerHubSnapshotUsernameKey_(profile.username);
    if (key) map[key] = profile;
  });
  ctx.maps.profilesByUsername = map;
  return map;
}

function playerHubSnapshotClubsById_(ctx) {
  if (ctx.maps.clubsById) return ctx.maps.clubsById;
  var map = {};
  playerHubSnapshotClubs_(ctx).forEach(function (team) {
    if (team.teamId) map[String(team.teamId)] = team;
  });
  ctx.maps.clubsById = map;
  return map;
}

function playerHubSnapshotTeamProfilesById_(ctx) {
  if (ctx.maps.teamProfilesById) return ctx.maps.teamProfilesById;
  var map = {};
  playerHubSnapshotTeamProfiles_(ctx).forEach(function (profile) {
    if (profile.teamProfileId) map[String(profile.teamProfileId)] = profile;
  });
  ctx.maps.teamProfilesById = map;
  return map;
}

function playerHubSnapshotPlansById_(ctx) {
  if (ctx.maps.plansById) return ctx.maps.plansById;
  var map = {};
  playerHubSnapshotTournamentPlans_(ctx).forEach(function (plan) {
    if (plan.planId) map[String(plan.planId)] = plan;
  });
  ctx.maps.plansById = map;
  return map;
}

function playerHubSnapshotRostersById_(ctx) {
  if (ctx.maps.rostersById) return ctx.maps.rostersById;
  var map = {};
  playerHubSnapshotRosters_(ctx).forEach(function (roster) {
    if (roster.rosterId) map[String(roster.rosterId)] = roster;
  });
  ctx.maps.rostersById = map;
  return map;
}

function playerHubSnapshotRosterPlayersByRoster_(ctx) {
  if (ctx.maps.rosterPlayersByRoster) return ctx.maps.rosterPlayersByRoster;
  var map = {};
  playerHubSnapshotRosterPlayers_(ctx).forEach(function (player) {
    if (!player || !player.rosterId) return;
    if (!map[player.rosterId]) map[player.rosterId] = [];
    map[player.rosterId].push(player);
  });
  ctx.maps.rosterPlayersByRoster = map;
  return map;
}

function playerHubSnapshotInterestCountsByNeed_(ctx) {
  if (ctx.maps.interestCountsByNeed) return ctx.maps.interestCountsByNeed;
  var counts = {};
  playerHubSnapshotTeamNeedInterests_(ctx).forEach(function (interest) {
    var needId = String(interest.needId || "").trim();
    if (!needId) return;
    if (!counts[needId]) counts[needId] = { acceptedCount: 0, pendingCount: 0 };
    if (interest.status === "ACCEPTED") counts[needId].acceptedCount += 1;
    if (interest.status === "PENDING") counts[needId].pendingCount += 1;
  });
  ctx.maps.interestCountsByNeed = counts;
  return counts;
}

function playerHubSnapshotResponseSummaryByPlan_(ctx) {
  if (ctx.maps.responseSummaryByPlan) return ctx.maps.responseSummaryByPlan;
  var summaries = {};
  playerHubSnapshotTournamentAvailability_(ctx).forEach(function (availability) {
    var planId = String(availability.planId || "").trim();
    if (!planId) return;
    if (!summaries[planId]) {
      summaries[planId] = {
        yes: 0,
        maybe: 0,
        no: 0,
        pending: 0,
        total: 0
      };
    }
    summaries[planId].total += 1;
    if (availability.responseStatus === "YES") summaries[planId].yes += 1;
    else if (availability.responseStatus === "MAYBE") summaries[planId].maybe += 1;
    else if (availability.responseStatus === "NO") summaries[planId].no += 1;
    else summaries[planId].pending += 1;
  });
  ctx.maps.responseSummaryByPlan = summaries;
  return summaries;
}

function playerHubSnapshotLatestInterest_(ctx, username, needId) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  var targetNeedId = String(needId || "").trim();
  if (!targetUsername || !targetNeedId) return null;
  var matches = playerHubSnapshotTeamNeedInterests_(ctx).filter(function (interest) {
    return (
      interest &&
      interest.needId === targetNeedId &&
      playerHubSnapshotUsernameKey_(interest.playerUsername) === targetUsername
    );
  });
  return playerHubSnapshotSortRecent_(matches)[0] || null;
}

function playerHubSnapshotEnrichTeamNeed_(ctx, need, username) {
  if (!need) return need;
  var profilesByUsername = playerHubSnapshotProfilesByUsername_(ctx);
  var profileById = playerHubSnapshotTeamProfilesById_(ctx);
  var clubsById = playerHubSnapshotClubsById_(ctx);
  var counts = playerHubSnapshotInterestCountsByNeed_(ctx)[need.needId] || {};
  var teamProfile = profileById[need.teamProfileId] || {};
  var club = clubsById[need.clubTeamId] || {};
  var captainProfile =
    profilesByUsername[playerHubSnapshotUsernameKey_(need.captainUsername)] || {};
  var neededCount = Math.max(1, Number(need.neededCount) || 1);
  var acceptedCount = Number(counts.acceptedCount) || 0;
  var pendingCount = Number(counts.pendingCount) || 0;
  var remainingCount = Math.max(neededCount - acceptedCount, 0);
  var latestInterest = playerHubSnapshotLatestInterest_(ctx, username, need.needId);
  var currentUsername = playerHubSnapshotUsernameKey_(username);

  return Object.assign({}, need, {
    neededCount: neededCount,
    acceptedCount: acceptedCount,
    pendingCount: pendingCount,
    remainingCount: remainingCount,
    filled: remainingCount <= 0,
    country: teamProfile.country || club.country || captainProfile.country || "",
    captainDisplayName:
      teamProfile.captainDisplayName || captainProfile.displayName || "",
    ownTeamNeed:
      currentUsername &&
      playerHubSnapshotUsernameKey_(need.captainUsername) === currentUsername,
    myInterestStatus: latestInterest ? latestInterest.status : "",
    myInterestId: latestInterest ? latestInterest.interestId : ""
  });
}

function playerHubSnapshotEnrichTeamNeedInterest_(ctx, interest) {
  if (!interest) return interest;
  var profile =
    playerHubSnapshotProfilesByUsername_(ctx)[
      playerHubSnapshotUsernameKey_(interest.playerUsername)
    ] || {};
  return Object.assign({}, interest, {
    playerDisplayName: interest.playerDisplayName || profile.displayName || "",
    playerEmail: interest.playerEmail || profile.email || "",
    playerPhone: interest.playerPhone || profile.phone || "",
    playerCountry: interest.playerCountry || profile.country || "",
    playerClubTeamName:
      profile && !profile.freeAgent
        ? profile.clubTeamName || profile.teamNote || ""
        : "No fixed club/team"
  });
}

function playerHubSnapshotEnrichTeamMember_(ctx, member) {
  if (!member) return member;
  var profile =
    playerHubSnapshotProfilesByUsername_(ctx)[
      playerHubSnapshotUsernameKey_(member.playerUsername)
    ] || {};
  var teamProfile = playerHubSnapshotTeamProfilesById_(ctx)[member.teamProfileId] || {};
  var club = playerHubSnapshotClubsById_(ctx)[member.clubTeamId] || {};
  return Object.assign({}, member, {
    playerDisplayName: member.playerDisplayName || profile.displayName || "",
    playerEmail: member.playerEmail || profile.email || "",
    playerPhone: member.playerPhone || profile.phone || "",
    playerCountry: member.playerCountry || profile.country || "",
    teamCountry: teamProfile.country || club.country || "",
    playerClubTeamName:
      profile && !profile.freeAgent
        ? profile.clubTeamName || profile.teamNote || ""
        : "No fixed club/team"
  });
}

function playerHubSnapshotActiveMemberExists_(ctx, clubTeamId, username) {
  var targetClubTeamId = String(clubTeamId || "").trim();
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  if (!targetClubTeamId || !targetUsername) return false;
  return playerHubSnapshotTeamMembers_(ctx).some(function (member) {
    return (
      member &&
      member.memberStatus === "ACTIVE" &&
      member.clubTeamId === targetClubTeamId &&
      playerHubSnapshotUsernameKey_(member.playerUsername) === targetUsername
    );
  });
}

function playerHubSnapshotEnrichMembershipRequest_(ctx, request) {
  if (!request) return request;
  var profile =
    playerHubSnapshotProfilesByUsername_(ctx)[
      playerHubSnapshotUsernameKey_(request.playerUsername)
    ] || {};
  return Object.assign({}, request, {
    playerDisplayName: request.playerDisplayName || profile.displayName || "",
    playerEmail: request.playerEmail || profile.email || "",
    playerPhone: request.playerPhone || profile.phone || "",
    playerCountry: request.playerCountry || profile.country || "",
    alreadyConfirmed: playerHubSnapshotActiveMemberExists_(
      ctx,
      request.clubTeamId,
      request.playerUsername
    )
  });
}

function playerHubSnapshotEnrichAvailability_(ctx, availability) {
  if (!availability) return availability;
  var plan = playerHubSnapshotPlansById_(ctx)[availability.planId] || {};
  return Object.assign({}, availability, {
    squadLabel: plan.squadLabel || "",
    className: plan.className || "",
    deadlineAt: plan.deadlineAt || "",
    planStatus: plan.planStatus || ""
  });
}

function playerHubSnapshotDecoratePlan_(ctx, plan) {
  if (!plan) return plan;
  var summaries = playerHubSnapshotResponseSummaryByPlan_(ctx);
  return Object.assign({}, plan, {
    responseSummary:
      summaries[plan.planId] || { yes: 0, maybe: 0, no: 0, pending: 0, total: 0 }
  });
}

function playerHubSnapshotDecorateRoster_(ctx, roster) {
  if (!roster) return roster;
  var players = (playerHubSnapshotRosterPlayersByRoster_(ctx)[roster.rosterId] || [])
    .filter(function (player) {
      return player && player.playerStatus === "ACTIVE";
    })
    .sort(function (a, b) {
      var squadOrder = { A: 1, B: 2, C: 3, RESERVE: 4, UNASSIGNED: 5 };
      var squadDiff =
        (squadOrder[a.assignedSquad] || 99) - (squadOrder[b.assignedSquad] || 99);
      if (squadDiff !== 0) return squadDiff;
      var aName = String(a.playerDisplayName || a.playerUsername || "");
      var bName = String(b.playerDisplayName || b.playerUsername || "");
      return aName.localeCompare(bName);
    });
  return Object.assign({}, roster, {
    players: players,
    playerCount: players.length,
    officialPlayers: [],
    officialPlayerCount: 0
  });
}

function playerHubSnapshotHasCaptainApproval_(ctx, username, clubTeamId, clubTeamName) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  var targetClubTeamId = String(clubTeamId || "").trim();
  var targetClubTeamName = String(clubTeamName || "").trim().toLowerCase();
  if (!targetUsername) return false;

  return playerHubSnapshotAccessRequests_(ctx).some(function (request) {
    if (!request || request.requestType !== "CAPTAIN" || request.status !== "APPROVED") {
      return false;
    }
    if (playerHubSnapshotUsernameKey_(request.username) !== targetUsername) return false;
    if (targetClubTeamId && String(request.clubTeamId || "").trim() === targetClubTeamId) {
      return true;
    }
    return (
      targetClubTeamName &&
      String(request.clubTeamName || "").trim().toLowerCase() === targetClubTeamName
    );
  });
}

function playerHubSnapshotTeamProfileForCaptain_(ctx, username, clubTeamId, clubTeamName) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  var targetClubTeamId = String(clubTeamId || "").trim();
  var targetClubTeamName = String(clubTeamName || "").trim().toLowerCase();
  if (!targetUsername || (!targetClubTeamId && !targetClubTeamName)) return null;

  var profiles = playerHubSnapshotTeamProfiles_(ctx);
  for (var i = 0; i < profiles.length; i++) {
    var profile = profiles[i];
    if (!profile) continue;
    if (playerHubSnapshotUsernameKey_(profile.captainUsername) !== targetUsername) {
      continue;
    }
    if (targetClubTeamId && profile.clubTeamId === targetClubTeamId) return profile;
    if (
      targetClubTeamName &&
      String(profile.clubTeamName || "").trim().toLowerCase() === targetClubTeamName
    ) {
      return profile;
    }
  }
  return null;
}

function playerHubSnapshotAvailableClubs_(ctx) {
  return playerHubSnapshotClubs_(ctx)
    .filter(function (team) {
      return team && team.active;
    })
    .sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
}

function playerHubSnapshotProfile_(ctx, user) {
  var username = playerHubSnapshotUsernameKey_(playerHubUsername_(user));
  return (
    playerHubSnapshotProfilesByUsername_(ctx)[username] ||
    defaultPlayerProfileForUser_(user)
  );
}

function playerHubSnapshotAccessRequestsForUser_(ctx, username) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  return playerHubSnapshotSortRecent_(
    playerHubSnapshotAccessRequests_(ctx).filter(function (request) {
      return request && playerHubSnapshotUsernameKey_(request.username) === targetUsername;
    })
  );
}

function playerHubSnapshotVisibleTeamNeeds_(ctx, username) {
  return playerHubSnapshotSortRecent_(
    playerHubSnapshotTeamNeeds_(ctx)
      .filter(function (need) {
        return isPublishedTournamentTeamNeed_(need);
      })
      .map(function (need) {
        return playerHubSnapshotEnrichTeamNeed_(ctx, need, username);
      })
  );
}

function playerHubSnapshotMyTeamNeedInterests_(ctx, username) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  return playerHubSnapshotSortRecent_(
    playerHubSnapshotTeamNeedInterests_(ctx)
      .filter(function (interest) {
        return (
          interest &&
          playerHubSnapshotUsernameKey_(interest.playerUsername) === targetUsername
        );
      })
      .map(function (interest) {
        return playerHubSnapshotEnrichTeamNeedInterest_(ctx, interest);
      })
  );
}

function playerHubSnapshotMyTeams_(ctx, username) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  return playerHubSnapshotSortRecent_(
    playerHubSnapshotTeamMembers_(ctx)
      .filter(function (member) {
        return (
          member &&
          member.memberStatus === "ACTIVE" &&
          playerHubSnapshotUsernameKey_(member.playerUsername) === targetUsername
        );
      })
      .map(function (member) {
        return playerHubSnapshotEnrichTeamMember_(ctx, member);
      })
  );
}

function playerHubSnapshotMembershipRequestsForPlayer_(ctx, username) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  return sortTeamMembershipRequests_(
    playerHubSnapshotMembershipRequests_(ctx)
      .filter(function (request) {
        return (
          request &&
          playerHubSnapshotUsernameKey_(request.playerUsername) === targetUsername
        );
      })
      .map(function (request) {
        return playerHubSnapshotEnrichMembershipRequest_(ctx, request);
      })
  );
}

function playerHubSnapshotTournamentAvailabilityForPlayer_(ctx, username) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  return playerHubSnapshotSortRecent_(
    playerHubSnapshotTournamentAvailability_(ctx)
      .filter(function (availability) {
        return (
          availability &&
          playerHubSnapshotUsernameKey_(availability.playerUsername) === targetUsername
        );
      })
      .map(function (availability) {
        return playerHubSnapshotEnrichAvailability_(ctx, availability);
      })
  );
}

function playerHubSnapshotPlannedTeamsForPlayer_(ctx, username) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  return playerHubSnapshotSortRecent_(
    playerHubSnapshotSquadPlanning_(ctx).filter(function (item) {
      if (!item || item.planningStatus !== "PLANNED") return false;
      if (playerHubSnapshotUsernameKey_(item.playerUsername) !== targetUsername) {
        return false;
      }
      if (item.availabilityStatus !== "YES" && item.availabilityStatus !== "MAYBE") {
        return false;
      }
      return normalizeAssignedSquad_(item.assignedSquad) !== "UNASSIGNED";
    })
  );
}

function playerHubSnapshotRosterStatusForPlayer_(ctx, username) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  var rostersById = playerHubSnapshotRostersById_(ctx);
  return playerHubSnapshotSortRecent_(
    playerHubSnapshotRosterPlayers_(ctx)
      .filter(function (player) {
        return (
          player &&
          player.playerStatus === "ACTIVE" &&
          playerHubSnapshotUsernameKey_(player.playerUsername) === targetUsername
        );
      })
      .map(function (player) {
        var roster = rostersById[player.rosterId] || {};
        return Object.assign({}, roster, {
          rosterPlayer: player,
          assignedSquad: player.assignedSquad,
          rosterRole: player.rosterRole
        });
      })
  );
}

function playerHubCaptainSnapshot_(ctx, user, profile) {
  var username = playerHubUsername_(user);
  var clubsById = playerHubSnapshotClubsById_(ctx);
  var selectedTeam = profile && profile.clubTeamId
    ? clubsById[String(profile.clubTeamId || "").trim()]
    : null;
  if (selectedTeam && !selectedTeam.active) selectedTeam = null;
  var canManage = !!(
    selectedTeam &&
    playerHubSnapshotHasCaptainApproval_(
      ctx,
      username,
      selectedTeam.teamId,
      selectedTeam.name
    )
  );
  var teamProfile = canManage
    ? playerHubSnapshotTeamProfileForCaptain_(
        ctx,
        username,
        selectedTeam.teamId,
        selectedTeam.name
      )
    : null;

  if (!canManage || !teamProfile) {
    return {
      canManageTeamProfile: canManage,
      message: canManage
        ? ""
        : selectedTeam
          ? "Captain approval required."
          : "Select a club/team in your player profile first.",
      teamProfile: teamProfile,
      needs: [],
      interests: [],
      members: [],
      membershipRequests: [],
      identityRequests: [],
      tournamentPlans: [],
      rosterDraftsByPlanId: {}
    };
  }

  var needs = playerHubSnapshotSortRecent_(
    playerHubSnapshotTeamNeeds_(ctx)
      .filter(function (need) {
        return need && need.teamProfileId === teamProfile.teamProfileId;
      })
      .map(function (need) {
        return playerHubSnapshotEnrichTeamNeed_(ctx, need, username);
      })
  );
  var needIds = {};
  needs.forEach(function (need) {
    if (need.needId) needIds[need.needId] = true;
  });
  var interests = playerHubSnapshotSortRecent_(
    playerHubSnapshotTeamNeedInterests_(ctx)
      .filter(function (interest) {
        return interest && needIds[interest.needId];
      })
      .map(function (interest) {
        return playerHubSnapshotEnrichTeamNeedInterest_(ctx, interest);
      })
  );
  var members = playerHubSnapshotSortRecent_(
    playerHubSnapshotTeamMembers_(ctx)
      .filter(function (member) {
        return (
          member &&
          member.teamProfileId === teamProfile.teamProfileId &&
          member.memberStatus === "ACTIVE"
        );
      })
      .map(function (member) {
        return playerHubSnapshotEnrichTeamMember_(ctx, member);
      })
  );
  var membershipRequests = sortTeamMembershipRequests_(
    playerHubSnapshotMembershipRequests_(ctx)
      .filter(function (request) {
        return request && request.clubTeamId === teamProfile.clubTeamId;
      })
      .map(function (request) {
        return playerHubSnapshotEnrichMembershipRequest_(ctx, request);
      })
  );
  var identityRequests = playerHubSnapshotSortRecent_(
    playerHubSnapshotTeamChangeRequests_(ctx).filter(function (request) {
      return (
        request &&
        (request.teamId === teamProfile.clubTeamId ||
          playerHubSnapshotUsernameKey_(request.requestedByUsername) ===
            playerHubSnapshotUsernameKey_(username))
      );
    })
  );
  var tournamentPlans = playerHubSnapshotSortRecent_(
    playerHubSnapshotTournamentPlans_(ctx)
      .filter(function (plan) {
        return plan && plan.teamProfileId === teamProfile.teamProfileId;
      })
      .map(function (plan) {
        return playerHubSnapshotDecoratePlan_(ctx, plan);
      })
  );
  var planIds = {};
  tournamentPlans.forEach(function (plan) {
    if (plan.planId) planIds[plan.planId] = true;
  });
  var rosterDraftsByPlanId = {};
  playerHubSnapshotRosters_(ctx).forEach(function (roster) {
    if (!roster || !planIds[roster.planId]) return;
    rosterDraftsByPlanId[roster.planId] = {
      roster: playerHubSnapshotDecorateRoster_(ctx, roster),
      players: (playerHubSnapshotRosterPlayersByRoster_(ctx)[roster.rosterId] || [])
        .filter(function (player) {
          return player && player.playerStatus === "ACTIVE";
        })
    };
  });

  return {
    canManageTeamProfile: true,
    message: "",
    teamProfile: teamProfile,
    needs: needs,
    interests: interests,
    members: members,
    membershipRequests: membershipRequests,
    identityRequests: identityRequests,
    tournamentPlans: tournamentPlans,
    rosterDraftsByPlanId: rosterDraftsByPlanId
  };
}

function playerHubAdminCounts_(ctx, user) {
  if (!isAdminUser_(user)) {
    return null;
  }

  return {
    playerProfileReviewCount: playerHubSnapshotProfiles_(ctx).filter(function (profile) {
      return !!profile.publicVisible && !profile.approved;
    }).length,
    accessRequestCount: playerHubSnapshotAccessRequests_(ctx).filter(function (request) {
      return request && request.status === "PENDING";
    }).length,
    officialClubsCount: playerHubSnapshotClubs_(ctx).length,
    teamIdentityRequestCount: playerHubSnapshotTeamChangeRequests_(ctx).filter(function (request) {
      return request && request.status === "PENDING";
    }).length,
    teamProfileReviewCount: playerHubSnapshotTeamProfiles_(ctx).length,
    teamNeedInterestReviewCount: playerHubSnapshotTeamNeedInterests_(ctx).length,
    teamMembersReviewCount: playerHubSnapshotTeamMembers_(ctx).length,
    teamMembershipRequestsCount: playerHubSnapshotMembershipRequests_(ctx).filter(function (request) {
      return request && request.status === "PENDING";
    }).length,
    rosterReviewCount: playerHubSnapshotRosters_(ctx).filter(function (roster) {
      return roster && roster.rosterStatus === "SUBMITTED";
    }).length
  };
}

function authorizeSupabaseUrlFetchOnce() {
  var response = UrlFetchApp.fetch(
    "https://kmtvnirpfumleugnrjqe.supabase.co/rest/v1/",
    {
      method: "get",
      muteHttpExceptions: true
    }
  );
  var message =
    "UrlFetch authorization check completed. HTTP " +
    response.getResponseCode();
  Logger.log(message);
  return message;
}

function getSupabaseConfig_() {
  var properties = PropertiesService.getScriptProperties();
  var enabledValue = String(
    properties.getProperty("SUPABASE_PLAYER_HUB_READS_ENABLED") || ""
  )
    .trim()
    .toLowerCase();
  return {
    url: String(properties.getProperty("SUPABASE_URL") || "").trim(),
    serviceRoleKey: String(
      properties.getProperty("SUPABASE_SERVICE_ROLE_KEY") || ""
    ).trim(),
    playerHubReadsEnabled:
      enabledValue === "true" ||
      enabledValue === "1" ||
      enabledValue === "yes" ||
      enabledValue === "on"
  };
}

function isSupabasePlayerHubReadsEnabled_() {
  try {
    var config = getSupabaseConfig_();
    return !!(
      config &&
      config.playerHubReadsEnabled &&
      config.url &&
      config.serviceRoleKey
    );
  } catch (err) {
    playerHubSnapshotLog_(
      "[Snapshot] Supabase config unavailable " +
        (err && err.message ? err.message : String(err))
    );
    return false;
  }
}

function supabasePlayerHubDiagnosticTables_() {
  return [
    { key: "appUsers", table: "app_users", select: "username" },
    {
      key: "playerProfiles",
      table: "player_profiles",
      select: "legacy_profile_id"
    },
    { key: "clubTeams", table: "club_teams", select: "legacy_team_id" },
    {
      key: "teamProfiles",
      table: "team_profiles",
      select: "legacy_team_profile_id"
    },
    {
      key: "teamMembers",
      table: "team_members",
      select: "legacy_team_member_id"
    },
    { key: "teamNeeds", table: "team_needs", select: "legacy_need_id" },
    {
      key: "rosterDrafts",
      table: "roster_drafts",
      select: "legacy_roster_id"
    },
    {
      key: "rosterPlayers",
      table: "roster_players",
      select: "legacy_roster_player_id"
    },
    {
      key: "tournaments",
      table: "tournaments",
      select: "legacy_tournament_id"
    }
  ];
}

function supabasePlayerHubSnapshotTables_() {
  return [
    { key: "appUsers", table: "app_users" },
    { key: "profiles", table: "player_profiles" },
    { key: "clubs", table: "club_teams" },
    { key: "accessRequests", table: "access_requests" },
    { key: "teamProfiles", table: "team_profiles" },
    { key: "teamChangeRequests", table: "team_identity_change_requests" },
    { key: "teamMembers", table: "team_members" },
    { key: "membershipRequests", table: "team_membership_requests" },
    { key: "teamNeeds", table: "team_needs" },
    { key: "teamNeedInterests", table: "team_need_interests" },
    { key: "tournamentPlans", table: "tournament_events" },
    { key: "tournamentAvailability", table: "tournament_availability" },
    { key: "squadPlanning", table: "tournament_squad_planning" },
    { key: "rosters", table: "roster_drafts" },
    { key: "rosterPlayers", table: "roster_players" }
  ];
}

function supabaseContentRangeCount_(response, fallbackCount) {
  var headers = response.getAllHeaders ? response.getAllHeaders() : {};
  var contentRange =
    headers["Content-Range"] ||
    headers["content-range"] ||
    headers["Content-range"] ||
    "";
  var match = String(contentRange).match(/\/(\d+|\*)$/);
  if (match && match[1] !== "*") {
    return Number(match[1]);
  }
  return fallbackCount;
}

function fetchSupabaseTablePage_(config, tableName, select, from, to) {
  var url =
    String(config.url || "").replace(/\/+$/, "") +
    "/rest/v1/" +
    tableName +
    "?select=" +
    encodeURIComponent(select || "*");
  var response = UrlFetchApp.fetch(url, {
    method: "get",
    muteHttpExceptions: true,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: "Bearer " + config.serviceRoleKey,
      Prefer: "count=exact",
      Range: from + "-" + to,
      "Range-Unit": "items"
    }
  });
  var statusCode = response.getResponseCode();
  var body = response.getContentText() || "[]";
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(
      tableName +
        " read failed: " +
        statusCode +
        " " +
        body.slice(0, 160)
    );
  }
  var rows = [];
  try {
    rows = JSON.parse(body || "[]");
  } catch (err) {
    rows = [];
  }
  return {
    response: response,
    rows: Array.isArray(rows) ? rows : []
  };
}

function fetchSupabaseTableCount_(config, tableConfig) {
  var page = fetchSupabaseTablePage_(
    config,
    tableConfig.table,
    tableConfig.select || "*",
    0,
    0
  );
  return supabaseContentRangeCount_(
    page.response,
    Array.isArray(page.rows) ? page.rows.length : 0
  );
}

function fetchSupabaseTableRows_(config, tableName) {
  var pageSize = 1000;
  var from = 0;
  var rows = [];
  while (true) {
    var page = fetchSupabaseTablePage_(
      config,
      tableName,
      "*",
      from,
      from + pageSize - 1
    );
    rows = rows.concat(page.rows || []);
    if (!page.rows || page.rows.length < pageSize) break;
    from += pageSize;
  }
  playerHubSnapshotLog_(
    "[Snapshot] Supabase " + tableName + " rows=" + rows.length
  );
  return rows;
}

function supabaseText_(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function supabaseBool_(value, defaultValue) {
  if (value === undefined || value === null || value === "") return !!defaultValue;
  return truthy_(value);
}

function supabaseProfile_(row, user) {
  return {
    profileId: supabaseText_(row.legacy_profile_id),
    username: supabaseText_(row.username) || playerHubUsername_(user),
    firstName: supabaseText_(row.first_name),
    lastName: supabaseText_(row.last_name),
    displayName: supabaseText_(row.display_name),
    email: supabaseText_(row.email),
    phone: supabaseText_(row.phone),
    country: supabaseText_(row.country || row.region),
    clubOrTeam: supabaseText_(row.club_or_team),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    teamNote: supabaseText_(row.team_note || row.club_or_team),
    profileType: supabaseText_(row.profile_type) === "Captain" ? "Captain" : "Player",
    freeAgent: supabaseBool_(row.free_agent, false),
    region: supabaseText_(row.region),
    primaryRole: supabaseText_(row.primary_role),
    secondaryRole: supabaseText_(row.secondary_role),
    customRole: supabaseText_(row.custom_role),
    level: supabaseText_(row.level),
    availability: supabaseText_(row.availability),
    lookingForTeam: supabaseBool_(row.looking_for_team, false),
    availableAsSubstitute: supabaseBool_(row.available_as_substitute, false),
    canGuestForTeams: supabaseBool_(row.can_guest_for_teams, false),
    interestedAbroad: supabaseBool_(row.interested_abroad, false),
    publicVisible: supabaseBool_(row.public_visible, false),
    approved: supabaseBool_(row.approved, false),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseClub_(row) {
  return {
    teamId: supabaseText_(row.legacy_team_id),
    name: supabaseText_(row.name),
    country: supabaseText_(row.country),
    city: supabaseText_(row.city),
    active: supabaseBool_(row.active, true),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseAccessRequest_(row) {
  return {
    requestId: supabaseText_(row.legacy_request_id),
    username: supabaseText_(row.username),
    displayName: supabaseText_(row.display_name),
    email: supabaseText_(row.email),
    requestType: normalizeAccessRequestType_(row.request_type),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    message: supabaseText_(row.message),
    status: normalizeAccessRequestStatus_(row.status),
    adminNote: supabaseText_(row.admin_note),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at),
    reviewedBy: supabaseText_(row.reviewed_by_username),
    reviewedAt: supabaseText_(row.reviewed_at)
  };
}

function supabaseTeamProfile_(row) {
  return {
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    country: supabaseText_(row.country),
    captainUsername: supabaseText_(row.captain_username),
    captainDisplayName: supabaseText_(row.captain_display_name),
    teamLevel: supabaseText_(row.team_level),
    teamDescription: supabaseText_(row.team_description),
    contactNote: supabaseText_(row.contact_note),
    needsPlayers: supabaseBool_(row.needs_players, false),
    needsText: supabaseText_(row.needs_text),
    active: supabaseBool_(row.active, true),
    publicVisible: supabaseBool_(row.public_visible, false),
    approved: supabaseBool_(row.approved, false),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseTeamChangeRequest_(row) {
  return {
    requestId: supabaseText_(row.legacy_request_id),
    teamId: supabaseText_(row.legacy_team_id),
    currentName: supabaseText_(row.current_name),
    requestedName: supabaseText_(row.requested_name),
    currentCountry: supabaseText_(row.current_country),
    requestedCountry: supabaseText_(row.requested_country),
    currentCity: supabaseText_(row.current_city),
    requestedCity: supabaseText_(row.requested_city),
    requestedByUsername: supabaseText_(row.requested_by_username),
    reason: supabaseText_(row.reason),
    status: normalizeTeamChangeRequestStatus_(row.status),
    adminNote: supabaseText_(row.admin_note),
    createdAt: supabaseText_(row.created_at),
    reviewedAt: supabaseText_(row.reviewed_at),
    reviewedBy: supabaseText_(row.reviewed_by_username)
  };
}

function supabaseTeamMember_(row) {
  return {
    teamMemberId: supabaseText_(row.legacy_team_member_id),
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    captainUsername: supabaseText_(row.captain_username),
    playerUsername: supabaseText_(row.player_username),
    playerDisplayName: supabaseText_(row.player_display_name),
    playerEmail: supabaseText_(row.player_email),
    playerPhone: supabaseText_(row.player_phone),
    playerCountry: supabaseText_(row.player_country),
    sourceInterestId: supabaseText_(row.legacy_source_interest_id),
    memberStatus: normalizeTeamMemberStatus_(row.member_status),
    confirmedBy: supabaseText_(row.confirmed_by_username),
    confirmedAt: supabaseText_(row.confirmed_at),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseMembershipRequest_(row) {
  return {
    requestId: supabaseText_(row.legacy_request_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    playerUsername: supabaseText_(row.player_username),
    playerDisplayName: supabaseText_(row.player_display_name),
    playerEmail: supabaseText_(row.player_email),
    playerPhone: supabaseText_(row.player_phone),
    playerCountry: supabaseText_(row.player_country),
    playerProfileId: supabaseText_(row.legacy_player_profile_id),
    status: normalizeTeamMembershipRequestStatus_(row.status),
    requestedAt: supabaseText_(row.requested_at),
    reviewedBy: supabaseText_(row.reviewed_by_username),
    reviewedAt: supabaseText_(row.reviewed_at),
    reviewNote: supabaseText_(row.review_note),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseTeamNeed_(row) {
  return {
    needId: supabaseText_(row.legacy_need_id),
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    captainUsername: supabaseText_(row.captain_username),
    needType: normalizeTeamNeedType_(row.need_type),
    needText: supabaseText_(row.need_text),
    neededCount: Number(row.needed_count) || 1,
    status: normalizeTeamNeedStatus_(row.status),
    visibility: normalizeTeamNeedVisibility_(row.visibility),
    isPublished: supabaseBool_(row.is_published, false),
    needContext: normalizeTeamNeedContext_(row.need_context),
    tournamentId: supabaseText_(row.legacy_tournament_id),
    tournamentName: supabaseText_(row.tournament_name),
    squadLabel: supabaseText_(row.squad_label),
    className: supabaseText_(row.class_name),
    deadlineAt: supabaseText_(row.deadline_at),
    sourceType: supabaseText_(row.source_type),
    publishedAt: supabaseText_(row.published_at),
    publicVisible: supabaseBool_(row.public_visible, false),
    approved: supabaseBool_(row.approved, false),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseTeamNeedInterest_(row) {
  return {
    interestId: supabaseText_(row.legacy_interest_id),
    needId: supabaseText_(row.legacy_need_id),
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    playerUsername: supabaseText_(row.player_username),
    playerDisplayName: supabaseText_(row.player_display_name),
    playerEmail: supabaseText_(row.player_email),
    playerPhone: supabaseText_(row.player_phone),
    playerCountry: supabaseText_(row.player_country),
    message: supabaseText_(row.message),
    status: normalizeTeamNeedInterestStatus_(row.status),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at),
    reviewedBy: supabaseText_(row.reviewed_by_username),
    reviewedAt: supabaseText_(row.reviewed_at)
  };
}

function supabaseTournamentPlan_(row) {
  return {
    planId: supabaseText_(row.legacy_plan_id),
    tournamentId: supabaseText_(row.legacy_tournament_id),
    tournamentName: supabaseText_(row.tournament_name),
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    captainUsername: supabaseText_(row.captain_username),
    squadLabel: supabaseText_(row.squad_label),
    className: supabaseText_(row.class_name),
    planStatus: normalizeTournamentPlanStatus_(row.status),
    deadlineAt: supabaseText_(row.deadline_at),
    note: supabaseText_(row.note),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseTournamentAvailability_(row) {
  return {
    availabilityId: supabaseText_(row.legacy_availability_id),
    planId: supabaseText_(row.legacy_plan_id),
    tournamentId: supabaseText_(row.legacy_tournament_id),
    tournamentName: supabaseText_(row.tournament_name),
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    playerUsername: supabaseText_(row.player_username),
    playerDisplayName: supabaseText_(row.player_display_name),
    playerEmail: supabaseText_(row.player_email),
    playerPhone: supabaseText_(row.player_phone),
    playerCountry: supabaseText_(row.player_country),
    responseStatus: normalizeTournamentAvailabilityStatus_(row.response_status),
    preferredSquad: normalizePreferredSquad_(row.preferred_squad),
    playerNote: supabaseText_(row.player_note),
    requestedBy: supabaseText_(row.requested_by_username),
    requestedAt: supabaseText_(row.requested_at),
    respondedAt: supabaseText_(row.responded_at),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseSquadPlanning_(row) {
  return {
    planningId: supabaseText_(row.legacy_planning_id),
    planId: supabaseText_(row.legacy_plan_id),
    tournamentId: supabaseText_(row.legacy_tournament_id),
    tournamentName: supabaseText_(row.tournament_name),
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    playerUsername: supabaseText_(row.player_username),
    playerDisplayName: supabaseText_(row.player_display_name),
    playerCountry: supabaseText_(row.player_country),
    availabilityStatus: normalizeTournamentAvailabilityStatus_(row.availability_status),
    preferredSquad: normalizePreferredSquad_(row.preferred_squad),
    assignedSquad: normalizeAssignedSquad_(row.assigned_squad),
    planningStatus: normalizeTournamentSquadPlanningStatus_(row.planning_status),
    assignedBy: supabaseText_(row.assigned_by_username),
    assignedAt: supabaseText_(row.assigned_at),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseRoster_(row) {
  return {
    rosterId: supabaseText_(row.legacy_roster_id),
    planId: supabaseText_(row.legacy_plan_id),
    tournamentId: supabaseText_(row.legacy_tournament_id),
    tournamentName: supabaseText_(row.tournament_name),
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    squadLabel: supabaseText_(row.squad_label),
    captainUsername: supabaseText_(row.captain_username),
    rosterStatus: normalizeTournamentRosterStatus_(row.roster_status),
    submittedBy: supabaseText_(row.submitted_by_username),
    submittedAt: supabaseText_(row.submitted_at),
    reviewedBy: supabaseText_(row.reviewed_by_username),
    reviewedAt: supabaseText_(row.reviewed_at),
    adminNote: supabaseText_(row.admin_note),
    lockedAt: supabaseText_(row.locked_at),
    lockedBy: supabaseText_(row.locked_by_username),
    lockReason: supabaseText_(row.lock_reason),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabaseRosterPlayer_(row) {
  return {
    rosterPlayerId: supabaseText_(row.legacy_roster_player_id),
    rosterId: supabaseText_(row.legacy_roster_id),
    planId: supabaseText_(row.legacy_plan_id),
    tournamentId: supabaseText_(row.legacy_tournament_id),
    tournamentName: supabaseText_(row.tournament_name),
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    squadLabel: supabaseText_(row.squad_label),
    playerUsername: supabaseText_(row.player_username),
    playerDisplayName: supabaseText_(row.player_display_name),
    playerCountry: supabaseText_(row.player_country),
    assignedSquad: normalizeAssignedSquad_(row.assigned_squad),
    rosterRole: normalizeTournamentRosterRole_(row.roster_role),
    source: normalizeTournamentRosterSource_(row.source),
    playerStatus: normalizeTournamentRosterPlayerStatus_(row.player_status),
    addedBy: supabaseText_(row.added_by_username),
    addedAt: supabaseText_(row.added_at),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at)
  };
}

function supabasePlayerHubContext_(config, user) {
  var tables = supabasePlayerHubSnapshotTables_();
  var data = {};
  for (var i = 0; i < tables.length; i++) {
    data[tables[i].key] = fetchSupabaseTableRows_(config, tables[i].table);
  }

  return {
    spreadsheet: null,
    user: user,
    rows: {},
    data: {
      profiles: data.profiles.map(function (row) {
        return supabaseProfile_(row, { username: row.username });
      }),
      clubs: data.clubs.map(supabaseClub_),
      accessRequests: data.accessRequests.map(supabaseAccessRequest_),
      teamProfiles: data.teamProfiles.map(supabaseTeamProfile_),
      teamChangeRequests: data.teamChangeRequests.map(supabaseTeamChangeRequest_),
      teamMembers: data.teamMembers.map(supabaseTeamMember_),
      membershipRequests: data.membershipRequests.map(supabaseMembershipRequest_),
      teamNeeds: data.teamNeeds.map(supabaseTeamNeed_),
      teamNeedInterests: data.teamNeedInterests.map(supabaseTeamNeedInterest_),
      tournamentPlans: data.tournamentPlans.map(supabaseTournamentPlan_),
      tournamentAvailability: data.tournamentAvailability.map(
        supabaseTournamentAvailability_
      ),
      squadPlanning: data.squadPlanning.map(supabaseSquadPlanning_),
      rosters: data.rosters.map(supabaseRoster_),
      rosterPlayers: data.rosterPlayers.map(supabaseRosterPlayer_)
    },
    maps: {}
  };
}

function fetchSupabasePlayerHubSnapshot_(data, context, options) {
  var diagnosticMode = !!(options && options.diagnostic);
  if (!isSupabasePlayerHubReadsEnabled_()) {
    return null;
  }

  var config = getSupabaseConfig_();
  if (!diagnosticMode) {
    playerHubSnapshotLog_("[Snapshot] source supabase");
    return playerHubSnapshotPayloadFromContext_(
      supabasePlayerHubContext_(config, context.user),
      context,
      options && options.timer
    );
  }

  var tables = supabasePlayerHubDiagnosticTables_();
  var counts = {};
  for (var i = 0; i < tables.length; i++) {
    counts[tables[i].key] = fetchSupabaseTableCount_(config, tables[i]);
  }

  return {
    success: true,
    enabled: true,
    source: "supabase",
    message: "Supabase Player Hub diagnostic read succeeded.",
    counts: counts
  };
}

function testSupabasePlayerHubSnapshot(data) {
  var adminCheck = requireAdmin(data || {});
  if (!adminCheck.success) {
    return {
      success: false,
      enabled: false,
      message: adminCheck.message || "Admin access required"
    };
  }

  var config = getSupabaseConfig_();
  var enabled = isSupabasePlayerHubReadsEnabled_();
  if (!enabled) {
    return {
      success: true,
      enabled: false,
      counts: {},
      config: {
        hasUrl: !!config.url,
        hasServiceRoleKey: !!config.serviceRoleKey
      },
      message:
        "Supabase Player Hub reads are disabled. Set SUPABASE_PLAYER_HUB_READS_ENABLED=true in Script Properties to run this diagnostic."
    };
  }

  try {
    return fetchSupabasePlayerHubSnapshot_(
      data || {},
      { authenticated: true, user: adminCheck.admin },
      { diagnostic: true }
    );
  } catch (err) {
    return {
      success: false,
      enabled: true,
      counts: {},
      message:
        "Supabase Player Hub diagnostic read failed: " +
        (err && err.message ? err.message : String(err))
    };
  }
}

function playerHubSnapshotPayloadFromContext_(ctx, context, timer) {
  var username = playerHubUsername_(context.user);

  var profile = playerHubSnapshotProfile_(ctx, context.user);
  playerHubSnapshotStep_(timer, "profile");

  var availableClubs = playerHubSnapshotAvailableClubs_(ctx);
  playerHubSnapshotStep_(timer, "clubs");

  var myTeams = playerHubSnapshotMyTeams_(ctx, username);
  var teamMembershipRequests = playerHubSnapshotMembershipRequestsForPlayer_(
    ctx,
    username
  );
  playerHubSnapshotStep_(timer, "myTeams");

  var teamNeeds = playerHubSnapshotVisibleTeamNeeds_(ctx, username);
  playerHubSnapshotStep_(timer, "teamNeeds");

  var myTeamNeedInterests = playerHubSnapshotMyTeamNeedInterests_(ctx, username);
  var accessRequests = playerHubSnapshotAccessRequestsForUser_(ctx, username);
  playerHubSnapshotStep_(timer, "interests");

  var tournamentAvailability =
    playerHubSnapshotTournamentAvailabilityForPlayer_(ctx, username);
  playerHubSnapshotStep_(timer, "tournamentAvailability");

  var plannedTeams = playerHubSnapshotPlannedTeamsForPlayer_(ctx, username);
  playerHubSnapshotStep_(timer, "plannedTeams");

  var rosterDraftsForPlayer = playerHubSnapshotRosterStatusForPlayer_(ctx, username);
  playerHubSnapshotStep_(timer, "rosterDrafts");

  var captainTeamControl = playerHubCaptainSnapshot_(ctx, context.user, profile);
  playerHubSnapshotStep_(timer, "captainControl");

  var adminCounts = playerHubAdminCounts_(ctx, context.user);
  playerHubSnapshotStep_(timer, "adminCounts");

  return {
    success: true,
    profile: profile || null,
    availableClubs: Array.isArray(availableClubs) ? availableClubs : [],
    accessRequests: Array.isArray(accessRequests) ? accessRequests : [],
    myTeams: Array.isArray(myTeams) ? myTeams : [],
    teamMembershipRequests: Array.isArray(teamMembershipRequests)
      ? teamMembershipRequests
      : [],
    teamNeeds: Array.isArray(teamNeeds) ? teamNeeds : [],
    myTeamNeedInterests: Array.isArray(myTeamNeedInterests)
      ? myTeamNeedInterests
      : [],
    tournamentAvailability: Array.isArray(tournamentAvailability)
      ? tournamentAvailability
      : [],
    plannedTeams: Array.isArray(plannedTeams) ? plannedTeams : [],
    rosterDraftsForPlayer: Array.isArray(rosterDraftsForPlayer)
      ? rosterDraftsForPlayer
      : [],
    captainTeamControl: captainTeamControl,
    adminCounts: adminCounts
  };
}

function getPlayerHubSnapshot(data) {
  var timer = playerHubSnapshotTimer_();
  playerHubSnapshotLog_("[Snapshot] start");
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var supabaseSnapshot = null;
    try {
      supabaseSnapshot = fetchSupabasePlayerHubSnapshot_(data || {}, context, {
        timer: timer
      });
    } catch (supabaseErr) {
      playerHubSnapshotLog_(
        "[Snapshot] Supabase read failed; falling back to sheets: " +
          (supabaseErr && supabaseErr.message
            ? supabaseErr.message
            : String(supabaseErr))
      );
    }
    if (supabaseSnapshot) {
      playerHubSnapshotStep_(timer, "supabaseSnapshot");
      playerHubSnapshotTotal_(timer);
      return supabaseSnapshot;
    }

    playerHubSnapshotLog_("[Snapshot] source sheets");
    var ctx = playerHubSnapshotContext_(context.user);
    var username = playerHubUsername_(context.user);

    var profile = playerHubSnapshotProfile_(ctx, context.user);
    playerHubSnapshotStep_(timer, "profile");

    var availableClubs = playerHubSnapshotAvailableClubs_(ctx);
    playerHubSnapshotStep_(timer, "clubs");

    var myTeams = playerHubSnapshotMyTeams_(ctx, username);
    var teamMembershipRequests = playerHubSnapshotMembershipRequestsForPlayer_(
      ctx,
      username
    );
    playerHubSnapshotStep_(timer, "myTeams");

    var teamNeeds = playerHubSnapshotVisibleTeamNeeds_(ctx, username);
    playerHubSnapshotStep_(timer, "teamNeeds");

    var myTeamNeedInterests = playerHubSnapshotMyTeamNeedInterests_(ctx, username);
    var accessRequests = playerHubSnapshotAccessRequestsForUser_(ctx, username);
    playerHubSnapshotStep_(timer, "interests");

    var tournamentAvailability =
      playerHubSnapshotTournamentAvailabilityForPlayer_(ctx, username);
    playerHubSnapshotStep_(timer, "tournamentAvailability");

    var plannedTeams = playerHubSnapshotPlannedTeamsForPlayer_(ctx, username);
    playerHubSnapshotStep_(timer, "plannedTeams");

    var rosterDraftsForPlayer = playerHubSnapshotRosterStatusForPlayer_(ctx, username);
    playerHubSnapshotStep_(timer, "rosterDrafts");

    var captainTeamControl = playerHubCaptainSnapshot_(ctx, context.user, profile);
    playerHubSnapshotStep_(timer, "captainControl");

    var adminCounts = playerHubAdminCounts_(ctx, context.user);
    playerHubSnapshotStep_(timer, "adminCounts");
    playerHubSnapshotTotal_(timer);

    return {
      success: true,
      profile: profile || null,
      availableClubs: Array.isArray(availableClubs) ? availableClubs : [],
      accessRequests: Array.isArray(accessRequests) ? accessRequests : [],
      myTeams: Array.isArray(myTeams) ? myTeams : [],
      teamMembershipRequests: Array.isArray(teamMembershipRequests)
        ? teamMembershipRequests
        : [],
      teamNeeds: Array.isArray(teamNeeds) ? teamNeeds : [],
      myTeamNeedInterests: Array.isArray(myTeamNeedInterests)
        ? myTeamNeedInterests
        : [],
      tournamentAvailability: Array.isArray(tournamentAvailability)
        ? tournamentAvailability
        : [],
      plannedTeams: Array.isArray(plannedTeams) ? plannedTeams : [],
      rosterDraftsForPlayer: Array.isArray(rosterDraftsForPlayer)
        ? rosterDraftsForPlayer
        : [],
      captainTeamControl: captainTeamControl,
      adminCounts: adminCounts
    };
  } catch (err) {
    playerHubSnapshotLog_(
      "[Snapshot] error " + (err && err.message ? err.message : String(err))
    );
    playerHubSnapshotTotal_(timer);
    return {
      success: false,
      message: "Could not load Player Hub"
    };
  }
}

function saveMyPlayerProfile(data) {
  try {
    var context = resolveRequestContext(data || {});
    if (!context || !context.authenticated || !context.user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    var username = playerHubUsername_(context.user);
    var existingRow = findPlayerProfileRowByUsername_(username);
    var profile = buildPlayerProfileForSave_(
      data && data.profile ? data.profile : {},
      existingRow,
      context.user
    );
    writePlayerProfileRow_(profile, existingRow);
    var membershipRequest = syncTeamMembershipRequestForProfile_(
      context.user,
      profile
    );

    return {
      success: true,
      profile: profile,
      membershipRequest: membershipRequest
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not save player profile"
    };
  }
}

function playerProfileAdminPayload_(profile, user) {
  var safeUser = user || {};
  return {
    profileId: profile.profileId || "",
    username: profile.username || safeUser.username || "",
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    displayName: profile.displayName || "",
    email: profile.email || "",
    phone: profile.phone || "",
    country: profile.country || "",
    clubOrTeam: profile.clubOrTeam || "",
    clubTeamId: profile.clubTeamId || "",
    clubTeamName: profile.clubTeamName || "",
    teamNote: profile.teamNote || "",
    profileType: profile.profileType || "Player",
    freeAgent: !!profile.freeAgent,
    availability: profile.availability || "",
    publicVisible: !!profile.publicVisible,
    approved: !!profile.approved,
    active: safeUser.active !== undefined ? !!safeUser.active : false,
    role: String(safeUser.role || "player").trim().toLowerCase() || "player",
    createdAt: profile.createdAt || "",
    updatedAt: profile.updatedAt || "",
    hasProfile: !!profile.profileId
  };
}

function listPlayerProfilesForAdmin(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var users = getUserRecords();
    var usersByUsername = {};
    for (var i = 0; i < users.length; i++) {
      usersByUsername[String(users[i].username || "").trim().toLowerCase()] = users[i];
    }

    var seen = {};
    var profiles = [];
    var profileRows = playerProfileRows_();
    for (var p = 0; p < profileRows.length; p++) {
      var row = profileRows[p];
      var username = String(row.Username || "").trim();
      var key = username.toLowerCase();
      var user = usersByUsername[key] || { username: username, role: "player", active: false };
      if (user && String(user.role || "").trim().toLowerCase() !== "player") {
        continue;
      }

      seen[key] = true;
      profiles.push(playerProfileAdminPayload_(playerProfileFromRow_(row, user), user));
    }

    for (var j = 0; j < users.length; j++) {
      var userRecord = users[j];
      var userKey = String(userRecord.username || "").trim().toLowerCase();
      if (!userKey || seen[userKey]) continue;
      if (String(userRecord.role || "").trim().toLowerCase() !== "player") continue;

      profiles.push(
        playerProfileAdminPayload_(
          defaultPlayerProfileForUser_(userRecord),
          userRecord
        )
      );
    }

    profiles.sort(function (a, b) {
      var aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      var bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      if (aTime !== bTime) return bTime - aTime;
      return String(a.displayName || a.username || "").localeCompare(
        String(b.displayName || b.username || "")
      );
    });

    return {
      success: true,
      profiles: profiles
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not load player profiles"
    };
  }
}

function updatePlayerProfileAdminStatus(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var targetUsername = String(
      data && (data.targetUsername || data.profileUsername || data.playerUsername) || ""
    ).trim();

    if (!targetUsername) {
      return {
        success: false,
        message: "targetUsername is required"
      };
    }

    var user = getUserByUsernameCaseInsensitive_(targetUsername);
    var existingRow = findPlayerProfileRowByUsername_(targetUsername);

    if (!user && !existingRow) {
      return {
        success: false,
        message: "Player profile not found"
      };
    }

    if (user && String(user.role || "").trim().toLowerCase() !== "player") {
      return {
        success: false,
        message: "Only player accounts can be reviewed here"
      };
    }

    var profileUser = user || { username: targetUsername, role: "player", active: false };
    var profile = playerProfileFromRow_(existingRow, profileUser);
    var now = new Date().toISOString();

    if (data && data.approved !== undefined) {
      profile.approved = truthy_(data.approved);
    }

    if (data && data.publicVisible !== undefined) {
      profile.publicVisible = truthy_(data.publicVisible);
    }

    profile.updatedAt = now;

    if (existingRow || profile.profileId) {
      writePlayerProfileRow_(profile, existingRow);
    }

    if (user && data && data.active !== undefined) {
      var sheet = getUsersSheet();
      sheet
        .getRange(user.rowNumber, USER_COL_.ACTIVE)
        .setValue(truthy_(data.active));
      user.active = truthy_(data.active);
    }

    return {
      success: true,
      profile: playerProfileAdminPayload_(profile, user || profileUser)
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not update player profile"
    };
  }
}

function resetPlayerPassword(data) {
  try {
    var adminCheck = requireAdmin(data);
    if (!adminCheck.success) {
      return {
        success: false,
        message: adminCheck.message
      };
    }

    var targetUsername = String(
      data && (data.targetUsername || data.profileUsername || data.playerUsername) || ""
    ).trim();
    var newPassword = String(data && data.newPassword ? data.newPassword : "").trim();

    if (!targetUsername) {
      return {
        success: false,
        message: "targetUsername is required"
      };
    }

    if (!newPassword) {
      return {
        success: false,
        message: "newPassword is required"
      };
    }

    var user = getUserByUsernameCaseInsensitive_(targetUsername);
    if (!user) {
      return {
        success: false,
        message: "Player account not found"
      };
    }

    if (String(user.role || "").trim().toLowerCase() !== "player") {
      return {
        success: false,
        message: "Only player account passwords can be reset here"
      };
    }

    setUserPasswordHash(user.rowNumber, newPassword);

    return {
      success: true,
      message: "Player password reset."
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not reset player password"
    };
  }
}

/* =========================
   TOURNAMENT BACKEND
   Stored in volleyball_all_active
   ========================= */

var TOURNAMENTS_SHEET = "Tournaments";
var TOURNAMENT_AUDIT_SHEET = "TournamentAuditLog";

var TOURNAMENT_HEADERS = [
  "TournamentId",
  "Name",
  "Country",
  "City",
  "StartDate",
  "EndDate",
  "RegistrationDeadline",
  "Visibility",
  "Status",
  "OrganizerUsername",
  "CreatedAt",
  "PublicCode",
  "Published",
  "PublishedAt",
  "UpdatedAt",
  "TournamentJson"
];

function handleTournamentAction_(action, data) {
  try {
    if (action === "getPublicTournament") {
      return {
        success: true,
        tournament: getPublicTournament_(data.publicCode || data.PublicCode)
      };
    }

    if (action === "listPublicTournaments") {
      return {
        success: true,
        tournaments: listPublicTournaments_()
      };
    }

    var user = requireTournamentUser_(data);
    if (!user) {
      return {
        success: false,
        message: "Login required"
      };
    }

    if (!userCanUseTournaments_(user)) {
      return {
        success: false,
        message: "Tournament access required"
      };
    }

    if (action === "listTournaments") {
      return {
        success: true,
        tournaments: listTournaments_(user)
      };
    }

    if (action === "getTournament") {
      return {
        success: true,
        tournament: getTournament_(data, user)
      };
    }

    if (action === "saveTournament") {
      return {
        success: true,
        tournament: upsertTournament_(data, user, "save")
      };
    }

    if (action === "publishTournament") {
      return {
        success: true,
        tournament: upsertTournament_(data, user, "publish")
      };
    }

    if (action === "unpublishTournament") {
      return {
        success: true,
        tournament: upsertTournament_(data, user, "unpublish")
      };
    }

    if (action === "deleteTournament") {
      return deleteTournament_(data, user);
    }

    if (action === "cleanupMyDraftTournaments") {
      return cleanupMyDraftTournaments_(data, user);
    }

    return {
      success: false,
      message: "Unknown tournament action"
    };
  } catch (err) {
    return {
      success: false,
      message: err && err.message ? err.message : String(err)
    };
  }
}

function requireTournamentUser_(data) {
  var context = resolveRequestContext(data);
  if (context && context.authenticated && context.user) {
    return context.user;
  }

  return null;
}

function tournamentSpreadsheet_() {
  return getMainSpreadsheet();
}

function ensureTournamentSheets_() {
  var ss = tournamentSpreadsheet_();
  ensureSheetWithHeaders_(ss, TOURNAMENTS_SHEET, TOURNAMENT_HEADERS);
  ensureSheetWithHeaders_(ss, TOURNAMENT_AUDIT_SHEET, [
    "Timestamp",
    "Username",
    "Action",
    "TournamentId",
    "Message"
  ]);
  return ss.getSheetByName(TOURNAMENTS_SHEET);
}

function ensureSheetWithHeaders_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }

  var existing = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (header) {
      return String(header || "").trim();
    });

  var missing = headers.filter(function (header) {
    return existing.indexOf(header) === -1;
  });

  if (missing.length) {
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }

  return sheet;
}

function listTournaments_(user) {
  var username = tournamentUsername_(user);
  if (!username) return [];

  return tournamentRows_()
    .filter(function (row) {
      return String(row.OrganizerUsername || "").trim() === username;
    })
    .map(tournamentFromRow_)
    .filter(Boolean);
}

function listPublicTournaments_() {
  return tournamentRows_()
    .map(tournamentFromRow_)
    .filter(function (tournament) {
      if (!tournament) return false;

      var isPublished =
        truthy_(tournament.published) ||
        String(tournament.status || "").trim().toLowerCase() === "published";

      var isListed =
        truthy_(tournament.publicListingEnabled) ||
        truthy_(tournament.listPublicly) ||
        truthy_(tournament.publicListed);

      return isPublished && isListed && String(tournament.publicCode || "").trim();
    })
    .sort(function (a, b) {
      var now = Date.now();
      var aTime = Date.parse(a.startDate || a.eventDate || "") || 9999999999999;
      var bTime = Date.parse(b.startDate || b.eventDate || "") || 9999999999999;
      var aUpcoming = aTime >= now;
      var bUpcoming = bTime >= now;

      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return aUpcoming ? aTime - bTime : bTime - aTime;
    })
    .map(publicTournamentSummary_);
}

function publicTournamentSummary_(tournament) {
  return {
    id: tournament.id,
    name: tournament.name,
    publicTitle: tournament.publicTitle || tournament.name,
    publicCode: tournament.publicCode,
    status: tournament.status,
    published: tournament.published,
    publishedAt: tournament.publishedAt,
    organizerUsername: tournament.organizerUsername,
    organizerName: tournament.organizerName || "",

    publicListingEnabled: truthy_(tournament.publicListingEnabled),
    listPublicly: truthy_(tournament.listPublicly),
    publicListed: truthy_(tournament.publicListed),
    visibility: tournament.visibility || "",

    publicTheme: tournament.publicTheme || null,
    publicLogoUrl: tournament.publicLogoUrl || "",
    publicCardImageUrl: tournament.publicCardImageUrl || "",
    publicCardBackgroundUrl: tournament.publicCardBackgroundUrl || "",

    registrationUrl: tournament.registrationUrl || "",
    signupUrl: tournament.signupUrl || "",
    signUpUrl: tournament.signUpUrl || "",
    registrationLink: tournament.registrationLink || "",

    country: tournament.country || "",
    city: tournament.city || "",
    locationName: tournament.locationName || "",
    address: tournament.address || "",
    startDate: tournament.startDate || "",
    endDate: tournament.endDate || "",
    startTime: tournament.startTime || "",
    registrationDeadline: tournament.registrationDeadline || "",
    series: Array.isArray(tournament.series) ? tournament.series : [],
    prizeText: tournament.prizeText || "",
    feeText: tournament.feeText || "",
    contactName: tournament.contactName || "",
    contactPhone: tournament.contactPhone || "",
    contactEmail: tournament.contactEmail || "",
    description: tournament.description || "",
    posterImageUrl: tournament.posterImageUrl || "",
    themeColor: tournament.themeColor || "",
    accentColor: tournament.accentColor || "",
    publicSummary: tournament.publicSummary || "",
    maxTeams: tournament.maxTeams || "",
    breakfastInfo: tournament.breakfastInfo || "",
    breakBallInfo: tournament.breakBallInfo || "",
    sodduInfo: tournament.sodduInfo || ""
  };
}

function getTournament_(data, user) {
  var row = findTournamentRowById_(data.tournamentId || data.TournamentId || data.id);
  if (!row) return null;

  authorizeTournamentRow_(row, user);
  return tournamentFromRow_(row);
}

function getPublicTournament_(publicCode) {
  var row = findTournamentRowByPublicCode_(publicCode);
  if (!row) return null;

  var tournament = tournamentFromRow_(row);

  var isPublished =
    truthy_(row.Published) ||
    truthy_(tournament && tournament.published) ||
    String(row.Status || "").trim().toLowerCase() === "published" ||
    String((tournament && tournament.status) || "").trim().toLowerCase() === "published";

  if (!isPublished) return null;

  return tournament;
}

function upsertTournament_(data, user, mode) {
  var sheet = ensureTournamentSheets_();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var now = new Date().toISOString();
  var username = tournamentUsername_(user);

  var incoming = parseTournament_(data);
  if (!incoming.id) {
    throw new Error("Missing tournament id");
  }

  var existingRow = findTournamentRowById_(incoming.id);
  if (existingRow) {
    authorizeTournamentRow_(existingRow, user);
  }

  var existingTournament = existingRow ? tournamentFromRow_(existingRow) || {} : {};
  var tournament = Object.assign({}, existingTournament, incoming);

  if (!tournament.name) {
    tournament.name = "Untitled tournament";
  }

  var owner = existingRow
    ? String(existingRow.OrganizerUsername || "").trim()
    : username;

  tournament.organizerUsername = owner;
  tournament.ownerUsername = owner;

  tournament.createdAt = firstNonEmpty_(
    tournament.createdAt,
    existingRow && existingRow.CreatedAt,
    now
  );

  tournament.updatedAt = now;

  if (mode === "publish") {
    tournament.published = true;
    tournament.status = "published";
    tournament.publicCode = firstNonEmpty_(
      data.publicCode,
      data.PublicCode,
      tournament.publicCode,
      createTournamentPublicCode_(tournament.name)
    );
    tournament.publishedAt = firstNonEmpty_(tournament.publishedAt, now);
  }

  if (mode === "unpublish") {
    tournament.published = false;
    tournament.status = "unpublished";
    tournament.publicCode = firstNonEmpty_(
      tournament.publicCode,
      data.publicCode,
      data.PublicCode
    );
  }

  var rowValues = headers.map(function (header) {
    return tournamentColumnValue_(header, tournament);
  });

  if (existingRow) {
    sheet.getRange(existingRow.__rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  if (mode !== "save") {
    writeTournamentAudit_(
      username,
      mode,
      tournament.id,
      mode + " " + tournament.name
    );
  }

  return tournament;
}

function deleteTournament_(data, user) {
  var tournamentId = String(data.tournamentId || data.TournamentId || data.id || "").trim();

  if (!tournamentId) {
    throw new Error("Missing tournamentId");
  }

  var sheet = ensureTournamentSheets_();
  var row = findTournamentRowById_(tournamentId);

  if (!row) {
    return {
      success: true,
      deleted: false,
      tournamentId: tournamentId
    };
  }

  authorizeTournamentRow_(row, user);

  var tournament = tournamentFromRow_(row);
  var status = String(row.Status || (tournament && tournament.status) || "draft").trim().toLowerCase();
  var isPublished =
    truthy_(row.Published) ||
    truthy_(tournament && tournament.published) ||
    status === "published";

  if (isPublished) {
    throw new Error("Published tournaments must be unpublished before deletion.");
  }

  sheet.deleteRow(row.__rowNumber);

  writeTournamentAudit_(
    tournamentUsername_(user),
    "deleteTournament",
    tournamentId,
    "Deleted " + String((tournament && tournament.name) || row.Name || "")
  );

  return {
    success: true,
    deleted: true,
    tournamentId: tournamentId
  };
}

function cleanupMyDraftTournaments_(data, user) {
  var sheet = ensureTournamentSheets_();
  var username = tournamentUsername_(user);
  var nameContains = String(data.nameContains || "").trim().toLowerCase();
  var rows = tournamentRows_().sort(function (a, b) {
    return b.__rowNumber - a.__rowNumber;
  });

  var deletedCount = 0;

  rows.forEach(function (row) {
    var owner = String(row.OrganizerUsername || "").trim();
    if (!username || owner !== username) return;

    var tournament = tournamentFromRow_(row) || {};
    var status = String(row.Status || tournament.status || "draft").trim().toLowerCase();

    var isPublished =
      truthy_(row.Published) ||
      truthy_(tournament.published) ||
      status === "published";

    if (isPublished) return;
    if (status !== "draft" && status !== "unpublished") return;

    if (nameContains) {
      var name = String(row.Name || tournament.name || "").trim().toLowerCase();
      if (name.indexOf(nameContains) === -1) return;
    }

    sheet.deleteRow(row.__rowNumber);
    deletedCount += 1;
  });

  if (deletedCount > 0) {
    writeTournamentAudit_(
      username,
      "cleanupMyDraftTournaments",
      "",
      "Deleted " + deletedCount + " draft/unpublished tournaments"
    );
  }

  return {
    success: true,
    deletedCount: deletedCount
  };
}

function parseTournament_(data) {
  var tournament = {};

  if (data && typeof data.tournament === "object" && data.tournament) {
    tournament = Object.assign({}, data.tournament);
  } else if (data && typeof data.tournament === "string") {
    try {
      tournament = JSON.parse(data.tournament);
    } catch (err) {
      tournament = {};
    }
  } else if (data && (data.TournamentJson || data.tournamentJson)) {
    try {
      tournament = JSON.parse(data.TournamentJson || data.tournamentJson);
    } catch (err) {
      tournament = {};
    }
  }

  tournament.id = firstNonEmpty_(
    tournament.id,
    tournament.tournamentId,
    tournament.TournamentId,
    data.tournamentId,
    data.TournamentId,
    data.id
  );

  tournament.tournamentId = tournament.id;
  tournament.TournamentId = tournament.id;

  tournament.name = firstNonEmpty_(
    tournament.name,
    data.name,
    data.Name
  );

  tournament.country = firstValue_(
    tournament.country,
    data.country,
    data.Country,
    ""
  );

  tournament.city = firstValue_(
    tournament.city,
    data.city,
    data.City,
    ""
  );

  tournament.startDate = firstValue_(
    tournament.startDate,
    data.startDate,
    data.StartDate,
    ""
  );

  tournament.endDate = firstValue_(
    tournament.endDate,
    data.endDate,
    data.EndDate,
    ""
  );

  tournament.registrationDeadline = firstValue_(
    tournament.registrationDeadline,
    data.registrationDeadline,
    data.RegistrationDeadline,
    ""
  );

  tournament.visibility = firstValue_(
    tournament.visibility,
    data.visibility,
    data.Visibility,
    tournament.visibility || ""
  );

  tournament.status = firstValue_(
    tournament.status,
    data.status,
    data.Status,
    tournament.status || "draft"
  );

  tournament.publicCode = firstNonEmpty_(
    tournament.publicCode,
    data.publicCode,
    data.PublicCode
  );

  if (
    tournament.published !== undefined ||
    data.published !== undefined ||
    data.Published !== undefined
  ) {
    tournament.published = truthy_(firstValue_(
      tournament.published,
      data.published,
      data.Published,
      false
    ));
  }

  tournament.publishedAt = firstValue_(
    tournament.publishedAt,
    data.publishedAt,
    data.PublishedAt,
    tournament.publishedAt || ""
  );

  tournament.createdAt = firstValue_(
    tournament.createdAt,
    data.createdAt,
    data.CreatedAt,
    tournament.createdAt || ""
  );

  tournament.updatedAt = firstValue_(
    tournament.updatedAt,
    data.updatedAt,
    data.UpdatedAt,
    tournament.updatedAt || ""
  );

  tournament.groups = Array.isArray(tournament.groups) ? tournament.groups : [];
  tournament.matches = Array.isArray(tournament.matches) ? tournament.matches : [];
  tournament.series = Array.isArray(tournament.series) ? tournament.series : [];
  tournament.knockout = tournament.knockout || {};

  return tournament;
}

function tournamentRows_() {
  var sheet = ensureTournamentSheets_();

  if (sheet.getLastRow() < 2) {
    return [];
  }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (header) {
    return String(header || "").trim();
  });

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();

  return values.map(function (rowValues, index) {
    var row = {
      __rowNumber: index + 2
    };

    headers.forEach(function (header, col) {
      row[header] = rowValues[col];
    });

    return row;
  });
}

function findTournamentRowById_(id) {
  var target = String(id || "").trim();
  if (!target) return null;

  return tournamentRows_().find(function (row) {
    return String(row.TournamentId || "").trim() === target;
  }) || null;
}

function findTournamentRowByPublicCode_(code) {
  var target = String(code || "").trim().toLowerCase();
  if (!target) return null;

  return tournamentRows_().find(function (row) {
    return String(row.PublicCode || "").trim().toLowerCase() === target;
  }) || null;
}

function tournamentFromRow_(row) {
  var tournament = {};

  if (row.TournamentJson) {
    try {
      tournament = JSON.parse(String(row.TournamentJson));
    } catch (err) {
      tournament = {};
    }
  }

  tournament.id = firstNonEmpty_(tournament.id, tournament.tournamentId, tournament.TournamentId, row.TournamentId);
  tournament.tournamentId = tournament.id;
  tournament.TournamentId = tournament.id;
  tournament.name = firstNonEmpty_(tournament.name, row.Name);
  tournament.country = firstValue_(tournament.country, row.Country, "");
  tournament.city = firstValue_(tournament.city, row.City, "");
  tournament.startDate = firstValue_(tournament.startDate, row.StartDate, "");
  tournament.endDate = firstValue_(tournament.endDate, row.EndDate, "");
  tournament.registrationDeadline = firstValue_(tournament.registrationDeadline, row.RegistrationDeadline, "");
  tournament.visibility = firstValue_(tournament.visibility, row.Visibility, "");
  tournament.status = firstValue_(tournament.status, row.Status, "");
  tournament.organizerUsername = firstNonEmpty_(tournament.organizerUsername, row.OrganizerUsername);
  tournament.ownerUsername = firstNonEmpty_(tournament.ownerUsername, tournament.organizerUsername);
  tournament.createdAt = firstValue_(tournament.createdAt, row.CreatedAt, "");
  tournament.publicCode = firstNonEmpty_(tournament.publicCode, row.PublicCode);
  tournament.published = truthy_(firstValue_(row.Published, tournament.published, false));
  tournament.publishedAt = firstValue_(tournament.publishedAt, row.PublishedAt, "");
  tournament.updatedAt = firstValue_(tournament.updatedAt, row.UpdatedAt, "");
  tournament.groups = Array.isArray(tournament.groups) ? tournament.groups : [];
  tournament.matches = Array.isArray(tournament.matches) ? tournament.matches : [];
  tournament.series = Array.isArray(tournament.series) ? tournament.series : [];
  tournament.knockout = tournament.knockout || {};

  return tournament.id ? tournament : null;
}

function tournamentColumnValue_(header, tournament) {
  if (header === "TournamentId") return tournament.id || "";
  if (header === "Name") return tournament.name || "";
  if (header === "Country") return tournament.country || "";
  if (header === "City") return tournament.city || "";
  if (header === "StartDate") return tournament.startDate || "";
  if (header === "EndDate") return tournament.endDate || "";
  if (header === "RegistrationDeadline") return tournament.registrationDeadline || "";
  if (header === "Visibility") return tournament.visibility || "";
  if (header === "Status") return tournament.status || "";
  if (header === "OrganizerUsername") return tournament.organizerUsername || "";
  if (header === "CreatedAt") return tournament.createdAt || "";
  if (header === "PublicCode") return tournament.publicCode || "";
  if (header === "Published") return tournament.published ? "TRUE" : "FALSE";
  if (header === "PublishedAt") return tournament.publishedAt || "";
  if (header === "UpdatedAt") return tournament.updatedAt || "";
  if (header === "TournamentJson") return JSON.stringify(tournament);
  return "";
}

function authorizeTournamentRow_(row, user) {
  var owner = String(row.OrganizerUsername || "").trim();
  var username = tournamentUsername_(user);

  if (!owner || !username || owner !== username) {
    throw new Error("Access denied");
  }
}

function tournamentUsername_(user) {
  return String((user && (user.username || user.Username)) || "").trim();
}

function createTournamentPublicCode_(name) {
  var slug = String(name || "tournament")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 16);

  if (!slug) slug = "tournament";

  return slug + "-" + Math.random().toString(36).slice(2, 8);
}

function writeTournamentAudit_(username, action, tournamentId, message) {
  try {
    var ss = tournamentSpreadsheet_();
    var sheet = ensureSheetWithHeaders_(ss, TOURNAMENT_AUDIT_SHEET, [
      "Timestamp",
      "Username",
      "Action",
      "TournamentId",
      "Message"
    ]);

    sheet.appendRow([
      new Date().toISOString(),
      username || "",
      action || "",
      tournamentId || "",
      message || ""
    ]);
  } catch (err) {}
}

function truthy_(value) {
  if (value === true || value === 1) return true;

  var text = String(value || "").trim().toLowerCase();

  return [
    "true",
    "1",
    "yes",
    "y",
    "active",
    "published"
  ].indexOf(text) >= 0;
}

function firstValue_() {
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] !== undefined && arguments[i] !== null) {
      return arguments[i];
    }
  }

  return "";
}

function firstNonEmpty_() {
  for (var i = 0; i < arguments.length; i++) {
    var value = arguments[i];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
}
