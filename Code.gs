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

    return jsonResponse(runTeamBuilderAction_("getPlayers", {
      includeArchived: includeArchived
    }, context, function () {
      return getPlayers(context, includeArchived);
    }));
  }

  if (action === "login") {
    return jsonResponse(runAuthAction_("login", e ? e.parameter : {}, function () {
      return loginUser(e ? e.parameter : {});
    }));
  }

  if (action === "getProfile") {
    var profileContext = resolveRequestContext(e ? e.parameter : {});
    return jsonResponse(runAuthAction_("getProfile", e ? e.parameter : {}, function () {
      return getProfile(profileContext);
    }));
  }

  if (action === "getMyPlayerProfile") {
    var getProfileSupabaseResponse = handlePlayerHubSupabaseAction_(
      Object.assign({}, e ? e.parameter : {}, { action: action })
    );
    if (getProfileSupabaseResponse) return jsonResponse(getProfileSupabaseResponse);
    return jsonResponse(getMyPlayerProfile(e ? e.parameter : {}));
  }

  if (action === "getPlayerHubSnapshot") {
    return jsonResponse(getPlayerHubSnapshot(e ? e.parameter : {}));
  }

  if (action === "testSupabasePlayerHubSnapshot") {
    return jsonResponse(testSupabasePlayerHubSnapshot(e ? e.parameter : {}));
  }

  if (action === "listClubTeams") {
    var listClubTeamsSupabaseResponse = handlePlayerHubSupabaseAction_(
      Object.assign({}, e ? e.parameter : {}, { action: action })
    );
    if (listClubTeamsSupabaseResponse) {
      return jsonResponse(listClubTeamsSupabaseResponse);
    }
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
    return jsonResponse(runTeamBuilderAction_("addPlayer", data, addContext, function () {
      return addPlayer(addContext, data.player);
    }));
  }

  if (data.action === "saveSkills") {
    var skillContext = resolveRequestContext(data);
    if (!skillContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(runTeamBuilderAction_("saveSkills", data, skillContext, function () {
      saveSkills(skillContext, data.players || []);
      return { success: true };
    }));
  }

  if (data.action === "updatePlayerName") {
    var renameContext = resolveRequestContext(data);
    if (!renameContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(runTeamBuilderAction_("updatePlayerName", data, renameContext, function () {
      updatePlayerName(renameContext, data.oldName, data.newName);
      return { success: true };
    }));
  }

  if (data.action === "updatePlayer") {
    var updateContext = resolveRequestContext(data);
    if (!updateContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(runTeamBuilderAction_("updatePlayer", data, updateContext, function () {
      return updatePlayer(updateContext, data.oldName, data.player || {});
    }));
  }

  if (data.action === "archivePlayer") {
    var archivePlayerContext = resolveRequestContext(data);
    if (!archivePlayerContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(runTeamBuilderAction_("archivePlayer", data, archivePlayerContext, function () {
      return archivePlayer(archivePlayerContext, data.playerName);
    }));
  }

  if (data.action === "restorePlayer") {
    var restorePlayerContext = resolveRequestContext(data);
    if (!restorePlayerContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(runTeamBuilderAction_("restorePlayer", data, restorePlayerContext, function () {
      return restorePlayer(restorePlayerContext, data.playerName);
    }));
  }

  if (data.action === "saveTeams") {
    var teamsContext = resolveRequestContext(data);
    if (!teamsContext.authenticated) {
      return jsonResponse({ success: false, message: "Login required" });
    }
    return jsonResponse(runTeamBuilderAction_("saveTeams", data, teamsContext, function () {
      saveTeams(teamsContext, data.teams || []);
      return { success: true };
    }));
  }

  if (data.action === "saveUserSettings") {
    return jsonResponse(runAuthAction_("saveUserSettings", data, function () {
      return saveUserSettings(data);
    }));
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

  var playerHubSupabaseResponse = handlePlayerHubSupabaseAction_(data);
  if (playerHubSupabaseResponse) {
    return jsonResponse(playerHubSupabaseResponse);
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
    return jsonResponse(runAuthAction_("resetPlayerPassword", data, function () {
      return resetPlayerPassword(data);
    }));
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
    return jsonResponse(runAuthAction_("createTrainerUser", data, function () {
      return createTrainerUserRecordFromAdmin(data);
    }));
  }

  if (data.action === "listTrainerUsers") {
    return jsonResponse(runAuthAction_("listTrainerUsers", data, function () {
      return listTrainerUsers(data);
    }));
  }

  if (data.action === "updateTrainerAccess") {
    return jsonResponse(runAuthAction_("updateTrainerAccess", data, function () {
      return updateTrainerAccess(data);
    }));
  }

  if (data.action === "updateTrainerStatus") {
    return jsonResponse(runAuthAction_("updateTrainerStatus", data, function () {
      return updateTrainerStatus(data);
    }));
  }

  if (data.action === "resetTrainerPassword") {
    return jsonResponse(runAuthAction_("resetTrainerPassword", data, function () {
      return resetTrainerPassword(data);
    }));
  }

  if (data.action === "archiveTrainerUser") {
    return jsonResponse(runAuthAction_("archiveTrainerUser", data, function () {
      return archiveTrainerUser(data);
    }));
  }

  if (data.action === "restoreTrainerUser") {
    return jsonResponse(runAuthAction_("restoreTrainerUser", data, function () {
      return restoreTrainerUser(data);
    }));
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

  if (!user.rowNumber && isSupabaseAuthBackendEnabled_()) {
    try {
      supabasePatchRows_(getSupabaseConfig_(), "app_users", {
        username: user.username
      }, {
        password_hash: hashPassword(plain),
        updated_at: new Date().toISOString()
      });
      user.password = hashPassword(plain);
      return;
    } catch (err) {
      authBackendLog_(
        "password hash upgrade fallback " +
          (err && err.message ? err.message : String(err))
      );
    }
  }

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

  if (isSupabaseAuthBackendEnabled_()) {
    authBackendLog_("supabase findUser");
    try {
      var supabaseUser = supabaseFindUserByCredentials_(
        normalizedUsername,
        normalizedPassword
      );
      if (supabaseUser) return supabaseUser;
      authBackendLog_("fallback findUser no Supabase match");
    } catch (err) {
      authBackendLog_(
        "fallback findUser " + (err && err.message ? err.message : String(err))
      );
    }
  }

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

  if (isSupabaseAuthBackendEnabled_()) {
    authBackendLog_("supabase getUserByUsername");
    try {
      var supabaseUser = supabaseGetUserByUsername_(normalizedUsername);
      if (supabaseUser) return supabaseUser;
      authBackendLog_("fallback getUserByUsername no Supabase match");
    } catch (err) {
      authBackendLog_(
        "fallback getUserByUsername " +
          (err && err.message ? err.message : String(err))
      );
    }
  }

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

  if (!user.rowNumber && isSupabaseAuthBackendEnabled_()) {
    try {
      supabasePatchRows_(getSupabaseConfig_(), "app_users", {
        username: user.username
      }, {
        spreadsheet_id: spreadsheetId,
        updated_at: new Date().toISOString()
      });
      user.spreadsheetId = spreadsheetId;
      return spreadsheetId;
    } catch (err) {
      authBackendLog_(
        "trainer spreadsheet Supabase patch skipped " +
          (err && err.message ? err.message : String(err))
      );
    }
  }

  if (!user.rowNumber) {
    user.spreadsheetId = spreadsheetId;
    return spreadsheetId;
  }

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

function runAuthAction_(action, data, sheetsFn) {
  if (isSupabaseAuthBackendEnabled_()) {
    authBackendLog_("supabase " + action);
    try {
      return supabaseAuthResponse_(supabaseHandleAuthAction_(action, data || {}));
    } catch (err) {
      authBackendLog_(
        "fallback " +
          action +
          " " +
          (err && err.message ? err.message : String(err))
      );
      var fallback = typeof sheetsFn === "function" ? sheetsFn() : {
        success: false,
        message: "Auth action failed"
      };
      if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
        fallback.authBackend = "sheets";
        fallback.authBackendFallbackUsed = true;
        fallback.authBackendWarning =
          "Supabase auth backend failed; used Google Sheets fallback.";
      }
      return fallback;
    }
  }

  authBackendLog_("sheets " + action);
  var response = typeof sheetsFn === "function" ? sheetsFn() : {
    success: false,
    message: "Auth action failed"
  };
  if (response && typeof response === "object" && !Array.isArray(response)) {
    response.authBackend = "sheets";
    response.authBackendFallbackUsed = false;
  }
  return response;
}

function supabaseAuthResponse_(response) {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    response.authBackend = "supabase";
    response.authBackendFallbackUsed = false;
  }
  return response;
}

function supabaseHandleAuthAction_(action, data) {
  if (action === "login") {
    return supabaseLoginUser_(data);
  }

  if (action === "getProfile") {
    return supabaseGetProfile_(data);
  }

  if (action === "saveUserSettings") {
    return supabaseSaveUserSettings_(data);
  }

  if (action === "createTrainerUser") {
    return supabaseCreateTrainerUser_(data);
  }

  if (action === "listTrainerUsers") {
    return supabaseListTrainerUsers_(data);
  }

  if (action === "updateTrainerAccess") {
    return supabaseUpdateTrainerAccess_(data);
  }

  if (action === "updateTrainerStatus") {
    return supabaseUpdateTrainerStatus_(data);
  }

  if (action === "resetTrainerPassword") {
    return supabaseResetTrainerPassword_(data);
  }

  if (action === "resetPlayerPassword") {
    return supabaseResetPlayerPassword_(data);
  }

  if (action === "archiveTrainerUser") {
    return supabaseArchiveTrainerUser_(data);
  }

  if (action === "restoreTrainerUser") {
    return supabaseRestoreTrainerUser_(data);
  }

  return {
    success: false,
    message: "Unknown auth action"
  };
}

function supabaseGetAppUserRows_() {
  return supabaseSelectRows_(getSupabaseConfig_(), "app_users", {});
}

function supabaseFindAppUserRow_(username) {
  var target = String(username || "").trim().toLowerCase();
  if (!target) return null;
  var rows = supabaseGetAppUserRows_();
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i] || {};
    if (
      String(row.username || "").trim().toLowerCase() === target ||
      String(row.legacy_username || "").trim().toLowerCase() === target
    ) {
      return row;
    }
  }
  return null;
}

function supabaseMapAppUser_(row) {
  if (!row) return null;
  var role = String(row.role || "player").trim().toLowerCase() || "player";
  var isAdmin = role === "admin";
  var canUseTeamBuilder = isAdmin
    ? true
    : parseAccessBoolean_(row.can_use_team_builder, true);
  var canUseTournaments = isAdmin
    ? true
    : parseAccessBoolean_(
        firstValue_(row.can_use_tournaments, row.can_create_tournaments),
        false
      );
  var username = String(firstValue_(row.username, row.legacy_username, "") || "").trim();
  return {
    rowNumber: null,
    username: username,
    password: String(row.password_hash || "").trim(),
    role: role,
    spreadsheetId: String(row.spreadsheet_id || "").trim(),
    skillView: normalizeSkillView(row.skill_view),
    skillScale: normalizeSkillScale(row.skill_scale),
    active: parseAccessBoolean_(row.active, false),
    canUseTeamBuilder: canUseTeamBuilder,
    canUseTournaments: canUseTournaments,
    displayName: String(row.display_name || "").trim(),
    email: String(row.email || "").trim(),
    phone: String(row.phone || "").trim(),
    access: {
      teamBuilder: canUseTeamBuilder,
      tournaments: canUseTournaments
    }
  };
}

function supabaseGetUserByUsername_(username) {
  return supabaseMapAppUser_(supabaseFindAppUserRow_(username));
}

function supabaseFindUserByCredentials_(username, password) {
  var row = supabaseFindAppUserRow_(username);
  if (!row) return null;

  var user = supabaseMapAppUser_(row);
  if (
    user &&
    user.active &&
    user.role !== "archived" &&
    passwordsMatch(String(password || "").trim(), user.password)
  ) {
    maybeUpgradeUserPasswordHash(user, password);
    return user;
  }

  return null;
}

function supabaseRequireAdminAuth_(data) {
  var user = supabaseFindUserByCredentials_(
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

function supabaseUserProfilePayload_(user) {
  var access = userAccessPayload_(user);
  return {
    username: user.username,
    role: user.role,
    canUseTeamBuilder: access.teamBuilder,
    canUseTournaments: access.tournaments,
    access: access,
    settings: {
      skillView: user.skillView || "numbers",
      skillScale: normalizeSkillScale(user.skillScale)
    }
  };
}

function supabaseLoginUser_(params) {
  var user = supabaseFindUserByCredentials_(
    params && params.username ? params.username : "",
    params && params.password ? params.password : ""
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid username or password"
    };
  }

  return {
    success: true,
    profile: supabaseUserProfilePayload_(user)
  };
}

function supabaseGetProfile_(params) {
  var user = supabaseFindUserByCredentials_(
    params && params.username ? params.username : "",
    params && params.password ? params.password : ""
  );

  if (!user) {
    return {
      loggedIn: false,
      role: "guest",
      settings: {
        skillView: "numbers",
        skillScale: 5
      }
    };
  }

  return Object.assign({
    loggedIn: true
  }, supabaseUserProfilePayload_(user));
}

function supabasePatchAppUser_(username, patch) {
  return supabasePatchRows_(getSupabaseConfig_(), "app_users", {
    username: String(username || "").trim()
  }, patch);
}

function supabaseTrainerUserPayload_(user) {
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
}

function supabaseListTrainerUsers_(data) {
  var adminCheck = supabaseRequireAdminAuth_(data);
  if (!adminCheck.success) {
    return {
      success: false,
      message: adminCheck.message,
      users: []
    };
  }

  var users = supabaseGetAppUserRows_()
    .map(supabaseMapAppUser_)
    .filter(function (user) {
      return user && (user.role === "trainer" || user.role === "archived");
    })
    .map(supabaseTrainerUserPayload_);

  return {
    success: true,
    users: users
  };
}

function supabaseCreateTrainerUser_(data) {
  var adminCheck = supabaseRequireAdminAuth_(data);
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

  if (!username) return { success: false, message: "Username is required" };
  if (!password) return { success: false, message: "Password is required" };
  if (supabaseGetUserByUsername_(username)) {
    return { success: false, message: "Username already exists" };
  }
  if (copyMode === "trainer" && !copyFromTrainerUsername) {
    return { success: false, message: "copyFromTrainerUsername is required" };
  }

  try {
    var trainerSpreadsheet = createTrainerSpreadsheet(
      username,
      copyMode,
      copyFromTrainerUsername
    );
    var now = new Date().toISOString();
    var row = {
      legacy_username: username.toLowerCase(),
      username: username,
      password_hash: hashPassword(password),
      role: role,
      active: !!active,
      can_use_team_builder: !!canUseTeamBuilder,
      can_use_tournaments: !!canUseTournaments,
      can_create_tournaments: !!canUseTournaments,
      spreadsheet_id: trainerSpreadsheet.getId(),
      skill_view: skillView,
      skill_scale: skillScale,
      created_at: now,
      updated_at: now
    };
    supabaseInsertRows_(getSupabaseConfig_(), "app_users", [row]);
    supabaseAuditLog_(getSupabaseConfig_(), adminCheck.admin.username, "createTrainerUser", "app_users", username, {
      copyMode: copyMode,
      copyFromTrainerUsername: copyFromTrainerUsername
    });

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

function supabaseUpdateTrainerAccess_(data) {
  var adminCheck = supabaseRequireAdminAuth_(data);
  if (!adminCheck.success) {
    return {
      success: false,
      message: adminCheck.message === "Only admin can do this action"
        ? "Admin access required"
        : adminCheck.message
    };
  }

  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();
  if (!targetUsername) return { success: false, message: "targetUsername is required" };

  var targetUser = supabaseGetUserByUsername_(targetUsername);
  if (!targetUser) return { success: false, message: "User not found" };

  var canUseTeamBuilder = parseAccessBoolean_(data && data.canUseTeamBuilder, false);
  var canUseTournaments = parseAccessBoolean_(data && data.canUseTournaments, false);
  if (isAdminUser_(targetUser)) {
    canUseTeamBuilder = true;
    canUseTournaments = true;
  }

  supabasePatchAppUser_(targetUser.username, {
    can_use_team_builder: canUseTeamBuilder,
    can_use_tournaments: canUseTournaments,
    can_create_tournaments: canUseTournaments,
    updated_at: new Date().toISOString()
  });

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

function supabaseUpdateTrainerStatus_(data) {
  var adminCheck = supabaseRequireAdminAuth_(data);
  if (!adminCheck.success) return { success: false, message: adminCheck.message };
  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();
  var active = data && data.active == 1 ? 1 : 0;
  if (!targetUsername) return { success: false, message: "targetUsername is required" };
  var user = supabaseGetUserByUsername_(targetUsername);
  if (!user) return { success: false, message: "Trainer not found" };
  if (user.role !== "trainer") {
    return {
      success: false,
      message: "Only active trainer users can be updated here"
    };
  }
  supabasePatchAppUser_(user.username, {
    active: !!active,
    updated_at: new Date().toISOString()
  });
  return {
    success: true,
    message: active ? "Trainer activated" : "Trainer deactivated"
  };
}

function supabaseResetTrainerPassword_(data) {
  var adminCheck = supabaseRequireAdminAuth_(data);
  if (!adminCheck.success) return { success: false, message: adminCheck.message };
  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();
  var newPassword = String(data && data.newPassword ? data.newPassword : "").trim();
  if (!targetUsername) return { success: false, message: "targetUsername is required" };
  if (!newPassword) return { success: false, message: "newPassword is required" };
  var user = supabaseGetUserByUsername_(targetUsername);
  if (!user) return { success: false, message: "Trainer not found" };
  if (user.role !== "trainer") {
    return {
      success: false,
      message: "Only active trainer users can be updated here"
    };
  }
  supabasePatchAppUser_(user.username, {
    password_hash: hashPassword(newPassword),
    updated_at: new Date().toISOString()
  });
  return {
    success: true,
    message: "Password updated"
  };
}

function supabaseResetPlayerPassword_(data) {
  var adminCheck = supabaseRequireAdminAuth_(data);
  if (!adminCheck.success) return { success: false, message: adminCheck.message };
  var targetUsername = String(
    data && (data.targetUsername || data.profileUsername || data.playerUsername) || ""
  ).trim();
  var newPassword = String(data && data.newPassword ? data.newPassword : "").trim();
  if (!targetUsername) return { success: false, message: "targetUsername is required" };
  if (!newPassword) return { success: false, message: "newPassword is required" };
  var user = supabaseGetUserByUsername_(targetUsername);
  if (!user) return { success: false, message: "Player account not found" };
  if (String(user.role || "").trim().toLowerCase() !== "player") {
    return {
      success: false,
      message: "Only player account passwords can be reset here"
    };
  }
  supabasePatchAppUser_(user.username, {
    password_hash: hashPassword(newPassword),
    updated_at: new Date().toISOString()
  });
  return {
    success: true,
    message: "Player password reset."
  };
}

function supabaseArchiveTrainerUser_(data) {
  var adminCheck = supabaseRequireAdminAuth_(data);
  if (!adminCheck.success) return { success: false, message: adminCheck.message };
  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();
  if (!targetUsername) return { success: false, message: "targetUsername is required" };
  var user = supabaseGetUserByUsername_(targetUsername);
  if (!user) return { success: false, message: "Trainer not found" };
  if (user.role !== "trainer") {
    return {
      success: false,
      message: "Only trainer users can be archived"
    };
  }
  supabasePatchAppUser_(user.username, {
    role: "archived",
    active: false,
    archived_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  return {
    success: true,
    message: "Trainer archived"
  };
}

function supabaseRestoreTrainerUser_(data) {
  var adminCheck = supabaseRequireAdminAuth_(data);
  if (!adminCheck.success) return { success: false, message: adminCheck.message };
  var targetUsername = String(data && data.targetUsername ? data.targetUsername : "").trim();
  if (!targetUsername) return { success: false, message: "targetUsername is required" };
  var user = supabaseGetUserByUsername_(targetUsername);
  if (!user) return { success: false, message: "Trainer not found" };
  if (user.role !== "archived") {
    return {
      success: false,
      message: "Only archived users can be restored"
    };
  }
  supabasePatchAppUser_(user.username, {
    role: "trainer",
    active: true,
    archived_at: null,
    updated_at: new Date().toISOString()
  });
  return {
    success: true,
    message: "Trainer restored"
  };
}

function supabaseSaveUserSettings_(data) {
  var user = supabaseFindUserByCredentials_(
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
  supabasePatchAppUser_(user.username, {
    skill_view: skillView,
    skill_scale: skillScale,
    updated_at: new Date().toISOString()
  });
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

function runTeamBuilderAction_(action, data, context, sheetsFn) {
  if (isSupabaseTeamBuilderBackendEnabled_()) {
    teamBuilderBackendLog_("supabase " + action);
    try {
      return supabaseTeamBuilderResponse_(
        supabaseHandleTeamBuilderAction_(action, data || {}, context)
      );
    } catch (err) {
      teamBuilderBackendLog_(
        "fallback " +
          action +
          " " +
          (err && err.message ? err.message : String(err))
      );
      var fallback = typeof sheetsFn === "function" ? sheetsFn() : {
        success: false,
        message: "Team Builder action failed"
      };
      if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
        fallback.teamBuilderBackend = "sheets";
        fallback.teamBuilderBackendFallbackUsed = true;
        fallback.teamBuilderBackendWarning =
          "Supabase Team Builder backend failed; used Google Sheets fallback.";
      }
      return fallback;
    }
  }

  teamBuilderBackendLog_("sheets " + action);
  var response = typeof sheetsFn === "function" ? sheetsFn() : {
    success: false,
    message: "Team Builder action failed"
  };
  if (response && typeof response === "object" && !Array.isArray(response)) {
    response.teamBuilderBackend = "sheets";
    response.teamBuilderBackendFallbackUsed = false;
  }
  return response;
}

function supabaseTeamBuilderResponse_(response) {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    response.teamBuilderBackend = "supabase";
    response.teamBuilderBackendFallbackUsed = false;
  }
  return response;
}

function supabaseHandleTeamBuilderAction_(action, data, context) {
  if (!context || !context.authenticated || !context.user) {
    return {
      success: false,
      message: "Login required"
    };
  }

  if (!userCanUseTeamBuilder_(context.user)) {
    return {
      success: false,
      message: "Team Builder access required"
    };
  }

  if (action === "getPlayers") {
    return supabaseGetPlayers_(context, !!(data && data.includeArchived));
  }

  if (action === "addPlayer") {
    return supabaseAddPlayer_(context, data.player);
  }

  if (action === "saveSkills") {
    supabaseSaveSkills_(context, data.players || []);
    return { success: true };
  }

  if (action === "updatePlayerName") {
    supabaseUpdatePlayerName_(context, data.oldName, data.newName);
    return { success: true };
  }

  if (action === "updatePlayer") {
    return supabaseUpdatePlayer_(context, data.oldName, data.player || {});
  }

  if (action === "archivePlayer") {
    return supabaseArchivePlayer_(context, data.playerName);
  }

  if (action === "restorePlayer") {
    return supabaseRestorePlayer_(context, data.playerName);
  }

  if (action === "saveTeams") {
    supabaseSaveTeams_(context, data.teams || []);
    return { success: true };
  }

  return {
    success: false,
    message: "Unknown Team Builder action"
  };
}

function teamBuilderOwnerUsername_(context) {
  var user = context && context.user ? context.user : null;
  if (!user || !user.username) return "__main__";
  if (isAdminUser_(user) && !user.spreadsheetId) return "__main__";
  return String(user.username || "").trim();
}

function normalizeTeamBuilderName_(name) {
  return String(name || "").trim().toLowerCase();
}

function supabaseListTeamBuilderPlayerRows_(config, ownerUsername) {
  var rows = supabaseSelectRows_(config, "team_builder_players", {
    owner_username: ownerUsername
  });
  rows.sort(function (a, b) {
    var createdA = String(a.created_at || "");
    var createdB = String(b.created_at || "");
    if (createdA !== createdB) return createdA < createdB ? -1 : 1;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return rows;
}

function supabaseMapTeamBuilderPlayer_(row) {
  return {
    active: row.active !== false && String(row.active || "").toLowerCase() !== "false",
    name: String(row.name || "").trim(),
    skill: Number(row.skill) || 1,
    cannot: parseCannotList(row.cannot_play_with),
    club: normalizeClub(row.club)
  };
}

function supabaseFindTeamBuilderPlayerRow_(rows, name) {
  var wanted = normalizeTeamBuilderName_(name);
  if (!wanted) return null;
  for (var i = 0; i < rows.length; i++) {
    if (normalizeTeamBuilderName_(rows[i].name) === wanted) {
      return rows[i];
    }
  }
  return null;
}

function supabaseTeamBuilderPlayerPatch_(player, activeOverride) {
  var now = new Date().toISOString();
  var patch = {
    name: String(player && player.name ? player.name : "").trim(),
    skill: Number(player && player.skill) || 1,
    cannot_play_with: parseCannotList(player && player.cannot),
    club: normalizeClub(player && player.club),
    updated_at: now
  };
  if (activeOverride !== undefined) {
    patch.active = !!activeOverride;
  } else if (player && player.active !== undefined) {
    patch.active = !!player.active;
  }
  return patch;
}

function supabaseGetPlayers_(context, includeArchived) {
  var config = getSupabaseConfig_();
  var ownerUsername = teamBuilderOwnerUsername_(context);
  var rows = supabaseListTeamBuilderPlayerRows_(config, ownerUsername);
  var mapped = rows
    .map(supabaseMapTeamBuilderPlayer_)
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

function supabaseAddPlayer_(context, player) {
  if (!player || !player.name) {
    return {
      success: false,
      message: "Player name is required"
    };
  }

  var name = String(player.name || "").trim();
  if (!name) {
    return {
      success: false,
      message: "Player name is required"
    };
  }

  var config = getSupabaseConfig_();
  var ownerUsername = teamBuilderOwnerUsername_(context);
  var rows = supabaseListTeamBuilderPlayerRows_(config, ownerUsername);
  if (supabaseFindTeamBuilderPlayerRow_(rows, name)) {
    return {
      success: false,
      message: "Player name already exists"
    };
  }

  var now = new Date().toISOString();
  var row = supabaseTeamBuilderPlayerPatch_(
    {
      name: name,
      skill: player.skill,
      cannot: player.cannot,
      club: player.club,
      active: true
    },
    true
  );
  row.legacy_player_id = "team-builder-player-" + Utilities.getUuid();
  row.owner_username = ownerUsername;
  row.owner_display_name = context.user.displayName || context.user.username || ownerUsername;
  row.notes = String(player.notes || "");
  row.metadata = {
    source: "apps-script-team-builder"
  };
  row.created_at = now;
  row.updated_at = now;

  supabaseInsertRows_(config, "team_builder_players", [row]);
  supabaseAuditLog_(config, context.user.username, "addPlayer", "team_builder_players", row.legacy_player_id, {
    ownerUsername: ownerUsername,
    name: name
  });
  return {
    success: true
  };
}

function supabaseSaveSkills_(context, players) {
  var config = getSupabaseConfig_();
  var ownerUsername = teamBuilderOwnerUsername_(context);
  var rows = supabaseListTeamBuilderPlayerRows_(config, ownerUsername);
  (players || []).forEach(function (player) {
    var row = supabaseFindTeamBuilderPlayerRow_(rows, player && player.name);
    if (!row || !row.legacy_player_id) return;
    supabasePatchRows_(config, "team_builder_players", {
      legacy_player_id: row.legacy_player_id
    }, {
      skill: Number(player.skill) || 1,
      updated_at: new Date().toISOString()
    });
  });
}

function supabaseUpdatePlayerName_(context, oldName, newName) {
  if (!oldName || !newName) return;
  var config = getSupabaseConfig_();
  var ownerUsername = teamBuilderOwnerUsername_(context);
  var rows = supabaseListTeamBuilderPlayerRows_(config, ownerUsername);
  var row = supabaseFindTeamBuilderPlayerRow_(rows, oldName);
  if (!row || !row.legacy_player_id) return;
  supabasePatchRows_(config, "team_builder_players", {
    legacy_player_id: row.legacy_player_id
  }, {
    name: String(newName || "").trim(),
    updated_at: new Date().toISOString()
  });
}

function supabaseUpdatePlayer_(context, oldName, player) {
  if (!oldName || !player || !player.name) {
    return {
      success: false,
      message: "Missing player data"
    };
  }

  var newName = String(player.name || "").trim();
  if (!newName) {
    return {
      success: false,
      message: "Player name is required"
    };
  }

  var config = getSupabaseConfig_();
  var ownerUsername = teamBuilderOwnerUsername_(context);
  var rows = supabaseListTeamBuilderPlayerRows_(config, ownerUsername);
  var duplicate = supabaseFindTeamBuilderPlayerRow_(rows, newName);
  if (duplicate && normalizeTeamBuilderName_(newName) !== normalizeTeamBuilderName_(oldName)) {
    return {
      success: false,
      message: "Player name already exists"
    };
  }

  var row = supabaseFindTeamBuilderPlayerRow_(rows, oldName);
  if (!row || !row.legacy_player_id) {
    return {
      success: false,
      message: "Player not found"
    };
  }

  supabasePatchRows_(config, "team_builder_players", {
    legacy_player_id: row.legacy_player_id
  }, supabaseTeamBuilderPlayerPatch_(player, row.active !== false));
  supabaseAuditLog_(config, context.user.username, "updatePlayer", "team_builder_players", row.legacy_player_id, {
    ownerUsername: ownerUsername,
    oldName: String(oldName || "").trim(),
    newName: newName
  });
  return {
    success: true
  };
}

function supabaseArchivePlayer_(context, playerName) {
  return supabaseSetTeamBuilderPlayerActive_(context, playerName, false, "archivePlayer");
}

function supabaseRestorePlayer_(context, playerName) {
  return supabaseSetTeamBuilderPlayerActive_(context, playerName, true, "restorePlayer");
}

function supabaseSetTeamBuilderPlayerActive_(context, playerName, active, action) {
  var name = String(playerName || "").trim();
  if (!name) {
    return {
      success: false,
      message: "playerName is required"
    };
  }

  var config = getSupabaseConfig_();
  var ownerUsername = teamBuilderOwnerUsername_(context);
  var rows = supabaseListTeamBuilderPlayerRows_(config, ownerUsername);
  var row = supabaseFindTeamBuilderPlayerRow_(rows, name);
  if (!row || !row.legacy_player_id) {
    return {
      success: false,
      message: "Player not found"
    };
  }

  supabasePatchRows_(config, "team_builder_players", {
    legacy_player_id: row.legacy_player_id
  }, {
    active: !!active,
    updated_at: new Date().toISOString()
  });
  supabaseAuditLog_(config, context.user.username, action, "team_builder_players", row.legacy_player_id, {
    ownerUsername: ownerUsername,
    name: name
  });
  return {
    success: true
  };
}

function supabaseSaveTeams_(context, currentTeams) {
  var config = getSupabaseConfig_();
  var ownerUsername = teamBuilderOwnerUsername_(context);
  var now = new Date().toISOString();
  var legacySavedTeamId = "team-builder-current-" + ownerUsername;
  supabaseUpsertRows_(config, "team_builder_saved_teams", [
    {
      legacy_saved_team_id: legacySavedTeamId,
      owner_username: ownerUsername,
      label: "Current teams",
      teams_json: currentTeams || [],
      created_at: now,
      updated_at: now
    }
  ], "legacy_saved_team_id");
  supabaseAuditLog_(config, context.user.username, "saveTeams", "team_builder_saved_teams", legacySavedTeamId, {
    ownerUsername: ownerUsername,
    teamCount: Array.isArray(currentTeams) ? currentTeams.length : 0
  });
}

function supabaseListTeams_(context) {
  var config = getSupabaseConfig_();
  var ownerUsername = teamBuilderOwnerUsername_(context);
  var rows = supabaseSelectRows_(config, "team_builder_saved_teams", {
    owner_username: ownerUsername
  });
  rows.sort(function (a, b) {
    return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
  });
  return rows.map(function (row) {
    return {
      label: row.label || "Current teams",
      teams: Array.isArray(row.teams_json) ? row.teams_json : [],
      updatedAt: row.updated_at || ""
    };
  });
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

function playerHubSnapshotOfficialRosters_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "officialRosters",
    OFFICIAL_ROSTERS_SHEET_,
    OFFICIAL_ROSTER_HEADERS_,
    "OfficialRosters",
    officialRosterFromRow_
  );
}

function playerHubSnapshotTournaments_(ctx) {
  return playerHubSnapshotData_(
    ctx,
    "tournaments",
    TOURNAMENTS_SHEET_,
    TOURNAMENT_HEADERS_,
    "Tournaments",
    tournamentFromRow_
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
  var officialPlayers = playerHubSnapshotOfficialRosters_(ctx)
    .filter(function (player) {
      return player && player.draftId === roster.rosterId && player.status === "LOCKED";
    })
    .sort(function (a, b) {
      var squadOrder = { "Team A": 1, "Team B": 2, "Team C": 3, Reserve: 4 };
      var squadDiff =
        (squadOrder[a.groupName] || 99) - (squadOrder[b.groupName] || 99);
      if (squadDiff !== 0) return squadDiff;
      var aName = String(a.playerDisplayName || a.playerUsername || "");
      var bName = String(b.playerDisplayName || b.playerUsername || "");
      return aName.localeCompare(bName);
    });
  return Object.assign({}, roster, {
    players: players,
    playerCount: players.length,
    officialPlayers: officialPlayers,
    officialPlayerCount: officialPlayers.length
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

function playerHubBackendMode_() {
  var properties = PropertiesService.getScriptProperties();
  var mode = String(properties.getProperty("PLAYER_HUB_BACKEND") || "sheets")
    .trim()
    .toLowerCase();
  return mode === "supabase" ? "supabase" : "sheets";
}

function playerHubBackendLog_(message) {
  playerHubSnapshotLog_("[PlayerHubBackend] " + message);
}

function authBackendMode_() {
  try {
    var mode = String(
      PropertiesService.getScriptProperties().getProperty("AUTH_BACKEND") || "sheets"
    )
      .trim()
      .toLowerCase();
    return mode === "supabase" ? "supabase" : "sheets";
  } catch (err) {
    return "sheets";
  }
}

function authBackendLog_(message) {
  try {
    Logger.log("[AuthBackend] " + message);
  } catch (err) {}
}

function isSupabaseAuthBackendEnabled_() {
  try {
    var config = getSupabaseConfig_();
    return !!(
      config &&
      config.authBackend === "supabase" &&
      config.url &&
      config.serviceRoleKey
    );
  } catch (err) {
    authBackendLog_(
      "mode check failed " + (err && err.message ? err.message : String(err))
    );
    return false;
  }
}

function teamBuilderBackendMode_() {
  try {
    var mode = String(
      PropertiesService.getScriptProperties().getProperty("TEAM_BUILDER_BACKEND") || "sheets"
    )
      .trim()
      .toLowerCase();
    return mode === "supabase" ? "supabase" : "sheets";
  } catch (err) {
    return "sheets";
  }
}

function teamBuilderBackendLog_(message) {
  try {
    Logger.log("[TeamBuilderBackend] " + message);
  } catch (err) {}
}

function isSupabaseTeamBuilderBackendEnabled_() {
  try {
    var config = getSupabaseConfig_();
    return !!(
      config &&
      config.teamBuilderBackend === "supabase" &&
      config.url &&
      config.serviceRoleKey
    );
  } catch (err) {
    teamBuilderBackendLog_(
      "mode check failed " + (err && err.message ? err.message : String(err))
    );
    return false;
  }
}

function getSupabaseConfig_() {
  var properties = PropertiesService.getScriptProperties();
  var enabledValue = String(
    properties.getProperty("SUPABASE_PLAYER_HUB_READS_ENABLED") || ""
  )
    .trim()
    .toLowerCase();
  var backendMode = playerHubBackendMode_();
  var tournamentBackendMode = tournamentBackendMode_();
  var teamBuilderBackendMode = teamBuilderBackendMode_();
  var authBackendMode = authBackendMode_();
  return {
    url: String(properties.getProperty("SUPABASE_URL") || "").trim(),
    serviceRoleKey: String(
      properties.getProperty("SUPABASE_SERVICE_ROLE_KEY") || ""
    ).trim(),
    playerHubBackend: backendMode,
    tournamentBackend: tournamentBackendMode,
    teamBuilderBackend: teamBuilderBackendMode,
    authBackend: authBackendMode,
    playerHubReadsEnabled:
      backendMode === "supabase" ||
      enabledValue === "true" ||
      enabledValue === "1" ||
      enabledValue === "yes" ||
      enabledValue === "on"
  };
}

function tournamentBackendMode_() {
  try {
    var mode = String(
      PropertiesService.getScriptProperties().getProperty("TOURNAMENT_BACKEND") || "sheets"
    )
      .trim()
      .toLowerCase();
    return mode === "supabase" ? "supabase" : "sheets";
  } catch (err) {
    return "sheets";
  }
}

function tournamentBackendLog_(message) {
  try {
    Logger.log("[TournamentBackend] " + message);
  } catch (err) {}
}

function isSupabaseTournamentBackendEnabled_() {
  try {
    var config = getSupabaseConfig_();
    return !!(
      config &&
      config.tournamentBackend === "supabase" &&
      config.url &&
      config.serviceRoleKey
    );
  } catch (err) {
    tournamentBackendLog_(
      "Supabase backend config unavailable " +
        (err && err.message ? err.message : String(err))
    );
    return false;
  }
}

function isSupabasePlayerHubBackendEnabled_() {
  try {
    var config = getSupabaseConfig_();
    return !!(
      config &&
      config.playerHubBackend === "supabase" &&
      config.url &&
      config.serviceRoleKey
    );
  } catch (err) {
    playerHubBackendLog_(
      "Supabase backend config unavailable " +
        (err && err.message ? err.message : String(err))
    );
    return false;
  }
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

function playerHubBackendActionMap_() {
  return {
    getMyPlayerProfile: supabaseGetMyPlayerProfile_,
    listClubTeams: supabaseListClubTeams_,
    listClubTeamsAdmin: supabaseListClubTeamsAdmin_,
    saveClubTeamAdmin: supabaseSaveClubTeamAdmin_,
    deactivateClubTeamAdmin: supabaseDeactivateClubTeamAdmin_,
    updatePlayerProfileAdminStatus: supabaseUpdatePlayerProfileAdminStatus_,
    listVisibleTeamNeeds: supabaseListVisibleTeamNeeds_,
    listMyAccessRequests: supabaseListMyAccessRequests_,
    listAccessRequestsAdmin: supabaseListAccessRequestsAdmin_,
    reviewAccessRequestAdmin: supabaseReviewAccessRequestAdmin_,
    requestTeamIdentityChange: supabaseRequestTeamIdentityChange_,
    listTeamIdentityChangeRequests: supabaseListTeamIdentityChangeRequests_,
    reviewTeamIdentityChangeRequest: supabaseReviewTeamIdentityChangeRequest_,
    getMyTeamProfile: supabaseGetMyTeamProfile_,
    saveMyTeamProfile: supabaseSaveMyTeamProfile_,
    createOrUpdateTeamNeed: supabaseCreateOrUpdateTeamNeed_,
    closeTeamNeed: supabaseCloseTeamNeed_,
    listTeamProfilesAdmin: supabaseListTeamProfilesAdmin_,
    updateTeamProfileAdmin: supabaseUpdateTeamProfileAdmin_,
    createTeamNeedInterest: supabaseCreateTeamNeedInterest_,
    listMyTeamNeedInterests: supabaseListMyTeamNeedInterests_,
    listTeamNeedInterestsForCaptain: supabaseListTeamNeedInterestsForCaptain_,
    reviewTeamNeedInterest: supabaseReviewTeamNeedInterest_,
    listTeamNeedInterestsAdmin: supabaseListTeamNeedInterestsAdmin_,
    addTeamMemberFromInterest: supabaseAddTeamMemberFromInterest_,
    listMyTeamMembersForCaptain: supabaseListMyTeamMembersForCaptain_,
    listMyConfirmedTeamsForPlayer: supabaseListMyConfirmedTeamsForPlayer_,
    removeTeamMember: supabaseRemoveTeamMember_,
    listTeamMembersAdmin: supabaseListTeamMembersAdmin_,
    createOrUpdateTeamMembershipRequest: supabaseCreateOrUpdateTeamMembershipRequest_,
    listMyTeamMembershipRequests: supabaseListMyTeamMembershipRequests_,
    listMembershipRequestsForCaptain: supabaseListMembershipRequestsForCaptain_,
    reviewTeamMembershipRequest: supabaseReviewTeamMembershipRequest_,
    cancelMyTeamMembershipRequest: supabaseCancelMyTeamMembershipRequest_,
    listTeamMembershipRequestsAdmin: supabaseListTeamMembershipRequestsAdmin_,
    createTournamentTeamPlan: supabaseCreateTournamentTeamPlan_,
    listMyTournamentTeamPlansForCaptain: supabaseListMyTournamentTeamPlansForCaptain_,
    listMyTournamentAvailabilityForPlayer: supabaseListMyTournamentAvailabilityForPlayer_,
    listMyTournamentSquadPlanningForPlayer:
      supabaseListMyTournamentSquadPlanningForPlayer_,
    listTournamentAvailabilityForCaptain: supabaseListTournamentAvailabilityForCaptain_,
    updateTournamentPlanStatus: supabaseUpdateTournamentPlanStatus_,
    listTournamentSquadPlanningForCaptain:
      supabaseListTournamentSquadPlanningForCaptain_,
    syncSquadPlanningFromAvailability: supabaseListTournamentSquadPlanningForCaptain_,
    assignPlayerToSquad: supabaseAssignPlayerToSquad_,
    removePlayerFromSquadPlanning: supabaseRemovePlayerFromSquadPlanning_,
    createOrUpdateRosterDraftFromSquadPlanning:
      supabaseCreateOrUpdateRosterDraftFromSquadPlanning_,
    listRosterDraftForCaptain: supabaseListRosterDraftForCaptain_,
    submitRosterDraft: supabaseSubmitRosterDraft_,
    removePlayerFromRosterDraft: supabaseRemovePlayerFromRosterDraft_,
    cancelRosterDraft: supabaseCancelRosterDraft_,
    listRosterDraftAdmin: supabaseListSubmittedRosterDraftsForReview_,
    listSubmittedRosterDraftsForReview: supabaseListSubmittedRosterDraftsForReview_,
    reviewRosterDraft: supabaseReviewRosterDraft_,
    lockOfficialRoster: supabaseLockOfficialRoster_,
    listMyRosterStatusForPlayer: supabaseListMyRosterStatusForPlayer_,
    listEventComments: supabaseListEventComments_,
    saveMyPlayerProfile: supabaseSaveMyPlayerProfile_,
    createAccessRequest: supabaseCreateAccessRequest_,
    updateTournamentAvailabilityResponse: supabaseUpdateTournamentAvailabilityResponse_,
    addEventComment: supabaseAddEventComment_,
    archiveEventComment: supabaseArchiveEventComment_
  };
}

function playerHubBackendWriteActions_() {
  return {
    saveClubTeamAdmin: true,
    deactivateClubTeamAdmin: true,
    updatePlayerProfileAdminStatus: true,
    reviewAccessRequestAdmin: true,
    requestTeamIdentityChange: true,
    reviewTeamIdentityChangeRequest: true,
    saveMyTeamProfile: true,
    createOrUpdateTeamNeed: true,
    closeTeamNeed: true,
    updateTeamProfileAdmin: true,
    createTeamNeedInterest: true,
    reviewTeamNeedInterest: true,
    addTeamMemberFromInterest: true,
    removeTeamMember: true,
    createOrUpdateTeamMembershipRequest: true,
    reviewTeamMembershipRequest: true,
    cancelMyTeamMembershipRequest: true,
    createTournamentTeamPlan: true,
    updateTournamentPlanStatus: true,
    assignPlayerToSquad: true,
    removePlayerFromSquadPlanning: true,
    createOrUpdateRosterDraftFromSquadPlanning: true,
    submitRosterDraft: true,
    removePlayerFromRosterDraft: true,
    cancelRosterDraft: true,
    reviewRosterDraft: true,
    lockOfficialRoster: true,
    addEventComment: true,
    archiveEventComment: true,
    saveMyPlayerProfile: true,
    createAccessRequest: true,
    updateTournamentAvailabilityResponse: true
  };
}

function playerHubKnownBackendActions_() {
  return {
    getMyPlayerProfile: true,
    getPlayerHubSnapshot: true,
    listClubTeams: true,
    listClubTeamsAdmin: true,
    saveClubTeamAdmin: true,
    deactivateClubTeamAdmin: true,
    requestTeamIdentityChange: true,
    listTeamIdentityChangeRequests: true,
    reviewTeamIdentityChangeRequest: true,
    createAccessRequest: true,
    listMyAccessRequests: true,
    listAccessRequestsAdmin: true,
    reviewAccessRequestAdmin: true,
    getMyTeamProfile: true,
    saveMyTeamProfile: true,
    createOrUpdateTeamNeed: true,
    closeTeamNeed: true,
    listVisibleTeamNeeds: true,
    listTeamProfilesAdmin: true,
    updateTeamProfileAdmin: true,
    createTeamNeedInterest: true,
    listMyTeamNeedInterests: true,
    listTeamNeedInterestsForCaptain: true,
    reviewTeamNeedInterest: true,
    listTeamNeedInterestsAdmin: true,
    addTeamMemberFromInterest: true,
    listMyTeamMembersForCaptain: true,
    listMyConfirmedTeamsForPlayer: true,
    removeTeamMember: true,
    listTeamMembersAdmin: true,
    createOrUpdateTeamMembershipRequest: true,
    listMyTeamMembershipRequests: true,
    listMembershipRequestsForCaptain: true,
    reviewTeamMembershipRequest: true,
    cancelMyTeamMembershipRequest: true,
    listTeamMembershipRequestsAdmin: true,
    createTournamentTeamPlan: true,
    listMyTournamentTeamPlansForCaptain: true,
    listMyTournamentAvailabilityForPlayer: true,
    listMyTournamentSquadPlanningForPlayer: true,
    updateTournamentAvailabilityResponse: true,
    listTournamentAvailabilityForCaptain: true,
    updateTournamentPlanStatus: true,
    syncSquadPlanningFromAvailability: true,
    listTournamentSquadPlanningForCaptain: true,
    assignPlayerToSquad: true,
    removePlayerFromSquadPlanning: true,
    createOrUpdateRosterDraftFromSquadPlanning: true,
    listRosterDraftForCaptain: true,
    submitRosterDraft: true,
    removePlayerFromRosterDraft: true,
    cancelRosterDraft: true,
    listMyRosterStatusForPlayer: true,
    listRosterDraftAdmin: true,
    listSubmittedRosterDraftsForReview: true,
    reviewRosterDraft: true,
    lockOfficialRoster: true,
    listEventComments: true,
    addEventComment: true,
    archiveEventComment: true
  };
}

function handlePlayerHubSupabaseAction_(data) {
  var action = String(data && data.action || "").trim();
  if (!action || !isSupabasePlayerHubBackendEnabled_()) return null;

  var handlers = playerHubBackendActionMap_();
  var handler = handlers[action];
  if (!handler) {
    if (playerHubKnownBackendActions_()[action]) {
      playerHubBackendLog_("fallback " + action + " (not migrated yet)");
    }
    return null;
  }

  try {
    playerHubBackendLog_(
      (playerHubBackendWriteActions_()[action] ? "supabase write " : "supabase ") +
        action
    );
    return handler(data || {});
  } catch (err) {
    playerHubBackendLog_(
      "fallback " +
        action +
        " " +
        (err && err.message ? err.message : String(err))
    );
    return null;
  }
}

function supabaseApiBaseUrl_(config, tableName, query) {
  var url =
    String(config.url || "").replace(/\/+$/, "") +
    "/rest/v1/" +
    tableName;
  if (query) url += "?" + query;
  return url;
}

function supabaseFilter_(column, value) {
  return encodeURIComponent(column) + "=eq." + encodeURIComponent(String(value || ""));
}

function supabaseApiRequest_(config, tableName, method, query, payload, prefer) {
  var headers = {
    apikey: config.serviceRoleKey,
    Authorization: "Bearer " + config.serviceRoleKey,
    Accept: "application/json"
  };
  if (payload !== undefined && payload !== null) {
    headers["Content-Type"] = "application/json";
  }
  if (prefer) headers.Prefer = prefer;

  var request = {
    method: String(method || "get").toLowerCase(),
    muteHttpExceptions: true,
    headers: headers
  };
  if (payload !== undefined && payload !== null) {
    request.payload = JSON.stringify(payload);
  }

  var response = UrlFetchApp.fetch(
    supabaseApiBaseUrl_(config, tableName, query),
    request
  );
  var statusCode = response.getResponseCode();
  var body = response.getContentText() || "";
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(
      tableName + " " + method + " failed: " + statusCode + " " + body.slice(0, 180)
    );
  }

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (err) {
    return null;
  }
}

function supabaseSelectRows_(config, tableName, filters, select) {
  var parts = ["select=" + encodeURIComponent(select || "*")];
  Object.keys(filters || {}).forEach(function (key) {
    parts.push(supabaseFilter_(key, filters[key]));
  });
  var rows = supabaseApiRequest_(config, tableName, "get", parts.join("&"));
  return Array.isArray(rows) ? rows : [];
}

function supabaseTableWriteColumns_() {
  return {
    app_users: ["legacy_username", "username", "password_hash", "email", "phone", "display_name", "role", "active", "can_request_team_profile", "can_use_team_builder", "can_use_tournaments", "can_create_tournaments", "spreadsheet_id", "skill_view", "skill_scale", "archived_at", "created_at", "updated_at"],
    club_teams: ["legacy_team_id", "name", "country", "city", "level", "type", "active", "created_at", "updated_at"],
    player_profiles: ["legacy_profile_id", "username", "first_name", "last_name", "display_name", "email", "phone", "country", "region", "legacy_club_team_id", "club_team_name", "club_or_team", "team_note", "profile_type", "free_agent", "primary_role", "secondary_role", "custom_role", "level", "availability", "looking_for_team", "available_as_substitute", "can_guest_for_teams", "interested_abroad", "public_visible", "approved", "created_at", "updated_at"],
    access_requests: ["legacy_request_id", "username", "display_name", "email", "request_type", "legacy_club_team_id", "club_team_name", "message", "status", "admin_note", "reviewed_by_username", "reviewed_at", "created_at", "updated_at"],
    team_profiles: ["legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "country", "captain_username", "captain_display_name", "team_level", "team_description", "contact_note", "needs_players", "needs_text", "active", "public_visible", "approved", "created_at", "updated_at"],
    team_identity_change_requests: ["legacy_request_id", "legacy_team_id", "current_name", "requested_name", "current_country", "requested_country", "current_city", "requested_city", "requested_by_username", "reason", "status", "admin_note", "reviewed_by_username", "reviewed_at", "created_at", "updated_at"],
    team_members: ["legacy_team_member_id", "legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "captain_username", "player_username", "player_display_name", "player_email", "player_phone", "player_country", "legacy_source_interest_id", "member_status", "confirmed_by_username", "confirmed_at", "created_at", "updated_at"],
    team_membership_requests: ["legacy_request_id", "legacy_club_team_id", "club_team_name", "player_username", "player_display_name", "player_email", "player_phone", "player_country", "legacy_player_profile_id", "status", "requested_at", "reviewed_by_username", "reviewed_at", "review_note", "created_at", "updated_at"],
    team_needs: ["legacy_need_id", "legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "captain_username", "need_type", "need_text", "needed_count", "status", "visibility", "is_published", "need_context", "legacy_tournament_id", "tournament_name", "squad_label", "class_name", "deadline_at", "source_type", "published_at", "public_visible", "approved", "created_at", "updated_at"],
    team_need_interests: ["legacy_interest_id", "legacy_need_id", "legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "player_username", "player_display_name", "player_email", "player_phone", "player_country", "message", "status", "reviewed_by_username", "reviewed_at", "created_at", "updated_at"],
    tournaments: ["legacy_tournament_id", "name", "country", "city", "start_date", "end_date", "registration_deadline", "visibility", "status", "organizer_username", "public_code", "published", "published_at", "tournament_json", "created_at", "updated_at"],
    tournament_events: ["legacy_plan_id", "legacy_tournament_id", "tournament_name", "legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "captain_username", "squad_label", "class_name", "status", "deadline_at", "note", "created_at", "updated_at"],
    tournament_availability: ["legacy_availability_id", "legacy_plan_id", "legacy_tournament_id", "tournament_name", "legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "player_username", "player_display_name", "player_email", "player_phone", "player_country", "response_status", "preferred_squad", "player_note", "requested_by_username", "requested_at", "responded_at", "created_at", "updated_at"],
    tournament_squad_planning: ["legacy_planning_id", "legacy_plan_id", "legacy_tournament_id", "tournament_name", "legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "player_username", "player_display_name", "player_country", "availability_status", "preferred_squad", "assigned_squad", "planning_status", "assigned_by_username", "assigned_at", "created_at", "updated_at"],
    roster_drafts: ["legacy_roster_id", "legacy_plan_id", "legacy_tournament_id", "tournament_name", "legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "squad_label", "captain_username", "roster_status", "submitted_by_username", "submitted_at", "reviewed_by_username", "reviewed_at", "admin_note", "locked_at", "locked_by_username", "lock_reason", "created_at", "updated_at"],
    roster_players: ["legacy_roster_player_id", "legacy_roster_id", "legacy_plan_id", "legacy_tournament_id", "tournament_name", "legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "squad_label", "player_username", "player_display_name", "player_country", "assigned_squad", "roster_role", "source", "player_status", "added_by_username", "added_at", "created_at", "updated_at"],
    official_rosters: ["legacy_official_roster_id", "legacy_draft_id", "legacy_tournament_id", "tournament_name", "legacy_team_id", "team_name", "squad_label", "group_name", "player_username", "player_display_name", "player_country", "status", "locked_at", "locked_by_username", "created_at", "updated_at"],
    event_comments: ["legacy_comment_id", "legacy_plan_id", "legacy_team_profile_id", "legacy_club_team_id", "club_team_name", "username", "display_name", "message", "active", "created_at", "updated_at"],
    team_builder_players: ["legacy_player_id", "owner_username", "owner_display_name", "active", "name", "skill", "cannot_play_with", "club", "notes", "metadata", "created_at", "updated_at"],
    team_builder_saved_teams: ["legacy_saved_team_id", "owner_username", "label", "teams_json", "created_at", "updated_at"],
    audit_log: ["actor_username", "action", "entity_table", "legacy_entity_id", "metadata", "created_at", "updated_at"]
  };
}

function supabaseNormalizeRowsForWrite_(tableName, rows) {
  var columns = supabaseTableWriteColumns_()[tableName];
  if (!columns) return rows || [];
  rows = rows || [];
  var present = {};
  rows.forEach(function(row) {
    columns.forEach(function(column) {
      if (row && Object.prototype.hasOwnProperty.call(row, column) && row[column] !== undefined) {
        present[column] = true;
      }
    });
  });
  var presentColumns = columns.filter(function(column) { return present[column]; });
  return rows.map(function(row) {
    var normalized = {};
    presentColumns.forEach(function(column) {
      normalized[column] = row && row[column] !== undefined ? row[column] : null;
    });
    return normalized;
  });
}

function supabaseNormalizePatchForWrite_(tableName, patch) {
  var columns = supabaseTableWriteColumns_()[tableName];
  if (!columns || !patch) return patch || {};
  var normalized = {};
  columns.forEach(function(column) {
    if (Object.prototype.hasOwnProperty.call(patch, column) && patch[column] !== undefined) {
      normalized[column] = patch[column];
    }
  });
  return normalized;
}

function supabaseLooksLikeFilter_(value) {
  var keys = Object.keys(value || {});
  if (!keys.length) return false;
  return keys.every(function(key) {
    return (
      key === "id" ||
      key === "username" ||
      key === "legacy_request_id" ||
      key === "legacy_profile_id" ||
      key === "legacy_team_id" ||
      key === "legacy_team_profile_id" ||
      key === "legacy_club_team_id" ||
      key === "legacy_tournament_id" ||
      key === "legacy_source_interest_id" ||
      key === "legacy_team_member_id" ||
      key === "legacy_member_id" ||
      key === "legacy_need_id" ||
      key === "legacy_interest_id" ||
      key === "legacy_plan_id" ||
      key === "legacy_availability_id" ||
      key === "legacy_planning_id" ||
      key === "legacy_roster_id" ||
      key === "legacy_roster_player_id" ||
      key === "legacy_draft_id" ||
      key === "legacy_official_roster_id" ||
      key === "legacy_player_id" ||
      key === "legacy_saved_team_id" ||
      key === "owner_username" ||
      key === "name"
    );
  });
}

function supabasePatchRows_(config, tableName, filters, patch) {
  if (!supabaseLooksLikeFilter_(filters) && supabaseLooksLikeFilter_(patch)) {
    var tmp = filters;
    filters = patch;
    patch = tmp;
  }
  var parts = ["select=" + encodeURIComponent("*")];
  Object.keys(filters || {}).forEach(function (key) {
    parts.push(supabaseFilter_(key, filters[key]));
  });
  var writePatch = supabaseNormalizePatchForWrite_(tableName, patch || {});
  var rows = supabaseApiRequest_(
    config,
    tableName,
    "patch",
    parts.join("&"),
    writePatch,
    "return=representation"
  );
  return Array.isArray(rows) ? rows : [];
}

function supabaseUpsertRows_(config, tableName, rows, conflictTarget) {
  var query = conflictTarget
    ? "on_conflict=" + encodeURIComponent(conflictTarget)
    : "";
  var result = supabaseApiRequest_(
    config,
    tableName,
    "post",
    query,
    supabaseNormalizeRowsForWrite_(tableName, rows || []),
    "resolution=merge-duplicates,return=representation"
  );
  return Array.isArray(result) ? result : [];
}

function supabaseInsertRows_(config, tableName, rows) {
  var result = supabaseApiRequest_(
    config,
    tableName,
    "post",
    "",
    supabaseNormalizeRowsForWrite_(tableName, rows || []),
    "return=representation"
  );
  return Array.isArray(result) ? result : [];
}

function supabaseDeleteRows_(config, tableName, filters) {
  var parts = ["select=" + encodeURIComponent("*")];
  Object.keys(filters || {}).forEach(function (key) {
    parts.push(supabaseFilter_(key, filters[key]));
  });
  var result = supabaseApiRequest_(
    config,
    tableName,
    "delete",
    parts.join("&"),
    null,
    "return=representation"
  );
  return Array.isArray(result) ? result : [];
}

function supabaseDbText_(value) {
  if (value === undefined || value === null) return null;
  var text = String(value).trim();
  return text ? text : null;
}

function supabaseAuthContext_(data) {
  var context = resolveRequestContext(data || {});
  if (!context || !context.authenticated || !context.user) {
    return {
      success: false,
      message: "Login required"
    };
  }

  var config = getSupabaseConfig_();
  return {
    success: true,
    context: context,
    config: config,
    ctx: supabasePlayerHubContext_(config, context.user)
  };
}

function supabaseAdminContext_(data) {
  var adminCheck = requireAdmin(data || {});
  if (!adminCheck.success) {
    return {
      success: false,
      message: adminCheck.message
    };
  }
  var config = getSupabaseConfig_();
  return {
    success: true,
    context: { authenticated: true, user: adminCheck.admin },
    config: config,
    ctx: supabasePlayerHubContext_(config, adminCheck.admin)
  };
}

function supabaseReviewerContext_(data) {
  var reviewerCheck = requireRosterReviewer_(data || {});
  if (!reviewerCheck.success) {
    return {
      success: false,
      message: reviewerCheck.message
    };
  }
  var config = getSupabaseConfig_();
  return {
    success: true,
    context: { authenticated: true, user: reviewerCheck.user },
    config: config,
    ctx: supabasePlayerHubContext_(config, reviewerCheck.user)
  };
}

function supabaseCaptainSnapshotForUser_(ctx, user) {
  return playerHubCaptainSnapshot_(
    ctx,
    user,
    playerHubSnapshotProfile_(ctx, user)
  );
}

function supabaseRequireCaptainSnapshot_(env) {
  var captain = supabaseCaptainSnapshotForUser_(env.ctx, env.context.user);
  if (!captain || !captain.canManageTeamProfile || !captain.teamProfile) {
    return {
      success: false,
      message: captain && captain.message ? captain.message : "Captain access required."
    };
  }
  return {
    success: true,
    captain: captain
  };
}

function supabasePlanForCaptain_(env, planId) {
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var targetPlanId = String(planId || "").trim();
  var plans = captainCheck.captain.tournamentPlans || [];
  for (var i = 0; i < plans.length; i++) {
    if (plans[i] && plans[i].planId === targetPlanId) {
      return {
        success: true,
        captain: captainCheck.captain,
        plan: plans[i]
      };
    }
  }
  return {
    success: false,
    message: "Captain access required."
  };
}

function supabaseAvailabilityForPlan_(ctx, planId) {
  var targetPlanId = String(planId || "").trim();
  return playerHubSnapshotSortRecent_(
    playerHubSnapshotTournamentAvailability_(ctx)
      .filter(function (availability) {
        return availability && availability.planId === targetPlanId;
      })
      .map(function (availability) {
        return playerHubSnapshotEnrichAvailability_(ctx, availability);
      })
  );
}

function supabasePlanningForPlan_(ctx, planId) {
  var targetPlanId = String(planId || "").trim();
  return playerHubSnapshotSortRecent_(
    playerHubSnapshotSquadPlanning_(ctx).filter(function (planning) {
      return planning && planning.planId === targetPlanId;
    })
  );
}

function supabaseRosterPayloadForPlan_(ctx, plan) {
  var roster = null;
  playerHubSnapshotRosters_(ctx).forEach(function (item) {
    if (!roster && item && item.planId === plan.planId) roster = item;
  });
  return {
    success: true,
    plan: playerHubSnapshotDecoratePlan_(ctx, plan),
    roster: roster ? playerHubSnapshotDecorateRoster_(ctx, roster) : null,
    players: roster
      ? (playerHubSnapshotRosterPlayersByRoster_(ctx)[roster.rosterId] || [])
          .filter(function (player) {
            return player && player.playerStatus === "ACTIVE";
          })
      : []
  };
}

function supabaseGetMyPlayerProfile_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    profile: playerHubSnapshotProfile_(env.ctx, env.context.user)
  };
}

function supabaseListClubTeams_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    teams: sortClubTeams_(
      playerHubSnapshotClubs_(env.ctx).filter(function (team) {
        return team && team.teamId && team.name && team.active;
      })
    )
  };
}

function supabaseListClubTeamsAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    teams: sortClubTeams_(
      playerHubSnapshotClubs_(env.ctx).filter(function (team) {
        return team && team.teamId && team.name;
      })
    )
  };
}

function supabaseListVisibleTeamNeeds_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    needs: playerHubSnapshotVisibleTeamNeeds_(
      env.ctx,
      playerHubUsername_(env.context.user)
    )
  };
}

function supabaseListMyAccessRequests_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    requests: playerHubSnapshotAccessRequestsForUser_(
      env.ctx,
      playerHubUsername_(env.context.user)
    )
  };
}

function supabaseListAccessRequestsAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    requests: sortAccessRequests_(
      addAccessRequestAdminWarnings_(playerHubSnapshotAccessRequests_(env.ctx))
    )
  };
}

function supabaseGetMyTeamProfile_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captain = supabaseCaptainSnapshotForUser_(env.ctx, env.context.user);
  return Object.assign({ success: true }, captain);
}

function supabaseListMyTeamNeedInterests_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    interests: playerHubSnapshotMyTeamNeedInterests_(
      env.ctx,
      playerHubUsername_(env.context.user)
    )
  };
}

function supabaseListTeamNeedInterestsForCaptain_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var requestedNeedId = String(data && data.needId || "").trim();
  var interests = captainCheck.captain.interests || [];
  if (requestedNeedId) {
    var ownsNeed = (captainCheck.captain.needs || []).some(function (need) {
      return need && need.needId === requestedNeedId;
    });
    if (!ownsNeed) {
      return {
        success: false,
        message: "Captain access required."
      };
    }
    interests = interests.filter(function (interest) {
      return interest && interest.needId === requestedNeedId;
    });
  }
  return {
    success: true,
    interests: interests
  };
}

function supabaseListTeamNeedInterestsAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    interests: playerHubSnapshotTeamNeedInterests_(env.ctx).map(function (interest) {
      return playerHubSnapshotEnrichTeamNeedInterest_(env.ctx, interest);
    })
  };
}

function supabaseListMyTeamMembersForCaptain_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  return {
    success: true,
    members: captainCheck.captain.members || []
  };
}

function supabaseListMyConfirmedTeamsForPlayer_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    teams: playerHubSnapshotMyTeams_(env.ctx, playerHubUsername_(env.context.user))
  };
}

function supabaseListTeamMembersAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    members: playerHubSnapshotSortRecent_(
      playerHubSnapshotTeamMembers_(env.ctx).map(function (member) {
        return playerHubSnapshotEnrichTeamMember_(env.ctx, member);
      })
    )
  };
}

function supabaseListMyTeamMembershipRequests_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    requests: playerHubSnapshotMembershipRequestsForPlayer_(
      env.ctx,
      playerHubUsername_(env.context.user)
    )
  };
}

