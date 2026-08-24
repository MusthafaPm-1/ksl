const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        rejectUnauthorized: false
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection when the server starts
(async () => {
    try {
        const connection = await pool.getConnection();

        console.log("✅ MySQL Connected Successfully");
        console.log(`📊 Database: ${process.env.DB_NAME}`);
        console.log(`🌐 Host: ${process.env.DB_HOST}`);
        console.log(`🔌 Port: ${process.env.DB_PORT}`);

        connection.release();
    } catch (error) {
        console.error("❌ MySQL Connection Failed:");
        console.error(error);
    }
})();

module.exports = pool;