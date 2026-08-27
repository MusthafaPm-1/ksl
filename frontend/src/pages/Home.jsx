import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function Home() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]);
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

      const past = allMatches
        .filter((m) => {
          const s = (m.status || "").toLowerCase().replace(/[-_\s]/g, "");
          return s === "finished" || s === "completed" || s === "ft";
        })
        .sort((a, b) => new Date(b.match_date || 0) - new Date(a.match_date || 0))
        .slice(0, 6);

      setLiveMatches(live);
      setUpcomingMatches(upcoming);
      setPastMatches(past);
    } catch (error) {
      console.error("Error loading home page data:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatMatchDate(dateString) {
    if (!dateString) return "Date TBD";

    // Fixtures are scheduled as local stadium time. Read the stored values as
    // UTC components so the browser does not add the viewer's timezone offset.
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date TBD";

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
      </section>

      {/* 4. PAST SCORES SECTION */}
      <section className="section past-scores-section">
        <div className="past-scores-heading">
          <div>
            <span className="past-scores-eyebrow">FULL-TIME RESULTS</span>
            <h2>Past Scores</h2>
          </div>
          <Link to="/results" className="past-scores-link">
            View all results →
          </Link>
        </div>

        {loading ? (
          <div className="empty-card">
            <p>Loading past scores...</p>
          </div>
        ) : pastMatches.length === 0 ? (
          <div className="empty-card">
            <p>No completed matches yet.</p>
          </div>
        ) : (
          <div className="past-scores-grid">
            {pastMatches.map((match) => (
              <Link to={`/match/${match.id}`} className="past-score-card" key={match.id}>
                <div className="past-score-meta">
                  <span className="past-score-status">FULL TIME</span>
                  <span>{formatMatchDate(match.match_date)}</span>
                </div>

                <div className="past-score-teams">
                  <div className="past-score-team">
                    {match.home_team_logo && (
                      <img
                        src={`${API_BASE_URL}${match.home_team_logo}`}
                        alt={`${match.home_team_name} logo`}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <strong>{match.home_team_name}</strong>
                  </div>

                  <div className="past-score-result" aria-label={`${match.home_score ?? 0} to ${match.away_score ?? 0}`}>
                    <span>{match.home_score ?? 0}</span>
                    <small>–</small>
                    <span>{match.away_score ?? 0}</span>
                  </div>

                  <div className="past-score-team">
                    {match.away_team_logo && (
                      <img
                        src={`${API_BASE_URL}${match.away_team_logo}`}
                        alt={`${match.away_team_name} logo`}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <strong>{match.away_team_name}</strong>
                  </div>
                </div>

                <div className="past-score-footer">
                  <span>📍 {match.venue || "KSL Main Stadium"}</span>
                  <span>Match details →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 5. TEAMS SECTION */}
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