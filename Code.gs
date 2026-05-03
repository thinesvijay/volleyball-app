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
  var normalizedUsername = String(username || "").trim();
  var normalizedPassword = String(password || "").trim();

  if (!normalizedUsername || !normalizedPassword) return null;

  var users = getUserRecords();

  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    if (
      user.active &&
      user.role !== "archived" &&
      user.username === normalizedUsername &&
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

function openSpreadsheetForUser(user) {
  if (!user || !user.spreadsheetId) {
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
