const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2/promise");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET || "ksl_secret_key_2026";

// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
    "http://localhost:5173",
    "https://ksl-live.vercel.app"
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin, such as Postman/server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("⚠️ CORS blocked origin:", origin);
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
);

app.use(express.json());

// ======================================================
// STATIC UPLOADS
// ======================================================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// ======================================================
// MULTER STORAGE
// ======================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `team_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage
});

// ======================================================
// MYSQL CONNECTION
// ======================================================

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "defaultdb",

    ssl:
        process.env.DB_HOST &&
        process.env.DB_HOST !== "localhost"
            ? {
                  rejectUnauthorized: false
              }
            : undefined,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ======================================================
// TEST DATABASE CONNECTION
// ======================================================

(async () => {
    try {
        const connection = await pool.getConnection();

        console.log("✅ MySQL Connected Successfully");
        console.log(`📊 Database: ${process.env.DB_NAME}`);
        console.log(`🌐 DB Host: ${process.env.DB_HOST}`);
        console.log(`🔌 DB Port: ${process.env.DB_PORT}`);

        connection.release();
    } catch (error) {
        console.error("❌ MySQL Connection Failed:");
        console.error(error);
    }
})();

// ======================================================
// SOCKET.IO
// ======================================================

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔌 Socket disconnected:", socket.id);
    });
});

// ======================================================
// ADMIN AUTH MIDDLEWARE
// ======================================================

function verifyAdminToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "No authorization token provided"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Invalid authorization format"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.admin = decoded;

        next();
    } catch (err) {
        console.error(
            "JWT verification failed:",
            err.message
        );

        return res.status(403).json({
            message:
                "Invalid or expired admin session. Please log in again."
        });
    }
}

// ======================================================
// BASIC HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "KSL Backend is running",
        port: PORT
    });
});

// ======================================================
// DATABASE HEALTH CHECK
// ======================================================

app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS connected");

        res.json({
            success: true,
            database: rows[0].connected === 1
        });
    } catch (err) {
        console.error("❌ Database health check failed:");
        console.error(err);

        res.status(500).json({
            success: false,
            database: false,
            error: err.message
        });
    }
});

// ======================================================
// PUBLIC ROUTES
// ======================================================

// ------------------------------------------------------
// GET ALL TEAMS
// ------------------------------------------------------

