// Environment validation on startup
function validateEnv() {
  const required = ["JWT_SECRET"];
  const missing = [];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  // Check for database connection in production
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    missing.push("DATABASE_URL");
  }

  if (missing.length > 0) {
    console.error("✗ Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    process.exit(1);
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET.length < 32) {
    console.warn("⚠ JWT_SECRET should be at least 32 characters for security");
  }

  console.log("✓ Environment variables validated");
}

module.exports = validateEnv;