function supabaseListMembershipRequestsForCaptain_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  return {
    success: true,
    requests: captainCheck.captain.membershipRequests || []
  };
}

function supabaseListTeamMembershipRequestsAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    requests: sortTeamMembershipRequests_(
      playerHubSnapshotMembershipRequests_(env.ctx).map(function (request) {
        return playerHubSnapshotEnrichMembershipRequest_(env.ctx, request);
      })
    )
  };
}

function supabaseListMyTournamentTeamPlansForCaptain_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  return {
    success: true,
    plans: captainCheck.captain.tournamentPlans || []
  };
}

function supabaseListMyTournamentAvailabilityForPlayer_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    availability: playerHubSnapshotTournamentAvailabilityForPlayer_(
      env.ctx,
      playerHubUsername_(env.context.user)
    )
  };
}

function supabaseListMyTournamentSquadPlanningForPlayer_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    planning: playerHubSnapshotPlannedTeamsForPlayer_(
      env.ctx,
      playerHubUsername_(env.context.user)
    )
  };
}

function supabaseListTournamentAvailabilityForCaptain_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var planCheck = supabasePlanForCaptain_(env, data && data.planId);
  if (!planCheck.success) return planCheck;
  return {
    success: true,
    availability: supabaseAvailabilityForPlan_(env.ctx, planCheck.plan.planId),
    plan: playerHubSnapshotDecoratePlan_(env.ctx, planCheck.plan)
  };
}

