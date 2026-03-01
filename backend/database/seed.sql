-- TransitGuard Seed Data
-- Version: 1.0.0

USE transitguard_prod;

-- Insert default super admin (password: Admin@123)
INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES
('System Administrator', 'admin@transitguard.com', '$2a$10$YourHashedPasswordHere', 'super_admin', TRUE)
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample routes
INSERT INTO routes (route_name, origin, destination, distance_km) VALUES
('Route A', 'Central Station', 'Airport Terminal', 25.5),
('Route B', 'Downtown Hub', 'University Campus', 12.3),
('Route C', 'North Terminal', 'South Terminal', 18.7)
ON DUPLICATE KEY UPDATE route_name=route_name;

-- Note: Vehicles, passengers, and trips should be added through the API
-- This seed file only contains essential bootstrap data
