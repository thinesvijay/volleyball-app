import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

const API =
  "https://script.google.com/macros/s/AKfycbx9FWReNsr6vJam6b02OCf96K482opSh_SPZVSeBqoTs65M7S2E1ZGZXt9qGUMzpE2dDw/exec";

const ROUND_CACHE_KEY = "volleyball-current-round";
const ROUND_SAVE_KEY = "volleyball-saved-round";
const AUTH_STORAGE_KEY = "volleyball-auth";
const SKILL_VIEW_KEY = "volleyball-skill-view";
const SKILL_SCALE_KEY = "volleyball-skill-scale";
const TEAM_SKILL_VISIBILITY_KEY = "volleyball-team-skill-visibility";
const TEAM_LOCK_VISIBILITY_KEY = "volleyball-team-lock-visibility";
const MATCH_METHOD_KEY = "volleyball-match-method";
const PLAYER_SORT_KEY = "volleyball-player-sort";
const CURRENT_ROUND_TTL_MS = 60 * 60 * 1000;
const SAVED_ROUND_TTL_MS = 6 * 60 * 60 * 1000;

const SKILL_SCALE_OPTIONS = [3, 5];
const TRAINER_COPY_OPTIONS_BASE = [
  { value: "blank", key: "blankSheet" },
  { value: "main", key: "copyPlayersFromMainSheet" },
  { value: "trainer", key: "copyPlayersFromExistingTrainer" },
];
const MATCH_METHOD_OPTIONS = [
  { value: "balanced" },
  { value: "shuffle" },
];

const CLUB_OPTIONS = [
  "Bergen Vest",
  "Drammen",
  "Furuset",
  "Haried",
  "LTSK",
  "Nanbargal",
  "New Star",
  "Sangam",
  "Senkathir",
  "Sevvanam",
  "Other",
];

const DEFAULT_VISIBLE_ACTIONS = {
  saveRound: true,
  clearSaved: true,
  skillToggle: true,
  lockToggle: true,
  export: false,
};

function getToolbarSettingsStorageKey(username) {
  return `volleyball-visible-actions-${String(username || "guest").trim()}`;
}

function getLanguageStorageKey(username) {
  return `volleyball-language-${String(username || "guest").trim()}`;
}

const TRANSLATIONS = {
  en: {
    trainer: "Trainer",
    logout: "Logout",
    loginOk: "Login ok.",
    trainerLogin: "Trainer Login",
    loginRequired: "Login required to view players",
    username: "Username",
    password: "Password",
    login: "Login",
    loggingIn: "Logging in...",
    players: "Players",
    teams: "Teams",
    numberOfTeams: "Number of Teams",
    selected: "Selected",
    skillView: "Skill View",
    skillScale: "Skill Scale",
    sort: "Sort",
    club: "Club",
    all: "All",
    addPlayer: "Add Player",
    archived: "Archived",
    manage: "Manage",
    done: "Done",
    savePlayer: "Save Player",
    edit: "Edit",
    archive: "Archive",
    restore: "Restore",
    noArchivedPlayers: "No archived players.",
    newRound: "New Round",
    saveRound: "Save Round",
    matchMode: "Match Mode",
    hideMatch: "Hide Match",
    clearSaved: "Clear Saved",
    showSkill: "Show Skill",
    hideSkill: "Hide Skill",
    toolbarSettings: "Toolbar Settings",
    removePlayer: "Remove Player",
    moveHere: "Move Here",
    lock: "Lock",
    unlock: "Unlock",
    editPlayer: "Edit Player",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    removePlayerFromCurrentTeams: "Remove player from current teams",
    noPlayersToRemove: "No players to remove",
    addPlayerToCurrentTeams: "Add player to current teams",
    noPlayersAvailable: "No players available",
    add: "Add",
    noClub: "No Club",
    export: "Export",
    skillToggleLabel: "Skill Toggle",
    lockToggleLabel: "Lock Toggle",
    generateTeams: "Generate Teams",
    generating: "Generating...",
    hideArchived: "Hide Archived",
    archivedPlayers: "Archived Players",
    saving: "Saving...",
    selectClub: "Select club",
    customClubName: "Custom club name",
    playerName: "Player name",
    saveShare: "Save / Share",
    method: "Method",
    courts: "Courts",
    prevRound: "Prev Round",
    nextRound: "Next Round",
    noMatchesAvailable: "No matches available.",
    selectMove: "Select move",
    createTrainer: "Create Trainer",
    newTrainer: "New Trainer",
    creating: "Creating...",
    trainerUsernamePlaceholder: "Trainer username",
    trainerPasswordPlaceholder: "Trainer password",
    selectTrainer: "Select trainer",
    openSheet: "Open sheet",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    deactivate: "Deactivate",
    activate: "Activate",
    resetPassword: "Reset Password",
    newPassword: "New password",
    archivedTrainers: "Archived Trainers",
    createTrainerSubtitle: "Creates a new trainer and Google Sheet automatically",
    skillViewNumbers: "Numbers",
    skillViewColors: "Colors",
    copyPlayers: "Copy players",
    blankSheet: "Blank sheet",
    copyPlayersFromMainSheet: "Copy players from main sheet",
    copyPlayersFromExistingTrainer: "Copy players from existing trainer",
    usernameLabel: "Username:",
    spreadsheetIdLabel: "Spreadsheet ID:",
    copyModeLabel: "Copy mode:",
    openTrainerSheet: "Open trainer sheet",
    trainerUsersTitle: "Trainer Users",
    trainerUsersSubtitle: "Admin can activate, deactivate, reset passwords and archive trainers",
    noActiveTrainers: "No active trainers yet.",
    archivedTrainersSubtitle: "Archived trainers can be restored later",
    noArchivedTrainers: "No archived trainers.",
    archivedStatus: "Archived",
    playersLoginRequired: "Log in as admin or trainer to view the player list.",
    teamsLoginRequired: "Log in as admin or trainer to use Teams.",
    roundLabel: "Round",
    ofLabel: "of",
    courtLabel: "Court",
    vsLabel: "vs",
    enterUsernamePassword: "Please enter username and password.",
    loginFailed: "Login failed.",
    selectTrainerToCopy: "Select a trainer to copy from.",
    couldNotCreateTrainer: "Could not create trainer.",
    trainerCreated: "Trainer created.",
    trainerActivated: "Trainer activated.",
    trainerDeactivated: "Trainer deactivated.",
    enterNewPasswordFirst: "Enter a new password first.",
    couldNotResetPassword: "Could not reset password.",
    passwordResetOk: "Password reset ok.",
    archiveTrainerConfirm: "Are you sure you want to archive trainer",
    trainerArchived: "Trainer archived.",
    couldNotArchiveTrainer: "Could not archive trainer.",
    trainerRestored: "Trainer restored.",
    couldNotRestoreTrainer: "Could not restore trainer.",
    archivePlayerConfirm: "Archive player",
    couldNotArchivePlayer: "Could not archive player.",
    playerArchived: "Player archived.",
    couldNotRestorePlayer: "Could not restore player.",
    playerRestored: "Player restored.",
    roundSavedForSixHours: "Round saved for 6 hours on this device.",
    couldNotSaveRound: "Could not save round.",
    savedRoundCleared: "Saved round cleared on this device.",
    couldNotSavePlayer: "Could not save player.",
    couldNotUpdatePlayer: "Could not update player.",
    pointsLabel: "pt",
    appTitle: "Make Teams Pro",
    appSubtitle: "Thines Vijay ©",
    matchPattern: "Pattern",
    matchShuffle: "Shuffle",
    otherClub: "Other",
    loadingShort: "...",
  },
  no: {
    trainer: "Trener",
    logout: "Logg ut",
    loginOk: "Innlogging ok.",
    trainerLogin: "Trenerinnlogging",
    loginRequired: "Innlogging kreves for å se spillere",
    username: "Brukernavn",
    password: "Passord",
    login: "Logg inn",
    loggingIn: "Logger inn...",
    players: "Spillere",
    teams: "Lag",
    numberOfTeams: "Antall lag",
    selected: "Valgt",
    skillView: "Visning",
    skillScale: "Nivåskala",
    sort: "Sortering",
    club: "Klubb",
    all: "Alle",
    addPlayer: "Legg til spiller",
    archived: "Arkiv",
    manage: "Administrer",
    done: "Ferdig",
    savePlayer: "Lagre spiller",
    edit: "Rediger",
    archive: "Arkiver",
    restore: "Gjenopprett",
    noArchivedPlayers: "Ingen arkiverte spillere.",
    newRound: "Ny runde",
    saveRound: "Lagre runde",
    matchMode: "Kampmodus",
    hideMatch: "Skjul kampmodus",
    clearSaved: "Tøm lagret",
    showSkill: "Vis nivå",
    hideSkill: "Skjul nivå",
    toolbarSettings: "Verktøylinje",
    removePlayer: "Fjern spiller",
    moveHere: "Flytt hit",
    lock: "Lås",
    unlock: "Lås opp",
    editPlayer: "Rediger spiller",
    cancel: "Avbryt",
    save: "Lagre",
    close: "Lukk",
    removePlayerFromCurrentTeams: "Fjern spiller fra dagens lag",
    noPlayersToRemove: "Ingen spillere å fjerne",
    addPlayerToCurrentTeams: "Legg til spiller i dagens lag",
    noPlayersAvailable: "Ingen tilgjengelige spillere",
    add: "Legg til",
    noClub: "Ingen klubb",
    export: "Eksporter",
    skillToggleLabel: "Nivå-knapp",
    lockToggleLabel: "Lås-knapp",
    generateTeams: "Generer lag",
    generating: "Genererer...",
    hideArchived: "Skjul arkiv",
    archivedPlayers: "Arkiverte spillere",
    saving: "Lagrer...",
    selectClub: "Velg klubb",
    customClubName: "Tilpasset klubbnavn",
    playerName: "Spillernavn",
    saveShare: "Lagre / Del",
    method: "Metode",
    courts: "Baner",
    prevRound: "Forrige runde",
    nextRound: "Neste runde",
    noMatchesAvailable: "Ingen kamper tilgjengelig.",
    selectMove: "Velg flytt",
    createTrainer: "Opprett trener",
    newTrainer: "Ny trener",
    creating: "Oppretter...",
    trainerUsernamePlaceholder: "Trener-brukernavn",
    trainerPasswordPlaceholder: "Trener-passord",
    selectTrainer: "Velg trener",
    openSheet: "Åpne ark",
    activeStatus: "Aktiv",
    inactiveStatus: "Inaktiv",
    deactivate: "Deaktiver",
    activate: "Aktiver",
    resetPassword: "Nullstill passord",
    newPassword: "Nytt passord",
    archivedTrainers: "Arkiverte trenere",
    createTrainerSubtitle: "Opprett en ny trener og Google Sheet automatisk",
    skillViewNumbers: "Tall",
    skillViewColors: "Farger",
    copyPlayers: "Kopier spillere",
    blankSheet: "Tomt ark",
    copyPlayersFromMainSheet: "Kopier spillere fra hovedarket",
    copyPlayersFromExistingTrainer: "Kopier spillere fra eksisterende trener",
    usernameLabel: "Brukernavn:",
    spreadsheetIdLabel: "Google Sheet ID:",
    copyModeLabel: "Kopieringsmodus:",
    openTrainerSheet: "Åpne trenerark",
    trainerUsersTitle: "Trenere",
    trainerUsersSubtitle: "Admin kan aktivere, deaktivere, tilbakestille passord og arkivere trenere",
    noActiveTrainers: "Ingen aktive trenere ennå.",
    archivedTrainersSubtitle: "Arkiverte trenere kan gjenopprettes senere",
    noArchivedTrainers: "Ingen arkiverte trenere.",
    archivedStatus: "Arkivert",
    playersLoginRequired: "Logg inn som admin eller trener for å se spillerlisten.",
    teamsLoginRequired: "Logg inn som admin eller trener for å bruke Lag.",
    roundLabel: "Runde",
    ofLabel: "av",
    courtLabel: "Bane",
    vsLabel: "mot",
    enterUsernamePassword: "Vennligst skriv inn brukernavn og passord.",
    loginFailed: "Innlogging mislyktes.",
    selectTrainerToCopy: "Velg en trener å kopiere fra.",
    couldNotCreateTrainer: "Kunne ikke opprette trener.",
    trainerCreated: "Trener opprettet.",
    trainerActivated: "Trener aktivert.",
    trainerDeactivated: "Trener deaktivert.",
    enterNewPasswordFirst: "Skriv inn nytt passord først.",
    couldNotResetPassword: "Kunne ikke tilbakestille passord.",
    passwordResetOk: "Passord tilbakestilt ok.",
    archiveTrainerConfirm: "Er du sikker på at du vil arkivere trener",
    trainerArchived: "Trener arkivert.",
    couldNotArchiveTrainer: "Kunne ikke arkivere trener.",
    trainerRestored: "Trener gjenopprettet.",
    couldNotRestoreTrainer: "Kunne ikke gjenopprette trener.",
    archivePlayerConfirm: "Arkiver spiller",
    couldNotArchivePlayer: "Kunne ikke arkivere spiller.",
    playerArchived: "Spiller arkivert.",
    couldNotRestorePlayer: "Kunne ikke gjenopprette spiller.",
    playerRestored: "Spiller gjenopprettet.",
    roundSavedForSixHours: "Runde lagret i 6 timer på denne enheten.",
    couldNotSaveRound: "Kunne ikke lagre runde.",
    savedRoundCleared: "Lagret runde slettet fra denne enheten.",
    couldNotSavePlayer: "Kunne ikke lagre spiller.",
    couldNotUpdatePlayer: "Kunne ikke oppdatere spiller.",
    pointsLabel: "poeng",
    appTitle: "Make Teams Pro",
    appSubtitle: "Thines Vijay ©",
    matchPattern: "Mønster",
    matchShuffle: "Bland",
    otherClub: "Annet",
    loadingShort: "...",
  },
};

function getPlayerViewModeStorageKey(username) {
  return `volleyball-player-view-mode-${String(username || "guest").trim()}`;
}

function normalizeTeamName(index, existingName, language = "en") {
  const trimmed = String(existingName || "").trim();
  const fallbackLetter = String.fromCharCode(65 + index);
  const prefix = language === "no" ? "Lag" : "Team";

  if (!trimmed) {
    return `${prefix} ${fallbackLetter}`;
  }

  const match = trimmed.match(/^(Team|Lag)\s+([A-Z])$/i);
  if (match) {
    return `${prefix} ${match[2].toUpperCase()}`;
  }

  return trimmed;
}

function normalizeTeams(rawTeams, language = "en") {
  if (!Array.isArray(rawTeams)) return [];

  return rawTeams.map((team, index) => ({
    ...team,
    name: normalizeTeamName(index, team?.name, language),
    players: Array.isArray(team?.players)
      ? team.players.map((player) => ({
          ...player,
          skill: Number(player.skill) || 1,
          locked: Boolean(player.locked),
          cannot: Array.isArray(player.cannot) ? player.cannot : [],
          club: String(player.club || "").trim(),
        }))
      : [],
  }));
}

function buildStoragePayload(teams, teamCount) {
  return {
    expiresAt: Date.now(),
    teamCount,
    teams,
  };
}

function getRoundStorageKey(baseKey, auth) {
  const username =
    auth?.loggedIn && auth?.username ? String(auth.username).trim() : "guest";
  return `${baseKey}-${username}`;
}

function readStorageWithTtl(key, ttlMs, language = "en") {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || !parsed?.teams) {
      localStorage.removeItem(key);
      return null;
    }

    if (Date.now() - parsed.expiresAt > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      teams: normalizeTeams(parsed.teams, language),
      teamCount: Number(parsed.teamCount) || 2,
    };
  } catch (error) {
    console.error("Could not read storage:", error);
    localStorage.removeItem(key);
    return null;
  }
}

function createRoundRobinSchedule(teamNames) {
  if (!Array.isArray(teamNames) || teamNames.length < 2) return [];

  const entries = [...teamNames];
  if (entries.length % 2 === 1) {
    entries.push("BYE");
  }

  const rounds = [];
  let rotation = [...entries];

  for (let roundIndex = 0; roundIndex < rotation.length - 1; roundIndex += 1) {
    const matches = [];

    for (let i = 0; i < rotation.length / 2; i += 1) {
      const team1 = rotation[i];
      const team2 = rotation[rotation.length - 1 - i];

      if (team1 !== "BYE" && team2 !== "BYE") {
        matches.push({ team1, team2 });
      }
    }

    rounds.push(matches);

    const first = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop());
    rotation = [first, ...rest];
  }

  return rounds;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildShuffleMatchRounds(teamNames, requestedCourtCount = 2) {
  const baseRounds = createRoundRobinSchedule(teamNames);
  if (!baseRounds.length) return [];

  return baseRounds.map((round) => {
    const shuffledMatches = shuffleArray(round);
    const usableCourts = Math.max(
      1,
      Math.min(Number(requestedCourtCount) || 2, shuffledMatches.length)
    );

    return shuffledMatches.map((match, index) => {
      const reversed = Math.random() < 0.5;
      const leftTeam = reversed ? match.team2 : match.team1;
      const rightTeam = reversed ? match.team1 : match.team2;

      return {
        court: (index % usableCourts) + 1,
        leftTeam,
        rightTeam,
        originalTeam1: match.team1,
        originalTeam2: match.team2,
      };
    });
  });
}

function buildBalancedMatchRounds(teamNames, requestedCourtCount = 2) {
  const baseRounds = createRoundRobinSchedule(teamNames);
  if (!baseRounds.length) return [];

  const maxMatchesInAnyRound = Math.max(
    ...baseRounds.map((round) => round.length),
    1
  );

  const usableCourts = Math.max(
    1,
    Math.min(Number(requestedCourtCount) || 2, maxMatchesInAnyRound)
  );

  return baseRounds.map((round) => {
    const shuffledRound = shuffleArray(round);

    return shuffledRound.map((match, index) => {
      const court = (index % usableCourts) + 1;
      const reversed = Math.random() < 0.5;
      const leftTeam = reversed ? match.team2 : match.team1;
      const rightTeam = reversed ? match.team1 : match.team2;

      return {
        court,
        leftTeam,
        rightTeam,
        originalTeam1: match.team1,
        originalTeam2: match.team2,
      };
    });
  });
}

function getSkillOptions(scale) {
  const parsedScale = Number(scale) || 5;
  const maxScale = Math.max(1, parsedScale);
  return Array.from({ length: maxScale }, (_, index) => index + 1);
}

function getSkillStyle(skill, skillView, skillScale) {
  const value = Number(skill) || 1;
  const maxScale = Math.max(1, Number(skillScale) || 5);
  const normalized = Math.max(
    0,
    Math.min(1, (value - 1) / Math.max(maxScale - 1, 1))
  );

  if (skillView === "colors") {
    if (normalized <= 0.2) {
      return { background: "#dc2626", color: "#fff", text: "" };
    }
    if (normalized <= 0.4) {
      return { background: "#f97316", color: "#fff", text: "" };
    }
    if (normalized <= 0.6) {
      return { background: "#eab308", color: "#111827", text: "" };
    }
    if (normalized <= 0.8) {
      return { background: "#22c55e", color: "#fff", text: "" };
    }
    return { background: "#2563eb", color: "#fff", text: "" };
  }

  return {
    background: "#111827",
    color: "#fff",
    text: String(value),
  };
}

function buildQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

function getDefaultAuth() {
  return {
    username: "",
    password: "",
    loggedIn: false,
    role: "guest",
  };
}

function getDefaultTournamentConfig() {
  return {
    format: "group-stage",
    totalTeams: 10,
    groupCount: 2,
    teamsPerGroup: 5,
    qualifiersPerGroup: 2,
    bracketSize: 4,
    thirdPlaceMatch: false,
    startTime: "09:00",
    courtCount: 3,
    groupMatchMinutes: 12,
    playoffMatchMinutes: 15,
    breakMinutes: 3,
    displaySettings: {
      showScores: true,
      showDates: false,
      showLocations: false,
      showRoundTitles: true,
    },
    groups: [],
    knockout: {
      quarterFinals: [],
      semiFinals: [],
      final: null,
      thirdPlace: null,
    },
    matches: [],
  };
}

function applyTournamentDefaults(tournament) {
  const defaults = getDefaultTournamentConfig();
  if (!tournament) return defaults;

  return {
    ...defaults,
    ...tournament,
    displaySettings: {
      ...defaults.displaySettings,
      ...(tournament.displaySettings || {}),
    },
    groups: Array.isArray(tournament.groups) ? tournament.groups : [],
    knockout: {
      ...defaults.knockout,
      ...(tournament.knockout || {}),
      quarterFinals: Array.isArray(tournament?.knockout?.quarterFinals)
        ? tournament.knockout.quarterFinals
        : [],
      semiFinals: Array.isArray(tournament?.knockout?.semiFinals)
        ? tournament.knockout.semiFinals
        : [],
    },
    matches: Array.isArray(tournament.matches) ? tournament.matches : [],
  };
}

function getTournamentGroupCode(index) {
  return String.fromCharCode(65 + index);
}

function buildGroupPositionSource(groupCode, position) {
  return `${groupCode}${position}`;
}

function displayPlayerName(player) {
  const club = String(player?.club || "").trim();
  const name = String(player?.name || "").trim();
  if (!club) return name;
  return `${club} ${name}`;
}

