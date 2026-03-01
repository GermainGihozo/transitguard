// Test setup script - creates database and sample data
require("dotenv").config({ path: "./backend/.env" });
const mysql = require("mysql2/promise");

async function setupTestEnvironment() {
  console.log("🔧 Setting up test environment...\n");

  try {
    // Connect without database first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      multipleStatements: true
    });

    console.log("✓ Connected to MySQL");

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✓ Database '${process.env.DB_NAME}' created/verified`);

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Create tables
    console.log("\n📋 Creating tables...");
    
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        fingerprint_template TEXT,
        role ENUM('super_admin', 'company_admin', 'station_officer', 'authority', 'conductor') NOT NULL DEFAULT 'conductor',
        station_id INT DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      );

      CREATE TABLE IF NOT EXISTS passengers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        national_id VARCHAR(50) UNIQUE,
        passport_number VARCHAR(50) UNIQUE,
        phone VARCHAR(20),
        fingerprint_template TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_national_id (national_id)
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plate_number VARCHAR(20) UNIQUE NOT NULL,
        company_name VARCHAR(100) NOT NULL,
        capacity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_plate (plate_number)
      );

      CREATE TABLE IF NOT EXISTS routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_name VARCHAR(100) NOT NULL,
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        distance_km DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        route_id INT NOT NULL,
        departure_time DATETIME NOT NULL,
        status ENUM('scheduled', 'departed', 'arrived', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
        INDEX idx_status (status)
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        passenger_id INT NOT NULL,
        trip_id INT NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
        INDEX idx_used (is_used)
      );

      CREATE TABLE IF NOT EXISTS boarding_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        passenger_id INT NOT NULL,
        trip_id INT,
        station_id INT,
        boarding_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verification_status ENUM('verified', 'failed') DEFAULT 'verified',
        FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
        INDEX idx_boarding_time (boarding_time)
      );

      CREATE TABLE IF NOT EXISTS boarding_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        passenger_id INT NOT NULL,
        ticket_id INT,
        trip_id INT,
        scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('approved', 'denied') DEFAULT 'approved',
        FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
        INDEX idx_scan_time (scan_time)
      );
    `;

    await connection.query(schema);
    console.log("✓ All tables created");

    // Insert test data
    console.log("\n📝 Inserting test data...");

    // Test users (password: Admin@123 for all)
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await connection.query(`
      INSERT IGNORE INTO users (full_name, email, password_hash, fingerprint_template, role) VALUES
      ('Super Admin', 'admin@transitguard.com', ?, 'ADMIN_FINGERPRINT_123', 'super_admin'),
      ('Company Manager', 'company@transitguard.com', ?, 'COMPANY_FINGERPRINT_123', 'company_admin'),
      ('Station Officer', 'station@transitguard.com', ?, 'STATION_FINGERPRINT_123', 'station_officer'),
      ('Authority Monitor', 'authority@transitguard.com', ?, 'AUTHORITY_FINGERPRINT_123', 'authority'),
      ('Conductor John', 'conductor@transitguard.com', ?, 'CONDUCTOR_FINGERPRINT_123', 'conductor')
    `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]);
    console.log("✓ Test users created");

    // Test routes
    try {
      await connection.query(`
        INSERT INTO routes (route_name, origin, destination, distance_km) VALUES
        ('Route A', 'Central Station', 'Airport Terminal', 25.5),
        ('Route B', 'Downtown Hub', 'University Campus', 12.3)
        ON DUPLICATE KEY UPDATE route_name=route_name
      `);
      console.log("✓ Test routes created");
    } catch (err) {
      console.log("✓ Test routes already exist");
    }

    // Test vehicles
    try {
      await connection.query(`
        INSERT INTO vehicles (plate_number, company_name, capacity) VALUES
        ('ABC-1234', 'Transit Express', 50),
        ('XYZ-5678', 'City Buses', 45)
        ON DUPLICATE KEY UPDATE plate_number=plate_number
      `);
      console.log("✓ Test vehicles created");
    } catch (err) {
      console.log("✓ Test vehicles already exist");
    }

    // Test passengers
    await connection.query(`
      INSERT IGNORE INTO passengers (full_name, national_id, phone, fingerprint_template) VALUES
      ('John Doe', '1234567890', '+1234567890', 'PASSENGER_FINGERPRINT_001'),
      ('Jane Smith', '0987654321', '+0987654321', 'PASSENGER_FINGERPRINT_002')
    `);
    console.log("✓ Test passengers created");

    // Test trips
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    try {
      await connection.query(`
        INSERT INTO trips (vehicle_id, route_id, departure_time, status) VALUES
        (1, 1, ?, 'scheduled'),
        (2, 2, ?, 'scheduled')
      `, [tomorrow, tomorrow]);
      console.log("✓ Test trips created");
    } catch (err) {
      console.log("✓ Test trips already exist");
    }

    await connection.end();

    console.log("\n✅ Test environment setup complete!\n");
    console.log("📋 Test Credentials:");
    console.log("   Email: admin@transitguard.com");
    console.log("   Password: Admin@123");
    console.log("   Role: super_admin\n");
    console.log("   Email: conductor@transitguard.com");
    console.log("   Password: Admin@123");
    console.log("   Role: conductor\n");
    console.log("🚀 You can now start the server with: npm start\n");

  } catch (error) {
    console.error("❌ Error setting up test environment:", error.message);
    process.exit(1);
  }
}

setupTestEnvironment();
