// Simple logger utility
const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG"
};

const colors = {
  ERROR: "\x1b[31m", // Red
  WARN: "\x1b[33m",  // Yellow
  INFO: "\x1b[36m",  // Cyan
  DEBUG: "\x1b[90m", // Gray
  RESET: "\x1b[0m"
};

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.RESET;
  const reset = colors.RESET;

  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };

  if (process.env.NODE_ENV === "production") {
    // In production, output JSON for log aggregation
    console.log(JSON.stringify(logEntry));
  } else {
    // In development, output colored human-readable logs
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    console.log(`${color}[${timestamp}] ${level}:${reset} ${message}${metaStr}`);
  }
}

const logger = {
  error: (message, meta) => log(LOG_LEVELS.ERROR, message, meta),
  warn: (message, meta) => log(LOG_LEVELS.WARN, message, meta),
  info: (message, meta) => log(LOG_LEVELS.INFO, message, meta),
  debug: (message, meta) => log(LOG_LEVELS.DEBUG, message, meta)
};

module.exports = logger;
