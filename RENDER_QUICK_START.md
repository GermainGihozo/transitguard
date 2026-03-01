# 🚀 Render Quick Start - 10 Minutes to Deploy

Deploy TransitGuard to Render in 10 minutes or less!

## 🎯 Prerequisites

- GitHub account
- Your code pushed to GitHub
- 10 minutes of your time

## 📝 Step-by-Step Guide

### Step 1: Generate Secrets (2 minutes)

```bash
npm run generate-secrets
```

Copy and save:
- JWT_SECRET
- BIOMETRIC_SECRET

### Step 2: Push to GitHub (1 minute)

```bash
git add .
git commit -m "Ready for Render"
git push origin main
```

### Step 3: Create Render Account (1 minute)

1. Go to [render.com](https://render.com)
2. Click "Get Started"
3. Sign up with GitHub

### Step 4: Deploy Web Service (3 minutes)

1. **Click "New +"** → Select "Web Service"

2. **Connect Repository**
   - Click "Connect account" (if first time)
   - Find and select your `transitguard` repository
   - Click "Connect"

3. **Configure Service**
   ```
   Name: transitguard
   Region: Oregon (or closest to you)
   Branch: main
   Root Directory: (leave blank)
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

4. **Add Environment Variables**
   
   Click "Advanced" → Scroll to "Environment Variables"
   
   Add these one by one:
   
   | Key | Value |
   |-----|-------|
   | NODE_ENV | production |
   | PORT | 10000 |
   | DB_HOST | (see Step 5) |
   | DB_USER | (see Step 5) |
   | DB_PASSWORD | (see Step 5) |
   | DB_NAME | transitguard_prod |
   | JWT_SECRET | (paste from Step 1) |
   | BIOMETRIC_SECRET | (paste from Step 1) |
   | RATE_LIMIT_MAX | 100 |

5. **Don't click "Create Web Service" yet!** 
   We need to set up the database first.

### Step 5: Set Up Database (3 minutes)

You need a MySQL database. Choose one option:

#### Option A: PlanetScale (Recommended - Free Forever)

1. Go to [planetscale.com](https://planetscale.com)
2. Sign up (free)
3. Create new database: `transitguard`
4. Click "Connect" → Get credentials
5. Copy these values back to Render environment variables:
   - DB_HOST
   - DB_USER
   - DB_PASSWORD
   - DB_NAME

#### Option B: Railway MySQL (Free Tier)

1. Go to [railway.app](https://railway.app)
2. New Project → Add MySQL
3. Click MySQL → Variables tab
4. Copy these values to Render:
   - MYSQLHOST → DB_HOST
   - MYSQLUSER → DB_USER
   - MYSQLPASSWORD → DB_PASSWORD
   - MYSQLDATABASE → DB_NAME

#### Option C: Aiven MySQL (Free Trial)

1. Go to [aiven.io](https://aiven.io)
2. Sign up for free trial
3. Create MySQL service
4. Get connection details
5. Copy to Render environment variables

### Step 6: Create Web Service (1 minute)

Now that database is ready:
1. Go back to Render
2. Verify all environment variables are set
3. Click "Create Web Service"
4. Wait 5-10 minutes for first deploy

### Step 7: Import Database Schema (2 minutes)

Once deployed, import your schema:

**If using PlanetScale:**
```bash
# Install PlanetScale CLI
brew install planetscale/tap/pscale  # Mac
# or download from planetscale.com

# Connect to database
pscale shell transitguard main

# Paste contents of backend/database/schema.sql
# Then paste contents of backend/database/seed.sql
```

**If using Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and connect
railway login
railway link

# Import schema
railway run mysql < backend/database/schema.sql
railway run mysql < backend/database/seed.sql
```

**If using Aiven or other:**
```bash
# Use standard MySQL client
mysql -h <host> -u <user> -p < backend/database/schema.sql
mysql -h <host> -u <user> -p < backend/database/seed.sql
```

### Step 8: Test Your Deployment (1 minute)

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
