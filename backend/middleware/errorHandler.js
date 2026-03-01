// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      errors: err.details
    });
  }

  if (err.name === "UnauthorizedError" || err.message.includes("token")) {
    return res.status(401).json({
      message: "Authentication failed"
    });
  }

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      message: "Duplicate entry - record already exists"
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

module.exports = errorHandler;