export default function App() {
  const [players, setPlayers] = useState([]);
  const [archivedPlayers, setArchivedPlayers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamCount, setTeamCount] = useState(2);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("players");
  const [dragging, setDragging] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : true
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSkill, setNewPlayerSkill] = useState(1);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSkill, setEditSkill] = useState(1);
  const [savingPlayer, setSavingPlayer] = useState(false);

  const [matchMode, setMatchMode] = useState(false);
  const [courtCount, setCourtCount] = useState(2);
  const [matchRoundIndex, setMatchRoundIndex] = useState(0);
  const [matchMethod, setMatchMethod] = useState(() => {
    if (typeof window === "undefined") return "balanced";
    const saved = localStorage.getItem(MATCH_METHOD_KEY) || "balanced";
    return saved === "random" ? "shuffle" : saved;
  });

  const [showSkillInTeams, setShowSkillInTeams] = useState(() => {
    if (typeof window === "undefined") return true;
    const raw = localStorage.getItem(TEAM_SKILL_VISIBILITY_KEY);
    return raw === null ? true : raw === "true";
  });

  const [showLockInTeams, setShowLockInTeams] = useState(() => {
    if (typeof window === "undefined") return true;
    const raw = localStorage.getItem(TEAM_LOCK_VISIBILITY_KEY);
    return raw === null ? true : raw === "true";
  });

  const [playerSortMode, setPlayerSortMode] = useState(() => {
    if (typeof window === "undefined") return "name";
    const raw = localStorage.getItem(PLAYER_SORT_KEY) || "name";
    return raw === "recent" ? "recent" : "name";
  });

  const [showArchivedPlayers, setShowArchivedPlayers] = useState(false);
  const [playerActionMessage, setPlayerActionMessage] = useState("");
  const [showPlayerManageActions, setShowPlayerManageActions] = useState(false);

  const [showCreateTrainerForm, setShowCreateTrainerForm] = useState(false);
  const [trainerUsername, setTrainerUsername] = useState("");
  const [trainerPassword, setTrainerPassword] = useState("");
  const [trainerSkillView, setTrainerSkillView] = useState("numbers");
  const [trainerSkillScale, setTrainerSkillScale] = useState(5);
  const [trainerCopyMode, setTrainerCopyMode] = useState("main");
  const [copyFromTrainerUsername, setCopyFromTrainerUsername] = useState("");
  const [creatingTrainer, setCreatingTrainer] = useState(false);
  const [createTrainerMessage, setCreateTrainerMessage] = useState("");
  const [createdTrainerInfo, setCreatedTrainerInfo] = useState(null);

  const [trainerUsers, setTrainerUsers] = useState([]);
  const [trainerPasswords, setTrainerPasswords] = useState({});
  const [trainerActionMessage, setTrainerActionMessage] = useState("");

  const [mobileMoveSelection, setMobileMoveSelection] = useState(null);

  const exportRef = useRef(null);
  const [showAddToTeamsModal, setShowAddToTeamsModal] = useState(false);
  const [showExportView, setShowExportView] = useState(false);
  const [showToolbarSettings, setShowToolbarSettings] = useState(false);
  const [showRemoveFromTeamsModal, setShowRemoveFromTeamsModal] =
    useState(false);

  const [visibleActions, setVisibleActions] = useState(DEFAULT_VISIBLE_ACTIONS);
  const [playerViewMode, setPlayerViewMode] = useState("all");
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(getLanguageStorageKey("guest")) || "en";
  });
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const tournamentText = language === "no" ? {
    tabTitle: "Turneringer",
    loginRequired: "Innlogging kreves for å administrere turneringer",
    createTitle: "Opprett turnering",
    createSubtitle: "Opprett en ny turnering",
    newTournament: "Ny turnering",
    namePlaceholder: "Turneringsnavn",
    rulesPlaceholder: "Turneringsregler (valgfritt)",
    createButton: "Opprett turnering",
    enterName: "Vennligst skriv inn et turneringsnavn.",
    createdOk: "Turnering opprettet.",
    listTitle: "Turneringer",
    emptyList: "Ingen turneringer ennå.",
    detailsTitle: "Turneringsdetaljer",
    noSelection: "Velg en turnering for å se detaljer.",
    nameLabel: "Navn:",
    statusLabel: "Status:",
    rulesLabel: "Regler:",
    createdLabel: "Opprettet:",
    noRules: "Ingen regler spesifisert.",
    draft: "Utkast",
    editTeam: "Rediger",
    deleteTeam: "Slett",
    saveTeam: "Lagre",
    cancelEdit: "Avbryt",
    teamNameRequired: "Skriv inn lagnavn.",
    teamUpdated: "Lag oppdatert.",
    teamDeleted: "Lag slettet.",
    confirmDeleteTeam: "Slette dette laget?",
    lockTeam: "Lås",
    unlockTeam: "Lås opp",
    teamEditLocked: "Laget er låst.",
    publish: "Publiser",
    unpublish: "Avpubliser",
    published: "Publisert",
    unpublished: "Upublisert",
    publishedOk: "Turnering publisert.",
    unpublishedOk: "Turnering avpublisert.",
    publicPreviewTitle: "Offentlig forhåndsvisning",
    publicPreviewSubtitle: "Skrivebeskyttet visning av publisert turnering",
    noTeamsInPreview: "Ingen lag publisert ennå.",
    noPlayersInPreview: "Ingen spillere ennå.",
    generateBasicMatches: "Generer enkle kamper",
    matchesTitle: "Kamper",
    notEnoughTeamsForMatches: "Minst 2 lag kreves for å generere kamper.",
    matchesGenerated: "Kamper generert.",
    noMatchesYet: "Ingen kamper ennå.",
    standingsTitle: "Tabell",
    playedShort: "K",
    winsShort: "V",
    drawsShort: "U",
    lossesShort: "T",
    pointsShort: "P",
    scoreForShort: "MF",
    scoreAgainstShort: "MM",
    scoreDiffShort: "DIFF",
    noStandingsYet: "Ingen tabell ennå.",
    matchStatusCompleted: "Ferdig",
    matchStatusScheduled: "Planlagt",
    winnerLabel: "Vinner",
    runnerUpLabel: "Toer",
    builderTitle: "Turneringsbygger",
    builderSubtitle: "Planlegg format, grupper og sluttspill",
    informationSection: "Turneringsinformasjon",
    formatSection: "Turneringsformat",
    participantsSection: "Deltakere / Lag",
    settingsSection: "Turneringsinnstillinger",
    previewSection: "Visuell turneringsforhåndsvisning",
    groupStagePreview: "Gruppespill",
    knockoutPreview: "Sluttspill",
    formatLabel: "Format",
    formatGroupStage: "Gruppespill",
    formatRoundRobin: "Seriespill",
    formatSingleElimination: "Enkel utslag",
    groupCountLabel: "Antall grupper",
    bracketSizeLabel: "Brakettstørrelse",
    thirdPlaceLabel: "Bronsekamp",
    generateGroups: "Generer grupper",
    generateKnockout: "Generer sluttspill",
    regenerateStructure: "Oppdater struktur",
    noGroupsYet: "Ingen grupper ennå.",
    noKnockoutYet: "Ingen sluttspillstruktur ennå.",
    semiFinals: "Semifinaler",
    final: "Finale",
    thirdPlace: "Bronsekamp",
    showScores: "Vis score",
    showDates: "Vis datoer",
    showLocations: "Vis steder",
    showRoundTitles: "Vis rundenavn",
    teamManagementTitle: "Lagadministrasjon",
    addTeamButton: "Legg til lag",
    addPlayerButton: "Legg til spiller",
    noTeamsYet: "Ingen lag ennå.",
    noPlayersYet: "Ingen spillere ennå."
  } : {
    tabTitle: "Tournaments",
    loginRequired: "Login required to manage tournaments",
    createTitle: "Create Tournament",
    createSubtitle: "Create a new tournament",
    newTournament: "New Tournament",
    namePlaceholder: "Tournament name",
    rulesPlaceholder: "Tournament rules (optional)",
    createButton: "Create Tournament",
    enterName: "Please enter a tournament name.",
    createdOk: "Tournament created successfully.",
    listTitle: "Tournaments",
    emptyList: "No tournaments yet.",
    detailsTitle: "Tournament Details",
    noSelection: "Select a tournament to view details.",
    nameLabel: "Name:",
    statusLabel: "Status:",
    rulesLabel: "Rules:",
    createdLabel: "Created:",
    noRules: "No rules specified.",
    draft: "Draft",
    editTeam: "Edit",
    deleteTeam: "Delete",
    saveTeam: "Save",
    cancelEdit: "Cancel",
    teamNameRequired: "Enter team name.",
    teamUpdated: "Team updated.",
    teamDeleted: "Team deleted.",
    confirmDeleteTeam: "Delete this team?",
    lockTeam: "Lock",
    unlockTeam: "Unlock",
    teamEditLocked: "Team is locked.",
    publish: "Publish",
    unpublish: "Unpublish",
    published: "Published",
    unpublished: "Unpublished",
    publishedOk: "Tournament published.",
    unpublishedOk: "Tournament unpublished.",
    publicPreviewTitle: "Public Preview",
    publicPreviewSubtitle: "Read-only view of published tournament",
    noTeamsInPreview: "No teams published yet.",
    noPlayersInPreview: "No players yet.",
    generateBasicMatches: "Generate Basic Matches",
    matchesTitle: "Matches",
    notEnoughTeamsForMatches: "At least 2 teams are required to generate matches.",
    matchesGenerated: "Matches generated.",
    noMatchesYet: "No matches yet.",
    standingsTitle: "Standings",
    playedShort: "P",
    winsShort: "W",
    drawsShort: "D",
    lossesShort: "L",
    pointsShort: "Pts",
    scoreForShort: "SF",
    scoreAgainstShort: "SA",
    scoreDiffShort: "GD",
    noStandingsYet: "No standings yet.",
    matchStatusCompleted: "Completed",
    matchStatusScheduled: "Scheduled",
    winnerLabel: "Winner",
    runnerUpLabel: "Runner-up",
    builderTitle: "Tournament Builder",
    builderSubtitle: "Configure format, groups and knockout flow",
    informationSection: "Tournament Information",
    formatSection: "Tournament Format",
    participantsSection: "Participants / Teams",
    settingsSection: "Tournament Settings",
    previewSection: "Visual Tournament Preview",
    groupStagePreview: "Group Stage",
    knockoutPreview: "Knockout",
    formatLabel: "Format",
    formatGroupStage: "Group Stage",
    formatRoundRobin: "Round Robin",
    formatSingleElimination: "Single Elimination",
    groupCountLabel: "Number of Groups",
    bracketSizeLabel: "Bracket Size",
    thirdPlaceLabel: "Third Place Match",
    generateGroups: "Generate Groups",
    generateKnockout: "Generate Knockout",
    regenerateStructure: "Regenerate Structure",
    noGroupsYet: "No groups yet.",
    noKnockoutYet: "No knockout structure yet.",
    semiFinals: "Semi-finals",
    final: "Final",
    thirdPlace: "Third Place",
    showScores: "Show Scores",
    showDates: "Show Dates",
    showLocations: "Show Locations",
    showRoundTitles: "Show Round Titles",
    teamManagementTitle: "Team Management",
    addTeamButton: "Add team",
    addPlayerButton: "Add player",
    noTeamsYet: "No teams yet.",
    noPlayersYet: "No players yet."
  };

  const [newPlayerClubOption, setNewPlayerClubOption] = useState("");
  const [newPlayerClubCustom, setNewPlayerClubCustom] = useState("");
  const [editClubOption, setEditClubOption] = useState("");
  const [editClubCustom, setEditClubCustom] = useState("");

  const [tournaments, setTournaments] = useState([]);
  const [activeTournamentId, setActiveTournamentId] = useState("");
  const [showCreateTournamentForm, setShowCreateTournamentForm] =
    useState(false);

  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentRules, setNewTournamentRules] = useState("");
  const [tournamentActionMessage, setTournamentActionMessage] = useState("");
  const [newTournamentTeamName, setNewTournamentTeamName] = useState("");
  const [newTournamentTeamClub, setNewTournamentTeamClub] = useState("");
  const [newTournamentPlayerNames, setNewTournamentPlayerNames] = useState({});
  const [editingTournamentTeamId, setEditingTournamentTeamId] = useState("");
  const [editingTournamentTeamName, setEditingTournamentTeamName] = useState("");
  const [activeTournamentView, setActiveTournamentView] = useState("overview");

  const removablePlayersFromTeams = useMemo(() => {
    return teams.flatMap((team, teamIndex) =>
      (team.players || []).map((player, playerIndex) => ({
        ...player,
        teamIndex,
        playerIndex,
        teamName: normalizeTeamName(teamIndex, team.name, language),
      }))
    );
  }, [teams, language]);

  const [auth, setAuth] = useState(() => {
    if (typeof window === "undefined") return getDefaultAuth();

    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return getDefaultAuth();

      const parsed = JSON.parse(raw);
      return {
        username: parsed.username || "",
        password: parsed.password || "",
        loggedIn: Boolean(parsed.loggedIn),
        role: parsed.role || "guest",
      };
    } catch (error) {
      return getDefaultAuth();
    }
  });

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  const [skillView, setSkillView] = useState(() => {
    if (typeof window === "undefined") return "numbers";
    return localStorage.getItem(SKILL_VIEW_KEY) || "numbers";
  });

  const [skillScale, setSkillScale] = useState(() => {
    if (typeof window === "undefined") return 5;
    const saved = Number(localStorage.getItem(SKILL_SCALE_KEY));
    return [3, 5].includes(saved) ? saved : 5;
  });

  const skillOptions = useMemo(() => getSkillOptions(skillScale), [skillScale]);

  const getAuthPayload = useCallback(() => {
    return auth?.loggedIn && auth?.username && auth?.password
      ? {
          username: auth.username,
          password: auth.password,
        }
      : {};
  }, [auth]);

  const clearRoundState = useCallback(() => {
    setSelected([]);
    setTeams([]);
    setMatchRoundIndex(0);
    setMatchMode(false);
    setMobileMoveSelection(null);
    setActiveTab("players");
  }, []);

  const loadPlayers = useCallback(
    async (authOverride) => {
      const payload = authOverride || getAuthPayload();

      if (!payload.username || !payload.password) {
        setPlayers([]);
        setArchivedPlayers([]);
        return;
      }

      try {
        const queryString = buildQueryString({
          action: "getPlayers",
          includeArchived: 1,
          ...payload,
          _ts: Date.now(),
        });

        const res = await fetch(`${API}?${queryString}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          setPlayers(data);
          setArchivedPlayers([]);
          return;
        }

        if (
          Array.isArray(data?.players) ||
          Array.isArray(data?.archivedPlayers)
        ) {
          setPlayers(Array.isArray(data.players) ? data.players : []);
          setArchivedPlayers(
            Array.isArray(data.archivedPlayers) ? data.archivedPlayers : []
          );
          return;
        }

        setPlayers([]);
        setArchivedPlayers([]);
      } catch (error) {
        console.error("Could not load players:", error);
        setPlayers([]);
        setArchivedPlayers([]);
      }
    },
    [getAuthPayload]
  );

  const loadTrainerUsers = useCallback(async () => {
    if (!auth.loggedIn || auth.role !== "admin") {
      setTrainerUsers([]);
      return;
    }

    try {
      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "listTrainerUsers",
          username: auth.username,
          password: auth.password,
        }),
      });

      const data = await res.json();
      setTrainerUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      console.error("Could not load trainer users:", error);
      setTrainerUsers([]);
    }
  }, [auth.loggedIn, auth.password, auth.role, auth.username]);

  const saveUserSettingsToBackend = useCallback(
    async (nextSkillView, nextSkillScale) => {
      if (!auth.loggedIn || !auth.username || !auth.password) return;

      try {
        await fetch(`${API}?_ts=${Date.now()}`, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            action: "saveUserSettings",
            username: auth.username,
            password: auth.password,
            skillView: nextSkillView,
            skillScale: Number(nextSkillScale),
          }),
        });
      } catch (error) {
        console.error("Could not save user settings:", error);
      }
    },
    [auth.loggedIn, auth.password, auth.username]
  );

  function addTournamentTeam() {
    if (!activeTournament) return;

    const trimmedName = newTournamentTeamName.trim();
    const trimmedClub = newTournamentTeamClub.trim();

    if (!trimmedName) {
      setTournamentActionMessage(
        language === "no" ? "Skriv inn lagnavn." : "Enter team name."
      );
      return;
    }

    const newTeam = {
      id: `tt-${Date.now()}`,
      name: trimmedName,
      club: trimmedClub,
      createdAt: new Date().toISOString(),
      players: [],
      locked: false,
    };

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id === activeTournament.id
          ? {
              ...tournament,
              teams: Array.isArray(tournament.teams)
                ? [newTeam, ...tournament.teams]
                : [newTeam],
            }
          : tournament
      )
    );

    setNewTournamentTeamName("");
    setNewTournamentTeamClub("");
    setTournamentActionMessage(
      language === "no" ? "Lag lagt til." : "Team added."
    );
  }

  function addTournamentPlayer(teamId) {
    if (!activeTournament) return;

    const raw = newTournamentPlayerNames[teamId] || "";
    const trimmedName = raw.trim();

    if (!trimmedName) {
      setTournamentActionMessage(
        language === "no" ? "Skriv inn spillernavn." : "Enter player name."
      );
      return;
    }

    const team = (activeTournament.teams || []).find((item) => item.id === teamId);

    if (!team) return;

    if (team.locked) {
      setTournamentActionMessage(
        language === "no" ? "Laglisten er låst." : "Team list is locked."
      );
      return;
    }

    const newPlayer = {
      id: `tp-${Date.now()}`,
      name: trimmedName,
      createdAt: new Date().toISOString(),
      registeredBy: auth.username || "unknown",
    };

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              teams: (tournament.teams || []).map((item) =>
                item.id !== teamId
                  ? item
                  : {
                      ...item,
                      players: Array.isArray(item.players)
                        ? [...item.players, newPlayer]
                        : [newPlayer],
                    }
              ),
            }
      )
    );

    setNewTournamentPlayerNames((prev) => ({
      ...prev,
      [teamId]: "",
    }));

    setTournamentActionMessage(
      language === "no" ? "Spiller lagt til." : "Player added."
    );
  }

  function startEditTournamentTeam(team) {
    if (!team?.id) return;
    if (team.locked) {
      setTournamentActionMessage(tournamentText.teamEditLocked);
      return;
    }
    setEditingTournamentTeamId(team.id);
    setEditingTournamentTeamName(team.name || "");
    setTournamentActionMessage("");
  }

  function saveTournamentTeamName(teamId) {
    if (!activeTournament) return;
    const targetTeam = (activeTournament.teams || []).find((team) => team.id === teamId);
    if (!targetTeam) return;
    if (targetTeam.locked) {
      setTournamentActionMessage(tournamentText.teamEditLocked);
      return;
    }

    const trimmedName = editingTournamentTeamName.trim();
    if (!trimmedName) {
      setTournamentActionMessage(tournamentText.teamNameRequired);
      return;
    }

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              teams: (tournament.teams || []).map((team) =>
                team.id !== teamId
                  ? team
                  : {
                      ...team,
                      name: trimmedName,
                    }
              ),
            }
      )
    );

    setEditingTournamentTeamId("");
    setEditingTournamentTeamName("");
    setTournamentActionMessage(tournamentText.teamUpdated);
  }

  function toggleTournamentTeamLock(teamId) {
    if (!activeTournament) return;

    const targetTeam = (activeTournament.teams || []).find((team) => team.id === teamId);
    if (!targetTeam) return;

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              teams: (tournament.teams || []).map((team) =>
                team.id !== teamId
                  ? team
                  : {
                      ...team,
                      locked: !team.locked,
                    }
              ),
            }
      )
    );

    if (editingTournamentTeamId === teamId && !targetTeam.locked) {
      setEditingTournamentTeamId("");
      setEditingTournamentTeamName("");
    }
    setTournamentActionMessage(
      targetTeam.locked
        ? (language === "no" ? "Lag åpnet." : "Team unlocked.")
        : (language === "no" ? "Lag låst." : "Team locked.")
    );
  }

  function deleteTournamentTeam(teamId) {
    if (!activeTournament) return;
    if (!window.confirm(tournamentText.confirmDeleteTeam)) return;

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              teams: (tournament.teams || []).filter((team) => team.id !== teamId),
            }
      )
    );

    setNewTournamentPlayerNames((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
    if (editingTournamentTeamId === teamId) {
      setEditingTournamentTeamId("");
      setEditingTournamentTeamName("");
    }
    setTournamentActionMessage(tournamentText.teamDeleted);
  }

  function publishTournament() {
    if (!activeTournament) return;
    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              published: true,
              status: "published",
            }
      )
    );
    setTournamentActionMessage(tournamentText.publishedOk);
  }

  function unpublishTournament() {
    if (!activeTournament) return;
    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              published: false,
              status: "unpublished",
            }
      )
    );
    setTournamentActionMessage(tournamentText.unpublishedOk);
  }

  function getTournamentStatusLabel(tournament) {
    if (!tournament) return "";
    if (tournament.published || tournament.status === "published") {
      return tournamentText.published;
    }
    if (tournament.status === "draft") return tournamentText.draft;
    if (tournament.status === "unpublished") return tournamentText.unpublished;
    return tournament.status || tournamentText.unpublished;
  }

  function updateActiveTournament(patch) {
    if (!activeTournament) return;
    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              ...patch,
            }
      )
    );
  }

  function updateActiveTournamentDisplaySetting(key, value) {
    if (!activeTournament) return;
    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              displaySettings: {
                ...getDefaultTournamentConfig().displaySettings,
                ...(tournament.displaySettings || {}),
                [key]: value,
              },
            }
      )
    );
  }

  function buildManualGroups(tournament) {
    const safeGroupCount = Math.max(1, Number(tournament?.groupCount || 2));
    const safeTeamsPerGroup = Math.max(1, Number(tournament?.teamsPerGroup || 5));
    const existingGroups = Array.isArray(tournament?.groups)
      ? tournament.groups
      : [];

    return Array.from({ length: safeGroupCount }, (_, groupIndex) => {
      const code = getTournamentGroupCode(groupIndex);
      const existingGroup =
        existingGroups.find((group) => group.code === code) ||
        existingGroups[groupIndex] ||
        {};
      const existingTeams = Array.isArray(existingGroup.teams)
        ? existingGroup.teams
        : [];

      return {
        id: `g-${code}`,
        code,
        name: `${language === "no" ? "Gruppe" : "Group"} ${code}`,
        teams: Array.from({ length: safeTeamsPerGroup }, (_, slotIndex) => {
          const slot = `${code}${slotIndex + 1}`;
          const existingTeam =
            existingTeams.find((team) => team.slot === slot) ||
            existingTeams[slotIndex] ||
            {};

          return {
            id: existingTeam.id || `slot-${slot}`,
            slot,
            name: existingTeam.name || "",
            club: existingTeam.club || "",
          };
        }),
      };
    });
  }

  function updateManualGroupSlot(groupId, slotId, name) {
    if (!activeTournament) return;

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              groups: (tournament.groups || []).map((group) =>
                group.id !== groupId
                  ? group
                  : {
                      ...group,
                      teams: (group.teams || []).map((team) =>
                        team.id !== slotId
                          ? team
                          : {
                              ...team,
                              name,
                            }
                      ),
                    }
              ),
            }
      )
    );
  }

  function getFilledGroupTeams(tournament) {
    return (tournament?.groups || []).flatMap((group) =>
      (group.teams || [])
        .filter((team) => String(team.name || "").trim())
        .map((team) => ({
          ...team,
          groupId: group.id,
          groupName: group.name,
          groupCode: group.code,
        }))
    );
  }

  function buildManualKnockout(tournament) {
    const safeGroupCount = Math.max(1, Number(tournament?.groupCount || 2));
    const groupCodes = Array.from({ length: safeGroupCount }, (_, index) =>
      getTournamentGroupCode(index)
    );
    const makeMatch = (id, label, teamA, teamB) => ({
      id,
      label,
      sourceA: teamA,
      sourceB: teamB,
      teamA,
      teamB,
      winnerSource: "",
      loserSource: "",
      status: "scheduled",
    });

    const firstRound = [];
    for (let index = 0; index < groupCodes.length; index += 2) {
      const groupA = groupCodes[index];
      const groupB = groupCodes[index + 1];
      if (!groupA || !groupB) continue;

      firstRound.push(
        makeMatch(
          `ko-${groupA}${groupB}-1`,
          `KO${firstRound.length + 1}`,
          buildGroupPositionSource(groupA, 1),
          buildGroupPositionSource(groupB, 2)
        ),
        makeMatch(
          `ko-${groupA}${groupB}-2`,
          `KO${firstRound.length + 2}`,
          buildGroupPositionSource(groupB, 1),
          buildGroupPositionSource(groupA, 2)
        )
      );
    }

    if (firstRound.length <= 2) {
      const semiFinals = firstRound.map((match, index) => ({
        ...match,
        id: `sf-${index + 1}`,
        label: `SF${index + 1}`,
      }));

      return {
        quarterFinals: [],
        semiFinals,
        final: makeMatch("final-1", "Final", "Winner SF1", "Winner SF2"),
        thirdPlace: tournament?.thirdPlaceMatch
          ? makeMatch("third-place-1", "Third", "Loser SF1", "Loser SF2")
          : null,
      };
    }

    const quarterFinals = firstRound.map((match, index) => ({
      ...match,
      id: `qf-${index + 1}`,
      label: `QF${index + 1}`,
    }));

    return {
      quarterFinals,
      semiFinals: [
        makeMatch("sf-1", "SF1", "Winner QF1", "Winner QF2"),
        makeMatch("sf-2", "SF2", "Winner QF3", "Winner QF4"),
      ],
      final: makeMatch("final-1", "Final", "Winner SF1", "Winner SF2"),
      thirdPlace: tournament?.thirdPlaceMatch
        ? makeMatch("third-place-1", "Third", "Loser SF1", "Loser SF2")
        : null,
    };
  }

  function generateTournamentGroups() {
    if (!activeTournament) return;
    const groups = buildManualGroups(activeTournament);
    const groupCount = Math.max(1, Number(activeTournament.groupCount || 2));

    updateActiveTournament({
      totalTeams:
        Number(activeTournament.totalTeams) ||
        groupCount * Math.max(1, Number(activeTournament.teamsPerGroup || 5)),
      groups,
      bracketSize: groupCount * 2,
      knockout: buildManualKnockout({
        ...activeTournament,
        groups,
        bracketSize: groupCount * 2,
      }),
    });
    setTournamentActionMessage(tournamentText.regenerateStructure);
  }

  function generateTournamentKnockout() {
    if (!activeTournament) return;
    updateActiveTournament({
      bracketSize: Math.max(2, Number(activeTournament.groupCount || 2) * 2),
      knockout: buildManualKnockout(activeTournament),
    });
    setTournamentActionMessage(tournamentText.regenerateStructure);
  }

  function generateTournamentMatches() {
    if (!activeTournament) return;
    const groups = Array.isArray(activeTournament.groups)
      ? activeTournament.groups
      : [];
    const nextMatches = [];

    groups.forEach((group) => {
      const groupTeams = (group.teams || []).filter((team) =>
        String(team.name || "").trim()
      );

      for (let i = 0; i < groupTeams.length; i += 1) {
        for (let j = i + 1; j < groupTeams.length; j += 1) {
          nextMatches.push({
            id: `gm-${activeTournament.id}-${group.id}-${i}-${j}-${Date.now()}`,
            stage: "group",
            groupId: group.id,
            groupName: group.name,
            teamA: groupTeams[i].name,
            teamB: groupTeams[j].name,
            scoreA: "",
            scoreB: "",
            status: "scheduled",
          });
        }
      }
    });

    if (!nextMatches.length) {
      const teams = Array.isArray(activeTournament.teams)
        ? activeTournament.teams
        : [];
      for (let i = 0; i < teams.length; i += 1) {
        for (let j = i + 1; j < teams.length; j += 1) {
          nextMatches.push({
            id: `tm-${activeTournament.id}-${i}-${j}-${Date.now()}`,
            stage: "group",
            teamA: teams[i].name,
            teamB: teams[j].name,
            scoreA: "",
            scoreB: "",
            status: "scheduled",
          });
        }
      }
    }

    if (!nextMatches.length) {
      setTournamentActionMessage(tournamentText.notEnoughTeamsForMatches);
      return;
    }

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              matches: nextMatches,
            }
      )
    );
    setTournamentActionMessage(tournamentText.matchesGenerated);
  }

  function updateTournamentMatchScore(matchId, scoreA, scoreB) {
    if (!activeTournament) return;

    const normalizedA = String(scoreA ?? "");
    const normalizedB = String(scoreB ?? "");
    const hasBoth = normalizedA.trim() !== "" && normalizedB.trim() !== "";

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              matches: (tournament.matches || []).map((match) =>
                match.id !== matchId
                  ? match
                  : {
                      ...match,
                      scoreA: normalizedA,
                      scoreB: normalizedB,
                      status: hasBoth ? "completed" : "scheduled",
                    }
              ),
            }
      )
    );
  }

  function updateKnockoutMatchWinner(stageKey, matchId, winnerSource, loserSource) {
    if (!activeTournament) return;

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              knockout: {
                ...(tournament.knockout || {}),
                [stageKey]: Array.isArray(tournament.knockout?.[stageKey])
                  ? tournament.knockout[stageKey].map((match) =>
                      match.id !== matchId
                        ? match
                        : {
                            ...match,
                            winnerSource,
                            loserSource,
                            status: "completed",
                          }
                    )
                  : tournament.knockout?.[stageKey]?.id === matchId
                    ? {
                        ...tournament.knockout[stageKey],
                        winnerSource,
                        loserSource,
                        status: "completed",
                      }
                    : tournament.knockout?.[stageKey],
              },
            }
      )
    );
  }

  function computeTournamentStandings(tournament) {
    if (!tournament || tournament.format !== "group-stage") return [];

    const groups = Array.isArray(tournament.groups) ? tournament.groups : [];
    const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
    if (!groups.length) return [];

    const standings = groups.map((group) => {
      const rowsByTeam = {};
      const teamNames = (group.teams || [])
        .map((team) => String(team.name || "").trim())
        .filter(Boolean);

      teamNames.forEach((teamName) => {
        rowsByTeam[teamName] = {
          teamName,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          scoreFor: 0,
          scoreAgainst: 0,
          scoreDiff: 0,
        };
      });

      matches.forEach((match) => {
        if (match.groupId && match.groupId !== group.id) return;
        if (!teamNames.includes(match.teamA) || !teamNames.includes(match.teamB)) return;

        const scoreA = Number(match.scoreA);
        const scoreB = Number(match.scoreB);
        const isComplete =
          match.status === "completed" &&
          Number.isFinite(scoreA) &&
          Number.isFinite(scoreB);
        if (!isComplete) return;

        const rowA = rowsByTeam[match.teamA];
        const rowB = rowsByTeam[match.teamB];
        if (!rowA || !rowB) return;

        rowA.played += 1;
        rowB.played += 1;
        rowA.scoreFor += scoreA;
        rowA.scoreAgainst += scoreB;
        rowB.scoreFor += scoreB;
        rowB.scoreAgainst += scoreA;

        if (scoreA > scoreB) {
          rowA.wins += 1;
          rowA.points += 3;
          rowB.losses += 1;
        } else if (scoreA < scoreB) {
          rowB.wins += 1;
          rowB.points += 3;
          rowA.losses += 1;
        } else {
          rowA.draws += 1;
          rowB.draws += 1;
          rowA.points += 1;
          rowB.points += 1;
        }
      });

      const rows = Object.values(rowsByTeam).map((row) => ({
        ...row,
        scoreDiff: row.scoreFor - row.scoreAgainst,
      }));

      rows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.scoreDiff !== a.scoreDiff) return b.scoreDiff - a.scoreDiff;
        if (b.scoreFor !== a.scoreFor) return b.scoreFor - a.scoreFor;
        return teamNames.indexOf(a.teamName) - teamNames.indexOf(b.teamName);
      });

      return {
        groupId: group.id,
        groupName: group.name,
        rows,
      };
    });

    return standings;
  }

  const activeTournament = useMemo(() => {
    const tournament = tournaments.find((t) => t.id === activeTournamentId) || null;
    return tournament ? applyTournamentDefaults(tournament) : null;
  }, [tournaments, activeTournamentId]);

  const tournamentStandings = useMemo(() => {
    return computeTournamentStandings(activeTournament);
  }, [activeTournament]);

  const advancingTeamsByGroup = useMemo(() => {
    if (!activeTournament || activeTournament.format !== "group-stage") return [];
    return tournamentStandings.map((group, index) => {
      const sourceGroup =
        (activeTournament.groups || []).find((item) => item.id === group.groupId) ||
        {};

      return {
      groupId: group.groupId,
      groupName: group.groupName,
      groupCode: sourceGroup.code || getTournamentGroupCode(index),
      winner: group.rows?.[0]?.teamName || `${group.groupName} ${tournamentText.winnerLabel}`,
      runnerUp:
        group.rows?.[1]?.teamName || `${group.groupName} ${tournamentText.runnerUpLabel}`,
      };
    });
  }, [activeTournament, tournamentStandings, tournamentText.winnerLabel, tournamentText.runnerUpLabel]);

  function createTournament() {
    const name = newTournamentName.trim();
    const rules = newTournamentRules.trim();

    if (!name) {
      setTournamentActionMessage(tournamentText.enterName);
      return;
    }

    const newTournament = {
      id: `t-${Date.now()}`,
      name,
      rules,
      createdAt: new Date().toISOString(),
      status: "draft",
      published: false,
      teams: [],
      ...getDefaultTournamentConfig(),
    };

    setTournaments((prev) => [newTournament, ...prev]);
    setActiveTournamentId(newTournament.id);
    setNewTournamentName("");
    setNewTournamentRules("");
    setShowCreateTournamentForm(false);
    setTournamentActionMessage(tournamentText.createdOk);
  }

  async function handleLogin() {
    const username = loginUsername.trim();
    const password = loginPassword.trim();

    if (!username || !password) {
      setLoginMessage(t.enterUsernamePassword);
      return;
    }

    try {
      setLoginLoading(true);
      setLoginMessage("");

      const queryString = buildQueryString({
        action: "login",
        username,
        password,
        _ts: Date.now(),
      });

      const res = await fetch(`${API}?${queryString}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!data?.success) {
        setLoginMessage(data?.message || t.loginFailed);
        setPlayers([]);
        setArchivedPlayers([]);
        return;
      }

      const nextSkillScale = [3, 5].includes(
        Number(data?.profile?.settings?.skillScale)
      )
        ? Number(data?.profile?.settings?.skillScale)
        : 5;

      const nextAuth = {
        username,
        password,
        loggedIn: true,
        role: data?.profile?.role || "trainer",
      };

      clearRoundState();
      setAuth(nextAuth);
      setSkillView(data?.profile?.settings?.skillView || "numbers");
      setSkillScale(nextSkillScale);
      setLoginUsername("");
      setLoginPassword("");
      setLoginMessage(t.loginOk);
      setTrainerActionMessage("");
      setCreateTrainerMessage("");
      setCreatedTrainerInfo(null);
      setPlayerActionMessage("");

      await loadPlayers({
        username,
        password,
      });
    } catch (error) {
      console.error("Could not log in:", error);
      setLoginMessage(t.loginFailed);
      setPlayers([]);
      setArchivedPlayers([]);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    setAuth(getDefaultAuth());
    setLoginUsername("");
    setLoginPassword("");
    setLoginMessage("");
    setTrainerUsers([]);
    setTrainerPasswords({});
    setTrainerActionMessage("");
    setCreateTrainerMessage("");
    setCreatedTrainerInfo(null);
    setPlayers([]);
    setArchivedPlayers([]);
    setPlayerActionMessage("");
    clearRoundState();
  }

  async function createTrainerFromApp() {
    const newTrainerUsername = trainerUsername.trim();
    const newTrainerPassword = trainerPassword.trim();

    if (!newTrainerUsername || !newTrainerPassword) {
      setCreateTrainerMessage(t.enterUsernamePassword);
      return;
    }

    if (
      trainerCopyMode === "trainer" &&
      !String(copyFromTrainerUsername || "").trim()
    ) {
      setCreateTrainerMessage(t.selectTrainerToCopy);
      return;
    }

    try {
      setCreatingTrainer(true);
      setCreateTrainerMessage("");
      setCreatedTrainerInfo(null);

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "createTrainerUser",
          username: auth.username,
          password: auth.password,
          newUsername: newTrainerUsername,
          newPassword: newTrainerPassword,
          skillView: trainerSkillView,
          skillScale: Number(trainerSkillScale),
          active: 1,
          copyMode: trainerCopyMode,
          copyFromTrainerUsername:
            trainerCopyMode === "trainer" ? copyFromTrainerUsername : "",
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setCreateTrainerMessage(data?.message || t.couldNotCreateTrainer);
        return;
      }

      setCreatedTrainerInfo(data.user || null);
      setCreateTrainerMessage(t.trainerCreated);
      setTrainerUsername("");
      setTrainerPassword("");
      setTrainerSkillView("numbers");
      setTrainerSkillScale(5);
      setTrainerCopyMode("main");
      setCopyFromTrainerUsername("");
      setShowCreateTrainerForm(false);
      await loadTrainerUsers();
    } catch (error) {
      console.error("Could not create trainer:", error);
      setCreateTrainerMessage(t.couldNotCreateTrainer);
    } finally {
      setCreatingTrainer(false);
    }
  }

  async function updateTrainerStatus(targetUsername, active) {
    try {
      setTrainerActionMessage("");

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "updateTrainerStatus",
          username: auth.username,
          password: auth.password,
          targetUsername,
          active: active ? 1 : 0,
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setTrainerActionMessage(data?.message || t.couldNotCreateTrainer);
        return;
      }

      setTrainerActionMessage(
        active ? t.trainerActivated : t.trainerDeactivated
      );
      await loadTrainerUsers();
    } catch (error) {
      console.error("Could not update trainer status:", error);
      setTrainerActionMessage("Could not update trainer.");
    }
  }

  async function resetTrainerPassword(targetUsername) {
    const newPassword = String(trainerPasswords[targetUsername] || "").trim();

    if (!newPassword) {
      setTrainerActionMessage(t.enterNewPasswordFirst);
      return;
    }

    try {
      setTrainerActionMessage("");

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "resetTrainerPassword",
          username: auth.username,
          password: auth.password,
          targetUsername,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setTrainerActionMessage(data?.message || t.couldNotResetPassword);
        return;
      }

      setTrainerPasswords((prev) => ({
        ...prev,
        [targetUsername]: "",
      }));
      setTrainerActionMessage(t.passwordResetOk);
    } catch (error) {
      console.error("Could not reset password:", error);
      setTrainerActionMessage(t.couldNotResetPassword);
    }
  }

  async function archiveTrainer(targetUsername) {
    const confirmed = window.confirm(
      `${t.archiveTrainerConfirm} "${targetUsername}"?`
    );
    if (!confirmed) return;

    try {
      setTrainerActionMessage("");

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "archiveTrainerUser",
          username: auth.username,
          password: auth.password,
          targetUsername,
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setTrainerActionMessage(data?.message || t.couldNotArchiveTrainer);
        return;
      }

      setTrainerActionMessage(t.trainerArchived);
      await loadTrainerUsers();
    } catch (error) {
      console.error("Could not archive trainer:", error);
      setTrainerActionMessage(t.couldNotArchiveTrainer);
    }
  }

  async function restoreTrainer(targetUsername) {
    try {
      setTrainerActionMessage("");

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "restoreTrainerUser",
          username: auth.username,
          password: auth.password,
          targetUsername,
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setTrainerActionMessage(data?.message || t.couldNotRestoreTrainer);
        return;
      }

      setTrainerActionMessage(t.trainerRestored);
      await loadTrainerUsers();
    } catch (error) {
      console.error("Could not restore trainer:", error);
      setTrainerActionMessage(t.couldNotRestoreTrainer);
    }
  }

  async function archivePlayer(playerName) {
    const confirmed = window.confirm(`${t.archivePlayerConfirm} "${playerName}"?`);
    if (!confirmed) return;

    try {
      setPlayerActionMessage("");

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "archivePlayer",
          playerName,
          ...getAuthPayload(),
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setPlayerActionMessage(data?.message || t.couldNotArchivePlayer);
        return;
      }

      setPlayerActionMessage(t.playerArchived);
      setSelected((prev) => prev.filter((name) => name !== playerName));
      await loadPlayers();
    } catch (error) {
      console.error("Could not archive player:", error);
      setPlayerActionMessage(t.couldNotArchivePlayer);
    }
  }

  async function restorePlayer(playerName) {
    try {
      setPlayerActionMessage("");

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "restorePlayer",
          playerName,
          ...getAuthPayload(),
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setPlayerActionMessage(data?.message || t.couldNotRestorePlayer);
        return;
      }

      setPlayerActionMessage(t.playerRestored);
      await loadPlayers();
    } catch (error) {
      console.error("Could not restore player:", error);
      setPlayerActionMessage(t.couldNotRestorePlayer);
    }
  }

  useEffect(() => {
    if (!auth.loggedIn) {
      setPlayers([]);
      setArchivedPlayers([]);
      setTrainerUsers([]);
      return;
    }

    loadPlayers();
  }, [auth.loggedIn, auth.password, auth.username, loadPlayers]);

  useEffect(() => {
    if (auth.loggedIn && auth.role === "admin") {
      loadTrainerUsers();
    } else {
      setTrainerUsers([]);
    }
  }, [auth, loadTrainerUsers]);

  useEffect(() => {
    if (!auth.loggedIn) {
      setTeams([]);
      setActiveTab("players");
      return;
    }

    const currentRoundKey = getRoundStorageKey(ROUND_CACHE_KEY, auth);
    const savedRoundKey = getRoundStorageKey(ROUND_SAVE_KEY, auth);

    const currentRound = readStorageWithTtl(
  currentRoundKey,
  CURRENT_ROUND_TTL_MS,
  language
);
const savedRound = readStorageWithTtl(
  savedRoundKey,
  SAVED_ROUND_TTL_MS,
  language
);
    const restored = currentRound || savedRound;

    if (restored?.teams?.length) {
      setTeams(restored.teams);
      setTeamCount(restored.teamCount || 2);
      setActiveTab("teams");
      return;
    }

    setTeams([]);
    setActiveTab("players");
  }, [auth, language]);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const roundCacheKey = getRoundStorageKey(ROUND_CACHE_KEY, auth);

    if (!teams.length) {
      localStorage.removeItem(roundCacheKey);
      return;
    }

    try {
      const payload = buildStoragePayload(teams, teamCount);
      localStorage.setItem(roundCacheKey, JSON.stringify(payload));
    } catch (error) {
      console.error("Could not save current round:", error);
    }
  }, [auth, teams, teamCount]);

  useEffect(() => {
    try {
      localStorage.setItem(SKILL_VIEW_KEY, skillView);
    } catch (error) {
      console.error("Could not save skill view:", error);
    }
  }, [skillView]);

  useEffect(() => {
    try {
      localStorage.setItem(SKILL_SCALE_KEY, String(skillScale));
    } catch (error) {
      console.error("Could not save skill scale:", error);
    }
  }, [skillScale]);

  useEffect(() => {
    try {
      localStorage.setItem(TEAM_SKILL_VISIBILITY_KEY, String(showSkillInTeams));
    } catch (error) {
      console.error("Could not save team skill visibility:", error);
    }
  }, [showSkillInTeams]);

  useEffect(() => {
    try {
      localStorage.setItem(TEAM_LOCK_VISIBILITY_KEY, String(showLockInTeams));
    } catch (error) {
      console.error("Could not save team lock visibility:", error);
    }
  }, [showLockInTeams]);

  useEffect(() => {
    try {
      localStorage.setItem(MATCH_METHOD_KEY, matchMethod);
    } catch (error) {
      console.error("Could not save match method:", error);
    }
  }, [matchMethod]);

  useEffect(() => {
    try {
      localStorage.setItem(PLAYER_SORT_KEY, playerSortMode);
    } catch (error) {
      console.error("Could not save player sort:", error);
    }
  }, [playerSortMode]);

  useEffect(() => {
    const key = getToolbarSettingsStorageKey(auth.username);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        setVisibleActions(DEFAULT_VISIBLE_ACTIONS);
        return;
      }

      const parsed = JSON.parse(raw);
      setVisibleActions({ ...DEFAULT_VISIBLE_ACTIONS, ...parsed });
    } catch (e) {
      console.error("Could not load toolbar settings", e);
      setVisibleActions(DEFAULT_VISIBLE_ACTIONS);
    }
  }, [auth.username]);

  useEffect(() => {
    try {
      localStorage.setItem(
        getToolbarSettingsStorageKey(auth.username),
        JSON.stringify(visibleActions)
      );
    } catch (e) {
      console.error("Could not save visible actions", e);
    }
  }, [visibleActions, auth.username]);

  useEffect(() => {
    const key = getPlayerViewModeStorageKey(auth.username);
    try {
      const raw = localStorage.getItem(key);
      setPlayerViewMode(raw === "club" ? "club" : "all");
    } catch (e) {
      console.error("Could not load player view mode", e);
      setPlayerViewMode("all");
    }
  }, [auth.username]);

  useEffect(() => {
    try {
      localStorage.setItem(
        getPlayerViewModeStorageKey(auth.username),
        playerViewMode
      );
    } catch (e) {
      console.error("Could not save player view mode", e);
    }
  }, [playerViewMode, auth.username]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getLanguageStorageKey(auth.username));
      setLanguage(raw === "no" ? "no" : "en");
    } catch (e) {
      console.error("Could not load language", e);
      setLanguage("en");
    }
  }, [auth.username]);

  useEffect(() => {
    try {
      localStorage.setItem(getLanguageStorageKey(auth.username), language);
    } catch (e) {
      console.error("Could not save language", e);
    }
  }, [language, auth.username]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } catch (error) {
      console.error("Could not save auth:", error);
    }
  }, [auth]);

  useEffect(() => {
    if (!auth.loggedIn) return;
    saveUserSettingsToBackend(skillView, skillScale);
  }, [auth.loggedIn, saveUserSettingsToBackend, skillView, skillScale]);

  useEffect(() => {
    if (!skillOptions.includes(newPlayerSkill)) {
      setNewPlayerSkill(Math.min(newPlayerSkill, skillScale));
    }

    if (!skillOptions.includes(editSkill)) {
      setEditSkill(Math.min(editSkill, skillScale));
    }
  }, [editSkill, newPlayerSkill, skillOptions, skillScale]);

  useEffect(() => {
    setSelected((prev) =>
      prev.filter((name) => players.some((p) => p.name === name))
    );
  }, [players]);

  useEffect(() => {
    if (skillView === "colors") {
      setShowSkillInTeams(false);
    }
  }, [skillView]);

  useEffect(() => {
    if (!teams.length) return;

    const namesInTeams = teams.flatMap((team) =>
      (team.players || []).map((player) => player.name)
    );

    setSelected((prev) => {
      const merged = new Set([...(prev || []), ...namesInTeams]);
      return Array.from(merged);
    });
  }, [teams]);

  function togglePlayer(name) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  async function generateTeams() {
    try {
      setLoading(true);

      const selectedPlayers = players.filter((p) => selected.includes(p.name));

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "generate",
          players: selectedPlayers,
          previousTeams: teams,
          teamCount,
          ...getAuthPayload(),
        }),
      });

      const data = await res.json();
      const normalized = normalizeTeams(data, language);

      setTeams(normalized);
      setMatchRoundIndex(0);
      setActiveTab("teams");
      setMatchMode(false);
      setMobileMoveSelection(null);
    } catch (error) {
      console.error("Could not generate teams:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateNewRound() {
    try {
      const currentPlayers = teams.flatMap((team) =>
        (team.players || []).map((player) => ({
          name: player.name,
          skill: Number(player.skill) || 1,
          cannot: Array.isArray(player.cannot) ? player.cannot : [],
          locked: Boolean(player.locked),
          club: String(player.club || "").trim(),
        }))
      );

      if (currentPlayers.length < 2) return;

      setLoading(true);

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "generate",
          players: currentPlayers,
          previousTeams: teams,
          teamCount,
          ...getAuthPayload(),
        }),
      });

      const data = await res.json();
      const normalized = normalizeTeams(data, language);

      setTeams(normalized);
      setMatchRoundIndex(0);
      setMatchMode(false);
      setMobileMoveSelection(null);
    } catch (error) {
      console.error("Could not create new round:", error);
    } finally {
      setLoading(false);
    }
  }

  function saveRoundForSixHours() {
    try {
      const savedRoundKey = getRoundStorageKey(ROUND_SAVE_KEY, auth);
      localStorage.setItem(
        savedRoundKey,
        JSON.stringify(buildStoragePayload(teams, teamCount))
      );
      alert(t.roundSavedForSixHours);
    } catch (error) {
      console.error("Could not save round:", error);
      alert(t.couldNotSaveRound);
    }
  }

  function clearStoredRounds() {
    localStorage.removeItem(getRoundStorageKey(ROUND_CACHE_KEY, auth));
    localStorage.removeItem(getRoundStorageKey(ROUND_SAVE_KEY, auth));
    setTeams([]);
    setSelected([]);
    setMobileMoveSelection(null);
    setActiveTab("players");
    alert(t.savedRoundCleared);
  }

  async function addPlayer() {
    const trimmedName = newPlayerName.trim();
    const clubValue =
      newPlayerClubOption === "Other"
        ? newPlayerClubCustom.trim()
        : newPlayerClubOption || "";

    if (!trimmedName) return;

    try {
      setSavingPlayer(true);

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "addPlayer",
          player: {
            name: trimmedName,
            skill: Number(newPlayerSkill),
            club: clubValue,
          },
          ...getAuthPayload(),
        }),
      });

      const data = await res.json();
      if (!data?.success) {
        setPlayerActionMessage(data?.message || t.couldNotSavePlayer);
        return;
      }

      setNewPlayerName("");
      setNewPlayerSkill(1);
      setNewPlayerClubOption("");
      setNewPlayerClubCustom("");
      setShowAddForm(false);
      await loadPlayers();
    } catch (error) {
      console.error("Could not add player:", error);
      setPlayerActionMessage(t.couldNotSavePlayer);
    } finally {
      setSavingPlayer(false);
    }
  }

  function openEditPlayer(player) {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditSkill(Number(player.skill) || 1);

    const trimmedClub = String(player.club || "").trim();
    if (
      trimmedClub &&
      CLUB_OPTIONS.includes(trimmedClub) &&
      trimmedClub !== "Other"
    ) {
      setEditClubOption(trimmedClub);
      setEditClubCustom("");
    } else if (trimmedClub) {
      setEditClubOption("Other");
      setEditClubCustom(trimmedClub);
    } else {
      setEditClubOption("");
      setEditClubCustom("");
    }
  }

  function closeEditPlayer() {
    setEditingPlayer(null);
    setEditName("");
    setEditSkill(1);
    setEditClubOption("");
    setEditClubCustom("");
  }

  async function savePlayerEdit() {
    if (!editingPlayer) return;

    const oldName = editingPlayer.name;
    const newName = editName.trim();
    const newSkill = Number(editSkill);
    const newClub =
      editClubOption === "Other"
        ? editClubCustom.trim()
        : editClubOption || "";

    if (!newName) return;

    try {
      setSavingPlayer(true);

      const res = await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "updatePlayer",
          oldName,
          player: {
            name: newName,
            skill: newSkill,
            club: newClub,
          },
          ...getAuthPayload(),
        }),
      });

      const data = await res.json();
      if (!data?.success) {
        setPlayerActionMessage(data?.message || t.couldNotUpdatePlayer);
        return;
      }

      setPlayers((prev) =>
        prev.map((p) =>
          p.name === oldName
            ? { ...p, name: newName, skill: newSkill, club: newClub }
            : p
        )
      );

      setArchivedPlayers((prev) =>
        prev.map((p) =>
          p.name === oldName
            ? { ...p, name: newName, skill: newSkill, club: newClub }
            : p
        )
      );

      setSelected((prev) =>
        prev.map((name) => (name === oldName ? newName : name))
      );

      setTeams((prevTeams) =>
        prevTeams.map((team) => ({
          ...team,
          players: (team.players || []).map((p) =>
            p.name === oldName
              ? { ...p, name: newName, skill: newSkill, club: newClub }
              : p
          ),
        }))
      );

      closeEditPlayer();
      await loadPlayers();
    } catch (error) {
      console.error("Could not save player:", error);
      setPlayerActionMessage(t.couldNotUpdatePlayer);
    } finally {
      setSavingPlayer(false);
    }
  }

  function toggleLock(teamIndex, playerIndex) {
    setTeams((prevTeams) =>
      prevTeams.map((team, tIndex) => {
        if (tIndex !== teamIndex) return team;

        return {
          ...team,
          players: (team.players || []).map((player, pIndex) => {
            if (pIndex !== playerIndex) return player;
            return { ...player, locked: !player.locked };
          }),
        };
      })
    );
  }

  function removeExistingPlayerFromCurrentTeams(teamIndex, playerIndex) {
    let removedName = "";

    setTeams((prevTeams) =>
      prevTeams.map((team, tIdx) => {
        if (tIdx !== teamIndex) return team;

        return {
          ...team,
          players: (team.players || []).filter((player, pIdx) => {
            const keep = pIdx !== playerIndex;
            if (!keep) {
              removedName = player.name;
            }
            return keep;
          }),
        };
      })
    );

    if (removedName) {
      setSelected((prev) => (prev || []).filter((name) => name !== removedName));
    }

    setShowRemoveFromTeamsModal(false);
  }

  function movePlayerByDrag(
    fromTeamIndex,
    playerIndex,
    toTeamIndex,
    toPlayerIndex = null
  ) {
    setTeams((prevTeams) => {
      const sourceTeam = prevTeams[fromTeamIndex];
      const draggedPlayer = sourceTeam?.players?.[playerIndex];

      if (!draggedPlayer || draggedPlayer.locked) return prevTeams;

      if (
        fromTeamIndex === toTeamIndex &&
        (toPlayerIndex === null ||
          toPlayerIndex === undefined ||
          toPlayerIndex === playerIndex ||
          toPlayerIndex === playerIndex + 1)
      ) {
        return prevTeams;
      }

      const nextTeams = prevTeams.map((team) => ({
        ...team,
        players: [...(team.players || [])],
      }));

      nextTeams[fromTeamIndex].players.splice(playerIndex, 1);

      let insertIndex;

      if (toPlayerIndex === null || toPlayerIndex === undefined) {
        insertIndex = nextTeams[toTeamIndex].players.length;
      } else {
        insertIndex = toPlayerIndex;

        if (fromTeamIndex === toTeamIndex && playerIndex < toPlayerIndex) {
          insertIndex = toPlayerIndex - 1;
        }

        if (insertIndex < 0) insertIndex = 0;
        if (insertIndex > nextTeams[toTeamIndex].players.length) {
          insertIndex = nextTeams[toTeamIndex].players.length;
        }
      }

      nextTeams[toTeamIndex].players.splice(insertIndex, 0, draggedPlayer);

      return nextTeams;
    });
  }

  function movePlayerToTeam(fromTeamIndex, playerIndex, toTeamIndex) {
    if (toTeamIndex < 0 || toTeamIndex >= teams.length) return;

    setTeams((prevTeams) => {
      const sourceTeam = prevTeams[fromTeamIndex];
      const draggedPlayer = sourceTeam?.players?.[playerIndex];

      if (!draggedPlayer || draggedPlayer.locked) return prevTeams;
      if (fromTeamIndex === toTeamIndex) return prevTeams;

      const nextTeams = prevTeams.map((team) => ({
        ...team,
        players: [...(team.players || [])],
      }));

      nextTeams[fromTeamIndex].players.splice(playerIndex, 1);
      nextTeams[toTeamIndex].players.push(draggedPlayer);

      return nextTeams;
    });
  }

  function handleSelectMobileMove(teamIndex, playerIndex) {
    const player = teams?.[teamIndex]?.players?.[playerIndex];
    if (!player || player.locked) return;

    const isSame =
      mobileMoveSelection &&
      mobileMoveSelection.fromTeamIndex === teamIndex &&
      mobileMoveSelection.playerIndex === playerIndex;

    if (isSame) {
      setMobileMoveSelection(null);
      return;
    }

    setMobileMoveSelection({
      fromTeamIndex: teamIndex,
      playerIndex,
      name: player.name,
    });
  }

  function confirmMobileMove(toTeamIndex) {
    if (!mobileMoveSelection) return;
    movePlayerToTeam(
      mobileMoveSelection.fromTeamIndex,
      mobileMoveSelection.playerIndex,
      toTeamIndex
    );
    setMobileMoveSelection(null);
  }

  function handleDragStart(teamIndex, playerIndex) {
    if (isMobile) return;

    const player = teams?.[teamIndex]?.players?.[playerIndex];
    if (!player || player.locked) return;

    setDragging({
      fromTeamIndex: teamIndex,
      playerIndex,
      name: player.name,
    });
  }

  function resetDragState() {
    setDragging(null);
  }

  function teamTotal(team) {
    return (team.players || []).reduce(
      (sum, player) => sum + (Number(player.skill) || 0),
      0
    );
  }

  function addExistingPlayerToCurrentTeams(player) {
    if (!player) return;

    setTeams((prevTeams) => {
      if (!prevTeams.length) return prevTeams;

      let bestIndex = 0;

      for (let i = 1; i < prevTeams.length; i += 1) {
        const bestTeam = prevTeams[bestIndex];
        const currentTeam = prevTeams[i];

        const bestTotal = (bestTeam.players || []).reduce(
          (sum, p) => sum + (Number(p.skill) || 0),
          0
        );
        const currentTotal = (currentTeam.players || []).reduce(
          (sum, p) => sum + (Number(p.skill) || 0),
          0
        );

        const bestCount = (bestTeam.players || []).length;
        const currentCount = (currentTeam.players || []).length;

        if (
          currentTotal < bestTotal ||
          (currentTotal === bestTotal && currentCount < bestCount)
        ) {
          bestIndex = i;
        }
      }

      return prevTeams.map((team, index) => {
        if (index !== bestIndex) return team;

        return {
          ...team,
          players: [
            ...(team.players || []),
            {
              name: player.name,
              skill: Number(player.skill) || 1,
              cannot: Array.isArray(player.cannot) ? player.cannot : [],
              locked: false,
              club: String(player.club || "").trim(),
            },
          ],
        };
      });
    });

    setSelected((prev) => {
      const merged = new Set([...(prev || []), player.name]);
      return Array.from(merged);
    });

    setShowAddToTeamsModal(false);
  }


  const sortedPlayers = useMemo(() => {
    const nextPlayers = [...players];

    if (playerSortMode === "recent") {
      return nextPlayers.reverse();
    }

    return nextPlayers.sort((a, b) =>
      displayPlayerName(a).localeCompare(displayPlayerName(b))
    );
  }, [players, playerSortMode]);

  const sortedArchivedPlayers = useMemo(() => {
    const nextPlayers = [...archivedPlayers];

    if (playerSortMode === "recent") {
      return nextPlayers.reverse();
    }

    return nextPlayers.sort((a, b) =>
      displayPlayerName(a).localeCompare(displayPlayerName(b))
    );
    }, [archivedPlayers, playerSortMode]);

  const noClubLabel = t.noClub;

  const groupedPlayersByClub = useMemo(() => {
    const sourcePlayers = [...players];

    if (playerSortMode === "recent") {
      sourcePlayers.reverse();
    } else {
      sourcePlayers.sort((a, b) =>
        displayPlayerName(a).localeCompare(displayPlayerName(b))
      );
    }

    const groups = {};

    sourcePlayers.forEach((player) => {
      const clubName = String(player.club || "").trim() || noClubLabel;
      if (!groups[clubName]) groups[clubName] = [];
      groups[clubName].push(player);
    });

    const clubNames = Object.keys(groups).sort((a, b) => {
      if (a === noClubLabel) return 1;
      if (b === noClubLabel) return -1;
      return a.localeCompare(b);
    });

    return clubNames.map((clubName) => ({
      clubName,
      players: groups[clubName],
    }));
  }, [players, playerSortMode, noClubLabel]);

  const teamsWithTotals = useMemo(() => {
  return teams.map((team, index) => ({
    ...team,
    name: normalizeTeamName(index, team.name, language),
    players: team.players || [],
    total: teamTotal(team),
  }));
}, [teams, language]);

  const teamsGridColumns =
    teams.length <= 1 ? "1fr" : "repeat(2, minmax(0, 1fr))";

  const balancedScheduleRounds = useMemo(() => {
    const names = teamsWithTotals.map((team) => team.name);
    return buildBalancedMatchRounds(names, courtCount);
  }, [teamsWithTotals, courtCount]);

  const shuffleScheduleRounds = useMemo(() => {
    const names = teamsWithTotals.map((team) => team.name);
    return buildShuffleMatchRounds(names, courtCount);
  }, [teamsWithTotals, courtCount]);

  const activeScheduleRounds =
    matchMethod === "shuffle" ? shuffleScheduleRounds : balancedScheduleRounds;

  const currentMatches = useMemo(() => {
    if (!activeScheduleRounds.length) return [];
    return activeScheduleRounds[matchRoundIndex] || [];
  }, [activeScheduleRounds, matchRoundIndex]);

  const visibleTrainerUsers = useMemo(() => {
    return trainerUsers.filter((trainer) => trainer.role !== "archived");
  }, [trainerUsers]);

  const archivedTrainerUsers = useMemo(() => {
    return trainerUsers.filter((trainer) => trainer.role === "archived");
  }, [trainerUsers]);

  const trainerCopySourceUsers = useMemo(() => {
    return trainerUsers.filter(
      (trainer) => trainer.role === "trainer" && trainer.active
    );
  }, [trainerUsers]);

  const availablePlayersForTeams = useMemo(() => {
    const currentTeamNames = new Set(
      teams.flatMap((team) => (team.players || []).map((player) => player.name))
    );

    return players.filter((player) => !currentTeamNames.has(player.name));
  }, [players, teams]);

  useEffect(() => {
    const totalRounds = activeScheduleRounds.length;
    if (!totalRounds) {
      setMatchRoundIndex(0);
      return;
    }

    if (matchRoundIndex > totalRounds - 1) {
      setMatchRoundIndex(0);
    }
  }, [activeScheduleRounds, matchRoundIndex]);

  const totalPlayers = sortedPlayers.length;

  function renderTournamentDashboard() {
    const dashboardTabs = [
      { id: "overview", label: "Overview" },
      { id: "groups", label: "Groups" },
      { id: "bracket", label: "Bracket" },
      { id: "matches", label: "Matches" },
      { id: "table", label: "Table" },
      { id: "sharing", label: "Sharing" },
    ];

    const tournamentTeams = Array.isArray(activeTournament?.teams)
      ? activeTournament.teams
      : [];
    const tournamentGroups = Array.isArray(activeTournament?.groups)
      ? activeTournament.groups
      : [];
    const groupSlotTeams = getFilledGroupTeams(activeTournament);
    const dashboardTeams = groupSlotTeams.length ? groupSlotTeams : tournamentTeams;
    const tournamentMatches = Array.isArray(activeTournament?.matches)
      ? activeTournament.matches
      : [];
    const tournamentPlayersCount = dashboardTeams.reduce(
      (sum, team) => sum + (Array.isArray(team.players) ? team.players.length : 0),
      0
    );
    const completedMatchesCount = tournamentMatches.filter(
      (match) => match.status === "completed"
    ).length;
    const scheduledMatchesCount = Math.max(
      tournamentMatches.length - completedMatchesCount,
      0
    );
    const nextMatch =
      tournamentMatches.find((match) => match.status !== "completed") ||
      tournamentMatches[0] ||
      null;
    const isPublished = Boolean(
      activeTournament?.published || activeTournament?.status === "published"
    );
    const formatLabel =
      {
        "group-stage": tournamentText.formatGroupStage,
        "round-robin": tournamentText.formatRoundRobin,
        "single-elimination": tournamentText.formatSingleElimination,
      }[activeTournament?.format] ||
      activeTournament?.format ||
      "-";
    const configuredTotalTeams = Math.max(
      2,
      Number(activeTournament?.totalTeams || 10)
    );
    const configuredGroupCount = Math.max(
      1,
      Number(activeTournament?.groupCount || 2)
    );
    const configuredTeamsPerGroup = Math.max(
      1,
      Number(activeTournament?.teamsPerGroup || 5)
    );
    const configuredQualifiersPerGroup = Math.max(
      2,
      Number(activeTournament?.qualifiersPerGroup || 2)
    );
    const scheduleCourtCount = Math.max(
      1,
      Math.floor(Number(activeTournament?.courtCount || 3))
    );
    const scheduleGroupMinutes = Math.max(
      1,
      Number(activeTournament?.groupMatchMinutes || 12)
    );
    const schedulePlayoffMinutes = Math.max(
      1,
      Number(activeTournament?.playoffMatchMinutes || 15)
    );
    const scheduleBreakMinutes = Math.max(
      0,
      Number(activeTournament?.breakMinutes || 0)
    );
    const manualPreviewGroups = activeTournament
      ? buildManualGroups(activeTournament)
      : [];
    const storedKnockout = activeTournament?.knockout || {};
    const hasStoredKnockout = Boolean(
      (storedKnockout.quarterFinals || []).length ||
        (storedKnockout.semiFinals || []).length ||
        storedKnockout.final ||
        storedKnockout.thirdPlace
    );
    const knockoutPreview = activeTournament
      ? buildManualKnockout({
          ...activeTournament,
          groups: manualPreviewGroups,
        })
      : {};
    const displayKnockout = hasStoredKnockout
      ? storedKnockout
      : knockoutPreview;
    const filledSlotCount = manualPreviewGroups.reduce(
      (sum, group) =>
        sum +
        (group.teams || []).filter((team) => String(team.name || "").trim())
          .length,
      0
    );
    const previewFirstRound =
      (knockoutPreview.quarterFinals || []).length > 0
        ? knockoutPreview.quarterFinals
        : knockoutPreview.semiFinals || [];

    const statCards = [
      {
        label: language === "no" ? "Sloter" : "Slots",
        value: `${filledSlotCount}/${configuredTotalTeams}`,
        note: language === "no" ? "Manuell trekning" : "Manual draw",
        accent: "#2563eb",
      },
      {
        label: language === "no" ? "Grupper" : "Groups",
        value: manualPreviewGroups.length,
        note: `${configuredTeamsPerGroup} ${language === "no" ? "lag per gruppe" : "teams per group"}`,
        accent: "#0f766e",
      },
      {
        label: language === "no" ? "Baner" : "Courts",
        value: scheduleCourtCount,
        note: `${activeTournament?.startTime || "09:00"} start`,
        accent: "#7c3aed",
      },
      {
        label: tournamentText.matchesTitle,
        value: `${completedMatchesCount}/${tournamentMatches.length}`,
        note: tournamentText.matchStatusCompleted,
        accent: "#ea580c",
      },
    ];

    const findKnockoutMatch = (label) => {
      const knockout = activeTournament?.knockout || {};
      return [
        ...(knockout.quarterFinals || []),
        ...(knockout.semiFinals || []),
        knockout.final,
        knockout.thirdPlace,
      ].find((match) => match?.label === label || match?.id === label);
    };

    const resolveKnockoutSource = (source) => {
      const raw = String(source || "").trim();
      const groupPosition = raw.match(/^([A-Z])([12])$/);
      if (groupPosition) {
        const [, groupCode, position] = groupPosition;
        const group = advancingTeamsByGroup.find(
          (item) => item.groupCode === groupCode
        );
        if (!group) return raw;
        const hasCompletedGroupMatch = tournamentMatches.some(
          (match) =>
            match.groupId === group.groupId && match.status === "completed"
        );
        if (!hasCompletedGroupMatch) return raw;
        return position === "1" ? group.winner : group.runnerUp;
      }

      const winnerMatch = raw.match(/^Winner (QF\d+|SF\d+)$/);
      if (winnerMatch) {
        const match = findKnockoutMatch(winnerMatch[1]);
        return match?.winnerSource
          ? resolveKnockoutSource(match.winnerSource)
          : raw;
      }

      const loserMatch = raw.match(/^Loser (QF\d+|SF\d+)$/);
      if (loserMatch) {
        const match = findKnockoutMatch(loserMatch[1]);
        return match?.loserSource
          ? resolveKnockoutSource(match.loserSource)
          : raw;
      }

      return raw;
    };

    const renderBracketMatch = (match, stageKey, isFinal = false) => {
      if (!match) return null;
      const teamA = resolveKnockoutSource(match.sourceA || match.teamA);
      const teamB = resolveKnockoutSource(match.sourceB || match.teamB);
      const winner = match.winnerSource
        ? resolveKnockoutSource(match.winnerSource)
        : "";

      return (
        <div
          key={match.id}
          style={
            isFinal
              ? styles.tournamentBracketMatchFinal
              : styles.tournamentBracketMatch
          }
        >
          <div
            style={{
              ...styles.tournamentMiniTitle,
              ...(isFinal ? { color: "#fff" } : {}),
            }}
          >
            {match.label || match.id}
          </div>
          {[
            [match.sourceA || match.teamA, teamA],
            [match.sourceB || match.teamB, teamB],
          ].map(([source, label]) => {
            const isWinner = winner && winner === label;

            return (
              <button
                key={`${match.id}-${source}`}
                style={{
                  ...styles.tournamentBracketLine,
                  ...(isWinner ? styles.tournamentBracketLineWinner : {}),
                }}
                onClick={() =>
                  updateKnockoutMatchWinner(
                    stageKey,
                    match.id,
                    source,
                    source === (match.sourceA || match.teamA)
                      ? match.sourceB || match.teamB
                      : match.sourceA || match.teamA
                  )
                }
              >
                <span>{source}</span>
                <strong>{label}</strong>
              </button>
            );
          })}
        </div>
      );
    };

    const renderBracketPreviewMatch = (match, isFinal = false) => {
      if (!match) return null;
      const teamA = resolveKnockoutSource(match.sourceA || match.teamA);
      const teamB = resolveKnockoutSource(match.sourceB || match.teamB);

      return (
        <div
          key={`preview-${match.id}`}
          style={
            isFinal
              ? styles.tournamentBracketMatchFinal
              : styles.tournamentBracketMatch
          }
        >
          <div
            style={{
              ...styles.tournamentMiniTitle,
              ...(isFinal ? { color: "#fff" } : {}),
            }}
          >
            {match.label || match.id}
          </div>
          {[
            [match.sourceA || match.teamA, teamA],
            [match.sourceB || match.teamB, teamB],
          ].map(([source, label]) => (
            <div
              key={`preview-${match.id}-${source}`}
              style={{
                ...styles.tournamentBracketLine,
                cursor: "default",
                ...(isFinal
                  ? {
                      background: "rgba(255,255,255,0.08)",
                      borderColor: "rgba(255,255,255,0.16)",
                      color: "#fff",
                    }
                  : {}),
              }}
            >
              <span>{source}</span>
              <strong>{label || source}</strong>
            </div>
          ))}
        </div>
      );
    };

    const getPreviewTeamName = (team) =>
      String(team?.name || "").trim() || team?.slot || "-";
    const parseScheduleStart = (value) => {
      const [hours, minutes] = String(value || "09:00")
        .split(":")
        .map((part) => Number(part));
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 9 * 60;
      return hours * 60 + minutes;
    };
    const formatScheduleTime = (totalMinutes) => {
      const normalized = ((totalMinutes % 1440) + 1440) % 1440;
      const hours = Math.floor(normalized / 60);
      const minutes = normalized % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    };
    const scheduleGroupMatches = manualPreviewGroups.flatMap((group) => {
      const groupTeams = (group.teams || []).map((team) => ({
        slot: team.slot,
        label: getPreviewTeamName(team),
      }));
      const matches = [];

      for (let i = 0; i < groupTeams.length; i += 1) {
        for (let j = i + 1; j < groupTeams.length; j += 1) {
          matches.push({
            id: `schedule-${group.id}-${i}-${j}`,
            stage: "group",
            round: group.name,
            teamA: groupTeams[i].label,
            teamB: groupTeams[j].label,
          });
        }
      }

      return matches;
    });
    const scheduleKnockoutMatches = [
      ...(knockoutPreview.quarterFinals || []).map((match) => ({
        ...match,
        stage: "knockout",
        round: language === "no" ? "Forste utslag" : "First Knockout",
      })),
      ...(knockoutPreview.semiFinals || []).map((match) => ({
        ...match,
        stage: "knockout",
        round: tournamentText.semiFinals,
      })),
      knockoutPreview.final
        ? {
            ...knockoutPreview.final,
            stage: "knockout",
            round: tournamentText.final,
          }
        : null,
      activeTournament?.thirdPlaceMatch && knockoutPreview.thirdPlace
        ? {
            ...knockoutPreview.thirdPlace,
            stage: "knockout",
            round: tournamentText.thirdPlace,
          }
        : null,
    ].filter(Boolean);
    const scheduleItems = [
      ...scheduleGroupMatches,
      ...scheduleKnockoutMatches.map((match) => ({
        id: `schedule-${match.id}`,
        stage: "knockout",
        round: match.round,
        teamA: match.sourceA || match.teamA,
        teamB: match.sourceB || match.teamB,
      })),
    ];
    const hallScheduleBatches = [];
    let scheduleCursor = parseScheduleStart(activeTournament?.startTime);

    for (
      let index = 0, batchNumber = 1;
      index < scheduleItems.length;
      index += scheduleCourtCount, batchNumber += 1
    ) {
      const batchItems = scheduleItems.slice(index, index + scheduleCourtCount);
      const isPlayoffBatch = batchItems.some(
        (item) => item.stage === "knockout"
      );
      const duration = isPlayoffBatch
        ? schedulePlayoffMinutes
        : scheduleGroupMinutes;

      hallScheduleBatches.push({
        id: `schedule-batch-${batchNumber}`,
        number: batchNumber,
        time: formatScheduleTime(scheduleCursor),
        duration,
        items: Array.from(
          { length: scheduleCourtCount },
          (_, courtIndex) => batchItems[courtIndex] || null
        ),
      });

      scheduleCursor += duration + scheduleBreakMinutes;
    }

    const renderHallSchedulePreview = (limit = 12) => {
      const visibleBatches = hallScheduleBatches.slice(0, limit);
      const hiddenCount = Math.max(hallScheduleBatches.length - limit, 0);

      return (
        <div style={styles.tournamentScheduleWrap}>
          <div
            style={{
              ...styles.tournamentScheduleGrid,
              minWidth: `${Math.max(620, scheduleCourtCount * 180 + 140)}px`,
            }}
          >
            {visibleBatches.map((batch) => (
              <div key={batch.id} style={styles.tournamentScheduleRow}>
                <div style={styles.tournamentScheduleTimeCell}>
                  <span>
                    {language === "no" ? "Runde" : "Batch"} {batch.number}
                  </span>
                  <strong>{batch.time}</strong>
                  <small>{batch.duration} min</small>
                </div>
                <div
                  style={{
                    ...styles.tournamentScheduleCourts,
                    gridTemplateColumns: `repeat(${scheduleCourtCount}, minmax(150px, 1fr))`,
                  }}
                >
                  {batch.items.map((item, courtIndex) => (
                    <div
                      key={`${batch.id}-court-${courtIndex}`}
                      style={styles.tournamentScheduleCourt}
                    >
                      <span>
                        {language === "no" ? "Bane" : "Court"} {courtIndex + 1}
                      </span>
                      <strong>
                        {item
                          ? `${item.teamA} vs ${item.teamB}`
                          : language === "no"
                            ? "Ledig bane"
                            : "Open court"}
                      </strong>
                      <small>
                        {item
                          ? item.round
                          : language === "no"
                            ? "Pause"
                            : "Break"}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {hiddenCount > 0 && (
            <div style={styles.tournamentScheduleMore}>
              +{hiddenCount} {language === "no" ? "flere runder" : "more batches"}
            </div>
          )}
        </div>
      );
    };

    return (
      <div style={styles.tournamentDashboardSection}>
        {!auth.loggedIn ? (
          <div style={styles.lockedCard}>{tournamentText.loginRequired}</div>
        ) : (
          <div
            style={{
              ...styles.tournamentDashboardShell,
              ...(isMobile ? styles.tournamentDashboardShellMobile : {}),
            }}
          >
            <aside style={styles.tournamentSetupPanel}>
              <div style={styles.tournamentPanelHeader}>
                <div>
                  <div style={styles.tournamentEyebrow}>
                    {language === "no" ? "Kontrollpanel" : "Control Panel"}
                  </div>
                  <div style={styles.tournamentPanelTitle}>
                    {language === "no" ? "Turneringsoppsett" : "Tournament Setup"}
                  </div>
                </div>

                <button
                  style={styles.secondaryButtonCompact}
                  onClick={() => setShowCreateTournamentForm((prev) => !prev)}
                >
                  {showCreateTournamentForm ? t.close : tournamentText.newTournament}
                </button>
              </div>

              {showCreateTournamentForm && (
                <div style={styles.tournamentSetupBlock}>
                  <input
                    style={styles.input}
                    value={newTournamentName}
                    onChange={(e) => setNewTournamentName(e.target.value)}
                    placeholder={tournamentText.namePlaceholder}
                  />

                  <textarea
                    style={styles.textarea}
                    value={newTournamentRules}
                    onChange={(e) => setNewTournamentRules(e.target.value)}
                    placeholder={tournamentText.rulesPlaceholder}
                  />

                  <button style={styles.primaryButton} onClick={createTournament}>
                    {tournamentText.createButton}
                  </button>
                </div>
              )}

              {tournamentActionMessage && (
                <div style={styles.tournamentMessage}>
                  {tournamentActionMessage}
                </div>
              )}

              <div style={styles.tournamentSetupBlock}>
                <div style={styles.tournamentBlockTitle}>
                  {tournamentText.listTitle}
                </div>

                <div style={styles.tournamentList}>
                  {tournaments.length === 0 ? (
                    <div style={styles.emptyText}>{tournamentText.emptyList}</div>
                  ) : (
                    tournaments.map((item) => {
                      const isActive = item.id === activeTournamentId;

                      return (
                        <button
                          key={item.id}
                          style={{
                            ...styles.tournamentListItem,
                            ...(isActive ? styles.tournamentListItemActive : {}),
                          }}
                          onClick={() => {
                            setActiveTournamentId(item.id);
                            setTournamentActionMessage("");
                          }}
                        >
                          <span style={styles.tournamentListItemTitle}>
                            {item.name}
                          </span>
                          <span style={styles.tournamentListItemMeta}>
                            {getTournamentStatusLabel(item)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {activeTournament && (
                <>
                  <div style={styles.tournamentSetupBlock}>
                    <div style={styles.tournamentBlockTitle}>
                      {tournamentText.informationSection}
                    </div>

                    <div style={styles.settingsLabel}>
                      {tournamentText.nameLabel}
                    </div>
                    <input
                      style={styles.input}
                      value={activeTournament.name || ""}
                      onChange={(e) =>
                        updateActiveTournament({ name: e.target.value })
                      }
                    />

                    <div style={styles.settingsLabel}>
                      {tournamentText.rulesLabel}
                    </div>
                    <textarea
                      style={styles.textarea}
                      value={activeTournament.rules || ""}
                      onChange={(e) =>
                        updateActiveTournament({ rules: e.target.value })
                      }
                    />

                    <div style={styles.tournamentInlineActions}>
                      <div style={styles.tournamentStatusBadge}>
                        {getTournamentStatusLabel(activeTournament)}
                      </div>

                      {isPublished ? (
                        <button
                          style={styles.secondaryButtonCompact}
                          onClick={unpublishTournament}
                        >
                          {tournamentText.unpublish}
                        </button>
                      ) : (
                        <button
                          style={styles.primaryButtonSmall}
                          onClick={publishTournament}
                        >
                          {tournamentText.publish}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={styles.tournamentSetupBlock}>
                    <div style={styles.tournamentBlockTitle}>
                      {tournamentText.formatSection}
                    </div>

                    <div style={styles.settingsLabel}>
                      {tournamentText.formatLabel}
                    </div>
                    <select
                      style={styles.select}
                      value={activeTournament.format}
                      onChange={(e) =>
                        updateActiveTournament({ format: e.target.value })
                      }
                    >
                      <option value="group-stage">
                        {tournamentText.formatGroupStage}
                      </option>
                      <option value="round-robin">
                        {tournamentText.formatRoundRobin}
                      </option>
                      <option value="single-elimination">
                        {tournamentText.formatSingleElimination}
                      </option>
                    </select>

                    <div
                      style={{
                        ...styles.tournamentFieldGrid,
                        ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                      }}
                    >
                      <div>
                        <div style={styles.settingsLabel}>
                          {language === "no" ? "Totalt antall lag" : "Total Teams"}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={2}
                          value={activeTournament.totalTeams}
                          onChange={(e) => {
                            const nextTotalTeams = Math.max(
                              2,
                              Number(e.target.value) || 2
                            );
                            const nextGroupCount = Math.max(
                              1,
                              Number(activeTournament.groupCount || 2)
                            );

                            updateActiveTournament({
                              totalTeams: nextTotalTeams,
                              teamsPerGroup: Math.max(
                                1,
                                Math.ceil(nextTotalTeams / nextGroupCount)
                              ),
                            });
                          }}
                        />
                      </div>

                      <div>
                        <div style={styles.settingsLabel}>
                          {tournamentText.groupCountLabel}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={1}
                          value={activeTournament.groupCount}
                          onChange={(e) => {
                            const nextGroupCount = Math.max(
                              1,
                              Number(e.target.value) || 1
                            );
                            const nextTotalTeams = Math.max(
                              2,
                              Number(activeTournament.totalTeams || 10)
                            );

                            updateActiveTournament({
                              groupCount: nextGroupCount,
                              teamsPerGroup: Math.max(
                                1,
                                Math.ceil(nextTotalTeams / nextGroupCount)
                              ),
                              bracketSize: nextGroupCount * 2,
                            });
                          }}
                        />
                      </div>

                      <div>
                        <div style={styles.settingsLabel}>
                          {language === "no" ? "Lag per gruppe" : "Teams per Group"}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={1}
                          value={activeTournament.teamsPerGroup}
                          onChange={(e) =>
                            updateActiveTournament({
                              teamsPerGroup: Math.max(
                                1,
                                Number(e.target.value) || 1
                              ),
                            })
                          }
                        />
                      </div>

                      <div>
                        <div style={styles.settingsLabel}>
                          {language === "no" ? "Kvalifiserte" : "Qualifiers"}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={2}
                          max={2}
                          value={configuredQualifiersPerGroup}
                          readOnly
                        />
                      </div>
                    </div>

                    <label style={styles.tournamentCheckRow}>
                      <input
                        type="checkbox"
                        checked={Boolean(activeTournament.thirdPlaceMatch)}
                        onChange={(e) =>
                          updateActiveTournament({
                            thirdPlaceMatch: e.target.checked,
                          })
                        }
                      />
                      <span>{tournamentText.thirdPlaceLabel}</span>
                    </label>

                    <div style={styles.tournamentSetupDivider} />

                    <div
                      style={{
                        ...styles.tournamentFieldGrid,
                        ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                      }}
                    >
                      <div>
                        <div style={styles.settingsLabel}>
                          {language === "no" ? "Starttid" : "Start Time"}
                        </div>
                        <input
                          style={styles.input}
                          type="time"
                          value={activeTournament.startTime || "09:00"}
                          onChange={(e) =>
                            updateActiveTournament({ startTime: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <div style={styles.settingsLabel}>
                          {language === "no" ? "Antall baner" : "Courts"}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={1}
                          value={scheduleCourtCount}
                          onChange={(e) =>
                            updateActiveTournament({
                              courtCount: Math.max(
                                1,
                                Number(e.target.value) || 1
                              ),
                            })
                          }
                        />
                      </div>

                      <div>
                        <div style={styles.settingsLabel}>
                          {language === "no" ? "Gruppe min" : "Group Min"}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={1}
                          value={scheduleGroupMinutes}
                          onChange={(e) =>
                            updateActiveTournament({
                              groupMatchMinutes: Math.max(
                                1,
                                Number(e.target.value) || 1
                              ),
                            })
                          }
                        />
                      </div>

                      <div>
                        <div style={styles.settingsLabel}>
                          {language === "no" ? "Sluttspill min" : "Playoff Min"}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={1}
                          value={schedulePlayoffMinutes}
                          onChange={(e) =>
                            updateActiveTournament({
                              playoffMatchMinutes: Math.max(
                                1,
                                Number(e.target.value) || 1
                              ),
                            })
                          }
                        />
                      </div>

                      <div>
                        <div style={styles.settingsLabel}>
                          {language === "no" ? "Pause min" : "Break Min"}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={0}
                          value={scheduleBreakMinutes}
                          onChange={(e) =>
                            updateActiveTournament({
                              breakMinutes: Math.max(
                                0,
                                Number(e.target.value) || 0
                              ),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div style={styles.tournamentInlineActions}>
                      <button
                        style={styles.secondaryButtonCompact}
                        onClick={generateTournamentGroups}
                      >
                        {language === "no" ? "Bygg gruppesloter" : "Build Group Slots"}
                      </button>
                      <button
                        style={styles.secondaryButtonCompact}
                        onClick={generateTournamentKnockout}
                      >
                        {tournamentText.generateKnockout}
                      </button>
                    </div>
                  </div>

                  <div style={styles.tournamentSetupBlock}>
                    <div style={styles.tournamentSectionHeader}>
                      <div>
                        <div style={styles.tournamentBlockTitle}>
                          {language === "no" ? "Manuell gruppeinndata" : "Manual Group Entry"}
                        </div>
                        <div style={styles.tournamentSidebarNote}>
                          {language === "no"
                            ? "Fyll slotene i samme rekkefolge som papirtrekket."
                            : "Fill slots in the exact paper-draw order."}
                        </div>
                      </div>
                      <div style={styles.tournamentStatusBadge}>
                        {filledSlotCount}/{configuredTotalTeams}
                      </div>
                    </div>

                    <div style={styles.tournamentSidebarSlotList}>
                      {manualPreviewGroups.map((group) => {
                        const isEditableGroup = tournamentGroups.some(
                          (item) => item.id === group.id
                        );

                        return (
                          <div
                            key={`sidebar-${group.id}`}
                            style={styles.tournamentSidebarGroup}
                          >
                            <div style={styles.tournamentSidebarGroupHeader}>
                              <strong>{group.name}</strong>
                              <span>
                                {(group.teams || []).length}{" "}
                                {language === "no" ? "sloter" : "slots"}
                              </span>
                            </div>
                            {(group.teams || []).map((team, index) => (
                              <div
                                key={`sidebar-${group.id}-${team.id}`}
                                style={styles.tournamentSidebarSlotRow}
                              >
                                <span style={styles.tournamentTeamSeed}>
                                  {team.slot || `${group.code}${index + 1}`}
                                </span>
                                <input
                                  style={styles.tournamentSlotInput}
                                  value={team.name || ""}
                                  disabled={!isEditableGroup}
                                  onChange={(e) =>
                                    updateManualGroupSlot(
                                      group.id,
                                      team.id,
                                      e.target.value
                                    )
                                  }
                                  placeholder={
                                    isEditableGroup
                                      ? language === "no"
                                        ? "Lagnavn"
                                        : "Team name"
                                      : language === "no"
                                        ? "Bygg sloter"
                                        : "Build slots"
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      style={styles.primaryButtonSmall}
                      onClick={generateTournamentGroups}
                    >
                      {language === "no" ? "Bygg / oppdater sloter" : "Build / Update Slots"}
                    </button>
                  </div>

                  <div style={styles.tournamentSetupBlock}>
                    <div style={styles.tournamentBlockTitle}>
                      {tournamentText.settingsSection}
                    </div>

                    <div style={styles.tournamentCheckboxGrid}>
                      {[
                        ["showScores", tournamentText.showScores],
                        ["showDates", tournamentText.showDates],
                        ["showLocations", tournamentText.showLocations],
                        ["showRoundTitles", tournamentText.showRoundTitles],
                      ].map(([key, label]) => (
                        <label key={key} style={styles.tournamentCheckRow}>
                          <input
                            type="checkbox"
                            checked={Boolean(
                              activeTournament.displaySettings?.[key]
                            )}
                            onChange={(e) =>
                              updateActiveTournamentDisplaySetting(
                                key,
                                e.target.checked
                              )
                            }
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={styles.tournamentSetupBlock}>
                    <div style={styles.tournamentBlockTitle}>
                      {language === "no" ? "Registrering" : "Registration"}
                    </div>

                    <div
                      style={{
                        ...styles.tournamentRegistrationGrid,
                        ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                      }}
                    >
                      <input
                        style={styles.input}
                        value={newTournamentTeamName}
                        onChange={(e) =>
                          setNewTournamentTeamName(e.target.value)
                        }
                        placeholder={language === "no" ? "Lagnavn" : "Team name"}
                      />
                      <input
                        style={styles.input}
                        value={newTournamentTeamClub}
                        onChange={(e) =>
                          setNewTournamentTeamClub(e.target.value)
                        }
                        placeholder={language === "no" ? "Klubb" : "Club"}
                      />
                      <button
                        style={styles.primaryButtonSmall}
                        onClick={addTournamentTeam}
                      >
                        {tournamentText.addTeamButton}
                      </button>
                    </div>

                    <div style={styles.tournamentTeamList}>
                      {tournamentTeams.length > 0 ? (
                        tournamentTeams.map((team) => (
                          <div key={team.id} style={styles.tournamentTeamRow}>
                            <div style={styles.tournamentTeamRowTop}>
                              <div style={styles.tournamentTeamIdentity}>
                                {editingTournamentTeamId === team.id ? (
                                  <input
                                    style={styles.input}
                                    value={editingTournamentTeamName}
                                    onChange={(e) =>
                                      setEditingTournamentTeamName(
                                        e.target.value
                                      )
                                    }
                                    placeholder={
                                      language === "no" ? "Lagnavn" : "Team name"
                                    }
                                  />
                                ) : (
                                  <div style={styles.tournamentTeamName}>
                                    {team.name}
                                  </div>
                                )}
                                <div style={styles.tournamentTeamMeta}>
                                  {team.club ? `${team.club} - ` : ""}
                                  {team.locked
                                    ? language === "no"
                                      ? "Last"
                                      : "Locked"
                                    : language === "no"
                                      ? "Apen"
                                      : "Open"}
                                </div>
                              </div>

                              <div style={styles.tournamentTeamActions}>
                                {editingTournamentTeamId === team.id ? (
                                  <>
                                    <button
                                      style={styles.smallPrimaryButton}
                                      onClick={() =>
                                        saveTournamentTeamName(team.id)
                                      }
                                    >
                                      {tournamentText.saveTeam}
                                    </button>
                                    <button
                                      style={styles.secondaryButtonCompact}
                                      onClick={() => {
                                        setEditingTournamentTeamId("");
                                        setEditingTournamentTeamName("");
                                      }}
                                    >
                                      {tournamentText.cancelEdit}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      style={styles.secondaryButtonCompact}
                                      onClick={() =>
                                        toggleTournamentTeamLock(team.id)
                                      }
                                    >
                                      {team.locked
                                        ? tournamentText.unlockTeam
                                        : tournamentText.lockTeam}
                                    </button>
                                    <button
                                      style={styles.secondaryButtonCompact}
                                      onClick={() =>
                                        startEditTournamentTeam(team)
                                      }
                                    >
                                      {tournamentText.editTeam}
                                    </button>
                                    <button
                                      style={styles.secondaryButtonCompact}
                                      onClick={() =>
                                        deleteTournamentTeam(team.id)
                                      }
                                    >
                                      {tournamentText.deleteTeam}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                ...styles.tournamentPlayerRegister,
                                ...(isMobile
                                  ? styles.tournamentFieldGridMobile
                                  : {}),
                              }}
                            >
                              <input
                                style={styles.input}
                                value={newTournamentPlayerNames[team.id] || ""}
                                onChange={(e) =>
                                  setNewTournamentPlayerNames((prev) => ({
                                    ...prev,
                                    [team.id]: e.target.value,
                                  }))
                                }
                                placeholder={
                                  language === "no" ? "Spillernavn" : "Player name"
                                }
                              />
                              <button
                                style={styles.primaryButtonSmall}
                                onClick={() => addTournamentPlayer(team.id)}
                              >
                                {tournamentText.addPlayerButton}
                              </button>
                            </div>

                            <div style={styles.tournamentPlayerList}>
                              {Array.isArray(team.players) &&
                              team.players.length > 0 ? (
                                team.players.map((player) => (
                                  <div
                                    key={player.id || player.name}
                                    style={styles.tournamentPlayerPill}
                                  >
                                    <span>{player.name}</span>
                                    <span style={styles.tournamentPlayerMeta}>
                                      {player.registeredBy}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div style={styles.tournamentMutedText}>
                                  {tournamentText.noPlayersYet}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={styles.tournamentMutedText}>
                          {tournamentText.noTeamsYet}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </aside>

            <main style={styles.tournamentMainPanel}>
              {activeTournament ? (
                <>
                  <div style={styles.tournamentHero}>
                    <div style={styles.tournamentHeroText}>
                      <div style={styles.tournamentEyebrow}>
                        {language === "no" ? "Turneringsdashboard" : "Tournament Dashboard"}
                      </div>
                      <h2 style={styles.tournamentHeroTitle}>
                        {activeTournament.name}
                      </h2>
                      <div style={styles.tournamentHeroMeta}>
                        {formatLabel} - {getTournamentStatusLabel(activeTournament)}
                      </div>
                      <p style={styles.tournamentHeroRules}>
                        {activeTournament.rules || tournamentText.noRules}
                      </p>
                    </div>

                    <div style={styles.tournamentHeroActions}>
                      <div style={styles.tournamentHeroBadge}>
                        {isPublished
                          ? tournamentText.published
                          : tournamentText.unpublished}
                      </div>
                      {isPublished ? (
                        <button
                          style={styles.tournamentLightButton}
                          onClick={unpublishTournament}
                        >
                          {tournamentText.unpublish}
                        </button>
                      ) : (
                        <button
                          style={styles.tournamentLightButton}
                          onClick={publishTournament}
                        >
                          {tournamentText.publish}
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.tournamentStatsGrid,
                      ...(isMobile ? styles.tournamentStatsGridMobile : {}),
                    }}
                  >
                    {statCards.map((card) => (
                      <div
                        key={card.label}
                        style={{
                          ...styles.tournamentStatCard,
                          borderTop: `4px solid ${card.accent}`,
                        }}
                      >
                        <div style={styles.tournamentStatValue}>{card.value}</div>
                        <div style={styles.tournamentStatLabel}>{card.label}</div>
                        <div style={styles.tournamentStatNote}>{card.note}</div>
                      </div>
                    ))}
                  </div>

                  <div style={styles.tournamentSubTabs}>
                    {dashboardTabs.map((tab) => (
                      <button
                        key={tab.id}
                        style={{
                          ...styles.tournamentSubTab,
                          ...(activeTournamentView === tab.id
                            ? styles.tournamentSubTabActive
                            : {}),
                        }}
                        onClick={() => setActiveTournamentView(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div style={styles.tournamentWorkspace}>
                    {activeTournamentView === "overview" && (
                      <div
                        style={{
                          ...styles.tournamentOverviewGrid,
                          ...(isMobile ? styles.tournamentTwoColumnMobile : {}),
                        }}
                      >
                        <div style={styles.tournamentOverviewHero}>
                          <div style={styles.tournamentEyebrow}>
                            {language === "no" ? "Oversikt" : "Overview"}
                          </div>
                          <div style={styles.tournamentOverviewTitle}>
                            {activeTournament.name}
                          </div>
                          <div style={styles.tournamentOverviewCopy}>
                            {activeTournament.rules || tournamentText.noRules}
                          </div>

                          <div
                            style={{
                              ...styles.tournamentOverviewStats,
                              ...(isMobile ? styles.tournamentStatsGridMobile : {}),
                            }}
                          >
                            {statCards.map((card) => (
                              <div
                                key={`overview-${card.label}`}
                                style={styles.tournamentOverviewStat}
                              >
                                <span>{card.label}</span>
                                <strong>{card.value}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div
                          style={{
                            ...styles.tournamentSurface,
                            gridColumn: "1 / -1",
                          }}
                        >
                          <div style={styles.tournamentSectionHeader}>
                            <div>
                              <div style={styles.tournamentEyebrow}>
                                {language === "no" ? "Halloppsett" : "Hall Setup"}
                              </div>
                              <div style={styles.tournamentSectionTitle}>
                                {language === "no"
                                  ? "Manuell trekning og sluttspillforhandsvisning"
                                  : "Manual Draw and Playoff Preview"}
                              </div>
                              <div style={styles.tournamentMutedText}>
                                {language === "no"
                                  ? "Gruppene viser papirrekkefolgen for slotene. Sluttspill er forhåndsvisning basert på A1/B2-logikken."
                                  : "Groups show the paper-draw slot order. Knockout preview follows the A1/B2 advancement logic."}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {configuredGroupCount} x {configuredTeamsPerGroup}
                            </div>
                          </div>

                          <div
                            style={{
                              ...styles.tournamentPreviewLayout,
                              ...(isMobile ? styles.tournamentTwoColumnMobile : {}),
                            }}
                          >
                            <div style={styles.tournamentPreviewGroups}>
                              {manualPreviewGroups.map((group) => (
                                <div
                                  key={`overview-preview-${group.id}`}
                                  style={styles.tournamentPreviewGroupCard}
                                >
                                  <div style={styles.tournamentGroupHeader}>
                                    <div style={styles.tournamentMiniTitle}>
                                      {group.name}
                                    </div>
                                    <div style={styles.tournamentGroupCount}>
                                      {group.code}
                                    </div>
                                  </div>
                                  <div style={styles.tournamentSnapshotList}>
                                    {(group.teams || []).map((team, index) => (
                                      <div
                                        key={`overview-preview-${group.id}-${team.id}`}
                                        style={styles.tournamentPreviewSlotRow}
                                      >
                                        <span style={styles.tournamentTeamSeed}>
                                          {team.slot || `${group.code}${index + 1}`}
                                        </span>
                                        <strong>
                                          {String(team.name || "").trim() ||
                                            (language === "no"
                                              ? "Tom slot"
                                              : "Empty slot")}
                                        </strong>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div style={styles.tournamentPreviewBracketCard}>
                              <div style={styles.tournamentSectionHeader}>
                                <div>
                                  <div style={styles.tournamentEyebrow}>
                                    {language === "no" ? "Sluttspill" : "Playoff"}
                                  </div>
                                  <div
                                    style={{
                                      ...styles.tournamentMiniTitle,
                                      color: "#fff",
                                    }}
                                  >
                                    {language === "no"
                                      ? "Automatisk kampoppsett"
                                      : "Automatic matchup map"}
                                  </div>
                                </div>
                                <div style={styles.tournamentStatusBadge}>
                                  Top 2
                                </div>
                              </div>

                              <div style={styles.tournamentPreviewMatchList}>
                                {previewFirstRound.map((match) => (
                                  <div
                                    key={`overview-ko-${match.id}`}
                                    style={styles.tournamentPreviewMatchRow}
                                  >
                                    <span>{match.label}</span>
                                    <strong>
                                      {match.sourceA || match.teamA} vs{" "}
                                      {match.sourceB || match.teamB}
                                    </strong>
                                  </div>
                                ))}
                                {(knockoutPreview.semiFinals || []).length > 0 && (
                                  <div style={styles.tournamentPreviewMatchRow}>
                                    <span>{tournamentText.semiFinals}</span>
                                    <strong>
                                      {(knockoutPreview.semiFinals || [])
                                        .map(
                                          (match) =>
                                            `${match.sourceA || match.teamA} vs ${
                                              match.sourceB || match.teamB
                                            }`
                                        )
                                        .join(" / ")}
                                    </strong>
                                  </div>
                                )}
                                {knockoutPreview.final && (
                                  <div style={styles.tournamentPreviewMatchRow}>
                                    <span>{tournamentText.final}</span>
                                    <strong>
                                      {knockoutPreview.final.sourceA ||
                                        knockoutPreview.final.teamA}{" "}
                                      vs{" "}
                                      {knockoutPreview.final.sourceB ||
                                        knockoutPreview.final.teamB}
                                    </strong>
                                  </div>
                                )}
                                {activeTournament.thirdPlaceMatch &&
                                  knockoutPreview.thirdPlace && (
                                    <div style={styles.tournamentPreviewMatchRow}>
                                      <span>{tournamentText.thirdPlace}</span>
                                      <strong>
                                        {knockoutPreview.thirdPlace.sourceA ||
                                          knockoutPreview.thirdPlace.teamA}{" "}
                                        vs{" "}
                                        {knockoutPreview.thirdPlace.sourceB ||
                                          knockoutPreview.thirdPlace.teamB}
                                      </strong>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            ...styles.tournamentSurface,
                            gridColumn: "1 / -1",
                          }}
                        >
                          <div style={styles.tournamentSectionHeader}>
                            <div>
                              <div style={styles.tournamentEyebrow}>
                                {language === "no" ? "Hallplan" : "Hall Schedule"}
                              </div>
                              <div style={styles.tournamentSectionTitle}>
                                {language === "no"
                                  ? "Runder, baner og tidspunkter"
                                  : "Batches, Courts and Times"}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {scheduleCourtCount}{" "}
                              {language === "no" ? "baner" : "courts"}
                            </div>
                          </div>
                          {renderHallSchedulePreview(12)}
                        </div>

                        <div style={styles.tournamentSurface}>
                          <div style={styles.tournamentSectionHeader}>
                            <div>
                              <div style={styles.tournamentEyebrow}>
                                {language === "no" ? "Format" : "Format"}
                              </div>
                              <div style={styles.tournamentSectionTitle}>
                                {tournamentText.formatSection}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {formatLabel}
                            </div>
                          </div>

                          <div style={styles.tournamentInfoGrid}>
                            {[
                              [tournamentText.formatLabel, formatLabel],
                              [tournamentText.groupCountLabel, activeTournament.groupCount],
                              [tournamentText.bracketSizeLabel, activeTournament.bracketSize],
                              [
                                tournamentText.thirdPlaceLabel,
                                activeTournament.thirdPlaceMatch ? "Yes" : "No",
                              ],
                            ].map(([label, value]) => (
                              <div key={label} style={styles.tournamentInfoTile}>
                                <span>{label}</span>
                                <strong>{value}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={styles.tournamentSurface}>
                          <div style={styles.tournamentSectionHeader}>
                            <div>
                              <div style={styles.tournamentEyebrow}>
                                {language === "no" ? "Deltakere" : "Participants"}
                              </div>
                              <div style={styles.tournamentSectionTitle}>
                                {tournamentText.participantsSection}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {dashboardTeams.length} {language === "no" ? "lag" : "teams"} /{" "}
                              {tournamentPlayersCount}{" "}
                              {language === "no" ? "spillere" : "players"}
                            </div>
                          </div>

                          {dashboardTeams.length > 0 ? (
                            <div style={styles.tournamentSnapshotList}>
                              {dashboardTeams.map((team) => (
                                <div
                                  key={`snapshot-${team.id}`}
                                  style={styles.tournamentSnapshotRow}
                                >
                                  <span>{team.name}</span>
                                  <strong>
                                    {team.slot
                                      ? team.slot
                                      : Array.isArray(team.players)
                                        ? `${team.players.length} ${
                                            language === "no" ? "spillere" : "players"
                                          }`
                                        : "0"}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={styles.tournamentMutedPanel}>
                              {tournamentText.noTeamsYet}
                            </div>
                          )}
                        </div>

                        <div style={styles.tournamentSurface}>
                          <div style={styles.tournamentSectionHeader}>
                            <div>
                              <div style={styles.tournamentEyebrow}>
                                {language === "no" ? "Kamper" : "Matches"}
                              </div>
                              <div style={styles.tournamentSectionTitle}>
                                {tournamentText.matchesTitle}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {scheduledMatchesCount} {tournamentText.matchStatusScheduled}
                            </div>
                          </div>

                          <div style={styles.tournamentMatchSummaryGrid}>
                            <div style={styles.tournamentInfoTile}>
                              <span>{tournamentText.matchStatusCompleted}</span>
                              <strong>{completedMatchesCount}</strong>
                            </div>
                            <div style={styles.tournamentInfoTile}>
                              <span>{tournamentText.matchStatusScheduled}</span>
                              <strong>{scheduledMatchesCount}</strong>
                            </div>
                          </div>

                          {nextMatch && (
                            <div style={styles.tournamentFeatureMatch}>
                              <span>{language === "no" ? "Neste kamp" : "Next Match"}</span>
                              <strong>
                                {nextMatch.teamA} vs {nextMatch.teamB}
                              </strong>
                            </div>
                          )}

                          {tournamentMatches.length > 0 ? (
                            <div style={styles.tournamentSnapshotList}>
                              {tournamentMatches.slice(0, 4).map((match) => (
                                <div
                                  key={`overview-match-${match.id}`}
                                  style={styles.tournamentSnapshotRow}
                                >
                                  <span>
                                    {match.teamA} vs {match.teamB}
                                  </span>
                                  <strong>
                                    {match.status === "completed"
                                      ? tournamentText.matchStatusCompleted
                                      : tournamentText.matchStatusScheduled}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={styles.tournamentMutedPanel}>
                              {tournamentText.noMatchesYet}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTournamentView === "groups" && (
                      <div style={styles.tournamentSurface}>
                        <div style={styles.tournamentSectionHeader}>
                          <div>
                            <div style={styles.tournamentEyebrow}>
                              {language === "no" ? "Grupper" : "Groups"}
                            </div>
                            <div style={styles.tournamentSectionTitle}>
                              {tournamentText.groupStagePreview}
                            </div>
                          </div>
                          <button
                            style={styles.primaryButtonSmall}
                            onClick={generateTournamentGroups}
                          >
                            {tournamentText.generateGroups}
                          </button>
                        </div>

                        {manualPreviewGroups.length > 0 ? (
                          <div
                            style={{
                              ...styles.tournamentGroupGrid,
                              ...(isMobile ? styles.tournamentGroupGridMobile : {}),
                            }}
                          >
                            {manualPreviewGroups.map((group) => {
                              const isEditableGroup = tournamentGroups.some(
                                (item) => item.id === group.id
                              );

                              return (
                                <div
                                  key={group.id}
                                  style={styles.tournamentGroupCard}
                                >
                                  <div style={styles.tournamentGroupHeader}>
                                    <div>
                                      <div style={styles.tournamentMiniTitle}>
                                        {group.name}
                                      </div>
                                      <div style={styles.tournamentMutedText}>
                                        {language === "no"
                                          ? "Manuell papirrekkefolge"
                                          : "Manual paper-draw order"}
                                      </div>
                                    </div>
                                    <div style={styles.tournamentGroupCount}>
                                      {Array.isArray(group.teams)
                                        ? group.teams.length
                                        : 0}
                                    </div>
                                  </div>
                                  {Array.isArray(group.teams) &&
                                  group.teams.length > 0 ? (
                                    <div style={styles.tournamentSnapshotList}>
                                      {group.teams.map((team, index) => (
                                        <div
                                          key={`${group.id}-${team.id}`}
                                          style={styles.tournamentGroupTeamRow}
                                        >
                                          <span style={styles.tournamentTeamSeed}>
                                            {team.slot || `${group.code}${index + 1}`}
                                          </span>
                                          <input
                                            style={styles.tournamentSlotInput}
                                            value={team.name || ""}
                                            disabled={!isEditableGroup}
                                            onChange={(e) =>
                                              updateManualGroupSlot(
                                                group.id,
                                                team.id,
                                                e.target.value
                                              )
                                            }
                                            placeholder={
                                              isEditableGroup
                                                ? language === "no"
                                                  ? "Skriv lagnavn"
                                                  : "Enter team name"
                                                : language === "no"
                                                  ? "Bygg sloter for a redigere"
                                                  : "Build slots to edit"
                                            }
                                          />
                                          <strong>
                                            {isEditableGroup
                                              ? team.club || "-"
                                              : language === "no"
                                                ? "Forhandsvisning"
                                                : "Preview"}
                                          </strong>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={styles.tournamentMutedText}>
                                      {tournamentText.noTeamsYet}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={styles.tournamentMutedPanel}>
                            {tournamentText.noGroupsYet}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTournamentView === "bracket" && (
                      <div style={styles.tournamentSurface}>
                        <div style={styles.tournamentSectionHeader}>
                          <div>
                            <div style={styles.tournamentEyebrow}>
                              {language === "no" ? "Sluttspill" : "Knockout"}
                            </div>
                            <div style={styles.tournamentSectionTitle}>
                              {tournamentText.knockoutPreview}
                            </div>
                          </div>
                          <button
                            style={styles.primaryButtonSmall}
                            onClick={generateTournamentKnockout}
                          >
                            {tournamentText.generateKnockout}
                          </button>
                        </div>

                        {(displayKnockout.quarterFinals || []).length ||
                        (displayKnockout.semiFinals || []).length ? (
                          <div
                            style={{
                              ...styles.tournamentBracketBoard,
                              ...(isMobile ? styles.tournamentGroupGridMobile : {}),
                            }}
                          >
                            {(displayKnockout.quarterFinals || []).length > 0 && (
                              <div style={styles.tournamentBracketStage}>
                                <div style={styles.tournamentBracketStageTitle}>
                                  {language === "no" ? "Første utslag" : "First Knockout"}
                                </div>
                                {displayKnockout.quarterFinals.map((match) =>
                                  hasStoredKnockout
                                    ? renderBracketMatch(match, "quarterFinals")
                                    : renderBracketPreviewMatch(match)
                                )}
                              </div>
                            )}

                            <div style={styles.tournamentBracketStage}>
                              <div style={styles.tournamentBracketStageTitle}>
                                {tournamentText.semiFinals}
                              </div>
                              {(displayKnockout.semiFinals || []).map((match) =>
                                hasStoredKnockout
                                  ? renderBracketMatch(match, "semiFinals")
                                  : renderBracketPreviewMatch(match)
                              )}
                            </div>

                            <div style={styles.tournamentBracketStage}>
                              <div style={styles.tournamentBracketStageTitle}>
                                {tournamentText.final}
                              </div>
                              {hasStoredKnockout
                                ? renderBracketMatch(
                                    displayKnockout.final,
                                    "final",
                                    true
                                  )
                                : renderBracketPreviewMatch(
                                    displayKnockout.final,
                                    true
                                  )}
                            </div>

                            {activeTournament.thirdPlaceMatch &&
                              displayKnockout.thirdPlace && (
                                <div style={styles.tournamentBracketStage}>
                                  <div style={styles.tournamentBracketStageTitle}>
                                    {tournamentText.thirdPlace}
                                  </div>
                                  {hasStoredKnockout
                                    ? renderBracketMatch(
                                        displayKnockout.thirdPlace,
                                        "thirdPlace"
                                      )
                                    : renderBracketPreviewMatch(
                                        displayKnockout.thirdPlace
                                      )}
                                </div>
                              )}
                          </div>
                        ) : (
                          <div style={styles.tournamentMutedPanel}>
                            {tournamentText.noKnockoutYet}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTournamentView === "matches" && (
                      <div style={styles.tournamentSurface}>
                        <div style={styles.tournamentSectionHeader}>
                          <div>
                            <div style={styles.tournamentEyebrow}>
                              {language === "no" ? "Kampstyring" : "Match Management"}
                            </div>
                            <div style={styles.tournamentSectionTitle}>
                              {tournamentText.matchesTitle}
                            </div>
                          </div>
                          <button
                            style={styles.primaryButtonSmall}
                            onClick={generateTournamentMatches}
                          >
                            {tournamentText.generateBasicMatches}
                          </button>
                        </div>

                        <div style={styles.tournamentSchedulePanel}>
                          <div style={styles.tournamentSectionHeader}>
                            <div>
                              <div style={styles.tournamentMiniTitle}>
                                {language === "no"
                                  ? "Hallplan for oppsettet"
                                  : "Hall Schedule Preview"}
                              </div>
                              <div style={styles.tournamentMutedText}>
                                {language === "no"
                                  ? "Basert pa starttid, baner, kamplengde og pauser."
                                  : "Based on start time, courts, match duration and breaks."}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {hallScheduleBatches.length}{" "}
                              {language === "no" ? "runder" : "batches"}
                            </div>
                          </div>
                          {renderHallSchedulePreview(18)}
                        </div>

                        {tournamentMatches.length > 0 ? (
                          <div style={styles.tournamentMatchList}>
                            {tournamentMatches.map((match, index) => (
                              <div key={match.id} style={styles.tournamentMatchCard}>
                                <div style={styles.tournamentMatchHeader}>
                                  <div>
                                    <div style={styles.tournamentMatchKicker}>
                                      {language === "no" ? "Kamp" : "Match"} {index + 1}
                                    </div>
                                    <div style={styles.tournamentMatchTitle}>
                                      {match.teamA} vs {match.teamB}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      ...styles.tournamentMatchStatus,
                                      ...(match.status === "completed"
                                        ? styles.tournamentMatchStatusDone
                                        : {}),
                                    }}
                                  >
                                    {match.status === "completed"
                                      ? tournamentText.matchStatusCompleted
                                      : tournamentText.matchStatusScheduled}
                                  </div>
                                </div>
                                <div style={styles.tournamentScoreRow}>
                                  <input
                                    style={styles.tournamentScoreInput}
                                    value={match.scoreA}
                                    onChange={(e) =>
                                      updateTournamentMatchScore(
                                        match.id,
                                        e.target.value,
                                        match.scoreB
                                      )
                                    }
                                    placeholder="0"
                                  />
                                  <span style={styles.tournamentScoreDivider}>-</span>
                                  <input
                                    style={styles.tournamentScoreInput}
                                    value={match.scoreB}
                                    onChange={(e) =>
                                      updateTournamentMatchScore(
                                        match.id,
                                        match.scoreA,
                                        e.target.value
                                      )
                                    }
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={styles.tournamentMutedPanel}>
                            {tournamentText.noMatchesYet}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTournamentView === "table" && (
                      <div style={styles.tournamentSurface}>
                        <div style={styles.tournamentSectionHeader}>
                          <div>
                            <div style={styles.tournamentEyebrow}>
                              {language === "no" ? "Resultater" : "Standings"}
                            </div>
                            <div style={styles.tournamentSectionTitle}>
                              {tournamentText.standingsTitle}
                            </div>
                          </div>
                          <div style={styles.tournamentStatusBadge}>
                            {tournamentStandings.length} {language === "no" ? "grupper" : "groups"}
                          </div>
                        </div>

                        {activeTournament.format === "group-stage" &&
                        Array.isArray(tournamentStandings) &&
                        tournamentStandings.length > 0 ? (
                          <div style={styles.tournamentStandingsList}>
                            {tournamentStandings.map((group) => (
                              <div
                                key={`standings-${group.groupId}`}
                                style={styles.tournamentStandingsCard}
                              >
                                <div style={styles.tournamentMiniTitle}>
                                  {group.groupName}
                                </div>
                                <div style={styles.tournamentTableWrap}>
                                  <table style={styles.tournamentTable}>
                                    <thead>
                                      <tr>
                                        <th style={styles.tournamentTableHead}>Team</th>
                                        <th style={styles.tournamentTableHead}>
                                          {tournamentText.playedShort}
                                        </th>
                                        <th style={styles.tournamentTableHead}>
                                          {tournamentText.winsShort}
                                        </th>
                                        <th style={styles.tournamentTableHead}>
                                          {tournamentText.drawsShort}
                                        </th>
                                        <th style={styles.tournamentTableHead}>
                                          {tournamentText.lossesShort}
                                        </th>
                                        <th style={styles.tournamentTableHead}>
                                          {tournamentText.pointsShort}
                                        </th>
                                        <th style={styles.tournamentTableHead}>
                                          {tournamentText.scoreForShort}
                                        </th>
                                        <th style={styles.tournamentTableHead}>
                                          {tournamentText.scoreAgainstShort}
                                        </th>
                                        <th style={styles.tournamentTableHead}>
                                          {tournamentText.scoreDiffShort}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.rows.map((row) => (
                                        <tr
                                          key={`row-${group.groupId}-${row.teamName}`}
                                        >
                                          <td style={styles.tournamentTableTeam}>
                                            {row.teamName}
                                          </td>
                                          <td style={styles.tournamentTableCell}>{row.played}</td>
                                          <td style={styles.tournamentTableCell}>{row.wins}</td>
                                          <td style={styles.tournamentTableCell}>{row.draws}</td>
                                          <td style={styles.tournamentTableCell}>{row.losses}</td>
                                          <td style={styles.tournamentTablePoints}>{row.points}</td>
                                          <td style={styles.tournamentTableCell}>{row.scoreFor}</td>
                                          <td style={styles.tournamentTableCell}>{row.scoreAgainst}</td>
                                          <td style={styles.tournamentTableCell}>{row.scoreDiff}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={styles.tournamentMutedPanel}>
                            {tournamentText.noStandingsYet}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTournamentView === "sharing" && (
                      <div style={styles.tournamentSurface}>
                        <div style={styles.tournamentSectionHeader}>
                          <div>
                            <div style={styles.tournamentEyebrow}>
                              {language === "no" ? "Publisering" : "Publishing"}
                            </div>
                            <div style={styles.tournamentSectionTitle}>
                              {tournamentText.publicPreviewTitle}
                            </div>
                            <div style={styles.tournamentMutedText}>
                              {tournamentText.publicPreviewSubtitle}
                            </div>
                          </div>
                          <div style={styles.tournamentStatusBadge}>
                            {isPublished
                              ? tournamentText.published
                              : tournamentText.unpublished}
                          </div>
                        </div>

                        <div
                          style={{
                            ...styles.tournamentShareState,
                            ...(isPublished ? styles.tournamentShareStateLive : {}),
                          }}
                        >
                          <div>
                            <div style={styles.tournamentShareTitle}>
                              {isPublished
                                ? tournamentText.published
                                : tournamentText.unpublished}
                            </div>
                            <div style={styles.tournamentMutedText}>
                              {isPublished
                                ? tournamentText.publicPreviewSubtitle
                                : language === "no"
                                  ? "Offentlig lagliste vises kun etter publisering."
                                  : "Public roster appears only after publishing."}
                            </div>
                          </div>
                          {isPublished ? (
                            <button
                              style={styles.secondaryButtonCompact}
                              onClick={unpublishTournament}
                            >
                              {tournamentText.unpublish}
                            </button>
                          ) : (
                            <button
                              style={styles.primaryButtonSmall}
                              onClick={publishTournament}
                            >
                              {tournamentText.publish}
                            </button>
                          )}
                        </div>

                        {isPublished ? (
                          <div style={styles.tournamentPublicRoster}>
                            <div style={styles.tournamentPublicHeader}>
                              <strong>{activeTournament.name}</strong>
                              <span>
                                {activeTournament.rules || tournamentText.noRules}
                              </span>
                            </div>

                            {dashboardTeams.length > 0 ? (
                              <div style={styles.tournamentGroupGrid}>
                                {dashboardTeams.map((team) => (
                                  <div
                                    key={`preview-${team.id}`}
                                    style={styles.tournamentMiniCard}
                                  >
                                    <div style={styles.tournamentMiniTitle}>
                                      {team.name}
                                      {team.club ? ` (${team.club})` : ""}
                                    </div>
                                    {Array.isArray(team.players) &&
                                    team.players.length > 0 ? (
                                      <div style={styles.tournamentSnapshotList}>
                                        {team.players.map((player) => (
                                          <div
                                            key={`preview-${team.id}-${
                                              player.id || player.name
                                            }`}
                                            style={styles.tournamentSnapshotRow}
                                          >
                                            <span>{player.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div style={styles.tournamentMutedText}>
                                        {tournamentText.noPlayersInPreview}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={styles.tournamentMutedText}>
                                {tournamentText.noTeamsInPreview}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={styles.tournamentMutedPanel}>
                            {tournamentText.unpublished}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={styles.tournamentEmptyState}>
                  <div style={styles.tournamentPanelTitle}>
                    {tournamentText.noSelection}
                  </div>
                  <div style={styles.tournamentMutedText}>
                    {tournamentText.emptyList}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{t.appTitle}</h1>
            <p style={styles.subtitle}>{t.appSubtitle}</p>
          </div>
        </div>

        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <div>
              {auth.loggedIn ? (
                <>
                  <div style={styles.profileCompactRow}>
                    <div style={styles.profileCompactLeft}>
                      <div style={styles.profileCompactName}>
                        {auth.username}
                      </div>
                      <div style={styles.profileCompactRole}>{auth.role}</div>
                    </div>

                    <div style={styles.profileCompactLanguageRow}>
                      <button
                        style={{
                          ...styles.languageToggleButton,
                          ...(language === "en"
                            ? styles.languageToggleButtonActive
                            : {}),
                        }}
                        onClick={() => setLanguage("en")}
                      >
                        EN
                      </button>
                      <button
                        style={{
                          ...styles.languageToggleButton,
                          ...(language === "no"
                            ? styles.languageToggleButtonActive
                            : {}),
                        }}
                        onClick={() => setLanguage("no")}
                      >
                        NO
                      </button>
                    </div>

                    <button
                      style={styles.profileCompactLogout}
                      onClick={handleLogout}
                    >
                      {t.logout}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.authTitle}>{t.trainerLogin}</div>
                  <div style={styles.authSubtitle}>{t.loginRequired}</div>
                </>
              )}
            </div>
          </div>

          {!auth.loggedIn && (
            <div style={styles.loginGrid}>
              <input
                style={styles.input}
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder={t.username}
              />
              <input
                style={styles.input}
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t.password}
              />
              <button
                style={styles.primaryButton}
                onClick={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? t.loggingIn : t.login}
              </button>
            </div>
          )}

          {loginMessage && <div style={styles.loginMessage}>{loginMessage}</div>}
        </div>

        {auth.loggedIn && auth.role === "admin" && (
          <div style={styles.adminCard}>
            <div style={styles.authHeader}>
              <div>
                <div style={styles.authTitle}>{t.createTrainer}</div>
                <div style={styles.authSubtitle}>
                  {t.createTrainerSubtitle}
                </div>
              </div>

              <button
                style={styles.secondaryButton}
                onClick={() => setShowCreateTrainerForm((prev) => !prev)}
              >
                {showCreateTrainerForm ? t.close : t.newTrainer}
              </button>
            </div>

            {showCreateTrainerForm && (
              <div style={styles.formCard}>
                <input
                  style={styles.input}
                  value={trainerUsername}
                  onChange={(e) => setTrainerUsername(e.target.value)}
                  placeholder={t.trainerUsernamePlaceholder}
                />

                <input
                  style={styles.input}
                  value={trainerPassword}
                  onChange={(e) => setTrainerPassword(e.target.value)}
                  placeholder={t.trainerPasswordPlaceholder}
                />

                <div style={styles.settingsCompactRow}>
                  <div style={styles.compactSettingsCard}>
                    <span style={styles.settingsLabel}>{t.skillView}</span>
                    <div style={styles.settingsToggleRow}>
                      <button
                        style={{
                          ...styles.smallToggleButton,
                          ...(trainerSkillView === "numbers"
                            ? styles.smallToggleButtonActive
                            : {}),
                        }}
                        onClick={() => setTrainerSkillView("numbers")}
                      >
                        {t.skillViewNumbers}
                      </button>
                      <button
                        style={{
                          ...styles.smallToggleButton,
                          ...(trainerSkillView === "colors"
                            ? styles.smallToggleButtonActive
                            : {}),
                        }}
                        onClick={() => setTrainerSkillView("colors")}
                      >
                        {t.skillViewColors}
                      </button>
                    </div>
                  </div>

                  <div style={styles.compactSettingsCard}>
                    <span style={styles.settingsLabel}>{t.skillScale}</span>
                    <div style={styles.settingsToggleRow}>
                      {SKILL_SCALE_OPTIONS.map((scale) => (
                        <button
                          key={scale}
                          style={{
                            ...styles.smallToggleButton,
                            ...(trainerSkillScale === scale
                              ? styles.smallToggleButtonActive
                              : {}),
                          }}
                          onClick={() => setTrainerSkillScale(scale)}
                        >
                          1-{scale}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={styles.settingsCard}>
                  <span style={styles.settingsLabel}>{t.copyPlayers}</span>
                  <div style={styles.copyOptionList}>
                    {TRAINER_COPY_OPTIONS_BASE.map((option) => (
                      <label key={option.value} style={styles.radioRow}>
                        <input
                          type="radio"
                          name="trainer-copy-mode"
                          checked={trainerCopyMode === option.value}
                          onChange={() => setTrainerCopyMode(option.value)}
                        />
                        <span>{t[option.key]}</span>
                      </label>
                    ))}
                  </div>

                  {trainerCopyMode === "trainer" && (
                    <select
                      style={styles.select}
                      value={copyFromTrainerUsername}
                      onChange={(e) =>
                        setCopyFromTrainerUsername(e.target.value)
                      }
                    >
                      <option value="">{t.selectTrainer}</option>
                      {trainerCopySourceUsers.map((trainer) => (
                        <option key={trainer.username} value={trainer.username}>
                          {trainer.username}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  style={styles.primaryButton}
                  onClick={createTrainerFromApp}
                  disabled={creatingTrainer}
                >
                  {creatingTrainer ? t.creating : t.createTrainer}
                </button>
              </div>
            )}

            {createTrainerMessage && (
              <div style={styles.loginMessage}>{createTrainerMessage}</div>
            )}

            {createdTrainerInfo && (
              <div style={styles.createdTrainerCard}>
                <div>
                  <strong>{t.usernameLabel}</strong> {createdTrainerInfo.username}
                </div>
                <div>
                  <strong>{t.spreadsheetIdLabel}</strong>{" "}
                  {createdTrainerInfo.spreadsheetId}
                </div>
                <div>
                  <strong>{t.copyModeLabel}</strong> {createdTrainerInfo.copyMode}
                </div>
                <div style={styles.createdTrainerLinkWrap}>
                  <a
                    href={createdTrainerInfo.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    {t.openTrainerSheet}
                  </a>
                </div>
              </div>
            )}

            <div style={styles.trainerListCard}>
              <div style={styles.authTitle}>{t.trainerUsersTitle}</div>
              <div style={styles.authSubtitle}>
                {t.trainerUsersSubtitle}
              </div>

              {trainerActionMessage && (
                <div style={styles.loginMessage}>{trainerActionMessage}</div>
              )}

              <div style={styles.trainerUsersWrap}>
                {visibleTrainerUsers.length === 0 ? (
                  <div style={styles.emptyText}>{t.noActiveTrainers}</div>
                ) : (
                  visibleTrainerUsers.map((trainer) => (
                    <div key={trainer.username} style={styles.trainerUserRow}>
                      <div style={styles.trainerUserTop}>
                        <div>
                          <div style={styles.trainerUserName}>
                            {trainer.username}
                          </div>
                          <div style={styles.trainerUserMeta}>
                            {trainer.active ? t.activeStatus : t.inactiveStatus} •{" "}
                            {trainer.skillView} • 1-{trainer.skillScale}
                          </div>
                        </div>

                        <a
                          href={trainer.spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          {t.openSheet}
                        </a>
                      </div>

                      <div style={styles.trainerActionsRow}>
                        <button
                          style={styles.secondaryButton}
                          onClick={() =>
                            updateTrainerStatus(trainer.username, !trainer.active)
                          }
                        >
                          {trainer.active ? t.deactivate : t.activate}
                        </button>

                        <input
                          style={styles.smallInput}
                          value={trainerPasswords[trainer.username] || ""}
                          onChange={(e) =>
                            setTrainerPasswords((prev) => ({
                              ...prev,
                              [trainer.username]: e.target.value,
                            }))
                          }
                          placeholder={t.newPassword}
                        />

                        <button
                          style={styles.secondaryButton}
                          onClick={() => resetTrainerPassword(trainer.username)}
                        >
                          {t.resetPassword}
                        </button>

                        <button
                          style={styles.archiveButton}
                          onClick={() => archiveTrainer(trainer.username)}
                        >
                          {t.archive}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={styles.trainerListCard}>
              <div style={styles.authTitle}>{t.archivedTrainers}</div>
              <div style={styles.authSubtitle}>
                {t.archivedTrainersSubtitle}
              </div>

              <div style={styles.trainerUsersWrap}>
                {archivedTrainerUsers.length === 0 ? (
                  <div style={styles.emptyText}>{t.noArchivedTrainers}</div>
                ) : (
                  archivedTrainerUsers.map((trainer) => (
                    <div key={trainer.username} style={styles.trainerUserRow}>
                      <div style={styles.trainerUserTop}>
                        <div>
                          <div style={styles.trainerUserName}>
                            {trainer.username}
                          </div>
                          <div style={styles.trainerUserMeta}>
                            {t.archivedStatus} • {trainer.skillView} • 1-
                            {trainer.skillScale}
                          </div>
                        </div>

                        <a
                          href={trainer.spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          {t.openSheet}
                        </a>
                      </div>

                      <div style={styles.trainerActionsRow}>
                        <button
                          style={styles.primaryButton}
                          onClick={() => restoreTrainer(trainer.username)}
                        >
                          {t.restore}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div style={styles.tabBar}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "players" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("players")}
          >
            {t.players}
          </button>

          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "teams" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("teams")}
          >
            {t.teams}
          </button>

          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "tournament" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("tournament")}
        >
            {tournamentText.tabTitle}
          </button>
        </div>

        {activeTab === "players" && (
          <div style={styles.section}>
            {!auth.loggedIn ? (
              <div style={styles.lockedCard}>
                {t.playersLoginRequired}
              </div>
            ) : (
              <>
                <div style={styles.toolbarTop}>
                  <div style={styles.teamCountCard}>
                    <span style={styles.teamCountLabel}>{t.numberOfTeams}</span>

                    <div style={styles.teamCountRow}>
                      <div style={styles.teamCountInline}>
                        <button
                          style={styles.countButton}
                          onClick={() =>
                            setTeamCount((prev) => Math.max(2, prev - 1))
                          }
                        >
                          −
                        </button>

                        <div style={styles.countValue}>{teamCount}</div>

                        <button
                          style={styles.countButton}
                          onClick={() => setTeamCount((prev) => prev + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        style={{
                          ...styles.generateButtonInline,
                          opacity: selected.length < 2 || loading ? 0.6 : 1,
                        }}
                        onClick={generateTeams}
                        disabled={selected.length < 2 || loading}
                      >
                        {loading ? t.generating : t.generateTeams}
                      </button>
                    </div>
                  </div>

                  <div style={styles.selectedBadge}>
                    {t.selected}: {selected.length} / {totalPlayers}
                  </div>
                </div>

                <div style={styles.settingsCompactRow}>
                  <div style={styles.compactSettingsCard}>
                    <span style={styles.settingsLabel}>{t.skillView}</span>
                    <button
                      style={styles.smallToggleButtonActive}
                      onClick={() =>
                        setSkillView((prev) =>
                          prev === "numbers" ? "colors" : "numbers"
                        )
                      }
                      title={t.skillView}
                    >
                      {skillView === "numbers" ? "123" : "🎨"}
                    </button>
                  </div>

                  <div style={styles.compactSettingsCard}>
                    <span style={styles.settingsLabel}>{t.skillScale}</span>
                    <button
                      style={styles.smallToggleButtonActive}
                      onClick={() =>
                        setSkillScale((prev) => (prev === 3 ? 5 : 3))
                      }
                      title={t.skillScale}
                    >
                      {skillScale === 3 ? "1-3" : "1-5"}
                    </button>
                  </div>

                  <div style={styles.compactSettingsCard}>
                    <span style={styles.settingsLabel}>{t.sort}</span>
                    <button
                      style={styles.smallToggleButtonActive}
                      onClick={() =>
                        setPlayerSortMode((prev) =>
                          prev === "name" ? "recent" : "name"
                        )
                      }
                      title={t.sort}
                    >
                      {playerSortMode === "name" ? "A-Z" : "↓"}
                    </button>
                  </div>

                  <div style={styles.compactSettingsCard}>
                    <span style={styles.settingsLabel}>{t.club}</span>
                    <button
                      style={styles.smallToggleButtonActive}
                      onClick={() =>
                        setPlayerViewMode((prev) =>
                          prev === "all" ? "club" : "all"
                        )
                      }
                      title={t.club}
                    >
                      {playerViewMode === "all" ? t.all : t.club}
                    </button>
                  </div>
                </div>

                <div style={styles.actionRow}>
                  <button
                    style={styles.secondaryButton}
                    onClick={() => setShowAddForm((prev) => !prev)}
                  >
                    {showAddForm ? t.close : `+ ${t.addPlayer}`}
                  </button>

                  <button
                    style={styles.secondaryButton}
                    onClick={() => setShowArchivedPlayers((prev) => !prev)}
                  >
                    {showArchivedPlayers
                      ? t.hideArchived
                      : `${t.archived} (${archivedPlayers.length})`}
                  </button>

                  <button
                    style={styles.secondaryButtonCompact}
                    onClick={() => setShowPlayerManageActions((prev) => !prev)}
                  >
                    {showPlayerManageActions ? t.done : t.manage}
                  </button>
                </div>

                {playerActionMessage && (
                  <div style={styles.loginMessage}>{playerActionMessage}</div>
                )}

                {showAddForm && (
                  <div style={styles.formCard}>
                    <select
                      style={styles.select}
                      value={newPlayerClubOption}
                      onChange={(e) => setNewPlayerClubOption(e.target.value)}
                    >
                      <option value="">{t.selectClub}</option>
                      {CLUB_OPTIONS.map((club) => (
                        <option key={club} value={club}>
                          {club === "Other" ? t.otherClub : club}
                        </option>
                      ))}
                    </select>

                    {newPlayerClubOption === "Other" && (
                      <input
                        style={styles.input}
                        value={newPlayerClubCustom}
                        onChange={(e) => setNewPlayerClubCustom(e.target.value)}
                        placeholder={t.customClubName}
                      />
                    )}

                    <input
                      style={styles.input}
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder={t.playerName}
                    />

                    <select
                      style={styles.select}
                      value={newPlayerSkill}
                      onChange={(e) => setNewPlayerSkill(Number(e.target.value))}
                    >
                      {skillOptions.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>

                    <button
                      style={styles.primaryButton}
                      onClick={addPlayer}
                      disabled={savingPlayer}
                    >
                      {savingPlayer ? t.saving : t.savePlayer}
                    </button>
                  </div>
                )}

                {playerViewMode === "club" ? (
                  groupedPlayersByClub.map((group) => (
                    <div key={group.clubName} style={styles.clubSection}>
                      <div style={styles.clubSectionTitle}>{group.clubName}</div>
                      <div style={styles.clubSectionPlayers}>
                        {group.players.map((p) => {
                          const isSelected = selected.includes(p.name);
                          const skillStyle = getSkillStyle(
                            p.skill,
                            skillView,
                            skillScale
                          );

                          return !showPlayerManageActions ? (
                            <div
                              key={p.name}
                              style={{
                                ...styles.playerCardListCompact,
                                ...(isSelected
                                  ? styles.playerCardListCompactSelected
                                  : {}),
                              }}
                              onClick={() => togglePlayer(p.name)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  togglePlayer(p.name);
                                }
                              }}
                            >
                              <div style={styles.playerListCompactName}>
                                {displayPlayerName(p)}
                              </div>
                              <div style={styles.playerListCompactRight}>
                                <div
                                  style={{
                                    ...styles.skillMini,
                                    background: skillStyle.background,
                                    color: skillStyle.color,
                                  }}
                                >
                                  {skillStyle.text}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              key={p.name}
                              style={{
                                ...styles.playerCardCompact,
                                ...(isSelected ? styles.playerCardSelected : {}),
                              }}
                              onClick={() => togglePlayer(p.name)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  togglePlayer(p.name);
                                }
                              }}
                            >
                              <div style={styles.playerCompactTop}>
                                <div style={styles.playerNameCompact}>
                                  {displayPlayerName(p)}
                                </div>
                                <div
                                  style={{
                                    ...styles.skillMini,
                                    background: skillStyle.background,
                                    color: skillStyle.color,
                                  }}
                                >
                                  {skillStyle.text}
                                </div>
                              </div>

                              <div style={styles.playerCompactBottom}>
                                <div style={styles.playerCardActions}>
                                  <button
                                    style={styles.editMiniButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditPlayer(p);
                                    }}
                                  >
                                    {t.edit}
                                  </button>

                                  <button
                                    style={styles.archiveMiniButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      archivePlayer(p.name);
                                    }}
                                  >
                                    {t.archive}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : playerViewMode === "all" ? (
                  <div style={styles.playersGrid}>
                    {sortedPlayers.map((p) => {
                      const isSelected = selected.includes(p.name);
                      const skillStyle = getSkillStyle(
                        p.skill,
                        skillView,
                        skillScale
                      );

                      return !showPlayerManageActions ? (
                        <div
                          key={p.name}
                          style={{
                            ...styles.playerCardListCompact,
                            ...(isSelected
                              ? styles.playerCardListCompactSelected
                              : {}),
                          }}
                          onClick={() => togglePlayer(p.name)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              togglePlayer(p.name);
                            }
                          }}
                        >
                          <div style={styles.playerListCompactName}>
                            {displayPlayerName(p)}
                          </div>
                          <div style={styles.playerListCompactRight}>
                            <div
                              style={{
                                ...styles.skillMini,
                                background: skillStyle.background,
                                color: skillStyle.color,
                              }}
                            >
                              {skillStyle.text}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={p.name}
                          style={{
                            ...styles.playerCardCompact,
                            ...(isSelected ? styles.playerCardSelected : {}),
                          }}
                          onClick={() => togglePlayer(p.name)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              togglePlayer(p.name);
                            }
                          }}
                        >
                          <div style={styles.playerCompactTop}>
                            <div style={styles.playerNameCompact}>
                              {displayPlayerName(p)}
                            </div>
                            <div
                              style={{
                                ...styles.skillMini,
                                background: skillStyle.background,
                                color: skillStyle.color,
                              }}
                            >
                              {skillStyle.text}
                            </div>
                          </div>

                          <div style={styles.playerCompactBottom}>
                            <div style={styles.playerCardActions}>
                              <button
                                style={styles.editMiniButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditPlayer(p);
                                }}
                              >
                                {t.edit}
                              </button>

                              <button
                                style={styles.archiveMiniButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  archivePlayer(p.name);
                                }}
                              >
                                {t.archive}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {showArchivedPlayers && (
                  <div style={styles.archivedCard}>
                    <div style={styles.authTitle}>{t.archivedPlayers}</div>

                    <div style={styles.archivedPlayersWrap}>
                      {sortedArchivedPlayers.length === 0 ? (
                        <div style={styles.emptyText}>{t.noArchivedPlayers}</div>
                      ) : (
                        sortedArchivedPlayers.map((player) => (
                          <div key={player.name} style={styles.archivedPlayerRow}>
                            <div style={styles.archivedPlayerName}>
                              {displayPlayerName(player)}
                            </div>
                            <button
                              style={styles.primaryButtonSmall}
                              onClick={() => restorePlayer(player.name)}
                            >
                              {t.restore}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "teams" && (
          <div style={styles.section}>
            {!auth.loggedIn ? (
              <div style={styles.lockedCard}>
                {t.teamsLoginRequired}
              </div>
            ) : (
              <>
                <div style={styles.topTeamActionsCompact}>
                  <button
                    style={{
                      ...styles.compactActionButtonPrimary,
                      opacity: teams.length === 0 || loading ? 0.6 : 1,
                    }}
                    onClick={generateNewRound}
                    disabled={teams.length === 0 || loading}
                    title={t.newRound}
                  >
                    {loading ? t.loadingShort : "↻"}
                  </button>

                  {visibleActions.saveRound && (
                    <button
                      style={{
                        ...styles.compactActionButton,
                        opacity: teams.length === 0 ? 0.6 : 1,
                      }}
                      onClick={saveRoundForSixHours}
                      disabled={teams.length === 0}
                      title={t.saveRound}
                    >
                      💾
                    </button>
                  )}

                  {teams.length >= 3 && (
                    <button
                      style={styles.compactActionButton}
                      onClick={() => {
                        setMatchMode((prev) => !prev);
                        setMatchRoundIndex(0);
                      }}
                      title={matchMode ? t.hideMatch : t.matchMode}
                    >
                      🆚
                    </button>
                  )}

                  <button
                    style={styles.addIconActionButton}
                    onClick={() => setShowAddToTeamsModal(true)}
                    disabled={teams.length === 0}
                    title={t.addPlayer}
                  >
                    +
                  </button>

                  <button
                    style={styles.removeIconActionButton}
                    onClick={() => setShowRemoveFromTeamsModal(true)}
                    disabled={teams.length === 0}
                    title={t.removePlayer}
                  >
                    −
                  </button>

                  {visibleActions.export && teams.length > 0 && (
                    <button
                      style={styles.iconActionButton}
                      onClick={() => setShowExportView(true)}
                      title={t.export}
                    >
                      📤
                    </button>
                  )}

                  <button
                    style={styles.iconActionButton}
                    onClick={() => setShowToolbarSettings(true)}
                    title={t.toolbarSettings}
                  >
                    ⚙
                  </button>

                  {visibleActions.clearSaved && (
                    <button
                      style={styles.compactActionButton}
                      onClick={clearStoredRounds}
                      title={t.clearSaved}
                    >
                      ✕
                    </button>
                  )}

                  {visibleActions.skillToggle &&
                    skillView === "numbers" &&
                    teams.length > 0 && (
                      <button
                        style={styles.compactActionButton}
                        onClick={() => setShowSkillInTeams((prev) => !prev)}
                        title={showSkillInTeams ? t.hideSkill : t.showSkill}
                      >
                        ★
                      </button>
                    )}

                  {visibleActions.lockToggle && teams.length > 0 && (
                    <button
                      style={styles.iconActionButton}
                      onClick={() => setShowLockInTeams((prev) => !prev)}
                      title={showLockInTeams ? t.unlock : t.lock}
                    >
                      {showLockInTeams ? "🔒" : "🔓"}
                    </button>
                  )}
                </div>

                {matchMode && teams.length >= 3 && (
                  <div style={styles.matchModeCard}>
                    <div style={styles.matchModeHeader}>
                      <div>
                        <div style={styles.matchModeTitle}>{t.matchMode}</div>
                        <div style={styles.matchModeSubtitle}>
                          {t.roundLabel}{" "}
                          {activeScheduleRounds.length ? matchRoundIndex + 1 : 0}{" "}
                          {t.ofLabel} {activeScheduleRounds.length}
                        </div>
                      </div>

                      <div style={styles.matchControlsWrap}>
                        <div style={styles.courtWrap}>
                          <span style={styles.courtLabel}>{t.method}</span>
                          <select
                            style={styles.smallSelect}
                            value={matchMethod}
                            onChange={(e) => {
                              setMatchMethod(e.target.value);
                              setMatchRoundIndex(0);
                            }}
                          >
                            {MATCH_METHOD_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value === "balanced"
                                  ? t.matchPattern
                                  : t.matchShuffle}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.courtWrap}>
                          <span style={styles.courtLabel}>{t.courts}</span>
                          <select
                            style={styles.smallSelect}
                            value={courtCount}
                            onChange={(e) => {
                              setCourtCount(Number(e.target.value));
                              setMatchRoundIndex(0);
                            }}
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={styles.matchActions}>
                      <button
                        style={styles.secondaryButton}
                        onClick={() =>
                          setMatchRoundIndex((prev) =>
                            prev === 0
                              ? Math.max(activeScheduleRounds.length - 1, 0)
                              : prev - 1
                          )
                        }
                        disabled={!activeScheduleRounds.length}
                      >
                        {t.prevRound}
                      </button>

                      <button
                        style={styles.primaryButton}
                        onClick={() =>
                          setMatchRoundIndex((prev) =>
                            !activeScheduleRounds.length
                              ? 0
                              : (prev + 1) % activeScheduleRounds.length
                          )
                        }
                        disabled={!activeScheduleRounds.length}
                      >
                        {t.nextRound}
                      </button>
                    </div>

                    <div
                      style={{
                        ...styles.matchGrid,
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      }}
                    >
                      {currentMatches.length > 0 ? (
                        currentMatches.map((match, index) => (
                          <div
                            key={`${match.leftTeam}-${match.rightTeam}-${match.court}-${index}`}
                            style={styles.matchCard}
                          >
                            <div style={styles.matchCourt}>
                              {t.courtLabel} {match.court}
                            </div>
                            <div style={styles.matchTeams}>
                              <span>{match.leftTeam}</span>
                              <span style={styles.vsText}>{t.vsLabel}</span>
                              <span>{match.rightTeam}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={styles.noMatchesText}>
                          {t.noMatchesAvailable}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    ...styles.teamsGrid,
                    gridTemplateColumns: teamsGridColumns,
                  }}
                >
                  {teamsWithTotals.map((team, teamIndex) => (
                    <div
                      key={teamIndex}
                      style={styles.teamCard}
                      onDragOver={(e) => {
                        if (isMobile) return;
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (isMobile) return;
                        e.preventDefault();
                        if (!dragging) return;
                        movePlayerByDrag(
                          dragging.fromTeamIndex,
                          dragging.playerIndex,
                          teamIndex,
                          null
                        );
                        resetDragState();
                      }}
                    >
                      <div style={styles.teamHeaderRow}>
                        <div>
                          <div style={styles.teamTitle}>{team.name}</div>
                          {isMobile && mobileMoveSelection && (
                            <button
                              style={{
                                ...styles.moveHereButton,
                                opacity:
                                  mobileMoveSelection.fromTeamIndex === teamIndex
                                    ? 0.5
                                    : 1,
                              }}
                              onClick={() => confirmMobileMove(teamIndex)}
                              disabled={
                                mobileMoveSelection.fromTeamIndex === teamIndex
                              }
                            >
                              {t.moveHere}
                            </button>
                          )}
                        </div>

                        <div style={styles.teamPointsBadge}>{team.total} {t.pointsLabel}</div>
                      </div>

                      <div style={styles.teamPlayers}>
                        {team.players.map((player, playerIndex) => {
                          const skillStyle = getSkillStyle(
                            player.skill,
                            skillView,
                            skillScale
                          );

                          const isSelectedForMove =
                            mobileMoveSelection &&
                            mobileMoveSelection.fromTeamIndex === teamIndex &&
                            mobileMoveSelection.playerIndex === playerIndex;

                          return (
                            <div
                              key={`${player.name}-${playerIndex}`}
                              style={{
                                ...styles.teamPlayerRow,
                                ...(isSelectedForMove
                                  ? styles.teamPlayerRowSelected
                                  : {}),
                                opacity: 1,
                                cursor:
                                  isMobile || player.locked
                                    ? "default"
                                    : "grab",
                              }}
                              draggable={!isMobile && !player.locked}
                              onDragStart={() =>
                                handleDragStart(teamIndex, playerIndex)
                              }
                              onDragEnd={resetDragState}
                              onDragOver={(e) => {
                                if (isMobile) return;
                                e.preventDefault();
                              }}
                              onDrop={(e) => {
                                if (isMobile) return;
                                e.preventDefault();
                                e.stopPropagation();

                                if (!dragging) return;

                                movePlayerByDrag(
                                  dragging.fromTeamIndex,
                                  dragging.playerIndex,
                                  teamIndex,
                                  playerIndex
                                );
                                resetDragState();
                              }}
                            >
                              <div style={styles.teamPlayerLeft}>
                                <div style={styles.teamPlayerName}>
                                  {displayPlayerName(player)}
                                </div>
                              </div>

                              <div style={styles.teamPlayerRight}>
                                {isMobile && (
                                  <button
                                    style={{
                                      ...styles.iconMoveButton,
                                      ...(isSelectedForMove
                                        ? styles.iconMoveButtonActive
                                        : {}),
                                      opacity: player.locked ? 0.45 : 1,
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectMobileMove(
                                        teamIndex,
                                        playerIndex
                                      );
                                    }}
                                    disabled={player.locked}
                                    aria-label={t.selectMove}
                                    title={t.selectMove}
                                  >
                                    ↔
                                  </button>
                                )}

                                {skillView === "colors" && (
                                  <span
                                    style={{
                                      ...styles.skillMini,
                                      background: skillStyle.background,
                                      color: skillStyle.color,
                                    }}
                                  >
                                    {skillStyle.text}
                                  </span>
                                )}

                                {skillView === "numbers" && showSkillInTeams && (
                                  <span
                                    style={{
                                      ...styles.skillMini,
                                      background: skillStyle.background,
                                      color: skillStyle.color,
                                    }}
                                  >
                                    {skillStyle.text}
                                  </span>
                                )}

                                {showLockInTeams && (
                                  <button
                                    style={{
                                      ...styles.lockIconButton,
                                      ...(player.locked
                                        ? styles.lockIconButtonActive
                                        : {}),
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLock(teamIndex, playerIndex);
                                    }}
                                    title={
                                      player.locked
                                        ? `${t.unlock} player`
                                        : `${t.lock} player`
                                    }
                                    aria-label={
                                      player.locked
                                        ? `${t.unlock} player`
                                        : `${t.lock} player`
                                    }
                                  >
                                    {player.locked ? "🔒" : "🔓"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "tournament" && renderTournamentDashboard()}
        
      {editingPlayer && (
        <div style={styles.modalOverlay} onClick={closeEditPlayer}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t.editPlayer}</h3>

            <select
              style={styles.select}
              value={editClubOption}
              onChange={(e) => setEditClubOption(e.target.value)}
            >
              <option value="">{t.selectClub}</option>
              {CLUB_OPTIONS.map((club) => (
                <option key={club} value={club}>
                  {club === "Other" ? t.otherClub : club}
                </option>
              ))}
            </select>

            {editClubOption === "Other" && (
              <input
                style={styles.input}
                value={editClubCustom}
                onChange={(e) => setEditClubCustom(e.target.value)}
                placeholder={t.customClubName}
              />
            )}

            <input
              style={styles.input}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t.playerName}
            />

            <select
              style={styles.select}
              value={editSkill}
              onChange={(e) => setEditSkill(Number(e.target.value))}
            >
              {skillOptions.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>

            <div style={styles.modalActions}>
              <button style={styles.secondaryButton} onClick={closeEditPlayer}>
                {t.cancel}
              </button>
              <button
                style={styles.primaryButton}
                onClick={savePlayerEdit}
                disabled={savingPlayer}
              >
                {savingPlayer ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddToTeamsModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowAddToTeamsModal(false)}
        >
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t.addPlayer}</h3>
            <p style={styles.addToTeamsSubtitle}>{t.addPlayerToCurrentTeams}</p>

            <div style={styles.addToTeamsList}>
              {availablePlayersForTeams.length === 0 ? (
                <div style={styles.emptyText}>{t.noPlayersAvailable}</div>
              ) : (
                availablePlayersForTeams.map((player) => {
                  const skillStyle = getSkillStyle(
                    player.skill,
                    skillView,
                    skillScale
                  );

                  return (
                    <div key={player.name} style={styles.addToTeamsRow}>
                      <div style={styles.addToTeamsNameWrap}>
                        <div style={styles.addToTeamsName}>
                          {displayPlayerName(player)}
                        </div>
                      </div>

                      <div style={styles.addToTeamsActions}>
                        <div
                          style={{
                            ...styles.skillMini,
                            background: skillStyle.background,
                            color: skillStyle.color,
                          }}
                        >
                          {skillStyle.text}
                        </div>

                        <button
                          style={styles.smallPrimaryButton}
                          onClick={() => addExistingPlayerToCurrentTeams(player)}
                        >
                          {t.add}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => setShowAddToTeamsModal(false)}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

{showExportView && (
  <div
    style={styles.exportOverlay}
    onClick={() => setShowExportView(false)}
  >
    <div style={styles.exportCard} onClick={(e) => e.stopPropagation()}>
      <div ref={exportRef} style={styles.exportGrid}>
        {teams.map((team, index) => (
          <div key={index} style={styles.exportTeam}>
            <div style={styles.exportTeamTitle}>
              {normalizeTeamName(index, team.name, language)}
            </div>
            {(team.players || []).map((p, i) => (
              <div key={i} style={styles.exportPlayer}>
                {displayPlayerName(p)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        style={styles.primaryButton}
        onClick={async () => {
          if (!exportRef.current) return;

          const canvas = await html2canvas(exportRef.current);
          const link = document.createElement("a");
          link.download = "teams.png";
          link.href = canvas.toDataURL();
          link.click();
        }}
      >
        {t.saveShare}
      </button>
    </div>
  </div>
)}

      {showRemoveFromTeamsModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowRemoveFromTeamsModal(false)}
        >
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t.removePlayer}</h3>
            <p style={styles.addToTeamsSubtitle}>
              {t.removePlayerFromCurrentTeams}
            </p>

            <div style={styles.addToTeamsList}>
              {removablePlayersFromTeams.length === 0 ? (
                <div style={styles.emptyText}>{t.noPlayersToRemove}</div>
              ) : (
                removablePlayersFromTeams.map((player) => (
                  <div
                    key={`${player.teamIndex}-${player.playerIndex}-${player.name}`}
                    style={styles.addToTeamsRow}
                  >
                    <div style={styles.addToTeamsNameWrap}>
                      <div style={styles.addToTeamsName}>
                        {displayPlayerName(player)}
                      </div>
                      <div style={styles.authSubtitle}>{player.teamName}</div>
                    </div>

                    <button
                      style={styles.smallPrimaryButton}
                      onClick={() =>
                        removeExistingPlayerFromCurrentTeams(
                          player.teamIndex,
                          player.playerIndex
                        )
                      }
                    >
                      {t.removePlayer}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => setShowRemoveFromTeamsModal(false)}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToolbarSettings && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowToolbarSettings(false)}
        >
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t.toolbarSettings}</h3>

            <div style={styles.settingsList}>
              {Object.entries(visibleActions).map(([key, value]) => (
                <div key={key} style={styles.settingsRow}>
                  <span>
                    {{
                      saveRound: t.saveRound,
                      clearSaved: t.clearSaved,
                      skillToggle: t.skillToggleLabel,
                      lockToggle: t.lockToggleLabel,
                      export: t.export,
                    }[key] || key}
                  </span>

                  <button
                    style={styles.smallToggleButton}
                    onClick={() =>
                      setVisibleActions((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                  >
                    {value ? "✓" : "✕"}
                  </button>
                </div>
              ))}
            </div>

            <button
              style={styles.primaryButton}
              onClick={() => setShowToolbarSettings(false)}
            >
              {t.done}
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

const styles = {
  addIconActionButton: {
    border: "none",
    borderRadius: "10px",
    height: "32px",
    minWidth: "32px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  removeIconActionButton: {
    border: "none",
    borderRadius: "10px",
    height: "32px",
    minWidth: "32px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  app: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "12px",
    fontFamily: "Arial, sans-serif",
  },

  shell: {
    maxWidth: "940px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    margin: "2px 0 0 0",
    color: "#6b7280",
    fontSize: "11px",
  },

  authCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "7px 8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "grid",
    gap: "5px",
    marginBottom: "8px",
  },

  adminCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "grid",
    gap: "12px",
    marginBottom: "12px",
  },

  trainerListCard: {
    background: "#fff",
    borderRadius: "14px",
    display: "grid",
    gap: "10px",
  },

  trainerUsersWrap: {
    display: "grid",
    gap: "10px",
  },

  trainerUserRow: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px",
    display: "grid",
    gap: "10px",
  },

  trainerUserTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  trainerUserName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
  },

  trainerUserMeta: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },

  trainerActionsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  smallInput: {
    minWidth: "160px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "10px 12px",
    fontSize: "13px",
    boxSizing: "border-box",
  },

  archiveButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 14px",
    background: "#f97316",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  emptyText: {
    fontSize: "13px",
    color: "#6b7280",
  },

  authHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  profileName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "2px",
  },

  authTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
  },

  authSubtitle: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },

  loginGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "8px",
  },

  loginMessage: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
  },

  createdTrainerCard: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    display: "grid",
    gap: "6px",
    fontSize: "13px",
    color: "#111827",
  },

  createdTrainerLinkWrap: {
    marginTop: "4px",
  },

  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },

  tabBar: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "6px",
    marginBottom: "12px",
  },

  tabButton: {
    border: "none",
    borderRadius: "10px",
    padding: "9px 10px",
    fontSize: "13px",
    fontWeight: "600",
    background: "#e5e7eb",
    color: "#111827",
    cursor: "pointer",
  },

  tabButtonActive: {
    background: "#111827",
    color: "#fff",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  lockedCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
  },

  toolbarTop: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "6px",
    alignItems: "stretch",
  },

  teamCountCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "8px 10px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },

  teamCountLabel: {
    display: "block",
    fontSize: "11px",
    color: "#6b7280",
    marginBottom: "6px",
  },

  teamCountRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    flexWrap: "wrap",
  },

  teamCountInline: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  countButton: {
    width: "30px",
    height: "30px",
    border: "none",
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
  },

  countValue: {
    minWidth: "30px",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
  },

  selectedBadge: {
    background: "#fff",
    borderRadius: "14px",
    padding: "8px 10px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },

  settingsCompactRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "4px",
  },

  settingsCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "10px 12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "grid",
    gap: "8px",
    minWidth: "220px",
  },

  compactSettingsCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "6px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "grid",
    gap: "4px",
    minWidth: 0,
  },

  settingsLabel: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
  },

  settingsToggleRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  smallToggleButton: {
    border: "none",
    borderRadius: "9px",
    padding: "6px 8px",
    background: "#e5e7eb",
    color: "#111827",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  smallToggleButtonActive: {
    background: "#111827",
    color: "#fff",
  },

  copyOptionList: {
    display: "grid",
    gap: "8px",
  },

  radioRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#111827",
  },

  actionRow: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
  },

  topTeamActionsCompact: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(48px, 1fr))",
    gap: "8px",
  },

  primaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 14px",
    background: "#111827",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  primaryButtonSmall: {
    border: "none",
    borderRadius: "10px",
    padding: "8px 10px",
    background: "#111827",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "12px",
  },

  secondaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 14px",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "600",
    cursor: "pointer",
  },

  secondaryButtonCompact: {
    border: "none",
    borderRadius: "10px",
    padding: "8px 10px",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "12px",
  },

  profileCompactLanguageRow: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    flexShrink: 0,
  },

  languageToggleButton: {
    border: "none",
    borderRadius: "9px",
    padding: "5px 8px",
    background: "#e5e7eb",
    color: "#111827",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  languageToggleButtonActive: {
    background: "#111827",
    color: "#fff",
  },

  compactActionButtonPrimary: {
    border: "none",
    borderRadius: "10px",
    padding: "9px 10px",
    background: "#111827",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },

  compactActionButton: {
    border: "none",
    borderRadius: "10px",
    padding: "9px 10px",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },

  formCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "12px",
    display: "grid",
    gap: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "12px",
    fontSize: "14px",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "12px",
    fontSize: "14px",
    background: "#fff",
  },

  textarea: {
    width: "100%",
    minHeight: "92px",
    boxSizing: "border-box",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "12px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },

  tournamentDashboardSection: {
    display: "grid",
    gap: "20px",
    padding: "16px",
    borderRadius: "24px",
    background: "#dde7f3",
    border: "1px solid #cdd8e7",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
    width: "min(1560px, calc(100vw - 24px))",
    maxWidth: "1560px",
    marginLeft: "50%",
    transform: "translateX(-50%)",
    boxSizing: "border-box",
    minWidth: 0,
    overflow: "visible",
  },

  tournamentDashboardShell: {
    display: "grid",
    gridTemplateColumns: "minmax(378px, 406px) minmax(0, 1fr)",
    gap: "20px",
    alignItems: "start",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentDashboardShellMobile: {
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "16px",
  },

  tournamentSetupPanel: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "22px",
    padding: "21px",
    display: "grid",
    gap: "17px",
    boxShadow: "0 18px 38px rgba(17,24,39,0.24)",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    alignSelf: "start",
  },

  tournamentPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    paddingBottom: "2px",
  },

  tournamentEyebrow: {
    fontSize: "11px",
    color: "#38bdf8",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  tournamentPanelTitle: {
    fontSize: "21px",
    color: "#f8fafc",
    fontWeight: "900",
    lineHeight: 1.2,
  },

  tournamentSetupBlock: {
    display: "grid",
    gap: "12px",
    padding: "15px",
    background: "#f8fafc",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentMessage: {
    padding: "9px 10px",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: "10px",
    color: "#1e3a8a",
    fontSize: "12px",
    fontWeight: "700",
  },

  tournamentBlockTitle: {
    fontSize: "13px",
    color: "#111827",
    fontWeight: "900",
  },

  tournamentList: {
    display: "grid",
    gap: "8px",
    maxHeight: "240px",
    overflowY: "auto",
    overflowX: "hidden",
    minWidth: 0,
  },

  tournamentListItem: {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 13px",
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
    display: "grid",
    gap: "4px",
  },

  tournamentListItemActive: {
    borderColor: "#2563eb",
    background: "#eff6ff",
    boxShadow: "0 0 0 2px rgba(37,99,235,0.12)",
  },

  tournamentListItemTitle: {
    fontSize: "13px",
    color: "#111827",
    fontWeight: "800",
  },

  tournamentListItemMeta: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "700",
  },

  tournamentStatusBadge: {
    borderRadius: "999px",
    padding: "6px 9px",
    background: "#e0f2fe",
    color: "#075985",
    fontSize: "11px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  tournamentInlineActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },

  tournamentFieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    minWidth: 0,
  },

  tournamentFieldGridMobile: {
    gridTemplateColumns: "1fr",
  },

  tournamentCheckRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#111827",
    fontWeight: "600",
  },

  tournamentSetupDivider: {
    height: "1px",
    background: "#e2e8f0",
  },

  tournamentSidebarNote: {
    marginTop: "4px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
    lineHeight: 1.45,
  },

  tournamentSidebarSlotList: {
    display: "grid",
    gap: "10px",
    maxHeight: "min(500px, 54vh)",
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: "2px",
    minWidth: 0,
    overscrollBehavior: "contain",
  },

  tournamentSidebarGroup: {
    display: "grid",
    gap: "8px",
    padding: "12px",
    borderRadius: "13px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    minWidth: 0,
  },

  tournamentSidebarGroupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    color: "#111827",
    fontSize: "12px",
  },

  tournamentSidebarSlotRow: {
    display: "grid",
    gridTemplateColumns: "42px minmax(0, 1fr)",
    alignItems: "center",
    gap: "9px",
    minWidth: 0,
  },

  tournamentCheckboxGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  tournamentRegistrationGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto",
    gap: "8px",
    alignItems: "center",
    minWidth: 0,
  },

  tournamentTeamList: {
    display: "grid",
    gap: "9px",
  },

  tournamentTeamRow: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px",
    display: "grid",
    gap: "8px",
  },

  tournamentTeamRowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    flexWrap: "wrap",
  },

  tournamentTeamIdentity: {
    display: "grid",
    gap: "2px",
    minWidth: 0,
    flex: 1,
  },

  tournamentTeamName: {
    fontSize: "13px",
    color: "#111827",
    fontWeight: "800",
  },

  tournamentTeamMeta: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
  },

  tournamentTeamActions: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  tournamentPlayerRegister: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "8px",
    alignItems: "center",
  },

  tournamentPlayerList: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  tournamentPlayerPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "999px",
    padding: "5px 8px",
    background: "#eef2ff",
    color: "#111827",
    fontSize: "11px",
    fontWeight: "700",
  },

  tournamentPlayerMeta: {
    color: "#64748b",
    fontWeight: "600",
  },

  tournamentMutedText: {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "600",
  },

  tournamentMainPanel: {
    display: "grid",
    gap: "21px",
    minWidth: 0,
    width: "100%",
    padding: "20px",
    borderRadius: "22px",
    background: "#eef4fb",
    border: "1px solid #cfdbea",
    boxShadow: "0 20px 40px rgba(15,23,42,0.11)",
    boxSizing: "border-box",
    alignContent: "start",
    overflow: "visible",
  },

  tournamentHero: {
    background: "#141a2a",
    color: "#fff",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "22px",
    flexWrap: "wrap",
    boxShadow: "0 18px 36px rgba(17,24,39,0.24)",
    border: "1px solid rgba(255,255,255,0.08)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentHeroText: {
    minWidth: 0,
    flex: 1,
  },

  tournamentHeroTitle: {
    margin: "6px 0 0",
    fontSize: "32px",
    lineHeight: 1.1,
    fontWeight: "900",
    color: "#fff",
  },

  tournamentHeroMeta: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#cbd5e1",
    fontWeight: "700",
  },

  tournamentHeroRules: {
    margin: "12px 0 0",
    color: "#e5e7eb",
    fontSize: "14px",
    lineHeight: 1.6,
    maxWidth: "720px",
  },

  tournamentHeroActions: {
    display: "grid",
    gap: "8px",
    justifyItems: "end",
    flexShrink: 0,
  },

  tournamentHeroBadge: {
    borderRadius: "999px",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "800",
  },

  tournamentLightButton: {
    border: "1px solid rgba(255,255,255,0.32)",
    borderRadius: "12px",
    padding: "10px 13px",
    background: "#fff",
    color: "#111827",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  tournamentStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
    gap: "14px",
    minWidth: 0,
  },

  tournamentStatsGridMobile: {
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
  },

  tournamentStatCard: {
    background: "#f8fafc",
    border: "1px solid #dbe3ef",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 10px 22px rgba(17,24,39,0.07)",
    minWidth: 0,
    minHeight: "108px",
    display: "grid",
    alignContent: "space-between",
    gap: "8px",
  },

  tournamentStatValue: {
    fontSize: "30px",
    color: "#111827",
    fontWeight: "900",
    lineHeight: 1,
  },

  tournamentStatLabel: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#111827",
    fontWeight: "800",
  },

  tournamentStatNote: {
    marginTop: "3px",
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  tournamentSubTabs: {
    display: "flex",
    gap: "8px",
    background: "#111827",
    borderRadius: "18px",
    padding: "8px",
    overflowX: "auto",
    overflowY: "hidden",
    boxShadow: "0 14px 30px rgba(15,23,42,0.16)",
    border: "1px solid rgba(255,255,255,0.08)",
    minWidth: 0,
  },

  tournamentSubTab: {
    border: "none",
    borderRadius: "12px",
    padding: "11px 15px",
    background: "transparent",
    color: "#cbd5e1",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
    minWidth: "98px",
    textAlign: "center",
  },

  tournamentSubTabActive: {
    background: "#fff",
    color: "#111827",
    boxShadow: "0 6px 16px rgba(17,24,39,0.18)",
  },

  tournamentWorkspace: {
    minWidth: 0,
    width: "100%",
    display: "grid",
    gap: "22px",
    alignContent: "start",
  },

  tournamentTwoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "14px",
    minWidth: 0,
  },

  tournamentTwoColumnMobile: {
    gridTemplateColumns: "1fr",
  },

  tournamentOverviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 390px), 1fr))",
    gap: "20px",
    alignItems: "stretch",
    minWidth: 0,
  },

  tournamentOverviewHero: {
    gridColumn: "1 / -1",
    borderRadius: "20px",
    padding: "26px",
    background: "#0f172a",
    color: "#fff",
    display: "grid",
    gap: "16px",
    boxShadow: "0 20px 38px rgba(15,23,42,0.24)",
    border: "1px solid rgba(255,255,255,0.10)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentOverviewTitle: {
    fontSize: "30px",
    lineHeight: 1.1,
    fontWeight: "900",
    color: "#fff",
  },

  tournamentOverviewCopy: {
    maxWidth: "720px",
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  tournamentOverviewStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    minWidth: 0,
  },

  tournamentOverviewStat: {
    borderRadius: "16px",
    padding: "14px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    gap: "8px",
    minHeight: "78px",
  },

  tournamentSurface: {
    background: "#f8fafc",
    border: "1px solid #dbe3ef",
    borderRadius: "20px",
    padding: "20px",
    display: "grid",
    gap: "18px",
    boxShadow: "0 12px 26px rgba(17,24,39,0.065)",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    alignContent: "start",
    overflow: "visible",
  },

  tournamentSectionTitle: {
    fontSize: "18px",
    color: "#111827",
    fontWeight: "900",
  },

  tournamentInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
    minWidth: 0,
  },

  tournamentInfoTile: {
    display: "grid",
    gap: "6px",
    minHeight: "70px",
    borderRadius: "14px",
    padding: "13px",
    background: "#f5f8fc",
    border: "1px solid #e2e8f0",
    color: "#111827",
    fontSize: "12px",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentMatchSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
    minWidth: 0,
  },

  tournamentFeatureMatch: {
    display: "grid",
    gap: "7px",
    borderRadius: "18px",
    padding: "16px",
    background: "#111827",
    color: "#fff",
    border: "1px solid #1f2937",
    minWidth: 0,
  },

  tournamentSnapshotList: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },

  tournamentSnapshotRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "11px 12px",
    background: "#f7f9fc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#111827",
    fontWeight: "700",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
    minWidth: 0,
  },

  tournamentPreviewLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "16px",
    alignItems: "start",
    minWidth: 0,
  },

  tournamentPreviewGroups: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: "12px",
    minWidth: 0,
  },

  tournamentPreviewGroupCard: {
    display: "grid",
    gap: "11px",
    borderRadius: "16px",
    padding: "15px",
    background: "#fff",
    border: "1px solid #dbe3ef",
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentPreviewSlotRow: {
    display: "grid",
    gridTemplateColumns: "44px minmax(0, 1fr)",
    alignItems: "center",
    gap: "9px",
    padding: "9px 10px",
    borderRadius: "12px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    color: "#111827",
    fontSize: "12px",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentPreviewBracketCard: {
    display: "grid",
    gap: "13px",
    borderRadius: "18px",
    padding: "17px",
    background: "#111827",
    color: "#fff",
    border: "1px solid #1f2937",
    boxShadow: "0 16px 32px rgba(15,23,42,0.18)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentPreviewMatchList: {
    display: "grid",
    gap: "10px",
    minWidth: 0,
  },

  tournamentPreviewMatchRow: {
    display: "grid",
    gap: "5px",
    padding: "12px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "800",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentSchedulePanel: {
    display: "grid",
    gap: "14px",
    padding: "20px",
    borderRadius: "18px",
    background: "#edf4fb",
    border: "1px solid #d5e2f1",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    overflow: "visible",
  },

  tournamentScheduleWrap: {
    overflowX: "auto",
    overflowY: "visible",
    borderRadius: "16px",
    border: "1px solid #dbe3ef",
    background: "#fff",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    WebkitOverflowScrolling: "touch",
  },

  tournamentScheduleGrid: {
    display: "grid",
    gap: "0",
    width: "100%",
    minWidth: 0,
  },

  tournamentScheduleRow: {
    display: "grid",
    gridTemplateColumns: "124px minmax(0, 1fr)",
    borderBottom: "1px solid #e2e8f0",
    minWidth: 0,
  },

  tournamentScheduleTimeCell: {
    display: "grid",
    gap: "4px",
    alignContent: "center",
    padding: "13px 12px",
    background: "#0f172a",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "800",
    minWidth: 0,
  },

  tournamentScheduleCourts: {
    display: "grid",
    gap: "1px",
    background: "#dbe3ef",
    minWidth: 0,
  },

  tournamentScheduleCourt: {
    display: "grid",
    gap: "6px",
    minHeight: "82px",
    padding: "13px",
    background: "#f8fafc",
    color: "#111827",
    fontSize: "12px",
    fontWeight: "800",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentScheduleMore: {
    padding: "12px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "800",
    textAlign: "center",
  },

  tournamentGroupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "14px",
    minWidth: 0,
  },

  tournamentGroupGridMobile: {
    gridTemplateColumns: "1fr",
  },

  tournamentMiniCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "15px",
    background: "#f7f9fc",
    display: "grid",
    gap: "12px",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentGroupCard: {
    border: "1px solid #dbe3ef",
    borderRadius: "18px",
    padding: "16px",
    background: "#f7f9fc",
    display: "grid",
    gap: "13px",
    boxShadow: "0 9px 20px rgba(15,23,42,0.055)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentGroupHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    minWidth: 0,
    flexWrap: "wrap",
  },

  tournamentGroupCount: {
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111827",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "900",
  },

  tournamentGroupTeamRow: {
    display: "grid",
    gridTemplateColumns: "46px minmax(0, 1fr) minmax(64px, auto)",
    alignItems: "center",
    gap: "9px",
    padding: "11px",
    borderRadius: "12px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    color: "#111827",
    fontSize: "12px",
    fontWeight: "800",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentTeamSeed: {
    minWidth: "34px",
    height: "26px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "900",
    flexShrink: 0,
  },

  tournamentSlotInput: {
    width: "100%",
    minWidth: 0,
    border: "1px solid #dbe3ef",
    borderRadius: "10px",
    padding: "9px 10px",
    background: "#fff",
    color: "#111827",
    fontSize: "13px",
    fontWeight: "800",
    boxSizing: "border-box",
  },

  tournamentMiniTitle: {
    fontSize: "13px",
    color: "#111827",
    fontWeight: "900",
  },

  tournamentBracket: {
    display: "grid",
    gap: "10px",
  },

  tournamentBracketBoard: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
    gap: "16px",
    alignItems: "start",
    padding: "16px",
    borderRadius: "18px",
    background: "#f1f5f9",
    border: "1px solid #dbe3ef",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "visible",
  },

  tournamentBracketStage: {
    display: "grid",
    gap: "12px",
    alignContent: "start",
    minHeight: 0,
    minWidth: 0,
  },

  tournamentBracketStageTitle: {
    color: "#475569",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  tournamentBracketMatch: {
    borderRadius: "16px",
    padding: "14px",
    background: "#fff",
    border: "1px solid #dbe3ef",
    display: "grid",
    gap: "9px",
    boxShadow: "0 9px 20px rgba(15,23,42,0.075)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentBracketMatchFinal: {
    borderRadius: "18px",
    padding: "16px",
    background: "#111827",
    border: "1px solid #1f2937",
    display: "grid",
    gap: "9px",
    boxShadow: "0 14px 28px rgba(15,23,42,0.20)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentBracketLine: {
    borderRadius: "12px",
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    padding: "11px 12px",
    color: "#111827",
    fontSize: "12px",
    fontWeight: "800",
    display: "grid",
    gap: "4px",
    textAlign: "left",
    cursor: "pointer",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentBracketLineWinner: {
    borderColor: "#22c55e",
    background: "#dcfce7",
    color: "#14532d",
    boxShadow: "0 0 0 2px rgba(34,197,94,0.12)",
  },

  tournamentBracketVs: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "900",
    textAlign: "center",
  },

  tournamentMatchList: {
    display: "grid",
    gap: "12px",
    minWidth: 0,
  },

  tournamentMatchCard: {
    border: "1px solid #dbe3ef",
    borderRadius: "16px",
    padding: "15px",
    background: "#f7f9fc",
    display: "grid",
    gap: "13px",
    boxShadow: "0 8px 16px rgba(15,23,42,0.045)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentMatchHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
    minWidth: 0,
  },

  tournamentMatchKicker: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  tournamentMatchTitle: {
    color: "#111827",
    fontSize: "15px",
    fontWeight: "900",
    marginTop: "3px",
    overflowWrap: "anywhere",
  },

  tournamentMatchStatus: {
    borderRadius: "999px",
    padding: "7px 10px",
    background: "#fff7ed",
    color: "#9a3412",
    fontSize: "11px",
    fontWeight: "900",
  },

  tournamentMatchStatusDone: {
    background: "#dcfce7",
    color: "#166534",
  },

  tournamentScoreRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  tournamentScoreInput: {
    width: "72px",
    boxSizing: "border-box",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "10px",
    fontSize: "13px",
    fontWeight: "800",
    textAlign: "center",
    background: "#fff",
  },

  tournamentScoreDivider: {
    color: "#64748b",
    fontSize: "16px",
    fontWeight: "900",
  },

  tournamentStandingsList: {
    display: "grid",
    gap: "14px",
    minWidth: 0,
  },

  tournamentStandingsCard: {
    border: "1px solid #dbe3ef",
    borderRadius: "18px",
    padding: "15px",
    background: "#f7f9fc",
    display: "grid",
    gap: "13px",
    boxShadow: "0 9px 20px rgba(15,23,42,0.055)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentTableWrap: {
    overflowX: "auto",
    overflowY: "visible",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    WebkitOverflowScrolling: "touch",
  },

  tournamentTable: {
    width: "100%",
    minWidth: "680px",
    borderCollapse: "collapse",
    fontSize: "12px",
    color: "#111827",
    textAlign: "center",
  },

  tournamentTableHead: {
    padding: "9px 8px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
    borderBottom: "1px solid #dbe3ef",
  },

  tournamentTableTeam: {
    padding: "10px 8px",
    textAlign: "left",
    fontWeight: "900",
    borderBottom: "1px solid #e5e7eb",
  },

  tournamentTableCell: {
    padding: "10px 8px",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: "700",
  },

  tournamentTablePoints: {
    padding: "10px 8px",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: "900",
    color: "#1d4ed8",
  },

  tournamentPublicRoster: {
    display: "grid",
    gap: "16px",
    minWidth: 0,
  },

  tournamentPublicHeader: {
    display: "grid",
    gap: "7px",
    color: "#111827",
    fontSize: "13px",
    padding: "15px",
    borderRadius: "16px",
    background: "#f7f9fc",
    border: "1px solid #e2e8f0",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentShareState: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    padding: "17px",
    borderRadius: "18px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentShareStateLive: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
  },

  tournamentShareTitle: {
    color: "#111827",
    fontSize: "18px",
    fontWeight: "900",
  },

  tournamentMutedPanel: {
    padding: "22px",
    borderRadius: "16px",
    background: "#f7f9fc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "800",
    textAlign: "center",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentEmptyState: {
    minHeight: "320px",
    borderRadius: "22px",
    border: "1px dashed #cbd5e1",
    background: "#fbfdff",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: "10px",
    padding: "32px",
    textAlign: "center",
  },

  smallSelect: {
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "8px 10px",
    fontSize: "13px",
    background: "#fff",
  },

  playersGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
  },

  playerCardCompact: {
    borderRadius: "12px",
    background: "#fff",
    padding: "8px 9px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    minHeight: "58px",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    touchAction: "manipulation",
  },

  playerCardSelected: {
    outline: "2px solid #111827",
  },

  playerCompactTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },

  playerNameCompact: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: 1.15,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  skillMini: {
    minWidth: "22px",
    height: "22px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    flexShrink: 0,
    padding: "0 6px",
  },

  playerCompactBottom: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "6px",
    minHeight: "24px",
  },

  playerCardListCompact: {
    borderRadius: "10px",
    background: "#fff",
    padding: "8px 10px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    minHeight: "unset",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    touchAction: "manipulation",
  },

  playerCardListCompactSelected: {
    outline: "2px solid #111827",
  },

  playerListCompactName: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: 1.15,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
    flex: 1,
  },

  playerListCompactRight: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },

  checkTiny: {
    fontSize: "11px",
    color: "#6b7280",
  },

  playerCardActions: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },

  editMiniButton: {
    border: "none",
    borderRadius: "8px",
    padding: "5px 8px",
    background: "#e5e7eb",
    color: "#111827",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },

  archiveMiniButton: {
    border: "none",
    borderRadius: "8px",
    padding: "5px 8px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  generateButtonInline: {
    border: "none",
    borderRadius: "12px",
    padding: "8px 12px",
    background: "#16a34a",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  archivedCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "grid",
    gap: "10px",
  },

  archivedPlayersWrap: {
    display: "grid",
    gap: "8px",
  },

  archivedPlayerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px",
  },

  archivedPlayerName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
  },

  matchModeCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "10px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "grid",
    gap: "10px",
  },

  matchModeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  matchControlsWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  matchModeTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
  },

  matchModeSubtitle: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },

  courtWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  courtLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
  },

  matchActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  matchGrid: {
    display: "grid",
    gap: "10px",
  },

  matchCard: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "12px",
    border: "1px solid #e5e7eb",
  },

  matchCourt: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#16a34a",
    marginBottom: "8px",
  },

  matchTeams: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
  },

  vsText: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "600",
  },

  noMatchesText: {
    fontSize: "13px",
    color: "#6b7280",
  },

  teamsGrid: {
    display: "grid",
    gap: "10px",
  },

  teamCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "7px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    minWidth: 0,
  },

  teamHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },

  teamTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
  },

  teamPointsBadge: {
    borderRadius: "999px",
    background: "#111827",
    color: "#fff",
    padding: "3px 7px",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  moveHereButton: {
    marginTop: "6px",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    background: "#16a34a",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  teamPlayers: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  teamPlayerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "6px",
    padding: "3px 0",
    borderBottom: "1px solid #eef2f7",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    touchAction: "manipulation",
  },

  teamPlayerRowSelected: {
    background: "#eff6ff",
    borderRadius: "10px",
    padding: "8px",
    borderBottom: "1px solid transparent",
  },

  teamPlayerLeft: {
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
  },

  teamPlayerName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: 1.15,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  teamPlayerRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    flexWrap: "nowrap",
    flexShrink: 0,
  },

  inlineActionButton: {
    border: "none",
    borderRadius: "8px",
    padding: "5px 8px",
    background: "#e5e7eb",
    color: "#111827",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },

  iconMoveButton: {
    border: "none",
    borderRadius: "999px",
    width: "22px",
    height: "22px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  iconMoveButtonActive: {
    background: "#1d4ed8",
    color: "#fff",
  },

  lockButtonActive: {
    background: "#111827",
    color: "#fff",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },

  modalCard: {
    width: "100%",
    maxWidth: "360px",
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    display: "grid",
    gap: "10px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
  },

  modalActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  iconActionButton: {
    border: "none",
    borderRadius: "10px",
    height: "32px",
    minWidth: "32px",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  iconActionButtonPrimary: {
    border: "none",
    borderRadius: "10px",
    height: "32px",
    minWidth: "32px",
    background: "#111827",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  profileCompactRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },

  profileCompactLeft: {
    minWidth: 0,
    display: "grid",
    gap: "0px",
    flex: 1,
  },

  profileCompactName: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  profileCompactRole: {
    fontSize: "10px",
    color: "#6b7280",
    textTransform: "capitalize",
  },

  profileCompactLogout: {
    border: "none",
    borderRadius: "9px",
    padding: "6px 10px",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px",
    flexShrink: 0,
  },

  lockIconButton: {
    border: "none",
    borderRadius: "999px",
    width: "22px",
    height: "22px",
    background: "#e5e7eb",
    color: "#111827",
    fontSize: "11px",
    justifyContent: "center",
    padding: 0,
    flexShrink: 0,
  },

  lockIconButtonActive: {
    background: "#111827",
    color: "#fff",
  },

  addToTeamsList: {
    display: "grid",
    gap: "8px",
    maxHeight: "320px",
    overflowY: "auto",
  },

  addToTeamsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },

  addToTeamsNameWrap: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  },

  addToTeamsName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  addToTeamsSubtitle: {
    margin: 0,
    fontSize: "12px",
    color: "#6b7280",
  },

  settingsList: {
    display: "grid",
    gap: "8px",
  },

  settingsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    background: "#f8fafc",
    borderRadius: "10px",
    fontSize: "13px",
  },

  exportOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 9999,
  },

  exportCard: {
    width: "100%",
    maxWidth: "700px",
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    display: "grid",
    gap: "16px",
  },

  exportGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },

  exportTeam: {
    display: "grid",
    gap: "6px",
  },

  exportTeamTitle: {
    fontSize: "16px",
    fontWeight: "800",
    marginBottom: "6px",
    color: "#111827",
  },

  exportPlayer: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
  },

  addToTeamsActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },

  smallPrimaryButton: {
    border: "none",
    borderRadius: "9px",
    padding: "7px 10px",
    background: "#111827",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px",
  },

  clubSection: {
    display: "grid",
    gap: "6px",
  },

  clubSectionTitle: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#374151",
    padding: "2px 2px 0 2px",
  },

  clubSectionPlayers: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
  },
};
