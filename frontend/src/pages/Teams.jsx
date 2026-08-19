import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/teams`);
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error("Error loading teams:", err);
      setError("Unable to load teams. Please check server connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="section">
        <h2>Teams</h2>

        {loading ? (
          <div className="empty-card">
            <p>Loading teams...</p>
          </div>
        ) : error ? (
          <div className="empty-card">
            <p>{error}</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-card">
            <p>No teams registered yet.</p>
          </div>
        ) : (
          <div className="teams-grid">
            {teams.map((team) => (
              <div className="team-card" key={team.id}>
                <div className="team-logo">
                  {team.logo ? (
                    <img
                      src={`${API_BASE_URL}${team.logo}`}
                      alt={`${team.name} logo`}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="team-logo-fallback">⚽</span>
                  )}
                </div>

                <h3 className="team-name">{team.name}</h3>

                {team.short_name && (
                  <span className="team-short-name">{team.short_name}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Teams;