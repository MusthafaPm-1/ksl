import { useEffect, useState } from "react";
import axios from "axios";

function Fixtures() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFixtures();
  }, []);

  async function fetchFixtures() {
    try {
      const response = await axios.get("http://localhost:5000/api/matches");
      const allMatches = response.data.matches || response.data || [];

      // Safe normalized filter: include matches that are scheduled / upcoming
      const scheduledMatches = allMatches.filter((match) => {
        const s = (match.status || "").toLowerCase().replace(/[-_\s]/g, "");
        return s === "scheduled" || s === "upcoming" || s === "pending" || s === "";
      });

      setMatches(scheduledMatches);
    } catch (error) {
      console.error("Error loading fixtures:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatMatchDate(dateString) {
    if (!dateString) return "Date & Time TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="page">
      <div className="section">
        <h2>Fixtures</h2>

        {loading ? (
          <div className="empty-card">
            <p>Loading fixtures...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-card">
            <p>No fixtures scheduled at the moment.</p>
          </div>
        ) : (
          <div className="matches-list">
            {matches.map((match) => (
              <div className="match-card" key={match.id}>
                <div className="match-date">
                  📅 {formatMatchDate(match.match_date)}
                </div>

                <div className="match-teams">
                  <div className="match-team">
                    {match.home_team_logo && (
                      <img
                        src={`http://localhost:5000${match.home_team_logo}`}
                        alt=""
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <span className="team-name">{match.home_team_name}</span>
                  </div>

                  <div className="match-vs">VS</div>

                  <div className="match-team">
                    {match.away_team_logo && (
                      <img
                        src={`http://localhost:5000${match.away_team_logo}`}
                        alt=""
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <span className="team-name">{match.away_team_name}</span>
                  </div>
                </div>

                <div className="match-venue">
                  📍 {match.venue || "KSL Main Stadium"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Fixtures;