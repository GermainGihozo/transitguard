-- Create stations table for managing transit stations
CREATE TABLE IF NOT EXISTS stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  company_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_name (name),
  INDEX idx_location (location),
  INDEX idx_company (company_id),
  INDEX idx_active (is_active)
);

-- Create routes table if not exists (for station-to-station routes)
CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_name VARCHAR(100) NOT NULL,
  origin_station_id INT NOT NULL,
  destination_station_id INT NOT NULL,
  distance_km DECIMAL(10, 2),
  estimated_duration_minutes INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (origin_station_id) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_station_id) REFERENCES stations(id) ON DELETE CASCADE,
  INDEX idx_origin (origin_station_id),
  INDEX idx_destination (destination_station_id),
  INDEX idx_active (is_active)
);
