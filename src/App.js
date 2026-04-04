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
  const [dragOverTeam, setDragOverTeam] = useState(null);
  const [dragOverPlayer, setDragOverPlayer] = useState(null);

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

  async function loadPlayers() {
    try {
      const res = await fetch(`${API}?action=getPlayers`);
      const data = await res.json();
      setPlayers(data);
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
      setTeams(data);
      setActiveTab("teams");
      setAdvancedView(false);
    } catch (error) {
      console.error("Kunne ikke generere lag:", error);
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
          players: [
            {
              name: newName,
              skill: newSkill,
            },
          ],
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
          players: team.players.map((p) =>
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
          players: team.players.map((player, pIndex) => {
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
        players: [...team.players],
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
        players: [...team.players],
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

  function handleAutoScroll(e) {
    const edge = 90;
    const speed = 18;

    if (e.clientY < edge) {
      window.scrollBy(0, -speed);
    } else if (window.innerHeight - e.clientY < edge) {
      window.scrollBy(0, speed);
    }
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
    setDragOverTeam(null);
    setDragOverPlayer(null);
  }

  function handleDragEnd() {
    resetDragState();
  }

  function handleDropOnPlayer(toTeamIndex, toPlayerIndex) {
    if (!dragging) return;

    movePlayerByDrag(
      dragging.fromTeamIndex,
      dragging.playerIndex,
      toTeamIndex,
      toPlayerIndex
    );

    resetDragState();
  }

  function handleDropOnTeam(toTeamIndex) {
    if (!dragging) return;

    movePlayerByDrag(
      dragging.fromTeamIndex,
      dragging.playerIndex,
      toTeamIndex,
      null
    );

    resetDragState();
  }

  function isDraggingPlayer(teamIndex, playerIndex) {
    return (
      dragging &&
      dragging.fromTeamIndex === teamIndex &&
      dragging.playerIndex === playerIndex
    );
  }

  const teamsGridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      padding: "12px",
      background: "#f3f4f6",
      alignItems: "start",
    }),
    []
  );

  const playerGridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "0",
      background: "white",
    }),
    []
  );

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <header style={styles.topbar}>
          <div style={styles.brandRow}>
            <div style={styles.brandIcon}>🏐</div>
            <div>
              <div style={styles.brand}>Make Teams Pro</div>
              <div style={styles.subtitle}>Thines Vijay ©</div>
            </div>
          </div>
        </header>

        <section style={styles.tabBarWrap}>
          <div style={styles.tabBar}>
            <button
              style={{
                ...styles.tabBtn,
                ...(activeTab === "players" ? styles.tabBtnActive : {}),
              }}
              onClick={() => setActiveTab("players")}
            >
              Players
            </button>

            <button
              style={{
                ...styles.tabBtn,
                ...(activeTab === "teams" ? styles.tabBtnActive : {}),
              }}
              onClick={() => setActiveTab("teams")}
            >
              Teams
            </button>
          </div>
        </section>

        {activeTab === "players" && (
          <>
            <section style={styles.section}>
              <div style={styles.sectionHeader}>Number of Teams</div>

              <div style={styles.teamCountInline}>
                <button
                  style={styles.circleBtn}
                  onClick={() => setTeamCount((prev) => Math.max(2, prev - 1))}
                >
                  −
                </button>

                <div style={styles.teamCountNumber}>{teamCount}</div>

                <button
                  style={styles.circleBtn}
                  onClick={() => setTeamCount((prev) => prev + 1)}
                >
                  +
                </button>
              </div>
            </section>

            <section style={styles.section}>
              <div style={styles.sectionHeaderRow}>
                <div style={styles.sectionHeaderText}>
                  Selected: {selected.length}
                </div>

                <button
                  style={styles.addBtn}
                  onClick={() => setShowAddForm((prev) => !prev)}
                >
                  {showAddForm ? "Close" : "+ Add Player"}
                </button>
              </div>

              {showAddForm && (
                <div style={styles.formBox}>
                  <input
                    style={styles.input}
                    placeholder="Player name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                  />

                  <select
                    style={styles.select}
                    value={newPlayerSkill}
                    onChange={(e) => setNewPlayerSkill(Number(e.target.value))}
                  >
                    <option value={1}>Skill 1</option>
                    <option value={2}>Skill 2</option>
                    <option value={3}>Skill 3</option>
                  </select>

                  <button
                    style={styles.saveBtn}
                    onClick={addPlayer}
                    disabled={savingPlayer}
                  >
                    {savingPlayer ? "Saving..." : "Save Player"}
                  </button>
                </div>
              )}

              <div style={playerGridStyle}>
                {players.map((p, index) => {
                  const isSelected = selected.includes(p.name);

                  return (
                    <div
                      key={p.name}
                      style={{
                        ...styles.playerCard,
                        ...(isSelected ? styles.playerCardSelected : {}),
                      }}
                      onClick={() => togglePlayer(p.name)}
                    >
                      <div style={styles.playerCardTop}>
                        <div style={styles.playerIndexMini}>{index + 1}.</div>
                        <button
                          style={styles.editBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditPlayer(p);
                          }}
                        >
                          Edit
                        </button>
                      </div>

                      <div style={styles.playerNameCompact}>{p.name}</div>
                      <div style={styles.playerMeta}>Skill {p.skill}</div>

                      <div style={styles.playerCardBottom}>
                        <div
                          style={{
                            ...styles.skillBadgeCompact,
                            ...(p.skill === 1
                              ? styles.skill1
                              : p.skill === 2
                              ? styles.skill2
                              : styles.skill3),
                          }}
                        >
                          {p.skill}
                        </div>

                        <div
                          style={{
                            ...styles.selectedPill,
                            ...(isSelected
                              ? styles.selectedPillActive
                              : styles.selectedPillInactive),
                          }}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.buttonArea}>
                <button
                  style={{
                    ...styles.primaryBtn,
                    ...(loading || selected.length === 0 ? styles.disabledBtn : {}),
                  }}
                  onClick={generateTeams}
                  disabled={loading || selected.length === 0}
                >
                  {loading ? "GENERERER..." : "MAKE TEAMS"}
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === "teams" && (
          <section style={styles.section}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionHeaderText}>Teams</div>

              <button
                style={styles.addBtnSecondary}
                onClick={() => setAdvancedView((prev) => !prev)}
              >
                {advancedView ? "Simple View" : "Advanced View"}
              </button>
            </div>

            <div style={styles.dragHint}>
              {advancedView
                ? "Dra spillere mellom lag. Locked spillere kan ikke dras."
                : "Enkel oversikt. Trykk Advanced View hvis du vil låse og flytte spillere."}
            </div>

            {!advancedView && (
              <div style={teamsGridStyle}>
                {teams.map((team, teamIndex) => (
                  <div key={teamIndex} style={styles.teamSimpleCard}>
                    <div style={styles.teamSimpleHeader}>
                      <div style={styles.teamSimpleTitle}>{team.name}</div>
                      <div style={styles.teamSimpleCount}>
                        {(team.players || []).length} players
                      </div>
                    </div>

                    <div style={styles.teamSimpleList}>
                      {(team.players || []).map((p, i) => (
                        <div key={`${p.name}-${i}`} style={styles.teamSimpleRow}>
                          <span style={styles.teamSimpleIndex}>{i + 1}.</span>
                          <span style={styles.teamSimpleName}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {advancedView && (
              <div style={teamsGridStyle}>
                {teams.map((team, teamIndex) => (
                  <div
                    key={teamIndex}
                    style={{
                      ...styles.teamCard,
                      ...(dragOverTeam === teamIndex ? styles.teamCardHover : {}),
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleAutoScroll(e);
                      setDragOverTeam(teamIndex);
                      setDragOverPlayer(null);
                    }}
                    onDragLeave={() => {
                      setDragOverTeam((prev) => (prev === teamIndex ? null : prev));
                    }}
                    onDrop={() => handleDropOnTeam(teamIndex)}
                  >
                    <div style={styles.teamCardHeader}>
                      <div style={styles.teamTitle}>{team.name}</div>
                      <div style={styles.teamSkill}>Skill {team.total || 0}</div>
                    </div>

                    <div style={styles.teamPlayers}>
                      {(team.players || []).map((p, playerIndex) => (
                        <div
                          key={`${p.name}-${playerIndex}`}
                          draggable={!p.locked}
                          onDragStart={() => handleDragStart(teamIndex, playerIndex)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAutoScroll(e);
                            setDragOverTeam(teamIndex);
                            setDragOverPlayer(`${teamIndex}-${playerIndex}`);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDropOnPlayer(teamIndex, playerIndex);
                          }}
                          style={{
                            ...styles.teamPlayerCard,
                            ...(p.locked ? styles.teamPlayerLocked : {}),
                            ...(isDraggingPlayer(teamIndex, playerIndex)
                              ? styles.teamPlayerDragging
                              : {}),
                            ...(dragOverPlayer === `${teamIndex}-${playerIndex}`
                              ? styles.teamPlayerHover
                              : {}),
                          }}
                        >
                          <div style={styles.teamPlayerTop}>
                            <div style={styles.teamPlayerInfo}>
                              <div style={styles.teamPlayerName}>
                                {playerIndex + 1}. {p.name}
                              </div>
                              <div style={styles.teamPlayerMeta}>
                                Skill {p.skill} {p.locked ? " • Locked" : " • Drag"}
                              </div>
                            </div>

                            <div
                              style={{
                                ...styles.smallSkillBadge,
                                ...(p.skill === 1
                                  ? styles.skill1
                                  : p.skill === 2
                                  ? styles.skill2
                                  : styles.skill3),
                              }}
                            >
                              {p.skill}
                            </div>
                          </div>

                          <div style={styles.teamActionsCompact}>
                            <select
                              style={styles.selectCompact}
                              value={teamIndex}
                              onChange={(e) =>
                                movePlayer(teamIndex, playerIndex, Number(e.target.value))
                              }
                            >
                              {teams.map((t, idx) => (
                                <option key={idx} value={idx}>
                                  {t.name}
                                </option>
                              ))}
                            </select>

                            <button
                              style={{
                                ...styles.lockBtnCompact,
                                ...(p.locked ? styles.lockBtnActive : {}),
                              }}
                              onClick={() => toggleLock(teamIndex, playerIndex)}
                            >
                              {p.locked ? "Unlock" : "Lock"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {editingPlayer && (
          <div style={styles.modalOverlay} onClick={closeEditPlayer}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalTitle}>Edit Player</div>

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
                <option value={1}>Skill 1</option>
                <option value={2}>Skill 2</option>
                <option value={3}>Skill 3</option>
              </select>

              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={closeEditPlayer}>
                  Cancel
                </button>

                <button
                  style={styles.saveBtn}
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
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#eef2f7",
    fontFamily: "Arial, sans-serif",
    color: "#1f2937",
  },
  container: {
    maxWidth: "100%",
    margin: "0 auto",
    padding: "0 0 32px 0",
  },
  topbar: {
    background: "#06b6d4",
    color: "white",
    padding: "18px 20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  brandIcon: {
    fontSize: "44px",
    lineHeight: 1,
  },
  brand: {
    fontSize: "36px",
    fontWeight: "700",
    lineHeight: 1.05,
  },
  subtitle: {
    marginTop: "6px",
    fontSize: "16px",
    opacity: 0.95,
  },
  tabBarWrap: {
    padding: "14px 20px 0",
  },
  tabBar: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  tabBtn: {
    height: "72px",
    borderRadius: "20px",
    border: "none",
    background: "#dbe6f8",
    color: "#111827",
    fontWeight: "700",
    fontSize: "18px",
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "#167f76",
    color: "white",
  },
  section: {
    marginTop: "18px",
    background: "white",
    overflow: "hidden",
  },
  sectionHeader: {
    background: "#dff4fb",
    color: "#0f766e",
    fontSize: "20px",
    fontWeight: "700",
    padding: "18px 20px",
    borderBottom: "1px solid #d1d5db",
  },
  sectionHeaderRow: {
    background: "#dff4fb",
    color: "#0f766e",
    padding: "18px 20px",
    borderBottom: "1px solid #d1d5db",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  sectionHeaderText: {
    fontSize: "20px",
    fontWeight: "700",
  },
  teamCountInline: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "30px",
    padding: "20px 16px",
    background: "white",
  },
  circleBtn: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    border: "4px solid #22c1dc",
    background: "white",
    color: "#22c1dc",
    fontSize: "54px",
    cursor: "pointer",
    lineHeight: 1,
  },
  teamCountNumber: {
    minWidth: "70px",
    textAlign: "center",
    fontSize: "86px",
    fontWeight: "800",
    color: "#134e4a",
  },
  addBtn: {
    height: "68px",
    minWidth: "180px",
    borderRadius: "20px",
    border: "none",
    background: "#0f766e",
    color: "white",
    fontWeight: "700",
    fontSize: "18px",
    padding: "0 18px",
    cursor: "pointer",
  },
  addBtnSecondary: {
    height: "68px",
    minWidth: "180px",
    borderRadius: "20px",
    border: "none",
    background: "#ece9ef",
    color: "#111827",
    fontWeight: "700",
    fontSize: "18px",
    padding: "0 18px",
    cursor: "pointer",
  },
  formBox: {
    padding: "16px 20px",
    display: "grid",
    gap: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
  },
  input: {
    width: "100%",
    height: "52px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "16px",
    background: "white",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: "52px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: "16px",
    background: "white",
  },
  saveBtn: {
    height: "52px",
    borderRadius: "14px",
    border: "none",
    background: "#0f766e",
    color: "white",
    fontWeight: "700",
    fontSize: "16px",
    padding: "0 16px",
    cursor: "pointer",
  },
  cancelBtn: {
    height: "52px",
    borderRadius: "14px",
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "700",
    fontSize: "16px",
    padding: "0 16px",
    cursor: "pointer",
  },
  playerCard: {
    border: "2px solid #18b5ce",
    background: "#bdeefa",
    padding: "10px 10px 12px",
    minHeight: "136px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "8px",
  },
  playerCardSelected: {
    boxShadow: "inset 0 0 0 2px #0696b1",
  },
  playerCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  playerIndexMini: {
    fontSize: "18px",
    color: "#374151",
    fontWeight: "600",
  },
  editBtn: {
    height: "40px",
    minWidth: "84px",
    borderRadius: "16px",
    border: "none",
    background: "#dde5f3",
    color: "#075985",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  },
  playerNameCompact: {
    fontSize: "18px",
    fontWeight: "700",
    lineHeight: 1.15,
    wordBreak: "break-word",
  },
  playerMeta: {
    fontSize: "14px",
    color: "#6b7280",
  },
  playerCardBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  skillBadgeCompact: {
    minWidth: "52px",
    height: "52px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "800",
    fontSize: "28px",
  },
  selectedPill: {
    minWidth: "106px",
    height: "42px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
  },
  selectedPillActive: {
    background: "#0791b1",
    color: "white",
  },
  selectedPillInactive: {
    background: "#dbe4ef",
    color: "#111827",
  },
  skill1: {
    background: "#22c55e",
  },
  skill2: {
    background: "#f59e0b",
  },
  skill3: {
    background: "#ef4444",
  },
  buttonArea: {
    padding: "18px 20px 26px",
    background: "#f9fafb",
  },
  primaryBtn: {
    width: "100%",
    height: "62px",
    border: "none",
    borderRadius: "999px",
    background: "#0f766e",
    color: "white",
    fontSize: "22px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  disabledBtn: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  dragHint: {
    padding: "18px 20px",
    fontSize: "16px",
    color: "#6b7280",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  teamSimpleCard: {
    background: "#f7fafc",
    borderRadius: "28px",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  },
  teamSimpleHeader: {
    background: "#e6f7fb",
    padding: "16px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  teamSimpleTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#134e4a",
  },
  teamSimpleCount: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#134e4a",
  },
  teamSimpleList: {
    padding: "14px 14px 16px",
    display: "grid",
    gap: "12px",
  },
  teamSimpleRow: {
    minHeight: "66px",
    borderRadius: "20px",
    border: "1px solid #d8dde7",
    background: "#f6f8fb",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 14px",
  },
  teamSimpleIndex: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#6b7280",
    minWidth: "36px",
  },
  teamSimpleName: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#111827",
    wordBreak: "break-word",
  },
  teamCard: {
    background: "white",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
    minWidth: 0,
  },
  teamCardHover: {
    boxShadow: "0 0 0 3px #22c1dc, 0 8px 24px rgba(34,193,220,0.18)",
  },
  teamCardHeader: {
    background: "#e6f7fb",
    padding: "14px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  teamTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#134e4a",
  },
  teamSkill: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#134e4a",
  },
  teamPlayers: {
    padding: "10px",
    display: "grid",
    gap: "10px",
    maxHeight: "72vh",
    overflowY: "auto",
  },
  teamPlayerCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "10px",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "white",
  },
  teamPlayerHover: {
    background: "#dffafe",
    boxShadow: "inset 0 0 0 2px #06b6d4",
  },
  teamPlayerLocked: {
    background: "#fff7ed",
  },
  teamPlayerDragging: {
    opacity: 0.35,
    transform: "scale(0.98)",
  },
  teamPlayerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },
  teamPlayerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
  teamPlayerName: {
    fontSize: "18px",
    fontWeight: "700",
    lineHeight: 1.15,
    wordBreak: "break-word",
  },
  teamPlayerMeta: {
    fontSize: "13px",
    color: "#6b7280",
  },
  smallSkillBadge: {
    minWidth: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "800",
    fontSize: "22px",
    flexShrink: 0,
  },
  teamActionsCompact: {
    display: "grid",
    gap: "8px",
  },
  selectCompact: {
    width: "100%",
    height: "44px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: "15px",
    background: "white",
  },
  lockBtnCompact: {
    height: "44px",
    borderRadius: "14px",
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
  },
  lockBtnActive: {
    background: "#f59e0b",
    color: "white",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: "420px",
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    display: "grid",
    gap: "12px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },
};