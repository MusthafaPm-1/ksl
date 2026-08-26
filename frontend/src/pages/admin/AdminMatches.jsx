import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchMatches();
  }, [navigate]);

  async function fetchMatches() {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/matches`);
      setMatches(response.data.matches || []);
    } catch (err) {
      console.error("Error loading matches:", err);
      setError("Failed to load matches list.");
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return "TBD";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/\\b(am|pm)\\b/gi, (period) => period.toUpperCase());
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  }

  const filteredMatches = matches.filter((m) => {
    if (filter === "all") return true;
    const s = (m.status || "").toLowerCase().replace(/[-_\s]/g, "");
    if (filter === "live") return s === "live" || s === "halftime" || s === "ht";
    if (filter === "completed") return s === "completed" || s === "finished" || s === "ft";
    if (filter === "scheduled") return s === "scheduled";
    return m.status === filter;
  });

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
            className="admin-nav-item"
            onClick={() => navigate("/admin/fixtures")}
          >
            <span className="nav-icon">📅</span> Fixtures
          </button>
          <button
            className="admin-nav-item active"
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
            <div className="admin-greeting">Admin / Operations</div>
            <h1>Matches & Live Center</h1>
          </div>
        </div>

        {message && <div className="admin-success-alert">{message}</div>}
        {error && <div className="admin-error-alert">{error}</div>}

        {/* FILTER BAR */}
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, marginRight: "8px" }}>
              FILTER STATUS:
            </span>
            {["all", "live", "scheduled", "completed"].map((st) => (
              <button
                key={st}
                className={`btn btn-sm ${filter === st ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilter(st)}
                style={{ textTransform: "capitalize" }}
              >
                {st === "live" ? "🔴 Live / HT" : st}
              </button>
            ))}
          </div>
        </div>
                {/* MATCHES LIST */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Matches ({filteredMatches.length})</h3>
          </div>

          {loading ? (
            <div className="empty-card">
              <p>Loading matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="empty-card">
              <p>No matches found under this filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th className="pos-col">#</th>
                    <th className="team-header">Home</th>
                    <th>Score</th>
                    <th className="team-header">Away</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Live Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((m, idx) => {
                    const normStatus = (m.status || "").toLowerCase().replace(/[-_\s]/g, "");
                    return (
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
                        <td style={{ fontWeight: 700, color: "var(--accent-gold)", fontSize: "1.1rem" }}>
                          {normStatus === "scheduled" ? "vs" : `${m.home_score ?? 0} - ${m.away_score ?? 0}`}
                        </td>
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
                        <td>
                          <span
                            className={`status-badge ${
                              normStatus === "live"
                                ? "status-live"
                                : normStatus === "halftime" || normStatus === "ht"
                                ? "status-halftime"
                                : normStatus === "completed" || normStatus === "finished" || normStatus === "ft"
                                ? "status-completed"
                                : "status-scheduled"
                            }`}
                          >
                            {normStatus === "live"
                              ? "● LIVE"
                              : normStatus === "halftime" || normStatus === "ht"
                              ? "⏸ HALF TIME"
                              : normStatus === "completed" || normStatus === "finished" || normStatus === "ft"
                              ? "FULL TIME"
                              : "SCHEDULED"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate(`/admin/live/${m.id}`)}
                            >
                              ⚙ Manage / Edit
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/match/${m.id}`)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminMatches;