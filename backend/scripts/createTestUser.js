const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const sql = `
      INSERT INTO users 
      (full_name, email, password_hash, fingerprint_template, role) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await db.execute(sql, [
      'Admin User',
      'admin@test.com',
      hashedPassword,
      'simulated_fingerprint_data_12345',
      'super_admin'
    ]);
    
    console.log('✓ Test user created successfully!');
    console.log('  Email: admin@test.com');
    console.log('  Password: password123');
    console.log('  Role: super_admin');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠ User already exists');
    } else {
      console.error('✗ Error creating user:', error.message);
    }
    process.exit(1);
  }
}

createTestUser();
