# TransitGuard Deployment Guide

Complete guide for deploying TransitGuard to production environments.

## 📋 Pre-Deployment Checklist

### Security
- [ ] Change all default passwords and secrets
- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Configure CORS for specific domains only
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Configure rate limiting appropriately
- [ ] Review and update security headers

### Database
- [ ] Set up production database server
- [ ] Configure database backups
- [ ] Set up replication (if needed)
- [ ] Optimize database indexes
- [ ] Configure connection pooling limits
- [ ] Set up monitoring

### Application
- [ ] Set NODE_ENV=production
- [ ] Configure proper logging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure monitoring (PM2, New Relic, etc.)
- [ ] Test all API endpoints
- [ ] Load testing completed

## 🖥️ Server Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS or higher
- **Network**: 100 Mbps

### Recommended for Production
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: 1 Gbps

## 🚀 Deployment Options

### Option 1: Traditional VPS/Dedicated Server

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MariaDB
sudo apt install -y mariadb-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

#### Step 2: Database Setup
```bash
# Secure MariaDB installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE transitguard_prod;
CREATE USER 'transitguard'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON transitguard_prod.* TO 'transitguard'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import schema
mysql -u transitguard -p transitguard_prod < backend/database/schema.sql
```

#### Step 3: Application Setup
```bash
# Create application directory
sudo mkdir -p /var/www/transitguard
sudo chown -R $USER:$USER /var/www/transitguard

# Clone repository
cd /var/www/transitguard
git clone https://github.com/GermainGihozo/transitguard.git .

# Install dependencies
npm install --production

# Configure environment
cp backend/.env.example backend/.env
nano backend/.env
```

Update `.env`:
```env
NODE_ENV=production
PORT=5000

DB_HOST=localhost
DB_USER=transitguard
DB_PASSWORD=strong_password_here
DB_NAME=transitguard_prod

JWT_SECRET=generate_a_very_long_random_string_here_min_32_chars
BIOMETRIC_SECRET=another_long_random_string_for_biometric_data

RATE_LIMIT_MAX=100
```

#### Step 4: PM2 Configuration
```bash
# Start application with PM2
pm2 start backend/server.js --name transitguard

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Monitor application
pm2 monit
```

#### Step 5: Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/transitguard
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        root /var/www/transitguard/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/transitguard /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 6: SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Option 2: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "backend/server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_USER=transitguard
      - DB_PASSWORD=strong_password
      - DB_NAME=transitguard_prod
      - JWT_SECRET=your_jwt_secret
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mariadb:10.11
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=transitguard_prod
      - MYSQL_USER=transitguard
      - MYSQL_PASSWORD=strong_password
    volumes:
      - db_data:/var/lib/mysql
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./frontend:/usr/share/nginx/html
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - app
    restart: unless-stopped

volumes:
  db_data:
```

```bash
# Deploy with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Post-Deployment Configuration

### 1. Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_boarding_time ON boarding_logs(boarding_time);
CREATE INDEX idx_trip_status ON trips(status);
CREATE INDEX idx_ticket_used ON tickets(is_used);

-- Optimize tables
OPTIMIZE TABLE users, passengers, vehicles, trips, tickets, boarding_logs;
```

### 2. Backup Configuration
```bash
# Create backup script
sudo nano /usr/local/bin/backup-transitguard.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/transitguard"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u transitguard -p'password' transitguard_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-transitguard.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-transitguard.sh
```

### 3. Monitoring Setup

#### PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Set up log monitoring
sudo tail -f /var/log/nginx/access.log
pm2 logs transitguard
```

## 🔍 Health Checks

### Application Health
```bash
# Check if app is running
curl http://localhost:5000/

# Check API health
curl http://localhost:5000/api/dashboard/live \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Health
```bash
# Check database connection
mysql -u transitguard -p -e "SELECT 1"

# Check database size
mysql -u transitguard -p -e "
  SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
  FROM information_schema.tables
  WHERE table_schema = 'transitguard_prod'
  GROUP BY table_schema;
"
```

## 🚨 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs transitguard --lines 100

# Check environment variables
pm2 env 0

# Restart application
pm2 restart transitguard
```

### Database Connection Issues
```bash
# Check MariaDB status
sudo systemctl status mariadb

# Check database logs
sudo tail -f /var/log/mysql/error.log

# Test connection
mysql -u transitguard -p -h localhost transitguard_prod
```

### High Memory Usage
```bash
# Check memory usage
free -h
pm2 monit

# Restart application
pm2 restart transitguard

# Increase Node.js memory limit
pm2 delete transitguard
pm2 start backend/server.js --name transitguard --max-memory-restart 500M
```

## 📊 Performance Optimization

### Database Tuning
```ini
# /etc/mysql/mariadb.conf.d/50-server.cnf
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
query_cache_size = 64M
query_cache_limit = 2M
```

### Node.js Optimization
```bash
# Use cluster mode for multi-core
pm2 start backend/server.js -i max --name transitguard

# Enable production optimizations
export NODE_ENV=production
```

### Nginx Caching
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_bypass $http_cache_control;
    # ... rest of proxy config
}
```

## 🔐 Security Hardening

### Firewall Configuration
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure for Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check disk space
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review security advisories
- [ ] Quarterly: Performance audit
- [ ] Quarterly: Security audit

### Update Procedure
```bash
# Backup before update
/usr/local/bin/backup-transitguard.sh

# Pull latest code
cd /var/www/transitguard
git pull origin main

# Install dependencies
npm install --production

# Run migrations (if any)
# mysql -u transitguard -p transitguard_prod < backend/database/migrations/XXX.sql

# Restart application
pm2 restart transitguard

# Verify deployment
curl http://localhost:5000/
```

---

**For additional support, contact: support@transitguard.com**
