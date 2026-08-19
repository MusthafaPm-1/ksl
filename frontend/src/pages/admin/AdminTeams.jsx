import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [logo, setLogo] = useState(null);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editShortName, setEditShortName] = useState("");
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
    fetchTeams();
  }, [navigate]);

  async function fetchTeams() {
    import { API_BASE_URL } from "../../config/api";

// Fetching teams:
const response = await axios.get(`${API_BASE_URL}/api/teams`);

// Team logos:
<img src={`${API_BASE_URL}${team.logo}`} alt={team.name} />
  }

  async function handleAddTeam(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("short_name", shortName);
    if (logo) {
      formData.append("logo", logo);
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/teams",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage(`Team "${name}" added successfully!`);
        setName("");
        setShortName("");
        setLogo(null);
        const fileInput = document.getElementById("team-logo-upload");
        if (fileInput) fileInput.value = "";
        fetchTeams();
      }
    } catch (err) {
      console.error("Error creating team:", err);
      setError(err.response?.data?.message || "Failed to create team.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(team) {
    setEditingTeamId(team.id);
    setEditName(team.name);
    setEditShortName(team.short_name || "");
    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditingTeamId(null);
    setEditName("");
    setEditShortName("");
  }

  async function handleUpdateTeam(teamId) {
    setMessage("");
    setError("");
    const token = localStorage.getItem("adminToken");

    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/teams/${teamId}`,
        {
          name: editName,
          short_name: editShortName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage("Team updated successfully!");
        setEditingTeamId(null);
        fetchTeams();
      }
    } catch (err) {
      console.error("Error updating team:", err);
      setError(err.response?.data?.message || "Failed to update team.");
    }
  }

  async function handleDeleteTeam(teamId, teamName) {
    if (!window.confirm(`Are you sure you want to delete "${teamName}"?`)) {
      return;
    }

    setMessage("");
    setError("");
    const token = localStorage.getItem("adminToken");

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/admin/teams/${teamId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage(`Team "${teamName}" deleted.`);
        fetchTeams();
      }
    } catch (err) {
      console.error("Error deleting team:", err);
      setError(err.response?.data?.message || "Failed to delete team.");
    }
  }

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
            className="admin-nav-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            <span className="nav-icon">🏠</span> Dashboard
          </button>
          <button
            className="admin-nav-item active"
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

        <button className="admin-logout-button" onClick={handleLogout}>
          <span>🚪</span> Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <div className="admin-greeting">Admin / Management</div>
            <h1>Manage League Teams</h1>
          </div>
        </div>

        {message && <div className="admin-success-alert">{message}</div>}
        {error && <div className="admin-error-alert">{error}</div>}

        {/* CREATE TEAM FORM */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Add New Team</h3>
          </div>

          <form onSubmit={handleAddTeam} className="admin-team-form">
            <div className="admin-form-grid">
              <div className="form-group">
                <label htmlFor="teamName">Full Team Name *</label>
                <input
                  id="teamName"
                  type="text"
                  placeholder="e.g. Kocheri United"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="teamShortName">Short Code *</label>
                <input
                  id="teamShortName"
                  type="text"
                  placeholder="e.g. KUTD (2-4 chars)"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  maxLength={5}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="team-logo-upload">Club Crest (PNG/JPG)</label>
                <input
                  id="team-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogo(e.target.files[0])}
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Adding Club..." : "+ Add Team"}
              </button>
            </div>
          </form>
        </div>

        {/* TEAMS TABLE */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Registered Clubs ({teams.length})</h3>
          </div>

          {loading ? (
            <div className="empty-card">
              <p>Loading teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="empty-card">
              <p>No teams registered yet. Use the form above to add one.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th className="pos-col">#</th>
                    <th className="team-header">Team Name</th>
                    <th>Short Code</th>
                    <th>Played</th>
                    <th>Wins</th>
                    <th>Points</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, idx) => (
                    <tr key={team.id || idx}>
                      <td className="pos-col">{idx + 1}</td>
                      <td className="team-cell">
                        {team.logo && (
                          <img
                            src={`http://localhost:5000${team.logo}`}
                            alt={`${team.name} logo`}
                            className="team-table-logo"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        {editingTeamId === team.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="inline-edit-input"
                          />
                        ) : (
                          <strong>{team.name}</strong>
                        )}
                      </td>

                      <td>
                        {editingTeamId === team.id ? (
                          <input
                            type="text"
                            value={editShortName}
                            onChange={(e) =>
                              setEditShortName(e.target.value.toUpperCase())
                            }
                            maxLength={5}
                            className="inline-edit-input"
                          />
                        ) : (
                          <span className="team-short-name">
                            {team.short_name}
                          </span>
                        )}
                      </td>

                      <td>{team.played ?? 0}</td>
                      <td>{team.wins ?? 0}</td>
                      <td className="pts-col">{team.points ?? 0}</td>

                      <td style={{ textAlign: "right" }}>
                        {editingTeamId === team.id ? (
                          <div className="table-actions">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleUpdateTeam(team.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="table-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => startEditing(team)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger-outline btn-sm"
                              onClick={() =>
                                handleDeleteTeam(team.id, team.name)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        )}
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

export default AdminTeams;