function supabaseListTournamentSquadPlanningForCaptain_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var planCheck = supabasePlanForCaptain_(env, data && data.planId);
  if (!planCheck.success) return planCheck;
  return {
    success: true,
    plan: playerHubSnapshotDecoratePlan_(env.ctx, planCheck.plan),
    availability: supabaseAvailabilityForPlan_(env.ctx, planCheck.plan.planId),
    planning: supabasePlanningForPlan_(env.ctx, planCheck.plan.planId)
  };
}

function supabaseListRosterDraftForCaptain_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var planCheck = supabasePlanForCaptain_(env, data && data.planId);
  if (!planCheck.success) return planCheck;
  return supabaseRosterPayloadForPlan_(env.ctx, planCheck.plan);
}

function supabaseListMyRosterStatusForPlayer_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  return {
    success: true,
    rosters: playerHubSnapshotRosterStatusForPlayer_(
      env.ctx,
      playerHubUsername_(env.context.user)
    )
  };
}

function supabaseListSubmittedRosterDraftsForReview_(data) {
  var env = supabaseReviewerContext_(data);
  if (!env.success) return env;
  var reviewStatuses = {
    SUBMITTED: true,
    APPROVED: true,
    REJECTED: true,
    LOCKED: true
  };
  return {
    success: true,
    rosters: playerHubSnapshotSortRecent_(
      playerHubSnapshotRosters_(env.ctx)
        .filter(function (roster) {
          return roster && !!reviewStatuses[roster.rosterStatus];
        })
        .map(function (roster) {
          return playerHubSnapshotDecorateRoster_(env.ctx, roster);
        })
    )
  };
}

