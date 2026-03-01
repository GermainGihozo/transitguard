/**
 * Vercel Serverless Function Entry Point
 * This wraps the Express app for Vercel's serverless environment
 */

const express = require("express");
const cors = require("cors");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const { apiLimiter } = require("../backend/middleware/rateLimiter");
app.use("/api", apiLimiter);

// Health check
app.get("/", (req, res) => {
  res.json({
    service: "TransitGuard API",
    status: "running",
    version: "1.0.0",
    environment: "vercel-serverless",
    timestamp: new Date().toISOString()
  });
});

// API Routes
const apiRoutes = require("../backend/routes/routes");
app.use("/api", apiRoutes);

// Error handling middleware
const errorHandler = require("../backend/middleware/errorHandler");
app.use(errorHandler);

// Export for Vercel
module.exports = app;
