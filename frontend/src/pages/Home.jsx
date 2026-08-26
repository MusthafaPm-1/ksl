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

      // Filter live and upcoming matches
      const live = allMatches.filter((m) => {
        const s = (m.status || "").toLowerCase().replace(/[-_\s]/g, "");
        return s === "live" || s === "halftime" || s === "ht";
      });

      const upcoming = allMatches.filter((m) => {
        const s = (m.status || "").toLowerCase().replace(/[-_\s]/g, "");
        return s === "scheduled" || s === "upcoming";
      });

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
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/\b(am|pm)\b/gi, (period) => period.toUpperCase());
  }

  return (
    <div className="page home-page">
      {/* 1. HERO SECTION */}
      <section className="hero">
        <h1>Kocheri Super League</h1>
        <p>
          Follow live scores, fixtures, results, standings and teams.
        </p>
      </section>

      {/* 2. LIVE MATCHES SECTION */}
      <section className="section">
        <h2>Live Matches</h2>

        {liveMatches.length === 0 ? (
          <div className="empty-card">
            <p>No matches are currently live.</p>
          </div>
        ) : (
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
        )}
      </section>

      {/* 3. UPCOMING MATCHES SECTION */}
      <section className="section">
        <h2>Upcoming Matches</h2>

        {loading ? (
          <div className="empty-card">
            <p>Loading upcoming matches...</p>
          </div>
        ) : upcomingMatches.length === 0 ? (
          <div className="empty-card">
            <p>No upcoming matches.</p>
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

      {/* 4. TEAMS SECTION */}
      <section className="section">
        <h2>Teams</h2>

        <div className="empty-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem" }}>
          <p style={{ margin: 0, color: "var(--text-muted, #888)" }}>
            Explore all registered clubs, team rosters, and badges in the Kocheri Super League.
          </p>
          <Link to="/teams" className="btn btn-primary">
            View Teams →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;