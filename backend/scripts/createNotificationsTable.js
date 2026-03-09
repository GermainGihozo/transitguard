// Script to create notifications table
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function createNotificationsTable() {
  try {
    console.log('Creating notifications table...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, '../database/migrations/005_create_notifications.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }
    
    console.log('✓ Notifications table created successfully!');
    
    // Check if notifications were inserted
    const [notifications] = await db.execute('SELECT COUNT(*) as count FROM notifications');
    console.log(`✓ ${notifications[0].count} sample notifications added`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating notifications table:', error);
    process.exit(1);
  }
}

createNotificationsTable();
