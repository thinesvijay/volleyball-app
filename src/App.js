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
const TOURNAMENTS_STORAGE_KEY = "volleyball-tournaments-v1";
const ACTIVE_TOURNAMENT_STORAGE_KEY_PREFIX = "volleyball-active-tournament-id:";
const CURRENT_ROUND_TTL_MS = 60 * 60 * 1000;
const SAVED_ROUND_TTL_MS = 6 * 60 * 60 * 1000;

const TOURNAMENT_SERVER_SAFE_FIELDS = [
  "publicCode",
  "published",
  "Published",
  "publishedAt",
  "updatedAt",
  "status",
  "backendSyncedAt",
  "publicVerifiedAt",
  "promotionVerifiedAt",
  "publishVerificationError",
];

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

function SvgIcon({ type, size = 16, strokeWidth = 2, style }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: "false",
    style: { display: "block", flexShrink: 0, ...style },
  };

  if (type === "plus") {
    return (
      <svg {...commonProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (type === "minus") {
    return (
      <svg {...commonProps}>
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (type === "save") {
    return (
      <svg {...commonProps}>
        <path d="M5 3h12l2 2v16H5z" />
        <path d="M8 3v6h8V3" />
        <path d="M8 21v-7h8v7" />
      </svg>
    );
  }

  if (type === "refresh") {
    return (
      <svg {...commonProps}>
        <path d="M20 6v5h-5" />
        <path d="M4 18v-5h5" />
        <path d="M18.5 9A7 7 0 0 0 6.2 6.8L4 9" />
        <path d="M5.5 15A7 7 0 0 0 17.8 17.2L20 15" />
      </svg>
    );
  }

  if (type === "settings") {
    return (
      <svg {...commonProps}>
        <path d="M4 6h9" />
        <path d="M17 6h3" />
        <path d="M4 12h3" />
        <path d="M11 12h9" />
        <path d="M4 18h11" />
        <path d="M19 18h1" />
        <circle cx="15" cy="6" r="2" />
        <circle cx="9" cy="12" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  }

  if (type === "x") {
    return (
      <svg {...commonProps}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );
  }

  if (type === "lock") {
    return (
      <svg {...commonProps}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (type === "unlock") {
    return (
      <svg {...commonProps}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 7.5-2" />
      </svg>
    );
  }

  if (type === "download") {
    return (
      <svg {...commonProps}>
        <path d="M12 4v10" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 20h14" />
      </svg>
    );
  }

  if (type === "eye") {
    return (
      <svg {...commonProps}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (type === "chevron") {
    return (
      <svg {...commonProps}>
        <path d="m7 10 5 5 5-5" />
      </svg>
    );
  }

  if (type === "more") {
    return (
      <svg {...commonProps}>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return null;
}

const TOURNAMENT_GROUP_COLORS = [
  {
    soft: "#eff6ff",
    border: "#bfdbfe",
    accent: "#2563eb",
    text: "#1e3a8a",
    publicSoft: "rgba(37,99,235,0.16)",
    publicBorder: "rgba(147,197,253,0.28)",
    publicText: "#bfdbfe",
  },
  {
    soft: "#ecfdf5",
    border: "#a7f3d0",
    accent: "#059669",
    text: "#065f46",
    publicSoft: "rgba(5,150,105,0.16)",
    publicBorder: "rgba(167,243,208,0.28)",
    publicText: "#bbf7d0",
  },
  {
    soft: "#f5f3ff",
    border: "#ddd6fe",
    accent: "#7c3aed",
    text: "#5b21b6",
    publicSoft: "rgba(124,58,237,0.16)",
    publicBorder: "rgba(196,181,253,0.28)",
    publicText: "#ddd6fe",
  },
  {
    soft: "#fff7ed",
    border: "#fed7aa",
    accent: "#ea580c",
    text: "#9a3412",
    publicSoft: "rgba(234,88,12,0.16)",
    publicBorder: "rgba(253,186,116,0.28)",
    publicText: "#fed7aa",
  },
  {
    soft: "#fdf2f8",
    border: "#fbcfe8",
    accent: "#db2777",
    text: "#9d174d",
    publicSoft: "rgba(219,39,119,0.16)",
    publicBorder: "rgba(251,207,232,0.28)",
    publicText: "#fbcfe8",
  },
  {
    soft: "#f0fdfa",
    border: "#99f6e4",
    accent: "#0d9488",
    text: "#115e59",
    publicSoft: "rgba(13,148,136,0.16)",
    publicBorder: "rgba(153,246,228,0.28)",
    publicText: "#99f6e4",
  },
];

const PUBLIC_THEME_PRESETS = {
  "classic-green": {
    label: { en: "Classic Green", no: "Klassisk grønn" },
    background: "#031f16",
    surface: "#082a20",
    panel: "#0f3d2f",
    primary: "#22c55e",
    accent: "#facc15",
    text: "#ffffff",
    mutedText: "#d7f7e6",
    border: "#22c55e",
  },
  "dark-cup": {
    label: { en: "Dark Cup", no: "Mørk cup" },
    background: "#050816",
    surface: "#101827",
    panel: "#182235",
    primary: "#38bdf8",
    accent: "#c084fc",
    text: "#ffffff",
    mutedText: "#cbd5e1",
    border: "#38bdf8",
  },
  "orange-trophy": {
    label: { en: "Orange Trophy", no: "Oransje trofé" },
    background: "#190a03",
    surface: "#341407",
    panel: "#4a1d09",
    primary: "#f97316",
    accent: "#facc15",
    text: "#fff7ed",
    mutedText: "#fed7aa",
    border: "#fb923c",
  },
  "blue-arena": {
    label: { en: "Blue Arena", no: "Blå arena" },
    background: "#06172e",
    surface: "#0b2447",
    panel: "#123463",
    primary: "#3b82f6",
    accent: "#67e8f9",
    text: "#ffffff",
    mutedText: "#bfdbfe",
    border: "#60a5fa",
  },
  "gold-premium": {
    label: { en: "Gold Premium", no: "Gull premium" },
    background: "#11100a",
    surface: "#1f1b10",
    panel: "#2e2612",
    primary: "#facc15",
    accent: "#fb923c",
    text: "#fffbea",
    mutedText: "#fde68a",
    border: "#eab308",
  },
  "red-black": {
    label: { en: "Red Black", no: "Rød/svart" },
    background: "#120305",
    surface: "#1f080d",
    panel: "#2f1016",
    primary: "#ef4444",
    accent: "#f97316",
    text: "#ffffff",
    mutedText: "#fecaca",
    border: "#f87171",
  },
  "clean-white": {
    label: { en: "Clean White", no: "Ren hvit" },
    background: "#f8fafc",
    surface: "#ffffff",
    panel: "#ffffff",
    primary: "#166534",
    accent: "#2563eb",
    text: "#0f172a",
    mutedText: "#475569",
    border: "#cbd5e1",
  },
  "club-custom": {
    label: { en: "Club Custom", no: "Klubbtilpasset" },
    background: "#08111f",
    surface: "#111827",
    panel: "#1f2937",
    primary: "#22c55e",
    accent: "#3b82f6",
    text: "#ffffff",
    mutedText: "#d1d5db",
    border: "#22c55e",
  },
};

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
    trainerLogin: "Sign in",
    loginRequired: "Sign in to continue",
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
    modeShort: "Mode",
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
    playersLoginRequired: "Sign in to continue.",
    teamsLoginRequired: "Sign in to continue.",
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
    appSubtitle: "Thines Vijay",
    matchPattern: "Pattern",
    matchShuffle: "Shuffle",
    otherClub: "Other",
    loadingShort: "...",
    landingBrandSubtitle: "Tournament management for volleyball organizers",
    landingOrganizerLogin: "Organizer login",
    landingLoginHelper: "Manage your tournaments.",
    landingHeroTitle: "Run better volleyball tournaments",
    landingHeroCopy:
      "Create teams, schedules, scores and public tournament pages in one place.",
    landingChipLiveSchedule: "Live schedule",
    landingChipPublicPage: "Public page",
    landingChipGroupKnockout: "Group + knockout",
    landingChipOrganizerTools: "Organizer tools",
    landingUpcomingTitle: "Upcoming volleyball tournaments",
    landingOpenTournament: "View details",
    landingNoPublicTournaments: "No public tournaments yet.",
    landingPublishedAppear: "Published tournaments will appear here.",
    landingAllCountries: "All countries",
    landingAllTypes: "All types",
    landingStatusUpcoming: "Upcoming",
    landingStatusLive: "Live",
    landingStatusPast: "Past",
    landingStatusCompleted: "Completed",
    landingEventPlatform: "Public tournament platform",
    landingControlTitle: "Live tournament control",
    landingControlSubtitle: "Schedules, scores and public sharing.",
    landingControlGroups: "Groups",
    landingControlScores: "Scores",
    landingControlPublicLink: "Public link",
    landingControlSchedulePreview: "Mini schedule",
    landingControlCourtCount: "3 courts",
    landingControlMatchCount: "12 matches",
    teamBuilder: "Team Builder",
  },
  no: {
    trainer: "Trener",
    logout: "Logg ut",
    loginOk: "Innlogging ok.",
    trainerLogin: "Logg inn",
    loginRequired: "Logg inn for å fortsette",
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
    modeShort: "Modus",
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
    playersLoginRequired: "Logg inn for å fortsette.",
    teamsLoginRequired: "Logg inn for å fortsette.",
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
    appSubtitle: "Thines Vijay",
    matchPattern: "Mønster",
    matchShuffle: "Bland",
    otherClub: "Annet",
    loadingShort: "...",
    landingBrandSubtitle: "Turneringsadministrasjon for volleyballarrangører",
    landingOrganizerLogin: "Arrangørinnlogging",
    landingLoginHelper: "Administrer turneringene dine.",
    landingHeroTitle: "Kjør bedre volleyballturneringer",
    landingHeroCopy:
      "Lag grupper, kampoppsett, resultater og offentlige turneringssider på ett sted.",
    landingChipLiveSchedule: "Live kampoppsett",
    landingChipPublicPage: "Offentlig side",
    landingChipGroupKnockout: "Gruppe + sluttspill",
    landingChipOrganizerTools: "Arrangørverktøy",
    landingUpcomingTitle: "Kommende volleyballturneringer",
    landingOpenTournament: "Se turnering",
    landingNoPublicTournaments: "Ingen offentlige turneringer enda.",
    landingPublishedAppear: "Publiserte turneringer vises her.",
    landingAllCountries: "Alle land",
    landingAllTypes: "Alle typer",
    landingStatusUpcoming: "Kommende",
    landingStatusLive: "Live",
    landingStatusPast: "Tidligere",
    landingStatusCompleted: "Ferdig",
    landingEventPlatform: "Offentlig turneringsplattform",
    landingControlTitle: "Live turneringskontroll",
    landingControlSubtitle: "Kampoppsett, score og offentlig deling.",
    landingControlGroups: "Grupper",
    landingControlScores: "Score",
    landingControlPublicLink: "Offentlig lenke",
    landingControlSchedulePreview: "Mini kampoppsett",
    landingControlCourtCount: "3 baner",
    landingControlMatchCount: "12 kamper",
    teamBuilder: "Lagbygger",
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
    publicTheme: getDefaultPublicTheme(),
    publicLiveTheme: getDefaultPublicLiveTheme(),
    courtBlocks: [],
    publicListingEnabled: false,
    seriesScheduleMode: "fourFirst",
    publicTitle: "",
    publicSummary: "",
    organizerName: "",
    description: "",
    country: "",
    city: "",
    locationName: "",
    address: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    registrationUrl: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    prizeText: "",
    feeText: "",
    breakfastInfo: "",
    breakBallInfo: "",
    sodduInfo: "",
    posterImageUrl: "",
    publicLogoUrl: "",
    publicCardImageUrl: "",
    publicCardBackgroundUrl: "",
    publicLiveLogoUrl: "",
    publicLiveBackgroundUrl: "",
    publicLivePrimaryColor: "",
    publicLiveAccentColor: "",
    publicLiveTextColor: "",
    publicLiveCardColor: "",
    publicLivePageBackground: "",
    themeColor: "#0f766e",
    accentColor: "#22c55e",
    maxTeams: "",
    series: [],
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
      showRoundTitles: false,
      showRoundLabels: false,
      showRoundNumbers: false,
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

function getDefaultPublicTheme() {
  return {
    ...PUBLIC_THEME_PRESETS["classic-green"],
    preset: "classic-green",
    mode: "preset",
  };
}

function getDefaultPublicLiveTheme() {
  return {
    ...PUBLIC_THEME_PRESETS["clean-white"],
    preset: "clean-white",
    mode: "preset",
  };
}

function isValidHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || "").trim());
}

function normalizePublicTheme(theme) {
  const defaultTheme = getDefaultPublicTheme();
  const incomingTheme = theme || {};
  const themeWithAliases = {
    ...incomingTheme,
    background: incomingTheme.background || incomingTheme.pageBg,
    surface: incomingTheme.surface || incomingTheme.cardBg,
    panel: incomingTheme.panel || incomingTheme.cardBg,
  };
  const presetKey = String(themeWithAliases?.preset || defaultTheme.preset).trim();
  const preset = PUBLIC_THEME_PRESETS[presetKey] || PUBLIC_THEME_PRESETS["classic-green"];
  const merged = {
    ...defaultTheme,
    ...preset,
    ...themeWithAliases,
    preset: PUBLIC_THEME_PRESETS[presetKey] ? presetKey : defaultTheme.preset,
  };

  [
    "background",
    "surface",
    "panel",
    "primary",
    "accent",
    "text",
    "mutedText",
    "border",
  ].forEach((field) => {
    if (!isValidHexColor(merged[field])) {
      merged[field] = defaultTheme[field];
    }
  });

  return {
    ...merged,
    pageBg: merged.background,
    cardBg: merged.panel,
  };
}

function normalizePublicLiveTheme(theme) {
  const defaultTheme = getDefaultPublicLiveTheme();
  const incomingTheme = theme || {};
  const themeWithAliases = {
    ...incomingTheme,
    background: incomingTheme.background || incomingTheme.pageBg,
    surface: incomingTheme.surface || incomingTheme.cardBg,
    panel: incomingTheme.panel || incomingTheme.cardBg,
  };
  const presetKey = String(themeWithAliases?.preset || defaultTheme.preset).trim();
  const preset = PUBLIC_THEME_PRESETS[presetKey] || PUBLIC_THEME_PRESETS["clean-white"];
  const merged = {
    ...defaultTheme,
    ...preset,
    ...themeWithAliases,
    preset: PUBLIC_THEME_PRESETS[presetKey] ? presetKey : defaultTheme.preset,
  };

  [
    "background",
    "surface",
    "panel",
    "primary",
    "accent",
    "text",
    "mutedText",
    "border",
  ].forEach((field) => {
    if (!isValidHexColor(merged[field])) {
      merged[field] = defaultTheme[field];
    }
  });

  return {
    ...merged,
    pageBg: merged.background,
    cardBg: merged.panel,
  };
}

function getPublicThemeStyle(theme) {
  const safeTheme = normalizePublicTheme(theme);

  return {
    "--public-bg": safeTheme.background,
    "--public-surface": safeTheme.surface,
    "--public-panel": safeTheme.panel,
    "--public-primary": safeTheme.primary,
    "--public-accent": safeTheme.accent,
    "--public-text": safeTheme.text,
    "--public-muted": safeTheme.mutedText,
    "--public-border": safeTheme.border,
  };
}

function hexToRgba(hex, alpha = 1) {
  const safeHex = String(hex || "").trim();
  if (!isValidHexColor(safeHex)) return `rgba(15,23,42,${alpha})`;

  const normalized = safeHex.slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

function getTournamentPublicCardTheme(tournament) {
  return normalizePublicTheme({
    background: tournament?.themeColor,
    primary: tournament?.themeColor,
    accent: tournament?.accentColor,
    ...(tournament?.publicTheme || {}),
  });
}

function getTournamentPublicLogoUrl(tournament) {
  return String(tournament?.publicLogoUrl || "").trim();
}

function getTournamentPublicCardImageUrl(tournament) {
  return String(
    tournament?.publicCardBackgroundUrl ||
      tournament?.publicCardImageUrl ||
      tournament?.posterImageUrl ||
      ""
  ).trim();
}

function getTournamentPublicOrganizerName(tournament) {
  return String(
    tournament?.organizerName || tournament?.publicOrganizerName || ""
  ).trim();
}

function getTournamentPublicLiveTheme(tournament) {
  const storedTheme = tournament?.publicLiveTheme || {};
  const cardColor = tournament?.publicLiveCardColor || storedTheme.panel;

  return normalizePublicLiveTheme({
    ...storedTheme,
    background:
      tournament?.publicLivePageBackground ||
      storedTheme.background ||
      storedTheme.pageBg,
    surface: cardColor || storedTheme.surface || storedTheme.cardBg,
    panel: cardColor || storedTheme.panel || storedTheme.cardBg,
    primary: tournament?.publicLivePrimaryColor || storedTheme.primary,
    accent: tournament?.publicLiveAccentColor || storedTheme.accent,
    text: tournament?.publicLiveTextColor || storedTheme.text,
  });
}

function getTournamentPublicLiveLogoUrl(tournament) {
  return String(tournament?.publicLiveLogoUrl || "").trim();
}

function getTournamentPublicLiveBackgroundUrl(tournament) {
  return String(tournament?.publicLiveBackgroundUrl || "").trim();
}

function getPublicCardThemeStyle(theme, imageUrl = "") {
  const safeTheme = normalizePublicTheme(theme);
  const backgroundLayer = imageUrl
    ? `linear-gradient(135deg, ${hexToRgba(safeTheme.background, 0.90)}, ${hexToRgba(
        safeTheme.panel,
        0.84
      )}), url(${imageUrl})`
    : `radial-gradient(circle at 16% 8%, ${hexToRgba(
        safeTheme.accent,
        0.18
      )}, transparent 34%), linear-gradient(145deg, ${safeTheme.background}, ${
        safeTheme.panel
      } 74%)`;

  return {
    "--card-bg": safeTheme.background,
    "--card-panel": safeTheme.panel,
    "--card-primary": safeTheme.primary,
    "--card-accent": safeTheme.accent,
    "--card-text": safeTheme.text,
    "--card-muted": safeTheme.mutedText,
    "--card-border": safeTheme.border,
    background: backgroundLayer,
    backgroundSize: imageUrl ? "cover" : undefined,
    backgroundPosition: imageUrl ? "center" : undefined,
    borderColor: safeTheme.border,
    color: safeTheme.text,
  };
}

function createStableTournamentId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTournamentIdentity(tournament) {
  return String(
    tournament?.id || tournament?.tournamentId || tournament?.TournamentId || ""
  ).trim();
}

function applyTournamentDefaults(tournament) {
  const defaults = getDefaultTournamentConfig();
  if (!tournament) return defaults;
  const tournamentId = getTournamentIdentity(tournament);

  return {
    ...defaults,
    ...tournament,
    id: tournamentId,
    tournamentId,
    TournamentId: tournamentId,
    displaySettings: {
      ...defaults.displaySettings,
      ...(tournament.displaySettings || {}),
    },
    publicTheme: normalizePublicTheme({
      primary: tournament.themeColor,
      accent: tournament.accentColor,
      ...(tournament.publicTheme || {}),
    }),
    publicLiveTheme: getTournamentPublicLiveTheme(tournament),
    courtBlocks: Array.isArray(tournament.courtBlocks)
      ? tournament.courtBlocks
      : [],
    groups: Array.isArray(tournament.groups) ? tournament.groups : [],
    series: Array.isArray(tournament.series) ? tournament.series : [],
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

function getTournamentStorageUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function isTournamentOwnedByUsername(tournament, username) {
  const currentUsername = getTournamentStorageUsername(username);
  const ownerUsernames = [
    tournament?.organizerUsername,
    tournament?.OrganizerUsername,
    tournament?.ownerUsername,
    tournament?.OwnerUsername,
  ]
    .map(getTournamentStorageUsername)
    .filter(Boolean);

  return Boolean(
    currentUsername && ownerUsernames.some((owner) => owner === currentUsername)
  );
}

function filterTournamentsForUsername(tournaments, username) {
  if (!Array.isArray(tournaments)) return [];

  return tournaments.filter((tournament) =>
    isTournamentOwnedByUsername(tournament, username)
  );
}

function dedupeTournamentsById(tournaments) {
  if (!Array.isArray(tournaments)) return [];

  const seenIds = new Set();
  return tournaments.filter((tournament) => {
    const tournamentId = getTournamentIdentity(tournament);
    if (!tournamentId || seenIds.has(tournamentId)) return false;
    seenIds.add(tournamentId);
    return true;
  });
}

function getTournamentsStorageKey(username) {
  const normalizedUsername = getTournamentStorageUsername(username);
  return normalizedUsername
    ? `${TOURNAMENTS_STORAGE_KEY}:${normalizedUsername}`
    : "";
}

function saveStoredTournaments(tournaments, username) {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOURNAMENTS_STORAGE_KEY);

    const storageKey = getTournamentsStorageKey(username);
    if (!storageKey) return;

    localStorage.setItem(
      storageKey,
      JSON.stringify(
        dedupeTournamentsById(filterTournamentsForUsername(tournaments, username)).filter(
          (tournament) => getTournamentIdentity(tournament)
        )
      )
    );
  } catch (error) {
    console.error("Could not cache tournaments:", error);
  }
}

function getActiveTournamentStorageKey(username) {
  const normalizedUsername = getTournamentStorageUsername(username);
  return normalizedUsername
    ? `${ACTIVE_TOURNAMENT_STORAGE_KEY_PREFIX}${normalizedUsername}`
    : "";
}

function loadActiveTournamentId(username) {
  if (typeof window === "undefined") return "";

  try {
    const storageKey = getActiveTournamentStorageKey(username);
    return storageKey ? String(localStorage.getItem(storageKey) || "") : "";
  } catch (error) {
    console.error("Could not load active tournament id:", error);
    return "";
  }
}

function saveActiveTournamentId(username, tournamentId) {
  if (typeof window === "undefined" || !tournamentId) return;

  try {
    const storageKey = getActiveTournamentStorageKey(username);
    if (!storageKey) return;
    localStorage.setItem(storageKey, String(tournamentId));
  } catch (error) {
    console.error("Could not save active tournament id:", error);
  }
}

function removeActiveTournamentId(username, tournamentId = "") {
  if (typeof window === "undefined") return;

  try {
    const storageKey = getActiveTournamentStorageKey(username);
    if (!storageKey) return;

    const storedId = String(localStorage.getItem(storageKey) || "");
    if (!tournamentId || storedId === String(tournamentId)) {
      localStorage.removeItem(storageKey);
    }
  } catch (error) {
    console.error("Could not remove active tournament id:", error);
  }
}

function getPreferredActiveTournamentId(tournaments, username, currentId = "") {
  const scopedTournaments = filterTournamentsForUsername(tournaments, username);
  if (!scopedTournaments.length) return "";

  if (currentId && scopedTournaments.some((tournament) => tournament.id === currentId)) {
    return currentId;
  }

  const storedId = loadActiveTournamentId(username);
  if (storedId && scopedTournaments.some((tournament) => tournament.id === storedId)) {
    return storedId;
  }

  return scopedTournaments[0]?.id || "";
}

function createTournamentPublicCode(tournamentName) {
  const slug = String(tournamentName || "tournament")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 16);
  const prefix = slug || "t";
  const suffix = Math.random().toString(36).slice(2, 8);

  return `${prefix}-${suffix}`;
}

function getPublicTournamentUrl(tournament) {
  if (typeof window === "undefined" || !tournament?.publicCode) return "";

  return `${window.location.origin}${window.location.pathname}?publicTournament=${encodeURIComponent(
    tournament.publicCode
  )}`;
}

function getTournamentPublicTitle(tournament) {
  return (
    String(tournament?.publicTitle || "").trim() ||
    String(tournament?.name || "").trim() ||
    "Tournament"
  );
}

function getTournamentPublicSummary(tournament) {
  return (
    String(tournament?.publicSummary || "").trim() ||
    String(tournament?.description || "").trim() ||
    String(tournament?.rules || "").trim()
  );
}

function getTournamentSeries(tournament) {
  const series = Array.isArray(tournament?.series) ? tournament.series : [];

  if (series.length > 0) return series;

  const configuredTeamSize = Number(tournament?.teamSize) || 0;
  if (configuredTeamSize === 4 || configuredTeamSize === 5) {
    return [
      {
        id: `${configuredTeamSize}-side`,
        name: `${configuredTeamSize}-side`,
        teamSize: configuredTeamSize,
        format: tournament?.format || "group-stage",
        maxTeams: tournament?.maxTeams || tournament?.totalTeams || "",
        minimumTeams: "",
        prizeText: tournament?.prizeText || "",
        feeText: tournament?.feeText || "",
        startTime: tournament?.startTime || "",
        notes: "",
      },
    ];
  }

  return [];
}

const DEFAULT_TOURNAMENT_SERIES_ID = "series-default";
const SERIES_PUBLIC_STATUSES = ["hidden", "live", "completed"];

function slugifySeriesId(value, fallback = "series") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function getSeriesPlayersPerTeam(series) {
  const parsed = Number(series?.playersPerTeam || series?.teamSize || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : "";
}

function getSeriesDisplayName(series, language = "en") {
  const name = String(series?.name || "").trim();
  if (name) return name;

  const playersPerTeam = getSeriesPlayersPerTeam(series);
  if (playersPerTeam) return `${playersPerTeam}-${language === "no" ? "manns" : "side"}`;

  return language === "no" ? "Klasse" : "Class";
}

function hasExplicitTournamentSeries(tournament) {
  return Array.isArray(tournament?.series) && tournament.series.length > 0;
}

function normalizeSeriesPublicStatus(series, tournament) {
  const rawStatus = String(series?.publicStatus || "").trim().toLowerCase();
  if (SERIES_PUBLIC_STATUSES.includes(rawStatus)) return rawStatus;
  return hasExplicitTournamentSeries(tournament) ? "hidden" : "live";
}

function normalizeTournamentSeriesItem(series, index, tournament, language = "en") {
  const explicitId = String(series?.id || "").trim();
  const name = String(series?.name || "").trim();
  const playersPerTeam =
    getSeriesPlayersPerTeam(series) || Number(tournament?.teamSize || 0) || "";
  const fallbackName =
    name ||
    (playersPerTeam
      ? `${playersPerTeam}-${language === "no" ? "manns" : "side"}`
      : language === "no"
        ? `Klasse ${index + 1}`
        : `Class ${index + 1}`);
  const id =
    explicitId ||
    `series-${slugifySeriesId(fallbackName, String(index + 1))}`;
  const totalTeams = Math.max(
    2,
    Number(series?.totalTeams || series?.maxTeams || tournament?.totalTeams || 10)
  );
  const groupCount = Math.max(
    1,
    Number(series?.groupCount || tournament?.groupCount || 2)
  );
  const teamsPerGroup = Math.max(
    1,
    Number(
      series?.teamsPerGroup ||
        tournament?.teamsPerGroup ||
        Math.ceil(totalTeams / groupCount)
    )
  );

  return {
    id,
    name: fallbackName,
    playersPerTeam,
    teamSize: playersPerTeam,
    format: series?.format || tournament?.format || "group-stage",
    totalTeams,
    maxTeams: series?.maxTeams || totalTeams,
    minimumTeams: series?.minimumTeams || "",
    groupCount,
    teamsPerGroup,
    qualifiersPerGroup: Math.max(
      1,
      Number(series?.qualifiersPerGroup || tournament?.qualifiersPerGroup || 2)
    ),
    groupMatchMinutes: Math.max(
      1,
      Number(series?.groupMatchMinutes || tournament?.groupMatchMinutes || 12)
    ),
    playoffMatchMinutes: Math.max(
      1,
      Number(series?.playoffMatchMinutes || tournament?.playoffMatchMinutes || 15)
    ),
    scheduleMode: series?.scheduleMode || "afterPrevious",
    manualOrder: Number.isFinite(Number(series?.manualOrder))
      ? Number(series.manualOrder)
      : index,
    groups: Array.isArray(series?.groups) ? series.groups : [],
    matches: Array.isArray(series?.matches) ? series.matches : [],
    standings: Array.isArray(series?.standings) ? series.standings : [],
    knockout: series?.knockout || {},
    publicStatus: normalizeSeriesPublicStatus(series, tournament),
    prizeText: series?.prizeText || "",
    feeText: series?.feeText || "",
    startTime: series?.startTime || tournament?.startTime || "",
    notes: series?.notes || "",
  };
}

function getTournamentSeriesClasses(tournament, language = "en") {
  const explicitSeries = Array.isArray(tournament?.series)
    ? tournament.series
    : [];

  if (explicitSeries.length > 0) {
    return explicitSeries.map((series, index) =>
      normalizeTournamentSeriesItem(series, index, tournament, language)
    );
  }

  const fallbackSeries = normalizeTournamentSeriesItem(
    {
      id: DEFAULT_TOURNAMENT_SERIES_ID,
      name:
        String(tournament?.className || "").trim() ||
        String(tournament?.seriesName || "").trim() ||
        "",
      playersPerTeam: tournament?.playersPerTeam || tournament?.teamSize || "",
      totalTeams: tournament?.totalTeams,
      groupCount: tournament?.groupCount,
      teamsPerGroup: tournament?.teamsPerGroup,
      qualifiersPerGroup: tournament?.qualifiersPerGroup,
      groupMatchMinutes: tournament?.groupMatchMinutes,
      playoffMatchMinutes: tournament?.playoffMatchMinutes,
      groups: Array.isArray(tournament?.groups) ? tournament.groups : [],
      matches: Array.isArray(tournament?.matches) ? tournament.matches : [],
      knockout: tournament?.knockout || {},
      publicStatus: tournament?.publicStatus,
    },
    0,
    tournament,
    language
  );

  return [
    {
      ...fallbackSeries,
      name:
        fallbackSeries.name === (language === "no" ? "Klasse 1" : "Class 1")
          ? language === "no"
            ? "Hovedklasse"
            : "Main class"
          : fallbackSeries.name,
      isDefaultSeries: true,
    },
  ];
}

function getOrderedTournamentSeriesClasses(tournament, language = "en") {
  const classes = getTournamentSeriesClasses(tournament, language);
  const mode = String(tournament?.seriesScheduleMode || "fourFirst");
  const withIndex = classes.map((series, index) => ({ series, index }));

  if (mode === "fourFirst" || mode === "fiveFirst") {
    const preferred = mode === "fourFirst" ? 4 : 5;
    const secondary = mode === "fourFirst" ? 5 : 4;
    return withIndex
      .sort((a, b) => {
        const aSize = Number(a.series.playersPerTeam || 0);
        const bSize = Number(b.series.playersPerTeam || 0);
        const aRank = aSize === preferred ? 0 : aSize === secondary ? 1 : 2;
        const bRank = bSize === preferred ? 0 : bSize === secondary ? 1 : 2;
        if (aRank !== bRank) return aRank - bRank;
        return a.index - b.index;
      })
      .map((item) => item.series);
  }

  if (mode === "manual") {
    return withIndex
      .sort((a, b) => {
        const orderDelta =
          Number(a.series.manualOrder || 0) - Number(b.series.manualOrder || 0);
        return orderDelta || a.index - b.index;
      })
      .map((item) => item.series);
  }

  return classes;
}

function getTournamentSeriesById(tournament, seriesId, language = "en") {
  const classes = getTournamentSeriesClasses(tournament, language);
  return (
    classes.find((series) => String(series.id) === String(seriesId)) ||
    classes[0] ||
    null
  );
}

function getSeriesMatchesFromTournament(tournament, series) {
  const rootMatches = Array.isArray(tournament?.matches) ? tournament.matches : [];
  if (!hasExplicitTournamentSeries(tournament) || series?.isDefaultSeries) {
    return rootMatches;
  }

  const filteredRootMatches = rootMatches.filter((match) => {
    const matchSeriesId = String(match.seriesId || "");
    if (matchSeriesId) return matchSeriesId === String(series?.id || "");
    return String(series?.id || "") === DEFAULT_TOURNAMENT_SERIES_ID;
  });
  return filteredRootMatches.length
    ? filteredRootMatches
    : Array.isArray(series?.matches)
      ? series.matches
      : [];
}

function getTournamentForSeries(tournament, series, language = "en") {
  const safeSeries = series || getTournamentSeriesById(tournament, "", language);
  if (!safeSeries) return tournament || {};
  const isDefault = safeSeries.isDefaultSeries || !hasExplicitTournamentSeries(tournament);

  return {
    ...(tournament || {}),
    format: safeSeries.format || tournament?.format || "group-stage",
    totalTeams: safeSeries.totalTeams || tournament?.totalTeams || 10,
    groupCount: safeSeries.groupCount || tournament?.groupCount || 2,
    teamsPerGroup: safeSeries.teamsPerGroup || tournament?.teamsPerGroup || 5,
    qualifiersPerGroup:
      safeSeries.qualifiersPerGroup || tournament?.qualifiersPerGroup || 2,
    groupMatchMinutes:
      safeSeries.groupMatchMinutes || tournament?.groupMatchMinutes || 12,
    playoffMatchMinutes:
      safeSeries.playoffMatchMinutes || tournament?.playoffMatchMinutes || 15,
    groups: Array.isArray(safeSeries.groups) && safeSeries.groups.length
      ? safeSeries.groups
      : isDefault
        ? Array.isArray(tournament?.groups)
          ? tournament.groups
          : []
        : [],
    matches: getSeriesMatchesFromTournament(tournament, safeSeries),
    knockout:
      safeSeries.knockout && Object.keys(safeSeries.knockout).length
        ? safeSeries.knockout
        : isDefault
          ? tournament?.knockout || {}
          : {},
    activeSeriesId: safeSeries.id,
    activeSeriesName: safeSeries.name,
    activeSeries: safeSeries,
  };
}

function syncTournamentSeriesFromRoot(tournament, language = "en") {
  if (!hasExplicitTournamentSeries(tournament)) return tournament;
  const classes = getTournamentSeriesClasses(tournament, language);
  const rootMatches = Array.isArray(tournament?.matches) ? tournament.matches : [];

  return {
    ...tournament,
    series: classes.map((series) => {
      const seriesMatches = rootMatches.filter((match) => {
        const matchSeriesId = String(match.seriesId || "");
        if (matchSeriesId) return matchSeriesId === String(series.id);
        return String(series.id) === DEFAULT_TOURNAMENT_SERIES_ID;
      });

      return {
        ...series,
        matches: seriesMatches.length
          ? seriesMatches
          : Array.isArray(series.matches)
            ? series.matches
            : [],
      };
    }),
  };
}

function parseTournamentDateValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  function buildLocalDate(year, month, day) {
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }

    return parsed;
  }

  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return buildLocalDate(
      Number(match[1]),
      Number(match[2]),
      Number(match[3])
    );
  }

  match = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (match) {
    return buildLocalDate(
      Number(match[3]),
      Number(match[2]),
      Number(match[1])
    );
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTournamentDateValue(tournament) {
  return parseTournamentDateValue(tournament?.startDate || tournament?.eventDate);
}

function isTournamentFinishedForFilter(tournament) {
  const parsed = parseTournamentDateValue(
    tournament?.endDate || tournament?.startDate || tournament?.eventDate
  );
  if (!parsed) return false;

  parsed.setHours(23, 59, 59, 999);
  return parsed.getTime() < Date.now();
}

function isTournamentLiveForFilter(tournament) {
  const status = String(tournament?.status || "")
    .trim()
    .toLowerCase();
  if (["live", "started", "in_progress", "in-progress"].includes(status)) {
    return true;
  }

  const startDate = parseTournamentDateValue(tournament?.startDate || tournament?.eventDate);
  if (!startDate) return false;

  const endDate =
    parseTournamentDateValue(tournament?.endDate) || new Date(startDate.getTime());
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const now = Date.now();
  return now >= startDate.getTime() && now <= endDate.getTime();
}

function isTruthyTournamentValue(value) {
  if (value === true || value === 1) return true;

  const normalized = String(value || "").trim().toLowerCase();
  return ["true", "1", "yes", "y"].includes(normalized);
}

function isTournamentPublished(tournament) {
  const status = String(tournament?.status || tournament?.Status || "")
    .trim()
    .toLowerCase();

  return Boolean(
    isTruthyTournamentValue(tournament?.published) ||
      isTruthyTournamentValue(tournament?.Published) ||
      status === "published"
  );
}

function hasTournamentRegistrationLink(tournament) {
  return Boolean(
    String(
      tournament?.registrationUrl ||
        tournament?.signupUrl ||
        tournament?.signUpUrl ||
        tournament?.registrationLink ||
        ""
    ).trim()
  );
}

function hasTournamentPublicLiveContent(tournament) {
  const hasMatches =
    Array.isArray(tournament?.matches) && tournament.matches.length > 0;
  const hasGroups =
    Array.isArray(tournament?.groups) &&
    tournament.groups.some((group) => {
      const slots = Array.isArray(group?.slots) ? group.slots : [];
      const teams = Array.isArray(group?.teams) ? group.teams : [];

      return (
        slots.some((slot) =>
          Boolean(
            String(slot?.name || slot?.teamName || slot?.teamId || "").trim()
          )
        ) || teams.length > 0
      );
    });
  const knockout = tournament?.knockout || {};
  const hasKnockout =
    Boolean(knockout.final || knockout.thirdPlace) ||
    ["quarterFinals", "semiFinals"].some(
      (key) => Array.isArray(knockout[key]) && knockout[key].length > 0
    );

  return hasMatches || hasGroups || hasKnockout;
}

function isTournamentPubliclyListed(tournament) {
  return Boolean(
    isTruthyTournamentValue(tournament?.publicListingEnabled) ||
      isTruthyTournamentValue(tournament?.listPublicly) ||
      isTruthyTournamentValue(tournament?.publicListed)
  );
}

function prepareTournamentForBackend(tournament, overrides = {}) {
  const now = new Date().toISOString();
  const prepared = syncTournamentSeriesFromRoot(
    applyTournamentDefaults({
      ...tournament,
      ...overrides,
      updatedAt: overrides.updatedAt || now,
    })
  );

  const tournamentId = getTournamentIdentity(prepared);
  if (!tournamentId) return prepared;

  return {
    ...prepared,
    id: tournamentId,
    tournamentId,
    TournamentId: tournamentId,
  };
}

function buildTournamentBackendPayload(tournament) {
  const safeTournament = applyTournamentDefaults(tournament);
  const tournamentId = getTournamentIdentity(safeTournament);
  const payloadTournament = {
    ...safeTournament,
    id: tournamentId,
    tournamentId,
    TournamentId: tournamentId,
  };
  const published = isTournamentPublished(safeTournament);
  const tournamentJson = JSON.stringify(payloadTournament);
  const publishedValue = published ? "TRUE" : "FALSE";

  return {
    tournament: payloadTournament,
    tournamentJson,
    TournamentJson: tournamentJson,
    tournamentId,
    TournamentId: tournamentId,
    id: tournamentId,
    name: safeTournament.name || "",
    Name: safeTournament.name || "",
    country: safeTournament.country || "",
    Country: safeTournament.country || "",
    city: safeTournament.city || "",
    City: safeTournament.city || "",
    startDate: safeTournament.startDate || "",
    StartDate: safeTournament.startDate || "",
    endDate: safeTournament.endDate || "",
    EndDate: safeTournament.endDate || "",
    registrationDeadline: safeTournament.registrationDeadline || "",
    RegistrationDeadline: safeTournament.registrationDeadline || "",
    visibility: safeTournament.visibility || "",
    Visibility: safeTournament.visibility || "",
    status: safeTournament.status || (published ? "published" : "draft"),
    Status: safeTournament.status || (published ? "published" : "draft"),
    publicCode: safeTournament.publicCode || "",
    PublicCode: safeTournament.publicCode || "",
    published,
    Published: publishedValue,
    publishedAt: safeTournament.publishedAt || "",
    PublishedAt: safeTournament.publishedAt || "",
    updatedAt: safeTournament.updatedAt || "",
    UpdatedAt: safeTournament.updatedAt || "",
  };
}

function markTournamentBackendSynced(tournament) {
  if (!tournament) return null;

  return applyTournamentDefaults({
    ...tournament,
    backendSyncedAt: new Date().toISOString(),
  });
}

function markTournamentPublicVerified(tournament) {
  if (!tournament) return null;

  const verifiedAt = new Date().toISOString();
  return applyTournamentDefaults({
    ...tournament,
    backendSyncedAt: tournament.backendSyncedAt || verifiedAt,
    publicVerifiedAt: verifiedAt,
  });
}

function hasTournamentBackendPublicSync(tournament) {
  return Boolean(
    isTournamentPublished(tournament) &&
      tournament?.publicCode &&
      tournament.publicVerifiedAt
  );
}

function mergeTournamentServerFields(currentTournament, backendTournament) {
  if (!backendTournament) return applyTournamentDefaults(currentTournament || {});
  if (!currentTournament) return applyTournamentDefaults(backendTournament);

  const safeServerFields = {};
  TOURNAMENT_SERVER_SAFE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(backendTournament, field)) {
      safeServerFields[field] = backendTournament[field];
    }
  });

  return applyTournamentDefaults({
    ...currentTournament,
    ...safeServerFields,
  });
}

function shouldShowTournamentRoundLabels(tournament) {
  const displaySettings = tournament?.displaySettings || {};

  return Boolean(
    displaySettings.showRoundLabels || displaySettings.showRoundNumbers
  );
}

function getTournamentGroupCode(index) {
  return String.fromCharCode(65 + index);
}

function getTournamentGroupColor(groupCodeOrIndex) {
  const raw = String(groupCodeOrIndex ?? "A").trim().toUpperCase();
  const index = Number.isFinite(Number(groupCodeOrIndex))
    ? Number(groupCodeOrIndex)
    : Math.max(0, raw.charCodeAt(0) - 65);

  return TOURNAMENT_GROUP_COLORS[
    ((index % TOURNAMENT_GROUP_COLORS.length) +
      TOURNAMENT_GROUP_COLORS.length) %
      TOURNAMENT_GROUP_COLORS.length
  ];
}

function getTournamentSourceGroupCode(source) {
  const match = String(source || "").trim().match(/^([A-Z])\d+$/);
  return match ? match[1] : "";
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
  const [currentSearch, setCurrentSearch] = useState(() =>
    typeof window === "undefined" ? "" : window.location.search
  );
  const publicTournamentCode = useMemo(() => {
    if (!currentSearch) return "";
    return new URLSearchParams(currentSearch).get("publicTournament") || "";
  }, [currentSearch]);

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
    loginRequired: "Logg inn for å administrere turneringer",
    createTitle: "Opprett turnering",
    createSubtitle: "Opprett en ny turnering",
    newTournament: "Ny turnering",
    namePlaceholder: "Turneringsnavn",
    rulesPlaceholder: "Regler, notater eller ekstra info",
    moreDetails: "Flere detaljer",
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
    actionsLabel: "Valg",
    optionsLabel: "Alternativer",
    moveLabel: "Flytt",
    moveSwap: "Flytt / bytt",
    moveModeMessage: "Flyttemodus: velg en annen kamp eller ledig plass.",
    selectedLabel: "Valgt",
    swapHere: "Bytt hit",
    insertHere: "Sett inn her",
    placeHere: "Plasser her",
    selectTargetSlot: "Velg målplass",
    targetSelected: "Mål valgt",
    matchMoved: "Kamp flyttet",
    matchesSwapped: "Kamper byttet",
    cancelMove: "Avbryt flytting",
    insertPush: "Sett inn / skyv kampoppsett",
    pushEntireRound: "Skyv hele runden",
    courtUnavailable: "Bane utilgjengelig",
    courtBlocked: "Bane blokkert",
    blockCourt: "Blokker bane",
    blockModeLabel: "Type blokkering",
    temporaryDelay: "Midlertidig forsinkelse",
    courtUnavailableRestOfDay: "Bane ute resten av dagen",
    removeBlock: "Fjern blokkering",
    affectedMatchesLabel: "berørte kamper",
    unplacedMatches: "Kamper som må plasseres",
    selectLabel: "Velg",
    autoMoveToFreeCourts: "Auto flytt til ledige baner",
    fromTimeLabel: "Fra",
    toTimeLabel: "Til",
    reasonLabel: "Årsak",
    moveAffectedMatches: "Flytt berørte kamper til ledige baner",
    pushLaterSameCourt: "Skyv senere på samme bane",
    placeManually: "La meg plassere manuelt",
    needsReschedule: "Må flyttes",
    confirmPushResultMatches:
      "Dette flytter kamper som er startet eller ferdige. Fortsette?",
    moveEarlier: "Flytt tidligere",
    moveLater: "Flytt senere",
    moveCourtLeft: "Flytt bane venstre",
    moveCourtRight: "Flytt bane høyre",
    swapMatch: "Bytt kamp",
    selectAnotherMatchToSwap: "Velg en annen kamp å bytte med",
    cancelSwap: "Avbryt",
    structureLabel: "Struktur",
    classesLabel: "Klasser",
    classNameLabel: "Klassenavn",
    playersPerTeamLabel: "Spillere per lag",
    allClassesLabel: "Alle klasser",
    addClass: "Legg til klasse",
    addFourManns: "Legg til 4-manns",
    addFiveManns: "Legg til 5-manns",
    scheduleOrderLabel: "Kampoppsett-rekkefølge",
    scheduleFourFirst: "4-manns først, så 5-manns",
    scheduleFiveFirst: "5-manns først, så 4-manns",
    scheduleManualOrder: "Manuell rekkefølge",
    scheduleAllowOverlap: "Tillat overlapp på ledige baner",
    classVisibilityTitle: "Klassevisning",
    classVisibilityHint: "Velg hvilke klasser publikum skal se i live-visningen.",
    classStatusHidden: "Skjult",
    classStatusLive: "Live",
    classStatusCompleted: "Ferdig",
    startClassLive: "Start live",
    markClassFinished: "Marker ferdig",
    classFinishedSuffix: "ferdig",
    classLiveSuffix: "live",
    classLiveNowSuffix: "er live nå",
    noClassLiveYet: "Ingen klasse er live ennå.",
    timingLabel: "Tid",
    walkover: "Walkover",
    noShow: "Ikke møtt",
    markWalkover: "Marker walkover",
    winnerLabelShort: "Vinner",
    reasonNote: "Årsak / notat",
    clearResult: "Fjern resultat",
    publicDesign: "Offentlig design",
    liveViewDesign: "Design for live-visning",
    resetTheme: "Tilbakestill tema",
    usePreset: "Bruk tema",
    themePresetLabel: "Tema",
    pageBackground: "Sidebakgrunn",
    cardPanel: "Kort/panel",
    primaryColor: "Hovedfarge",
    accentColor: "Aksentfarge",
    textColor: "Tekstfarge",
    liveLogoUrlLabel: "Logo bilde-URL",
    liveBackgroundUrlLabel: "Bakgrunnsbilde-URL",
    invalidColor: "Ugyldig farge",
    preview: "Forhåndsvisning",
    publish: "Publiser",
    unpublish: "Avpubliser",
    published: "Publisert",
    unpublished: "Upublisert",
    publishedOk: "Turnering publisert.",
    unpublishedOk: "Turnering avpublisert.",
    deleteLabel: "Slett",
    deleteTournament: "Slett turnering",
    confirmDeleteTournament: "Slette denne turneringen? Dette kan ikke angres.",
    tournamentDeleted: "Turnering slettet.",
    deleteTournamentFailed: "Sletting mislyktes.",
    tournamentDeletePublishedWarning:
      "Publiserte turneringer må avpubliseres før de kan slettes.",
    cleanupDraftTournaments: "Rydd mine draft/upubliserte testturneringer",
    confirmCleanupDraftTournaments:
      "Rydde mine draft/upubliserte testturneringer? Publiserte turneringer slettes ikke.",
    cleanupDraftTournamentsOk: "Ryddet testturneringer.",
    cleanupDraftTournamentsFailed: "Opprydding mislyktes.",
    publicPreviewTitle: "Offentlig live-visning",
    publicPreviewSubtitle: "Live-visning for publikum",
    publicLinkUnavailable:
      "Publiser turneringen for å gjøre den offentlige lenken klar.",
    localPublicPreviewLink: "Offentlig turneringslenke",
    localPreviewLimit:
      "Offentlig lenke er live og kan åpnes fra en annen enhet etter publisering.",
    publicLinkReadonly: "Offentlig live-visning",
    copyLink: "Kopier lenke",
    openPublicPreview: "Åpne offentlig visning",
    copyLiveLink: "Kopier live-lenke",
    openLivePreview: "Åpne live-forhåndsvisning",
    publishLiveView: "Publiser live-visning",
    unpublishLiveView: "Avpubliser live-visning",
    publicLinkTitle: "Live publikumsvisning",
    publicLinkActive: "Offentlig live-lenke aktiv",
    publicLinkShareHelper:
      "Del denne lenken når lag, kamper og resultater skal være synlige for publikum.",
    publicLinkPublishHelper:
      "Publiser når lag, kamper og resultater skal være synlige for publikum.",
    publicLinkCopied: "Offentlig lenke kopiert.",
    publicLinkCopyFailed: "Kunne ikke kopiere lenken.",
    publicNotFound: "Turnering ikke funnet eller ikke publisert.",
    openApp: "Åpne app",
    loadingTournament: "Laster turnering...",
    tournamentSyncLoading: "Laster turneringer",
    tournamentSyncSaving: "Lagrer",
    tournamentSyncSaved: "Lagret",
    tournamentSyncError: "Backend-feil",
    tournamentSyncLocal: "Lokal cache",
    tournamentBackendTodo:
      "Backend-handlinger for turneringer mangler i Apps Script.",
    tournamentPublishVerifyFailed:
      "Backend-publisering kunne ikke bekreftes. Den offentlige turneringen ble ikke funnet etter publisering.",
    backendPublicLinkReady:
      "Offentlig lenke er live og kan åpnes fra en annen enhet.",
    backendPublicLinkPending:
      "Offentlig lenke vises når backend-publisering er bekreftet.",
    backendPublicRequired:
      "Publiser turneringen for å aktivere en offentlig lenke som virker på andre enheter.",
    publicTournamentLink: "Offentlig turneringslenke",
    noTeamsInPreview: "Ingen lag publisert ennå.",
    noPlayersInPreview: "Ingen spillere ennå.",
    generateBasicMatches: "Generer enkle kamper",
    matchesTitle: "Kamper",
    notEnoughTeamsForMatches: "Minst 2 lag kreves for å generere kamper.",
    matchesGenerated: "Kamper generert.",
    noMatchesYet: "Ingen kamper ennå.",
    standingsTitle: "Resultater",
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
    matchStatusStarted: "Pågår",
    completeMatch: "Ferdig",
    markFinished: "Ferdig",
    knockoutNeedsWinner: "Må ha vinner",
    overviewTab: "Oversikt",
    groupsTab: "Grupper",
    bracketTab: "Sluttspill",
    tableTab: "Tabell",
    sharingTab: "Deling",
    controlPanelLabel: "Kontrollpanel",
    tournamentSetupTitle: "Turneringsoppsett",
    newLabel: "Ny",
    editTournamentTitle: "Rediger turnering",
    totalTeamsLabel: "Totalt antall lag",
    teamsPerGroupLabel: "Lag per gruppe",
    qualifiersLabel: "Kvalifiserte",
    startTimeLabel: "Starttid",
    groupMinutesLabel: "Gruppe min",
    playoffMinutesLabel: "Sluttspill min",
    breakMinutesLabel: "Pause min",
    buildGroupSlots: "Bygg gruppesloter",
    buildUpdateSlots: "Bygg klasseplasser",
    manualGroupEntryTitle: "Manuell gruppeinndata",
    manualGroupEntryHint: "Fyll slotene i samme rekkefølge som papirtrekket.",
    groupDrawTitle: "Gruppetrekning",
    teamsGroupsTitle: "Lag / grupper",
    manualPaperOrderLabel: "Manuell papirrekkefølge",
    teamNamePlaceholder: "Lagnavn",
    playerNamePlaceholder: "Spillernavn",
    enterTeamNamePlaceholder: "Skriv lagnavn",
    buildSlotsToEdit: "Bygg sloter for å redigere",
    previewLabel: "Forhåndsvisning",
    matchManagementLabel: "Kampstyring",
    slotsLabel: "sloter",
    manualDrawLabel: "Manuell trekning",
    emptySlotLabel: "Tom",
    hideSetup: "Skjul oppsett",
    editSetup: "Rediger oppsett",
    knockoutLabel: "Sluttspill",
    topQualifiersLabel: "Topp 2",
    nextLabel: "Neste",
    nextMatchesTitle: "Neste 3 kamper",
    firstKnockoutLabel: "Første utslag",
    matchLabel: "Kamp",
    openRegistration: "Åpne registrering",
    closeRegistration: "Lukk registrering",
    registrationTitle: "Registrering",
    clubPlaceholder: "Klubb",
    lockedLabel: "Låst",
    openLabel: "Åpen",
    roundLabel: "Runde",
    batchLabel: "Runde",
    batchesLabel: "runder",
    courtLabel: "Bane",
    courtsLabel: "Baner",
    groupLabel: "Gruppe",
    groupsLabel: "grupper",
    teamLabel: "Lag",
    teamsLabel: "Lag",
    openCourt: "Ledig bane",
    breakLabel: "Pause",
    scheduledLabel: "Planlagt",
    standingsLabel: "Resultater",
    moreBatchesLabel: "flere runder",
    scheduleTitle: "Kampoppsett",
    scheduleSubtitle: "Basert på starttid, baner, kamplengde og pauser.",
    scheduleOverviewTitle: "Runder, baner og tidspunkter",
    scheduleTimeColumn: "Tid",
    minutesShort: "min",
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
    showRoundTitles: "Vis rundenummer",
    showRoundLabels: "Vis rundenummer",
    vsLabel: "vs",
    teamManagementTitle: "Lagadministrasjon",
    addTeamButton: "Legg til lag",
    addPlayerButton: "Legg til spiller",
    noTeamsYet: "Ingen lag ennå.",
    noPlayersYet: "Ingen spillere ennå.",
    promotionTab: "Promotering",
    marketingTitle: "Kommende-kort",
    marketingSubtitle:
      "Styr hvordan turneringen vises på den offentlige kommende-siden.",
    themePresetsLabel: "Temaer",
    colorsLabel: "Farger",
    cardContentLabel: "Kortinnhold",
    mediaLabel: "Media",
    contactRegistrationLabel: "Kontakt / påmelding",
    optionalFoodInfoLabel: "Valgfri mat/info",
    listPublicLabel: "Vis på kommende-side",
    publishPromotion: "Vis på kommende-side",
    hidePromotion: "Skjul fra kommende-side",
    promotionVisibleBadge: "Synlig på kommende-side",
    promotionHiddenBadge: "Skjult fra kommende",
    promotionVerifyingBadge: "Verifiserer...",
    promotionErrorBadge: "Backend-sjekk feilet",
    showOnUpcomingPage: "Vis på kommende-side",
    visibleOnUpcomingPage: "Synlig på kommende-side",
    publishingPromotion: "Publiserer...",
    promotionDirectLinkOnly:
      "Offentlig live-lenke er aktiv, men promotering er ikke synlig på kommende-side.",
    promotionPublishedOk: "Promotering er synlig på kommende-side.",
    promotionHiddenOk: "Promotering skjult fra kommende-side.",
    promotionPublishVerifyFailed:
      "Promotering ble lagret, men vises ikke på kommende-siden ennå. Sjekk backend listPublicTournaments.",
    promotionHideVerifyFailed:
      "Promotering ble skjult, men vises fortsatt på kommende-siden. Sjekk backend listPublicTournaments.",
    promotionPreviewTitle: "Forhåndsvisning",
    publicTitleLabel: "Offentlig tittel",
    publicSummaryLabel: "Kort beskrivelse",
    organizerDisplayNameLabel: "Arrang\u00f8rnavn som vises offentlig",
    optionalPlaceholder: "Valgfritt",
    countryLabel: "Land",
    cityLabel: "By",
    venueLabel: "Hall / sted",
    addressLabel: "Adresse",
    dateLabel: "Dato",
    endDateLabel: "Sluttdato",
    contactNameLabel: "Kontaktperson",
    contactPhoneLabel: "Telefon",
    contactEmailLabel: "E-post",
    prizeLabel: "Premie",
    feeLabel: "Påmeldingsavgift",
    foodLabel: "Mat / frokost / soddu",
    breakfastLabel: "Frokost",
    breakBallLabel: "Pauseball",
    sodduLabel: "Soddu",
    posterImageUrlLabel: "Poster bilde-URL",
    publicLogoUrlLabel: "Logo/bilde-URL",
    publicCardBackgroundUrlLabel: "Bakgrunnsbilde for kort",
    themeColorLabel: "Temafarge",
    accentColorLabel: "Aksentfarge",
    maxTeamsLabel: "Maks lag",
    seriesLabel: "Serier",
    addSeries: "Legg til serie",
    removeSeries: "Fjern",
    seriesNameLabel: "Serienavn",
    teamSizeLabel: "Lagstørrelse",
    minimumTeamsLabel: "Minimum lag",
    notesLabel: "Notater",
    upcomingTournamentsTitle: "Kommende volleyballturneringer",
    upcomingTournamentsSubtitle:
      "Finn publiserte turneringer og åpne kampoppsett når arrangøren publiserer.",
    allCountries: "Alle land",
    norway: "Norge",
    denmark: "Danmark",
    allTypes: "Alle typer",
    fourSide: "4-side",
    fiveSide: "5-side",
    upcomingLabel: "Kommende",
    finishedLabel: "Ferdige",
    openTournament: "Se turnering",
    followLive: "Følg live",
    viewTournamentDetails: "Se turnering",
    registerTeam: "Meld på lag",
    noPublicTournaments: "Ingen publiserte turneringer ennå.",
    loadingPublicTournaments: "Laster kommende turneringer...",
    publicListingError: "Kunne ikke laste offentlige turneringer.",
    organizerLabel: "Arrangør",
    registrationDeadlineLabel: "Påmeldingsfrist",
    registrationUrlLabel: "Påmeldingslenke",
    contactLabel: "Kontakt",
    locationLabel: "Sted",
    bothSeriesLabel: "4-side og 5-side"
  } : {
    tabTitle: "Tournaments",
    loginRequired: "Sign in to manage tournaments",
    createTitle: "Create Tournament",
    createSubtitle: "Create a new tournament",
    newTournament: "New Tournament",
    namePlaceholder: "Tournament name",
    rulesPlaceholder: "Rules, notes or extra information",
    moreDetails: "More details",
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
    actionsLabel: "Actions",
    optionsLabel: "Options",
    moveLabel: "Move",
    moveSwap: "Move / swap",
    moveModeMessage: "Move mode: select another match or empty slot.",
    selectedLabel: "Selected",
    swapHere: "Swap here",
    insertHere: "Insert here",
    placeHere: "Place here",
    selectTargetSlot: "Select target slot",
    targetSelected: "Target selected",
    matchMoved: "Match moved",
    matchesSwapped: "Matches swapped",
    cancelMove: "Cancel move",
    insertPush: "Insert here / push schedule",
    pushEntireRound: "Push entire round",
    courtUnavailable: "Court unavailable",
    courtBlocked: "Court blocked",
    blockCourt: "Block court",
    blockModeLabel: "Block type",
    temporaryDelay: "Temporary delay",
    courtUnavailableRestOfDay: "Court unavailable rest of day",
    removeBlock: "Remove block",
    affectedMatchesLabel: "affected matches",
    unplacedMatches: "Unplaced matches",
    selectLabel: "Select",
    autoMoveToFreeCourts: "Auto move to free courts",
    fromTimeLabel: "From",
    toTimeLabel: "To",
    reasonLabel: "Reason",
    moveAffectedMatches: "Move affected matches to free courts",
    pushLaterSameCourt: "Push later on same court",
    placeManually: "Let me place manually",
    needsReschedule: "Needs reschedule",
    confirmPushResultMatches:
      "This moves started or completed matches. Continue?",
    moveEarlier: "Move earlier",
    moveLater: "Move later",
    moveCourtLeft: "Move court left",
    moveCourtRight: "Move court right",
    swapMatch: "Swap match",
    selectAnotherMatchToSwap: "Select another match to swap",
    cancelSwap: "Cancel",
    structureLabel: "Structure",
    classesLabel: "Classes",
    classNameLabel: "Class name",
    playersPerTeamLabel: "Players per team",
    allClassesLabel: "All classes",
    addClass: "Add class",
    addFourManns: "Add 4-manns",
    addFiveManns: "Add 5-manns",
    scheduleOrderLabel: "Schedule order",
    scheduleFourFirst: "4-manns first, then 5-manns",
    scheduleFiveFirst: "5-manns first, then 4-manns",
    scheduleManualOrder: "Manual order",
    scheduleAllowOverlap: "Allow overlap on free courts",
    classVisibilityTitle: "Class visibility",
    classVisibilityHint: "Choose which classes spectators can see on the live page.",
    classStatusHidden: "Hidden",
    classStatusLive: "Live",
    classStatusCompleted: "Completed",
    startClassLive: "Start live",
    markClassFinished: "Mark finished",
    classFinishedSuffix: "finished",
    classLiveSuffix: "live",
    classLiveNowSuffix: "live now",
    noClassLiveYet: "No class is live yet.",
    timingLabel: "Timing",
    walkover: "Walkover",
    noShow: "No-show",
    markWalkover: "Mark walkover",
    winnerLabelShort: "Winner",
    reasonNote: "Reason / note",
    clearResult: "Clear result",
    publicDesign: "Public design",
    liveViewDesign: "Live view design",
    resetTheme: "Reset theme",
    usePreset: "Use preset",
    themePresetLabel: "Theme preset",
    pageBackground: "Page background",
    cardPanel: "Card/panel",
    primaryColor: "Primary",
    accentColor: "Accent",
    textColor: "Text",
    liveLogoUrlLabel: "Logo image URL",
    liveBackgroundUrlLabel: "Background image URL",
    invalidColor: "Invalid color",
    preview: "Preview",
    publish: "Publish",
    unpublish: "Unpublish",
    published: "Published",
    unpublished: "Unpublished",
    publishedOk: "Tournament published.",
    unpublishedOk: "Tournament unpublished.",
    deleteLabel: "Delete",
    deleteTournament: "Delete tournament",
    confirmDeleteTournament: "Delete this tournament? This cannot be undone.",
    tournamentDeleted: "Tournament deleted.",
    deleteTournamentFailed: "Delete failed.",
    tournamentDeletePublishedWarning:
      "Published tournaments must be unpublished before deletion.",
    cleanupDraftTournaments: "Clean my draft/unpublished test tournaments",
    confirmCleanupDraftTournaments:
      "Clean my draft/unpublished test tournaments? Published tournaments will not be deleted.",
    cleanupDraftTournamentsOk: "Test tournaments cleaned.",
    cleanupDraftTournamentsFailed: "Cleanup failed.",
    publicPreviewTitle: "Public live view",
    publicPreviewSubtitle: "Live spectator view",
    publicLinkUnavailable:
      "Publish this tournament to make the public link available.",
    localPublicPreviewLink: "Public tournament link",
    localPreviewLimit:
      "Public link is live and can be opened from another device after publishing.",
    publicLinkReadonly: "Public live view",
    copyLink: "Copy link",
    openPublicPreview: "Open public preview",
    copyLiveLink: "Copy live link",
    openLivePreview: "Open live preview",
    publishLiveView: "Publish live view",
    unpublishLiveView: "Unpublish live view",
    publicLinkTitle: "Live public view",
    publicLinkActive: "Public live link active",
    publicLinkShareHelper:
      "Share this link when teams, matches and scores should be visible to spectators.",
    publicLinkPublishHelper:
      "Publish when teams, matches and scores should be visible to spectators.",
    publicLinkCopied: "Public link copied.",
    publicLinkCopyFailed: "Could not copy the public link.",
    publicNotFound: "Tournament not found or not published.",
    openApp: "Open app",
    loadingTournament: "Loading tournament...",
    tournamentSyncLoading: "Loading tournaments",
    tournamentSyncSaving: "Saving",
    tournamentSyncSaved: "Saved",
    tournamentSyncError: "Backend error",
    tournamentSyncLocal: "Local cache",
    tournamentBackendTodo:
      "Tournament backend actions are missing in Apps Script.",
    tournamentPublishVerifyFailed:
      "Backend publish verification failed. The public tournament was not found after publishing.",
    backendPublicLinkReady:
      "Public link is live and can be opened from another device.",
    backendPublicLinkPending:
      "Public link appears after backend publishing is verified.",
    backendPublicRequired:
      "Publish this tournament to activate a public link that works on other devices.",
    publicTournamentLink: "Public tournament link",
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
    pointsShort: "PTS",
    scoreForShort: "SF",
    scoreAgainstShort: "SA",
    scoreDiffShort: "GD",
    noStandingsYet: "No standings yet.",
    matchStatusCompleted: "Completed",
    matchStatusScheduled: "Scheduled",
    matchStatusStarted: "Started",
    completeMatch: "Complete",
    markFinished: "Mark finished",
    knockoutNeedsWinner: "Needs winner",
    overviewTab: "Overview",
    groupsTab: "Groups",
    bracketTab: "Bracket",
    tableTab: "Table",
    sharingTab: "Sharing",
    controlPanelLabel: "Control Panel",
    tournamentSetupTitle: "Tournament Setup",
    newLabel: "New",
    editTournamentTitle: "Edit tournament",
    totalTeamsLabel: "Total Teams",
    teamsPerGroupLabel: "Teams per Group",
    qualifiersLabel: "Qualifiers",
    startTimeLabel: "Start Time",
    groupMinutesLabel: "Group Min",
    playoffMinutesLabel: "Playoff Min",
    breakMinutesLabel: "Break Min",
    buildGroupSlots: "Build Group Slots",
    buildUpdateSlots: "Build class slots",
    manualGroupEntryTitle: "Manual Group Entry",
    manualGroupEntryHint: "Fill slots in the exact paper-draw order.",
    groupDrawTitle: "Group draw",
    teamsGroupsTitle: "Teams / groups",
    manualPaperOrderLabel: "Manual paper-draw order",
    teamNamePlaceholder: "Team name",
    playerNamePlaceholder: "Player name",
    enterTeamNamePlaceholder: "Enter team name",
    buildSlotsToEdit: "Build slots to edit",
    previewLabel: "Preview",
    matchManagementLabel: "Match Management",
    slotsLabel: "slots",
    manualDrawLabel: "Manual draw",
    emptySlotLabel: "Empty",
    hideSetup: "Hide setup",
    editSetup: "Edit setup",
    knockoutLabel: "Knockout",
    topQualifiersLabel: "Top 2",
    nextLabel: "Next",
    nextMatchesTitle: "Next 3 matches",
    firstKnockoutLabel: "First Knockout",
    matchLabel: "Match",
    openRegistration: "Open registration",
    closeRegistration: "Close registration",
    registrationTitle: "Registration",
    clubPlaceholder: "Club",
    lockedLabel: "Locked",
    openLabel: "Open",
    roundLabel: "Round",
    batchLabel: "Round",
    batchesLabel: "rounds",
    courtLabel: "Court",
    courtsLabel: "Courts",
    groupLabel: "Group",
    groupsLabel: "groups",
    teamLabel: "Team",
    teamsLabel: "Teams",
    openCourt: "Open court",
    breakLabel: "Break",
    scheduledLabel: "Scheduled",
    standingsLabel: "Standings",
    moreBatchesLabel: "more batches",
    scheduleTitle: "Schedule",
    scheduleSubtitle: "Based on start time, courts, match duration and breaks.",
    scheduleOverviewTitle: "Rounds, courts and times",
    scheduleTimeColumn: "Time",
    minutesShort: "min",
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
    showRoundTitles: "Show round labels",
    showRoundLabels: "Show round labels",
    vsLabel: "vs",
    teamManagementTitle: "Team Management",
    addTeamButton: "Add team",
    addPlayerButton: "Add player",
    noTeamsYet: "No teams yet.",
    noPlayersYet: "No players yet.",
    promotionTab: "Promotion",
    marketingTitle: "Upcoming card",
    marketingSubtitle: "Manage how this tournament appears on the upcoming page.",
    themePresetsLabel: "Theme presets",
    colorsLabel: "Colors",
    cardContentLabel: "Card content",
    mediaLabel: "Media",
    contactRegistrationLabel: "Contact / registration",
    optionalFoodInfoLabel: "Optional food/info",
    listPublicLabel: "Show on upcoming page",
    publishPromotion: "Show on upcoming page",
    hidePromotion: "Hide from upcoming page",
    promotionVisibleBadge: "Visible on upcoming page",
    promotionHiddenBadge: "Hidden from upcoming",
    promotionVerifyingBadge: "Verifying...",
    promotionErrorBadge: "Backend check failed",
    showOnUpcomingPage: "Show on upcoming page",
    visibleOnUpcomingPage: "Visible on upcoming page",
    publishingPromotion: "Publishing...",
    promotionDirectLinkOnly:
      "Public live link is active, but promotion is not visible on the upcoming page.",
    promotionPublishedOk: "Promotion is visible on the upcoming page.",
    promotionHiddenOk: "Promotion hidden from the upcoming page.",
    promotionPublishVerifyFailed:
      "Promotion was saved, but is not visible on the upcoming page yet. Check backend listPublicTournaments.",
    promotionHideVerifyFailed:
      "Promotion was hidden, but still appears on the upcoming page. Check backend listPublicTournaments.",
    promotionPreviewTitle: "Preview",
    publicTitleLabel: "Public title",
    publicSummaryLabel: "Short description",
    organizerDisplayNameLabel: "Organizer display name",
    optionalPlaceholder: "Optional",
    countryLabel: "Country",
    cityLabel: "City",
    venueLabel: "Venue / hall",
    addressLabel: "Address",
    dateLabel: "Date",
    endDateLabel: "End date",
    contactNameLabel: "Contact name",
    contactPhoneLabel: "Contact phone",
    contactEmailLabel: "Contact email",
    prizeLabel: "Prize",
    feeLabel: "Registration fee",
    foodLabel: "Food / breakfast / soddu",
    breakfastLabel: "Breakfast",
    breakBallLabel: "Break-ball",
    sodduLabel: "Soddu",
    posterImageUrlLabel: "Poster image URL",
    publicLogoUrlLabel: "Logo image URL",
    publicCardBackgroundUrlLabel: "Card background image URL",
    themeColorLabel: "Theme color",
    accentColorLabel: "Accent color",
    maxTeamsLabel: "Max teams",
    seriesLabel: "Series",
    addSeries: "Add series",
    removeSeries: "Remove",
    seriesNameLabel: "Series name",
    teamSizeLabel: "Team size",
    minimumTeamsLabel: "Minimum teams",
    notesLabel: "Notes",
    upcomingTournamentsTitle: "Upcoming volleyball tournaments",
    upcomingTournamentsSubtitle:
      "Find published tournaments and open schedules when organizers publish them.",
    allCountries: "All countries",
    norway: "Norway",
    denmark: "Denmark",
    allTypes: "All types",
    fourSide: "4-side",
    fiveSide: "5-side",
    upcomingLabel: "Upcoming",
    finishedLabel: "Finished",
    openTournament: "View details",
    followLive: "Follow live",
    viewTournamentDetails: "View details",
    registerTeam: "Register team",
    noPublicTournaments: "No published tournaments yet.",
    loadingPublicTournaments: "Loading upcoming tournaments...",
    publicListingError: "Could not load public tournaments.",
    organizerLabel: "Organizer",
    registrationDeadlineLabel: "Registration deadline",
    registrationUrlLabel: "Registration URL",
    contactLabel: "Contact",
    locationLabel: "Location",
    bothSeriesLabel: "4-side and 5-side"
  };

  const [newPlayerClubOption, setNewPlayerClubOption] = useState("");
  const [newPlayerClubCustom, setNewPlayerClubCustom] = useState("");
  const [editClubOption, setEditClubOption] = useState("");
  const [editClubCustom, setEditClubCustom] = useState("");

  const [tournaments, setTournaments] = useState([]);
  const [activeTournamentId, setActiveTournamentId] = useState("");
  const [tournamentSyncStatus, setTournamentSyncStatus] = useState("local");
  const [tournamentSyncMessage, setTournamentSyncMessage] = useState("");
  const [tournamentBackendReady, setTournamentBackendReady] = useState(false);
  const [publicTournamentBackend, setPublicTournamentBackend] = useState(null);
  const [publicTournamentLoadStatus, setPublicTournamentLoadStatus] =
    useState("idle");
  const [publicTournaments, setPublicTournaments] = useState([]);
  const [publicTournamentsStatus, setPublicTournamentsStatus] =
    useState("idle");
  const [publicTournamentsMessage, setPublicTournamentsMessage] = useState("");
  const [publicTournamentCountryFilter, setPublicTournamentCountryFilter] =
    useState("all");
  const [publicTournamentTypeFilter, setPublicTournamentTypeFilter] =
    useState("all");
  const [publicTournamentTimeFilter, setPublicTournamentTimeFilter] =
    useState("upcoming");
  const [showCreateTournamentForm, setShowCreateTournamentForm] =
    useState(false);
  const [showTournamentSetupPanel, setShowTournamentSetupPanel] = useState(true);
  const [showTournamentRegistration, setShowTournamentRegistration] =
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
  const [activeTournamentSeriesFilter, setActiveTournamentSeriesFilter] =
    useState("all");
  const [activeTournamentSetupSeriesId, setActiveTournamentSetupSeriesId] =
    useState("");
  const [matchFinishWarnings, setMatchFinishWarnings] = useState({});
  const tournamentAutosaveTimerRef = useRef(null);
  const manualGroupEditingRef = useRef(false);
  const manualGroupEditingTimerRef = useRef(null);
  const tournamentSessionUsernameRef = useRef("");
  const lastTournamentBackendJsonRef = useRef("[]");
  const deletedTournamentIdsRef = useRef(new Set());
  const [activeScheduleEditMatchId, setActiveScheduleEditMatchId] = useState("");
  const [selectedMoveMatchId, setSelectedMoveMatchId] = useState("");
  const [pendingScheduleMoveMode, setPendingScheduleMoveMode] = useState("swap");
  const [walkoverDraft, setWalkoverDraft] = useState({
    matchId: "",
    resultType: "walkover",
    note: "",
  });
  const [courtBlockDraft, setCourtBlockDraft] = useState({
    court: 1,
    startTime: "09:00",
    endTime: "09:15",
    reason: "",
    mode: "delay",
  });
  const [publicThemeColorErrors, setPublicThemeColorErrors] = useState({});
  const [publicLiveThemeColorErrors, setPublicLiveThemeColorErrors] =
    useState({});
  const [promotionVisibilityAction, setPromotionVisibilityAction] =
    useState("idle");
  const [promotionVisibilityError, setPromotionVisibilityError] = useState("");

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

  function normalizeTournamentApiList(data) {
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.tournaments)
        ? data.tournaments
        : [];

    return dedupeTournamentsById(
      list
        .filter(Boolean)
        .map((tournament) =>
          markTournamentBackendSynced(applyTournamentDefaults(tournament))
        )
    );
  }

  function normalizeTournamentApiItem(data) {
    if (!data) return null;

    if (data && Object.prototype.hasOwnProperty.call(data, "tournament")) {
      const tournament = data.tournament;
      if (!tournament || Array.isArray(tournament)) return null;
      return markTournamentBackendSynced(applyTournamentDefaults(tournament));
    }

    if (data && Object.prototype.hasOwnProperty.call(data, "data")) {
      const tournament = data.data;
      if (!tournament || Array.isArray(tournament)) return null;
      return markTournamentBackendSynced(applyTournamentDefaults(tournament));
    }

    if (Array.isArray(data)) return null;
    return markTournamentBackendSynced(applyTournamentDefaults(data));
  }

  const mergeTournamentFromBackend = useCallback((tournament) => {
    const tournamentId = getTournamentIdentity(tournament);
    if (!tournamentId) return;
    if (deletedTournamentIdsRef.current.has(tournamentId)) return;

    if (!isTournamentOwnedByUsername(tournament, auth.username)) return;

    const scopedTournament = {
      ...tournament,
      id: tournamentId,
      tournamentId,
      TournamentId: tournamentId,
      organizerUsername: tournament.organizerUsername || auth.username,
      ownerUsername: tournament.ownerUsername || auth.username,
    };

    setTournaments((prev) => {
      const previousScoped = filterTournamentsForUsername(prev, auth.username);
      const previousSerialized = JSON.stringify(previousScoped);
      const exists = prev.some((item) => item.id === scopedTournament.id);
      const next = filterTournamentsForUsername(
        exists
        ? prev.map((item) =>
            item.id === scopedTournament.id
              ? mergeTournamentServerFields(item, scopedTournament)
              : item
          )
          : [scopedTournament, ...prev],
        auth.username
      );
      const nextSerialized = JSON.stringify(next);

      if (previousSerialized === lastTournamentBackendJsonRef.current) {
        lastTournamentBackendJsonRef.current = nextSerialized;
      }
      saveStoredTournaments(next, auth.username);
      return next;
    });
  }, [auth.username]);

  function buildTournamentFormBody(payload) {
    const formBody = new URLSearchParams();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (key === "tournament" || typeof value === "object") {
        formBody.set(key, JSON.stringify(value));
        return;
      }

      formBody.set(key, String(value));
    });

    return formBody.toString();
  }

  async function readTournamentApiResponse(response) {
    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      throw new Error(
        "Tournament backend did not return JSON. Apps Script tournament actions may still need to be added."
      );
    }

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Tournament backend action failed. Check Apps Script tournament actions."
      );
    }

    return data;
  }

  const callTournamentBackend = useCallback(
    async (action, payload = {}, options = {}) => {
      const tournamentPayload = payload.tournament
        ? buildTournamentBackendPayload(payload.tournament)
        : {};
      const requestPayload = {
        action,
        username: auth.username,
        password: auth.password,
        ...tournamentPayload,
        ...payload,
      };

      const sendRequest = async (transport) => {
        const response = await fetch(
          `${API}?_ts=${Date.now()}`,
          {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type":
                transport === "form"
                  ? "application/x-www-form-urlencoded;charset=UTF-8"
                  : "text/plain;charset=utf-8",
            },
            body:
              transport === "form"
                ? buildTournamentFormBody(requestPayload)
                : JSON.stringify(requestPayload),
          }
        );
        const data = await readTournamentApiResponse(response);
        return data;
      };

      const preferredTransport = options.transport === "form" ? "form" : "json";
      const fallbackTransport =
        preferredTransport === "json" ? "form" : "json";

      try {
        return await sendRequest(preferredTransport);
      } catch (error) {
        return sendRequest(fallbackTransport);
      }
    },
    [auth.password, auth.username]
  );

  const fetchPublicTournamentFromBackend = useCallback(async (publicCode) => {
    const requestPayload = {
      action: "getPublicTournament",
      publicCode,
    };
    const queryString = buildQueryString({
      ...requestPayload,
      _ts: Date.now(),
    });

    const response = await fetch(`${API}?${queryString}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await readTournamentApiResponse(response);

    return normalizeTournamentApiItem(data);
  }, []);

  const normalizePublicTournamentList = useCallback((data) => {
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.tournaments)
        ? data.tournaments
        : [];

    return list
      .filter(Boolean)
      .map((tournament) =>
        applyTournamentDefaults({
          ...tournament,
          publicListingEnabled: true,
          listPublicly: true,
          publicListed: true,
        })
      )
      .filter((tournament) => isTournamentPublished(tournament));
  }, []);

  const fetchPublicTournamentList = useCallback(async () => {
    const queryString = buildQueryString({
      action: "listPublicTournaments",
      _ts: Date.now(),
    });

    const response = await fetch(`${API}?${queryString}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await readTournamentApiResponse(response);
    return normalizePublicTournamentList(data);
  }, [normalizePublicTournamentList]);

  const persistTournamentNow = useCallback(
    async (action, tournament, options = {}) => {
      if (!auth.loggedIn || !tournament) return null;
      const tournamentId = getTournamentIdentity(tournament);
      if (!tournamentId) {
        setTournamentSyncStatus("error");
        setTournamentSyncMessage("Missing tournament id");
        return null;
      }
      if (deletedTournamentIdsRef.current.has(tournamentId)) {
        return null;
      }

      try {
        setTournamentSyncStatus("saving");
        setTournamentSyncMessage("");

        const backendTournament = prepareTournamentForBackend(tournament);
        const data = await callTournamentBackend(
          action,
          {
            tournament: backendTournament,
            tournamentId,
            TournamentId: tournamentId,
            id: tournamentId,
            publicCode: backendTournament.publicCode || "",
          },
          options
        );
        const normalizedSavedTournament = normalizeTournamentApiItem(data);
        const savedTournament =
          normalizedSavedTournament &&
          getTournamentIdentity(normalizedSavedTournament) === tournamentId
            ? normalizedSavedTournament
            : markTournamentBackendSynced(backendTournament);

        mergeTournamentFromBackend(savedTournament);
        setTournamentSyncStatus("saved");
        setTournamentSyncMessage(tournamentText.tournamentSyncSaved);
        return savedTournament;
      } catch (error) {
        console.error(`Could not ${action} tournament:`, error);
        setTournamentSyncStatus("error");
        setTournamentSyncMessage(
          error?.message || tournamentText.tournamentBackendTodo
        );
        return null;
      }
    },
    [
      auth.loggedIn,
      callTournamentBackend,
      mergeTournamentFromBackend,
      tournamentText.tournamentBackendTodo,
      tournamentText.tournamentSyncSaved,
    ]
  );

  const loadTournamentsFromBackend = useCallback(async () => {
    if (!auth.loggedIn || !auth.username || !auth.password) {
      setTournamentBackendReady(false);
      return;
    }

    const ownerUsername = getTournamentStorageUsername(auth.username);
    try {
      setTournamentSyncStatus("loading");
      setTournamentSyncMessage(tournamentText.tournamentSyncLoading);

      const data = await callTournamentBackend("listTournaments");
      if (tournamentSessionUsernameRef.current !== ownerUsername) return;

      const ownedBackendTournaments = filterTournamentsForUsername(
        normalizeTournamentApiList(data),
        auth.username
      ).filter((tournament) => {
        const tournamentId = getTournamentIdentity(tournament);
        return (
          tournamentId && !deletedTournamentIdsRef.current.has(tournamentId)
        );
      });
      const backendTournaments = await Promise.all(
        ownedBackendTournaments.map(async (tournament) => {
          if (!isTournamentPublished(tournament) || !tournament.publicCode) {
            return tournament;
          }

          try {
            const publicTournament = await fetchPublicTournamentFromBackend(
              tournament.publicCode
            );
            return publicTournament
              ? markTournamentPublicVerified({
                  ...tournament,
                  ...publicTournament,
                })
              : tournament;
          } catch (error) {
            console.error("Could not verify listed public tournament:", error);
            return tournament;
          }
        })
      );
      const nextTournaments = dedupeTournamentsById(
        filterTournamentsForUsername(backendTournaments, auth.username)
      ).filter((tournament) => {
        const tournamentId = getTournamentIdentity(tournament);
        return (
          tournamentId && !deletedTournamentIdsRef.current.has(tournamentId)
        );
      });
      const nextJson = JSON.stringify(nextTournaments);

      setTournaments(nextTournaments);
      setActiveTournamentId((currentId) =>
        getPreferredActiveTournamentId(nextTournaments, auth.username, currentId)
      );
      setShowTournamentSetupPanel(true);
      saveStoredTournaments(nextTournaments, auth.username);
      lastTournamentBackendJsonRef.current = nextJson;
      setTournamentBackendReady(true);

      setTournamentSyncStatus("saved");
      setTournamentSyncMessage(tournamentText.tournamentSyncSaved);
    } catch (error) {
      if (tournamentSessionUsernameRef.current !== ownerUsername) return;

      console.error("Could not load tournaments from backend:", error);
      setTournaments([]);
      setActiveTournamentId("");
      setShowTournamentSetupPanel(true);
      lastTournamentBackendJsonRef.current = "[]";
      setTournamentBackendReady(true);
      setTournamentSyncStatus("error");
      setTournamentSyncMessage(
        error?.message || tournamentText.tournamentBackendTodo
      );
    }
  }, [
    auth.loggedIn,
    auth.password,
    auth.username,
    callTournamentBackend,
    fetchPublicTournamentFromBackend,
    tournamentText.tournamentBackendTodo,
    tournamentText.tournamentSyncLoading,
    tournamentText.tournamentSyncSaved,
  ]);

  const loadSingleTournamentFromBackend = useCallback(
    async (tournamentId) => {
      if (!auth.loggedIn || !tournamentBackendReady || !tournamentId) return;

      try {
        const data = await callTournamentBackend("getTournament", {
          tournamentId,
        });
        const backendTournament = normalizeTournamentApiItem(data);
        if (!backendTournament) return;
        if (getTournamentIdentity(backendTournament) !== String(tournamentId)) {
          return;
        }

        if (!isTournamentOwnedByUsername(backendTournament, auth.username)) return;

        setTournaments((prev) => {
          const exists = prev.some((item) => item.id === backendTournament.id);
          return filterTournamentsForUsername(
            exists
            ? prev.map((item) =>
                item.id === backendTournament.id
                  ? mergeTournamentServerFields(item, backendTournament)
                  : item
              )
              : [backendTournament, ...prev],
            auth.username
          );
        });
      } catch (error) {
        console.error("Could not load tournament from backend:", error);
        setTournamentSyncStatus("error");
        setTournamentSyncMessage(
          error?.message || tournamentText.tournamentBackendTodo
        );
      }
    },
    [
      auth.loggedIn,
      auth.username,
      callTournamentBackend,
      tournamentBackendReady,
      tournamentText.tournamentBackendTodo,
    ]
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
        ? (language === "no" ? "Lag Åpnet." : "Team unlocked.")
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

  async function publishTournament() {
    if (!activeTournament) return;
    const publicCode =
      activeTournament.publicCode ||
      createTournamentPublicCode(activeTournament.name);
    const publishedAt = new Date().toISOString();
    const nextTournament = prepareTournamentForBackend(activeTournament, {
      published: true,
      status: "published",
      publicCode,
      publishedAt,
    });

    const savedTournament = await persistTournamentNow(
      "publishTournament",
      nextTournament
    );

    if (!savedTournament) {
      setTournaments((prev) =>
        prev.map((tournament) =>
          tournament.id !== activeTournament.id
            ? tournament
            : {
                ...activeTournament,
                publicCode,
                published: false,
                status: "unpublished",
              }
        )
      );
      return;
    }

    try {
      let verifiedTournament = await fetchPublicTournamentFromBackend(publicCode);
      let backendSavedTournament = savedTournament;

      if (!verifiedTournament) {
        const retryData = await callTournamentBackend(
          "publishTournament",
          {
            tournament: nextTournament,
            tournamentId: nextTournament.id,
            TournamentId: nextTournament.id,
            id: nextTournament.id,
            publicCode,
          },
          { transport: "form" }
        );
        backendSavedTournament =
          (() => {
            const normalizedRetryTournament = normalizeTournamentApiItem(retryData);
            return normalizedRetryTournament &&
              getTournamentIdentity(normalizedRetryTournament) ===
                getTournamentIdentity(nextTournament)
              ? normalizedRetryTournament
              : savedTournament;
          })();
        verifiedTournament = await fetchPublicTournamentFromBackend(publicCode);
      }

      if (!verifiedTournament) {
        throw new Error(tournamentText.tournamentPublishVerifyFailed);
      }

      const backendPublishedTournament = markTournamentPublicVerified({
        ...backendSavedTournament,
        ...verifiedTournament,
        publicCode,
        published: true,
        status: "published",
        publishedAt:
          verifiedTournament.publishedAt ||
          backendSavedTournament.publishedAt ||
          publishedAt,
      });

      mergeTournamentFromBackend(backendPublishedTournament);
      setTournamentSyncStatus("saved");
      setTournamentSyncMessage(tournamentText.backendPublicLinkReady);
      setTournamentActionMessage(tournamentText.publishedOk);
    } catch (error) {
      console.error("Could not verify public tournament after publish:", error);
      setTournaments((prev) =>
        prev.map((tournament) =>
          tournament.id !== activeTournament.id
            ? tournament
            : {
                ...activeTournament,
                publicCode,
                published: false,
                status: "unpublished",
                publishVerificationError:
                  error?.message || tournamentText.tournamentPublishVerifyFailed,
              }
        )
      );
      setTournamentSyncStatus("error");
      setTournamentSyncMessage(
        error?.message || tournamentText.tournamentPublishVerifyFailed
      );
      setTournamentActionMessage(
        error?.message || tournamentText.tournamentPublishVerifyFailed
      );
    }
  }

  async function publishTournamentPromotion() {
    if (!activeTournament) return;

    setPromotionVisibilityAction("publishing");
    setPromotionVisibilityError("");

    const publicCode =
      activeTournament.publicCode ||
      createTournamentPublicCode(activeTournament.name);
    const tournamentId =
      getTournamentIdentity(activeTournament) || createStableTournamentId();
    const publishedAt =
      activeTournament.publishedAt || new Date().toISOString();
    const nextTournament = prepareTournamentForBackend(activeTournament, {
      id: tournamentId,
      tournamentId,
      TournamentId: tournamentId,
      publicListingEnabled: true,
      listPublicly: true,
      publicListed: true,
      visibility: "public",
      published: true,
      status: "published",
      publicCode,
      publishedAt,
    });

    setTournaments((prev) =>
      prev.map((tournament) =>
        getTournamentIdentity(tournament) === getTournamentIdentity(activeTournament)
          ? nextTournament
          : tournament
      )
    );

    try {
      const savedTournament = await persistTournamentNow(
        "publishTournament",
        nextTournament
      );

      if (!savedTournament) {
        throw new Error(tournamentText.promotionPublishVerifyFailed);
      }

      const publicList = await fetchPublicTournamentList();
      const savedPublicCode = savedTournament.publicCode || publicCode;
      const isVisibleOnUpcoming = publicList.some(
        (tournament) =>
          String(tournament.publicCode || "") === String(publicCode) ||
          String(tournament.publicCode || "") === String(savedPublicCode) ||
          String(tournament.id || "") === String(nextTournament.id || "")
      );

      setPublicTournaments(publicList);
      setPublicTournamentsStatus("ready");
      setPublicTournamentsMessage("");

      if (!isVisibleOnUpcoming) {
        throw new Error(tournamentText.promotionPublishVerifyFailed);
      }

      const verifiedTournament = markTournamentPublicVerified({
        ...mergeTournamentServerFields(nextTournament, savedTournament),
        publicListingEnabled: true,
        listPublicly: true,
        publicListed: true,
        visibility: "public",
        published: true,
        status: "published",
        publicCode: savedPublicCode,
        publishedAt: savedTournament.publishedAt || publishedAt,
        promotionVerifiedAt: new Date().toISOString(),
      });

      mergeTournamentFromBackend(verifiedTournament);
      setTournamentSyncStatus("saved");
      setTournamentSyncMessage(tournamentText.promotionPublishedOk);
      setTournamentActionMessage(tournamentText.promotionPublishedOk);
    } catch (error) {
      console.error("Could not verify tournament promotion:", error);
      const message =
        error?.message || tournamentText.promotionPublishVerifyFailed;
      setPromotionVisibilityError(message);
      setTournamentSyncStatus("error");
      setTournamentSyncMessage(message);
      setTournamentActionMessage(message);
    } finally {
      setPromotionVisibilityAction("idle");
    }
  }

  async function hideTournamentPromotion() {
    if (!activeTournament) return;

    setPromotionVisibilityAction("hiding");
    setPromotionVisibilityError("");

    const nextTournament = prepareTournamentForBackend(activeTournament, {
      publicListingEnabled: false,
      listPublicly: false,
      publicListed: false,
      visibility: isTournamentPublished(activeTournament) ? "unlisted" : "",
    });

    setTournaments((prev) =>
      prev.map((tournament) =>
        getTournamentIdentity(tournament) === getTournamentIdentity(activeTournament)
          ? nextTournament
          : tournament
      )
    );

    try {
      const savedTournament = await persistTournamentNow(
        "saveTournament",
        nextTournament
      );

      if (!savedTournament) {
        throw new Error(tournamentText.promotionPublishVerifyFailed);
      }

      const publicList = await fetchPublicTournamentList();
      const isStillVisible = publicList.some(
        (tournament) =>
          String(tournament.publicCode || "") ===
            String(nextTournament.publicCode || "") ||
          String(tournament.id || "") === String(nextTournament.id || "")
      );

      setPublicTournaments(publicList);
      setPublicTournamentsStatus("ready");
      setPublicTournamentsMessage("");

      if (isStillVisible) {
        throw new Error(tournamentText.promotionHideVerifyFailed);
      }

      mergeTournamentFromBackend(
        mergeTournamentServerFields(nextTournament, savedTournament)
      );
      setTournamentSyncStatus("saved");
      setTournamentSyncMessage(tournamentText.promotionHiddenOk);
      setTournamentActionMessage(tournamentText.promotionHiddenOk);
    } catch (error) {
      console.error("Could not verify tournament promotion hide:", error);
      const message =
        error?.message || tournamentText.promotionHideVerifyFailed;
      setPromotionVisibilityError(message);
      setTournamentSyncStatus("error");
      setTournamentSyncMessage(message);
      setTournamentActionMessage(message);
    } finally {
      setPromotionVisibilityAction("idle");
    }
  }

  function unpublishTournament() {
    if (!activeTournament) return;
    const nextTournament = prepareTournamentForBackend(activeTournament, {
      published: false,
      status: "unpublished",
      publicVerifiedAt: "",
    });

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : nextTournament
      )
    );
    void persistTournamentNow("unpublishTournament", nextTournament);
    setTournamentActionMessage(tournamentText.unpublishedOk);
  }

  async function deleteActiveTournament() {
    const tournamentId = getTournamentIdentity(activeTournament);
    if (!tournamentId) return;

    if (isTournamentPublished(activeTournament)) {
      setTournamentActionMessage(
        tournamentText.tournamentDeletePublishedWarning
      );
      return;
    }

    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(tournamentText.confirmDeleteTournament);
    if (!confirmed) return;

    try {
      if (typeof window !== "undefined") {
        window.clearTimeout(tournamentAutosaveTimerRef.current);
      }
      deletedTournamentIdsRef.current.add(tournamentId);

      setTournamentSyncStatus("saving");
      setTournamentSyncMessage(tournamentText.tournamentSyncSaving);

      setTournaments((prev) => {
        const next = filterTournamentsForUsername(
          prev.filter(
            (tournament) => getTournamentIdentity(tournament) !== tournamentId
          ),
          auth.username
        );
        lastTournamentBackendJsonRef.current = JSON.stringify(next);
        saveStoredTournaments(next, auth.username);
        return next;
      });
      setActiveTournamentId((currentId) =>
        currentId === tournamentId ? "" : currentId
      );
      removeActiveTournamentId(auth.username, tournamentId);
      setActiveTournamentView("overview");
      setShowTournamentSetupPanel(true);
      setTournamentSyncStatus("saved");
      setTournamentSyncMessage(tournamentText.tournamentDeleted);
      setTournamentActionMessage(tournamentText.tournamentDeleted);

      await callTournamentBackend("deleteTournament", {
        tournamentId,
        TournamentId: tournamentId,
        id: tournamentId,
      });

      await loadTournamentsFromBackend();
    } catch (error) {
      deletedTournamentIdsRef.current.delete(tournamentId);
      console.error("Could not delete tournament:", error);
      const message =
        error?.message || tournamentText.deleteTournamentFailed;
      setTournamentSyncStatus("error");
      setTournamentSyncMessage(message);
      setTournamentActionMessage(message);
    }
  }

  async function cleanupMyDraftTournaments() {
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(tournamentText.confirmCleanupDraftTournaments);
    if (!confirmed) return;

    const cleanupTombstoneIds = [];

    try {
      if (typeof window !== "undefined") {
        window.clearTimeout(tournamentAutosaveTimerRef.current);
      }
      filterTournamentsForUsername(tournaments, auth.username).forEach(
        (tournament) => {
          const isDraftTestTournament =
            !isTournamentPublished(tournament) &&
            String(tournament.name || "")
              .toLowerCase()
              .includes("test");

          if (isDraftTestTournament && tournament.id) {
            deletedTournamentIdsRef.current.add(tournament.id);
            cleanupTombstoneIds.push(tournament.id);
          }
        }
      );

      setTournamentSyncStatus("saving");
      setTournamentSyncMessage(tournamentText.tournamentSyncSaving);

      const data = await callTournamentBackend("cleanupMyDraftTournaments", {
        nameContains: "TEST",
      });

      setTournaments([]);
      setActiveTournamentId("");
      removeActiveTournamentId(auth.username);
      saveStoredTournaments([], auth.username);
      lastTournamentBackendJsonRef.current = "[]";

      await loadTournamentsFromBackend();

      const deletedCount = Number(data?.deletedCount || 0);
      const message = `${tournamentText.cleanupDraftTournamentsOk} (${deletedCount})`;
      setTournamentSyncStatus("saved");
      setTournamentSyncMessage(message);
      setTournamentActionMessage(message);
    } catch (error) {
      cleanupTombstoneIds.forEach((tournamentId) =>
        deletedTournamentIdsRef.current.delete(tournamentId)
      );
      console.error("Could not clean draft tournaments:", error);
      const message =
        error?.message || tournamentText.cleanupDraftTournamentsFailed;
      setTournamentSyncStatus("error");
      setTournamentSyncMessage(message);
      setTournamentActionMessage(message);
    }
  }

  async function copyActiveTournamentPublicUrl() {
    const publicUrl = getPublicTournamentUrl(activeTournament);
    if (!publicUrl || !navigator?.clipboard?.writeText) {
      setTournamentActionMessage(tournamentText.publicLinkCopyFailed);
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setTournamentActionMessage(tournamentText.publicLinkCopied);
    } catch (error) {
      console.error("Could not copy tournament public link:", error);
      setTournamentActionMessage(tournamentText.publicLinkCopyFailed);
    }
  }

  function openActiveTournamentPublicPreview() {
    const publicUrl = getPublicTournamentUrl(activeTournament);
    if (!publicUrl) return;
    window.open(publicUrl, "_blank", "noopener,noreferrer");
  }

  function openPublicTournamentFromCard(tournament) {
    if (typeof window === "undefined" || !tournament?.publicCode) return;

    const url = new URL(window.location.href);
    url.searchParams.set("publicTournament", tournament.publicCode);
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.pushState({}, "", nextUrl);
    setCurrentSearch(window.location.search);
  }

  function openAppFromPublicTournament() {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.delete("publicTournament");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.pushState({}, "", nextUrl || window.location.pathname);
    setCurrentSearch(window.location.search);
  }

  function getTournamentStatusLabel(tournament) {
    if (!tournament) return "";
    if (isTournamentPublished(tournament)) {
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

  const buildManualGroups = useCallback((tournament, series = null) => {
    const safeGroupCount = Math.max(
      1,
      Number(series?.groupCount || tournament?.groupCount || 2)
    );
    const safeTeamsPerGroup = Math.max(
      1,
      Number(series?.teamsPerGroup || tournament?.teamsPerGroup || 5)
    );
    const existingGroups = Array.isArray(series?.groups)
      ? series.groups
      : Array.isArray(tournament?.groups)
        ? tournament.groups
        : [];
    const shouldPrefixGroupIds = Boolean(series?.id && !series?.isDefaultSeries);

    return Array.from({ length: safeGroupCount }, (_, groupIndex) => {
      const code = getTournamentGroupCode(groupIndex);
      const existingGroup =
        existingGroups.find((group) => group.code === code) ||
        existingGroups[groupIndex] ||
        {};
      const existingTeams = Array.isArray(existingGroup.teams)
        ? existingGroup.teams
        : [];
      const groupId =
        existingGroup.id ||
        (shouldPrefixGroupIds ? `${series.id}-g-${code}` : `g-${code}`);

      return {
        ...existingGroup,
        id: groupId,
        seriesId: series?.id || existingGroup.seriesId || "",
        seriesName: series?.name || existingGroup.seriesName || "",
        code,
        name: `${language === "no" ? "Gruppe" : "Group"} ${code}`,
        teams: Array.from({ length: safeTeamsPerGroup }, (_, slotIndex) => {
          const slot = `${code}${slotIndex + 1}`;
          const existingTeam =
            existingTeams.find((team) => team.slot === slot) ||
            existingTeams[slotIndex] ||
            {};

          return {
            ...existingTeam,
            id: existingTeam.id || `${groupId}-slot-${slot}`,
            slot,
            seriesId: series?.id || existingTeam.seriesId || "",
            seriesName: series?.name || existingTeam.seriesName || "",
            name: existingTeam.name || "",
            club: existingTeam.club || "",
          };
        }),
      };
    });
  }, [language]);

  function markManualGroupEditing() {
    manualGroupEditingRef.current = true;
    if (typeof window !== "undefined") {
      window.clearTimeout(manualGroupEditingTimerRef.current);
      manualGroupEditingTimerRef.current = window.setTimeout(() => {
        manualGroupEditingRef.current = false;
      }, 1500);
    }
  }

  function getTournamentGroupsForDisplay(tournament, series = null) {
    if (series) {
      return Array.isArray(series.groups) ? series.groups : [];
    }
    return Array.isArray(tournament?.groups) ? tournament.groups : [];
  }

  function resizeManualGroupsFromFormat() {
    if (!activeTournament) return;

    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== activeTournament.id) return tournament;

        const selectedSeries = getTournamentSeriesById(
          tournament,
          activeTournamentSetupSeriesId,
          language
        );

        if (hasExplicitTournamentSeries(tournament) && selectedSeries) {
          const groups = buildManualGroups(tournament, selectedSeries);
          const groupCount = Math.max(1, Number(selectedSeries.groupCount || 2));

          return {
            ...tournament,
            series: (tournament.series || []).map((series) =>
              String(series.id) !== String(selectedSeries.id)
                ? series
                : {
                    ...series,
                    groups,
                    bracketSize: Math.max(2, groupCount * 2),
                  }
            ),
          };
        }

        const groups = buildManualGroups(tournament, selectedSeries);
        const groupCount = Math.max(
          1,
          Number(selectedSeries?.groupCount || tournament.groupCount || 2)
        );

        return {
          ...tournament,
          groups,
          bracketSize: Math.max(2, groupCount * 2),
        };
      })
    );
    setTournamentActionMessage(tournamentText.buildUpdateSlots);
  }

  function updateManualGroupSlot(groupIndex, slotIndex, value) {
    if (!activeTournament) return;

    markManualGroupEditing();

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : (() => {
              const selectedSeries = getTournamentSeriesById(
                tournament,
                activeTournamentSetupSeriesId,
                language
              );
              const sourceGroups =
                hasExplicitTournamentSeries(tournament) && selectedSeries
                  ? selectedSeries.groups
                  : tournament.groups;
              const existingGroups = Array.isArray(sourceGroups)
                ? sourceGroups
                : [];
              if (!existingGroups[groupIndex]) return tournament;

              const groups = existingGroups.map((group, currentGroupIndex) => {
                if (currentGroupIndex !== groupIndex) return group;

                const existingTeams = Array.isArray(group.teams)
                  ? group.teams
                  : [];
                if (!existingTeams[slotIndex]) return group;

                return {
                  ...group,
                  teams: existingTeams.map((team, currentSlotIndex) =>
                    currentSlotIndex === slotIndex
                      ? {
                          ...team,
                          name: value,
                        }
                      : team
                  ),
                };
              });

              if (hasExplicitTournamentSeries(tournament) && selectedSeries) {
                return {
                  ...tournament,
                  series: (tournament.series || []).map((series) =>
                    String(series.id) !== String(selectedSeries.id)
                      ? series
                      : {
                          ...series,
                          groups,
                        }
                  ),
                };
              }

              return {
                ...tournament,
                groups,
              };
            })()
      )
    );
  }

  function addTournamentSeries(preset = {}) {
    if (!activeTournament) return;

    const presetName = String(preset.name || "").trim();
    const presetPlayersPerTeam = Number(
      preset.playersPerTeam || preset.teamSize || 0
    );
    const existingPresetSeries =
      presetName || presetPlayersPerTeam
        ? getTournamentSeriesClasses(activeTournament, language).find((series) => {
            const seriesName = String(series.name || "").trim().toLowerCase();
            const seriesPlayersPerTeam = Number(
              series.playersPerTeam || series.teamSize || 0
            );

            return (
              (presetName &&
                seriesName === presetName.toLowerCase()) ||
              (presetPlayersPerTeam > 0 &&
                seriesPlayersPerTeam === presetPlayersPerTeam)
            );
          })
        : null;

    if (existingPresetSeries) {
      setActiveTournamentSetupSeriesId(existingPresetSeries.id);
      setActiveTournamentSeriesFilter((current) =>
        current === "all" ? current : existingPresetSeries.id
      );
      return;
    }

    const nextSeriesId =
      preset.id ||
      `series-${slugifySeriesId(
        presetName || `${presetPlayersPerTeam || 4}-manns`,
        Date.now().toString(36)
      )}`;
    setActiveTournamentSetupSeriesId(nextSeriesId);
    setActiveTournamentSeriesFilter((current) =>
      current === "all" ? current : nextSeriesId
    );

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : (() => {
              const storedSeries = Array.isArray(tournament.series)
                ? tournament.series
                : [];
              const hasRootClassData =
                (Array.isArray(tournament.groups) && tournament.groups.length > 0) ||
                (Array.isArray(tournament.matches) && tournament.matches.length > 0) ||
                Boolean(
                  tournament.knockout &&
                    Object.keys(tournament.knockout || {}).some((key) =>
                      Array.isArray(tournament.knockout[key])
                        ? tournament.knockout[key].length > 0
                        : Boolean(tournament.knockout[key])
                    )
                );
              const existingSeries =
                storedSeries.length === 0 && hasRootClassData
                  ? [
                      normalizeTournamentSeriesItem(
                        {
                          id: DEFAULT_TOURNAMENT_SERIES_ID,
                          name:
                            tournament.className ||
                            tournament.seriesName ||
                            tournamentText.seriesLabel,
                          playersPerTeam:
                            tournament.playersPerTeam || tournament.teamSize || "",
                          totalTeams: tournament.totalTeams,
                          groupCount: tournament.groupCount,
                          teamsPerGroup: tournament.teamsPerGroup,
                          qualifiersPerGroup: tournament.qualifiersPerGroup,
                          groupMatchMinutes: tournament.groupMatchMinutes,
                          playoffMatchMinutes: tournament.playoffMatchMinutes,
                          groups: Array.isArray(tournament.groups)
                            ? tournament.groups
                            : [],
                          matches: Array.isArray(tournament.matches)
                            ? tournament.matches
                            : [],
                          knockout: tournament.knockout || {},
                        },
                        0,
                        tournament,
                        language
                      ),
                    ]
                  : storedSeries;
              const normalizedSeries = normalizeTournamentSeriesItem(
                {
                  id: nextSeriesId,
                  name: preset.name || "",
                  playersPerTeam: preset.playersPerTeam || preset.teamSize || 4,
                  teamSize: preset.playersPerTeam || preset.teamSize || 4,
                  totalTeams: preset.totalTeams || tournament.totalTeams || 10,
                  groupCount: preset.groupCount || tournament.groupCount || 2,
                  teamsPerGroup:
                    preset.teamsPerGroup || tournament.teamsPerGroup || 5,
                  qualifiersPerGroup:
                    preset.qualifiersPerGroup ||
                    tournament.qualifiersPerGroup ||
                    2,
                  groupMatchMinutes:
                    preset.groupMatchMinutes ||
                    tournament.groupMatchMinutes ||
                    12,
                  playoffMatchMinutes:
                    preset.playoffMatchMinutes ||
                    tournament.playoffMatchMinutes ||
                    15,
                  format: "group-stage",
                  maxTeams: preset.maxTeams || tournament.totalTeams || "",
                  minimumTeams: "",
                  prizeText: "",
                  feeText: "",
                  startTime: tournament.startTime || "",
                  notes: "",
                  groups: Array.isArray(preset.groups) ? preset.groups : [],
                  matches: [],
                  knockout: {},
                  scheduleMode: "afterPrevious",
                  publicStatus: preset.publicStatus || "hidden",
                },
                existingSeries.length,
                tournament,
                language
              );

              return {
                ...tournament,
                seriesScheduleMode: tournament.seriesScheduleMode || "fourFirst",
                series: [
                  ...existingSeries,
                  {
                    ...normalizedSeries,
                    groups:
                      normalizedSeries.groups.length > 0
                        ? normalizedSeries.groups
                        : buildManualGroups(tournament, normalizedSeries),
                  },
                ],
              };
            })()
      )
    );
  }

  function updateTournamentSeries(seriesId, patch) {
    if (!activeTournament) return;

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              series: (Array.isArray(tournament.series)
                ? tournament.series
                : []
              ).map((series) =>
                series.id === seriesId
                  ? normalizeTournamentSeriesItem(
                      { ...series, ...patch },
                      0,
                      tournament,
                      language
                    )
                  : series
              ),
            }
      )
    );
  }

  function updateSelectedTournamentClassConfig(patch) {
    if (!activeTournament) return;
    const selectedSeries = getTournamentSeriesById(
      activeTournament,
      activeTournamentSetupSeriesId,
      language
    );

    if (hasExplicitTournamentSeries(activeTournament) && selectedSeries) {
      updateTournamentSeries(selectedSeries.id, patch);
      return;
    }

    const rootPatch = { ...patch };
    if (Object.prototype.hasOwnProperty.call(rootPatch, "name")) {
      rootPatch.className = rootPatch.name;
      delete rootPatch.name;
    }
    if (Object.prototype.hasOwnProperty.call(rootPatch, "playersPerTeam")) {
      rootPatch.teamSize = rootPatch.playersPerTeam;
    }
    if (Object.prototype.hasOwnProperty.call(rootPatch, "teamSize")) {
      rootPatch.playersPerTeam = rootPatch.teamSize;
    }

    updateActiveTournament(rootPatch);
  }

  function removeTournamentSeries(seriesId) {
    if (!activeTournament) return;

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : {
              ...tournament,
              series: (Array.isArray(tournament.series)
                ? tournament.series
                : []
              ).filter((series) => series.id !== seriesId),
              matches: (Array.isArray(tournament.matches)
                ? tournament.matches
                : []
              ).filter((match) => String(match.seriesId || "") !== String(seriesId)),
            }
      )
    );
  }

  function updateTournamentSeriesPublicStatus(seriesId, publicStatus) {
    if (!activeTournament) return;
    const safeStatus = SERIES_PUBLIC_STATUSES.includes(publicStatus)
      ? publicStatus
      : "hidden";

    if (!hasExplicitTournamentSeries(activeTournament)) {
      updateActiveTournament({ publicStatus: safeStatus });
      return;
    }

    updateTournamentSeries(seriesId, { publicStatus: safeStatus });
  }

  function getTournamentStageOrder(stage) {
    const normalized = String(stage || "").toLowerCase();
    if (normalized === "group") return 10;
    if (normalized === "quarterfinal" || normalized === "quarter_final") return 15;
    if (normalized === "semifinal" || normalized === "semi_final") return 20;
    if (normalized === "third_place") return 30;
    if (normalized === "final") return 40;
    if (normalized === "knockout") return 25;
    return 50;
  }

  function buildManualKnockout(tournament) {
    const safeGroupCount = Math.max(1, Number(tournament?.groupCount || 2));
    const groupCodes = Array.from({ length: safeGroupCount }, (_, index) =>
      getTournamentGroupCode(index)
    );
    const getStageFromId = (id) => {
      if (String(id).startsWith("sf-")) return "semifinal";
      if (String(id).startsWith("third-place")) return "third_place";
      if (String(id).startsWith("final")) return "final";
      if (String(id).startsWith("qf-")) return "quarterfinal";
      return "knockout";
    };
    const makeMatch = (id, label, teamA, teamB, stage = getStageFromId(id)) => ({
      id,
      label,
      stage,
      stageOrder: getTournamentStageOrder(stage),
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
        final: makeMatch("final-1", "Final", "Winner SF1", "Winner SF2", "final"),
        thirdPlace: tournament?.thirdPlaceMatch
          ? makeMatch("third-place-1", "Third", "Loser SF1", "Loser SF2", "third_place")
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
      final: makeMatch("final-1", "Final", "Winner SF1", "Winner SF2", "final"),
      thirdPlace: tournament?.thirdPlaceMatch
        ? makeMatch("third-place-1", "Third", "Loser SF1", "Loser SF2", "third_place")
        : null,
    };
  }

  function getOrderedKnockoutScheduleMatches(knockoutPreview, tournament) {
    const mapMatch = (match, stage, round) => ({
      ...match,
      stage,
      stageOrder: getTournamentStageOrder(stage),
      round,
    });

    return [
      ...(knockoutPreview.quarterFinals || []).map((match) =>
        mapMatch(match, "quarterfinal", tournamentText.firstKnockoutLabel)
      ),
      ...(knockoutPreview.semiFinals || []).map((match) =>
        mapMatch(match, "semifinal", tournamentText.semiFinals)
      ),
      tournament?.thirdPlaceMatch && knockoutPreview.thirdPlace
        ? mapMatch(knockoutPreview.thirdPlace, "third_place", tournamentText.thirdPlace)
        : null,
      knockoutPreview.final
        ? mapMatch(knockoutPreview.final, "final", tournamentText.final)
        : null,
    ].filter(Boolean);
  }

  function buildKnockoutScheduleBatches(knockoutScheduleItems, courtCount) {
    const safeCourtCount = Math.max(1, Number(courtCount || 1));
    const batches = [];
    const grouped = {
      quarterfinal: [],
      semifinal: [],
      third_place: [],
      final: [],
      other: [],
    };

    knockoutScheduleItems.forEach((item) => {
      const key = grouped[item.stage] ? item.stage : "other";
      grouped[key].push(item);
    });

    const addChunked = (items) => {
      for (let index = 0; index < items.length; index += safeCourtCount) {
        batches.push(items.slice(index, index + safeCourtCount));
      }
    };

    addChunked(grouped.quarterfinal);
    addChunked(grouped.semifinal);
    grouped.third_place.forEach((item) => batches.push([item]));
    grouped.final.forEach((item) => batches.push([item]));
    addChunked(grouped.other);

    return batches;
  }

  function mergeKnockoutPreservingResults(existingKnockout, nextKnockout) {
    const existingById = new Map();
    const collect = (match) => {
      if (match?.id) existingById.set(match.id, match);
    };

    [
      ...(existingKnockout?.quarterFinals || []),
      ...(existingKnockout?.semiFinals || []),
      existingKnockout?.final,
      existingKnockout?.thirdPlace,
    ].filter(Boolean).forEach(collect);

    const mergeMatch = (match) => {
      const existing = existingById.get(match?.id);
      if (!existing) return match;
      const hasResult =
        isMatchCompleted(existing) ||
        getMatchDisplayStatus(existing).status === "in_progress" ||
        hasScoreValue(existing.scoreA) ||
        hasScoreValue(existing.scoreB);

      if (!hasResult) return { ...existing, ...match };

      return {
        ...match,
        scoreA: existing.scoreA,
        scoreB: existing.scoreB,
        status: existing.status,
        completed: existing.completed,
        finalized: existing.finalized,
        winnerTeamId: existing.winnerTeamId,
        completedAt: existing.completedAt,
        scoreTouched: existing.scoreTouched,
        resultType: existing.resultType,
        resultNote: existing.resultNote,
        winnerSource: existing.winnerSource || match.winnerSource,
        loserSource: existing.loserSource || match.loserSource,
      };
    };

    return {
      ...nextKnockout,
      quarterFinals: (nextKnockout.quarterFinals || []).map(mergeMatch),
      semiFinals: (nextKnockout.semiFinals || []).map(mergeMatch),
      final: nextKnockout.final ? mergeMatch(nextKnockout.final) : null,
      thirdPlace: nextKnockout.thirdPlace
        ? mergeMatch(nextKnockout.thirdPlace)
        : null,
    };
  }

  function getTournamentPreviewTeamName(team) {
    return String(team?.name || "").trim() || team?.slot || "-";
  }

  function parseTournamentScheduleStart(value) {
    const [hours, minutes] = String(value || "09:00")
      .split(":")
      .map((part) => Number(part));

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 9 * 60;
    return hours * 60 + minutes;
  }

  function formatTournamentScheduleTime(totalMinutes) {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  function hasScoreValue(value) {
    return String(value ?? "").trim() !== "";
  }

  function parseMatchScore(value) {
    if (!hasScoreValue(value)) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getMatchCompletionScore(value) {
    const parsed = parseMatchScore(value);
    return parsed === null ? 0 : parsed;
  }

  function isMatchCompleted(match) {
    return Boolean(
      String(match?.status || "").toLowerCase() === "completed" ||
        match?.completed === true ||
        match?.finalized === true
    );
  }

  function isMatchInProgressFromScore(match) {
    return Boolean(
      (hasScoreValue(match?.scoreA) || hasScoreValue(match?.scoreB)) &&
        !isMatchCompleted(match)
    );
  }

  function isKnockoutMatch(match) {
    if (match?.groupId || match?.groupCode) return false;

    const text = [
      match?.stage,
      match?.sourceRound,
      match?.round,
      match?.label,
      match?.id,
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    return (
      text.includes("knockout") ||
      text.includes("quarter") ||
      text.includes("semi") ||
      text.includes("final") ||
      text.includes("third") ||
      text.includes("ko-")
    );
  }

  function getMatchPairKey(match) {
    if (!match) return "";

    const stage = String(match.stage || "group").trim().toLowerCase();
    const seriesKey = String(match.seriesId || "").trim().toLowerCase();
    const groupKey = String(match.groupId || match.groupCode || "")
      .trim()
      .toLowerCase();
    const teams = [match.teamA, match.teamB]
      .map((team) => String(team || "").trim().toLowerCase())
      .filter(Boolean)
      .sort();

    return teams.length === 2
      ? `${seriesKey}|${stage}|${groupKey}|${teams.join("|")}`
      : "";
  }

  function getTournamentMatchLookup(tournament) {
    const byId = new Map();
    const byPair = new Map();

    (Array.isArray(tournament?.matches) ? tournament.matches : []).forEach(
      (match) => {
        if (match?.id) byId.set(match.id, match);

        const pairKey = getMatchPairKey(match);
        if (pairKey && !byPair.has(pairKey)) {
          byPair.set(pairKey, match);
        }
      }
    );

    return { byId, byPair };
  }

  function mergeScheduleItemWithSavedMatch(item, matchLookup) {
    if (!item) return null;

    const savedMatch =
      matchLookup?.byId?.get(item.id) ||
      matchLookup?.byPair?.get(getMatchPairKey(item));

    if (savedMatch?.unplaced || savedMatch?.needsManualPlacement) {
      return null;
    }

    if (!savedMatch) {
      return {
        ...item,
        matchId: item.id,
      };
    }

    return {
      ...item,
      ...savedMatch,
      id: savedMatch.id,
      matchId: savedMatch.id,
      groupColor: item.groupColor,
      scheduleBatch: savedMatch.scheduleBatch ?? item.scheduleBatch,
      scheduleCourt: savedMatch.scheduleCourt ?? item.scheduleCourt,
      scheduleOrder: savedMatch.scheduleOrder ?? item.scheduleOrder,
      manualOrder: savedMatch.manualOrder ?? item.manualOrder,
      order: savedMatch.order ?? savedMatch.scheduleOrder ?? item.order,
      index: savedMatch.index ?? savedMatch.scheduleOrder ?? item.index,
      court: savedMatch.court ?? savedMatch.scheduleCourt ?? item.court,
      startTime:
        savedMatch.startTime || savedMatch.scheduleTime || item.startTime || "",
      durationMin:
        savedMatch.durationMin || savedMatch.duration || item.durationMin || "",
      seriesId: item.seriesId || savedMatch.seriesId || "",
      seriesName: item.seriesName || savedMatch.seriesName || "",
      playersPerTeam: item.playersPerTeam || savedMatch.playersPerTeam || "",
      phase: item.phase || savedMatch.phase || item.stage || savedMatch.stage,
      teamAId: item.teamAId || savedMatch.teamAId,
      teamBId: item.teamBId || savedMatch.teamBId,
      teamA: String(item.teamA || "").trim() ? item.teamA : savedMatch.teamA,
      teamB: String(item.teamB || "").trim() ? item.teamB : savedMatch.teamB,
      courtIndex: savedMatch.courtIndex ?? item.courtIndex,
      courtName: savedMatch.courtName || item.courtName,
      round: item.round || savedMatch.round,
      roundNumber: item.roundNumber ?? savedMatch.roundNumber,
      stage: item.stage || savedMatch.stage,
      stageOrder:
        item.stageOrder ?? savedMatch.stageOrder ?? getTournamentStageOrder(item.stage),
      sourceA: item.sourceA || savedMatch.sourceA,
      sourceB: item.sourceB || savedMatch.sourceB,
    };
  }

  function getScheduleOrderValue(item, fallback = 0) {
    const parsed = Number(item?.manualOrder ?? item?.scheduleOrder ?? fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getScheduleCourtValue(item) {
    const parsed = Number(
      item?.scheduleCourt ||
        (Number.isFinite(Number(item?.courtIndex))
          ? Number(item.courtIndex) + 1
          : 1)
    );
    return Number.isFinite(parsed) ? parsed : 1;
  }

  function applyTournamentScheduleOverrides(batches, courtCount) {
    const safeCourtCount = Math.max(1, Number(courtCount || 1));
    const sourceBatches = Array.isArray(batches) ? batches : [];
    const flatItems = [];

    sourceBatches.forEach((batch, batchIndex) => {
      (batch.items || []).forEach((item, courtIndex) => {
        if (!item) return;
        const fallbackOrder = batchIndex * safeCourtCount + courtIndex;
        flatItems.push({
          ...item,
          originalScheduleIndex: fallbackOrder,
          scheduleBatch: item.scheduleBatch || batch.number || batchIndex + 1,
          scheduleCourt: item.scheduleCourt || courtIndex + 1,
          scheduleOrder: item.scheduleOrder ?? fallbackOrder,
        });
      });
    });

    flatItems.sort((a, b) => {
      const orderDelta =
        getScheduleOrderValue(a, a.originalScheduleIndex) -
        getScheduleOrderValue(b, b.originalScheduleIndex);
      if (orderDelta !== 0) return orderDelta;
      const stageDelta =
        Number(a.stageOrder ?? getTournamentStageOrder(a.stage)) -
        Number(b.stageOrder ?? getTournamentStageOrder(b.stage));
      if (stageDelta !== 0) return stageDelta;
      const courtDelta = getScheduleCourtValue(a) - getScheduleCourtValue(b);
      if (courtDelta !== 0) return courtDelta;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });

    const highestOrder = flatItems.reduce(
      (max, item) =>
        Math.max(max, getScheduleOrderValue(item, item.originalScheduleIndex)),
      -1
    );
    const batchCount = Math.max(
      sourceBatches.length,
      highestOrder >= 0 ? Math.floor(highestOrder / safeCourtCount) + 1 : 0
    );
    const nextBatches = Array.from({ length: batchCount }, (_, batchIndex) => {
      const sourceBatch =
        sourceBatches[batchIndex] ||
        sourceBatches[sourceBatches.length - 1] ||
        {};

      return {
        ...sourceBatch,
        id: sourceBatch.id || `schedule-batch-${batchIndex + 1}`,
        number: batchIndex + 1,
        items: Array.from({ length: safeCourtCount }, () => null),
      };
    });

    flatItems.forEach((item) => {
      const desiredOrder = Math.max(
        0,
        getScheduleOrderValue(item, item.originalScheduleIndex)
      );
      const batchIndex = Math.max(
        0,
        Math.min(nextBatches.length - 1, Math.floor(desiredOrder / safeCourtCount))
      );

      let courtIndex = Math.max(
        0,
        Math.min(
          safeCourtCount - 1,
          Number.isFinite(Number(item.scheduleCourt))
            ? getScheduleCourtValue(item) - 1
            : desiredOrder % safeCourtCount
        )
      );
      if (nextBatches[batchIndex].items[courtIndex]) {
        courtIndex = nextBatches[batchIndex].items.findIndex(
          (slot) => !slot
        );
      }
      if (courtIndex < 0) courtIndex = 0;

      const scheduleOrder = batchIndex * safeCourtCount + courtIndex;
      nextBatches[batchIndex].items[courtIndex] = {
        ...item,
        originalScheduleIndex: undefined,
        scheduleBatch: batchIndex + 1,
        batch: batchIndex + 1,
        scheduleCourt: courtIndex + 1,
        court: courtIndex + 1,
        courtIndex,
        courtName: `Court ${courtIndex + 1}`,
        scheduleOrder,
        order: scheduleOrder,
        index: scheduleOrder,
      };
    });

    return nextBatches;
  }

  function applyPublicThemePreset(presetKey) {
    if (!activeTournament) return;
    const preset = PUBLIC_THEME_PRESETS[presetKey] || PUBLIC_THEME_PRESETS["classic-green"];
    updateActiveTournament({
      publicTheme: normalizePublicTheme({
        ...preset,
        preset: PUBLIC_THEME_PRESETS[presetKey] ? presetKey : "classic-green",
        mode: presetKey === "club-custom" ? "custom" : "preset",
      }),
    });
    setPublicThemeColorErrors({});
  }

  function updatePublicThemeField(field, value) {
    if (!activeTournament) return;

    if (!isValidHexColor(value)) {
      setPublicThemeColorErrors((prev) => ({
        ...prev,
        [field]: true,
      }));
      updateActiveTournament({
        publicTheme: {
          ...normalizePublicTheme(activeTournament.publicTheme),
          preset: "club-custom",
          mode: "custom",
          [field]: value,
        },
      });
      return;
    }

    setPublicThemeColorErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    updateActiveTournament({
      publicTheme: normalizePublicTheme({
        ...activeTournament.publicTheme,
        preset: "club-custom",
        mode: "custom",
        [field]: value,
      }),
    });
  }

  function getPublicLiveThemePatch(theme) {
    const safeTheme = normalizePublicLiveTheme(theme);

    return {
      publicLiveTheme: safeTheme,
      publicLivePageBackground: safeTheme.background,
      publicLiveCardColor: safeTheme.panel,
      publicLivePrimaryColor: safeTheme.primary,
      publicLiveAccentColor: safeTheme.accent,
      publicLiveTextColor: safeTheme.text,
    };
  }

  function applyPublicLiveThemePreset(presetKey) {
    if (!activeTournament) return;
    const fallbackPresetKey = "clean-white";
    const preset =
      PUBLIC_THEME_PRESETS[presetKey] ||
      PUBLIC_THEME_PRESETS[fallbackPresetKey];
    const nextTheme = normalizePublicLiveTheme({
      ...preset,
      preset: PUBLIC_THEME_PRESETS[presetKey] ? presetKey : fallbackPresetKey,
      mode: presetKey === "club-custom" ? "custom" : "preset",
    });

    updateActiveTournament(getPublicLiveThemePatch(nextTheme));
    setPublicLiveThemeColorErrors({});
  }

  function updatePublicLiveThemeField(field, value) {
    if (!activeTournament) return;

    const fieldMap = {
      background: "publicLivePageBackground",
      panel: "publicLiveCardColor",
      primary: "publicLivePrimaryColor",
      accent: "publicLiveAccentColor",
      text: "publicLiveTextColor",
    };
    const themePatch = {
      ...getTournamentPublicLiveTheme(activeTournament),
      preset: "club-custom",
      mode: "custom",
      [field]: value,
      ...(field === "panel" ? { surface: value } : {}),
    };

    if (!isValidHexColor(value)) {
      setPublicLiveThemeColorErrors((prev) => ({
        ...prev,
        [field]: true,
      }));
      updateActiveTournament({
        publicLiveTheme: themePatch,
        ...(fieldMap[field] ? { [fieldMap[field]]: value } : {}),
      });
      return;
    }

    setPublicLiveThemeColorErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    updateActiveTournament(getPublicLiveThemePatch(themePatch));
  }

  function getMatchResultTypeLabel(match) {
    const resultType = String(match?.resultType || "normal").toLowerCase();
    if (resultType === "walkover") return tournamentText.walkover;
    if (resultType === "no_show") return tournamentText.noShow;
    return "";
  }

  function findTournamentTeamIdByName(tournament, teamName) {
    const targetName = String(teamName || "").trim().toLowerCase();
    if (!targetName) return "";

    for (const group of Array.isArray(tournament?.groups) ? tournament.groups : []) {
      for (const team of Array.isArray(group?.teams) ? group.teams : []) {
        if (String(team?.name || "").trim().toLowerCase() === targetName) {
          return team.id || team.slot || "";
        }
      }
    }

    for (const team of Array.isArray(tournament?.teams) ? tournament.teams : []) {
      if (String(team?.name || "").trim().toLowerCase() === targetName) {
        return team.id || "";
      }
    }

    return "";
  }

  function hasCompletableMatchScore(match) {
    const scoreA = getMatchCompletionScore(match?.scoreA);
    const scoreB = getMatchCompletionScore(match?.scoreB);

    if (isKnockoutMatch(match) && scoreA === scoreB) return false;
    return true;
  }

  function getMatchProgressFromScore(match) {
    const hasA = hasScoreValue(match?.scoreA);
    const hasB = hasScoreValue(match?.scoreB);

    return {
      ...match,
      status: hasA || hasB ? "in_progress" : "scheduled",
      completed: false,
      finalized: false,
      winnerTeamId: "",
      completedAt: "",
    };
  }

  function finalizeMatchFromScore(match) {
    const scoreA = getMatchCompletionScore(match?.scoreA);
    const scoreB = getMatchCompletionScore(match?.scoreB);

    if (isKnockoutMatch(match) && scoreA === scoreB) {
      return match;
    }

    return {
      ...match,
      status: "completed",
      completed: true,
      finalized: true,
      scoreTouched: true,
      scoreA: String(scoreA),
      scoreB: String(scoreB),
      completedAt: new Date().toISOString(),
      winnerTeamId:
        scoreA === scoreB
          ? null
          : scoreA > scoreB
            ? match.teamAId || match.teamA || ""
            : match.teamBId || match.teamB || "",
    };
  }

  function markMatchNeedsWinnerFromScore(match) {
    const scoreA = getMatchCompletionScore(match?.scoreA);
    const scoreB = getMatchCompletionScore(match?.scoreB);

    return {
      ...match,
      status: "in_progress",
      completed: false,
      finalized: false,
      scoreTouched: true,
      scoreA: String(scoreA),
      scoreB: String(scoreB),
      winnerTeamId: "",
      completedAt: "",
    };
  }

  function getKnockoutStageKeyForMatch(match) {
    const rawId = String(match?.id || match?.matchId || "")
      .replace(/^schedule-/, "")
      .toLowerCase();

    if (rawId.startsWith("qf-") || rawId.includes("-qf-") || rawId.startsWith("ko-")) {
      return "quarterFinals";
    }
    if (rawId.startsWith("sf-") || rawId.includes("-sf-")) return "semiFinals";
    if (rawId.startsWith("final-") || rawId.includes("-final-")) return "final";
    if (rawId.startsWith("third-place") || rawId.includes("-third-place")) return "thirdPlace";

    return "";
  }

  function getKnockoutBaseMatchId(match) {
    const rawId = String(match?.id || match?.matchId || "").replace(/^schedule-/, "");
    const knownMatchId = rawId.match(/(third-place-\d+|final-\d+|sf-\d+|qf-\d+|ko-\d+)/i);
    return knownMatchId ? knownMatchId[1] : rawId;
  }

  function applyCompletedKnockoutWinner(knockout, completedMatch) {
    if (!isKnockoutMatch(completedMatch) || !completedMatch?.winnerTeamId) {
      return knockout || {};
    }

    const stageKey = getKnockoutStageKeyForMatch(completedMatch);
    const baseMatchId = getKnockoutBaseMatchId(completedMatch);
    if (!stageKey || !baseMatchId) return knockout || {};

    const winnerSource = String(completedMatch.winnerTeamId || "");
    const sourceA = completedMatch.sourceA || completedMatch.teamA;
    const sourceB = completedMatch.sourceB || completedMatch.teamB;
    const loserSource =
      winnerSource === sourceA
        ? sourceB
        : winnerSource === sourceB
          ? sourceA
          : "";
    const nextKnockout = knockout || {};
    const applyToMatch = (match) =>
      match && match.id === baseMatchId
        ? {
            ...match,
            winnerSource,
            loserSource,
            status: "completed",
          }
        : match;

    if (Array.isArray(nextKnockout[stageKey])) {
      return {
        ...nextKnockout,
        [stageKey]: nextKnockout[stageKey].map(applyToMatch),
      };
    }

    return {
      ...nextKnockout,
      [stageKey]: applyToMatch(nextKnockout[stageKey]),
    };
  }

  function getMatchDisplayStatus(match) {
    const normalizedStatus = String(match?.status || "scheduled").toLowerCase();
    if (isMatchCompleted(match)) {
      return {
        status: "completed",
        label: tournamentText.matchStatusCompleted,
      };
    }

    if (
      normalizedStatus === "started" ||
      normalizedStatus === "in_progress" ||
      isMatchInProgressFromScore(match)
    ) {
      return {
        status: "in_progress",
        label: tournamentText.matchStatusStarted,
      };
    }

    return {
      status: "scheduled",
      label: tournamentText.matchStatusScheduled,
    };
  }

  function buildTournamentRoundRobinRounds(group) {
    const groupTeams = (group.teams || []).map((team, index) => ({
      id: team.id || "",
      slot: team.slot || `${group.code}${index + 1}`,
      label: getTournamentPreviewTeamName(team),
    }));

    if (groupTeams.length < 2) return [];

    const rotation =
      groupTeams.length % 2 === 0 ? [...groupTeams] : [...groupTeams, null];
    const rounds = [];
    const roundCount = rotation.length - 1;
    const half = rotation.length / 2;

    for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
      const roundMatches = [];

      for (let pairIndex = 0; pairIndex < half; pairIndex += 1) {
        const first = rotation[pairIndex];
        const second = rotation[rotation.length - 1 - pairIndex];
        if (!first || !second) continue;

        const shouldFlip = roundIndex % 2 === 1;
        roundMatches.push({
          teamAId: shouldFlip ? second.id : first.id,
          teamBId: shouldFlip ? first.id : second.id,
          teamA: shouldFlip ? second.label : first.label,
          teamB: shouldFlip ? first.label : second.label,
          sourceA: shouldFlip ? second.slot : first.slot,
          sourceB: shouldFlip ? first.slot : second.slot,
        });
      }

      rounds.push(roundMatches);
      rotation.splice(1, 0, rotation.pop());
    }

    return rounds;
  }

  function buildTournamentHallSchedule(tournament) {
    const safeTournament = tournament ? applyTournamentDefaults(tournament) : null;
    if (!safeTournament) {
      return {
        batches: [],
        courtCount: 1,
        groups: [],
        knockoutPreview: {},
        seriesPlans: [],
      };
    }

    const scheduleCourtCount = Math.max(
      1,
      Math.floor(Number(safeTournament.courtCount || 3))
    );
    const scheduleGroupMinutes = Math.max(
      1,
      Number(safeTournament.groupMatchMinutes || 12)
    );
    const schedulePlayoffMinutes = Math.max(
      1,
      Number(safeTournament.playoffMatchMinutes || 15)
    );
    const scheduleBreakMinutes = Math.max(
      0,
      Number(safeTournament.breakMinutes || 0)
    );
    const hasExplicitSeries = hasExplicitTournamentSeries(safeTournament);
    const orderedSeries = getOrderedTournamentSeriesClasses(
      safeTournament,
      language
    );
    const matchLookup = getTournamentMatchLookup(safeTournament);

    const pickNextScheduleMatch = (
      queues,
      rotationStart,
      usedGroups,
      usedTeams,
      batchItems,
      allowSameGroup,
      allowTeamRepeat
    ) => {
      for (let offset = 0; offset < queues.length; offset += 1) {
        const queueIndex = (rotationStart + offset) % queues.length;
        const groupQueue = queues[queueIndex];
        if (!groupQueue.queue.length) continue;
        if (!allowSameGroup && usedGroups.has(groupQueue.groupId)) continue;

        const matchIndex = groupQueue.queue.findIndex(
          (match) =>
            allowTeamRepeat ||
            (!usedTeams.has(`${match.seriesId}:${match.teamA}`) &&
              !usedTeams.has(`${match.seriesId}:${match.teamB}`))
        );
        if (matchIndex === -1) continue;

        const [match] = groupQueue.queue.splice(matchIndex, 1);
        batchItems.push(match);
        usedGroups.add(groupQueue.groupId);
        usedTeams.add(`${match.seriesId}:${match.teamA}`);
        usedTeams.add(`${match.seriesId}:${match.teamB}`);
        return true;
      }

      return false;
    };

    const buildSeriesPlan = (series, seriesIndex) => {
      const seriesTournament = getTournamentForSeries(
        safeTournament,
        series,
        language
      );
      const groups =
        Array.isArray(seriesTournament.groups) &&
        seriesTournament.groups.length
          ? seriesTournament.groups
          : buildManualGroups(safeTournament, series);
      const knockoutPreview = buildManualKnockout({
        ...seriesTournament,
        groups,
      });
      const groupDuration = Math.max(
        1,
        Number(series.groupMatchMinutes || scheduleGroupMinutes)
      );
      const playoffDuration = Math.max(
        1,
        Number(series.playoffMatchMinutes || schedulePlayoffMinutes)
      );
      const groupScheduleQueues = groups
        .map((group, groupIndex) => {
          const groupCode = group.code || getTournamentGroupCode(groupIndex);
          const groupColor = getTournamentGroupColor(groupCode);
          const queue = buildTournamentRoundRobinRounds({
            ...group,
            code: groupCode,
          }).flatMap((roundMatches, roundIndex) =>
            roundMatches.map((match, matchIndex) => {
              const legacyId = `schedule-${group.id}-${roundIndex}-${matchIndex}`;
              const explicitId = `schedule-${series.id}-${group.id}-${roundIndex}-${matchIndex}`;
              return {
                id: hasExplicitSeries ? explicitId : legacyId,
                seriesId: hasExplicitSeries ? series.id : "",
                seriesName: hasExplicitSeries ? series.name : "",
                playersPerTeam: series.playersPerTeam || "",
                phase: "group",
                stage: "group",
                groupId: group.id,
                groupName: group.name,
                groupCode,
                groupColor,
                roundNumber: roundIndex + 1,
                round: hasExplicitSeries
                  ? `${series.name} - ${group.name} R${roundIndex + 1}`
                  : `${group.name} R${roundIndex + 1}`,
                teamAId: match.teamAId,
                teamBId: match.teamBId,
                teamA: match.teamA,
                teamB: match.teamB,
                sourceA: match.sourceA,
                sourceB: match.sourceB,
              };
            })
          );

          return {
            groupId: `${series.id}:${group.id}`,
            groupCode,
            queue,
          };
        })
        .filter((groupQueue) => groupQueue.queue.length > 0);

      const balancedGroupBatches = [];
      let groupRotationStart = 0;
      while (groupScheduleQueues.some((groupQueue) => groupQueue.queue.length)) {
        const batchItems = [];
        const usedGroups = new Set();
        const usedTeams = new Set();

        while (batchItems.length < scheduleCourtCount) {
          if (
            pickNextScheduleMatch(
              groupScheduleQueues,
              groupRotationStart,
              usedGroups,
              usedTeams,
              batchItems,
              false,
              false
            ) ||
            pickNextScheduleMatch(
              groupScheduleQueues,
              groupRotationStart,
              usedGroups,
              usedTeams,
              batchItems,
              true,
              false
            ) ||
            pickNextScheduleMatch(
              groupScheduleQueues,
              groupRotationStart,
              usedGroups,
              usedTeams,
              batchItems,
              true,
              true
            )
          ) {
            continue;
          }
          break;
        }

        if (!batchItems.length) break;
        balancedGroupBatches.push(batchItems);
        groupRotationStart =
          (groupRotationStart + 1) % Math.max(1, groupScheduleQueues.length);
      }

      const scheduleKnockoutMatches = getOrderedKnockoutScheduleMatches(
        knockoutPreview,
        seriesTournament
      );
      const knockoutScheduleItems = scheduleKnockoutMatches.map((match) => {
        const baseId = `schedule-${match.id}`;
        const explicitId = `schedule-${series.id}-${match.id}`;
        const phase =
          match.stage === "third_place"
            ? "thirdPlace"
            : match.stage === "semifinal"
              ? "semifinal"
              : match.stage === "final"
                ? "final"
                : match.stage || "knockout";
        return {
          id: hasExplicitSeries ? explicitId : baseId,
          seriesId: hasExplicitSeries ? series.id : "",
          seriesName: hasExplicitSeries ? series.name : "",
          playersPerTeam: series.playersPerTeam || "",
          phase,
          stage: match.stage || "knockout",
          stageOrder: match.stageOrder || getTournamentStageOrder(match.stage),
          round: hasExplicitSeries ? `${series.name} - ${match.round}` : match.round,
          teamA: match.sourceA || match.teamA,
          teamB: match.sourceB || match.teamB,
          sourceA: match.sourceA,
          sourceB: match.sourceB,
        };
      });
      const knockoutScheduleBatches = buildKnockoutScheduleBatches(
        knockoutScheduleItems,
        scheduleCourtCount
      );

      return {
        series,
        seriesIndex,
        groups,
        knockoutPreview,
        batches: [
          ...balancedGroupBatches.map((items) => ({
            stage: "group",
            seriesId: series.id,
            duration: groupDuration,
            items,
          })),
          ...knockoutScheduleBatches.map((items) => ({
            stage: "knockout",
            seriesId: series.id,
            duration: playoffDuration,
            items,
          })),
        ],
      };
    };

    const seriesPlans = orderedSeries.map(buildSeriesPlan);
    const mergePlansWithOverlap = (plans) => {
      const pending = plans.map((plan) => [...plan.batches]);
      const merged = [];
      while (pending.some((batches) => batches.length > 0)) {
        const items = [];
        let duration = 0;
        let stage = "group";

        pending.forEach((batches) => {
          if (!batches.length || items.length >= scheduleCourtCount) return;
          const nextBatch = batches[0];
          const available = scheduleCourtCount - items.length;
          items.push(...nextBatch.items.slice(0, available));
          duration = Math.max(duration, Number(nextBatch.duration || 0));
          stage = nextBatch.stage === "knockout" ? "knockout" : stage;
          if (nextBatch.items.length <= available) {
            batches.shift();
          } else {
            batches[0] = {
              ...nextBatch,
              items: nextBatch.items.slice(available),
            };
          }
        });

        if (!items.length) break;
        merged.push({
          stage,
          duration: duration || scheduleGroupMinutes,
          items,
        });
      }
      return merged;
    };

    const scheduleBatches =
      safeTournament.seriesScheduleMode === "overlap"
        ? mergePlansWithOverlap(seriesPlans)
        : seriesPlans.flatMap((plan) => plan.batches);
    const batches = [];
    let scheduleCursor = parseTournamentScheduleStart(safeTournament.startTime);

    scheduleBatches.forEach((scheduleBatch, index) => {
      const duration = Math.max(
        1,
        Number(
          scheduleBatch.duration ||
            (scheduleBatch.stage === "knockout"
              ? schedulePlayoffMinutes
              : scheduleGroupMinutes)
        )
      );

      const batchNumber = index + 1;
      batches.push({
        id: `schedule-batch-${index + 1}`,
        number: batchNumber,
        time: formatTournamentScheduleTime(scheduleCursor),
        duration,
        items: Array.from(
          { length: scheduleCourtCount },
          (_, courtIndex) => {
            const scheduleItem = scheduleBatch.items[courtIndex];
            if (!scheduleItem) return null;

            return mergeScheduleItemWithSavedMatch(
              {
                ...scheduleItem,
                scheduleBatch: batchNumber,
                scheduleCourt: courtIndex + 1,
                court: courtIndex + 1,
                scheduleOrder: index * scheduleCourtCount + courtIndex,
                order: index * scheduleCourtCount + courtIndex,
                index: index * scheduleCourtCount + courtIndex,
                startTime: formatTournamentScheduleTime(scheduleCursor),
                durationMin: duration,
                manualOrder:
                  scheduleItem.manualOrder ??
                  index * scheduleCourtCount + courtIndex,
              },
              matchLookup
            );
          }
        ),
      });

      scheduleCursor += duration + scheduleBreakMinutes;
    });

    return {
      batches: applyTournamentScheduleOverrides(batches, scheduleCourtCount),
      courtCount: scheduleCourtCount,
      groups: seriesPlans.flatMap((plan) => plan.groups),
      knockoutPreview: seriesPlans[0]?.knockoutPreview || {},
      seriesPlans,
    };
  }

  function generateTournamentKnockout() {
    if (!activeTournament) return;

    if (hasExplicitTournamentSeries(activeTournament)) {
      setTournaments((prev) =>
        prev.map((tournament) => {
          if (tournament.id !== activeTournament.id) return tournament;
          const classes = getTournamentSeriesClasses(tournament, language);

          return {
            ...tournament,
            series: (tournament.series || []).map((series) => {
              const normalizedSeries =
                classes.find((item) => String(item.id) === String(series.id)) ||
                normalizeTournamentSeriesItem(series, 0, tournament, language);
              const seriesTournament = getTournamentForSeries(
                tournament,
                normalizedSeries,
                language
              );
              const nextKnockout = buildManualKnockout(seriesTournament);

              return {
                ...series,
                bracketSize: Math.max(
                  2,
                  Number(normalizedSeries.groupCount || 2) * 2
                ),
                knockout: mergeKnockoutPreservingResults(
                  series.knockout || {},
                  nextKnockout
                ),
              };
            }),
          };
        })
      );
      setTournamentActionMessage(tournamentText.regenerateStructure);
      return;
    }

    const nextKnockout = buildManualKnockout(activeTournament);
    updateActiveTournament({
      bracketSize: Math.max(2, Number(activeTournament.groupCount || 2) * 2),
      knockout: mergeKnockoutPreservingResults(
        activeTournament.knockout || {},
        nextKnockout
      ),
    });
    setTournamentActionMessage(tournamentText.regenerateStructure);
  }

  function generateTournamentMatches() {
    if (!activeTournament) return;
    const seriesClasses = hasExplicitTournamentSeries(activeTournament)
      ? getTournamentSeriesClasses(activeTournament, language)
      : [getTournamentSeriesById(activeTournament, "", language)].filter(Boolean);
    const nextMatches = [];
    let manualOrderIndex = 0;
    const existingById = new Map(
      (Array.isArray(activeTournament.matches) ? activeTournament.matches : [])
        .filter((match) => match?.id)
        .map((match) => [match.id, match])
    );
    const mergeGeneratedMatch = (match) => {
      const existing = existingById.get(match.id);
      if (!existing) return match;
      const hasResult =
        isMatchCompleted(existing) ||
        getMatchDisplayStatus(existing).status === "in_progress" ||
        hasScoreValue(existing.scoreA) ||
        hasScoreValue(existing.scoreB);

      return hasResult
        ? {
            ...match,
            ...existing,
            seriesId: match.seriesId,
            seriesName: match.seriesName,
            playersPerTeam: match.playersPerTeam,
            phase: match.phase,
            stage: match.stage,
            groupId: match.groupId,
            groupName: match.groupName,
            groupCode: match.groupCode,
            teamA: match.teamA,
            teamB: match.teamB,
            teamAId: match.teamAId,
            teamBId: match.teamBId,
          }
        : match;
    };

    seriesClasses.forEach((series) => {
      const seriesTournament = getTournamentForSeries(
        activeTournament,
        series,
        language
      );
      const groups = Array.isArray(seriesTournament.groups)
        ? seriesTournament.groups
        : [];
      const useSeriesFields = hasExplicitTournamentSeries(activeTournament);

    groups.forEach((group) => {
      const groupCode = group.code || "";
      const groupTeams = (group.teams || [])
        .map((team, teamIndex) => {
          const slot =
            team.slot ||
            (groupCode ? `${groupCode}${teamIndex + 1}` : `T${teamIndex + 1}`);
          const name = String(team.name || "").trim() || slot;

          return {
            ...team,
            id: team.id || `${group.id || groupCode}-slot-${slot}`,
            slot,
            name,
          };
        })
        .filter((team) => String(team.name || team.slot || "").trim());

      for (let i = 0; i < groupTeams.length; i += 1) {
        for (let j = i + 1; j < groupTeams.length; j += 1) {
          const match = {
            id: useSeriesFields
              ? `gm-${series.id}-${group.id}-${i}-${j}`
              : `gm-${activeTournament.id}-${group.id}-${i}-${j}`,
            seriesId: useSeriesFields ? series.id : "",
            seriesName: useSeriesFields ? series.name : "",
            playersPerTeam: useSeriesFields ? series.playersPerTeam : "",
            phase: "group",
            stage: "group",
            groupId: group.id,
            groupName: group.name,
            groupCode: group.code || "",
            sourceRound: "group",
            manualOrder: manualOrderIndex,
            scheduleOrder: manualOrderIndex,
            order: manualOrderIndex,
            index: manualOrderIndex,
            court: "",
            startTime: "",
            durationMin: Math.max(
              1,
              Number(series.groupMatchMinutes || activeTournament.groupMatchMinutes || 12)
            ),
            teamAId: groupTeams[i].id || groupTeams[i].slot || "",
            teamBId: groupTeams[j].id || groupTeams[j].slot || "",
            teamA: groupTeams[i].name,
            teamB: groupTeams[j].name,
            scoreA: "",
            scoreB: "",
            status: "scheduled",
          };
          nextMatches.push(mergeGeneratedMatch(match));
          manualOrderIndex += 1;
        }
      }
    });

    if (!nextMatches.length && !useSeriesFields) {
      const teams = Array.isArray(activeTournament.teams)
        ? activeTournament.teams
        : [];
      for (let i = 0; i < teams.length; i += 1) {
        for (let j = i + 1; j < teams.length; j += 1) {
          const match = {
            id: `tm-${activeTournament.id}-${i}-${j}`,
            stage: "group",
            phase: "group",
            sourceRound: "group",
            manualOrder: manualOrderIndex,
            scheduleOrder: manualOrderIndex,
            order: manualOrderIndex,
            index: manualOrderIndex,
            seriesId: "",
            seriesName: "",
            court: "",
            startTime: "",
            durationMin: Math.max(1, Number(activeTournament.groupMatchMinutes || 12)),
            teamAId: teams[i].id || "",
            teamBId: teams[j].id || "",
            teamA: teams[i].name,
            teamB: teams[j].name,
            scoreA: "",
            scoreB: "",
            status: "scheduled",
          };
          nextMatches.push(mergeGeneratedMatch(match));
          manualOrderIndex += 1;
        }
      }
    }
    });

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
              series: hasExplicitTournamentSeries(tournament)
                ? (tournament.series || []).map((series) => ({
                    ...series,
                    matches: nextMatches.filter(
                      (match) => String(match.seriesId || "") === String(series.id)
                    ),
                  }))
                : tournament.series,
            }
      )
    );
    setTournamentActionMessage(tournamentText.matchesGenerated);
  }

  function findScheduleItemByMatchId(tournament, matchId) {
    const schedule = buildTournamentHallSchedule(tournament);
    for (const batch of schedule.batches || []) {
      for (const item of batch.items || []) {
        if (item && item.id === matchId) return item;
      }
    }

    return null;
  }

  function createTournamentMatchFromScheduleItem(tournament, scheduleItem, overrides = {}) {
    if (!scheduleItem) return null;

    return {
      id: scheduleItem.id,
      seriesId: scheduleItem.seriesId || "",
      seriesName: scheduleItem.seriesName || "",
      playersPerTeam: scheduleItem.playersPerTeam || "",
      phase: scheduleItem.phase || scheduleItem.stage || "group",
      stage: scheduleItem.stage || "group",
      groupId: scheduleItem.groupId || "",
      groupName: scheduleItem.groupName || "",
      groupCode: scheduleItem.groupCode || "",
      sourceRound: scheduleItem.sourceRound || scheduleItem.stage || "",
      sourceA: scheduleItem.sourceA || "",
      sourceB: scheduleItem.sourceB || "",
      manualOrder: scheduleItem.manualOrder ?? scheduleItem.scheduleOrder,
      scheduleOrder: scheduleItem.scheduleOrder,
      order: scheduleItem.order ?? scheduleItem.scheduleOrder,
      index: scheduleItem.index ?? scheduleItem.scheduleOrder,
      scheduleBatch: scheduleItem.scheduleBatch,
      scheduleCourt: scheduleItem.scheduleCourt,
      court: scheduleItem.court || scheduleItem.scheduleCourt,
      startTime: scheduleItem.startTime || scheduleItem.scheduleTime || "",
      durationMin: scheduleItem.durationMin || scheduleItem.duration || "",
      stageOrder:
        scheduleItem.stageOrder ?? getTournamentStageOrder(scheduleItem.stage),
      teamAId:
        scheduleItem.teamAId ||
        findTournamentTeamIdByName(tournament, scheduleItem.teamA),
      teamBId:
        scheduleItem.teamBId ||
        findTournamentTeamIdByName(tournament, scheduleItem.teamB),
      teamA: scheduleItem.teamA || "",
      teamB: scheduleItem.teamB || "",
      scoreA: "",
      scoreB: "",
      status: "scheduled",
      ...overrides,
    };
  }

  function upsertScheduleMatch(matches, tournament, scheduleItem, patch) {
    if (!scheduleItem) return Array.isArray(matches) ? matches : [];

    const safeMatches = Array.isArray(matches) ? matches : [];
    const matchId = scheduleItem.id;
    const existingIndex = safeMatches.findIndex((match) => match.id === matchId);
    const baseMatch =
      existingIndex >= 0
        ? safeMatches[existingIndex]
        : createTournamentMatchFromScheduleItem(tournament, scheduleItem);
    if (!baseMatch) return safeMatches;

    const nextMatch = {
      ...baseMatch,
      ...patch,
      id: baseMatch.id || matchId,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      return safeMatches.map((match, index) =>
        index === existingIndex ? nextMatch : match
      );
    }

    return [...safeMatches, nextMatch];
  }

  function getScheduleSlotPlacement(batch, batchIndex, courtIndex, courtCount) {
    const safeCourtCount = Math.max(1, Number(courtCount || 1));
    const safeBatchIndex = Math.max(0, Number(batchIndex) || 0);
    const safeCourtIndex = Math.max(
      0,
      Math.min(safeCourtCount - 1, Number(courtIndex) || 0)
    );
    const scheduleOrder = safeBatchIndex * safeCourtCount + safeCourtIndex;
    const scheduleBatch = batch?.number || safeBatchIndex + 1;
    const scheduleCourt = safeCourtIndex + 1;

    return {
      manualOrder: scheduleOrder,
      scheduleOrder,
      scheduleBatch,
      batch: scheduleBatch,
      scheduleCourt,
      courtIndex: safeCourtIndex,
      courtName: `${tournamentText.courtLabel} ${scheduleCourt}`,
      scheduleTime: batch?.time || "",
      startTime: batch?.time || "",
      duration: batch?.duration || "",
    };
  }

  function flattenTournamentScheduleCells(tournament) {
    const schedule = buildTournamentHallSchedule(tournament);
    const courtCount = Math.max(
      1,
      Number(schedule.courtCount || tournament?.courtCount || 1)
    );

    return (schedule.batches || []).flatMap((batch, batchIndex) =>
      Array.from({ length: courtCount }, (_, courtIndex) => ({
        batch,
        batchIndex,
        courtIndex,
        item: (batch.items || [])[courtIndex] || null,
        placement: getScheduleSlotPlacement(
          batch,
          batchIndex,
          courtIndex,
          courtCount
        ),
      }))
    );
  }

  function startScheduleMoveMode(matchId, mode = "swap") {
    if (!activeTournament) return;

    setPendingScheduleMoveMode(mode === "insert" ? "insert" : "swap");
    setSelectedMoveMatchId((current) => {
      const next = current === matchId ? "" : matchId;
      if (!next) setPendingScheduleMoveMode("swap");
      return next;
    });
    setActiveScheduleEditMatchId("");
    setTournamentActionMessage(tournamentText.selectTargetSlot);
  }

  function isMatchLiveOrCompleted(match) {
    return (
      isMatchCompleted(match) ||
      getMatchDisplayStatus(match).status === "in_progress"
    );
  }

  function insertScheduleSelectionAtTarget(
    tournament,
    sourceCell,
    targetCell,
    courtCount
  ) {
    const targetCourt = targetCell.placement.scheduleCourt;
    const targetOrder = targetCell.placement.scheduleOrder;
    const impactedCells = flattenTournamentScheduleCells(tournament)
      .filter(
        (cell) =>
          targetCell.item &&
          cell.item &&
          cell.item.id !== sourceCell.item.id &&
          cell.placement.scheduleCourt === targetCourt &&
          cell.placement.scheduleOrder >= targetOrder
      )
      .sort(
        (a, b) => b.placement.scheduleOrder - a.placement.scheduleOrder
      );

    const hasProtectedImpact = impactedCells.some((cell) =>
      isMatchLiveOrCompleted(cell.item)
    );
    if (
      hasProtectedImpact &&
      typeof window !== "undefined" &&
      !window.confirm(tournamentText.confirmPushResultMatches)
    ) {
      return tournament.matches || [];
    }

    let nextMatches = tournament.matches || [];
    impactedCells.forEach((cell) => {
      const nextOrder = cell.placement.scheduleOrder + courtCount;
      const nextPlacement = {
        ...cell.placement,
        manualOrder: nextOrder,
        scheduleOrder: nextOrder,
        scheduleBatch: Math.floor(nextOrder / courtCount) + 1,
        batch: Math.floor(nextOrder / courtCount) + 1,
      };
      nextMatches = upsertScheduleMatch(
        nextMatches,
        tournament,
        cell.item,
        nextPlacement
      );
    });

    return upsertScheduleMatch(
      nextMatches,
      tournament,
      sourceCell.item,
      {
        ...targetCell.placement,
        unplaced: false,
        needsManualPlacement: false,
        needsReschedule: false,
        courtBlockId: "",
      }
    );
  }

  function getScheduleTimeMinutes(value) {
    const [hours, minutes] = String(value || "00:00")
      .split(":")
      .map((part) => Number(part));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
    return hours * 60 + minutes;
  }

  function isCourtBlockActiveForSlot(block, court, slotTime, slotDuration) {
    if (!block || block.active === false) return false;
    if (Number(block.court || 0) !== Number(court || 0)) return false;

    const slotStart = getScheduleTimeMinutes(slotTime);
    const slotEnd = slotStart + Math.max(1, Number(slotDuration || 1));
    const blockStart = getScheduleTimeMinutes(block.startTime);
    const rawBlockEnd = getScheduleTimeMinutes(block.endTime);
    const blockEnd =
      block.restOfDay || block.mode === "restOfDay"
        ? 24 * 60
        : rawBlockEnd <= blockStart
          ? blockStart + 1
          : rawBlockEnd;

    return slotStart < blockEnd && slotEnd > blockStart;
  }

  function getCourtBlockForSlot(courtBlocks, court, slotTime, slotDuration) {
    return (Array.isArray(courtBlocks) ? courtBlocks : []).find((block) =>
      isCourtBlockActiveForSlot(block, court, slotTime, slotDuration)
    );
  }

  function getCourtBlockKey(block) {
    return [
      Number(block?.court || 0),
      String(block?.startTime || "").trim(),
      String(block?.endTime || "").trim(),
      block?.restOfDay || block?.mode === "restOfDay" ? "rest" : "delay",
      String(block?.reason || "").trim().toLowerCase(),
    ].join("|");
  }

  function getActiveCourtBlocks(tournament) {
    const seen = new Set();
    return (Array.isArray(tournament?.courtBlocks) ? tournament.courtBlocks : [])
      .filter((block) => block && block.active !== false)
      .filter((block) => {
        const key = getCourtBlockKey(block);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function createScheduleItemFromMatch(match) {
    if (!match) return null;

    return {
      ...match,
      id: match.id,
      matchId: match.id,
      teamA: match.teamA || match.sourceA || "",
      teamB: match.teamB || match.sourceB || "",
      sourceA: match.sourceA || match.teamA || "",
      sourceB: match.sourceB || match.teamB || "",
      stage: match.stage || "group",
      stageOrder: match.stageOrder ?? getTournamentStageOrder(match.stage),
    };
  }

  function getBlockAffectedMatches(tournament, block) {
    const blockIds = new Set(
      (Array.isArray(block?.mergedIds) && block.mergedIds.length
        ? block.mergedIds
        : [block?.id]
      ).filter(Boolean)
    );
    const affectedIds = new Set(
      Array.isArray(block?.affectedMatchIds) ? block.affectedMatchIds : []
    );

    return (Array.isArray(tournament?.matches) ? tournament.matches : []).filter(
      (match) =>
        affectedIds.has(match.id) ||
        blockIds.has(match.courtBlockId) ||
        blockIds.has(match.originalCourtBlockId)
    );
  }

  function getUnplacedScheduleMatches(tournament) {
    return (Array.isArray(tournament?.matches) ? tournament.matches : []).filter(
      (match) => match?.unplaced || match?.needsManualPlacement
    );
  }

  function getCourtBlockSummaries(tournament) {
    const blocks = getActiveCourtBlocks(tournament);

    return blocks.map((block) => {
      const sameKeyIds = (Array.isArray(tournament?.courtBlocks)
        ? tournament.courtBlocks
        : []
      )
        .filter(
          (candidate) =>
            candidate &&
            candidate.active !== false &&
            getCourtBlockKey(candidate) === getCourtBlockKey(block)
        )
        .map((candidate) => candidate.id)
        .filter(Boolean);
      const mergedBlock = {
        ...block,
        mergedIds: sameKeyIds.length ? sameKeyIds : [block.id].filter(Boolean),
      };
      return {
        block: mergedBlock,
        affectedMatches: getBlockAffectedMatches(tournament, mergedBlock),
      };
    });
  }

  function findFreeScheduleCell(cells, courtBlocks, sourceCell, preference) {
    const blocked = (cell) =>
      getCourtBlockForSlot(
        courtBlocks,
        cell.placement.scheduleCourt,
        cell.batch?.time,
        cell.batch?.duration
      );
    const isFree = (cell) =>
      cell &&
      !cell.item &&
      !blocked(cell) &&
      cell.placement.scheduleOrder !== sourceCell?.placement?.scheduleOrder;

    if (preference === "same-time-other-court") {
      const sameTime = cells.find(
        (cell) =>
          isFree(cell) &&
          cell.batchIndex === sourceCell.batchIndex &&
          cell.placement.scheduleCourt !== sourceCell.placement.scheduleCourt
      );
      if (sameTime) return sameTime;
    }

    return (
      cells.find(
        (cell) =>
          isFree(cell) &&
          cell.placement.scheduleOrder > sourceCell.placement.scheduleOrder
      ) ||
      null
    );
  }

  function applyCourtBlockToTournament(tournament, block, mode = "manual") {
    const cells = flattenTournamentScheduleCells(tournament);
    const affectedCells = cells.filter(
      (cell) =>
        cell.item &&
        isCourtBlockActiveForSlot(
          block,
          cell.placement.scheduleCourt,
          cell.batch?.time,
          cell.batch?.duration
        )
    );
    const affectedMatchIds = affectedCells
      .map((cell) => cell.item?.id)
      .filter(Boolean);
    const blockWithAffected = {
      ...block,
      affectedMatchIds,
    };
    const nextCourtBlocks = [
      ...(Array.isArray(tournament.courtBlocks) ? tournament.courtBlocks : []),
      blockWithAffected,
    ];
    let nextMatches = tournament.matches || [];

    affectedCells.forEach((cell) => {
      nextMatches = upsertScheduleMatch(
        nextMatches,
        tournament,
        cell.item,
        {
          needsReschedule: true,
          needsManualPlacement: mode === "manual" || block.restOfDay,
          unplaced: mode === "manual" || block.restOfDay,
          courtBlockId: block.id,
          originalCourtBlockId: block.id,
          originalScheduleOrder:
            cell.item.originalScheduleOrder ?? cell.placement.scheduleOrder,
          originalManualOrder:
            cell.item.originalManualOrder ?? cell.placement.manualOrder,
          originalScheduleBatch:
            cell.item.originalScheduleBatch ?? cell.placement.scheduleBatch,
          originalScheduleCourt:
            cell.item.originalScheduleCourt ?? cell.placement.scheduleCourt,
          originalCourtIndex:
            cell.item.originalCourtIndex ?? cell.placement.courtIndex,
          originalCourtName:
            cell.item.originalCourtName ?? cell.placement.courtName,
          originalScheduleTime:
            cell.item.originalScheduleTime ?? cell.placement.scheduleTime,
          originalDuration:
            cell.item.originalDuration ?? cell.placement.duration,
        }
      );
    });

    const nextTournament = {
      ...tournament,
      courtBlocks: nextCourtBlocks,
      matches: nextMatches,
    };

    if (mode === "auto" || mode === "push") {
      return resolveCourtBlockInTournament(nextTournament, blockWithAffected, mode);
    }

    return nextTournament;
  }

  function getOriginalPlacementForMatch(match, fallbackPlacement = {}) {
    const readNumber = (value, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const scheduleOrder = readNumber(
      match?.originalScheduleOrder,
      readNumber(fallbackPlacement.scheduleOrder, 0)
    );
    const scheduleCourt = readNumber(
      match?.originalScheduleCourt,
      readNumber(fallbackPlacement.scheduleCourt, 1)
    );
    const courtCount = Math.max(
      1,
      readNumber(activeTournament?.courtCount, readNumber(fallbackPlacement.courtCount, 1))
    );
    const scheduleBatch = readNumber(
      match?.originalScheduleBatch,
      Math.floor(scheduleOrder / courtCount) + 1
    );

    return {
      manualOrder: readNumber(match?.originalManualOrder, scheduleOrder),
      scheduleOrder,
      scheduleBatch,
      batch: scheduleBatch,
      scheduleCourt,
      courtIndex:
        Number.isFinite(Number(match?.originalCourtIndex))
          ? Number(match.originalCourtIndex)
          : scheduleCourt - 1,
      courtName:
        match?.originalCourtName || `${tournamentText.courtLabel} ${scheduleCourt}`,
      scheduleTime: match?.originalScheduleTime || "",
      startTime: match?.originalScheduleTime || "",
      duration: match?.originalDuration || "",
    };
  }

  function resolveCourtBlockInTournament(tournament, block, mode) {
    const blockIds = new Set(
      (Array.isArray(block?.mergedIds) && block.mergedIds.length
        ? block.mergedIds
        : [block?.id]
      ).filter(Boolean)
    );
    const affectedMatches = getBlockAffectedMatches(tournament, block)
      .filter((match) => match && !isMatchLiveOrCompleted(match))
      .sort(
        (a, b) =>
          Number(a.originalScheduleOrder ?? a.scheduleOrder ?? 0) -
          Number(b.originalScheduleOrder ?? b.scheduleOrder ?? 0)
      );
    if (!affectedMatches.length) return tournament;

    let workingTournament = tournament;
    let nextMatches = tournament.matches || [];
    const courtCount = Math.max(1, Number(tournament.courtCount || 1));
    const blockEnd = block.restOfDay
      ? 24 * 60
      : getScheduleTimeMinutes(block.endTime);
    const movedIds = new Set();

    if (mode === "push" && block.restOfDay) {
      return tournament;
    }

    affectedMatches.forEach((match) => {
      const cells = flattenTournamentScheduleCells({
        ...workingTournament,
        matches: nextMatches,
      });
      const originalPlacement = getOriginalPlacementForMatch(match);
      const sourceCell = {
        item: createScheduleItemFromMatch(match),
        placement: originalPlacement,
        batchIndex: Math.max(
          0,
          Number(match.originalScheduleBatch || match.scheduleBatch || 1) - 1
        ),
      };
      let targetCell = null;

      if (mode === "auto") {
        targetCell =
          findFreeScheduleCell(cells, workingTournament.courtBlocks, sourceCell, "same-time-other-court") ||
          findFreeScheduleCell(cells, workingTournament.courtBlocks, sourceCell, "next-free");
      }

      if (mode === "push") {
        targetCell = cells.find((cell) => {
          const cellTime = getScheduleTimeMinutes(cell.batch?.time);
          return (
            cell.placement.scheduleCourt === Number(block.court || 1) &&
            cell.placement.scheduleOrder >= originalPlacement.scheduleOrder &&
            cellTime >= blockEnd &&
            !getCourtBlockForSlot(
              workingTournament.courtBlocks,
              cell.placement.scheduleCourt,
              cell.batch?.time,
              cell.batch?.duration
            )
          );
        });

        if (!targetCell) {
          const sameCourtCells = cells
            .filter(
              (cell) =>
                cell.placement.scheduleCourt === Number(block.court || 1)
            )
            .sort(
              (a, b) =>
                a.placement.scheduleOrder - b.placement.scheduleOrder
            );
          const lastSameCourtCell =
            sameCourtCells[sameCourtCells.length - 1] || cells[cells.length - 1];
          const nextOrder =
            (lastSameCourtCell?.placement?.scheduleOrder ?? 0) + courtCount;
          targetCell = {
            batch: lastSameCourtCell?.batch || {},
            batchIndex: Math.floor(nextOrder / courtCount),
            courtIndex: Math.max(0, Number(block.court || 1) - 1),
            item: null,
            placement: {
              ...(lastSameCourtCell?.placement || {}),
              manualOrder: nextOrder,
              scheduleOrder: nextOrder,
              scheduleBatch: Math.floor(nextOrder / courtCount) + 1,
              batch: Math.floor(nextOrder / courtCount) + 1,
              scheduleCourt: Number(block.court || 1),
              courtIndex: Math.max(0, Number(block.court || 1) - 1),
              courtName: `${tournamentText.courtLabel} ${Number(block.court || 1)}`,
            },
          };
        }
      }

      if (!targetCell) return;

      nextMatches = insertScheduleSelectionAtTarget(
        {
          ...workingTournament,
          matches: nextMatches,
        },
        sourceCell,
        targetCell,
        courtCount
      );
      movedIds.add(match.id);
      workingTournament = {
        ...workingTournament,
        matches: nextMatches,
      };
    });

    nextMatches = nextMatches.map((match) =>
      movedIds.has(match.id) &&
      (blockIds.has(match.courtBlockId) || blockIds.has(match.originalCourtBlockId))
        ? {
            ...match,
            unplaced: false,
            needsManualPlacement: false,
            needsReschedule: false,
            courtBlockId: "",
          }
        : match
    );

    return {
      ...tournament,
      matches: nextMatches,
    };
  }

  function addCourtBlock(mode = "manual") {
    if (!activeTournament) return;
    const isRestOfDay = courtBlockDraft.mode === "restOfDay";
    const block = {
      id: `court-block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      court: Math.max(1, Number(courtBlockDraft.court || 1)),
      startTime: courtBlockDraft.startTime || activeTournament.startTime || "09:00",
      endTime: isRestOfDay
        ? "23:59"
        : courtBlockDraft.endTime || courtBlockDraft.startTime || "09:15",
      reason: courtBlockDraft.reason || "",
      mode: isRestOfDay ? "restOfDay" : "delay",
      restOfDay: isRestOfDay,
      active: true,
    };

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : applyCourtBlockToTournament(tournament, block, mode)
      )
    );
    setTournamentActionMessage(tournamentText.courtBlocked);
  }

  function resolveCourtBlock(blockId, mode) {
    if (!activeTournament || !blockId) return;

    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== activeTournament.id) return tournament;
        const block =
          (Array.isArray(tournament.courtBlocks) ? tournament.courtBlocks : [])
            .find((item) => item.id === blockId);
        if (!block) return tournament;
        return resolveCourtBlockInTournament(tournament, block, mode);
      })
    );
    setTournamentActionMessage(tournamentText.matchMoved);
  }

  function placeCourtBlockMatchesManually(blockId) {
    if (!activeTournament || !blockId) return;

    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== activeTournament.id) return tournament;
        const block =
          (Array.isArray(tournament.courtBlocks) ? tournament.courtBlocks : [])
            .find((item) => item.id === blockId);
        if (!block) return tournament;
        const affectedIds = new Set(
          getBlockAffectedMatches(tournament, block).map((match) => match.id)
        );
        return {
          ...tournament,
          matches: (tournament.matches || []).map((match) =>
            affectedIds.has(match.id)
              ? {
                  ...match,
                  needsReschedule: true,
                  needsManualPlacement: true,
                  unplaced: true,
                  courtBlockId: match.courtBlockId || block.id,
                }
              : match
          ),
        };
      })
    );
    setTournamentActionMessage(tournamentText.selectTargetSlot);
  }

  function removeCourtBlock(blockId) {
    if (!activeTournament || !blockId) return;

    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== activeTournament.id) return tournament;
        const blocks = Array.isArray(tournament.courtBlocks)
          ? tournament.courtBlocks
          : [];
        const targetBlock = blocks.find((block) => block.id === blockId);
        const targetKey = targetBlock ? getCourtBlockKey(targetBlock) : "";
        const removedIds = new Set(
          blocks
            .filter((block) =>
              targetKey
                ? getCourtBlockKey(block) === targetKey
                : block.id === blockId
            )
            .map((block) => block.id)
            .filter(Boolean)
        );

        return {
          ...tournament,
          courtBlocks: blocks.filter((block) => !removedIds.has(block.id)),
          matches: (tournament.matches || []).map((match) => {
            if (
              !removedIds.has(match.courtBlockId) &&
              !removedIds.has(match.originalCourtBlockId)
            ) {
              return match;
            }

            return {
              ...match,
              ...getOriginalPlacementForMatch(match),
              unplaced: false,
              needsManualPlacement: false,
              needsReschedule: false,
              courtBlockId: "",
            };
          }),
        };
      })
    );

    if (selectedMoveMatchId) {
      setSelectedMoveMatchId("");
      setPendingScheduleMoveMode("swap");
    }
    setTournamentActionMessage("");
  }

  function moveScheduleSelectionToTarget(
    targetMatchId,
    targetPlacement,
    moveModeOverride = ""
  ) {
    const sourceMatchId = selectedMoveMatchId;
    if (!activeTournament || !sourceMatchId) {
      return;
    }

    if (targetMatchId && targetMatchId === sourceMatchId) {
      setSelectedMoveMatchId("");
      setPendingScheduleMoveMode("swap");
      setTournamentActionMessage("");
      return;
    }

    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== activeTournament.id) return tournament;

        const cells = flattenTournamentScheduleCells(tournament);
        const sourceCell = cells.find((cell) => cell.item?.id === sourceMatchId);
        const sourceStoredMatch = (tournament.matches || []).find(
          (match) => match.id === sourceMatchId
        );
        const targetCell = targetMatchId
          ? cells.find((cell) => cell.item?.id === targetMatchId)
          : cells.find(
              (cell) =>
                cell.placement.scheduleOrder === targetPlacement?.scheduleOrder
            );

        if ((!sourceCell && !sourceStoredMatch) || !targetCell) return tournament;

        const courtCount = Math.max(1, Number(tournament.courtCount || 1));
        const sourceScheduleCell =
          sourceCell || {
            item: createScheduleItemFromMatch(sourceStoredMatch),
            placement: getOriginalPlacementForMatch(sourceStoredMatch),
          };
        const moveMode =
          moveModeOverride ||
          (pendingScheduleMoveMode === "place"
            ? targetCell.item
              ? "swap"
              : "insert"
            : pendingScheduleMoveMode);
        const nextMatches =
          moveMode === "insert"
            ? insertScheduleSelectionAtTarget(
                tournament,
                sourceScheduleCell,
                targetCell,
                courtCount
              )
            : (() => {
                let movedMatches = upsertScheduleMatch(
                  tournament.matches,
                  tournament,
                  sourceScheduleCell.item,
                  {
                    ...targetCell.placement,
                    unplaced: false,
                    needsManualPlacement: false,
                    needsReschedule: false,
                    courtBlockId: "",
                  }
                );

                if (targetCell.item) {
                  movedMatches = upsertScheduleMatch(
                    movedMatches,
                    tournament,
                    targetCell.item,
                    sourceCell
                      ? sourceCell.placement
                      : {
                          unplaced: true,
                          needsManualPlacement: true,
                          needsReschedule: true,
                          courtBlockId:
                            sourceStoredMatch?.courtBlockId ||
                            sourceStoredMatch?.originalCourtBlockId ||
                            "",
                        }
                  );
                }

                return movedMatches;
              })();

        if (nextMatches === tournament.matches) return tournament;

        return {
          ...tournament,
          matches: nextMatches,
        };
      })
    );

    setSelectedMoveMatchId("");
    setPendingScheduleMoveMode("swap");
    setActiveScheduleEditMatchId("");
    setTournamentActionMessage(
      (moveModeOverride || pendingScheduleMoveMode) === "insert"
        ? tournamentText.matchMoved
        : targetMatchId
          ? tournamentText.matchesSwapped
          : tournamentText.matchMoved
    );
  }

  function clearMatchResult(matchId) {
    if (!activeTournament) return;

    setMatchFinishWarnings((prev) => {
      if (!prev[matchId]) return prev;
      const next = { ...prev };
      delete next[matchId];
      return next;
    });

    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== activeTournament.id) return tournament;
        const scheduleItem = findScheduleItemByMatchId(tournament, matchId);
        if (!scheduleItem) return tournament;

        return {
          ...tournament,
          matches: upsertScheduleMatch(
            tournament.matches,
            tournament,
            scheduleItem,
            {
              scoreA: "",
              scoreB: "",
              status: "scheduled",
              completed: false,
              finalized: false,
              completedAt: "",
              winnerTeamId: "",
              resultType: "normal",
              resultNote: "",
              scoreTouched: false,
            }
          ),
        };
      })
    );
  }

  function markMatchWalkover(matchId, winnerSide, resultType, resultNote) {
    if (!activeTournament) return;

    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== activeTournament.id) return tournament;
        const scheduleItem = findScheduleItemByMatchId(tournament, matchId);
        if (!scheduleItem) return tournament;

        const existingMatch = (tournament.matches || []).find(
          (match) => match.id === matchId
        );
        const baseMatch =
          existingMatch ||
          createTournamentMatchFromScheduleItem(tournament, scheduleItem);
        if (!baseMatch) return tournament;

        const isWinnerA = winnerSide === "A";
        const scoreA = hasScoreValue(baseMatch.scoreA)
          ? String(baseMatch.scoreA)
          : isWinnerA
            ? "1"
            : "0";
        const scoreB = hasScoreValue(baseMatch.scoreB)
          ? String(baseMatch.scoreB)
          : isWinnerA
            ? "0"
            : "1";
        const winnerTeamId = isWinnerA
          ? baseMatch.teamAId || baseMatch.teamA || ""
          : baseMatch.teamBId || baseMatch.teamB || "";
        const completedMatch = {
          ...baseMatch,
          scoreA,
          scoreB,
          status: "completed",
          completed: true,
          finalized: true,
          completedAt: new Date().toISOString(),
          winnerTeamId,
          resultType: resultType || "walkover",
          resultNote: resultNote || "",
          scoreTouched: true,
        };
        let nextMatches = upsertScheduleMatch(
          tournament.matches,
          tournament,
          scheduleItem,
          completedMatch
        );
        const existingKnockout = tournament.knockout || {};
        const knockoutBase = existingKnockout.final
          ? existingKnockout
          : buildManualKnockout(tournament);

        return {
          ...tournament,
          matches: nextMatches,
          knockout: isKnockoutMatch(completedMatch)
            ? applyCompletedKnockoutWinner(knockoutBase, completedMatch)
            : tournament.knockout,
        };
      })
    );

    setWalkoverDraft({ matchId: "", resultType: "walkover", note: "" });
    setActiveScheduleEditMatchId("");
  }

  function updateMatchScore(matchId, side, value) {
    if (!activeTournament) return;

    const normalizedValue = String(value ?? "").replace(/[^\d]/g, "");
    const normalizedSide = String(side || "").toUpperCase() === "B" ? "B" : "A";
    setMatchFinishWarnings((prev) => {
      if (!prev[matchId]) return prev;
      const next = { ...prev };
      delete next[matchId];
      return next;
    });

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : (() => {
              const existingMatches = Array.isArray(tournament.matches)
                ? tournament.matches
                : [];
              let didUpdate = false;
              const scheduleItem = findScheduleItemByMatchId(tournament, matchId);
              const nextMatches = existingMatches.map((match) => {
                if (match.id !== matchId) return match;
                didUpdate = true;

                const nextMatch = {
                  ...match,
                  teamAId:
                    match.teamAId ||
                    scheduleItem?.teamAId ||
                    findTournamentTeamIdByName(tournament, match.teamA),
                  teamBId:
                    match.teamBId ||
                    scheduleItem?.teamBId ||
                    findTournamentTeamIdByName(tournament, match.teamB),
                  [normalizedSide === "A" ? "scoreA" : "scoreB"]:
                    normalizedValue,
                  scoreTouched: true,
                };
                const progressMatch = getMatchProgressFromScore(nextMatch);
                return progressMatch;
              });

              if (didUpdate) {
                return {
                  ...tournament,
                  matches: nextMatches,
                };
              }

              if (!scheduleItem) return tournament;

              const newMatch = getMatchProgressFromScore(
                createTournamentMatchFromScheduleItem(
                  tournament,
                  scheduleItem,
                  {
                    scoreA: normalizedSide === "A" ? normalizedValue : "",
                    scoreB: normalizedSide === "B" ? normalizedValue : "",
                    scoreTouched: true,
                  }
                )
              );

              return {
                ...tournament,
                matches: [...nextMatches, newMatch],
              };
            })()
      )
    );
  }

  function incrementMatchScore(matchId, side, delta) {
    if (!activeTournament) return;

    const existingMatch =
      (activeTournament.matches || []).find((match) => match.id === matchId) ||
      findScheduleItemByMatchId(activeTournament, matchId);
    const normalizedSide = String(side || "").toUpperCase() === "B" ? "B" : "A";
    const currentScore = parseMatchScore(
      normalizedSide === "A" ? existingMatch?.scoreA : existingMatch?.scoreB
    );
    const currentScoreValue = currentScore === null ? 0 : currentScore;
    const nextScore = Math.max(0, currentScoreValue + Number(delta || 0));

    updateMatchScore(matchId, normalizedSide, String(nextScore));
  }

  function confirmMatchCompleted(matchId) {
    if (!activeTournament) return;
    const existingMatch = (activeTournament.matches || []).find(
      (match) => match.id === matchId
    );
    const scheduleItem = findScheduleItemByMatchId(activeTournament, matchId);
    const currentMatch =
      existingMatch ||
      createTournamentMatchFromScheduleItem(activeTournament, scheduleItem);

    if (!currentMatch) return;

    if (!hasCompletableMatchScore(currentMatch)) {
      setMatchFinishWarnings((prev) => ({
        ...prev,
        [matchId]: tournamentText.knockoutNeedsWinner,
      }));

      setTournaments((prev) =>
        prev.map((tournament) =>
          tournament.id !== activeTournament.id
            ? tournament
            : (() => {
                let didUpdateMatch = false;
                const nextMatches = (tournament.matches || []).map((match) => {
                  if (match.id !== matchId) return match;
                  didUpdateMatch = true;

                  const progressMatch = markMatchNeedsWinnerFromScore(match);
                  return progressMatch;
                });

                if (didUpdateMatch) {
                  return {
                    ...tournament,
                    matches: nextMatches,
                  };
                }

                const currentScheduleItem =
                  scheduleItem || findScheduleItemByMatchId(tournament, matchId);
                const newMatch = createTournamentMatchFromScheduleItem(
                  tournament,
                  currentScheduleItem
                );

                if (!newMatch) return tournament;

                const progressMatch = markMatchNeedsWinnerFromScore(newMatch);

                return {
                  ...tournament,
                  matches: [...nextMatches, progressMatch],
                };
              })()
        )
      );
      return;
    }

    setMatchFinishWarnings((prev) => {
      if (!prev[matchId]) return prev;
      const next = { ...prev };
      delete next[matchId];
      return next;
    });

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id !== activeTournament.id
          ? tournament
          : (() => {
              let completedKnockoutMatch = null;
              let didUpdateMatch = false;
              const nextMatches = (tournament.matches || []).map((match) => {
                if (match.id !== matchId) return match;
                didUpdateMatch = true;
                if (!hasCompletableMatchScore(match)) return match;

                const finalizedMatch = finalizeMatchFromScore(match);
                if (isKnockoutMatch(finalizedMatch)) {
                  completedKnockoutMatch = finalizedMatch;
                }
                return finalizedMatch;
              });
              if (!didUpdateMatch) {
                const currentScheduleItem =
                  scheduleItem || findScheduleItemByMatchId(tournament, matchId);
                const newMatch = createTournamentMatchFromScheduleItem(
                  tournament,
                  currentScheduleItem
                );

                if (newMatch && hasCompletableMatchScore(newMatch)) {
                  const finalizedMatch = finalizeMatchFromScore(newMatch);
                  if (isKnockoutMatch(finalizedMatch)) {
                    completedKnockoutMatch = finalizedMatch;
                  }
                  nextMatches.push(finalizedMatch);
                }
              }
              const existingKnockout = tournament.knockout || {};
              const hasKnockoutBase = Boolean(
                (existingKnockout.quarterFinals || []).length ||
                  (existingKnockout.semiFinals || []).length ||
                  existingKnockout.final ||
                  existingKnockout.thirdPlace
              );
              const knockoutBase = hasKnockoutBase
                ? existingKnockout
                : buildManualKnockout(tournament);

              return {
                ...tournament,
                matches: nextMatches,
                knockout: completedKnockoutMatch
                  ? applyCompletedKnockoutWinner(
                      knockoutBase,
                      completedKnockoutMatch
                    )
                  : tournament.knockout,
              };
            })()
      )
    );
  }

  function updateKnockoutMatchWinner(
    stageKey,
    matchId,
    winnerSource,
    loserSource,
    seriesId = ""
  ) {
    if (!activeTournament) return;

    setTournaments((prev) =>
      prev.map((tournament) => {
        if (tournament.id !== activeTournament.id) return tournament;

        const applyWinnerToKnockout = (knockout = {}) => ({
          ...knockout,
          [stageKey]: Array.isArray(knockout?.[stageKey])
            ? knockout[stageKey].map((match) =>
                match.id !== matchId
                  ? match
                  : {
                      ...match,
                      winnerSource,
                      loserSource,
                      status: "completed",
                    }
              )
            : knockout?.[stageKey]?.id === matchId
              ? {
                  ...knockout[stageKey],
                  winnerSource,
                  loserSource,
                  status: "completed",
                }
              : knockout?.[stageKey],
        });

        if (seriesId && hasExplicitTournamentSeries(tournament)) {
          return {
            ...tournament,
            series: (tournament.series || []).map((series) =>
              String(series.id) !== String(seriesId)
                ? series
                : {
                    ...series,
                    knockout: applyWinnerToKnockout(series.knockout || {}),
                  }
            ),
          };
        }

        return {
          ...tournament,
          knockout: applyWinnerToKnockout(tournament.knockout || {}),
        };
      })
    );
  }

  function computeTournamentStandings(tournament) {
    if (!tournament || tournament.format !== "group-stage") return [];

    const groups = Array.isArray(tournament.groups) ? tournament.groups : [];
    const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
    const activeSeriesId = String(tournament.activeSeriesId || "");
    const shouldFilterSeriesMatches =
      activeSeriesId && hasExplicitTournamentSeries(tournament);
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
        if (isKnockoutMatch(match)) return;
        if (
          shouldFilterSeriesMatches &&
          String(match.seriesId || "") !== activeSeriesId
        ) {
          return;
        }
        if (match.groupId && match.groupId !== group.id) return;
        if (!teamNames.includes(match.teamA) || !teamNames.includes(match.teamB)) return;

        const scoreA = parseMatchScore(match.scoreA);
        const scoreB = parseMatchScore(match.scoreB);
        const isComplete =
          isMatchCompleted(match) &&
          scoreA !== null &&
          scoreB !== null;
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

        const resultWinnerTeamId = String(match.winnerTeamId || "");
        const teamAId = String(match.teamAId || match.teamA || "");
        const teamBId = String(match.teamBId || match.teamB || "");
        const isDecidedResult =
          ["walkover", "no_show"].includes(
            String(match.resultType || "").toLowerCase()
          ) && resultWinnerTeamId;

        if (isDecidedResult && resultWinnerTeamId === teamAId) {
          rowA.wins += 1;
          rowA.points += 3;
          rowB.losses += 1;
        } else if (isDecidedResult && resultWinnerTeamId === teamBId) {
          rowB.wins += 1;
          rowB.points += 3;
          rowA.losses += 1;
        } else if (scoreA > scoreB) {
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

  function getKnockoutStagesForDisplay(knockout) {
    return [
      {
        key: "quarterFinals",
        label: tournamentText.firstKnockoutLabel,
        matches: knockout?.quarterFinals || [],
      },
      {
        key: "semiFinals",
        label: tournamentText.semiFinals,
        matches: knockout?.semiFinals || [],
      },
      {
        key: "final",
        label: tournamentText.final,
        matches: knockout?.final ? [knockout.final] : [],
      },
      {
        key: "thirdPlace",
        label: tournamentText.thirdPlace,
        matches: knockout?.thirdPlace ? [knockout.thirdPlace] : [],
      },
    ].filter((stage) => stage.matches.length > 0);
  }

  function getTournamentSeriesRenderSections(tournament, seriesList = null) {
    if (!tournament) return [];
    const classes =
      Array.isArray(seriesList) && seriesList.length
        ? seriesList
        : getTournamentSeriesClasses(tournament, language);

    return classes.map((series) => {
      const seriesTournament = getTournamentForSeries(tournament, series, language);
      const storedGroups = Array.isArray(seriesTournament.groups)
        ? seriesTournament.groups
        : [];
      const groups = storedGroups.length
        ? storedGroups
        : buildManualGroups(tournament, series);
      const standingsTournament = {
        ...seriesTournament,
        groups,
      };
      const standings =
        standingsTournament.format === "group-stage"
          ? computeTournamentStandings(standingsTournament)
          : [];
      const knockout = seriesTournament.knockout || {};
      const knockoutStages = getKnockoutStagesForDisplay(knockout);

      return {
        series,
        tournament: seriesTournament,
        groups,
        standings,
        knockout,
        knockoutStages,
        knockoutMatches: knockoutStages.flatMap((stage) => stage.matches),
      };
    });
  }

  function filterScheduleBatchesBySeries(batches, seriesId) {
    if (!seriesId || seriesId === "all") return batches;

    return (batches || [])
      .map((batch) => ({
        ...batch,
        items: (batch.items || []).map((item) =>
          item && String(item.seriesId || "") === String(seriesId) ? item : null
        ),
      }))
      .filter((batch) => batch.items.some(Boolean));
  }

  function filterScheduleBatchesBySeriesIds(batches, seriesIds, useSeriesFilter) {
    if (!useSeriesFilter) return batches || [];
    const allowedSeriesIds = new Set((seriesIds || []).map((id) => String(id)));
    if (!allowedSeriesIds.size) return [];

    return (batches || [])
      .map((batch) => ({
        ...batch,
        items: (batch.items || []).map((item) =>
          item && allowedSeriesIds.has(String(item.seriesId || "")) ? item : null
        ),
      }))
      .filter((batch) => batch.items.some(Boolean));
  }

  const activeTournament = useMemo(() => {
    const tournament = tournaments.find((t) => t.id === activeTournamentId) || null;
    if (!tournament || !isTournamentOwnedByUsername(tournament, auth.username)) {
      return null;
    }

    return applyTournamentDefaults(tournament);
  }, [auth.username, tournaments, activeTournamentId]);

  const publicTournamentRequestActive = Boolean(publicTournamentCode);
  const publicTournament = publicTournamentBackend;

  const setupPanelTournamentIdRef = useRef("");

  useEffect(() => {
    const nextTournamentId = activeTournament?.id || "";
    if (setupPanelTournamentIdRef.current === nextTournamentId) return;

    setupPanelTournamentIdRef.current = nextTournamentId;
    setShowTournamentSetupPanel(true);
  }, [activeTournament]);

  useEffect(() => {
    setPromotionVisibilityAction("idle");
    setPromotionVisibilityError("");
    setActiveTournamentSeriesFilter("all");
    setActiveTournamentSetupSeriesId("");
  }, [activeTournamentId]);

  useEffect(() => {
    if (!activeTournamentId) return;

    const selectedTournament =
      tournaments.find((tournament) => tournament.id === activeTournamentId) ||
      null;

    if (!isTournamentOwnedByUsername(selectedTournament, auth.username)) {
      setActiveTournamentId("");
    }
  }, [activeTournamentId, auth.username, tournaments]);

  useEffect(() => {
    setMatchFinishWarnings({});
    setActiveScheduleEditMatchId("");
    setSelectedMoveMatchId("");
    setPendingScheduleMoveMode("swap");
    setWalkoverDraft({ matchId: "", resultType: "walkover", note: "" });
  }, [activeTournamentId]);

  useEffect(() => {
    if (!selectedMoveMatchId || typeof window === "undefined") return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedMoveMatchId("");
        setPendingScheduleMoveMode("swap");
        setTournamentActionMessage("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMoveMatchId]);

  useEffect(() => {
    if (!auth.loggedIn || !auth.username || !activeTournamentId) return;

    saveActiveTournamentId(auth.username, activeTournamentId);
  }, [activeTournamentId, auth.loggedIn, auth.username]);

  useEffect(() => {
    if (!auth.loggedIn || publicTournamentRequestActive) return;

    const scopedTournaments = filterTournamentsForUsername(
      tournaments,
      auth.username
    );

    if (!scopedTournaments.length) return;

    const preferredId = getPreferredActiveTournamentId(
      scopedTournaments,
      auth.username,
      activeTournamentId
    );

    if (preferredId && preferredId !== activeTournamentId) {
      setActiveTournamentId(preferredId);
      setShowTournamentSetupPanel(true);
    }
  }, [
    activeTournamentId,
    auth.loggedIn,
    auth.username,
    publicTournamentRequestActive,
    tournaments,
  ]);

  useEffect(() => {
    if (!activeTournament || publicTournamentRequestActive) return;
    if (hasExplicitTournamentSeries(activeTournament)) return;
    if (Array.isArray(activeTournament.groups) && activeTournament.groups.length) {
      return;
    }

    const groups = buildManualGroups(activeTournament);
    if (!groups.length) return;

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id === activeTournament.id &&
        (!Array.isArray(tournament.groups) || !tournament.groups.length)
          ? {
              ...tournament,
              groups,
            }
          : tournament
      )
    );
  }, [activeTournament, publicTournamentRequestActive, buildManualGroups]);

  function createTournament() {
    const name = newTournamentName.trim();
    const rules = newTournamentRules.trim();

    if (!name) {
      setTournamentActionMessage(tournamentText.enterName);
      return;
    }

    const tournamentId = createStableTournamentId();
    const newTournament = {
      id: tournamentId,
      tournamentId,
      TournamentId: tournamentId,
      name,
      rules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizerUsername: auth.username || "",
      ownerUsername: auth.username || "",
      status: "draft",
      published: false,
      teams: [],
      ...getDefaultTournamentConfig(),
    };

    setTournaments((prev) => [
      newTournament,
      ...filterTournamentsForUsername(prev, auth.username),
    ]);
    setActiveTournamentId(newTournament.id);
    setNewTournamentName("");
    setNewTournamentRules("");
    setShowCreateTournamentForm(false);
    setShowTournamentSetupPanel(true);
    setTournamentActionMessage(tournamentText.createdOk);
    void persistTournamentNow("saveTournament", newTournament);
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

      window.clearTimeout(tournamentAutosaveTimerRef.current);
      window.clearTimeout(manualGroupEditingTimerRef.current);
      manualGroupEditingRef.current = false;
      deletedTournamentIdsRef.current.clear();
      tournamentSessionUsernameRef.current = "";
      setTournaments([]);
      setActiveTournamentId("");
      setActiveTournamentView("overview");
      setShowTournamentSetupPanel(true);
      setShowTournamentRegistration(false);
      setTournamentActionMessage("");
      setTournamentSyncStatus("loading");
      setTournamentSyncMessage("");
      setTournamentBackendReady(false);
      setPublicTournamentBackend(null);
      setPublicTournamentLoadStatus("idle");
      lastTournamentBackendJsonRef.current = "[]";
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
    window.clearTimeout(tournamentAutosaveTimerRef.current);
    window.clearTimeout(manualGroupEditingTimerRef.current);
    manualGroupEditingRef.current = false;
    deletedTournamentIdsRef.current.clear();
    tournamentSessionUsernameRef.current = "";
    setTournaments([]);
    setActiveTournamentId("");
    setActiveTournamentView("overview");
    setShowTournamentSetupPanel(true);
    setShowTournamentRegistration(false);
    setTournamentActionMessage("");
    setTournamentSyncStatus("local");
    setTournamentSyncMessage("");
    setTournamentBackendReady(false);
    setPublicTournamentBackend(null);
    setPublicTournamentLoadStatus("idle");
    setPublicTournamentsMessage("");
    lastTournamentBackendJsonRef.current = "[]";
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
    function handleUrlChange() {
      setCurrentSearch(window.location.search);
    }

    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  useEffect(() => {
    if (!auth.loggedIn || !auth.username || publicTournamentRequestActive) {
      return;
    }

    saveStoredTournaments(
      filterTournamentsForUsername(tournaments, auth.username),
      auth.username
    );
  }, [auth.loggedIn, auth.username, publicTournamentRequestActive, tournaments]);

  useEffect(() => {
    const normalizedUsername = auth.loggedIn
      ? getTournamentStorageUsername(auth.username)
      : "";

    if (tournamentSessionUsernameRef.current !== normalizedUsername) {
      window.clearTimeout(tournamentAutosaveTimerRef.current);
      window.clearTimeout(manualGroupEditingTimerRef.current);
      manualGroupEditingRef.current = false;
      deletedTournamentIdsRef.current.clear();
      tournamentSessionUsernameRef.current = normalizedUsername;

      setTournaments([]);
      setActiveTournamentId("");
      setActiveTournamentView("overview");
      setShowTournamentSetupPanel(true);
      setShowTournamentRegistration(false);
      setTournamentActionMessage("");
      setTournamentSyncStatus(normalizedUsername ? "loading" : "local");
      setTournamentSyncMessage("");
      setTournamentBackendReady(false);
      setPublicTournamentBackend(null);
      setPublicTournamentLoadStatus("idle");
      setPublicTournamentsMessage("");
      setActiveScheduleEditMatchId("");
      setSelectedMoveMatchId("");
      setPendingScheduleMoveMode("swap");
      setWalkoverDraft({ matchId: "", resultType: "walkover", note: "" });
      lastTournamentBackendJsonRef.current = "[]";
    }

    if (!auth.loggedIn) {
      setTournaments([]);
      setActiveTournamentId("");
      setTournamentBackendReady(false);
      setTournamentSyncStatus("local");
      setTournamentSyncMessage("");
      setPublicTournamentBackend(null);
      setPublicTournamentLoadStatus("idle");
      setPublicTournamentsMessage("");
      setActiveScheduleEditMatchId("");
      setSelectedMoveMatchId("");
      setPendingScheduleMoveMode("swap");
      setWalkoverDraft({ matchId: "", resultType: "walkover", note: "" });
      lastTournamentBackendJsonRef.current = "[]";
      return;
    }

    void loadTournamentsFromBackend();
  }, [auth.loggedIn, auth.password, auth.username, loadTournamentsFromBackend]);

  useEffect(() => {
    const normalizedCode = String(publicTournamentCode || "").trim();
    if (!normalizedCode) {
      setPublicTournamentBackend(null);
      setPublicTournamentLoadStatus("idle");
      return undefined;
    }

    let cancelled = false;
    setPublicTournamentBackend(null);
    setPublicTournamentLoadStatus("loading");

    fetchPublicTournamentFromBackend(normalizedCode)
      .then((tournament) => {
        if (cancelled) return;

        if (isTournamentPublished(tournament)) {
          setPublicTournamentBackend(tournament);
          setPublicTournamentLoadStatus("ready");
          return;
        }

        setPublicTournamentLoadStatus("not-found");
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Could not load public tournament from backend:", error);
        setPublicTournamentBackend(null);
        setPublicTournamentLoadStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPublicTournamentFromBackend, publicTournamentCode]);

  useEffect(() => {
    if (publicTournamentRequestActive) return undefined;

    let cancelled = false;
    setPublicTournamentsStatus("loading");
    setPublicTournamentsMessage("");

    fetchPublicTournamentList()
      .then((items) => {
        if (cancelled) return;
        setPublicTournaments(items);
        setPublicTournamentsStatus("ready");
        setPublicTournamentsMessage("");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Could not load public tournaments:", error);
        setPublicTournaments([]);
        setPublicTournamentsStatus("error");
        setPublicTournamentsMessage(
          error?.message || tournamentText.publicListingError
        );
      });

    return () => {
      cancelled = true;
    };
  }, [
    fetchPublicTournamentList,
    publicTournamentRequestActive,
    tournamentText.publicListingError,
  ]);

  useEffect(() => {
    if (!auth.loggedIn || !tournamentBackendReady || publicTournamentRequestActive) {
      return undefined;
    }

    const autosaveUsername = auth.username;
    const normalizedAutosaveUsername =
      getTournamentStorageUsername(autosaveUsername);
    const scopedTournaments = filterTournamentsForUsername(
      tournaments,
      autosaveUsername
    ).filter((tournament) => {
      const tournamentId = getTournamentIdentity(tournament);
      return (
        tournamentId && !deletedTournamentIdsRef.current.has(tournamentId)
      );
    });

    if (scopedTournaments.length !== tournaments.length) {
      setTournaments(scopedTournaments);
      return undefined;
    }

    const serialized = JSON.stringify(scopedTournaments);
    if (serialized === lastTournamentBackendJsonRef.current) return undefined;

    window.clearTimeout(tournamentAutosaveTimerRef.current);
    setTournamentSyncStatus("saving");
    setTournamentSyncMessage(tournamentText.tournamentSyncSaving);

    tournamentAutosaveTimerRef.current = window.setTimeout(async () => {
      try {
        if (
          tournamentSessionUsernameRef.current !== normalizedAutosaveUsername
        ) {
          return;
        }

        for (const tournament of scopedTournaments) {
          const tournamentId = getTournamentIdentity(tournament);
          if (!tournamentId) {
            continue;
          }

          if (deletedTournamentIdsRef.current.has(tournamentId)) {
            continue;
          }

          const backendTournament = prepareTournamentForBackend(tournament);
          const data = await callTournamentBackend("saveTournament", {
            tournament: backendTournament,
            tournamentId,
            TournamentId: tournamentId,
            id: tournamentId,
            publicCode: backendTournament.publicCode || "",
          });
          const normalizedSavedTournament = normalizeTournamentApiItem(data);
          const savedTournament =
            normalizedSavedTournament &&
            getTournamentIdentity(normalizedSavedTournament) === tournamentId
              ? normalizedSavedTournament
              : markTournamentBackendSynced(backendTournament);

          if (savedTournament?.id) {
            setTournaments((currentTournaments) => {
              const currentScoped = filterTournamentsForUsername(
                currentTournaments,
                autosaveUsername
              ).filter((currentTournament) => {
                const currentTournamentId =
                  getTournamentIdentity(currentTournament);
                return (
                  currentTournamentId &&
                  !deletedTournamentIdsRef.current.has(currentTournamentId)
                );
              });

              const currentSerialized = JSON.stringify(currentScoped);
              const hasLocalChangesAfterSaveStarted =
                currentSerialized !== serialized;
              const hasCurrentTournament = currentScoped.some(
                (item) => item.id === savedTournament.id
              );

              if (!hasCurrentTournament) {
                saveStoredTournaments(currentScoped, autosaveUsername);
                return currentScoped;
              }

              const nextTournaments = currentScoped.map((item) =>
                item.id === savedTournament.id
                  ? mergeTournamentServerFields(item, savedTournament)
                  : item
              );
              const nextSerialized = JSON.stringify(nextTournaments);

              saveStoredTournaments(nextTournaments, autosaveUsername);
              if (!hasLocalChangesAfterSaveStarted) {
                lastTournamentBackendJsonRef.current = nextSerialized;
              }

              return nextTournaments;
            });
          }
        }

        if (
          tournamentSessionUsernameRef.current !== normalizedAutosaveUsername
        ) {
          return;
        }

        setTournamentSyncStatus("saved");
        setTournamentSyncMessage(tournamentText.tournamentSyncSaved);
      } catch (error) {
        console.error("Could not autosave tournaments:", error);
        setTournamentSyncStatus("error");
        setTournamentSyncMessage(
          error?.message || tournamentText.tournamentBackendTodo
        );
      }
    }, 900);

    return () => window.clearTimeout(tournamentAutosaveTimerRef.current);
  }, [
    auth.loggedIn,
    auth.username,
    callTournamentBackend,
    publicTournamentRequestActive,
    tournamentBackendReady,
    tournaments,
    tournamentText.tournamentBackendTodo,
    tournamentText.tournamentSyncSaved,
    tournamentText.tournamentSyncSaving,
  ]);

  useEffect(() => {
    if (!tournamentActionMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setTournamentActionMessage("");
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [tournamentActionMessage]);

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

  const publicUpcomingFilterResult = useMemo(() => {
    function getPublicTournamentFilterReason(tournament) {
      if (!isTournamentPublished(tournament)) return "not-published";
      if (!isTournamentPubliclyListed(tournament)) return "not-listed";

      if (publicTournamentCountryFilter !== "all") {
        const country = String(tournament.country || "")
          .trim()
          .toLowerCase();
        if (country !== publicTournamentCountryFilter) {
          return `country:${country || "empty"}`;
        }
      }

      if (publicTournamentTypeFilter !== "all") {
        const hasType = getTournamentSeries(tournament).some(
          (series) =>
            Number(series.teamSize) === Number(publicTournamentTypeFilter)
        );
        if (!hasType) return `type:${publicTournamentTypeFilter}`;
      }

      const hasParsedDate = Boolean(
        parseTournamentDateValue(
          tournament?.endDate || tournament?.startDate || tournament?.eventDate
        )
      );
      const isFinished = isTournamentFinishedForFilter(tournament);
      const isLive = isTournamentLiveForFilter(tournament);

      if (publicTournamentTimeFilter === "finished") {
        if (!hasParsedDate) return "finished-filter-invalid-or-empty-date";
        return isFinished ? "" : "not-finished";
      }

      if (publicTournamentTimeFilter === "live") {
        return isLive ? "" : "not-live";
      }

      return isFinished ? "finished" : "";
    }

    const accepted = [];
    const rejected = [];

    publicTournaments.forEach((tournament) => {
      const reason = getPublicTournamentFilterReason(tournament);
      if (reason) {
        rejected.push({
          id: tournament.id || "",
          name: tournament.name || tournament.publicTitle || "",
          publicCode: tournament.publicCode || "",
          reason,
        });
        return;
      }

      accepted.push(tournament);
    });

    accepted.sort((a, b) => {
        const dateA =
          getTournamentDateValue(a)?.getTime() || Number.MAX_SAFE_INTEGER;
        const dateB =
          getTournamentDateValue(b)?.getTime() || Number.MAX_SAFE_INTEGER;

        return publicTournamentTimeFilter === "finished"
          ? dateB - dateA
          : dateA - dateB;
      });

    return {
      items: accepted,
      rejected,
    };
  }, [
    publicTournamentCountryFilter,
    publicTournamentTimeFilter,
    publicTournamentTypeFilter,
    publicTournaments,
  ]);

  const filteredPublicTournaments = publicUpcomingFilterResult.items;

  function formatPublicTournamentDate(tournament) {
    const date = getTournamentDateValue(tournament);
    const startTime = String(tournament?.startTime || "").trim();

    if (!date) return startTime || "-";

    const formatted = date.toLocaleDateString(language === "no" ? "nb-NO" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return startTime ? `${formatted} ${startTime}` : formatted;
  }

  function renderPublicUpcomingTournaments() {
    const isLoadingPublicTournaments = publicTournamentsStatus === "loading";
    const isPublicTournamentError = publicTournamentsStatus === "error";

    return (
      <section style={styles.publicLandingSection}>
        <div style={styles.publicLandingHeader}>
          <div>
            <div style={styles.publicLandingEyebrow}>
              {tournamentText.publicPreviewTitle}
            </div>
            <h2 style={styles.publicLandingTitle}>
              {tournamentText.upcomingTournamentsTitle}
            </h2>
            <p style={styles.publicLandingSubtitle}>
              {tournamentText.upcomingTournamentsSubtitle}
            </p>
          </div>
          <div style={styles.publicLandingFilters}>
            <select
              style={styles.publicLandingSelect}
              value={publicTournamentCountryFilter}
              onChange={(e) => setPublicTournamentCountryFilter(e.target.value)}
            >
              <option value="all">{tournamentText.allCountries}</option>
              <option value="norway">{tournamentText.norway}</option>
              <option value="denmark">{tournamentText.denmark}</option>
            </select>
            <select
              style={styles.publicLandingSelect}
              value={publicTournamentTypeFilter}
              onChange={(e) => setPublicTournamentTypeFilter(e.target.value)}
            >
              <option value="all">{tournamentText.allTypes}</option>
              <option value="4">{tournamentText.fourSide}</option>
              <option value="5">{tournamentText.fiveSide}</option>
            </select>
            <select
              style={styles.publicLandingSelect}
              value={publicTournamentTimeFilter}
              onChange={(e) => setPublicTournamentTimeFilter(e.target.value)}
            >
              <option value="upcoming">{tournamentText.upcomingLabel}</option>
              <option value="live">{t.landingStatusLive}</option>
              <option value="finished">{tournamentText.finishedLabel}</option>
            </select>
          </div>
        </div>

        {isLoadingPublicTournaments ? (
          <div style={styles.publicLandingState}>
            {tournamentText.loadingPublicTournaments}
          </div>
        ) : isPublicTournamentError ? (
          <div style={styles.publicLandingState}>
            {publicTournamentsMessage || tournamentText.publicListingError}
          </div>
        ) : filteredPublicTournaments.length === 0 ? (
          <div style={styles.publicLandingState}>
            {tournamentText.noPublicTournaments}
          </div>
        ) : (
          <div style={styles.publicTournamentCardGrid}>
            {filteredPublicTournaments.map((tournament) => {
              const series = getTournamentSeries(tournament);
              const seriesLabels = series.length
                ? series.map((item) =>
                    Number(item.teamSize) === 4
                      ? tournamentText.fourSide
                      : Number(item.teamSize) === 5
                        ? tournamentText.fiveSide
                        : item.name || tournamentText.seriesLabel
                  )
                : [];
              const location = [
                tournament.locationName,
                tournament.city,
                tournament.country,
              ]
                .map((part) => String(part || "").trim())
                .filter(Boolean)
                .join(", ");
              const contact = [
                tournament.contactName,
                tournament.contactPhone,
                tournament.contactEmail,
              ]
                .map((part) => String(part || "").trim())
                .filter(Boolean)
                .join(" / ");
              const publicTheme = getTournamentPublicCardTheme(tournament);
              const cardSummary = getTournamentPublicSummary(tournament);
              const posterImageUrl = getTournamentPublicCardImageUrl(tournament);
              const publicTitle = getTournamentPublicTitle(tournament);
              const actionLabel = getPublicTournamentCardActionLabel(tournament);
              const organizer = getTournamentPublicOrganizerName(tournament);

              return (
                <article
                  key={tournament.id || tournament.publicCode}
                  style={{
                    ...styles.publicTournamentPosterCard,
                    ...getPublicThemeStyle(publicTheme),
                    borderColor: publicTheme.border,
                    background: `linear-gradient(145deg, ${publicTheme.background}, ${publicTheme.panel} 72%)`,
                    color: publicTheme.text,
                  }}
                >
                  {posterImageUrl && (
                    <div
                      style={{
                        ...styles.publicTournamentPosterImage,
                        backgroundImage: `url(${posterImageUrl})`,
                      }}
                    />
                  )}

                  <div style={styles.publicTournamentPosterBody}>
                    <div style={styles.publicTournamentPosterTop}>
                      <span
                        style={{
                          ...styles.publicTournamentPosterDate,
                          background: publicTheme.accent,
                          color: publicTheme.background,
                        }}
                      >
                        {formatPublicTournamentDate(tournament)}
                      </span>
                      {seriesLabels.length > 0 && (
                        <div style={styles.publicTournamentPosterBadges}>
                          {Array.from(new Set(seriesLabels)).map((label) => (
                            <span
                              key={label}
                              style={{
                                ...styles.publicTournamentPosterBadge,
                                background: publicTheme.surface,
                                borderColor: publicTheme.border,
                                color: publicTheme.mutedText,
                              }}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <h3
                      style={{
                        ...styles.publicTournamentPosterTitle,
                        color: publicTheme.text,
                      }}
                    >
                      {publicTitle}
                    </h3>
                    {cardSummary && (
                      <p
                        style={{
                          ...styles.publicTournamentPosterSummary,
                          color: publicTheme.mutedText,
                        }}
                      >
                        {cardSummary}
                      </p>
                    )}

                    <div style={styles.publicTournamentPosterMetaGrid}>
                      {location && (
                        <div
                          style={{
                            ...styles.publicTournamentPosterMetaItem,
                            background: publicTheme.surface,
                            borderColor: publicTheme.border,
                            color: publicTheme.mutedText,
                          }}
                        >
                          <span>{tournamentText.locationLabel}</span>
                          <strong>{location}</strong>
                        </div>
                      )}
                      {tournament.registrationDeadline && (
                        <div
                          style={{
                            ...styles.publicTournamentPosterMetaItem,
                            background: publicTheme.surface,
                            borderColor: publicTheme.border,
                            color: publicTheme.mutedText,
                          }}
                        >
                          <span>{tournamentText.registrationDeadlineLabel}</span>
                          <strong>{tournament.registrationDeadline}</strong>
                        </div>
                      )}
                      {(tournament.prizeText || tournament.feeText) && (
                        <div
                          style={{
                            ...styles.publicTournamentPosterMetaItem,
                            background: publicTheme.surface,
                            borderColor: publicTheme.border,
                            color: publicTheme.mutedText,
                          }}
                        >
                          <span>{tournamentText.prizeLabel}</span>
                          <strong>
                            {[tournament.prizeText, tournament.feeText]
                              .filter(Boolean)
                              .join(" / ")}
                          </strong>
                        </div>
                      )}
                      {contact && (
                        <div
                          style={{
                            ...styles.publicTournamentPosterMetaItem,
                            background: publicTheme.surface,
                            borderColor: publicTheme.border,
                            color: publicTheme.mutedText,
                          }}
                        >
                          <span>{tournamentText.contactLabel}</span>
                          <strong>{contact}</strong>
                        </div>
                      )}
                      {organizer && (
                        <div
                          style={{
                            ...styles.publicTournamentPosterMetaItem,
                            background: publicTheme.surface,
                            borderColor: publicTheme.border,
                            color: publicTheme.mutedText,
                          }}
                        >
                          <span>{tournamentText.organizerLabel}</span>
                          <strong>{organizer}</strong>
                        </div>
                      )}
                      {tournament.maxTeams && (
                        <div
                          style={{
                            ...styles.publicTournamentPosterMetaItem,
                            background: publicTheme.surface,
                            borderColor: publicTheme.border,
                            color: publicTheme.mutedText,
                          }}
                        >
                          <span>{tournamentText.maxTeamsLabel}</span>
                          <strong>{tournament.maxTeams}</strong>
                        </div>
                      )}
                    </div>

                    {(tournament.breakfastInfo ||
                      tournament.breakBallInfo ||
                      tournament.sodduInfo) && (
                      <div
                        style={{
                          ...styles.publicTournamentPosterFood,
                          background: publicTheme.surface,
                          borderColor: publicTheme.border,
                          color: publicTheme.accent,
                        }}
                      >
                        {[tournament.breakfastInfo, tournament.breakBallInfo, tournament.sodduInfo]
                          .filter(Boolean)
                          .join(" / ")}
                      </div>
                    )}

                    <button
                      style={{
                        ...styles.publicTournamentPosterButton,
                        background: publicTheme.primary,
                        color: publicTheme.background,
                      }}
                      onClick={() => openPublicTournamentFromCard(tournament)}
                    >
                      {actionLabel}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function getLandingTournamentStatusLabel(tournament) {
    if (isTournamentLiveForFilter(tournament)) return t.landingStatusLive;
    if (isTournamentFinishedForFilter(tournament)) {
      return t.landingStatusCompleted;
    }
    return t.landingStatusUpcoming;
  }

  function getPublicTournamentCardActionLabel(tournament) {
    if (hasTournamentRegistrationLink(tournament)) {
      return tournamentText.registerTeam;
    }

    if (
      isTournamentPublished(tournament) ||
      isTournamentLiveForFilter(tournament) ||
      hasTournamentPublicLiveContent(tournament)
    ) {
      return tournamentText.followLive;
    }

    return tournamentText.viewTournamentDetails;
  }

  function renderLandingPublicTournamentCard(tournament, options = {}) {
    const isPreview = Boolean(options.preview);
    const series = getTournamentSeries(tournament);
    const seriesLabels = series.length
      ? series.map((item) =>
          Number(item.teamSize) === 4
            ? tournamentText.fourSide
            : Number(item.teamSize) === 5
              ? tournamentText.fiveSide
              : item.name || tournamentText.seriesLabel
        )
      : [];
    const location = [
      tournament.locationName,
      tournament.city,
      tournament.country,
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");
    const contact = [
      tournament.contactName,
      tournament.contactPhone,
      tournament.contactEmail,
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(" / ");
    const publicTheme = getTournamentPublicCardTheme(tournament);
    const publicTitle = getTournamentPublicTitle(tournament);
    const actionLabel = getPublicTournamentCardActionLabel(tournament);
    const cardImageUrl = getTournamentPublicCardImageUrl(tournament);
    const publicLogoUrl = getTournamentPublicLogoUrl(tournament);
    const organizer = getTournamentPublicOrganizerName(tournament);
    const metaItems = [
      location ? { label: tournamentText.locationLabel, value: location } : null,
      organizer
        ? { label: tournamentText.organizerLabel, value: organizer }
        : null,
      tournament.prizeText
        ? { label: tournamentText.prizeLabel, value: tournament.prizeText }
        : null,
      tournament.feeText
        ? { label: tournamentText.feeLabel, value: tournament.feeText }
        : null,
      contact ? { label: tournamentText.contactLabel, value: contact } : null,
    ].filter(Boolean);
    const isLiveStatus = isTournamentLiveForFilter(tournament);

    return (
      <article
        key={
          isPreview
            ? `preview-${tournament.id || tournament.publicCode || "card"}`
            : tournament.id || tournament.publicCode
        }
        style={{
          ...styles.landingTournamentCard,
          ...getPublicCardThemeStyle(publicTheme, cardImageUrl),
          cursor: isPreview ? "default" : "pointer",
        }}
        onClick={() => {
          if (!isPreview) openPublicTournamentFromCard(tournament);
        }}
      >
        <div style={styles.landingTournamentCardShine} />
        <div style={styles.landingTournamentCardTop}>
          <div style={styles.landingTournamentTopLeft}>
            {publicLogoUrl && (
              <span
                style={{
                  ...styles.landingTournamentLogoBadge,
                  borderColor: publicTheme.border,
                  background: publicTheme.surface,
                }}
              >
                <img
                  src={publicLogoUrl}
                  alt=""
                  style={styles.landingTournamentLogoImage}
                />
              </span>
            )}
            <span
              style={{
                ...styles.landingTournamentStatusPill,
                background: isLiveStatus
                  ? hexToRgba("#22c55e", 0.22)
                  : hexToRgba(publicTheme.primary, 0.18),
                border: `1px solid ${
                  isLiveStatus
                    ? hexToRgba("#22c55e", 0.48)
                    : hexToRgba(publicTheme.primary, 0.38)
                }`,
                color: publicTheme.text,
              }}
            >
              {getLandingTournamentStatusLabel(tournament)}
            </span>
          </div>
          <span
            style={{
              ...styles.landingTournamentDatePill,
              background: publicTheme.accent,
              borderColor: publicTheme.accent,
              color: publicTheme.background,
            }}
          >
            {formatPublicTournamentDate(tournament)}
          </span>
        </div>

        <div style={styles.landingTournamentCardBody}>
          <h3
            style={{
              ...styles.landingTournamentCardTitle,
              color: publicTheme.text,
            }}
          >
            {publicTitle}
          </h3>

          {seriesLabels.length > 0 && (
            <div style={styles.landingTournamentSeriesRow}>
              {Array.from(new Set(seriesLabels)).map((label) => (
                <span
                  key={label}
                  style={{
                    ...styles.landingTournamentSeriesBadge,
                    background: publicTheme.surface,
                    borderColor: publicTheme.border,
                    color: publicTheme.mutedText,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {metaItems.length > 0 && (
            <div style={styles.landingTournamentMetaList}>
              {metaItems.slice(0, 4).map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  style={{
                    ...styles.landingTournamentMetaItem,
                    background: hexToRgba(publicTheme.surface, 0.72),
                    borderColor: hexToRgba(publicTheme.border, 0.52),
                  }}
                >
                  <span style={{ color: publicTheme.mutedText }}>{item.label}</span>
                  <strong style={{ color: publicTheme.text }}>{item.value}</strong>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            style={{
              ...styles.landingTournamentOpenButton,
              background: publicTheme.primary,
              color: publicTheme.background,
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (!isPreview) openPublicTournamentFromCard(tournament);
            }}
          >
            {actionLabel}
          </button>
        </div>
      </article>
    );
  }

  function renderLandingPublicTournamentShowcase() {
    const isLoadingPublicTournaments = publicTournamentsStatus === "loading";
    const isPublicTournamentError = publicTournamentsStatus === "error";

    return (
      <section style={styles.landingUpcomingSection}>
        <div style={styles.landingSectionHeader}>
          <div>
            <div style={styles.landingEyebrow}>{t.landingEventPlatform}</div>
            <h2 style={styles.landingSectionTitle}>{t.landingUpcomingTitle}</h2>
          </div>
          <div style={styles.landingFilterRow}>
            <select
              style={styles.landingFilterSelect}
              value={publicTournamentCountryFilter}
              onChange={(e) => setPublicTournamentCountryFilter(e.target.value)}
            >
              <option value="all">{t.landingAllCountries}</option>
              <option value="norway">{tournamentText.norway}</option>
              <option value="denmark">{tournamentText.denmark}</option>
            </select>
            <select
              style={styles.landingFilterSelect}
              value={publicTournamentTypeFilter}
              onChange={(e) => setPublicTournamentTypeFilter(e.target.value)}
            >
              <option value="all">{t.landingAllTypes}</option>
              <option value="4">{tournamentText.fourSide}</option>
              <option value="5">{tournamentText.fiveSide}</option>
            </select>
            <select
              style={styles.landingFilterSelect}
              value={publicTournamentTimeFilter}
              onChange={(e) => setPublicTournamentTimeFilter(e.target.value)}
            >
              <option value="upcoming">{t.landingStatusUpcoming}</option>
              <option value="live">{t.landingStatusLive}</option>
              <option value="finished">{t.landingStatusPast}</option>
            </select>
          </div>
        </div>

        {isLoadingPublicTournaments ? (
          <div style={styles.landingEmptyState}>
            {tournamentText.loadingPublicTournaments}
          </div>
        ) : isPublicTournamentError ? (
          <div style={styles.landingEmptyState}>
            {publicTournamentsMessage || tournamentText.publicListingError}
          </div>
        ) : filteredPublicTournaments.length === 0 ? (
          <div style={styles.landingEmptyState}>
            <strong>{t.landingNoPublicTournaments}</strong>
            <span>{t.landingPublishedAppear}</span>
          </div>
        ) : (
          <div style={styles.landingTournamentGrid}>
            {filteredPublicTournaments.map(renderLandingPublicTournamentCard)}
          </div>
        )}
      </section>
    );
  }

  function renderLoggedOutLandingPage() {
    const featureChips = [
      t.landingChipLiveSchedule,
      t.landingChipPublicPage,
      t.landingChipGroupKnockout,
      t.landingChipOrganizerTools,
    ];

    return (
      <div style={styles.landingPage}>
        <div style={styles.landingGlowOne} />
        <div style={styles.landingGlowTwo} />
        <div style={styles.landingCourtLines}>
          <div style={styles.landingCourtNet} />
          <div style={styles.landingCourtCircle} />
          <div style={styles.landingCourtSideLine} />
        </div>

        <div style={styles.landingShell}>
          <header style={styles.landingTopBar}>
            <div style={styles.landingBrandBlock}>
              <div style={styles.landingBrandMark}>MTP</div>
              <div>
                <div style={styles.landingBrandName}>{t.appTitle}</div>
                <div style={styles.landingBrandSubtitle}>
                  {t.landingBrandSubtitle}
                </div>
              </div>
            </div>

            <div style={styles.landingLanguageRow}>
              <button
                type="button"
                style={{
                  ...styles.landingLanguageButton,
                  ...(language === "en" ? styles.landingLanguageButtonActive : {}),
                }}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
              <button
                type="button"
                style={{
                  ...styles.landingLanguageButton,
                  ...(language === "no" ? styles.landingLanguageButtonActive : {}),
                }}
                onClick={() => setLanguage("no")}
              >
                NO
              </button>
            </div>
          </header>

          <main style={styles.landingHeroGrid}>
            <section style={styles.landingHeroCopy}>
              <div style={styles.landingHeroKicker}>{t.landingEventPlatform}</div>
              <h1 style={styles.landingHeroTitle}>{t.landingHeroTitle}</h1>
              <p style={styles.landingHeroText}>{t.landingHeroCopy}</p>
              <div style={styles.landingFeatureChips}>
                {featureChips.map((chip) => (
                  <span key={chip} style={styles.landingFeatureChip}>
                    {chip}
                  </span>
                ))}
              </div>

              <div style={styles.landingVisualCard}>
                <div style={styles.landingVisualHeader}>
                  <span>{t.landingControlTitle}</span>
                  <strong>{t.preview}</strong>
                </div>
                <p style={styles.landingVisualText}>{t.landingControlSubtitle}</p>
                <div style={styles.landingControlPills}>
                  {[
                    t.landingControlGroups,
                    tournamentText.scheduleTitle,
                    t.landingControlScores,
                    t.landingControlPublicLink,
                  ].map((item) => (
                    <span key={item} style={styles.landingControlPill}>
                      {item}
                    </span>
                  ))}
                </div>
                <div style={styles.landingSchedulePreview}>
                  <div style={styles.landingSchedulePreviewTop}>
                    <span>{t.landingControlSchedulePreview}</span>
                    <strong>LIVE</strong>
                  </div>
                  {[
                    ["09:00", `${t.courtLabel} 1`, "Team A vs Team B"],
                    ["09:15", `${t.courtLabel} 2`, "Team C vs Team D"],
                  ].map(([time, court, teams]) => (
                    <div key={`${time}-${court}`} style={styles.landingScheduleRow}>
                      <span style={styles.landingScheduleTime}>{time}</span>
                      <span style={styles.landingScheduleCourt}>{court}</span>
                      <strong style={styles.landingScheduleTeams}>{teams}</strong>
                    </div>
                  ))}
                </div>
                <div style={styles.landingVisualStats}>
                  <div style={styles.landingVisualStat}>
                    <strong style={styles.landingVisualStatValue}>12</strong>
                    <span>{tournamentText.matchesTitle}</span>
                  </div>
                  <div style={styles.landingVisualStat}>
                    <strong style={styles.landingVisualStatValue}>03</strong>
                    <span>{tournamentText.courtsLabel}</span>
                  </div>
                  <div style={styles.landingVisualStat}>
                    <strong style={styles.landingVisualStatValue}>
                      {t.landingStatusLive}
                    </strong>
                    <span>{t.landingChipPublicPage}</span>
                  </div>
                </div>
              </div>
            </section>

            <aside style={styles.landingLoginCard}>
              <div style={styles.landingLoginHeader}>
                <div style={styles.landingLoginIcon}>MTP</div>
                <div>
                  <h2 style={styles.landingLoginTitle}>
                    {t.landingOrganizerLogin}
                  </h2>
                  <p style={styles.landingLoginHelper}>{t.landingLoginHelper}</p>
                </div>
              </div>

              <form
                style={styles.landingLoginForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleLogin();
                }}
              >
                <input
                  style={styles.landingInput}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder={t.username}
                  autoComplete="username"
                />
                <input
                  style={styles.landingInput}
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t.password}
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  style={styles.landingLoginButton}
                  disabled={loginLoading}
                >
                  {loginLoading ? t.loggingIn : t.login}
                </button>
              </form>

              {loginMessage && (
                <div style={styles.landingLoginMessage}>{loginMessage}</div>
              )}
            </aside>
          </main>

          {renderLandingPublicTournamentShowcase()}
        </div>
      </div>
    );
  }

  function renderTournamentHallScheduleGrid({
    hallScheduleBatches,
    scheduleCourtCount,
    limit = 12,
    showRoundLabels = false,
    editableScores = false,
    scheduleEditable = false,
    publicTheme = null,
    courtBlocks = [],
  }) {
    const safeBatches = Array.isArray(hallScheduleBatches)
      ? hallScheduleBatches
      : [];
    const safeCourtCount = Math.max(1, Number(scheduleCourtCount || 1));
    const canEditScheduleStructure = Boolean(scheduleEditable);
    const visibleBatches = safeBatches.slice(0, limit);
    const hiddenCount = Math.max(safeBatches.length - limit, 0);
    const scheduleLeftColumnWidth = showRoundLabels ? 104 : 84;
    const scheduleCourtMinWidth = 140;

    const renderScoreControl = (item, side) => {
      const scoreKey = side === "A" ? "scoreA" : "scoreB";
      const scoreValue = String(item?.[scoreKey] ?? "");
      const teamLabel = side === "A" ? item.teamA : item.teamB;

      return (
        <div
          style={styles.tournamentScheduleScoreStepper}
          data-schedule-control="true"
        >
          <button
            type="button"
            style={styles.tournamentScheduleScoreButton}
            onClick={() => incrementMatchScore(item.id, side, -1)}
            aria-label={`${teamLabel} ${
              language === "no" ? "reduser score" : "decrease score"
            }`}
          >
            <SvgIcon type="minus" size={12} strokeWidth={2.6} />
          </button>
          <input
            style={styles.tournamentScheduleScoreInput}
            inputMode="numeric"
            value={scoreValue}
            onChange={(e) => updateMatchScore(item.id, side, e.target.value)}
            placeholder="0"
          />
          <button
            type="button"
            style={styles.tournamentScheduleScoreButton}
            onClick={() => incrementMatchScore(item.id, side, 1)}
            aria-label={`${teamLabel} ${
              language === "no" ? "øk score" : "increase score"
            }`}
          >
            <SvgIcon type="plus" size={12} strokeWidth={2.6} />
          </button>
        </div>
      );
    };

    const renderScheduleTeamRow = (item, side) => {
      const isSideA = side === "A";
      const teamName = isSideA
        ? item.teamA || item.sourceA || "-"
        : item.teamB || item.sourceB || "-";
      const scoreValue = String(item?.[isSideA ? "scoreA" : "scoreB"] ?? "");
      const hasScore = hasScoreValue(scoreValue);

      return (
        <div style={styles.tournamentScheduleTeamLine}>
          <span
            style={{
              ...styles.tournamentScheduleTeamName,
              ...(publicTheme ? { color: publicTheme.text } : {}),
            }}
          >
            {teamName}
          </span>
          {editableScores ? (
            renderScoreControl(item, side)
          ) : (
            <span
              style={{
                ...styles.tournamentScheduleReadonlyScore,
                ...(publicTheme ? { color: publicTheme.text } : {}),
              }}
            >
              {hasScore ? scoreValue : ""}
            </span>
          )}
        </div>
      );
    };

    const renderScheduleMatchTeams = (item) => {
      if (!item) {
        return <strong style={styles.tournamentScheduleMatchTeams}>{tournamentText.openCourt}</strong>;
      }

      return (
        <div style={styles.tournamentScheduleMatchTeams}>
          {renderScheduleTeamRow(item, "A")}
          <span
            style={{
              ...styles.tournamentScheduleVsLabel,
              ...(publicTheme ? { color: publicTheme.mutedText } : {}),
            }}
          >
            {tournamentText.vsLabel}
          </span>
          {renderScheduleTeamRow(item, "B")}
        </div>
      );
    };

    if (!visibleBatches.length) {
      return (
        <div style={styles.tournamentMutedPanel}>
          {tournamentText.noMatchesYet}
        </div>
      );
    }

    return (
      <div style={styles.tournamentScheduleWrap}>
        {canEditScheduleStructure && selectedMoveMatchId && (
          <div style={styles.tournamentScheduleSwapNotice}>
            <span>{tournamentText.moveModeMessage}</span>
            <button
              type="button"
              data-schedule-control="true"
              onClick={() => {
                setSelectedMoveMatchId("");
                setPendingScheduleMoveMode("swap");
              }}
            >
              {tournamentText.cancelMove}
            </button>
          </div>
        )}
        <div
          style={{
            ...styles.tournamentScheduleGrid,
            minWidth: `${Math.max(
              520,
              safeCourtCount * scheduleCourtMinWidth + scheduleLeftColumnWidth
            )}px`,
          }}
        >
          <div
            style={{
              ...styles.tournamentScheduleHeaderRow,
              gridTemplateColumns: `${scheduleLeftColumnWidth}px minmax(0, 1fr)`,
            }}
          >
            <div
              style={{
                ...styles.tournamentScheduleCornerCell,
                ...(publicTheme
                  ? {
                      background: publicTheme.surface,
                      borderColor: publicTheme.border,
                      color: publicTheme.mutedText,
                    }
                  : {}),
              }}
            >
              {tournamentText.scheduleTimeColumn}
            </div>
            <div
              style={{
                ...styles.tournamentScheduleCourts,
                gridTemplateColumns: `repeat(${safeCourtCount}, minmax(${scheduleCourtMinWidth}px, 1fr))`,
              }}
            >
              {Array.from({ length: safeCourtCount }, (_, courtIndex) => (
                <div
                  key={`schedule-court-header-${courtIndex}`}
                  style={{
                    ...styles.tournamentScheduleCourtHeader,
                    ...(publicTheme
                      ? {
                          background: publicTheme.surface,
                          borderColor: publicTheme.border,
                          color: publicTheme.text,
                        }
                      : {}),
                  }}
                >
                  {tournamentText.courtLabel} {courtIndex + 1}
                </div>
              ))}
            </div>
          </div>

          {visibleBatches.map((batch) => (
            <div
              key={batch.id}
              style={{
                ...styles.tournamentScheduleRow,
                gridTemplateColumns: `${scheduleLeftColumnWidth}px minmax(0, 1fr)`,
              }}
            >
              <div
                style={{
                  ...styles.tournamentScheduleTimeCell,
                  ...(publicTheme
                    ? {
                        background: publicTheme.surface,
                        borderColor: publicTheme.border,
                        color: publicTheme.text,
                      }
                    : {}),
                }}
              >
                {showRoundLabels && (
                  <span>
                    {tournamentText.roundLabel || tournamentText.batchLabel}{" "}
                    {batch.number}
                  </span>
                )}
                <strong>{batch.time}</strong>
                <small>
                  {batch.duration} {tournamentText.minutesShort}
                </small>
              </div>
              <div
                style={{
                  ...styles.tournamentScheduleCourts,
                  gridTemplateColumns: `repeat(${safeCourtCount}, minmax(${scheduleCourtMinWidth}px, 1fr))`,
                }}
              >
                {batch.items.map((item, courtIndex) => {
                  const slotPlacement = getScheduleSlotPlacement(
                    batch,
                    Number(batch.number || 1) - 1,
                    courtIndex,
                    safeCourtCount
                  );
                  const groupColor = item?.groupColor || null;
                  const courtBlock = getCourtBlockForSlot(
                    courtBlocks,
                    courtIndex + 1,
                    batch.time,
                    batch.duration
                  );
                  const displayStatus = getMatchDisplayStatus(item);
                  const resultTypeLabel = getMatchResultTypeLabel(item);
                  const finishWarning = editableScores && item
                    ? matchFinishWarnings[item.id]
                    : "";
                  const canCompleteMatch =
                    editableScores &&
                    item &&
                    !isMatchCompleted(item);
                  const shouldShowStatusBadge =
                    item &&
                    (isMatchCompleted(item) ||
                      displayStatus.status === "in_progress");
                  const canUseMatchActions =
                    item && (canEditScheduleStructure || editableScores);
                  const showScheduleMenu =
                    canUseMatchActions &&
                    item &&
                    activeScheduleEditMatchId === item.id;
                  const showWalkoverEditor =
                    editableScores && item && walkoverDraft.matchId === item.id;
                  const isScheduleMoveMode =
                    canEditScheduleStructure && Boolean(selectedMoveMatchId);
                  const selectedMoveMatch = isScheduleMoveMode
                    ? (activeTournament?.matches || []).find(
                        (match) => match.id === selectedMoveMatchId
                      )
                    : null;
                  const isSelectedUnplacedMatch = Boolean(
                    selectedMoveMatch?.unplaced ||
                      selectedMoveMatch?.needsManualPlacement
                  );
                  const isSelectedMoveSource =
                    item && item.id === selectedMoveMatchId;
                  const isValidMoveTarget =
                    isScheduleMoveMode &&
                    !courtBlock &&
                    (!item || item.id !== selectedMoveMatchId);
                  const targetMoveLabel = isValidMoveTarget
                    ? isSelectedUnplacedMatch && !item
                      ? tournamentText.placeHere
                      : pendingScheduleMoveMode === "insert"
                      ? language === "no"
                        ? "Sett inn her"
                        : "Insert here"
                      : item
                        ? language === "no"
                          ? "Bytt hit"
                          : "Swap here"
                        : language === "no"
                          ? "Sett inn her"
                          : "Insert here"
                    : "";
                  const handleScheduleCellClick = (event) => {
                    if (!isScheduleMoveMode || courtBlock) return;
                    if (
                      event.target?.closest &&
                      event.target.closest('[data-schedule-control="true"]')
                    ) {
                      return;
                    }
                    moveScheduleSelectionToTarget(item?.id || "", slotPlacement);
                  };

                  return (
                    <div
                      key={`${batch.id}-court-${courtIndex}`}
                      role={isScheduleMoveMode ? "button" : undefined}
                      tabIndex={isScheduleMoveMode ? 0 : undefined}
                      onClick={handleScheduleCellClick}
                      onKeyDown={(event) => {
                        if (
                          isScheduleMoveMode &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          if (
                            event.target?.closest &&
                            event.target.closest('[data-schedule-control="true"]')
                          ) {
                            return;
                          }
                          event.preventDefault();
                          moveScheduleSelectionToTarget(item?.id || "", slotPlacement);
                        }
                      }}
                      style={{
                        ...styles.tournamentScheduleCourt,
                        ...(publicTheme
                          ? {
                              background: publicTheme.panel,
                              color: publicTheme.text,
                              borderColor: publicTheme.border,
                            }
                          : {}),
                        ...(courtBlock ? styles.tournamentScheduleBlockedCourt : {}),
                        ...(groupColor
                          ? {
                              background: `linear-gradient(135deg, ${groupColor.soft}, ${publicTheme?.panel || "#ffffff"} 78%)`,
                              borderLeft: `4px solid ${groupColor.accent}`,
                            }
                          : {}),
                        ...(isSelectedMoveSource
                          ? styles.tournamentScheduleSelectedSource
                          : {}),
                        ...(isValidMoveTarget
                          ? styles.tournamentScheduleValidTarget
                          : {}),
                      }}
                    >
                      {item?.stage === "knockout" && item.round && (
                        <small style={styles.tournamentScheduleRoundLabel}>
                          {item.round}
                        </small>
                      )}
                      {item?.seriesName && (
                        <span
                          style={{
                            ...styles.tournamentScheduleSeriesBadge,
                            ...(publicTheme
                              ? {
                                  background: publicTheme.surface,
                                  borderColor: publicTheme.border,
                                  color: publicTheme.primary,
                                }
                              : {}),
                          }}
                        >
                          {item.seriesName}
                        </span>
                      )}
                      {isSelectedMoveSource && (
                        <span style={styles.tournamentScheduleSelectedBadge}>
                          {tournamentText.selectedLabel}
                        </span>
                      )}
                      {isValidMoveTarget && (
                        <div
                          style={styles.tournamentScheduleTargetActions}
                          data-schedule-control="true"
                        >
                          <button
                            type="button"
                            style={styles.tournamentScheduleTargetButton}
                            title={targetMoveLabel}
                            aria-label={targetMoveLabel}
                            onClick={(event) => {
                              event.stopPropagation();
                              moveScheduleSelectionToTarget(
                                item?.id || "",
                                slotPlacement,
                                isSelectedUnplacedMatch && !item ? "insert" : ""
                              );
                            }}
                          >
                            {targetMoveLabel}
                          </button>
                          {isSelectedUnplacedMatch && item && (
                            <button
                              type="button"
                              style={styles.tournamentScheduleTargetButton}
                              title={tournamentText.insertHere}
                              aria-label={tournamentText.insertHere}
                              onClick={(event) => {
                                event.stopPropagation();
                                moveScheduleSelectionToTarget(
                                  item.id,
                                  slotPlacement,
                                  "insert"
                                );
                              }}
                            >
                              {tournamentText.insertHere}
                            </button>
                          )}
                        </div>
                      )}
                      {courtBlock ? (
                        <div style={styles.tournamentScheduleBlockedContent}>
                          <strong>{tournamentText.courtBlocked}</strong>
                          {courtBlock.reason && <small>{courtBlock.reason}</small>}
                          {item && (
                            <small>
                              {item.teamA} {tournamentText.vsLabel} {item.teamB}
                            </small>
                          )}
                          {item?.needsReschedule && (
                            <span style={styles.tournamentScheduleResultBadge}>
                              {tournamentText.needsReschedule}
                            </span>
                          )}
                        </div>
                      ) : (
                        renderScheduleMatchTeams(item)
                      )}
                      {!courtBlock && showScheduleMenu && (
                        <div
                          style={styles.tournamentScheduleMenu}
                          data-schedule-control="true"
                        >
                          {canEditScheduleStructure && (
                            <button
                              type="button"
                              style={styles.tournamentScheduleMenuAction}
                              onClick={() => startScheduleMoveMode(item.id, "insert")}
                            >
                              {tournamentText.insertPush}
                            </button>
                          )}
                          {editableScores && (
                            <button
                              type="button"
                              style={styles.tournamentScheduleMenuAction}
                              onClick={() =>
                              setWalkoverDraft({
                                matchId: item.id,
                                resultType: "walkover",
                                note: "",
                              })
                              }
                            >
                              {tournamentText.markWalkover}
                            </button>
                          )}
                          {editableScores && (
                            <button
                              type="button"
                              style={styles.tournamentScheduleMenuAction}
                              onClick={() => clearMatchResult(item.id)}
                            >
                              {tournamentText.clearResult}
                            </button>
                          )}
                        </div>
                      )}
                      {!courtBlock && showWalkoverEditor && (
                        <div
                          style={styles.tournamentWalkoverEditor}
                          data-schedule-control="true"
                        >
                          <select
                            style={styles.tournamentScheduleSelect}
                            value={walkoverDraft.resultType}
                            onChange={(e) =>
                              setWalkoverDraft((prev) => ({
                                ...prev,
                                resultType: e.target.value,
                              }))
                            }
                          >
                            <option value="walkover">
                              {tournamentText.walkover}
                            </option>
                            <option value="no_show">
                              {tournamentText.noShow}
                            </option>
                          </select>
                          <input
                            style={styles.tournamentScheduleNoteInput}
                            value={walkoverDraft.note}
                            onChange={(e) =>
                              setWalkoverDraft((prev) => ({
                                ...prev,
                                note: e.target.value,
                              }))
                            }
                            placeholder={tournamentText.reasonNote}
                          />
                          <div style={styles.tournamentWalkoverActions}>
                            <button
                              style={styles.tournamentWalkoverButton}
                              onClick={() =>
                                markMatchWalkover(
                                  item.id,
                                  "A",
                                  walkoverDraft.resultType,
                                  walkoverDraft.note
                                )
                              }
                            >
                              {tournamentText.winnerLabelShort}: {item.teamA}
                            </button>
                            <button
                              style={styles.tournamentWalkoverButton}
                              onClick={() =>
                                markMatchWalkover(
                                  item.id,
                                  "B",
                                  walkoverDraft.resultType,
                                  walkoverDraft.note
                                )
                              }
                            >
                              {tournamentText.winnerLabelShort}: {item.teamB}
                            </button>
                          </div>
                        </div>
                      )}
                      {!courtBlock && item &&
                        (shouldShowStatusBadge ||
                          canEditScheduleStructure ||
                          canCompleteMatch ||
                          resultTypeLabel ||
                          finishWarning ||
                          canUseMatchActions) && (
                          <div style={styles.tournamentScheduleMetaRow}>
                            {canEditScheduleStructure && (
                              <button
                                type="button"
                                data-schedule-control="true"
                                style={styles.tournamentScheduleMoveButton}
                                title="Move / Flytt"
                                aria-label="Move / Flytt"
                                onClick={() => startScheduleMoveMode(item.id, "swap")}
                              >
                                {language === "no" ? "Flytt" : "Move"}
                              </button>
                            )}
                            {shouldShowStatusBadge && (
                              <span
                                style={{
                                  ...styles.tournamentScheduleStatusBadge,
                                  ...(displayStatus.status === "completed"
                                    ? styles.tournamentScheduleStatusBadgeDone
                                    : {}),
                                }}
                              >
                                {displayStatus.label}
                              </span>
                            )}
                            {resultTypeLabel && (
                              <span style={styles.tournamentScheduleResultBadge}>
                                {resultTypeLabel}
                              </span>
                            )}
                            {canCompleteMatch && (
                              <button
                                type="button"
                                data-schedule-control="true"
                                style={styles.tournamentScheduleCompleteButton}
                                onClick={() => confirmMatchCompleted(item.id)}
                              >
                                {tournamentText.markFinished}
                              </button>
                            )}
                            {finishWarning && (
                              <span
                                style={styles.tournamentScheduleFinishWarning}
                                title={tournamentText.knockoutNeedsWinner}
                              >
                                {finishWarning}
                              </span>
                            )}
                            {canUseMatchActions && (
                              <button
                                type="button"
                                data-schedule-control="true"
                                style={styles.tournamentScheduleMenuButton}
                                onClick={() =>
                                  setActiveScheduleEditMatchId((current) =>
                                    current === item.id ? "" : item.id
                                  )
                                }
                                aria-label={tournamentText.actionsLabel}
                                title={tournamentText.actionsLabel}
                              >
                                <SvgIcon type="more" size={15} strokeWidth={2.2} />
                              </button>
                            )}
                          </div>
                      )}
                      {!item && <small>{tournamentText.breakLabel}</small>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {hiddenCount > 0 && (
          <div style={styles.tournamentScheduleMore}>
            +{hiddenCount} {tournamentText.moreBatchesLabel}
          </div>
        )}
      </div>
    );
  }

  function renderPublicTournamentPage(tournament, loadStatus = "ready") {
    const safeTournament = tournament ? applyTournamentDefaults(tournament) : null;
    const isPublicTournamentLoading = loadStatus === "loading";
    const publicSeriesClasses = safeTournament
      ? getTournamentSeriesClasses(safeTournament, language)
      : [];
    const hasPublicExplicitSeries = hasExplicitTournamentSeries(safeTournament);
    const publicVisibleSeriesClasses = publicSeriesClasses
      .filter((series) =>
        hasPublicExplicitSeries
          ? ["live", "completed"].includes(series.publicStatus)
          : series.publicStatus !== "hidden"
      )
      .sort((a, b) => {
        const statusRank = { live: 0, completed: 1, hidden: 2 };
        const rankDelta =
          (statusRank[a.publicStatus] ?? 2) - (statusRank[b.publicStatus] ?? 2);
        if (rankDelta) return rankDelta;
        return (
          publicSeriesClasses.findIndex((series) => series.id === a.id) -
          publicSeriesClasses.findIndex((series) => series.id === b.id)
        );
      });
    const publicSeriesSections = safeTournament
      ? getTournamentSeriesRenderSections(
          safeTournament,
          publicVisibleSeriesClasses
        )
      : [];
    const groups = publicSeriesSections.flatMap((section) =>
      section.groups.map((group) => ({
        ...group,
        seriesId: section.series.id,
        seriesName: section.series.name,
        name: hasPublicExplicitSeries
          ? `${section.series.name} - ${
              group.name || `${tournamentText.groupLabel} ${group.code || ""}`
            }`
          : group.name,
      }))
    );
    const matches = Array.isArray(safeTournament?.matches)
      ? safeTournament.matches
      : [];
    const standings = publicSeriesSections.flatMap((section) =>
      section.standings.map((standing) => ({
        ...standing,
        seriesId: section.series.id,
        seriesName: section.series.name,
        groupName: hasPublicExplicitSeries
          ? `${section.series.name} - ${standing.groupName}`
          : standing.groupName,
      }))
    ).filter((standing) => (standing.rows || []).length > 0);
    const publicStandingsCount = standings.length;
    const builtPublicSchedule = safeTournament
      ? buildTournamentHallSchedule(safeTournament)
      : { batches: [], courtCount: 1 };
    const publicVisibleSeriesIds = publicVisibleSeriesClasses.map(
      (series) => series.id
    );
    const publicStatusBySeriesId = new Map(
      publicVisibleSeriesClasses.map((series) => [String(series.id), series.publicStatus])
    );
    const getPublicScheduleBatchStatusRank = (batch) => {
      if (!hasPublicExplicitSeries) return 0;
      const itemStatuses = (batch.items || [])
        .filter(Boolean)
        .map((item) => publicStatusBySeriesId.get(String(item.seriesId || "")));
      return itemStatuses.includes("live") ? 0 : 1;
    };
    const publicSchedule = {
      ...builtPublicSchedule,
      batches: filterScheduleBatchesBySeriesIds(
        builtPublicSchedule.batches,
        publicVisibleSeriesIds,
        hasPublicExplicitSeries
      ).sort(
        (a, b) =>
          getPublicScheduleBatchStatusRank(a) -
            getPublicScheduleBatchStatusRank(b) ||
          Number(a.number || 0) - Number(b.number || 0)
      ),
    };
    const publicTheme = safeTournament
      ? getTournamentPublicLiveTheme(safeTournament)
      : getDefaultPublicLiveTheme();
    const publicLiveLogoUrl = getTournamentPublicLiveLogoUrl(safeTournament);
    const publicLiveBackgroundUrl =
      getTournamentPublicLiveBackgroundUrl(safeTournament);
    const publicPageBackground = publicLiveBackgroundUrl
      ? `linear-gradient(135deg, ${hexToRgba(
          publicTheme.background,
          0.88
        )}, ${hexToRgba(publicTheme.surface, 0.92)}), url(${publicLiveBackgroundUrl})`
      : publicTheme.background;
    const publicHeroBackground = publicLiveBackgroundUrl
      ? `linear-gradient(145deg, ${hexToRgba(
          publicTheme.surface,
          0.90
        )}, ${hexToRgba(publicTheme.panel, 0.88)}), url(${publicLiveBackgroundUrl})`
      : `linear-gradient(145deg, ${publicTheme.surface}, ${publicTheme.panel})`;
    const hasGroups = publicSeriesSections.some(
      (section) => section.groups.length > 0
    );
    const hasKnockout = publicSeriesSections.some(
      (section) => section.knockoutStages.length > 0
    );
    const teamCount = groups.reduce(
      (sum, group) =>
        sum +
        (group.teams || []).filter((team) => String(team.name || "").trim())
        .length,
      0
    );
    const publicSeriesLabels = publicVisibleSeriesClasses.map((series) =>
      Number(series.playersPerTeam || series.teamSize) === 4
        ? tournamentText.fourSide
        : Number(series.playersPerTeam || series.teamSize) === 5
          ? tournamentText.fiveSide
          : getSeriesDisplayName(series, language)
    );
    const publicLocation = [
      safeTournament?.locationName,
      safeTournament?.city,
      safeTournament?.country,
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");
    const allKnockoutMatches = publicSeriesSections.flatMap(
      (section) => section.knockoutMatches
    );
    const publicLiveSeries = publicVisibleSeriesClasses.filter(
      (series) => series.publicStatus === "live"
    );
    const publicCompletedSeries = publicVisibleSeriesClasses.filter(
      (series) => series.publicStatus === "completed"
    );
    const hasPublicVisibleSeries = publicVisibleSeriesClasses.length > 0;
    const publicClassStatusNotice =
      publicLiveSeries.length > 0 && publicCompletedSeries.length > 0
        ? `${publicCompletedSeries
            .map((series) => `${series.name} ${tournamentText.classFinishedSuffix}`)
            .join(". ")}. ${publicLiveSeries
            .map((series) => `${series.name} ${tournamentText.classLiveNowSuffix}`)
            .join(". ")}.`
        : "";
    const publicSectionStyle = {
      ...styles.publicTournamentSection,
      background: publicTheme.surface,
      borderColor: publicTheme.border,
      color: publicTheme.text,
    };
    const publicSecondarySectionStyle = {
      ...publicSectionStyle,
      background: hexToRgba(publicTheme.surface, 0.88),
    };
    const publicSectionHeaderStyle = {
      ...styles.publicTournamentSectionHeader,
      color: publicTheme.text,
    };
    const publicBackButtonStyle = {
      ...styles.publicTournamentBackButton,
      background: publicTheme.surface,
      borderColor: publicTheme.border,
      color: publicTheme.text,
    };
    const publicStatusPillStyle = {
      ...styles.publicTournamentStatusPill,
      background: publicTheme.surface,
      borderColor: publicTheme.border,
      color: publicTheme.primary,
    };
    const publicMutedStyle = {
      ...styles.publicTournamentMuted,
      color: publicTheme.mutedText,
    };
    const findPublicKnockoutMatch = (label, contextMatches = allKnockoutMatches) =>
      contextMatches.find(
        (match) => match?.label === label || match?.id === label
      );

    const resolvePublicSource = (source, depth = 0, context = {}) => {
      const contextGroups = context.groups || groups;
      const contextStandings =
        context.standings || publicSeriesSections.flatMap((section) => section.standings);
      const contextMatches = context.matches || matches;
      const contextKnockoutMatches =
        context.knockoutMatches || allKnockoutMatches;
      const raw = String(source || "").trim();
      if (!raw || depth > 8) return raw;

      const groupPosition = raw.match(/^([A-Z])([12])$/);
      if (groupPosition) {
        const [, groupCode, position] = groupPosition;
        const groupIndex = contextGroups.findIndex((group) => group.code === groupCode);
        const group = contextGroups[groupIndex];
        const standing = contextStandings.find((item) => item.groupId === group?.id);
        const hasCompletedGroupMatch = contextMatches.some(
          (match) =>
            match.groupId === group?.id &&
            isMatchCompleted(match)
        );

        if (!standing || !hasCompletedGroupMatch) return raw;
        return position === "1"
          ? standing.rows?.[0]?.teamName || raw
          : standing.rows?.[1]?.teamName || raw;
      }

      const winnerMatch = raw.match(/^Winner (QF\d+|SF\d+)$/);
      if (winnerMatch) {
        const match = findPublicKnockoutMatch(
          winnerMatch[1],
          contextKnockoutMatches
        );
        return match?.winnerSource
          ? resolvePublicSource(match.winnerSource, depth + 1, context)
          : raw;
      }

      const loserMatch = raw.match(/^Loser (QF\d+|SF\d+)$/);
      if (loserMatch) {
        const match = findPublicKnockoutMatch(
          loserMatch[1],
          contextKnockoutMatches
        );
        return match?.loserSource
          ? resolvePublicSource(match.loserSource, depth + 1, context)
          : raw;
      }

      return raw;
    };

    const renderPublicKnockoutMatch = (match, context = {}) => {
      const sourceA = match.sourceA || match.teamA;
      const sourceB = match.sourceB || match.teamB;
      const teamA = resolvePublicSource(sourceA, 0, context);
      const teamB = resolvePublicSource(sourceB, 0, context);
      const winner = match.winnerSource
        ? resolvePublicSource(match.winnerSource, 0, context)
        : "";

      return (
        <div
          key={match.id}
          style={{
            ...styles.publicTournamentBracketMatch,
            background: publicTheme.panel,
            borderColor: publicTheme.border,
            color: publicTheme.text,
          }}
        >
          <div
            style={{
              ...styles.publicTournamentMatchLabel,
              color: publicTheme.text,
            }}
          >
            {match.label || match.id}
          </div>
          {[sourceA, sourceB].map((source, index) => {
            const resolved = index === 0 ? teamA : teamB;
            const isWinner = winner && winner === resolved;
            const sourceGroupCode = getTournamentSourceGroupCode(source);
            const sourceGroupColor = sourceGroupCode
              ? getTournamentGroupColor(sourceGroupCode)
              : null;

            return (
              <div
                key={`${match.id}-${source || index}`}
                style={{
                  ...styles.publicTournamentBracketLine,
                  background: publicTheme.surface,
                  borderColor: publicTheme.border,
                  color: publicTheme.mutedText,
                  ...(isWinner
                    ? {
                        background: publicTheme.primary,
                        borderColor: publicTheme.border,
                        color: publicTheme.background,
                      }
                    : {}),
                }}
              >
                <span
                  style={
                    sourceGroupColor
                      ? {
                          ...styles.publicTournamentSourceBadge,
                          background: sourceGroupColor.publicSoft,
                          borderColor: sourceGroupColor.publicBorder,
                          color: sourceGroupColor.publicText,
                        }
                      : styles.publicTournamentSourceBadge
                  }
                >
                  {source || "-"}
                </span>
                <strong>{resolved || "-"}</strong>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div
        style={{
          ...styles.publicTournamentPage,
          ...getPublicThemeStyle(publicTheme),
          background: publicPageBackground,
          backgroundSize: publicLiveBackgroundUrl ? "cover" : undefined,
          backgroundPosition: publicLiveBackgroundUrl ? "center" : undefined,
          backgroundAttachment: publicLiveBackgroundUrl ? "fixed" : undefined,
          color: publicTheme.text,
        }}
      >
        <main style={styles.publicTournamentShell}>
          <div style={styles.publicTournamentTopbar}>
            <button
              style={publicBackButtonStyle}
              onClick={openAppFromPublicTournament}
            >
              {tournamentText.openApp}
            </button>
          </div>

          {!safeTournament ? (
            <section
              style={{
                ...styles.publicTournamentEmpty,
                background: publicTheme.surface,
                borderColor: publicTheme.border,
                color: publicTheme.text,
              }}
            >
              <div style={publicStatusPillStyle}>
                {tournamentText.publicPreviewTitle}
              </div>
              <h1
                style={{
                  ...styles.publicTournamentEmptyTitle,
                  color: publicTheme.text,
                }}
              >
                {isPublicTournamentLoading
                  ? tournamentText.loadingTournament
                  : tournamentText.publicNotFound}
              </h1>
              {!isPublicTournamentLoading && (
                <>
                  <p style={publicMutedStyle}>
                    {tournamentText.backendPublicRequired}
                  </p>
                  <p style={publicMutedStyle}>
                    {loadStatus === "error"
                      ? tournamentText.tournamentBackendTodo
                      : tournamentText.backendPublicLinkPending}
                  </p>
                </>
              )}
            </section>
          ) : (
            <>
              <section
                style={{
                  ...styles.publicTournamentHero,
                  background: publicHeroBackground,
                  backgroundSize: publicLiveBackgroundUrl ? "cover" : undefined,
                  backgroundPosition: publicLiveBackgroundUrl ? "center" : undefined,
                  borderColor: publicTheme.border,
                  color: publicTheme.text,
                }}
              >
                <div style={styles.publicTournamentHeroTop}>
                  {publicLiveLogoUrl && (
                    <span
                      style={{
                        ...styles.publicTournamentHeroLogo,
                        background: publicTheme.surface,
                        borderColor: publicTheme.border,
                      }}
                    >
                      <img
                        src={publicLiveLogoUrl}
                        alt=""
                        style={styles.publicTournamentHeroLogoImage}
                      />
                    </span>
                  )}
                  <span style={publicStatusPillStyle}>
                    {tournamentText.publicLinkReadonly}
                  </span>
                </div>

                <h1
                  style={{
                    ...styles.publicTournamentTitle,
                    color: publicTheme.text,
                  }}
                >
                  {getTournamentPublicTitle(safeTournament)}
                </h1>
                {String(safeTournament.rules || "").trim() && (
                  <p
                    style={{
                      ...styles.publicTournamentDescription,
                      color: publicTheme.mutedText,
                    }}
                  >
                    {safeTournament.rules}
                  </p>
                )}
                {getTournamentPublicSummary(safeTournament) && (
                  <p
                    style={{
                      ...styles.publicTournamentDescription,
                      color: publicTheme.mutedText,
                    }}
                  >
                    {getTournamentPublicSummary(safeTournament)}
                  </p>
                )}

                <div style={styles.publicTournamentSummaryGrid}>
                  {[
                    [tournamentText.dateLabel, formatPublicTournamentDate(safeTournament)],
                    [tournamentText.locationLabel, publicLocation],
                    [
                      tournamentText.seriesLabel,
                      Array.from(new Set(publicSeriesLabels)).join(" / "),
                    ],
                    [tournamentText.prizeLabel, safeTournament.prizeText],
                    [
                      tournamentText.registrationDeadlineLabel,
                      safeTournament.registrationDeadline,
                    ],
                    [tournamentText.teamsLabel, teamCount],
                  ].filter(([, value]) => String(value || "").trim()).map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        ...styles.publicTournamentSummaryCard,
                        background: publicTheme.panel,
                        borderColor: publicTheme.border,
                        color: publicTheme.text,
                      }}
                    >
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                {hasPublicVisibleSeries && (
                  <div style={styles.publicTournamentClassStatusList}>
                    {publicVisibleSeriesClasses.map((series) => {
                      const isCompleted = series.publicStatus === "completed";
                      return (
                        <span
                          key={`public-status-${series.id}`}
                          style={{
                            ...styles.publicTournamentClassStatusBadge,
                            ...(isCompleted
                              ? styles.publicTournamentClassStatusBadgeDone
                              : {}),
                          }}
                        >
                          {series.name}{" "}
                          {isCompleted
                            ? tournamentText.classFinishedSuffix
                            : tournamentText.classLiveSuffix}
                        </span>
                      );
                    })}
                  </div>
                )}
              </section>

              {publicClassStatusNotice && (
                <section style={publicSecondarySectionStyle}>
                  {publicClassStatusNotice}
                </section>
              )}

              {!hasPublicVisibleSeries && (
                <section style={publicSectionStyle}>
                  <div style={publicMutedStyle}>
                    {tournamentText.noClassLiveYet}
                  </div>
                </section>
              )}

              {publicSchedule.batches.length > 0 && (
                <section style={publicSectionStyle}>
                  <div style={publicSectionHeaderStyle}>
                    <span>{tournamentText.scheduleTitle}</span>
                    <strong>
                      {publicSchedule.batches.length}{" "}
                      {tournamentText.batchesLabel}
                    </strong>
                  </div>
                  {renderTournamentHallScheduleGrid({
                    hallScheduleBatches: publicSchedule.batches,
                    scheduleCourtCount: publicSchedule.courtCount,
                    limit: 18,
                    showRoundLabels:
                      shouldShowTournamentRoundLabels(safeTournament),
                    publicTheme,
                    courtBlocks: safeTournament?.courtBlocks || [],
                  })}
                </section>
              )}

              {standings.length > 0 && (
                <section style={publicSectionStyle}>
                  <div style={publicSectionHeaderStyle}>
                    <span>{tournamentText.standingsTitle}</span>
                    <strong>{publicStandingsCount}</strong>
                  </div>
                  <div style={styles.tournamentStandingsList}>
                    {standings.map((group, groupIndex) => {
                      const sourceGroup =
                        groups.find((item) => item.id === group.groupId) || {};
                      const groupCode =
                        sourceGroup.code || getTournamentGroupCode(groupIndex);
                      const groupColor = getTournamentGroupColor(groupCode);

                      return (
                        <div
                          key={`public-standings-${group.groupId}`}
                          style={{
                            ...styles.tournamentStandingsCard,
                            background: `linear-gradient(135deg, ${groupColor.publicSoft}, ${publicTheme.panel} 72%)`,
                            borderColor: groupColor.publicBorder,
                            borderTop: `4px solid ${groupColor.publicText}`,
                            borderLeft: `6px solid ${groupColor.publicText}`,
                            color: publicTheme.text,
                          }}
                        >
                          <div style={styles.tournamentStandingsHeader}>
                            <div
                              style={{
                                ...styles.tournamentMiniTitle,
                                color: publicTheme.text,
                              }}
                            >
                              {group.groupName ||
                                `${tournamentText.groupLabel} ${groupCode}`}
                            </div>
                            <span
                              style={{
                                ...styles.tournamentTeamSeed,
                                background: groupColor.publicSoft,
                                borderColor: groupColor.publicBorder,
                                color: groupColor.publicText,
                              }}
                            >
                              {groupCode}
                            </span>
                          </div>
                          <div style={styles.tournamentTableWrap}>
                            <table
                              style={{
                                ...styles.tournamentTable,
                                color: publicTheme.mutedText,
                              }}
                            >
                              <thead>
                                <tr>
                                  <th
                                    style={{
                                      ...styles.tournamentTableHead,
                                      color: publicTheme.primary,
                                      borderBottomColor: publicTheme.border,
                                    }}
                                  >
                                    {tournamentText.teamLabel}
                                  </th>
                                  <th
                                    style={{
                                      ...styles.tournamentTableHead,
                                      color: publicTheme.primary,
                                      borderBottomColor: publicTheme.border,
                                    }}
                                  >
                                    {tournamentText.playedShort}
                                  </th>
                                  <th
                                    style={{
                                      ...styles.tournamentTableHead,
                                      color: publicTheme.primary,
                                      borderBottomColor: publicTheme.border,
                                    }}
                                  >
                                    {tournamentText.winsShort}
                                  </th>
                                  <th
                                    style={{
                                      ...styles.tournamentTableHead,
                                      color: publicTheme.primary,
                                      borderBottomColor: publicTheme.border,
                                    }}
                                  >
                                    {tournamentText.drawsShort}
                                  </th>
                                  <th
                                    style={{
                                      ...styles.tournamentTableHead,
                                      color: publicTheme.primary,
                                      borderBottomColor: publicTheme.border,
                                    }}
                                  >
                                    {tournamentText.lossesShort}
                                  </th>
                                  <th
                                    style={{
                                      ...styles.tournamentTableHead,
                                      color: publicTheme.primary,
                                      borderBottomColor: publicTheme.border,
                                    }}
                                  >
                                    {tournamentText.pointsShort}
                                  </th>
                                  <th
                                    style={{
                                      ...styles.tournamentTableHead,
                                      color: publicTheme.primary,
                                      borderBottomColor: publicTheme.border,
                                    }}
                                  >
                                    {tournamentText.scoreForShort}
                                  </th>
                                  <th
                                    style={{
                                      ...styles.tournamentTableHead,
                                      color: publicTheme.primary,
                                      borderBottomColor: publicTheme.border,
                                    }}
                                  >
                                    {tournamentText.scoreAgainstShort}
                                  </th>
                                  <th
                                    style={{
                                      ...styles.tournamentTableHead,
                                      color: publicTheme.primary,
                                      borderBottomColor: publicTheme.border,
                                    }}
                                  >
                                    {tournamentText.scoreDiffShort}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.rows.map((row) => (
                                  <tr
                                    key={`public-row-${group.groupId}-${row.teamName}`}
                                  >
                                    <td
                                      style={{
                                        ...styles.tournamentTableTeam,
                                        color: publicTheme.text,
                                        borderBottomColor: publicTheme.border,
                                      }}
                                    >
                                      {row.teamName}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.tournamentTableCell,
                                        color: publicTheme.mutedText,
                                        borderBottomColor: publicTheme.border,
                                      }}
                                    >
                                      {row.played}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.tournamentTableCell,
                                        color: publicTheme.mutedText,
                                        borderBottomColor: publicTheme.border,
                                      }}
                                    >
                                      {row.wins}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.tournamentTableCell,
                                        color: publicTheme.mutedText,
                                        borderBottomColor: publicTheme.border,
                                      }}
                                    >
                                      {row.draws}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.tournamentTableCell,
                                        color: publicTheme.mutedText,
                                        borderBottomColor: publicTheme.border,
                                      }}
                                    >
                                      {row.losses}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.tournamentTablePoints,
                                        color: publicTheme.primary,
                                        borderBottomColor: publicTheme.border,
                                      }}
                                    >
                                      {row.points}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.tournamentTableCell,
                                        color: publicTheme.mutedText,
                                        borderBottomColor: publicTheme.border,
                                      }}
                                    >
                                      {row.scoreFor}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.tournamentTableCell,
                                        color: publicTheme.mutedText,
                                        borderBottomColor: publicTheme.border,
                                      }}
                                    >
                                      {row.scoreAgainst}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.tournamentTableCell,
                                        color: publicTheme.mutedText,
                                        borderBottomColor: publicTheme.border,
                                      }}
                                    >
                                      {row.scoreDiff}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {hasGroups && (
                <section style={publicSecondarySectionStyle}>
                  <div style={publicSectionHeaderStyle}>
                    <span>{tournamentText.teamsGroupsTitle}</span>
                    <strong>{groups.length}</strong>
                  </div>
                  <div style={styles.publicTournamentGroupGrid}>
                    {groups.map((group, groupIndex) => {
                      const groupCode =
                        group.code || getTournamentGroupCode(groupIndex);
                      const groupColor = getTournamentGroupColor(groupCode);

                      return (
                        <article
                          key={group.id || group.code || groupIndex}
                          style={{
                            ...styles.publicTournamentGroupCard,
                            background: `linear-gradient(135deg, ${groupColor.publicSoft}, ${publicTheme.panel} 72%)`,
                            borderColor: groupColor.publicBorder,
                            borderLeft: `4px solid ${groupColor.publicText}`,
                            color: publicTheme.text,
                          }}
                        >
                          <div style={styles.publicTournamentGroupHeader}>
                            <h2
                              style={{
                                ...styles.publicTournamentGroupTitle,
                                color: publicTheme.text,
                              }}
                            >
                              {group.name ||
                                `${tournamentText.groupLabel} ${groupCode}`}
                            </h2>
                            <span
                              style={{
                                ...styles.publicTournamentGroupCode,
                                background: groupColor.publicSoft,
                                borderColor: groupColor.publicBorder,
                                color: groupColor.publicText,
                              }}
                            >
                              {groupCode}
                            </span>
                          </div>

                          <div style={styles.publicTournamentTeamList}>
                            {(group.teams || []).map((team, teamIndex) => (
                              <div
                                key={team.id || `${group.id}-${teamIndex}`}
                                style={{
                                  ...styles.publicTournamentTeamRow,
                                  background: publicTheme.surface,
                                  borderColor: publicTheme.border,
                                  color: publicTheme.mutedText,
                                }}
                              >
                                <span
                                  style={{
                                    ...styles.publicTournamentSlotBadge,
                                    background: groupColor.publicSoft,
                                    borderColor: groupColor.publicBorder,
                                    color: groupColor.publicText,
                                  }}
                                >
                                  {team.slot || `${groupCode}${teamIndex + 1}`}
                                </span>
                                <strong>
                                  {String(team.name || "").trim() ||
                                    team.slot ||
                                    `${groupCode}${teamIndex + 1}`}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {hasKnockout && (
                <section style={publicSectionStyle}>
                  <div style={publicSectionHeaderStyle}>
                    <span>{tournamentText.knockoutPreview}</span>
                    <strong>{allKnockoutMatches.length}</strong>
                  </div>
                  <div style={styles.publicTournamentBracketGrid}>
                    {publicSeriesSections
                      .filter((section) => section.knockoutStages.length > 0)
                      .map((section) => {
                        const sectionContext = {
                          groups: section.groups,
                          standings: section.standings,
                          matches: section.tournament.matches || [],
                          knockoutMatches: section.knockoutMatches,
                        };

                        return (
                          <div
                            key={`public-bracket-series-${section.series.id}`}
                            style={styles.publicTournamentBracketStage}
                          >
                            {hasPublicExplicitSeries && (
                              <div
                                style={{
                                  ...styles.publicTournamentBracketTitle,
                                  color: publicTheme.text,
                                }}
                              >
                                {section.series.name}
                              </div>
                            )}
                            {section.knockoutStages.map((stage) => (
                              <div
                                key={`${section.series.id}-${stage.key}`}
                                style={styles.publicTournamentBracketStage}
                              >
                                <div
                                  style={{
                                    ...styles.publicTournamentBracketTitle,
                                    color: publicTheme.primary,
                                  }}
                                >
                                  {stage.label}
                                </div>
                                {stage.matches.map((match) =>
                                  renderPublicKnockoutMatch(match, sectionContext)
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}

            </>
          )}
        </main>
      </div>
    );
  }

  function renderTournamentDashboard() {
    const visiblePrivateTournaments = filterTournamentsForUsername(
      tournaments,
      auth.username
    ).filter((tournament) => getTournamentIdentity(tournament));
    const isTournamentListLoading =
      auth.loggedIn &&
      tournamentSyncStatus === "loading" &&
      !tournamentBackendReady &&
      visiblePrivateTournaments.length === 0;
    const showTournamentCleanupTools =
      typeof process !== "undefined" &&
      process.env?.NODE_ENV !== "production";
    const dashboardTabs = [
      { id: "overview", label: tournamentText.overviewTab },
      { id: "groups", label: tournamentText.groupsTab },
      { id: "bracket", label: tournamentText.bracketTab },
      { id: "matches", label: tournamentText.matchesTitle },
      { id: "table", label: tournamentText.tableTab },
      { id: "sharing", label: tournamentText.sharingTab },
      { id: "promotion", label: tournamentText.promotionTab },
    ];

    const tournamentTeams = Array.isArray(activeTournament?.teams)
      ? activeTournament.teams
      : [];
    const shouldShowTournamentSetupPanel =
      !activeTournament || showTournamentSetupPanel;
    const tournamentMatches = Array.isArray(activeTournament?.matches)
      ? activeTournament.matches
      : [];
    const completedMatchesCount =
      tournamentMatches.filter(isMatchCompleted).length;
    const scheduledMatchesCount = tournamentMatches.filter(
      (match) => getMatchDisplayStatus(match).status === "scheduled"
    ).length;
    const isPublished = isTournamentPublished(activeTournament);
    const isPromotionListed = isTournamentPubliclyListed(activeTournament);
    const isPromotionVisibleOnUpcoming = Boolean(
      isPromotionListed &&
        activeTournament?.publicCode &&
        publicTournaments.some(
          (tournament) =>
            String(tournament.publicCode || "") ===
              String(activeTournament.publicCode || "") ||
            String(tournament.id || "") === String(activeTournament.id || "")
        )
    );
    const isPromotionBusy = promotionVisibilityAction !== "idle";
    const promotionVisibilityButtonLabel =
      promotionVisibilityAction === "publishing"
        ? tournamentText.publishingPromotion
        : promotionVisibilityAction === "hiding"
          ? tournamentText.promotionVerifyingBadge
          : isPromotionVisibleOnUpcoming
            ? tournamentText.visibleOnUpcomingPage
            : tournamentText.showOnUpcomingPage;
    const isBackendPublished = hasTournamentBackendPublicSync(activeTournament);
    const publicUrl = getPublicTournamentUrl(activeTournament);
    const activePublicTheme = normalizePublicTheme(activeTournament?.publicTheme);
    const activePublicLiveTheme = getTournamentPublicLiveTheme(activeTournament);
    const activePublicLiveLogoUrl =
      getTournamentPublicLiveLogoUrl(activeTournament);
    const activePublicLiveBackgroundUrl =
      getTournamentPublicLiveBackgroundUrl(activeTournament);
    const tournamentSeriesClasses = activeTournament
      ? getTournamentSeriesClasses(activeTournament, language)
      : [];
    const seriesPublicStatusOptions = [
      { id: "hidden", label: tournamentText.classStatusHidden },
      { id: "live", label: tournamentText.classStatusLive },
      { id: "completed", label: tournamentText.classStatusCompleted },
    ];
    const selectedSetupSeries =
      getTournamentSeriesById(
        activeTournament,
        activeTournamentSetupSeriesId,
        language
      ) ||
      tournamentSeriesClasses[0] ||
      null;
    const visibleSeriesClasses =
      activeTournamentSeriesFilter === "all"
        ? tournamentSeriesClasses
        : tournamentSeriesClasses.filter(
            (series) => String(series.id) === String(activeTournamentSeriesFilter)
          );
    const selectedSetupTournament = selectedSetupSeries
      ? getTournamentForSeries(activeTournament, selectedSetupSeries, language)
      : activeTournament;
    const hasTournamentClassFilters =
      hasExplicitTournamentSeries(activeTournament) &&
      tournamentSeriesClasses.length > 1;
    const visibleSeriesSections = getTournamentSeriesRenderSections(
      activeTournament,
      visibleSeriesClasses
    );
    const selectedSetupStandings =
      selectedSetupTournament?.format === "group-stage"
        ? computeTournamentStandings(selectedSetupTournament)
        : [];
    const selectedAdvancingTeamsByGroup = selectedSetupStandings.map(
      (group, index) => {
        const sourceGroup =
          (selectedSetupTournament.groups || []).find(
            (item) => item.id === group.groupId
          ) || {};

        return {
          groupId: group.groupId,
          groupName: group.groupName,
          groupCode: sourceGroup.code || getTournamentGroupCode(index),
          winner:
            group.rows?.[0]?.teamName ||
            `${group.groupName} ${tournamentText.winnerLabel}`,
          runnerUp:
            group.rows?.[1]?.teamName ||
            `${group.groupName} ${tournamentText.runnerUpLabel}`,
        };
      }
    );
    const visibleGroups = visibleSeriesSections.flatMap((section) =>
      section.groups.map((group) => ({
        ...group,
        seriesId: section.series.id,
        seriesName: section.series.name,
        name: hasExplicitTournamentSeries(activeTournament)
          ? `${section.series.name} - ${group.name}`
          : group.name,
      }))
    );
    const visibleStandings = visibleSeriesSections.flatMap((section) =>
      section.standings.map((standing) => ({
        ...standing,
        seriesId: section.series.id,
        seriesName: section.series.name,
        groupName: hasExplicitTournamentSeries(activeTournament)
          ? `${section.series.name} - ${standing.groupName}`
          : standing.groupName,
      }))
    );
    const visibleConfiguredTotalTeams = visibleSeriesSections.reduce(
      (sum, section) => sum + Number(section.series.totalTeams || 0),
      0
    );
    const visibleFilledSlotCount = visibleGroups.reduce(
      (sum, group) =>
        sum +
        (group.teams || []).filter((team) => String(team.name || "").trim())
          .length,
      0
    );
    const visibleTournamentMatches =
      hasExplicitTournamentSeries(activeTournament) &&
      activeTournamentSeriesFilter !== "all"
        ? tournamentMatches.filter(
            (match) =>
              String(match.seriesId || "") === String(activeTournamentSeriesFilter)
          )
        : tournamentMatches;
    const visibleCompletedMatchesCount =
      visibleTournamentMatches.filter(isMatchCompleted).length;
    const visibleStartedMatchesCount = visibleTournamentMatches.filter(
      (match) => getMatchDisplayStatus(match).status === "in_progress"
    ).length;
    const visibleScheduledMatchesCount = visibleTournamentMatches.filter(
      (match) => getMatchDisplayStatus(match).status === "scheduled"
    ).length;
    const formatLabel =
      {
        "group-stage": tournamentText.formatGroupStage,
        "round-robin": tournamentText.formatRoundRobin,
        "single-elimination": tournamentText.formatSingleElimination,
      }[activeTournament?.format] ||
      activeTournament?.format ||
      "-";
    const tournamentSyncLabel =
      tournamentSyncStatus === "error"
        ? tournamentSyncMessage || tournamentText.tournamentSyncError
        : {
            loading: tournamentText.tournamentSyncLoading,
            saving: tournamentText.tournamentSyncSaving,
            saved: tournamentText.tournamentSyncSaved,
            local: tournamentText.tournamentSyncLocal,
          }[tournamentSyncStatus] || tournamentText.tournamentSyncLocal;
    const configuredTotalTeams = Math.max(
      2,
      Number(selectedSetupSeries?.totalTeams || activeTournament?.totalTeams || 10)
    );
    const configuredTeamsPerGroup = Math.max(
      1,
      Number(selectedSetupSeries?.teamsPerGroup || activeTournament?.teamsPerGroup || 5)
    );
    const configuredQualifiersPerGroup = Math.max(
      2,
      Number(
        selectedSetupSeries?.qualifiersPerGroup ||
          activeTournament?.qualifiersPerGroup ||
          2
      )
    );
    const scheduleCourtCount = Math.max(
      1,
      Math.floor(Number(activeTournament?.courtCount || 3))
    );
    const scheduleGroupMinutes = Math.max(
      1,
      Number(
        selectedSetupSeries?.groupMatchMinutes ||
          activeTournament?.groupMatchMinutes ||
          12
      )
    );
    const schedulePlayoffMinutes = Math.max(
      1,
      Number(
        selectedSetupSeries?.playoffMatchMinutes ||
          activeTournament?.playoffMatchMinutes ||
          15
      )
    );
    const scheduleBreakMinutes = Math.max(
      0,
      Number(activeTournament?.breakMinutes || 0)
    );
    const manualPreviewGroups = selectedSetupTournament
      ? getTournamentGroupsForDisplay(selectedSetupTournament, selectedSetupSeries)
      : [];
    const storedKnockout = selectedSetupTournament?.knockout || {};
    const hasStoredKnockout = Boolean(
      (storedKnockout.quarterFinals || []).length ||
        (storedKnockout.semiFinals || []).length ||
        storedKnockout.final ||
        storedKnockout.thirdPlace
    );
    const knockoutPreview = activeTournament
      ? buildManualKnockout({
          ...selectedSetupTournament,
          groups: manualPreviewGroups,
        })
      : {};
    const displayKnockout = hasStoredKnockout
      ? storedKnockout
      : knockoutPreview;
    const visibleBracketSections = visibleSeriesSections.map((section) => {
      const sectionKnockout = section.knockout || {};
      const sectionHasStoredKnockout = Boolean(
        (sectionKnockout.quarterFinals || []).length ||
          (sectionKnockout.semiFinals || []).length ||
          sectionKnockout.final ||
          sectionKnockout.thirdPlace
      );
      const sectionPreview = buildManualKnockout({
        ...section.tournament,
        groups: section.groups,
      });

      return {
        ...section,
        displayKnockout: sectionHasStoredKnockout
          ? sectionKnockout
          : sectionPreview,
        hasStoredKnockout: sectionHasStoredKnockout,
      };
    });
    const filledSlotCount = manualPreviewGroups.reduce(
      (sum, group) =>
        sum +
        (group.teams || []).filter((team) => String(team.name || "").trim())
          .length,
      0
    );
    const manualSlotTotal = manualPreviewGroups.reduce(
      (sum, group) => sum + (group.teams || []).length,
      0
    );
    const manualSlotsComplete =
      manualSlotTotal > 0 && filledSlotCount >= manualSlotTotal;
    const selectedSetupSeriesIndex = tournamentSeriesClasses.findIndex(
      (series) => String(series.id) === String(selectedSetupSeries?.id || "")
    );
    const nextSetupSeries =
      tournamentSeriesClasses.length > 1 && selectedSetupSeriesIndex >= 0
        ? tournamentSeriesClasses[
            (selectedSetupSeriesIndex + 1) % tournamentSeriesClasses.length
          ]
        : null;
    const doneWithSelectedClassLabel = selectedSetupSeries
      ? language === "no"
        ? `Ferdig med ${selectedSetupSeries.name}`
        : `Done with ${selectedSetupSeries.name}`
      : "";
    const continueToNextClassLabel = nextSetupSeries
      ? language === "no"
        ? `Fortsett til ${nextSetupSeries.name}`
        : `Continue to ${nextSetupSeries.name}`
      : "";
    const previewFirstRound =
      (knockoutPreview.quarterFinals || []).length > 0
        ? knockoutPreview.quarterFinals
        : knockoutPreview.semiFinals || [];

    const statCards = [
      {
        label: tournamentText.slotsLabel,
        value: `${filledSlotCount}/${configuredTotalTeams}`,
        note: tournamentText.manualDrawLabel,
        accent: "#2563eb",
      },
      {
        label: tournamentText.groupsTab,
        value: manualPreviewGroups.length,
        note: `${configuredTeamsPerGroup} ${tournamentText.teamsPerGroupLabel}`,
        accent: "#0f766e",
      },
      {
        label: tournamentText.courtsLabel,
        value: scheduleCourtCount,
        note: `${activeTournament?.startTime || "09:00"} start`,
        accent: "#7c3aed",
      },
      {
        label: tournamentText.matchesTitle,
        value: `${completedMatchesCount}/${tournamentMatches.length}`,
        note: `${scheduledMatchesCount} ${tournamentText.matchStatusScheduled}`,
        accent: "#ea580c",
      },
    ];

    const findKnockoutMatch = (label, knockoutOverride = displayKnockout) => {
      const knockout = knockoutOverride || {};
      return [
        ...(knockout.quarterFinals || []),
        ...(knockout.semiFinals || []),
        knockout.final,
        knockout.thirdPlace,
      ].find((match) => match?.label === label || match?.id === label);
    };

    const resolveKnockoutSource = (source, context = {}) => {
      const raw = String(source || "").trim();
      const contextAdvancingTeams =
        context.advancingTeamsByGroup || selectedAdvancingTeamsByGroup;
      const contextMatches =
        context.matches || selectedSetupTournament?.matches || [];
      const contextKnockout = context.knockout || displayKnockout;
      const groupPosition = raw.match(/^([A-Z])([12])$/);
      if (groupPosition) {
        const [, groupCode, position] = groupPosition;
        const group = contextAdvancingTeams.find(
          (item) => item.groupCode === groupCode
        );
        if (!group) return raw;
        const hasCompletedGroupMatch = contextMatches.some(
          (match) =>
            match.groupId === group.groupId &&
            isMatchCompleted(match)
        );
        if (!hasCompletedGroupMatch) return raw;
        return position === "1" ? group.winner : group.runnerUp;
      }

      const winnerMatch = raw.match(/^Winner (QF\d+|SF\d+)$/);
      if (winnerMatch) {
        const match = findKnockoutMatch(winnerMatch[1], contextKnockout);
        return match?.winnerSource
          ? resolveKnockoutSource(match.winnerSource, context)
          : raw;
      }

      const loserMatch = raw.match(/^Loser (QF\d+|SF\d+)$/);
      if (loserMatch) {
        const match = findKnockoutMatch(loserMatch[1], contextKnockout);
        return match?.loserSource
          ? resolveKnockoutSource(match.loserSource, context)
          : raw;
      }

      return raw;
    };

    const renderBracketMatch = (match, stageKey, isFinal = false, context = {}) => {
      if (!match) return null;
      const teamA = resolveKnockoutSource(match.sourceA || match.teamA, context);
      const teamB = resolveKnockoutSource(match.sourceB || match.teamB, context);
      const winner = match.winnerSource
        ? resolveKnockoutSource(match.winnerSource, context)
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
            const sourceGroupCode = getTournamentSourceGroupCode(source);
            const sourceGroupColor = sourceGroupCode
              ? getTournamentGroupColor(sourceGroupCode)
              : null;

            return (
              <button
                key={`${match.id}-${source}`}
                style={{
                  ...styles.tournamentBracketLine,
                  ...(isWinner ? styles.tournamentBracketLineWinner : {}),
                }}
                onClick={() => {
                    updateKnockoutMatchWinner(
                      stageKey,
                      match.id,
                      source,
                      source === (match.sourceA || match.teamA)
                        ? match.sourceB || match.teamB
                        : match.sourceA || match.teamA,
                      context.seriesId || ""
                    );
                  }}
              >
                <span
                  style={
                    sourceGroupColor
                      ? {
                          ...styles.tournamentSourceBadge,
                          background: sourceGroupColor.soft,
                          borderColor: sourceGroupColor.border,
                          color: sourceGroupColor.text,
                        }
                      : styles.tournamentSourceBadge
                  }
                >
                  {source}
                </span>
                <strong>{label}</strong>
              </button>
            );
          })}
        </div>
      );
    };

    const renderBracketPreviewMatch = (match, isFinal = false, context = {}) => {
      if (!match) return null;
      const teamA = resolveKnockoutSource(match.sourceA || match.teamA, context);
      const teamB = resolveKnockoutSource(match.sourceB || match.teamB, context);

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
          ].map(([source, label]) => {
            const sourceGroupCode = getTournamentSourceGroupCode(source);
            const sourceGroupColor = sourceGroupCode
              ? getTournamentGroupColor(sourceGroupCode)
              : null;

            return (
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
                <span
                  style={
                    sourceGroupColor
                      ? {
                          ...styles.tournamentSourceBadge,
                          background: sourceGroupColor.soft,
                          borderColor: sourceGroupColor.border,
                          color: sourceGroupColor.text,
                        }
                      : styles.tournamentSourceBadge
                  }
                >
                  {source}
                </span>
                <strong>{label || source}</strong>
              </div>
            );
          })}
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
    const buildRoundRobinRounds = (group) => {
      const groupTeams = (group.teams || []).map((team, index) => ({
        id: team.id || "",
        slot: team.slot || `${group.code}${index + 1}`,
        label: getPreviewTeamName(team),
      }));

      if (groupTeams.length < 2) return [];

      const rotation =
        groupTeams.length % 2 === 0 ? [...groupTeams] : [...groupTeams, null];
      const rounds = [];
      const roundCount = rotation.length - 1;
      const half = rotation.length / 2;

      for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
        const roundMatches = [];

        for (let pairIndex = 0; pairIndex < half; pairIndex += 1) {
          const first = rotation[pairIndex];
          const second = rotation[rotation.length - 1 - pairIndex];
          if (!first || !second) continue;

          const shouldFlip = roundIndex % 2 === 1;
          roundMatches.push({
            teamAId: shouldFlip ? second.id : first.id,
            teamBId: shouldFlip ? first.id : second.id,
            teamA: shouldFlip ? second.label : first.label,
            teamB: shouldFlip ? first.label : second.label,
            sourceA: shouldFlip ? second.slot : first.slot,
            sourceB: shouldFlip ? first.slot : second.slot,
          });
        }

        rounds.push(roundMatches);
        rotation.splice(1, 0, rotation.pop());
      }

      return rounds;
    };
    const matchLookup = getTournamentMatchLookup(activeTournament);

    const groupScheduleQueues = manualPreviewGroups
      .map((group, groupIndex) => {
        const groupCode = group.code || getTournamentGroupCode(groupIndex);
        const groupColor = getTournamentGroupColor(groupCode);
        const queue = buildRoundRobinRounds({
          ...group,
          code: groupCode,
        }).flatMap((roundMatches, roundIndex) =>
          roundMatches.map((match, matchIndex) => ({
            id: `schedule-${group.id}-${roundIndex}-${matchIndex}`,
            stage: "group",
            groupId: group.id,
            groupName: group.name,
            groupCode,
            groupColor,
            round: `${group.name} R${roundIndex + 1}`,
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            teamA: match.teamA,
            teamB: match.teamB,
            sourceA: match.sourceA,
            sourceB: match.sourceB,
          }))
        );

        return {
          groupId: group.id,
          groupCode,
          queue,
        };
      })
      .filter((groupQueue) => groupQueue.queue.length > 0);

    const balancedGroupBatches = [];
    let groupRotationStart = 0;
    const pickNextScheduleMatch = (
      queues,
      rotationStart,
      usedGroups,
      usedTeams,
      batchItems,
      allowSameGroup,
      allowTeamRepeat
    ) => {
      for (let offset = 0; offset < queues.length; offset += 1) {
        const queueIndex = (rotationStart + offset) % queues.length;
        const groupQueue = queues[queueIndex];
        if (!groupQueue.queue.length) continue;
        if (!allowSameGroup && usedGroups.has(groupQueue.groupId)) continue;

        const matchIndex = groupQueue.queue.findIndex(
          (match) =>
            allowTeamRepeat ||
            (!usedTeams.has(match.teamA) && !usedTeams.has(match.teamB))
        );
        if (matchIndex === -1) continue;

        const [match] = groupQueue.queue.splice(matchIndex, 1);
        batchItems.push(match);
        usedGroups.add(groupQueue.groupId);
        usedTeams.add(match.teamA);
        usedTeams.add(match.teamB);
        return true;
      }

      return false;
    };

    while (groupScheduleQueues.some((groupQueue) => groupQueue.queue.length)) {
      const batchItems = [];
      const usedGroups = new Set();
      const usedTeams = new Set();

      while (batchItems.length < scheduleCourtCount) {
        if (
          pickNextScheduleMatch(
            groupScheduleQueues,
            groupRotationStart,
            usedGroups,
            usedTeams,
            batchItems,
            false,
            false
          )
        ) {
          continue;
        }
        if (
          pickNextScheduleMatch(
            groupScheduleQueues,
            groupRotationStart,
            usedGroups,
            usedTeams,
            batchItems,
            true,
            false
          )
        ) {
          continue;
        }
        if (
          pickNextScheduleMatch(
            groupScheduleQueues,
            groupRotationStart,
            usedGroups,
            usedTeams,
            batchItems,
            true,
            true
          )
        ) {
          continue;
        }
        break;
      }

      if (!batchItems.length) break;
      balancedGroupBatches.push(batchItems);
      groupRotationStart =
        (groupRotationStart + 1) % Math.max(1, groupScheduleQueues.length);
    }

    const scheduleKnockoutMatches = getOrderedKnockoutScheduleMatches(
      knockoutPreview,
      activeTournament
    );
    const knockoutScheduleItems = scheduleKnockoutMatches.map((match) => ({
        id: `schedule-${match.id}`,
        stage: match.stage || "knockout",
        stageOrder: match.stageOrder || getTournamentStageOrder(match.stage),
        round: match.round,
        teamA: match.sourceA || match.teamA,
        teamB: match.sourceB || match.teamB,
        sourceA: match.sourceA,
        sourceB: match.sourceB,
      }));
    const knockoutScheduleBatches = buildKnockoutScheduleBatches(
      knockoutScheduleItems,
      scheduleCourtCount
    );

    const scheduleBatches = [
      ...balancedGroupBatches.map((items) => ({
        stage: "group",
        items,
      })),
      ...knockoutScheduleBatches.map((items) => ({
        stage: "knockout",
        items,
      })),
    ];
    const hallScheduleBatches = [];
    let scheduleCursor = parseScheduleStart(activeTournament?.startTime);

    scheduleBatches.forEach((scheduleBatch, index) => {
      const isPlayoffBatch = scheduleBatch.stage === "knockout";
      const duration = isPlayoffBatch
        ? schedulePlayoffMinutes
        : scheduleGroupMinutes;

      hallScheduleBatches.push({
        id: `schedule-batch-${index + 1}`,
        number: index + 1,
        time: formatScheduleTime(scheduleCursor),
        duration,
        items: Array.from(
          { length: scheduleCourtCount },
          (_, courtIndex) => {
            const scheduleItem = scheduleBatch.items[courtIndex];
            if (!scheduleItem) return null;

            return mergeScheduleItemWithSavedMatch(
              {
                ...scheduleItem,
                scheduleBatch: index + 1,
                scheduleCourt: courtIndex + 1,
                scheduleOrder: index * scheduleCourtCount + courtIndex,
                manualOrder:
                  scheduleItem.manualOrder ??
                  index * scheduleCourtCount + courtIndex,
              },
              matchLookup
            );
          }
        ),
      });

      scheduleCursor += duration + scheduleBreakMinutes;
    });

    const generatedHallSchedule = buildTournamentHallSchedule(activeTournament);
    const displayHallScheduleBatches = filterScheduleBatchesBySeries(
      generatedHallSchedule.batches,
      hasExplicitTournamentSeries(activeTournament)
        ? activeTournamentSeriesFilter
        : "all"
    );
    const courtBlockSummaries = getCourtBlockSummaries(activeTournament);
    const unplacedScheduleMatches = getUnplacedScheduleMatches(activeTournament);

    const renderHallSchedulePreview = (limit = 12) => {
      return renderTournamentHallScheduleGrid({
        hallScheduleBatches: displayHallScheduleBatches,
        scheduleCourtCount,
        limit,
        showRoundLabels: shouldShowTournamentRoundLabels(activeTournament),
        editableScores: true,
        scheduleEditable: true,
        courtBlocks: activeTournament?.courtBlocks || [],
      });
    };

    return (
      <div style={styles.tournamentDashboardSection}>
        {!auth.loggedIn ? (
          <div style={styles.lockedCard}>{tournamentText.loginRequired}</div>
        ) : (
          <div
            style={{
              ...styles.tournamentDashboardShell,
              ...(!shouldShowTournamentSetupPanel
                ? styles.tournamentDashboardShellCollapsed
                : {}),
              ...(isMobile ? styles.tournamentDashboardShellMobile : {}),
            }}
          >
            {shouldShowTournamentSetupPanel && (
            <aside style={styles.tournamentSetupPanel}>
              <div style={styles.tournamentPanelHeader}>
                <div>
                  <div style={styles.tournamentEyebrow}>
                    {tournamentText.controlPanelLabel}
                  </div>
                  <div style={styles.tournamentPanelTitle}>
                    {tournamentText.tournamentSetupTitle}
                  </div>
                </div>

                <button
                  style={styles.tournamentNewButton}
                  onClick={() => setShowCreateTournamentForm((prev) => !prev)}
                >
                  {showCreateTournamentForm
                    ? t.close
                    : tournamentText.newLabel}
                </button>
              </div>

              {showCreateTournamentForm && (
                <div style={styles.tournamentSetupBlock}>
                  <input
                    style={styles.input}
                    value={newTournamentName}
                    onChange={(e) => setNewTournamentName(e.target.value)}
                    placeholder={tournamentText.namePlaceholder}
                    aria-label={tournamentText.namePlaceholder}
                  />

                  <details style={styles.tournamentOptionalDetails}>
                    <summary style={styles.tournamentOptionalSummary}>
                      {tournamentText.moreDetails}
                    </summary>
                    <textarea
                      style={styles.textarea}
                      value={newTournamentRules}
                      onChange={(e) => setNewTournamentRules(e.target.value)}
                      placeholder={tournamentText.rulesPlaceholder}
                      aria-label={tournamentText.rulesPlaceholder}
                    />
                  </details>

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
                  {visiblePrivateTournaments.length === 0 ? (
                    <div style={styles.emptyText}>{tournamentText.emptyList}</div>
                  ) : (
                    visiblePrivateTournaments.map((item) => {
                      const isActive = item.id === activeTournamentId;
                      const safeItem = applyTournamentDefaults(item);

                      return (
                        <button
                          key={item.id}
                          style={{
                            ...styles.tournamentListItem,
                            ...(isActive ? styles.tournamentListItemActive : {}),
                          }}
                          onClick={() => {
                            setActiveTournamentId(item.id);
                            setShowTournamentSetupPanel(true);
                            setTournamentActionMessage("");
                            void loadSingleTournamentFromBackend(item.id);
                          }}
                        >
                          <span style={styles.tournamentListItemTitle}>
                            {item.name}
                          </span>
                          <span
                            style={{
                              ...styles.tournamentListStatusBadge,
                              ...(isTournamentPublished(safeItem)
                                ? styles.tournamentListStatusBadgeLive
                                : {}),
                            }}
                          >
                            {getTournamentStatusLabel(item)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {showTournamentCleanupTools && (
                  <button
                    style={styles.secondaryButtonCompact}
                    onClick={cleanupMyDraftTournaments}
                  >
                    {tournamentText.cleanupDraftTournaments}
                  </button>
                )}
              </div>

              {activeTournament && (
                <>
                  <div style={styles.tournamentSetupBlock}>
                    <input
                      style={styles.input}
                      value={activeTournament.name || ""}
                      onChange={(e) =>
                        updateActiveTournament({ name: e.target.value })
                      }
                      placeholder={tournamentText.namePlaceholder}
                      aria-label={tournamentText.namePlaceholder}
                    />

                    <details style={styles.tournamentOptionalDetails}>
                      <summary style={styles.tournamentOptionalSummary}>
                        {tournamentText.moreDetails}
                      </summary>
                      <textarea
                        style={styles.textarea}
                        value={activeTournament.rules || ""}
                        onChange={(e) =>
                          updateActiveTournament({ rules: e.target.value })
                        }
                        placeholder={tournamentText.rulesPlaceholder}
                        aria-label={tournamentText.rulesPlaceholder}
                      />
                    </details>

                    <div style={styles.tournamentInlineActions}>
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
                      {!isPublished && (
                        <button
                          style={styles.dangerButtonCompact}
                          onClick={deleteActiveTournament}
                        >
                          {tournamentText.deleteTournament}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={styles.tournamentSetupBlock}>
                    <div style={styles.tournamentSectionHeader}>
                      <div>
                        <div style={styles.tournamentMiniTitle}>
                          {tournamentText.classesLabel}
                        </div>
                        <div style={styles.tournamentSidebarNote}>
                          {tournamentText.bothSeriesLabel}
                        </div>
                      </div>
                      <div style={styles.tournamentInlineActions}>
                        <button
                          type="button"
                          style={styles.secondaryButtonCompact}
                          onClick={() =>
                            addTournamentSeries({
                              name: "4-manns",
                              playersPerTeam: 4,
                            })
                          }
                        >
                          {tournamentText.addFourManns}
                        </button>
                        <button
                          type="button"
                          style={styles.secondaryButtonCompact}
                          onClick={() =>
                            addTournamentSeries({
                              name: "5-manns",
                              playersPerTeam: 5,
                            })
                          }
                        >
                          {tournamentText.addFiveManns}
                        </button>
                      </div>
                    </div>

                    <div style={styles.tournamentClassCompactRow}>
                      <div style={styles.tournamentSubTabs}>
                        {tournamentSeriesClasses.map((series) => (
                          <button
                            key={`setup-series-${series.id}`}
                            type="button"
                            style={{
                              ...styles.tournamentSubTab,
                              ...(String(selectedSetupSeries?.id || "") ===
                              String(series.id)
                                ? styles.tournamentSubTabActive
                                : {}),
                            }}
                            onClick={() =>
                              setActiveTournamentSetupSeriesId(series.id)
                            }
                          >
                            {series.name}
                          </button>
                        ))}
                      </div>

                      {hasExplicitTournamentSeries(activeTournament) &&
                        selectedSetupSeries &&
                        tournamentSeriesClasses.length > 1 && (
                          <button
                            type="button"
                            style={styles.dangerButtonCompact}
                            onClick={() =>
                              removeTournamentSeries(selectedSetupSeries.id)
                            }
                          >
                            {tournamentText.removeSeries}
                          </button>
                        )}
                    </div>
                  </div>

                  <div style={styles.tournamentSetupBlock}>
                    <div style={styles.tournamentMiniTitle}>
                      {tournamentText.structureLabel}
                    </div>
                    <div style={styles.settingsLabel}>
                      {tournamentText.formatLabel}
                    </div>
                    <select
                      style={styles.select}
                      value={selectedSetupTournament?.format || activeTournament.format}
                      onChange={(e) =>
                        updateSelectedTournamentClassConfig({
                          format: e.target.value,
                        })
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
                          {tournamentText.totalTeamsLabel}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={2}
                          value={configuredTotalTeams}
                          onChange={(e) => {
                            const nextTotalTeams = Math.max(
                              2,
                              Number(e.target.value) || 2
                            );
                            const nextGroupCount = Math.max(
                              1,
                              Number(
                                selectedSetupSeries?.groupCount ||
                                  activeTournament.groupCount ||
                                  2
                              )
                            );

                            updateSelectedTournamentClassConfig({
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
                          value={Math.max(
                            1,
                            Number(
                              selectedSetupSeries?.groupCount ||
                                activeTournament.groupCount ||
                                2
                            )
                          )}
                          onChange={(e) => {
                            const nextGroupCount = Math.max(
                              1,
                              Number(e.target.value) || 1
                            );
                            const nextTotalTeams = Math.max(
                              2,
                              Number(configuredTotalTeams || 10)
                            );

                            updateSelectedTournamentClassConfig({
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
                          {tournamentText.teamsPerGroupLabel}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={1}
                          value={configuredTeamsPerGroup}
                          onChange={(e) => {
                            const nextTeamsPerGroup = Math.max(
                              1,
                              Number(e.target.value) || 1
                            );
                            const nextGroupCount = Math.max(
                              1,
                              Number(
                                selectedSetupSeries?.groupCount ||
                                  activeTournament.groupCount ||
                                  2
                              )
                            );

                            updateSelectedTournamentClassConfig({
                              teamsPerGroup: nextTeamsPerGroup,
                              totalTeams: nextGroupCount * nextTeamsPerGroup,
                            });
                          }}
                        />
                      </div>

                      <div>
                        <div style={styles.settingsLabel}>
                          {tournamentText.qualifiersLabel}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={1}
                          value={configuredQualifiersPerGroup}
                          onChange={(e) =>
                            updateSelectedTournamentClassConfig({
                              qualifiersPerGroup: Math.max(
                                1,
                                Number(e.target.value) || 1
                              ),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div style={styles.tournamentInlineActions}>
                      <button
                        type="button"
                        style={styles.secondaryButtonCompact}
                        onClick={resizeManualGroupsFromFormat}
                      >
                        {tournamentText.buildUpdateSlots}
                      </button>
                    </div>

                    <div style={styles.tournamentSetupDivider} />

                    <div style={styles.tournamentMiniTitle}>
                      {tournamentText.timingLabel}
                    </div>
                    <div
                      style={{
                        ...styles.tournamentFieldGrid,
                        ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                      }}
                    >
                      <div>
                        <div style={styles.settingsLabel}>
                          {tournamentText.startTimeLabel}
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
                          {tournamentText.courtsLabel}
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
                          {tournamentText.groupMinutesLabel}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={1}
                          value={scheduleGroupMinutes}
                          onChange={(e) =>
                            updateSelectedTournamentClassConfig({
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
                          {tournamentText.playoffMinutesLabel}
                        </div>
                        <input
                          style={styles.input}
                          type="number"
                          min={1}
                          value={schedulePlayoffMinutes}
                          onChange={(e) =>
                            updateSelectedTournamentClassConfig({
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
                          {tournamentText.breakMinutesLabel}
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

                    <div style={styles.tournamentSetupDivider} />

                    <div style={styles.tournamentMiniTitle}>
                      {tournamentText.optionsLabel}
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

                    <label style={styles.tournamentCheckRow}>
                      <input
                        type="checkbox"
                        checked={shouldShowTournamentRoundLabels(
                          activeTournament
                        )}
                        onChange={(e) =>
                          updateActiveTournament({
                            displaySettings: {
                              ...(activeTournament.displaySettings || {}),
                              showRoundLabels: e.target.checked,
                              showRoundNumbers: e.target.checked,
                              showRoundTitles: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>{tournamentText.showRoundLabels}</span>
                    </label>

                    <div style={styles.tournamentInlineActions}>
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
                          {tournamentText.manualGroupEntryTitle}
                        </div>
                        <div style={styles.tournamentSidebarNote}>
                          {tournamentText.manualGroupEntryHint}
                        </div>
                      </div>
                      <div style={styles.tournamentStatusBadge}>
                        {filledSlotCount}/{configuredTotalTeams}
                      </div>
                    </div>

                    <div style={styles.tournamentSubTabs}>
                      {tournamentSeriesClasses.map((series) => (
                        <button
                          key={`manual-series-${series.id}`}
                          type="button"
                          style={{
                            ...styles.tournamentSubTab,
                            ...(String(selectedSetupSeries?.id || "") ===
                            String(series.id)
                              ? styles.tournamentSubTabActive
                              : {}),
                          }}
                          onClick={() =>
                            setActiveTournamentSetupSeriesId(series.id)
                          }
                        >
                          {series.name}
                        </button>
                      ))}
                    </div>

                    <div style={styles.tournamentSidebarSlotList}>
                      {manualPreviewGroups.map((group, groupIndex) => {
                        const groupColor = getTournamentGroupColor(group.code);

                        return (
                          <div
                            key={`sidebar-${group.id}`}
                            style={{
                              ...styles.tournamentSidebarGroup,
                              background: groupColor.soft,
                              borderColor: groupColor.border,
                            }}
                          >
                            <div style={styles.tournamentSidebarGroupHeader}>
                              <strong>{group.name}</strong>
                              <span>
                                {(group.teams || []).length}{" "}
                                {tournamentText.slotsLabel}
                              </span>
                            </div>
                            {(group.teams || []).map((team, slotIndex) => (
                              <div
                                key={`${activeTournament.id}-sidebar-${groupIndex}-${slotIndex}`}
                                style={styles.tournamentSidebarSlotRow}
                              >
                                <span
                                  style={{
                                    ...styles.tournamentTeamSeed,
                                    background: groupColor.soft,
                                    borderColor: groupColor.border,
                                    color: groupColor.text,
                                  }}
                                >
                                  {team.slot || `${group.code}${slotIndex + 1}`}
                                </span>
                                <input
                                  style={styles.tournamentSlotInput}
                                  value={team.name || ""}
                                  onChange={(e) =>
                                    updateManualGroupSlot(
                                      groupIndex,
                                      slotIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder=""
                                  aria-label={team.slot || `${group.code}${slotIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    {manualSlotsComplete && selectedSetupSeries && (
                      <div style={styles.tournamentInlineActions}>
                        <button
                          type="button"
                          style={styles.primaryButtonSmall}
                          onClick={() =>
                            setTournamentActionMessage(doneWithSelectedClassLabel)
                          }
                        >
                          {doneWithSelectedClassLabel}
                        </button>
                        {nextSetupSeries && (
                          <button
                            type="button"
                            style={styles.secondaryButtonCompact}
                            onClick={() =>
                              setActiveTournamentSetupSeriesId(nextSetupSeries.id)
                            }
                          >
                            {continueToNextClassLabel}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    style={styles.tournamentRegistrationToggle}
                    onClick={() => setShowTournamentRegistration((prev) => !prev)}
                  >
                    {showTournamentRegistration
                      ? tournamentText.closeRegistration
                      : tournamentText.openRegistration}
                  </button>

                  {showTournamentRegistration && (
                    <div style={styles.tournamentSetupBlock}>
                      <div style={styles.tournamentBlockTitle}>
                        {tournamentText.registrationTitle}
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
                          placeholder={tournamentText.teamNamePlaceholder}
                        />
                        <input
                          style={styles.input}
                          value={newTournamentTeamClub}
                          onChange={(e) =>
                            setNewTournamentTeamClub(e.target.value)
                          }
                          placeholder={tournamentText.clubPlaceholder}
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
                                      placeholder={tournamentText.teamNamePlaceholder}
                                    />
                                  ) : (
                                    <div style={styles.tournamentTeamName}>
                                      {team.name}
                                    </div>
                                  )}
                                  <div style={styles.tournamentTeamMeta}>
                                    {team.club ? `${team.club} - ` : ""}
                                    {team.locked
                                      ? tournamentText.lockedLabel
                                      : tournamentText.openLabel}
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
                                    tournamentText.playerNamePlaceholder
                                  }
                                />
                                <button
                                  style={styles.primaryButtonSmall}
                                  onClick={() => addTournamentPlayer(team.id)}
                                >
                                  {tournamentText.addPlayerButton}
                                </button>
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
                  )}

                </>
              )}
            </aside>
            )}

            <main style={styles.tournamentMainPanel}>
              {activeTournament ? (
                <>
                  <div style={styles.tournamentHero}>
                    <div style={styles.tournamentHeroText}>
                      <h2 style={styles.tournamentHeroTitle}>
                        {activeTournament.name}
                      </h2>
                      <div style={styles.tournamentHeroMeta}>
                        <span style={styles.tournamentHeroChip}>{formatLabel}</span>
                        <span style={styles.tournamentHeroBadge}>
                          {isPublished
                            ? tournamentText.published
                            : tournamentText.unpublished}
                        </span>
                        <span
                          style={{
                            ...styles.tournamentSyncBadge,
                            ...(tournamentSyncStatus === "error"
                              ? styles.tournamentSyncBadgeError
                              : {}),
                            ...(tournamentSyncStatus === "local"
                              ? styles.tournamentSyncBadgeLocal
                              : {}),
                          }}
                          title={tournamentSyncMessage}
                        >
                          {tournamentSyncLabel}
                        </span>
                      </div>
                      {String(activeTournament.rules || "").trim() && (
                        <p style={styles.tournamentHeroRules}>
                          {activeTournament.rules}
                        </p>
                      )}
                    </div>
                    <div style={styles.tournamentHeroActions}>
                      <button
                        style={styles.tournamentLightButton}
                        onClick={() =>
                          setShowTournamentSetupPanel((prev) => !prev)
                        }
                      >
                        {shouldShowTournamentSetupPanel
                          ? tournamentText.hideSetup
                          : tournamentText.editSetup}
                      </button>
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
                        onClick={() => {
                          setActiveTournamentView(tab.id);
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {hasTournamentClassFilters &&
                    ["groups", "matches", "table", "bracket"].includes(
                      activeTournamentView
                    ) && (
                      <div style={styles.tournamentSubTabs}>
                        <button
                          type="button"
                          style={{
                            ...styles.tournamentSubTab,
                            ...(activeTournamentSeriesFilter === "all"
                              ? styles.tournamentSubTabActive
                              : {}),
                          }}
                          onClick={() => setActiveTournamentSeriesFilter("all")}
                        >
                          {tournamentText.allClassesLabel}
                        </button>
                        {tournamentSeriesClasses.map((series) => (
                          <button
                            key={`filter-series-${series.id}`}
                            type="button"
                            style={{
                              ...styles.tournamentSubTab,
                              ...(String(activeTournamentSeriesFilter) ===
                              String(series.id)
                                ? styles.tournamentSubTabActive
                                : {}),
                            }}
                            onClick={() => {
                              setActiveTournamentSeriesFilter(series.id);
                              setActiveTournamentSetupSeriesId(series.id);
                            }}
                          >
                            {series.name}
                          </button>
                        ))}
                      </div>
                    )}

                  <div style={styles.tournamentWorkspace}>
                    {activeTournamentView === "overview" && (
                      <div
                        style={{
                          ...styles.tournamentOverviewGrid,
                          ...(isMobile ? styles.tournamentTwoColumnMobile : {}),
                        }}
                      >
                        <div style={styles.tournamentSurface}>
                          <div style={styles.tournamentSectionHeader}>
                            <div>
                              <div style={styles.tournamentEyebrow}>
                                {tournamentText.groupsTab}
                              </div>
                              <div style={styles.tournamentSectionTitle}>
                                {tournamentText.groupDrawTitle}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {filledSlotCount}/{configuredTotalTeams}
                            </div>
                          </div>

                          {manualPreviewGroups.length > 0 ? (
                            <div style={styles.tournamentCompactGroupGrid}>
                              {manualPreviewGroups.map((group, groupIndex) => {
                                const groupCode =
                                  group.code || getTournamentGroupCode(groupIndex);
                                const groupColor =
                                  getTournamentGroupColor(groupCode);
                                const filledTeams = (group.teams || []).filter(
                                  (team) => String(team.name || "").trim()
                                );

                                return (
                                  <div
                                    key={`overview-group-${group.id}`}
                                    style={{
                                      ...styles.tournamentCompactGroupCard,
                                      background: groupColor.soft,
                                      borderColor: groupColor.border,
                                    }}
                                  >
                                    <div style={styles.tournamentGroupHeader}>
                                      <div style={styles.tournamentMiniTitle}>
                                        {group.name}
                                      </div>
                                      <span
                                        style={{
                                          ...styles.tournamentTeamSeed,
                                          background: groupColor.soft,
                                          borderColor: groupColor.border,
                                          color: groupColor.text,
                                        }}
                                      >
                                        {groupCode}
                                      </span>
                                    </div>
                                    <div style={styles.tournamentMutedText}>
                                      {filledTeams.length}/
                                      {(group.teams || []).length}{" "}
                                      {tournamentText.slotsLabel}
                                    </div>
                                    <div style={styles.tournamentSnapshotList}>
                                      {(group.teams || []).map((team, index) => (
                                          <div
                                            key={`overview-group-${group.id}-${team.id}`}
                                            style={styles.tournamentSnapshotRow}
                                          >
                                            <span
                                              style={{
                                                ...styles.tournamentTeamSeed,
                                                background: groupColor.soft,
                                                borderColor: groupColor.border,
                                                color: groupColor.text,
                                              }}
                                            >
                                              {team.slot ||
                                                `${groupCode}${index + 1}`}
                                            </span>
                                            <strong>
                                              {String(team.name || "").trim() || "-"}
                                            </strong>
                                          </div>
                                        ))}
                                    </div>
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

                        <div style={styles.tournamentPreviewBracketCard}>
                          <div style={styles.tournamentSectionHeader}>
                            <div>
                              <div style={styles.tournamentEyebrow}>
                                {tournamentText.knockoutLabel}
                              </div>
                              <div
                                style={{
                                  ...styles.tournamentMiniTitle,
                                  color: "#fff",
                                }}
                              >
                                {tournamentText.knockoutPreview}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {tournamentText.topQualifiersLabel}
                            </div>
                          </div>

                          <div style={styles.tournamentPreviewMatchList}>
                            {previewFirstRound.slice(0, 4).map((match) => (
                              <div
                                key={`overview-compact-ko-${match.id}`}
                                style={styles.tournamentPreviewMatchRow}
                              >
                                <span>{match.label}</span>
                                <strong>
                                  {match.sourceA || match.teamA} vs{" "}
                                  {match.sourceB || match.teamB}
                                </strong>
                              </div>
                            ))}
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
                          </div>
                        </div>

                        <div style={styles.tournamentSurface}>
                          <div style={styles.tournamentSectionHeader}>
                            <div>
                              <div style={styles.tournamentEyebrow}>
                                {tournamentText.nextLabel}
                              </div>
                              <div style={styles.tournamentSectionTitle}>
                                {tournamentText.nextMatchesTitle}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {scheduledMatchesCount}{" "}
                              {tournamentText.matchStatusScheduled}
                            </div>
                          </div>

                          {tournamentMatches.length > 0 ? (
                            <div style={styles.tournamentSnapshotList}>
                              {tournamentMatches
                                .filter(
                                  (match) =>
                                    getMatchDisplayStatus(match).status !==
                                    "completed"
                                )
                                .slice(0, 3)
                                .map((match) => (
                                  <div
                                    key={`overview-next-${match.id}`}
                                    style={styles.tournamentSnapshotRow}
                                  >
                                    <span>
                                      {match.teamA} vs {match.teamB}
                                    </span>
                                    <strong>
                                      {match.groupName ||
                                        tournamentText.matchStatusScheduled}
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
                              {tournamentText.groupsTab}
                            </div>
                            <div style={styles.tournamentSectionTitle}>
                              {tournamentText.groupStagePreview}
                            </div>
                          </div>
                          <div style={styles.tournamentStatusBadge}>
                            {visibleFilledSlotCount}/
                            {visibleConfiguredTotalTeams || configuredTotalTeams}
                          </div>
                        </div>

                        {visibleGroups.length > 0 ? (
                          <div
                            style={{
                              ...styles.tournamentGroupGrid,
                              ...(isMobile ? styles.tournamentGroupGridMobile : {}),
                            }}
                        >
                          {visibleGroups.map((group, groupIndex) => {
                              const groupColor = getTournamentGroupColor(group.code);

                              return (
                                <div
                                  key={group.id}
                                  style={{
                                    ...styles.tournamentGroupCard,
                                    background: groupColor.soft,
                                    borderColor: groupColor.border,
                                  }}
                                >
                                  <div style={styles.tournamentGroupHeader}>
                                    <div>
                                      <div style={styles.tournamentMiniTitle}>
                                        {group.name}
                                      </div>
                                      <div style={styles.tournamentMutedText}>
                                        {tournamentText.manualPaperOrderLabel}
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        ...styles.tournamentGroupCount,
                                        background: groupColor.accent,
                                      }}
                                    >
                                      {Array.isArray(group.teams)
                                        ? group.teams.length
                                        : 0}
                                    </div>
                                  </div>
                                  {Array.isArray(group.teams) &&
                                  group.teams.length > 0 ? (
                                    <div style={styles.tournamentSnapshotList}>
                                      {group.teams.map((team, slotIndex) => (
                                        <div
                                          key={`${activeTournament.id}-group-${groupIndex}-${slotIndex}`}
                                          style={styles.tournamentGroupTeamRow}
                                        >
                                          <span
                                            style={{
                                              ...styles.tournamentTeamSeed,
                                              background: groupColor.soft,
                                              borderColor: groupColor.border,
                                              color: groupColor.text,
                                            }}
                                          >
                                            {team.slot || `${group.code}${slotIndex + 1}`}
                                          </span>
                                          <input
                                            style={styles.tournamentSlotInput}
                                            value={team.name || ""}
                                            onChange={(e) =>
                                              updateManualGroupSlot(
                                                groupIndex,
                                                slotIndex,
                                                e.target.value
                                              )
                                            }
                                            placeholder=""
                                            aria-label={
                                              team.slot || `${group.code}${slotIndex + 1}`
                                            }
                                          />
                                          <strong>{team.club || "-"}</strong>
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
                              {tournamentText.knockoutLabel}
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

                        {visibleBracketSections.some(
                          (section) =>
                            (section.displayKnockout.quarterFinals || [])
                              .length ||
                            (section.displayKnockout.semiFinals || []).length
                        ) ? (
                          <div style={styles.tournamentStandingsList}>
                            {visibleBracketSections.map((section) => {
                              const sectionDisplayKnockout =
                                section.displayKnockout || {};
                              const hasSectionKnockout = Boolean(
                                (sectionDisplayKnockout.quarterFinals || [])
                                  .length ||
                                  (sectionDisplayKnockout.semiFinals || []).length
                              );
                              if (!hasSectionKnockout) return null;

                              const sectionAdvancingTeams = section.standings.map(
                                (group, index) => {
                                  const sourceGroup =
                                    section.groups.find(
                                      (item) => item.id === group.groupId
                                    ) || {};

                                  return {
                                    groupId: group.groupId,
                                    groupName: group.groupName,
                                    groupCode:
                                      sourceGroup.code ||
                                      getTournamentGroupCode(index),
                                    winner:
                                      group.rows?.[0]?.teamName ||
                                      `${group.groupName} ${tournamentText.winnerLabel}`,
                                    runnerUp:
                                      group.rows?.[1]?.teamName ||
                                      `${group.groupName} ${tournamentText.runnerUpLabel}`,
                                  };
                                }
                              );
                              const sectionContext = {
                                seriesId: hasExplicitTournamentSeries(activeTournament)
                                  ? section.series.id
                                  : "",
                                knockout: sectionDisplayKnockout,
                                matches: section.tournament.matches || [],
                                advancingTeamsByGroup: sectionAdvancingTeams,
                              };

                              return (
                                <div
                                  key={`bracket-series-${section.series.id}`}
                                  style={styles.tournamentStandingsCard}
                                >
                                  {hasExplicitTournamentSeries(activeTournament) && (
                                    <div style={styles.tournamentMiniTitle}>
                                      {section.series.name}
                                    </div>
                                  )}
                                  <div
                                    style={{
                                      ...styles.tournamentBracketBoard,
                                      ...(isMobile
                                        ? styles.tournamentGroupGridMobile
                                        : {}),
                                    }}
                                  >
                                    {(sectionDisplayKnockout.quarterFinals || [])
                                      .length > 0 && (
                                      <div style={styles.tournamentBracketStage}>
                                        <div
                                          style={
                                            styles.tournamentBracketStageTitle
                                          }
                                        >
                                          {tournamentText.firstKnockoutLabel}
                                        </div>
                                        {sectionDisplayKnockout.quarterFinals.map(
                                          (match) =>
                                            section.hasStoredKnockout
                                              ? renderBracketMatch(
                                                  match,
                                                  "quarterFinals",
                                                  false,
                                                  sectionContext
                                                )
                                              : renderBracketPreviewMatch(
                                                  match,
                                                  false,
                                                  sectionContext
                                                )
                                        )}
                                      </div>
                                    )}

                                    <div style={styles.tournamentBracketStage}>
                                      <div
                                        style={styles.tournamentBracketStageTitle}
                                      >
                                        {tournamentText.semiFinals}
                                      </div>
                                      {(
                                        sectionDisplayKnockout.semiFinals || []
                                      ).map((match) =>
                                        section.hasStoredKnockout
                                          ? renderBracketMatch(
                                              match,
                                              "semiFinals",
                                              false,
                                              sectionContext
                                            )
                                          : renderBracketPreviewMatch(
                                              match,
                                              false,
                                              sectionContext
                                            )
                                      )}
                                    </div>

                                    <div style={styles.tournamentBracketStage}>
                                      <div
                                        style={styles.tournamentBracketStageTitle}
                                      >
                                        {tournamentText.final}
                                      </div>
                                      {section.hasStoredKnockout
                                        ? renderBracketMatch(
                                            sectionDisplayKnockout.final,
                                            "final",
                                            true,
                                            sectionContext
                                          )
                                        : renderBracketPreviewMatch(
                                            sectionDisplayKnockout.final,
                                            true,
                                            sectionContext
                                          )}
                                    </div>

                                    {activeTournament.thirdPlaceMatch &&
                                      sectionDisplayKnockout.thirdPlace && (
                                        <div
                                          style={styles.tournamentBracketStage}
                                        >
                                          <div
                                            style={
                                              styles.tournamentBracketStageTitle
                                            }
                                          >
                                            {tournamentText.thirdPlace}
                                          </div>
                                          {section.hasStoredKnockout
                                            ? renderBracketMatch(
                                                sectionDisplayKnockout.thirdPlace,
                                                "thirdPlace",
                                                false,
                                                sectionContext
                                              )
                                            : renderBracketPreviewMatch(
                                                sectionDisplayKnockout.thirdPlace,
                                                false,
                                                sectionContext
                                              )}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              );
                            })}
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
                              {tournamentText.matchManagementLabel}
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
                                {tournamentText.scheduleTitle}
                              </div>
                              <div style={styles.tournamentMutedText}>
                                {tournamentText.scheduleSubtitle}
                              </div>
                            </div>
                            <div style={styles.tournamentStatusBadge}>
                              {displayHallScheduleBatches.length}{" "}
                              {tournamentText.batchesLabel}
                            </div>
                          </div>
                          <div style={styles.tournamentCourtBlockPanel}>
                            <div style={styles.tournamentCourtBlockHeader}>
                              <div>
                                <div style={styles.tournamentMiniTitle}>
                                  {tournamentText.courtUnavailable}
                                </div>
                                <div style={styles.tournamentMutedText}>
                                  {tournamentText.blockCourt}
                                </div>
                              </div>
                              {Array.isArray(activeTournament.courtBlocks) &&
                                activeTournament.courtBlocks.filter(
                                  (block) => block.active !== false
                                ).length > 0 && (
                                  <span style={styles.tournamentStatusBadge}>
                                    {courtBlockSummaries.length}
                                  </span>
                                )}
                            </div>
                            <div
                              style={{
                                ...styles.tournamentCourtBlockGrid,
                                ...(isMobile
                                  ? styles.tournamentCourtBlockGridMobile
                                  : {}),
                              }}
                            >
                              <label>
                                <span>{tournamentText.courtLabel}</span>
                                <select
                                  style={styles.input}
                                  value={courtBlockDraft.court}
                                  onChange={(e) =>
                                    setCourtBlockDraft((prev) => ({
                                      ...prev,
                                      court: Number(e.target.value) || 1,
                                    }))
                                  }
                                >
                                  {Array.from(
                                    { length: scheduleCourtCount },
                                    (_, index) => (
                                      <option key={index + 1} value={index + 1}>
                                        {tournamentText.courtLabel} {index + 1}
                                      </option>
                                    )
                                  )}
                                </select>
                              </label>
                              <label>
                                <span>{tournamentText.blockModeLabel}</span>
                                <select
                                  style={styles.input}
                                  value={courtBlockDraft.mode}
                                  onChange={(e) =>
                                    setCourtBlockDraft((prev) => ({
                                      ...prev,
                                      mode: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="delay">
                                    {tournamentText.temporaryDelay}
                                  </option>
                                  <option value="restOfDay">
                                    {tournamentText.courtUnavailableRestOfDay}
                                  </option>
                                </select>
                              </label>
                              <label>
                                <span>{tournamentText.fromTimeLabel}</span>
                                <input
                                  style={styles.input}
                                  type="time"
                                  value={courtBlockDraft.startTime}
                                  onChange={(e) =>
                                    setCourtBlockDraft((prev) => ({
                                      ...prev,
                                      startTime: e.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                <span>{tournamentText.toTimeLabel}</span>
                                <input
                                  style={styles.input}
                                  type="time"
                                  value={courtBlockDraft.endTime}
                                  disabled={courtBlockDraft.mode === "restOfDay"}
                                  onChange={(e) =>
                                    setCourtBlockDraft((prev) => ({
                                      ...prev,
                                      endTime: e.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                <span>{tournamentText.reasonLabel}</span>
                                <input
                                  style={styles.input}
                                  value={courtBlockDraft.reason}
                                  onChange={(e) =>
                                    setCourtBlockDraft((prev) => ({
                                      ...prev,
                                      reason: e.target.value,
                                    }))
                                  }
                                />
                              </label>
                            </div>
                            <div style={styles.tournamentCourtBlockActions}>
                              <button
                                type="button"
                                style={styles.primaryButtonSmall}
                                onClick={() => addCourtBlock("manual")}
                              >
                                {tournamentText.blockCourt}
                              </button>
                            </div>
                            {courtBlockSummaries.length > 0 && (
                              <div style={styles.tournamentCourtBlockList}>
                                {courtBlockSummaries.map(
                                  ({ block, affectedMatches }) => (
                                    <div
                                      key={block.id || getCourtBlockKey(block)}
                                      style={styles.tournamentCourtBlockCard}
                                    >
                                      <div style={styles.tournamentCourtBlockCardTop}>
                                        <strong>
                                          {tournamentText.courtLabel} {block.court} -{" "}
                                          {block.startTime}-{block.endTime}
                                        </strong>
                                        <span style={styles.tournamentStatusBadge}>
                                          {affectedMatches.length}{" "}
                                          {tournamentText.affectedMatchesLabel}
                                        </span>
                                      </div>
                                      {block.reason && (
                                        <div style={styles.tournamentMutedText}>
                                          {block.reason}
                                        </div>
                                      )}
                                      {affectedMatches.length > 0 && (
                                        <div style={styles.tournamentCourtBlockAffectedList}>
                                          {affectedMatches.slice(0, 4).map((match) => (
                                            <div
                                              key={match.id}
                                              style={styles.tournamentCourtBlockAffectedItem}
                                            >
                                              {match.originalScheduleTime ||
                                                match.scheduleTime ||
                                                match.startTime ||
                                                "-"}{" "}
                                              {match.originalScheduleCourt ||
                                              match.scheduleCourt
                                                ? `${tournamentText.courtLabel} ${
                                                    match.originalScheduleCourt ||
                                                    match.scheduleCourt
                                                  } - `
                                                : ""}
                                              {match.teamA} {tournamentText.vsLabel}{" "}
                                              {match.teamB}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <div style={styles.tournamentCourtBlockActions}>
                                        <button
                                          type="button"
                                          style={styles.secondaryButtonCompact}
                                          onClick={() =>
                                            resolveCourtBlock(block.id, "auto")
                                          }
                                        >
                                          {tournamentText.autoMoveToFreeCourts}
                                        </button>
                                        {!block.restOfDay && (
                                          <button
                                            type="button"
                                            style={styles.secondaryButtonCompact}
                                            onClick={() =>
                                              resolveCourtBlock(block.id, "push")
                                            }
                                          >
                                            {tournamentText.pushLaterSameCourt}
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          style={styles.secondaryButtonCompact}
                                          onClick={() =>
                                            placeCourtBlockMatchesManually(block.id)
                                          }
                                        >
                                          {tournamentText.placeManually}
                                        </button>
                                        <button
                                          type="button"
                                          style={styles.dangerButtonCompact}
                                          onClick={() => removeCourtBlock(block.id)}
                                        >
                                          {tournamentText.removeBlock}
                                        </button>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          {unplacedScheduleMatches.length > 0 && (
                            <div style={styles.tournamentUnplacedPanel}>
                              <div style={styles.tournamentCourtBlockHeader}>
                                <div>
                                  <div style={styles.tournamentMiniTitle}>
                                    {tournamentText.unplacedMatches}
                                  </div>
                                  <div style={styles.tournamentMutedText}>
                                    {tournamentText.moveModeMessage}
                                  </div>
                                </div>
                                {selectedMoveMatchId && (
                                  <button
                                    type="button"
                                    style={styles.secondaryButtonCompact}
                                    onClick={() => {
                                      setSelectedMoveMatchId("");
                                      setPendingScheduleMoveMode("swap");
                                    }}
                                  >
                                    {tournamentText.cancelMove}
                                  </button>
                                )}
                              </div>
                              <div style={styles.tournamentUnplacedList}>
                                {unplacedScheduleMatches.map((match) => (
                                  <div
                                    key={match.id}
                                    style={{
                                      ...styles.tournamentUnplacedCard,
                                      ...(selectedMoveMatchId === match.id
                                        ? styles.tournamentUnplacedCardActive
                                        : {}),
                                    }}
                                  >
                                    <div>
                                      <strong>
                                        {match.teamA} {tournamentText.vsLabel}{" "}
                                        {match.teamB}
                                      </strong>
                                      <div style={styles.tournamentMutedText}>
                                        {match.originalScheduleTime ||
                                          match.scheduleTime ||
                                          "-"}{" "}
                                        - {tournamentText.courtLabel}{" "}
                                        {match.originalScheduleCourt ||
                                          match.scheduleCourt ||
                                          "-"}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      style={styles.primaryButtonSmall}
                                      onClick={() => {
                                        setSelectedMoveMatchId((current) =>
                                          current === match.id ? "" : match.id
                                        );
                                        setPendingScheduleMoveMode("place");
                                        setTournamentActionMessage(
                                          tournamentText.selectTargetSlot
                                        );
                                      }}
                                    >
                                      {tournamentText.selectLabel}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {renderHallSchedulePreview(18)}
                        </div>

                        {visibleTournamentMatches.length > 0 ? (
                          <div style={styles.tournamentMatchSummaryGrid}>
                            <div style={styles.tournamentInfoTile}>
                              <span>{tournamentText.matchStatusCompleted}</span>
                              <strong>{visibleCompletedMatchesCount}</strong>
                            </div>
                            <div style={styles.tournamentInfoTile}>
                              <span>{tournamentText.matchStatusStarted}</span>
                              <strong>{visibleStartedMatchesCount}</strong>
                            </div>
                            <div style={styles.tournamentInfoTile}>
                              <span>{tournamentText.matchStatusScheduled}</span>
                              <strong>{visibleScheduledMatchesCount}</strong>
                            </div>
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
                              {tournamentText.tableTab}
                            </div>
                            <div style={styles.tournamentSectionTitle}>
                              {tournamentText.standingsTitle}
                            </div>
                          </div>
                          <div style={styles.tournamentStatusBadge}>
                            {visibleStandings.length} {tournamentText.groupsLabel}
                          </div>
                        </div>

                        {activeTournament.format === "group-stage" &&
                        Array.isArray(visibleStandings) &&
                        visibleStandings.length > 0 ? (
                          <div style={styles.tournamentStandingsList}>
                            {visibleStandings.map((group, groupIndex) => {
                              const sourceGroup =
                                visibleGroups.find(
                                  (item) => item.id === group.groupId
                                ) || {};
                              const groupCode =
                                sourceGroup.code ||
                                getTournamentGroupCode(groupIndex);
                              const groupColor =
                                getTournamentGroupColor(groupCode);

                              return (
                              <div
                                key={`standings-${group.groupId}`}
                                style={{
                                  ...styles.tournamentStandingsCard,
                                  background: `linear-gradient(135deg, ${groupColor.soft}, #ffffff 72%)`,
                                  borderColor: groupColor.border,
                                  borderTop: `4px solid ${groupColor.accent}`,
                                  borderLeft: `6px solid ${groupColor.accent}`,
                                }}
                              >
                                <div style={styles.tournamentStandingsHeader}>
                                  <div style={styles.tournamentMiniTitle}>
                                    {group.groupName}
                                  </div>
                                  <span
                                    style={{
                                      ...styles.tournamentTeamSeed,
                                      background: groupColor.soft,
                                      borderColor: groupColor.border,
                                      color: groupColor.text,
                                    }}
                                  >
                                    {groupCode}
                                  </span>
                                </div>
                                <div style={styles.tournamentTableWrap}>
                                  <table style={styles.tournamentTable}>
                                    <thead>
                                      <tr>
                                        <th style={styles.tournamentTableHead}>
                                          {tournamentText.teamLabel}
                                        </th>
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
                              );
                            })}
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
                        <div style={styles.tournamentShareCompactCard}>
                          {isBackendPublished ? (
                            <>
                              <div style={styles.tournamentShareHeader}>
                                <div>
                                  <div style={styles.tournamentShareTitle}>
                                    {tournamentText.publicLinkTitle}
                                  </div>
                                  <div style={styles.tournamentMutedText}>
                                    {tournamentText.publicLinkShareHelper}
                                  </div>
                                </div>
                                <span style={styles.tournamentShareActiveBadge}>
                                  {tournamentText.publicLinkActive}
                                </span>
                              </div>

                              <div
                                style={{
                                  ...styles.tournamentShareUrlRow,
                                  ...(isMobile
                                    ? styles.tournamentFieldGridMobile
                                    : {}),
                                }}
                              >
                                <input
                                  style={styles.tournamentShareInput}
                                  value={publicUrl}
                                  readOnly
                                  aria-label={tournamentText.publicLinkTitle}
                                />
                                <button
                                  style={styles.primaryButtonSmall}
                                  onClick={copyActiveTournamentPublicUrl}
                                >
                                  {tournamentText.copyLiveLink}
                                </button>
                                <button
                                  style={styles.secondaryButtonCompact}
                                  onClick={openActiveTournamentPublicPreview}
                                >
                                  {tournamentText.openLivePreview}
                                </button>
                                <button
                                  style={styles.dangerButtonCompact}
                                  onClick={unpublishTournament}
                                >
                                  {tournamentText.unpublishLiveView}
                                </button>
                              </div>

                            </>
                          ) : (
                            <>
                              <div style={styles.tournamentShareHeader}>
                                <div>
                                  <div style={styles.tournamentShareTitle}>
                                    {tournamentText.publicLinkTitle}
                                  </div>
                                  <div style={styles.tournamentMutedText}>
                                    {tournamentText.publicLinkPublishHelper}
                                  </div>
                                </div>
                              </div>
                              <button
                                style={styles.primaryButtonSmall}
                                onClick={publishTournament}
                              >
                                {tournamentText.publishLiveView}
                              </button>
                            </>
                          )}

                          {tournamentSyncStatus === "error" && (
                            <div style={styles.tournamentInlineWarning}>
                              {tournamentSyncMessage ||
                                tournamentText.tournamentSyncError}
                            </div>
                          )}
                        </div>

                        <div style={styles.tournamentSetupDivider} />

                        <div style={styles.tournamentSectionHeader}>
                          <div>
                            <div style={styles.tournamentMiniTitle}>
                              {tournamentText.classVisibilityTitle}
                            </div>
                            <div style={styles.tournamentMutedText}>
                              {tournamentText.classVisibilityHint}
                            </div>
                          </div>
                        </div>

                        <div style={styles.tournamentClassVisibilityList}>
                          {tournamentSeriesClasses.map((series) => (
                            <div
                              key={`class-visibility-${series.id}`}
                              style={styles.tournamentClassVisibilityRow}
                            >
                              <strong>{series.name}</strong>
                              <div style={styles.tournamentClassVisibilityActions}>
                                <div style={styles.tournamentClassSegmented}>
                                  {seriesPublicStatusOptions.map((option) => {
                                    const isActive =
                                      series.publicStatus === option.id;
                                    return (
                                      <button
                                        key={`${series.id}-${option.id}`}
                                        type="button"
                                        style={{
                                          ...styles.tournamentClassSegmentButton,
                                          ...(isActive
                                            ? styles.tournamentClassSegmentButtonActive
                                            : {}),
                                        }}
                                        onClick={() =>
                                          updateTournamentSeriesPublicStatus(
                                            series.id,
                                            option.id
                                          )
                                        }
                                      >
                                        {option.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <button
                                  type="button"
                                  style={styles.secondaryButtonCompact}
                                  onClick={() =>
                                    updateTournamentSeriesPublicStatus(
                                      series.id,
                                      "live"
                                    )
                                  }
                                >
                                  {language === "no"
                                    ? `Start ${series.name} live`
                                    : `Start ${series.name} live`}
                                </button>
                                <button
                                  type="button"
                                  style={styles.secondaryButtonCompact}
                                  onClick={() =>
                                    updateTournamentSeriesPublicStatus(
                                      series.id,
                                      "completed"
                                    )
                                  }
                                >
                                  {language === "no"
                                    ? `Marker ${series.name} ferdig`
                                    : `Mark ${series.name} finished`}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={styles.tournamentSetupDivider} />

                        <div style={styles.tournamentSectionHeader}>
                          <div>
                            <div style={styles.tournamentMiniTitle}>
                              {tournamentText.liveViewDesign}
                            </div>
                            <div style={styles.tournamentMutedText}>
                              {tournamentText.publicPreviewSubtitle}
                            </div>
                          </div>
                          <button
                            type="button"
                            style={styles.secondaryButtonCompact}
                            onClick={() => applyPublicLiveThemePreset("clean-white")}
                          >
                            {tournamentText.resetTheme}
                          </button>
                        </div>

                        <div style={styles.tournamentMiniTitle}>
                          {tournamentText.themePresetLabel}
                        </div>
                        <div style={styles.tournamentThemePresetGrid}>
                          {Object.entries(PUBLIC_THEME_PRESETS).map(
                            ([presetKey, preset]) => (
                              <button
                                key={`live-${presetKey}`}
                                type="button"
                                style={{
                                  ...styles.tournamentThemePresetButton,
                                  borderColor:
                                    activePublicLiveTheme.preset === presetKey
                                      ? preset.primary
                                      : "#dbe3ef",
                                }}
                                onClick={() => applyPublicLiveThemePreset(presetKey)}
                              >
                                <span
                                  style={{
                                    ...styles.tournamentThemeSwatch,
                                    background: preset.background,
                                    borderColor: preset.primary,
                                  }}
                                />
                                <strong>
                                  {preset.label?.[language] || preset.label?.en}
                                </strong>
                                <small>{tournamentText.usePreset}</small>
                              </button>
                            )
                          )}
                        </div>

                        <div
                          style={{
                            ...styles.tournamentFieldGrid,
                            ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                          }}
                        >
                          {[
                            ["background", tournamentText.pageBackground],
                            ["panel", tournamentText.cardPanel],
                            ["primary", tournamentText.primaryColor],
                            ["accent", tournamentText.accentColor],
                            ["text", tournamentText.textColor],
                          ].map(([field, label]) => (
                            <div key={`live-${field}`}>
                              <div style={styles.settingsLabel}>{label}</div>
                              <input
                                style={styles.input}
                                value={activePublicLiveTheme[field] || ""}
                                onChange={(e) =>
                                  updatePublicLiveThemeField(field, e.target.value)
                                }
                              />
                              {publicLiveThemeColorErrors[field] && (
                                <div style={styles.tournamentInlineWarning}>
                                  {tournamentText.invalidColor}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            ...styles.tournamentFieldGrid,
                            ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                          }}
                        >
                          {[
                            [
                              "publicLiveLogoUrl",
                              tournamentText.liveLogoUrlLabel,
                            ],
                            [
                              "publicLiveBackgroundUrl",
                              tournamentText.liveBackgroundUrlLabel,
                            ],
                          ].map(([field, label]) => (
                            <div key={field}>
                              <div style={styles.settingsLabel}>{label}</div>
                              <input
                                style={styles.input}
                                type="url"
                                placeholder={tournamentText.optionalPlaceholder}
                                value={activeTournament[field] || ""}
                                onChange={(e) =>
                                  updateActiveTournament({
                                    [field]: e.target.value,
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            ...styles.tournamentLiveThemePreview,
                            background: activePublicLiveBackgroundUrl
                              ? `linear-gradient(145deg, ${hexToRgba(
                                  activePublicLiveTheme.surface,
                                  0.91
                                )}, ${hexToRgba(
                                  activePublicLiveTheme.panel,
                                  0.88
                                )}), url(${activePublicLiveBackgroundUrl})`
                              : `linear-gradient(145deg, ${activePublicLiveTheme.surface}, ${activePublicLiveTheme.panel})`,
                            backgroundSize: activePublicLiveBackgroundUrl
                              ? "cover"
                              : undefined,
                            backgroundPosition: activePublicLiveBackgroundUrl
                              ? "center"
                              : undefined,
                            borderColor: activePublicLiveTheme.border,
                            color: activePublicLiveTheme.text,
                          }}
                        >
                          <div style={styles.tournamentLiveThemePreviewHeader}>
                            {activePublicLiveLogoUrl && (
                              <span
                                style={{
                                  ...styles.tournamentLiveThemeLogo,
                                  background: activePublicLiveTheme.surface,
                                  borderColor: activePublicLiveTheme.border,
                                }}
                              >
                                <img
                                  src={activePublicLiveLogoUrl}
                                  alt=""
                                  style={styles.publicTournamentHeroLogoImage}
                                />
                              </span>
                            )}
                            <div style={styles.tournamentLiveThemePreviewTitle}>
                              <strong>{getTournamentPublicTitle(activeTournament)}</strong>
                              <span style={{ color: activePublicLiveTheme.mutedText }}>
                                {tournamentText.publicLinkReadonly}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              ...styles.tournamentThemePreviewSchedule,
                              background: activePublicLiveTheme.surface,
                              borderColor: activePublicLiveTheme.border,
                              color: activePublicLiveTheme.text,
                            }}
                          >
                            <span>09:00</span>
                            <strong>
                              {tournamentText.teamLabel} A {tournamentText.vsLabel}{" "}
                              {tournamentText.teamLabel} B
                            </strong>
                            <span
                              style={{
                                ...styles.tournamentThemePreviewButton,
                                background: activePublicLiveTheme.primary,
                                color: activePublicLiveTheme.background,
                              }}
                            >
                              {tournamentText.matchStatusStarted}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTournamentView === "promotion" && (
                      <div style={styles.tournamentSurface}>
                        <div style={styles.tournamentSectionHeader}>
                          <div>
                            <div style={styles.tournamentSectionTitle}>
                              {tournamentText.marketingTitle}
                            </div>
                            <div style={styles.tournamentMutedText}>
                              {tournamentText.marketingSubtitle}
                            </div>
                          </div>
                        </div>

                        {isPublished && !isPromotionVisibleOnUpcoming && (
                          <div style={styles.tournamentPromotionNotice}>
                            {tournamentText.promotionDirectLinkOnly}
                          </div>
                        )}

                        <div style={styles.tournamentPromotionActionRow}>
                          <button
                            type="button"
                            style={{
                              ...styles.tournamentPromotionToggleButton,
                              ...(isPromotionVisibleOnUpcoming
                                ? styles.tournamentPromotionToggleButtonVisible
                                : {}),
                              opacity: isPromotionBusy ? 0.72 : 1,
                            }}
                            onClick={
                              isPromotionVisibleOnUpcoming
                                ? hideTournamentPromotion
                                : publishTournamentPromotion
                            }
                            disabled={isPromotionBusy}
                            title={
                              isPromotionVisibleOnUpcoming
                                ? tournamentText.hidePromotion
                                : tournamentText.showOnUpcomingPage
                            }
                            aria-label={
                              isPromotionVisibleOnUpcoming
                                ? tournamentText.hidePromotion
                                : tournamentText.showOnUpcomingPage
                            }
                          >
                            {promotionVisibilityButtonLabel}
                          </button>
                          {promotionVisibilityError && (
                            <div style={styles.tournamentInlineWarning}>
                              {promotionVisibilityError}
                            </div>
                          )}
                        </div>

                        <div style={styles.tournamentPromotionPreviewWrap}>
                          <div style={styles.tournamentMiniTitle}>
                            {tournamentText.promotionPreviewTitle}
                          </div>
                          <div style={styles.tournamentPromotionPreviewCardFrame}>
                            {renderLandingPublicTournamentCard(activeTournament, {
                              preview: true,
                            })}
                          </div>
                        </div>

                        <div style={styles.tournamentSetupDivider} />

                        <div style={styles.tournamentSectionHeader}>
                          <div>
                            <div style={styles.tournamentMiniTitle}>
                              {tournamentText.publicDesign}
                            </div>
                            <div style={styles.tournamentMutedText}>
                              {tournamentText.preview}
                            </div>
                          </div>
                          <button
                            type="button"
                            style={styles.secondaryButtonCompact}
                            onClick={() => applyPublicThemePreset("classic-green")}
                          >
                            {tournamentText.resetTheme}
                          </button>
                        </div>

                        <div style={styles.tournamentMiniTitle}>
                          {tournamentText.themePresetsLabel}
                        </div>
                        <div style={styles.tournamentThemePresetGrid}>
                          {Object.entries(PUBLIC_THEME_PRESETS).map(
                            ([presetKey, preset]) => (
                              <button
                                key={presetKey}
                                type="button"
                                style={{
                                  ...styles.tournamentThemePresetButton,
                                  borderColor:
                                    activePublicTheme.preset === presetKey
                                      ? preset.primary
                                      : "#dbe3ef",
                                }}
                                onClick={() => applyPublicThemePreset(presetKey)}
                              >
                                <span
                                  style={{
                                    ...styles.tournamentThemeSwatch,
                                    background: preset.background,
                                    borderColor: preset.primary,
                                  }}
                                />
                                <strong>
                                  {preset.label?.[language] || preset.label?.en}
                                </strong>
                                <small>{tournamentText.usePreset}</small>
                              </button>
                            )
                          )}
                        </div>

                        <div style={styles.tournamentMiniTitle}>
                          {tournamentText.colorsLabel}
                        </div>
                        <div
                          style={{
                            ...styles.tournamentFieldGrid,
                            ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                          }}
                        >
                          {[
                            ["background", tournamentText.pageBackground],
                            ["panel", tournamentText.cardPanel],
                            ["primary", tournamentText.primaryColor],
                            ["accent", tournamentText.accentColor],
                            ["text", tournamentText.textColor],
                          ].map(([field, label]) => (
                            <div key={field}>
                              <div style={styles.settingsLabel}>{label}</div>
                              <input
                                style={styles.input}
                                value={activePublicTheme[field] || ""}
                                onChange={(e) =>
                                  updatePublicThemeField(field, e.target.value)
                                }
                              />
                              {publicThemeColorErrors[field] && (
                                <div style={styles.tournamentInlineWarning}>
                                  {tournamentText.invalidColor}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div style={styles.tournamentSetupDivider} />

                        <div style={styles.tournamentMiniTitle}>
                          {tournamentText.cardContentLabel}
                        </div>
                        <div
                          style={{
                            ...styles.tournamentFieldGrid,
                            ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                          }}
                        >
                          {[
                            ["publicTitle", tournamentText.publicTitleLabel, "text"],
                            [
                              "organizerName",
                              tournamentText.organizerDisplayNameLabel,
                              "text",
                              tournamentText.optionalPlaceholder,
                            ],
                            ["startDate", tournamentText.dateLabel, "date"],
                            ["startTime", tournamentText.startTimeLabel, "time"],
                            ["country", tournamentText.countryLabel, "text"],
                            ["city", tournamentText.cityLabel, "text"],
                            ["locationName", tournamentText.venueLabel, "text"],
                            ["address", tournamentText.addressLabel, "text"],
                          ].map(([field, label, type, placeholder]) => (
                            <div key={field}>
                              <div style={styles.settingsLabel}>{label}</div>
                              <input
                                style={styles.input}
                                type={type}
                                placeholder={placeholder || ""}
                                value={activeTournament[field] || ""}
                                onChange={(e) =>
                                  updateActiveTournament({
                                    [field]:
                                      type === "number"
                                        ? e.target.value
                                        : e.target.value,
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <div style={styles.settingsLabel}>
                            {tournamentText.publicSummaryLabel}
                          </div>
                          <textarea
                            style={styles.textarea}
                            value={activeTournament.publicSummary || ""}
                            onChange={(e) =>
                              updateActiveTournament({
                                publicSummary: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div style={styles.tournamentSetupDivider} />

                        <div style={styles.tournamentMiniTitle}>
                          {tournamentText.mediaLabel}
                        </div>
                        <div
                          style={{
                            ...styles.tournamentFieldGrid,
                            ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                          }}
                        >
                          {[
                            [
                              "publicLogoUrl",
                              tournamentText.publicLogoUrlLabel,
                              "url",
                            ],
                            [
                              "publicCardBackgroundUrl",
                              tournamentText.publicCardBackgroundUrlLabel,
                              "url",
                            ],
                            [
                              "posterImageUrl",
                              tournamentText.posterImageUrlLabel,
                              "url",
                            ],
                          ].map(([field, label, type]) => (
                            <div key={field}>
                              <div style={styles.settingsLabel}>{label}</div>
                              <input
                                style={styles.input}
                                type={type}
                                value={activeTournament[field] || ""}
                                onChange={(e) =>
                                  updateActiveTournament({
                                    [field]: e.target.value,
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>

                        <div style={styles.tournamentSetupDivider} />

                        <div style={styles.tournamentMiniTitle}>
                          {tournamentText.contactRegistrationLabel}
                        </div>
                        <div
                          style={{
                            ...styles.tournamentFieldGrid,
                            ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                          }}
                        >
                          {[
                            ["contactName", tournamentText.contactNameLabel, "text"],
                            ["contactPhone", tournamentText.contactPhoneLabel, "text"],
                            ["contactEmail", tournamentText.contactEmailLabel, "email"],
                            [
                              "registrationUrl",
                              tournamentText.registrationUrlLabel,
                              "url",
                            ],
                            [
                              "registrationDeadline",
                              tournamentText.registrationDeadlineLabel,
                              "date",
                            ],
                            ["prizeText", tournamentText.prizeLabel, "text"],
                            ["feeText", tournamentText.feeLabel, "text"],
                            ["maxTeams", tournamentText.maxTeamsLabel, "number"],
                          ].map(([field, label, type]) => (
                            <div key={field}>
                              <div style={styles.settingsLabel}>{label}</div>
                              <input
                                style={styles.input}
                                type={type}
                                value={activeTournament[field] || ""}
                                onChange={(e) =>
                                  updateActiveTournament({
                                    [field]: e.target.value,
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>

                        <div style={styles.tournamentSetupDivider} />

                        <div style={styles.tournamentMiniTitle}>
                          {tournamentText.optionalFoodInfoLabel}
                        </div>
                        <div
                          style={{
                            ...styles.tournamentFieldGrid,
                            ...(isMobile ? styles.tournamentFieldGridMobile : {}),
                          }}
                        >
                          {[
                            ["breakfastInfo", tournamentText.breakfastLabel],
                            ["breakBallInfo", tournamentText.breakBallLabel],
                            ["sodduInfo", tournamentText.sodduLabel],
                          ].map(([field, label]) => (
                            <div key={field}>
                              <div style={styles.settingsLabel}>{label}</div>
                              <input
                                style={styles.input}
                                value={activeTournament[field] || ""}
                                onChange={(e) =>
                                  updateActiveTournament({
                                    [field]: e.target.value,
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : isTournamentListLoading ? (
                <div style={styles.tournamentMutedPanel}>
                  {tournamentText.tournamentSyncLoading}
                </div>
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

  if (publicTournamentRequestActive) {
    return renderPublicTournamentPage(publicTournament, publicTournamentLoadStatus);
  }

  if (!auth.loggedIn) {
    return renderLoggedOutLandingPage();
  }

  const activeMainModule =
    activeTab === "tournament" ? "tournament" : "team-builder";

  return (
    <div style={styles.app}>
      <div style={styles.appGlowOne} />
      <div style={styles.appGlowTwo} />
      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.appBrandBlock}>
            <div style={styles.appBrandMark}>MTP</div>
            <div>
              <h1 style={styles.title}>{t.appTitle}</h1>
              <p style={styles.subtitle}>{t.appSubtitle}</p>
            </div>
          </div>

          <div style={styles.authCard}>
            <div style={styles.profileCompactRow}>
              <div style={styles.profileCompactLeft}>
                <div style={styles.profileAvatar}>
                  {(auth.username || "?").slice(0, 1).toUpperCase()}
                </div>
                <div style={styles.profileCompactName}>{auth.username}</div>
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

              <button style={styles.profileCompactLogout} onClick={handleLogout}>
                {t.logout}
              </button>
            </div>
          </div>
        </div>

        {loginMessage && <div style={styles.loginMessage}>{loginMessage}</div>}

        {!auth.loggedIn && renderPublicUpcomingTournaments()}

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
                            {trainer.active ? t.activeStatus : t.inactiveStatus} /{" "}
                            {trainer.skillView} / 1-{trainer.skillScale}
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
                            {t.archivedStatus} / {trainer.skillView} / 1-
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
              ...(activeMainModule === "team-builder"
                ? styles.tabButtonActive
                : {}),
            }}
            onClick={() => setActiveTab(teams.length ? "teams" : "players")}
          >
            {t.teamBuilder}
          </button>

          <button
            style={{
              ...styles.tabButton,
              ...(activeMainModule === "tournament"
                ? styles.tabButtonActive
                : {}),
            }}
            onClick={() => {
              setActiveTab("tournament");
              setShowTournamentSetupPanel(true);

              const scopedTournaments = filterTournamentsForUsername(
                tournaments,
                auth.username
              );
              const preferredId = getPreferredActiveTournamentId(
                scopedTournaments,
                auth.username,
                activeTournamentId
              );

              if (preferredId && preferredId !== activeTournamentId) {
                setActiveTournamentId(preferredId);
              }
            }}
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
                <div style={styles.teamBuilderStepRow}>
                  <div style={styles.workflowSteps}>
                    <button
                      type="button"
                      style={{
                        ...styles.workflowStepButton,
                        ...(activeTab === "players"
                          ? styles.workflowStepButtonActive
                          : {}),
                      }}
                      onClick={() => setActiveTab("players")}
                    >
                      {t.players}
                    </button>
                    <button
                      type="button"
                      style={{
                        ...styles.workflowStepButton,
                        ...(activeTab === "teams"
                          ? styles.workflowStepButtonActive
                          : {}),
                      }}
                      onClick={() => setActiveTab("teams")}
                    >
                      {t.teams}
                    </button>
                  </div>
                </div>

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
                          title={
                            language === "no"
                              ? "Reduser antall lag"
                              : "Decrease number of teams"
                          }
                          aria-label={
                            language === "no"
                              ? "Reduser antall lag"
                              : "Decrease number of teams"
                          }
                        >
                          <SvgIcon type="minus" size={14} strokeWidth={2.5} />
                        </button>

                        <div style={styles.countValue}>{teamCount}</div>

                        <button
                          style={styles.countButton}
                          onClick={() => setTeamCount((prev) => prev + 1)}
                          title={
                            language === "no"
                              ? "Øk antall lag"
                              : "Increase number of teams"
                          }
                          aria-label={
                            language === "no"
                              ? "Øk antall lag"
                              : "Increase number of teams"
                          }
                        >
                          <SvgIcon type="plus" size={14} strokeWidth={2.5} />
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
                      style={styles.filterValueButton}
                      onClick={() =>
                        setSkillView((prev) =>
                          prev === "numbers" ? "colors" : "numbers"
                        )
                      }
                      title={t.skillView}
                      aria-label={t.skillView}
                    >
                      <span>{skillView === "numbers" ? "123" : "Colors"}</span>
                      <SvgIcon type="chevron" size={13} strokeWidth={2.4} />
                    </button>
                  </div>

                  <div style={styles.compactSettingsCard}>
                    <span style={styles.settingsLabel}>{t.skillScale}</span>
                    <button
                      style={styles.filterValueButton}
                      onClick={() =>
                        setSkillScale((prev) => (prev === 3 ? 5 : 3))
                      }
                      title={t.skillScale}
                      aria-label={t.skillScale}
                    >
                      <span>{skillScale === 3 ? "1-3" : "1-5"}</span>
                      <SvgIcon type="chevron" size={13} strokeWidth={2.4} />
                    </button>
                  </div>

                  <div style={styles.compactSettingsCard}>
                    <span style={styles.settingsLabel}>{t.sort}</span>
                    <button
                      style={styles.filterValueButton}
                      onClick={() =>
                        setPlayerSortMode((prev) =>
                          prev === "name" ? "recent" : "name"
                        )
                      }
                      title={t.sort}
                      aria-label={t.sort}
                    >
                      <span>{playerSortMode === "name" ? "A-Z" : "Recent"}</span>
                      <SvgIcon type="chevron" size={13} strokeWidth={2.4} />
                    </button>
                  </div>

                  <div style={styles.compactSettingsCard}>
                    <span style={styles.settingsLabel}>{t.club}</span>
                    <button
                      style={styles.filterValueButton}
                      onClick={() =>
                        setPlayerViewMode((prev) =>
                          prev === "all" ? "club" : "all"
                        )
                      }
                      title={t.club}
                      aria-label={t.club}
                    >
                      <span>{playerViewMode === "all" ? t.all : t.club}</span>
                      <SvgIcon type="chevron" size={13} strokeWidth={2.4} />
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
                <div style={styles.teamBuilderStepRow}>
                  <div style={styles.workflowSteps}>
                    <button
                      type="button"
                      style={{
                        ...styles.workflowStepButton,
                        ...(activeTab === "players"
                          ? styles.workflowStepButtonActive
                          : {}),
                      }}
                      onClick={() => setActiveTab("players")}
                    >
                      {t.players}
                    </button>
                    <button
                      type="button"
                      style={{
                        ...styles.workflowStepButton,
                        ...(activeTab === "teams"
                          ? styles.workflowStepButtonActive
                          : {}),
                      }}
                      onClick={() => setActiveTab("teams")}
                    >
                      {t.teams}
                    </button>
                  </div>
                </div>

                <div style={styles.topTeamActionsCompact}>
                  <button
                    style={{
                      ...styles.toolbarIconButtonPrimary,
                      opacity: teams.length === 0 || loading ? 0.6 : 1,
                    }}
                    onClick={generateNewRound}
                    disabled={teams.length === 0 || loading}
                    title={t.newRound}
                    aria-label={t.newRound}
                  >
                    <SvgIcon type="refresh" size={15} strokeWidth={2.4} />
                  </button>

                  {visibleActions.saveRound && (
                    <button
                      style={{
                        ...styles.toolbarIconButton,
                        opacity: teams.length === 0 ? 0.6 : 1,
                      }}
                      onClick={saveRoundForSixHours}
                      disabled={teams.length === 0}
                      title={t.saveRound}
                      aria-label={t.saveRound}
                    >
                      <SvgIcon type="save" size={15} strokeWidth={2.2} />
                    </button>
                  )}

                  {teams.length >= 3 && (
                    <button
                      style={styles.toolbarVsButton}
                      onClick={() => {
                        setMatchMode((prev) => !prev);
                        setMatchRoundIndex(0);
                      }}
                      title={matchMode ? t.hideMatch : t.matchMode}
                      aria-label={matchMode ? t.hideMatch : t.matchMode}
                    >
                      <span style={styles.vsToolbarBadge}>VS</span>
                      {!isMobile && <span>{t.modeShort}</span>}
                    </button>
                  )}

                  <button
                    style={styles.toolbarIconButton}
                    onClick={() => setShowAddToTeamsModal(true)}
                    disabled={teams.length === 0}
                    title={t.addPlayer}
                    aria-label={t.addPlayer}
                  >
                    <SvgIcon type="plus" size={15} strokeWidth={2.5} />
                  </button>

                  <button
                    style={styles.toolbarDangerIconButton}
                    onClick={() => setShowRemoveFromTeamsModal(true)}
                    disabled={teams.length === 0}
                    title={t.removePlayer}
                    aria-label={t.removePlayer}
                  >
                    <SvgIcon type="minus" size={15} strokeWidth={2.5} />
                  </button>

                  {visibleActions.export && teams.length > 0 && (
                    <button
                      style={styles.toolbarIconButton}
                      onClick={() => setShowExportView(true)}
                      title={t.export}
                      aria-label={t.export}
                    >
                      <SvgIcon type="download" size={15} strokeWidth={2.3} />
                    </button>
                  )}

                  <button
                    style={styles.toolbarIconButton}
                    onClick={() => setShowToolbarSettings(true)}
                    title={t.toolbarSettings}
                    aria-label={t.toolbarSettings}
                  >
                    <SvgIcon type="settings" size={15} strokeWidth={2.1} />
                  </button>

                  {visibleActions.clearSaved && (
                    <button
                      style={styles.toolbarDangerIconButton}
                      onClick={clearStoredRounds}
                      title={t.clearSaved}
                      aria-label={t.clearSaved}
                    >
                      <SvgIcon type="x" size={14} strokeWidth={2.5} />
                    </button>
                  )}

                  {visibleActions.skillToggle &&
                    skillView === "numbers" &&
                    teams.length > 0 && (
                      <button
                        style={styles.toolbarIconButton}
                        onClick={() => setShowSkillInTeams((prev) => !prev)}
                        title={showSkillInTeams ? t.hideSkill : t.showSkill}
                        aria-label={showSkillInTeams ? t.hideSkill : t.showSkill}
                      >
                        <SvgIcon type="eye" size={15} strokeWidth={2.2} />
                      </button>
                    )}

                  {visibleActions.lockToggle && teams.length > 0 && (
                    <button
                      style={styles.toolbarIconButton}
                      onClick={() => setShowLockInTeams((prev) => !prev)}
                      title={showLockInTeams ? t.unlock : t.lock}
                      aria-label={showLockInTeams ? t.unlock : t.lock}
                    >
                      <SvgIcon
                        type={showLockInTeams ? "unlock" : "lock"}
                        size={15}
                        strokeWidth={2.2}
                      />
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
                                    Move
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
                                    <SvgIcon
                                      type={player.locked ? "lock" : "unlock"}
                                      size={13}
                                      strokeWidth={2.4}
                                    />
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
                    {value ? "On" : "Off"}
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
    border: "1px solid rgba(37,99,235,0.18)",
    borderRadius: "12px",
    minHeight: "34px",
    minWidth: "38px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "850",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 10px",
    whiteSpace: "nowrap",
  },

  removeIconActionButton: {
    border: "1px solid rgba(220,38,38,0.16)",
    borderRadius: "12px",
    minHeight: "34px",
    minWidth: "38px",
    background: "#fff1f2",
    color: "#be123c",
    fontWeight: "850",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 10px",
    whiteSpace: "nowrap",
  },

  landingPage: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 12% 10%, rgba(37,99,235,0.14), transparent 30%), radial-gradient(circle at 82% 12%, rgba(96,165,250,0.15), transparent 32%), radial-gradient(circle at 72% 88%, rgba(56,189,248,0.10), transparent 34%), linear-gradient(135deg, #f5f9ff 0%, #eaf4ff 48%, #dbeafe 100%)",
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
    padding: "18px",
    boxSizing: "border-box",
  },

  landingShell: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gap: "22px",
  },

  landingGlowOne: {
    position: "absolute",
    top: "-140px",
    right: "-90px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(37,99,235,0.16)",
    filter: "blur(48px)",
  },

  landingGlowTwo: {
    position: "absolute",
    bottom: "-160px",
    left: "-100px",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.16)",
    filter: "blur(58px)",
  },

  landingCourtLines: {
    position: "absolute",
    inset: "80px 5% auto auto",
    width: "54%",
    height: "58%",
    minHeight: "360px",
    border: "1px solid rgba(37,99,235,0.09)",
    borderRadius: "34px",
    transform: "skewY(-7deg)",
    opacity: 0.9,
  },

  landingCourtNet: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: "1px",
    background:
      "repeating-linear-gradient(to bottom, rgba(37,99,235,0.14), rgba(37,99,235,0.14) 10px, transparent 10px, transparent 20px)",
  },

  landingCourtCircle: {
    position: "absolute",
    width: "170px",
    height: "170px",
    borderRadius: "999px",
    border: "1px solid rgba(96,165,250,0.16)",
    top: "22%",
    left: "calc(50% - 85px)",
  },

  landingCourtSideLine: {
    position: "absolute",
    inset: "44px",
    border: "1px solid rgba(37,99,235,0.07)",
    borderRadius: "26px",
  },

  landingTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "8px 0",
  },

  landingBrandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  landingBrandMark: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #2563eb, #60a5fa)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "950",
    boxShadow: "0 12px 26px rgba(37,99,235,0.18)",
    flexShrink: 0,
  },

  landingBrandName: {
    fontSize: "18px",
    fontWeight: "950",
    color: "#0f172a",
    lineHeight: 1,
  },

  landingBrandSubtitle: {
    marginTop: "4px",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "700",
  },

  landingLanguageRow: {
    display: "flex",
    gap: "6px",
    padding: "5px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(37,99,235,0.16)",
    backdropFilter: "blur(14px)",
  },

  landingLanguageButton: {
    border: "none",
    borderRadius: "999px",
    padding: "8px 10px",
    background: "transparent",
    color: "#1e3a8a",
    fontSize: "11px",
    fontWeight: "900",
    cursor: "pointer",
  },

  landingLanguageButtonActive: {
    background: "#0f172a",
    color: "#ffffff",
  },

  landingHeroGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "24px",
    alignItems: "center",
    padding: "28px 0 10px",
  },

  landingHeroCopy: {
    display: "grid",
    gap: "18px",
    minWidth: 0,
  },

  landingHeroKicker: {
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(219,234,254,0.78)",
    border: "1px solid rgba(37,99,235,0.18)",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  landingHeroTitle: {
    margin: 0,
    maxWidth: "680px",
    color: "#0f172a",
    fontSize: "46px",
    lineHeight: 1.02,
    fontWeight: "950",
    overflowWrap: "anywhere",
  },

  landingHeroText: {
    margin: 0,
    maxWidth: "600px",
    color: "#475569",
    fontSize: "16px",
    lineHeight: 1.65,
    fontWeight: "700",
  },

  landingFeatureChips: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
  },

  landingFeatureChip: {
    borderRadius: "999px",
    padding: "9px 12px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(37,99,235,0.14)",
    color: "#1e3a8a",
    fontSize: "12px",
    fontWeight: "900",
    boxShadow: "0 10px 24px rgba(37,99,235,0.08)",
  },

  landingVisualCard: {
    marginTop: "8px",
    borderRadius: "28px",
    padding: "18px",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.86), rgba(234,244,255,0.66))",
    border: "1px solid rgba(37,99,235,0.16)",
    boxShadow: "0 24px 60px rgba(37,99,235,0.12)",
    backdropFilter: "blur(18px)",
    maxWidth: "560px",
    display: "grid",
    gap: "12px",
    minWidth: 0,
  },

  landingVisualHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: "#1e3a8a",
    fontSize: "11px",
    fontWeight: "950",
  },

  landingVisualText: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.45,
    fontWeight: "750",
  },

  landingControlPills: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  landingControlPill: {
    borderRadius: "999px",
    padding: "7px 9px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(37,99,235,0.14)",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "900",
  },

  landingSchedulePreview: {
    display: "grid",
    gap: "7px",
    padding: "12px",
    borderRadius: "20px",
    border: "1px solid rgba(37,99,235,0.16)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.88), rgba(239,246,255,0.74))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.78)",
  },

  landingSchedulePreviewTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    color: "#1e3a8a",
    fontSize: "10px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  landingScheduleRow: {
    display: "grid",
    gridTemplateColumns: "48px 72px minmax(0, 1fr)",
    alignItems: "center",
    gap: "8px",
    padding: "8px 9px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(37,99,235,0.10)",
    minWidth: 0,
  },

  landingScheduleTime: {
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: "950",
  },

  landingScheduleCourt: {
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "900",
  },

  landingScheduleTeams: {
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: "900",
    overflowWrap: "anywhere",
  },

  landingMiniCourt: {
    position: "relative",
    minHeight: "180px",
    borderRadius: "22px",
    border: "1px solid rgba(37,99,235,0.16)",
    background:
      "linear-gradient(90deg, rgba(219,234,254,0.78), rgba(191,219,254,0.54)), linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0.58))",
    overflow: "hidden",
  },

  landingMiniNet: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: "2px",
    background:
      "repeating-linear-gradient(to bottom, rgba(37,99,235,0.28), rgba(37,99,235,0.28) 8px, transparent 8px, transparent 16px)",
  },

  landingMiniAttackLine: {
    position: "absolute",
    top: "18%",
    bottom: "18%",
    left: "28%",
    width: "1px",
    background: "rgba(37,99,235,0.14)",
  },

  landingMiniAttackLineRight: {
    position: "absolute",
    top: "18%",
    bottom: "18%",
    right: "28%",
    width: "1px",
    background: "rgba(37,99,235,0.14)",
  },

  landingBallOne: {
    position: "absolute",
    left: "20%",
    top: "24%",
    width: "46px",
    height: "46px",
    borderRadius: "999px",
    background: "radial-gradient(circle at 32% 28%, #ffffff, #60a5fa 56%, #2563eb)",
    boxShadow: "0 14px 36px rgba(37,99,235,0.18)",
  },

  landingBallTwo: {
    position: "absolute",
    right: "18%",
    bottom: "20%",
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    background: "radial-gradient(circle at 32% 28%, #ffffff, #93c5fd 55%, #2563eb)",
    boxShadow: "0 14px 36px rgba(96,165,250,0.20)",
  },

  landingVisualStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "8px",
  },

  landingVisualStat: {
    display: "grid",
    gap: "3px",
    padding: "10px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.74)",
    border: "1px solid rgba(37,99,235,0.12)",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "850",
  },

  landingVisualStatValue: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "950",
  },

  landingLoginCard: {
    borderRadius: "30px",
    padding: "24px",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.90), rgba(234,244,255,0.72))",
    border: "1px solid rgba(37,99,235,0.18)",
    boxShadow: "0 28px 80px rgba(37,99,235,0.16)",
    backdropFilter: "blur(22px)",
    display: "grid",
    gap: "18px",
    alignSelf: "center",
    minWidth: 0,
  },

  landingLoginHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  landingLoginIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: "linear-gradient(145deg, #2563eb, #60a5fa)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "950",
    flexShrink: 0,
  },

  landingLoginTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "24px",
    fontWeight: "950",
  },

  landingLoginHelper: {
    margin: "4px 0 0",
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.45,
    fontWeight: "700",
  },

  landingLoginForm: {
    display: "grid",
    gap: "10px",
  },

  landingInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(37,99,235,0.18)",
    borderRadius: "16px",
    padding: "14px 15px",
    background: "rgba(255,255,255,0.92)",
    color: "#0f172a",
    outline: "none",
    fontSize: "14px",
    fontWeight: "700",
  },

  landingLoginButton: {
    border: "none",
    borderRadius: "16px",
    padding: "14px 16px",
    background: "linear-gradient(135deg, #0f172a, #2563eb)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "950",
    cursor: "pointer",
    boxShadow: "0 18px 34px rgba(37,99,235,0.18)",
  },

  landingLoginMessage: {
    color: "#0f172a",
    background: "rgba(239,246,255,0.92)",
    border: "1px solid rgba(37,99,235,0.16)",
    borderRadius: "14px",
    padding: "10px 12px",
    fontSize: "12px",
    fontWeight: "800",
  },

  landingUpcomingSection: {
    display: "grid",
    gap: "16px",
    padding: "20px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(37,99,235,0.14)",
    boxShadow: "0 26px 70px rgba(37,99,235,0.10)",
    backdropFilter: "blur(18px)",
    minWidth: 0,
  },

  landingSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },

  landingEyebrow: {
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  landingSectionTitle: {
    margin: "4px 0 0",
    color: "#0f172a",
    fontSize: "26px",
    lineHeight: 1.12,
    fontWeight: "950",
  },

  landingFilterRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  landingFilterSelect: {
    border: "1px solid rgba(37,99,235,0.16)",
    borderRadius: "999px",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.92)",
    color: "#1e3a8a",
    fontSize: "12px",
    fontWeight: "900",
    outline: "none",
  },

  landingEmptyState: {
    display: "grid",
    gap: "5px",
    padding: "18px",
    borderRadius: "22px",
    background: "rgba(234,244,255,0.76)",
    border: "1px dashed rgba(37,99,235,0.20)",
    color: "#1e3a8a",
    fontSize: "13px",
    fontWeight: "800",
  },

  landingTournamentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 420px))",
    gap: "14px",
    justifyContent: "start",
  },

  landingTournamentCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "24px",
    border: "1px solid rgba(37,99,235,0.18)",
    minHeight: "0",
    display: "grid",
    alignContent: "start",
    gap: "12px",
    padding: "14px",
    cursor: "pointer",
    boxShadow: "0 24px 52px rgba(37,99,235,0.12)",
    isolation: "isolate",
  },

  landingTournamentPoster: {
    position: "relative",
    zIndex: 1,
    minHeight: "150px",
    maxHeight: "210px",
    height: "clamp(150px, 18vw, 210px)",
    borderRadius: "18px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid rgba(37,99,235,0.16)",
    boxShadow: "inset 0 -40px 70px rgba(15,23,42,0.16)",
  },

  landingTournamentCardShine: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.16), transparent 34%, rgba(255,255,255,0.06))",
    pointerEvents: "none",
  },

  landingTournamentCardTop: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  landingTournamentTopLeft: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },

  landingTournamentLogoBadge: {
    width: "34px",
    height: "34px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.24)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    boxShadow: "0 8px 18px rgba(2,6,23,0.18)",
  },

  landingTournamentLogoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  landingTournamentStatusPill: {
    borderRadius: "999px",
    padding: "6px 9px",
    fontSize: "11px",
    fontWeight: "950",
    backdropFilter: "blur(8px)",
  },

  landingTournamentDatePill: {
    borderRadius: "999px",
    padding: "6px 9px",
    border: "1px solid rgba(37,99,235,0.16)",
    fontSize: "11px",
    fontWeight: "900",
  },

  landingTournamentCardBody: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gap: "10px",
    minWidth: 0,
  },

  landingTournamentCardTitle: {
    margin: 0,
    fontSize: "21px",
    lineHeight: 1.12,
    fontWeight: "950",
    overflowWrap: "anywhere",
  },

  landingTournamentSeriesRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  landingTournamentSeriesBadge: {
    borderRadius: "999px",
    padding: "6px 9px",
    border: "1px solid rgba(37,99,235,0.16)",
    fontSize: "10px",
    fontWeight: "950",
  },

  landingTournamentMetaList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
    gap: "8px",
  },

  landingTournamentMetaItem: {
    display: "grid",
    gap: "3px",
    padding: "8px 9px",
    borderRadius: "14px",
    background: "rgba(239,246,255,0.74)",
    border: "1px solid rgba(37,99,235,0.12)",
    fontSize: "11px",
    minWidth: 0,
  },

  landingTournamentOpenButton: {
    border: "none",
    borderRadius: "15px",
    padding: "12px 14px",
    fontSize: "13px",
    fontWeight: "950",
    cursor: "pointer",
  },

  app: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 12% 8%, rgba(37,99,235,0.12), transparent 28%), radial-gradient(circle at 88% 18%, rgba(96,165,250,0.14), transparent 30%), linear-gradient(135deg, #f5f9ff 0%, #eaf4ff 48%, #dbeafe 100%)",
    padding: "16px",
    fontFamily: "Arial, sans-serif",
  },

  appGlowOne: {
    position: "absolute",
    top: "-160px",
    right: "-120px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(37,99,235,0.14)",
    filter: "blur(54px)",
    pointerEvents: "none",
  },

  appGlowTwo: {
    position: "absolute",
    bottom: "-180px",
    left: "-130px",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: "rgba(96,165,250,0.14)",
    filter: "blur(58px)",
    pointerEvents: "none",
  },

  shell: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gap: "14px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    padding: "8px 0",
  },

  appBrandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  appBrandMark: {
    width: "44px",
    height: "44px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #2563eb, #60a5fa)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "950",
    boxShadow: "0 12px 26px rgba(37,99,235,0.18)",
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "950",
    color: "#0f172a",
    lineHeight: 1,
  },

  subtitle: {
    margin: "5px 0 0 0",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "700",
  },

  authCard: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(37,99,235,0.18)",
    borderRadius: "999px",
    padding: "6px 7px",
    boxShadow: "0 16px 40px rgba(37,99,235,0.12)",
    backdropFilter: "blur(18px)",
    display: "grid",
    gap: "5px",
  },

  adminCard: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "22px",
    padding: "16px",
    boxShadow: "0 18px 48px rgba(37,99,235,0.10)",
    backdropFilter: "blur(18px)",
    display: "grid",
    gap: "12px",
  },

  trainerListCard: {
    background: "rgba(255,255,255,0.72)",
    borderRadius: "16px",
    display: "grid",
    gap: "10px",
  },

  trainerUsersWrap: {
    display: "grid",
    gap: "10px",
  },

  trainerUserRow: {
    background: "rgba(239,246,255,0.72)",
    border: "1px solid rgba(37,99,235,0.12)",
    borderRadius: "14px",
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
    fontWeight: "900",
    color: "#0f172a",
  },

  authSubtitle: {
    fontSize: "12px",
    color: "#475569",
    marginTop: "2px",
  },

  loginGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "8px",
  },

  loginMessage: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#0f172a",
    padding: "10px 12px",
    borderRadius: "14px",
    background: "rgba(239,246,255,0.82)",
    border: "1px solid rgba(37,99,235,0.14)",
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
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    padding: "7px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(37,99,235,0.16)",
    boxShadow: "0 20px 54px rgba(37,99,235,0.10)",
    backdropFilter: "blur(18px)",
  },

  tabButton: {
    border: "1px solid transparent",
    borderRadius: "18px",
    padding: "13px 14px",
    fontSize: "14px",
    fontWeight: "950",
    background: "rgba(255,255,255,0.68)",
    color: "#1e3a8a",
    cursor: "pointer",
  },

  tabButtonActive: {
    background: "linear-gradient(135deg, #0f172a, #2563eb)",
    color: "#fff",
    border: "1px solid rgba(37,99,235,0.26)",
    boxShadow: "0 16px 34px rgba(37,99,235,0.18)",
  },

  teamBuilderStepRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "2px",
  },

  workflowSteps: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  workflowStepButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid rgba(37,99,235,0.16)",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "rgba(255,255,255,0.82)",
    color: "#1e3a8a",
    fontSize: "12px",
    fontWeight: "950",
    cursor: "pointer",
  },

  workflowStepButtonActive: {
    background: "#dbeafe",
    color: "#0f172a",
    border: "1px solid rgba(37,99,235,0.28)",
    boxShadow: "0 8px 18px rgba(37,99,235,0.10)",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "14px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(37,99,235,0.14)",
    boxShadow: "0 24px 64px rgba(37,99,235,0.08)",
    backdropFilter: "blur(18px)",
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
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "20px",
    padding: "12px 14px",
    boxShadow: "0 12px 28px rgba(37,99,235,0.08)",
  },

  teamCountLabel: {
    display: "block",
    fontSize: "11px",
    color: "#475569",
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
    gap: "6px",
    padding: "4px",
    borderRadius: "999px",
    background: "rgba(239,246,255,0.78)",
    border: "1px solid rgba(37,99,235,0.12)",
  },

  countButton: {
    width: "30px",
    height: "30px",
    border: "1px solid rgba(37,99,235,0.18)",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    cursor: "pointer",
    fontWeight: "900",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  countValue: {
    minWidth: "30px",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "950",
    color: "#0f172a",
  },

  selectedBadge: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "20px",
    padding: "10px 12px",
    fontSize: "12px",
    fontWeight: "850",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 12px 28px rgba(37,99,235,0.08)",
  },

  settingsCompactRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "8px",
  },

  settingsCard: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "18px",
    padding: "10px 12px",
    boxShadow: "0 12px 28px rgba(37,99,235,0.07)",
    display: "grid",
    gap: "8px",
    minWidth: "220px",
  },

  compactSettingsCard: {
    background: "linear-gradient(145deg, rgba(255,255,255,0.92), rgba(239,246,255,0.72))",
    border: "1px solid rgba(37,99,235,0.18)",
    borderRadius: "18px",
    padding: "10px",
    boxShadow: "0 8px 18px rgba(37,99,235,0.055)",
    display: "grid",
    gap: "6px",
    minWidth: 0,
  },

  settingsLabel: {
    fontSize: "11px",
    color: "#475569",
    fontWeight: "800",
    textAlign: "center",
  },

  settingsToggleRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  smallToggleButton: {
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "999px",
    padding: "6px 8px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  smallToggleButtonActive: {
    background: "#eaf4ff",
    color: "#0f172a",
    border: "1px solid rgba(37,99,235,0.24)",
    boxShadow: "inset 0 0 0 1px rgba(37,99,235,0.08)",
  },

  filterValueButton: {
    width: "100%",
    minHeight: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: "1px solid rgba(37,99,235,0.16)",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "rgba(255,255,255,0.82)",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(37,99,235,0.045)",
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
    display: "flex",
    alignItems: "center",
    gap: "7px",
    flexWrap: "wrap",
  },

  toolbarIconButton: {
    width: "38px",
    minWidth: "38px",
    height: "38px",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "14px",
    background: "rgba(239,246,255,0.88)",
    color: "#1d4ed8",
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "0 10px",
    boxShadow: "0 8px 18px rgba(37,99,235,0.055)",
  },

  toolbarIconButtonPrimary: {
    width: "38px",
    minWidth: "38px",
    height: "38px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #0f172a, #2563eb)",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    boxShadow: "0 12px 24px rgba(37,99,235,0.18)",
  },

  toolbarDangerIconButton: {
    width: "38px",
    minWidth: "38px",
    height: "38px",
    border: "1px solid rgba(220,38,38,0.14)",
    borderRadius: "14px",
    background: "#fff1f2",
    color: "#be123c",
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    boxShadow: "0 8px 18px rgba(220,38,38,0.045)",
  },

  toolbarVsButton: {
    minWidth: "74px",
    height: "38px",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "14px",
    background: "rgba(239,246,255,0.88)",
    color: "#1d4ed8",
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "0 10px",
    boxShadow: "0 8px 18px rgba(37,99,235,0.055)",
  },

  vsToolbarBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "30px",
    height: "22px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #0f172a, #2563eb)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "950",
    letterSpacing: 0,
    boxShadow: "0 8px 16px rgba(37,99,235,0.16)",
  },

  primaryButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "linear-gradient(135deg, #0f172a, #2563eb)",
    color: "#fff",
    fontWeight: "850",
    cursor: "pointer",
  },

  primaryButtonSmall: {
    border: "none",
    borderRadius: "10px",
    padding: "8px 10px",
    background: "#0f172a",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "12px",
  },

  secondaryButton: {
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "rgba(239,246,255,0.86)",
    color: "#1e3a8a",
    fontWeight: "850",
    cursor: "pointer",
  },

  secondaryButtonCompact: {
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "rgba(239,246,255,0.86)",
    color: "#1e3a8a",
    fontWeight: "850",
    cursor: "pointer",
    fontSize: "12px",
  },

  dangerButtonCompact: {
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "8px 10px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: "700",
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
    borderRadius: "999px",
    padding: "5px 8px",
    background: "transparent",
    color: "#1e3a8a",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  languageToggleButtonActive: {
    background: "#0f172a",
    color: "#fff",
  },

  compactActionButtonPrimary: {
    border: "none",
    borderRadius: "12px",
    padding: "9px 10px",
    background: "linear-gradient(135deg, #0f172a, #2563eb)",
    color: "#fff",
    fontWeight: "850",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },

  compactActionButton: {
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "12px",
    padding: "9px 10px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "850",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },

  compactDangerButton: {
    border: "1px solid rgba(220,38,38,0.14)",
    borderRadius: "12px",
    padding: "9px 10px",
    background: "#fff1f2",
    color: "#be123c",
    fontWeight: "850",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },

  formCard: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "18px",
    padding: "12px",
    display: "grid",
    gap: "8px",
    boxShadow: "0 12px 28px rgba(37,99,235,0.07)",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "14px",
    border: "1px solid rgba(37,99,235,0.18)",
    padding: "12px",
    fontSize: "14px",
    background: "rgba(255,255,255,0.92)",
    color: "#0f172a",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "14px",
    border: "1px solid rgba(37,99,235,0.18)",
    padding: "12px",
    fontSize: "14px",
    background: "rgba(255,255,255,0.92)",
    color: "#0f172a",
  },

  textarea: {
    width: "100%",
    minHeight: "92px",
    boxSizing: "border-box",
    borderRadius: "14px",
    border: "1px solid rgba(37,99,235,0.18)",
    padding: "12px",
    fontSize: "14px",
    background: "rgba(255,255,255,0.92)",
    color: "#0f172a",
    fontFamily: "inherit",
    resize: "vertical",
  },

  publicLandingSection: {
    display: "grid",
    gap: "18px",
    padding: "20px",
    borderRadius: "24px",
    background: "#052e24",
    border: "1px solid rgba(34,197,94,0.24)",
    boxShadow: "0 18px 42px rgba(6,78,59,0.18)",
    minWidth: 0,
  },

  publicLandingHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-end",
    flexWrap: "wrap",
    minWidth: 0,
  },

  publicLandingEyebrow: {
    color: "#86efac",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  publicLandingTitle: {
    margin: "4px 0 0",
    color: "#fff",
    fontSize: "clamp(24px, 5vw, 42px)",
    lineHeight: 1.05,
    fontWeight: "950",
    overflowWrap: "anywhere",
  },

  publicLandingSubtitle: {
    margin: "8px 0 0",
    color: "#bbf7d0",
    fontSize: "14px",
    lineHeight: 1.55,
    maxWidth: "620px",
    fontWeight: "650",
  },

  publicLandingFilters: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  publicLandingSelect: {
    border: "1px solid rgba(187,247,208,0.28)",
    borderRadius: "999px",
    padding: "9px 12px",
    background: "rgba(255,255,255,0.08)",
    color: "#ecfdf5",
    fontSize: "12px",
    fontWeight: "800",
  },

  publicLandingState: {
    padding: "20px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px dashed rgba(187,247,208,0.24)",
    color: "#d1fae5",
    fontSize: "13px",
    fontWeight: "800",
    textAlign: "center",
  },

  publicTournamentCardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: "14px",
    minWidth: 0,
  },

  publicTournamentPosterCard: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    overflow: "hidden",
    borderRadius: "22px",
    border: "1px solid rgba(134,239,172,0.34)",
    color: "#fff",
    minWidth: 0,
    boxShadow: "0 18px 34px rgba(2,6,23,0.24)",
  },

  publicTournamentPosterImage: {
    minHeight: "150px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },

  publicTournamentPosterBody: {
    display: "grid",
    gap: "13px",
    padding: "17px",
    minWidth: 0,
  },

  publicTournamentPosterTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  publicTournamentPosterDate: {
    borderRadius: "999px",
    padding: "7px 10px",
    color: "#052e16",
    fontSize: "11px",
    fontWeight: "950",
    whiteSpace: "nowrap",
  },

  publicTournamentPosterBadges: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  publicTournamentPosterBadge: {
    borderRadius: "999px",
    padding: "6px 8px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#d1fae5",
    fontSize: "10px",
    fontWeight: "900",
  },

  publicTournamentPosterTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "24px",
    lineHeight: 1.05,
    fontWeight: "950",
    overflowWrap: "anywhere",
  },

  publicTournamentPosterSummary: {
    margin: 0,
    color: "#d1fae5",
    fontSize: "13px",
    lineHeight: 1.55,
    fontWeight: "650",
  },

  publicTournamentPosterMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
    gap: "9px",
    minWidth: 0,
  },

  publicTournamentPosterMetaItem: {
    display: "grid",
    gap: "4px",
    padding: "9px 10px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "var(--public-muted, #d1fae5)",
    minWidth: 0,
  },

  publicTournamentPosterFood: {
    borderRadius: "14px",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fef3c7",
    fontSize: "12px",
    fontWeight: "850",
  },

  publicTournamentPosterButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "#fff",
    color: "#052e16",
    fontSize: "13px",
    fontWeight: "950",
    cursor: "pointer",
  },

  tournamentPromotionHeaderActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
  },

  tournamentPromotionVisibleBadge: {
    borderRadius: "999px",
    padding: "7px 10px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    fontSize: "11px",
    fontWeight: "950",
    whiteSpace: "nowrap",
  },

  tournamentPromotionStatusBadge: {
    borderRadius: "999px",
    padding: "7px 10px",
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid rgba(37,99,235,0.18)",
    fontSize: "11px",
    fontWeight: "950",
    whiteSpace: "nowrap",
  },

  tournamentPromotionStatusBadgeVisible: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },

  tournamentPromotionStatusBadgeError: {
    background: "#fff1f2",
    color: "#be123c",
    border: "1px solid #fecdd3",
  },

  tournamentPromotionNotice: {
    padding: "13px 14px",
    borderRadius: "16px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    fontSize: "13px",
    fontWeight: "850",
    lineHeight: 1.45,
  },

  tournamentPromotionActionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  tournamentPromotionToggleButton: {
    border: "1px solid rgba(37,99,235,0.22)",
    borderRadius: "999px",
    padding: "10px 14px",
    background: "rgba(239,246,255,0.88)",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "950",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37,99,235,0.08)",
  },

  tournamentPromotionToggleButtonVisible: {
    border: "1px solid #86efac",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    boxShadow: "0 12px 26px rgba(34,197,94,0.18)",
  },

  tournamentPromotionPreviewWrap: {
    display: "grid",
    gap: "10px",
    padding: "15px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid #dbe3ef",
    minWidth: 0,
  },

  tournamentPromotionPreviewCardFrame: {
    maxWidth: "440px",
    width: "100%",
  },

  tournamentLiveThemePreview: {
    display: "grid",
    gap: "12px",
    maxWidth: "520px",
    padding: "15px",
    borderRadius: "18px",
    border: "1px solid #dbe3ef",
    minWidth: 0,
    overflow: "hidden",
  },

  tournamentLiveThemePreviewHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  tournamentLiveThemePreviewTitle: {
    display: "grid",
    gap: "3px",
    minWidth: 0,
    fontSize: "13px",
    fontWeight: "900",
  },

  tournamentLiveThemeLogo: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #dbe3ef",
    overflow: "hidden",
    flexShrink: 0,
  },

  tournamentPromotionPreviewCard: {
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid #22c55e",
    color: "#fff",
    display: "grid",
    minWidth: 0,
    boxShadow: "0 16px 28px rgba(2,6,23,0.18)",
  },

  tournamentPromotionPreviewImage: {
    minHeight: "120px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },

  tournamentPromotionPreviewBody: {
    display: "grid",
    gap: "12px",
    padding: "16px",
    minWidth: 0,
  },

  tournamentPromotionPreviewTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  tournamentPromotionPreviewDate: {
    borderRadius: "999px",
    padding: "7px 10px",
    color: "#052e16",
    fontSize: "11px",
    fontWeight: "950",
    whiteSpace: "nowrap",
  },

  tournamentPromotionPreviewTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "22px",
    lineHeight: 1.08,
    fontWeight: "950",
    overflowWrap: "anywhere",
  },

  tournamentPromotionPreviewSummary: {
    margin: 0,
    color: "#d1fae5",
    fontSize: "13px",
    lineHeight: 1.5,
    fontWeight: "650",
  },

  tournamentPromotionPreviewMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
    gap: "9px",
    minWidth: 0,
  },

  tournamentThemePreviewSchedule: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "8px",
    marginTop: "8px",
    padding: "9px 10px",
    borderRadius: "13px",
    border: "1px solid rgba(255,255,255,0.16)",
    fontSize: "12px",
    fontWeight: "800",
  },

  tournamentThemePreviewButton: {
    border: "none",
    borderRadius: "999px",
    padding: "6px 9px",
    fontSize: "10px",
    fontWeight: "900",
  },

  tournamentThemePresetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
    gap: "9px",
    minWidth: 0,
  },

  tournamentThemePresetButton: {
    display: "grid",
    gridTemplateColumns: "30px minmax(0, 1fr)",
    alignItems: "center",
    gap: "8px",
    textAlign: "left",
    border: "1px solid #dbe3ef",
    borderRadius: "14px",
    padding: "10px",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
  },

  tournamentThemeSwatch: {
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    border: "2px solid #22c55e",
  },

  tournamentInlineWarning: {
    marginTop: "5px",
    color: "#b91c1c",
    fontSize: "11px",
    fontWeight: "800",
  },

  tournamentMarketingSeriesList: {
    display: "grid",
    gap: "14px",
    minWidth: 0,
  },

  tournamentMarketingSeriesCard: {
    display: "grid",
    gap: "13px",
    padding: "15px",
    borderRadius: "18px",
    background: "#fff",
    border: "1px solid #dbe3ef",
    minWidth: 0,
  },

  publicTournamentPage: {
    minHeight: "100vh",
    background: "#04130f",
    color: "#f8fafc",
    padding: "18px",
    boxSizing: "border-box",
  },

  publicTournamentShell: {
    width: "min(1120px, 100%)",
    margin: "0 auto",
    display: "grid",
    gap: "18px",
  },

  publicTournamentTopbar: {
    display: "flex",
    justifyContent: "flex-end",
  },

  publicTournamentBackButton: {
    border: "1px solid var(--public-border, rgba(255,255,255,0.18))",
    borderRadius: "999px",
    padding: "10px 14px",
    background: "var(--public-surface, rgba(255,255,255,0.08))",
    color: "var(--public-text, #f8fafc)",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
  },

  publicTournamentEmpty: {
    display: "grid",
    gap: "14px",
    justifyItems: "center",
    textAlign: "center",
    padding: "64px 20px",
    borderRadius: "22px",
    background: "#0b1f18",
    border: "1px solid rgba(110,231,183,0.22)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
  },

  publicTournamentStatusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "7px 11px",
    background: "rgba(34,197,94,0.18)",
    color: "#86efac",
    border: "1px solid rgba(134,239,172,0.28)",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  publicTournamentCodePill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "7px 11px",
    background: "rgba(15,23,42,0.72)",
    color: "#d1fae5",
    border: "1px solid rgba(209,250,229,0.22)",
    fontSize: "11px",
    fontWeight: "900",
    overflowWrap: "anywhere",
  },

  publicTournamentEmptyTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "clamp(28px, 7vw, 54px)",
    lineHeight: 1,
    fontWeight: "900",
  },

  publicTournamentMuted: {
    margin: 0,
    color: "#a7f3d0",
    fontSize: "14px",
    lineHeight: 1.6,
    fontWeight: "700",
  },

  publicTournamentHero: {
    display: "grid",
    gap: "12px",
    padding: "20px",
    borderRadius: "20px",
    background: "#0b1f18",
    border: "1px solid rgba(110,231,183,0.24)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
    minWidth: 0,
  },

  publicTournamentHeroTop: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  publicTournamentHeroLogo: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.16)",
    overflow: "hidden",
    flexShrink: 0,
  },

  publicTournamentHeroLogoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  publicTournamentTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "clamp(30px, 7vw, 56px)",
    lineHeight: 1,
    fontWeight: "900",
    overflowWrap: "anywhere",
  },

  publicTournamentDescription: {
    margin: 0,
    maxWidth: "760px",
    color: "#d1fae5",
    fontSize: "15px",
    lineHeight: 1.7,
    fontWeight: "650",
  },

  publicTournamentSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 150px))",
    gap: "8px",
    minWidth: 0,
  },

  publicTournamentSummaryCard: {
    display: "grid",
    gap: "4px",
    minHeight: "56px",
    padding: "10px 12px",
    borderRadius: "13px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    minWidth: 0,
  },

  publicTournamentClassStatusList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    minWidth: 0,
  },

  publicTournamentClassStatusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    background: "#dcfce7",
    border: "1px solid #86efac",
    color: "#166534",
    fontSize: "12px",
    fontWeight: "900",
    lineHeight: 1.2,
  },

  publicTournamentClassStatusBadgeDone: {
    background: "#f1f5f9",
    borderColor: "#cbd5e1",
    color: "#475569",
  },

  publicTournamentSection: {
    display: "grid",
    gap: "14px",
    padding: "18px",
    borderRadius: "22px",
    background: "var(--public-surface, #071a14)",
    border: "1px solid var(--public-border, rgba(110,231,183,0.18))",
    minWidth: 0,
  },

  publicTournamentSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    color: "var(--public-text, #ecfdf5)",
    fontSize: "15px",
    fontWeight: "900",
  },

  publicTournamentGroupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: "12px",
    minWidth: 0,
  },

  publicTournamentGroupCard: {
    display: "grid",
    gap: "12px",
    padding: "15px",
    borderRadius: "18px",
    background: "var(--public-panel, #0d241c)",
    border: "1px solid var(--public-border, rgba(134,239,172,0.18))",
    minWidth: 0,
  },

  publicTournamentGroupHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    color: "var(--public-text, #fff)",
    minWidth: 0,
  },

  publicTournamentGroupTitle: {
    margin: 0,
    color: "var(--public-text, #fff)",
    fontSize: "15px",
    fontWeight: "900",
    overflowWrap: "anywhere",
  },

  publicTournamentGroupCode: {
    minWidth: "34px",
    height: "30px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: "12px",
    fontWeight: "900",
  },

  publicTournamentTeamList: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },

  publicTournamentTeamRow: {
    display: "grid",
    gridTemplateColumns: "44px minmax(0, 1fr)",
    alignItems: "center",
    gap: "8px",
    padding: "10px",
    borderRadius: "13px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "var(--public-muted, #d1fae5)",
    fontSize: "12px",
    fontWeight: "800",
    minWidth: 0,
  },

  publicTournamentSlotBadge: {
    minWidth: "34px",
    height: "26px",
    borderRadius: "9px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: "11px",
    fontWeight: "900",
  },

  publicTournamentBracketGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
    gap: "12px",
    minWidth: 0,
  },

  publicTournamentBracketStage: {
    display: "grid",
    gap: "10px",
    alignContent: "start",
    minWidth: 0,
  },

  publicTournamentBracketTitle: {
    color: "var(--public-primary, #86efac)",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  publicTournamentBracketMatch: {
    display: "grid",
    gap: "8px",
    padding: "13px",
    borderRadius: "16px",
    background: "var(--public-panel, #0d241c)",
    border: "1px solid var(--public-border, rgba(134,239,172,0.18))",
    minWidth: 0,
  },

  publicTournamentMatchLabel: {
    color: "var(--public-text, #ecfdf5)",
    fontSize: "12px",
    fontWeight: "900",
  },

  publicTournamentBracketLine: {
    display: "grid",
    gap: "3px",
    padding: "10px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "var(--public-muted, #d1fae5)",
    fontSize: "12px",
    fontWeight: "800",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  publicTournamentSourceBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "4px 7px",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "var(--public-muted, #d1fae5)",
    fontSize: "10px",
    fontWeight: "900",
  },

  publicTournamentBracketLineWinner: {
    background: "rgba(34,197,94,0.22)",
    borderColor: "rgba(134,239,172,0.48)",
    color: "#fff",
  },

  publicTournamentMatchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
    gap: "12px",
    minWidth: 0,
  },

  publicTournamentMatchCard: {
    display: "grid",
    gap: "10px",
    padding: "14px",
    borderRadius: "17px",
    background: "var(--public-panel, #0d241c)",
    border: "1px solid var(--public-border, rgba(134,239,172,0.18))",
    minWidth: 0,
  },

  publicTournamentMatchTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    flexWrap: "wrap",
    color: "var(--public-primary, #86efac)",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  publicTournamentTeams: {
    color: "var(--public-text, #fff)",
    fontSize: "15px",
    fontWeight: "900",
    overflowWrap: "anywhere",
  },

  publicTournamentScore: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "6px 10px",
    background: "rgba(34,197,94,0.18)",
    color: "#bbf7d0",
    fontSize: "12px",
    fontWeight: "900",
  },

  publicTournamentStandingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "12px",
    minWidth: 0,
  },

  publicTournamentStandingsCard: {
    display: "grid",
    gap: "12px",
    padding: "15px",
    borderRadius: "18px",
    background: "var(--public-panel, #0d241c)",
    border: "1px solid var(--public-border, rgba(134,239,172,0.18))",
    borderTop: "4px solid rgba(134,239,172,0.30)",
    borderLeft: "5px solid rgba(134,239,172,0.30)",
    minWidth: 0,
  },

  publicTournamentStandingsHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    minWidth: 0,
  },

  publicTournamentTableWrap: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    minWidth: 0,
  },

  publicTournamentTable: {
    width: "100%",
    minWidth: "520px",
    borderCollapse: "collapse",
    color: "var(--public-muted, #d1fae5)",
    fontSize: "12px",
    textAlign: "center",
  },

  publicTournamentTableHead: {
    padding: "9px 8px",
    color: "var(--public-primary, #86efac)",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
    borderBottom: "1px solid rgba(134,239,172,0.20)",
  },

  publicTournamentTableCell: {
    padding: "10px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontWeight: "800",
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

  tournamentDashboardShellCollapsed: {
    gridTemplateColumns: "minmax(0, 1fr)",
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
    alignItems: "center",
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
    gap: "10px",
    padding: "12px",
    background: "#f8fafc",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "15px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentOptionalDetails: {
    display: "grid",
    gap: "8px",
    borderRadius: "12px",
    border: "1px solid rgba(37,99,235,0.12)",
    background: "rgba(239,246,255,0.58)",
    padding: "8px 10px",
  },

  tournamentOptionalSummary: {
    cursor: "pointer",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "900",
    lineHeight: 1.2,
  },

  tournamentMessage: {
    position: "fixed",
    right: "18px",
    bottom: "18px",
    zIndex: 50,
    maxWidth: "min(360px, calc(100vw - 36px))",
    padding: "11px 13px",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: "14px",
    color: "#1e3a8a",
    fontSize: "12px",
    fontWeight: "800",
    boxShadow: "0 18px 34px rgba(15,23,42,0.18)",
  },

  tournamentNewButton: {
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "14px",
    padding: "11px 16px",
    background: "#22c55e",
    color: "#052e16",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
    minWidth: "78px",
    boxShadow: "0 10px 20px rgba(34,197,94,0.22)",
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
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "10px",
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

  tournamentListStatusBadge: {
    borderRadius: "999px",
    padding: "5px 8px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "10px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  tournamentListStatusBadgeLive: {
    background: "#dcfce7",
    color: "#166534",
  },

  tournamentListItemStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "4px",
  },

  tournamentListItemStatsChip: {
    borderRadius: "999px",
    padding: "4px 7px",
    background: "#eef2ff",
    color: "#334155",
    fontSize: "10px",
    fontWeight: "800",
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

  tournamentRegistrationToggle: {
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "12px",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
    fontSize: "12px",
    fontWeight: "900",
    cursor: "pointer",
    justifySelf: "start",
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
    marginTop: "10px",
    fontSize: "12px",
    color: "#cbd5e1",
    fontWeight: "700",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },

  tournamentHeroChip: {
    borderRadius: "999px",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.10)",
    color: "#dbeafe",
    fontSize: "11px",
    fontWeight: "900",
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

  tournamentSyncBadge: {
    borderRadius: "999px",
    padding: "8px 12px",
    background: "rgba(22,163,74,0.22)",
    color: "#bbf7d0",
    border: "1px solid rgba(187,247,208,0.28)",
    fontSize: "11px",
    fontWeight: "900",
  },

  tournamentSyncBadgeError: {
    background: "rgba(220,38,38,0.22)",
    color: "#fecaca",
    borderColor: "rgba(254,202,202,0.38)",
  },

  tournamentSyncBadgeLocal: {
    background: "rgba(234,179,8,0.20)",
    color: "#fef3c7",
    borderColor: "rgba(254,243,199,0.34)",
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

  tournamentClassCompactRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
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

  tournamentCompactGroupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: "12px",
    minWidth: 0,
  },

  tournamentCompactGroupCard: {
    display: "grid",
    gap: "10px",
    borderRadius: "16px",
    padding: "14px",
    background: "#fff",
    border: "1px solid #dbe3ef",
    minWidth: 0,
    boxSizing: "border-box",
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

  tournamentScheduleHeaderRow: {
    display: "grid",
    gridTemplateColumns: "84px minmax(0, 1fr)",
    borderBottom: "1px solid #dbe3ef",
    minWidth: 0,
  },

  tournamentScheduleCornerCell: {
    display: "flex",
    alignItems: "center",
    padding: "9px 10px",
    background: "#020617",
    color: "#dbeafe",
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
    minWidth: 0,
  },

  tournamentScheduleCourtHeader: {
    padding: "9px 10px",
    background: "#0f172a",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
    textAlign: "center",
    minWidth: 0,
  },

  tournamentScheduleRow: {
    display: "grid",
    gridTemplateColumns: "84px minmax(0, 1fr)",
    borderBottom: "1px solid #e2e8f0",
    minWidth: 0,
  },

  tournamentScheduleTimeCell: {
    display: "grid",
    gap: "3px",
    alignContent: "center",
    padding: "9px 10px",
    background: "#0f172a",
    color: "#fff",
    fontSize: "10px",
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
    position: "relative",
    display: "grid",
    gap: "5px",
    minHeight: "62px",
    padding: "9px 10px",
    background: "#f8fafc",
    color: "#111827",
    fontSize: "12px",
    fontWeight: "800",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentScheduleBlockedCourt: {
    background: "#f1f5f9",
    borderLeft: "4px solid #64748b",
    color: "#334155",
  },

  tournamentScheduleBlockedContent: {
    display: "grid",
    gap: "4px",
    alignContent: "center",
    minHeight: "44px",
    color: "#334155",
  },

  tournamentScheduleSelectedSource: {
    outline: "2px solid #22c55e",
    outlineOffset: "-2px",
    boxShadow: "inset 0 0 0 1px rgba(34,197,94,0.28), 0 0 0 2px rgba(34,197,94,0.12)",
    background: "#ecfdf5",
  },

  tournamentScheduleValidTarget: {
    cursor: "pointer",
    outline: "1px dashed rgba(59,130,246,0.62)",
    outlineOffset: "-3px",
    boxShadow: "inset 0 0 0 1px rgba(59,130,246,0.12)",
  },

  tournamentScheduleSelectedBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "3px 7px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    fontSize: "9px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  tournamentScheduleTargetActions: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  tournamentScheduleTargetButton: {
    justifySelf: "start",
    border: "1px solid #2563eb",
    borderRadius: "999px",
    padding: "5px 9px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "10px",
    fontWeight: "950",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(37,99,235,0.14)",
  },

  tournamentScheduleCourtTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },

  tournamentScheduleGroupBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "4px 7px",
    border: "1px solid #dbe3ef",
    fontSize: "10px",
    fontWeight: "900",
  },

  tournamentScheduleRoundLabel: {
    color: "#64748b",
    fontWeight: "800",
  },

  tournamentScheduleSeriesBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "3px 7px",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#3730a3",
    fontSize: "10px",
    fontWeight: "900",
    lineHeight: 1.2,
  },

  tournamentScheduleMatchTeams: {
    display: "grid",
    gap: "1px",
    color: "#111827",
    lineHeight: 1.18,
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentScheduleTeamLine: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },

  tournamentScheduleTeamName: {
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  tournamentScheduleReadonlyScore: {
    minWidth: "22px",
    color: "#111827",
    fontSize: "12px",
    fontWeight: "900",
    textAlign: "right",
  },

  tournamentScheduleVsLabel: {
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "uppercase",
  },

  tournamentScheduleStatusBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "4px 7px",
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "10px",
    fontWeight: "900",
  },

  tournamentScheduleStatusBadgeDone: {
    background: "#dcfce7",
    color: "#166534",
  },

  tournamentScheduleCompleteButton: {
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "4px 7px",
    background: "#fff",
    color: "#0f172a",
    fontSize: "10px",
    fontWeight: "900",
    lineHeight: 1.1,
    cursor: "pointer",
    boxShadow: "0 1px 0 rgba(15,23,42,0.08)",
  },

  tournamentScheduleMoveButton: {
    border: "1px solid #2563eb",
    borderRadius: "8px",
    padding: "4px 8px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "10px",
    fontWeight: "950",
    lineHeight: 1.1,
    cursor: "pointer",
    boxShadow: "0 1px 0 rgba(15,23,42,0.06)",
  },

  tournamentScheduleMetaRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    flexWrap: "wrap",
    minHeight: "18px",
  },

  tournamentScheduleScoreStepper: {
    display: "grid",
    gridTemplateColumns: "18px 26px 18px",
    gap: 0,
    alignItems: "center",
    border: "1px solid #cbd5e1",
    borderRadius: "999px",
    overflow: "hidden",
    background: "#fff",
    minWidth: 0,
  },

  tournamentScheduleScoreButton: {
    width: "18px",
    height: "22px",
    border: "none",
    borderRadius: 0,
    background: "#f8fafc",
    color: "#0f172a",
    cursor: "pointer",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  tournamentScheduleScoreInput: {
    width: "26px",
    minWidth: 0,
    height: "22px",
    boxSizing: "border-box",
    border: "none",
    borderLeft: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    borderRadius: 0,
    background: "#fff",
    color: "#111827",
    fontSize: "11px",
    fontWeight: "900",
    textAlign: "center",
    padding: "0 2px",
  },

  tournamentScheduleFinishWarning: {
    color: "#b45309",
    fontSize: "10px",
    fontWeight: "900",
    lineHeight: 1.25,
  },

  tournamentScheduleResultBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "4px 7px",
    background: "#e0f2fe",
    color: "#075985",
    fontSize: "10px",
    fontWeight: "900",
  },

  tournamentScheduleMenuButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "26px",
    height: "22px",
    padding: "0 7px",
    borderRadius: "999px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: "900",
    cursor: "pointer",
    lineHeight: 1,
    flexShrink: 0,
  },

  tournamentScheduleMenu: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "4px",
    padding: "6px",
    borderRadius: "10px",
    background: "rgba(15,23,42,0.94)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  tournamentScheduleMenuAction: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    padding: "5px 6px",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
    textAlign: "left",
  },

  tournamentWalkoverEditor: {
    display: "grid",
    gap: "5px",
    padding: "7px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid #cbd5e1",
  },

  tournamentWalkoverActions: {
    display: "grid",
    gap: "4px",
  },

  tournamentWalkoverButton: {
    border: "1px solid #94a3b8",
    borderRadius: "8px",
    padding: "6px 7px",
    background: "#fff",
    color: "#0f172a",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
    textAlign: "left",
  },

  tournamentScheduleSelect: {
    width: "100%",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "5px 7px",
    fontSize: "11px",
    fontWeight: "800",
  },

  tournamentScheduleNoteInput: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "6px 7px",
    fontSize: "11px",
  },

  tournamentScheduleSwapNotice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "8px 10px",
    background: "#eef2ff",
    color: "#312e81",
    border: "1px solid #c7d2fe",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "900",
  },

  tournamentCourtBlockPanel: {
    display: "grid",
    gap: "10px",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#f8fafc",
  },

  tournamentCourtBlockHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },

  tournamentCourtBlockGrid: {
    display: "grid",
    gridTemplateColumns: "0.8fr 1.2fr 1fr 1fr 1.4fr",
    gap: "8px",
    alignItems: "end",
  },

  tournamentCourtBlockGridMobile: {
    gridTemplateColumns: "1fr",
  },

  tournamentCourtBlockActions: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  tournamentCourtBlockList: {
    display: "grid",
    gap: "8px",
  },

  tournamentCourtBlockChip: {
    borderRadius: "999px",
    padding: "5px 8px",
    background: "#e2e8f0",
    color: "#334155",
    fontSize: "11px",
    fontWeight: "850",
  },

  tournamentCourtBlockCard: {
    display: "grid",
    gap: "8px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "10px",
  },

  tournamentCourtBlockCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
    color: "#0f172a",
    fontSize: "12px",
  },

  tournamentCourtBlockAffectedList: {
    display: "grid",
    gap: "4px",
  },

  tournamentCourtBlockAffectedItem: {
    borderRadius: "10px",
    padding: "7px 8px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "11px",
    fontWeight: "800",
  },

  tournamentUnplacedPanel: {
    display: "grid",
    gap: "10px",
    padding: "12px",
    border: "1px solid #c7d2fe",
    borderRadius: "14px",
    background: "#eef2ff",
  },

  tournamentUnplacedList: {
    display: "grid",
    gap: "8px",
  },

  tournamentUnplacedCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "9px 10px",
    color: "#0f172a",
    fontSize: "12px",
  },

  tournamentUnplacedCardActive: {
    borderColor: "#2563eb",
    boxShadow: "0 0 0 2px rgba(37,99,235,0.14)",
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
    border: "1px solid transparent",
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

  tournamentSourceBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "4px 7px",
    border: "1px solid #dbeafe",
    color: "#1d4ed8",
    background: "#eff6ff",
    fontSize: "10px",
    fontWeight: "900",
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

  tournamentShareCompactCard: {
    display: "grid",
    gap: "14px",
    padding: "18px",
    borderRadius: "20px",
    background: "#f8fafc",
    border: "1px solid #dbe3ef",
    boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
    minWidth: 0,
  },

  tournamentShareHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },

  tournamentShareActiveBadge: {
    borderRadius: "999px",
    padding: "7px 10px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    fontSize: "11px",
    fontWeight: "950",
    whiteSpace: "nowrap",
  },

  tournamentShareTools: {
    display: "grid",
    gap: "14px",
    minWidth: 0,
  },

  tournamentShareCodeCard: {
    display: "grid",
    gap: "5px",
    padding: "15px",
    borderRadius: "16px",
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #1f2937",
    minWidth: 0,
  },

  tournamentShareUrlRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) repeat(3, auto)",
    gap: "9px",
    alignItems: "center",
    minWidth: 0,
  },

  tournamentShareUrlLabel: {
    color: "#111827",
    fontSize: "12px",
    fontWeight: "900",
  },

  tournamentShareInput: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "11px 12px",
    background: "#fff",
    color: "#111827",
    fontSize: "12px",
    fontWeight: "700",
  },

  tournamentShareAdvanced: {
    display: "grid",
    gap: "10px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    padding: "10px 12px",
  },

  tournamentShareAdvancedSummary: {
    cursor: "pointer",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "900",
  },

  tournamentShareAdvancedGrid: {
    display: "grid",
    gap: "10px",
    paddingTop: "10px",
  },

  tournamentShareUnavailableCard: {
    display: "grid",
    gap: "8px",
    padding: "18px",
    borderRadius: "18px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    minWidth: 0,
    boxSizing: "border-box",
  },

  tournamentStandingsHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    minWidth: 0,
  },

  tournamentShareInfoBox: {
    padding: "14px 15px",
    borderRadius: "16px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontSize: "13px",
    fontWeight: "800",
    lineHeight: 1.45,
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

  tournamentClassVisibilityList: {
    display: "grid",
    gap: "10px",
    minWidth: 0,
  },

  tournamentClassVisibilityRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    padding: "12px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    minWidth: 0,
  },

  tournamentClassVisibilityActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "8px",
    minWidth: 0,
  },

  tournamentClassSegmented: {
    display: "inline-flex",
    flexWrap: "wrap",
    gap: "4px",
    padding: "3px",
    borderRadius: "12px",
    background: "#e2e8f0",
  },

  tournamentClassSegmentButton: {
    border: 0,
    borderRadius: "9px",
    padding: "6px 9px",
    background: "transparent",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  tournamentClassSegmentButtonActive: {
    background: "#fff",
    color: "#0f172a",
    boxShadow: "0 5px 12px rgba(15,23,42,0.12)",
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
    borderRadius: "14px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(37,99,235,0.12)",
    padding: "8px 9px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(37,99,235,0.06)",
    minHeight: "58px",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    touchAction: "manipulation",
  },

  playerCardSelected: {
    background: "rgba(234,244,255,0.72)",
    border: "1px solid rgba(37,99,235,0.16)",
    boxShadow: "inset 2px 0 0 rgba(37,99,235,0.48), 0 8px 16px rgba(37,99,235,0.045)",
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
    fontWeight: "850",
    color: "#0f172a",
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
    borderRadius: "14px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(37,99,235,0.12)",
    padding: "8px 10px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(37,99,235,0.06)",
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
    background: "rgba(234,244,255,0.72)",
    border: "1px solid rgba(37,99,235,0.16)",
    boxShadow: "inset 2px 0 0 rgba(37,99,235,0.48), 0 8px 16px rgba(37,99,235,0.045)",
  },

  playerListCompactName: {
    fontSize: "12px",
    fontWeight: "850",
    color: "#0f172a",
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
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "8px",
    padding: "5px 8px",
    background: "#eff6ff",
    color: "#1d4ed8",
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
    borderRadius: "14px",
    padding: "8px 12px",
    background: "linear-gradient(135deg, #2563eb, #60a5fa)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 10px 24px rgba(37,99,235,0.16)",
  },

  archivedCard: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "18px",
    padding: "12px",
    boxShadow: "0 12px 28px rgba(37,99,235,0.07)",
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
    background: "rgba(239,246,255,0.74)",
    border: "1px solid rgba(37,99,235,0.12)",
    borderRadius: "12px",
    padding: "10px",
  },

  archivedPlayerName: {
    fontSize: "13px",
    fontWeight: "850",
    color: "#0f172a",
  },

  matchModeCard: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "20px",
    padding: "12px",
    boxShadow: "0 12px 28px rgba(37,99,235,0.07)",
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
    fontWeight: "900",
    color: "#0f172a",
  },

  matchModeSubtitle: {
    fontSize: "12px",
    color: "#475569",
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
    background: "rgba(239,246,255,0.78)",
    borderRadius: "14px",
    padding: "12px",
    border: "1px solid rgba(37,99,235,0.12)",
  },

  matchCourt: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#2563eb",
    marginBottom: "8px",
  },

  matchTeams: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "14px",
    fontWeight: "850",
    color: "#0f172a",
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
    gap: "12px",
  },

  teamCard: {
    background: "rgba(255,255,255,0.90)",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "20px",
    padding: "11px",
    boxShadow: "0 14px 34px rgba(37,99,235,0.08)",
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
    fontSize: "14px",
    fontWeight: "950",
    color: "#0f172a",
  },

  teamPointsBadge: {
    borderRadius: "999px",
    background: "#0f172a",
    color: "#fff",
    padding: "3px 7px",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  moveHereButton: {
    marginTop: "6px",
    border: "none",
    borderRadius: "999px",
    padding: "6px 10px",
    background: "#2563eb",
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
    padding: "5px 2px",
    borderBottom: "1px solid rgba(37,99,235,0.08)",
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
    fontWeight: "800",
    color: "#0f172a",
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
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "8px",
    padding: "5px 8px",
    background: "#eff6ff",
    color: "#1d4ed8",
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
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "12px",
    minHeight: "34px",
    minWidth: "38px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "850",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 10px",
    whiteSpace: "nowrap",
  },

  iconActionButtonPrimary: {
    border: "none",
    borderRadius: "10px",
    height: "32px",
    minWidth: "32px",
    background: "#0f172a",
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
    flexWrap: "wrap",
  },

  profileCompactLeft: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  },

  profileAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "950",
    flexShrink: 0,
  },

  profileCompactName: {
    fontSize: "13px",
    fontWeight: "900",
    color: "#0f172a",
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
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "999px",
    padding: "6px 10px",
    background: "rgba(239,246,255,0.86)",
    color: "#1e3a8a",
    fontWeight: "850",
    cursor: "pointer",
    fontSize: "12px",
    flexShrink: 0,
  },

  lockIconButton: {
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "999px",
    width: "22px",
    height: "22px",
    background: "#eff6ff",
    color: "#1d4ed8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    cursor: "pointer",
    flexShrink: 0,
  },

  lockIconButtonActive: {
    borderColor: "rgba(15,23,42,0.20)",
    background: "#0f172a",
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

