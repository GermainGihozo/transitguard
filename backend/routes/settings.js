const express = require('express');
const router = express.Router();
const db = require('../config/db');

// In a real application, settings would be stored in a database table
// For now, we'll use a simple in-memory store with defaults
let systemSettings = {
  // General
  systemName: 'TransitGuard',
  systemEmail: 'admin@transitguard.com',
  language: 'en',
  timezone: 'Africa/Kigali',
  
  // Security
  sessionTimeout: 60,
  passwordLength: 8,
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  require2FA: false,
  passwordExpiry: true,
  
  // Biometric
  fingerprintThreshold: 85,
  maxVerificationAttempts: 3,
  fallbackToManual: true,
  logBiometricAttempts: true,
  
  // Notifications
  emailNotifications: true,
  smsNotifications: false,
  notifyNewUser: true,
  notifyFailedLogin: true,
  
  // Maintenance
  logRetention: 90,
  backupFrequency: 'daily',
  maintenanceMode: false
};

// Get settings
router.get('/', (req, res) => {
  res.json(systemSettings);
});

// Update settings
router.post('/', (req, res) => {
  try {
    // Validate and update settings
    const updates = req.body;
    
    // Validate numeric ranges
    if (updates.sessionTimeout && (updates.sessionTimeout < 15 || updates.sessionTimeout > 480)) {
      return res.status(400).json({ message: 'Session timeout must be between 15 and 480 minutes' });
    }
    
    if (updates.passwordLength && (updates.passwordLength < 6 || updates.passwordLength > 32)) {
      return res.status(400).json({ message: 'Password length must be between 6 and 32 characters' });
    }
    
    if (updates.fingerprintThreshold && (updates.fingerprintThreshold < 70 || updates.fingerprintThreshold > 99)) {
      return res.status(400).json({ message: 'Fingerprint threshold must be between 70 and 99' });
    }
    
    // Update settings
    systemSettings = { ...systemSettings, ...updates };
    
    // In a real application, save to database here
    // await db.execute('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
    
    res.json({ 
      message: 'Settings updated successfully',
      settings: systemSettings
    });
    
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      message: 'Failed to update settings',
      errors: [error.message]
    });
  }
});

// Get system information
router.get('/info', async (req, res) => {
  try {
    // Get counts
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [passengerCount] = await db.execute('SELECT COUNT(*) as count FROM passengers');
    const [tripCount] = await db.execute('SELECT COUNT(*) as count FROM trips');
    
    // Get database size (MySQL specific)
    const [dbSize] = await db.execute(`
      SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);
    
    // Calculate uptime (simplified - in production, track server start time)
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    res.json({
      totalUsers: userCount[0].count,
      totalPassengers: passengerCount[0].count,
      totalTrips: tripCount[0].count,
      databaseSize: `${dbSize[0].size_mb || 0} MB`,
      uptime: `${days}d ${hours}h ${minutes}m`
    });
    
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ 
      message: 'Failed to fetch system info',
      errors: [error.message]
    });
  }
});

// Clear cache
router.post('/clear-cache', (req, res) => {
  try {
    // In a real application, clear Redis/Memcached cache here
    console.log('Cache cleared');
    
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      message: 'Failed to clear cache',
      errors: [error.message]
    });
  }
});

// Database backup
router.post('/backup', async (req, res) => {
  try {
    // In a real application, trigger mysqldump or backup process here
    console.log('Database backup initiated');
    
    // Simulate backup process
    setTimeout(() => {
      console.log('Database backup completed');
    }, 5000);
    
    res.json({ message: 'Database backup started' });
  } catch (error) {
    console.error('Error starting backup:', error);
    res.status(500).json({ 
      message: 'Failed to start backup',
      errors: [error.message]
    });
  }
});

module.exports = router;
