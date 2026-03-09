# TransitGuard - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js v16+ installed
- MySQL 8.0+ running
- Git installed

---

## Step 1: Clone & Install

```bash
git clone https://github.com/GermainGihozo/transitguard.git
cd transitguard
npm install
```

---

## Step 2: Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE transitguard_prod;
exit

# Run migrations
npm run migrate

# Seed stations (optional)
npm run seed-stations
```

---

## Step 3: Configure Environment

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=transitguard_prod

# Security (generate secure keys in production)
JWT_SECRET=transitguard_super_secret_key_change_in_production_min_32_chars
BIOMETRIC_SECRET=transitguard_biometric_ultra_secure_key_change_in_production

# Rate Limiting
RATE_LIMIT_MAX=100
```

---

## Step 4: Create Super Admin

```bash
npm run create-user
```

Follow the prompts:
- **Email**: admin@transitguard.com
- **Password**: Admin@123 (change in production!)
- **Role**: super_admin
- **Name**: Admin User

---

## Step 5: Seed Sample Data (Optional)

```bash
# Create sample passengers and boarding history
npm run seed-analytics
```

This creates:
- 10 sample passengers
- 370+ boarding records
- 30 days of analytics data

---

## Step 6: Start the Server

```bash
npm start
```

Server will start on http://localhost:5000

---

## Step 7: Access Dashboard

1. Open browser: http://localhost:5000
2. Click "Login"
3. Enter credentials:
   - Email: admin@transitguard.com
   - Password: Admin@123
4. You'll be redirected to Super Admin Dashboard

---

## 🎯 What You Can Do Now

### Overview Section
- View real-time statistics
- Monitor boarding activity
- Check active trips
- See recent boardings

### User Management
- Create company admins
- Manage user accounts
- Reset passwords
- View user activity

### Passenger Management
- Register new passengers
- Search passengers
- View passenger details
- Assign tickets

### Analytics
- View boarding trends
- Check approval rates
- Analyze peak hours
- Generate reports

### Settings
- Configure system
- Manage security
- Set up notifications
- View system info

---

## 🔧 Common Commands

```bash
# Development with auto-reload
npm run dev

# Create test user
npm run create-user

# Seed analytics data
npm run seed-analytics

# Run migrations
npm run migrate

# Seed stations
npm run seed-stations

# Generate secure secrets
npm run generate-secrets
```

---

## 📱 Access Other Dashboards

Different roles have different dashboards:

- **Super Admin**: `/super_admin_dashboard.html`
- **Company Admin**: `/company_dashboard.html`
- **Station Officer**: `/station_dashboard.html`
- **Authority**: `/authority_dashboard.html`
- **Conductor**: `/conductor_dashboard.html`

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <process_id> /F
```

### Database connection failed
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists

### Can't login
- Verify user was created
- Check console for errors (F12)
- Clear browser cache (Ctrl+Shift+Delete)

### Analytics not showing
- Run `npm run seed-analytics`
- Check browser console for errors
- Verify server is running

---

## 🔐 Security Notes

### For Production:
1. Change all default passwords
2. Generate new JWT_SECRET (32+ chars)
3. Use strong database password
4. Enable HTTPS
5. Set NODE_ENV=production
6. Configure firewall rules
7. Enable rate limiting
8. Set up backup schedule

---

## 📊 Sample Credentials

### Super Admin
- Email: admin@transitguard.com
- Password: Admin@123

### Test Passengers
Created by seed script:
- Test Passenger 1-10
- National IDs: 1234567890000001-10
- Phones: +250788123451-60

---

## 🎓 Next Steps

1. **Explore the Dashboard** - Click through all sections
2. **Create Real Users** - Add company admins
3. **Register Passengers** - Add real passenger data
4. **Create Trips** - Set up routes and schedules
5. **Test Boarding** - Use scan functionality
6. **View Analytics** - Monitor system performance
7. **Configure Settings** - Customize to your needs

---

## 📞 Need Help?

- Check `SUPER_ADMIN_DASHBOARD_COMPLETE.md` for detailed docs
- Review API endpoints in code
- Check browser console (F12) for errors
- Verify server logs for issues

---

## ✅ Verification Checklist

- [ ] Database created and migrated
- [ ] Super admin user created
- [ ] Server starts without errors
- [ ] Can login to dashboard
- [ ] All sections load properly
- [ ] Analytics charts display
- [ ] Can create/edit users
- [ ] Can register passengers
- [ ] Settings save correctly

---

**You're all set! 🎉**

The TransitGuard system is now ready to use. Start by exploring the dashboard and familiarizing yourself with all the features.
