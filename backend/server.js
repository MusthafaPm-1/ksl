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

// Socket.IO Setup with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const JWT_SECRET = "ksl_secret_key_2026";
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer Storage Configuration for Team Logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `team_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// MySQL Connection Pool (Adjust credentials to match your MySQL setup)
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "football_league",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Admin Auth Middleware
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No authorization token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}
// ==========================================
// 1. PUBLIC ROUTES
// ==========================================

// Get all teams / Standings
app.get("/api/teams", async (req, res) => {
  try {
    const [teams] = await pool.query(
      "SELECT * FROM teams ORDER BY points DESC, goal_difference DESC, goals_for DESC"
    );
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all matches
app.get("/api/matches", async (req, res) => {
  try {
    const [matches] = await pool.query(`
      SELECT m.*, 
             h.name AS home_team_name, h.logo AS home_team_logo,
             a.name AS away_team_name, a.logo AS away_team_logo
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      ORDER BY m.match_date ASC
    `);
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handler function for fetching single match
// Handler function for fetching single match with its recorded events
async function getSingleMatch(req, res) {
  try {
    const matchId = req.params.id;

    const [rows] = await pool.query(`
      SELECT 
        m.*, 
        h.name AS home_team_name, 
        h.logo AS home_team_logo,
        a.name AS away_team_name, 
        a.logo AS away_team_logo
      FROM matches m
      LEFT JOIN teams h ON m.home_team_id = h.id
      LEFT JOIN teams a ON m.away_team_id = a.id
      WHERE m.id = ?
    `, [matchId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: `Match with ID ${matchId} not found` });
    }

    const match = rows[0];

    // Fetch recorded match events from MySQL
    try {
      const [events] = await pool.query(
        "SELECT * FROM match_events WHERE match_id = ? ORDER BY minute ASC, id ASC",
        [matchId]
      );
      match.events = events || [];
    } catch (err) {
      console.warn("Could not query match_events:", err.message);
      match.events = [];
    }

    res.json({ match });
  } catch (err) {
    console.error("SQL Error in match endpoint:", err.message);
    res.status(500).json({ error: err.message });
  }
}


// Register both plural and singular endpoints:
app.get("/api/matches/:id", getSingleMatch);
app.get("/api/match/:id", getSingleMatch);

// ==========================================
// 2. ADMIN AUTH & MANAGEMENT ROUTES
// ==========================================

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  // Simple check (or query from admins table)
  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({
      success: true,
      token,
      admin: { username: "Admin" },
    });
  }
  res.status(401).json({ success: false, message: "Invalid admin credentials" });
});

// Create new team with logo
app.post("/api/admin/teams", verifyAdminToken, upload.single("logo"), async (req, res) => {
  try {
    const { name, short_name } = req.body;
    const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      "INSERT INTO teams (name, short_name, logo, played, wins, draws, losses, goals_for, goals_against, goal_difference, points) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)",
      [name, short_name, logoUrl]
    );
    res.json({ success: true, teamId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update team details
app.put("/api/admin/teams/:id", verifyAdminToken, async (req, res) => {
  try {
    const { name, short_name } = req.body;
    await pool.query(
      "UPDATE teams SET name = ?, short_name = ? WHERE id = ?",
      [name, short_name, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete team
app.delete("/api/admin/teams/:id", verifyAdminToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM teams WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Schedule fixture
app.post("/api/admin/matches", verifyAdminToken, async (req, res) => {
  try {
    const { home_team_id, away_team_id, match_date, venue } = req.body;
    const [result] = await pool.query(
      "INSERT INTO matches (home_team_id, away_team_id, match_date, venue, status, home_score, away_score) VALUES (?, ?, ?, ?, 'scheduled', 0, 0)",
      [home_team_id, away_team_id, match_date, venue]
    );
    res.json({ success: true, matchId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete fixture
app.delete("/api/admin/matches/:id", verifyAdminToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM matches WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Live Match Score + Socket.IO Broadcast
app.put("/api/admin/matches/:id/score", verifyAdminToken, async (req, res) => {
  try {
    const { home_score, away_score } = req.body;
    const matchId = req.params.id;

    await pool.query(
      "UPDATE matches SET home_score = ?, away_score = ?, status = 'live' WHERE id = ?",
      [home_score, away_score, matchId]
    );

    // Fetch full match object to broadcast
    const [rows] = await pool.query(`
      SELECT m.*, 
             h.name AS home_team_name, h.logo AS home_team_logo,
             a.name AS away_team_name, a.logo AS away_team_logo
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      WHERE m.id = ?
    `, [matchId]);

    if (rows.length > 0) {
      io.emit("matchUpdate", rows[0]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// End Match (Mark Full Time)
app.put("/api/admin/matches/:id/end", verifyAdminToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    await pool.query("UPDATE matches SET status = 'completed' WHERE id = ?", [matchId]);

    const [rows] = await pool.query(`
      SELECT m.*, 
             h.name AS home_team_name, h.logo AS home_team_logo,
             a.name AS away_team_name, a.logo AS away_team_logo
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      WHERE m.id = ?
    `, [matchId]);

    if (rows.length > 0) {
      io.emit("matchUpdate", rows[0]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle Half Time / Resume 2nd Half
app.put("/api/admin/matches/:id/status", verifyAdminToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    const { status } = req.body; // 'live', 'halftime', or 'completed'

    await pool.query("UPDATE matches SET status = ? WHERE id = ?", [status, matchId]);

    // Broadcast updated status via Socket.IO
    const [rows] = await pool.query(`
      SELECT m.*, 
             h.name AS home_team_name, h.logo AS home_team_logo,
             a.name AS away_team_name, a.logo AS away_team_logo
      FROM matches m
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      WHERE m.id = ?
    `, [matchId]);

    if (rows.length > 0) {
      io.emit("matchUpdate", rows[0]);
    }

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Log Match Event (Goals, Cards, Substitutions) + Broadcast
app.post("/api/admin/matches/:id/events", verifyAdminToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    const { minute, event_type, team_id, player_name } = req.body;

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
      "INSERT INTO match_events (match_id, team_id, event_type, player_name, minute) VALUES (?, ?, ?, ?, ?)",
      [matchId, team_id, event_type, player_name, minute || 0]
    );

    const newEvent = {
      id: result.insertId,
      match_id: parseInt(matchId),
      team_id,
      event_type,
      player_name,
      minute: minute || 0,
    };

    io.emit("matchEventAdded", { matchId: parseInt(matchId), event: newEvent });

    res.json({ success: true, eventId: result.insertId });
  } catch (err) {
    console.error("Error logging match event:", err);
    res.status(500).json({ message: err.message });
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 KSL Backend & Socket.IO running on http://localhost:${PORT}`);
});