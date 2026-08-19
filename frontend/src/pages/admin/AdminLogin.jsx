import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/login",
        {
          username,
          password,
        }
      );

      if (response.data.success) {
        localStorage.setItem("adminToken", response.data.token);

        localStorage.setItem(
          "admin",
          JSON.stringify(response.data.admin)
        );

        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Login failed. Please check credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-badge">⚡ KSL Admin Portal</div>
          <h2>Admin Login</h2>
          <p className="admin-login-subtitle">
            Sign in to manage teams, fixtures, and live matches.
          </p>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleLogin} className="admin-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter admin username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;