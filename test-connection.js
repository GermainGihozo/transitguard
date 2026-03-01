// Quick test script to verify database and API setup
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

console.log('=== TransitGuard Connection Test ===\n');

// Test 1: Environment Variables
console.log('1. Environment Variables:');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
console.log('   DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('   DB_USER:', process.env.DB_USER || 'root');
console.log('   DB_NAME:', process.env.DB_NAME || 'transitguard_prod');
console.log('   PORT:', process.env.PORT || 5000);
console.log('');

// Test 2: Database Connection
console.log('2. Testing Database Connection...');
const mysql = require('mysql2/promise');

async function testDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'transitguard_prod'
    });
    
    console.log('   ✓ Database connection successful');
    
    // Check if users table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (tables.length > 0) {
      console.log('   ✓ Users table exists');
      
      // Count users
      const [count] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`   ✓ Users in database: ${count[0].count}`);
    } else {
      console.log('   ✗ Users table not found - run schema.sql');
    }
    
    await connection.end();
  } catch (error) {
    console.log('   ✗ Database connection failed:', error.message);
    console.log('   → Make sure MySQL is running');
    console.log('   → Check your .env file credentials');
    console.log('   → Run: mysql -u root -p < backend/database/schema.sql');
  }
}

// Test 3: Server Status
console.log('');
console.log('3. Testing Server...');
const http = require('http');

function testServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✓ Server is running on port 5000');
          console.log('   ✓ Health check passed');
        } else {
          console.log('   ⚠ Server responded with status:', res.statusCode);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log('   ✗ Server not responding');
      console.log('   → Run: npm run dev');
      resolve();
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.log('   ✗ Server timeout');
      resolve();
    });
  });
}

// Run tests
(async () => {
  await testDatabase();
  await testServer();
  
  console.log('');
  console.log('=== Next Steps ===');
  console.log('1. If database failed: Run schema.sql in MySQL');
  console.log('2. If no users: Run "npm run create-user"');
  console.log('3. If server not running: Run "npm run dev"');
  console.log('4. Open frontend/test-api.html in your browser to test APIs');
  console.log('');
  
  process.exit(0);
})();
