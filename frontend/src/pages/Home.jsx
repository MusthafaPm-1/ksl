import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function Home() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  async function fetchHomeData() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/matches`);
      const allMatches = response.data.matches || response.data || [];

      // Filter live and scheduled matches
      const live = allMatches.filter((m) => {
        const s = (m.status || "").toLowerCase().replace(/[-_\s]/g, "");
        return s === "live" || s === "halftime" || s === "ht";
      });

      const upcoming = allMatches.filter((m) => {
        const s = (m.status || "").toLowerCase().replace(/[-_\s]/g, "");
        return s === "scheduled" || s === "upcoming";
      }).slice(0, 3); // Top 3 upcoming fixtures

      setLiveMatches(live);
      setUpcomingMatches(upcoming);
    } catch (error) {
      console.error("Error loading home page data:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatMatchDate(dateString) {
    if (!dateString) return "Date TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="page home-page">
      {/* HERO SECTION */}
      <section className="hero-section">
        <h1 className="hero-title">Kocheri Super League</h1>
        <p className="hero-subtitle">
          Follow live scores, fixtures, results, standings, and registered clubs.
        </p>

        <div className="hero-buttons">
          <Link to="/live" className="btn btn-primary">
            View Live Matches
          </Link>
          <Link to="/fixtures" className="btn btn-secondary">
            View Fixtures
          </Link>
          <Link to="/teams" className="btn btn-secondary">
            View Teams
          </Link>
        </div>
      </section>

      {/* LIVE MATCHES SECTION */}
      {liveMatches.length > 0 && (
        <section className="section">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2>Live In Play</h2>
            <span className="status-badge status-live">● ON AIR</span>
          </div>

          <div className="matches-list">
            {liveMatches.map((match) => (
              <div className="match-card live-match-card" key={match.id}>
                <div className="match-details-header">
                  <span className="status-badge status-live">● LIVE</span>
                  <span className="match-details-time">📍 {match.venue || "KSL Stadium"}</span>
                </div>

                <div className="match-teams" style={{ margin: "1.25rem 0" }}>
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

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Link to={`/match/${match.id}`} className="btn btn-primary btn-sm">
                    Open Live Match Center →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* UPCOMING FIXTURES PREVIEW */}
      <section className="section">
        <h2>Upcoming Matches</h2>

        {loading ? (
          <div className="empty-card">
            <p>Loading fixtures...</p>
          </div>
        ) : upcomingMatches.length === 0 ? (
          <div className="empty-card">
            <p>No upcoming matches scheduled.</p>
          </div>
        ) : (
          <div className="matches-list">
            {upcomingMatches.map((match) => (
              <div className="match-card" key={match.id}>
                <div className="match-date">
                  📅 {formatMatchDate(match.match_date)}
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

                  <div className="match-vs">VS</div>

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

                <div className="match-venue">
                  📍 {match.venue || "KSL Main Stadium"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;