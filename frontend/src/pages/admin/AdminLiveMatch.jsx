import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { API_BASE_URL } from "../../config/api";

let socket;

function AdminLiveMatch() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [minute, setMinute] = useState("0");
  const [eventType, setEventType] = useState("goal");
  const [eventTeam, setEventTeam] = useState("home");
  const [player, setPlayer] = useState("");
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchMatchDetails();

    socket = io(API_BASE_URL);

    socket.on("matchUpdate", (updatedMatch) => {
      if (updatedMatch && updatedMatch.id === parseInt(id)) {
        setMatch(updatedMatch);
        setHomeScore(updatedMatch.home_score || 0);
        setAwayScore(updatedMatch.away_score || 0);
      }
    });

    socket.on("matchEventAdded", ({ matchId, event }) => {
      if (matchId === parseInt(id)) {
        setEvents((prev) => [...prev, event]);
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id, navigate]);

  async function fetchMatchDetails() {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/matches/${id}`);
      const data = response.data.match || response.data;
      setMatch(data);
      setHomeScore(data.home_score || 0);
      setAwayScore(data.away_score || 0);
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error loading match:", err);
      setError("Failed to load match details.");
    } finally {
      setLoading(false);
    }
  }

    async function handleSetStatus(newStatus) {
    setMessage("");
    setError("");
    const token = localStorage.getItem("adminToken");

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/matches/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage(`Match status updated to "${newStatus.toUpperCase()}"!`);
        // Immediately update local state so badge switches with zero delay:
        setMatch((prev) => (prev ? { ...prev, status: newStatus } : prev));
        fetchMatchDetails();
      }
    } catch (err) {
      console.error("Error changing status:", err);
      setError(err.response?.data?.message || "Failed to update match status.");
    }
  }

  async function handleUpdateScore(newHome, newAway) {
    setMessage("");
    setError("");
    const token = localStorage.getItem("adminToken");

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/matches/${id}/score`,
        { home_score: newHome, away_score: newAway },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setHomeScore(newHome);
        setAwayScore(newAway);
        setMessage("Score updated successfully!");
      }
    } catch (err) {
      console.error("Error updating score:", err);
      setError(err.response?.data?.message || "Failed to update score.");
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    if (!player.trim()) return;

    setMessage("");
    setError("");
    const token = localStorage.getItem("adminToken");
    const teamId = eventTeam === "home" ? match.home_team_id : match.away_team_id;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/matches/${id}/events`,
        {
          minute: parseInt(minute) || 0,
          event_type: eventType,
          team_id: teamId,
          player_name: player.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (eventType === "goal") {
          if (eventTeam === "home") {
            handleUpdateScore(homeScore + 1, awayScore);
          } else {
            handleUpdateScore(homeScore, awayScore + 1);
          }
        }
        setMessage(`Event logged: ${player} (${eventType})`);
        setPlayer("");
        fetchMatchDetails();
      }
    } catch (err) {
      console.error("Error logging event:", err);
      setError(err.response?.data?.message || "Failed to log event.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  }
    if (loading) {
    return (
      <div className="admin-layout">
        <main className="admin-main">
          <div className="empty-card">
            <p>Loading live match controller...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="admin-layout">
        <main className="admin-main">
          <div className="empty-card">
            <p>Match not found.</p>
          </div>
        </main>
      </div>
    );
  }

  const currentStatus = (match.status || "").toLowerCase().replace(/[-_\s]/g, "");

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-brand">⚽ Kocheri Super League</div>
          <span className="admin-pill">ADMIN PANEL</span>
        </div>

        <nav className="admin-sidebar-nav">
          <button className="admin-nav-item" onClick={() => navigate("/admin/dashboard")}>
            <span className="nav-icon">🏠</span> Dashboard
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin/teams")}>
            <span className="nav-icon">⚽</span> Teams
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin/fixtures")}>
            <span className="nav-icon">📅</span> Fixtures
          </button>
          <button className="admin-nav-item active" onClick={() => navigate("/admin/matches")}>
            <span className="nav-icon">🔴</span> Live Control
          </button>
        </nav>

        <button className="admin-logout-button" onClick={handleLogout}>
          <span>🚪</span> Sign Out
        </button>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="admin-main">
        {/* TOP STATUS CONTROL BAR */}
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="admin-greeting">Match Operations / Match #{id}</div>
              <h2 style={{ margin: "4px 0 0 0", color: "#fff" }}>
                {match.home_team_name} vs {match.away_team_name}
              </h2>
            </div>

            {/* DIRECT MATCH STATUS BUTTONS */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                className={`btn btn-sm ${currentStatus === "live" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleSetStatus("live")}
              >
                🔴 Set LIVE (1st/2nd Half)
              </button>

              <button
                className={`btn btn-sm ${currentStatus === "halftime" || currentStatus === "ht" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleSetStatus("halftime")}
                style={{ borderColor: "var(--accent-gold)" }}
              >
                ⏸ Set HALF TIME (HT)
              </button>

              <button
                className={`btn btn-sm ${currentStatus === "completed" || currentStatus === "finished" || currentStatus === "ft" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleSetStatus("completed")}
              >
                ⏹ Set FULL TIME (FT)
              </button>

              <button className="btn btn-secondary btn-sm" onClick={() => navigate("/admin/matches")}>
                ← Back
              </button>
            </div>
          </div>
        </div>

        {message && <div className="admin-success-alert">{message}</div>}
        {error && <div className="admin-error-alert">{error}</div>}

        {/* SCOREBOARD DISPLAY */}
        <div className="admin-card" style={{ textAlign: "center", padding: "1.75rem", marginBottom: "1.5rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <span
              className={`status-badge ${
                currentStatus === "live"
                  ? "status-live"
                  : currentStatus === "halftime" || currentStatus === "ht"
                  ? "status-halftime"
                  : currentStatus === "completed" || currentStatus === "finished" || currentStatus === "ft"
                  ? "status-completed"
                  : "status-scheduled"
              }`}
            >
              {currentStatus === "live"
                ? "● LIVE IN PLAY"
                : currentStatus === "halftime" || currentStatus === "ht"
                ? "⏸ HALF TIME (HT)"
                : currentStatus === "completed" || currentStatus === "finished" || currentStatus === "ft"
                ? "FULL TIME (FINAL)"
                : "SCHEDULED"}
            </span>
          </div>

          <div className="match-details-banner" style={{ background: "transparent", border: "none", padding: 0 }}>
            {/* Home */}
            <div className="match-details-team">
              <div className="match-details-logo">
                {match.home_team_logo && (
                  <img
                    src={`${API_BASE_URL}${match.home_team_logo}`}
                    alt=""
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
              </div>
              <h3 className="team-title">{match.home_team_name}</h3>
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleUpdateScore(Math.max(0, homeScore - 1), awayScore)}
                >
                  -
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleUpdateScore(homeScore + 1, awayScore)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Score */}
            <div className="match-details-score">
              <div className="score-display">
                <span>{homeScore}</span>
                <span className="divider">:</span>
                <span>{awayScore}</span>
              </div>
            </div>

            {/* Away */}
            <div className="match-details-team">
              <div className="match-details-logo">
                {match.away_team_logo && (
                  <img
                    src={`${API_BASE_URL}${match.away_team_logo}`}
                    alt=""
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
              </div>
              <h3 className="team-title">{match.away_team_name}</h3>
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleUpdateScore(homeScore, Math.max(0, awayScore - 1))}
                >
                  -
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleUpdateScore(homeScore, awayScore + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LOG EVENT & TIMELINE SECTION */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Add Event Form */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Log Match Event</h3>
            </div>
            <form onSubmit={handleAddEvent} className="admin-team-form">
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="form-control"
                >
                  <option value="goal">⚽ Goal</option>
                  <option value="yellow_card">🟨 Yellow Card</option>
                  <option value="red_card">🟥 Red Card</option>
                  <option value="substitution">🔄 Substitution</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Team</label>
                <select
                  value={eventTeam}
                  onChange={(e) => setEventTeam(e.target.value)}
                  className="form-control"
                >
                  <option value="home">{match.home_team_name} (Home)</option>
                  <option value="away">{match.away_team_name} (Away)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Minute</label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Player Name</label>
                <input
                  type="text"
                  placeholder="e.g. Fayas (#10)"
                  value={player}
                  onChange={(e) => setPlayer(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                + Add Event
              </button>
            </form>
          </div>

          {/* Timeline */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Live Event Timeline ({events.length})</h3>
            </div>
            {events.length === 0 ? (
              <div className="empty-card">
                <p>No events recorded for this match yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "380px", overflowY: "auto" }}>
                {[...events].reverse().map((ev, i) => (
                  <div
                    key={ev.id || i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "#111",
                      border: "1px solid #242424",
                      borderRadius: "6px",
                    }}
                  >
                    <span style={{ color: "var(--accent-gold)", fontWeight: 700, minWidth: "35px" }}>
                      {ev.minute}'
                    </span>
                    <span style={{ color: "#fff", flex: 1, textAlign: "left", paddingLeft: "10px" }}>
                      {ev.event_type === "goal"
                        ? "⚽ Goal"
                        : ev.event_type === "yellow_card"
                        ? "🟨 Yellow Card"
                        : ev.event_type === "red_card"
                        ? "🟥 Red Card"
                        : "🔄 Sub"} — <strong>{ev.player_name}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminLiveMatch;