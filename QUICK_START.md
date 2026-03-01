# TransitGuard - Quick Start Guide

Get TransitGuard up and running in 5 minutes!

## Prerequisites

- Node.js v16+ installed
- MariaDB/MySQL installed and running
- Git installed

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/GermainGihozo/transitguard.git
cd transitguard

# Install dependencies
npm install
```

## Step 2: Database Setup (1 minute)

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE transitguard_prod;
EXIT;

# Import schema
mysql -u root -p transitguard_prod < backend/database/schema.sql
```

## Step 3: Configure Environment (1 minute)

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit configuration (use your favorite editor)
nano backend/.env
```

Minimum required configuration:
```env
JWT_SECRET=your_secret_key_min_32_characters_long_change_this
DB_PASSWORD=your_mysql_password
```

## Step 4: Start the Server (30 seconds)

```bash
# Start in development mode
npm run dev

# Or start in production mode
npm start
```

You should see:
```
✓ Environment variables validated
✓ MySQL Connected...
✓ Server running on port 5000
```

## Step 5: Access the Application (30 seconds)

Open your browser and navigate to:
- **Frontend**: http://localhost:5000 (if serving frontend through Express)
- **API**: http://localhost:5000/api

Or serve the frontend separately:
```bash
# Using Python's built-in server
cd frontend
python -m http.server 8000

# Then access: http://localhost:8000
```

## Default Test Credentials

Create a super admin user:

```bash
# Login to MySQL
mysql -u root -p transitguard_prod

# Insert super admin (password: Admin@123)
INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES
('System Admin', 'admin@transitguard.com', '$2a$10$YourHashedPasswordHere', 'super_admin', TRUE);
```

Or register through the API:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Admin User",
    "email": "admin@test.com",
    "password": "Admin@123",
    "fingerprint_template": "SIMULATED_TEMPLATE_123",
    "role": "super_admin"
  }'
```

## Quick Test

Test the API:
```bash
# Health check
curl http://localhost:5000/

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123"
  }'
```

## Next Steps

1. **Read the Documentation**
   - Full API docs: `backend/API_DOCUMENTATION.md`
   - Deployment guide: `DEPLOYMENT_GUIDE.md`
   - Complete README: `README.md`

2. **Explore the Dashboards**
   - Super Admin: `super_admin_dashboard.html`
   - Conductor: `conductor_dashboard.html`
   - Station Officer: `station_dashboard.html`
   - Company Admin: `company_dashboard.html`
   - Authority: `authority_dashboard.html`

3. **Configure for Production**
   - Follow `DEPLOYMENT_GUIDE.md`
   - Set up SSL certificates
   - Configure proper backups
   - Enable monitoring

## Common Issues

### Port Already in Use
```bash
# Change port in .env
PORT=3000
```

### Database Connection Failed
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials in .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=transitguard_prod
```

### JWT_SECRET Error
```bash
# Make sure JWT_SECRET is at least 32 characters
JWT_SECRET=a_very_long_random_string_at_least_32_characters_long
```

## Development Tips

```bash
# Watch for changes (auto-reload)
npm run dev

# Check logs
tail -f logs/app.log

# Test API endpoints
# Use Postman, Insomnia, or curl
```

## Need Help?

- Check `README.md` for detailed documentation
- Review `backend/API_DOCUMENTATION.md` for API reference
- Open an issue on GitHub
- Email: support@transitguard.com

---

**You're all set! Start building with TransitGuard 🚀**
