import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

let socket;

function Live() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches();

    // Connect to Socket.IO backend
    socket = io("http://localhost:5000");

    // Listen for live score and status changes
    socket.on("matchUpdate", (updatedMatch) => {
      setLiveMatches((prevMatches) => {
        if (updatedMatch.status === "completed") {
          // Remove if match finished
          return prevMatches.filter((m) => m.id !== updatedMatch.id);
        }

        const exists = prevMatches.some((m) => m.id === updatedMatch.id);
        if (exists) {
          return prevMatches.map((m) =>
            m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
          );
        } else if (updatedMatch.status === "live") {
          return [updatedMatch, ...prevMatches];
        }
        return prevMatches;
      });
    });

    // Listen for live events (goals, cards)
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
    const response = await axios.get("http://localhost:5000/api/matches");
    // Include both 'live' and 'halftime' in the active on-air feed
    const activeLive = (response.data.matches || []).filter(
      (m) => m.status === "live" || m.status === "halftime"
    );
    setLiveMatches(activeLive);
  } catch (err) {
    console.error("Error fetching live matches:", err);
  } finally {
    setLoading(false);
  }
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
                  <span className="status-badge status-live">● LIVE NOW</span>
                  <span className="match-details-time">📍 {match.venue || "KSL Stadium"}</span>
                </div>

                <div className="match-teams" style={{ margin: "1.5rem 0" }}>
                  <div className="match-team">
                    <img
                      src={`http://localhost:5000${match.home_team_logo}`}
                      alt=""
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <span className="team-name">{match.home_team_name}</span>
                  </div>

                  <div className="match-score">
                    <span className="score-number">{match.home_score ?? 0}</span>
                    <span className="score-divider">:</span>
                    <span className="score-number">{match.away_score ?? 0}</span>
                  </div>

                  <div className="match-team">
                    <img
                      src={`http://localhost:5000${match.away_team_logo}`}
                      alt=""
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <span className="team-name">{match.away_team_name}</span>
                  </div>
                </div>

                {/* Match Details Link */}
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