function supabaseProfileRowFromProfile_(profile) {
  return {
    legacy_profile_id: supabaseDbText_(profile.profileId),
    user_id: null,
    username: supabaseDbText_(profile.username),
    first_name: supabaseDbText_(profile.firstName),
    last_name: supabaseDbText_(profile.lastName),
    display_name: supabaseDbText_(profile.displayName || profile.username),
    email: supabaseDbText_(profile.email),
    phone: supabaseDbText_(profile.phone),
    country: supabaseDbText_(profile.country),
    region: supabaseDbText_(profile.region),
    club_team_id: null,
    legacy_club_team_id: supabaseDbText_(profile.clubTeamId),
    club_team_name: supabaseDbText_(profile.clubTeamName),
    club_or_team: supabaseDbText_(profile.clubOrTeam),
    team_note: supabaseDbText_(profile.teamNote),
    profile_type: supabaseDbText_(profile.profileType || "Player"),
    free_agent: !!profile.freeAgent,
    primary_role: supabaseDbText_(profile.primaryRole),
    secondary_role: supabaseDbText_(profile.secondaryRole),
    custom_role: supabaseDbText_(profile.customRole),
    level: supabaseDbText_(profile.level),
    availability: supabaseDbText_(profile.availability),
    looking_for_team: !!profile.lookingForTeam,
    available_as_substitute: !!profile.availableAsSubstitute,
    can_guest_for_teams: !!profile.canGuestForTeams,
    interested_abroad: !!profile.interestedAbroad,
    public_visible: !!profile.publicVisible,
    approved: !!profile.approved,
    created_at: supabaseDbText_(profile.createdAt),
    updated_at: supabaseDbText_(profile.updatedAt)
  };
}

function supabaseMembershipRequestRowFromRequest_(request) {
  return {
    legacy_request_id: supabaseDbText_(request.requestId),
    club_team_id: null,
    legacy_club_team_id: supabaseDbText_(request.clubTeamId),
    club_team_name: supabaseDbText_(request.clubTeamName),
    player_user_id: null,
    player_username: supabaseDbText_(request.playerUsername),
    player_display_name: supabaseDbText_(request.playerDisplayName),
    player_email: supabaseDbText_(request.playerEmail),
    player_phone: supabaseDbText_(request.playerPhone),
    player_country: supabaseDbText_(request.playerCountry),
    player_profile_id: null,
    legacy_player_profile_id: supabaseDbText_(request.playerProfileId),
    status: supabaseDbText_(request.status || "PENDING"),
    requested_at: supabaseDbText_(request.requestedAt),
    reviewed_by_user_id: null,
    reviewed_by_username: supabaseDbText_(request.reviewedBy),
    reviewed_at: supabaseDbText_(request.reviewedAt),
    review_note: supabaseDbText_(request.reviewNote),
    created_at: supabaseDbText_(request.createdAt),
    updated_at: supabaseDbText_(request.updatedAt)
  };
}

function buildSupabasePlayerProfileForSave_(incoming, existingProfile, user, ctx) {
  var now = new Date().toISOString();
  var safeIncoming = incoming && typeof incoming === "object" ? incoming : {};
  var existing = existingProfile || defaultPlayerProfileForUser_(user);
  var selectedClubTeamId = String(safeIncoming.clubTeamId || "").trim();
  var selectedClubTeam = selectedClubTeamId
    ? playerHubSnapshotClubsById_(ctx)[selectedClubTeamId]
    : null;
  var freeAgent = truthy_(safeIncoming.freeAgent);
  if (!selectedClubTeam || freeAgent) {
    selectedClubTeamId = "";
    selectedClubTeam = null;
  }

  var teamNote = playerProfileText_(
    firstNonEmpty_(safeIncoming.teamNote, safeIncoming.clubOrTeam),
    160
  );
  var firstName = playerProfileText_(
    firstNonEmpty_(safeIncoming.firstName, existing.firstName),
    80
  );
  var lastName = playerProfileText_(
    firstNonEmpty_(safeIncoming.lastName, existing.lastName),
    80
  );
  var displayName = playerProfileText_(
    firstNonEmpty_(
      safeIncoming.displayName,
      [firstName, lastName].filter(Boolean).join(" "),
      existing.displayName,
      playerHubUsername_(user)
    ),
    120
  );

  return {
    profileId: existing.profileId || "profile-" + Utilities.getUuid(),
    username: playerHubUsername_(user),
    firstName: firstName,
    lastName: lastName,
    displayName: displayName,
    email: playerProfileText_(safeIncoming.email, 160),
    phone: playerProfileText_(safeIncoming.phone, 80),
    country: playerProfileText_(
      firstNonEmpty_(safeIncoming.country, safeIncoming.region, existing.country),
      120
    ),
    clubOrTeam: selectedClubTeam ? selectedClubTeam.name : teamNote,
    clubTeamId: selectedClubTeam ? selectedClubTeam.teamId : "",
    clubTeamName: selectedClubTeam ? selectedClubTeam.name : "",
    teamNote: teamNote,
    profileType:
      String(safeIncoming.profileType || "").trim() === "Captain"
        ? "Captain"
        : "Player",
    freeAgent: freeAgent || !selectedClubTeam,
    region: playerProfileText_(
      firstNonEmpty_(safeIncoming.region, existing.region),
      120
    ),
    primaryRole: playerProfileText_(
      firstNonEmpty_(safeIncoming.primaryRole, existing.primaryRole),
      80
    ),
    secondaryRole: playerProfileText_(
      firstNonEmpty_(safeIncoming.secondaryRole, existing.secondaryRole),
      120
    ),
    customRole: playerProfileText_(
      firstNonEmpty_(
        safeIncoming.customRole,
        safeIncoming.primaryRole === "Custom" ? safeIncoming.secondaryRole : "",
        existing.customRole
      ),
      120
    ),
    level: playerProfileText_(firstNonEmpty_(safeIncoming.level, existing.level), 80),
    availability: playerProfileText_(safeIncoming.availability, 240),
    lookingForTeam: truthy_(safeIncoming.lookingForTeam),
    availableAsSubstitute: truthy_(safeIncoming.availableAsSubstitute),
    canGuestForTeams: truthy_(safeIncoming.canGuestForTeams),
    interestedAbroad: truthy_(safeIncoming.interestedAbroad),
    publicVisible: truthy_(safeIncoming.publicVisible),
    approved: !!existing.approved,
    createdAt: existing.createdAt || now,
    updatedAt: now
  };
}

function supabaseCancelPendingMembershipRequests_(config, ctx, username, exceptClubTeamId) {
  var targetUsername = playerHubSnapshotUsernameKey_(username);
  var keepClubTeamId = String(exceptClubTeamId || "").trim();
  var now = new Date().toISOString();
  playerHubSnapshotMembershipRequests_(ctx).forEach(function (request) {
    if (
      request &&
      request.status === "PENDING" &&
      playerHubSnapshotUsernameKey_(request.playerUsername) === targetUsername &&
      request.clubTeamId !== keepClubTeamId
    ) {
      supabasePatchRows_(
        config,
        "team_membership_requests",
        { legacy_request_id: request.requestId },
        { status: "CANCELLED", updated_at: now }
      );
      request.status = "CANCELLED";
      request.updatedAt = now;
    }
  });
}

function supabaseSyncTeamMembershipRequestForProfile_(config, ctx, user, profile) {
  var username = playerHubUsername_(user);
  var selectedClubTeamId = String((profile && profile.clubTeamId) || "").trim();
  if (!profile || profile.freeAgent || !selectedClubTeamId) {
    supabaseCancelPendingMembershipRequests_(config, ctx, username, "");
    return null;
  }

  var selectedTeam = playerHubSnapshotClubsById_(ctx)[selectedClubTeamId];
  if (!selectedTeam || !selectedTeam.active) {
    supabaseCancelPendingMembershipRequests_(config, ctx, username, "");
    return null;
  }

  supabaseCancelPendingMembershipRequests_(config, ctx, username, selectedTeam.teamId);

  var existingPending = null;
  playerHubSnapshotMembershipRequests_(ctx).forEach(function (request) {
    if (
      !existingPending &&
      request &&
      request.status === "PENDING" &&
      request.clubTeamId === selectedTeam.teamId &&
      playerHubSnapshotUsernameKey_(request.playerUsername) ===
        playerHubSnapshotUsernameKey_(username)
    ) {
      existingPending = request;
    }
  });

  if (
    playerHubSnapshotActiveMemberExists_(ctx, selectedTeam.teamId, username)
  ) {
    if (!existingPending) return null;
    existingPending.status = "APPROVED";
    existingPending.reviewedBy = existingPending.reviewedBy || "system";
    existingPending.reviewedAt =
      existingPending.reviewedAt || new Date().toISOString();
    existingPending.updatedAt = new Date().toISOString();
    supabaseUpsertRows_(
      config,
      "team_membership_requests",
      [supabaseMembershipRequestRowFromRequest_(existingPending)],
      "legacy_request_id"
    );
    return playerHubSnapshotEnrichMembershipRequest_(ctx, existingPending);
  }

  var now = new Date().toISOString();
  var request = {
    requestId:
      (existingPending && existingPending.requestId) ||
      "team-membership-" + Utilities.getUuid(),
    clubTeamId: selectedTeam.teamId,
    clubTeamName: selectedTeam.name,
    playerUsername: profile.username || username,
    playerDisplayName: playerProfileText_(profile.displayName, 120),
    playerEmail: playerProfileText_(profile.email, 160),
    playerPhone: playerProfileText_(profile.phone, 80),
    playerCountry: playerProfileText_(profile.country, 120),
    playerProfileId: profile.profileId || "",
    status: "PENDING",
    requestedAt:
      existingPending && existingPending.requestedAt
        ? existingPending.requestedAt
        : now,
    reviewedBy: "",
    reviewedAt: "",
    reviewNote: "",
    createdAt:
      existingPending && existingPending.createdAt ? existingPending.createdAt : now,
    updatedAt: now
  };
  supabaseUpsertRows_(
    config,
    "team_membership_requests",
    [supabaseMembershipRequestRowFromRequest_(request)],
    "legacy_request_id"
  );
  return playerHubSnapshotEnrichMembershipRequest_(ctx, request);
}

function supabaseSaveMyPlayerProfile_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var existing = playerHubSnapshotProfile_(env.ctx, env.context.user);
  var profile = buildSupabasePlayerProfileForSave_(
    data && data.profile ? data.profile : {},
    existing,
    env.context.user,
    env.ctx
  );
  var rows = supabaseUpsertRows_(
    env.config,
    "player_profiles",
    [supabaseProfileRowFromProfile_(profile)],
    "legacy_profile_id"
  );
  var savedProfile = rows && rows[0]
    ? supabaseProfile_(rows[0], env.context.user)
    : profile;
  var membershipRequest = supabaseSyncTeamMembershipRequestForProfile_(
    env.config,
    env.ctx,
    env.context.user,
    savedProfile
  );
  return {
    success: true,
    profile: savedProfile,
    membershipRequest: membershipRequest
  };
}

function supabaseAccessRequestRowFromRequest_(request) {
  return {
    legacy_request_id: supabaseDbText_(request.requestId),
    user_id: null,
    username: supabaseDbText_(request.username),
    display_name: supabaseDbText_(request.displayName),
    email: supabaseDbText_(request.email),
    request_type: supabaseDbText_(request.requestType),
    club_team_id: null,
    legacy_club_team_id: supabaseDbText_(request.clubTeamId),
    club_team_name: supabaseDbText_(request.clubTeamName),
    message: supabaseDbText_(request.message),
    status: supabaseDbText_(request.status || "PENDING"),
    admin_note: supabaseDbText_(request.adminNote),
    reviewed_by_user_id: null,
    reviewed_by_username: supabaseDbText_(request.reviewedBy),
    reviewed_at: supabaseDbText_(request.reviewedAt),
    created_at: supabaseDbText_(request.createdAt),
    updated_at: supabaseDbText_(request.updatedAt)
  };
}

function supabaseCreateAccessRequest_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var requestType = normalizeAccessRequestType_(data && data.requestType);
  if (!requestType) {
    return {
      success: false,
      message: "Invalid access request type"
    };
  }

  var username = playerHubUsername_(env.context.user);
  var hasPending = playerHubSnapshotAccessRequests_(env.ctx).some(function (request) {
    return (
      request &&
      request.requestType === requestType &&
      request.status === "PENDING" &&
      playerHubSnapshotUsernameKey_(request.username) ===
        playerHubSnapshotUsernameKey_(username)
    );
  });
  if (hasPending) {
    return {
      success: false,
      message: "You already have a pending request for this access."
    };
  }

  var profile = playerHubSnapshotProfile_(env.ctx, env.context.user);
  var clubTeamId = playerProfileText_(
    firstNonEmpty_(data && data.clubTeamId, profile.clubTeamId),
    120
  );
  var club = clubTeamId ? playerHubSnapshotClubsById_(env.ctx)[clubTeamId] : null;
  var now = new Date().toISOString();
  var requestPayload = {
    requestId: "access-" + Utilities.getUuid(),
    username: username,
    displayName: playerProfileText_(profile.displayName || username, 120),
    email: playerProfileText_(profile.email || username, 160),
    requestType: requestType,
    clubTeamId: club ? club.teamId : "",
    clubTeamName: club ? club.name : playerProfileText_(profile.clubTeamName, 160),
    message: playerProfileText_(data && data.message, 500),
    status: "PENDING",
    adminNote: "",
    createdAt: now,
    updatedAt: now,
    reviewedBy: "",
    reviewedAt: ""
  };
  var rows = supabaseUpsertRows_(
    env.config,
    "access_requests",
    [supabaseAccessRequestRowFromRequest_(requestPayload)],
    "legacy_request_id"
  );
  return {
    success: true,
    request: rows && rows[0] ? supabaseAccessRequest_(rows[0]) : requestPayload
  };
}

function supabaseUpdateTournamentAvailabilityResponse_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var availabilityId = String(data && data.availabilityId || "").trim();
  var availability = null;
  playerHubSnapshotTournamentAvailability_(env.ctx).forEach(function (item) {
    if (!availability && item && item.availabilityId === availabilityId) {
      availability = item;
    }
  });
  if (
    !availability ||
    playerHubSnapshotUsernameKey_(availability.playerUsername) !==
      playerHubSnapshotUsernameKey_(playerHubUsername_(env.context.user))
  ) {
    return {
      success: false,
      message: "Availability request not found"
    };
  }

  var now = new Date().toISOString();
  var rows = supabasePatchRows_(
    env.config,
    "tournament_availability",
    { legacy_availability_id: availability.availabilityId },
    {
      response_status: normalizeTournamentAvailabilityStatus_(
        data && data.responseStatus
      ),
      preferred_squad: normalizePreferredSquad_(data && data.preferredSquad),
      player_note: supabaseDbText_(playerProfileText_(data && data.playerNote, 300)),
      responded_at: now,
      updated_at: now
    }
  );
  var updated = rows && rows[0]
    ? supabaseTournamentAvailability_(rows[0])
    : Object.assign({}, availability, {
        responseStatus: normalizeTournamentAvailabilityStatus_(
          data && data.responseStatus
        ),
        preferredSquad: normalizePreferredSquad_(data && data.preferredSquad),
        playerNote: playerProfileText_(data && data.playerNote, 300),
        respondedAt: now,
        updatedAt: now
      });
  return {
    success: true,
    availability: playerHubSnapshotEnrichAvailability_(env.ctx, updated)
  };
}

function supabaseEventComment_(row) {
  return {
    commentId: supabaseText_(row.legacy_comment_id),
    planId: supabaseText_(row.legacy_plan_id),
    teamProfileId: supabaseText_(row.legacy_team_profile_id),
    clubTeamId: supabaseText_(row.legacy_club_team_id),
    clubTeamName: supabaseText_(row.club_team_name),
    username: supabaseText_(row.username),
    displayName: supabaseText_(row.display_name),
    message: supabaseText_(row.message),
    createdAt: supabaseText_(row.created_at),
    updatedAt: supabaseText_(row.updated_at),
    active: supabaseBool_(row.active, true)
  };
}

function supabaseCommentsForPlan_(config, planId) {
  return supabaseSelectRows_(
    config,
    "event_comments",
    { legacy_plan_id: planId, active: true },
    "*"
  )
    .map(supabaseEventComment_)
    .sort(function (a, b) {
      return (Date.parse(a.createdAt || "") || 0) - (Date.parse(b.createdAt || "") || 0);
    });
}

function supabaseTournamentPlanCommentContext_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var planId = String(data && (data.planId || data.eventId) || "").trim();
  var plan = playerHubSnapshotPlansById_(env.ctx)[planId];
  if (!plan) {
    return {
      success: false,
      message: "Event not found"
    };
  }

  var username = playerHubUsername_(env.context.user);
  var invited = playerHubSnapshotTournamentAvailability_(env.ctx).some(function (item) {
    return (
      item &&
      item.planId === plan.planId &&
      playerHubSnapshotUsernameKey_(item.playerUsername) ===
        playerHubSnapshotUsernameKey_(username)
    );
  });
  var canAccess =
    isAdminUser_(env.context.user) ||
    userCanUseTournaments_(env.context.user) ||
    (playerHubSnapshotUsernameKey_(plan.captainUsername) ===
      playerHubSnapshotUsernameKey_(username) &&
      playerHubSnapshotHasCaptainApproval_(
        env.ctx,
        username,
        plan.clubTeamId,
        plan.clubTeamName
      )) ||
    invited;

  if (!canAccess) {
    return {
      success: false,
      message: "Event access required"
    };
  }

  return Object.assign({}, env, {
    plan: plan,
    username: username
  });
}

function supabaseListEventComments_(data) {
  var eventContext = supabaseTournamentPlanCommentContext_(data || {});
  if (!eventContext.success) return eventContext;
  return {
    success: true,
    comments: supabaseCommentsForPlan_(
      eventContext.config,
      eventContext.plan.planId
    )
  };
}

function supabaseEventCommentRowFromComment_(comment) {
  return {
    legacy_comment_id: supabaseDbText_(comment.commentId),
    event_id: null,
    legacy_plan_id: supabaseDbText_(comment.planId),
    team_profile_id: null,
    legacy_team_profile_id: supabaseDbText_(comment.teamProfileId),
    club_team_id: null,
    legacy_club_team_id: supabaseDbText_(comment.clubTeamId),
    club_team_name: supabaseDbText_(comment.clubTeamName),
    user_id: null,
    username: supabaseDbText_(comment.username),
    display_name: supabaseDbText_(comment.displayName),
    message: supabaseDbText_(comment.message),
    active: comment.active !== false,
    created_at: supabaseDbText_(comment.createdAt),
    updated_at: supabaseDbText_(comment.updatedAt)
  };
}

