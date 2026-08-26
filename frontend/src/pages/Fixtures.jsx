import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function Fixtures() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFixtures();
  }, []);

  async function fetchFixtures() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/matches`);
      const allMatches = response.data.matches || response.data || [];

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

    // Fixtures are scheduled as local stadium time. Read the stored values as
    // UTC components so the browser does not add the viewer's timezone offset.
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date & Time TBD";

    const datePart = new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
    const hour = date.getUTCHours();
    const minute = String(date.getUTCMinutes()).padStart(2, "0");
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${datePart}, ${displayHour}:${minute} ${period}`;
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
              <article className="fixture-card" key={match.id}>
                <div className="fixture-card__teams">
                  <div className="fixture-card__team">
                    {match.home_team_logo && (
                      <img src={`${API_BASE_URL}${match.home_team_logo}`} alt="" onError={(e) => { e.target.style.display = "none"; }} />
                    )}
                    <span>{match.home_team_name}</span>
                  </div>
                  <div className="fixture-card__vs" aria-label="versus">VS</div>
                  <div className="fixture-card__team">
                    {match.away_team_logo && (
                      <img src={`${API_BASE_URL}${match.away_team_logo}`} alt="" onError={(e) => { e.target.style.display = "none"; }} />
                    )}
                    <span>{match.away_team_name}</span>
                  </div>
                </div>
                <div className="fixture-card__details">
                  <div className="fixture-card__date">{formatMatchDate(match.match_date)}</div>
                  <div className="fixture-card__competition">Kocheri Super League</div>
                  <div className="fixture-card__venue">📍 {match.venue || "KSL Main Stadium"}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Fixtures;