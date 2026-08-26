import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";  

function AdminFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [navigate]);

  async function loadData() {
    setLoading(true);
    try {
      const [matchesRes, teamsRes] = await Promise.all([
  axios.get(`${API_BASE_URL}/api/matches`),
  axios.get(`${API_BASE_URL}/api/teams`),
]);


      const scheduledMatches = (matchesRes.data.matches || []).filter(
        (m) => m.status === "scheduled"
      );

      setFixtures(scheduledMatches);
      setTeams(teamsRes.data.teams || []);
    } catch (err) {
      console.error("Error loading fixture data:", err);
      setError("Failed to load fixtures and teams.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFixture(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (homeTeamId === awayTeamId) {
      setError("Home and Away teams must be different.");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("adminToken");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/matches`,
        {
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          match_date: matchDate,
          venue: venue.trim() || "KSL Main Stadium",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage("Fixture scheduled successfully!");
        setHomeTeamId("");
        setAwayTeamId("");
        setMatchDate("");
        setVenue("");
        loadData();
      }
    } catch (err) {
      console.error("Error creating fixture:", err);
      setError(err.response?.data?.message || err.message || "Failed to schedule fixture.");
    } finally {
      setSubmitting(false);
    }
  }
    async function handleDeleteFixture(matchId) {
    if (!window.confirm("Are you sure you want to cancel and delete this fixture?")) {
      return;
    }

    setMessage("");
    setError("");
    const token = localStorage.getItem("adminToken");

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/admin/matches/${matchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage("Fixture deleted successfully.");
        loadData();
      }
    } catch (err) {
      console.error("Error deleting fixture:", err);
      setError(err.response?.data?.message || err.message || "Failed to delete fixture.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return "TBD";

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "TBD";

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
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-brand">⚽ Kocheri Super League</div>
          <span className="admin-pill">ADMIN PANEL</span>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            <span className="nav-icon">🏠</span> Dashboard
          </button>
          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin/teams")}
          >
            <span className="nav-icon">⚽</span> Teams
          </button>
          <button
            className="admin-nav-item active"
            onClick={() => navigate("/admin/fixtures")}
          >
            <span className="nav-icon">📅</span> Fixtures
          </button>
          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin/matches")}
          >
            <span className="nav-icon">🔴</span> Live Control
          </button>
        </nav>

        <button className="admin-logout-button" onClick={handleLogout}>
          <span>🚪</span> Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <div className="admin-greeting">Admin / Scheduling</div>
            <h1>Manage Fixtures</h1>
          </div>
        </div>

        {message && <div className="admin-success-alert">{message}</div>}
        {error && <div className="admin-error-alert">{error}</div>}

        {/* CREATE FIXTURE FORM */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Schedule New Fixture</h3>
          </div>

          <form onSubmit={handleCreateFixture} className="admin-team-form">
            <div className="admin-form-grid">
              <div className="form-group">
                <label htmlFor="homeTeam">Home Team *</label>
                <select
                  id="homeTeam"
                  value={homeTeamId}
                  onChange={(e) => setHomeTeamId(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">Select Home Team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.short_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="awayTeam">Away Team *</label>
                <select
                  id="awayTeam"
                  value={awayTeamId}
                  onChange={(e) => setAwayTeamId(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">Select Away Team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.short_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="matchDate">Match Date & Time *</label>
                <input
                  id="matchDate"
                  type="datetime-local"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="venue">Venue</label>
                <input
                  id="venue"
                  type="text"
                  placeholder="e.g. KSL Main Stadium"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Scheduling..." : "+ Schedule Match"}
              </button>
            </div>
          </form>
        </div>

        {/* SCHEDULED FIXTURES LIST */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Upcoming Fixtures ({fixtures.length})</h3>
          </div>

          {loading ? (
            <div className="empty-card">
              <p>Loading fixtures...</p>
            </div>
          ) : fixtures.length === 0 ? (
            <div className="empty-card">
              <p>No upcoming fixtures scheduled. Use the form above to add one.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th className="pos-col">#</th>
                    <th className="team-header">Home Team</th>
                    <th>VS</th>
                    <th className="team-header">Away Team</th>
                    <th>Date & Time</th>
                    <th>Venue</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fixtures.map((m, idx) => (
                    <tr key={m.id || idx}>
                      <td className="pos-col">{idx + 1}</td>
                      <td className="team-cell">
                        {m.home_team_logo && (
                          <img
                            src={`http://localhost:5000${m.home_team_logo}`}
                            alt=""
                            className="team-table-logo"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        )}
                        <strong>{m.home_team_name}</strong>
                      </td>
                      <td style={{ color: "var(--accent-gold)", fontWeight: 700 }}>VS</td>
                      <td className="team-cell">
                        {m.away_team_logo && (
                          <img
                            src={`http://localhost:5000${m.away_team_logo}`}
                            alt=""
                            className="team-table-logo"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        )}
                        <strong>{m.away_team_name}</strong>
                      </td>
                      <td>{formatDateTime(m.match_date)}</td>
                      <td>📍 {m.venue || "Main Stadium"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => handleDeleteFixture(m.id)}
                        >
                          Cancel / Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminFixtures;