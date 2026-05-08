import { TOURNAMENT_GROUP_COLORS } from "../constants/publicThemes";

export function getTournamentGroupCode(index) {
  return String.fromCharCode(65 + index);
}

export function getTournamentGroupColor(groupCodeOrIndex) {
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

export function getTournamentSourceGroupCode(source) {
  const match = String(source || "").trim().match(/^([A-Z])\d+$/);
  return match ? match[1] : "";
}

export function buildGroupPositionSource(groupCode, position) {
  return `${groupCode}${position}`;
}

