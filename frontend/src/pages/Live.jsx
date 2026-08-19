import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { API_BASE_URL } from "../config/api";

let socket;

function Live() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches();

    socket = io(API_BASE_URL);

    socket.on("matchUpdate", (updatedMatch) => {
      setLiveMatches((prevMatches) => {
        if (updatedMatch.status === "completed") {
          return prevMatches.filter((m) => m.id !== updatedMatch.id);
        }

        const exists = prevMatches.some((m) => m.id === updatedMatch.id);
        if (exists) {
          return prevMatches.map((m) =>
            m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
          );
        } else if (updatedMatch.status === "live" || updatedMatch.status === "halftime") {
          return [updatedMatch, ...prevMatches];
        }
        return prevMatches;
      });
    });

    socket.on("matchEventAdded", ({ matchId, event }) => {
      setLiveMatches((prevMatches) =>
        prevMatches.map((m) => {
          if (m.id === matchId) {
            const currentEvents = m.events || [];
            return {
              ...m,
              events: [...currentEvents, event],
            };
          }
          return m;
        })
      );
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  async function fetchLiveMatches() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/matches`);
      const activeLive = (response.data.matches || []).filter(
        (m) => {
          const s = (m.status || "").toLowerCase().replace(/[-_\s]/g, "");
          return s === "live" || s === "halftime" || s === "ht";
        }
      );
      setLiveMatches(activeLive);
    } catch (err) {
      console.error("Error fetching live matches:", err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(rawStatus) {
    const s = (rawStatus || "").toLowerCase().replace(/[-_\s]/g, "");
    if (s === "live") return <span className="status-badge status-live">● LIVE</span>;
    if (s === "halftime" || s === "ht") return <span className="status-badge status-halftime">⏸ HALF TIME</span>;
    if (s === "completed" || s === "finished" || s === "ft") return <span className="status-badge status-completed">FULL TIME</span>;
    return <span className="status-badge status-scheduled">SCHEDULED</span>;
  }

  return (
    <div className="page">
      <div className="section">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2>Live Matches</h2>
          <span className="status-badge status-live">● ON AIR</span>
        </div>

        {loading ? (
          <div className="empty-card">
            <p>Loading live match feed...</p>
          </div>
        ) : liveMatches.length === 0 ? (
          <div className="empty-card">
            <p>No matches currently in play.</p>
            <Link to="/fixtures" className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }}>
              View Upcoming Fixtures
            </Link>
          </div>
        ) : (
          <div className="matches-list">
            {liveMatches.map((match) => (
              <div className="match-card live-match-card" key={match.id}>
                <div className="match-details-header">
                  {getStatusBadge(match.status)}
                  <span className="match-details-time">📍 {match.venue || "KSL Stadium"}</span>
                </div>

                <div className="match-teams" style={{ margin: "1.5rem 0" }}>
                  <div className="match-team">
                    {match.home_team_logo && (
                      <img
                        src={`${API_BASE_URL}${match.home_team_logo}`}
                        alt=""
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <span className="team-name">{match.home_team_name}</span>
                  </div>

                  <div className="match-score">
                    <span className="score-number">{match.home_score ?? 0}</span>
                    <span className="score-divider">:</span>
                    <span className="score-number">{match.away_score ?? 0}</span>
                  </div>

                  <div className="match-team">
                    {match.away_team_logo && (
                      <img
                        src={`${API_BASE_URL}${match.away_team_logo}`}
                        alt=""
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <span className="team-name">{match.away_team_name}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
                  <Link to={`/match/${match.id}`} className="btn btn-primary btn-sm">
                    View Live Center & Timeline →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Live;