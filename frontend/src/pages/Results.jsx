import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function Results() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  async function fetchResults() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/matches`);
      const allMatches = response.data.matches || response.data || [];

      const completedMatches = allMatches.filter((match) => {
        const s = (match.status || "").toLowerCase().replace(/[-_\s]/g, "");
        return s === "completed" || s === "finished" || s === "ft";
      });

      setMatches(completedMatches);
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatMatchDate(dateString) {
    if (!dateString) return "Completed";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="page">
      <div className="section">
        <h2>Match Results</h2>

        {loading ? (
          <div className="empty-card">
            <p>Loading results...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-card">
            <p>No completed matches found.</p>
          </div>
        ) : (
          <div className="matches-list">
            {matches.map((match) => (
              <div className="match-card result-card" key={match.id}>
                <div className="match-date">
                  {formatMatchDate(match.match_date)}
                </div>

                <div className="match-teams">
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
                    <span className="score-divider">-</span>
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

                <div className="match-footer" style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="match-venue" style={{ fontSize: "0.85rem", color: "#888" }}>
                    📍 {match.venue || "KSL Main Stadium"}
                  </span>
                  <Link
                    to={`/match/${match.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Match Details →
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

export default Results;