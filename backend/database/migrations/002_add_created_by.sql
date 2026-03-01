-- Add created_by column to track who created each user
ALTER TABLE users 
ADD COLUMN created_by INT DEFAULT NULL AFTER station_id,
ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_created_by ON users(created_by);