function supabaseAddEventComment_(data) {
  var eventContext = supabaseTournamentPlanCommentContext_(data || {});
  if (!eventContext.success) return eventContext;

  var message = playerProfileText_(data && data.message, 500);
  if (!message) {
    return {
      success: false,
      message: "Comment cannot be empty"
    };
  }

  var profile = playerHubSnapshotProfile_(eventContext.ctx, eventContext.context.user);
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
  var rows = supabaseInsertRows_(
    eventContext.config,
    "event_comments",
    [supabaseEventCommentRowFromComment_(comment)]
  );
  return {
    success: true,
    comment: rows && rows[0] ? supabaseEventComment_(rows[0]) : comment,
    comments: supabaseCommentsForPlan_(eventContext.config, eventContext.plan.planId)
  };
}

function supabaseArchiveEventComment_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var commentId = String(data && data.commentId || "").trim();
  var rows = supabaseSelectRows_(
    env.config,
    "event_comments",
    { legacy_comment_id: commentId },
    "*"
  );
  var comment = rows && rows[0] ? supabaseEventComment_(rows[0]) : null;
  if (!comment) {
    return {
      success: false,
      message: "Comment not found"
    };
  }
  var plan = playerHubSnapshotPlansById_(env.ctx)[comment.planId];
  var usernameKey = playerHubSnapshotUsernameKey_(playerHubUsername_(env.context.user));
  var canArchive =
    usernameKey === playerHubSnapshotUsernameKey_(comment.username) ||
    isAdminUser_(env.context.user) ||
    userCanUseTournaments_(env.context.user) ||
    (plan &&
      playerHubSnapshotUsernameKey_(plan.captainUsername) === usernameKey &&
      playerHubSnapshotHasCaptainApproval_(
        env.ctx,
        playerHubUsername_(env.context.user),
        plan.clubTeamId,
        plan.clubTeamName
      ));
  if (!canArchive) {
    return {
      success: false,
      message: "Comment access required"
    };
  }
  var now = new Date().toISOString();
  var updatedRows = supabasePatchRows_(
    env.config,
    "event_comments",
    { legacy_comment_id: comment.commentId },
    { active: false, updated_at: now }
  );
  var updated = updatedRows && updatedRows[0]
    ? supabaseEventComment_(updatedRows[0])
    : Object.assign({}, comment, { active: false, updatedAt: now });
  return {
    success: true,
    comment: updated,
    comments: supabaseCommentsForPlan_(env.config, comment.planId)
  };
}

function nowIso_() {
  return new Date().toISOString();
}

function supabaseReloadEnv_(env) {
  return {
    success: true,
    config: env.config,
    context: env.context,
    ctx: supabasePlayerHubContext_(env.config, env.context.user)
  };
}

function supabaseAuditLog_(config, username, action, entityType, legacyId, metadata) {
  try {
    supabaseInsertRows_(config, "audit_log", [{
      legacy_audit_id: "audit-" + Utilities.getUuid(),
      actor_username: username || "",
      action: action || "",
      entity_table: entityType || "",
      legacy_entity_id: legacyId || "",
      metadata: metadata || {},
      created_at: nowIso_(),
      updated_at: nowIso_()
    }]);
  } catch (err) {
    Logger.log("[PlayerHubBackend] supabase audit skipped " + (err && err.message ? err.message : err));
  }
}

function supabaseClubTeamRowFromTeam_(team) {
  return {
    legacy_team_id: team.teamId || "",
    name: team.name || "",
    country: team.country || "",
    city: team.city || "",
    level: team.level || "",
    type: team.type || "",
    active: truthy_(team.active),
    created_at: team.createdAt || nowIso_(),
    updated_at: team.updatedAt || nowIso_()
  };
}

function supabaseTeamProfileRowFromProfile_(profile) {
  return {
    legacy_team_profile_id: profile.teamProfileId || profile.profileId || "",
    legacy_club_team_id: profile.clubTeamId || "",
    club_team_name: profile.clubTeamName || "",
    captain_username: profile.captainUsername || "",
    country: profile.country || "",
    team_level: profile.level || profile.teamLevel || "",
    team_description: profile.description || profile.teamDescription || "",
    contact_note: profile.contactNote || "",
    active: truthy_(profile.active),
    created_at: profile.createdAt || nowIso_(),
    updated_at: profile.updatedAt || nowIso_()
  };
}

function supabaseTeamChangeRequestRowFromRequest_(request) {
  return {
    legacy_request_id: request.requestId || "",
    legacy_team_id: request.teamId || "",
    current_name: request.currentName || "",
    requested_name: request.requestedName || "",
    current_country: request.currentCountry || "",
    requested_country: request.requestedCountry || "",
    current_city: request.currentCity || "",
    requested_city: request.requestedCity || "",
    requested_by_username: request.requestedByUsername || "",
    reason: request.reason || "",
    status: request.status || "PENDING",
    admin_note: request.adminNote || "",
    reviewed_at: request.reviewedAt || null,
    reviewed_by_username: request.reviewedBy || "",
    created_at: request.createdAt || nowIso_(),
    updated_at: request.updatedAt || nowIso_()
  };
}

function supabaseTeamNeedRowFromNeed_(need) {
  return {
    legacy_need_id: need.needId || "",
    legacy_team_profile_id: need.teamProfileId || "",
    legacy_club_team_id: need.clubTeamId || "",
    club_team_name: need.clubTeamName || "",
    captain_username: need.createdBy || need.captainUsername || "",
    need_type: normalizeTeamNeedType_(need.needType || need.type || "PLAYER"),
    needed_count: Math.max(1, parseInt(firstValue_(need.neededCount, need.count, 1), 10) || 1),
    need_text: firstValue_(need.needText, need.note, ""),
    status: normalizeTeamNeedStatus_(need.status || "OPEN"),
    visibility: normalizeTeamNeedVisibility_(need.visibility || "internal"),
    is_published: normalizeTeamNeedVisibility_(need.visibility || "internal") === "published",
    need_context: normalizeTeamNeedContext_(need.needContext || "general"),
    legacy_tournament_id: need.tournamentId || "",
    tournament_name: need.tournamentName || "",
    class_name: need.className || "",
    deadline_at: need.deadlineAt || "",
    source_type: normalizeTeamNeedVisibility_(need.visibility || "internal") === "published" ? "player_ad" : "team_need",
    published_at: normalizeTeamNeedVisibility_(need.visibility || "internal") === "published" ? (need.publishedAt || need.createdAt || nowIso_()) : null,
    public_visible: normalizeTeamNeedVisibility_(need.visibility || "internal") === "published",
    approved: true,
    created_at: need.createdAt || nowIso_(),
    updated_at: need.updatedAt || nowIso_()
  };
}

function supabaseTeamNeedInterestRowFromInterest_(interest) {
  return {
    legacy_interest_id: interest.interestId || "",
    legacy_need_id: interest.needId || "",
    legacy_team_profile_id: interest.teamProfileId || "",
    legacy_club_team_id: interest.clubTeamId || "",
    club_team_name: interest.clubTeamName || "",
    player_username: interest.playerUsername || "",
    player_display_name: interest.playerDisplayName || "",
    player_email: interest.playerEmail || "",
    player_phone: interest.playerPhone || "",
    player_country: interest.playerCountry || "",
    message: interest.message || "",
    status: normalizeTeamNeedInterestStatus_(interest.status || "PENDING"),
    reviewed_by_username: interest.reviewedBy || "",
    reviewed_at: interest.reviewedAt || null,
    created_at: interest.createdAt || nowIso_(),
    updated_at: interest.updatedAt || nowIso_()
  };
}

function supabaseTeamMemberRowFromMember_(member) {
  return {
    legacy_team_member_id: member.teamMemberId || "",
    legacy_team_profile_id: member.teamProfileId || "",
    legacy_club_team_id: member.clubTeamId || "",
    club_team_name: member.clubTeamName || "",
    captain_username: member.captainUsername || "",
    player_username: member.playerUsername || "",
    player_display_name: member.playerDisplayName || "",
    player_email: member.playerEmail || "",
    player_phone: member.playerPhone || "",
    player_country: member.playerCountry || "",
    legacy_source_interest_id: member.sourceInterestId || "",
    member_status: normalizeTeamMemberStatus_(member.memberStatus || "ACTIVE"),
    confirmed_by_username: member.confirmedBy || "",
    confirmed_at: member.confirmedAt || null,
    created_at: member.createdAt || nowIso_(),
    updated_at: member.updatedAt || nowIso_()
  };
}

function supabaseMembershipRequestRowFromRequest_(request) {
  return {
    legacy_request_id: request.requestId || "",
    legacy_club_team_id: request.clubTeamId || "",
    club_team_name: request.clubTeamName || "",
    player_username: request.playerUsername || "",
    player_display_name: request.playerDisplayName || "",
    player_email: request.playerEmail || "",
    player_phone: request.playerPhone || "",
    player_country: request.playerCountry || "",
    legacy_player_profile_id: request.playerProfileId || "",
    status: normalizeTeamMembershipRequestStatus_(request.status || "PENDING"),
    requested_at: request.requestedAt || request.createdAt || nowIso_(),
    reviewed_by_username: request.reviewedBy || "",
    reviewed_at: request.reviewedAt || null,
    review_note: request.reviewNote || "",
    created_at: request.createdAt || nowIso_(),
    updated_at: request.updatedAt || nowIso_()
  };
}

function supabaseTournamentPlanRowFromPlan_(plan) {
  return {
    legacy_plan_id: plan.planId || "",
    legacy_tournament_id: plan.tournamentId || "",
    tournament_name: plan.tournamentName || "",
    legacy_team_profile_id: plan.teamProfileId || "",
    legacy_club_team_id: plan.clubTeamId || "",
    club_team_name: plan.clubTeamName || "",
    captain_username: plan.captainUsername || "",
    squad_label: plan.squadLabel || "TEAM_PLANNING",
    class_name: plan.className || "",
    status: normalizeTournamentPlanStatus_(plan.planStatus || "INVITING"),
    deadline_at: plan.deadlineAt || "",
    note: plan.note || "",
    created_at: plan.createdAt || nowIso_(),
    updated_at: plan.updatedAt || nowIso_()
  };
}

function supabaseTournamentAvailabilityRowFromAvailability_(availability) {
  return {
    legacy_availability_id: availability.availabilityId || "",
    legacy_plan_id: availability.planId || "",
    legacy_tournament_id: availability.tournamentId || "",
    tournament_name: availability.tournamentName || "",
    legacy_team_profile_id: availability.teamProfileId || "",
    legacy_club_team_id: availability.clubTeamId || "",
    club_team_name: availability.clubTeamName || "",
    player_username: availability.playerUsername || "",
    player_display_name: availability.playerDisplayName || "",
    player_email: availability.playerEmail || "",
    player_phone: availability.playerPhone || "",
    player_country: availability.playerCountry || "",
    response_status: normalizeTournamentAvailabilityStatus_(availability.responseStatus || "PENDING"),
    preferred_squad: normalizePreferredSquad_(availability.preferredSquad || "NO_PREFERENCE"),
    player_note: availability.playerNote || "",
    requested_by_username: availability.requestedBy || "",
    requested_at: availability.requestedAt || availability.createdAt || nowIso_(),
    responded_at: availability.respondedAt || null,
    created_at: availability.createdAt || nowIso_(),
    updated_at: availability.updatedAt || nowIso_()
  };
}

function supabaseSquadPlanningRowFromPlanning_(planning) {
  return {
    legacy_planning_id: planning.planningId || "",
    legacy_plan_id: planning.planId || "",
    legacy_tournament_id: planning.tournamentId || "",
    tournament_name: planning.tournamentName || "",
    legacy_team_profile_id: planning.teamProfileId || "",
    legacy_club_team_id: planning.clubTeamId || "",
    club_team_name: planning.clubTeamName || "",
    player_username: planning.playerUsername || "",
    player_display_name: planning.playerDisplayName || "",
    player_country: planning.playerCountry || "",
    availability_status: normalizeTournamentAvailabilityStatus_(planning.availabilityStatus || ""),
    preferred_squad: normalizePreferredSquad_(planning.preferredSquad || "NO_PREFERENCE"),
    assigned_squad: normalizeAssignedSquad_(planning.assignedSquad || "UNASSIGNED"),
    planning_status: normalizeTournamentSquadPlanningStatus_(planning.planningStatus || "PLANNED"),
    assigned_by_username: planning.assignedBy || "",
    assigned_at: planning.assignedAt || null,
    created_at: planning.createdAt || nowIso_(),
    updated_at: planning.updatedAt || nowIso_()
  };
}

function supabaseRosterRowFromRoster_(roster) {
  return {
    legacy_roster_id: roster.rosterId || "",
    legacy_plan_id: roster.planId || "",
    legacy_tournament_id: roster.tournamentId || "",
    tournament_name: roster.tournamentName || "",
    legacy_team_profile_id: roster.teamProfileId || "",
    legacy_club_team_id: roster.clubTeamId || "",
    club_team_name: roster.clubTeamName || "",
    squad_label: roster.squadLabel || "TEAM_PLANNING",
    captain_username: roster.captainUsername || "",
    roster_status: normalizeTournamentRosterStatus_(roster.rosterStatus || "DRAFT"),
    submitted_by_username: roster.submittedBy || "",
    submitted_at: roster.submittedAt || null,
    reviewed_by_username: firstValue_(roster.approvedBy, roster.rejectedBy, roster.reviewedBy, ""),
    reviewed_at: firstValue_(roster.approvedAt, roster.rejectedAt, roster.reviewedAt, null),
    admin_note: roster.adminNote || "",
    locked_by_username: roster.lockedBy || "",
    locked_at: roster.lockedAt || null,
    lock_reason: roster.lockReason || "",
    created_at: roster.createdAt || nowIso_(),
    updated_at: roster.updatedAt || nowIso_()
  };
}

function supabaseRosterPlayerRowFromPlayer_(player) {
  return {
    legacy_roster_player_id: player.rosterPlayerId || "",
    legacy_roster_id: player.rosterId || "",
    legacy_plan_id: player.planId || "",
    legacy_tournament_id: player.tournamentId || "",
    tournament_name: player.tournamentName || "",
    legacy_team_profile_id: player.teamProfileId || "",
    legacy_club_team_id: player.clubTeamId || "",
    club_team_name: player.clubTeamName || "",
    squad_label: player.squadLabel || "TEAM_PLANNING",
    player_username: player.playerUsername || "",
    player_display_name: player.playerDisplayName || "",
    player_country: player.playerCountry || "",
    assigned_squad: normalizeAssignedSquad_(player.assignedSquad || "UNASSIGNED"),
    roster_role: player.rosterRole || (normalizeAssignedSquad_(player.assignedSquad) === "RESERVE" ? "RESERVE" : "PLAYER"),
    source: player.source || "SQUAD_PLANNING",
    player_status: normalizeTournamentRosterPlayerStatus_(player.playerStatus || "ACTIVE"),
    added_by_username: player.addedBy || "",
    added_at: player.addedAt || player.createdAt || nowIso_(),
    created_at: player.createdAt || nowIso_(),
    updated_at: player.updatedAt || nowIso_()
  };
}

function supabaseOfficialRosterRowFromOfficial_(official) {
  return {
    legacy_official_roster_id: official.officialRosterId || "",
    legacy_draft_id: official.draftId || official.rosterId || "",
    legacy_tournament_id: official.tournamentId || "",
    tournament_name: official.tournamentName || "",
    legacy_team_id: official.teamId || official.clubTeamId || "",
    team_name: official.teamName || official.clubTeamName || "",
    squad_label: official.squadLabel || "TEAM_PLANNING",
    group_name: official.groupName || official.assignedSquad || "",
    player_username: official.playerUsername || "",
    player_display_name: official.playerDisplayName || "",
    player_country: official.playerCountry || "",
    status: official.status || "LOCKED",
    locked_at: official.lockedAt || nowIso_(),
    locked_by_username: official.lockedBy || "",
    updated_at: official.updatedAt || official.createdAt || nowIso_(),
    created_at: official.createdAt || nowIso_()
  };
}

function supabaseFindByLegacyId_(items, key, value) {
  var target = String(value || "");
  var found = null;
  (items || []).some(function(item) {
    if (String(item && item[key] || "") === target) {
      found = item;
      return true;
    }
    return false;
  });
  return found;
}

function supabaseClubById_(ctx, clubTeamId) {
  return supabaseFindByLegacyId_(playerHubSnapshotClubs_(ctx), "teamId", clubTeamId);
}

function supabaseNeedById_(ctx, needId) {
  return supabaseFindByLegacyId_(playerHubSnapshotTeamNeeds_(ctx), "needId", needId);
}

function supabaseInterestById_(ctx, interestId) {
  return supabaseFindByLegacyId_(playerHubSnapshotTeamNeedInterests_(ctx), "interestId", interestId);
}

function supabaseMembershipRequestById_(ctx, requestId) {
  return supabaseFindByLegacyId_(playerHubSnapshotMembershipRequests_(ctx), "requestId", requestId);
}

function supabaseRosterById_(ctx, rosterId) {
  return supabaseFindByLegacyId_(playerHubSnapshotRosters_(ctx), "rosterId", rosterId);
}

function supabaseRosterForPlanId_(ctx, planId) {
  var found = null;
  (playerHubSnapshotRosters_(ctx) || []).some(function(roster) {
    if (
      String(roster && roster.planId || "") === String(planId || "") &&
      normalizeTournamentRosterStatus_(roster.rosterStatus || "") !== "CANCELLED"
    ) {
      found = roster;
      return true;
    }
    return false;
  });
  return found;
}

function supabaseTeamProfileById_(ctx, teamProfileId) {
  return supabaseFindByLegacyId_(playerHubSnapshotTeamProfiles_(ctx), "teamProfileId", teamProfileId);
}

function supabasePlayerProfileForUsername_(ctx, username) {
  var key = playerHubSnapshotUsernameKey_(username);
  var profile = null;
  playerHubSnapshotProfiles_(ctx).some(function(item) {
    if (playerHubSnapshotUsernameKey_(item.username) === key) {
      profile = item;
      return true;
    }
    return false;
  });
  if (profile) return profile;
  var user = null;
  (ctx.appUsers || []).some(function(row) {
    if (playerHubSnapshotUsernameKey_(row.username) === key) {
      user = row;
      return true;
    }
    return false;
  });
  return {
    username: username,
    displayName: user && (user.display_name || user.name) || username,
    email: user && user.email || "",
    phone: user && user.phone || "",
    country: user && user.country || "",
    clubTeamId: "",
    clubTeamName: ""
  };
}

function supabaseActiveTeamMemberExists_(ctx, teamProfileId, username) {
  var key = playerHubSnapshotUsernameKey_(username);
  return (playerHubSnapshotTeamMembers_(ctx) || []).some(function(member) {
    return (
      String(member.teamProfileId || "") === String(teamProfileId || "") &&
      playerHubSnapshotUsernameKey_(member.playerUsername) === key &&
      normalizeTeamMemberStatus_(member.memberStatus || "") === "ACTIVE"
    );
  });
}

function supabasePatchClubTeamReferences_(config, teamId, name, country, city, now) {
  if (!teamId) return;
  [
    ["player_profiles", { club_team_name: name || "", country: country || "", city: city || "", updated_at: now }],
    ["access_requests", { club_team_name: name || "", updated_at: now }],
    ["team_profiles", { club_team_name: name || "", country: country || "", city: city || "", updated_at: now }],
    ["team_needs", { club_team_name: name || "", country: country || "", updated_at: now }],
    ["team_need_interests", { club_team_name: name || "", updated_at: now }],
    ["team_members", { club_team_name: name || "", updated_at: now }],
    ["team_membership_requests", { club_team_name: name || "", updated_at: now }],
    ["tournament_events", { club_team_name: name || "", updated_at: now }],
    ["tournament_availability", { club_team_name: name || "", updated_at: now }],
    ["tournament_squad_planning", { club_team_name: name || "", updated_at: now }],
    ["roster_drafts", { club_team_name: name || "", updated_at: now }],
    ["roster_players", { club_team_name: name || "", updated_at: now }],
    ["event_comments", { club_team_name: name || "", updated_at: now }]
  ].forEach(function(entry) {
    try {
      supabasePatchRows_(config, entry[0], entry[1], { legacy_club_team_id: teamId });
    } catch (err) {
      Logger.log("[PlayerHubBackend] supabase reference patch skipped " + entry[0] + " " + (err && err.message ? err.message : err));
    }
  });
}

function supabaseSaveClubTeamAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  var incoming = data.clubTeam || data.team || data;
  var now = nowIso_();
  var teamId = String(firstValue_(incoming.teamId, incoming.clubTeamId, incoming.id, "") || "").trim();
  var name = clubTeamText_(firstValue_(incoming.name, incoming.clubTeamName, incoming.TeamName, ""));
  if (!name) return { success: false, message: "Club/team name is required." };
  var duplicate = (playerHubSnapshotClubs_(env.ctx) || []).some(function(team) {
    return truthy_(team.active) && clubTeamNameKey_(team.name) === clubTeamNameKey_(name) && String(team.teamId || "") !== String(teamId || "");
  });
  if (duplicate) return { success: false, message: "An active club/team with this name already exists." };
  if (!teamId) teamId = "club-team-" + Utilities.getUuid();
  var team = {
    teamId: teamId,
    name: name,
    country: clubTeamText_(firstValue_(incoming.country, incoming.Country, "")),
    city: clubTeamText_(firstValue_(incoming.city, incoming.City, "")),
    level: clubTeamText_(firstValue_(incoming.level, incoming.Level, "")),
    type: clubTeamText_(firstValue_(incoming.type, incoming.Type, "club")),
    active: incoming.active !== undefined ? truthy_(incoming.active) : true,
    createdAt: firstValue_(incoming.createdAt, now),
    updatedAt: now
  };
  supabaseUpsertRows_(env.config, "club_teams", [supabaseClubTeamRowFromTeam_(team)], "legacy_team_id");
  supabaseAuditLog_(env.config, env.context.user.username, "saveClubTeamAdmin", "club_teams", teamId, { name: name });
  return { success: true, team: team };
}

function supabaseDeactivateClubTeamAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  var teamId = String(firstValue_(data.teamId, data.clubTeamId, data.id, "") || "").trim();
  if (!teamId) return { success: false, message: "Team id is required." };
  var active = data.active !== undefined ? truthy_(data.active) : false;
  var rows = supabasePatchRows_(env.config, "club_teams", { active: active, updated_at: nowIso_() }, { legacy_team_id: teamId });
  supabaseAuditLog_(env.config, env.context.user.username, "deactivateClubTeamAdmin", "club_teams", teamId, { active: active });
  return { success: true, team: rows[0] ? supabaseClub_(rows[0]) : null };
}

function supabaseUpdatePlayerProfileAdminStatus_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  var username = String(firstValue_(data.username, data.playerUsername, "") || "").trim();
  if (!username) return { success: false, message: "Username is required." };
  var now = nowIso_();
  var patch = { updated_at: now };
  if (data.publicVisible !== undefined || data.isPublic !== undefined) patch.public_visible = truthy_(firstValue_(data.publicVisible, data.isPublic));
  if (data.approved !== undefined) patch.approved = truthy_(data.approved);
  if (data.reviewStatus) patch.review_status = String(data.reviewStatus || "").toUpperCase();
  if (data.adminNote !== undefined) patch.admin_note = String(data.adminNote || "");
  var rows = supabasePatchRows_(env.config, "player_profiles", patch, { username: username });
  if (data.active !== undefined) {
    supabasePatchRows_(env.config, "app_users", { active: truthy_(data.active), updated_at: now }, { username: username });
  }
  supabaseAuditLog_(env.config, env.context.user.username, "updatePlayerProfileAdminStatus", "player_profiles", username, patch);
  return { success: true, profile: rows[0] ? supabaseProfile_(rows[0]) : null };
}

function supabaseReviewAccessRequestAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  var requestId = String(firstValue_(data.requestId, data.id, "") || "").trim();
  var status = normalizeAccessRequestStatus_(firstValue_(data.status, data.decision, ""));
  if (!requestId || (status !== "APPROVED" && status !== "REJECTED")) return { success: false, message: "A valid request and decision are required." };
  var requests = playerHubSnapshotAccessRequests_(env.ctx) || [];
  var request = supabaseFindByLegacyId_(requests, "requestId", requestId);
  if (!request) return { success: false, message: "Access request not found" };
  var now = nowIso_();
  var rows = supabasePatchRows_(env.config, "access_requests", {
    status: status,
    reviewed_by_username: env.context.user.username,
    reviewed_at: now,
    admin_note: firstValue_(data.reviewNote, data.adminNote, ""),
    updated_at: now
  }, { legacy_request_id: requestId });
  if (status === "APPROVED") {
    var rolePatch = { updated_at: now };
    var requestType = normalizeAccessRequestType_(request.requestType || request.accessType || request.type);
    if (requestType === "CAPTAIN") rolePatch.can_request_team_profile = true;
    if (requestType === "TRAINER") rolePatch.can_use_team_builder = true;
    if (requestType === "ORGANIZER") rolePatch.can_create_tournaments = true;
    try {
      supabasePatchRows_(env.config, "app_users", rolePatch, { username: request.username });
      applyApprovedAccessRequest_(request);
    } catch (err) {
      Logger.log("[PlayerHubBackend] access auth side-effect skipped " + (err && err.message ? err.message : err));
    }
  }
  supabaseAuditLog_(env.config, env.context.user.username, "reviewAccessRequestAdmin", "access_requests", requestId, { status: status });
  return { success: true, request: rows[0] ? supabaseAccessRequest_(rows[0]) : null };
}

function supabaseRequestTeamIdentityChange_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var teamProfile = captainCheck.captain.teamProfile;
  var club = supabaseClubById_(env.ctx, teamProfile.clubTeamId) || {};
  var pending = (playerHubSnapshotTeamChangeRequests_(env.ctx) || []).some(function(request) {
    return String(request.teamId || "") === String(teamProfile.clubTeamId || "") && normalizeTeamChangeRequestStatus_(request.status || "") === "PENDING";
  });
  if (pending) return { success: false, message: "Identity change already pending." };
  var requestedName = clubTeamText_(firstValue_(data.requestedName, data.name, data.newName, club.name || teamProfile.clubTeamName));
  if (!requestedName) return { success: false, message: "Requested team name is required." };
  var now = nowIso_();
  var request = {
    requestId: "team-change-" + Utilities.getUuid(),
    teamId: teamProfile.clubTeamId || "",
    currentName: club.name || teamProfile.clubTeamName || "",
    requestedName: requestedName,
    currentCountry: club.country || teamProfile.country || "",
    requestedCountry: clubTeamText_(firstValue_(data.requestedCountry, data.country, data.newCountry, club.country || teamProfile.country)),
    currentCity: club.city || teamProfile.city || "",
    requestedCity: clubTeamText_(firstValue_(data.requestedCity, data.city, data.newCity, club.city || teamProfile.city)),
    requestedByUsername: env.context.user.username,
    reason: firstValue_(data.reason, data.note, ""),
    status: "PENDING",
    adminNote: "",
    createdAt: now,
    updatedAt: now
  };
  supabaseInsertRows_(env.config, "team_identity_change_requests", [supabaseTeamChangeRequestRowFromRequest_(request)]);
  supabaseAuditLog_(env.config, env.context.user.username, "requestTeamIdentityChange", "team_identity_change_requests", request.requestId, { teamId: request.teamId });
  return { success: true, request: request, message: "Identity change requested." };
}

function supabaseListTeamIdentityChangeRequests_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var requests = playerHubSnapshotTeamChangeRequests_(env.ctx) || [];
  if (!isAdminUser_(env.context.user)) {
    var captainCheck = supabaseRequireCaptainSnapshot_(env);
    if (!captainCheck.success) return captainCheck;
    requests = requests.filter(function(request) {
      return String(request.teamId || "") === String(captainCheck.captain.teamProfile.clubTeamId || "");
    });
  }
  return { success: true, requests: sortTeamChangeRequests_(requests) };
}

function supabaseReviewTeamIdentityChangeRequest_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  var requestId = String(firstValue_(data.requestId, data.id, "") || "").trim();
  var decision = normalizeTeamChangeRequestStatus_(firstValue_(data.status, data.decision, ""));
  if (!requestId || (decision !== "APPROVED" && decision !== "REJECTED")) return { success: false, message: "A valid request and decision are required." };
  var request = supabaseFindByLegacyId_(playerHubSnapshotTeamChangeRequests_(env.ctx), "requestId", requestId);
  if (!request) return { success: false, message: "Identity request not found." };
  var now = nowIso_();
  if (decision === "APPROVED") {
    var nextName = request.requestedName || request.currentName || "";
    var nextCountry = request.requestedCountry || request.currentCountry || "";
    var nextCity = request.requestedCity || request.currentCity || "";
    supabasePatchRows_(env.config, "club_teams", { name: nextName, country: nextCountry, city: nextCity, updated_at: now }, { legacy_team_id: request.teamId });
    supabasePatchClubTeamReferences_(env.config, request.teamId, nextName, nextCountry, nextCity, now);
  }
  var rows = supabasePatchRows_(env.config, "team_identity_change_requests", {
    status: decision,
    admin_note: firstValue_(data.adminNote, data.reviewNote, ""),
    reviewed_by_username: env.context.user.username,
    reviewed_at: now,
    updated_at: now
  }, { legacy_request_id: requestId });
  supabaseAuditLog_(env.config, env.context.user.username, "reviewTeamIdentityChangeRequest", "team_identity_change_requests", requestId, { status: decision });
  return { success: true, request: rows[0] ? supabaseTeamChangeRequest_(rows[0]) : null };
}

function supabaseSaveMyTeamProfile_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var existing = captainCheck.captain.teamProfile || {};
  var incoming = data.teamProfile || data.profile || data;
  var club = supabaseClubById_(env.ctx, existing.clubTeamId) || {};
  var now = nowIso_();
  var profile = {
    teamProfileId: existing.teamProfileId || "team-profile-" + Utilities.getUuid(),
    clubTeamId: existing.clubTeamId || incoming.clubTeamId || "",
    clubTeamName: club.name || existing.clubTeamName || incoming.clubTeamName || "",
    captainUsername: env.context.user.username,
    country: club.country || existing.country || "",
    city: club.city || existing.city || "",
    level: firstValue_(incoming.level, existing.level, ""),
    description: firstValue_(incoming.description, existing.description, ""),
    contactNote: firstValue_(incoming.contactNote, incoming.contact_note, existing.contactNote, ""),
    active: incoming.active !== undefined ? truthy_(incoming.active) : truthy_(firstValue_(existing.active, true)),
    status: firstValue_(existing.status, "ACTIVE"),
    createdAt: existing.createdAt || now,
    updatedAt: now
  };
  supabaseUpsertRows_(env.config, "team_profiles", [supabaseTeamProfileRowFromProfile_(profile)], "legacy_profile_id");
  supabaseAuditLog_(env.config, env.context.user.username, "saveMyTeamProfile", "team_profiles", profile.teamProfileId, {});
  return { success: true, teamProfile: profile, message: "Team profile saved." };
}

function supabaseListTeamProfilesAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  return { success: true, teamProfiles: playerHubSnapshotTeamProfiles_(env.ctx) || [] };
}

function supabaseUpdateTeamProfileAdmin_(data) {
  var env = supabaseAdminContext_(data);
  if (!env.success) return env;
  var incoming = data.teamProfile || data.profile || data;
  var teamProfileId = String(firstValue_(incoming.teamProfileId, incoming.profileId, "") || "").trim();
  var existing = supabaseTeamProfileById_(env.ctx, teamProfileId);
  if (!existing) return { success: false, message: "Team profile not found." };
  var profile = Object.assign({}, existing, {
    description: firstValue_(incoming.description, existing.description, ""),
    contactNote: firstValue_(incoming.contactNote, existing.contactNote, ""),
    level: firstValue_(incoming.level, existing.level, ""),
    active: incoming.active !== undefined ? truthy_(incoming.active) : truthy_(existing.active),
    status: firstValue_(incoming.status, existing.status, "ACTIVE"),
    updatedAt: nowIso_()
  });
  var rows = supabasePatchRows_(env.config, "team_profiles", supabaseTeamProfileRowFromProfile_(profile), { legacy_profile_id: teamProfileId });
  supabaseAuditLog_(env.config, env.context.user.username, "updateTeamProfileAdmin", "team_profiles", teamProfileId, {});
  return { success: true, teamProfile: rows[0] ? supabaseTeamProfile_(rows[0]) : profile };
}

function supabaseCreateOrUpdateTeamNeed_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var teamProfile = captainCheck.captain.teamProfile;
  var incoming = data.need || data.teamNeed || data;
  var needId = String(firstValue_(incoming.needId, incoming.id, "") || "").trim();
  var existing = needId ? supabaseNeedById_(env.ctx, needId) : null;
  if (existing && String(existing.teamProfileId || "") !== String(teamProfile.teamProfileId || "")) return { success: false, message: "You can only update your own team needs." };
  var tournamentId = String(firstValue_(incoming.tournamentId, existing && existing.tournamentId, "") || "").trim();
  var tournamentName = String(firstValue_(incoming.tournamentName, existing && existing.tournamentName, "") || "").trim();
  var publishRequested = truthy_(firstValue_(incoming.isPublished, incoming.IsPublished, false));
  var visibility = normalizeTeamNeedVisibility_(firstValue_(incoming.visibility, incoming.publishStatus, existing && existing.visibility, publishRequested ? "published" : "internal"));
  if (publishRequested) visibility = "published";
  var needContext = normalizeTeamNeedContext_(firstValue_(incoming.needContext, incoming.context, existing && existing.needContext, tournamentId || tournamentName ? "tournament" : "general"));
  if (visibility === "published" && (needContext !== "tournament" || (!tournamentId && !tournamentName))) {
    return { success: false, message: "Select tournament first." };
  }
  var now = nowIso_();
  var need = {
    needId: needId || "team-need-" + Utilities.getUuid(),
    teamProfileId: teamProfile.teamProfileId,
    clubTeamId: teamProfile.clubTeamId,
    clubTeamName: teamProfile.clubTeamName,
    country: teamProfile.country || "",
    needType: normalizeTeamNeedType_(firstValue_(incoming.needType, incoming.type, existing && existing.needType, "PLAYER")),
    neededCount: Math.max(1, parseInt(firstValue_(incoming.neededCount, incoming.count, existing && existing.neededCount, 1), 10) || 1),
    needText: firstValue_(incoming.needText, incoming.note, existing && existing.needText, existing && existing.note, ""),
    status: normalizeTeamNeedStatus_(firstValue_(incoming.status, existing && existing.status, "OPEN")),
    visibility: visibility,
    needContext: needContext,
    tournamentId: tournamentId,
    tournamentName: tournamentName,
    className: firstValue_(incoming.className, existing && existing.className, ""),
    deadlineAt: firstValue_(incoming.deadlineAt, existing && existing.deadlineAt, ""),
    publishedAt: visibility === "published" ? firstValue_(existing && existing.publishedAt, now) : "",
    createdBy: existing && existing.createdBy || env.context.user.username,
    createdAt: existing && existing.createdAt || now,
    updatedAt: now
  };
  supabaseUpsertRows_(env.config, "team_needs", [supabaseTeamNeedRowFromNeed_(need)], "legacy_need_id");
  var fresh = supabaseReloadEnv_(env);
  var captain = supabaseCaptainSnapshotForUser_(fresh.ctx, fresh.context.user);
  supabaseAuditLog_(env.config, env.context.user.username, "createOrUpdateTeamNeed", "team_needs", need.needId, { visibility: need.visibility });
  return { success: true, teamNeed: need, teamNeeds: captain.needs || [], needs: captain.needs || [], message: visibility === "published" ? "Player ad published." : "Need saved." };
}

function supabaseCloseTeamNeed_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var needId = String(firstValue_(data.needId, data.id, "") || "").trim();
  var need = supabaseNeedById_(env.ctx, needId);
  if (!need) return { success: false, message: "Team need not found." };
  if (String(need.teamProfileId || "") !== String(captainCheck.captain.teamProfile.teamProfileId || "")) return { success: false, message: "You can only close your own team needs." };
  var rows = supabasePatchRows_(env.config, "team_needs", { status: "CLOSED", updated_at: nowIso_() }, { legacy_need_id: needId });
  var fresh = supabaseReloadEnv_(env);
  var captain = supabaseCaptainSnapshotForUser_(fresh.ctx, fresh.context.user);
  supabaseAuditLog_(env.config, env.context.user.username, "closeTeamNeed", "team_needs", needId, {});
  return { success: true, teamNeed: rows[0] ? supabaseTeamNeed_(rows[0]) : null, teamNeeds: captain.needs || [], needs: captain.needs || [], message: "Need closed." };
}

function supabaseCreateTeamNeedInterest_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var needId = String(firstValue_(data.needId, data.NeedId, "") || "").trim();
  var need = supabaseNeedById_(env.ctx, needId);
  if (!need) return { success: false, message: "Team need not found." };
  if (normalizeTeamNeedStatus_(need.status || "") !== "OPEN") return { success: false, message: "This need is closed." };
  var username = playerHubUsername_(env.context.user);
  if (playerHubSnapshotUsernameKey_(need.createdBy) === playerHubSnapshotUsernameKey_(username)) return { success: false, message: "You cannot send interest to your own need." };
  var duplicate = (playerHubSnapshotTeamNeedInterests_(env.ctx) || []).some(function(interest) {
    return String(interest.needId || "") === needId &&
      playerHubSnapshotUsernameKey_(interest.playerUsername) === playerHubSnapshotUsernameKey_(username) &&
      ["PENDING", "ACCEPTED"].indexOf(normalizeTeamNeedInterestStatus_(interest.status || "")) !== -1;
  });
  if (duplicate) return { success: false, message: "Interest already sent." };
  var profile = playerHubSnapshotProfile_(env.ctx, env.context.user);
  var now = nowIso_();
  var interest = {
    interestId: "need-interest-" + Utilities.getUuid(),
    needId: needId,
    teamProfileId: need.teamProfileId,
    clubTeamId: need.clubTeamId,
    clubTeamName: need.clubTeamName,
    playerUsername: username,
    playerDisplayName: profile.displayName || env.context.user.name || username,
    playerEmail: profile.email || env.context.user.email || "",
    playerPhone: profile.phone || "",
    playerCountry: profile.country || "",
    message: firstValue_(data.message, ""),
    status: "PENDING",
    createdAt: now,
    updatedAt: now
  };
  supabaseInsertRows_(env.config, "team_need_interests", [supabaseTeamNeedInterestRowFromInterest_(interest)]);
  supabaseAuditLog_(env.config, username, "createTeamNeedInterest", "team_need_interests", interest.interestId, { needId: needId });
  return { success: true, interest: interest, message: "Interest sent." };
}

function supabaseReviewTeamNeedInterest_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var interestId = String(firstValue_(data.interestId, data.id, "") || "").trim();
  var decision = normalizeTeamNeedInterestStatus_(firstValue_(data.status, data.decision, ""));
  if (!interestId || (decision !== "ACCEPTED" && decision !== "DECLINED")) return { success: false, message: "A valid interest and decision are required." };
  var interest = supabaseInterestById_(env.ctx, interestId);
  if (!interest) return { success: false, message: "Interest not found." };
  if (String(interest.teamProfileId || "") !== String(captainCheck.captain.teamProfile.teamProfileId || "")) return { success: false, message: "Captain access required." };
  var now = nowIso_();
  var rows = supabasePatchRows_(env.config, "team_need_interests", {
    status: decision,
    reviewed_by_username: playerHubUsername_(env.context.user),
    reviewed_at: now,
    updated_at: now
  }, { legacy_interest_id: interestId });
  var fresh = supabaseReloadEnv_(env);
  var captain = supabaseCaptainSnapshotForUser_(fresh.ctx, fresh.context.user);
  var interests = (captain.interests || []).filter(function(item) {
    return !interest.needId || item.needId === interest.needId;
  });
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "reviewTeamNeedInterest", "team_need_interests", interestId, { status: decision });
  return { success: true, interest: rows[0] ? supabaseTeamNeedInterest_(rows[0]) : null, interests: interests, teamNeeds: captain.needs || [] };
}

function supabaseAddTeamMemberFromInterest_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var interestId = String(firstValue_(data.interestId, data.id, "") || "").trim();
  var interest = supabaseInterestById_(env.ctx, interestId);
  if (!interest) return { success: false, message: "Interest not found." };
  if (String(interest.teamProfileId || "") !== String(captainCheck.captain.teamProfile.teamProfileId || "")) return { success: false, message: "Captain access required." };
  if (normalizeTeamNeedInterestStatus_(interest.status || "") !== "ACCEPTED") return { success: false, message: "Interest must be accepted first." };
  if (supabaseActiveTeamMemberExists_(env.ctx, interest.teamProfileId, interest.playerUsername)) {
    return { success: true, message: "Already a team member.", teamMembers: captainCheck.captain.members || [] };
  }
  var now = nowIso_();
  var member = {
    teamMemberId: "team-member-" + Utilities.getUuid(),
    teamProfileId: interest.teamProfileId,
    clubTeamId: interest.clubTeamId,
    clubTeamName: interest.clubTeamName,
    captainUsername: playerHubUsername_(env.context.user),
    playerUsername: interest.playerUsername,
    playerDisplayName: interest.playerDisplayName,
    playerEmail: interest.playerEmail,
    playerPhone: interest.playerPhone,
    playerCountry: interest.playerCountry,
    sourceInterestId: interestId,
    memberStatus: "ACTIVE",
    confirmedBy: playerHubUsername_(env.context.user),
    confirmedAt: now,
    createdAt: now,
    updatedAt: now
  };
  supabaseInsertRows_(env.config, "team_members", [supabaseTeamMemberRowFromMember_(member)]);
  var fresh = supabaseReloadEnv_(env);
  var captain = supabaseCaptainSnapshotForUser_(fresh.ctx, fresh.context.user);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "addTeamMemberFromInterest", "team_members", member.teamMemberId, { interestId: interestId });
  return { success: true, teamMember: member, teamMembers: captain.members || [], message: "Team member added." };
}

function supabaseRemoveTeamMember_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var memberId = String(firstValue_(data.teamMemberId, data.memberId, data.id, "") || "").trim();
  var member = supabaseFindByLegacyId_(playerHubSnapshotTeamMembers_(env.ctx), "teamMemberId", memberId);
  if (!member) return { success: false, message: "Team member not found." };
  if (String(member.teamProfileId || "") !== String(captainCheck.captain.teamProfile.teamProfileId || "")) return { success: false, message: "Captain access required." };
  var rows = supabasePatchRows_(env.config, "team_members", { member_status: "REMOVED", updated_at: nowIso_() }, { legacy_team_member_id: memberId });
  var fresh = supabaseReloadEnv_(env);
  var captain = supabaseCaptainSnapshotForUser_(fresh.ctx, fresh.context.user);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "removeTeamMember", "team_members", memberId, {});
  return { success: true, teamMember: rows[0] ? supabaseTeamMember_(rows[0]) : null, teamMembers: captain.members || [] };
}

