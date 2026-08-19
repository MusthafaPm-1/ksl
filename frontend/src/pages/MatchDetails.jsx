import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

let socket;

function MatchDetails() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchMatchDetails();

      // Listen for real-time live events and score changes
      socket = io("http://localhost:5000");

      socket.on("matchUpdate", (updatedMatch) => {
        if (updatedMatch && updatedMatch.id === parseInt(id)) {
          setMatch(updatedMatch);
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
    } else {
      setLoading(false);
      setError("No match ID found in URL.");
    }
  }, [id]);

  async function fetchMatchDetails() {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`http://localhost:5000/api/matches/${id}`);
      const matchData = response.data.match || response.data;
      if (matchData) {
        setMatch(matchData);
        setEvents(matchData.events || []);
      } else {
        setError("Match details not found.");
      }
    } catch (err) {
      console.error("Error loading match details:", err);
      setError("Unable to load match details from server.");
    } finally {
      setLoading(false);
    }
  }

  function formatMatchDate(dateString) {
    if (!dateString) return "Date TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(rawStatus) {
    if (!rawStatus) return <span className="status-badge status-scheduled">SCHEDULED</span>;
    const s = rawStatus.toString().toLowerCase().replace(/[-_\s]/g, "");
    if (s === "live") return <span className="status-badge status-live">● LIVE</span>;
    if (s === "halftime" || s === "ht") return <span className="status-badge status-halftime">⏸ HALF TIME</span>;
    if (s === "completed" || s === "finished" || s === "ft") return <span className="status-badge status-completed">FULL TIME</span>;
    return <span className="status-badge status-scheduled">SCHEDULED</span>;
  }
    return (
    <div className="page">
      <div className="section">
        <div className="section-nav" style={{ marginBottom: "1.5rem" }}>
          <Link to="/results" className="back-link">
            ← Back to Results
          </Link>
        </div>

        <h2>Match Details</h2>

        {loading ? (
          <div className="empty-card">
            <p>Loading match details...</p>
          </div>
        ) : error ? (
          <div className="empty-card">
            <p>{error}</p>
          </div>
        ) : !match ? (
          <div className="empty-card">
            <p>No match information available.</p>
          </div>
        ) : (
          <div className="match-details-container">
            {/* Header / Status */}
            <div className="match-details-header">
              {getStatusBadge(match.status)}
              <span className="match-details-time">
                {formatMatchDate(match.match_date)}
              </span>
            </div>

            {/* Scoreboard Banner */}
            <div className="match-details-banner">
              {/* Home Team */}
              <div className="match-details-team">
                <div className="match-details-logo">
                  {match.home_team_logo ? (
                    <img
                      src={`http://localhost:5000${match.home_team_logo}`}
                      alt={`${match.home_team_name} logo`}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span className="team-logo-fallback">⚽</span>
                  )}
                </div>
                <h3 className="team-title">{match.home_team_name || "Home Team"}</h3>
              </div>

              {/* Score / VS */}
              <div className="match-details-score">
                {match.status === "scheduled" ? (
                  <span className="vs-tag">VS</span>
                ) : (
                  <div className="score-display">
                    <span>{match.home_score ?? 0}</span>
                    <span className="divider">:</span>
                    <span>{match.away_score ?? 0}</span>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="match-details-team">
                <div className="match-details-logo">
                  {match.away_team_logo ? (
                    <img
                      src={`http://localhost:5000${match.away_team_logo}`}
                      alt={`${match.away_team_name} logo`}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span className="team-logo-fallback">⚽</span>
                  )}
                </div>
                <h3 className="team-title">{match.away_team_name || "Away Team"}</h3>
              </div>
            </div>

            {/* Match Information Panel */}
            <div className="match-info-card">
              <h3>Match Information</h3>
              <div className="match-info-grid">
                <div className="info-item">
                  <span className="info-label">Venue</span>
                  <span className="info-value">📍 {match.venue || "KSL Main Stadium"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value" style={{ fontWeight: 600 }}>
                    {(() => {
                      const s = (match.status || "").toLowerCase().replace(/[-_\s]/g, "");
                      if (s === "live") return "Live In Play";
                      if (s === "halftime" || s === "ht") return "Half Time (HT)";
                      if (s === "completed" || s === "finished" || s === "ft") return "Full Time (Completed)";
                      return "Scheduled";
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* MATCH EVENTS & TIMELINE CARD */}
            <div className="match-info-card" style={{ marginTop: "1.5rem" }}>
              <h3>Match Events & Timeline</h3>
              {events.length === 0 ? (
                <div className="empty-card" style={{ padding: "1.5rem" }}>
                  <p>No goals or cards recorded for this match yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "1rem" }}>
                  {/* Reverse so the newest event appears on top */}
{[...events].reverse().map((ev, i) => {
  const isHome = ev.team_id === match.home_team_id;
  return (
    <div
      key={ev.id || i}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        background: "#121212",
        border: "1px solid #282828",
        borderRadius: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "var(--accent-gold, #c9a84b)", fontWeight: 700, minWidth: "35px" }}>
          {ev.minute}'
        </span>
        <span style={{ color: "#ffffff", fontWeight: 600 }}>
          {ev.event_type === "goal"
            ? "⚽ Goal"
            : ev.event_type === "yellow_card"
            ? "🟨 Yellow Card"
            : ev.event_type === "red_card"
            ? "🟥 Red Card"
            : "🔄 Substitution"}
        </span>
        <span style={{ color: "#d0d0d0" }}>— {ev.player_name}</span>
      </div>
      <span style={{ fontSize: "0.8rem", color: "#888", textTransform: "uppercase" }}>
        {isHome ? match.home_team_name : match.away_team_name}
      </span>
    </div>
  );
})}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchDetails;