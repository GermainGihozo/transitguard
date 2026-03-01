const { Pool } = require("pg");

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log("✓ PostgreSQL Connected...");
    client.release();
  } catch (err) {
    console.error("✗ Database connection failed:", err.message);
    process.exit(1);
  }
})();

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Wrapper to make PostgreSQL queries compatible with MySQL2 promise syntax
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return [res.rows, res.fields];
  } catch (error) {
    console.error('Query error', { text, error: error.message });
    throw error;
  }
};

// Export both pool and query wrapper
module.exports = {
  query,
  pool,
  // For compatibility with existing code
  execute: query,
  getConnection: () => pool.connect()
};
