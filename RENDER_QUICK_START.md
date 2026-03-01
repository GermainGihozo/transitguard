# 🚀 Render Quick Start - 5 Minutes to Deploy (PostgreSQL)

Deploy TransitGuard to Render in 5 minutes with FREE PostgreSQL included!

## 🎯 Prerequisites

- GitHub account
- Your code pushed to GitHub
- 5 minutes of your time

## 🎉 Why This is Easy

Render's free tier includes PostgreSQL - no external database needed!

## 📝 Step-by-Step Guide

### Step 1: Migrate to PostgreSQL (1 minute)

```bash
# Automated migration
npm run migrate-to-postgres

# Or manual: See POSTGRES_MIGRATION.md
```

This updates your code to use PostgreSQL instead of MySQL.

### Step 2: Generate Secrets (1 minute)

```bash
npm run generate-secrets
```

Copy and save:
- JWT_SECRET
- BIOMETRIC_SECRET

### Step 3: Push to GitHub (1 minute)

```bash
git add .
git commit -m "Ready for Render with PostgreSQL"
git push origin main
```

### Step 4: Create Render Account (1 minute)

1. Go to [render.com](https://render.com)
2. Click "Get Started"
3. Sign up with GitHub

### Step 5: Deploy with Blueprint (1 minute)

Render can auto-configure everything using `render.yaml`:

1. **Click "New +"** → Select "Blueprint"

2. **Connect Repository**
   - Find and select your `transitguard` repository
   - Click "Connect"

3. **Render Reads render.yaml**
   - Automatically creates:
     - Web Service (your app)
     - PostgreSQL Database (free!)
     - Environment variables
   - Click "Apply"

4. **That's it!** Render deploys everything automatically.

### Alternative: Manual Setup (if not using Blueprint)

If you prefer manual setup:

1. **Create PostgreSQL Database First**
   - Click "New +" → "PostgreSQL"
   - Name: `transitguard-db`
   - Database: `transitguard_prod`
   - Plan: Free
   - Click "Create Database"

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Configure:
     ```
     Name: transitguard
     Region: Oregon
     Branch: main
     Runtime: Node
     Build Command: npm install && npm run build
     Start Command: npm start
     Instance Type: Free
     ```

3. **Add Environment Variables**
   
   Click "Advanced" → Add these:
   
   | Key | Value |
   |-----|-------|
   | NODE_ENV | production |
   | PORT | 10000 |
   | DATABASE_URL | (Select "From Database" → transitguard-db) |
   | JWT_SECRET | (paste from Step 2) |
   | BIOMETRIC_SECRET | (paste from Step 2) |
   | RATE_LIMIT_MAX | 100 |

4. **Create Web Service**

### Step 6: Import Database Schema (1 minute)

Once deployed, import your schema:

**Option A: Using Render Shell**
1. Go to your database in Render dashboard
2. Click "Connect" → "External Connection"
3. Copy the PSQL command
4. Run locally:
   ```bash
   psql <connection-string> < backend/database/schema-postgres.sql
   ```

**Option B: Using Render Dashboard**
1. Go to your database
2. Click "Connect" → "PSQL Command"
3. Copy and run in your terminal
4. Then paste contents of `schema-postgres.sql`

### Step 7: Test Your Deployment (1 minute)

Your app is at: `https://transitguard.onrender.com` (or your chosen name)

**Test health endpoint:**
```bash
curl https://transitguard.onrender.com/
```

Should return:
```json
{
  "service": "TransitGuard API",
  "status": "running",
  "version": "1.0.0"
}
```

**Open in browser:**
```
https://transitguard.onrender.com
```

You should see the login page!

### Step 9: Create First User

```bash
curl -X POST https://transitguard.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!",
    "email": "admin@example.com",
    "role": "super_admin",
    "full_name": "System Admin"
  }'
```

### Step 10: Login and Use! 🎉

1. Go to your app URL
2. Login with:
   - Username: `admin`
   - Password: `Admin123!`
3. Start using TransitGuard!

---

## 🔄 Auto-Deploy

Every time you push to GitHub, Render automatically deploys:

```bash
git add .
git commit -m "New feature"
git push origin main
# Render auto-deploys!
```

---

## ⚠️ Important Notes

### Free Tier Limitations
- App sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month (enough for 1 service)

### Keep App Awake (Optional)
Use a free uptime monitor to ping every 14 minutes:
- [UptimeRobot](https://uptimerobot.com)
- [Cron-job.org](https://cron-job.org)

Set it to ping: `https://transitguard.onrender.com/`

---

## 🐛 Troubleshooting

### "Build failed"
- Check logs in Render dashboard
- Verify package.json is correct
- Try building locally: `npm install && npm run build`

### "Database connection failed"
- Verify DB_HOST, DB_USER, DB_PASSWORD are correct
- Check if database allows external connections
- Test connection locally with same credentials

### "502 Bad Gateway"
- Wait 2-3 minutes (app might be starting)
- Check logs for errors
- Verify all environment variables are set

### "App is slow"
- Free tier sleeps after inactivity
- First request wakes it up (30-60 seconds)
- Use uptime monitor or upgrade to paid tier

---

## 💰 Costs

**Free Tier:**
- Web Service: Free (with sleep)
- Database: Use external free options

**Paid Tier ($7/month):**
- Always-on (no sleep)
- Better performance
- More resources

**Database Options:**
- PlanetScale: Free forever (5GB)
- Railway: Free tier available
- Aiven: Free trial, then paid

---

## 📊 What You Get

✅ Automatic HTTPS
✅ Auto-deploy from GitHub
✅ Free tier available
✅ Custom domains
✅ Environment variables
✅ Real-time logs
✅ Health checks
✅ Zero-downtime deploys

---

## 🎯 Next Steps

1. **Customize your app**
   - Update branding
   - Configure settings
   - Add users

2. **Set up monitoring**
   - Add uptime monitor
   - Configure alerts

3. **Backup database**
   - Set up automated backups
   - Test restore process

4. **Go live!**
   - Share your URL
   - Start using the system

---

## 📞 Need Help?

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Detailed Guide:** See `RENDER_DEPLOYMENT.md`
- **Checklist:** See `DEPLOYMENT_CHECKLIST.md`

---

**🎉 Congratulations! Your TransitGuard app is live on Render!**

Your URL: `https://transitguard.onrender.com`
