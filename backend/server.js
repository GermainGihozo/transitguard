const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Validate environment variables on startup
const validateEnv = require("./utils/validateEnv");
validateEnv();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const { apiLimiter } = require("./middleware/rateLimiter");
app.use("/api", apiLimiter);

// Initialize database connection pool
require("./config/db");

// Health check
app.get("/", (req, res) => {
  res.json({
    service: "TransitGuard API",
    status: "running",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// API Routes
const apiRoutes = require("./routes/routes");
app.use("/api", apiRoutes);
console.log("✓ API routes mounted at /api");

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));
  
  // Handle client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
  console.log("✓ Serving frontend from", frontendPath);
}

// Error handling middleware (must be last)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});

