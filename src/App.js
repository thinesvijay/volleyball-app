import { useEffect, useState } from "react";

const API =
  "https://script.google.com/macros/s/AKfycbx9FWReNsr6vJam6b02OCf96K482opSh_SPZVSeBqoTs65M7S2E1ZGZXt9qGUMzpE2dDw/exec";

export default function App() {
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamCount, setTeamCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dragOverTeam, setDragOverTeam] = useState(null);
  const [dragOverPlayer, setDragOverPlayer] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSkill, setNewPlayerSkill] = useState(1);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSkill, setEditSkill] = useState(1);
  const [savingPlayer, setSavingPlayer] = useState(false);

  const isMobile = viewportWidth <= 768;

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    function onResize() {
      setViewportWidth(window.innerWidth);
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
          p.name === oldName
            ? {
                ...p,
                name: newName,
                skill: newSkill,
              }
            : p
        )
      );

      setSelected((prev) =>
        prev.map((name) => (name === oldName ? newName : name))
      );

      setTeams((prevTeams) =>
        prevTeams.map((team) => ({
          ...team,
          players: team.players.map((p) =>
            p.name === oldName
              ? {
                  ...p,
                  name: newName,
                  skill: newSkill,
                }
              : p
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

  function getTeamSkill(team) {
    return team.players.reduce((sum, p) => sum + Number(p.skill || 0), 0);
  }

  function isDraggingPlayer(teamIndex, playerIndex) {
    return (
      dragging &&
      dragging.fromTeamIndex === teamIndex &&
      dragging.playerIndex === playerIndex
    );
  }

  function getTeamGridStyle() {
    return {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: isMobile ? "10px" : "16px",
      padding: isMobile ? "10px" : "16px",
      background: "#f3f4f6",
      alignItems: "start",
    };
  }

  return (
    <div style={styles.app}>
      <div style={{ ...styles.container, maxWidth: isMobile ? "100%" : "1100px" }}>
        <header style={{ ...styles.topbar, padding: isMobile ? "18px 14px" : "20px 16px" }}>
          <div>
            <div style={{ ...styles.brand, fontSize: isMobile ? "28px" : "32px" }}>
              🏐 Make Teams Pro
            </div>
            <div style={styles.subtitle}>React + Apps Script</div>
          </div>
        </header>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>Number of Teams</div>

          <div style={{ ...styles.teamCountBox, padding: isMobile ? "22px 10px" : "28px 16px" }}>
            <button
              style={{
                ...styles.circleBtn,
                width: isMobile ? "64px" : "74px",
                height: isMobile ? "64px" : "74px",
                fontSize: isMobile ? "34px" : "42px",
              }}
              onClick={() => setTeamCount((prev) => Math.max(2, prev - 1))}
            >
              −
            </button>

            <div
              style={{
                ...styles.teamCountNumber,
                fontSize: isMobile ? "64px" : "72px",
              }}
            >
              {teamCount}
            </div>

            <button
              style={{
                ...styles.circleBtn,
                width: isMobile ? "64px" : "74px",
                height: isMobile ? "64px" : "74px",
                fontSize: isMobile ? "34px" : "42px",
              }}
              onClick={() => setTeamCount((prev) => prev + 1)}
            >
              +
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeaderRow}>
            <div style={styles.sectionHeaderText}>Players: {selected.length}</div>
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

          <div style={styles.playerList}>
            {players.map((p, index) => {
              const isSelected = selected.includes(p.name);

              return (
                <div
                  key={p.name}
                  style={{
                    ...styles.playerRow,
                    ...(isSelected ? styles.playerRowSelected : {}),
                    padding: isMobile ? "10px 12px" : "12px 16px",
                  }}
                >
                  <div
                    style={styles.playerRowMain}
                    onClick={() => togglePlayer(p.name)}
                  >
                    <div style={styles.playerLeft}>
                      <div style={styles.playerIndex}>{index + 1}.</div>
                      <div>
                        <div
                          style={{
                            ...styles.playerName,
                            fontSize: isMobile ? "17px" : "20px",
                          }}
                        >
                          {p.name}
                        </div>
                        <div style={styles.playerMeta}>Skill {p.skill}</div>
                      </div>
                    </div>

                    <div style={styles.playerRight}>
                      {isSelected && (
                        <div
                          style={{
                            ...styles.selectedLabel,
                            padding: isMobile ? "5px 8px" : "6px 10px",
                            fontSize: isMobile ? "11px" : "12px",
                          }}
                        >
                          SELECTED
                        </div>
                      )}

                      <div
                        style={{
                          ...styles.skillBadge,
                          minWidth: isMobile ? "44px" : "48px",
                          height: isMobile ? "44px" : "48px",
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
                  </div>

                  <button style={styles.editBtn} onClick={() => openEditPlayer(p)}>
                    Edit
                  </button>
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

        {teams.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>Teams</div>

            <div style={styles.dragHint}>
              Dra spillere mellom lag. Kortene er kompakte og scroller inni seg.
            </div>

            <div style={getTeamGridStyle()}>
              {teams.map((team, teamIndex) => (
                <div
                  key={teamIndex}
                  style={{
                    ...styles.teamCard,
                    ...(dragOverTeam === teamIndex ? styles.teamCardHover : {}),
                    borderRadius: isMobile ? "18px" : "22px",
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
                  <div
                    style={{
                      ...styles.teamCardHeader,
                      padding: isMobile ? "14px 12px" : "18px 16px",
                    }}
                  >
                    <div
                      style={{
                        ...styles.teamTitle,
                        fontSize: isMobile ? "24px" : "28px",
                      }}
                    >
                      {team.name}
                    </div>
                    <div
                      style={{
                        ...styles.teamSkill,
                        fontSize: isMobile ? "18px" : "20px",
                      }}
                    >
                      Skill {getTeamSkill(team)}
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.teamPlayers,
                      padding: isMobile ? "8px 10px 10px" : "8px 16px 16px",
                      maxHeight: isMobile ? "62vh" : "72vh",
                      overflowY: "auto",
                    }}
                  >
                    {team.players.map((p, playerIndex) => (
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
                          ...styles.teamPlayerRow,
                          ...(p.locked ? styles.teamPlayerLocked : {}),
                          ...(isDraggingPlayer(teamIndex, playerIndex)
                            ? styles.teamPlayerDragging
                            : {}),
                          ...(dragOverPlayer === `${teamIndex}-${playerIndex}`
                            ? styles.teamPlayerHover
                            : {}),
                          padding: isMobile ? "10px" : "14px 0",
                          marginBottom: isMobile ? "8px" : "0",
                        }}
                      >
                        <div style={styles.teamPlayerTop}>
                          <div style={styles.teamPlayerInfo}>
                            <div
                              style={{
                                ...styles.teamPlayerName,
                                fontSize: isMobile ? "16px" : "22px",
                              }}
                            >
                              {playerIndex + 1}. {p.name}
                            </div>
                            <div
                              style={{
                                ...styles.teamPlayerMeta,
                                fontSize: isMobile ? "12px" : "14px",
                              }}
                            >
                              Skill {p.skill} {p.locked ? " • Locked" : " • Drag"}
                            </div>
                          </div>

                          <div
                            style={{
                              ...styles.smallSkillBadge,
                              minWidth: isMobile ? "34px" : "38px",
                              height: isMobile ? "34px" : "38px",
                              fontSize: isMobile ? "16px" : "18px",
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

                        <div
                          style={{
                            ...styles.teamActions,
                            gap: isMobile ? "8px" : "10px",
                            marginTop: isMobile ? "6px" : "0",
                          }}
                        >
                          <select
                            style={{
                              ...styles.select,
                              minWidth: isMobile ? "unset" : "120px",
                              height: isMobile ? "40px" : "44px",
                              fontSize: isMobile ? "14px" : "16px",
                            }}
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
                              ...styles.lockBtn,
                              ...(p.locked ? styles.lockBtnActive : {}),
                              height: isMobile ? "40px" : "44px",
                              padding: isMobile ? "0 12px" : "0 16px",
                              fontSize: isMobile ? "13px" : "16px",
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
    margin: "0 auto",
    padding: "0 0 40px 0",
  },
  topbar: {
    background: "#06b6d4",
    color: "white",
    boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  brand: {
    fontWeight: "700",
    lineHeight: 1.1,
  },
  subtitle: {
    marginTop: "4px",
    fontSize: "14px",
    opacity: 0.95,
  },
  section: {
    marginTop: "14px",
    background: "white",
    borderRadius: "0",
    overflow: "hidden",
  },
  sectionHeader: {
    background: "#dff4fb",
    color: "#0f766e",
    fontSize: "18px",
    fontWeight: "700",
    padding: "16px",
    borderBottom: "1px solid #d1d5db",
  },
  sectionHeaderRow: {
    background: "#dff4fb",
    color: "#0f766e",
    fontSize: "18px",
    fontWeight: "700",
    padding: "16px",
    borderBottom: "1px solid #d1d5db",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  sectionHeaderText: {
    fontSize: "18px",
    fontWeight: "700",
  },
  addBtn: {
    height: "40px",
    borderRadius: "12px",
    border: "none",
    background: "#0f766e",
    color: "white",
    fontWeight: "700",
    padding: "0 14px",
    cursor: "pointer",
  },
  formBox: {
    padding: "16px",
    display: "grid",
    gap: "10px",
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
  },
  input: {
    width: "100%",
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "16px",
    background: "white",
    boxSizing: "border-box",
  },
  teamCountBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "28px",
    background: "white",
  },
  circleBtn: {
    borderRadius: "50%",
    border: "3px solid #22c1dc",
    background: "white",
    color: "#22c1dc",
    cursor: "pointer",
  },
  teamCountNumber: {
    fontWeight: "800",
    color: "#134e4a",
    minWidth: "80px",
    textAlign: "center",
  },
  playerList: {
    background: "white",
  },
  playerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  playerRowMain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    cursor: "pointer",
  },
  playerRowSelected: {
    background: "#bff6ff",
    boxShadow: "inset 0 0 0 2px #06b6d4",
  },
  playerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  playerRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  selectedLabel: {
    borderRadius: "999px",
    background: "#0891b2",
    color: "white",
    fontWeight: "700",
    letterSpacing: "0.4px",
  },
  editBtn: {
    height: "40px",
    borderRadius: "12px",
    border: "none",
    background: "#e0f2fe",
    color: "#075985",
    fontWeight: "700",
    padding: "0 14px",
    cursor: "pointer",
    flexShrink: 0,
  },
  playerIndex: {
    fontSize: "18px",
    width: "30px",
    color: "#374151",
  },
  playerName: {
    fontWeight: "500",
  },
  playerMeta: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "4px",
  },
  skillBadge: {
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "800",
    color: "white",
  },
  smallSkillBadge: {
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    color: "white",
    flexShrink: 0,
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
    padding: "20px 16px 26px",
    background: "#f9fafb",
  },
  primaryBtn: {
    width: "100%",
    height: "58px",
    border: "none",
    borderRadius: "999px",
    background: "#0f766e",
    color: "white",
    fontSize: "22px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  saveBtn: {
    height: "46px",
    borderRadius: "12px",
    border: "none",
    background: "#0f766e",
    color: "white",
    fontWeight: "700",
    padding: "0 16px",
    cursor: "pointer",
  },
  cancelBtn: {
    height: "46px",
    borderRadius: "12px",
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "700",
    padding: "0 16px",
    cursor: "pointer",
  },
  disabledBtn: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  dragHint: {
    padding: "14px 16px",
    fontSize: "14px",
    color: "#6b7280",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  teamCard: {
    background: "white",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
    transition: "box-shadow 0.15s ease, transform 0.15s ease",
    minWidth: 0,
  },
  teamCardHover: {
    boxShadow: "0 0 0 3px #22c1dc, 0 8px 24px rgba(34,193,220,0.18)",
  },
  teamCardHeader: {
    background: "#e6f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  teamTitle: {
    fontWeight: "700",
    color: "#134e4a",
  },
  teamSkill: {
    fontWeight: "700",
    color: "#134e4a",
  },
  teamPlayers: {},
  teamPlayerRow: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderBottom: "1px solid #e5e7eb",
    background: "white",
    transition:
      "opacity 0.15s ease, transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
    cursor: "grab",
    borderRadius: "14px",
  },
  teamPlayerHover: {
    background: "#dffafe",
    boxShadow: "inset 0 0 0 2px #06b6d4",
  },
  teamPlayerLocked: {
    background: "#fff7ed",
    cursor: "default",
  },
  teamPlayerDragging: {
    opacity: 0.35,
    transform: "scale(0.98)",
  },
  teamPlayerTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
  },
  teamPlayerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
  teamPlayerName: {
    fontWeight: "600",
    wordBreak: "break-word",
    lineHeight: 1.15,
  },
  teamPlayerMeta: {
    color: "#6b7280",
  },
  teamActions: {
    display: "flex",
    flexWrap: "wrap",
  },
  select: {
    flex: 1,
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 12px",
    background: "white",
  },
  lockBtn: {
    borderRadius: "12px",
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: "700",
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