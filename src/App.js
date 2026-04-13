import { useCallback, useEffect, useMemo, useState } from "react";

const API =
  "https://script.google.com/macros/s/AKfycbx9FWReNsr6vJam6b02OCf96K482opSh_SPZVSeBqoTs65M7S2E1ZGZXt9qGUMzpE2dDw/exec";

const ROUND_CACHE_KEY = "volleyball-current-round";
const ROUND_SAVE_KEY = "volleyball-saved-round";
const AUTH_STORAGE_KEY = "volleyball-auth";
const SKILL_VIEW_KEY = "volleyball-skill-view";
const SKILL_SCALE_KEY = "volleyball-skill-scale";
const TEAM_SKILL_VISIBILITY_KEY = "volleyball-team-skill-visibility";
const MATCH_METHOD_KEY = "volleyball-match-method";
const CURRENT_ROUND_TTL_MS = 60 * 60 * 1000;
const SAVED_ROUND_TTL_MS = 6 * 60 * 60 * 1000;
const SKILL_SCALE_OPTIONS = [3, 5];
const TRAINER_COPY_OPTIONS = [
  { value: "blank", label: "Blank sheet" },
  { value: "main", label: "Copy players from main sheet" },
  { value: "trainer", label: "Copy players from existing trainer" },
];
const MATCH_METHOD_OPTIONS = [
  { value: "balanced", label: "Pattern" },
  { value: "shuffle", label: "Shuffle" },
];

function normalizeTeamName(index, existingName) {
  if (existingName && String(existingName).trim()) return existingName;
  return `Team ${String.fromCharCode(65 + index)}`;
}

function normalizeTeams(rawTeams) {
  if (!Array.isArray(rawTeams)) return [];

  return rawTeams.map((team, index) => ({
    ...team,
    name: normalizeTeamName(index, team?.name),
    players: Array.isArray(team?.players)
      ? team.players.map((player) => ({
          ...player,
          skill: Number(player.skill) || 1,
          locked: Boolean(player.locked),
          cannot: Array.isArray(player.cannot) ? player.cannot : [],
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

function readStorageWithTtl(key, ttlMs) {
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
      teams: normalizeTeams(parsed.teams),
      teamCount: Number(parsed.teamCount) || 2,
    };
  } catch (error) {
    console.error("Kunne ikke lese lagring:", error);
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

  const teamStats = {};
  teamNames.forEach((team) => {
    teamStats[team] = {
      courts: {},
      left: 0,
      right: 0,
    };
  });

  function courtCountForTeam(team, court) {
    return teamStats[team]?.courts?.[court] || 0;
  }

  function scoreAssignment(match, court, orientation) {
    const leftTeam = orientation === 0 ? match.team1 : match.team2;
    const rightTeam = orientation === 0 ? match.team2 : match.team1;

    let score = 0;

    score += courtCountForTeam(leftTeam, court) * 10;
    score += courtCountForTeam(rightTeam, court) * 10;

    score += teamStats[leftTeam].left * 3;
    score += teamStats[rightTeam].right * 3;

    if (teamStats[leftTeam].left > teamStats[leftTeam].right) {
      score += 2;
    }
    if (teamStats[rightTeam].right > teamStats[rightTeam].left) {
      score += 2;
    }

    return score;
  }

  function applyAssignment(match, court, orientation) {
    const leftTeam = orientation === 0 ? match.team1 : match.team2;
    const rightTeam = orientation === 0 ? match.team2 : match.team1;

    teamStats[leftTeam].courts[court] =
      (teamStats[leftTeam].courts[court] || 0) + 1;
    teamStats[rightTeam].courts[court] =
      (teamStats[rightTeam].courts[court] || 0) + 1;

    teamStats[leftTeam].left += 1;
    teamStats[rightTeam].right += 1;

    return {
      court,
      leftTeam,
      rightTeam,
      originalTeam1: match.team1,
      originalTeam2: match.team2,
    };
  }

  return baseRounds.map((round) => {
    const shuffledRound = shuffleArray(round);
    const availableCourts = Array.from(
      { length: Math.min(usableCourts, shuffledRound.length) },
      (_, i) => i + 1
    );

    const roundMatches = [];

    shuffledRound.forEach((match) => {
      let best = null;

      availableCourts.forEach((court) => {
        [0, 1].forEach((orientation) => {
          const score = scoreAssignment(match, court, orientation);

          if (!best || score < best.score) {
            best = { court, orientation, score };
          }
        });
      });

      if (best) {
        roundMatches.push(applyAssignment(match, best.court, best.orientation));
      }
    });

    roundMatches.sort((a, b) => a.court - b.court);
    return roundMatches;
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

export default function App() {
  const [players, setPlayers] = useState([]);
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
        return;
      }

      try {
        const queryString = buildQueryString({
          action: "getPlayers",
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
          return;
        }

        if (data?.success === false) {
          setPlayers([]);
          return;
        }

        setPlayers([]);
      } catch (error) {
        console.error("Kunne ikke hente spillere:", error);
        setPlayers([]);
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
      console.error("Kunne ikke hente trainer users:", error);
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
        console.error("Kunne ikke lagre brukerinnstillinger:", error);
      }
    },
    [auth.loggedIn, auth.password, auth.username]
  );

  async function handleLogin() {
    const username = loginUsername.trim();
    const password = loginPassword.trim();

    if (!username || !password) {
      setLoginMessage("Skriv inn brukernavn og passord.");
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
        setLoginMessage(data?.message || "Login failed.");
        setPlayers([]);
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
      setLoginMessage("Login ok.");
      setTrainerActionMessage("");
      setCreateTrainerMessage("");
      setCreatedTrainerInfo(null);

      await loadPlayers({
        username,
        password,
      });
    } catch (error) {
      console.error("Kunne ikke logge inn:", error);
      setLoginMessage("Login failed.");
      setPlayers([]);
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
    clearRoundState();
  }

  async function createTrainerFromApp() {
    const newTrainerUsername = trainerUsername.trim();
    const newTrainerPassword = trainerPassword.trim();

    if (!newTrainerUsername || !newTrainerPassword) {
      setCreateTrainerMessage("Skriv inn username og password.");
      return;
    }

    if (
      trainerCopyMode === "trainer" &&
      !String(copyFromTrainerUsername || "").trim()
    ) {
      setCreateTrainerMessage("Velg en trainer å kopiere fra.");
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
        setCreateTrainerMessage(data?.message || "Kunne ikke opprette trener.");
        return;
      }

      setCreatedTrainerInfo(data.user || null);
      setCreateTrainerMessage("Trainer opprettet.");
      setTrainerUsername("");
      setTrainerPassword("");
      setTrainerSkillView("numbers");
      setTrainerSkillScale(5);
      setTrainerCopyMode("main");
      setCopyFromTrainerUsername("");
      setShowCreateTrainerForm(false);
      await loadTrainerUsers();
    } catch (error) {
      console.error("Kunne ikke opprette trener:", error);
      setCreateTrainerMessage("Kunne ikke opprette trener.");
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
        setTrainerActionMessage(data?.message || "Kunne ikke oppdatere trener.");
        return;
      }

      setTrainerActionMessage(
        active ? "Trainer activated." : "Trainer deactivated."
      );
      await loadTrainerUsers();
    } catch (error) {
      console.error("Kunne ikke oppdatere trenerstatus:", error);
      setTrainerActionMessage("Kunne ikke oppdatere trener.");
    }
  }

  async function resetTrainerPassword(targetUsername) {
    const newPassword = String(trainerPasswords[targetUsername] || "").trim();

    if (!newPassword) {
      setTrainerActionMessage("Skriv inn nytt passord først.");
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
        setTrainerActionMessage(data?.message || "Kunne ikke resette passord.");
        return;
      }

      setTrainerPasswords((prev) => ({
        ...prev,
        [targetUsername]: "",
      }));
      setTrainerActionMessage("Password reset ok.");
    } catch (error) {
      console.error("Kunne ikke resette passord:", error);
      setTrainerActionMessage("Kunne ikke resette passord.");
    }
  }

  async function archiveTrainer(targetUsername) {
    const confirmed = window.confirm(
      `Er du sikker på at du vil arkivere trainer "${targetUsername}"?`
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
        setTrainerActionMessage(data?.message || "Kunne ikke arkivere trainer.");
        return;
      }

      setTrainerActionMessage("Trainer archived.");
      await loadTrainerUsers();
    } catch (error) {
      console.error("Kunne ikke arkivere trainer:", error);
      setTrainerActionMessage("Kunne ikke arkivere trainer.");
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
        setTrainerActionMessage(
          data?.message || "Kunne ikke gjenopprette trainer."
        );
        return;
      }

      setTrainerActionMessage("Trainer restored.");
      await loadTrainerUsers();
    } catch (error) {
      console.error("Kunne ikke gjenopprette trainer:", error);
      setTrainerActionMessage("Kunne ikke gjenopprette trainer.");
    }
  }

  useEffect(() => {
    if (!auth.loggedIn) {
      setPlayers([]);
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
      CURRENT_ROUND_TTL_MS
    );
    const savedRound = readStorageWithTtl(savedRoundKey, SAVED_ROUND_TTL_MS);
    const restored = currentRound || savedRound;

    if (restored?.teams?.length) {
      setTeams(restored.teams);
      setTeamCount(restored.teamCount || 2);
      setActiveTab("teams");
      return;
    }

    setTeams([]);
    setActiveTab("players");
  }, [auth]);

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
      console.error("Kunne ikke lagre nåværende runde:", error);
    }
  }, [auth, teams, teamCount]);

  useEffect(() => {
    try {
      localStorage.setItem(SKILL_VIEW_KEY, skillView);
    } catch (error) {
      console.error("Kunne ikke lagre skill view:", error);
    }
  }, [skillView]);

  useEffect(() => {
    try {
      localStorage.setItem(SKILL_SCALE_KEY, String(skillScale));
    } catch (error) {
      console.error("Kunne ikke lagre skill scale:", error);
    }
  }, [skillScale]);

  useEffect(() => {
    try {
      localStorage.setItem(TEAM_SKILL_VISIBILITY_KEY, String(showSkillInTeams));
    } catch (error) {
      console.error("Kunne ikke lagre team skill visibility:", error);
    }
  }, [showSkillInTeams]);

  useEffect(() => {
    try {
      localStorage.setItem(MATCH_METHOD_KEY, matchMethod);
    } catch (error) {
      console.error("Kunne ikke lagre match method:", error);
    }
  }, [matchMethod]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } catch (error) {
      console.error("Kunne ikke lagre auth:", error);
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
      const normalized = normalizeTeams(data);

      setTeams(normalized);
      setMatchRoundIndex(0);
      setActiveTab("teams");
      setMatchMode(false);
      setMobileMoveSelection(null);
    } catch (error) {
      console.error("Kunne ikke generere lag:", error);
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
      const normalized = normalizeTeams(data);

      setTeams(normalized);
      setMatchRoundIndex(0);
      setMatchMode(false);
      setMobileMoveSelection(null);
    } catch (error) {
      console.error("Kunne ikke lage ny runde:", error);
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
      alert("Round saved for 6 hours on this device.");
    } catch (error) {
      console.error("Kunne ikke lagre round:", error);
      alert("Could not save round.");
    }
  }

  function clearStoredRounds() {
    localStorage.removeItem(getRoundStorageKey(ROUND_CACHE_KEY, auth));
    localStorage.removeItem(getRoundStorageKey(ROUND_SAVE_KEY, auth));
    setTeams([]);
    setSelected([]);
    setMobileMoveSelection(null);
    setActiveTab("players");
    alert("Saved round cleared on this device.");
  }

  async function addPlayer() {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;

    try {
      setSavingPlayer(true);

      await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "addPlayer",
          player: {
            name: trimmed,
            skill: Number(newPlayerSkill),
          },
          ...getAuthPayload(),
        }),
      });

      setNewPlayerName("");
      setNewPlayerSkill(1);
      setShowAddForm(false);
      await loadPlayers();
    } catch (error) {
      console.error("Kunne ikke legge til spiller:", error);
    } finally {
      setSavingPlayer(false);
    }
  }

  function openEditPlayer(player) {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditSkill(Number(player.skill) || 1);
  }

  function closeEditPlayer() {
    setEditingPlayer(null);
    setEditName("");
    setEditSkill(1);
  }

  async function savePlayerEdit() {
    if (!editingPlayer) return;

    const oldName = editingPlayer.name;
    const newName = editName.trim();
    const newSkill = Number(editSkill);

    if (!newName) return;

    try {
      setSavingPlayer(true);

      if (oldName !== newName) {
        await fetch(`${API}?_ts=${Date.now()}`, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            action: "updatePlayerName",
            oldName,
            newName,
            ...getAuthPayload(),
          }),
        });
      }

      await fetch(`${API}?_ts=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "saveSkills",
          players: [{ name: newName, skill: newSkill }],
          ...getAuthPayload(),
        }),
      });

      setPlayers((prev) =>
        prev.map((p) =>
          p.name === oldName ? { ...p, name: newName, skill: newSkill } : p
        )
      );

      setSelected((prev) =>
        prev.map((name) => (name === oldName ? newName : name))
      );

      setTeams((prevTeams) =>
        prevTeams.map((team) => ({
          ...team,
          players: (team.players || []).map((p) =>
            p.name === oldName ? { ...p, name: newName, skill: newSkill } : p
          ),
        }))
      );

      closeEditPlayer();
      await loadPlayers();
    } catch (error) {
      console.error("Kunne ikke lagre spiller:", error);
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

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  const teamsWithTotals = useMemo(() => {
    return teams.map((team, index) => ({
      ...team,
      name: normalizeTeamName(index, team.name),
      players: team.players || [],
      total: teamTotal(team),
    }));
  }, [teams]);

  const teamsGridColumns =
    isMobile ? "1fr" : teams.length <= 1 ? "1fr" : "1fr 1fr";

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

  return (
    <div style={styles.app}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Make Teams Pro</h1>
            <p style={styles.subtitle}>Thines Vijay ©</p>
          </div>
        </div>

        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <div>
              <div style={styles.authTitle}>
                {auth.loggedIn ? "Trainer Profile" : "Trainer Login"}
              </div>
              <div style={styles.authSubtitle}>
                {auth.loggedIn
                  ? `${auth.username} (${auth.role})`
                  : "Login required to view players"}
              </div>
            </div>

            {auth.loggedIn && (
              <button style={styles.secondaryButton} onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>

          {!auth.loggedIn && (
            <div style={styles.loginGrid}>
              <input
                style={styles.input}
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Username"
              />
              <input
                style={styles.input}
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
              />
              <button
                style={styles.primaryButton}
                onClick={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          )}

          {loginMessage && <div style={styles.loginMessage}>{loginMessage}</div>}
        </div>

        {auth.loggedIn && auth.role === "admin" && (
          <div style={styles.adminCard}>
            <div style={styles.authHeader}>
              <div>
                <div style={styles.authTitle}>Create Trainer</div>
                <div style={styles.authSubtitle}>
                  Lager ny trener og nytt Google Sheet automatisk
                </div>
              </div>

              <button
                style={styles.secondaryButton}
                onClick={() => setShowCreateTrainerForm((prev) => !prev)}
              >
                {showCreateTrainerForm ? "Close" : "New Trainer"}
              </button>
            </div>

            {showCreateTrainerForm && (
              <div style={styles.formCard}>
                <input
                  style={styles.input}
                  value={trainerUsername}
                  onChange={(e) => setTrainerUsername(e.target.value)}
                  placeholder="Trainer username"
                />

                <input
                  style={styles.input}
                  value={trainerPassword}
                  onChange={(e) => setTrainerPassword(e.target.value)}
                  placeholder="Trainer password"
                />

                <div style={styles.settingsRow}>
                  <div style={styles.settingsCard}>
                    <span style={styles.settingsLabel}>Skill View</span>
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
                        Numbers
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
                        Colors
                      </button>
                    </div>
                  </div>

                  <div style={styles.settingsCard}>
                    <span style={styles.settingsLabel}>Skill Scale</span>
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
                  <span style={styles.settingsLabel}>Copy players</span>
                  <div style={styles.copyOptionList}>
                    {TRAINER_COPY_OPTIONS.map((option) => (
                      <label key={option.value} style={styles.radioRow}>
                        <input
                          type="radio"
                          name="trainer-copy-mode"
                          checked={trainerCopyMode === option.value}
                          onChange={() => setTrainerCopyMode(option.value)}
                        />
                        <span>{option.label}</span>
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
                      <option value="">Select trainer</option>
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
                  {creatingTrainer ? "Creating..." : "Create Trainer"}
                </button>
              </div>
            )}

            {createTrainerMessage && (
              <div style={styles.loginMessage}>{createTrainerMessage}</div>
            )}

            {createdTrainerInfo && (
              <div style={styles.createdTrainerCard}>
                <div>
                  <strong>Username:</strong> {createdTrainerInfo.username}
                </div>
                <div>
                  <strong>Spreadsheet ID:</strong>{" "}
                  {createdTrainerInfo.spreadsheetId}
                </div>
                <div>
                  <strong>Copy mode:</strong> {createdTrainerInfo.copyMode}
                </div>
                <div style={styles.createdTrainerLinkWrap}>
                  <a
                    href={createdTrainerInfo.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    Open trainer sheet
                  </a>
                </div>
              </div>
            )}

            <div style={styles.trainerListCard}>
              <div style={styles.authTitle}>Trainer Users</div>
              <div style={styles.authSubtitle}>
                Admin kan aktivere, deaktivere, resette passord og arkivere
                trainers
              </div>

              {trainerActionMessage && (
                <div style={styles.loginMessage}>{trainerActionMessage}</div>
              )}

              <div style={styles.trainerUsersWrap}>
                {visibleTrainerUsers.length === 0 ? (
                  <div style={styles.emptyText}>Ingen aktive trainers ennå.</div>
                ) : (
                  visibleTrainerUsers.map((trainer) => (
                    <div key={trainer.username} style={styles.trainerUserRow}>
                      <div style={styles.trainerUserTop}>
                        <div>
                          <div style={styles.trainerUserName}>
                            {trainer.username}
                          </div>
                          <div style={styles.trainerUserMeta}>
                            {trainer.active ? "Active" : "Inactive"} •{" "}
                            {trainer.skillView} • 1-{trainer.skillScale}
                          </div>
                        </div>

                        <a
                          href={trainer.spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          Open sheet
                        </a>
                      </div>

                      <div style={styles.trainerActionsRow}>
                        <button
                          style={styles.secondaryButton}
                          onClick={() =>
                            updateTrainerStatus(trainer.username, !trainer.active)
                          }
                        >
                          {trainer.active ? "Deactivate" : "Activate"}
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
                          placeholder="New password"
                        />

                        <button
                          style={styles.secondaryButton}
                          onClick={() => resetTrainerPassword(trainer.username)}
                        >
                          Reset Password
                        </button>

                        <button
                          style={styles.archiveButton}
                          onClick={() => archiveTrainer(trainer.username)}
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={styles.trainerListCard}>
              <div style={styles.authTitle}>Archived Trainers</div>
              <div style={styles.authSubtitle}>
                Arkiverte trenere kan gjenopprettes senere
              </div>

              <div style={styles.trainerUsersWrap}>
                {archivedTrainerUsers.length === 0 ? (
                  <div style={styles.emptyText}>Ingen arkiverte trainers.</div>
                ) : (
                  archivedTrainerUsers.map((trainer) => (
                    <div key={trainer.username} style={styles.trainerUserRow}>
                      <div style={styles.trainerUserTop}>
                        <div>
                          <div style={styles.trainerUserName}>
                            {trainer.username}
                          </div>
                          <div style={styles.trainerUserMeta}>
                            Archived • {trainer.skillView} • 1-{trainer.skillScale}
                          </div>
                        </div>

                        <a
                          href={trainer.spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          Open sheet
                        </a>
                      </div>

                      <div style={styles.trainerActionsRow}>
                        <button
                          style={styles.primaryButton}
                          onClick={() => restoreTrainer(trainer.username)}
                        >
                          Restore
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
            Players
          </button>

          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "teams" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("teams")}
          >
            Teams
          </button>
        </div>

        {activeTab === "players" && (
          <div style={styles.section}>
            {!auth.loggedIn ? (
              <div style={styles.lockedCard}>
                Logg inn som admin eller trener for å se spillerlisten.
              </div>
            ) : (
              <>
                <div style={styles.toolbarTop}>
                  <div style={styles.teamCountCard}>
                    <span style={styles.teamCountLabel}>Number of Teams</span>

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
                        {loading ? "Generating..." : "Generate Teams"}
                      </button>
                    </div>
                  </div>

                  <div style={styles.selectedBadge}>
                    Selected: {selected.length} / {totalPlayers}
                  </div>
                </div>

                <div style={styles.settingsRow}>
                  <div style={styles.settingsCard}>
                    <span style={styles.settingsLabel}>Skill View</span>
                    <div style={styles.settingsToggleRow}>
                      <button
                        style={{
                          ...styles.smallToggleButton,
                          ...(skillView === "numbers"
                            ? styles.smallToggleButtonActive
                            : {}),
                        }}
                        onClick={() => setSkillView("numbers")}
                      >
                        Numbers
                      </button>
                      <button
                        style={{
                          ...styles.smallToggleButton,
                          ...(skillView === "colors"
                            ? styles.smallToggleButtonActive
                            : {}),
                        }}
                        onClick={() => setSkillView("colors")}
                      >
                        Colors
                      </button>
                    </div>
                  </div>

                  <div style={styles.settingsCard}>
                    <span style={styles.settingsLabel}>Skill Scale</span>
                    <div style={styles.settingsToggleRow}>
                      {SKILL_SCALE_OPTIONS.map((scale) => (
                        <button
                          key={scale}
                          style={{
                            ...styles.smallToggleButton,
                            ...(skillScale === scale
                              ? styles.smallToggleButtonActive
                              : {}),
                          }}
                          onClick={() => setSkillScale(scale)}
                        >
                          1-{scale}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={styles.actionRow}>
                  <button
                    style={styles.secondaryButton}
                    onClick={() => setShowAddForm((prev) => !prev)}
                  >
                    {showAddForm ? "Close" : "+ Add Player"}
                  </button>
                </div>

                {showAddForm && (
                  <div style={styles.formCard}>
                    <input
                      style={styles.input}
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Player name"
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
                      {savingPlayer ? "Saving..." : "Save Player"}
                    </button>
                  </div>
                )}

                <div style={styles.playersGrid}>
                  {sortedPlayers.map((p) => {
                    const isSelected = selected.includes(p.name);
                    const skillStyle = getSkillStyle(
                      p.skill,
                      skillView,
                      skillScale
                    );

                    return (
                      <button
                        key={p.name}
                        style={{
                          ...styles.playerCardCompact,
                          ...(isSelected ? styles.playerCardSelected : {}),
                        }}
                        onClick={() => togglePlayer(p.name)}
                      >
                        <div style={styles.playerCompactTop}>
                          <div style={styles.playerNameCompact}>{p.name}</div>
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
                          <span style={styles.checkTiny}>
                            {isSelected ? "Selected" : "Tap"}
                          </span>

                          <button
                            style={styles.editMiniButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPlayer(p);
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "teams" && (
          <div style={styles.section}>
            {!auth.loggedIn ? (
              <div style={styles.lockedCard}>
                Logg inn som admin eller trener for å bruke Teams.
              </div>
            ) : (
              <>
                <div style={styles.topTeamActions}>
                  <button
                    style={{
                      ...styles.primaryButton,
                      opacity: teams.length === 0 || loading ? 0.6 : 1,
                    }}
                    onClick={generateNewRound}
                    disabled={teams.length === 0 || loading}
                  >
                    {loading ? "Generating..." : "New Round"}
                  </button>

                  <button
                    style={{
                      ...styles.secondaryButton,
                      opacity: teams.length === 0 ? 0.6 : 1,
                    }}
                    onClick={saveRoundForSixHours}
                    disabled={teams.length === 0}
                  >
                    Save Round
                  </button>

                  <button
                    style={{
                      ...styles.secondaryButton,
                      opacity: teams.length >= 3 ? 1 : 0.6,
                    }}
                    onClick={() => {
                      setMatchMode((prev) => !prev);
                      setMatchRoundIndex(0);
                    }}
                    disabled={teams.length < 3}
                  >
                    {matchMode ? "Hide Match Mode" : "Match Mode"}
                  </button>

                  <button
                    style={styles.secondaryButton}
                    onClick={clearStoredRounds}
                  >
                    Clear Saved
                  </button>

                  {skillView === "numbers" && teams.length > 0 && (
                    <button
                      style={styles.secondaryButton}
                      onClick={() => setShowSkillInTeams((prev) => !prev)}
                    >
                      {showSkillInTeams ? "Hide Skill" : "Show Skill"}
                    </button>
                  )}

                  {isMobile && mobileMoveSelection && (
                    <button
                      style={styles.secondaryButton}
                      onClick={() => setMobileMoveSelection(null)}
                    >
                      Cancel Move
                    </button>
                  )}
                </div>

                {isMobile && teams.length > 0 && (
                  <div style={styles.mobileHintCard}>
                    {mobileMoveSelection
                      ? `Selected: ${mobileMoveSelection.name}. Tap "Move Here" on a team.`
                      : "iPhone/Safari move mode: tap Select Move on a player, then tap Move Here on the target team."}
                  </div>
                )}

                {matchMode && teams.length >= 3 && (
                  <div style={styles.matchModeCard}>
                    <div style={styles.matchModeHeader}>
                      <div>
                        <div style={styles.matchModeTitle}>Match Mode</div>
                        <div style={styles.matchModeSubtitle}>
                          Round {activeScheduleRounds.length ? matchRoundIndex + 1 : 0} of{" "}
                          {activeScheduleRounds.length}
                        </div>
                      </div>

                      <div style={styles.matchControlsWrap}>
                        <div style={styles.courtWrap}>
                          <span style={styles.courtLabel}>Method</span>
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
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.courtWrap}>
                          <span style={styles.courtLabel}>Courts</span>
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
                        Prev Round
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
                        Next Round
                      </button>
                    </div>

                    <div style={styles.matchGrid}>
                      {currentMatches.length > 0 ? (
                        currentMatches.map((match, index) => (
                          <div
                            key={`${match.leftTeam}-${match.rightTeam}-${match.court}-${index}`}
                            style={styles.matchCard}
                          >
                            <div style={styles.matchCourt}>
                              Court {match.court}
                            </div>
                            <div style={styles.matchTeams}>
                              <span>{match.leftTeam}</span>
                              <span style={styles.vsText}>vs</span>
                              <span>{match.rightTeam}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={styles.noMatchesText}>
                          No matches available.
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
                              Move Here
                            </button>
                          )}
                        </div>

                        <div style={styles.teamPointsBadge}>{team.total} pt</div>
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
                                opacity:
                                  dragging &&
                                  dragging.fromTeamIndex === teamIndex &&
                                  dragging.playerIndex === playerIndex
                                    ? 0.45
                                    : 1,
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
                                  {player.name}
                                </div>
                              </div>

                              <div style={styles.teamPlayerRight}>
                                {isMobile && (
                                  <button
                                    style={{
                                      ...styles.selectMoveButton,
                                      ...(isSelectedForMove
                                        ? styles.selectMoveButtonActive
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
                                  >
                                    {isSelectedForMove
                                      ? "Selected"
                                      : "Select Move"}
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

                                <button
                                  style={{
                                    ...styles.inlineActionButton,
                                    ...(player.locked
                                      ? styles.lockButtonActive
                                      : {}),
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLock(teamIndex, playerIndex);
                                  }}
                                >
                                  {player.locked ? "Unlock" : "Lock"}
                                </button>
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
      </div>

      {editingPlayer && (
        <div style={styles.modalOverlay} onClick={closeEditPlayer}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Edit Player</h3>

            <input
              style={styles.input}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Player name"
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
                Cancel
              </button>
              <button
                style={styles.primaryButton}
                onClick={savePlayerEdit}
                disabled={savingPlayer}
              >
                {savingPlayer ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "12px",
    fontFamily: "Arial, sans-serif",
  },

  shell: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "12px",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    margin: "4px 0 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  authCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "grid",
    gap: "10px",
    marginBottom: "12px",
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
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "12px",
  },

  tabButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px",
    fontSize: "14px",
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
    gap: "12px",
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
    gap: "8px",
    alignItems: "stretch",
  },

  teamCountCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "10px 12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },

  teamCountLabel: {
    display: "block",
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "6px",
  },

  teamCountRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
  },

  teamCountInline: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  countButton: {
    width: "34px",
    height: "34px",
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
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
  },

  selectedBadge: {
    background: "#fff",
    borderRadius: "14px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },

  settingsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
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

  settingsLabel: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "600",
  },

  settingsToggleRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  smallToggleButton: {
    border: "none",
    borderRadius: "10px",
    padding: "8px 10px",
    background: "#e5e7eb",
    color: "#111827",
    fontSize: "12px",
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
    gap: "8px",
  },

  topTeamActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
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

  secondaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 14px",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "600",
    cursor: "pointer",
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
    gap: "8px",
  },

  playerCardCompact: {
    border: "none",
    borderRadius: "12px",
    background: "#fff",
    padding: "8px 10px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    minHeight: "62px",
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
    marginBottom: "6px",
  },

  playerNameCompact: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: 1.2,
    wordBreak: "break-word",
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
    justifyContent: "space-between",
    alignItems: "center",
    gap: "6px",
  },

  checkTiny: {
    fontSize: "11px",
    color: "#6b7280",
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

  generateButtonInline: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#16a34a",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  mobileHintCard: {
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fdba74",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "12px",
    fontWeight: "600",
  },

  matchModeCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "grid",
    gap: "12px",
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
    gridTemplateColumns: "1fr 1fr",
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
    padding: "10px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    minWidth: 0,
  },

  teamHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },

  teamTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
  },

  teamPointsBadge: {
    borderRadius: "999px",
    background: "#111827",
    color: "#fff",
    padding: "4px 8px",
    fontSize: "12px",
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
    gap: "6px",
  },

  teamPlayerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "6px 0",
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
    lineHeight: 1.2,
    wordBreak: "break-word",
  },

  teamPlayerRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "6px",
    flexWrap: "wrap",
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

  selectMoveButton: {
    border: "none",
    borderRadius: "8px",
    padding: "5px 8px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  selectMoveButtonActive: {
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
};