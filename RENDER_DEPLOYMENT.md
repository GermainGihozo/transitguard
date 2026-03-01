# 🚀 Deploy TransitGuard to Render

Complete guide for deploying TransitGuard to Render's free tier.

## 📋 What You Get with Render

- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Auto-deploy from GitHub
- ✅ PostgreSQL database (free tier)
- ✅ Easy environment variables
- ✅ Built-in health checks
- ✅ Zero-downtime deploys

## ⚠️ Important Note: Database

Render's free tier includes **PostgreSQL**, not MySQL. You have two options:

### Option 1: Use PostgreSQL (Recommended for Render)
Requires minor code changes to use PostgreSQL instead of MySQL.

### Option 2: Use External MySQL
Use a free MySQL service like:
- PlanetScale (free tier)
- Railway MySQL
- AWS RDS free tier

This guide covers **Option 2** (External MySQL) since your code is already MySQL-ready.

---

## 🚀 Quick Deployment Steps

### Step 1: Prepare Your Code

1. **Generate Secrets**
   ```bash
   npm run generate-secrets
   ```
   Save the generated secrets!

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

### Step 2: Set Up MySQL Database

Since Render free tier only has PostgreSQL, use an external MySQL:

**Option A: PlanetScale (Recommended)**
1. Go to [planetscale.com](https://planetscale.com)
2. Create free account
3. Create new database: `transitguard`
4. Get connection details
5. Import schema:
   ```bash
   pscale shell transitguard main
   # Then paste contents of backend/database/schema.sql
   ```

**Option B: Railway MySQL**
1. Go to [railway.app](https://railway.app)
2. New Project → Add MySQL
3. Get connection details
4. Import schema via Railway CLI

### Step 3: Deploy to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your `transitguard` repo

3. **Configure Build Settings**
   ```
   Name: transitguard
   Region: Oregon (or closest to you)
   Branch: main
   Root Directory: (leave blank)
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Select Plan**
   - Choose "Free" plan

5. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable"
   
   Add these variables:
   ```
   NODE_ENV=production
   PORT=10000
   
   # Your external MySQL database
   DB_HOST=<your-mysql-host>
   DB_USER=<your-mysql-user>
   DB_PASSWORD=<your-mysql-password>
   DB_NAME=transitguard_prod
   DB_PORT=3306
   
   # Your generated secrets
   JWT_SECRET=<your-jwt-secret-from-step-1>
   BIOMETRIC_SECRET=<your-biometric-secret-from-step-1>
   
   RATE_LIMIT_MAX=100
   ```

6. **Create Web Service**
   - Click "Create Web Service"
   - Render will start building and deploying

### Step 4: Wait for Deployment

- First deploy takes 5-10 minutes
- Watch the logs for any errors
- Once you see "✓ Server running on port 10000", you're live!

### Step 5: Get Your URL

Your app will be available at:
```
https://transitguard.onrender.com
```
(or your custom name)

### Step 6: Import Database Data

If you want seed data:

```bash
# Connect to your MySQL database
mysql -h <your-mysql-host> -u <user> -p

# Import seed data
source backend/database/seed.sql
source backend/database/seed_stations.sql
```

### Step 7: Create First User

```bash
# Using curl
curl -X POST https://transitguard.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!",
    "email": "admin@transitguard.com",
    "role": "super_admin",
    "full_name": "System Administrator"
  }'
```

---

## 🎯 Verify Deployment

### Test Health Endpoint
```bash
curl https://transitguard.onrender.com/
```

Expected response:
```json
{
  "service": "TransitGuard API",
  "status": "running",
  "version": "1.0.0",
  "timestamp": "2026-03-01T..."
}
```

### Test Frontend
Open in browser:
```
https://transitguard.onrender.com
```

You should see the login page.

---

## 🔄 Auto-Deploy Setup

Render automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Render auto-deploys!
```

---

## ⚙️ Configuration Tips

### Custom Domain
1. Go to your service → Settings
2. Click "Add Custom Domain"
3. Follow DNS setup instructions

### Environment Variables
Update anytime:
1. Service → Environment
2. Edit variables
3. Service auto-restarts

### View Logs
1. Service → Logs
2. Real-time log streaming
3. Filter by severity

### Manual Deploy
1. Service → Manual Deploy
2. Click "Deploy latest commit"

---

## 🐛 Troubleshooting

### Build Fails

**Error: "npm install failed"**
- Check Node.js version in logs
- Verify package.json is valid
- Check for missing dependencies

**Solution:**
```bash
# Test build locally first
npm install
npm run build
```

### Database Connection Fails

**Error: "ECONNREFUSED" or "Access denied"**
- Verify DB_HOST is correct
- Check DB_USER and DB_PASSWORD
- Ensure database allows external connections
- Check DB_PORT (usually 3306 for MySQL)

**Solution:**
- Test connection locally with same credentials
- Check database firewall rules
- Verify SSL requirements

### App Crashes on Start

**Error: "Application failed to respond"**
- Check logs for specific error
- Verify all environment variables are set
- Ensure PORT is set to 10000

**Solution:**
```bash
# Check required env vars
NODE_ENV, PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, BIOMETRIC_SECRET
```

### 502 Bad Gateway

**Render shows 502 error**
- App might be starting (wait 2-3 minutes)
- Check logs for startup errors
- Verify health check endpoint works

**Solution:**
- Ensure `GET /` endpoint returns 200 OK
- Check if database is accessible
- Review application logs

### Free Tier Limitations

**App spins down after inactivity**
- Render free tier sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Upgrade to paid plan for always-on

**Solution:**
- Use a uptime monitor (UptimeRobot) to ping every 14 minutes
- Or upgrade to paid plan ($7/month)

---

## 📊 Monitoring

### Health Checks
Render automatically monitors:
```
GET https://transitguard.onrender.com/
```

### Manual Monitoring
Set up external monitoring:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://pingdom.com)
- [StatusCake](https://statuscake.com)

### Logs
Access logs:
1. Render Dashboard → Your Service
2. Click "Logs" tab
3. Real-time streaming

---

## 💰 Cost Breakdown

### Free Tier Includes:
- ✅ 750 hours/month (enough for 1 service)
- ✅ Automatic HTTPS
- ✅ Auto-deploy from Git
- ✅ Custom domains
- ✅ Sleeps after 15 min inactivity

### Paid Tier ($7/month):
- ✅ Always-on (no sleep)
- ✅ More resources
- ✅ Faster builds
- ✅ Priority support

### Database Options:
- PostgreSQL on Render: Free (90 days), then $7/month
- External MySQL: Free options available (PlanetScale, Railway)

---

## 🔒 Security Checklist

After deployment:
- ✅ HTTPS enabled (automatic)
- ✅ Strong JWT_SECRET set
- ✅ Strong BIOMETRIC_SECRET set
- ✅ Database password is strong
- ✅ Environment variables are secure
- ✅ CORS configured properly
- ✅ Rate limiting enabled

---

## 🚀 Next Steps

1. **Test all features:**
   - User registration/login
   - Passenger management
   - Vehicle management
   - Trip scheduling
   - Boarding operations

2. **Set up monitoring:**
   - Add uptime monitor
   - Configure alerts
   - Monitor logs

3. **Backup database:**
   - Set up automated backups
   - Test restore process

4. **Optimize performance:**
   - Monitor response times
   - Check database queries
   - Review logs for errors

---

## 📞 Support

**Render Issues:**
- [Render Docs](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status](https://status.render.com)

**App Issues:**
- Check application logs
- Review `DEPLOYMENT_CHECKLIST.md`
- Open GitHub issue

---

## 🎉 Success!

Your TransitGuard app is now live on Render!

**Your URLs:**
- App: `https://transitguard.onrender.com`
- API: `https://transitguard.onrender.com/api`
- Health: `https://transitguard.onrender.com/`

**Next:** Create your first admin user and start using the system!

---

**Pro Tip:** Render free tier is perfect for testing and demos. For production with high traffic, consider upgrading to the paid tier for always-on service.
