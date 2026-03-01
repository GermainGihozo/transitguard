# 🚀 Quick Deployment Guide

Get TransitGuard deployed in minutes!

## 🎯 Fastest Path: Railway (Recommended)

Railway offers the easiest deployment with free MySQL database included.

### 1. Generate Secrets
```bash
npm run generate-secrets
```
Copy the generated secrets - you'll need them!

### 2. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3. Deploy to Railway

**Option A: Using Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project
railway init

# Add MySQL database
railway add

# Set environment variables
railway variables set JWT_SECRET=<your-jwt-secret>
railway variables set BIOMETRIC_SECRET=<your-biometric-secret>
railway variables set NODE_ENV=production

# Deploy
railway up
```

**Option B: Using Railway Dashboard**
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Click "Add Database" → "MySQL"
5. Go to Variables tab and add:
   - `JWT_SECRET`
   - `BIOMETRIC_SECRET`
   - `NODE_ENV=production`
6. Railway auto-deploys!

### 4. Import Database Schema
```bash
# Connect to Railway MySQL
railway connect MySQL

# In the MySQL prompt, run:
source backend/database/schema.sql
source backend/database/seed.sql
exit
```

### 5. Get Your URL
```bash
railway domain
```

Your app is live! 🎉

---

## 🐳 Alternative: Docker (Local or Cloud)

### Quick Start
```bash
# Generate secrets
npm run generate-secrets

# Edit .env with your values
nano .env

# Start with Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Access at: `http://localhost:5000`

---

## 📋 What Was Created

Your project now has:

✅ **Deployment Configs:**
- `Dockerfile` - Docker container configuration
- `docker-compose.yml` - Multi-container setup with MySQL
- `railway.json` - Railway platform configuration
- `render.yaml` - Render platform configuration
- `vercel.json` - Vercel platform configuration
- `Procfile` - Heroku/Railway process file

✅ **Helper Scripts:**
- `generate-secrets.js` - Generate secure secrets
- `deploy.sh` - Interactive deployment helper

✅ **Documentation:**
- `DEPLOYMENT_INSTRUCTIONS.md` - Detailed deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `DEPLOY_README.md` - This quick start guide

✅ **Code Updates:**
- Backend now serves frontend in production
- Build scripts added to package.json
- Production-ready server configuration

---

## 🔒 Security Reminders

Before going live:
- ✅ Use strong, unique secrets (use `npm run generate-secrets`)
- ✅ Never commit `.env` files
- ✅ Enable HTTPS (automatic on most platforms)
- ✅ Set `NODE_ENV=production`
- ✅ Use strong database password

---

## 🆘 Need Help?

1. **Check the detailed guide:** `DEPLOYMENT_INSTRUCTIONS.md`
2. **Follow the checklist:** `DEPLOYMENT_CHECKLIST.md`
3. **Platform-specific issues:** Check platform documentation
4. **Still stuck?** Open an issue on GitHub

---

## 📊 Verify Deployment

After deployment, test these:

```bash
# Health check
curl https://your-domain.com/

# Should return:
# {"service":"TransitGuard API","status":"running",...}

# API check
curl https://your-domain.com/api/

# Frontend
# Open https://your-domain.com in browser
```

---

## 🎯 Next Steps

After successful deployment:

1. Create your first admin user:
   ```bash
   railway run npm run create-user
   # Or via API
   ```

2. Log in to the frontend

3. Set up your organization:
   - Add vehicles
   - Create routes
   - Register passengers
   - Schedule trips

4. Monitor your deployment:
   - Check logs regularly
   - Set up alerts
   - Monitor database size
   - Review rate limits

---

**Happy Deploying! 🚀**

For detailed instructions, see `DEPLOYMENT_INSTRUCTIONS.md`