function supabaseCreateOrUpdateTeamMembershipRequest_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var username = playerHubUsername_(env.context.user);
  var profile = playerHubSnapshotProfile_(env.ctx, env.context.user);
  var clubTeamId = String(firstValue_(data.clubTeamId, profile.clubTeamId, "") || "").trim();
  if (!clubTeamId) return { success: true, request: null, requests: playerHubSnapshotMembershipRequestsForPlayer_(env.ctx, username) };
  var club = supabaseClubById_(env.ctx, clubTeamId);
  if (!club) return { success: false, message: "Selected club/team is no longer active." };
  var now = nowIso_();
  (playerHubSnapshotMembershipRequests_(env.ctx) || []).forEach(function(request) {
    if (playerHubSnapshotUsernameKey_(request.playerUsername) === playerHubSnapshotUsernameKey_(username) &&
      normalizeTeamMembershipRequestStatus_(request.status || "") === "PENDING" &&
      String(request.clubTeamId || "") !== clubTeamId) {
      supabasePatchRows_(env.config, "team_membership_requests", { status: "CANCELLED", updated_at: now }, { legacy_request_id: request.requestId });
    }
  });
  var existing = null;
  (playerHubSnapshotMembershipRequests_(env.ctx) || []).some(function(request) {
    if (playerHubSnapshotUsernameKey_(request.playerUsername) === playerHubSnapshotUsernameKey_(username) &&
      String(request.clubTeamId || "") === clubTeamId &&
      normalizeTeamMembershipRequestStatus_(request.status || "") === "PENDING") {
      existing = request;
      return true;
    }
    return false;
  });
  var requestObj = {
    requestId: existing && existing.requestId || "team-membership-" + Utilities.getUuid(),
    clubTeamId: club.teamId,
    clubTeamName: club.name,
    playerUsername: username,
    playerDisplayName: profile.displayName || env.context.user.name || username,
    playerEmail: profile.email || env.context.user.email || "",
    playerPhone: profile.phone || "",
    playerCountry: profile.country || "",
    playerProfileId: profile.profileId || "",
    status: "PENDING",
    requestedAt: existing && existing.requestedAt || now,
    createdAt: existing && existing.createdAt || now,
    updatedAt: now
  };
  supabaseUpsertRows_(env.config, "team_membership_requests", [supabaseMembershipRequestRowFromRequest_(requestObj)], "legacy_request_id");
  var fresh = supabaseReloadEnv_(env);
  supabaseAuditLog_(env.config, username, "createOrUpdateTeamMembershipRequest", "team_membership_requests", requestObj.requestId, { clubTeamId: clubTeamId });
  return { success: true, request: requestObj, requests: playerHubSnapshotMembershipRequestsForPlayer_(fresh.ctx, username) };
}

function supabaseReviewTeamMembershipRequest_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var requestId = String(firstValue_(data.requestId, data.id, "") || "").trim();
  var status = normalizeTeamMembershipRequestStatus_(firstValue_(data.status, data.decision, ""));
  if (!requestId || (status !== "APPROVED" && status !== "REJECTED")) return { success: false, message: "Request must be approved or rejected." };
  var request = supabaseMembershipRequestById_(env.ctx, requestId);
  if (!request) return { success: false, message: "Membership request not found" };
  if (String(request.clubTeamId || "") !== String(captainCheck.captain.teamProfile.clubTeamId || "")) return { success: false, message: "Captain access required." };
  var now = nowIso_();
  var rows = supabasePatchRows_(env.config, "team_membership_requests", {
    status: status,
    reviewed_by_username: playerHubUsername_(env.context.user),
    reviewed_at: now,
    review_note: firstValue_(data.reviewNote, data.adminNote, ""),
    updated_at: now
  }, { legacy_request_id: requestId });
  if (status === "APPROVED" && !supabaseActiveTeamMemberExists_(env.ctx, captainCheck.captain.teamProfile.teamProfileId, request.playerUsername)) {
    supabaseInsertRows_(env.config, "team_members", [supabaseTeamMemberRowFromMember_({
      teamMemberId: "team-member-" + Utilities.getUuid(),
      teamProfileId: captainCheck.captain.teamProfile.teamProfileId,
      clubTeamId: captainCheck.captain.teamProfile.clubTeamId,
      clubTeamName: captainCheck.captain.teamProfile.clubTeamName,
      captainUsername: playerHubUsername_(env.context.user),
      playerUsername: request.playerUsername,
      playerDisplayName: request.playerDisplayName,
      playerEmail: request.playerEmail,
      playerPhone: request.playerPhone,
      playerCountry: request.playerCountry,
      sourceInterestId: "PROFILE_REQUEST",
      memberStatus: "ACTIVE",
      confirmedBy: playerHubUsername_(env.context.user),
      confirmedAt: now,
      createdAt: now,
      updatedAt: now
    })]);
  }
  var fresh = supabaseReloadEnv_(env);
  var captain = supabaseCaptainSnapshotForUser_(fresh.ctx, fresh.context.user);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "reviewTeamMembershipRequest", "team_membership_requests", requestId, { status: status });
  return { success: true, request: rows[0] ? supabaseMembershipRequest_(rows[0]) : null, requests: captain.membershipRequests || [], members: captain.members || [] };
}

function supabaseCancelMyTeamMembershipRequest_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var username = playerHubUsername_(env.context.user);
  var requestId = String(firstValue_(data.requestId, data.id, "") || "").trim();
  var request = supabaseMembershipRequestById_(env.ctx, requestId);
  if (!request || playerHubSnapshotUsernameKey_(request.playerUsername) !== playerHubSnapshotUsernameKey_(username)) return { success: false, message: "Membership request not found" };
  if (normalizeTeamMembershipRequestStatus_(request.status || "") !== "PENDING") return { success: false, message: "Only pending requests can be cancelled." };
  var rows = supabasePatchRows_(env.config, "team_membership_requests", { status: "CANCELLED", updated_at: nowIso_() }, { legacy_request_id: requestId });
  supabaseAuditLog_(env.config, username, "cancelMyTeamMembershipRequest", "team_membership_requests", requestId, {});
  return { success: true, request: rows[0] ? supabaseMembershipRequest_(rows[0]) : null };
}

function supabaseCreateTournamentTeamPlan_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var captainCheck = supabaseRequireCaptainSnapshot_(env);
  if (!captainCheck.success) return captainCheck;
  var teamProfile = captainCheck.captain.teamProfile;
  var tournamentId = String(firstValue_(data.tournamentId, data.tournament && data.tournament.id, "") || "").trim();
  var tournamentName = String(firstValue_(data.tournamentName, data.tournament && data.tournament.name, "") || "").trim();
  if (!tournamentId && !tournamentName) return { success: false, message: "Select tournament first." };
  var now = nowIso_();
  var plan = {
    planId: "tournament-plan-" + Utilities.getUuid(),
    tournamentId: tournamentId,
    tournamentName: tournamentName,
    teamProfileId: teamProfile.teamProfileId,
    clubTeamId: teamProfile.clubTeamId,
    clubTeamName: teamProfile.clubTeamName,
    captainUsername: playerHubUsername_(env.context.user),
    squadLabel: firstValue_(data.squadLabel, "TEAM_PLANNING"),
    className: firstValue_(data.className, ""),
    planStatus: normalizeTournamentPlanStatus_(firstValue_(data.planStatus, "INVITING")),
    deadlineAt: firstValue_(data.deadlineAt, ""),
    note: firstValue_(data.note, ""),
    createdAt: now,
    updatedAt: now
  };
  supabaseInsertRows_(env.config, "tournament_events", [supabaseTournamentPlanRowFromPlan_(plan)]);
  var invitees = tournamentAvailabilityInvitees_(captainCheck.captain.members || [], {
    user: env.context.user,
    teamProfile: teamProfile,
    playerProfile: playerHubSnapshotProfile_(env.ctx, env.context.user)
  });
  var existingAvailability = {};
  (playerHubSnapshotTournamentAvailability_(env.ctx) || []).forEach(function(item) {
    if (String(item.planId || "") === plan.planId) existingAvailability[playerHubSnapshotUsernameKey_(item.playerUsername)] = true;
  });
  var rows = [];
  invitees.forEach(function(member) {
    var username = member.playerUsername || "";
    var key = playerHubSnapshotUsernameKey_(username);
    if (!key || existingAvailability[key]) return;
    existingAvailability[key] = true;
    rows.push(supabaseTournamentAvailabilityRowFromAvailability_({
      availabilityId: "availability-" + Utilities.getUuid(),
      planId: plan.planId,
      tournamentId: plan.tournamentId,
      tournamentName: plan.tournamentName,
      teamProfileId: plan.teamProfileId,
      clubTeamId: plan.clubTeamId,
      clubTeamName: plan.clubTeamName,
      playerUsername: username,
      playerDisplayName: member.playerDisplayName || username,
      playerEmail: member.playerEmail || "",
      playerPhone: member.playerPhone || "",
      playerCountry: member.playerCountry || "",
      responseStatus: "PENDING",
      preferredSquad: "NO_PREFERENCE",
      playerNote: "",
      requestedBy: playerHubUsername_(env.context.user),
      requestedAt: now,
      createdAt: now,
      updatedAt: now
    }));
  });
  if (rows.length) supabaseInsertRows_(env.config, "tournament_availability", rows);
  var fresh = supabaseReloadEnv_(env);
  var captain = supabaseCaptainSnapshotForUser_(fresh.ctx, fresh.context.user);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "createTournamentTeamPlan", "tournament_events", plan.planId, { invitees: rows.length });
  return { success: true, plan: plan, plans: captain.tournamentPlans || [], tournamentPlans: captain.tournamentPlans || [], message: "Team members asked." };
}

function supabaseUpdateTournamentPlanStatus_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var planCheck = supabasePlanForCaptain_(env, firstValue_(data.planId, data.id, ""));
  if (!planCheck.success) return planCheck;
  var status = normalizeTournamentPlanStatus_(firstValue_(data.planStatus, data.status, ""));
  if (!status) return { success: false, message: "Plan status is required." };
  var rows = supabasePatchRows_(env.config, "tournament_events", { status: status, updated_at: nowIso_() }, { legacy_plan_id: planCheck.plan.planId });
  var fresh = supabaseReloadEnv_(env);
  var captain = supabaseCaptainSnapshotForUser_(fresh.ctx, fresh.context.user);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "updateTournamentPlanStatus", "tournament_events", planCheck.plan.planId, { status: status });
  return { success: true, plan: rows[0] ? supabaseTournamentPlan_(rows[0]) : null, plans: captain.tournamentPlans || [], tournamentPlans: captain.tournamentPlans || [] };
}

function supabaseAssignPlayerToSquad_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var planCheck = supabasePlanForCaptain_(env, firstValue_(data.planId, data.id, ""));
  if (!planCheck.success) return planCheck;
  var plan = planCheck.plan;
  var username = String(firstValue_(data.playerUsername, data.username, "") || "").trim();
  var assignedSquad = normalizeAssignedSquad_(firstValue_(data.assignedSquad, data.squad, ""));
  if (!username || ["A", "B", "C", "RESERVE", "UNASSIGNED"].indexOf(assignedSquad) === -1) return { success: false, message: "A valid player and squad are required." };
  var availability = null;
  (playerHubSnapshotTournamentAvailability_(env.ctx) || []).some(function(item) {
    if (String(item.planId || "") === plan.planId && playerHubSnapshotUsernameKey_(item.playerUsername) === playerHubSnapshotUsernameKey_(username)) {
      availability = item;
      return true;
    }
    return false;
  });
  if (!availability || ["YES", "MAYBE"].indexOf(normalizeTournamentAvailabilityStatus_(availability.responseStatus || "")) === -1) {
    return { success: false, message: "Only Going or Maybe players can be assigned." };
  }
  var existing = null;
  (playerHubSnapshotSquadPlanning_(env.ctx) || []).some(function(item) {
    if (String(item.planId || "") === plan.planId && playerHubSnapshotUsernameKey_(item.playerUsername) === playerHubSnapshotUsernameKey_(username)) {
      existing = item;
      return true;
    }
    return false;
  });
  var now = nowIso_();
  var planning = {
    planningId: existing && existing.planningId || "squad-planning-" + Utilities.getUuid(),
    planId: plan.planId,
    tournamentId: plan.tournamentId,
    tournamentName: plan.tournamentName,
    teamProfileId: plan.teamProfileId,
    clubTeamId: plan.clubTeamId,
    clubTeamName: plan.clubTeamName,
    playerUsername: username,
    playerDisplayName: availability.playerDisplayName || username,
    playerCountry: availability.playerCountry || "",
    availabilityStatus: availability.responseStatus || "YES",
    preferredSquad: availability.preferredSquad || "NO_PREFERENCE",
    assignedSquad: assignedSquad,
    planningStatus: "PLANNED",
    assignedBy: playerHubUsername_(env.context.user),
    assignedAt: now,
    createdAt: existing && existing.createdAt || now,
    updatedAt: now
  };
  supabaseUpsertRows_(env.config, "tournament_squad_planning", [supabaseSquadPlanningRowFromPlanning_(planning)], "legacy_planning_id");
  var fresh = supabaseReloadEnv_(env);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "assignPlayerToSquad", "tournament_squad_planning", planning.planningId, { squad: assignedSquad });
  return { success: true, planning: planning, squadPlanning: supabasePlanningForPlan_(fresh.ctx, plan.planId) };
}

function supabaseRemovePlayerFromSquadPlanning_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var planCheck = supabasePlanForCaptain_(env, firstValue_(data.planId, data.id, ""));
  if (!planCheck.success) return planCheck;
  var username = String(firstValue_(data.playerUsername, data.username, "") || "").trim();
  var rows = [];
  (playerHubSnapshotSquadPlanning_(env.ctx) || []).forEach(function(item) {
    if (String(item.planId || "") !== planCheck.plan.planId) return;
    if (username && playerHubSnapshotUsernameKey_(item.playerUsername) !== playerHubSnapshotUsernameKey_(username)) return;
    rows = rows.concat(supabasePatchRows_(env.config, "tournament_squad_planning", {
      assigned_squad: "UNASSIGNED",
      planning_status: "PLANNED",
      assigned_by_username: playerHubUsername_(env.context.user),
      assigned_at: nowIso_(),
      updated_at: nowIso_()
    }, { legacy_planning_id: item.planningId }));
  });
  var fresh = supabaseReloadEnv_(env);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "removePlayerFromSquadPlanning", "tournament_squad_planning", planCheck.plan.planId, { playerUsername: username });
  return { success: true, planning: rows.map(supabaseSquadPlanning_), squadPlanning: supabasePlanningForPlan_(fresh.ctx, planCheck.plan.planId) };
}

function supabaseRosterPlanningVersionKey_(planning) {
  return (planning || [])
    .filter(function(item) {
      return normalizeTournamentSquadPlanningStatus_(item.planningStatus || "PLANNED") === "PLANNED" &&
        ["A", "B", "C", "RESERVE"].indexOf(normalizeAssignedSquad_(item.assignedSquad || "")) !== -1;
    })
    .map(function(item) {
      return [item.playerUsername || "", normalizeAssignedSquad_(item.assignedSquad || "")].join(":");
    })
    .sort()
    .join("|");
}

function supabaseCreateOrUpdateRosterDraftFromSquadPlanning_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var planCheck = supabasePlanForCaptain_(env, firstValue_(data.planId, data.id, ""));
  if (!planCheck.success) return planCheck;
  var plan = planCheck.plan;
  var existing = supabaseRosterForPlanId_(env.ctx, plan.planId);
  if (existing && ["SUBMITTED", "APPROVED", "LOCKED"].indexOf(normalizeTournamentRosterStatus_(existing.rosterStatus || "")) !== -1) {
    return { success: false, message: "Submitted or locked rosters cannot be updated from planning." };
  }
  var planning = supabasePlanningForPlan_(env.ctx, plan.planId).filter(function(item) {
    return normalizeTournamentSquadPlanningStatus_(item.planningStatus || "PLANNED") === "PLANNED" &&
      ["A", "B", "C", "RESERVE"].indexOf(normalizeAssignedSquad_(item.assignedSquad || "")) !== -1;
  });
  if (!planning.length) return { success: false, message: "Assign at least one player before creating a roster draft." };
  var now = nowIso_();
  var rosterId = existing && existing.rosterId || "roster-draft-" + Utilities.getUuid();
  var roster = {
    rosterId: rosterId,
    planId: plan.planId,
    tournamentId: plan.tournamentId,
    tournamentName: plan.tournamentName,
    teamProfileId: plan.teamProfileId,
    clubTeamId: plan.clubTeamId,
    clubTeamName: plan.clubTeamName,
    squadLabel: plan.squadLabel || "TEAM_PLANNING",
    captainUsername: playerHubUsername_(env.context.user),
    rosterStatus: "DRAFT",
    planningVersionKey: supabaseRosterPlanningVersionKey_(planning),
    createdAt: existing && existing.createdAt || now,
    updatedAt: now
  };
  supabaseUpsertRows_(env.config, "roster_drafts", [supabaseRosterRowFromRoster_(roster)], "legacy_roster_id");
  var existingPlayers = {};
  (playerHubSnapshotRosterPlayers_(env.ctx) || []).forEach(function(player) {
    if (String(player.rosterId || "") === rosterId) existingPlayers[playerHubSnapshotUsernameKey_(player.playerUsername)] = player;
  });
  var activeKeys = {};
  var playerRows = planning.map(function(item) {
    var key = playerHubSnapshotUsernameKey_(item.playerUsername);
    activeKeys[key] = true;
    var existingPlayer = existingPlayers[key] || {};
    return supabaseRosterPlayerRowFromPlayer_({
      rosterPlayerId: existingPlayer.rosterPlayerId || "roster-player-" + Utilities.getUuid(),
      rosterId: rosterId,
      planId: plan.planId,
      tournamentId: plan.tournamentId,
      tournamentName: plan.tournamentName,
      teamProfileId: plan.teamProfileId,
      clubTeamId: plan.clubTeamId,
      clubTeamName: plan.clubTeamName,
      squadLabel: roster.squadLabel,
      playerUsername: item.playerUsername,
      playerDisplayName: item.playerDisplayName,
      playerCountry: item.playerCountry,
      assignedSquad: item.assignedSquad,
      rosterRole: normalizeAssignedSquad_(item.assignedSquad) === "RESERVE" ? "RESERVE" : "PLAYER",
      source: "SQUAD_PLANNING",
      playerStatus: "ACTIVE",
      addedBy: playerHubUsername_(env.context.user),
      addedAt: existingPlayer.addedAt || now,
      createdAt: existingPlayer.createdAt || now,
      updatedAt: now
    });
  });
  if (playerRows.length) supabaseUpsertRows_(env.config, "roster_players", playerRows, "legacy_roster_player_id");
  Object.keys(existingPlayers).forEach(function(key) {
    if (!activeKeys[key]) {
      supabasePatchRows_(env.config, "roster_players", { player_status: "REMOVED", updated_at: now }, { legacy_roster_player_id: existingPlayers[key].rosterPlayerId });
    }
  });
  var fresh = supabaseReloadEnv_(env);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "createOrUpdateRosterDraftFromSquadPlanning", "roster_drafts", rosterId, { players: playerRows.length });
  return Object.assign({ message: "Roster draft saved." }, supabaseRosterPayloadForPlan_(fresh.ctx, plan));
}

function supabaseSubmitRosterDraft_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var rosterId = String(firstValue_(data.rosterId, data.draftId, "") || "").trim();
  var roster = rosterId ? supabaseRosterById_(env.ctx, rosterId) : supabaseRosterForPlanId_(env.ctx, firstValue_(data.planId, ""));
  if (!roster) return { success: false, message: "Roster draft not found." };
  var planCheck = supabasePlanForCaptain_(env, roster.planId);
  if (!planCheck.success) return planCheck;
  if (normalizeTournamentRosterStatus_(roster.rosterStatus || "") !== "DRAFT" && normalizeTournamentRosterStatus_(roster.rosterStatus || "") !== "CHANGE_REQUESTED") {
    return { success: false, message: "Only draft rosters can be submitted." };
  }
  var now = nowIso_();
  supabasePatchRows_(env.config, "roster_drafts", {
    roster_status: "SUBMITTED",
    submitted_by_username: playerHubUsername_(env.context.user),
    submitted_at: now,
    updated_at: now
  }, { legacy_roster_id: roster.rosterId });
  var fresh = supabaseReloadEnv_(env);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "submitRosterDraft", "roster_drafts", roster.rosterId, {});
  return Object.assign({ message: "Roster submitted." }, supabaseRosterPayloadForPlan_(fresh.ctx, planCheck.plan));
}

function supabaseRemovePlayerFromRosterDraft_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var rosterId = String(firstValue_(data.rosterId, data.draftId, "") || "").trim();
  var roster = supabaseRosterById_(env.ctx, rosterId);
  if (!roster) return { success: false, message: "Roster draft not found." };
  var planCheck = supabasePlanForCaptain_(env, roster.planId);
  if (!planCheck.success) return planCheck;
  if (normalizeTournamentRosterStatus_(roster.rosterStatus || "") !== "DRAFT") return { success: false, message: "Only draft rosters can be edited." };
  var playerId = String(firstValue_(data.rosterPlayerId, data.playerId, "") || "").trim();
  var username = String(firstValue_(data.playerUsername, data.username, "") || "").trim();
  var rows = [];
  (playerHubSnapshotRosterPlayers_(env.ctx) || []).forEach(function(player) {
    if (String(player.rosterId || "") !== rosterId) return;
    if (playerId && String(player.rosterPlayerId || "") !== playerId) return;
    if (username && playerHubSnapshotUsernameKey_(player.playerUsername) !== playerHubSnapshotUsernameKey_(username)) return;
    rows = rows.concat(supabasePatchRows_(env.config, "roster_players", { player_status: "REMOVED", updated_at: nowIso_() }, { legacy_roster_player_id: player.rosterPlayerId }));
  });
  var fresh = supabaseReloadEnv_(env);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "removePlayerFromRosterDraft", "roster_players", rosterId, { playerUsername: username });
  return Object.assign({ removed: rows.map(supabaseRosterPlayer_) }, supabaseRosterPayloadForPlan_(fresh.ctx, planCheck.plan));
}

