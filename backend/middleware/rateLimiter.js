const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100,
  message: {
    message: "Too many requests from this IP, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 50 in dev, 5 in production
  message: {
    message: "Too many authentication attempts, please try again later"
  },
  skipSuccessfulRequests: true
});

// Boarding scan limiter (more permissive for active scanning)
const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: {
    message: "Too many scan attempts, please slow down"
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  scanLimiter
};
