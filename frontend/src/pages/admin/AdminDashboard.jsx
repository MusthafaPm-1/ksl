import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const admin = JSON.parse(
    localStorage.getItem("admin") || "null"
  );

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/admin/login");
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
            className="admin-nav-item active"
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
            className="admin-nav-item"
            onClick={() => navigate("/admin/matches")}
          >
            <span className="nav-icon">🔴</span> Live Control
          </button>
        </nav>

        <button
          className="admin-logout-button"
          onClick={handleLogout}
        >
          <span>🚪</span> Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <div className="admin-greeting">Welcome back, {admin?.username || "Admin"} 👋</div>
            <h1>Dashboard Overview</h1>
          </div>
        </div>

        <div className="admin-dashboard-grid">
          <div
            className="admin-dashboard-card"
            onClick={() => navigate("/admin/teams")}
          >
            <div className="admin-card-icon">⚽</div>
            <h2>Teams</h2>
            <p>Add, edit and manage league clubs, badges and rosters.</p>
            <button className="btn btn-secondary btn-sm">Manage Teams →</button>
          </div>

          <div
            className="admin-dashboard-card"
            onClick={() => navigate("/admin/fixtures")}
          >
            <div className="admin-card-icon">📅</div>
            <h2>Fixtures</h2>
            <p>Schedule upcoming matches, set dates, kick-off times and venues.</p>
            <button className="btn btn-secondary btn-sm">Manage Fixtures →</button>
          </div>

          <div
            className="admin-dashboard-card"
            onClick={() => navigate("/admin/matches")}
          >
            <div className="admin-card-icon">🔴</div>
            <h2>Live Match Control</h2>
            <p>Broadcast live events, update scores, cards, and timers in real time.</p>
            <button className="btn btn-primary btn-sm">Open Live Control →</button>
          </div>

          <div
            className="admin-dashboard-card"
            onClick={() => navigate("/results")}
          >
            <div className="admin-card-icon">🏆</div>
            <h2>League Results</h2>
            <p>Inspect finished matches and public league standings.</p>
            <button className="btn btn-secondary btn-sm">View Standings →</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;