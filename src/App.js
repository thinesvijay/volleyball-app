import { useEffect, useMemo, useState } from "react";

const API =
  "https://script.google.com/macros/s/AKfycbx9FWReNsr6vJam6b02OCf96K482opSh_SPZVSeBqoTs65M7S2E1ZGZXt9qGUMzpE2dDw/exec";

export default function App() {
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamCount, setTeamCount] = useState(2);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("players");
  const [advancedView, setAdvancedView] = useState(false);

  const [dragging, setDragging] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSkill, setNewPlayerSkill] = useState(1);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSkill, setEditSkill] = useState(1);
  const [savingPlayer, setSavingPlayer] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function loadPlayers() {
    try {
      const res = await fetch(`${API}?action=getPlayers`);
      const data = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Kunne ikke hente spillere:", error);
    }
  }

  function togglePlayer(name) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  async function generateTeams() {
    try {
      setLoading(true);

      const selectedPlayers = players.filter((p) => selected.includes(p.name));

      const res = await fetch(API, {
        method: "POST",
        body: JSON.stringify({
          action: "generate",
          players: selectedPlayers,
          previousTeams: teams,
          teamCount,
        }),
      });

      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
      setActiveTab("teams");
      setAdvancedView(false);
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
        }))
      );

      if (currentPlayers.length < 2) return;

      setLoading(true);

      const res = await fetch(API, {
        method: "POST",
        body: JSON.stringify({
          action: "generate",
          players: currentPlayers,
          previousTeams: [],
          teamCount,
        }),
      });

      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
      setAdvancedView(false);
    } catch (error) {
      console.error("Kunne ikke lage ny runde:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addPlayer() {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;

    try {
      setSavingPlayer(true);

      await fetch(API, {
        method: "POST",
        body: JSON.stringify({
          action: "addPlayer",
          player: {
            name: trimmed,
            skill: Number(newPlayerSkill),
          },
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
        await fetch(API, {
          method: "POST",
          body: JSON.stringify({
            action: "updatePlayerName",
            oldName,
            newName,
          }),
        });
      }

      await fetch(API, {
        method: "POST",
        body: JSON.stringify({
          action: "saveSkills",
          players: [{ name: newName, skill: newSkill }],
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

  function movePlayer(fromTeamIndex, playerIndex, toTeamIndex) {
    if (fromTeamIndex === toTeamIndex) return;

    setTeams((prevTeams) => {
      const fromTeam = prevTeams[fromTeamIndex];
      const player = fromTeam?.players?.[playerIndex];

      if (!player || player.locked) return prevTeams;

      const nextTeams = prevTeams.map((team) => ({
        ...team,
        players: [...(team.players || [])],
      }));

      nextTeams[fromTeamIndex].players.splice(playerIndex, 1);
      nextTeams[toTeamIndex].players.push(player);

      return nextTeams;
    });
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

  function handleDragStart(teamIndex, playerIndex) {
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

  const teamsForSimpleView = useMemo(() => {
    return teams.map((team, index) => ({
      ...team,
      name: team.name || `Team ${index + 1}`,
      players: team.players || [],
      total: teamTotal(team),
    }));
  }, [teams]);

  const advancedGridColumns = isMobile ? "1fr" : teams.length <= 1 ? "1fr" : "1fr 1fr";

  return (
    <div style={styles.app}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Make Teams Pro</h1>
            <p style={styles.subtitle}>Thines Vijay ©</p>
          </div>
        </div>

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
            <div style={styles.toolbarTop}>
              <div style={styles.teamCountCard}>
                <span style={styles.teamCountLabel}>Number of Teams</span>

                <div style={styles.teamCountInline}>
                  <button
                    style={styles.countButton}
                    onClick={() => setTeamCount((prev) => Math.max(2, prev - 1))}
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
              </div>

              <div style={styles.selectedBadge}>Selected: {selected.length}</div>
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
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
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
                      <div style={styles.skillMini}>{p.skill}</div>
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

            <button
              style={{
                ...styles.generateButton,
                opacity: selected.length < 2 || loading ? 0.6 : 1,
              }}
              onClick={generateTeams}
              disabled={selected.length < 2 || loading}
            >
              {loading ? "Generating..." : "Generate Teams"}
            </button>
          </div>
        )}

        {activeTab === "teams" && (
          <div style={styles.section}>
            <div style={styles.viewSwitchRow}>
              <button
                style={{
                  ...styles.switchButton,
                  ...(!advancedView ? styles.switchButtonActive : {}),
                }}
                onClick={() => setAdvancedView(false)}
              >
                Simple View
              </button>

              <button
                style={{
                  ...styles.switchButton,
                  ...(advancedView ? styles.switchButtonActive : {}),
                }}
                onClick={() => setAdvancedView(true)}
              >
                Advanced View
              </button>
            </div>

            {!advancedView && (
              <>
                <div style={styles.simpleActionRow}>
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
                </div>

                <div style={styles.simpleTeamsGrid}>
                  {teamsForSimpleView.map((team, index) => (
                    <div key={index} style={styles.simpleTeamCard}>
                      <div style={styles.simpleTeamHeaderRow}>
                        <div style={styles.simpleTeamTitle}>{team.name}</div>
                        <div style={styles.teamPointsBadge}>{team.total} pt</div>
                      </div>

                      <div style={styles.simpleTeamPlayers}>
                        {team.players.map((player, pIndex) => (
                          <div key={pIndex} style={styles.simplePlayerRow}>
                            <span style={styles.simplePlayerName}>{player.name}</span>
                            <span style={styles.simplePlayerSkill}>{player.skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {advancedView && (
              <div
                style={{
                  ...styles.advancedTeamsWrap,
                  gridTemplateColumns: advancedGridColumns,
                }}
              >
                {teams.map((team, teamIndex) => (
                  <div
                    key={teamIndex}
                    style={styles.advancedTeamCard}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
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
                    <div style={styles.advancedTeamHeader}>
                      <div style={styles.advancedTeamTitle}>
                        {team.name || `Team ${teamIndex + 1}`}
                      </div>
                      <div style={styles.teamPointsBadge}>
                        {teamTotal(team)} pt
                      </div>
                    </div>

                    <div style={styles.advancedPlayersList}>
                      {(team.players || []).map((player, playerIndex) => (
                        <div
                          key={playerIndex}
                          style={{
                            ...styles.advancedPlayerRowCompact,
                            opacity:
                              dragging &&
                              dragging.fromTeamIndex === teamIndex &&
                              dragging.playerIndex === playerIndex
                                ? 0.45
                                : 1,
                          }}
                          draggable={!player.locked}
                          onDragStart={() => handleDragStart(teamIndex, playerIndex)}
                          onDragEnd={resetDragState}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
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
                          <div style={styles.advancedRowLeft}>
                            <div style={styles.advancedPlayerNameCompact}>
                              {player.name}
                            </div>
                          </div>

                          <div style={styles.advancedRowRight}>
                            <span style={styles.skillMini}>{player.skill}</span>

                            <button
                              style={{
                                ...styles.inlineActionButton,
                                ...(player.locked ? styles.lockButtonActive : {}),
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLock(teamIndex, playerIndex);
                              }}
                            >
                              {player.locked ? "Unlock" : "Lock"}
                            </button>

                            {teams.length > 1 && (
                              <select
                                style={styles.inlineMoveSelect}
                                value=""
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const toTeamIndex = Number(e.target.value);
                                  if (!Number.isNaN(toTeamIndex)) {
                                    movePlayer(teamIndex, playerIndex, toTeamIndex);
                                  }
                                }}
                              >
                                <option value="">Move</option>
                                {teams.map((_, idx) =>
                                  idx !== teamIndex ? (
                                    <option key={idx} value={idx}>
                                      Team {idx + 1}
                                    </option>
                                  ) : null
                                )}
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
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

  actionRow: {
    display: "flex",
    gap: "8px",
  },

  simpleActionRow: {
    display: "flex",
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
    background: "#111827",
    color: "#fff",
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

  generateButton: {
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    background: "#16a34a",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  viewSwitchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  switchButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "600",
    cursor: "pointer",
  },

  switchButtonActive: {
    background: "#111827",
    color: "#fff",
  },

  simpleTeamsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  simpleTeamCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "10px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },

  simpleTeamHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },

  simpleTeamTitle: {
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

  simpleTeamPlayers: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  simplePlayerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "6px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "13px",
  },

  simplePlayerName: {
    color: "#111827",
    fontWeight: "600",
    wordBreak: "break-word",
  },

  simplePlayerSkill: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#6b7280",
  },

  advancedTeamsWrap: {
    display: "grid",
    gap: "10px",
  },

  advancedTeamCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "10px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    minWidth: 0,
  },

  advancedTeamHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },

  advancedTeamTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
  },

  advancedPlayersList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  advancedPlayerRowCompact: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "6px 0",
    borderBottom: "1px solid #eef2f7",
    cursor: "grab",
  },

  advancedRowLeft: {
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
  },

  advancedPlayerNameCompact: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
    wordBreak: "normal",
    overflowWrap: "break-word",
    whiteSpace: "normal",
    lineHeight: 1.2,
  },

  advancedRowRight: {
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

  lockButtonActive: {
    background: "#111827",
    color: "#fff",
  },

  inlineMoveSelect: {
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    padding: "5px 7px",
    fontSize: "11px",
    background: "#fff",
    maxWidth: "100%",
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