import { normalizeTeams } from "./playerUtils";

export function getToolbarSettingsStorageKey(username) {
  return `volleyball-visible-actions-${String(username || "guest").trim()}`;
}

export function getLanguageStorageKey(username) {
  return `volleyball-language-${String(username || "guest").trim()}`;
}


export function getPlayerViewModeStorageKey(username) {
  return `volleyball-player-view-mode-${String(username || "guest").trim()}`;
}


export function buildStoragePayload(teams, teamCount) {
  return {
    expiresAt: Date.now(),
    teamCount,
    teams,
  };
}

export function getRoundStorageKey(baseKey, auth) {
  const username =
    auth?.loggedIn && auth?.username ? String(auth.username).trim() : "guest";
  return `${baseKey}-${username}`;
}

export function readStorageWithTtl(key, ttlMs, language = "en") {
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

