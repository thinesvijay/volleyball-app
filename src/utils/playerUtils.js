export function normalizeTeamName(index, existingName, language = "en") {
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

export function normalizeTeams(rawTeams, language = "en") {
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


export function getSkillOptions(scale) {
  const parsedScale = Number(scale) || 5;
  const maxScale = Math.max(1, parsedScale);
  return Array.from({ length: maxScale }, (_, index) => index + 1);
}

export function getSkillStyle(skill, skillView, skillScale) {
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


export function displayPlayerName(player) {
  const club = String(player?.club || "").trim();
  const name = String(player?.name || "").trim();
  if (!club) return name;
  return `${club} ${name}`;
}

