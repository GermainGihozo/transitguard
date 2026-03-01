#!/usr/bin/env node

/**
 * Automated MySQL to PostgreSQL Migration Script
 * This script helps migrate TransitGuard from MySQL to PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔄 TransitGuard MySQL → PostgreSQL Migration\n');
console.log('This script will help you migrate to PostgreSQL for easier Render deployment.\n');

// Check if user wants to proceed
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Do you want to proceed with migration? (y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('\n❌ Migration cancelled.\n');
    readline.close();
    process.exit(0);
  }

  console.log('\n📦 Step 1: Updating dependencies...\n');
  
  try {
    // Update package.json
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Remove mysql2, add pg
    if (packageJson.dependencies['mysql2']) {
      delete packageJson.dependencies['mysql2'];
      console.log('  ✓ Removed mysql2');
    }
    
    if (!packageJson.dependencies['pg']) {
      packageJson.dependencies['pg'] = '^8.11.3';
      console.log('  ✓ Added pg');
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('  ✓ package.json updated');
    
    console.log('\n📥 Step 2: Installing PostgreSQL driver...\n');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('\n🔧 Step 3: Updating database configuration...\n');
    
    // Backup old db.js
    const dbPath = path.join(__dirname, 'backend', 'config', 'db.js');
    const dbBackupPath = path.join(__dirname, 'backend', 'config', 'db-mysql-backup.js');
    
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, dbBackupPath);
      console.log('  ✓ Backed up old db.js to db-mysql-backup.js');
    }
    
    // Copy PostgreSQL config
    const dbPostgresPath = path.join(__dirname, 'backend', 'config', 'db-postgres.js');
    if (fs.existsSync(dbPostgresPath)) {
      fs.copyFileSync(dbPostgresPath, dbPath);
      console.log('  ✓ Updated db.js with PostgreSQL configuration');
    }
    
    console.log('\n✅ Migration Complete!\n');
    console.log('Next steps:\n');
    console.log('1. Update your .env file with PostgreSQL connection:');
    console.log('   DATABASE_URL=postgresql://user:password@localhost:5432/transitguard_prod\n');
    console.log('2. Create PostgreSQL database:');
    console.log('   createdb transitguard_prod\n');
    console.log('3. Import schema:');
    console.log('   psql -d transitguard_prod -f backend/database/schema-postgres.sql\n');
    console.log('4. Test locally:');
    console.log('   npm start\n');
    console.log('5. Deploy to Render (PostgreSQL included in free tier!)\n');
    console.log('📖 See POSTGRES_MIGRATION.md for detailed instructions.\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 You can migrate manually by following POSTGRES_MIGRATION.md\n');
    process.exit(1);
  }
  
  readline.close();
});