function supabaseCancelRosterDraft_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var rosterId = String(firstValue_(data.rosterId, data.draftId, "") || "").trim();
  var roster = supabaseRosterById_(env.ctx, rosterId);
  if (!roster) return { success: false, message: "Roster draft not found." };
  var planCheck = supabasePlanForCaptain_(env, roster.planId);
  if (!planCheck.success) return planCheck;
  if (normalizeTournamentRosterStatus_(roster.rosterStatus || "") === "LOCKED") return { success: false, message: "Locked rosters cannot be cancelled." };
  var now = nowIso_();
  var rows = supabasePatchRows_(env.config, "roster_drafts", {
    roster_status: "CANCELLED",
    updated_at: now
  }, { legacy_roster_id: roster.rosterId });
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "cancelRosterDraft", "roster_drafts", roster.rosterId, {});
  return { success: true, roster: rows[0] ? supabaseRoster_(rows[0]) : null, message: "Roster draft cancelled." };
}

function supabaseReviewRosterDraft_(data) {
  var env = supabaseReviewerContext_(data);
  if (!env.success) return env;
  var rosterId = String(firstValue_(data.rosterId, data.draftId, "") || "").trim();
  var decision = normalizeTournamentRosterStatus_(firstValue_(data.status, data.decision, ""));
  if (!rosterId || (decision !== "APPROVED" && decision !== "REJECTED")) return { success: false, message: "A valid roster and decision are required." };
  var roster = supabaseRosterById_(env.ctx, rosterId);
  if (!roster) return { success: false, message: "Roster draft not found." };
  if (normalizeTournamentRosterStatus_(roster.rosterStatus || "") !== "SUBMITTED") return { success: false, message: "Only submitted rosters can be reviewed." };
  var now = nowIso_();
  var patch = { roster_status: decision, admin_note: firstValue_(data.adminNote, data.reviewNote, ""), updated_at: now };
  if (decision === "APPROVED") {
    patch.reviewed_by_username = playerHubUsername_(env.context.user);
    patch.reviewed_at = now;
  } else {
    patch.reviewed_by_username = playerHubUsername_(env.context.user);
    patch.reviewed_at = now;
  }
  var rows = supabasePatchRows_(env.config, "roster_drafts", patch, { legacy_roster_id: rosterId });
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "reviewRosterDraft", "roster_drafts", rosterId, { status: decision });
  return { success: true, roster: rows[0] ? supabaseRoster_(rows[0]) : null, message: decision === "APPROVED" ? "Roster approved." : "Roster rejected." };
}

function supabaseLockOfficialRoster_(data) {
  var env = supabaseAuthContext_(data);
  if (!env.success) return env;
  var rosterId = String(firstValue_(data.rosterId, data.draftId, "") || "").trim();
  var roster = supabaseRosterById_(env.ctx, rosterId);
  if (!roster) return { success: false, message: "Roster draft not found." };
  var planCheck = supabasePlanForCaptain_(env, roster.planId);
  if (!planCheck.success) return planCheck;
  if (normalizeTournamentRosterStatus_(roster.rosterStatus || "") !== "APPROVED") return { success: false, message: "Roster must be approved before locking." };
  var players = (playerHubSnapshotRosterPlayers_(env.ctx) || []).filter(function(player) {
    return String(player.rosterId || "") === roster.rosterId && normalizeTournamentRosterPlayerStatus_(player.playerStatus || "ACTIVE") === "ACTIVE";
  });
  if (!players.length) return { success: false, message: "Roster has no active players." };
  var now = nowIso_();
  supabaseUpsertRows_(env.config, "official_rosters", players.map(function(player) {
    return supabaseOfficialRosterRowFromOfficial_({
      officialRosterId: "official-roster-" + roster.rosterId + "-" + player.playerUsername,
      draftId: roster.rosterId,
      tournamentId: roster.tournamentId,
      tournamentName: roster.tournamentName,
      teamId: roster.clubTeamId,
      teamName: roster.clubTeamName,
      squadLabel: roster.squadLabel,
      groupName: player.assignedSquad,
      playerUsername: player.playerUsername,
      playerDisplayName: player.playerDisplayName,
      playerCountry: player.playerCountry,
      status: "LOCKED",
      lockedAt: now,
      lockedBy: playerHubUsername_(env.context.user),
      createdAt: now
    });
  }), "legacy_official_roster_id");
  supabasePatchRows_(env.config, "roster_drafts", {
    roster_status: "LOCKED",
    locked_by_username: playerHubUsername_(env.context.user),
    locked_at: now,
    lock_reason: firstValue_(data.lockReason, ""),
    updated_at: now
  }, { legacy_roster_id: roster.rosterId });
  var fresh = supabaseReloadEnv_(env);
  supabaseAuditLog_(env.config, playerHubUsername_(env.context.user), "lockOfficialRoster", "roster_drafts", roster.rosterId, { players: players.length });
  return Object.assign({ message: "Official roster locked." }, supabaseRosterPayloadForPlan_(fresh.ctx, planCheck.plan));
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
    { key: "rosterPlayers", table: "roster_players" },
    { key: "officialRosters", table: "official_rosters" },
    { key: "tournaments", table: "tournaments" }
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

function supabaseOfficialRoster_(row) {
  return {
    officialRosterId: supabaseText_(row.legacy_official_roster_id),
    draftId: supabaseText_(row.legacy_draft_id),
    tournamentId: supabaseText_(row.legacy_tournament_id),
    tournamentName: supabaseText_(row.tournament_name),
    teamId: supabaseText_(row.legacy_team_id),
    teamName: supabaseText_(row.team_name),
    squadLabel: supabaseText_(row.squad_label),
    groupName: supabaseText_(row.group_name),
    playerUsername: supabaseText_(row.player_username),
    playerDisplayName: supabaseText_(row.player_display_name),
    playerCountry: supabaseText_(row.player_country),
    status: supabaseText_(row.status || "LOCKED").toUpperCase() || "LOCKED",
    lockedAt: supabaseText_(row.locked_at),
    lockedBy: supabaseText_(row.locked_by_username),
    createdAt: supabaseText_(row.created_at)
  };
}

function supabaseTournament_(row) {
  return {
    id: supabaseText_(row.legacy_tournament_id),
    tournamentId: supabaseText_(row.legacy_tournament_id),
    TournamentId: supabaseText_(row.legacy_tournament_id),
    name: supabaseText_(row.name),
    country: supabaseText_(row.country),
    city: supabaseText_(row.city),
    startDate: supabaseText_(row.start_date),
    endDate: supabaseText_(row.end_date),
    registrationDeadline: supabaseText_(row.registration_deadline),
    visibility: supabaseText_(row.visibility),
    status: supabaseText_(row.status),
    organizerUsername: supabaseText_(row.organizer_username),
    ownerUsername: supabaseText_(row.organizer_username),
    publicCode: supabaseText_(row.public_code),
    published: supabaseBool_(row.published, false),
    publishedAt: supabaseText_(row.published_at),
    updatedAt: supabaseText_(row.updated_at),
    groups: [],
    matches: [],
    series: [],
    knockout: {}
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
      rosterPlayers: data.rosterPlayers.map(supabaseRosterPlayer_),
      officialRosters: data.officialRosters.map(supabaseOfficialRoster_),
      tournaments: data.tournaments.map(supabaseTournament_)
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
    playerHubBackendLog_("supabase getPlayerHubSnapshot");
    playerHubSnapshotLog_("[Snapshot] source supabase");
    return playerHubSnapshotPayloadFromContext_(
      supabasePlayerHubContext_(config, context.user),
      context,
      options && options.timer,
      {
        snapshotSource: "supabase",
        snapshotFallbackUsed: false
      }
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
        hasServiceRoleKey: !!config.serviceRoleKey,
        playerHubBackend: config.playerHubBackend || "sheets"
      },
      message:
        "Supabase Player Hub reads are disabled. Set PLAYER_HUB_BACKEND=supabase or SUPABASE_PLAYER_HUB_READS_ENABLED=true in Script Properties to run this diagnostic."
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

function playerHubSnapshotPayloadFromContext_(ctx, context, timer, metadata) {
  var username = playerHubUsername_(context.user);
  var safeMetadata = metadata || {};

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
    snapshotSource: safeMetadata.snapshotSource || "sheets",
    snapshotFallbackUsed: !!safeMetadata.snapshotFallbackUsed,
    snapshotWarning: safeMetadata.snapshotWarning || "",
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
    var snapshotFallbackWarning = "";
    try {
      supabaseSnapshot = fetchSupabasePlayerHubSnapshot_(data || {}, context, {
        timer: timer
      });
    } catch (supabaseErr) {
      snapshotFallbackWarning =
        "Supabase read failed; Google Sheets fallback used.";
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

    playerHubBackendLog_(
      snapshotFallbackWarning ? "fallback getPlayerHubSnapshot" : "sheets"
    );
    playerHubSnapshotLog_("[Snapshot] source sheets");
    var ctx = playerHubSnapshotContext_(context.user);
    var payload = playerHubSnapshotPayloadFromContext_(
      ctx,
      context,
      timer,
      {
        snapshotSource: "sheets",
        snapshotFallbackUsed: !!snapshotFallbackWarning,
        snapshotWarning: snapshotFallbackWarning
      }
    );
    playerHubSnapshotTotal_(timer);
    return payload;
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
  if (isSupabaseTournamentBackendEnabled_()) {
    tournamentBackendLog_("supabase " + action);
    try {
      return supabaseHandleTournamentAction_(action, data || {});
    } catch (err) {
      tournamentBackendLog_(
        "fallback " +
          action +
          " " +
          (err && err.message ? err.message : String(err))
      );
      var fallback = handleTournamentSheetsAction_(action, data || {});
      if (fallback && typeof fallback === "object") {
        fallback.tournamentBackend = "sheets";
        fallback.tournamentBackendFallbackUsed = true;
        fallback.tournamentBackendWarning =
          "Supabase tournament backend failed; used Google Sheets fallback.";
      }
      return fallback;
    }
  }
  tournamentBackendLog_("sheets " + action);
  var response = handleTournamentSheetsAction_(action, data || {});
  if (response && typeof response === "object") {
    response.tournamentBackend = "sheets";
    response.tournamentBackendFallbackUsed = false;
  }
  return response;
}

function handleTournamentSheetsAction_(action, data) {
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

function supabaseTournamentResponse_(payload) {
  var response = payload || {};
  response.tournamentBackend = "supabase";
  response.tournamentBackendFallbackUsed = false;
  return response;
}

function supabaseTournamentConfig_() {
  var config = getSupabaseConfig_();
  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Supabase tournament backend is not configured.");
  }
  return config;
}

function supabaseTournamentFromRow_(row) {
  if (!row) return null;
  var tournament = {};
  if (row.tournament_json) {
    if (typeof row.tournament_json === "object") {
      tournament = Object.assign({}, row.tournament_json);
    } else {
      try {
        tournament = JSON.parse(String(row.tournament_json));
      } catch (err) {
        tournament = {};
      }
    }
  }

  tournament.id = firstNonEmpty_(
    tournament.id,
    tournament.tournamentId,
    tournament.TournamentId,
    row.legacy_tournament_id
  );
  tournament.tournamentId = tournament.id;
  tournament.TournamentId = tournament.id;
  tournament.name = firstNonEmpty_(tournament.name, row.name);
  tournament.country = firstValue_(tournament.country, row.country, "");
  tournament.city = firstValue_(tournament.city, row.city, "");
  tournament.startDate = firstValue_(tournament.startDate, row.start_date, "");
  tournament.endDate = firstValue_(tournament.endDate, row.end_date, "");
  tournament.registrationDeadline = firstValue_(
    tournament.registrationDeadline,
    row.registration_deadline,
    ""
  );
  tournament.visibility = firstValue_(tournament.visibility, row.visibility, "");
  tournament.status = firstValue_(tournament.status, row.status, "");
  tournament.organizerUsername = firstNonEmpty_(
    tournament.organizerUsername,
    row.organizer_username
  );
  tournament.ownerUsername = firstNonEmpty_(
    tournament.ownerUsername,
    tournament.organizerUsername
  );
  tournament.createdAt = firstValue_(tournament.createdAt, row.created_at, "");
  tournament.publicCode = firstNonEmpty_(tournament.publicCode, row.public_code);
  tournament.published = truthy_(firstValue_(row.published, tournament.published, false));
  tournament.publishedAt = firstValue_(tournament.publishedAt, row.published_at, "");
  tournament.updatedAt = firstValue_(tournament.updatedAt, row.updated_at, "");
  tournament.groups = Array.isArray(tournament.groups) ? tournament.groups : [];
  tournament.matches = Array.isArray(tournament.matches) ? tournament.matches : [];
  tournament.series = Array.isArray(tournament.series) ? tournament.series : [];
  tournament.knockout = tournament.knockout || {};

  return tournament.id ? tournament : null;
}

function supabaseTournamentRowFromTournament_(tournament) {
  return {
    legacy_tournament_id: tournament.id || tournament.tournamentId || tournament.TournamentId || "",
    name: tournament.name || "Untitled tournament",
    country: supabaseDbText_(tournament.country),
    city: supabaseDbText_(tournament.city),
    start_date: supabaseDbText_(tournament.startDate),
    end_date: supabaseDbText_(tournament.endDate),
    registration_deadline: supabaseDbText_(tournament.registrationDeadline),
    visibility: supabaseDbText_(tournament.visibility),
    status: supabaseDbText_(tournament.status || "draft"),
    organizer_username: supabaseDbText_(tournament.organizerUsername),
    public_code: supabaseDbText_(tournament.publicCode),
    published: truthy_(tournament.published),
    published_at: supabaseDbText_(tournament.publishedAt),
    tournament_json: tournament,
    created_at: supabaseDbText_(tournament.createdAt),
    updated_at: supabaseDbText_(tournament.updatedAt)
  };
}

function supabaseFindTournamentById_(config, id) {
  var target = String(id || "").trim();
  if (!target) return null;
  var rows = supabaseSelectRows_(config, "tournaments", {
    legacy_tournament_id: target
  }, "*");
  return rows && rows[0] ? rows[0] : null;
}

function supabaseFindTournamentByPublicCode_(config, publicCode) {
  var target = String(publicCode || "").trim();
  if (!target) return null;
  var rows = supabaseSelectRows_(config, "tournaments", {
    public_code: target
  }, "*");
  if (rows && rows[0]) return rows[0];
  var lowerTarget = target.toLowerCase();
  rows = supabaseSelectRows_(config, "tournaments", {}, "*");
  return (rows || []).find(function(row) {
    return String(row.public_code || "").trim().toLowerCase() === lowerTarget;
  }) || null;
}

function supabaseAuthorizeTournamentRow_(row, user) {
  var tournament = supabaseTournamentFromRow_(row);
  var owner = String((tournament && tournament.organizerUsername) || row.organizer_username || "").trim();
  var username = tournamentUsername_(user);
  if (!owner || !username || owner !== username) {
    throw new Error("Access denied");
  }
  return tournament;
}

function supabaseTournamentIsPublished_(tournament) {
  if (!tournament) return false;
  return (
    truthy_(tournament.published) ||
    String(tournament.status || "").trim().toLowerCase() === "published"
  );
}

function supabaseTournamentIsPublicListed_(tournament) {
  if (!tournament) return false;
  var isListed =
    truthy_(tournament.publicListingEnabled) ||
    truthy_(tournament.listPublicly) ||
    truthy_(tournament.publicListed);
  return supabaseTournamentIsPublished_(tournament) && isListed && String(tournament.publicCode || "").trim();
}

function supabaseListTournaments_(user) {
  var username = tournamentUsername_(user);
  if (!username) return [];
  var config = supabaseTournamentConfig_();
  return supabaseSelectRows_(config, "tournaments", {
    organizer_username: username
  }, "*")
    .map(supabaseTournamentFromRow_)
    .filter(Boolean);
}

function supabaseListPublicTournaments_() {
  var config = supabaseTournamentConfig_();
  return supabaseSelectRows_(config, "tournaments", {}, "*")
    .map(supabaseTournamentFromRow_)
    .filter(supabaseTournamentIsPublicListed_)
    .sort(function(a, b) {
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

function supabaseGetTournament_(data, user) {
  var config = supabaseTournamentConfig_();
  var row = supabaseFindTournamentById_(config, data.tournamentId || data.TournamentId || data.id);
  if (!row) return null;
  return supabaseAuthorizeTournamentRow_(row, user);
}

function supabaseGetPublicTournament_(publicCode) {
  var config = supabaseTournamentConfig_();
  var row = supabaseFindTournamentByPublicCode_(config, publicCode);
  if (!row) return null;
  var tournament = supabaseTournamentFromRow_(row);
  return supabaseTournamentIsPublished_(tournament) ? tournament : null;
}

function supabaseUpsertTournament_(data, user, mode) {
  var config = supabaseTournamentConfig_();
  var now = nowIso_();
  var username = tournamentUsername_(user);
  var incoming = parseTournament_(data);
  if (!incoming.id) {
    throw new Error("Missing tournament id");
  }

  var existingRow = supabaseFindTournamentById_(config, incoming.id);
  var existingTournament = existingRow ? supabaseAuthorizeTournamentRow_(existingRow, user) || {} : {};
  var tournament = Object.assign({}, existingTournament, incoming);
  if (!tournament.name) tournament.name = "Untitled tournament";

  var owner = existingRow
    ? String(existingRow.organizer_username || "").trim()
    : username;
  tournament.organizerUsername = owner;
  tournament.ownerUsername = owner;
  tournament.createdAt = firstNonEmpty_(tournament.createdAt, existingRow && existingRow.created_at, now);
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

  var rows = supabaseUpsertRows_(
    config,
    "tournaments",
    [supabaseTournamentRowFromTournament_(tournament)],
    "legacy_tournament_id"
  );
  if (mode !== "save") {
    supabaseAuditLog_(config, username, mode, "tournaments", tournament.id, {
      name: tournament.name
    });
  }
  return rows && rows[0] ? supabaseTournamentFromRow_(rows[0]) : tournament;
}

function supabaseDeleteTournament_(data, user) {
  var config = supabaseTournamentConfig_();
  var tournamentId = String(data.tournamentId || data.TournamentId || data.id || "").trim();
  if (!tournamentId) throw new Error("Missing tournamentId");
  var row = supabaseFindTournamentById_(config, tournamentId);
  if (!row) {
    return {
      success: true,
      deleted: false,
      tournamentId: tournamentId
    };
  }
  var tournament = supabaseAuthorizeTournamentRow_(row, user);
  var status = String((tournament && tournament.status) || row.status || "draft").trim().toLowerCase();
  if (supabaseTournamentIsPublished_(tournament) || status === "published") {
    throw new Error("Published tournaments must be unpublished before deletion.");
  }
  supabaseDeleteRows_(config, "tournaments", { legacy_tournament_id: tournamentId });
  supabaseAuditLog_(config, tournamentUsername_(user), "deleteTournament", "tournaments", tournamentId, {
    name: tournament && tournament.name || ""
  });
  return {
    success: true,
    deleted: true,
    tournamentId: tournamentId
  };
}

function supabaseCleanupMyDraftTournaments_(data, user) {
  var config = supabaseTournamentConfig_();
  var username = tournamentUsername_(user);
  var nameContains = String(data.nameContains || "").trim().toLowerCase();
  var rows = supabaseSelectRows_(config, "tournaments", {
    organizer_username: username
  }, "*");
  var deletedCount = 0;
  (rows || []).forEach(function(row) {
    var tournament = supabaseTournamentFromRow_(row) || {};
    var status = String(row.status || tournament.status || "draft").trim().toLowerCase();
    if (supabaseTournamentIsPublished_(tournament) || status === "published") return;
    if (status !== "draft" && status !== "unpublished") return;
    if (nameContains) {
      var name = String(row.name || tournament.name || "").trim().toLowerCase();
      if (name.indexOf(nameContains) === -1) return;
    }
    supabaseDeleteRows_(config, "tournaments", {
      legacy_tournament_id: row.legacy_tournament_id
    });
    deletedCount += 1;
  });
  if (deletedCount > 0) {
    supabaseAuditLog_(config, username, "cleanupMyDraftTournaments", "tournaments", "", {
      deletedCount: deletedCount
    });
  }
  return {
    success: true,
    deletedCount: deletedCount
  };
}

function supabaseHandleTournamentAction_(action, data) {
  if (action === "getPublicTournament") {
    return supabaseTournamentResponse_({
      success: true,
      tournament: supabaseGetPublicTournament_(data.publicCode || data.PublicCode)
    });
  }

  if (action === "listPublicTournaments") {
    return supabaseTournamentResponse_({
      success: true,
      tournaments: supabaseListPublicTournaments_()
    });
  }

  var user = requireTournamentUser_(data);
  if (!user) {
    return supabaseTournamentResponse_({
      success: false,
      message: "Login required"
    });
  }

  if (!userCanUseTournaments_(user)) {
    return supabaseTournamentResponse_({
      success: false,
      message: "Tournament access required"
    });
  }

  if (action === "listTournaments") {
    return supabaseTournamentResponse_({
      success: true,
      tournaments: supabaseListTournaments_(user)
    });
  }

  if (action === "getTournament") {
    return supabaseTournamentResponse_({
      success: true,
      tournament: supabaseGetTournament_(data, user)
    });
  }

  if (action === "saveTournament") {
    return supabaseTournamentResponse_({
      success: true,
      tournament: supabaseUpsertTournament_(data, user, "save")
    });
  }

  if (action === "publishTournament") {
    return supabaseTournamentResponse_({
      success: true,
      tournament: supabaseUpsertTournament_(data, user, "publish")
    });
  }

  if (action === "unpublishTournament") {
    return supabaseTournamentResponse_({
      success: true,
      tournament: supabaseUpsertTournament_(data, user, "unpublish")
    });
  }

  if (action === "deleteTournament") {
    return supabaseTournamentResponse_(supabaseDeleteTournament_(data, user));
  }

  if (action === "cleanupMyDraftTournaments") {
    return supabaseTournamentResponse_(supabaseCleanupMyDraftTournaments_(data, user));
  }

  return supabaseTournamentResponse_({
    success: false,
    message: "Unknown tournament action"
  });
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
