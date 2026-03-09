-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  link VARCHAR(255) DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);

-- Insert some sample notifications
INSERT INTO notifications (user_id, title, message, type, link) VALUES
(NULL, 'System Update', 'TransitGuard system has been updated to version 1.0.1', 'info', NULL),
(NULL, 'New Feature', 'Analytics dashboard is now available with advanced reporting', 'success', '/super_admin_dashboard.html#analytics'),
(NULL, 'Maintenance Scheduled', 'System maintenance scheduled for tonight at 2 AM', 'warning', NULL);
