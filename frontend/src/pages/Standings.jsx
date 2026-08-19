import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function Standings() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings();
  }, []);

  async function fetchStandings() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/teams`);
      const teamList = response.data.teams || [];

      const sortedTeams = [...teamList].sort((a, b) => {
        if ((b.points ?? 0) !== (a.points ?? 0)) {
          return (b.points ?? 0) - (a.points ?? 0);
        }
        if ((b.goal_difference ?? 0) !== (a.goal_difference ?? 0)) {
          return (b.goal_difference ?? 0) - (a.goal_difference ?? 0);
        }
        return (b.goals_for ?? 0) - (a.goals_for ?? 0);
      });

      setTeams(sortedTeams);
    } catch (error) {
      console.error("Error loading standings:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="section">
        <h2>League Standings</h2>

        {loading ? (
          <div className="empty-card">
            <p>Loading standings...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-card">
            <p>No standings data available.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="standings-table">
              <thead>
                <tr>
                  <th className="pos-col">#</th>
                  <th className="team-header">Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GF</th>
                  <th>GA</th>
                  <th>GD</th>
                  <th className="pts-col">Pts</th>
                </tr>
              </thead>

              <tbody>
                {teams.map((team, index) => (
                  <tr key={team.id || index}>
                    <td className="pos-col">{index + 1}</td>

                    <td className="team-cell">
                      {team.logo && (
                        <img
                          src={`${API_BASE_URL}${team.logo}`}
                          alt={`${team.name} logo`}
                          className="team-table-logo"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <strong>{team.name}</strong>
                    </td>

                    <td>{team.played ?? 0}</td>
                    <td>{team.wins ?? 0}</td>
                    <td>{team.draws ?? 0}</td>
                    <td>{team.losses ?? 0}</td>
                    <td>{team.goals_for ?? 0}</td>
                    <td>{team.goals_against ?? 0}</td>
                    <td>{team.goal_difference ?? 0}</td>
                    <td className="pts-col">
                      <strong>{team.points ?? 0}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Standings;