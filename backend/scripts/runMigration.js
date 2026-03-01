const fs = require('fs');
const path = require('path');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '../database/migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await db.execute(statement);
    }
    
    console.log(`✓ Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`✗ Migration ${migrationFile} failed:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    const migrationFile = process.argv[2];
    
    if (!migrationFile) {
      console.log('Usage: node runMigration.js <migration-file>');
      console.log('Example: node runMigration.js 002_add_created_by.sql');
      process.exit(1);
    }
    
    await runMigration(migrationFile);
    console.log('\n✓ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed');
    process.exit(1);
  }
}

main();
