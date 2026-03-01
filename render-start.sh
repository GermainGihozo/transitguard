#!/bin/bash

# Render.com startup script
# This ensures the database schema is ready before starting the app

echo "🚀 Starting TransitGuard on Render..."

# Check if database connection is available
echo "📊 Checking database connection..."

# Wait for database to be ready (max 30 seconds)
for i in {1..30}; do
  if node -e "
    const mysql = require('mysql2/promise');
    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    };
    mysql.createConnection(config)
      .then(() => { console.log('✅ Database connected'); process.exit(0); })
      .catch(() => { console.log('⏳ Waiting for database...'); process.exit(1); });
  " 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  
  if [ $i -eq 30 ]; then
    echo "❌ Database connection timeout"
    exit 1
  fi
  
  sleep 1
done

# Start the application
echo "🎯 Starting application..."
exec npm start
