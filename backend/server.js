require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");
const multer = require("multer");
const jwt = require("jsonwebtoken");

// ==========================================
// APP SETUP
// ==========================================

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET || "ksl_secret_key_2026";

// ==========================================
// CORS
// ==========================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://ksl-live.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin
      // (Postman, server-to-server, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);

// ==========================================
// EXPRESS MIDDLEWARE
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// UPLOADS
// ==========================================

const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));

// ==========================================
// MULTER
// ==========================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);

    cb(
      null,
      `team_${Date.now()}${ext}`
    );
  },
});

const upload = multer({
  storage,
});

// ==========================================
// MYSQL CONNECTION POOL
// ==========================================

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  ssl: {
    rejectUnauthorized: false,
  },
};

console.log("==========================================");
console.log("KSL BACKEND STARTING");
console.log("==========================================");

console.log("Environment:", process.env.NODE_ENV || "production");
console.log("DB Host:", process.env.DB_HOST);
console.log("DB Port:", process.env.DB_PORT);
console.log("DB User:", process.env.DB_USER);
console.log("DB Name:", process.env.DB_NAME);
console.log("==========================================");

// Create MySQL pool
const pool = mysql.createPool(dbConfig);

// ==========================================
// TEST DATABASE CONNECTION
// ==========================================

async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();

    console.log("✅ MySQL Connected Successfully");

    connection.release();

    return true;
  } catch (error) {
    console.error("❌ MySQL Connection Failed:");
    console.error(error);

    return false;
  }
}

// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
    ],

    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

// ==========================================
// ADMIN AUTH MIDDLEWARE
// ==========================================

function verifyAdminToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization token provided",
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.admin = decoded;

    next();
  } catch (error) {
    console.error(
      "JWT verification failed:",
      error.message
    );

    return res.status(403).json({
      success: false,
      message:
        "Invalid or expired admin session. Please log in again.",
    });
  }
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KSL Backend is running",
    environment:
      process.env.NODE_ENV || "production",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      server: "online",
      database: "connected",
    });
  } catch (error) {
    console.error(
      "Health check database error:",
      error.message
    );

    res.status(500).json({
      success: false,
      server: "online",
      database: "disconnected",
      error: error.message,
    });
  }
});

// ==========================================
// PUBLIC ROUTES
// ==========================================

// ------------------------------------------
// GET ALL TEAMS
// ------------------------------------------

app.get("/api/teams", async (req, res) => {
  try {
    const [teams] = await pool.query(`
      SELECT *
      FROM teams
      ORDER BY
        points DESC,
        goal_difference DESC,
        goals_for DESC
    `);

    res.json({
      success: true,
      teams,
    });
  } catch (error) {
    console.error(
      "GET /api/teams ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load teams",
      error: error.message,
    });
  }
});

// ------------------------------------------
// GET ALL MATCHES
// ------------------------------------------

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

    res.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error(
      "GET /api/matches ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load matches",
      error: error.message,
    });
  }
});

// ==========================================
// SINGLE MATCH
// ==========================================

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
        success: false,
        message:
          `Match with ID ${matchId} not found`,
      });
    }

    const match = rows[0];

    // Load match events
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
      console.log(
        "Could not load match events:",
        eventError.message
      );

      match.events = [];
    }

    res.json({
      success: true,
      match,
    });
  } catch (error) {
    console.error(
      "GET SINGLE MATCH ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load match",
      error: error.message,
    });
  }
}

app.get(
  "/api/matches/:id",
  getSingleMatch
);

app.get(
  "/api/match/:id",
  getSingleMatch
);

// ==========================================
// ADMIN LOGIN
// ==========================================

app.post(
  "/api/admin/login",
  async (req, res) => {
    try {
      const {
        username,
        password,
      } = req.body;

      if (
        username === "admin" &&
        password === "admin123"
      ) {
        const token = jwt.sign(
          { username },
          JWT_SECRET,
          {
            expiresIn: "24h",
          }
        );

        return res.json({
          success: true,
          token,

          admin: {
            username: "Admin",
          },
        });
      }

      return res.status(401).json({
        success: false,
        message:
          "Invalid admin credentials",
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Admin login failed",
      });
    }
  }
);

// ==========================================
// ADMIN - CREATE TEAM
// ==========================================

