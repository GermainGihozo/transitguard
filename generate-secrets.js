#!/usr/bin/env node

/**
 * Generate secure secrets for TransitGuard deployment
 * Run: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 TransitGuard Secret Generator\n');
console.log('Copy these values to your deployment environment variables:\n');
console.log('─'.repeat(60));

// Generate JWT Secret (64 characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\nJWT_SECRET:');
console.log(jwtSecret);

// Generate Biometric Secret (64 characters)
const biometricSecret = crypto.randomBytes(32).toString('hex');
console.log('\nBIOMETRIC_SECRET:');
console.log(biometricSecret);

// Generate Database Password (24 characters, alphanumeric + special)
const dbPassword = crypto.randomBytes(18).toString('base64').slice(0, 24);
console.log('\nDB_PASSWORD (suggestion):');
console.log(dbPassword);

console.log('\n' + '─'.repeat(60));
console.log('\n⚠️  IMPORTANT:');
console.log('   - Store these secrets securely');
console.log('   - Never commit them to Git');
console.log('   - Use different secrets for each environment');
console.log('   - Keep a backup in a secure location\n');

// Optional: Create .env file
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Create .env file with these secrets? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    const fs = require('fs');
    const envContent = `# TransitGuard Environment Variables
# Generated: ${new Date().toISOString()}

# Application
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=${dbPassword}
DB_NAME=transitguard_prod

# Security Secrets
JWT_SECRET=${jwtSecret}
BIOMETRIC_SECRET=${biometricSecret}

# Rate Limiting
RATE_LIMIT_MAX=100
`;

    fs.writeFileSync('.env', envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('   Edit it with your actual database credentials.\n');
  } else {
    console.log('\n👍 No problem! Copy the secrets manually.\n');
  }
  
  readline.close();
});
