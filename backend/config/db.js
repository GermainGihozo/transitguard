const mysql = require("mysql2/promise");

// Create connection pool for better performance and connection management
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "transitguard_prod",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✓ MySQL Connected...");
    connection.release();
  } catch (err) {
    console.error("✗ Database connection failed:", err.message);
    process.exit(1);
  }
})();

module.exports = pool;
