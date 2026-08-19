import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function AdminMatchControl() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const [minute, setMinute] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            navigate("/admin/login");
            return;
        }

        fetchMatch();
    }, [id, navigate]);

    async function fetchMatch() {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("adminToken");

            const response = await axios.get(
                `http://localhost:5000/api/admin/matches/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMatch(response.data.match);
                setMinute(response.data.match.minute || 0);
            }

        } catch (error) {
            console.error("Load match error:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("admin");
                navigate("/admin/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to load match."
            );

        } finally {
            setLoading(false);
        }
    }

    async function updateMatch(data) {
        try {
            setActionLoading(true);
            setError("");

            const token = localStorage.getItem("adminToken");

            const response = await axios.put(
                `http://localhost:5000/api/admin/matches/${id}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                await fetchMatch();
            }

        } catch (error) {
            console.error("Match update error:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("admin");
                navigate("/admin/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to update match."
            );

        } finally {
            setActionLoading(false);
        }
    }

    async function startMatch() {
        await updateMatch({
            status: "live",
            minute: 1
        });
    }

    async function halfTime() {
        await updateMatch({
            status: "half-time"
        });
    }

    async function resumeMatch() {
        await updateMatch({
            status: "live"
        });
    }

    async function finishMatch() {
        const confirmed = window.confirm(
            "Are you sure you want to finish this match?"
        );

        if (!confirmed) {
            return;
        }

        await updateMatch({
            status: "finished"
        });
    }

    async function updateMinute() {
        const value = Number(minute);

        if (Number.isNaN(value) || value < 0) {
            setError("Please enter a valid minute.");
            return;
        }

        await updateMatch({
            minute: value
        });
    }

    async function addGoal(team) {
        if (!match) {
            return;
        }

        const homeScore = Number(match.home_score || 0);
        const awayScore = Number(match.away_score || 0);

        if (team === "home") {
            await updateMatch({
                home_score: homeScore + 1
            });
        } else {
            await updateMatch({
                away_score: awayScore + 1
            });
        }
    }

    function getStatusLabel(status) {
        switch (status) {
            case "scheduled":
                return "SCHEDULED";

            case "live":
                return "LIVE";

            case "half-time":
                return "HALF TIME";

            case "finished":
                return "FINISHED";

            case "postponed":
                return "POSTPONED";

            default:
                return status?.toUpperCase();
        }
    }

    function getStatusClass(status) {
        switch (status) {
            case "live":
                return "live";

            case "half-time":
                return "half-time";

            case "finished":
                return "finished";

            case "postponed":
                return "postponed";

            default:
                return "scheduled";
        }
    }

    function handleLogout() {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        navigate("/admin/login");
    }

    if (loading) {
        return (
            <div className="admin-layout">

                <aside className="admin-sidebar">
                    <div className="admin-sidebar-logo">
                        ⚽ Kocheri Super League
                        <span>ADMIN</span>
                    </div>
                </aside>

                <main className="admin-main">
                    <div className="admin-message">
                        Loading match...
                    </div>
                </main>

            </div>
        );
    }

    if (!match) {
        return (
            <div className="admin-layout">

                <aside className="admin-sidebar">
                    <div className="admin-sidebar-logo">
                        ⚽ Kocheri Super League
                        <span>ADMIN</span>
                    </div>
                </aside>

                <main className="admin-main">

                    <div className="admin-error">
                        Match not found.
                    </div>

                    <button
                        className="admin-primary-button"
                        onClick={() =>
                            navigate("/admin/matches")
                        }
                    >
                        ← Back to Matches
                    </button>

                </main>

            </div>
        );
    }

    return (
        <div className="admin-layout">

            {/* SIDEBAR */}

            <aside className="admin-sidebar">

                <div className="admin-sidebar-logo">
                    ⚽ Kocheri Super League
                    <span>ADMIN</span>
                </div>

                <nav className="admin-sidebar-nav">

                    <button
                        className="admin-nav-item"
                        onClick={() =>
                            navigate("/admin/dashboard")
                        }
                    >
                        🏠 Dashboard
                    </button>

                    <button
                        className="admin-nav-item"
                        onClick={() =>
                            navigate("/admin/teams")
                        }
                    >
                        ⚽ Teams
                    </button>

                    <button
                        className="admin-nav-item"
                        onClick={() =>
                            navigate("/admin/fixtures")
                        }
                    >
                        📅 Fixtures
                    </button>

                    <button
                        className="admin-nav-item active"
                        onClick={() =>
                            navigate("/admin/matches")
                        }
                    >
                        🔴 Matches
                    </button>

                    <button
                        className="admin-nav-item"
                        onClick={() =>
                            navigate("/admin/results")
                        }
                    >
                        🏆 Results
                    </button>

                </nav>

                <button
                    className="admin-logout-button"
                    onClick={handleLogout}
                >
                    🚪 Logout
                </button>

            </aside>


            {/* MAIN */}

            <main className="admin-main">

                <div className="admin-page-header">

                    <div>
                        <button
                            className="admin-edit-button"
                            onClick={() =>
                                navigate("/admin/matches")
                            }
                            style={{
                                marginBottom: "15px"
                            }}
                        >
                            ← Back to Matches
                        </button>

                        <h1>
                            Match Control
                        </h1>

                        <p>
                            Manage the live match.
                        </p>
                    </div>

                </div>


                {error && (
                    <div className="admin-error">
                        {error}
                    </div>
                )}


                {/* MATCH SCOREBOARD */}

                <div className="admin-form-card">

                    <div
                        style={{
                            textAlign: "center"
                        }}
                    >

                        <div
                            style={{
                                marginBottom: "20px"
                            }}
                        >

                            <span
                                className={`match-status ${getStatusClass(
                                    match.status
                                )}`}
                            >
                                {getStatusLabel(
                                    match.status
                                )}
                            </span>

                        </div>


                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "1fr auto 1fr",
                                alignItems: "center",
                                gap: "30px"
                            }}
                        >

                            {/* HOME */}

                            <div>

                                <div
                                    className="admin-team-logo"
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        margin: "0 auto 15px"
                                    }}
                                >

                                    {match.home_team_logo ? (
                                        <img
                                            src={`http://localhost:5000${match.home_team_logo}`}
                                            alt={
                                                match.home_team_name
                                            }
                                        />
                                    ) : (
                                        "⚽"
                                    )}

                                </div>

                                <h2>
                                    {match.home_team_name}
                                </h2>

                            </div>


                            {/* SCORE */}

                            <div>

                                <div
                                    style={{
                                        fontSize: "48px",
                                        fontWeight: "800",
                                        marginBottom: "10px"
                                    }}
                                >
                                    {match.home_score || 0}
                                    {" - "}
                                    {match.away_score || 0}
                                </div>


                                {(match.status === "live" ||
                                    match.status === "half-time") && (

                                    <div
                                        style={{
                                            fontSize: "20px",
                                            fontWeight: "700"
                                        }}
                                    >
                                        {match.minute || 0}'
                                    </div>

                                )}

                            </div>


                            {/* AWAY */}

                            <div>

                                <div
                                    className="admin-team-logo"
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        margin: "0 auto 15px"
                                    }}
                                >

                                    {match.away_team_logo ? (
                                        <img
                                            src={`http://localhost:5000${match.away_team_logo}`}
                                            alt={
                                                match.away_team_name
                                            }
                                        />
                                    ) : (
                                        "⚽"
                                    )}

                                </div>

                                <h2>
                                    {match.away_team_name}
                                </h2>

                            </div>

                        </div>

                    </div>

                </div>


                {/* MATCH CONTROLS */}

                <div className="admin-form-card">

                    <h2>
                        Match Controls
                    </h2>


                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            marginTop: "20px"
                        }}
                    >

                        {match.status === "scheduled" && (

                            <button
                                className="admin-primary-button"
                                onClick={startMatch}
                                disabled={actionLoading}
                            >
                                ▶ Start Match
                            </button>

                        )}


                        {match.status === "live" && (

                            <button
                                className="admin-primary-button"
                                onClick={halfTime}
                                disabled={actionLoading}
                            >
                                ⏸ Half Time
                            </button>

                        )}


                        {match.status === "half-time" && (

                            <button
                                className="admin-primary-button"
                                onClick={resumeMatch}
                                disabled={actionLoading}
                            >
                                ▶ Resume Match
                            </button>

                        )}


                        {(match.status === "live" ||
                            match.status === "half-time") && (

                            <button
                                className="admin-delete-button"
                                onClick={finishMatch}
                                disabled={actionLoading}
                            >
                                🏁 Finish Match
                            </button>

                        )}

                    </div>

                </div>


                {/* SCORE CONTROLS */}

                {(match.status === "live" ||
                    match.status === "half-time") && (

                    <div className="admin-form-card">

                        <h2>
                            Score Control
                        </h2>


                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "1fr 1fr",
                                gap: "20px",
                                marginTop: "20px"
                            }}
                        >

                            <div
                                style={{
                                    textAlign: "center"
                                }}
                            >

                                <h3>
                                    {match.home_team_name}
                                </h3>

                                <div
                                    style={{
                                        fontSize: "36px",
                                        fontWeight: "800",
                                        margin: "10px"
                                    }}
                                >
                                    {match.home_score || 0}
                                </div>

                                <button
                                    className="admin-primary-button"
                                    onClick={() =>
                                        addGoal("home")
                                    }
                                    disabled={actionLoading}
                                >
                                    ⚽ + Goal
                                </button>

                            </div>


                            <div
                                style={{
                                    textAlign: "center"
                                }}
                            >

                                <h3>
                                    {match.away_team_name}
                                </h3>

                                <div
                                    style={{
                                        fontSize: "36px",
                                        fontWeight: "800",
                                        margin: "10px"
                                    }}
                                >
                                    {match.away_score || 0}
                                </div>

                                <button
                                    className="admin-primary-button"
                                    onClick={() =>
                                        addGoal("away")
                                    }
                                    disabled={actionLoading}
                                >
                                    ⚽ + Goal
                                </button>

                            </div>

                        </div>

                    </div>

                )}


                {/* MINUTE CONTROL */}

                {(match.status === "live" ||
                    match.status === "half-time") && (

                    <div className="admin-form-card">

                        <h2>
                            Match Minute
                        </h2>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginTop: "15px"
                            }}
                        >

                            <input
                                type="number"
                                min="0"
                                max="120"
                                value={minute}
                                onChange={(event) =>
                                    setMinute(
                                        event.target.value
                                    )
                                }
                                style={{
                                    maxWidth: "150px"
                                }}
                            />

                            <span>
                                minutes
                            </span>

                            <button
                                className="admin-primary-button"
                                onClick={updateMinute}
                                disabled={actionLoading}
                            >
                                Update Minute
                            </button>

                        </div>

                    </div>

                )}


                {/* MATCH INFORMATION */}

                <div className="admin-form-card">

                    <h2>
                        Match Information
                    </h2>

                    <div
                        style={{
                            marginTop: "15px",
                            lineHeight: "2"
                        }}
                    >

                        <p>
                            <strong>Match ID:</strong>{" "}
                            {match.id}
                        </p>

                        <p>
                            <strong>Status:</strong>{" "}
                            {getStatusLabel(
                                match.status
                            )}
                        </p>

                        <p>
                            <strong>Venue:</strong>{" "}
                            {match.venue || "-"}
                        </p>

                        <p>
                            <strong>Match Date:</strong>{" "}
                            {new Date(
                                match.match_date
                            ).toLocaleString("en-IN")}
                        </p>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default AdminMatchControl;