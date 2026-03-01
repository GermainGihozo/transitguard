-- Seed data for stations in Rwanda
-- These are example stations that can be used for testing

INSERT INTO stations (name, location, city, region, latitude, longitude, is_active) VALUES
('Byumba Station', 'Main Street, Byumba Town', 'Byumba', 'Northern Province', -1.5760, 30.0670, TRUE),
('Gatuna Border Station', 'Gatuna Border Post', 'Gatuna', 'Northern Province', -1.2833, 30.0833, TRUE),
('Kagitumba Border Station', 'Kagitumba Border Crossing', 'Kagitumba', 'Eastern Province', -1.3167, 30.7833, TRUE),
('Kigali Central Station', 'KN 3 Ave, Nyarugenge', 'Kigali', 'Kigali City', -1.9536, 30.0606, TRUE),
('Nyabugogo Station', 'Nyabugogo Bus Terminal', 'Kigali', 'Kigali City', -1.9403, 30.0588, TRUE),
('Musanze Station', 'Musanze Town Center', 'Musanze', 'Northern Province', -1.4989, 29.6344, TRUE),
('Rubavu Station', 'Rubavu Town, Gisenyi', 'Rubavu', 'Western Province', -1.6778, 29.2667, TRUE),
('Rusizi Station', 'Rusizi District, Kamembe', 'Rusizi', 'Western Province', -2.4833, 28.9000, TRUE),
('Huye Station', 'Huye Town, Butare', 'Huye', 'Southern Province', -2.5967, 29.7389, TRUE),
('Muhanga Station', 'Muhanga Town Center', 'Muhanga', 'Southern Province', -2.0833, 29.7500, TRUE),
('Rwamagana Station', 'Rwamagana Town', 'Rwamagana', 'Eastern Province', -1.9500, 30.4333, TRUE),
('Kayonza Station', 'Kayonza District Center', 'Kayonza', 'Eastern Province', -1.8833, 30.4167, TRUE);

-- Note: Coordinates are approximate and should be verified for production use