app.post(
  "/api/admin/teams",
  verifyAdminToken,
  upload.single("logo"),

  async (req, res) => {
    try {
      const {
        name,
        short_name,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Team name is required",
        });
      }

      const logoUrl = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const [result] =
        await pool.query(
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
            logoUrl,
          ]
        );

      res.json({
        success: true,
        teamId: result.insertId,
      });
    } catch (error) {
      console.error(
        "CREATE TEAM ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN - UPDATE TEAM
// ==========================================

app.put(
  "/api/admin/teams/:id",
  verifyAdminToken,

  async (req, res) => {
    try {
      const {
        name,
        short_name,
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
          req.params.id,
        ]
      );

      res.json({
        success: true,
      });
    } catch (error) {
      console.error(
        "UPDATE TEAM ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN - DELETE TEAM
// ==========================================

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
        success: true,
      });
    } catch (error) {
      console.error(
        "DELETE TEAM ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN - CREATE MATCH
// ==========================================

app.post(
  "/api/admin/matches",
  verifyAdminToken,

  async (req, res) => {
    try {
      const {
        home_team_id,
        away_team_id,
        match_date,
        venue,
      } = req.body;

      const [result] =
        await pool.query(
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
            venue,
          ]
        );

      res.json({
        success: true,
        matchId: result.insertId,
      });
    } catch (error) {
      console.error(
        "CREATE MATCH ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN - DELETE MATCH
// ==========================================

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
        success: true,
      });
    } catch (error) {
      console.error(
        "DELETE MATCH ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN - UPDATE LIVE SCORE
// ==========================================

app.put(
  "/api/admin/matches/:id/score",
  verifyAdminToken,

  async (req, res) => {
    try {
      const {
        home_score,
        away_score,
      } = req.body;

      const matchId =
        req.params.id;

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
          matchId,
        ]
      );

      const [rows] =
        await pool.query(
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
      });
    } catch (error) {
      console.error(
        "UPDATE SCORE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN - UPDATE MATCH STATUS
// ==========================================

app.put(
  "/api/admin/matches/:id/status",
  verifyAdminToken,

  async (req, res) => {
    try {
      const matchId =
        req.params.id;

      const { status } =
        req.body;

      await pool.query(
        `
        UPDATE matches
        SET status = ?
        WHERE id = ?
        `,
        [
          status,
          matchId,
        ]
      );

      const [rows] =
        await pool.query(
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
        status,
      });
    } catch (error) {
      console.error(
        "UPDATE STATUS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN - END MATCH
// ==========================================

app.put(
  "/api/admin/matches/:id/end",
  verifyAdminToken,

  async (req, res) => {
    try {
      const matchId =
        req.params.id;

      await pool.query(
        `
        UPDATE matches

        SET status = 'completed'

        WHERE id = ?
        `,
        [matchId]
      );

      const [rows] =
        await pool.query(
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
      });
    } catch (error) {
      console.error(
        "END MATCH ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN - ADD MATCH EVENT
// ==========================================

app.post(
  "/api/admin/matches/:id/events",
  verifyAdminToken,

  async (req, res) => {
    try {
      const matchId =
        req.params.id;

      const {
        minute,
        event_type,
        team_id,
        player_name,
      } = req.body;

      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS match_events (
          id INT AUTO_INCREMENT PRIMARY KEY,

          match_id INT NOT NULL,

          team_id INT NOT NULL,

          event_type VARCHAR(50) NOT NULL,

          player_name VARCHAR(255) NOT NULL,

          minute INT NOT NULL DEFAULT 0,

          created_at TIMESTAMP
            DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const [result] =
        await pool.query(
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
            minute || 0,
          ]
        );

      const newEvent = {
        id: result.insertId,

        match_id:
          parseInt(matchId),

        team_id,

        event_type,

        player_name,

        minute:
          minute || 0,
      };

      io.emit(
        "matchEventAdded",
        {
          matchId:
            parseInt(matchId),

          event: newEvent,
        }
      );

      res.json({
        success: true,
        eventId:
          result.insertId,
      });
    } catch (error) {
      console.error(
        "ADD MATCH EVENT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// 404 HANDLER
// ==========================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        `Route ${req.method} ${req.originalUrl} not found`,
    });
  }
);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {
    console.error(
      "GLOBAL ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
);

// ==========================================
// START SERVER
// ==========================================

server.listen(
  PORT,
  "0.0.0.0",
  async () => {
    console.log(
      `🚀 KSL Backend & Socket.IO running on port ${PORT}`
    );

    console.log(
      `🌐 Environment: ${
        process.env.NODE_ENV ||
        "production"
      }`
    );

    console.log(
      `📡 Server ready`
    );

    // Test database after server starts
    await testDatabaseConnection();
  }
);

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

async function shutdown() {
  console.log(
    "🛑 Shutting down KSL backend..."
  );

  try {
    await pool.end();

    server.close(() => {
      console.log(
        "✅ Server closed"
      );

      process.exit(0);
    });
  } catch (error) {
    console.error(
      "Shutdown error:",
      error
    );

    process.exit(1);
  }
}

process.on(
  "SIGTERM",
  shutdown
);

process.on(
  "SIGINT",
  shutdown
);