app.get("/api/teams", async (req, res) => {
    try {
        const [teams] = await pool.query(
            `
            SELECT *
            FROM teams
            ORDER BY
                points DESC,
                goal_difference DESC,
                goals_for DESC
            `
        );

        console.log(
            `✅ /api/teams returned ${teams.length} teams`
        );

        res.json({
            teams
        });
    } catch (err) {
        console.error("❌ /api/teams DATABASE ERROR:");
        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ------------------------------------------------------
// GET ALL MATCHES
// ------------------------------------------------------

app.get("/api/matches", async (req, res) => {
    try {
        const [matches] = await pool.query(`
            SELECT
                m.*,
                h.name AS home_team_name,
                h.logo AS home_team_logo,
                a.name AS away_team_name,
                a.logo AS away_team_logo
            FROM matches m
            JOIN teams h
                ON m.home_team_id = h.id
            JOIN teams a
                ON m.away_team_id = a.id
            ORDER BY m.match_date ASC
        `);

        console.log(
            `✅ /api/matches returned ${matches.length} matches`
        );

        res.json({
            matches
        });
    } catch (err) {
        console.error("❌ /api/matches DATABASE ERROR:");
        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ======================================================
// SINGLE MATCH
// ======================================================

async function getSingleMatch(req, res) {
    try {
        const matchId = req.params.id;

        const [rows] = await pool.query(
            `
            SELECT
                m.*,
                h.name AS home_team_name,
                h.logo AS home_team_logo,
                a.name AS away_team_name,
                a.logo AS away_team_logo
            FROM matches m
            LEFT JOIN teams h
                ON m.home_team_id = h.id
            LEFT JOIN teams a
                ON m.away_team_id = a.id
            WHERE m.id = ?
            `,
            [matchId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                message: `Match with ID ${matchId} not found`
            });
        }

        const match = rows[0];

        try {
            const [events] = await pool.query(
                `
                SELECT *
                FROM match_events
                WHERE match_id = ?
                ORDER BY minute ASC, id ASC
                `,
                [matchId]
            );

            match.events = events || [];
        } catch (eventError) {
            console.error(
                "⚠️ Could not load match events:",
                eventError.message
            );

            match.events = [];
        }

        res.json({
            match
        });
    } catch (err) {
        console.error(
            "❌ SQL Error in match endpoint:"
        );

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

app.get("/api/matches/:id", getSingleMatch);

app.get("/api/match/:id", getSingleMatch);

// ======================================================
// ADMIN LOGIN
// ======================================================

app.post("/api/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (
            username === "admin" &&
            password === "admin123"
        ) {
            const token = jwt.sign(
                {
                    username
                },
                JWT_SECRET,
                {
                    expiresIn: "24h"
                }
            );

            return res.json({
                success: true,
                token,
                admin: {
                    username: "Admin"
                }
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid admin credentials"
        });
    } catch (err) {
        console.error(
            "❌ Admin login error:",
            err
        );

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// ======================================================
// ADMIN - CREATE TEAM
// ======================================================

app.post(
    "/api/admin/teams",
    verifyAdminToken,
    upload.single("logo"),
    async (req, res) => {
        try {
            const {
                name,
                short_name
            } = req.body;

            const logoUrl = req.file
                ? `/uploads/${req.file.filename}`
                : null;

            const [result] = await pool.query(
                `
                INSERT INTO teams
                (
                    name,
                    short_name,
                    logo,
                    played,
                    wins,
                    draws,
                    losses,
                    goals_for,
                    goals_against,
                    goal_difference,
                    points
                )
                VALUES
                (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)
                `,
                [
                    name,
                    short_name,
                    logoUrl
                ]
            );

            res.json({
                success: true,
                teamId: result.insertId
            });
        } catch (err) {
            console.error(
                "❌ Create team error:",
                err
            );

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ======================================================
// ADMIN - UPDATE TEAM
// ======================================================

app.put(
    "/api/admin/teams/:id",
    verifyAdminToken,
    async (req, res) => {
        try {
            const {
                name,
                short_name
            } = req.body;

            await pool.query(
                `
                UPDATE teams
                SET
                    name = ?,
                    short_name = ?
                WHERE id = ?
                `,
                [
                    name,
                    short_name,
                    req.params.id
                ]
            );

            res.json({
                success: true
            });
        } catch (err) {
            console.error(
                "❌ Update team error:",
                err
            );

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ======================================================
// ADMIN - DELETE TEAM
// ======================================================

app.delete(
    "/api/admin/teams/:id",
    verifyAdminToken,
    async (req, res) => {
        try {
            await pool.query(
                "DELETE FROM teams WHERE id = ?",
                [req.params.id]
            );

            res.json({
                success: true
            });
        } catch (err) {
            console.error(
                "❌ Delete team error:",
                err
            );

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ======================================================
// ADMIN - CREATE MATCH
// ======================================================

app.post(
    "/api/admin/matches",
    verifyAdminToken,
    async (req, res) => {
        try {
            const {
                home_team_id,
                away_team_id,
                match_date,
                venue
            } = req.body;

            const [result] = await pool.query(
                `
                INSERT INTO matches
                (
                    home_team_id,
                    away_team_id,
                    match_date,
                    venue,
                    status,
                    home_score,
                    away_score
                )
                VALUES
                (?, ?, ?, ?, 'scheduled', 0, 0)
                `,
                [
                    home_team_id,
                    away_team_id,
                    match_date,
                    venue
                ]
            );

            res.json({
                success: true,
                matchId: result.insertId
            });
        } catch (err) {
            console.error(
                "❌ Create match error:",
                err
            );

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ======================================================
// ADMIN - DELETE MATCH
// ======================================================

app.delete(
    "/api/admin/matches/:id",
    verifyAdminToken,
    async (req, res) => {
        try {
            await pool.query(
                "DELETE FROM matches WHERE id = ?",
                [req.params.id]
            );

            res.json({
                success: true
            });
        } catch (err) {
            console.error(
                "❌ Delete match error:",
                err
            );

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ======================================================
// ADMIN - UPDATE LIVE SCORE
// ======================================================

app.put(
    "/api/admin/matches/:id/score",
    verifyAdminToken,
    async (req, res) => {
        try {
            const {
                home_score,
                away_score
            } = req.body;

            const matchId = req.params.id;

            await pool.query(
                `
                UPDATE matches
                SET
                    home_score = ?,
                    away_score = ?,
                    status = 'live'
                WHERE id = ?
                `,
                [
                    home_score,
                    away_score,
                    matchId
                ]
            );

            const [rows] = await pool.query(
                `
                SELECT
                    m.*,
                    h.name AS home_team_name,
                    h.logo AS home_team_logo,
                    a.name AS away_team_name,
                    a.logo AS away_team_logo
                FROM matches m
                JOIN teams h
                    ON m.home_team_id = h.id
                JOIN teams a
                    ON m.away_team_id = a.id
                WHERE m.id = ?
                `,
                [matchId]
            );

            if (rows.length > 0) {
                io.emit(
                    "matchUpdate",
                    rows[0]
                );
            }

            res.json({
                success: true
            });
        } catch (err) {
            console.error(
                "❌ Update score error:",
                err
            );

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ======================================================
// ADMIN - UPDATE MATCH STATUS
// ======================================================

app.put(
    "/api/admin/matches/:id/status",
    verifyAdminToken,
    async (req, res) => {
        try {
            const matchId = req.params.id;
            const { status } = req.body;

            await pool.query(
                `
                UPDATE matches
                SET status = ?
                WHERE id = ?
                `,
                [
                    status,
                    matchId
                ]
            );

            const [rows] = await pool.query(
                `
                SELECT
                    m.*,
                    h.name AS home_team_name,
                    h.logo AS home_team_logo,
                    a.name AS away_team_name,
                    a.logo AS away_team_logo
                FROM matches m
                JOIN teams h
                    ON m.home_team_id = h.id
                JOIN teams a
                    ON m.away_team_id = a.id
                WHERE m.id = ?
                `,
                [matchId]
            );

            if (rows.length > 0) {
                io.emit(
                    "matchUpdate",
                    rows[0]
                );
            }

            res.json({
                success: true,
                status
            });
        } catch (err) {
            console.error(
                "❌ Update match status error:",
                err
            );

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ======================================================
// ADMIN - END MATCH
// ======================================================

app.put(
    "/api/admin/matches/:id/end",
    verifyAdminToken,
    async (req, res) => {
        try {
            const matchId = req.params.id;

            await pool.query(
                `
                UPDATE matches
                SET status = 'completed'
                WHERE id = ?
                `,
                [matchId]
            );

            const [rows] = await pool.query(
                `
                SELECT
                    m.*,
                    h.name AS home_team_name,
                    h.logo AS home_team_logo,
                    a.name AS away_team_name,
                    a.logo AS away_team_logo
                FROM matches m
                JOIN teams h
                    ON m.home_team_id = h.id
                JOIN teams a
                    ON m.away_team_id = a.id
                WHERE m.id = ?
                `,
                [matchId]
            );

            if (rows.length > 0) {
                io.emit(
                    "matchUpdate",
                    rows[0]
                );
            }

            res.json({
                success: true
            });
        } catch (err) {
            console.error(
                "❌ End match error:",
                err
            );

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ======================================================
// ADMIN - ADD MATCH EVENT
// ======================================================

app.post(
    "/api/admin/matches/:id/events",
    verifyAdminToken,
    async (req, res) => {
        try {
            const matchId = req.params.id;

            const {
                minute,
                event_type,
                team_id,
                player_name
            } = req.body;

            // Create the table if it doesn't exist
            await pool.query(`
                CREATE TABLE IF NOT EXISTS match_events (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    match_id INT NOT NULL,
                    team_id INT NOT NULL,
                    event_type VARCHAR(50) NOT NULL,
                    player_name VARCHAR(255) NOT NULL,
                    minute INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            const [result] = await pool.query(
                `
                INSERT INTO match_events
                (
                    match_id,
                    team_id,
                    event_type,
                    player_name,
                    minute
                )
                VALUES
                (?, ?, ?, ?, ?)
                `,
                [
                    matchId,
                    team_id,
                    event_type,
                    player_name,
                    minute || 0
                ]
            );

            const newEvent = {
                id: result.insertId,
                match_id: parseInt(matchId),
                team_id,
                event_type,
                player_name,
                minute: minute || 0
            };

            io.emit(
                "matchEventAdded",
                {
                    matchId: parseInt(matchId),
                    event: newEvent
                }
            );

            res.json({
                success: true,
                eventId: result.insertId
            });
        } catch (err) {
            console.error(
                "❌ Error logging match event:",
                err
            );

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
    console.error("❌ GLOBAL SERVER ERROR:");
    console.error(err);

    res.status(500).json({
        success: false,
        error: err.message
    });
});

// ======================================================
// START SERVER
// ======================================================

server.listen(PORT, "0.0.0.0", () => {
    console.log(
        `🚀 KSL Backend & Socket.IO running on port ${PORT}`
    );

    console.log(
        `🌐 Environment: ${
            process.env.NODE_ENV || "development"
        }`
    );
});