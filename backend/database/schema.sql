-- TransitGuard Database Schema
-- Version: 1.0.0

CREATE DATABASE IF NOT EXISTS transitguard_prod;
USE transitguard_prod;

-- Users table (staff/operators)
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
  INDEX idx_role (role),
  INDEX idx_station (station_id)
);

-- Passengers table
CREATE TABLE IF NOT EXISTS passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  national_id VARCHAR(50) UNIQUE,
  passport_number VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  fingerprint_template TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_national_id (national_id),
  INDEX idx_passport (passport_number),
  INDEX idx_phone (phone)
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plate (plate_number),
  INDEX idx_company (company_name)
);

-- Routes table (optional - for future expansion)
CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_name VARCHAR(100) NOT NULL,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  distance_km DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  route_id INT NOT NULL,
  departure_time DATETIME NOT NULL,
  status ENUM('scheduled', 'departed', 'arrived', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_departure (departure_time)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT NOT NULL,
  trip_id INT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_passenger (passenger_id),
  INDEX idx_trip (trip_id),
  INDEX idx_used (is_used)
);

-- Boarding logs table
CREATE TABLE IF NOT EXISTS boarding_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT NOT NULL,
  trip_id INT,
  station_id INT,
  boarding_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_status ENUM('verified', 'failed') DEFAULT 'verified',
  FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
  INDEX idx_passenger (passenger_id),
  INDEX idx_trip (trip_id),
  INDEX idx_boarding_time (boarding_time),
  INDEX idx_status (verification_status)
);

-- Boarding history table (for dashboard compatibility)
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
  INDEX idx_scan_time (scan_time),
  INDEX idx_status (status)
);

-- Audit log table (for security tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);
