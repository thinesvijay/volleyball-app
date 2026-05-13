import { useCallback, useEffect, useState } from "react";
import {
  getPlayerHubAccessRequestCards,
  getPlayerHubProfileDefaults,
  getPlayerHubProfileTypeOptions,
  normalizePlayerHubProfile,
} from "./playerHubUtils";

const playerHubCopy = {
  profileSaved: "Player profile saved.",
  profileLoadFailed: "Could not load player profile.",
  profileSaveFailed: "Could not save player profile.",
  profileLoading: "Loading profile...",
  profileSaving: "Saving...",
  profileSaveButton: "Save profile",
};

const isPlayerHubDev =
  typeof process !== "undefined" &&
  process.env &&
  process.env.NODE_ENV !== "production";

function playerHubNow() {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }

  return Date.now();
}

function startPlayerHubTimer() {
  return isPlayerHubDev ? playerHubNow() : 0;
}

function logPlayerHubTiming(label, startedAt) {
  if (!isPlayerHubDev || !startedAt || typeof console === "undefined") return;
  console.log(`[PlayerHub] ${label} ${Math.round(playerHubNow() - startedAt)}ms`);
}

function cleanPlayerHubError(error, fallback) {
  const message = String(error?.message || "").trim();
  if (!message) return fallback;
  if (/failed to fetch|unknown action/i.test(message)) return fallback;
  return message;
}

function isUsablePlayerHubSnapshot(snapshot) {
  return Boolean(
    snapshot &&
      typeof snapshot === "object" &&
      Object.prototype.hasOwnProperty.call(snapshot, "profile") &&
      Array.isArray(snapshot.availableClubs) &&
      Array.isArray(snapshot.teamNeeds) &&
      Array.isArray(snapshot.myTeams) &&
      Array.isArray(snapshot.tournamentAvailability)
  );
}

function passportArray(value) {
  return Array.isArray(value) ? value : [];
}

const captainSquadNameSlots = ["A", "B", "C", "RESERVE"];
const captainSquadNameSlotLabels = {
  A: "Team A",
  B: "Team B",
  C: "Team C",
  RESERVE: "Reserve",
};
const captainSquadNameSuggestionSuffixes = ["White", "Black", "Gold", "Blue"];
const squadNameStoragePrefix = "makeTeamsPro.playerHub.squadNames.v1";

function passportText(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function normalizeCaptainSquadNameKey(value) {
  const text = passportText(value).toUpperCase().replace(/\s+/g, " ");
  const teamMatch = text.match(/^TEAM ([ABCD])$/);
  if (teamMatch) return teamMatch[1] === "D" ? "RESERVE" : teamMatch[1];
  if (text === "A" || text === "B" || text === "C") return text;
  if (text === "RESERVE" || text === "RES" || text === "D") return "RESERVE";
  return "";
}

function squadNameEditorSlotLabel(value) {
  const key = normalizeCaptainSquadNameKey(value);
  return captainSquadNameSlotLabels[key] || fallbackSquadDisplayName(value);
}

function fallbackSquadDisplayName(value) {
  const key = normalizeCaptainSquadNameKey(value);
  if (key === "A" || key === "B" || key === "C") return `Team ${key}`;
  if (key === "RESERVE") return "Reserve";
  return "Unassigned";
}

function squadNameSuggestion(value, clubName) {
  const key = normalizeCaptainSquadNameKey(value);
  const base = passportText(clubName, "Team");
  if (key === "A") return squadNameSuggestionForSuffix(base, "White");
  if (key === "B") return squadNameSuggestionForSuffix(base, "Black");
  if (key === "C") return squadNameSuggestionForSuffix(base, "Gold");
  if (key === "RESERVE") return squadNameSuggestionForSuffix(base, "Blue");
  return "";
}

function squadNameSuggestionForSuffix(clubName, suffix) {
  return `${passportText(clubName, "Team")} ${suffix}`;
}

function normalizeSquadDisplayNames(value) {
  let source = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch (error) {
      return {};
    }
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  return Object.entries(source).reduce((names, [key, label]) => {
    const normalizedKey = normalizeCaptainSquadNameKey(key);
    const text = passportText(label);
    if (normalizedKey && text) names[normalizedKey] = text;
    return names;
  }, {});
}

function readStoredSquadDisplayNames(username) {
  if (typeof window === "undefined" || !window.localStorage) return {};
  const key = `${squadNameStoragePrefix}:${passportText(username, "guest")}`;
  try {
    return normalizeStoredSquadDisplayNames(JSON.parse(window.localStorage.getItem(key) || "{}"));
  } catch (error) {
    return {};
  }
}

function writeStoredSquadDisplayNames(username, value) {
  if (typeof window === "undefined" || !window.localStorage) return;
  const key = `${squadNameStoragePrefix}:${passportText(username, "guest")}`;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(normalizeStoredSquadDisplayNames(value))
    );
  } catch (error) {
    // Local persistence is a convenience only; ignore storage failures.
  }
}

function normalizeStoredSquadDisplayNames(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce((plans, [planId, names]) => {
    const safePlanId = passportText(planId);
    const normalizedNames = normalizeSquadDisplayNames(names);
    if (safePlanId && Object.keys(normalizedNames).length) {
      plans[safePlanId] = normalizedNames;
    }
    return plans;
  }, {});
}

function normalizeRosterLockConfig(value) {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const rawApplies =
    source.appliesToSeries &&
    typeof source.appliesToSeries === "object" &&
    !Array.isArray(source.appliesToSeries)
      ? source.appliesToSeries
      : {};
  const appliesToSeries = Object.entries(rawApplies).reduce(
    (items, [key, deadline]) => {
      const safeKey = passportText(key);
      const safeDeadline = passportText(deadline);
      if (safeKey && safeDeadline) items[safeKey] = safeDeadline;
      return items;
    },
    {}
  );
  const deadlineIso = passportText(
    source.deadlineIso,
    source.deadline,
    source.lockAt
  );
  const deadlineTime = deadlineIso ? Date.parse(deadlineIso) : 0;
  const afterDeadline = Boolean(
    source.afterDeadline ||
      (source.enabled &&
        deadlineIso &&
        !Number.isNaN(deadlineTime) &&
        Date.now() > deadlineTime)
  );

  return {
    enabled: Boolean(source.enabled),
    deadlineIso,
    globalDeadlineIso: passportText(source.globalDeadlineIso),
    seriesDeadlineIso: passportText(source.seriesDeadlineIso),
    appliesToSeries,
    afterDeadline,
    updatedAt: passportText(source.updatedAt),
    updatedBy: passportText(source.updatedBy),
  };
}

function rosterLockKey(value) {
  return passportText(value).toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
}

function rosterLockSeriesAliases(source = {}, tournament = {}) {
  const aliases = new Set();
  const addAlias = (value) => {
    const key = rosterLockKey(value);
    if (key) aliases.add(key);
  };

  addAlias(source.seriesId);
  addAlias(source.seriesName);
  addAlias(source.className);

  const classKey = rosterLockKey(source.className);
  const seriesItems = Array.isArray(tournament.series) ? tournament.series : [];
  seriesItems.forEach((series) => {
    if (!series) return;
    const seriesKeys = [
      series.id,
      series.name,
      series.seriesName,
      Number(series.playersPerTeam || series.teamSize || 0) === 4 ? "4-side" : "",
      Number(series.playersPerTeam || series.teamSize || 0) === 5 ? "5-side" : "",
    ];
    const matches =
      (!classKey && seriesItems.length === 1) ||
      seriesKeys.some((key) => classKey && rosterLockKey(key) === classKey);
    if (matches) seriesKeys.forEach(addAlias);
  });

  return aliases;
}

function resolveRosterLockForSource(source = {}, tournament = {}) {
  const direct = normalizeRosterLockConfig(
    source.rosterLock ||
      source.playerHub?.rosterLock ||
      source.roster?.rosterLock ||
      source.plan?.rosterLock ||
      {}
  );
  if (direct.enabled || direct.deadlineIso || direct.afterDeadline) return direct;

  const tournamentLock = normalizeRosterLockConfig(
    tournament.rosterLock || tournament.playerHub?.rosterLock || {}
  );
  if (!tournamentLock.enabled && !tournamentLock.deadlineIso) return tournamentLock;

  const aliases = rosterLockSeriesAliases(source, tournament);
  const seriesDeadlineIso =
    Object.entries(tournamentLock.appliesToSeries || {}).find(([key]) =>
      aliases.has(rosterLockKey(key))
    )?.[1] || "";
  return normalizeRosterLockConfig({
    ...tournamentLock,
    globalDeadlineIso: tournamentLock.deadlineIso,
    seriesDeadlineIso,
    deadlineIso: seriesDeadlineIso || tournamentLock.deadlineIso,
  });
}

function rosterLockLabel(lock) {
  const safeLock = normalizeRosterLockConfig(lock);
  if (!safeLock.enabled || !safeLock.deadlineIso) return "";
  const date = new Date(safeLock.deadlineIso);
  if (Number.isNaN(date.getTime())) return "";
  return `Roster locks at ${date.toLocaleString()}`;
}

function rosterChangedAfterDeadline(roster = {}, lock = {}) {
  const safeLock = normalizeRosterLockConfig(lock);
  if (roster.changedAfterDeadline) return true;
  if (!safeLock.deadlineIso) return false;
  const deadlineTime = Date.parse(safeLock.deadlineIso);
  const changedTime = Date.parse(
    roster.updatedAt || roster.reviewedAt || roster.lockedAt || roster.submittedAt || ""
  );
  return (
    !Number.isNaN(deadlineTime) &&
    !Number.isNaN(changedTime) &&
    changedTime > deadlineTime
  );
}

function normalizePassportAvailabilityStatus(...values) {
  const value = passportText(...values).toUpperCase();
  if (value === "YES" || value === "GOING") return "YES";
  if (value === "MAYBE") return "MAYBE";
  if (value === "NO" || value === "NOT_GOING" || value === "NOT GOING") {
    return "NO";
  }
  return "PENDING";
}

function passportAvailabilityLabel(status) {
  const value = normalizePassportAvailabilityStatus(status);
  if (value === "YES") return "Going";
  if (value === "MAYBE") return "Maybe";
  if (value === "NO") return "No";
  return "Pending";
}

function normalizePassportRosterStatus(...values) {
  const value = passportText(...values).toUpperCase();
  if (
    value === "SUBMITTED" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "LOCKED" ||
    value === "CANCELLED"
  ) {
    return value;
  }
  return "DRAFT";
}

function passportRosterLabel(status) {
  const value = normalizePassportRosterStatus(status);
  if (value === "SUBMITTED") return "Submitted";
  if (value === "APPROVED") return "Approved";
  if (value === "REJECTED") return "Rejected";
  if (value === "LOCKED") return "Locked";
  if (value === "CANCELLED") return "Cancelled";
  return "Draft";
}

function normalizePassportAssignedSquad(...values) {
  const value = passportText(...values).toUpperCase();
  if (value === "A" || value === "B" || value === "C") return `Team ${value}`;
  if (value === "RESERVE") return "Reserve";
  return "";
}

function getPassportSortTime(...values) {
  for (const value of values) {
    const text = passportText(value);
    if (!text) continue;
    const time = Date.parse(text);
    if (!Number.isNaN(time)) return time;
  }
  return 0;
}

function calculatePlayerPassportStats({
  confirmedTeams,
  playerTournamentAvailability,
  playerTournamentRosterStatus,
  myTeamNeedInterests,
}) {
  const stats = {
    teamMembershipCount: passportArray(confirmedTeams).length,
    eventInvitationsCount: passportArray(playerTournamentAvailability).length,
    goingResponsesCount: 0,
    maybeResponsesCount: 0,
    noResponsesCount: 0,
    pendingResponsesCount: 0,
    rosterApprovedCount: 0,
    playerAdsInterestsCount: passportArray(myTeamNeedInterests).length,
  };

  passportArray(playerTournamentAvailability).forEach((item) => {
    const status = normalizePassportAvailabilityStatus(
      item?.responseStatus,
      item?.availabilityStatus,
      item?.status
    );
    if (status === "YES") stats.goingResponsesCount += 1;
    else if (status === "MAYBE") stats.maybeResponsesCount += 1;
    else if (status === "NO") stats.noResponsesCount += 1;
    else stats.pendingResponsesCount += 1;
  });

  passportArray(playerTournamentRosterStatus).forEach((item) => {
    const status = normalizePassportRosterStatus(item?.rosterStatus, item?.status);
    if (status === "APPROVED" || status === "LOCKED") {
      stats.rosterApprovedCount += 1;
    }
  });

  return stats;
}

function buildPlayerAchievements({
  profile,
  stats,
  hasCaptainRole,
  squadActivityCount,
}) {
  const answeredCount =
    (stats?.goingResponsesCount || 0) +
    (stats?.maybeResponsesCount || 0) +
    (stats?.noResponsesCount || 0);
  const profileCompleted = Boolean(
    passportText(profile?.displayName, profile?.profileId) &&
      passportText(profile?.country, profile?.clubTeamName, profile?.clubOrTeam)
  );

  return [
    {
      id: "profile",
      label: "First profile completed",
      active: profileCompleted,
      detail: profileCompleted ? "Identity ready" : "Complete profile",
    },
    {
      id: "team",
      label: "Team member",
      active: (stats?.teamMembershipCount || 0) > 0,
      detail: `${stats?.teamMembershipCount || 0} team${
        (stats?.teamMembershipCount || 0) === 1 ? "" : "s"
      }`,
    },
    {
      id: "captain",
      label: "Captain badge",
      active: Boolean(hasCaptainRole),
      detail: hasCaptainRole ? "Team control" : "Captain role",
    },
    {
      id: "responder",
      label: "Reliable responder",
      active: answeredCount >= 2,
      detail: `${answeredCount} response${answeredCount === 1 ? "" : "s"}`,
    },
    {
      id: "ready",
      label: "Tournament ready",
      active: (stats?.goingResponsesCount || 0) > 0,
      detail: `${stats?.goingResponsesCount || 0} Going`,
    },
    {
      id: "squad",
      label: "Squad player",
      active: squadActivityCount > 0,
      detail: squadActivityCount > 0 ? "Squad activity" : "No squad yet",
    },
    {
      id: "helper",
      label: "Community helper",
      active: (stats?.playerAdsInterestsCount || 0) > 0,
      detail: `${stats?.playerAdsInterestsCount || 0} interest${
        (stats?.playerAdsInterestsCount || 0) === 1 ? "" : "s"
      }`,
    },
  ];
}

function getRecentPlayerActivity(playerEvents, resolveSquadDisplayName) {
  return passportArray(playerEvents)
    .map((bundle) => {
      const base =
        bundle?.base ||
        bundle?.availability ||
        bundle?.planning ||
        bundle?.roster ||
        {};
      const availability = bundle?.availability || {};
      const planning = bundle?.planning || {};
      const roster = bundle?.roster || {};
      const hasRoster = Boolean(bundle?.roster);
      const status = hasRoster
        ? passportRosterLabel(roster.rosterStatus || roster.status)
        : passportAvailabilityLabel(
            availability.responseStatus ||
              availability.availabilityStatus ||
              planning.availabilityStatus ||
              base.responseStatus
          );
      const assignedSquadRaw = passportText(
        planning.assignedSquad,
        roster.assignedSquad,
        base.assignedSquad
      );
      const preferenceRaw = passportText(
        availability.preferredSquad,
        planning.preferredSquad,
        base.preferredSquad
      );
      const squadLabelSource = {
        ...base,
        ...availability,
        ...planning,
        ...roster,
        availability,
        planning,
        roster,
      };
      const assignedSquad = assignedSquadRaw
        ? resolveSquadDisplayName?.(assignedSquadRaw, squadLabelSource) ||
          normalizePassportAssignedSquad(assignedSquadRaw)
        : "";
      const preference = preferenceRaw
        ? resolveSquadDisplayName?.(preferenceRaw, squadLabelSource) ||
          normalizePassportAssignedSquad(preferenceRaw)
        : "";
      const sortTime = getPassportSortTime(
        base.updatedAt,
        base.respondedAt,
        base.submittedAt,
        base.lockedAt,
        base.createdAt,
        base.deadlineAt
      );

      return {
        key:
          bundle?.key ||
          passportText(base.planId, base.tournamentId, base.tournamentName) ||
          `activity-${sortTime}`,
        tournamentName: passportText(
          base.tournamentName,
          availability.tournamentName,
          planning.tournamentName,
          roster.tournamentName,
          "Tournament"
        ),
        teamName: passportText(
          base.clubTeamName,
          base.teamName,
          availability.clubTeamName,
          planning.clubTeamName,
          roster.clubTeamName,
          roster.teamName,
          "Team"
        ),
        status,
        note: passportText(
          assignedSquad ? assignedSquad : "",
          preference ? `Preferred ${preference}` : "",
          availability.responseNote,
          availability.note,
          planning.note,
          roster.adminNote
        ),
        sortTime,
      };
    })
    .sort((left, right) => right.sortTime - left.sortTime)
    .slice(0, 6);
}

const playerHubStyles = {
  shell: {
    display: "grid",
    gap: "14px",
    width: "100%",
    maxWidth: "1120px",
    justifySelf: "center",
    margin: "0 auto",
    minWidth: 0,
    boxSizing: "border-box",
    overflowX: "hidden",
  },
  hero: {
    display: "grid",
    gap: "12px",
    padding: "16px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(239,246,255,0.86))",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 12px 28px rgba(37,99,235,0.07)",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  heroTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    minWidth: 0,
  },
  titleBlock: {
    display: "grid",
    gap: "6px",
    minWidth: 0,
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "24px",
    lineHeight: 1.12,
  },
  subtitle: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.45,
    maxWidth: "760px",
  },
  statusChip: {
    borderRadius: "999px",
    padding: "6px 9px",
    background: "#0f172a",
    color: "#dbeafe",
    border: "1px solid rgba(37,99,235,0.22)",
    fontSize: "11px",
    fontWeight: "950",
    whiteSpace: "nowrap",
  },
  section: {
    display: "grid",
    gap: "10px",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "950",
  },
  playerHomeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "12px",
    alignItems: "start",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  compactHomeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: "12px",
    alignItems: "start",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  profileCard: {
    display: "grid",
    gap: "12px",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(37,99,235,0.14)",
    boxShadow: "0 12px 28px rgba(37,99,235,0.07)",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  playerHeroCard: {
    display: "grid",
    gap: "12px",
    padding: "16px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.86))",
    border: "1px solid rgba(37,99,235,0.14)",
    boxShadow: "0 16px 34px rgba(37,99,235,0.08)",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  nextTournamentCard: {
    display: "grid",
    gap: "12px",
    padding: "14px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(255,247,237,0.98), rgba(240,253,244,0.80))",
    border: "1px solid rgba(249,115,22,0.16)",
    boxShadow: "0 14px 30px rgba(249,115,22,0.06)",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  homeCard: {
    display: "grid",
    gap: "10px",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 10px 22px rgba(37,99,235,0.05)",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  homeCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  homeKicker: {
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  heroActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
    minWidth: 0,
  },
  accountDetails: {
    display: "grid",
    gap: "10px",
    maxWidth: "100%",
    minWidth: 0,
  },
  accountSummary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    justifySelf: "start",
    border: "1px solid rgba(37,99,235,0.16)",
    borderRadius: "999px",
    padding: "8px 11px",
    background: "rgba(239,246,255,0.92)",
    color: "#1e3a8a",
    fontSize: "12px",
    fontWeight: "950",
    cursor: "pointer",
  },
  compactRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "9px 10px",
    borderRadius: "13px",
    background: "rgba(248,250,252,0.82)",
    border: "1px solid rgba(226,232,240,0.92)",
    minWidth: 0,
  },
  compactRowMain: {
    display: "grid",
    gap: "2px",
    minWidth: 0,
  },
  compactRowTitle: {
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "950",
    overflowWrap: "anywhere",
  },
  compactRowMeta: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "850",
    overflowWrap: "anywhere",
  },
  profileHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  profileMeta: {
    display: "grid",
    gap: "4px",
    minWidth: 0,
  },
  profileEditorPanel: {
    display: "grid",
    gap: "10px",
    minWidth: 0,
  },
  teamSetupCard: {
    display: "grid",
    gap: "10px",
    padding: "12px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, rgba(240,253,244,0.88), rgba(239,246,255,0.82))",
    border: "1px solid rgba(34,197,94,0.18)",
    boxShadow: "0 10px 22px rgba(34,197,94,0.06)",
    minWidth: 0,
  },
  teamSetupControls: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "8px",
    alignItems: "center",
    minWidth: 0,
  },
  editorSection: {
    display: "grid",
    gap: "9px",
    padding: "11px",
    borderRadius: "15px",
    background: "rgba(248,250,252,0.78)",
    border: "1px solid rgba(37,99,235,0.10)",
    minWidth: 0,
  },
  actionDrawer: {
    display: "grid",
    gap: "10px",
    padding: "12px",
    borderRadius: "18px",
    background: "rgba(248,250,252,0.86)",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
    minWidth: 0,
  },
  actionDrawerHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  actionDrawerTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "950",
  },
  actionDrawerHint: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
    lineHeight: 1.35,
  },
  profileFormGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
    gap: "9px",
    minWidth: 0,
  },
  profileField: {
    display: "grid",
    gap: "5px",
    minWidth: 0,
  },
  profileLabel: {
    color: "#334155",
    fontSize: "11px",
    fontWeight: "950",
  },
  profileInput: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    border: "1px solid rgba(148,163,184,0.45)",
    borderRadius: "12px",
    padding: "9px 10px",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "13px",
    outline: "none",
  },
  profileTextarea: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    border: "1px solid rgba(148,163,184,0.45)",
    borderRadius: "12px",
    padding: "9px 10px",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "13px",
    minHeight: "72px",
    resize: "vertical",
    outline: "none",
  },
  profileTextareaCompact: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    border: "1px solid rgba(148,163,184,0.45)",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "13px",
    minHeight: "54px",
    resize: "vertical",
    outline: "none",
  },
  choiceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: "9px",
    minWidth: 0,
  },
  segmentedControl: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    minWidth: 0,
  },
  segmentButton: {
    border: "1px solid rgba(148,163,184,0.35)",
    borderRadius: "999px",
    padding: "8px 10px",
    background: "#ffffff",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "950",
    cursor: "pointer",
  },
  segmentButtonActive: {
    background: "#2563eb",
    borderColor: "rgba(37,99,235,0.26)",
    color: "#ffffff",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 10px",
    borderRadius: "12px",
    background: "rgba(239,246,255,0.72)",
    border: "1px solid rgba(37,99,235,0.12)",
    color: "#1e3a8a",
    fontSize: "12px",
    fontWeight: "850",
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  profileActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  saveButton: {
    border: "1px solid rgba(37,99,235,0.22)",
    borderRadius: "999px",
    padding: "9px 13px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "950",
    cursor: "pointer",
  },
  saveButtonDisabled: {
    background: "#94a3b8",
    cursor: "not-allowed",
  },
  profileMessage: {
    color: "#475569",
    fontSize: "12px",
    fontWeight: "850",
  },
  profilePreviewPanel: {
    display: "grid",
    gap: "10px",
    padding: "13px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(239,246,255,0.82), rgba(255,255,255,0.94))",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 12px 28px rgba(37,99,235,0.06)",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  profilePreviewCard: {
    display: "grid",
    gap: "12px",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(37,99,235,0.14)",
    boxShadow: "0 10px 22px rgba(37,99,235,0.05)",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  profilePreviewTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  playerCardHero: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  playerAvatarLarge: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #2563eb, #22c55e)",
    color: "#ffffff",
    fontSize: "21px",
    fontWeight: "950",
    flex: "0 0 auto",
  },
  previewNameBlock: {
    display: "grid",
    gap: "4px",
    minWidth: 0,
  },
  previewName: {
    color: "#0f172a",
    fontSize: "22px",
    lineHeight: 1.12,
    fontWeight: "950",
    overflowWrap: "anywhere",
  },
  previewSubtitle: {
    display: "block",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "850",
    lineHeight: 1.35,
    overflowWrap: "anywhere",
  },
  emptyPreview: {
    padding: "18px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.78)",
    border: "1px dashed rgba(37,99,235,0.22)",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "850",
    lineHeight: 1.45,
  },
  cardTitle: {
    display: "block",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "950",
    lineHeight: 1.25,
  },
  cardText: {
    color: "#475569",
    fontSize: "12px",
    lineHeight: 1.4,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    minWidth: 0,
  },
  chip: {
    borderRadius: "999px",
    padding: "5px 8px",
    background: "rgba(239,246,255,0.88)",
    border: "1px solid rgba(37,99,235,0.12)",
    color: "#1e3a8a",
    fontSize: "11px",
    fontWeight: "850",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
    gap: "10px",
    minWidth: 0,
  },
  previewCard: {
    display: "grid",
    gap: "9px",
    padding: "13px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 10px 22px rgba(37,99,235,0.06)",
    minWidth: 0,
  },
  teamNeedCard: {
    display: "grid",
    gap: "10px",
    padding: "14px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.74))",
    border: "1px solid rgba(37,99,235,0.14)",
    boxShadow: "0 12px 28px rgba(37,99,235,0.07)",
    minWidth: 0,
  },
  needStat: {
    display: "grid",
    gap: "2px",
    padding: "8px 9px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(37,99,235,0.10)",
    minWidth: 0,
  },
  needStatStrong: {
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "950",
    lineHeight: 1.15,
  },
  needStatLabel: {
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "850",
  },
  previewType: {
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  previewTitle: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "950",
    overflowWrap: "anywhere",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
    gap: "6px",
    minWidth: 0,
  },
  detail: {
    padding: "7px 8px",
    borderRadius: "10px",
    background: "rgba(248,250,252,0.98)",
    border: "1px solid rgba(226,232,240,0.92)",
    minWidth: 0,
  },
  detailLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  detailValue: {
    display: "block",
    color: "#0f172a",
    fontSize: "11px",
    fontWeight: "850",
    overflowWrap: "anywhere",
  },
  statCard: {
    display: "grid",
    gap: "5px",
    alignContent: "start",
    padding: "9px 10px",
    borderRadius: "13px",
    background: "rgba(239,246,255,0.78)",
    border: "1px solid rgba(37,99,235,0.12)",
    minWidth: 0,
  },
  editorTabs: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  editorTab: {
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "rgba(239,246,255,0.72)",
    color: "#1e3a8a",
    fontSize: "11px",
    fontWeight: "950",
    cursor: "pointer",
  },
  editorTabActive: {
    background: "#0f172a",
    borderColor: "#0f172a",
    color: "#ffffff",
  },
  adminReviewCard: {
    display: "grid",
    gap: "12px",
    padding: "14px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(239,246,255,0.80))",
    border: "1px solid rgba(37,99,235,0.14)",
    boxShadow: "0 12px 28px rgba(37,99,235,0.07)",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  adminDashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
    gap: "10px",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  adminDashboardTile: {
    display: "grid",
    gap: "8px",
    padding: "12px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 8px 18px rgba(37,99,235,0.05)",
    minWidth: 0,
  },
  adminDashboardTileActive: {
    borderColor: "rgba(37,99,235,0.32)",
    background: "rgba(239,246,255,0.96)",
  },
  adminDashboardTileMuted: {
    opacity: 0.68,
    background: "rgba(248,250,252,0.88)",
    borderColor: "rgba(148,163,184,0.16)",
    boxShadow: "none",
  },
  adminDashboardIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: "15px",
    fontWeight: "950",
  },
  adminDashboardCount: {
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: "950",
    lineHeight: 1,
  },
  adminAccordion: {
    display: "grid",
    gap: "10px",
    padding: "0",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.90)",
    border: "1px solid rgba(37,99,235,0.14)",
    boxShadow: "0 10px 22px rgba(37,99,235,0.05)",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
  },
  adminAccordionSummary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "13px 14px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "950",
    cursor: "pointer",
    minWidth: 0,
  },
  adminAccordionBody: {
    display: "grid",
    gap: "12px",
    padding: "0 14px 14px",
    minWidth: 0,
    boxSizing: "border-box",
  },
  adminReviewTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  adminReviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: "10px",
    minWidth: 0,
  },
  adminReviewProfileCard: {
    display: "grid",
    gap: "9px",
    padding: "12px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 8px 18px rgba(37,99,235,0.05)",
    minWidth: 0,
  },
  adminActionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    minWidth: 0,
  },
  adminPasswordRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "7px",
    alignItems: "center",
    minWidth: 0,
  },
  adminActionButton: {
    border: "1px solid rgba(37,99,235,0.16)",
    borderRadius: "999px",
    padding: "7px 9px",
    background: "rgba(239,246,255,0.92)",
    color: "#1e3a8a",
    fontSize: "11px",
    fontWeight: "950",
    cursor: "pointer",
  },
  adminDangerButton: {
    borderColor: "rgba(220,38,38,0.16)",
    background: "rgba(255,241,242,0.92)",
    color: "#be123c",
  },
  adminDisabledButton: {
    opacity: 0.62,
    cursor: "not-allowed",
  },
  adminFeedbackBanner: {
    display: "grid",
    gap: "3px",
    padding: "10px 12px",
    borderRadius: "14px",
    border: "1px solid rgba(37,99,235,0.14)",
    color: "#1e3a8a",
    background: "rgba(239,246,255,0.94)",
    fontSize: "12px",
    fontWeight: "850",
    lineHeight: 1.35,
  },
  adminFeedbackTitle: {
    fontSize: "11px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  adminFeedbackSuccess: {
    borderColor: "rgba(34,197,94,0.22)",
    background: "rgba(240,253,244,0.94)",
    color: "#166534",
  },
  adminFeedbackError: {
    borderColor: "rgba(244,63,94,0.24)",
    background: "rgba(255,241,242,0.96)",
    color: "#be123c",
  },
  clubTeamStatusChip: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "5px 8px",
    border: "1px solid #cbd5e1",
    color: "#475569",
    background: "#f8fafc",
    fontSize: "11px",
    fontWeight: "950",
    whiteSpace: "nowrap",
  },
  clubTeamStatusActive: {
    background: "#dcfce7",
    borderColor: "#86efac",
    color: "#166534",
  },
  clubTeamStatusInactive: {
    background: "#fee2e2",
    borderColor: "#fecaca",
    color: "#991b1b",
  },
  accessRequestCard: {
    display: "grid",
    gap: "9px",
    alignContent: "start",
    padding: "12px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 8px 18px rgba(37,99,235,0.05)",
    minWidth: 0,
  },
  accessRequestChooser: {
    display: "grid",
    gap: "9px",
    padding: "10px",
    borderRadius: "15px",
    background: "rgba(248,250,252,0.86)",
    border: "1px solid rgba(37,99,235,0.10)",
    minWidth: 0,
  },
  accessRequestTile: {
    display: "grid",
    gap: "6px",
    alignContent: "start",
    width: "100%",
    textAlign: "left",
    padding: "10px",
    borderRadius: "14px",
    border: "1px solid rgba(37,99,235,0.14)",
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    boxShadow: "0 8px 18px rgba(37,99,235,0.05)",
    cursor: "pointer",
    minWidth: 0,
  },
  accessRequestAction: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "5px 8px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "950",
  },
  accessRequestActionMuted: {
    background: "#e2e8f0",
    color: "#475569",
  },
  accessOptionButton: {
    display: "grid",
    gap: "4px",
    textAlign: "left",
    padding: "9px",
    borderRadius: "13px",
    border: "1px solid rgba(37,99,235,0.12)",
    background: "rgba(255,255,255,0.94)",
    color: "#0f172a",
    cursor: "pointer",
    minWidth: 0,
  },
  accessOptionSelected: {
    borderColor: "rgba(37,99,235,0.45)",
    background: "rgba(239,246,255,0.98)",
    boxShadow: "0 8px 18px rgba(37,99,235,0.08)",
  },
  accessRequestList: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  accessRequestRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "10px",
    alignItems: "center",
    padding: "10px",
    borderRadius: "14px",
    background: "rgba(248,250,252,0.82)",
    border: "1px solid rgba(37,99,235,0.10)",
    minWidth: 0,
  },
  accessCompactList: {
    display: "grid",
    gap: "6px",
    minWidth: 0,
  },
  accessCompactRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto auto",
    gap: "8px",
    alignItems: "center",
    padding: "8px 9px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.86)",
    border: "1px solid rgba(226,232,240,0.92)",
    minWidth: 0,
  },
  accessMiniButton: {
    border: "1px solid rgba(37,99,235,0.16)",
    borderRadius: "999px",
    padding: "6px 9px",
    background: "rgba(239,246,255,0.92)",
    color: "#1e3a8a",
    fontSize: "11px",
    fontWeight: "950",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  accessInlineForm: {
    display: "grid",
    gap: "8px",
    padding: "10px",
    borderRadius: "13px",
    background: "rgba(239,246,255,0.72)",
    border: "1px solid rgba(37,99,235,0.12)",
    minWidth: 0,
  },
  mutedLine: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "850",
  },
  progressTrack: {
    width: "100%",
    height: "7px",
    borderRadius: "999px",
    background: "rgba(226,232,240,0.9)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #2563eb, #22c55e)",
  },
  teamControlHero: {
    display: "grid",
    gap: "12px",
    padding: "16px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,244,0.74))",
    border: "1px solid rgba(37,99,235,0.14)",
    boxShadow: "0 16px 34px rgba(37,99,235,0.07)",
    minWidth: 0,
  },
  teamControlHeroTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  teamControlActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    minWidth: 0,
  },
  teamControlGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "12px",
    alignItems: "start",
    minWidth: 0,
  },
  teamControlPanel: {
    display: "grid",
    gap: "9px",
    padding: "12px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(37,99,235,0.12)",
    minWidth: 0,
  },
  teamControlWidePanel: {
    display: "grid",
    gap: "9px",
    padding: "12px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(37,99,235,0.12)",
    minWidth: 0,
    gridColumn: "1 / -1",
  },
  teamControlRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "10px",
    alignItems: "center",
    padding: "9px 10px",
    borderRadius: "13px",
    background: "rgba(248,250,252,0.82)",
    border: "1px solid rgba(226,232,240,0.92)",
    minWidth: 0,
  },
  teamControlActionsRow: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    minWidth: 0,
  },
  planStatsLine: {
    color: "#475569",
    fontSize: "12px",
    fontWeight: "900",
    lineHeight: 1.35,
  },
  interestGroup: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  interestGroupTitle: {
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: "950",
  },
  interestRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    padding: "9px",
    borderRadius: "13px",
    background: "rgba(255,255,255,0.86)",
    border: "1px solid rgba(37,99,235,0.10)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  },
  interestPlayerMeta: {
    display: "grid",
    gap: "4px",
    flex: "1 1 240px",
    minWidth: "min(100%, 240px)",
  },
  interestPlayerName: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "950",
    lineHeight: 1.22,
    overflowWrap: "normal",
    wordBreak: "normal",
    whiteSpace: "normal",
  },
  interestActionRow: {
    display: "flex",
    flex: "0 1 auto",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: "7px",
    minWidth: 0,
  },
  addTeamMemberButton: {
    border: "1px solid rgba(22,163,74,0.22)",
    borderRadius: "999px",
    padding: "8px 11px",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "950",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(22,163,74,0.14)",
  },
  squadBoard: {
    display: "grid",
    gap: "12px",
    padding: "14px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(239,246,255,0.72))",
    border: "1px solid rgba(37,99,235,0.14)",
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  teamPlanningWorkspace: {
    display: "grid",
    gap: "12px",
    gridColumn: "1 / -1",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  squadBoardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  squadBuilderLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "10px",
    minWidth: 0,
  },
  squadTeamsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: "10px",
    minWidth: 0,
  },
  squadColumn: {
    display: "grid",
    alignContent: "start",
    gap: "8px",
    padding: "10px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.90)",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 10px 22px rgba(37,99,235,0.05)",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
  },
  squadTeamBox: {
    display: "grid",
    alignContent: "start",
    gap: "7px",
    padding: "10px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.90)",
    border: "1px solid rgba(37,99,235,0.12)",
    boxShadow: "0 10px 22px rgba(37,99,235,0.05)",
    minWidth: 0,
  },
  squadColumnHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "950",
    minWidth: 0,
  },
  squadPlayerRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "7px",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid rgba(37,99,235,0.08)",
    minWidth: 0,
  },
  squadPlayerInfo: {
    display: "grid",
    gap: "2px",
    minWidth: 0,
  },
  squadPlayerName: {
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "900",
    lineHeight: 1.16,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  squadPlayerMeta: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "750",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  squadBadgeRow: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  squadTinyBadge: {
    borderRadius: "999px",
    padding: "2px 6px",
    border: "1px solid rgba(148,163,184,0.28)",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "10px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  squadMoveRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  squadMoveButton: {
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "8px",
    padding: "4px 7px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
    lineHeight: 1,
  },
  squadMoveButtonActive: {
    background: "#2563eb",
    borderColor: "#2563eb",
    color: "#ffffff",
  },
  squadEmptyRow: {
    padding: "8px",
    borderRadius: "12px",
    background: "rgba(248,250,252,0.86)",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
  },
  squadPendingPanel: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  squadPendingToggle: {
    justifySelf: "start",
    border: "1px solid rgba(37,99,235,0.14)",
    borderRadius: "999px",
    padding: "6px 10px",
    background: "rgba(239,246,255,0.92)",
    color: "#1e3a8a",
    fontSize: "11px",
    fontWeight: "950",
    cursor: "pointer",
  },
  squadPendingList: {
    display: "grid",
    gap: "4px",
    padding: "8px 10px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.86)",
    border: "1px solid rgba(37,99,235,0.10)",
    minWidth: 0,
  },
  accessActionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    minWidth: 0,
  },
  accessStatusChip: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "5px 8px",
    border: "1px solid #cbd5e1",
    color: "#475569",
    background: "#f8fafc",
    fontSize: "11px",
    fontWeight: "950",
    whiteSpace: "nowrap",
  },
  accessStatusIdle: {
    background: "#f8fafc",
    borderColor: "#cbd5e1",
    color: "#475569",
  },
  accessStatusPending: {
    background: "#fef3c7",
    borderColor: "#fde68a",
    color: "#92400e",
  },
  accessStatusApproved: {
    background: "#dcfce7",
    borderColor: "#86efac",
    color: "#166534",
  },
  accessStatusRejected: {
    background: "#fee2e2",
    borderColor: "#fecaca",
    color: "#991b1b",
  },
  accessWarning: {
    padding: "8px 10px",
    borderRadius: "12px",
    background: "rgba(255,247,237,0.94)",
    border: "1px solid rgba(249,115,22,0.22)",
    color: "#9a3412",
    fontSize: "12px",
    fontWeight: "850",
    lineHeight: 1.35,
  },
  clubTeamAdminForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: "8px",
    alignItems: "center",
    minWidth: 0,
  },
  clubTeamAdminList: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  clubTeamAdminRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: "10px",
    alignItems: "center",
    padding: "10px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(37,99,235,0.12)",
    minWidth: 0,
  },
  confirmOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "grid",
    placeItems: "center",
    padding: "16px",
    background: "rgba(15,23,42,0.34)",
    boxSizing: "border-box",
  },
  confirmDialog: {
    display: "grid",
    gap: "12px",
    width: "min(100%, 420px)",
    padding: "16px",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid rgba(220,38,38,0.16)",
    boxShadow: "0 24px 70px rgba(15,23,42,0.22)",
    boxSizing: "border-box",
  },
  confirmActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
};

const hubDarkPalette = {
  page: "#06111f",
  panel: "rgba(15, 23, 42, 0.74)",
  panelStrong: "rgba(15, 23, 42, 0.90)",
  panelSoft: "rgba(30, 41, 59, 0.64)",
  border: "1px solid rgba(125, 211, 252, 0.16)",
  borderStrong: "1px solid rgba(34, 211, 238, 0.30)",
  text: "#e5f3ff",
  muted: "#9fb4d0",
  dim: "#6f83a3",
  cyan: "#38bdf8",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#fb7185",
};

const hubGlassPanel = {
  background:
    "linear-gradient(145deg, rgba(15,23,42,0.88), rgba(15,23,42,0.66))",
  border: hubDarkPalette.border,
  boxShadow: "0 18px 54px rgba(2,6,23,0.34)",
  backdropFilter: "blur(18px)",
};

const hubGlassPanelSoft = {
  background:
    "linear-gradient(145deg, rgba(30,41,59,0.72), rgba(15,23,42,0.58))",
  border: "1px solid rgba(148,163,184,0.13)",
  boxShadow: "0 12px 34px rgba(2,6,23,0.24)",
  backdropFilter: "blur(14px)",
};

const hubGlassRow = {
  background: "rgba(15,23,42,0.52)",
  border: "1px solid rgba(148,163,184,0.12)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

Object.assign(playerHubStyles, {
  shell: {
    ...playerHubStyles.shell,
    gap: "16px",
    maxWidth: "1240px",
    padding: "18px",
    borderRadius: "30px",
    color: hubDarkPalette.text,
    background:
      "radial-gradient(circle at 12% 0%, rgba(56,189,248,0.22), transparent 30%), radial-gradient(circle at 88% 8%, rgba(52,211,153,0.16), transparent 28%), linear-gradient(135deg, #06111f 0%, #0f172a 55%, #111827 100%)",
    border: "1px solid rgba(148,163,184,0.12)",
    boxShadow: "0 28px 90px rgba(2,6,23,0.35)",
  },
  hero: {
    ...playerHubStyles.hero,
    padding: "18px",
    borderRadius: "26px",
    background:
      "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(15,23,42,0.78) 45%, rgba(22,163,74,0.12))",
    border: hubDarkPalette.borderStrong,
    boxShadow: "0 22px 70px rgba(8,47,73,0.35)",
  },
  title: {
    ...playerHubStyles.title,
    color: hubDarkPalette.text,
    fontSize: "28px",
  },
  subtitle: {
    ...playerHubStyles.subtitle,
    color: hubDarkPalette.muted,
  },
  sectionTitle: {
    ...playerHubStyles.sectionTitle,
    color: hubDarkPalette.text,
    fontSize: "15px",
  },
  profileCard: {
    ...playerHubStyles.profileCard,
    ...hubGlassPanel,
    borderRadius: "24px",
  },
  playerHeroCard: {
    ...playerHubStyles.playerHeroCard,
    ...hubGlassPanel,
    borderRadius: "28px",
    background:
      "linear-gradient(145deg, rgba(14,165,233,0.18), rgba(15,23,42,0.84) 46%, rgba(52,211,153,0.10))",
  },
  nextTournamentCard: {
    ...playerHubStyles.nextTournamentCard,
    ...hubGlassPanel,
    borderRadius: "24px",
    background:
      "linear-gradient(145deg, rgba(245,158,11,0.16), rgba(15,23,42,0.82) 52%, rgba(14,165,233,0.11))",
  },
  homeCard: {
    ...playerHubStyles.homeCard,
    ...hubGlassPanelSoft,
    borderRadius: "22px",
  },
  teamSetupCard: {
    ...playerHubStyles.teamSetupCard,
    ...hubGlassPanel,
    borderRadius: "22px",
    background:
      "linear-gradient(145deg, rgba(34,197,94,0.16), rgba(15,23,42,0.82))",
  },
  profileEditorPanel: {
    ...playerHubStyles.profileEditorPanel,
  },
  editorSection: {
    ...playerHubStyles.editorSection,
    ...hubGlassPanelSoft,
  },
  actionDrawer: {
    ...playerHubStyles.actionDrawer,
    ...hubGlassPanelSoft,
    borderRadius: "20px",
  },
  actionDrawerTitle: {
    ...playerHubStyles.actionDrawerTitle,
    color: hubDarkPalette.text,
  },
  actionDrawerHint: {
    ...playerHubStyles.actionDrawerHint,
    color: hubDarkPalette.muted,
  },
  profileInput: {
    ...playerHubStyles.profileInput,
    background: "rgba(2,6,23,0.44)",
    border: "1px solid rgba(148,163,184,0.22)",
    color: hubDarkPalette.text,
    colorScheme: "dark",
  },
  profileTextarea: {
    ...playerHubStyles.profileTextarea,
    background: "rgba(2,6,23,0.44)",
    border: "1px solid rgba(148,163,184,0.22)",
    color: hubDarkPalette.text,
    colorScheme: "dark",
  },
  profileTextareaCompact: {
    ...playerHubStyles.profileTextareaCompact,
    background: "rgba(2,6,23,0.44)",
    border: "1px solid rgba(148,163,184,0.22)",
    color: hubDarkPalette.text,
    colorScheme: "dark",
  },
  profileLabel: {
    ...playerHubStyles.profileLabel,
    color: "#c7d2fe",
  },
  checkboxRow: {
    ...playerHubStyles.checkboxRow,
    background: "rgba(14,165,233,0.10)",
    border: "1px solid rgba(125,211,252,0.16)",
    color: hubDarkPalette.text,
  },
  segmentButton: {
    ...playerHubStyles.segmentButton,
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.18)",
    color: hubDarkPalette.muted,
  },
  segmentButtonActive: {
    ...playerHubStyles.segmentButtonActive,
    background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
    borderColor: "rgba(125,211,252,0.40)",
    color: "#eff6ff",
  },
  saveButton: {
    ...playerHubStyles.saveButton,
    border: "1px solid rgba(125,211,252,0.34)",
    background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
    color: "#ecfeff",
    boxShadow: "0 10px 26px rgba(14,165,233,0.22)",
  },
  saveButtonDisabled: {
    ...playerHubStyles.saveButtonDisabled,
    background: "rgba(71,85,105,0.72)",
    color: "#cbd5e1",
    boxShadow: "none",
  },
  adminActionButton: {
    ...playerHubStyles.adminActionButton,
    background: "rgba(14,165,233,0.12)",
    border: "1px solid rgba(125,211,252,0.22)",
    color: "#bae6fd",
    boxShadow: "0 8px 20px rgba(2,6,23,0.18)",
  },
  adminDangerButton: {
    ...playerHubStyles.adminDangerButton,
    background: "rgba(244,63,94,0.14)",
    borderColor: "rgba(251,113,133,0.26)",
    color: "#fecdd3",
  },
  adminDisabledButton: {
    ...playerHubStyles.adminDisabledButton,
    opacity: 0.46,
    boxShadow: "none",
  },
  profileMessage: {
    ...playerHubStyles.profileMessage,
    color: "#b6c5dd",
  },
  profilePreviewPanel: {
    ...playerHubStyles.profilePreviewPanel,
    ...hubGlassPanelSoft,
  },
  profilePreviewCard: {
    ...playerHubStyles.profilePreviewCard,
    ...hubGlassPanelSoft,
  },
  playerAvatarLarge: {
    ...playerHubStyles.playerAvatarLarge,
    background: "linear-gradient(135deg, #38bdf8, #22c55e)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 16px 36px rgba(14,165,233,0.25)",
    color: "#04111f",
  },
  previewName: {
    ...playerHubStyles.previewName,
    color: hubDarkPalette.text,
  },
  previewTitle: {
    ...playerHubStyles.previewTitle,
    color: hubDarkPalette.text,
  },
  previewSubtitle: {
    ...playerHubStyles.previewSubtitle,
    color: hubDarkPalette.muted,
  },
  previewType: {
    ...playerHubStyles.previewType,
    color: hubDarkPalette.cyan,
  },
  cardTitle: {
    ...playerHubStyles.cardTitle,
    color: hubDarkPalette.text,
  },
  cardText: {
    ...playerHubStyles.cardText,
    color: hubDarkPalette.muted,
  },
  emptyPreview: {
    ...playerHubStyles.emptyPreview,
    padding: "11px 12px",
    borderRadius: "14px",
    background: "rgba(15,23,42,0.38)",
    border: "1px dashed rgba(125,211,252,0.18)",
    color: hubDarkPalette.dim,
  },
  compactRow: {
    ...playerHubStyles.compactRow,
    ...hubGlassRow,
  },
  compactRowTitle: {
    ...playerHubStyles.compactRowTitle,
    color: hubDarkPalette.text,
  },
  compactRowMeta: {
    ...playerHubStyles.compactRowMeta,
    color: hubDarkPalette.muted,
  },
  chip: {
    ...playerHubStyles.chip,
    background: "rgba(14,165,233,0.12)",
    border: "1px solid rgba(125,211,252,0.18)",
    color: "#bae6fd",
  },
  internalNeedChip: {
    background: "rgba(100,116,139,0.16)",
    border: "1px solid rgba(148,163,184,0.22)",
    color: "#cbd5e1",
  },
  tournamentAdChip: {
    background: "rgba(14,165,233,0.16)",
    border: "1px solid rgba(125,211,252,0.30)",
    color: "#e0f2fe",
  },
  trainingNeedChip: {
    background: "rgba(245,158,11,0.16)",
    border: "1px solid rgba(251,191,36,0.26)",
    color: "#fde68a",
  },
  statusChip: {
    ...playerHubStyles.statusChip,
    background: "rgba(14,165,233,0.16)",
    border: "1px solid rgba(125,211,252,0.22)",
    color: "#dff7ff",
  },
  previewCard: {
    ...playerHubStyles.previewCard,
    ...hubGlassPanelSoft,
  },
  teamNeedCard: {
    ...playerHubStyles.teamNeedCard,
    ...hubGlassPanelSoft,
  },
  needStat: {
    ...playerHubStyles.needStat,
    ...hubGlassRow,
  },
  needStatStrong: {
    ...playerHubStyles.needStatStrong,
    color: hubDarkPalette.text,
  },
  needStatLabel: {
    ...playerHubStyles.needStatLabel,
    color: hubDarkPalette.muted,
  },
  detail: {
    ...playerHubStyles.detail,
    ...hubGlassRow,
  },
  detailLabel: {
    ...playerHubStyles.detailLabel,
    color: hubDarkPalette.dim,
  },
  detailValue: {
    ...playerHubStyles.detailValue,
    color: hubDarkPalette.text,
  },
  statCard: {
    ...playerHubStyles.statCard,
    background: "rgba(14,165,233,0.10)",
    border: "1px solid rgba(125,211,252,0.16)",
  },
  editorTab: {
    ...playerHubStyles.editorTab,
    background: "rgba(14,165,233,0.10)",
    border: "1px solid rgba(125,211,252,0.16)",
    color: "#bae6fd",
  },
  editorTabActive: {
    ...playerHubStyles.editorTabActive,
    background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
    borderColor: "rgba(125,211,252,0.36)",
    color: "#04111f",
  },
  disabledButton: {
    ...playerHubStyles.disabledButton,
    background: "rgba(71,85,105,0.38)",
    border: "1px solid rgba(148,163,184,0.18)",
    color: hubDarkPalette.dim,
  },
  workflowStep: {
    ...playerHubStyles.workflowStep,
    ...hubGlassRow,
    color: "#bae6fd",
  },
  conceptCard: {
    ...playerHubStyles.conceptCard,
    ...hubGlassPanelSoft,
  },
  permissionCard: {
    ...playerHubStyles.permissionCard,
    ...hubGlassPanelSoft,
  },
  linkedPanel: {
    ...playerHubStyles.linkedPanel,
    background: "rgba(245,158,11,0.10)",
    border: "1px solid rgba(251,191,36,0.18)",
  },
  linkedText: {
    ...playerHubStyles.linkedText,
    color: "#fde68a",
  },
  opportunityCard: {
    ...playerHubStyles.opportunityCard,
    ...hubGlassPanelSoft,
  },
  opportunityMeta: {
    ...playerHubStyles.opportunityMeta,
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(251,191,36,0.18)",
    color: "#fde68a",
  },
  achievementCard: {
    ...playerHubStyles.achievementCard,
    ...hubGlassPanelSoft,
  },
  historyPanel: {
    ...playerHubStyles.historyPanel,
    background: "rgba(34,197,94,0.10)",
    border: "1px solid rgba(52,211,153,0.18)",
  },
  historyIntro: {
    ...playerHubStyles.historyIntro,
    color: "#bbf7d0",
  },
  historyNote: {
    ...playerHubStyles.historyNote,
    color: "#86efac",
  },
  futureCard: {
    ...playerHubStyles.futureCard,
    background: "rgba(14,165,233,0.10)",
    border: "1px solid rgba(125,211,252,0.16)",
  },
  adminReviewCard: {
    ...playerHubStyles.adminReviewCard,
    ...hubGlassPanel,
    borderRadius: "24px",
  },
  adminDashboardTile: {
    ...playerHubStyles.adminDashboardTile,
    ...hubGlassPanelSoft,
  },
  adminDashboardTileActive: {
    ...playerHubStyles.adminDashboardTileActive,
    background: "linear-gradient(145deg, rgba(14,165,233,0.24), rgba(15,23,42,0.76))",
    borderColor: "rgba(125,211,252,0.34)",
  },
  adminDashboardTileMuted: {
    ...playerHubStyles.adminDashboardTileMuted,
    opacity: 0.48,
    background: "rgba(15,23,42,0.34)",
    borderColor: "rgba(148,163,184,0.10)",
    boxShadow: "none",
  },
  adminDashboardIcon: {
    ...playerHubStyles.adminDashboardIcon,
    background: "rgba(14,165,233,0.14)",
    color: "#bae6fd",
  },
  adminDashboardCount: {
    ...playerHubStyles.adminDashboardCount,
    color: hubDarkPalette.text,
  },
  adminAccordion: {
    ...playerHubStyles.adminAccordion,
    ...hubGlassPanel,
  },
  adminAccordionSummary: {
    ...playerHubStyles.adminAccordionSummary,
    color: hubDarkPalette.text,
  },
  adminReviewProfileCard: {
    ...playerHubStyles.adminReviewProfileCard,
    ...hubGlassPanelSoft,
  },
  adminFeedbackBanner: {
    ...playerHubStyles.adminFeedbackBanner,
    background: "rgba(14,165,233,0.12)",
    border: "1px solid rgba(125,211,252,0.20)",
    color: "#dff7ff",
  },
  adminFeedbackSuccess: {
    ...playerHubStyles.adminFeedbackSuccess,
    background: "rgba(34,197,94,0.14)",
    borderColor: "rgba(52,211,153,0.22)",
    color: "#bbf7d0",
  },
  adminFeedbackError: {
    ...playerHubStyles.adminFeedbackError,
    background: "rgba(244,63,94,0.14)",
    borderColor: "rgba(251,113,133,0.24)",
    color: "#fecdd3",
  },
  clubTeamStatusChip: {
    ...playerHubStyles.clubTeamStatusChip,
    background: "rgba(15,23,42,0.50)",
    border: "1px solid rgba(148,163,184,0.18)",
    color: hubDarkPalette.muted,
  },
  clubTeamStatusActive: {
    ...playerHubStyles.clubTeamStatusActive,
    background: "rgba(34,197,94,0.16)",
    borderColor: "rgba(52,211,153,0.30)",
    color: "#bbf7d0",
  },
  clubTeamStatusInactive: {
    ...playerHubStyles.clubTeamStatusInactive,
    background: "rgba(244,63,94,0.14)",
    borderColor: "rgba(251,113,133,0.24)",
    color: "#fecdd3",
  },
  accessRequestCard: {
    ...playerHubStyles.accessRequestCard,
    ...hubGlassPanelSoft,
  },
  accessRequestChooser: {
    ...playerHubStyles.accessRequestChooser,
    ...hubGlassPanelSoft,
  },
  accessRequestTile: {
    ...playerHubStyles.accessRequestTile,
    ...hubGlassRow,
    color: hubDarkPalette.text,
  },
  accessRequestAction: {
    ...playerHubStyles.accessRequestAction,
    background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
    color: "#04111f",
  },
  accessRequestActionMuted: {
    ...playerHubStyles.accessRequestActionMuted,
    background: "rgba(71,85,105,0.58)",
    color: "#cbd5e1",
  },
  accessOptionButton: {
    ...playerHubStyles.accessOptionButton,
    ...hubGlassRow,
    color: hubDarkPalette.text,
  },
  accessOptionSelected: {
    ...playerHubStyles.accessOptionSelected,
    background: "rgba(14,165,233,0.18)",
    borderColor: "rgba(125,211,252,0.38)",
  },
  accessRequestRow: {
    ...playerHubStyles.accessRequestRow,
    ...hubGlassRow,
  },
  accessCompactRow: {
    ...playerHubStyles.accessCompactRow,
    ...hubGlassRow,
  },
  accessMiniButton: {
    ...playerHubStyles.accessMiniButton,
    background: "rgba(14,165,233,0.12)",
    border: "1px solid rgba(125,211,252,0.20)",
    color: "#bae6fd",
  },
  accessInlineForm: {
    ...playerHubStyles.accessInlineForm,
    background: "rgba(14,165,233,0.10)",
    border: "1px solid rgba(125,211,252,0.16)",
  },
  mutedLine: {
    ...playerHubStyles.mutedLine,
    color: hubDarkPalette.dim,
  },
  progressTrack: {
    ...playerHubStyles.progressTrack,
    height: "5px",
    background: "rgba(30,41,59,0.92)",
  },
  progressFill: {
    ...playerHubStyles.progressFill,
    background: "linear-gradient(90deg, #38bdf8, #34d399)",
    boxShadow: "0 0 16px rgba(56,189,248,0.34)",
  },
  teamControlHero: {
    ...playerHubStyles.teamControlHero,
    ...hubGlassPanel,
    borderRadius: "28px",
    background:
      "linear-gradient(145deg, rgba(52,211,153,0.14), rgba(15,23,42,0.86) 48%, rgba(14,165,233,0.12))",
  },
  teamControlPanel: {
    ...playerHubStyles.teamControlPanel,
    ...hubGlassPanelSoft,
  },
  teamControlWidePanel: {
    ...playerHubStyles.teamControlWidePanel,
    ...hubGlassPanelSoft,
  },
  captainChecklistCard: {
    ...hubGlassPanelSoft,
    display: "grid",
    gap: "12px",
    padding: "12px",
    borderRadius: "18px",
    minWidth: 0,
  },
  captainChecklistTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  captainChecklistFocus: {
    display: "grid",
    gap: "3px",
    minWidth: 0,
  },
  captainChecklistGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
    gap: "8px",
    minWidth: 0,
  },
  captainChecklistStep: {
    display: "grid",
    gap: "7px",
    padding: "10px",
    borderRadius: "14px",
    background: "rgba(15,23,42,0.42)",
    border: "1px solid rgba(125,211,252,0.14)",
    minWidth: 0,
  },
  captainChecklistStepTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    minWidth: 0,
  },
  captainChecklistStepName: {
    color: hubDarkPalette.text,
    fontSize: "12px",
    fontWeight: "950",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  captainChecklistStepDetail: {
    color: hubDarkPalette.muted,
    fontSize: "11px",
    lineHeight: 1.35,
    fontWeight: "750",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  captainChecklistActions: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    alignItems: "center",
    minWidth: 0,
  },
  captainChecklistAction: {
    ...playerHubStyles.adminActionButton,
    borderColor: "rgba(125,211,252,0.24)",
    background: "rgba(14,165,233,0.18)",
    color: "#e0f2fe",
  },
  captainChecklistPrimaryAction: {
    ...playerHubStyles.saveButton,
    padding: "8px 11px",
    background: "linear-gradient(135deg, #38bdf8, #22c55e)",
    borderColor: "rgba(125,211,252,0.34)",
    color: "#04111f",
  },
  captainChecklistStatusNext: {
    background: "rgba(14,165,233,0.18)",
    borderColor: "rgba(125,211,252,0.28)",
    color: "#bae6fd",
  },
  teamControlRow: {
    ...playerHubStyles.teamControlRow,
    ...hubGlassRow,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  },
  planStatsLine: {
    ...playerHubStyles.planStatsLine,
    color: "#c7d2fe",
  },
  interestGroupTitle: {
    ...playerHubStyles.interestGroupTitle,
    color: hubDarkPalette.text,
  },
  interestRow: {
    ...playerHubStyles.interestRow,
    ...hubGlassRow,
  },
  interestPlayerName: {
    ...playerHubStyles.interestPlayerName,
    color: hubDarkPalette.text,
  },
  addTeamMemberButton: {
    ...playerHubStyles.addTeamMemberButton,
    background: "linear-gradient(135deg, #22c55e, #38bdf8)",
    color: "#04111f",
  },
  squadBoard: {
    ...playerHubStyles.squadBoard,
    ...hubGlassPanel,
    borderRadius: "26px",
  },
  squadColumn: {
    ...playerHubStyles.squadColumn,
    ...hubGlassPanelSoft,
  },
  squadTeamBox: {
    ...playerHubStyles.squadTeamBox,
    ...hubGlassPanelSoft,
  },
  squadColumnHeader: {
    ...playerHubStyles.squadColumnHeader,
    color: hubDarkPalette.text,
  },
  squadPlayerRow: {
    ...playerHubStyles.squadPlayerRow,
    borderBottom: "1px solid rgba(125,211,252,0.10)",
  },
  squadPlayerName: {
    ...playerHubStyles.squadPlayerName,
    color: hubDarkPalette.text,
  },
  squadPlayerMeta: {
    ...playerHubStyles.squadPlayerMeta,
    color: hubDarkPalette.muted,
  },
  squadTinyBadge: {
    ...playerHubStyles.squadTinyBadge,
    background: "rgba(14,165,233,0.12)",
    border: "1px solid rgba(125,211,252,0.18)",
    color: "#bae6fd",
  },
  squadMoveButton: {
    ...playerHubStyles.squadMoveButton,
    background: "rgba(14,165,233,0.12)",
    border: "1px solid rgba(125,211,252,0.18)",
    color: "#bae6fd",
  },
  squadMoveButtonActive: {
    ...playerHubStyles.squadMoveButtonActive,
    background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
    borderColor: "rgba(125,211,252,0.36)",
    color: "#04111f",
  },
  squadEmptyRow: {
    ...playerHubStyles.squadEmptyRow,
    background: "rgba(15,23,42,0.36)",
    color: hubDarkPalette.dim,
  },
  squadPendingToggle: {
    ...playerHubStyles.squadPendingToggle,
    background: "rgba(14,165,233,0.12)",
    border: "1px solid rgba(125,211,252,0.18)",
    color: "#bae6fd",
  },
  squadPendingList: {
    ...playerHubStyles.squadPendingList,
    ...hubGlassRow,
  },
  accessStatusChip: {
    ...playerHubStyles.accessStatusChip,
    background: "rgba(15,23,42,0.56)",
    border: "1px solid rgba(148,163,184,0.18)",
    color: hubDarkPalette.muted,
  },
  accessStatusIdle: {
    ...playerHubStyles.accessStatusIdle,
    background: "rgba(30,41,59,0.70)",
    borderColor: "rgba(148,163,184,0.18)",
    color: "#cbd5e1",
  },
  accessStatusPending: {
    ...playerHubStyles.accessStatusPending,
    background: "rgba(245,158,11,0.16)",
    borderColor: "rgba(251,191,36,0.30)",
    color: "#fde68a",
  },
  accessStatusApproved: {
    ...playerHubStyles.accessStatusApproved,
    background: "rgba(34,197,94,0.16)",
    borderColor: "rgba(52,211,153,0.30)",
    color: "#bbf7d0",
  },
  accessStatusRejected: {
    ...playerHubStyles.accessStatusRejected,
    background: "rgba(244,63,94,0.14)",
    borderColor: "rgba(251,113,133,0.24)",
    color: "#fecdd3",
  },
  accessWarning: {
    ...playerHubStyles.accessWarning,
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(251,191,36,0.22)",
    color: "#fde68a",
  },
  clubTeamAdminRow: {
    ...playerHubStyles.clubTeamAdminRow,
    ...hubGlassRow,
  },
  confirmOverlay: {
    ...playerHubStyles.confirmOverlay,
    background: "rgba(2,6,23,0.70)",
  },
  confirmDialog: {
    ...playerHubStyles.confirmDialog,
    ...hubGlassPanel,
  },
});

Object.assign(playerHubStyles, {
  feedPanel: {
    ...hubGlassPanel,
    display: "grid",
    gap: "12px",
    padding: "16px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(8,47,73,0.68))",
  },
  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  feedList: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  feedItem: {
    ...hubGlassRow,
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "16px",
  },
  feedIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "12px",
    display: "grid",
    placeItems: "center",
    color: hubDarkPalette.text,
    fontWeight: "950",
    background:
      "linear-gradient(135deg, rgba(56,189,248,0.22), rgba(52,211,153,0.18))",
    border: "1px solid rgba(125,211,252,0.28)",
  },
  eventGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
    gap: "12px",
    minWidth: 0,
  },
  eventCard: {
    ...hubGlassPanel,
    display: "grid",
    gap: "9px",
    width: "100%",
    maxWidth: "560px",
    padding: "12px",
    borderRadius: "18px",
    overflow: "hidden",
    background:
      "linear-gradient(160deg, rgba(15,23,42,0.92), rgba(14,116,144,0.20) 52%, rgba(5,150,105,0.14))",
    boxSizing: "border-box",
  },
  eventCardFeatured: {
    border: "1px solid rgba(56,189,248,0.42)",
    boxShadow:
      "0 22px 56px rgba(8,47,73,0.34), inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  eventTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "start",
    flexWrap: "wrap",
    minWidth: 0,
  },
  eventTitle: {
    color: hubDarkPalette.text,
    fontSize: "16px",
    lineHeight: 1.15,
    fontWeight: "980",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  eventMeta: {
    color: hubDarkPalette.muted,
    fontSize: "12px",
    fontWeight: "800",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  eventStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    minWidth: 0,
  },
  eventStat: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 7px",
    borderRadius: "999px",
    background: "rgba(2,6,23,0.36)",
    border: "1px solid rgba(148,163,184,0.14)",
    minWidth: 0,
  },
  eventStatGoing: {
    background: "rgba(34,197,94,0.14)",
    borderColor: "rgba(52,211,153,0.25)",
  },
  eventStatMaybe: {
    background: "rgba(14,165,233,0.13)",
    borderColor: "rgba(125,211,252,0.22)",
  },
  eventStatNo: {
    background: "rgba(244,63,94,0.12)",
    borderColor: "rgba(251,113,133,0.20)",
  },
  eventStatPending: {
    background: "rgba(245,158,11,0.13)",
    borderColor: "rgba(251,191,36,0.22)",
  },
  eventStatValue: {
    color: hubDarkPalette.text,
    fontSize: "12px",
    fontWeight: "980",
  },
  eventStatLabel: {
    color: hubDarkPalette.dim,
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "none",
    letterSpacing: 0,
  },
  eventActionBar: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 0,
  },
  eventResponseActions: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "7px",
    minWidth: 0,
  },
  eventResponseButton: {
    ...playerHubStyles.adminActionButton,
    minHeight: "42px",
    width: "100%",
    padding: "9px 8px",
    borderRadius: "14px",
    fontSize: "12px",
    background: "rgba(14,165,233,0.10)",
  },
  eventResponseButtonActive: {
    background: "linear-gradient(135deg, #38bdf8, #22c55e)",
    borderColor: "rgba(125,211,252,0.36)",
    color: "#04111f",
    boxShadow: "0 10px 24px rgba(14,165,233,0.20)",
  },
  eventViewRosterButton: {
    ...playerHubStyles.saveButton,
    justifySelf: "start",
    minHeight: "42px",
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "12px",
  },
  eventSecondaryActions: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    alignItems: "center",
    minWidth: 0,
  },
  eventPreferenceDetails: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  eventPreferenceSummary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    justifySelf: "start",
    border: "1px solid rgba(125,211,252,0.18)",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "rgba(14,165,233,0.10)",
    color: "#bae6fd",
    fontSize: "11px",
    fontWeight: "950",
    cursor: "pointer",
  },
  eventsEmptyState: {
    ...hubGlassPanelSoft,
    display: "grid",
    gap: "5px",
    padding: "16px",
    borderRadius: "20px",
    maxWidth: "420px",
    minWidth: 0,
  },
  eventCommentDrawer: {
    display: "grid",
    gap: "8px",
    padding: "10px",
    borderRadius: "16px",
    background: "rgba(2,6,23,0.42)",
    border: "1px solid rgba(148,163,184,0.16)",
    minWidth: 0,
  },
  commentRow: {
    display: "grid",
    gap: "3px",
    padding: "8px 9px",
    borderRadius: "12px",
    background: "rgba(15,23,42,0.68)",
    border: "1px solid rgba(148,163,184,0.12)",
    minWidth: 0,
  },
  commentAuthor: {
    color: hubDarkPalette.cyan,
    fontSize: "12px",
    fontWeight: "950",
  },
  commentText: {
    color: hubDarkPalette.text,
    fontSize: "12px",
    lineHeight: 1.35,
    fontWeight: "750",
    overflowWrap: "anywhere",
  },
  commentComposer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: "8px",
    alignItems: "center",
    minWidth: 0,
  },
  feedTinyAction: {
    border: "1px solid rgba(125,211,252,0.22)",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "rgba(15,23,42,0.72)",
    color: hubDarkPalette.text,
    fontSize: "11px",
    fontWeight: "950",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  hubNav: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
    gap: "7px",
    padding: "7px",
    borderRadius: "22px",
    background: "rgba(2,6,23,0.34)",
    border: "1px solid rgba(125,211,252,0.14)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    minWidth: 0,
  },
  hubNavButton: {
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "16px",
    padding: "10px 11px",
    background: "rgba(15,23,42,0.54)",
    color: hubDarkPalette.muted,
    fontSize: "12px",
    fontWeight: "950",
    cursor: "pointer",
    minWidth: 0,
    whiteSpace: "nowrap",
  },
  hubNavButtonActive: {
    background: "linear-gradient(135deg, #38bdf8, #22c55e)",
    borderColor: "rgba(125,211,252,0.38)",
    color: "#04111f",
    boxShadow: "0 12px 28px rgba(14,165,233,0.22)",
  },
  previewTitle: {
    ...playerHubStyles.previewTitle,
    color: hubDarkPalette.text,
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  compactRowTitle: {
    ...playerHubStyles.compactRowTitle,
    color: hubDarkPalette.text,
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  compactRowMeta: {
    ...playerHubStyles.compactRowMeta,
    color: hubDarkPalette.muted,
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
});

Object.assign(playerHubStyles, {
  teamSetupControls: {
    ...playerHubStyles.teamSetupControls,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  },
  heroActions: {
    ...playerHubStyles.heroActions,
    alignItems: "stretch",
  },
  teamControlActions: {
    ...playerHubStyles.teamControlActions,
    justifyContent: "flex-start",
  },
  teamControlActionsRow: {
    ...playerHubStyles.teamControlActionsRow,
    justifyContent: "flex-start",
  },
  adminActionButton: {
    ...playerHubStyles.adminActionButton,
    maxWidth: "100%",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "normal",
    textAlign: "center",
  },
  saveButton: {
    ...playerHubStyles.saveButton,
    maxWidth: "100%",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "normal",
    textAlign: "center",
  },
  feedTinyAction: {
    ...playerHubStyles.feedTinyAction,
    maxWidth: "100%",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "normal",
    textAlign: "center",
  },
  hubNav: {
    ...playerHubStyles.hubNav,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 84px), 1fr))",
  },
  hubNavButton: {
    ...playerHubStyles.hubNavButton,
    minHeight: "40px",
    padding: "9px 8px",
  },
});

Object.assign(playerHubStyles, {
  teamDashboardShell: {
    ...hubGlassPanel,
    display: "grid",
    gap: "14px",
    padding: "14px",
    borderRadius: "24px",
    minWidth: 0,
    overflow: "hidden",
  },
  teamDashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "14px",
    alignItems: "start",
    minWidth: 0,
  },
  teamDashboardColumn: {
    display: "grid",
    gap: "12px",
    alignItems: "start",
    minWidth: 0,
  },
  teamSummaryCard: {
    ...hubGlassPanel,
    display: "grid",
    gap: "11px",
    padding: "14px",
    borderRadius: "22px",
    background:
      "linear-gradient(145deg, rgba(52,211,153,0.14), rgba(15,23,42,0.86) 50%, rgba(14,165,233,0.12))",
    minWidth: 0,
  },
  teamSummaryStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 92px), 1fr))",
    gap: "7px",
    minWidth: 0,
  },
  teamSummaryStat: {
    ...hubGlassRow,
    display: "grid",
    gap: "3px",
    padding: "8px 9px",
    borderRadius: "14px",
    minWidth: 0,
  },
  teamSummaryStatValue: {
    color: hubDarkPalette.text,
    fontSize: "16px",
    lineHeight: 1,
    fontWeight: "950",
  },
  teamSummaryStatLabel: {
    color: hubDarkPalette.muted,
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
    overflowWrap: "break-word",
  },
  captainActionStrip: {
    ...hubGlassPanelSoft,
    display: "grid",
    gap: "10px",
    padding: "12px",
    borderRadius: "20px",
    minWidth: 0,
  },
  captainActionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 126px), 1fr))",
    gap: "7px",
    minWidth: 0,
  },
  captainActionButton: {
    ...playerHubStyles.adminActionButton,
    minHeight: "42px",
    padding: "9px 10px",
    borderRadius: "14px",
    fontSize: "12px",
    background: "rgba(14,165,233,0.12)",
  },
  teamCompactPanel: {
    ...hubGlassPanelSoft,
    display: "grid",
    gap: "10px",
    padding: "12px",
    borderRadius: "20px",
    minWidth: 0,
  },
  teamCompactList: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  teamCompactRow: {
    ...hubGlassRow,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "9px",
    alignItems: "center",
    padding: "9px 10px",
    borderRadius: "15px",
    minWidth: 0,
  },
  teamEventPreviewGrid: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  captainChecklistDetails: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  captainChecklistSummary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    justifySelf: "start",
    border: "1px solid rgba(125,211,252,0.18)",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "rgba(14,165,233,0.10)",
    color: "#bae6fd",
    fontSize: "11px",
    fontWeight: "950",
    cursor: "pointer",
  },
  compactSquadNamesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: "8px",
    minWidth: 0,
  },
  compactSquadNameField: {
    ...hubGlassRow,
    display: "grid",
    gap: "7px",
    padding: "9px",
    borderRadius: "14px",
    minWidth: 0,
  },
  homeDashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "14px",
    alignItems: "start",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  homeActionStack: {
    display: "grid",
    gap: "12px",
    alignItems: "start",
    minWidth: 0,
  },
  homeNextActionCard: {
    ...hubGlassPanel,
    display: "grid",
    gap: "13px",
    padding: "16px",
    borderRadius: "24px",
    background:
      "linear-gradient(145deg, rgba(14,165,233,0.18), rgba(15,23,42,0.88) 48%, rgba(52,211,153,0.12))",
    minWidth: 0,
  },
  homeNextActionTitle: {
    color: hubDarkPalette.text,
    fontSize: "21px",
    lineHeight: 1.12,
    fontWeight: "950",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  homeNextActionText: {
    color: hubDarkPalette.muted,
    fontSize: "13px",
    lineHeight: 1.38,
    fontWeight: "750",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  homePrimaryButton: {
    ...playerHubStyles.saveButton,
    justifySelf: "start",
    minHeight: "44px",
    padding: "11px 15px",
    fontSize: "13px",
    background: "linear-gradient(135deg, #38bdf8, #22c55e)",
    borderColor: "rgba(125,211,252,0.34)",
    color: "#04111f",
  },
  homeSecondaryButton: {
    ...playerHubStyles.adminActionButton,
    minHeight: "42px",
    padding: "10px 13px",
    fontSize: "12px",
  },
  homeQuickStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "7px",
    minWidth: 0,
  },
  homeQuickStatCard: {
    ...hubGlassRow,
    display: "grid",
    gap: "4px",
    padding: "10px 9px",
    borderRadius: "15px",
    minWidth: 0,
  },
  homeQuickStatValue: {
    color: hubDarkPalette.text,
    fontSize: "19px",
    lineHeight: 1,
    fontWeight: "950",
  },
  homeQuickStatLabel: {
    color: hubDarkPalette.muted,
    fontSize: "10px",
    lineHeight: 1.15,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
    overflowWrap: "break-word",
  },
  homePreviewCard: {
    ...hubGlassPanelSoft,
    display: "grid",
    gap: "10px",
    padding: "14px",
    borderRadius: "22px",
    minWidth: 0,
  },
  homePreviewList: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  homePreviewRow: {
    ...hubGlassRow,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "10px",
    alignItems: "center",
    padding: "10px 11px",
    borderRadius: "16px",
    minWidth: 0,
  },
  homeCaptainTaskRow: {
    ...hubGlassRow,
    display: "grid",
    gap: "7px",
    padding: "10px 11px",
    borderRadius: "16px",
    minWidth: 0,
  },
  homeCardActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
    minWidth: 0,
  },
  passportShell: {
    ...hubGlassPanel,
    display: "grid",
    gap: "14px",
    padding: "16px",
    borderRadius: "26px",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.94), rgba(8,47,73,0.58) 52%, rgba(5,150,105,0.16))",
    overflow: "hidden",
    minWidth: 0,
  },
  passportHero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: "14px",
    alignItems: "stretch",
    minWidth: 0,
  },
  passportSummaryCard: {
    ...hubGlassPanelSoft,
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    gap: "14px",
    alignItems: "center",
    padding: "16px",
    borderRadius: "22px",
    minWidth: 0,
  },
  passportAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "24px",
    display: "grid",
    placeItems: "center",
    color: hubDarkPalette.text,
    fontWeight: "950",
    fontSize: "30px",
    background:
      "linear-gradient(135deg, rgba(56,189,248,0.82), rgba(16,185,129,0.72))",
    boxShadow: "0 18px 46px rgba(14,165,233,0.22)",
    flex: "0 0 auto",
  },
  passportIdentity: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  passportName: {
    color: hubDarkPalette.text,
    fontSize: "24px",
    lineHeight: 1.08,
    fontWeight: "950",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  passportMeta: {
    color: hubDarkPalette.muted,
    fontSize: "13px",
    lineHeight: 1.4,
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  passportRoleRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    minWidth: 0,
  },
  passportRoleBadge: {
    ...playerHubStyles.chip,
    borderColor: "rgba(125,211,252,0.32)",
    color: hubDarkPalette.text,
    background: "rgba(14,165,233,0.14)",
  },
  passportStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    minWidth: 0,
  },
  passportStatCard: {
    ...hubGlassRow,
    display: "grid",
    gap: "4px",
    padding: "11px 12px",
    borderRadius: "18px",
    minWidth: 0,
  },
  passportStatValue: {
    color: hubDarkPalette.text,
    fontSize: "22px",
    lineHeight: 1,
    fontWeight: "950",
  },
  passportStatLabel: {
    color: hubDarkPalette.muted,
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  passportGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "14px",
    minWidth: 0,
  },
  passportPanel: {
    ...hubGlassPanelSoft,
    display: "grid",
    gap: "10px",
    padding: "14px",
    borderRadius: "22px",
    minWidth: 0,
  },
  passportActivityList: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },
  passportActivityRow: {
    ...hubGlassRow,
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "16px",
    minWidth: 0,
  },
  passportAchievementGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
    gap: "8px",
    minWidth: 0,
  },
  passportAchievementBadge: {
    ...hubGlassRow,
    display: "grid",
    gap: "5px",
    padding: "11px 12px",
    borderRadius: "16px",
    border: "1px solid rgba(52,211,153,0.28)",
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.16), rgba(14,165,233,0.10))",
    minWidth: 0,
  },
  passportAchievementBadgeLocked: {
    opacity: 0.58,
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(15,23,42,0.42)",
  },
  passportAchievementTitle: {
    color: hubDarkPalette.text,
    fontSize: "12px",
    fontWeight: "900",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  passportAchievementDetail: {
    color: hubDarkPalette.muted,
    fontSize: "11px",
    fontWeight: "750",
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  passportEmpty: {
    ...playerHubStyles.emptyPreview,
    borderColor: "rgba(148,163,184,0.16)",
    background: "rgba(15,23,42,0.28)",
    color: hubDarkPalette.muted,
    minHeight: "auto",
    padding: "16px",
  },
  squadNamesPanel: {
    ...hubGlassPanelSoft,
    display: "grid",
    gap: "12px",
    padding: "12px",
    borderRadius: "18px",
    minWidth: 0,
  },
  squadNamesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: "8px",
    minWidth: 0,
  },
  squadNameField: {
    display: "grid",
    gap: "8px",
    padding: "10px",
    borderRadius: "14px",
    border: "1px solid rgba(125,211,252,0.14)",
    background: "rgba(15,23,42,0.42)",
    minWidth: 0,
  },
  squadNameMapRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
    minWidth: 0,
  },
  squadNameMapText: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  squadNameInternal: {
    color: hubDarkPalette.muted,
    fontSize: "11px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  squadNameArrow: {
    color: hubDarkPalette.dim,
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  squadNameDisplay: {
    color: hubDarkPalette.text,
    fontSize: "13px",
    fontWeight: "950",
    lineHeight: 1.25,
    overflowWrap: "break-word",
    wordBreak: "normal",
    minWidth: 0,
  },
  squadNameActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "6px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  squadNameEditPanel: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  squadNameInput: {
    ...playerHubStyles.profileInput,
    minHeight: "38px",
    fontSize: "13px",
    background: "rgba(248,250,252,0.98)",
  },
  squadNameHint: {
    color: hubDarkPalette.muted,
    fontSize: "11px",
    lineHeight: 1.3,
    overflowWrap: "break-word",
    wordBreak: "normal",
  },
  squadNameSuggestionRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  squadNameSuggestionButton: {
    border: "1px solid rgba(125,211,252,0.18)",
    borderRadius: "999px",
    padding: "5px 8px",
    background: "rgba(2,6,23,0.34)",
    color: hubDarkPalette.muted,
    fontSize: "11px",
    fontWeight: "900",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
});

export default function PlayerHubPage({
  username = "",
  isAdmin = false,
  canReviewRosterDrafts = false,
  loadPlayerHubSnapshot,
  loadEventComments,
  addEventComment,
  loadMyPlayerProfile,
  saveMyPlayerProfile,
  loadPlayerProfilesForAdmin,
  updatePlayerProfileAdminStatus,
  resetPlayerPasswordForAdmin,
  loadClubTeams,
  loadClubTeamsAdmin,
  saveClubTeamAdmin,
  updateClubTeamActiveAdmin,
  requestTeamIdentityChange,
  loadTeamIdentityChangeRequests,
  reviewTeamIdentityChangeRequest,
  createAccessRequest,
  loadMyAccessRequests,
  loadAccessRequestsAdmin,
  reviewAccessRequestAdmin,
  loadMyTeamProfile,
  saveMyTeamProfile,
  createOrUpdateTeamNeed,
  closeTeamNeed,
  loadVisibleTeamNeeds,
  loadTeamProfilesAdmin,
  updateTeamProfileAdmin,
  createTeamNeedInterest,
  loadMyTeamNeedInterests,
  loadTeamNeedInterestsForCaptain,
  reviewTeamNeedInterest,
  loadTeamNeedInterestsAdmin,
  addTeamMemberFromInterest,
  loadMyTeamMembersForCaptain,
  loadMyConfirmedTeamsForPlayer,
  removeTeamMember,
  loadTeamMembersAdmin,
  createOrUpdateTeamMembershipRequest,
  loadMyTeamMembershipRequests,
  loadMembershipRequestsForCaptain,
  reviewTeamMembershipRequest,
  cancelMyTeamMembershipRequest,
  loadTeamMembershipRequestsAdmin,
  tournamentOptions = [],
  createTournamentTeamPlan,
  loadMyTournamentTeamPlansForCaptain,
  loadMyTournamentAvailabilityForPlayer,
  loadMyTournamentSquadPlanningForPlayer,
  updateTournamentAvailabilityResponse,
  loadTournamentAvailabilityForCaptain,
  updateTournamentPlanStatus,
  updateTournamentSquadLabels,
  loadTournamentSquadPlanningForCaptain,
  assignPlayerToSquad,
  createOrUpdateRosterDraftFromSquadPlanning,
  loadRosterDraftForCaptain,
  submitRosterDraft,
  cancelRosterDraft,
  loadMyRosterStatusForPlayer,
  loadRosterDraftAdmin,
  reviewRosterDraft,
  lockOfficialRoster,
}) {
  const copy = playerHubCopy;
  const profileTypeOptions = getPlayerHubProfileTypeOptions();
  const accessRequestCards = getPlayerHubAccessRequestCards();
  const [myProfile, setMyProfile] = useState(() =>
    normalizePlayerHubProfile({ ...getPlayerHubProfileDefaults(), username })
  );
  const [savedProfilePreview, setSavedProfilePreview] = useState(() =>
    normalizePlayerHubProfile({ ...getPlayerHubProfileDefaults(), username })
  );
  const [profileStatus, setProfileStatus] = useState("idle");
  const [profileMessage, setProfileMessage] = useState("");
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [adminReviewStatus, setAdminReviewStatus] = useState("idle");
  const [adminReviewMessage, setAdminReviewMessage] = useState("");
  const [adminUpdatingUsername, setAdminUpdatingUsername] = useState("");
  const [adminPasswordDrafts, setAdminPasswordDrafts] = useState({});
  const [clubTeams, setClubTeams] = useState([]);
  const [clubTeamsStatus, setClubTeamsStatus] = useState("idle");
  const [clubTeamsMessage, setClubTeamsMessage] = useState("");
  const [adminClubTeams, setAdminClubTeams] = useState([]);
  const [adminClubTeamsStatus, setAdminClubTeamsStatus] = useState("idle");
  const [adminClubTeamsMessage, setAdminClubTeamsMessage] = useState("");
  const [adminClubTeamDraft, setAdminClubTeamDraft] = useState({
    teamId: "",
    name: "",
    country: "",
    city: "",
    active: true,
  });
  const [adminClubTeamUpdatingId, setAdminClubTeamUpdatingId] = useState("");
  const [accessRequestMessageDraft, setAccessRequestMessageDraft] =
    useState("");
  const [accessRequests, setAccessRequests] = useState([]);
  const [accessRequestsStatus, setAccessRequestsStatus] = useState("idle");
  const [accessRequestsMessage, setAccessRequestsMessage] = useState("");
  const [accessRequestSubmittingType, setAccessRequestSubmittingType] =
    useState("");
  const [adminAccessRequests, setAdminAccessRequests] = useState([]);
  const [adminAccessRequestsStatus, setAdminAccessRequestsStatus] =
    useState("idle");
  const [adminAccessRequestsMessage, setAdminAccessRequestsMessage] =
    useState("");
  const [adminAccessRequestUpdatingId, setAdminAccessRequestUpdatingId] =
    useState("");
  const [adminAccessRequestNotes, setAdminAccessRequestNotes] = useState({});
  const [pendingDeactivateProfile, setPendingDeactivateProfile] =
    useState(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [activeProfileEditorTab, setActiveProfileEditorTab] = useState("basic");
  const [pendingAccessRequestType, setPendingAccessRequestType] = useState("");
  const [accessClubWarningType, setAccessClubWarningType] = useState("");
  const [teamProfileStatus, setTeamProfileStatus] = useState("idle");
  const [teamProfileMessage, setTeamProfileMessage] = useState("");
  const [canManageTeamProfile, setCanManageTeamProfile] = useState(false);
  const [teamProfile, setTeamProfile] = useState(null);
  const [teamProfileDraft, setTeamProfileDraft] = useState({
    country: "",
    teamLevel: "",
    teamDescription: "",
    contactNote: "",
    active: true,
  });
  const [teamNeeds, setTeamNeeds] = useState([]);
  const [teamNeedDraft, setTeamNeedDraft] = useState({
    needType: "PLAYER",
    neededCount: 1,
    needText: "",
    visibility: "internal",
    needContext: "general",
  });
  const [tournamentAdDraft, setTournamentAdDraft] = useState({
    needType: "PLAYER",
    neededCount: 1,
    needText: "",
    tournamentId: "",
    className: "",
    squadLabel: "",
    deadlineAt: "",
  });
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [showTeamNeedForm, setShowTeamNeedForm] = useState(false);
  const [showTournamentAdForm, setShowTournamentAdForm] = useState(false);
  const [showTournamentPlanForm, setShowTournamentPlanForm] = useState(false);
  const [visibleTeamNeeds, setVisibleTeamNeeds] = useState([]);
  const [visibleTeamNeedsStatus, setVisibleTeamNeedsStatus] = useState("idle");
  const [teamInterestDrafts, setTeamInterestDrafts] = useState({});
  const [teamInterestOpenNeedId, setTeamInterestOpenNeedId] = useState("");
  const [teamInterestStatus, setTeamInterestStatus] = useState("idle");
  const [teamInterestMessage, setTeamInterestMessage] = useState("");
  const [myTeamNeedInterests, setMyTeamNeedInterests] = useState([]);
  const [captainTeamNeedInterests, setCaptainTeamNeedInterests] = useState([]);
  const [teamInterestUpdatingId, setTeamInterestUpdatingId] = useState("");
  const [expandedTeamNeedInterestId, setExpandedTeamNeedInterestId] =
    useState("");
  const [loadingTeamNeedInterestId, setLoadingTeamNeedInterestId] =
    useState("");
  const [lastTeamNeedInterestAutoLoadKey, setLastTeamNeedInterestAutoLoadKey] =
    useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [confirmedTeams, setConfirmedTeams] = useState([]);
  const [, setTeamMemberStatus] = useState("idle");
  const [teamMemberMessage, setTeamMemberMessage] = useState("");
  const [teamMemberUpdatingId, setTeamMemberUpdatingId] = useState("");
  const [adminTeamProfiles, setAdminTeamProfiles] = useState([]);
  const [adminTeamProfileStatus, setAdminTeamProfileStatus] = useState("idle");
  const [adminTeamProfileMessage, setAdminTeamProfileMessage] = useState("");
  const [adminTeamProfileUpdatingId, setAdminTeamProfileUpdatingId] =
    useState("");
  const [adminTeamNeedInterests, setAdminTeamNeedInterests] = useState([]);
  const [adminTeamNeedInterestStatus, setAdminTeamNeedInterestStatus] =
    useState("idle");
  const [adminTeamMembers, setAdminTeamMembers] = useState([]);
  const [adminTeamMembersStatus, setAdminTeamMembersStatus] = useState("idle");
  const [adminTeamMemberUpdatingId, setAdminTeamMemberUpdatingId] =
    useState("");
  const [teamMembershipRequests, setTeamMembershipRequests] = useState([]);
  const [captainMembershipRequests, setCaptainMembershipRequests] = useState(
    []
  );
  const [adminTeamMembershipRequests, setAdminTeamMembershipRequests] =
    useState([]);
  const [, setTeamMembershipStatus] = useState("idle");
  const [teamMembershipMessage, setTeamMembershipMessage] = useState("");
  const [teamMembershipUpdatingId, setTeamMembershipUpdatingId] =
    useState("");
  const [adminTeamMembershipStatus, setAdminTeamMembershipStatus] =
    useState("idle");
  const [teamIdentityRequests, setTeamIdentityRequests] = useState([]);
  const [teamIdentityStatus, setTeamIdentityStatus] = useState("idle");
  const [teamIdentityMessage, setTeamIdentityMessage] = useState("");
  const [showTeamIdentityRequestForm, setShowTeamIdentityRequestForm] =
    useState(false);
  const [teamIdentityDraft, setTeamIdentityDraft] = useState({
    requestedName: "",
    requestedCountry: "",
    requestedCity: "",
    reason: "",
  });
  const [adminTeamIdentityRequests, setAdminTeamIdentityRequests] = useState(
    []
  );
  const [adminTeamIdentityStatus, setAdminTeamIdentityStatus] =
    useState("idle");
  const [adminTeamIdentityMessage, setAdminTeamIdentityMessage] = useState("");
  const [adminTeamIdentityUpdatingId, setAdminTeamIdentityUpdatingId] =
    useState("");
  const [adminTeamIdentityNotes, setAdminTeamIdentityNotes] = useState({});
  const [tournamentPlans, setTournamentPlans] = useState([]);
  const [playerTournamentAvailability, setPlayerTournamentAvailability] =
    useState([]);
  const [playerTournamentSquadPlanning, setPlayerTournamentSquadPlanning] =
    useState([]);
  const [captainTournamentAvailability, setCaptainTournamentAvailability] =
    useState([]);
  const [tournamentAvailabilityDrafts, setTournamentAvailabilityDrafts] =
    useState({});
  const [, setLastAnsweredTournamentAvailabilityId] = useState("");
  const [tournamentPlanDraft, setTournamentPlanDraft] = useState({
    tournamentId: "",
    squadLabel: "TEAM_PLANNING",
    customSquadLabel: "",
    className: "",
    deadlineAt: "",
    note: "",
  });
  const [tournamentPlanStatus, setTournamentPlanStatus] = useState("idle");
  const [tournamentPlanMessage, setTournamentPlanMessage] = useState("");
  const [tournamentPlanUpdatingId, setTournamentPlanUpdatingId] = useState("");
  const [expandedTournamentPlanId, setExpandedTournamentPlanId] = useState("");
  const [expandedEventCommentPlanId, setExpandedEventCommentPlanId] =
    useState("");
  const [eventCommentsByPlanId, setEventCommentsByPlanId] = useState({});
  const [eventCommentDrafts, setEventCommentDrafts] = useState({});
  const [eventCommentStatusByPlanId, setEventCommentStatusByPlanId] =
    useState({});
  const [captainTournamentSquadPlanning, setCaptainTournamentSquadPlanning] =
    useState([]);
  const [expandedSquadPlanId, setExpandedSquadPlanId] = useState("");
  const [expandedSquadPendingPlanId, setExpandedSquadPendingPlanId] =
    useState("");
  const [squadPlanningUpdatingId, setSquadPlanningUpdatingId] = useState("");
  const [captainRosterDraftsByPlanId, setCaptainRosterDraftsByPlanId] =
    useState({});
  const [squadDisplayNameDraftsByPlanId, setSquadDisplayNameDraftsByPlanId] = useState(
    () => readStoredSquadDisplayNames(username)
  );
  const [squadNameEditingByPlanId, setSquadNameEditingByPlanId] = useState({});
  const [squadNamesSavingPlanId, setSquadNamesSavingPlanId] = useState("");
  const [rosterDraftUpdatingPlanId, setRosterDraftUpdatingPlanId] =
    useState("");
  const [rosterDraftMessage, setRosterDraftMessage] = useState("");
  const [submitRosterConfirmPlanId, setSubmitRosterConfirmPlanId] =
    useState("");
  const [playerTournamentRosterStatus, setPlayerTournamentRosterStatus] =
    useState([]);
  const [adminTournamentRosterDrafts, setAdminTournamentRosterDrafts] =
    useState([]);
  const [adminTournamentRosterStatus, setAdminTournamentRosterStatus] =
    useState("idle");
  const [adminRosterReviewNotes, setAdminRosterReviewNotes] = useState({});
  const [adminRosterReviewUpdatingId, setAdminRosterReviewUpdatingId] =
    useState("");
  const [adminRosterReviewMessage, setAdminRosterReviewMessage] = useState("");
  const [openAdminPanel, setOpenAdminPanel] = useState("");
  const [activeHubTab, setActiveHubTab] = useState(() =>
    isAdmin ? "admin" : "home"
  );
  const [adminCounts, setAdminCounts] = useState(null);
  const [snapshotInitialLoadComplete, setSnapshotInitialLoadComplete] =
    useState(false);
  const hasProfilePreview = Boolean(
      savedProfilePreview.profileId ||
      savedProfilePreview.displayName ||
      savedProfilePreview.clubTeamId ||
      savedProfilePreview.clubTeamName ||
      savedProfilePreview.teamNote ||
      savedProfilePreview.clubOrTeam ||
      savedProfilePreview.country ||
      savedProfilePreview.availability ||
      savedProfilePreview.freeAgent ||
      savedProfilePreview.canGuestForTeams ||
      savedProfilePreview.interestedAbroad ||
      savedProfilePreview.publicVisible ||
      savedProfilePreview.approved
  );
  const activeClubTeamIds = new Set(
    clubTeams.map((team) => String(team.teamId || ""))
  );
  const mySelectedTeamNoLongerActive = Boolean(
    myProfile.clubTeamId &&
      !myProfile.freeAgent &&
      clubTeamsStatus === "ready" &&
      !activeClubTeamIds.has(String(myProfile.clubTeamId || ""))
  );
  const savedSelectedTeamNoLongerActive = Boolean(
    savedProfilePreview.clubTeamId &&
      !savedProfilePreview.freeAgent &&
      clubTeamsStatus === "ready" &&
      !activeClubTeamIds.has(String(savedProfilePreview.clubTeamId || ""))
  );
  const previewClubStatus = savedProfilePreview.freeAgent
    ? "No fixed club/team"
    : savedSelectedTeamNoLongerActive
      ? "Selected team is no longer active. Choose another or use no fixed club/team."
    : savedProfilePreview.clubTeamName ||
      savedProfilePreview.teamNote ||
      "Not listed / no fixed team";
  const previewDisplayName =
    savedProfilePreview.displayName || "Unnamed player";
  const previewInitial = (previewDisplayName || username || "?")
    .trim()
    .slice(0, 1)
    .toUpperCase();
  const needsClubTeamSetup = Boolean(
    !savedProfilePreview.freeAgent && !savedProfilePreview.clubTeamId
  );
  const profileEditorOpen =
    showProfileEditor || (!hasProfilePreview && profileStatus !== "loading");
  const accessRequestSummary = accessRequestCards.map((card) => {
    const latest = accessRequests.find(
      (request) => request.requestType === card.type
    );
    return {
      ...card,
      latest,
      label: accessRequestLabel(card.type),
    };
  });
  const selectedProfileTeamName =
    !savedProfilePreview.freeAgent && savedProfilePreview.clubTeamId
      ? savedProfilePreview.clubTeamName || savedProfilePreview.clubTeamId
      : "";
  const selectedProfileClubTeamId =
    !savedProfilePreview.freeAgent && savedProfilePreview.clubTeamId
      ? String(savedProfilePreview.clubTeamId || "")
      : "";
  const selectedOfficialClubTeam = clubTeams.find(
    (team) => String(team.teamId || "") === selectedProfileClubTeamId
  );
  const currentTeamIdentity = {
    name:
      teamProfile?.clubTeamName ||
      selectedOfficialClubTeam?.name ||
      selectedProfileTeamName ||
      "",
    country:
      teamProfile?.country ||
      selectedOfficialClubTeam?.country ||
      savedProfilePreview.country ||
      "",
    city: selectedOfficialClubTeam?.city || "",
  };
  const pendingTeamIdentityRequest = teamIdentityRequests.find(
    (request) =>
      request.status === "PENDING" &&
      selectedProfileClubTeamId &&
      String(request.teamId || "") === selectedProfileClubTeamId
  );
  const confirmedTeamForSelected = confirmedTeams.find(
    (team) =>
      team.memberStatus === "ACTIVE" &&
      selectedProfileClubTeamId &&
      String(team.clubTeamId || "") === selectedProfileClubTeamId
  );
  const membershipRequestsForSelectedTeam = teamMembershipRequests
    .filter(
      (request) =>
        selectedProfileClubTeamId &&
        String(request.clubTeamId || "") === selectedProfileClubTeamId
    )
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.requestedAt || a.createdAt || "") || 0;
      const bTime = Date.parse(b.updatedAt || b.requestedAt || b.createdAt || "") || 0;
      return bTime - aTime;
    });
  const latestTeamMembershipRequest =
    membershipRequestsForSelectedTeam[0] || null;
  const pendingCaptainMembershipRequests = captainMembershipRequests.filter(
    (request) =>
      request.status === "PENDING" && !request.alreadyConfirmed
  );
  const openTeamNeeds = teamNeeds.filter((need) => need.status === "OPEN");
  const myInterestStatusByNeedId = myTeamNeedInterests.reduce((map, interest) => {
    const needId = String(interest.needId || "");
    if (!needId) return map;
    if (!map[needId]) map[needId] = interest.status || "PENDING";
    return map;
  }, {});
  const captainInterestsByNeedId = captainTeamNeedInterests.reduce(
    (map, interest) => {
      const needId = String(interest.needId || "");
      if (!needId) return map;
      if (!map[needId]) map[needId] = [];
      map[needId].push(interest);
      return map;
    },
    {}
  );
  const activeTeamMemberByInterestId = teamMembers.reduce((map, member) => {
    const sourceInterestId = String(member.sourceInterestId || "");
    if (sourceInterestId && member.memberStatus === "ACTIVE") {
      map[sourceInterestId] = member;
    }
    return map;
  }, {});
  const activeTeamMemberByPlayerUsername = teamMembers.reduce((map, member) => {
    const playerUsername = String(member.playerUsername || "").toLowerCase();
    if (playerUsername && member.memberStatus === "ACTIVE") {
      map[playerUsername] = member;
    }
    return map;
  }, {});
  const captainAvailabilityByPlanId = captainTournamentAvailability.reduce(
    (map, item) => {
      const planId = String(item.planId || "");
      if (!planId) return map;
      if (!map[planId]) map[planId] = [];
      map[planId].push(item);
      return map;
    },
    {}
  );
  const squadPlanningByPlanId = captainTournamentSquadPlanning.reduce(
    (map, item) => {
      const planId = String(item.planId || "");
      if (!planId) return map;
      if (!map[planId]) map[planId] = [];
      map[planId].push(item);
      return map;
    },
    {}
  );
  const expandedSquadPlan = tournamentPlans.find(
    (plan) => String(plan.planId || "") === String(expandedSquadPlanId || "")
  );
  const expandedSquadAvailability = expandedSquadPlan
    ? captainAvailabilityByPlanId[expandedSquadPlan.planId] || []
    : [];
  const expandedSquadPlanning = expandedSquadPlan
    ? squadPlanningByPlanId[expandedSquadPlan.planId] || []
    : [];
  const loadAdminReviewProfiles = useCallback(async () => {
    if (!isAdmin || !loadPlayerProfilesForAdmin) {
      setAdminProfiles([]);
      setAdminReviewStatus("idle");
      setAdminReviewMessage("");
      return;
    }

    const startedAt = startPlayerHubTimer();
    setAdminReviewStatus("loading");
    setAdminReviewMessage("Loading player profiles...");

    try {
      const profiles = await loadPlayerProfilesForAdmin();
      setAdminProfiles(Array.isArray(profiles) ? profiles : []);
      setAdminReviewStatus("ready");
      setAdminReviewMessage("");
    } catch (error) {
      setAdminReviewStatus("error");
      setAdminReviewMessage(
        cleanPlayerHubError(error, "Could not load this section. Refresh.")
      );
    } finally {
      logPlayerHubTiming("adminReview load", startedAt);
    }
  }, [isAdmin, loadPlayerProfilesForAdmin]);

  const loadActiveClubTeams = useCallback(async () => {
    if (!loadClubTeams) {
      setClubTeams([]);
      setClubTeamsStatus("idle");
      setClubTeamsMessage("");
      return;
    }

    const startedAt = startPlayerHubTimer();
    setClubTeamsStatus("loading");
    setClubTeamsMessage("");

    try {
      const teams = await loadClubTeams();
      setClubTeams(Array.isArray(teams) ? teams : []);
      setClubTeamsStatus("ready");
    } catch (error) {
      setClubTeams([]);
      setClubTeamsStatus("error");
      setClubTeamsMessage(
        cleanPlayerHubError(error, "Could not load this section. Refresh.")
      );
    } finally {
      logPlayerHubTiming("availableClubs load", startedAt);
    }
  }, [loadClubTeams]);

  const loadAdminClubTeams = useCallback(async () => {
    if (!isAdmin || !loadClubTeamsAdmin) {
      setAdminClubTeams([]);
      setAdminClubTeamsStatus("idle");
      setAdminClubTeamsMessage("");
      return;
    }

    const startedAt = startPlayerHubTimer();
    setAdminClubTeamsStatus("loading");
    setAdminClubTeamsMessage("Loading official clubs/teams...");

    try {
      const teams = await loadClubTeamsAdmin();
      setAdminClubTeams(Array.isArray(teams) ? teams : []);
      setAdminClubTeamsStatus("ready");
      setAdminClubTeamsMessage("");
    } catch (error) {
      setAdminClubTeamsStatus("error");
      setAdminClubTeamsMessage(
        cleanPlayerHubError(error, "Could not load this section. Refresh.")
      );
    } finally {
      logPlayerHubTiming("adminClubs load", startedAt);
    }
  }, [isAdmin, loadClubTeamsAdmin]);

  const loadAccessRequests = useCallback(async () => {
    if (!loadMyAccessRequests) {
      setAccessRequests([]);
      setAccessRequestsStatus("idle");
      setAccessRequestsMessage("");
      return;
    }

    const startedAt = startPlayerHubTimer();
    setAccessRequestsStatus("loading");
    setAccessRequestsMessage("");

    try {
      const requests = await loadMyAccessRequests();
      setAccessRequests(Array.isArray(requests) ? requests : []);
      setAccessRequestsStatus("ready");
    } catch (error) {
      setAccessRequestsStatus("error");
      setAccessRequestsMessage(
        cleanPlayerHubError(error, "Could not load this section. Refresh.")
      );
    } finally {
      logPlayerHubTiming("accessRequests load", startedAt);
    }
  }, [loadMyAccessRequests]);

  const loadAdminAccessRequests = useCallback(async () => {
    if (!isAdmin || !loadAccessRequestsAdmin) {
      setAdminAccessRequests([]);
      setAdminAccessRequestsStatus("idle");
      setAdminAccessRequestsMessage("");
      return;
    }

    const startedAt = startPlayerHubTimer();
    setAdminAccessRequestsStatus("loading");
    setAdminAccessRequestsMessage("");

    try {
      const requests = await loadAccessRequestsAdmin();
      setAdminAccessRequests(Array.isArray(requests) ? requests : []);
      setAdminAccessRequestsStatus("ready");
    } catch (error) {
      setAdminAccessRequestsStatus("error");
      setAdminAccessRequestsMessage(
        cleanPlayerHubError(error, "Could not load this section. Refresh.")
      );
    } finally {
      logPlayerHubTiming("adminAccess load", startedAt);
    }
  }, [isAdmin, loadAccessRequestsAdmin]);

  const loadTeamProfile = useCallback(async () => {
    if (!loadMyTeamProfile) {
      setCanManageTeamProfile(false);
      setTeamProfile(null);
      setTeamNeeds([]);
      setTeamProfileStatus("idle");
      setTeamProfileMessage("");
      return;
    }

    const startedAt = startPlayerHubTimer();
    setTeamProfileStatus("loading");
    setTeamProfileMessage("");

    try {
      const data = await loadMyTeamProfile();
      const nextTeamProfile = data?.teamProfile || null;
      setCanManageTeamProfile(!!data?.canManageTeamProfile);
      setTeamProfile(nextTeamProfile);
      setTeamNeeds(Array.isArray(data?.needs) ? data.needs : []);
      setCaptainTeamNeedInterests(
        Array.isArray(data?.interests) ? data.interests : []
      );
      setTeamProfileDraft({
        country: nextTeamProfile?.country || savedProfilePreview.country || "",
        teamLevel: nextTeamProfile?.teamLevel || "",
        teamDescription: nextTeamProfile?.teamDescription || "",
        contactNote: nextTeamProfile?.contactNote || "",
        active: nextTeamProfile?.active !== false,
      });
      setTeamProfileStatus("ready");
      setTeamProfileMessage(data?.message || "");
    } catch (error) {
      setCanManageTeamProfile(false);
      setTeamProfileStatus("error");
      setTeamProfileMessage(
        cleanPlayerHubError(error, "Could not load this section. Refresh.")
      );
    } finally {
      logPlayerHubTiming("teamProfile load", startedAt);
    }
  }, [loadMyTeamProfile, savedProfilePreview.country]);

  const loadTeamNeeds = useCallback(async () => {
    if (!loadVisibleTeamNeeds) {
      setVisibleTeamNeeds([]);
      setVisibleTeamNeedsStatus("idle");
      return;
    }

    const startedAt = startPlayerHubTimer();
    setVisibleTeamNeedsStatus("loading");
    try {
      const needs = await loadVisibleTeamNeeds();
      setVisibleTeamNeeds(Array.isArray(needs) ? needs : []);
      setVisibleTeamNeedsStatus("ready");
    } catch (error) {
      setVisibleTeamNeeds([]);
      setVisibleTeamNeedsStatus("error");
    } finally {
      logPlayerHubTiming("teamNeeds load", startedAt);
    }
  }, [loadVisibleTeamNeeds]);

  const loadMyInterests = useCallback(async () => {
    if (!loadMyTeamNeedInterests) {
      setMyTeamNeedInterests([]);
      return;
    }

    try {
      const interests = await loadMyTeamNeedInterests();
      setMyTeamNeedInterests(Array.isArray(interests) ? interests : []);
    } catch (error) {
      setMyTeamNeedInterests([]);
    }
  }, [loadMyTeamNeedInterests]);

  const loadCaptainInterests = useCallback(async (needId = "") => {
    if (!canManageTeamProfile || !loadTeamNeedInterestsForCaptain) {
      setCaptainTeamNeedInterests([]);
      return;
    }

    try {
      const interests = await loadTeamNeedInterestsForCaptain(needId);
      const nextInterests = Array.isArray(interests) ? interests : [];
      if (needId) {
        setCaptainTeamNeedInterests((current) => [
          ...current.filter(
            (interest) => String(interest.needId || "") !== String(needId)
          ),
          ...nextInterests,
        ]);
      } else {
        setCaptainTeamNeedInterests(nextInterests);
      }
      return nextInterests;
    } catch (error) {
      if (!needId) {
        setCaptainTeamNeedInterests([]);
      }
      return [];
    }
  }, [canManageTeamProfile, loadTeamNeedInterestsForCaptain]);

  const loadCaptainInterestsForNeed = useCallback(
    async (needId, autoLoadKey = "") => {
      const targetNeedId = String(needId || "");
      if (!targetNeedId) return [];

      setLoadingTeamNeedInterestId(targetNeedId);
      if (autoLoadKey) {
        setLastTeamNeedInterestAutoLoadKey(autoLoadKey);
      }

      try {
        return await loadCaptainInterests(targetNeedId);
      } finally {
        setLoadingTeamNeedInterestId((current) =>
          current === targetNeedId ? "" : current
        );
      }
    },
    [loadCaptainInterests]
  );

  const loadCaptainTeamMembers = useCallback(async () => {
    if (!canManageTeamProfile || !loadMyTeamMembersForCaptain) {
      setTeamMembers([]);
      return [];
    }

    const startedAt = startPlayerHubTimer();
    try {
      const members = await loadMyTeamMembersForCaptain();
      const nextMembers = Array.isArray(members) ? members : [];
      setTeamMembers(nextMembers);
      return nextMembers;
    } catch (error) {
      setTeamMembers([]);
      return [];
    } finally {
      logPlayerHubTiming("teamMembers load", startedAt);
    }
  }, [canManageTeamProfile, loadMyTeamMembersForCaptain]);

  const loadConfirmedTeams = useCallback(async () => {
    if (!loadMyConfirmedTeamsForPlayer) {
      setConfirmedTeams([]);
      return [];
    }

    try {
      const teams = await loadMyConfirmedTeamsForPlayer();
      const nextTeams = Array.isArray(teams) ? teams : [];
      setConfirmedTeams(nextTeams);
      return nextTeams;
    } catch (error) {
      setConfirmedTeams([]);
      return [];
    }
  }, [loadMyConfirmedTeamsForPlayer]);

  const loadAdminTeamProfiles = useCallback(async () => {
    if (!isAdmin || !loadTeamProfilesAdmin) {
      setAdminTeamProfiles([]);
      setAdminTeamProfileStatus("idle");
      setAdminTeamProfileMessage("");
      return;
    }

    const startedAt = startPlayerHubTimer();
    setAdminTeamProfileStatus("loading");
    setAdminTeamProfileMessage("");
    try {
      const profiles = await loadTeamProfilesAdmin();
      setAdminTeamProfiles(Array.isArray(profiles) ? profiles : []);
      setAdminTeamProfileStatus("ready");
    } catch (error) {
      setAdminTeamProfileStatus("error");
      setAdminTeamProfileMessage(
        cleanPlayerHubError(error, "Could not load this section. Refresh.")
      );
    } finally {
      logPlayerHubTiming("adminTeamProfiles load", startedAt);
    }
  }, [isAdmin, loadTeamProfilesAdmin]);

  const loadAdminTeamNeedInterests = useCallback(async () => {
    if (!isAdmin || !loadTeamNeedInterestsAdmin) {
      setAdminTeamNeedInterests([]);
      setAdminTeamNeedInterestStatus("idle");
      return;
    }

    const startedAt = startPlayerHubTimer();
    setAdminTeamNeedInterestStatus("loading");
    try {
      const interests = await loadTeamNeedInterestsAdmin();
      setAdminTeamNeedInterests(Array.isArray(interests) ? interests : []);
      setAdminTeamNeedInterestStatus("ready");
    } catch (error) {
      setAdminTeamNeedInterests([]);
      setAdminTeamNeedInterestStatus("error");
    } finally {
      logPlayerHubTiming("adminTeamNeeds load", startedAt);
    }
  }, [isAdmin, loadTeamNeedInterestsAdmin]);

  const loadAdminTeamMembers = useCallback(async () => {
    if (!isAdmin || !loadTeamMembersAdmin) {
      setAdminTeamMembers([]);
      setAdminTeamMembersStatus("idle");
      return [];
    }

    const startedAt = startPlayerHubTimer();
    setAdminTeamMembersStatus("loading");
    try {
      const members = await loadTeamMembersAdmin();
      const nextMembers = Array.isArray(members) ? members : [];
      setAdminTeamMembers(nextMembers);
      setAdminTeamMembersStatus("ready");
      return nextMembers;
    } catch (error) {
      setAdminTeamMembers([]);
      setAdminTeamMembersStatus("error");
      return [];
    } finally {
      logPlayerHubTiming("adminTeamMembers load", startedAt);
    }
  }, [isAdmin, loadTeamMembersAdmin]);

  const loadTeamMembershipRequests = useCallback(async () => {
    if (!loadMyTeamMembershipRequests) {
      setTeamMembershipRequests([]);
      return [];
    }

    try {
      const requests = await loadMyTeamMembershipRequests();
      const nextRequests = Array.isArray(requests) ? requests : [];
      setTeamMembershipRequests(nextRequests);
      return nextRequests;
    } catch (error) {
      setTeamMembershipRequests([]);
      return [];
    }
  }, [loadMyTeamMembershipRequests]);

  const loadCaptainMembershipRequests = useCallback(async () => {
    if (!canManageTeamProfile || !loadMembershipRequestsForCaptain) {
      setCaptainMembershipRequests([]);
      return [];
    }

    try {
      const requests = await loadMembershipRequestsForCaptain();
      const nextRequests = Array.isArray(requests) ? requests : [];
      setCaptainMembershipRequests(nextRequests);
      return nextRequests;
    } catch (error) {
      setCaptainMembershipRequests([]);
      return [];
    }
  }, [canManageTeamProfile, loadMembershipRequestsForCaptain]);

  const loadTeamIdentityRequests = useCallback(async () => {
    if (!canManageTeamProfile || !loadTeamIdentityChangeRequests) {
      setTeamIdentityRequests([]);
      setTeamIdentityStatus("idle");
      setTeamIdentityMessage("");
      return [];
    }

    setTeamIdentityStatus("loading");
    try {
      const requests = await loadTeamIdentityChangeRequests();
      const nextRequests = Array.isArray(requests) ? requests : [];
      setTeamIdentityRequests(nextRequests);
      setTeamIdentityStatus("ready");
      setTeamIdentityMessage("");
      return nextRequests;
    } catch (error) {
      if (String(error?.message || "").toLowerCase().includes("unknown action")) {
        setTeamIdentityRequests([]);
        setTeamIdentityStatus("ready");
        setTeamIdentityMessage("");
        return [];
      }

      setTeamIdentityRequests([]);
      setTeamIdentityStatus("error");
      setTeamIdentityMessage(
        cleanPlayerHubError(error, "Could not load this section. Refresh.")
      );
      return [];
    }
  }, [canManageTeamProfile, loadTeamIdentityChangeRequests]);

  const loadAdminTeamMembershipRequests = useCallback(async () => {
    if (!isAdmin || !loadTeamMembershipRequestsAdmin) {
      setAdminTeamMembershipRequests([]);
      setAdminTeamMembershipStatus("idle");
      return [];
    }

    const startedAt = startPlayerHubTimer();
    setAdminTeamMembershipStatus("loading");
    try {
      const requests = await loadTeamMembershipRequestsAdmin();
      const nextRequests = Array.isArray(requests) ? requests : [];
      setAdminTeamMembershipRequests(nextRequests);
      setAdminTeamMembershipStatus("ready");
      return nextRequests;
    } catch (error) {
      setAdminTeamMembershipRequests([]);
      setAdminTeamMembershipStatus("error");
      return [];
    } finally {
      logPlayerHubTiming("adminMembershipRequests load", startedAt);
    }
  }, [isAdmin, loadTeamMembershipRequestsAdmin]);

  const loadAdminTeamIdentityRequests = useCallback(async () => {
    if (!isAdmin || !loadTeamIdentityChangeRequests) {
      setAdminTeamIdentityRequests([]);
      setAdminTeamIdentityStatus("idle");
      setAdminTeamIdentityMessage("");
      return [];
    }

    const startedAt = startPlayerHubTimer();
    setAdminTeamIdentityStatus("loading");
    setAdminTeamIdentityMessage("");
    try {
      const requests = await loadTeamIdentityChangeRequests();
      const nextRequests = Array.isArray(requests) ? requests : [];
      setAdminTeamIdentityRequests(nextRequests);
      setAdminTeamIdentityStatus("ready");
      return nextRequests;
    } catch (error) {
      if (String(error?.message || "").toLowerCase().includes("unknown action")) {
        setAdminTeamIdentityRequests([]);
        setAdminTeamIdentityStatus("ready");
        setAdminTeamIdentityMessage("");
        return [];
      }

      setAdminTeamIdentityRequests([]);
      setAdminTeamIdentityStatus("error");
      setAdminTeamIdentityMessage(
        cleanPlayerHubError(error, "Could not load this section. Refresh.")
      );
      return [];
    } finally {
      logPlayerHubTiming("adminIdentityRequests load", startedAt);
    }
  }, [isAdmin, loadTeamIdentityChangeRequests]);

  const loadTournamentPlans = useCallback(async () => {
    if (!canManageTeamProfile || !loadMyTournamentTeamPlansForCaptain) {
      setTournamentPlans([]);
      return [];
    }

    const startedAt = startPlayerHubTimer();
    try {
      const plans = await loadMyTournamentTeamPlansForCaptain();
      const nextPlans = Array.isArray(plans) ? plans : [];
      setTournamentPlans(nextPlans);
      return nextPlans;
    } catch (error) {
      setTournamentPlans([]);
      return [];
    } finally {
      logPlayerHubTiming("tournamentPlans load", startedAt);
    }
  }, [canManageTeamProfile, loadMyTournamentTeamPlansForCaptain]);

  const loadPlayerTournamentAvailability = useCallback(async () => {
    if (!loadMyTournamentAvailabilityForPlayer) {
      setPlayerTournamentAvailability([]);
      return [];
    }

    const startedAt = startPlayerHubTimer();
    try {
      const availability = await loadMyTournamentAvailabilityForPlayer();
      const nextAvailability = Array.isArray(availability) ? availability : [];
      setPlayerTournamentAvailability(nextAvailability);
      return nextAvailability;
    } catch (error) {
      setPlayerTournamentAvailability([]);
      return [];
    } finally {
      logPlayerHubTiming("playerAvailability load", startedAt);
    }
  }, [loadMyTournamentAvailabilityForPlayer]);

  const loadPlayerTournamentSquadPlanning = useCallback(async () => {
    if (!loadMyTournamentSquadPlanningForPlayer) {
      setPlayerTournamentSquadPlanning([]);
      return [];
    }

    const startedAt = startPlayerHubTimer();
    try {
      const planning = await loadMyTournamentSquadPlanningForPlayer();
      const nextPlanning = Array.isArray(planning) ? planning : [];
      setPlayerTournamentSquadPlanning(nextPlanning);
      return nextPlanning;
    } catch (error) {
      setPlayerTournamentSquadPlanning([]);
      return [];
    } finally {
      logPlayerHubTiming("playerSquadPlanning load", startedAt);
    }
  }, [loadMyTournamentSquadPlanningForPlayer]);

  const loadCaptainTournamentAvailability = useCallback(
    async (planId) => {
      const targetPlanId = String(planId || "");
      if (!targetPlanId || !loadTournamentAvailabilityForCaptain) return [];

      try {
        const data = await loadTournamentAvailabilityForCaptain(targetPlanId);
        const availability = Array.isArray(data?.availability)
          ? data.availability
          : [];
        setCaptainTournamentAvailability((current) => [
          ...current.filter(
            (item) => String(item.planId || "") !== targetPlanId
          ),
          ...availability,
        ]);
        if (data?.plan) {
          setTournamentPlans((current) =>
            current.map((plan) =>
              String(plan.planId || "") === String(data.plan.planId || "")
                ? data.plan
                : plan
            )
          );
        }
        return availability;
      } catch (error) {
        return [];
      }
    },
    [loadTournamentAvailabilityForCaptain]
  );

  const loadSquadPlanningForPlan = useCallback(
    async (planId) => {
      const targetPlanId = String(planId || "");
      if (!targetPlanId || !loadTournamentSquadPlanningForCaptain) {
        return { planning: [], availability: [] };
      }

      try {
        const data = await loadTournamentSquadPlanningForCaptain(targetPlanId);
        const planning = Array.isArray(data?.planning) ? data.planning : [];
        const availability = Array.isArray(data?.availability)
          ? data.availability
          : [];

        setCaptainTournamentSquadPlanning((current) => [
          ...current.filter(
            (item) => String(item.planId || "") !== targetPlanId
          ),
          ...planning,
        ]);
        setCaptainTournamentAvailability((current) => [
          ...current.filter(
            (item) => String(item.planId || "") !== targetPlanId
          ),
          ...availability,
        ]);
        if (data?.plan) {
          setTournamentPlans((current) =>
            current.map((plan) =>
              String(plan.planId || "") === String(data.plan.planId || "")
                ? data.plan
                : plan
            )
          );
        }

        return { planning, availability };
      } catch (error) {
        return { planning: [], availability: [] };
      }
    },
    [loadTournamentSquadPlanningForCaptain]
  );

  const loadRosterDraftForPlan = useCallback(
    async (planId) => {
      const targetPlanId = String(planId || "");
      if (!targetPlanId || !loadRosterDraftForCaptain) {
        return { roster: null, players: [] };
      }

      try {
        const data = await loadRosterDraftForCaptain(targetPlanId);
        const roster = data?.roster || null;
        const players = Array.isArray(data?.players) ? data.players : [];
        setCaptainRosterDraftsByPlanId((current) => ({
          ...current,
          [targetPlanId]: { roster, players },
        }));
        return { roster, players };
      } catch (error) {
        setCaptainRosterDraftsByPlanId((current) => ({
          ...current,
          [targetPlanId]: { roster: null, players: [] },
        }));
        return { roster: null, players: [] };
      }
    },
    [loadRosterDraftForCaptain]
  );

  const loadPlayerRosterStatus = useCallback(async () => {
    if (!loadMyRosterStatusForPlayer) {
      setPlayerTournamentRosterStatus([]);
      return [];
    }

    const startedAt = startPlayerHubTimer();
    try {
      const rosters = await loadMyRosterStatusForPlayer();
      const nextRosters = Array.isArray(rosters) ? rosters : [];
      setPlayerTournamentRosterStatus(nextRosters);
      return nextRosters;
    } catch (error) {
      setPlayerTournamentRosterStatus([]);
      return [];
    } finally {
      logPlayerHubTiming("rosterDraft/player load", startedAt);
    }
  }, [loadMyRosterStatusForPlayer]);

  const loadAdminRosterDrafts = useCallback(async () => {
    if (!canReviewRosterDrafts || !loadRosterDraftAdmin) {
      setAdminTournamentRosterDrafts([]);
      setAdminTournamentRosterStatus("idle");
      return [];
    }

    const startedAt = startPlayerHubTimer();
    setAdminTournamentRosterStatus("loading");
    try {
      const rosters = await loadRosterDraftAdmin();
      const nextRosters = Array.isArray(rosters) ? rosters : [];
      setAdminTournamentRosterDrafts(nextRosters);
      setAdminTournamentRosterStatus("ready");
      return nextRosters;
    } catch (error) {
      setAdminTournamentRosterDrafts([]);
      setAdminTournamentRosterStatus("error");
      return [];
    } finally {
      logPlayerHubTiming("rosterDraft/review load", startedAt);
    }
  }, [canReviewRosterDrafts, loadRosterDraftAdmin]);

  const loadPlayerProfile = useCallback(async () => {
    if (!loadMyPlayerProfile) {
      setProfileStatus("ready");
      setProfileMessage("");
      return null;
    }

    const startedAt = startPlayerHubTimer();
    setProfileStatus("loading");
    setProfileMessage(copy.profileLoading);

    try {
      const loadedProfile = await loadMyPlayerProfile();
      const normalizedProfile = normalizePlayerHubProfile({
        ...getPlayerHubProfileDefaults(),
        username,
        ...(loadedProfile || {}),
      });
      setMyProfile(normalizedProfile);
      setSavedProfilePreview(normalizedProfile);
      setProfileStatus("ready");
      setProfileMessage("");
      return normalizedProfile;
    } catch (error) {
      setProfileStatus("error");
      setProfileMessage(cleanPlayerHubError(error, copy.profileLoadFailed));
      return null;
    } finally {
      logPlayerHubTiming("loadProfile", startedAt);
    }
  }, [copy.profileLoadFailed, copy.profileLoading, loadMyPlayerProfile, username]);

  const applyPlayerHubSnapshot = useCallback(
    (snapshot) => {
      const safeSnapshot = snapshot || {};
      const normalizedProfile = normalizePlayerHubProfile({
        ...getPlayerHubProfileDefaults(),
        username,
        ...(safeSnapshot.profile || {}),
      });
      const captain = safeSnapshot.captainTeamControl || {};
      const nextTeamProfile = captain.teamProfile || null;

      setMyProfile(normalizedProfile);
      setSavedProfilePreview(normalizedProfile);
      setProfileStatus("ready");
      setProfileMessage("");

      setClubTeams(
        Array.isArray(safeSnapshot.availableClubs)
          ? safeSnapshot.availableClubs
          : []
      );
      setClubTeamsStatus("ready");
      setClubTeamsMessage("");

      setAccessRequests(
        Array.isArray(safeSnapshot.accessRequests)
          ? safeSnapshot.accessRequests
          : []
      );
      setAccessRequestsStatus("ready");
      setAccessRequestsMessage("");

      setVisibleTeamNeeds(
        Array.isArray(safeSnapshot.teamNeeds) ? safeSnapshot.teamNeeds : []
      );
      setVisibleTeamNeedsStatus("ready");
      setMyTeamNeedInterests(
        Array.isArray(safeSnapshot.myTeamNeedInterests)
          ? safeSnapshot.myTeamNeedInterests
          : []
      );
      setConfirmedTeams(
        Array.isArray(safeSnapshot.myTeams) ? safeSnapshot.myTeams : []
      );
      setTeamMembershipRequests(
        Array.isArray(safeSnapshot.teamMembershipRequests)
          ? safeSnapshot.teamMembershipRequests
          : []
      );
      setPlayerTournamentAvailability(
        Array.isArray(safeSnapshot.tournamentAvailability)
          ? safeSnapshot.tournamentAvailability
          : []
      );
      setPlayerTournamentSquadPlanning(
        Array.isArray(safeSnapshot.plannedTeams)
          ? safeSnapshot.plannedTeams
          : []
      );
      setPlayerTournamentRosterStatus(
        Array.isArray(safeSnapshot.rosterDraftsForPlayer)
          ? safeSnapshot.rosterDraftsForPlayer
          : []
      );

      setCanManageTeamProfile(!!captain.canManageTeamProfile);
      setTeamProfile(nextTeamProfile);
      setTeamNeeds(Array.isArray(captain.needs) ? captain.needs : []);
      setCaptainTeamNeedInterests(
        Array.isArray(captain.interests) ? captain.interests : []
      );
      setTeamMembers(Array.isArray(captain.members) ? captain.members : []);
      setCaptainMembershipRequests(
        Array.isArray(captain.membershipRequests)
          ? captain.membershipRequests
          : []
      );
      setTeamIdentityRequests(
        Array.isArray(captain.identityRequests) ? captain.identityRequests : []
      );
      setTournamentPlans(
        Array.isArray(captain.tournamentPlans) ? captain.tournamentPlans : []
      );
      setCaptainRosterDraftsByPlanId(
        captain.rosterDraftsByPlanId && typeof captain.rosterDraftsByPlanId === "object"
          ? captain.rosterDraftsByPlanId
          : {}
      );
      setTeamProfileStatus("ready");
      setTeamProfileMessage(captain.message || "");
      setTeamProfileDraft({
        country: nextTeamProfile?.country || normalizedProfile.country || "",
        teamLevel: nextTeamProfile?.teamLevel || "",
        teamDescription: nextTeamProfile?.teamDescription || "",
        contactNote: nextTeamProfile?.contactNote || "",
        active: nextTeamProfile?.active !== false,
      });

      setAdminCounts(safeSnapshot.adminCounts || null);
      setSnapshotInitialLoadComplete(true);
    },
    [username]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialPlayerHub() {
      if (loadPlayerHubSnapshot) {
        const snapshotStartedAt = startPlayerHubTimer();
        try {
          const snapshot = await loadPlayerHubSnapshot();
          if (cancelled) return;
          if (!isUsablePlayerHubSnapshot(snapshot)) {
            throw new Error("Incomplete Player Hub snapshot");
          }
          logPlayerHubTiming("snapshot request", snapshotStartedAt);
          applyPlayerHubSnapshot(snapshot);
          logPlayerHubTiming("render ready", snapshotStartedAt);
          return;
        } catch (error) {
          logPlayerHubTiming("snapshot failed", snapshotStartedAt);
        }
      }

      if (cancelled) return;
      setSnapshotInitialLoadComplete(false);
      const fallbackStartedAt = startPlayerHubTimer();
      Promise.allSettled([
        loadPlayerProfile(),
        loadActiveClubTeams(),
        loadAccessRequests(),
        loadTeamProfile(),
        loadTeamNeeds(),
        loadMyInterests(),
        loadConfirmedTeams(),
        loadTeamMembershipRequests(),
        loadPlayerTournamentAvailability(),
        loadPlayerTournamentSquadPlanning(),
        loadPlayerRosterStatus(),
      ]).finally(() => {
        if (!cancelled) {
          logPlayerHubTiming("fallback load", fallbackStartedAt);
        }
      });
    }

    loadInitialPlayerHub();

    return () => {
      cancelled = true;
    };
  }, [
    applyPlayerHubSnapshot,
    loadAccessRequests,
    loadActiveClubTeams,
    loadConfirmedTeams,
    loadPlayerHubSnapshot,
    loadPlayerProfile,
    loadMyInterests,
    loadPlayerRosterStatus,
    loadPlayerTournamentAvailability,
    loadPlayerTournamentSquadPlanning,
    loadTeamMembershipRequests,
    loadTeamNeeds,
    loadTeamProfile,
  ]);

  useEffect(() => {
    setSquadDisplayNameDraftsByPlanId(readStoredSquadDisplayNames(username));
  }, [username]);

  useEffect(() => {
    writeStoredSquadDisplayNames(username, squadDisplayNameDraftsByPlanId);
  }, [squadDisplayNameDraftsByPlanId, username]);

  useEffect(() => {
    if (!canManageTeamProfile || snapshotInitialLoadComplete) return;

    const startedAt = startPlayerHubTimer();
    Promise.allSettled([
      loadCaptainInterests(),
      loadCaptainTeamMembers(),
      loadCaptainMembershipRequests(),
      loadTeamIdentityRequests(),
      loadTournamentPlans(),
    ]).finally(() => {
      logPlayerHubTiming("captain details", startedAt);
    });
  }, [
    canManageTeamProfile,
    loadCaptainInterests,
    loadCaptainMembershipRequests,
    loadCaptainTeamMembers,
    loadTeamIdentityRequests,
    loadTournamentPlans,
    snapshotInitialLoadComplete,
  ]);

  useEffect(() => {
    const needId = String(expandedTeamNeedInterestId || "");
    if (!needId || loadingTeamNeedInterestId === needId) return;

    const expandedNeed = teamNeeds.find(
      (need) => String(need.needId || "") === needId
    );
    if (!expandedNeed) return;

    const existingInterests = captainTeamNeedInterests.filter(
      (interest) => String(interest.needId || "") === needId
    );
    if (existingInterests.length) return;

    const stats = teamNeedCounters(expandedNeed);
    if (!stats.acceptedCount && !stats.pendingCount) return;

    const autoLoadKey = `${needId}:${stats.acceptedCount}:${stats.pendingCount}`;
    if (lastTeamNeedInterestAutoLoadKey === autoLoadKey) return;

    loadCaptainInterestsForNeed(needId, autoLoadKey);
  }, [
    captainTeamNeedInterests,
    expandedTeamNeedInterestId,
    lastTeamNeedInterestAutoLoadKey,
    loadCaptainInterestsForNeed,
    loadingTeamNeedInterestId,
    teamNeeds,
  ]);

  useEffect(() => {
    if (!isAdmin && !canReviewRosterDrafts) {
      setOpenAdminPanel("");
    }
  }, [canReviewRosterDrafts, isAdmin]);

  function updateMyProfileField(field, value) {
    setMyProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clubTeamDisplayName(team) {
    if (!team) return "";
    const location = [team.city, team.country]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");
    return location ? `${team.name} - ${location}` : team.name;
  }

  function handleClubTeamSelection(teamId) {
    const selectedTeam = clubTeams.find(
      (team) => String(team.teamId || "") === String(teamId || "")
    );

    setAccessClubWarningType("");
    setMyProfile((current) => ({
      ...current,
      clubTeamId: selectedTeam ? selectedTeam.teamId : "",
      clubTeamName: selectedTeam ? selectedTeam.name : "",
      freeAgent: selectedTeam ? false : true,
    }));
  }

  function toggleNoFixedClubTeam(checked) {
    setAccessClubWarningType("");
    setMyProfile((current) => ({
      ...current,
      freeAgent: checked,
      ...(checked ? { clubTeamId: "", clubTeamName: "" } : {}),
    }));
  }

  function resetAdminClubTeamDraft() {
    setAdminClubTeamDraft({
      teamId: "",
      name: "",
      country: "",
      city: "",
      active: true,
    });
  }

  function updateAdminClubTeamDraft(field, value) {
    setAdminClubTeamDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveAdminClubTeam(event) {
    event.preventDefault();
    if (!isAdmin || !saveClubTeamAdmin) return;

    const name = String(adminClubTeamDraft.name || "").trim();
    if (!name) {
      setAdminClubTeamsStatus("error");
      setAdminClubTeamsMessage("Club/team name is required.");
      return;
    }

    setAdminClubTeamsStatus("saving");
    setAdminClubTeamsMessage("");

    try {
      const savedTeam = await saveClubTeamAdmin({
        ...adminClubTeamDraft,
        name,
      });
      if (savedTeam) {
        setAdminClubTeams((current) => {
          const savedKey = String(savedTeam.teamId || "");
          const exists = current.some(
            (team) => String(team.teamId || "") === savedKey
          );
          const next = exists
            ? current.map((team) =>
                String(team.teamId || "") === savedKey ? savedTeam : team
              )
            : [savedTeam, ...current];
          return next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        });
      }
      resetAdminClubTeamDraft();
      setAdminClubTeamsStatus("ready");
      setAdminClubTeamsMessage("Official club/team saved.");
      await loadActiveClubTeams();
    } catch (error) {
      setAdminClubTeamsStatus("error");
      setAdminClubTeamsMessage(
        cleanPlayerHubError(error, "Could not save club/team.")
      );
    }
  }

  async function updateAdminClubTeamActive(team, active) {
    if (!isAdmin || !updateClubTeamActiveAdmin || !team?.teamId) return;

    setAdminClubTeamUpdatingId(team.teamId);
    setAdminClubTeamsMessage("");

    try {
      const updatedTeam = await updateClubTeamActiveAdmin(team.teamId, active);
      if (updatedTeam) {
        setAdminClubTeams((current) =>
          current.map((item) =>
            String(item.teamId || "") === String(updatedTeam.teamId || "")
              ? updatedTeam
              : item
          )
        );
      }
      setAdminClubTeamsStatus("ready");
      setAdminClubTeamsMessage(
        active ? "Club/team reactivated." : "Club/team deactivated."
      );
      await loadActiveClubTeams();
    } catch (error) {
      setAdminClubTeamsStatus("error");
      setAdminClubTeamsMessage(
        cleanPlayerHubError(error, "Could not update club/team.")
      );
    } finally {
      setAdminClubTeamUpdatingId("");
    }
  }

  function accessRequestLabel(type) {
    if (type === "CAPTAIN") return "Captain";
    if (type === "TRAINER") return "Trainer";
    if (type === "ORGANIZER") return "Organizer";
    return type || "Access";
  }

  function accessRequestShortLabel(type) {
    if (type === "CAPTAIN") return "team contact";
    if (type === "TRAINER") return "team builder";
    if (type === "ORGANIZER") return "tournaments";
    return "approval";
  }

  function formatAccessRequestStatus(status) {
    if (status === "PENDING") return "Pending";
    if (status === "APPROVED") return "Approved";
    if (status === "ACCEPTED") return "Accepted";
    if (status === "DECLINED") return "Declined";
    if (status === "CANCELLED") return "Cancelled";
    if (status === "REJECTED") return "Rejected";
    return "Not requested";
  }

  function formatTeamMembershipStatus(status) {
    if (status === "PENDING") return "Pending captain approval";
    if (status === "APPROVED") return "Confirmed team";
    if (status === "REJECTED") return "Team request rejected";
    if (status === "CANCELLED") return "Cancelled";
    return "Not requested";
  }

  function accessRequestActionText(status, isSubmitting) {
    if (isSubmitting) return "Sending...";
    if (status === "PENDING") return "Pending";
    if (status === "APPROVED") return "Approved";
    if (status === "REJECTED") return "Request again";
    return "Request";
  }

  function accessRequestStatusStyle(status) {
    if (status === "APPROVED" || status === "ACCEPTED") {
      return playerHubStyles.accessStatusApproved;
    }
    if (status === "REJECTED" || status === "DECLINED") {
      return playerHubStyles.accessStatusRejected;
    }
    if (status === "PENDING") return playerHubStyles.accessStatusPending;
    return playerHubStyles.accessStatusIdle;
  }

  function selectedProfileClubForRequest() {
    if (savedProfilePreview.freeAgent || !savedProfilePreview.clubTeamId) {
      return {
        clubTeamId: "",
        clubTeamName: "",
      };
    }

    return {
      clubTeamId: savedProfilePreview.clubTeamId,
      clubTeamName: savedProfilePreview.clubTeamName,
    };
  }

  async function submitAccessRequest(requestType) {
    if (!createAccessRequest || accessRequestSubmittingType) return;

    const clubPayload = selectedProfileClubForRequest();
    setAccessRequestSubmittingType(requestType);
    setAccessRequestsStatus("saving");
    setAccessRequestsMessage("");

    try {
      const request = await createAccessRequest({
        requestType,
        ...clubPayload,
        message: accessRequestMessageDraft,
      });
      if (request) {
        setAccessRequests((current) => [request, ...current]);
      }
      setAccessRequestMessageDraft("");
      setAccessRequestsStatus("ready");
      setAccessRequestsMessage("Access request sent for admin review.");
      setPendingAccessRequestType("");
      setAccessClubWarningType("");
      await loadAccessRequests();
    } catch (error) {
      setAccessRequestsStatus("error");
      setAccessRequestsMessage(
        cleanPlayerHubError(error, "Could not create access request.")
      );
    } finally {
      setAccessRequestSubmittingType("");
    }
  }

  async function handleAccessRequestCardClick(card) {
    if (!card) return;

    const latestStatus = card.latest?.status || "";
    const requestDisabled =
      Boolean(accessRequestSubmittingType) ||
      latestStatus === "PENDING" ||
      latestStatus === "APPROVED";

    if (requestDisabled) return;

    if (
      needsClubTeamSetup &&
      (card.type === "CAPTAIN" || card.type === "TRAINER")
    ) {
      setAccessClubWarningType(card.type);
      return;
    }

    setAccessClubWarningType("");
    setPendingAccessRequestType(card.type);
    setAccessRequestMessageDraft("");
  }

  function cancelPendingAccessRequest() {
    setPendingAccessRequestType("");
    setAccessClubWarningType("");
    setAccessRequestMessageDraft("");
  }

  function updateAdminAccessRequestNote(request, value) {
    const key = String(request?.requestId || "");
    if (!key) return;

    setAdminAccessRequestNotes((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function reviewAdminAccessRequest(request, status) {
    if (!isAdmin || !reviewAccessRequestAdmin || !request?.requestId) return;

    const key = String(request.requestId || "");
    const adminNote = adminAccessRequestNotes[key] || "";
    setAdminAccessRequestUpdatingId(key);
    setAdminAccessRequestsMessage("");

    try {
      const updatedRequest = await reviewAccessRequestAdmin(
        request.requestId,
        status,
        adminNote
      );
      if (updatedRequest) {
        setAdminAccessRequests((current) =>
          current.map((item) =>
            String(item.requestId || "") === key ? updatedRequest : item
          )
        );
      }
      setAdminAccessRequestsStatus("ready");
      setAdminAccessRequestsMessage(
        status === "APPROVED"
          ? "Access request approved."
          : "Access request rejected."
      );
      await loadAdminAccessRequests();
      await loadAccessRequests();
    } catch (error) {
      setAdminAccessRequestsStatus("error");
      setAdminAccessRequestsMessage(
        cleanPlayerHubError(error, "Could not review access request.")
      );
    } finally {
      setAdminAccessRequestUpdatingId("");
    }
  }

  async function refreshMembershipAfterProfileSave(profile) {
    const shouldRequestMembership = Boolean(
      profile?.clubTeamId && !profile?.freeAgent
    );

    if (shouldRequestMembership && createOrUpdateTeamMembershipRequest) {
      try {
        const data = await createOrUpdateTeamMembershipRequest(
          profile.clubTeamId
        );
        if (Array.isArray(data?.requests)) {
          setTeamMembershipRequests(data.requests);
        } else {
          await loadTeamMembershipRequests();
        }
      } catch (error) {
        await loadTeamMembershipRequests();
      }
    } else {
      await loadTeamMembershipRequests();
    }

    await loadConfirmedTeams();
    await loadCaptainMembershipRequests();
    await loadAdminTeamMembershipRequests();
  }

  async function handleSaveMyProfile(event) {
    event.preventDefault();
    if (!saveMyPlayerProfile || profileStatus === "saving") return;

    setProfileStatus("saving");
    setProfileMessage(copy.profileSaving);

    try {
      const savedProfile = await saveMyPlayerProfile(myProfile);
      const normalizedProfile = normalizePlayerHubProfile({
        ...myProfile,
        ...(savedProfile || {}),
        username,
      });
      setMyProfile(normalizedProfile);
      setSavedProfilePreview(normalizedProfile);
      setProfileStatus("ready");
      setProfileMessage(copy.profileSaved);
      setShowProfileEditor(false);
      try {
        await refreshMembershipAfterProfileSave(normalizedProfile);
      } catch {
        setProfileMessage(copy.profileSaved);
      }
    } catch (error) {
      setProfileStatus("error");
      setProfileMessage(cleanPlayerHubError(error, copy.profileSaveFailed));
    }
  }

  async function handleSaveTeamSetup(event) {
    event.preventDefault();
    if (!saveMyPlayerProfile || profileStatus === "saving") return;

    setProfileStatus("saving");
    setProfileMessage("Saving club/team...");

    try {
      const savedProfile = await saveMyPlayerProfile(myProfile);
      const normalizedProfile = normalizePlayerHubProfile({
        ...myProfile,
        ...(savedProfile || {}),
        username,
      });
      setMyProfile(normalizedProfile);
      setSavedProfilePreview(normalizedProfile);
      setProfileStatus("ready");
      setProfileMessage("Club/team saved.");
      try {
        await refreshMembershipAfterProfileSave(normalizedProfile);
      } catch {
        setProfileMessage("Club/team saved.");
      }
    } catch (error) {
      setProfileStatus("error");
      setProfileMessage(cleanPlayerHubError(error, copy.profileSaveFailed));
    }
  }

  function updateTeamProfileDraft(field, value) {
    setTeamProfileDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateTeamNeedDraft(field, value) {
    setTeamNeedDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateTournamentAdDraft(field, value) {
    setTournamentAdDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function teamNeedTypeLabel(type) {
    if (type === "SUBSTITUTE") return "Substitute";
    if (type === "TRAINING_PLAYER") return "Training player";
    return "Player";
  }

  function isPublishedTournamentNeed(need) {
    return (
      String(need?.visibility || "").toLowerCase() === "published" &&
      String(need?.needContext || "").toLowerCase() === "tournament" &&
      (need?.isPublished === true ||
        String(need?.isPublished || "").toLowerCase() === "true") &&
      Boolean(need?.tournamentId || need?.tournamentName)
    );
  }

  function teamNeedContextLabel(need) {
    if (isPublishedTournamentNeed(need)) return "Tournament ad";
    if (String(need?.needContext || "").toLowerCase() === "training") {
      return "Training";
    }
    return "Internal";
  }

  function teamNeedContextChipStyle(need) {
    if (isPublishedTournamentNeed(need)) return playerHubStyles.tournamentAdChip;
    if (String(need?.needContext || "").toLowerCase() === "training") {
      return playerHubStyles.trainingNeedChip;
    }
    return playerHubStyles.internalNeedChip;
  }

  function tournamentAdNeedWord(needType, count) {
    if (needType === "SUBSTITUTE") {
      return `substitute${Number(count) === 1 ? "" : "s"}`;
    }
    if (needType === "TRAINING_PLAYER") {
      return `training player${Number(count) === 1 ? "" : "s"}`;
    }
    return `player${Number(count) === 1 ? "" : "s"}`;
  }

  function teamNeedCounters(need, interests = []) {
    const count = Math.max(1, Number(need?.neededCount) || 1);
    const acceptedFromInterests = interests.filter(
      (interest) => interest.status === "ACCEPTED"
    ).length;
    const pendingFromInterests = interests.filter(
      (interest) => interest.status === "PENDING"
    ).length;
    const hasInterestRows = Array.isArray(interests) && interests.length > 0;
    const acceptedCount = hasInterestRows
      ? acceptedFromInterests
      : Number.isFinite(Number(need?.acceptedCount))
      ? Number(need.acceptedCount)
      : acceptedFromInterests;
    const pendingCount = hasInterestRows
      ? pendingFromInterests
      : Number.isFinite(Number(need?.pendingCount))
      ? Number(need.pendingCount)
      : pendingFromInterests;
    const remainingCount = Math.max(count - acceptedCount, 0);

    return {
      neededCount: count,
      acceptedCount,
      pendingCount,
      remainingCount,
      filled: remainingCount <= 0,
    };
  }

  function teamNeedSummary(need, teamName = "") {
    const { neededCount } = teamNeedCounters(need);
    const prefix = teamName ? `${teamName} ` : "";
    if (need?.needType === "SUBSTITUTE") {
      return teamName
        ? `${prefix}needs ${neededCount} substitute${
            neededCount === 1 ? "" : "s"
          }`
        : `Need ${neededCount} substitute${neededCount === 1 ? "" : "s"}`;
    }
    if (need?.needType === "TRAINING_PLAYER") {
      return `${prefix}${teamName ? "is looking" : "Looking"} for ${
        neededCount === 1 ? "a" : neededCount
      } training player${neededCount === 1 ? "" : "s"}`;
    }
    return teamName
      ? `${prefix}needs ${neededCount} player${
          neededCount === 1 ? "" : "s"
        }`
      : `Need ${neededCount} player${neededCount === 1 ? "" : "s"}`;
  }

  function teamNeedStatLabels(need, interests = []) {
    const counters = teamNeedCounters(need, interests);
    return {
      ...counters,
      acceptedLabel: `Accepted ${counters.acceptedCount} / ${counters.neededCount}`,
      pendingLabel: `Pending ${counters.pendingCount}`,
      remainingLabel: counters.filled
        ? "Filled"
        : `${counters.remainingCount} spot${
            counters.remainingCount === 1 ? "" : "s"
          } left`,
    };
  }

  function tournamentOptionLabel(option) {
    if (!option) return "Tournament";
    const parts = [option.name, option.startDate, option.location]
      .map((part) => String(part || "").trim())
      .filter(Boolean);
    return parts.join(" - ");
  }

  function normalizeTournamentAvailabilityStatus(status) {
    const value = String(status || "").trim().toUpperCase();
    if (value === "YES" || value === "NO" || value === "MAYBE") return value;
    return "PENDING";
  }

  function formatPlayerAvailabilityStatus(status) {
    const value = normalizeTournamentAvailabilityStatus(status);
    if (value === "YES") return "Going";
    if (value === "NO") return "Not going";
    if (value === "MAYBE") return "Maybe";
    return "Pending";
  }

  function formatCompactDate(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    return text.split("T")[0].split(" ")[0];
  }

  function formatPreferredSquadForEvent(value, source) {
    const key = normalizeCaptainSquadNameKey(value);
    if (!key) return "";
    return squadPreferenceLabel(key, source);
  }

  function shortAccountName(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (text.includes("@")) return text.split("@")[0];
    return text;
  }

  function tournamentAvailabilityStatusStyle(status) {
    const value = normalizeTournamentAvailabilityStatus(status);
    if (value === "YES") return playerHubStyles.accessStatusApproved;
    if (value === "NO") return playerHubStyles.accessStatusRejected;
    if (value === "MAYBE") return playerHubStyles.accessStatusPending;
    return playerHubStyles.accessStatusIdle;
  }

  function normalizeAssignedSquad(value) {
    const text = String(value || "").trim().toUpperCase();
    if (text === "A" || text === "B" || text === "C" || text === "RESERVE") {
      return text;
    }
    return "UNASSIGNED";
  }

  function isNeutralPlanLabel(label) {
    const value = String(label || "").trim().toUpperCase();
    return !value || value === "TEAM_PLANNING" || value === "ALL";
  }

  function compactPlanMeta(plan) {
    const parts = [];
    if (plan?.className) parts.push(plan.className);
    if (plan?.deadlineAt) parts.push(`deadline ${formatCompactDate(plan.deadlineAt)}`);
    if (!isNeutralPlanLabel(plan?.squadLabel)) {
      parts.push(`label ${plan.squadLabel}`);
    }
    return parts.join(" / ");
  }

  function normalizeRosterStatus(status) {
    const value = String(status || "").trim().toUpperCase();
    if (
      value === "SUBMITTED" ||
      value === "APPROVED" ||
      value === "REJECTED" ||
      value === "LOCKED" ||
      value === "CHANGE_REQUESTED" ||
      value === "CANCELLED"
    ) {
      return value;
    }
    return "DRAFT";
  }

  function formatRosterStatus(status) {
    const value = normalizeRosterStatus(status);
    if (value === "SUBMITTED") return "Submitted";
    if (value === "APPROVED") return "Approved";
    if (value === "REJECTED") return "Rejected";
    if (value === "LOCKED") return "Locked";
    if (value === "CHANGE_REQUESTED") return "Change requested";
    if (value === "CANCELLED") return "Cancelled";
    return "Draft";
  }

  function rosterStatusStyle(status) {
    const value = normalizeRosterStatus(status);
    if (value === "APPROVED" || value === "LOCKED") {
      return playerHubStyles.accessStatusApproved;
    }
    if (value === "SUBMITTED" || value === "CHANGE_REQUESTED") {
      return playerHubStyles.accessStatusPending;
    }
    if (value === "REJECTED") return playerHubStyles.accessStatusRejected;
    if (value === "CANCELLED") return playerHubStyles.accessStatusRejected;
    return playerHubStyles.accessStatusIdle;
  }

  function tournamentPlanStats(plan, availability = []) {
    const summary = plan?.responseSummary || {};
    const summaryStats = {
      yes: Number(summary.yes) || 0,
      maybe: Number(summary.maybe) || 0,
      no: Number(summary.no) || 0,
      pending: Number(summary.pending) || 0,
      total: Number(summary.total) || 0,
    };
    const hasSummary =
      summaryStats.total > 0 ||
      summaryStats.yes > 0 ||
      summaryStats.maybe > 0 ||
      summaryStats.no > 0 ||
      summaryStats.pending > 0;
    if (hasSummary) return summaryStats;

    const hasRows = Array.isArray(availability) && availability.length > 0;
    if (!hasRows) {
      return summaryStats;
    }

    return availability.reduce(
      (stats, item) => {
        stats.total += 1;
        const status = normalizeTournamentAvailabilityStatus(item.responseStatus);
        if (status === "YES") stats.yes += 1;
        else if (status === "MAYBE") stats.maybe += 1;
        else if (status === "NO") stats.no += 1;
        else stats.pending += 1;
        return stats;
      },
      { yes: 0, maybe: 0, no: 0, pending: 0, total: 0 }
    );
  }

  function updateTournamentPlanDraft(field, value) {
    setTournamentPlanDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateTournamentAvailabilityDraft(availabilityId, field, value) {
    const key = String(availabilityId || "");
    setTournamentAvailabilityDrafts((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        [field]: value,
      },
    }));
  }

  function availabilityDraftValue(item, field, fallback = "") {
    const draft = tournamentAvailabilityDrafts[String(item?.availabilityId || "")] || {};
    return draft[field] !== undefined ? draft[field] : item?.[field] || fallback;
  }

  function eventPlanId(event) {
    return String(event?.planId || event?.sourcePlanId || event?.eventId || "");
  }

  function squadNamesFromSource(source = {}) {
    return [
      source?.squadLabels,
      source?.squadDisplayNames,
      source?.squadNames,
      source?.customSquadNames,
      source?.teamNames,
      source?.roster?.squadLabels,
      source?.roster?.squadDisplayNames,
      source?.roster?.squadNames,
    ].reduce(
      (names, value) => ({
        ...names,
        ...normalizeSquadDisplayNames(value),
      }),
      {}
    );
  }

  function squadDisplayNamesForSource(source = {}) {
    const planId = eventPlanId(source);
    return {
      ...squadNamesFromSource(source),
      ...(planId ? squadDisplayNameDraftsByPlanId[planId] || {} : {}),
    };
  }

  function squadNameEditorValues(plan = {}) {
    const planId = eventPlanId(plan);
    const persisted = squadNamesFromSource(plan);
    const draft = planId ? squadDisplayNameDraftsByPlanId[planId] || {} : {};
    return captainSquadNameSlots.reduce((values, squad) => {
      values[squad] = Object.prototype.hasOwnProperty.call(draft, squad)
        ? draft[squad]
        : persisted[squad] || "";
      return values;
    }, {});
  }

  function squadLabelsSignature(labels) {
    const normalized = normalizeSquadDisplayNames(labels);
    return captainSquadNameSlots
      .map((squad) => `${squad}:${normalized[squad] || ""}`)
      .join("|");
  }

  function hasSquadNameDraft(plan = {}) {
    const planId = eventPlanId(plan);
    return Boolean(planId && squadDisplayNameDraftsByPlanId[planId]);
  }

  function squadNameEditorHasChanges(plan = {}) {
    return (
      squadLabelsSignature(squadNameEditorValues(plan)) !==
      squadLabelsSignature(squadNamesFromSource(plan))
    );
  }

  function squadDisplayName(assignedSquad, source = {}) {
    const key = normalizeCaptainSquadNameKey(assignedSquad);
    if (!key) return fallbackSquadDisplayName(assignedSquad);
    const names = squadDisplayNamesForSource(source);
    return passportText(names[key], fallbackSquadDisplayName(key));
  }

  function tournamentOptionForSource(source = {}) {
    const tournamentId = String(source?.tournamentId || source?.id || "").trim();
    if (!tournamentId) return null;
    return (
      (Array.isArray(tournamentOptions) ? tournamentOptions : []).find(
        (option) => String(option?.id || option?.tournamentId || "") === tournamentId
      ) || null
    );
  }

  function rosterLockForSource(source = {}) {
    return resolveRosterLockForSource(source, tournamentOptionForSource(source) || {});
  }

  function rosterLockChipText(source = {}) {
    const lock = rosterLockForSource(source);
    if (!lock.enabled || !lock.deadlineIso) return "";
    if (lock.afterDeadline) return "After deadline";
    return rosterLockLabel(lock);
  }

  function squadPreferenceLabel(assignedSquad, source = {}) {
    const key = normalizeCaptainSquadNameKey(assignedSquad);
    if (!key) return "";
    return `Preferred: ${squadDisplayName(key, source)}`;
  }

  function squadNameEditingSlot(plan = {}) {
    const planId = eventPlanId(plan);
    return planId ? squadNameEditingByPlanId[planId] || "" : "";
  }

  function toggleSquadNameEdit(plan, squad) {
    const planId = eventPlanId(plan);
    const key = normalizeCaptainSquadNameKey(squad);
    if (!planId || !key) return;
    setSquadNameEditingByPlanId((current) => ({
      ...current,
      [planId]: current[planId] === key ? "" : key,
    }));
  }

  function updateSquadDisplayName(plan, squad, value) {
    const planId = eventPlanId(plan);
    const key = normalizeCaptainSquadNameKey(squad);
    if (!planId || !key) return;
    const text = String(value || "").trimStart();
    setSquadDisplayNameDraftsByPlanId((current) => {
      const currentPlanNames = current[planId] || {};
      const nextPlanNames = { ...currentPlanNames, [key]: text };

      const next = { ...current };
      next[planId] = nextPlanNames;
      return next;
    });
  }

  function resetSquadDisplayName(plan, squad) {
    updateSquadDisplayName(plan, squad, "");
  }

  function applySquadNameSuggestion(plan, squad, suffix) {
    const planId = eventPlanId(plan);
    const key = normalizeCaptainSquadNameKey(squad);
    if (!planId || !key) return;
    updateSquadDisplayName(
      plan,
      key,
      squadNameSuggestionForSuffix(
        plan.clubTeamName || teamProfile?.clubTeamName || selectedProfileTeamName,
        suffix
      )
    );
    setSquadNameEditingByPlanId((current) => ({
      ...current,
      [planId]: key,
    }));
  }

  function resetSquadDisplayNames(plan) {
    const planId = eventPlanId(plan);
    if (!planId) return;
    setSquadDisplayNameDraftsByPlanId((current) => {
      const next = { ...current };
      delete next[planId];
      return next;
    });
    setSquadNameEditingByPlanId((current) => {
      const next = { ...current };
      delete next[planId];
      return next;
    });
  }

  async function saveSquadDisplayNames(plan) {
    const planId = eventPlanId(plan);
    if (!updateTournamentSquadLabels || !planId) return;

    setSquadNamesSavingPlanId(planId);
    setTournamentPlanMessage("");

    try {
      const squadLabels = normalizeSquadDisplayNames(squadNameEditorValues(plan));
      const data = await updateTournamentSquadLabels(planId, squadLabels);
      if (Array.isArray(data?.plans) && data.plans.length) {
        setTournamentPlans(data.plans);
      } else if (data?.plan) {
        setTournamentPlans((current) =>
          current.map((item) =>
            String(item.planId || "") === String(data.plan.planId || "")
              ? data.plan
              : item
          )
        );
      }
      if (data?.roster || Array.isArray(data?.players)) {
        setCaptainRosterDraftsByPlanId((current) => ({
          ...current,
          [planId]: {
            roster: data?.roster || current[planId]?.roster || null,
            players: Array.isArray(data?.players)
              ? data.players
              : current[planId]?.players || [],
          },
        }));
      }
      resetSquadDisplayNames(plan);
      setTournamentPlanStatus("ready");
      setTournamentPlanMessage("Squad names saved.");
      await loadTournamentPlans();
      if (expandedSquadPlanId === planId) {
        await loadSquadPlanningForPlan(planId);
        await loadRosterDraftForPlan(planId);
      }
      await loadPlayerTournamentAvailability();
      await loadPlayerTournamentSquadPlanning();
      await loadPlayerRosterStatus();
      await loadAdminRosterDrafts();
    } catch (error) {
      setTournamentPlanStatus("error");
      setTournamentPlanMessage(
        cleanPlayerHubError(error, "Could not save squad names.")
      );
    } finally {
      setSquadNamesSavingPlanId("");
    }
  }

  function eventIdentityKey(event) {
    const planId = eventPlanId(event).trim().toLowerCase();
    if (planId) return `plan:${planId}`;

    const tournament = String(
      event?.tournamentId || event?.tournamentName || "tournament"
    )
      .trim()
      .toLowerCase();
    const team = String(
      event?.teamProfileId ||
        event?.clubTeamId ||
        event?.clubTeamName ||
        event?.teamName ||
        "team"
    )
      .trim()
      .toLowerCase();
    const squad = isNeutralPlanLabel(event?.squadLabel)
      ? "all"
      : String(event?.squadLabel || "all").trim().toLowerCase();

    return `event:${tournament}:${team}:${squad}`;
  }

  function mergeEventRows(current = {}, next = {}) {
    const merged = { ...current };
    Object.entries(next || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === "string" && !value.trim()) return;
      merged[key] = value;
    });
    return merged;
  }

  function uniqueEventItems(items = []) {
    const byEvent = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!item) return;
      const key = eventIdentityKey(item);
      byEvent.set(key, mergeEventRows(byEvent.get(key), item));
    });
    return Array.from(byEvent.values());
  }

  function playerEventBundleSortValue(bundle) {
    const base =
      bundle?.availability || bundle?.roster || bundle?.planning || bundle?.base || {};
    const availabilityStatus = normalizeTournamentAvailabilityStatus(
      bundle?.availability?.responseStatus || bundle?.planning?.availabilityStatus
    );
    const rosterStatus = normalizeRosterStatus(bundle?.roster?.rosterStatus);
    const priority =
      availabilityStatus === "PENDING"
        ? 400
        : rosterStatus === "LOCKED"
          ? 300
          : rosterStatus === "APPROVED" || rosterStatus === "SUBMITTED"
            ? 250
            : normalizeAssignedSquad(
                bundle?.planning?.assignedSquad || bundle?.roster?.assignedSquad
              ) !== "UNASSIGNED"
              ? 200
              : 100;
    const time = Date.parse(
      base.deadlineAt ||
        base.submittedAt ||
        base.lockedAt ||
        base.updatedAt ||
        base.createdAt ||
        ""
    );
    return priority * 10000000000000 + (Number.isNaN(time) ? 0 : time);
  }

  function buildPlayerEventBundles(availabilityItems, planningItems, rosterItems) {
    const byEvent = new Map();
    const ensureBundle = (item) => {
      const key = eventIdentityKey(item);
      const current = byEvent.get(key) || { key, base: {} };
      current.base = mergeEventRows(current.base, item);
      byEvent.set(key, current);
      return current;
    };

    (Array.isArray(availabilityItems) ? availabilityItems : []).forEach((item) => {
      const bundle = ensureBundle(item);
      bundle.availability = mergeEventRows(bundle.availability, item);
    });
    (Array.isArray(planningItems) ? planningItems : []).forEach((item) => {
      const bundle = ensureBundle(item);
      bundle.planning = mergeEventRows(bundle.planning, item);
    });
    (Array.isArray(rosterItems) ? rosterItems : []).forEach((item) => {
      const bundle = ensureBundle(item);
      bundle.roster = mergeEventRows(bundle.roster, item);
    });

    return Array.from(byEvent.values()).sort(
      (left, right) =>
        playerEventBundleSortValue(right) - playerEventBundleSortValue(left)
    );
  }

  function eventResponseActionLabel(status) {
    const value = normalizeTournamentAvailabilityStatus(status);
    if (value === "YES") return "Going";
    if (value === "MAYBE") return "Maybe";
    if (value === "NO") return "No";
    return "Pending";
  }

  function eventRosterForPlanId(planId) {
    const key = String(planId || "");
    const captainRoster = captainRosterDraftsByPlanId[key]?.roster;
    if (captainRoster) return captainRoster;
    return (
      playerTournamentRosterStatus.find(
        (roster) => String(roster.planId || "") === key
      ) || null
    );
  }

  function eventStatusForPlan(event) {
    const roster = eventRosterForPlanId(eventPlanId(event));
    const rosterStatus = normalizeRosterStatus(roster?.rosterStatus);
    if (roster && rosterStatus !== "CANCELLED") {
      return formatRosterStatus(rosterStatus);
    }
    const planStatus = String(event?.planStatus || "").trim().toUpperCase();
    if (planStatus === "READY") return "Ready";
    if (planStatus === "CANCELLED") return "Closed";
    return "Open";
  }

  function eventContextLabel(event) {
    const roster = eventRosterForPlanId(eventPlanId(event));
    const rosterStatus = normalizeRosterStatus(roster?.rosterStatus);
    if (roster && rosterStatus === "LOCKED") return "Locked roster";
    if (roster && rosterStatus === "APPROVED") return "Roster approved";
    if (roster && rosterStatus === "SUBMITTED") return "Roster submitted";
    if (roster && rosterStatus === "DRAFT") return "Roster draft";
    const planStatus = String(event?.planStatus || "").trim().toUpperCase();
    if (planStatus === "READY") return "Availability ready";
    if (planStatus === "CANCELLED") return "Closed event";
    return "Availability";
  }

  function eventStatusStyle(event) {
    const label = eventStatusForPlan(event).toUpperCase();
    if (label === "LOCKED" || label === "APPROVED" || label === "READY") {
      return playerHubStyles.accessStatusApproved;
    }
    if (label === "SUBMITTED" || label === "DRAFT" || label === "OPEN") {
      return playerHubStyles.accessStatusPending;
    }
    if (label === "CLOSED" || label === "REJECTED" || label === "CANCELLED") {
      return playerHubStyles.accessStatusRejected;
    }
    return playerHubStyles.accessStatusIdle;
  }

  function eventMetaText(event) {
    return [
      event?.clubTeamName || event?.teamName || "Team",
      event?.className || event?.seriesName || event?.seriesLabel || "",
      !isNeutralPlanLabel(event?.squadLabel) ? event.squadLabel : "",
      event?.deadlineAt ? `Deadline ${formatCompactDate(event.deadlineAt)}` : "",
    ]
      .filter(Boolean)
      .join(" / ");
  }

  function eventShortDateText(event) {
    const text = passportText(
      event?.startDate,
      event?.eventDate,
      event?.tournamentStartDate,
      event?.date,
      event?.deadlineAt
    );
    if (!text) return "";
    return formatCompactDate(text);
  }

  function responseStatsHaveCounts(stats) {
    return (
      Number(stats?.total || 0) > 0 ||
      Number(stats?.yes || 0) > 0 ||
      Number(stats?.maybe || 0) > 0 ||
      Number(stats?.no || 0) > 0 ||
      Number(stats?.pending || 0) > 0
    );
  }

  function openPlayerRosterView() {
    setActiveHubTab("players");
  }

  async function openCaptainPlanFromEvents(plan) {
    setActiveHubTab("team");
    await toggleTournamentSquadPlanning(plan);
  }

  function updateEventCommentDraft(planId, value) {
    const key = String(planId || "");
    setEventCommentDrafts((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function loadCommentsForEvent(event) {
    const planId = eventPlanId(event);
    if (!planId || !loadEventComments) return [];

    setEventCommentStatusByPlanId((current) => ({
      ...current,
      [planId]: "loading",
    }));

    try {
      const comments = await loadEventComments(planId);
      const safeComments = Array.isArray(comments) ? comments : [];
      setEventCommentsByPlanId((current) => ({
        ...current,
        [planId]: safeComments,
      }));
      setEventCommentStatusByPlanId((current) => ({
        ...current,
        [planId]: "ready",
      }));
      return safeComments;
    } catch (error) {
      setEventCommentStatusByPlanId((current) => ({
        ...current,
        [planId]: "error",
      }));
      return [];
    }
  }

  async function toggleEventComments(event) {
    const planId = eventPlanId(event);
    if (!planId) return;
    if (expandedEventCommentPlanId === planId) {
      setExpandedEventCommentPlanId("");
      return;
    }
    setExpandedEventCommentPlanId(planId);
    await loadCommentsForEvent(event);
  }

  async function submitEventComment(event) {
    const planId = eventPlanId(event);
    const message = String(eventCommentDrafts[planId] || "").trim();
    if (!planId || !message || !addEventComment) return;

    setEventCommentStatusByPlanId((current) => ({
      ...current,
      [planId]: "sending",
    }));

    try {
      const data = await addEventComment(planId, message);
      setEventCommentsByPlanId((current) => ({
        ...current,
        [planId]: Array.isArray(data?.comments)
          ? data.comments
          : data?.comment
            ? [...(current[planId] || []), data.comment]
            : current[planId] || [],
      }));
      setEventCommentDrafts((current) => ({
        ...current,
        [planId]: "",
      }));
      setEventCommentStatusByPlanId((current) => ({
        ...current,
        [planId]: "ready",
      }));
    } catch (error) {
      setEventCommentStatusByPlanId((current) => ({
        ...current,
        [planId]: "error",
      }));
    }
  }

  function renderEventStats(stats) {
    if (!responseStatsHaveCounts(stats)) return null;

    function eventStatTone(label) {
      const value = String(label || "").toLowerCase();
      if (value === "going") return playerHubStyles.eventStatGoing;
      if (value === "maybe") return playerHubStyles.eventStatMaybe;
      if (value === "no") return playerHubStyles.eventStatNo;
      if (value === "pending") return playerHubStyles.eventStatPending;
      return null;
    }

    return (
      <div style={playerHubStyles.eventStats}>
        {[
          ["Going", stats.yes || 0],
          ["Maybe", stats.maybe || 0],
          ["No", stats.no || 0],
          ["Pending", stats.pending || 0],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              ...playerHubStyles.eventStat,
              ...(eventStatTone(label) || {}),
            }}
          >
            <span style={playerHubStyles.eventStatValue}>{value}</span>
            <span style={playerHubStyles.eventStatLabel}>{label}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderEventCommentsDrawer(event) {
    const planId = eventPlanId(event);
    if (!planId || expandedEventCommentPlanId !== planId) return null;

    const comments = eventCommentsByPlanId[planId] || [];
    const status = eventCommentStatusByPlanId[planId] || "idle";
    const draft = eventCommentDrafts[planId] || "";
    const visibleComments = comments.slice(-2);

    return (
      <section style={playerHubStyles.eventCommentDrawer}>
        {status === "loading" ? (
          <span style={playerHubStyles.mutedLine}>Loading comments...</span>
        ) : visibleComments.length ? (
          visibleComments.map((comment) => (
            <article key={comment.commentId} style={playerHubStyles.commentRow}>
              <span style={playerHubStyles.commentAuthor}>
                {comment.displayName || comment.username || "Player"}
              </span>
              <span style={playerHubStyles.commentText}>{comment.message}</span>
            </article>
          ))
        ) : (
          <span style={playerHubStyles.mutedLine}>No comments yet.</span>
        )}

        <div style={playerHubStyles.commentComposer}>
          <input
            style={playerHubStyles.profileInput}
            value={draft}
            onChange={(eventValue) =>
              updateEventCommentDraft(planId, eventValue.target.value)
            }
            placeholder="Write a comment..."
          />
          <button
            type="button"
            style={{
              ...playerHubStyles.saveButton,
              ...(status === "sending" || !String(draft).trim()
                ? playerHubStyles.saveButtonDisabled
                : {}),
            }}
            disabled={status === "sending" || !String(draft).trim()}
            onClick={() => submitEventComment(event)}
          >
            {status === "sending" ? "Sending..." : "Send"}
          </button>
        </div>
        {status === "error" ? (
          <span style={playerHubStyles.profileMessage}>
            Could not update comments.
          </span>
        ) : null}
      </section>
    );
  }

  function renderPlayerEventCard(bundle, featured = false) {
    const event = mergeEventRows(
      mergeEventRows(mergeEventRows(bundle?.base, bundle?.planning), bundle?.roster),
      bundle?.availability
    );
    const availability = bundle?.availability;
    const availabilityStatus = normalizeTournamentAvailabilityStatus(
      availability?.responseStatus || bundle?.planning?.availabilityStatus
    );
    const isPending = Boolean(availability) && availabilityStatus === "PENDING";
    const assignedSquad = normalizeAssignedSquad(
      bundle?.planning?.assignedSquad || bundle?.roster?.assignedSquad
    );
    const plannedLabel =
      assignedSquad === "UNASSIGNED"
        ? ""
        : squadDisplayName(assignedSquad, event);
    const rosterStatus = bundle?.roster
      ? normalizeRosterStatus(bundle.roster.rosterStatus)
      : "";
    const hasRosterState = rosterStatus && rosterStatus !== "CANCELLED";
    const rosterIsViewOnly =
      rosterStatus === "APPROVED" || rosterStatus === "LOCKED";
    const statusLabel = hasRosterState
      ? formatRosterStatus(rosterStatus)
      : availability
        ? eventResponseActionLabel(availabilityStatus)
        : plannedLabel
          ? "Planning"
          : "Open";
    const statusStyle = hasRosterState
      ? rosterStatusStyle(rosterStatus)
      : availability
        ? tournamentAvailabilityStatusStyle(availabilityStatus)
        : playerHubStyles.accessStatusPending;
    const preferredSquad = formatPreferredSquadForEvent(
      availability?.preferredSquad || bundle?.planning?.preferredSquad,
      event
    );
    const eventRosterLockText = rosterLockChipText(event);
    const stats = tournamentPlanStats(event, []);
    const hasStats = responseStatsHaveCounts(stats);
    const cardKey = bundle?.key || eventIdentityKey(event);
    const canComment = Boolean(eventPlanId(event));
    const canRespond = Boolean(availability) && !rosterIsViewOnly;
    const dateText = eventShortDateText(event);
    const eventKicker = hasRosterState
      ? rosterStatus === "LOCKED"
        ? "Official roster"
        : "Roster"
      : isPending
        ? "Going?"
        : "Team event";

    return (
      <section
        key={cardKey}
        style={{
          ...playerHubStyles.eventCard,
          ...(featured ? playerHubStyles.eventCardFeatured : {}),
        }}
      >
        <div style={playerHubStyles.eventTopRow}>
          <div style={playerHubStyles.profileMeta}>
            <span style={playerHubStyles.homeKicker}>{eventKicker}</span>
            <strong style={playerHubStyles.eventTitle}>
              {event.tournamentName || "Tournament"}
            </strong>
            <span style={playerHubStyles.eventMeta}>{eventMetaText(event)}</span>
          </div>
          <span
            style={{
              ...playerHubStyles.accessStatusChip,
              ...statusStyle,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {hasStats ? renderEventStats(stats) : null}

        <div style={playerHubStyles.chipRow}>
          {dateText ? (
            <span style={playerHubStyles.chip}>{dateText}</span>
          ) : null}
          {hasRosterState && availability ? (
            <span
              style={{
                ...playerHubStyles.accessStatusChip,
                ...tournamentAvailabilityStatusStyle(availabilityStatus),
              }}
            >
              {formatPlayerAvailabilityStatus(availabilityStatus)}
            </span>
          ) : null}
          {plannedLabel ? (
            <span style={playerHubStyles.chip}>Planned: {plannedLabel}</span>
          ) : null}
          {preferredSquad ? (
            <span style={playerHubStyles.chip}>{preferredSquad}</span>
          ) : null}
          {eventRosterLockText ? (
            <span style={playerHubStyles.chip}>{eventRosterLockText}</span>
          ) : null}
        </div>

        {canRespond ? (
          <>
            <div style={playerHubStyles.eventResponseActions}>
              {["YES", "MAYBE", "NO"].map((status) => (
                <button
                  key={status}
                  type="button"
                  style={{
                    ...playerHubStyles.eventResponseButton,
                    ...(availabilityStatus === status
                      ? playerHubStyles.eventResponseButtonActive
                      : {}),
                    ...(tournamentPlanUpdatingId === availability.availabilityId
                      ? playerHubStyles.adminDisabledButton
                      : {}),
                  }}
                  disabled={tournamentPlanUpdatingId === availability.availabilityId}
                  onClick={() =>
                    handleTournamentAvailabilityResponse(availability, status)
                  }
                >
                  {eventResponseActionLabel(status)}
                </button>
              ))}
            </div>
            <div style={playerHubStyles.eventSecondaryActions}>
              <details style={playerHubStyles.eventPreferenceDetails}>
                <summary style={playerHubStyles.eventPreferenceSummary}>
                  Prefs / note
                </summary>
                <div style={playerHubStyles.profileFormGrid}>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Preferred team</span>
                    <select
                      style={playerHubStyles.profileInput}
                      value={availabilityDraftValue(
                        availability,
                        "preferredSquad",
                        "NO_PREFERENCE"
                      )}
                      onChange={(eventValue) =>
                        updateTournamentAvailabilityDraft(
                          availability.availabilityId,
                          "preferredSquad",
                          eventValue.target.value
                        )
                      }
                    >
                      <option value="NO_PREFERENCE">No preference</option>
                      {captainSquadNameSlots.map((squad) => (
                        <option key={squad} value={squad}>
                          {squadDisplayName(squad, event)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Note</span>
                    <input
                      style={playerHubStyles.profileInput}
                      value={availabilityDraftValue(availability, "playerNote", "")}
                      onChange={(eventValue) =>
                        updateTournamentAvailabilityDraft(
                          availability.availabilityId,
                          "playerNote",
                          eventValue.target.value
                        )
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>
              </details>
              {canComment ? (
                <button
                  type="button"
                  style={playerHubStyles.feedTinyAction}
                  onClick={() => toggleEventComments(event)}
                >
                  {expandedEventCommentPlanId === eventPlanId(event)
                    ? "Hide comments"
                    : "Comment"}
                </button>
              ) : null}
            </div>
          </>
        ) : rosterIsViewOnly ? (
          <div style={playerHubStyles.eventActionBar}>
            <button
              type="button"
              style={playerHubStyles.eventViewRosterButton}
              onClick={openPlayerRosterView}
            >
              View roster
            </button>
            {canComment ? (
              <button
                type="button"
                style={playerHubStyles.feedTinyAction}
                onClick={() => toggleEventComments(event)}
              >
                {expandedEventCommentPlanId === eventPlanId(event)
                  ? "Hide comments"
                  : "Comment"}
              </button>
            ) : null}
          </div>
        ) : (
          <div style={playerHubStyles.eventActionBar}>
            {availability?.playerNote ? (
              <span style={playerHubStyles.chip}>{availability.playerNote}</span>
            ) : null}
            {canComment ? (
              <button
                type="button"
                style={playerHubStyles.feedTinyAction}
                onClick={() => toggleEventComments(event)}
              >
                {expandedEventCommentPlanId === eventPlanId(event)
                  ? "Hide comments"
                  : "Comment"}
              </button>
            ) : null}
          </div>
        )}

        {renderEventCommentsDrawer(event)}
      </section>
    );
  }

  function renderCaptainEventCard(plan, availability = [], options = {}) {
    const compact = Boolean(options.compact);
    const stats = tournamentPlanStats(plan, availability);
    const planMeta = compactPlanMeta(plan);
    const contextLabel = eventContextLabel(plan);
    const rosterLockText = rosterLockChipText(plan);
    const roster = eventRosterForPlanId(eventPlanId(plan));
    const rosterStatus = normalizeRosterStatus(roster?.rosterStatus);
    const rosterIsViewOnly = rosterStatus === "APPROVED" || rosterStatus === "LOCKED";
    const dateText = eventShortDateText(plan);
    const visibleAvailability =
      expandedTournamentPlanId === plan.planId ? availability : [];
    const groups = ["YES", "MAYBE", "PENDING", "NO"].map((status) => ({
      status,
      items: visibleAvailability.filter(
        (item) =>
          normalizeTournamentAvailabilityStatus(item.responseStatus) === status
      ),
    }));

    return (
      <article key={plan.planId || eventIdentityKey(plan)} style={playerHubStyles.eventCard}>
        <div style={playerHubStyles.eventTopRow}>
          <div style={playerHubStyles.profileMeta}>
            <span style={playerHubStyles.homeKicker}>{contextLabel}</span>
            <strong style={playerHubStyles.eventTitle}>
              {plan.tournamentName || "Tournament"}
            </strong>
            <span style={playerHubStyles.eventMeta}>
              {eventMetaText(plan)}
            </span>
          </div>
          <span
            style={{
              ...playerHubStyles.accessStatusChip,
              ...eventStatusStyle(plan),
            }}
          >
            {eventStatusForPlan(plan)}
          </span>
        </div>

        {renderEventStats(stats)}

        <div style={playerHubStyles.chipRow}>
          {dateText ? (
            <span style={playerHubStyles.chip}>{dateText}</span>
          ) : null}
          <span style={playerHubStyles.chip}>Availability asked</span>
          {planMeta ? (
            <span style={playerHubStyles.chip}>{planMeta}</span>
          ) : null}
          {rosterLockText ? (
            <span style={playerHubStyles.chip}>{rosterLockText}</span>
          ) : null}
        </div>

        <div style={playerHubStyles.eventActionBar}>
          <button
            type="button"
            style={compact ? playerHubStyles.eventViewRosterButton : playerHubStyles.adminActionButton}
            onClick={() => toggleTournamentPlanResponses(plan)}
          >
            {expandedTournamentPlanId === plan.planId
              ? "Refresh"
              : compact
                ? "Review responses"
                : "Responses"}
          </button>
          {expandedTournamentPlanId === plan.planId ? (
            <button
              type="button"
              style={playerHubStyles.adminActionButton}
              onClick={() => setExpandedTournamentPlanId("")}
            >
              Hide
            </button>
          ) : null}
          <button
            type="button"
            style={playerHubStyles.adminActionButton}
            onClick={() =>
              compact
                ? openCaptainPlanFromEvents(plan)
                : toggleTournamentSquadPlanning(plan)
            }
          >
            {rosterIsViewOnly
              ? "View roster"
              : expandedSquadPlanId === plan.planId
                ? "Refresh teams"
                : "Plan squads"}
          </button>
          <button
            type="button"
            style={playerHubStyles.feedTinyAction}
            onClick={() => toggleEventComments(plan)}
          >
            {expandedEventCommentPlanId === plan.planId
              ? "Hide comments"
              : "Comment"}
          </button>
          {!compact && plan.planStatus !== "READY" ? (
            <button
              type="button"
              style={playerHubStyles.adminActionButton}
              onClick={() => handleTournamentPlanStatus(plan, "READY")}
            >
              Ready
            </button>
          ) : null}
          {!compact && plan.planStatus !== "CANCELLED" ? (
            <button
              type="button"
              style={{
                ...playerHubStyles.adminActionButton,
                ...playerHubStyles.adminDangerButton,
              }}
              onClick={() => handleTournamentPlanStatus(plan, "CANCELLED")}
            >
              Cancel
            </button>
          ) : null}
        </div>

        {expandedTournamentPlanId === plan.planId ? (
          <div style={playerHubStyles.accessRequestList}>
            {groups.map((group) => (
              <div key={group.status} style={playerHubStyles.interestGroup}>
                <div style={playerHubStyles.interestGroupTitle}>
                  {formatPlayerAvailabilityStatus(group.status)}
                </div>
                {group.items.length ? (
                  group.items.map((item) => (
                    <article key={item.availabilityId} style={playerHubStyles.interestRow}>
                      <div style={playerHubStyles.interestPlayerMeta}>
                        <strong style={playerHubStyles.interestPlayerName}>
                          {item.playerDisplayName || item.playerUsername || "Player"}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          {[
                            item.playerCountry || "No country",
                            formatPreferredSquadForEvent(
                              item.preferredSquad,
                              plan
                            ),
                          ]
                            .filter(Boolean)
                            .join(" / ")}
                        </span>
                        {item.playerNote ? (
                          <span style={playerHubStyles.cardText}>
                            {item.playerNote}
                          </span>
                        ) : null}
                      </div>
                      <span
                        style={{
                          ...playerHubStyles.accessStatusChip,
                          ...tournamentAvailabilityStatusStyle(item.responseStatus),
                        }}
                      >
                        {formatPlayerAvailabilityStatus(item.responseStatus)}
                      </span>
                    </article>
                  ))
                ) : (
                  <div style={playerHubStyles.squadEmptyRow}>none</div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {renderEventCommentsDrawer(plan)}
      </article>
    );
  }

  function captainChecklistStatusLabel(status) {
    if (status === "done") return "Done";
    if (status === "next") return "Next";
    if (status === "pending") return "Pending";
    if (status === "blocked") return "Blocked";
    if (status === "coming-soon") return "Coming soon";
    return "Not started";
  }

  function captainChecklistStatusStyle(status) {
    if (status === "done") return playerHubStyles.accessStatusApproved;
    if (status === "next") return playerHubStyles.captainChecklistStatusNext;
    if (status === "pending") return playerHubStyles.accessStatusPending;
    if (status === "blocked") return playerHubStyles.accessStatusRejected;
    return playerHubStyles.accessStatusIdle;
  }

  function assignedSquadPlayerCount(items = []) {
    return (Array.isArray(items) ? items : []).filter((item) => {
      const assignedSquad = normalizeAssignedSquad(item?.assignedSquad);
      return (
        item?.planningStatus !== "REMOVED" &&
        item?.playerStatus !== "REMOVED" &&
        assignedSquad !== "UNASSIGNED"
      );
    }).length;
  }

  function captainFlowPlanScore(plan) {
    const planId = String(plan?.planId || "");
    const availability = captainAvailabilityByPlanId[planId] || [];
    const planning = squadPlanningByPlanId[planId] || [];
    const stats = tournamentPlanStats(plan, availability);
    const roster = captainRosterDraftsByPlanId[planId]?.roster;
    const rosterStatus = roster ? normalizeRosterStatus(roster.rosterStatus) : "";
    const labels = squadNamesFromSource({
      ...plan,
      roster,
      ...(captainRosterDraftsByPlanId[planId] || {}),
    });
    const answeredCount = stats.yes + stats.maybe + stats.no;
    const assignedCount =
      assignedSquadPlayerCount(planning) ||
      assignedSquadPlayerCount(captainRosterDraftsByPlanId[planId]?.players);
    const updatedTime = Date.parse(
      plan?.updatedAt || plan?.createdAt || plan?.deadlineAt || ""
    );

    return (
      (Number.isNaN(updatedTime) ? 0 : updatedTime / 100000000) +
      (stats.total ? 10 : 0) +
      (answeredCount ? 20 : 0) +
      (assignedCount ? 30 : 0) +
      (Object.keys(labels).length ? 40 : 0) +
      (roster ? 50 : 0) +
      (rosterStatus === "SUBMITTED" ? 70 : 0) +
      (rosterStatus === "APPROVED" || rosterStatus === "LOCKED" ? 90 : 0)
    );
  }

  function buildCaptainTournamentFlow() {
    const plans = Array.isArray(dedupedTournamentPlans)
      ? dedupedTournamentPlans
      : [];
    const expandedResponsePlan = plans.find(
      (plan) => String(plan.planId || "") === String(expandedTournamentPlanId || "")
    );
    const plan =
      expandedSquadPlan ||
      expandedResponsePlan ||
      plans.slice().sort((left, right) => {
        return captainFlowPlanScore(right) - captainFlowPlanScore(left);
      })[0] ||
      null;
    const planId = String(plan?.planId || "");
    const availability = planId ? captainAvailabilityByPlanId[planId] || [] : [];
    const planning = planId ? squadPlanningByPlanId[planId] || [] : [];
    const draftData = planId ? captainRosterDraftsByPlanId[planId] || {} : {};
    const stats = plan ? tournamentPlanStats(plan, availability) : {
      yes: 0,
      maybe: 0,
      no: 0,
      pending: 0,
      total: 0,
    };
    const roster = draftData.roster || null;
    const rosterStatus = roster ? normalizeRosterStatus(roster.rosterStatus) : "";
    const rosterActive = Boolean(roster && rosterStatus !== "CANCELLED");
    const rosterLock = rosterLockForSource({ ...(plan || {}), ...(roster || {}) });
    const lateChangeRequested = rosterStatus === "CHANGE_REQUESTED";
    const rosterCanSubmit =
      rosterActive &&
      (rosterStatus === "DRAFT" ||
        rosterStatus === "REJECTED" ||
        lateChangeRequested) &&
      (!rosterLock.afterDeadline || lateChangeRequested);
    const answeredCount = stats.yes + stats.maybe + stats.no;
    const assignedCount =
      assignedSquadPlayerCount(planning) ||
      assignedSquadPlayerCount(draftData.players);
    const labelCount = Object.keys(
      squadNamesFromSource({
        ...plan,
        roster,
        ...draftData,
      })
    ).length;
    const draftTournament = tournamentOptions.find(
      (option) =>
        String(option.id || option.tournamentId || "") ===
        String(tournamentPlanDraft.tournamentId || "")
    );

    return {
      plan,
      planId,
      plans,
      stats,
      answeredCount,
      assignedCount,
      labelCount,
      roster,
      rosterStatus,
      rosterLock,
      lateChangeRequested,
      rosterActive,
      rosterCanSubmit,
      hasTournamentOptions: tournamentOptions.length > 0,
      draftTournament,
      draftTournamentSelected: Boolean(tournamentPlanDraft.tournamentId),
    };
  }

  function buildCaptainChecklistSteps(flow) {
    const hasPlan = Boolean(flow.plan);
    const hasPick = hasPlan || flow.draftTournamentSelected;
    const approvedRoster =
      flow.rosterActive &&
      (flow.rosterStatus === "APPROVED" || flow.rosterStatus === "LOCKED");
    const submittedRoster =
      flow.rosterActive &&
      (flow.rosterStatus === "SUBMITTED" ||
        flow.rosterStatus === "APPROVED" ||
        flow.rosterStatus === "LOCKED");

    return [
      {
        id: "pick",
        label: "Pick tournament",
        status: hasPick
          ? "done"
          : flow.hasTournamentOptions
            ? "next"
            : "coming-soon",
        detail: hasPlan
          ? flow.plan.tournamentName || "Tournament selected"
          : flow.draftTournament
            ? tournamentOptionLabel(flow.draftTournament)
            : flow.hasTournamentOptions
              ? "Select a tournament in Ask availability."
              : "No tournaments available yet.",
      },
      {
        id: "ask",
        label: "Ask availability",
        status: hasPlan ? "done" : flow.hasTournamentOptions ? "next" : "blocked",
        detail: hasPlan
          ? `${flow.stats.total || 0} invited`
          : flow.hasTournamentOptions
            ? "Ask confirmed members."
            : "Coming soon.",
      },
      {
        id: "review",
        label: "Review responses",
        status: !hasPlan
          ? "not-started"
          : flow.answeredCount || flow.rosterActive
            ? "done"
            : flow.stats.total
              ? "next"
              : "pending",
        detail: hasPlan
          ? `${flow.answeredCount}/${flow.stats.total || 0} answered`
          : "Not started.",
      },
      {
        id: "plan",
        label: "Plan squads",
        status: !hasPlan
          ? "blocked"
          : flow.assignedCount
            ? "done"
            : flow.answeredCount
              ? "next"
              : "pending",
        detail: flow.assignedCount
          ? `${flow.assignedCount} assigned`
          : hasPlan
            ? "Waiting for responses or assignments."
            : "Ask availability first.",
      },
      {
        id: "names",
        label: "Name squads",
        status: !hasPlan
          ? "blocked"
          : flow.labelCount
            ? "done"
            : flow.assignedCount
              ? "next"
              : "pending",
        detail: flow.labelCount
          ? `${flow.labelCount} custom label${flow.labelCount === 1 ? "" : "s"}`
          : flow.assignedCount
            ? "Optional display names."
            : "Plan squads first.",
      },
      {
        id: "submit",
        label: "Submit roster",
        status: submittedRoster
          ? "done"
          : flow.rosterLock?.afterDeadline && !flow.lateChangeRequested
            ? "blocked"
          : flow.rosterCanSubmit
            ? "next"
            : flow.assignedCount
              ? "pending"
              : "blocked",
        detail: submittedRoster
          ? formatRosterStatus(flow.rosterStatus)
          : flow.rosterLock?.afterDeadline && !flow.lateChangeRequested
            ? "Contact organizer/admin for late changes."
          : flow.rosterCanSubmit
            ? "Ready to submit."
            : flow.assignedCount
              ? "Create roster draft below first."
              : "No roster draft yet.",
      },
      {
        id: "approval",
        label: "Wait for approval",
        status: approvedRoster
          ? "done"
          : flow.rosterStatus === "SUBMITTED"
            ? "pending"
            : flow.rosterStatus === "REJECTED"
              ? "blocked"
              : "not-started",
        detail: approvedRoster
          ? formatRosterStatus(flow.rosterStatus)
          : flow.rosterStatus === "SUBMITTED"
            ? "Organizer review."
            : flow.rosterStatus === "REJECTED"
              ? "Update and resubmit."
              : "Not started.",
      },
    ];
  }

  async function openCaptainChecklistSubmit(plan) {
    const planId = String(plan?.planId || "");
    if (!planId) return;

    if (String(expandedSquadPlanId || "") !== planId) {
      await toggleTournamentSquadPlanning(plan);
    } else {
      await loadRosterDraftForPlan(planId).catch(() => {});
    }
    setSubmitRosterConfirmPlanId(planId);
  }

  function renderCaptainTournamentChecklist() {
    const flow = buildCaptainTournamentFlow();
    const steps = buildCaptainChecklistSteps(flow);
    const currentStep = steps.find((step) => step.status === "next") ||
      steps.find((step) => step.status === "pending") ||
      steps.find((step) => step.status === "blocked") ||
      steps[steps.length - 1];
    const nextStepPreview = steps.find(
      (step) => step.id !== currentStep?.id && step.status !== "done"
    );
    const visibleSteps = [currentStep, nextStepPreview].filter(Boolean).slice(0, 2);
    const focusMeta = flow.plan
      ? [
          eventMetaText(flow.plan),
          flow.stats.total
            ? `${flow.answeredCount}/${flow.stats.total} responses`
            : "",
          flow.rosterActive ? formatRosterStatus(flow.rosterStatus) : "",
        ]
          .filter(Boolean)
          .join(" / ")
      : flow.hasTournamentOptions
        ? "Choose a tournament and ask confirmed members."
        : "Coming soon.";

    const actions = [
      {
        label: "Ask availability",
        primary: currentStep?.id === "pick" || currentStep?.id === "ask",
        disabled: !flow.hasTournamentOptions,
        onClick: () => toggleTeamActionPanel("plan"),
      },
      {
        label: "Review responses",
        primary: currentStep?.id === "review",
        disabled: !flow.plan,
        onClick: () => toggleTournamentPlanResponses(flow.plan),
      },
      {
        label: "Plan squads",
        primary:
          currentStep?.id === "plan" ||
          currentStep?.id === "names" ||
          (currentStep?.id === "submit" && !flow.rosterCanSubmit),
        disabled: !flow.plan,
        onClick: () => toggleTournamentSquadPlanning(flow.plan),
      },
      {
        label: "Submit roster",
        primary: currentStep?.id === "submit" && flow.rosterCanSubmit,
        disabled: !flow.rosterCanSubmit,
        onClick: () => openCaptainChecklistSubmit(flow.plan),
      },
    ];

    return (
      <section
        style={playerHubStyles.captainChecklistCard}
        data-testid="captain-checklist"
      >
        <div style={playerHubStyles.captainChecklistTop}>
          <div style={playerHubStyles.captainChecklistFocus}>
            <div style={playerHubStyles.sectionTitle}>Captain checklist</div>
            <span style={playerHubStyles.previewSubtitle}>
              {flow.plan?.tournamentName || "Tournament flow"}
            </span>
            <span style={playerHubStyles.captainChecklistStepDetail}>
              {focusMeta}
            </span>
          </div>
          <span
            style={{
              ...playerHubStyles.accessStatusChip,
              ...captainChecklistStatusStyle(currentStep?.status),
            }}
          >
            Next: {currentStep?.label || "Not started"}
          </span>
        </div>

        <div style={playerHubStyles.captainChecklistGrid}>
          {visibleSteps.map((step) => (
            <article key={step.id} style={playerHubStyles.captainChecklistStep}>
              <div style={playerHubStyles.captainChecklistStepTop}>
                <span style={playerHubStyles.captainChecklistStepName}>
                  {step.label}
                </span>
                <span
                  style={{
                    ...playerHubStyles.accessStatusChip,
                    ...captainChecklistStatusStyle(step.status),
                  }}
                >
                  {captainChecklistStatusLabel(step.status)}
                </span>
              </div>
              <span style={playerHubStyles.captainChecklistStepDetail}>
                {step.detail}
              </span>
            </article>
          ))}
        </div>

        <details style={playerHubStyles.captainChecklistDetails}>
          <summary style={playerHubStyles.captainChecklistSummary}>
            All checklist steps
          </summary>
          <div style={playerHubStyles.captainChecklistGrid}>
            {steps.map((step) => (
              <article key={`all-${step.id}`} style={playerHubStyles.captainChecklistStep}>
                <div style={playerHubStyles.captainChecklistStepTop}>
                  <span style={playerHubStyles.captainChecklistStepName}>
                    {step.label}
                  </span>
                  <span
                    style={{
                      ...playerHubStyles.accessStatusChip,
                      ...captainChecklistStatusStyle(step.status),
                    }}
                  >
                    {captainChecklistStatusLabel(step.status)}
                  </span>
                </div>
                <span style={playerHubStyles.captainChecklistStepDetail}>
                  {step.detail}
                </span>
              </article>
            ))}
          </div>
        </details>

        <div style={playerHubStyles.captainChecklistActions}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              style={{
                ...(action.primary
                  ? playerHubStyles.captainChecklistPrimaryAction
                  : playerHubStyles.captainChecklistAction),
                ...(action.disabled ? playerHubStyles.adminDisabledButton : {}),
              }}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  function updateTeamInterestDraft(needId, value) {
    const key = String(needId || "");
    setTeamInterestDrafts((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submitTeamNeedInterest(need) {
    if (!createTeamNeedInterest || !need?.needId) return;

    const needId = String(need.needId || "");
    setTeamInterestStatus("saving");
    setTeamInterestMessage("");

    try {
      const interest = await createTeamNeedInterest(
        needId,
        teamInterestDrafts[needId] || ""
      );
      if (interest) {
        setMyTeamNeedInterests((current) => [interest, ...current]);
      }
      setTeamInterestOpenNeedId("");
      setTeamInterestDrafts((current) => ({
        ...current,
        [needId]: "",
      }));
      setTeamInterestStatus("ready");
      setTeamInterestMessage("Interest sent.");
      await loadTeamNeeds();
      await loadMyInterests();
      await loadCaptainInterests();
      await loadAdminTeamNeedInterests();
    } catch (error) {
      setTeamInterestStatus("error");
      setTeamInterestMessage(
        cleanPlayerHubError(error, "Could not send interest.")
      );
    }
  }

  async function updateTeamNeedInterest(interest, status) {
    if (!reviewTeamNeedInterest || !interest?.interestId) return;

    setTeamInterestUpdatingId(interest.interestId);
    setTeamInterestMessage("");

    try {
      const updatedInterest = await reviewTeamNeedInterest(
        interest.interestId,
        status
      );
      if (updatedInterest) {
        setCaptainTeamNeedInterests((current) =>
          current.map((item) =>
            String(item.interestId || "") ===
            String(updatedInterest.interestId || "")
              ? updatedInterest
              : item
          )
        );
      }
      setTeamInterestStatus("ready");
      setTeamInterestMessage(
        status === "ACCEPTED" ? "Interest accepted." : "Interest declined."
      );
      const needId = String(interest.needId || "");
      await loadTeamProfile();
      await loadTeamNeeds();
      await loadCaptainInterestsForNeed(needId);
      await loadMyInterests();
      await loadAdminTeamNeedInterests();
    } catch (error) {
      setTeamInterestStatus("error");
      setTeamInterestMessage(
        cleanPlayerHubError(error, "Could not update interest.")
      );
    } finally {
      setTeamInterestUpdatingId("");
    }
  }

  function isInterestAlreadyTeamMember(interest) {
    if (!interest) return false;
    const sourceInterestId = String(interest.interestId || "");
    const playerUsername = String(interest.playerUsername || "").toLowerCase();
    return Boolean(
      (sourceInterestId && activeTeamMemberByInterestId[sourceInterestId]) ||
        (playerUsername && activeTeamMemberByPlayerUsername[playerUsername])
    );
  }

  async function handleAddTeamMemberFromInterest(interest) {
    if (!addTeamMemberFromInterest || !interest?.interestId) return;

    setTeamMemberUpdatingId(interest.interestId);
    setTeamMemberStatus("saving");
    setTeamMemberMessage("");

    try {
      const data = await addTeamMemberFromInterest(interest.interestId);
      if (Array.isArray(data?.members)) {
        setTeamMembers(data.members);
      } else if (data?.member) {
        setTeamMembers((current) => [data.member, ...current]);
      }
      setTeamMemberStatus("ready");
      setTeamMemberMessage("Player added to team.");
      const needId = String(interest.needId || "");
      await loadTeamProfile();
      await loadTeamNeeds();
      if (needId) {
        await loadCaptainInterestsForNeed(needId);
      } else {
        await loadCaptainInterests();
      }
      await loadCaptainTeamMembers();
      await loadConfirmedTeams();
      await loadAdminTeamMembers();
    } catch (error) {
      setTeamMemberStatus("error");
      setTeamMemberMessage(
        cleanPlayerHubError(error, "Could not add team member.")
      );
    } finally {
      setTeamMemberUpdatingId("");
    }
  }

  async function handleRemoveTeamMember(member, memberStatus = "REMOVED") {
    if (!removeTeamMember || !member?.teamMemberId) return;

    const confirmed =
      memberStatus === "ARCHIVED" ||
      window.confirm(
        "Remove this player from the team? This does not delete their profile."
      );
    if (!confirmed) return;

    setTeamMemberUpdatingId(member.teamMemberId);
    setTeamMemberStatus("saving");
    setTeamMemberMessage("");

    try {
      const data = await removeTeamMember(member.teamMemberId, memberStatus);
      if (Array.isArray(data?.members)) {
        setTeamMembers(data.members);
      } else {
        setTeamMembers((current) =>
          current.filter(
            (item) =>
              String(item.teamMemberId || "") !==
              String(member.teamMemberId || "")
          )
        );
      }
      setTeamMemberStatus("ready");
      setTeamMemberMessage(
        memberStatus === "ARCHIVED"
          ? "Team member archived."
          : "Team member removed."
      );
      await loadCaptainTeamMembers();
      await loadConfirmedTeams();
      await loadAdminTeamMembers();
    } catch (error) {
      setTeamMemberStatus("error");
      setTeamMemberMessage(
        cleanPlayerHubError(error, "Could not update team member.")
      );
    } finally {
      setTeamMemberUpdatingId("");
    }
  }

  async function handleAdminArchiveTeamMember(member) {
    if (!member?.teamMemberId) return;
    const confirmed = window.confirm("Archive this team member record?");
    if (!confirmed) return;

    setAdminTeamMemberUpdatingId(member.teamMemberId);
    try {
      await handleRemoveTeamMember(member, "ARCHIVED");
      await loadAdminTeamMembers();
    } finally {
      setAdminTeamMemberUpdatingId("");
    }
  }

  async function handleReviewTeamMembershipRequest(request, status) {
    if (!reviewTeamMembershipRequest || !request?.requestId) return;

    setTeamMembershipUpdatingId(request.requestId);
    setTeamMembershipStatus("saving");
    setTeamMembershipMessage("");

    try {
      const data = await reviewTeamMembershipRequest(request.requestId, status);
      if (Array.isArray(data?.requests)) {
        setCaptainMembershipRequests(data.requests);
      } else if (data?.request) {
        setCaptainMembershipRequests((current) =>
          current.map((item) =>
            String(item.requestId || "") === String(data.request.requestId || "")
              ? data.request
              : item
          )
        );
      }
      setTeamMembershipStatus("ready");
      setTeamMembershipMessage(
        status === "APPROVED"
          ? "Team membership approved."
          : "Team membership rejected."
      );
      await loadCaptainMembershipRequests();
      await loadCaptainTeamMembers();
      await loadConfirmedTeams();
      await loadAdminTeamMembershipRequests();
    } catch (error) {
      setTeamMembershipStatus("error");
      setTeamMembershipMessage(
        cleanPlayerHubError(error, "Could not review membership request.")
      );
    } finally {
      setTeamMembershipUpdatingId("");
    }
  }

  async function handleCancelMembershipRequest(request) {
    if (!cancelMyTeamMembershipRequest || !request?.requestId) return;

    setTeamMembershipUpdatingId(request.requestId);
    setTeamMembershipStatus("saving");
    setTeamMembershipMessage("");

    try {
      const data = await cancelMyTeamMembershipRequest(request.requestId);
      if (Array.isArray(data?.requests)) {
        setTeamMembershipRequests(data.requests);
      }
      setTeamMembershipStatus("ready");
      setTeamMembershipMessage("Team membership request cancelled.");
      await loadTeamMembershipRequests();
      await loadAdminTeamMembershipRequests();
    } catch (error) {
      setTeamMembershipStatus("error");
      setTeamMembershipMessage(
        cleanPlayerHubError(error, "Could not cancel membership request.")
      );
    } finally {
      setTeamMembershipUpdatingId("");
    }
  }

  async function handleCreateTournamentPlan(event) {
    event.preventDefault();
    if (!createTournamentTeamPlan || tournamentPlanStatus === "saving") return;

    const tournamentId = String(tournamentPlanDraft.tournamentId || "").trim();
    if (!tournamentId) {
      setTournamentPlanStatus("error");
      setTournamentPlanMessage("Select a tournament before asking team members.");
      return;
    }

    setTournamentPlanStatus("saving");
    setTournamentPlanMessage("");

    try {
      const data = await createTournamentTeamPlan({
        tournamentId,
        squadLabel: "TEAM_PLANNING",
        className: tournamentPlanDraft.className,
        deadlineAt: tournamentPlanDraft.deadlineAt,
        note: tournamentPlanDraft.note,
        planStatus: "INVITING",
      });
      if (Array.isArray(data?.plans)) {
        setTournamentPlans(data.plans);
      } else if (data?.plan) {
        setTournamentPlans((current) => [data.plan, ...current]);
      }
      if (Array.isArray(data?.availability)) {
        setCaptainTournamentAvailability((current) => [
          ...current.filter(
            (item) => String(item.planId || "") !== String(data.plan?.planId || "")
          ),
          ...data.availability,
        ]);
      }
      setTournamentPlanDraft({
        tournamentId,
        squadLabel: "TEAM_PLANNING",
        customSquadLabel: "",
        className: "",
        deadlineAt: "",
        note: "",
      });
      setTournamentPlanStatus("ready");
      setTournamentPlanMessage("Team members asked.");
      setShowTournamentPlanForm(false);
      await loadTournamentPlans();
      await loadPlayerTournamentAvailability();
    } catch (error) {
      setTournamentPlanStatus("error");
      setTournamentPlanMessage(
        cleanPlayerHubError(error, "Could not create tournament plan.")
      );
    }
  }

  async function handleTournamentAvailabilityResponse(item, responseStatus) {
    if (!updateTournamentAvailabilityResponse || !item?.availabilityId) return;

    setTournamentPlanUpdatingId(item.availabilityId);
    setTournamentPlanMessage("");

    try {
      const updated = await updateTournamentAvailabilityResponse(
        item.availabilityId,
        responseStatus,
        availabilityDraftValue(item, "preferredSquad", "NO_PREFERENCE"),
        availabilityDraftValue(item, "playerNote", "")
      );
      if (updated) {
        setLastAnsweredTournamentAvailabilityId(updated.availabilityId || item.availabilityId);
        setPlayerTournamentAvailability((current) =>
          current.map((availability) =>
            String(availability.availabilityId || "") ===
            String(updated.availabilityId || "")
              ? updated
              : availability
          )
        );
      }
      setTournamentPlanStatus("ready");
      setTournamentPlanMessage(
        `Availability saved: ${formatPlayerAvailabilityStatus(responseStatus)}.`
      );
      await loadPlayerTournamentAvailability();
      await loadPlayerTournamentSquadPlanning();
      const answeredPlanId = String(updated?.planId || item.planId || "");
      if (answeredPlanId && expandedTournamentPlanId === answeredPlanId) {
        await loadCaptainTournamentAvailability(answeredPlanId);
      }
      if (answeredPlanId && expandedSquadPlanId === answeredPlanId) {
        await loadSquadPlanningForPlan(answeredPlanId);
      }
      await loadTournamentPlans();
    } catch (error) {
      setTournamentPlanStatus("error");
      setTournamentPlanMessage(
        cleanPlayerHubError(error, "Could not update availability.")
      );
    } finally {
      setTournamentPlanUpdatingId("");
    }
  }

  async function toggleTournamentPlanResponses(plan) {
    const planId = String(plan?.planId || "");
    if (!planId) return;

    if (expandedTournamentPlanId === planId) {
      await loadCaptainTournamentAvailability(planId);
      return;
    }

    setExpandedTournamentPlanId(planId);
    await loadCaptainTournamentAvailability(planId);
  }

  async function handleTournamentPlanStatus(plan, planStatus) {
    if (!updateTournamentPlanStatus || !plan?.planId) return;

    setTournamentPlanUpdatingId(plan.planId);
    setTournamentPlanMessage("");

    try {
      const updatedPlan = await updateTournamentPlanStatus(plan.planId, planStatus);
      if (updatedPlan) {
        setTournamentPlans((current) =>
          current.map((item) =>
            String(item.planId || "") === String(updatedPlan.planId || "")
              ? updatedPlan
              : item
          )
        );
      }
      setTournamentPlanStatus("ready");
      setTournamentPlanMessage("Tournament plan updated.");
      await loadTournamentPlans();
    } catch (error) {
      setTournamentPlanStatus("error");
      setTournamentPlanMessage(
        cleanPlayerHubError(error, "Could not update tournament plan.")
      );
    } finally {
      setTournamentPlanUpdatingId("");
    }
  }

  function applySquadPlanningResponse(planId, data) {
    const targetPlanId = String(planId || "");
    const planning = Array.isArray(data?.planning) ? data.planning : [];
    const availability = Array.isArray(data?.availability) ? data.availability : [];

    setCaptainTournamentSquadPlanning((current) => [
      ...current.filter((item) => String(item.planId || "") !== targetPlanId),
      ...planning,
    ]);
    setCaptainTournamentAvailability((current) => [
      ...current.filter((item) => String(item.planId || "") !== targetPlanId),
      ...availability,
    ]);
    if (data?.plan) {
      setTournamentPlans((current) =>
        current.map((item) =>
          String(item.planId || "") === String(data.plan.planId || "")
            ? data.plan
            : item
        )
      );
    }
  }

  async function toggleTournamentSquadPlanning(plan) {
    const planId = String(plan?.planId || "");
    if (!planId) return;

    setExpandedSquadPlanId(planId);
    setSquadPlanningUpdatingId(`load:${planId}`);
    setTournamentPlanMessage("");
    try {
      await loadSquadPlanningForPlan(planId);
      await loadRosterDraftForPlan(planId);
    } catch (error) {
      setTournamentPlanMessage(
        cleanPlayerHubError(error, "Could not load team planning.")
      );
    } finally {
      setSquadPlanningUpdatingId("");
    }
  }

  async function handleAssignTournamentSquad(plan, item, assignedSquad) {
    if (!assignPlayerToSquad || !plan?.planId || !item?.playerUsername) return;

    const updateKey = `${plan.planId}:${item.playerUsername}:${assignedSquad}`;
    setSquadPlanningUpdatingId(updateKey);
    setTournamentPlanMessage("");
    try {
      const data = await assignPlayerToSquad(
        plan.planId,
        item.playerUsername,
        assignedSquad
      );
      applySquadPlanningResponse(plan.planId, data);
      setTournamentPlanMessage("Team planning updated.");
    } catch (error) {
      setTournamentPlanMessage(
        cleanPlayerHubError(error, "Could not update team planning.")
      );
    } finally {
      setSquadPlanningUpdatingId("");
    }
  }

  async function handleBuildRosterDraft(plan) {
    if (!createOrUpdateRosterDraftFromSquadPlanning || !plan?.planId) return;

    setRosterDraftUpdatingPlanId(plan.planId);
    setRosterDraftMessage("");

    try {
      const data = await createOrUpdateRosterDraftFromSquadPlanning(plan.planId);
      const roster = data?.roster || null;
      const players = Array.isArray(data?.players) ? data.players : [];
      setCaptainRosterDraftsByPlanId((current) => ({
        ...current,
        [plan.planId]: { roster, players },
      }));
      setRosterDraftMessage("Roster draft saved.");
      await loadRosterDraftForPlan(plan.planId);
      await loadPlayerRosterStatus();
      await loadAdminRosterDrafts();
    } catch (error) {
      setRosterDraftMessage(
        cleanPlayerHubError(error, "Could not create roster draft.")
      );
    } finally {
      setRosterDraftUpdatingPlanId("");
    }
  }

  async function handleCancelRosterDraft(plan) {
    if (!cancelRosterDraft || !plan?.planId) return;

    const confirmed = window.confirm(
      "Cancel this roster draft? Planning stays unchanged."
    );
    if (!confirmed) return;

    setRosterDraftUpdatingPlanId(plan.planId);
    setRosterDraftMessage("");

    try {
      const data = await cancelRosterDraft(plan.planId);
      const roster = data?.roster || null;
      const players = Array.isArray(data?.players) ? data.players : [];
      setCaptainRosterDraftsByPlanId((current) => ({
        ...current,
        [plan.planId]: { roster, players },
      }));
      setRosterDraftMessage("Roster draft cancelled.");
      await loadRosterDraftForPlan(plan.planId);
      await loadPlayerRosterStatus();
      await loadAdminRosterDrafts();
    } catch (error) {
      setRosterDraftMessage(
        cleanPlayerHubError(error, "Could not cancel roster draft.")
      );
    } finally {
      setRosterDraftUpdatingPlanId("");
    }
  }

  async function handleSubmitRosterDraft(plan) {
    if (!submitRosterDraft || !plan?.planId) return;

    setRosterDraftUpdatingPlanId(plan.planId);
    setRosterDraftMessage("");

    try {
      const data = await submitRosterDraft(plan.planId);
      const roster = data?.roster || null;
      const players = Array.isArray(data?.players) ? data.players : [];
      setCaptainRosterDraftsByPlanId((current) => ({
        ...current,
        [plan.planId]: { roster, players },
      }));
      setSubmitRosterConfirmPlanId("");
      setRosterDraftMessage("Roster draft submitted.");
      await loadRosterDraftForPlan(plan.planId);
      await loadPlayerRosterStatus();
      await loadAdminRosterDrafts();
    } catch (error) {
      setRosterDraftMessage(
        cleanPlayerHubError(error, "Could not submit roster draft.")
      );
    } finally {
      setRosterDraftUpdatingPlanId("");
    }
  }

  async function handleReviewRosterDraft(roster, decision) {
    if (!reviewRosterDraft || !roster?.rosterId) return;

    const reviewKey = `${roster.rosterId}:${decision}`;
    setAdminRosterReviewUpdatingId(reviewKey);
    setAdminRosterReviewMessage("");

    try {
      await reviewRosterDraft(
        roster.rosterId,
        decision,
        adminRosterReviewNotes[roster.rosterId] || ""
      );
      setAdminRosterReviewMessage(
        decision === "APPROVED" ? "Roster draft approved." : "Roster draft rejected."
      );
      await loadAdminRosterDrafts();
      await loadPlayerRosterStatus();
      if (roster.planId) {
        try {
          await loadRosterDraftForPlan(roster.planId);
        } catch (error) {
          // Review can happen outside the captain context; admin list is authoritative here.
        }
      }
    } catch (error) {
      setAdminRosterReviewMessage(
        cleanPlayerHubError(error, "Could not review roster draft.")
      );
    } finally {
      setAdminRosterReviewUpdatingId("");
    }
  }

  async function handleCaptainLockRoster(plan, roster) {
    if (!lockOfficialRoster || !plan?.planId || !roster?.rosterId) return;

    const confirmed = window.confirm(
      "Lock roster? Players will see this as the official roster."
    );
    if (!confirmed) return;

    setRosterDraftUpdatingPlanId(plan.planId);
    setRosterDraftMessage("");

    try {
      const data = await lockOfficialRoster(roster.rosterId, "");
      const nextRoster = data?.roster || null;
      const players = Array.isArray(data?.players) ? data.players : [];
      setCaptainRosterDraftsByPlanId((current) => ({
        ...current,
        [plan.planId]: {
          roster: nextRoster,
          players,
        },
      }));
      setRosterDraftMessage("Roster locked.");
      await loadRosterDraftForPlan(plan.planId);
      await loadPlayerRosterStatus();
      await loadAdminRosterDrafts();
    } catch (error) {
      setRosterDraftMessage(
        cleanPlayerHubError(error, "Could not lock roster.")
      );
    } finally {
      setRosterDraftUpdatingPlanId("");
    }
  }

  async function toggleTeamNeedInterests(need) {
    const needId = String(need?.needId || "");
    if (!needId) return;

    if (expandedTeamNeedInterestId === needId) {
      setExpandedTeamNeedInterestId("");
      return;
    }

    setExpandedTeamNeedInterestId(needId);
    const stats = teamNeedCounters(need);
    await loadCaptainInterestsForNeed(
      needId,
      `${needId}:${stats.acceptedCount}:${stats.pendingCount}`
    );
  }

  function renderCaptainInterestGroup(title, interests) {
    if (!interests.length) return null;

    return (
      <div style={playerHubStyles.interestGroup}>
        <div style={playerHubStyles.interestGroupTitle}>{title}</div>
        {interests.map((interest) => {
          const updating = teamInterestUpdatingId === interest.interestId;
          const alreadyTeamMember = isInterestAlreadyTeamMember(interest);
          const addingMember = teamMemberUpdatingId === interest.interestId;

          return (
            <article key={interest.interestId} style={playerHubStyles.interestRow}>
              <div style={playerHubStyles.interestPlayerMeta}>
                <strong style={playerHubStyles.interestPlayerName}>
                  {interest.playerDisplayName || interest.playerUsername}
                </strong>
                <span style={playerHubStyles.previewSubtitle}>
                  {interest.playerCountry || "No country"} /{" "}
                  {interest.playerClubTeamName || "No fixed club/team"}
                </span>
                {interest.message ? (
                  <span style={playerHubStyles.cardText}>{interest.message}</span>
                ) : null}
              </div>
              <div style={playerHubStyles.interestActionRow}>
                <span
                  style={{
                    ...playerHubStyles.accessStatusChip,
                    ...accessRequestStatusStyle(interest.status),
                  }}
                >
                  {formatAccessRequestStatus(interest.status || "PENDING")}
                </span>
                {interest.status === "ACCEPTED" ? (
                  alreadyTeamMember ? (
                    <span style={playerHubStyles.chip}>Team member</span>
                  ) : (
                    <button
                      type="button"
                      style={{
                        ...playerHubStyles.addTeamMemberButton,
                        ...(addingMember
                          ? playerHubStyles.adminDisabledButton
                          : {}),
                      }}
                      disabled={addingMember}
                      onClick={() => handleAddTeamMemberFromInterest(interest)}
                    >
                      {addingMember ? "Adding..." : "Add to team member list"}
                    </button>
                  )
                ) : null}
                {interest.status === "PENDING" ? (
                  <>
                    <button
                      type="button"
                      style={playerHubStyles.adminActionButton}
                      disabled={updating}
                      onClick={() =>
                        updateTeamNeedInterest(interest, "ACCEPTED")
                      }
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      style={{
                        ...playerHubStyles.adminActionButton,
                        ...playerHubStyles.adminDangerButton,
                      }}
                      disabled={updating}
                      onClick={() =>
                        updateTeamNeedInterest(interest, "DECLINED")
                      }
                    >
                      Decline
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  function renderSquadPlayerRow(plan, item, planning, options = {}) {
    const playerUsername = item.playerUsername || planning?.playerUsername || "";
    const status = normalizeTournamentAvailabilityStatus(
      item.responseStatus || planning?.availabilityStatus
    );
    const assignedSquad = normalizeAssignedSquad(planning?.assignedSquad);
    const isAssigned = options.assigned && assignedSquad !== "UNASSIGNED";
    const canAssign = status === "YES" || status === "MAYBE";
    const readOnly = Boolean(options.readOnly);
    const updatePrefix = `${plan.planId}:${playerUsername}`;
    const preferredSquad = item.preferredSquad || planning?.preferredSquad;
    const moveButtons = ["A", "B", "C", "RESERVE"];
    const isCurrentUser =
      String(playerUsername || "").trim().toLowerCase() ===
      String(username || "").trim().toLowerCase();
    const metaText = [
      item.playerCountry || planning?.playerCountry || "No country",
      formatPlayerAvailabilityStatus(status),
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <div
        key={`${options.group || "squad"}:${playerUsername}`}
        style={playerHubStyles.squadPlayerRow}
      >
        <div style={playerHubStyles.squadPlayerInfo}>
          <strong style={playerHubStyles.squadPlayerName}>
            {item.playerDisplayName || planning?.playerDisplayName || playerUsername || "Player"}
          </strong>
          <span style={playerHubStyles.squadPlayerMeta}>
            {metaText}
          </span>
          <div style={playerHubStyles.squadBadgeRow}>
            {preferredSquad && preferredSquad !== "NO_PREFERENCE" ? (
              <span style={playerHubStyles.squadTinyBadge}>
                Pref {squadDisplayName(preferredSquad, plan)}
              </span>
            ) : null}
            {isCurrentUser ? (
              <span style={playerHubStyles.squadTinyBadge}>You</span>
            ) : null}
          </div>
        </div>
        <div style={playerHubStyles.squadMoveRow}>
          {canAssign && !options.pending && !readOnly ? (
            <>
              {moveButtons.map((squad) => (
                <button
                  key={squad}
                  type="button"
                  style={{
                    ...playerHubStyles.squadMoveButton,
                    ...(assignedSquad === squad
                      ? playerHubStyles.squadMoveButtonActive
                      : {}),
                    ...(squadPlanningUpdatingId === `${updatePrefix}:${squad}`
                      ? playerHubStyles.adminDisabledButton
                      : {}),
                  }}
                  disabled={squadPlanningUpdatingId === `${updatePrefix}:${squad}`}
                  aria-label={`Move to ${squadDisplayName(squad, plan)}`}
                  title={squadDisplayName(squad, plan)}
                  onClick={() => handleAssignTournamentSquad(plan, item, squad)}
                >
                  {squad === "RESERVE" ? "Res" : squad}
                </button>
              ))}
              {isAssigned ? (
                <button
                  type="button"
                  style={playerHubStyles.squadMoveButton}
                  disabled={
                    squadPlanningUpdatingId === `${updatePrefix}:UNASSIGNED`
                  }
                  onClick={() =>
                    handleAssignTournamentSquad(plan, item, "UNASSIGNED")
                  }
                >
                  Remove
                </button>
              ) : null}
            </>
          ) : readOnly && isAssigned ? (
            <span style={playerHubStyles.chip}>Locked</span>
          ) : null}
        </div>
      </div>
    );
  }

  function renderSquadPlanningBoard(plan, availability, planning, draftData = {}) {
    const boardRosterStatus = normalizeRosterStatus(
      draftData?.roster?.rosterStatus
    );
    const boardRosterLock = rosterLockForSource({
      ...plan,
      roster: draftData?.roster || null,
    });
    const boardLateChangeAllowed = boardRosterStatus === "CHANGE_REQUESTED";
    const boardDeadlineLocked = Boolean(
      boardRosterLock.afterDeadline && !boardLateChangeAllowed
    );
    const boardLocked = boardRosterStatus === "LOCKED" || boardDeadlineLocked;
    const activePlanning = planning.filter(
      (item) => item.planningStatus !== "REMOVED"
    );
    const planningByUsername = activePlanning.reduce((map, item) => {
      const playerUsername = String(item.playerUsername || "").toLowerCase();
      if (playerUsername) map[playerUsername] = item;
      return map;
    }, {});
    const removedPlayernames = planning
      .filter((item) => item.planningStatus === "REMOVED")
      .reduce((map, item) => {
        const playerUsername = String(item.playerUsername || "").toLowerCase();
        if (playerUsername) map[playerUsername] = true;
        return map;
      }, {});
    const assignableAvailability = availability.filter((item) => {
      const status = normalizeTournamentAvailabilityStatus(item.responseStatus);
      return status === "YES" || status === "MAYBE";
    });
    const availablePlayers = assignableAvailability.filter((item) => {
      const playerUsername = String(item.playerUsername || "").toLowerCase();
      const playerPlanning = planningByUsername[playerUsername];
      return (
        !removedPlayernames[playerUsername] &&
        (!playerPlanning ||
          normalizeAssignedSquad(playerPlanning.assignedSquad) === "UNASSIGNED")
      );
    });
    const pendingPlayers = availability.filter(
      (item) => normalizeTournamentAvailabilityStatus(item.responseStatus) === "PENDING"
    );
    const assignedGroups = [
      ["A", squadDisplayName("A", plan)],
      ["B", squadDisplayName("B", plan)],
      ["C", squadDisplayName("C", plan)],
      ["RESERVE", squadDisplayName("RESERVE", plan)],
    ].map(([squad, label]) => ({
      squad,
      label,
      items: activePlanning.filter(
        (item) => normalizeAssignedSquad(item.assignedSquad) === squad
      ),
    }));
    const availabilityByUsername = availability.reduce((map, item) => {
      const playerUsername = String(item.playerUsername || "").toLowerCase();
      if (playerUsername) map[playerUsername] = item;
      return map;
    }, {});
    const goingCount = availability.filter(
      (item) => normalizeTournamentAvailabilityStatus(item.responseStatus) === "YES"
    ).length;
    const maybeCount = availability.filter(
      (item) =>
        normalizeTournamentAvailabilityStatus(item.responseStatus) === "MAYBE"
    ).length;
    const assignedCount = assignedGroups.reduce(
      (count, group) => count + group.items.length,
      0
    );
    const pendingCount = pendingPlayers.length;
    const planSquadNames = squadNameEditorValues(plan);
    const hasNameDraft = hasSquadNameDraft(plan);
    const hasNameChanges = squadNameEditorHasChanges(plan);
    const isSavingNames = squadNamesSavingPlanId === plan.planId;
    const editingSquadName = squadNameEditingSlot(plan);
    const squadSuggestionBase =
      plan.clubTeamName || teamProfile?.clubTeamName || selectedProfileTeamName;

    return (
      <section style={playerHubStyles.squadBoard} data-testid="plan-teams-board">
        <div style={playerHubStyles.squadBoardHeader}>
          <div style={playerHubStyles.profileMeta}>
            <div style={playerHubStyles.sectionTitle}>
              Plan teams
            </div>
            <div style={playerHubStyles.cardText}>
              {[
                plan.tournamentName || "Tournament",
                plan.clubTeamName || "Team",
                boardLocked ? "Locked roster" : "Planning only",
              ].join(" · ")}
            </div>
          </div>
          <div style={playerHubStyles.chipRow}>
            <span style={playerHubStyles.chip}>
              Going: {goingCount}
            </span>
            <span style={playerHubStyles.chip}>
              Maybe: {maybeCount}
            </span>
            <span style={playerHubStyles.chip}>
              Assigned: {assignedCount}/{assignableAvailability.length}
            </span>
            <span style={playerHubStyles.chip}>
              Pending: {pendingCount}
            </span>
            <span style={playerHubStyles.chip}>
              {boardRosterStatus === "LOCKED"
                ? "Locked"
                : boardDeadlineLocked
                  ? "After deadline"
                  : "Not official roster"}
            </span>
            {rosterLockLabel(boardRosterLock) ? (
              <span style={playerHubStyles.chip}>
                {rosterLockLabel(boardRosterLock)}
              </span>
            ) : null}
            {squadPlanningUpdatingId === `load:${plan.planId}` ? (
              <span style={playerHubStyles.chip}>Loading...</span>
            ) : null}
          </div>
        </div>

        {boardDeadlineLocked ? (
          <div style={playerHubStyles.profileMessage}>
            Changes after this time require organizer/admin approval. Contact
            organizer/admin for late roster changes.
          </div>
        ) : null}

        <section style={playerHubStyles.squadNamesPanel}>
          <div style={playerHubStyles.homeCardHeader}>
            <div style={playerHubStyles.profileMeta}>
              <strong style={playerHubStyles.previewTitle}>Squad names</strong>
              <span style={playerHubStyles.previewSubtitle}>
                Display labels for Team A/B/C and Reserve.
              </span>
            </div>
            <div style={playerHubStyles.profileActions}>
              {hasNameDraft ? (
                <button
                  type="button"
                  style={playerHubStyles.feedTinyAction}
                  onClick={() => resetSquadDisplayNames(plan)}
                  disabled={boardLocked || isSavingNames}
                >
                  Discard
                </button>
              ) : null}
              <button
                type="button"
                style={playerHubStyles.feedTinyAction}
                onClick={() => saveSquadDisplayNames(plan)}
                disabled={
                  boardLocked ||
                  isSavingNames ||
                  !hasNameChanges ||
                  !updateTournamentSquadLabels
                }
              >
                {isSavingNames ? "Saving..." : "Save names"}
              </button>
            </div>
          </div>
          <div style={playerHubStyles.compactSquadNamesGrid}>
            {captainSquadNameSlots.map((squad) => {
              const fallback = squadNameEditorSlotLabel(squad);
              const suggestion = squadNameSuggestion(
                squad,
                squadSuggestionBase
              );
              const displayName = passportText(planSquadNames[squad], fallback);
              const hasCustomName = Boolean(passportText(planSquadNames[squad]));
              const isEditingName = editingSquadName === squad;
              return (
                <section key={squad} style={playerHubStyles.compactSquadNameField}>
                  <div style={playerHubStyles.squadNameMapRow}>
                    <div style={playerHubStyles.squadNameMapText}>
                      <span style={playerHubStyles.squadNameInternal}>
                        {fallback}
                      </span>
                      <span style={playerHubStyles.squadNameArrow}>{"->"}</span>
                      <strong style={playerHubStyles.squadNameDisplay}>
                        {displayName}
                      </strong>
                    </div>
                    <div style={playerHubStyles.squadNameActions}>
                      <button
                        type="button"
                        style={playerHubStyles.feedTinyAction}
                        onClick={() => toggleSquadNameEdit(plan, squad)}
                        disabled={boardLocked || isSavingNames}
                      >
                        {isEditingName ? "Done" : "Rename"}
                      </button>
                      <button
                        type="button"
                        style={playerHubStyles.feedTinyAction}
                        onClick={() => resetSquadDisplayName(plan, squad)}
                        disabled={boardLocked || isSavingNames || !hasCustomName}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  {isEditingName ? (
                    <div style={playerHubStyles.squadNameEditPanel}>
                      <input
                        style={playerHubStyles.squadNameInput}
                        value={planSquadNames[squad] || ""}
                        placeholder={suggestion}
                        maxLength={40}
                        aria-label={`Display name for ${fallback}`}
                        disabled={boardLocked || isSavingNames}
                        onChange={(event) =>
                          updateSquadDisplayName(plan, squad, event.target.value)
                        }
                      />
                      <div style={playerHubStyles.squadNameSuggestionRow}>
                        {captainSquadNameSuggestionSuffixes.map((suffix) => (
                          <button
                            key={suffix}
                            type="button"
                            style={playerHubStyles.squadNameSuggestionButton}
                            disabled={boardLocked || isSavingNames}
                            onClick={() =>
                              applySquadNameSuggestion(plan, squad, suffix)
                            }
                          >
                            {suffix}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span style={playerHubStyles.squadNameHint}>
                      {hasCustomName
                        ? "Display label only. Planning stays on the internal slot."
                        : `Fallback label. Suggested: ${suggestion}`}
                    </span>
                  )}
                </section>
              );
            })}
          </div>
        </section>

        <div style={playerHubStyles.squadBuilderLayout}>
          <section style={playerHubStyles.squadColumn} data-testid="plan-available">
            <div style={playerHubStyles.squadColumnHeader}>
              <span>Available players</span>
              <strong>{availablePlayers.length}</strong>
            </div>
            {availablePlayers.length ? (
              availablePlayers.map((item) =>
                renderSquadPlayerRow(
                  plan,
                  item,
                  planningByUsername[String(item.playerUsername || "").toLowerCase()],
                  {
                    group: "available",
                    showResponse: true,
                    readOnly: boardLocked,
                  }
                )
              )
            ) : (
              <div style={playerHubStyles.emptyPreview}>
                No available players yet. Ask team members or wait for replies.
              </div>
            )}
          </section>

          <section style={playerHubStyles.squadTeamsGrid}>
            {assignedGroups.map((group) => (
              <section
                key={group.squad}
                style={playerHubStyles.squadTeamBox}
                data-testid={`plan-team-${group.squad}`}
              >
                <div style={playerHubStyles.squadColumnHeader}>
                  <span>{group.label}</span>
                  <strong>{group.items.length}</strong>
                </div>
                {group.items.length ? (
                  group.items.map((item) =>
                    renderSquadPlayerRow(
                      plan,
                      {
                        ...item,
                        ...(availabilityByUsername[
                          String(item.playerUsername || "").toLowerCase()
                        ] || {}),
                      },
                      item,
                      {
                        group: group.squad,
                        assigned: true,
                        showResponse: true,
                        readOnly: boardLocked,
                      }
                    )
                  )
                ) : (
                  <div style={playerHubStyles.squadEmptyRow}>No players</div>
                )}
              </section>
            ))}
          </section>
        </div>

        {pendingPlayers.length ? (
          <div style={playerHubStyles.squadPendingPanel}>
            <button
              type="button"
              style={playerHubStyles.squadPendingToggle}
              onClick={() =>
                setExpandedSquadPendingPlanId((current) =>
                  current === plan.planId ? "" : plan.planId
                )
              }
            >
              Pending replies: {pendingPlayers.length}
            </button>
            {expandedSquadPendingPlanId === plan.planId ? (
              <section style={playerHubStyles.squadPendingList}>
                {pendingPlayers.map((item) =>
                  renderSquadPlayerRow(plan, item, null, {
                    group: "pending",
                    pending: true,
                    showResponse: true,
                  })
                )}
              </section>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }

  function renderRosterDraftPanel(plan, planning, draftData = {}) {
    const plannedPlayers = Array.isArray(planning)
      ? planning.filter(
          (item) =>
            item.planningStatus !== "REMOVED" &&
            normalizeAssignedSquad(item.assignedSquad) !== "UNASSIGNED"
        )
      : [];
    const roster = draftData?.roster || null;
    const rosterStatus = normalizeRosterStatus(roster?.rosterStatus);
    const rosterIsActive = Boolean(roster && rosterStatus !== "CANCELLED");
    const rosterIsSubmitted = rosterIsActive && rosterStatus === "SUBMITTED";
    const rosterIsApproved = rosterIsActive && rosterStatus === "APPROVED";
    const rosterIsRejected = rosterIsActive && rosterStatus === "REJECTED";
    const rosterIsLocked = rosterIsActive && rosterStatus === "LOCKED";
    const rosterIsLateChangeRequested =
      rosterIsActive && rosterStatus === "CHANGE_REQUESTED";
    const rosterLock = rosterLockForSource({ ...plan, ...(roster || {}) });
    const rosterAfterDeadline = Boolean(rosterLock.afterDeadline);
    const rosterLockText = rosterLockLabel(rosterLock);
    const changedAfterDeadline = rosterChangedAfterDeadline(roster || {}, rosterLock);
    const rosterCanEdit =
      (!rosterIsActive ||
        rosterStatus === "DRAFT" ||
        rosterIsRejected ||
        rosterIsLateChangeRequested) &&
      (!rosterAfterDeadline || rosterIsLateChangeRequested);
    const rosterCanSubmit =
      rosterIsActive &&
      (rosterStatus === "DRAFT" || rosterIsRejected || rosterIsLateChangeRequested) &&
      (!rosterAfterDeadline || rosterIsLateChangeRequested);
    const rosterPlayers = rosterIsActive && Array.isArray(draftData?.players)
      ? draftData.players.filter((player) => player.playerStatus !== "REMOVED")
      : [];
    const players = rosterIsActive ? rosterPlayers : plannedPlayers;
    const plannedSignature = plannedPlayers
      .map(
        (player) =>
          `${String(player.playerUsername || "").toLowerCase()}:${normalizeAssignedSquad(
            player.assignedSquad
          )}`
      )
      .sort()
      .join("|");
    const draftSignature = rosterPlayers
      .map(
        (player) =>
          `${String(player.playerUsername || "").toLowerCase()}:${normalizeAssignedSquad(
            player.assignedSquad
          )}`
      )
      .sort()
      .join("|");
    const planningChanged = Boolean(
      rosterIsActive && plannedSignature && plannedSignature !== draftSignature
    );
    const isUpdating = rosterDraftUpdatingPlanId === plan.planId;
    const submitConfirmOpen = submitRosterConfirmPlanId === plan.planId;
    const groups = [
      ["A", squadDisplayName("A", plan)],
      ["B", squadDisplayName("B", plan)],
      ["C", squadDisplayName("C", plan)],
      ["RESERVE", squadDisplayName("RESERVE", plan)],
    ].map(([squad, label]) => ({
      squad,
      label,
      items: players.filter(
        (player) => normalizeAssignedSquad(player.assignedSquad) === squad
      ),
    }));

    return (
      <section style={playerHubStyles.squadBoard} data-testid="roster-draft-panel">
        <div style={playerHubStyles.squadBoardHeader}>
          <div style={playerHubStyles.profileMeta}>
            <div style={playerHubStyles.sectionTitle}>
              {rosterIsLocked
                ? "Official roster"
                : rosterIsActive
                  ? "Roster draft"
                  : "Roster draft preview"}
            </div>
            <div style={playerHubStyles.cardText}>
              {plan.tournamentName || "Tournament"} · {plan.clubTeamName || "Team"}
            </div>
          </div>
          <div style={playerHubStyles.chipRow}>
            <span style={playerHubStyles.chip}>
              {rosterIsActive ? formatRosterStatus(rosterStatus) : "Planning only"}
            </span>
            {rosterIsSubmitted ? (
              <span style={playerHubStyles.chip}>Waiting for review</span>
            ) : null}
            {rosterIsApproved ? (
              <span style={playerHubStyles.chip}>Ready to lock</span>
            ) : null}
            {rosterIsLocked ? (
              <span style={playerHubStyles.chip}>Official roster</span>
            ) : null}
            {rosterIsLateChangeRequested ? (
              <span style={playerHubStyles.chip}>Late change requested</span>
            ) : null}
            {!rosterIsActive ? (
              <span style={playerHubStyles.chip}>Not saved</span>
            ) : null}
            {rosterAfterDeadline ? (
              <span style={playerHubStyles.chip}>After deadline</span>
            ) : null}
            {changedAfterDeadline ? (
              <span style={playerHubStyles.chip}>Late change</span>
            ) : null}
            {rosterLockText ? (
              <span style={playerHubStyles.chip}>{rosterLockText}</span>
            ) : null}
            <span style={playerHubStyles.chip}>{players.length} players</span>
          </div>
        </div>

        {rosterAfterDeadline && !rosterIsLocked ? (
          <div style={playerHubStyles.profileMessage}>
            Changes after this time require organizer/admin approval. Contact
            organizer/admin for late changes.
          </div>
        ) : null}

        {rosterIsActive ? (
          <div style={playerHubStyles.chipRow}>
            {roster.submittedAt ? (
              <span style={playerHubStyles.chip}>
                Submitted: {new Date(roster.submittedAt).toLocaleString()}
              </span>
            ) : null}
            {roster.reviewedAt ? (
              <span style={playerHubStyles.chip}>
                Reviewed: {new Date(roster.reviewedAt).toLocaleString()}
              </span>
            ) : null}
            {roster.lockedAt ? (
              <span style={playerHubStyles.chip}>
                Locked: {new Date(roster.lockedAt).toLocaleString()}
              </span>
            ) : null}
            {roster.lockedBy || roster.reviewedBy || roster.submittedBy ? (
              <span style={playerHubStyles.chip}>
                By: {roster.lockedBy || roster.reviewedBy || roster.submittedBy}
              </span>
            ) : null}
          </div>
        ) : null}

        {planningChanged ? (
          <div style={playerHubStyles.profileMessage}>
            {rosterIsLocked
              ? "Roster is locked. Planning changes will not update the official roster."
              : rosterIsSubmitted || rosterIsApproved
                ? "Planning changed after submitted draft. Withdraw or create new draft later."
              : "Planning changed after draft was created."}
          </div>
        ) : null}

        {rosterIsRejected && roster?.adminNote ? (
          <div style={playerHubStyles.profileMessage}>
            Admin note: {roster.adminNote}
          </div>
        ) : null}

        {players.length ? (
          <section style={playerHubStyles.squadTeamsGrid}>
            {groups.map((group) => (
              <section key={group.squad} style={playerHubStyles.squadTeamBox}>
                <div style={playerHubStyles.squadColumnHeader}>
                  <span>{group.label}</span>
                  <strong>{group.items.length}</strong>
                </div>
                {group.items.length ? (
                  group.items.map((player) => (
                    <div
                      key={`${group.squad}:${player.playerUsername}`}
                      style={playerHubStyles.squadPlayerRow}
                    >
                      <div style={playerHubStyles.squadPlayerInfo}>
                        <strong style={playerHubStyles.squadPlayerName}>
                          {player.playerDisplayName ||
                            player.playerUsername ||
                            "Player"}
                        </strong>
                        <span style={playerHubStyles.squadPlayerMeta}>
                          {[
                            player.playerCountry || "No country",
                            squadDisplayName(player.assignedSquad, plan),
                          ].join(" · ")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={playerHubStyles.squadEmptyRow}>No players</div>
                )}
              </section>
            ))}
          </section>
        ) : (
          <div style={playerHubStyles.emptyPreview}>
            Assign players to preview the roster draft here.
          </div>
        )}

        <div style={playerHubStyles.profileActions}>
          {rosterCanEdit ? (
            <button
              type="button"
              data-testid="create-roster-draft"
              style={{
                ...playerHubStyles.saveButton,
                ...(!plannedPlayers.length || isUpdating
                  ? playerHubStyles.saveButtonDisabled
                  : {}),
              }}
              disabled={!plannedPlayers.length || isUpdating}
              onClick={() => handleBuildRosterDraft(plan)}
            >
              {isUpdating
                ? "Saving..."
                : rosterIsActive
                  ? rosterIsRejected
                    ? "Update draft"
                    : "Update draft"
                  : "Create roster draft"}
            </button>
          ) : rosterIsSubmitted ? (
            <span style={playerHubStyles.chip}>Submitted</span>
          ) : rosterIsApproved ? (
            <button
              type="button"
              style={{
                ...playerHubStyles.saveButton,
                ...(isUpdating ? playerHubStyles.saveButtonDisabled : {}),
              }}
              disabled={isUpdating}
              onClick={() => handleCaptainLockRoster(plan, roster)}
            >
              {isUpdating ? "Locking..." : "Lock roster"}
            </button>
          ) : rosterIsLocked ? (
            <span style={playerHubStyles.chip}>Locked</span>
          ) : (
            <span style={playerHubStyles.chip}>{formatRosterStatus(rosterStatus)}</span>
          )}
          {rosterIsActive ? (
            <>
              <button
                type="button"
                style={playerHubStyles.adminActionButton}
                onClick={() => setExpandedSquadPlanId(plan.planId)}
              >
                {rosterIsSubmitted || rosterIsApproved || rosterIsLocked
                  ? "View roster"
                  : "Edit planning"}
              </button>
              {rosterCanSubmit ? (
                <>
                  <button
                    type="button"
                    data-testid="submit-roster-draft"
                    style={{
                      ...playerHubStyles.adminActionButton,
                      ...(isUpdating ? playerHubStyles.adminDisabledButton : {}),
                    }}
                    disabled={isUpdating}
                    onClick={() => setSubmitRosterConfirmPlanId(plan.planId)}
                  >
                    {rosterIsRejected ? "Resubmit" : "Submit draft"}
                  </button>
                  <button
                    type="button"
                    style={{
                      ...playerHubStyles.adminActionButton,
                      ...playerHubStyles.adminDangerButton,
                      ...(isUpdating ? playerHubStyles.adminDisabledButton : {}),
                    }}
                    disabled={isUpdating}
                    onClick={() => handleCancelRosterDraft(plan)}
                  >
                    Cancel draft
                  </button>
                </>
              ) : null}
            </>
          ) : null}
          {rosterDraftMessage ? (
            <span style={playerHubStyles.profileMessage}>
              {rosterDraftMessage}
            </span>
          ) : null}
        </div>

        {submitConfirmOpen ? (
          <div style={playerHubStyles.profileMessage}>
            <strong>Submit roster draft?</strong>
            <span>
              You can still build final official roster later. This only sends
              the draft for review.
            </span>
            <div style={playerHubStyles.profileActions}>
              <button
                type="button"
                style={{
                  ...playerHubStyles.saveButton,
                  ...(isUpdating || rosterAfterDeadline
                    ? playerHubStyles.saveButtonDisabled
                    : {}),
                }}
                disabled={isUpdating || rosterAfterDeadline}
                onClick={() => handleSubmitRosterDraft(plan)}
              >
                {isUpdating ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                style={playerHubStyles.adminActionButton}
                disabled={isUpdating}
                onClick={() => setSubmitRosterConfirmPlanId("")}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  function rosterSeriesReviewKey(roster = {}) {
    return [
      String(roster.tournamentId || "").trim() || "tournament",
      rosterLockKey(
        roster.className ||
          roster.seriesName ||
          roster.squadLabel ||
          "default-series"
      ),
    ].join(":");
  }

  function buildAdminRosterDuplicateWarnings(rosters = []) {
    const warningsByRosterId = {};
    const playersBySeries = {};
    const reviewStatuses = {
      SUBMITTED: true,
      APPROVED: true,
      LOCKED: true,
    };

    (Array.isArray(rosters) ? rosters : []).forEach((roster) => {
      const rosterId = String(roster?.rosterId || "");
      if (!rosterId || !reviewStatuses[normalizeRosterStatus(roster?.rosterStatus)]) {
        return;
      }
      const seriesKey = rosterSeriesReviewKey(roster);
      const seenInRoster = {};
      (Array.isArray(roster.players) ? roster.players : []).forEach((player) => {
        if (!player || player.playerStatus === "REMOVED") return;
        const playerKey = String(player.playerUsername || "")
          .trim()
          .toLowerCase();
        if (!playerKey) return;
        const playerName =
          player.playerDisplayName || player.playerUsername || "Player";
        if (seenInRoster[playerKey]) {
          if (!warningsByRosterId[rosterId]) warningsByRosterId[rosterId] = [];
          warningsByRosterId[rosterId].push(
            `${playerName} appears twice on this roster.`
          );
        }
        seenInRoster[playerKey] = true;
        if (!playersBySeries[seriesKey]) playersBySeries[seriesKey] = {};
        if (!playersBySeries[seriesKey][playerKey]) {
          playersBySeries[seriesKey][playerKey] = [];
        }
        playersBySeries[seriesKey][playerKey].push({
          rosterId,
          teamName: roster.clubTeamName || "Team",
          playerName,
          status: normalizeRosterStatus(roster.rosterStatus),
          className: roster.className || roster.squadLabel || "series",
        });
      });
    });

    Object.values(playersBySeries).forEach((players) => {
      Object.values(players).forEach((entries) => {
        const rosterIds = Array.from(new Set(entries.map((entry) => entry.rosterId)));
        if (rosterIds.length < 2) return;
        entries.forEach((entry) => {
          const otherTeams = entries
            .filter((other) => other.rosterId !== entry.rosterId)
            .map((other) => other.teamName)
            .filter(Boolean);
          if (!warningsByRosterId[entry.rosterId]) {
            warningsByRosterId[entry.rosterId] = [];
          }
          warningsByRosterId[entry.rosterId].push(
            `${entry.playerName} also appears on ${Array.from(
              new Set(otherTeams)
            ).join(", ")} in ${entry.className}.`
          );
        });
      });
    });

    return Object.fromEntries(
      Object.entries(warningsByRosterId).map(([rosterId, warnings]) => [
        rosterId,
        Array.from(new Set(warnings)),
      ])
    );
  }

  async function handleSaveTeamProfile(event) {
    event.preventDefault();
    if (!saveMyTeamProfile || teamProfileStatus === "saving") return;

    setTeamProfileStatus("saving");
    setTeamProfileMessage("Saving team profile...");

    try {
      const data = await saveMyTeamProfile(teamProfileDraft);
      const nextTeamProfile = data?.teamProfile || null;
      setTeamProfile(nextTeamProfile);
      setTeamNeeds(Array.isArray(data?.needs) ? data.needs : []);
      setTeamProfileDraft({
        country: nextTeamProfile?.country || "",
        teamLevel: nextTeamProfile?.teamLevel || "",
        teamDescription: nextTeamProfile?.teamDescription || "",
        contactNote: nextTeamProfile?.contactNote || "",
        active: nextTeamProfile?.active !== false,
      });
      setTeamProfileStatus("ready");
      setTeamProfileMessage("Team profile saved.");
      setShowTeamEditor(false);
      await loadTeamNeeds();
      await loadAdminTeamProfiles();
    } catch (error) {
      setTeamProfileStatus("error");
      setTeamProfileMessage(
        cleanPlayerHubError(error, "Could not save team profile.")
      );
    }
  }

  function openTeamIdentityRequestForm() {
    setTeamIdentityDraft({
      requestedName: currentTeamIdentity.name || "",
      requestedCountry: currentTeamIdentity.country || "",
      requestedCity: currentTeamIdentity.city || "",
      reason: "",
    });
    setShowTeamIdentityRequestForm(true);
    setTeamIdentityMessage("");
  }

  async function handleSubmitTeamIdentityRequest(event) {
    event.preventDefault();
    if (!requestTeamIdentityChange || teamIdentityStatus === "saving") return;

    setTeamIdentityStatus("saving");
    setTeamIdentityMessage("Sending identity change request...");

    try {
      const request = await requestTeamIdentityChange(teamIdentityDraft);
      if (request) {
        setTeamIdentityRequests((current) => [request, ...current]);
      }
      setTeamIdentityStatus("ready");
      setTeamIdentityMessage("Identity change request sent.");
      setShowTeamIdentityRequestForm(false);
      await loadTeamIdentityRequests();
      await loadAdminTeamIdentityRequests();
    } catch (error) {
      setTeamIdentityStatus("error");
      setTeamIdentityMessage(
        String(error?.message || "").toLowerCase().includes("unknown action")
          ? "Team identity request backend is not deployed yet."
          : cleanPlayerHubError(error, "Could not send identity change request.")
      );
    }
  }

  async function handleSaveTeamNeed(event) {
    event.preventDefault();
    if (!createOrUpdateTeamNeed || teamProfileStatus === "saving") return;

    setTeamProfileStatus("saving");
    setTeamProfileMessage("Saving team need...");

    try {
      const data = await createOrUpdateTeamNeed(teamNeedDraft);
      setTeamNeeds(Array.isArray(data?.needs) ? data.needs : []);
      setTeamNeedDraft({
        needType: "PLAYER",
        neededCount: 1,
        needText: "",
        visibility: "internal",
        needContext: "general",
      });
      setTeamProfileStatus("ready");
      setTeamProfileMessage("Team need saved.");
      setShowTeamNeedForm(false);
      await loadTeamNeeds();
      await loadCaptainInterests();
      await loadAdminTeamProfiles();
    } catch (error) {
      setTeamProfileStatus("error");
      setTeamProfileMessage(
        cleanPlayerHubError(error, "Could not save team need.")
      );
    }
  }

  async function handlePublishTournamentAd(event) {
    event.preventDefault();
    if (!createOrUpdateTeamNeed || teamProfileStatus === "saving") return;

    const selectedTournament = tournamentOptions.find(
      (option) =>
        String(option.id || option.tournamentId || option.name || "") ===
        String(tournamentAdDraft.tournamentId || "")
    );
    const tournamentId = String(
      selectedTournament?.id ||
        selectedTournament?.tournamentId ||
        tournamentAdDraft.tournamentId ||
        ""
    ).trim();
    const tournamentName = String(
      selectedTournament?.name ||
        selectedTournament?.tournamentName ||
        tournamentOptionLabel(selectedTournament) ||
        ""
    ).trim();

    if (!tournamentId && !tournamentName) {
      setTeamProfileStatus("error");
      setTeamProfileMessage("Select a tournament before publishing a player ad.");
      return;
    }

    setTeamProfileStatus("saving");
    setTeamProfileMessage("Publishing player ad...");

    try {
      const data = await createOrUpdateTeamNeed({
        ...tournamentAdDraft,
        tournamentId,
        tournamentName,
        visibility: "published",
        isPublished: true,
        needContext: "tournament",
        sourceType: "TOURNAMENT_AD",
      });
      setTeamNeeds(Array.isArray(data?.needs) ? data.needs : []);
      setTournamentAdDraft({
        needType: "PLAYER",
        neededCount: 1,
        needText: "",
        tournamentId: "",
        className: "",
        squadLabel: "",
        deadlineAt: "",
      });
      setTeamProfileStatus("ready");
      setTeamProfileMessage("Tournament player ad published.");
      setShowTournamentAdForm(false);
      await loadTeamNeeds();
      await loadCaptainInterests();
      await loadAdminTeamProfiles();
    } catch (error) {
      setTeamProfileStatus("error");
      setTeamProfileMessage(
        cleanPlayerHubError(error, "Could not publish player ad.")
      );
    }
  }

  function toggleTeamActionPanel(panel) {
    const isSamePanel =
      (panel === "edit" && showTeamEditor) ||
      (panel === "need" && showTeamNeedForm) ||
      (panel === "ad" && showTournamentAdForm) ||
      (panel === "plan" && showTournamentPlanForm);
    const nextPanel = isSamePanel ? "" : panel;

    setShowTeamEditor(nextPanel === "edit");
    setShowTeamNeedForm(nextPanel === "need");
    setShowTournamentAdForm(nextPanel === "ad");
    setShowTournamentPlanForm(nextPanel === "plan");
  }

  async function handleCloseTeamNeed(need) {
    if (!closeTeamNeed || !need?.needId) return;

    setTeamProfileStatus("saving");
    setTeamProfileMessage("");
    try {
      const closedNeed = await closeTeamNeed(need.needId);
      setTeamNeeds((current) =>
        current.map((item) =>
          String(item.needId || "") === String(closedNeed?.needId || need.needId)
            ? { ...item, ...(closedNeed || {}), status: "CLOSED" }
            : item
        )
      );
      setTeamProfileStatus("ready");
      setTeamProfileMessage("Team need closed.");
      await loadTeamNeeds();
      await loadAdminTeamProfiles();
    } catch (error) {
      setTeamProfileStatus("error");
      setTeamProfileMessage(
        cleanPlayerHubError(error, "Could not close team need.")
      );
    }
  }

  async function updateAdminTeamProfile(teamProfile, patch) {
    if (!isAdmin || !updateTeamProfileAdmin || !teamProfile?.teamProfileId) return;

    setAdminTeamProfileUpdatingId(teamProfile.teamProfileId);
    setAdminTeamProfileMessage("");
    try {
      const updatedTeamProfile = await updateTeamProfileAdmin(
        teamProfile.teamProfileId,
        patch
      );
      if (updatedTeamProfile) {
        setAdminTeamProfiles((current) =>
          current.map((item) =>
            String(item.teamProfileId || "") ===
            String(updatedTeamProfile.teamProfileId || "")
              ? { ...item, ...updatedTeamProfile }
              : item
          )
        );
      }
      setAdminTeamProfileStatus("ready");
      setAdminTeamProfileMessage("Team profile updated.");
      await loadTeamNeeds();
    } catch (error) {
      setAdminTeamProfileStatus("error");
      setAdminTeamProfileMessage(
        cleanPlayerHubError(error, "Could not update team profile.")
      );
    } finally {
      setAdminTeamProfileUpdatingId("");
    }
  }

  async function handleReviewTeamIdentityRequest(request, decision) {
    if (
      !isAdmin ||
      !reviewTeamIdentityChangeRequest ||
      !request?.requestId
    ) {
      return;
    }

    setAdminTeamIdentityUpdatingId(request.requestId);
    setAdminTeamIdentityMessage("");

    try {
      await reviewTeamIdentityChangeRequest(
        request.requestId,
        decision,
        adminTeamIdentityNotes[request.requestId] || ""
      );
      setAdminTeamIdentityStatus("ready");
      setAdminTeamIdentityMessage(
        decision === "APPROVED"
          ? "Identity change approved."
          : "Identity change rejected."
      );
      await loadAdminTeamIdentityRequests();
      await loadTeamIdentityRequests();
      await loadAdminClubTeams();
      await loadActiveClubTeams();
      await loadTeamProfile();
      await loadTeamNeeds();
      await loadAdminTeamProfiles();
    } catch (error) {
      setAdminTeamIdentityStatus("error");
      setAdminTeamIdentityMessage(
        cleanPlayerHubError(error, "Could not review identity request.")
      );
    } finally {
      setAdminTeamIdentityUpdatingId("");
    }
  }

  async function updateAdminProfileStatus(profile, patch) {
    if (!isAdmin || !updatePlayerProfileAdminStatus || !profile?.username) return;

    setAdminUpdatingUsername(profile.username);
    setAdminReviewMessage("");

    try {
      const updatedProfile = await updatePlayerProfileAdminStatus(
        profile.username,
        patch
      );
      const safeUpdatedProfile = updatedProfile || {
        ...profile,
        ...(patch || {}),
      };
      const updatedUsername = String(
        safeUpdatedProfile.username || profile.username
      ).toLowerCase();

      setAdminProfiles((current) =>
        current.map((item) =>
          String(item.username || "").toLowerCase() === updatedUsername
            ? { ...item, ...safeUpdatedProfile }
            : item
        )
      );
      setAdminReviewStatus("ready");
      setAdminReviewMessage("Player profile review updated.");
    } catch (error) {
      setAdminReviewStatus("error");
      setAdminReviewMessage(
        cleanPlayerHubError(error, "Could not update player profile.")
      );
    } finally {
      setAdminUpdatingUsername("");
    }
  }

  function updateAdminPasswordDraft(profile, value) {
    const key = String(profile?.username || "").toLowerCase();
    if (!key) return;

    setAdminPasswordDrafts((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function resetAdminPlayerPassword(profile) {
    if (!isAdmin || !resetPlayerPasswordForAdmin || !profile?.username) return;

    const key = String(profile.username || "").toLowerCase();
    const newPassword = String(adminPasswordDrafts[key] || "").trim();

    if (!newPassword) {
      setAdminReviewStatus("error");
      setAdminReviewMessage("New password is required.");
      return;
    }

    setAdminUpdatingUsername(profile.username);
    setAdminReviewMessage("");

    try {
      const message = await resetPlayerPasswordForAdmin(
        profile.username,
        newPassword
      );
      setAdminPasswordDrafts((current) => ({
        ...current,
        [key]: "",
      }));
      setAdminReviewStatus("ready");
      setAdminReviewMessage(message || "Player password reset.");
    } catch (error) {
      setAdminReviewStatus("error");
      setAdminReviewMessage(
        cleanPlayerHubError(error, "Could not reset player password.")
      );
    } finally {
      setAdminUpdatingUsername("");
    }
  }

  function adminProfileStatusChips(profile) {
    return [
      profile.active ? "Active" : "Inactive",
      profile.publicVisible ? "Public requested" : "Private",
      profile.approved ? "Approved" : "Hidden",
    ];
  }

  function adminProfileValue(value, fallback = "Not set") {
    const text = String(value || "").trim();
    return text || fallback;
  }

  function passportStatusStyle(label) {
    const value = String(label || "").toUpperCase();
    if (
      value === "GOING" ||
      value === "APPROVED" ||
      value === "LOCKED"
    ) {
      return playerHubStyles.accessStatusApproved;
    }
    if (value === "NO" || value === "REJECTED" || value === "CANCELLED") {
      return playerHubStyles.accessStatusRejected;
    }
    return playerHubStyles.accessStatusPending;
  }

  async function confirmDeactivatePlayerAccount() {
    if (!pendingDeactivateProfile) return;
    const profile = pendingDeactivateProfile;
    setPendingDeactivateProfile(null);
    await updateAdminProfileStatus(profile, { active: false });
  }

  const primaryConfirmedTeam =
    confirmedTeamForSelected ||
    confirmedTeams.find((team) => team.memberStatus === "ACTIVE") ||
    null;
  const profileTeamLabel = primaryConfirmedTeam
    ? primaryConfirmedTeam.clubTeamName || "Confirmed team"
    : previewClubStatus;
  const showTeamPendingBadge =
    !primaryConfirmedTeam &&
    latestTeamMembershipRequest?.status === "PENDING" &&
    selectedProfileClubTeamId;
  const showTeamRejectedBadge =
    !primaryConfirmedTeam &&
    latestTeamMembershipRequest?.status === "REJECTED" &&
    selectedProfileClubTeamId;
  const profileBadges = [
    savedProfilePreview.publicVisible && !savedProfilePreview.approved
      ? "Public requested"
      : "",
    showTeamPendingBadge ? "Team pending" : "",
    showTeamRejectedBadge ? "Team rejected" : "",
    savedProfilePreview.publicVisible && savedProfilePreview.approved
      ? "Public"
      : "",
  ].filter(Boolean).slice(0, 2);
  const homeTeamCard =
    primaryConfirmedTeam ||
    (selectedProfileClubTeamId && latestTeamMembershipRequest
      ? latestTeamMembershipRequest
      : null);
  const plannedTeamItems = playerTournamentSquadPlanning.filter(
    (item) => normalizeAssignedSquad(item.assignedSquad) !== "UNASSIGNED"
  );
  const playerDashboardEvents = buildPlayerEventBundles(
    playerTournamentAvailability,
    plannedTeamItems,
    playerTournamentRosterStatus
  );
  const passportStats = calculatePlayerPassportStats({
    confirmedTeams,
    playerTournamentAvailability,
    playerTournamentRosterStatus,
    myTeamNeedInterests,
  });
  const passportTrainerRole = Boolean(
    savedProfilePreview.canUseTeamBuilder ||
      savedProfilePreview.trainerApproved ||
      accessRequests.some((request) => {
        const type = String(request?.requestType || request?.type || "").toUpperCase();
        const status = String(request?.status || "").toUpperCase();
        return (
          type === "TRAINER" &&
          (status === "APPROVED" || status === "ACCEPTED")
        );
      })
  );
  const passportRoleBadges = [
    "Player",
    canManageTeamProfile ? "Captain" : "",
    passportTrainerRole ? "Trainer" : "",
    isAdmin ? "Admin" : "",
  ].filter(Boolean);
  const homeSummaryBadges = Array.from(
    new Set([...passportRoleBadges, ...profileBadges])
  ).slice(0, 4);
  const passportMemberSince = formatCompactDate(
    primaryConfirmedTeam?.memberSince ||
      primaryConfirmedTeam?.confirmedAt ||
      primaryConfirmedTeam?.createdAt
  );
  const passportActiveRosterCount = playerTournamentRosterStatus.filter(
    (item) => normalizeRosterStatus(item?.rosterStatus || item?.status) !== "CANCELLED"
  ).length;
  const passportSquadActivityCount =
    plannedTeamItems.length + passportActiveRosterCount;
  const passportAchievements = buildPlayerAchievements({
    profile: savedProfilePreview,
    stats: passportStats,
    hasCaptainRole: canManageTeamProfile,
    squadActivityCount: passportSquadActivityCount,
  });
  const passportActivityItems = getRecentPlayerActivity(
    playerDashboardEvents,
    squadDisplayName
  );
  const passportStatCards = [
    ["Teams", passportStats.teamMembershipCount],
    ["Invites", passportStats.eventInvitationsCount],
    ["Going", passportStats.goingResponsesCount],
    ["Maybe", passportStats.maybeResponsesCount],
    ["No", passportStats.noResponsesCount],
    ["Pending", passportStats.pendingResponsesCount],
    ["Approved rosters", passportStats.rosterApprovedCount],
    ["Player ads", passportStats.playerAdsInterestsCount],
  ];
  const dedupedTournamentPlans = uniqueEventItems(tournamentPlans);
  const homeQuickStats = [
    ["Teams", passportStats.teamMembershipCount],
    ["Invites", passportStats.eventInvitationsCount],
    ["Going", passportStats.goingResponsesCount],
    ["Pending", passportStats.pendingResponsesCount],
  ];
  const pendingAvailabilityBundle = playerDashboardEvents.find((bundle) => {
    const status = normalizeTournamentAvailabilityStatus(
      bundle?.availability?.responseStatus ||
        bundle?.availability?.availabilityStatus ||
        bundle?.planning?.availabilityStatus
    );
    return Boolean(bundle?.availability) && status === "PENDING";
  });
  const approvedRosterBundle = playerDashboardEvents.find((bundle) => {
    const status = normalizeRosterStatus(
      bundle?.roster?.rosterStatus || bundle?.roster?.status
    );
    return Boolean(bundle?.roster) && (status === "APPROVED" || status === "LOCKED");
  });
  const captainHomeFlow = canManageTeamProfile
    ? buildCaptainTournamentFlow()
    : null;
  const captainHomeSteps = captainHomeFlow
    ? buildCaptainChecklistSteps(captainHomeFlow)
    : [];
  const captainHomeOpenTasks = captainHomeSteps.filter(
    (step) => step.status !== "done" && step.status !== "coming-soon"
  );
  const captainHomeNextTask =
    captainHomeOpenTasks.find((step) => step.status === "next") ||
    captainHomeOpenTasks.find((step) => step.status === "pending") ||
    captainHomeOpenTasks.find((step) => step.status === "blocked") ||
    captainHomeOpenTasks[0] ||
    null;
  const captainHasHomeChecklistAction = Boolean(
    canManageTeamProfile &&
      captainHomeNextTask &&
      (captainHomeFlow?.plan || captainHomeFlow?.hasTournamentOptions)
  );
  const homeProfileComplete = Boolean(
    passportText(savedProfilePreview.displayName, username) &&
      passportText(savedProfilePreview.country) &&
      passportText(savedProfilePreview.profileType) &&
      (savedProfilePreview.freeAgent ||
        selectedProfileClubTeamId ||
        primaryConfirmedTeam)
  );
  const homeNeedsProfileAction = !homeProfileComplete || needsClubTeamSetup;
  const homeRecentActivityItems = passportActivityItems.slice(0, 2);
  const pendingAvailabilityEvent = pendingAvailabilityBundle
    ? mergeEventRows(
        mergeEventRows(
          pendingAvailabilityBundle.base,
          pendingAvailabilityBundle.planning
        ),
        pendingAvailabilityBundle.availability
      )
    : null;
  const approvedRosterEvent = approvedRosterBundle
    ? mergeEventRows(
        mergeEventRows(
          approvedRosterBundle.base,
          approvedRosterBundle.planning
        ),
        approvedRosterBundle.roster
      )
    : null;
  const homeNextAction = pendingAvailabilityBundle
    ? {
        title: "Respond to availability",
        detail: [
          pendingAvailabilityEvent?.tournamentName || "Tournament",
          eventMetaText(pendingAvailabilityEvent),
        ]
          .filter(Boolean)
          .join(" / "),
        button: "Open Events",
        target: "events",
        status: "Pending",
      }
    : approvedRosterBundle
      ? {
          title: "View roster",
          detail: [
            approvedRosterEvent?.tournamentName || "Tournament",
            eventMetaText(approvedRosterEvent),
          ]
            .filter(Boolean)
            .join(" / "),
          button: "Open Events",
          target: "events",
          status: "Roster ready",
        }
      : captainHasHomeChecklistAction
        ? {
            title: "Continue captain checklist",
            detail: captainHomeNextTask?.detail || "Open Team to continue.",
            button: "Open Team",
            target: "team",
            status: captainChecklistStatusLabel(captainHomeNextTask?.status),
          }
        : homeNeedsProfileAction
          ? {
              title: "Complete profile",
              detail: needsClubTeamSetup
                ? "Choose a club/team or mark yourself as no fixed club/team."
                : "Add the core details captains and organizers need.",
              button: "Edit profile",
              target: "profile",
              status: "Profile",
            }
          : {
              title: "No urgent actions",
              detail: "You are caught up for now.",
              button: "View activity",
              target: "events",
              status: "Clear",
            };
  const managedTeamName =
    teamProfile?.clubTeamName ||
    homeTeamCard?.clubTeamName ||
    selectedProfileTeamName ||
    "Selected club/team";
  const managedTeamCountry =
    currentTeamIdentity.country ||
    primaryConfirmedTeam?.teamCountry ||
    primaryConfirmedTeam?.country ||
    savedProfilePreview.country ||
    "No country";
  const managedCaptainName = shortAccountName(
    teamProfile?.captainDisplayName ||
      primaryConfirmedTeam?.captainDisplayName ||
      primaryConfirmedTeam?.captainUsername ||
      savedProfilePreview.displayName ||
      username
  );
  const teamSummaryStats = [
    ["Members", canManageTeamProfile ? teamMembers.length : passportStats.teamMembershipCount],
    ["Needs", openTeamNeeds.length],
    ["Events", dedupedTournamentPlans.length],
  ];
  const teamRosterPreviewItems = playerDashboardEvents
    .filter((bundle) => {
      const status = normalizeRosterStatus(
        bundle?.roster?.rosterStatus || bundle?.roster?.status
      );
      return Boolean(bundle?.roster) && status !== "CANCELLED";
    })
    .slice(0, 2);
  const teamEventPreviewPlans = dedupedTournamentPlans.slice(0, 2);
  const selectedTournamentAdOption = tournamentOptions.find(
    (option) =>
      String(option.id || option.tournamentId || option.name || "") ===
      String(tournamentAdDraft.tournamentId || "")
  );
  const selectedTournamentAdName = selectedTournamentAdOption
    ? String(
        selectedTournamentAdOption?.name ||
          selectedTournamentAdOption?.tournamentName ||
          tournamentOptionLabel(selectedTournamentAdOption) ||
          ""
      ).trim()
    : "";
  const tournamentAdPreviewText = selectedTournamentAdName
    ? `${
        teamProfile?.clubTeamName || selectedProfileTeamName || "Team"
      } needs ${Number(tournamentAdDraft.neededCount) || 1} ${tournamentAdNeedWord(
        tournamentAdDraft.needType,
        tournamentAdDraft.neededCount
      )} for ${selectedTournamentAdName}.`
    : "Select tournament first";
  const adminDashboardCards = [
    isAdmin
      ? {
          id: "players",
          icon: "P",
          title: "Players",
          count:
            adminReviewStatus === "idle"
              ? adminCounts?.playerProfileReviewCount ?? "Open"
              : adminProfiles.filter((profile) => profile.publicVisible).length,
          meta: adminReviewStatus === "idle" ? "Review" : "public requests",
          status: adminReviewStatus,
          load: loadAdminReviewProfiles,
        }
      : null,
    isAdmin
      ? {
          id: "access",
          icon: "A",
          title: "Access",
          count:
            adminAccessRequestsStatus === "idle"
              ? adminCounts?.accessRequestCount ?? "Open"
              : adminAccessRequests.filter(
                  (request) => request.status === "PENDING"
                ).length,
          meta: adminAccessRequestsStatus === "idle" ? "Requests" : "pending",
          status: adminAccessRequestsStatus,
          load: loadAdminAccessRequests,
        }
      : null,
    isAdmin
      ? {
          id: "clubs",
          icon: "C",
          title: "Clubs",
          count:
            adminClubTeamsStatus === "idle"
              ? adminCounts?.officialClubsCount ?? "Open"
              : adminClubTeams.length,
          meta: adminClubTeamsStatus === "idle" ? "Manage" : "total",
          status: adminClubTeamsStatus,
          load: loadAdminClubTeams,
        }
      : null,
    isAdmin
      ? {
          id: "identity",
          icon: "I",
          title: "Team identity",
          count:
            adminTeamIdentityStatus === "idle"
              ? adminCounts?.teamIdentityRequestCount ?? "Open"
              : adminTeamIdentityRequests.filter(
                  (request) => request.status === "PENDING"
                ).length,
          meta: adminTeamIdentityStatus === "idle" ? "Review" : "pending",
          status: adminTeamIdentityStatus,
          load: loadAdminTeamIdentityRequests,
        }
      : null,
    isAdmin
      ? {
          id: "profiles",
          icon: "T",
          title: "Team profiles",
          count:
            adminTeamProfileStatus === "idle"
              ? adminCounts?.teamProfileReviewCount ?? "Open"
              : adminTeamProfiles.length,
          meta: adminTeamProfileStatus === "idle" ? "Review" : "profiles",
          status: adminTeamProfileStatus,
          load: loadAdminTeamProfiles,
        }
      : null,
    isAdmin
      ? {
          id: "needs",
          icon: "N",
          title: "Needs",
          count:
            adminTeamNeedInterestStatus === "idle"
              ? adminCounts?.teamNeedInterestReviewCount ?? "Open"
              : adminTeamNeedInterests.length,
          meta:
            adminTeamNeedInterestStatus === "idle" ? "Interests" : "interests",
          status: adminTeamNeedInterestStatus,
          load: loadAdminTeamNeedInterests,
        }
      : null,
    isAdmin
      ? {
          id: "members",
          icon: "M",
          title: "Members",
          count:
            adminTeamMembersStatus === "idle"
              ? adminCounts?.teamMembersReviewCount ?? "Open"
              : adminTeamMembers.length,
          meta: adminTeamMembersStatus === "idle" ? "Review" : "members",
          status: adminTeamMembersStatus,
          load: loadAdminTeamMembers,
        }
      : null,
    isAdmin
      ? {
          id: "membership",
          icon: "R",
          title: "Membership",
          count:
            adminTeamMembershipStatus === "idle"
              ? adminCounts?.teamMembershipRequestsCount ?? "Open"
              : adminTeamMembershipRequests.filter(
                  (request) => request.status === "PENDING"
                ).length,
          meta: adminTeamMembershipStatus === "idle" ? "Requests" : "pending",
          status: adminTeamMembershipStatus,
          load: loadAdminTeamMembershipRequests,
        }
      : null,
    canReviewRosterDrafts
      ? {
          id: "rosters",
          icon: "O",
          title: "Rosters",
          count:
            adminTournamentRosterStatus === "idle"
              ? adminCounts?.rosterReviewCount ?? "Open"
              : adminTournamentRosterDrafts.filter(
                  (roster) =>
                    normalizeRosterStatus(roster.rosterStatus) === "SUBMITTED"
                ).length,
          meta:
            adminTournamentRosterStatus === "idle" ? "Review" : "submitted",
          status: adminTournamentRosterStatus,
          load: loadAdminRosterDrafts,
        }
      : null,
  ].filter(Boolean);

  const canOpenAdminHubTab = adminDashboardCards.length > 0;
  const hubTabs = [
    { id: "home", label: "Home" },
    { id: "events", label: "Events" },
    { id: "team", label: "Team" },
    { id: "players", label: "Players" },
    canOpenAdminHubTab ? { id: "admin", label: "Admin" } : null,
  ].filter(Boolean);
  const showHubHome = activeHubTab === "home";
  const showHubEvents = activeHubTab === "events";
  const showHubTeam = activeHubTab === "team";
  const showHubPlayers = activeHubTab === "players";
  const showHubAdmin = activeHubTab === "admin" && canOpenAdminHubTab;
  const showPlayerEventArea = showHubEvents;
  const showTeamOverviewArea = showHubTeam;
  const showTeamControlArea = canManageTeamProfile && showHubTeam;
  const showCaptainChecklist = canManageTeamProfile && showHubTeam;
  const showPlayerAdsArea = showHubPlayers;
  const adminRosterDuplicateWarningsByRosterId =
    buildAdminRosterDuplicateWarnings(adminTournamentRosterDrafts);

  useEffect(() => {
    if (activeHubTab === "admin" && !canOpenAdminHubTab) {
      setActiveHubTab("home");
    }
  }, [activeHubTab, canOpenAdminHubTab]);

  function openAdminDashboardPanel(card) {
    const isClosing = openAdminPanel === card.id;
    setOpenAdminPanel(isClosing ? "" : card.id);
    if (!isClosing && card.load) {
      const startedAt = startPlayerHubTimer();
      Promise.resolve(card.load()).finally(() => {
        logPlayerHubTiming(`admin section ${card.id}`, startedAt);
      });
    }
  }

  function handleHomeNextAction() {
    if (homeNextAction.target === "profile") {
      setActiveProfileEditorTab(needsClubTeamSetup ? "team" : "basic");
      setShowProfileEditor(true);
      return;
    }
    if (homeNextAction.target === "team") {
      setActiveHubTab("team");
      return;
    }
    if (homeNextAction.target === "events") {
      setActiveHubTab("events");
    }
  }

  function openCaptainPlanAction() {
    if (captainHomeFlow?.plan) {
      toggleTournamentSquadPlanning(captainHomeFlow.plan);
    }
  }

  function openCaptainSubmitAction() {
    if (captainHomeFlow?.rosterCanSubmit && captainHomeFlow?.plan) {
      openCaptainChecklistSubmit(captainHomeFlow.plan);
    }
  }

  return (
    <div style={playerHubStyles.shell} data-testid="player-hub-root">
      <section style={playerHubStyles.hero}>
        <div style={playerHubStyles.heroTitleRow}>
          <div style={playerHubStyles.titleBlock}>
            <h2 style={playerHubStyles.title}>Player Hub</h2>
            <p style={playerHubStyles.subtitle}>
              Club. Squad. Roster.
            </p>
          </div>
        </div>
      </section>

      <nav style={playerHubStyles.hubNav} aria-label="Player Hub views">
        {hubTabs.map((tab) => {
          const active = activeHubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`player-hub-tab-${tab.id}`}
              style={{
                ...playerHubStyles.hubNavButton,
                ...(active ? playerHubStyles.hubNavButtonActive : {}),
              }}
              onClick={() => setActiveHubTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {showTeamOverviewArea && needsClubTeamSetup ? (
        <form
          onSubmit={handleSaveTeamSetup}
          style={playerHubStyles.teamSetupCard}
        >
          <div style={playerHubStyles.profileMeta}>
            <div style={playerHubStyles.sectionTitle}>
              Choose your club/team
            </div>
            <div style={playerHubStyles.cardText}>
              Captain confirmation comes later.
            </div>
          </div>
          <div style={playerHubStyles.teamSetupControls}>
            <select
              style={playerHubStyles.profileInput}
              value={myProfile.freeAgent ? "" : myProfile.clubTeamId || ""}
              onChange={(event) => handleClubTeamSelection(event.target.value)}
            >
              <option value="">No fixed club/team</option>
              {clubTeams.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {clubTeamDisplayName(team)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              style={{
                ...playerHubStyles.saveButton,
                ...(profileStatus === "saving" || profileStatus === "loading"
                  ? playerHubStyles.saveButtonDisabled
                  : {}),
              }}
              disabled={profileStatus === "saving" || profileStatus === "loading"}
            >
              Save
            </button>
          </div>
          {clubTeamsStatus === "error" && clubTeamsMessage ? (
            <span style={playerHubStyles.profileMessage}>
              {clubTeamsMessage}
            </span>
          ) : null}
        </form>
      ) : null}

      {showHubHome ? (
      <section style={playerHubStyles.homeDashboardGrid}>
        <section style={playerHubStyles.playerHeroCard}>
          {hasProfilePreview ? (
            <article style={playerHubStyles.profilePreviewCard}>
              <div style={playerHubStyles.profilePreviewTitleRow}>
                <div style={playerHubStyles.playerCardHero}>
                  <div style={playerHubStyles.playerAvatarLarge}>
                    {previewInitial}
                  </div>
                  <div style={playerHubStyles.previewNameBlock}>
                    <strong style={playerHubStyles.previewName}>
                      {previewDisplayName}
                    </strong>
                    <span style={playerHubStyles.previewSubtitle}>
                      {profileTeamLabel}
                    </span>
                    <span style={playerHubStyles.previewSubtitle}>
                      {savedProfilePreview.country || "No country"} /{" "}
                      {savedProfilePreview.profileType || "Player"}
                    </span>
                    {showTeamRejectedBadge ? (
                      <span style={playerHubStyles.previewSubtitle}>
                        Team request rejected
                      </span>
                    ) : null}
                  </div>
                </div>
                {homeSummaryBadges.length ? (
                  <div style={playerHubStyles.chipRow}>
                    {homeSummaryBadges.map((badge) => (
                      <span key={badge} style={playerHubStyles.chip}>
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={playerHubStyles.heroActions}>
                <button
                  type="button"
                  style={playerHubStyles.adminActionButton}
                  onClick={() => setShowProfileEditor((current) => !current)}
                >
                  {profileEditorOpen ? "Close edit" : "Edit profile"}
                </button>
                {latestTeamMembershipRequest?.status === "PENDING" &&
                !confirmedTeamForSelected ? (
                  <button
                    type="button"
                    style={{
                      ...playerHubStyles.adminActionButton,
                      ...(teamMembershipUpdatingId ===
                      latestTeamMembershipRequest.requestId
                        ? playerHubStyles.adminDisabledButton
                        : {}),
                    }}
                    disabled={
                      teamMembershipUpdatingId ===
                      latestTeamMembershipRequest.requestId
                    }
                    onClick={() =>
                      handleCancelMembershipRequest(latestTeamMembershipRequest)
                    }
                  >
                    Cancel team request
                  </button>
                ) : null}
              </div>
            </article>
          ) : (
            <div style={playerHubStyles.emptyPreview}>
              {copy.profilePreviewEmpty}
            </div>
          )}

          <form
            onSubmit={handleSaveMyProfile}
            style={{
              ...playerHubStyles.profileEditorPanel,
              display: profileEditorOpen ? "grid" : "none",
            }}
          >
            <div style={playerHubStyles.editorTabs}>
              {[
                ["basic", "Basic"],
                ["team", "Team"],
                ["options", "Options"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  style={{
                    ...playerHubStyles.editorTab,
                    ...(activeProfileEditorTab === tab
                      ? playerHubStyles.editorTabActive
                      : {}),
                  }}
                  onClick={() => setActiveProfileEditorTab(tab)}
                >
                  {label}
                </button>
              ))}
            </div>

            <section
              style={{
                ...playerHubStyles.editorSection,
                display:
                  activeProfileEditorTab === "basic" ? "grid" : "none",
              }}
            >
              <div style={playerHubStyles.sectionTitle}>Basic</div>
              <div style={playerHubStyles.profileFormGrid}>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Display name</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={myProfile.displayName}
                    onChange={(event) =>
                      updateMyProfileField("displayName", event.target.value)
                    }
                    placeholder="Your player name"
                  />
                </label>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Country</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={myProfile.country}
                    onChange={(event) =>
                      updateMyProfileField("country", event.target.value)
                    }
                    placeholder="Country"
                  />
                </label>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Profile type</span>
                  <select
                    style={playerHubStyles.profileInput}
                    value={myProfile.profileType}
                    onChange={(event) =>
                      updateMyProfileField("profileType", event.target.value)
                    }
                  >
                    {profileTypeOptions.map((profileType) => (
                      <option key={profileType} value={profileType}>
                        {profileType}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Email</span>
                  <input
                    type="email"
                    style={playerHubStyles.profileInput}
                    value={myProfile.email}
                    onChange={(event) =>
                      updateMyProfileField("email", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </label>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Phone</span>
                  <input
                    type="tel"
                    style={playerHubStyles.profileInput}
                    value={myProfile.phone}
                    onChange={(event) =>
                      updateMyProfileField("phone", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>
            </section>

            <section
              style={{
                ...playerHubStyles.editorSection,
                display: activeProfileEditorTab === "team" ? "grid" : "none",
              }}
            >
              <div style={playerHubStyles.sectionTitle}>Team</div>
              <div style={playerHubStyles.profileFormGrid}>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Select club/team</span>
                  <select
                    style={playerHubStyles.profileInput}
                    value={myProfile.freeAgent ? "" : myProfile.clubTeamId || ""}
                    onChange={(event) =>
                      handleClubTeamSelection(event.target.value)
                    }
                  >
                    <option value="">No fixed club/team</option>
                    {clubTeams.map((team) => (
                      <option key={team.teamId} value={team.teamId}>
                        {clubTeamDisplayName(team)}
                      </option>
                    ))}
                  </select>
                  {mySelectedTeamNoLongerActive ? (
                    <span style={playerHubStyles.profileMessage}>
                      Selected team is no longer active.
                    </span>
                  ) : null}
                </label>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Team note</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={myProfile.teamNote}
                    onChange={(event) =>
                      updateMyProfileField("teamNote", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>
              <label style={playerHubStyles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={myProfile.freeAgent}
                  onChange={(event) =>
                    toggleNoFixedClubTeam(event.target.checked)
                  }
                />
                <span>No fixed club/team</span>
              </label>
            </section>

            <section
              style={{
                ...playerHubStyles.editorSection,
                display:
                  activeProfileEditorTab === "options" ? "grid" : "none",
              }}
            >
              <div style={playerHubStyles.sectionTitle}>Options</div>
              <label style={playerHubStyles.profileField}>
                <span style={playerHubStyles.profileLabel}>Availability note</span>
                <textarea
                  style={playerHubStyles.profileTextareaCompact}
                  value={myProfile.availability}
                  onChange={(event) =>
                    updateMyProfileField("availability", event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <div style={playerHubStyles.choiceGrid}>
                <div style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>
                    Available for other teams?
                  </span>
                  <div style={playerHubStyles.segmentedControl}>
                    <button
                      type="button"
                      style={{
                        ...playerHubStyles.segmentButton,
                        ...(myProfile.canGuestForTeams
                          ? playerHubStyles.segmentButtonActive
                          : {}),
                      }}
                      onClick={() =>
                        updateMyProfileField("canGuestForTeams", true)
                      }
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      style={{
                        ...playerHubStyles.segmentButton,
                        ...(!myProfile.canGuestForTeams
                          ? playerHubStyles.segmentButtonActive
                          : {}),
                      }}
                      onClick={() =>
                        updateMyProfileField("canGuestForTeams", false)
                      }
                    >
                      No
                    </button>
                  </div>
                </div>

                <div style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>
                    Interested in abroad tournaments?
                  </span>
                  <div style={playerHubStyles.segmentedControl}>
                    <button
                      type="button"
                      style={{
                        ...playerHubStyles.segmentButton,
                        ...(myProfile.interestedAbroad
                          ? playerHubStyles.segmentButtonActive
                          : {}),
                      }}
                      onClick={() =>
                        updateMyProfileField("interestedAbroad", true)
                      }
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      style={{
                        ...playerHubStyles.segmentButton,
                        ...(!myProfile.interestedAbroad
                          ? playerHubStyles.segmentButtonActive
                          : {}),
                      }}
                      onClick={() =>
                        updateMyProfileField("interestedAbroad", false)
                      }
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              <label style={playerHubStyles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={myProfile.publicVisible}
                  onChange={(event) =>
                    updateMyProfileField("publicVisible", event.target.checked)
                  }
                />
                <span>Request public visibility</span>
              </label>
            </section>

            <div style={playerHubStyles.profileActions}>
              <button
                type="submit"
                style={{
                  ...playerHubStyles.saveButton,
                  ...(profileStatus === "saving" || profileStatus === "loading"
                    ? playerHubStyles.saveButtonDisabled
                    : {}),
                }}
                disabled={profileStatus === "saving" || profileStatus === "loading"}
              >
                {profileStatus === "saving"
                  ? copy.profileSaving
                  : copy.profileSaveButton}
              </button>
              {profileMessage ? (
                <span style={playerHubStyles.profileMessage}>
                  {profileMessage}
                </span>
              ) : null}
            </div>
          </form>

          <section style={playerHubStyles.homeQuickStatsGrid} aria-label="Quick stats">
            {homeQuickStats.map(([label, value]) => (
              <article key={label} style={playerHubStyles.homeQuickStatCard}>
                <strong style={playerHubStyles.homeQuickStatValue}>
                  {value}
                </strong>
                <span style={playerHubStyles.homeQuickStatLabel}>{label}</span>
              </article>
            ))}
          </section>

          <details style={playerHubStyles.accountDetails}>
            <summary style={playerHubStyles.accountSummary}>
              Account & access
            </summary>
            <section style={playerHubStyles.editorSection}>
              <div style={playerHubStyles.accessCompactList}>
                {accessRequestSummary.map((card) => {
                  const latestStatus = card.latest?.status || "";
                  const isSubmitting = accessRequestSubmittingType === card.type;
                  const requestDisabled =
                    Boolean(accessRequestSubmittingType) ||
                    latestStatus === "PENDING" ||
                    latestStatus === "APPROVED";
                  const canRequest =
                    !latestStatus || latestStatus === "REJECTED";

                  return (
                    <div
                      key={`summary-${card.type}`}
                      style={playerHubStyles.accessCompactRow}
                    >
                      <div style={playerHubStyles.compactRowMain}>
                        <span style={playerHubStyles.compactRowTitle}>
                          {card.label}
                        </span>
                        <span style={playerHubStyles.compactRowMeta}>
                          {accessRequestShortLabel(card.type)}
                        </span>
                      </div>
                      <span
                        style={{
                          ...playerHubStyles.accessStatusChip,
                          ...accessRequestStatusStyle(latestStatus),
                        }}
                      >
                        {formatAccessRequestStatus(latestStatus)}
                      </span>
                      {canRequest ? (
                        <button
                          type="button"
                          style={{
                            ...playerHubStyles.accessMiniButton,
                            ...(requestDisabled
                              ? playerHubStyles.adminDisabledButton
                              : {}),
                          }}
                          disabled={requestDisabled}
                          onClick={() => handleAccessRequestCardClick(card)}
                        >
                          {accessRequestActionText(latestStatus, isSubmitting)}
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  );
                })}
              </div>

              {accessClubWarningType ? (
                <div style={playerHubStyles.accessWarning}>
                  Select a club/team first if this request is connected to a club.
                </div>
              ) : null}

              {pendingAccessRequestType ? (
                <form
                  style={playerHubStyles.accessInlineForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitAccessRequest(pendingAccessRequestType);
                  }}
                >
                  <div style={playerHubStyles.profileMeta}>
                    <strong style={playerHubStyles.previewTitle}>
                      Request {accessRequestLabel(pendingAccessRequestType)}
                    </strong>
                    <span style={playerHubStyles.previewSubtitle}>
                      Optional note to admin
                    </span>
                  </div>
                  <textarea
                    style={playerHubStyles.profileTextareaCompact}
                    value={accessRequestMessageDraft}
                    onChange={(event) =>
                      setAccessRequestMessageDraft(event.target.value)
                    }
                    placeholder="Short message..."
                  />
                  <div style={playerHubStyles.accessActionRow}>
                    <button
                      type="submit"
                      style={{
                        ...playerHubStyles.saveButton,
                        ...(accessRequestSubmittingType
                          ? playerHubStyles.saveButtonDisabled
                          : {}),
                      }}
                      disabled={Boolean(accessRequestSubmittingType)}
                    >
                      {accessRequestSubmittingType ? "Sending..." : "Submit request"}
                    </button>
                    <button
                      type="button"
                      style={playerHubStyles.adminActionButton}
                      onClick={cancelPendingAccessRequest}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              {accessRequestsMessage ? (
                <div
                  role={accessRequestsStatus === "error" ? "alert" : "status"}
                  style={{
                    ...playerHubStyles.adminFeedbackBanner,
                    ...(accessRequestsStatus === "error"
                      ? playerHubStyles.adminFeedbackError
                      : playerHubStyles.adminFeedbackSuccess),
                  }}
                >
                  <span style={playerHubStyles.adminFeedbackTitle}>
                    {accessRequestsStatus === "error"
                      ? "Could not request"
                      : "Request"}
                  </span>
                  <span>{accessRequestsMessage}</span>
                </div>
              ) : null}

              {accessRequests.length ? (
                <div style={playerHubStyles.accessRequestList}>
                  <span style={playerHubStyles.mutedLine}>History</span>
                  {accessRequests.map((request) => (
                    <article
                      key={request.requestId}
                      style={playerHubStyles.accessRequestRow}
                    >
                      <div style={playerHubStyles.profileMeta}>
                        <strong style={playerHubStyles.previewTitle}>
                          {accessRequestLabel(request.requestType)}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString()
                            : "No date"}
                        </span>
                      </div>
                      <span
                        style={{
                          ...playerHubStyles.accessStatusChip,
                          ...accessRequestStatusStyle(request.status),
                        }}
                      >
                        {formatAccessRequestStatus(request.status || "PENDING")}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <span style={playerHubStyles.mutedLine}>
                  No previous requests.
                </span>
              )}
            </section>
          </details>
        </section>

        <section style={playerHubStyles.homeActionStack}>
          <article style={playerHubStyles.homeNextActionCard}>
            <div style={playerHubStyles.homeCardHeader}>
              <div style={playerHubStyles.profileMeta}>
                <span style={playerHubStyles.homeKicker}>Next action</span>
                <strong style={playerHubStyles.homeNextActionTitle}>
                  {homeNextAction.title}
                </strong>
              </div>
              <span
                style={{
                  ...playerHubStyles.accessStatusChip,
                  ...(homeNextAction.title === "No urgent actions" ||
                  homeNextAction.title === "View roster"
                    ? playerHubStyles.accessStatusApproved
                    : homeNextAction.title === "Continue captain checklist"
                      ? captainChecklistStatusStyle(captainHomeNextTask?.status)
                      : playerHubStyles.accessStatusPending),
                }}
              >
                {homeNextAction.status}
              </span>
            </div>
            <span style={playerHubStyles.homeNextActionText}>
              {homeNextAction.detail}
            </span>
            <button
              type="button"
              style={playerHubStyles.homePrimaryButton}
              onClick={handleHomeNextAction}
            >
              {homeNextAction.button}
            </button>
          </article>

          {canManageTeamProfile ? (
            <article style={playerHubStyles.homePreviewCard}>
              <div style={playerHubStyles.homeCardHeader}>
                <div style={playerHubStyles.profileMeta}>
                  <div style={playerHubStyles.sectionTitle}>Captain tasks</div>
                  <div style={playerHubStyles.cardText}>
                    Current captain flow.
                  </div>
                </div>
                <span style={playerHubStyles.chip}>
                  {captainHomeOpenTasks.length}
                </span>
              </div>
              {captainHomeOpenTasks.length ? (
                <div style={playerHubStyles.homePreviewList}>
                  {captainHomeOpenTasks.slice(0, 2).map((task) => (
                    <article key={task.id} style={playerHubStyles.homeCaptainTaskRow}>
                      <div style={playerHubStyles.homeCardHeader}>
                        <strong style={playerHubStyles.previewTitle}>
                          {task.label}
                        </strong>
                        <span
                          style={{
                            ...playerHubStyles.accessStatusChip,
                            ...captainChecklistStatusStyle(task.status),
                          }}
                        >
                          {captainChecklistStatusLabel(task.status)}
                        </span>
                      </div>
                      <span style={playerHubStyles.previewSubtitle}>
                        {task.detail}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div style={playerHubStyles.emptyPreview}>
                  All captain tasks are clear.
                </div>
              )}
              <div style={playerHubStyles.homeCardActions}>
                <button
                  type="button"
                  style={playerHubStyles.homeSecondaryButton}
                  onClick={() => setActiveHubTab("team")}
                >
                  Open Team
                </button>
              </div>
            </article>
          ) : null}

          <article style={playerHubStyles.homePreviewCard}>
            <div style={playerHubStyles.homeCardHeader}>
              <div style={playerHubStyles.profileMeta}>
                <div style={playerHubStyles.sectionTitle}>Recent activity</div>
                <div style={playerHubStyles.cardText}>
                  Team events and roster updates.
                </div>
              </div>
              <span style={playerHubStyles.chip}>
                {homeRecentActivityItems.length}
              </span>
            </div>
            {homeRecentActivityItems.length ? (
              <div style={playerHubStyles.homePreviewList}>
                {homeRecentActivityItems.map((activity) => (
                  <article key={activity.key} style={playerHubStyles.homePreviewRow}>
                    <div style={playerHubStyles.profileMeta}>
                      <strong style={playerHubStyles.previewTitle}>
                        {activity.tournamentName}
                      </strong>
                      <span style={playerHubStyles.previewSubtitle}>
                        {[activity.teamName, activity.note]
                          .filter(Boolean)
                          .join(" / ")}
                      </span>
                    </div>
                    <span
                      style={{
                        ...playerHubStyles.accessStatusChip,
                        ...passportStatusStyle(activity.status),
                      }}
                    >
                      {activity.status}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div style={playerHubStyles.emptyPreview}>
                No event or roster activity yet.
              </div>
            )}
            <div style={playerHubStyles.homeCardActions}>
              <button
                type="button"
                style={playerHubStyles.homeSecondaryButton}
                onClick={() => setActiveHubTab("events")}
              >
                More in Events
              </button>
            </div>
          </article>
        </section>
      </section>
      ) : null}

      {showPlayerEventArea && playerDashboardEvents.length ? (
        <section style={playerHubStyles.feedPanel}>
          <div style={playerHubStyles.feedHeader}>
            <div style={playerHubStyles.profileMeta}>
              <div style={playerHubStyles.sectionTitle}>My responses</div>
            </div>
            <span style={playerHubStyles.chip}>{playerDashboardEvents.length}</span>
          </div>
          <div style={playerHubStyles.eventGrid}>
            {playerDashboardEvents.map((eventBundle) =>
              renderPlayerEventCard(eventBundle)
            )}
          </div>
        </section>
      ) : null}

      {showPlayerEventArea && canManageTeamProfile && dedupedTournamentPlans.length ? (
        <section style={playerHubStyles.feedPanel}>
          <div style={playerHubStyles.feedHeader}>
            <div style={playerHubStyles.profileMeta}>
              <div style={playerHubStyles.sectionTitle}>Captain events</div>
            </div>
            <span style={playerHubStyles.chip}>{dedupedTournamentPlans.length}</span>
          </div>
          <div style={playerHubStyles.eventGrid}>
            {dedupedTournamentPlans.map((plan) => {
              const availability = captainAvailabilityByPlanId[plan.planId] || [];
              return renderCaptainEventCard(plan, availability, { compact: true });
            })}
          </div>
        </section>
      ) : null}

      {showPlayerEventArea &&
      !playerDashboardEvents.length &&
      !(canManageTeamProfile && dedupedTournamentPlans.length) ? (
        <section style={playerHubStyles.eventsEmptyState}>
          <div style={playerHubStyles.sectionTitle}>No team events yet</div>
          <div style={playerHubStyles.cardText}>
            Events will appear here when a captain asks for availability or a
            roster is ready.
          </div>
        </section>
      ) : null}

      {showTeamOverviewArea ? (
      <section style={playerHubStyles.compactHomeGrid}>
        {homeTeamCard || canManageTeamProfile || selectedProfileTeamName ? (
          <section style={playerHubStyles.teamSummaryCard}>
            <div style={playerHubStyles.homeCardHeader}>
              <div style={playerHubStyles.profileMeta}>
                <span style={playerHubStyles.homeKicker}>Team</span>
                <strong style={playerHubStyles.previewTitle}>
                  {managedTeamName}
                </strong>
                <span style={playerHubStyles.previewSubtitle}>
                  {[managedTeamCountry, `Captain: ${managedCaptainName || "Unknown"}`]
                    .filter(Boolean)
                    .join(" / ")}
                </span>
              </div>
              <span
                style={{
                  ...playerHubStyles.accessStatusChip,
                  ...accessRequestStatusStyle(
                    primaryConfirmedTeam
                      ? "APPROVED"
                      : latestTeamMembershipRequest?.status
                  ),
                }}
              >
                {primaryConfirmedTeam
                  ? "Confirmed"
                  : formatTeamMembershipStatus(
                      latestTeamMembershipRequest?.status
                    )}
              </span>
            </div>
            <div style={playerHubStyles.teamSummaryStats}>
              {teamSummaryStats.map(([label, value]) => (
                <article key={label} style={playerHubStyles.teamSummaryStat}>
                  <strong style={playerHubStyles.teamSummaryStatValue}>
                    {value}
                  </strong>
                  <span style={playerHubStyles.teamSummaryStatLabel}>
                    {label}
                  </span>
                </article>
              ))}
            </div>
            {!canManageTeamProfile && teamRosterPreviewItems.length ? (
              <div style={playerHubStyles.teamCompactList}>
                {teamRosterPreviewItems.map((bundle) => {
                  const event = mergeEventRows(
                    mergeEventRows(mergeEventRows(bundle.base, bundle.planning), bundle.roster),
                    bundle.availability
                  );
                  const status = normalizeRosterStatus(
                    bundle.roster?.rosterStatus || bundle.roster?.status
                  );
                  return (
                    <article key={bundle.key} style={playerHubStyles.teamCompactRow}>
                      <div style={playerHubStyles.profileMeta}>
                        <strong style={playerHubStyles.previewTitle}>
                          {event.tournamentName || "Tournament"}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          {eventMetaText(event)}
                        </span>
                      </div>
                      <span
                        style={{
                          ...playerHubStyles.accessStatusChip,
                          ...rosterStatusStyle(status),
                        }}
                      >
                        {formatRosterStatus(status)}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}

      </section>
      ) : null}
      {showTeamControlArea ? (
      <section style={playerHubStyles.teamDashboardShell} data-testid="team-control">
        <div style={playerHubStyles.profileHeader}>
          <div style={playerHubStyles.profileMeta}>
            <div style={playerHubStyles.sectionTitle}>Team control</div>
            <div style={playerHubStyles.cardText}>
              Captain actions, members, needs and roster work.
            </div>
          </div>
          <div style={playerHubStyles.chipRow}>
            {pendingCaptainMembershipRequests.length ? (
              <span style={playerHubStyles.chip}>
                {pendingCaptainMembershipRequests.length} membership request
                {pendingCaptainMembershipRequests.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </div>

        <div style={playerHubStyles.teamDashboardGrid}>
          <section style={playerHubStyles.teamDashboardColumn}>
            <article style={playerHubStyles.captainActionStrip}>
              <div style={playerHubStyles.homeCardHeader}>
                <div style={playerHubStyles.profileMeta}>
                  <span style={playerHubStyles.homeKicker}>Actions</span>
                  <strong style={playerHubStyles.previewTitle}>
                    {managedTeamName}
                  </strong>
                </div>
                <span style={playerHubStyles.chip}>
                  {teamProfile?.active === false ? "Inactive" : "Active"}
                </span>
              </div>
              <div style={playerHubStyles.captainActionGrid}>
              <button
                type="button"
                style={playerHubStyles.captainActionButton}
                onClick={() => toggleTeamActionPanel("plan")}
              >
                {showTournamentPlanForm ? "Close plan" : "Ask availability"}
              </button>
              <button
                type="button"
                style={{
                  ...playerHubStyles.captainActionButton,
                  ...(!captainHomeFlow?.plan ? playerHubStyles.adminDisabledButton : {}),
                }}
                disabled={!captainHomeFlow?.plan}
                onClick={openCaptainPlanAction}
              >
                Plan squads
              </button>
              <button
                type="button"
                style={{
                  ...playerHubStyles.captainActionButton,
                  ...(!captainHomeFlow?.plan ? playerHubStyles.adminDisabledButton : {}),
                }}
                disabled={!captainHomeFlow?.plan}
                onClick={openCaptainPlanAction}
              >
                Squad names
              </button>
              <button
                type="button"
                style={{
                  ...playerHubStyles.captainActionButton,
                  ...(!captainHomeFlow?.rosterCanSubmit
                    ? playerHubStyles.adminDisabledButton
                    : {}),
                }}
                disabled={!captainHomeFlow?.rosterCanSubmit}
                onClick={openCaptainSubmitAction}
              >
                Submit roster
              </button>
              <button
                type="button"
                style={playerHubStyles.captainActionButton}
                onClick={() => toggleTeamActionPanel("ad")}
              >
                {showTournamentAdForm ? "Close ad" : "Publish player ad"}
              </button>
              <button
                type="button"
                style={playerHubStyles.captainActionButton}
                onClick={() => toggleTeamActionPanel("need")}
              >
                {showTeamNeedForm ? "Close need" : "Add internal need"}
              </button>
              <button
                type="button"
                style={playerHubStyles.captainActionButton}
                onClick={() => toggleTeamActionPanel("edit")}
              >
                {showTeamEditor ? "Close edit" : "Edit team"}
              </button>
              </div>
            </article>

          {showCaptainChecklist ? renderCaptainTournamentChecklist() : null}

          {pendingCaptainMembershipRequests.length || teamMembershipMessage ? (
          <section style={playerHubStyles.teamControlWidePanel}>
            <div style={playerHubStyles.profileHeader}>
              <div style={playerHubStyles.profileMeta}>
                <div style={playerHubStyles.sectionTitle}>
                  Team membership requests
                </div>
              </div>
              <span style={playerHubStyles.chip}>
                {pendingCaptainMembershipRequests.length} pending
              </span>
            </div>
            {teamMembershipMessage ? (
              <span style={playerHubStyles.profileMessage}>
                {teamMembershipMessage}
              </span>
            ) : null}
            {pendingCaptainMembershipRequests.length ? (
              <div style={playerHubStyles.accessRequestList}>
                {pendingCaptainMembershipRequests.map((request) => {
                  const updating =
                    teamMembershipUpdatingId === request.requestId;

                  return (
                    <article
                      key={request.requestId}
                      style={playerHubStyles.teamControlRow}
                    >
                      <div style={playerHubStyles.interestPlayerMeta}>
                        <strong style={playerHubStyles.interestPlayerName}>
                          {request.playerDisplayName ||
                            request.playerUsername ||
                            "Player"}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          {request.playerCountry || "No country"} /{" "}
                          {request.playerEmail || "No email"} /{" "}
                          {request.playerPhone || "No phone"}
                        </span>
                      </div>
                      <div style={playerHubStyles.teamControlActionsRow}>
                        <span
                          style={{
                            ...playerHubStyles.accessStatusChip,
                            ...accessRequestStatusStyle(request.status),
                          }}
                        >
                          Pending
                        </span>
                        <button
                          type="button"
                          style={{
                            ...playerHubStyles.addTeamMemberButton,
                            ...(updating
                              ? playerHubStyles.adminDisabledButton
                              : {}),
                          }}
                          disabled={updating}
                          onClick={() =>
                            handleReviewTeamMembershipRequest(
                              request,
                              "APPROVED"
                            )
                          }
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          style={{
                            ...playerHubStyles.adminActionButton,
                            ...playerHubStyles.adminDangerButton,
                            ...(updating
                              ? playerHubStyles.adminDisabledButton
                              : {}),
                          }}
                          disabled={updating}
                          onClick={() =>
                            handleReviewTeamMembershipRequest(
                              request,
                              "REJECTED"
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
          ) : null}

          </section>
          <section style={playerHubStyles.teamDashboardColumn}>
          <div style={playerHubStyles.teamControlGrid}>
            <form
              onSubmit={handleSaveTeamProfile}
              style={{
                ...playerHubStyles.actionDrawer,
                display: showTeamEditor ? "grid" : "none",
              }}
            >
              <div style={playerHubStyles.profileHeader}>
                <div style={playerHubStyles.profileMeta}>
                  <div style={playerHubStyles.sectionTitle}>
                    Edit team
                  </div>
                  <div style={playerHubStyles.cardText}>
                    {currentTeamIdentity.name ||
                      "Selected club/team"}
                  </div>
                </div>
                <span style={playerHubStyles.chip}>
                  {teamProfile?.active === false ? "Inactive" : "Active"}
                </span>
              </div>

              <div style={playerHubStyles.profileFormGrid}>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Team name</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={currentTeamIdentity.name || "Selected club/team"}
                    readOnly
                  />
                </label>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Country</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={currentTeamIdentity.country || ""}
                    placeholder="No country"
                    readOnly
                  />
                </label>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>City</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={currentTeamIdentity.city || ""}
                    placeholder="No city"
                    readOnly
                  />
                </label>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Team level</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={teamProfileDraft.teamLevel}
                    onChange={(event) =>
                      updateTeamProfileDraft("teamLevel", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div style={playerHubStyles.profileMessage}>
                Official identity changes require admin approval.
              </div>
              <div style={playerHubStyles.profileActions}>
                {pendingTeamIdentityRequest ? (
                  <span style={playerHubStyles.chip}>
                    Identity change pending
                  </span>
                ) : (
                  <button
                    type="button"
                    style={playerHubStyles.adminActionButton}
                    onClick={openTeamIdentityRequestForm}
                  >
                    Request identity change
                  </button>
                )}
              </div>

              {showTeamIdentityRequestForm ? (
                <section style={playerHubStyles.editorSection}>
                  <div style={playerHubStyles.profileHeader}>
                    <div style={playerHubStyles.profileMeta}>
                      <div style={playerHubStyles.sectionTitle}>
                        Request identity change
                      </div>
                      <div style={playerHubStyles.cardText}>
                        Current data stays unchanged until admin approval.
                      </div>
                    </div>
                  </div>
                  <div style={playerHubStyles.profileFormGrid}>
                    <label style={playerHubStyles.profileField}>
                      <span style={playerHubStyles.profileLabel}>
                        New team name
                      </span>
                      <input
                        style={playerHubStyles.profileInput}
                        value={teamIdentityDraft.requestedName}
                        onChange={(event) =>
                          setTeamIdentityDraft((current) => ({
                            ...current,
                            requestedName: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label style={playerHubStyles.profileField}>
                      <span style={playerHubStyles.profileLabel}>Country</span>
                      <input
                        style={playerHubStyles.profileInput}
                        value={teamIdentityDraft.requestedCountry}
                        onChange={(event) =>
                          setTeamIdentityDraft((current) => ({
                            ...current,
                            requestedCountry: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label style={playerHubStyles.profileField}>
                      <span style={playerHubStyles.profileLabel}>City</span>
                      <input
                        style={playerHubStyles.profileInput}
                        value={teamIdentityDraft.requestedCity}
                        onChange={(event) =>
                          setTeamIdentityDraft((current) => ({
                            ...current,
                            requestedCity: event.target.value,
                          }))
                        }
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Reason</span>
                    <textarea
                      style={playerHubStyles.profileTextareaCompact}
                      value={teamIdentityDraft.reason}
                      onChange={(event) =>
                        setTeamIdentityDraft((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                      placeholder="Optional"
                    />
                  </label>
                  <div style={playerHubStyles.profileActions}>
                    <button
                      type="button"
                      style={{
                        ...playerHubStyles.saveButton,
                        ...(teamIdentityStatus === "saving"
                          ? playerHubStyles.saveButtonDisabled
                          : {}),
                      }}
                      disabled={teamIdentityStatus === "saving"}
                      onClick={handleSubmitTeamIdentityRequest}
                    >
                      {teamIdentityStatus === "saving"
                        ? "Sending..."
                        : "Submit request"}
                    </button>
                    <button
                      type="button"
                      style={playerHubStyles.adminActionButton}
                      onClick={() => setShowTeamIdentityRequestForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </section>
              ) : null}

              {teamIdentityMessage ? (
                <span style={playerHubStyles.profileMessage}>
                  {teamIdentityMessage}
                </span>
              ) : null}

              <label style={playerHubStyles.profileField}>
                <span style={playerHubStyles.profileLabel}>
                  Short team description
                </span>
                <textarea
                  style={playerHubStyles.profileTextareaCompact}
                  value={teamProfileDraft.teamDescription}
                  onChange={(event) =>
                    updateTeamProfileDraft(
                      "teamDescription",
                      event.target.value
                    )
                  }
                  placeholder="Optional"
                />
              </label>

              <label style={playerHubStyles.profileField}>
                <span style={playerHubStyles.profileLabel}>Contact note</span>
                <input
                  style={playerHubStyles.profileInput}
                  value={teamProfileDraft.contactNote}
                  onChange={(event) =>
                    updateTeamProfileDraft("contactNote", event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <label style={playerHubStyles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={teamProfileDraft.active}
                  onChange={(event) =>
                    updateTeamProfileDraft("active", event.target.checked)
                  }
                />
                <span>Team profile active</span>
              </label>

              <div style={playerHubStyles.profileActions}>
                <button
                  type="submit"
                  style={{
                    ...playerHubStyles.saveButton,
                    ...(teamProfileStatus === "saving"
                      ? playerHubStyles.saveButtonDisabled
                      : {}),
                  }}
                  disabled={teamProfileStatus === "saving"}
                >
                  {teamProfileStatus === "saving" ? "Saving..." : "Save team"}
                </button>
                {teamProfileMessage ? (
                  <span style={playerHubStyles.profileMessage}>
                    {teamProfileMessage}
                  </span>
                ) : null}
              </div>
            </form>

            <section
              style={playerHubStyles.teamControlPanel}
              data-testid="team-open-needs"
            >
              <div style={playerHubStyles.profileHeader}>
                <div style={playerHubStyles.sectionTitle}>Needs</div>
                <span style={playerHubStyles.chip}>{teamNeeds.length}</span>
              </div>
              <form
                onSubmit={handleSaveTeamNeed}
                style={{
                  ...playerHubStyles.actionDrawer,
                  display: showTeamNeedForm ? "grid" : "none",
                }}
              >
                <div style={playerHubStyles.actionDrawerHeader}>
                  <div style={playerHubStyles.profileMeta}>
                    <strong style={playerHubStyles.actionDrawerTitle}>
                      Add internal need
                    </strong>
                    <span style={playerHubStyles.actionDrawerHint}>
                      Internal only.
                    </span>
                  </div>
                  <span
                    style={{
                      ...playerHubStyles.chip,
                      ...playerHubStyles.internalNeedChip,
                    }}
                  >
                    Internal
                  </span>
                </div>
                <div style={playerHubStyles.profileFormGrid}>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Need type</span>
                    <select
                      style={playerHubStyles.profileInput}
                      value={teamNeedDraft.needType}
                      onChange={(event) =>
                        updateTeamNeedDraft("needType", event.target.value)
                      }
                    >
                      <option value="PLAYER">Player</option>
                      <option value="SUBSTITUTE">Substitute</option>
                      <option value="TRAINING_PLAYER">Training player</option>
                    </select>
                  </label>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Needed count</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      style={playerHubStyles.profileInput}
                      value={teamNeedDraft.neededCount}
                      onChange={(event) =>
                        updateTeamNeedDraft("neededCount", event.target.value)
                      }
                    />
                  </label>
                </div>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Need text</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={teamNeedDraft.needText}
                    onChange={(event) =>
                      updateTeamNeedDraft("needText", event.target.value)
                    }
                    placeholder="Short note"
                  />
                </label>
                <button
                  type="submit"
                  style={{
                    ...playerHubStyles.saveButton,
                    justifySelf: "start",
                    ...(teamProfileStatus === "saving"
                      ? playerHubStyles.saveButtonDisabled
                      : {}),
                  }}
                  disabled={teamProfileStatus === "saving"}
                >
                  Add need
                </button>
              </form>
              <form
                onSubmit={handlePublishTournamentAd}
                style={{
                  ...playerHubStyles.actionDrawer,
                  display: showTournamentAdForm ? "grid" : "none",
                }}
              >
                <div style={playerHubStyles.actionDrawerHeader}>
                  <div style={playerHubStyles.profileMeta}>
                    <strong style={playerHubStyles.actionDrawerTitle}>
                      Publish player ad
                    </strong>
                    <span style={playerHubStyles.actionDrawerHint}>
                      {tournamentAdPreviewText}
                    </span>
                  </div>
                  <span
                    style={{
                      ...playerHubStyles.chip,
                      ...playerHubStyles.tournamentAdChip,
                    }}
                  >
                    Tournament ad
                  </span>
                </div>
                <div style={playerHubStyles.profileFormGrid}>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Tournament</span>
                    <select
                      style={playerHubStyles.profileInput}
                      value={tournamentAdDraft.tournamentId}
                      onChange={(event) =>
                        updateTournamentAdDraft("tournamentId", event.target.value)
                      }
                    >
                      <option value="">Select tournament</option>
                      {tournamentOptions.map((option) => {
                        const value = String(
                          option.id || option.tournamentId || option.name || ""
                        );
                        return (
                          <option key={`ad-${value}`} value={value}>
                            {tournamentOptionLabel(option)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Need type</span>
                    <select
                      style={playerHubStyles.profileInput}
                      value={tournamentAdDraft.needType}
                      onChange={(event) =>
                        updateTournamentAdDraft("needType", event.target.value)
                      }
                    >
                      <option value="PLAYER">Player</option>
                      <option value="SUBSTITUTE">Substitute</option>
                      <option value="TRAINING_PLAYER">Training player</option>
                    </select>
                  </label>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Needed count</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      style={playerHubStyles.profileInput}
                      value={tournamentAdDraft.neededCount}
                      onChange={(event) =>
                        updateTournamentAdDraft("neededCount", event.target.value)
                      }
                    />
                  </label>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Class</span>
                    <input
                      style={playerHubStyles.profileInput}
                      value={tournamentAdDraft.className}
                      onChange={(event) =>
                        updateTournamentAdDraft("className", event.target.value)
                      }
                      placeholder="Optional"
                    />
                  </label>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Squad</span>
                    <input
                      style={playerHubStyles.profileInput}
                      value={tournamentAdDraft.squadLabel}
                      onChange={(event) =>
                        updateTournamentAdDraft("squadLabel", event.target.value)
                      }
                      placeholder="Optional"
                    />
                  </label>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Deadline</span>
                    <input
                      type="datetime-local"
                      style={playerHubStyles.profileInput}
                      value={tournamentAdDraft.deadlineAt}
                      onChange={(event) =>
                        updateTournamentAdDraft("deadlineAt", event.target.value)
                      }
                    />
                  </label>
                </div>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Note</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={tournamentAdDraft.needText}
                    onChange={(event) =>
                      updateTournamentAdDraft("needText", event.target.value)
                    }
                    placeholder="Visible to players"
                  />
                </label>
                <div style={playerHubStyles.profileActions}>
                  <button
                    type="submit"
                    style={{
                      ...playerHubStyles.saveButton,
                      ...(teamProfileStatus === "saving" ||
                      !String(tournamentAdDraft.tournamentId || "").trim()
                        ? playerHubStyles.saveButtonDisabled
                        : {}),
                    }}
                    disabled={
                      teamProfileStatus === "saving" ||
                      !String(tournamentAdDraft.tournamentId || "").trim()
                    }
                  >
                    Publish player ad
                  </button>
                  <span style={playerHubStyles.profileMessage}>
                    {!tournamentOptions.length
                      ? "No tournaments available yet."
                      : !String(tournamentAdDraft.tournamentId || "").trim()
                        ? "Select tournament first."
                        : "Visible to players after publishing."}
                  </span>
                </div>
              </form>

              {teamNeeds.length ? (
                <div style={playerHubStyles.accessRequestList}>
                  {teamNeeds.map((need) => {
                    const interestsForNeed =
                      captainInterestsByNeedId[need.needId] || [];
                    const stats = teamNeedStatLabels(need, interestsForNeed);
                    const acceptedPercent = Math.min(
                      100,
                      Math.round(
                        (stats.acceptedCount / Math.max(1, stats.neededCount)) *
                          100
                      )
                    );
                    const acceptedInterests = interestsForNeed.filter(
                      (interest) => interest.status === "ACCEPTED"
                    );
                    const pendingInterests = interestsForNeed.filter(
                      (interest) => interest.status === "PENDING"
                    );
                    const declinedInterests = interestsForNeed.filter(
                      (interest) => interest.status === "DECLINED"
                    );
                    const otherInterests = interestsForNeed.filter(
                      (interest) =>
                        !["ACCEPTED", "PENDING", "DECLINED"].includes(
                          interest.status
                        )
                    );

                    return (
                      <div key={need.needId} style={playerHubStyles.accessRequestList}>
                        <article style={playerHubStyles.teamControlRow}>
                          <div style={playerHubStyles.compactRowMain}>
                            <span style={playerHubStyles.compactRowTitle}>
                              {teamNeedSummary(need)}
                            </span>
                            <span style={playerHubStyles.compactRowMeta}>
                              {[
                                teamNeedContextLabel(need),
                                need.tournamentName,
                                need.needText,
                                `${stats.acceptedCount}/${stats.neededCount} accepted`,
                                stats.filled
                                  ? "Filled"
                                  : `${stats.remainingCount} spots left`,
                                stats.pendingCount
                                  ? `${stats.pendingCount} pending`
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" / ")}
                            </span>
                            <div style={playerHubStyles.progressTrack}>
                              <div
                                style={{
                                  ...playerHubStyles.progressFill,
                                  width: `${acceptedPercent}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div style={playerHubStyles.teamControlActionsRow}>
                            <span
                              style={{
                                ...playerHubStyles.chip,
                                ...teamNeedContextChipStyle(need),
                              }}
                            >
                              {teamNeedContextLabel(need)}
                            </span>
                            <span style={playerHubStyles.chip}>
                              {need.status === "OPEN" ? "Open" : "Closed"}
                            </span>
                            <button
                              type="button"
                              style={playerHubStyles.adminActionButton}
                              onClick={() => toggleTeamNeedInterests(need)}
                            >
                              {expandedTeamNeedInterestId === need.needId
                                ? "Hide"
                                : "View"}
                            </button>
                            {need.status === "OPEN" ? (
                              <button
                                type="button"
                                style={playerHubStyles.adminActionButton}
                                onClick={() => handleCloseTeamNeed(need)}
                              >
                                Close
                              </button>
                            ) : null}
                          </div>
                        </article>
                        {expandedTeamNeedInterestId === need.needId ? (
                          <div style={playerHubStyles.accessRequestList}>
                            {loadingTeamNeedInterestId === need.needId ? (
                              <div style={playerHubStyles.emptyPreview}>
                                Loading interests...
                              </div>
                            ) : interestsForNeed.length ? (
                              <>
                                {renderCaptainInterestGroup(
                                  "Accepted",
                                  acceptedInterests
                                )}
                                {renderCaptainInterestGroup(
                                  "Pending",
                                  pendingInterests
                                )}
                                {renderCaptainInterestGroup(
                                  "Declined",
                                  declinedInterests
                                )}
                                {renderCaptainInterestGroup(
                                  "Other",
                                  otherInterests
                                )}
                              </>
                            ) : (
                              <div style={playerHubStyles.emptyPreview}>
                                No interested players yet.
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span style={playerHubStyles.mutedLine}>No team needs yet.</span>
              )}
            </section>

            <section style={playerHubStyles.teamControlPanel}>
              <div style={playerHubStyles.profileHeader}>
                <div style={playerHubStyles.profileMeta}>
                  <div style={playerHubStyles.sectionTitle}>Members</div>
                </div>
                <span style={playerHubStyles.chip}>{teamMembers.length}</span>
              </div>
              {teamMemberMessage ? (
                <span style={playerHubStyles.profileMessage}>
                  {teamMemberMessage}
                </span>
              ) : null}
              {teamMembers.length ? (
                <div style={playerHubStyles.accessRequestList}>
                  {teamMembers.map((member) => {
                    const updating =
                      teamMemberUpdatingId === member.teamMemberId;

                    return (
                      <article
                        key={member.teamMemberId}
                        style={playerHubStyles.teamControlRow}
                      >
                        <div style={playerHubStyles.compactRowMain}>
                          <strong style={playerHubStyles.compactRowTitle}>
                            {member.playerDisplayName ||
                              member.playerUsername ||
                              "Player"}
                          </strong>
                          <span style={playerHubStyles.compactRowMeta}>
                            {member.playerCountry || "No country"} /{" "}
                            {member.playerClubTeamName || "No fixed club/team"}
                          </span>
                        </div>
                        <div style={playerHubStyles.teamControlActionsRow}>
                          <span style={playerHubStyles.chip}>Confirmed</span>
                          <button
                            type="button"
                            style={{
                              ...playerHubStyles.adminActionButton,
                              ...playerHubStyles.adminDangerButton,
                              ...(updating
                                ? playerHubStyles.adminDisabledButton
                                : {}),
                            }}
                            disabled={updating}
                            onClick={() => handleRemoveTeamMember(member)}
                          >
                            {updating ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <span style={playerHubStyles.mutedLine}>
                  No confirmed team members yet.
                </span>
              )}
            </section>

            <section
              style={playerHubStyles.teamControlWidePanel}
              data-testid="tournament-plans"
            >
              <div style={playerHubStyles.profileHeader}>
                <div style={playerHubStyles.profileMeta}>
                  <div style={playerHubStyles.sectionTitle}>
                    Team events
                  </div>
                </div>
                <div style={playerHubStyles.teamControlActionsRow}>
                  <span style={playerHubStyles.chip}>
                    {dedupedTournamentPlans.length}
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleCreateTournamentPlan}
                style={{
                  ...playerHubStyles.actionDrawer,
                  display: showTournamentPlanForm ? "grid" : "none",
                }}
              >
                <div style={playerHubStyles.actionDrawerHeader}>
                  <div style={playerHubStyles.profileMeta}>
                    <strong style={playerHubStyles.actionDrawerTitle}>
                      Ask availability
                    </strong>
                    <span style={playerHubStyles.actionDrawerHint}>
                      Ask confirmed members.
                    </span>
                  </div>
                  <span style={playerHubStyles.chip}>Availability</span>
                </div>
                <div style={playerHubStyles.profileFormGrid}>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Tournament</span>
                    <select
                      style={playerHubStyles.profileInput}
                      value={tournamentPlanDraft.tournamentId}
                      onChange={(event) =>
                        updateTournamentPlanDraft(
                          "tournamentId",
                          event.target.value
                        )
                      }
                    >
                      <option value="">Select tournament</option>
                      {tournamentOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {tournamentOptionLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Class</span>
                    <input
                      style={playerHubStyles.profileInput}
                      value={tournamentPlanDraft.className}
                      onChange={(event) =>
                        updateTournamentPlanDraft("className", event.target.value)
                      }
                      placeholder="Optional"
                    />
                  </label>
                  <label style={playerHubStyles.profileField}>
                    <span style={playerHubStyles.profileLabel}>Deadline</span>
                    <input
                      type="datetime-local"
                      style={playerHubStyles.profileInput}
                      value={tournamentPlanDraft.deadlineAt}
                      onChange={(event) =>
                        updateTournamentPlanDraft("deadlineAt", event.target.value)
                      }
                    />
                  </label>
                </div>
                <label style={playerHubStyles.profileField}>
                  <span style={playerHubStyles.profileLabel}>Note</span>
                  <input
                    style={playerHubStyles.profileInput}
                    value={tournamentPlanDraft.note}
                    onChange={(event) =>
                      updateTournamentPlanDraft("note", event.target.value)
                    }
                    placeholder="Optional message to players"
                  />
                </label>
                <div style={playerHubStyles.profileActions}>
                  <button
                    type="submit"
                    style={{
                      ...playerHubStyles.saveButton,
                      ...(tournamentPlanStatus === "saving" ||
                      !String(tournamentPlanDraft.tournamentId || "").trim()
                        ? playerHubStyles.saveButtonDisabled
                        : {}),
                    }}
                    disabled={
                      tournamentPlanStatus === "saving" ||
                      !String(tournamentPlanDraft.tournamentId || "").trim()
                    }
                  >
                    {tournamentPlanStatus === "saving"
                      ? "Asking..."
                      : "Ask team members"}
                  </button>
                  {!tournamentOptions.length ? (
                    <span style={playerHubStyles.profileMessage}>
                      No tournaments available yet.
                    </span>
                  ) : !String(tournamentPlanDraft.tournamentId || "").trim() ? (
                    <span style={playerHubStyles.profileMessage}>
                      Select a tournament before asking team members.
                    </span>
                  ) : null}
                  {tournamentPlanMessage ? (
                    <span style={playerHubStyles.profileMessage}>
                      {tournamentPlanMessage}
                    </span>
                  ) : null}
                </div>
              </form>

              {dedupedTournamentPlans.length ? (
                <div style={playerHubStyles.teamEventPreviewGrid}>
                  {teamEventPreviewPlans.map((plan) => {
                    const availability =
                      captainAvailabilityByPlanId[plan.planId] || [];
                    return renderCaptainEventCard(plan, availability, { compact: true });
                  })}
                  <button
                    type="button"
                    style={playerHubStyles.feedTinyAction}
                    onClick={() => setActiveHubTab("events")}
                  >
                    All events
                  </button>
                </div>
              ) : (
                <span style={playerHubStyles.mutedLine}>No team events yet.</span>
              )}
            </section>
          </div>
          </section>
        </div>
          {expandedSquadPlan ? (
            <section style={playerHubStyles.teamPlanningWorkspace}>
              {renderSquadPlanningBoard(
                expandedSquadPlan,
                expandedSquadAvailability,
                expandedSquadPlanning,
                captainRosterDraftsByPlanId[expandedSquadPlan.planId]
              )}
              {renderRosterDraftPanel(
                expandedSquadPlan,
                expandedSquadPlanning,
                captainRosterDraftsByPlanId[expandedSquadPlan.planId]
              )}
            </section>
          ) : null}
      </section>
      ) : null}

      {showHubPlayers ? (
        <section style={playerHubStyles.passportShell} data-testid="player-passport">
          <div style={playerHubStyles.feedHeader}>
            <div style={playerHubStyles.profileMeta}>
              <div style={playerHubStyles.sectionTitle}>Player Passport</div>
              <div style={playerHubStyles.cardText}>
                Identity, responses, squads and roster activity.
              </div>
            </div>
            <span style={playerHubStyles.chip}>V1</span>
          </div>

          <div style={playerHubStyles.passportHero}>
            <article style={playerHubStyles.passportSummaryCard}>
              <div style={playerHubStyles.passportAvatar}>{previewInitial}</div>
              <div style={playerHubStyles.passportIdentity}>
                <strong style={playerHubStyles.passportName}>
                  {previewDisplayName}
                </strong>
                <span style={playerHubStyles.passportMeta}>
                  {savedProfilePreview.country || "No country"} /{" "}
                  {savedProfilePreview.profileType || "Player"}
                </span>
                <span style={playerHubStyles.passportMeta}>
                  {profileTeamLabel || "No confirmed team"}
                </span>
                {passportMemberSince ? (
                  <span style={playerHubStyles.passportMeta}>
                    Member since {passportMemberSince}
                  </span>
                ) : null}
                <div style={playerHubStyles.passportRoleRow}>
                  {passportRoleBadges.map((badge) => (
                    <span key={badge} style={playerHubStyles.passportRoleBadge}>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <div style={playerHubStyles.passportStatsGrid}>
              {passportStatCards.map(([label, value]) => (
                <article key={label} style={playerHubStyles.passportStatCard}>
                  <strong style={playerHubStyles.passportStatValue}>
                    {value}
                  </strong>
                  <span style={playerHubStyles.passportStatLabel}>{label}</span>
                </article>
              ))}
            </div>
          </div>

          <div style={playerHubStyles.passportGrid}>
            <article style={playerHubStyles.passportPanel}>
              <div style={playerHubStyles.homeCardHeader}>
                <div style={playerHubStyles.profileMeta}>
                  <div style={playerHubStyles.sectionTitle}>
                    Availability history
                  </div>
                  <div style={playerHubStyles.cardText}>
                    Recent tournament responses and roster status.
                  </div>
                </div>
                <span style={playerHubStyles.chip}>
                  {passportActivityItems.length}
                </span>
              </div>
              {passportActivityItems.length ? (
                <div style={playerHubStyles.passportActivityList}>
                  {passportActivityItems.map((activity) => (
                    <div
                      key={activity.key}
                      style={playerHubStyles.passportActivityRow}
                    >
                      <div style={playerHubStyles.profileMeta}>
                        <strong style={playerHubStyles.previewTitle}>
                          {activity.tournamentName}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          {[activity.teamName, activity.note]
                            .filter(Boolean)
                            .join(" / ")}
                        </span>
                      </div>
                      <span
                        style={{
                          ...playerHubStyles.accessStatusChip,
                          ...passportStatusStyle(activity.status),
                        }}
                      >
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={playerHubStyles.passportEmpty}>
                  History appears after tournament responses and roster activity.
                </div>
              )}
            </article>

            <article style={playerHubStyles.passportPanel}>
              <div style={playerHubStyles.homeCardHeader}>
                <div style={playerHubStyles.profileMeta}>
                  <div style={playerHubStyles.sectionTitle}>Achievements</div>
                  <div style={playerHubStyles.cardText}>
                    Badges from your current activity.
                  </div>
                </div>
                <span style={playerHubStyles.chip}>
                  {passportAchievements.filter((badge) => badge.active).length}
                </span>
              </div>
              <div style={playerHubStyles.passportAchievementGrid}>
                {passportAchievements.map((badge) => (
                  <div
                    key={badge.id}
                    style={{
                      ...playerHubStyles.passportAchievementBadge,
                      ...(badge.active
                        ? {}
                        : playerHubStyles.passportAchievementBadgeLocked),
                    }}
                  >
                    <span style={playerHubStyles.passportAchievementTitle}>
                      {badge.label}
                    </span>
                    <span style={playerHubStyles.passportAchievementDetail}>
                      {badge.detail}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {showPlayerAdsArea && (visibleTeamNeeds.length ||
      visibleTeamNeedsStatus === "loading" ||
      teamInterestMessage) ? (
      <section style={playerHubStyles.profileCard}>
        <div style={playerHubStyles.profileHeader}>
          <div style={playerHubStyles.profileMeta}>
            <div style={playerHubStyles.sectionTitle}>
              Player ads
            </div>
          </div>
          <span style={playerHubStyles.chip}>
            {visibleTeamNeeds.length}
          </span>
        </div>

        {visibleTeamNeeds.length ? (
          <div style={playerHubStyles.previewGrid}>
            {visibleTeamNeeds.map((need) => {
              const interestStatus =
                need.myInterestStatus ||
                myInterestStatusByNeedId[need.needId] ||
                "";
              const stats = teamNeedStatLabels(need);
              const teamName = need.clubTeamName || "Team";
              const acceptedPercent = Math.min(
                100,
                Math.round(
                  (stats.acceptedCount / Math.max(1, stats.neededCount)) * 100
                )
              );

              return (
                <article key={need.needId} style={playerHubStyles.teamNeedCard}>
                  <div style={playerHubStyles.profileMeta}>
                    <div style={playerHubStyles.previewType}>
                      {teamNeedTypeLabel(need.needType)}
                    </div>
                    <strong style={playerHubStyles.previewTitle}>
                      {teamNeedSummary(need, teamName)}
                    </strong>
                    {need.tournamentName ? (
                      <span style={playerHubStyles.previewSubtitle}>
                        {need.tournamentName}
                      </span>
                    ) : null}
                    {[need.className, need.squadLabel, need.country]
                      .filter(Boolean)
                      .length ? (
                      <span style={playerHubStyles.previewSubtitle}>
                        {[need.className, need.squadLabel, need.country]
                          .filter(Boolean)
                          .join(" / ")}
                      </span>
                    ) : null}
                  </div>
                  <div style={playerHubStyles.chipRow}>
                    <span
                      style={{
                        ...playerHubStyles.chip,
                        ...playerHubStyles.tournamentAdChip,
                      }}
                    >
                      Tournament ad
                    </span>
                    <span style={playerHubStyles.chip}>
                      {need.status === "OPEN" ? "Open" : "Closed"}
                    </span>
                    {interestStatus ? (
                      <span
                        style={{
                          ...playerHubStyles.accessStatusChip,
                          ...accessRequestStatusStyle(interestStatus),
                        }}
                      >
                        {formatAccessRequestStatus(interestStatus)}
                      </span>
                    ) : null}
                    {stats.filled ? (
                      <span
                        style={{
                          ...playerHubStyles.accessStatusChip,
                          ...playerHubStyles.accessStatusApproved,
                        }}
                      >
                        Filled
                      </span>
                    ) : null}
                  </div>
                  {need.needText ? (
                    <span style={playerHubStyles.cardText}>{need.needText}</span>
                  ) : null}
                  <div style={playerHubStyles.progressTrack}>
                    <div
                      style={{
                        ...playerHubStyles.progressFill,
                        width: `${acceptedPercent}%`,
                      }}
                    />
                  </div>
                  {!need.ownTeamNeed ? (
                    <div style={playerHubStyles.chipRow}>
                      <span style={playerHubStyles.chip}>
                        Accepted {stats.acceptedCount}/{stats.neededCount}
                      </span>
                      <span style={playerHubStyles.chip}>
                        {stats.remainingLabel}
                      </span>
                    </div>
                  ) : null}
                  {need.ownTeamNeed ? (
                    <div style={playerHubStyles.chipRow}>
                      <span style={playerHubStyles.chip}>Your team need</span>
                      <span style={playerHubStyles.chip}>
                        Accepted {stats.acceptedCount}/{stats.neededCount}
                      </span>
                      <span style={playerHubStyles.chip}>
                        {stats.remainingLabel}
                      </span>
                    </div>
                  ) : interestStatus ? (
                    <button
                      type="button"
                      style={{
                        ...playerHubStyles.adminActionButton,
                        ...playerHubStyles.adminDisabledButton,
                      }}
                      disabled
                    >
                      {formatAccessRequestStatus(interestStatus)}
                    </button>
                  ) : stats.filled ? (
                    <button
                      type="button"
                      style={{
                        ...playerHubStyles.adminActionButton,
                        ...playerHubStyles.adminDisabledButton,
                      }}
                      disabled
                    >
                      Filled
                    </button>
                  ) : (
                    <div style={playerHubStyles.section}>
                      {teamInterestOpenNeedId === need.needId ? (
                        <label style={playerHubStyles.profileField}>
                          <span style={playerHubStyles.profileLabel}>
                            Optional message
                          </span>
                          <textarea
                            style={playerHubStyles.profileTextareaCompact}
                            value={teamInterestDrafts[need.needId] || ""}
                            onChange={(event) =>
                              updateTeamInterestDraft(
                                need.needId,
                                event.target.value
                              )
                            }
                            placeholder="Short message..."
                          />
                        </label>
                      ) : null}
                      <button
                        type="button"
                        style={playerHubStyles.adminActionButton}
                        disabled={teamInterestStatus === "saving"}
                        onClick={() =>
                          teamInterestOpenNeedId === need.needId
                            ? submitTeamNeedInterest(need)
                            : setTeamInterestOpenNeedId(need.needId)
                        }
                      >
                        {teamInterestStatus === "saving" &&
                        teamInterestOpenNeedId === need.needId
                          ? "Sending..."
                          : teamInterestOpenNeedId === need.needId
                            ? "Send interest"
                            : "I'm interested"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : visibleTeamNeedsStatus === "loading" ? (
          <div style={playerHubStyles.emptyPreview}>Loading player ads...</div>
        ) : (
          <div style={playerHubStyles.emptyPreview}>
            No published tournament player ads yet.
          </div>
        )}
        {teamInterestMessage ? (
          <div
            role={teamInterestStatus === "error" ? "alert" : "status"}
            style={{
              ...playerHubStyles.adminFeedbackBanner,
              ...(teamInterestStatus === "error"
                ? playerHubStyles.adminFeedbackError
                : playerHubStyles.adminFeedbackSuccess),
            }}
          >
            <span style={playerHubStyles.adminFeedbackTitle}>
              {teamInterestStatus === "error" ? "Interest failed" : "Interest"}
            </span>
            <span>{teamInterestMessage}</span>
          </div>
        ) : null}
      </section>
      ) : null}

      {showHubAdmin && adminDashboardCards.length ? (
        <section style={playerHubStyles.adminReviewCard}>
          <div style={playerHubStyles.adminReviewTop}>
            <div style={playerHubStyles.profileMeta}>
              <div style={playerHubStyles.sectionTitle}>Admin dashboard</div>
              <div style={playerHubStyles.cardText}>
                Open one review area at a time. Details load on demand.
              </div>
            </div>
          </div>
          <div style={playerHubStyles.adminDashboardGrid}>
            {adminDashboardCards.map((card) => {
              const active = openAdminPanel === card.id;
              const loading = card.status === "loading";
              const numericCount = Number(card.count);
              const muted =
                !active && !loading && Number.isFinite(numericCount) && numericCount === 0;

              return (
                <article
                  key={card.id}
                  style={{
                    ...playerHubStyles.adminDashboardTile,
                    ...(active ? playerHubStyles.adminDashboardTileActive : {}),
                    ...(muted ? playerHubStyles.adminDashboardTileMuted : {}),
                  }}
                >
                  <div style={playerHubStyles.homeCardHeader}>
                    <span style={playerHubStyles.adminDashboardIcon}>
                      {card.icon}
                    </span>
                    <span
                      style={{
                        ...playerHubStyles.accessStatusChip,
                        ...(card.status === "error"
                          ? playerHubStyles.accessStatusRejected
                          : {}),
                      }}
                    >
                      {loading ? "Loading" : active ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div style={playerHubStyles.profileMeta}>
                    <strong style={playerHubStyles.previewTitle}>
                      {card.title}
                    </strong>
                    <span style={playerHubStyles.adminDashboardCount}>
                      {loading ? "..." : card.count}
                    </span>
                    <span style={playerHubStyles.previewSubtitle}>
                      {card.meta}
                    </span>
                  </div>
                  <button
                    type="button"
                    style={playerHubStyles.adminActionButton}
                    onClick={() => openAdminDashboardPanel(card)}
                    disabled={loading}
                  >
                    {active ? "Close" : "Open"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {showHubAdmin && isAdmin && openAdminPanel === "players" ? (
        <details open style={playerHubStyles.adminAccordion}>
          <summary style={playerHubStyles.adminAccordionSummary}>
            <span>Player profile review</span>
            <span style={playerHubStyles.chip}>{adminProfiles.length}</span>
          </summary>
          <div style={playerHubStyles.adminAccordionBody}>
          <div style={playerHubStyles.adminReviewTop}>
            <div style={playerHubStyles.profileMeta}>
              <div style={playerHubStyles.sectionTitle}>
                Player profile review
              </div>
              <div style={playerHubStyles.cardText}>
                Admin-only beta review for self-registered player accounts.
                This does not grant Team Builder or Tournament access.
              </div>
            </div>
            <button
              type="button"
              style={playerHubStyles.adminActionButton}
              onClick={loadAdminReviewProfiles}
              disabled={adminReviewStatus === "loading"}
            >
              {adminReviewStatus === "loading" ? "Loading..." : "Refresh"}
            </button>
          </div>

          {adminReviewMessage ? (
            <div style={playerHubStyles.profileMessage}>
              {adminReviewMessage}
            </div>
          ) : null}

          {adminProfiles.length ? (
            <div style={playerHubStyles.adminReviewGrid}>
              {adminProfiles.map((profile) => {
                const isUpdating =
                  adminUpdatingUsername &&
                  String(adminUpdatingUsername).toLowerCase() ===
                    String(profile.username || "").toLowerCase();
                const passwordDraftKey = String(
                  profile.username || ""
                ).toLowerCase();
                const passwordDraft =
                  adminPasswordDrafts[passwordDraftKey] || "";

                return (
                  <article
                    key={profile.username || profile.profileId}
                    style={playerHubStyles.adminReviewProfileCard}
                  >
                    <div style={playerHubStyles.profilePreviewTitleRow}>
                      <div style={playerHubStyles.profileMeta}>
                        <div style={playerHubStyles.previewType}>
                          {adminProfileValue(profile.profileType, "Player")}
                        </div>
                        <strong style={playerHubStyles.previewTitle}>
                          {adminProfileValue(
                            profile.displayName,
                            "Unnamed player"
                          )}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          Username: {adminProfileValue(profile.username)}
                        </span>
                      </div>
                      <div style={playerHubStyles.chipRow}>
                        {adminProfileStatusChips(profile).map((chip) => (
                          <span key={chip} style={playerHubStyles.chip}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={playerHubStyles.detailGrid}>
                      {[
                        ["First name", adminProfileValue(profile.firstName)],
                        ["Last name", adminProfileValue(profile.lastName)],
                        ["Email", adminProfileValue(profile.email)],
                        ["Country", adminProfileValue(profile.country)],
                        [
                          "Club/team",
                          profile.freeAgent
                            ? "No fixed club/team"
                            : adminProfileValue(
                                profile.clubTeamName || profile.clubOrTeam,
                                "Not listed / no fixed team"
                              ),
                        ],
                        ["Team note", adminProfileValue(profile.teamNote)],
                        [
                          "Public request",
                          profile.publicVisible ? "Yes" : "No",
                        ],
                        ["Approved", profile.approved ? "Yes" : "No"],
                        ["Active", profile.active ? "Yes" : "No"],
                      ].map(([label, value]) => (
                        <div key={label} style={playerHubStyles.detail}>
                          <span style={playerHubStyles.detailLabel}>
                            {label}
                          </span>
                          <span style={playerHubStyles.detailValue}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={playerHubStyles.adminPasswordRow}>
                      <input
                        type="password"
                        style={playerHubStyles.profileInput}
                        value={passwordDraft}
                        onChange={(event) =>
                          updateAdminPasswordDraft(profile, event.target.value)
                        }
                        placeholder="New password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        style={{
                          ...playerHubStyles.adminActionButton,
                          ...(isUpdating || !String(passwordDraft).trim()
                            ? playerHubStyles.adminDisabledButton
                            : {}),
                        }}
                        disabled={isUpdating || !String(passwordDraft).trim()}
                        onClick={() => resetAdminPlayerPassword(profile)}
                      >
                        Reset password
                      </button>
                    </div>

                    <div style={playerHubStyles.adminActionRow}>
                      <button
                        type="button"
                        style={{
                          ...playerHubStyles.adminActionButton,
                          ...(isUpdating || profile.approved
                            ? playerHubStyles.adminDisabledButton
                            : {}),
                        }}
                        disabled={isUpdating || profile.approved}
                        onClick={() =>
                          updateAdminProfileStatus(profile, {
                            approved: true,
                            publicVisible: true,
                          })
                        }
                      >
                        {profile.approved
                          ? "Approved public profile"
                          : "Approve public profile"}
                      </button>
                      <button
                        type="button"
                        style={{
                          ...playerHubStyles.adminActionButton,
                          ...(isUpdating || !profile.approved
                            ? playerHubStyles.adminDisabledButton
                            : {}),
                        }}
                        disabled={isUpdating || !profile.approved}
                        onClick={() =>
                          updateAdminProfileStatus(profile, { approved: false })
                        }
                      >
                        {profile.approved ? "Remove approval" : "No approval"}
                      </button>
                      <button
                        type="button"
                        style={{
                          ...playerHubStyles.adminActionButton,
                          ...playerHubStyles.adminDangerButton,
                          ...(isUpdating ||
                          (!profile.publicVisible && !profile.approved)
                            ? playerHubStyles.adminDisabledButton
                            : {}),
                        }}
                        disabled={
                          isUpdating ||
                          (!profile.publicVisible && !profile.approved)
                        }
                        onClick={() =>
                          updateAdminProfileStatus(profile, {
                            publicVisible: false,
                            approved: false,
                          })
                        }
                      >
                        {!profile.publicVisible && !profile.approved
                          ? "Hidden"
                          : "Hide public profile"}
                      </button>
                      <button
                        type="button"
                        style={{
                          ...playerHubStyles.adminActionButton,
                          ...(profile.active
                            ? playerHubStyles.adminDangerButton
                            : {}),
                          ...(isUpdating ? playerHubStyles.adminDisabledButton : {}),
                        }}
                        disabled={isUpdating}
                        onClick={() => {
                          if (profile.active) {
                            setPendingDeactivateProfile(profile);
                            return;
                          }

                          updateAdminProfileStatus(profile, { active: true });
                        }}
                      >
                        {profile.active
                          ? "Deactivate player account"
                          : "Reactivate player account"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : adminReviewStatus === "loading" ? null : (
            <div style={playerHubStyles.emptyPreview}>
              No player profiles to review yet.
            </div>
          )}
          </div>
        </details>
      ) : null}

      {showHubAdmin && isAdmin && openAdminPanel === "access" ? (
        <details open style={playerHubStyles.adminAccordion}>
          <summary style={playerHubStyles.adminAccordionSummary}>
            <span>Access request review</span>
            <span style={playerHubStyles.chip}>{adminAccessRequests.length}</span>
          </summary>
          <div style={playerHubStyles.adminAccordionBody}>
          <div style={playerHubStyles.adminReviewTop}>
            <div style={playerHubStyles.profileMeta}>
              <div style={playerHubStyles.sectionTitle}>
                Access request review
              </div>
              <div style={playerHubStyles.cardText}>
                Admin-only review. Trainer approval enables Team Builder;
                organizer approval enables Tournaments. Captain approval is
                request-only for now.
              </div>
            </div>
            <button
              type="button"
              style={playerHubStyles.adminActionButton}
              onClick={loadAdminAccessRequests}
              disabled={adminAccessRequestsStatus === "loading"}
            >
              {adminAccessRequestsStatus === "loading" ? "Loading..." : "Refresh"}
            </button>
          </div>

          {adminAccessRequestsMessage ? (
            <div
              role={adminAccessRequestsStatus === "error" ? "alert" : "status"}
              style={{
                ...playerHubStyles.adminFeedbackBanner,
                ...(adminAccessRequestsStatus === "error"
                  ? playerHubStyles.adminFeedbackError
                  : playerHubStyles.adminFeedbackSuccess),
              }}
            >
              <span style={playerHubStyles.adminFeedbackTitle}>
                {adminAccessRequestsStatus === "error" ? "Review failed" : "Review"}
              </span>
              <span>{adminAccessRequestsMessage}</span>
            </div>
          ) : null}

          {adminAccessRequests.length ? (
            <div style={playerHubStyles.adminReviewGrid}>
              {adminAccessRequests.map((request) => {
                const isUpdating =
                  String(adminAccessRequestUpdatingId || "") ===
                  String(request.requestId || "");
                const isPending = request.status === "PENDING";
                const noteValue =
                  adminAccessRequestNotes[request.requestId] ??
                  request.adminNote ??
                  "";

                return (
                  <article
                    key={request.requestId}
                    style={playerHubStyles.adminReviewProfileCard}
                  >
                    <div style={playerHubStyles.profilePreviewTitleRow}>
                      <div style={playerHubStyles.profileMeta}>
                        <div style={playerHubStyles.previewType}>
                          {accessRequestLabel(request.requestType)}
                        </div>
                        <strong style={playerHubStyles.previewTitle}>
                          {adminProfileValue(
                            request.displayName,
                            request.username || "User"
                          )}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          {adminProfileValue(request.email || request.username)}
                        </span>
                      </div>
                      <span
                        style={{
                          ...playerHubStyles.accessStatusChip,
                          ...accessRequestStatusStyle(request.status),
                        }}
                      >
                        {request.status || "PENDING"}
                      </span>
                    </div>

                    <div style={playerHubStyles.detailGrid}>
                      {[
                        ["Club/team", adminProfileValue(request.clubTeamName)],
                        ["Message", adminProfileValue(request.message)],
                        [
                          "Created",
                          request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString()
                            : "No date",
                        ],
                        [
                          "Reviewed",
                          request.reviewedAt
                            ? new Date(request.reviewedAt).toLocaleDateString()
                            : "Not reviewed",
                        ],
                      ].map(([label, value]) => (
                        <div key={label} style={playerHubStyles.detail}>
                          <span style={playerHubStyles.detailLabel}>
                            {label}
                          </span>
                          <span style={playerHubStyles.detailValue}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {request.warning ? (
                      <div style={playerHubStyles.accessWarning}>
                        {request.warning}
                      </div>
                    ) : null}

                    <label style={playerHubStyles.profileField}>
                      <span style={playerHubStyles.profileLabel}>Admin note</span>
                      <input
                        style={playerHubStyles.profileInput}
                        value={noteValue}
                        onChange={(event) =>
                          updateAdminAccessRequestNote(
                            request,
                            event.target.value
                          )
                        }
                        placeholder="Optional note"
                        disabled={!isPending || isUpdating}
                      />
                    </label>

                    <div style={playerHubStyles.adminActionRow}>
                      <button
                        type="button"
                        style={{
                          ...playerHubStyles.adminActionButton,
                          ...(isUpdating || !isPending
                            ? playerHubStyles.adminDisabledButton
                            : {}),
                        }}
                        disabled={isUpdating || !isPending}
                        onClick={() =>
                          reviewAdminAccessRequest(request, "APPROVED")
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        style={{
                          ...playerHubStyles.adminActionButton,
                          ...playerHubStyles.adminDangerButton,
                          ...(isUpdating || !isPending
                            ? playerHubStyles.adminDisabledButton
                            : {}),
                        }}
                        disabled={isUpdating || !isPending}
                        onClick={() =>
                          reviewAdminAccessRequest(request, "REJECTED")
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : adminAccessRequestsStatus === "loading" ? null : (
            <div style={playerHubStyles.emptyPreview}>
              No pending requests.
            </div>
          )}
          </div>
        </details>
      ) : null}

      {showHubAdmin && isAdmin && openAdminPanel === "clubs" ? (
        <details open style={playerHubStyles.adminAccordion}>
          <summary style={playerHubStyles.adminAccordionSummary}>
            <span>Official clubs/teams</span>
            <span style={playerHubStyles.chip}>{adminClubTeams.length}</span>
          </summary>
          <div style={playerHubStyles.adminAccordionBody}>
          <div style={playerHubStyles.adminReviewTop}>
            <div style={playerHubStyles.profileMeta}>
              <div style={playerHubStyles.sectionTitle}>
                Official clubs/teams
              </div>
              <div style={playerHubStyles.cardText}>
                Admin-controlled selectable list for player profiles. This does
                not create official membership yet.
              </div>
            </div>
            <button
              type="button"
              style={playerHubStyles.adminActionButton}
              onClick={loadAdminClubTeams}
              disabled={adminClubTeamsStatus === "loading"}
            >
              {adminClubTeamsStatus === "loading" ? "Loading..." : "Refresh"}
            </button>
          </div>

          <form
            onSubmit={handleSaveAdminClubTeam}
            style={playerHubStyles.clubTeamAdminForm}
          >
            <input
              style={playerHubStyles.profileInput}
              value={adminClubTeamDraft.name}
              onChange={(event) =>
                updateAdminClubTeamDraft("name", event.target.value)
              }
              placeholder="Club/team name"
              required
            />
            <input
              style={playerHubStyles.profileInput}
              value={adminClubTeamDraft.country}
              onChange={(event) =>
                updateAdminClubTeamDraft("country", event.target.value)
              }
              placeholder="Country optional"
            />
            <input
              style={playerHubStyles.profileInput}
              value={adminClubTeamDraft.city}
              onChange={(event) =>
                updateAdminClubTeamDraft("city", event.target.value)
              }
              placeholder="City optional"
            />
            <label style={playerHubStyles.checkboxRow}>
              <input
                type="checkbox"
                checked={adminClubTeamDraft.active}
                onChange={(event) =>
                  updateAdminClubTeamDraft("active", event.target.checked)
                }
              />
              <span>Active</span>
            </label>
            <div style={playerHubStyles.adminActionRow}>
              <button
                type="submit"
                style={{
                  ...playerHubStyles.saveButton,
                  ...(adminClubTeamsStatus === "saving"
                    ? playerHubStyles.saveButtonDisabled
                    : {}),
                }}
                disabled={adminClubTeamsStatus === "saving"}
              >
                {adminClubTeamsStatus === "saving"
                  ? "Saving..."
                  : adminClubTeamDraft.teamId
                    ? "Save changes"
                    : "Add club/team"}
              </button>
              {adminClubTeamDraft.teamId ? (
                <button
                  type="button"
                  style={playerHubStyles.adminActionButton}
                  onClick={resetAdminClubTeamDraft}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          {adminClubTeamsMessage ? (
            <div
              role={adminClubTeamsStatus === "error" ? "alert" : "status"}
              style={{
                ...playerHubStyles.adminFeedbackBanner,
                ...(adminClubTeamsStatus === "error"
                  ? playerHubStyles.adminFeedbackError
                  : playerHubStyles.adminFeedbackSuccess),
              }}
            >
              <span style={playerHubStyles.adminFeedbackTitle}>
                {adminClubTeamsStatus === "error" ? "Could not save" : "Updated"}
              </span>
              <span>{adminClubTeamsMessage}</span>
            </div>
          ) : null}

          {adminClubTeams.length ? (
            <div style={playerHubStyles.clubTeamAdminList}>
              {adminClubTeams.map((team) => {
                const isUpdating =
                  String(adminClubTeamUpdatingId || "") ===
                  String(team.teamId || "");
                const rowActionDisabled =
                  isUpdating || adminClubTeamsStatus === "saving";

                return (
                  <article
                    key={team.teamId}
                    style={playerHubStyles.clubTeamAdminRow}
                  >
                    <div style={playerHubStyles.profileMeta}>
                      <strong style={playerHubStyles.previewTitle}>
                        {team.name}
                      </strong>
                      <span style={playerHubStyles.previewSubtitle}>
                        {[team.city, team.country]
                          .map((part) => String(part || "").trim())
                          .filter(Boolean)
                          .join(", ") || "No location"}
                      </span>
                    </div>
                    <div style={playerHubStyles.chipRow}>
                      <span
                        style={{
                          ...playerHubStyles.clubTeamStatusChip,
                          ...(team.active
                            ? playerHubStyles.clubTeamStatusActive
                            : playerHubStyles.clubTeamStatusInactive),
                        }}
                      >
                        {team.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div style={playerHubStyles.adminActionRow}>
                      <button
                        type="button"
                        style={{
                          ...playerHubStyles.adminActionButton,
                          ...(rowActionDisabled
                            ? playerHubStyles.adminDisabledButton
                            : {}),
                        }}
                        disabled={rowActionDisabled}
                        onClick={() =>
                          setAdminClubTeamDraft({
                            teamId: team.teamId || "",
                            name: team.name || "",
                            country: team.country || "",
                            city: team.city || "",
                            active: !!team.active,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{
                          ...playerHubStyles.adminActionButton,
                          ...(team.active
                            ? playerHubStyles.adminDangerButton
                            : {}),
                          ...(rowActionDisabled
                            ? playerHubStyles.adminDisabledButton
                            : {}),
                        }}
                        disabled={rowActionDisabled}
                        onClick={() =>
                          updateAdminClubTeamActive(team, !team.active)
                        }
                      >
                        {team.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : adminClubTeamsStatus === "loading" ? null : (
            <div style={playerHubStyles.emptyPreview}>
              No official clubs/teams added yet.
            </div>
          )}
          </div>
        </details>
      ) : null}

      {showHubAdmin && isAdmin && openAdminPanel === "identity" ? (
        <details open style={playerHubStyles.adminAccordion}>
          <summary style={playerHubStyles.adminAccordionSummary}>
            <span>Team identity requests</span>
            <span style={playerHubStyles.chip}>
              {
                adminTeamIdentityRequests.filter(
                  (request) => request.status === "PENDING"
                ).length
              }
            </span>
          </summary>
          <div style={playerHubStyles.adminAccordionBody}>
            <div style={playerHubStyles.adminReviewTop}>
              <div style={playerHubStyles.profileMeta}>
                <div style={playerHubStyles.sectionTitle}>
                  Team identity requests
                </div>
                <div style={playerHubStyles.cardText}>
                  Admin approval for official team name, country and city changes.
                </div>
              </div>
              <button
                type="button"
                style={playerHubStyles.adminActionButton}
                onClick={loadAdminTeamIdentityRequests}
                disabled={adminTeamIdentityStatus === "loading"}
              >
                {adminTeamIdentityStatus === "loading"
                  ? "Loading..."
                  : "Refresh"}
              </button>
            </div>

            {adminTeamIdentityMessage ? (
              <div style={playerHubStyles.profileMessage}>
                {adminTeamIdentityMessage}
              </div>
            ) : null}

            {adminTeamIdentityRequests.length ? (
              <div style={playerHubStyles.accessRequestList}>
                {adminTeamIdentityRequests.map((request) => {
                  const updating =
                    adminTeamIdentityUpdatingId === request.requestId;
                  const currentLabel = [
                    request.currentName || "Team",
                    request.currentCountry,
                    request.currentCity,
                  ]
                    .filter(Boolean)
                    .join(" / ");
                  const requestedLabel = [
                    request.requestedName || "Team",
                    request.requestedCountry,
                    request.requestedCity,
                  ]
                    .filter(Boolean)
                    .join(" / ");

                  return (
                    <article
                      key={request.requestId}
                      style={playerHubStyles.teamControlRow}
                    >
                      <div style={playerHubStyles.interestPlayerMeta}>
                        <strong style={playerHubStyles.interestPlayerName}>
                          {request.currentName || "Team"} {"->"}{" "}
                          {request.requestedName || "Team"}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          {currentLabel} -> {requestedLabel}
                        </span>
                        <span style={playerHubStyles.previewSubtitle}>
                          Requested by: {request.requestedByUsername || "Unknown"}
                        </span>
                        {request.reason ? (
                          <span style={playerHubStyles.previewSubtitle}>
                            Reason: {request.reason}
                          </span>
                        ) : null}
                      </div>
                      <div style={playerHubStyles.teamControlActionsRow}>
                        <span
                          style={{
                            ...playerHubStyles.accessStatusChip,
                            ...accessRequestStatusStyle(request.status),
                          }}
                        >
                          {formatAccessRequestStatus(request.status)}
                        </span>
                        {request.status === "PENDING" ? (
                          <>
                            <input
                              style={playerHubStyles.profileInput}
                              value={
                                adminTeamIdentityNotes[request.requestId] || ""
                              }
                              onChange={(event) =>
                                setAdminTeamIdentityNotes((current) => ({
                                  ...current,
                                  [request.requestId]: event.target.value,
                                }))
                              }
                              placeholder="Admin note"
                            />
                            <button
                              type="button"
                              style={{
                                ...playerHubStyles.addTeamMemberButton,
                                ...(updating
                                  ? playerHubStyles.adminDisabledButton
                                  : {}),
                              }}
                              disabled={updating}
                              onClick={() =>
                                handleReviewTeamIdentityRequest(
                                  request,
                                  "APPROVED"
                                )
                              }
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              style={{
                                ...playerHubStyles.adminActionButton,
                                ...playerHubStyles.adminDangerButton,
                                ...(updating
                                  ? playerHubStyles.adminDisabledButton
                                  : {}),
                              }}
                              disabled={updating}
                              onClick={() =>
                                handleReviewTeamIdentityRequest(
                                  request,
                                  "REJECTED"
                                )
                              }
                            >
                              Reject
                            </button>
                          </>
                        ) : request.adminNote ? (
                          <span style={playerHubStyles.previewSubtitle}>
                            {request.adminNote}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : adminTeamIdentityStatus === "loading" ? null : (
              <div style={playerHubStyles.emptyPreview}>
                No team identity requests.
              </div>
            )}
          </div>
        </details>
      ) : null}

      {showHubAdmin && isAdmin && openAdminPanel === "profiles" ? (
        <details open style={playerHubStyles.adminAccordion}>
          <summary style={playerHubStyles.adminAccordionSummary}>
            <span>Team profile review</span>
            <span style={playerHubStyles.chip}>{adminTeamProfiles.length}</span>
          </summary>
          <div style={playerHubStyles.adminAccordionBody}>
            <div style={playerHubStyles.adminReviewTop}>
              <div style={playerHubStyles.profileMeta}>
                <div style={playerHubStyles.sectionTitle}>
                  Team profile review
                </div>
                <div style={playerHubStyles.cardText}>
                  Admin-only beta review for captain-managed team profiles.
                </div>
              </div>
              <button
                type="button"
                style={playerHubStyles.adminActionButton}
                onClick={loadAdminTeamProfiles}
                disabled={adminTeamProfileStatus === "loading"}
              >
                {adminTeamProfileStatus === "loading" ? "Loading..." : "Refresh"}
              </button>
            </div>

            {adminTeamProfileMessage ? (
              <div style={playerHubStyles.profileMessage}>
                {adminTeamProfileMessage}
              </div>
            ) : null}

            {adminTeamProfiles.length ? (
              <div style={playerHubStyles.adminReviewGrid}>
                {adminTeamProfiles.map((teamProfileItem) => {
                  const isUpdating =
                    String(adminTeamProfileUpdatingId || "") ===
                    String(teamProfileItem.teamProfileId || "");

                  return (
                    <article
                      key={teamProfileItem.teamProfileId}
                      style={playerHubStyles.adminReviewProfileCard}
                    >
                      <div style={playerHubStyles.profilePreviewTitleRow}>
                        <div style={playerHubStyles.profileMeta}>
                          <strong style={playerHubStyles.previewTitle}>
                            {teamProfileItem.clubTeamName || "Team"}
                          </strong>
                          <span style={playerHubStyles.previewSubtitle}>
                            Captain:{" "}
                            {teamProfileItem.captainDisplayName ||
                              teamProfileItem.captainUsername ||
                              "Unknown"}
                          </span>
                          <span style={playerHubStyles.previewSubtitle}>
                            {teamProfileItem.country || "No country"} / needs{" "}
                            {teamProfileItem.openNeedsCount || 0}
                          </span>
                        </div>
                        <div style={playerHubStyles.chipRow}>
                          <span style={playerHubStyles.chip}>
                            {teamProfileItem.active ? "Active" : "Inactive"}
                          </span>
                          <span style={playerHubStyles.chip}>
                            {teamProfileItem.approved ? "Approved" : "Hidden"}
                          </span>
                        </div>
                      </div>
                      <div style={playerHubStyles.adminActionRow}>
                        <button
                          type="button"
                          style={{
                            ...playerHubStyles.adminActionButton,
                            ...(teamProfileItem.active
                              ? playerHubStyles.adminDangerButton
                              : {}),
                            ...(isUpdating ? playerHubStyles.adminDisabledButton : {}),
                          }}
                          disabled={isUpdating}
                          onClick={() =>
                            updateAdminTeamProfile(teamProfileItem, {
                              active: !teamProfileItem.active,
                            })
                          }
                        >
                          {teamProfileItem.active ? "Deactivate" : "Reactivate"}
                        </button>
                        <button
                          type="button"
                          style={{
                            ...playerHubStyles.adminActionButton,
                            ...(isUpdating ? playerHubStyles.adminDisabledButton : {}),
                          }}
                          disabled={isUpdating}
                          onClick={() =>
                            updateAdminTeamProfile(teamProfileItem, {
                              approved: !teamProfileItem.approved,
                            })
                          }
                        >
                          {teamProfileItem.approved
                            ? "Remove approval"
                            : "Approve"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : adminTeamProfileStatus === "loading" ? null : (
              <div style={playerHubStyles.emptyPreview}>
                No team profiles yet.
              </div>
            )}
          </div>
        </details>
      ) : null}

      {showHubAdmin && isAdmin && openAdminPanel === "needs" ? (
        <details open style={playerHubStyles.adminAccordion}>
          <summary style={playerHubStyles.adminAccordionSummary}>
            <span>Team need interest review</span>
            <span style={playerHubStyles.chip}>
              {adminTeamNeedInterests.length}
            </span>
          </summary>
          <div style={playerHubStyles.adminAccordionBody}>
            <div style={playerHubStyles.adminReviewTop}>
              <div style={playerHubStyles.profileMeta}>
                <div style={playerHubStyles.sectionTitle}>
                  Team need interest review
                </div>
                <div style={playerHubStyles.cardText}>
                  Interest overview.
                </div>
              </div>
              <button
                type="button"
                style={playerHubStyles.adminActionButton}
                onClick={loadAdminTeamNeedInterests}
                disabled={adminTeamNeedInterestStatus === "loading"}
              >
                {adminTeamNeedInterestStatus === "loading"
                  ? "Loading..."
                  : "Refresh"}
              </button>
            </div>

            {adminTeamNeedInterests.length ? (
              <div style={playerHubStyles.adminReviewGrid}>
                {adminTeamNeedInterests.map((interest) => (
                  <article
                    key={interest.interestId}
                    style={playerHubStyles.adminReviewProfileCard}
                  >
                    <div style={playerHubStyles.profileMeta}>
                      <strong style={playerHubStyles.previewTitle}>
                        {interest.clubTeamName || "Team"}
                      </strong>
                      <span style={playerHubStyles.previewSubtitle}>
                        Player:{" "}
                        {interest.playerDisplayName ||
                          interest.playerUsername ||
                          "Unknown"}
                      </span>
                      <span style={playerHubStyles.previewSubtitle}>
                        {interest.createdAt
                          ? new Date(interest.createdAt).toLocaleDateString()
                          : "No date"}
                      </span>
                    </div>
                    <div style={playerHubStyles.chipRow}>
                      <span style={playerHubStyles.chip}>
                        {interest.status || "PENDING"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : adminTeamNeedInterestStatus === "loading" ? null : (
              <div style={playerHubStyles.emptyPreview}>
                No team need interests yet.
              </div>
            )}
          </div>
        </details>
      ) : null}

      {showHubAdmin && isAdmin && openAdminPanel === "members" ? (
        <details open style={playerHubStyles.adminAccordion}>
          <summary style={playerHubStyles.adminAccordionSummary}>
            <span>Team members review</span>
            <span style={playerHubStyles.chip}>{adminTeamMembers.length}</span>
          </summary>
          <div style={playerHubStyles.adminAccordionBody}>
            <div style={playerHubStyles.adminReviewTop}>
              <div style={playerHubStyles.profileMeta}>
                <div style={playerHubStyles.sectionTitle}>
                  Team members review
                </div>
                <div style={playerHubStyles.cardText}>
                  Confirmed team members.
                </div>
              </div>
              <button
                type="button"
                style={playerHubStyles.adminActionButton}
                onClick={loadAdminTeamMembers}
                disabled={adminTeamMembersStatus === "loading"}
              >
                {adminTeamMembersStatus === "loading" ? "Loading..." : "Refresh"}
              </button>
            </div>

            {adminTeamMembers.length ? (
              <div style={playerHubStyles.adminReviewGrid}>
                {adminTeamMembers.map((member) => {
                  const isUpdating =
                    String(adminTeamMemberUpdatingId || "") ===
                    String(member.teamMemberId || "");

                  return (
                    <article
                      key={member.teamMemberId}
                      style={playerHubStyles.adminReviewProfileCard}
                    >
                      <div style={playerHubStyles.profileMeta}>
                        <strong style={playerHubStyles.previewTitle}>
                          {member.clubTeamName || "Team"}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          Captain: {member.captainUsername || "Unknown"}
                        </span>
                        <span style={playerHubStyles.previewSubtitle}>
                          Player:{" "}
                          {member.playerDisplayName ||
                            member.playerUsername ||
                            "Unknown"}
                        </span>
                        <span style={playerHubStyles.previewSubtitle}>
                          {member.confirmedAt
                            ? new Date(member.confirmedAt).toLocaleDateString()
                            : "No confirmed date"}
                        </span>
                      </div>
                      <div style={playerHubStyles.chipRow}>
                        <span style={playerHubStyles.chip}>
                          {member.memberStatus === "ACTIVE"
                            ? "Active"
                            : member.memberStatus === "REMOVED"
                              ? "Removed"
                              : "Archived"}
                        </span>
                        {member.memberStatus === "ACTIVE" ? (
                          <button
                            type="button"
                            style={{
                              ...playerHubStyles.adminActionButton,
                              ...playerHubStyles.adminDangerButton,
                              ...(isUpdating
                                ? playerHubStyles.adminDisabledButton
                                : {}),
                            }}
                            disabled={isUpdating}
                            onClick={() => handleAdminArchiveTeamMember(member)}
                          >
                            {isUpdating ? "Archiving..." : "Archive"}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : adminTeamMembersStatus === "loading" ? null : (
              <div style={playerHubStyles.emptyPreview}>
                No team members yet.
              </div>
            )}
          </div>
        </details>
      ) : null}

      {showHubAdmin && isAdmin && openAdminPanel === "membership" ? (
        <details open style={playerHubStyles.adminAccordion}>
          <summary style={playerHubStyles.adminAccordionSummary}>
            <span>Team membership requests</span>
            <span style={playerHubStyles.chip}>
              {adminTeamMembershipRequests.length}
            </span>
          </summary>
          <div style={playerHubStyles.adminAccordionBody}>
            <div style={playerHubStyles.adminReviewTop}>
              <div style={playerHubStyles.profileMeta}>
                <div style={playerHubStyles.sectionTitle}>
                  Team membership requests
                </div>
                <div style={playerHubStyles.cardText}>
                  Players asking captains to confirm club/team membership.
                </div>
              </div>
              <button
                type="button"
                style={playerHubStyles.adminActionButton}
                onClick={loadAdminTeamMembershipRequests}
                disabled={adminTeamMembershipStatus === "loading"}
              >
                {adminTeamMembershipStatus === "loading"
                  ? "Loading..."
                  : "Refresh"}
              </button>
            </div>

            {adminTeamMembershipRequests.length ? (
              <div style={playerHubStyles.adminReviewGrid}>
                {adminTeamMembershipRequests.map((request) => (
                  <article
                    key={request.requestId}
                    style={playerHubStyles.adminReviewProfileCard}
                  >
                    <div style={playerHubStyles.profileMeta}>
                      <strong style={playerHubStyles.previewTitle}>
                        {request.clubTeamName || "Team"}
                      </strong>
                      <span style={playerHubStyles.previewSubtitle}>
                        Player:{" "}
                        {request.playerDisplayName ||
                          request.playerUsername ||
                          "Unknown"}
                      </span>
                      <span style={playerHubStyles.previewSubtitle}>
                        Requested:{" "}
                        {request.requestedAt
                          ? new Date(request.requestedAt).toLocaleDateString()
                          : "No date"}
                      </span>
                      <span style={playerHubStyles.previewSubtitle}>
                        Reviewed:{" "}
                        {request.reviewedBy
                          ? `${request.reviewedBy} / ${
                              request.reviewedAt
                                ? new Date(
                                    request.reviewedAt
                                  ).toLocaleDateString()
                                : "No date"
                            }`
                          : "Not reviewed"}
                      </span>
                    </div>
                    <div style={playerHubStyles.chipRow}>
                      <span
                        style={{
                          ...playerHubStyles.accessStatusChip,
                          ...accessRequestStatusStyle(request.status),
                        }}
                      >
                        {formatTeamMembershipStatus(request.status)}
                      </span>
                      {request.alreadyConfirmed ? (
                        <span style={playerHubStyles.chip}>Team member</span>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : adminTeamMembershipStatus === "loading" ? null : (
              <div style={playerHubStyles.emptyPreview}>
                No team membership requests yet.
              </div>
            )}
          </div>
        </details>
      ) : null}

      {showHubAdmin && canReviewRosterDrafts && openAdminPanel === "rosters" ? (
        <details open style={playerHubStyles.adminAccordion}>
          <summary style={playerHubStyles.adminAccordionSummary}>
            <span>Roster review</span>
            <span style={playerHubStyles.chip}>
              {adminTournamentRosterDrafts.length}
            </span>
          </summary>
          <div style={playerHubStyles.adminAccordionBody}>
            <div style={playerHubStyles.adminReviewTop}>
              <div style={playerHubStyles.profileMeta}>
                <div style={playerHubStyles.sectionTitle}>
                  Review queue
                </div>
                <div style={playerHubStyles.cardText}>
                  Submitted and approved drafts.
                </div>
              </div>
              <button
                type="button"
                style={playerHubStyles.adminActionButton}
                onClick={loadAdminRosterDrafts}
                disabled={adminTournamentRosterStatus === "loading"}
              >
                {adminTournamentRosterStatus === "loading"
                  ? "Loading..."
                  : "Refresh"}
              </button>
            </div>

            {adminRosterReviewMessage ? (
              <div style={playerHubStyles.profileMessage}>
                {adminRosterReviewMessage}
              </div>
            ) : null}

            {adminTournamentRosterDrafts.length ? (
              <div style={playerHubStyles.adminReviewGrid}>
                {adminTournamentRosterDrafts.map((roster) => {
                  const status = normalizeRosterStatus(roster.rosterStatus);
                  const noteValue = adminRosterReviewNotes[roster.rosterId] || "";
                  const isReviewUpdating = adminRosterReviewUpdatingId.startsWith(
                    `${roster.rosterId}:`
                  );
                  const rosterLock = rosterLockForSource(roster);
                  const duplicateWarnings =
                    adminRosterDuplicateWarningsByRosterId[roster.rosterId] || [];
                  const changedAfterDeadline = rosterChangedAfterDeadline(
                    roster,
                    rosterLock
                  );
                  return (
                    <article
                      key={roster.rosterId}
                      style={playerHubStyles.adminReviewProfileCard}
                    >
                      <div style={playerHubStyles.profileMeta}>
                        <strong style={playerHubStyles.previewTitle}>
                          {roster.tournamentName || "Tournament"}
                        </strong>
                        <span style={playerHubStyles.previewSubtitle}>
                          {roster.clubTeamName || "Team"}
                          {roster.className ? ` / ${roster.className}` : ""}
                          {!isNeutralPlanLabel(roster.squadLabel)
                            ? ` / Squad ${roster.squadLabel}`
                            : ""}
                        </span>
                        <span style={playerHubStyles.previewSubtitle}>
                          Captain: {roster.captainUsername || "Unknown"}
                        </span>
                        <span style={playerHubStyles.previewSubtitle}>
                          Players: {roster.playerCount || 0}
                          {roster.submittedAt
                            ? ` / submitted ${new Date(
                                roster.submittedAt
                              ).toLocaleDateString()}`
                            : ""}
                        </span>
                        {roster.adminNote ? (
                          <span style={playerHubStyles.previewSubtitle}>
                            Note: {roster.adminNote}
                          </span>
                        ) : null}
                        <span style={playerHubStyles.previewSubtitle}>
                          Public cannot see player names.
                        </span>
                      </div>
                      <div style={playerHubStyles.chipRow}>
                        <span
                          style={{
                            ...playerHubStyles.accessStatusChip,
                            ...rosterStatusStyle(status),
                          }}
                        >
                          {formatRosterStatus(status)}
                        </span>
                        {rosterLock.afterDeadline ? (
                          <span style={playerHubStyles.chip}>After deadline</span>
                        ) : null}
                        {changedAfterDeadline ? (
                          <span style={playerHubStyles.chip}>Late change</span>
                        ) : null}
                        {duplicateWarnings.length ? (
                          <span style={playerHubStyles.chip}>
                            Duplicate warning
                          </span>
                        ) : null}
                        {rosterLockLabel(rosterLock) ? (
                          <span style={playerHubStyles.chip}>
                            {rosterLockLabel(rosterLock)}
                          </span>
                        ) : null}
                      </div>
                      <div style={playerHubStyles.chipRow}>
                        {roster.submittedAt ? (
                          <span style={playerHubStyles.chip}>
                            Submitted: {new Date(roster.submittedAt).toLocaleString()}
                          </span>
                        ) : null}
                        {roster.reviewedAt ? (
                          <span style={playerHubStyles.chip}>
                            Reviewed: {new Date(roster.reviewedAt).toLocaleString()}
                          </span>
                        ) : null}
                        {roster.lockedAt ? (
                          <span style={playerHubStyles.chip}>
                            Locked: {new Date(roster.lockedAt).toLocaleString()}
                          </span>
                        ) : null}
                        {roster.lockedBy || roster.reviewedBy || roster.submittedBy ? (
                          <span style={playerHubStyles.chip}>
                            Changed by:{" "}
                            {roster.lockedBy || roster.reviewedBy || roster.submittedBy}
                          </span>
                        ) : null}
                        {roster.lockReason ? (
                          <span style={playerHubStyles.chip}>
                            Reason: {roster.lockReason}
                          </span>
                        ) : null}
                      </div>
                      {duplicateWarnings.length ? (
                        <div style={playerHubStyles.profileMessage}>
                          {duplicateWarnings.join(" ")}
                        </div>
                      ) : null}
                      <details>
                        <summary style={playerHubStyles.adminActionButton}>
                          View
                        </summary>
                        <div style={playerHubStyles.squadPendingList}>
                          {Array.isArray(roster.players) && roster.players.length ? (
                            roster.players.map((player) => (
                              <div
                                key={player.rosterPlayerId || player.playerUsername}
                                style={playerHubStyles.squadPlayerRow}
                              >
                                <div style={playerHubStyles.squadPlayerInfo}>
                                  <strong style={playerHubStyles.squadPlayerName}>
                                    {player.playerDisplayName ||
                                      player.playerUsername ||
                                      "Player"}
                                  </strong>
                                  <span style={playerHubStyles.squadPlayerMeta}>
                                    {[
                                      player.playerCountry || "No country",
                                      squadDisplayName(
                                        player.assignedSquad,
                                        roster
                                      ),
                                    ].join(" / ")}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={playerHubStyles.squadEmptyRow}>
                              No players
                            </div>
                          )}
                        </div>
                      </details>
                      {status === "SUBMITTED" || status === "CHANGE_REQUESTED" ? (
                        <div style={playerHubStyles.profileMeta}>
                          <textarea
                            value={noteValue}
                            onChange={(event) =>
                              setAdminRosterReviewNotes((current) => ({
                                ...current,
                                [roster.rosterId]: event.target.value,
                              }))
                            }
                            placeholder="Admin note optional"
                            style={playerHubStyles.profileTextareaCompact}
                            rows={2}
                          />
                          <div style={playerHubStyles.profileActions}>
                            <button
                              type="button"
                              style={playerHubStyles.adminActionButton}
                              disabled={isReviewUpdating}
                              onClick={() =>
                                handleReviewRosterDraft(roster, "APPROVED")
                              }
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              style={{
                                ...playerHubStyles.adminActionButton,
                                ...playerHubStyles.adminDangerButton,
                              }}
                              disabled={isReviewUpdating}
                              onClick={() =>
                                handleReviewRosterDraft(roster, "REJECTED")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {status === "APPROVED" ? (
                        <div style={playerHubStyles.chipRow}>
                          <span style={playerHubStyles.chip}>
                            Captain can lock this roster.
                          </span>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : adminTournamentRosterStatus === "loading" ? null : (
              <div style={playerHubStyles.emptyPreview}>
                No roster drafts yet.
              </div>
            )}
          </div>
        </details>
      ) : null}

      {pendingDeactivateProfile ? (
        <div
          style={playerHubStyles.confirmOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-player-title"
        >
          <div style={playerHubStyles.confirmDialog}>
            <div style={playerHubStyles.profileMeta}>
              <strong
                id="deactivate-player-title"
                style={playerHubStyles.cardTitle}
              >
                Deactivate this player account?
              </strong>
              <div style={playerHubStyles.cardText}>
                The player will not be able to use the app until reactivated.
              </div>
              <div style={playerHubStyles.detail}>
                <span style={playerHubStyles.detailLabel}>Player</span>
                <span style={playerHubStyles.detailValue}>
                  {adminProfileValue(
                    pendingDeactivateProfile.displayName,
                    pendingDeactivateProfile.email ||
                      pendingDeactivateProfile.username ||
                      "Player"
                  )}
                </span>
              </div>
            </div>
            <div style={playerHubStyles.confirmActions}>
              <button
                type="button"
                style={playerHubStyles.adminActionButton}
                onClick={() => setPendingDeactivateProfile(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  ...playerHubStyles.adminActionButton,
                  ...playerHubStyles.adminDangerButton,
                }}
                onClick={confirmDeactivatePlayerAccount}
              >
                Deactivate account
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
