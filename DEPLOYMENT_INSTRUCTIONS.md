# TransitGuard Deployment Guide

This guide covers deploying TransitGuard to various cloud platforms.

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Easiest)

Railway offers free tier with MySQL database included.

**Steps:**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

3. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js

4. **Add MySQL Database**
   - Click "New" → "Database" → "Add MySQL"
   - Railway will automatically set DATABASE_URL

5. **Set Environment Variables**
   - Go to your service → Variables
   - Add these variables:
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<generate-strong-secret-32-chars>
   BIOMETRIC_SECRET=<generate-strong-secret>
   RATE_LIMIT_MAX=100
   ```
   - Database variables are auto-set by Railway

6. **Import Database Schema**
   - Connect to Railway MySQL:
   ```bash
   railway connect MySQL
   ```
   - Import schema:
   ```bash
   mysql < backend/database/schema.sql
   mysql < backend/database/seed.sql
   ```

7. **Deploy**
   - Railway auto-deploys on git push
   - Get your URL from the deployment

---

### Option 2: Render

Render offers free tier with PostgreSQL (you'll need to adapt for MySQL).

**Steps:**

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - New → Web Service
   - Connect your GitHub repository
   - Use these settings:
     - Name: `transitguard-api`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Add MySQL Database**
   - Render doesn't offer MySQL on free tier
   - Use external MySQL (PlanetScale, AWS RDS free tier, or Railway)

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=<your-mysql-host>
   DB_USER=<your-mysql-user>
   DB_PASSWORD=<your-mysql-password>
   DB_NAME=transitguard_prod
   JWT_SECRET=<generate-strong-secret>
   BIOMETRIC_SECRET=<generate-strong-secret>
   RATE_LIMIT_MAX=100
   ```

5. **Deploy Frontend**
   - New → Static Site
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

---

### Option 3: Docker + Any Cloud Provider

Use Docker for deployment to DigitalOcean, AWS, GCP, Azure, etc.

**Steps:**

1. **Build Docker Image**
   ```bash
   docker build -t transitguard .
   ```

2. **Run with Docker Compose (Local Testing)**
   ```bash
   # Create .env file with your secrets
   cp backend/.env.example .env
   
   # Edit .env with production values
   nano .env
   
   # Start all services
   docker-compose up -d
   ```

3. **Deploy to Cloud**
   
   **DigitalOcean App Platform:**
   - Create new app from GitHub
   - Use Dockerfile for build
   - Add managed MySQL database
   - Set environment variables
   
   **AWS ECS/Fargate:**
   - Push image to ECR
   - Create ECS task definition
   - Use RDS for MySQL
   - Configure ALB for load balancing
   
   **Google Cloud Run:**
   ```bash
   gcloud run deploy transitguard \
     --image gcr.io/PROJECT_ID/transitguard \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

---

### Option 4: Vercel (Frontend) + Railway (Backend)

Split deployment for optimal performance.

**Backend on Railway:**
- Follow Railway steps above for backend only

**Frontend on Vercel:**

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - New Project → Import from GitHub
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variable**
   ```
   VITE_API_URL=https://your-railway-backend.up.railway.app
   ```

4. **Update Frontend Config**
   - Edit `frontend/js/config.js` to use environment variable:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Generate strong BIOMETRIC_SECRET
- [ ] Set NODE_ENV=production
- [ ] Use strong database password
- [ ] Enable HTTPS (most platforms do this automatically)
- [ ] Configure CORS for your frontend domain only
- [ ] Set up database backups
- [ ] Enable rate limiting (already configured)
- [ ] Review and restrict database user permissions
- [ ] Set up monitoring and alerts
- [ ] Configure logging

---

## 🗄️ Database Migration

After deployment, run migrations:

```bash
# If using Railway CLI
railway run npm run migrate

# If using direct MySQL connection
mysql -h <host> -u <user> -p <database> < backend/database/schema.sql
```

---

## 📊 Monitoring

**Health Check Endpoint:**
```
GET https://your-domain.com/
```

**Expected Response:**
```json
{
  "service": "TransitGuard API",
  "status": "running",
  "version": "1.0.0",
  "timestamp": "2026-03-01T..."
}
```

---

## 🔧 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| NODE_ENV | Yes | Environment mode | production |
| PORT | Yes | Server port | 5000 |
| DB_HOST | Yes | Database host | db.railway.internal |
| DB_USER | Yes | Database user | root |
| DB_PASSWORD | Yes | Database password | secure_password |
| DB_NAME | Yes | Database name | transitguard_prod |
| JWT_SECRET | Yes | JWT signing key | min_32_chars_random_string |
| BIOMETRIC_SECRET | Yes | Biometric encryption key | random_secret_key |
| RATE_LIMIT_MAX | No | Rate limit per 15min | 100 |

---

## 🆘 Troubleshooting

**Database Connection Failed:**
- Verify DB_HOST, DB_USER, DB_PASSWORD are correct
- Check if database service is running
- Ensure database exists and schema is imported

**502 Bad Gateway:**
- Check if backend is running: `curl https://your-api.com/`
- Review application logs
- Verify PORT environment variable

**CORS Errors:**
- Update CORS configuration in `backend/server.js`
- Add your frontend domain to allowed origins

**Build Failures:**
- Check Node.js version (requires >=16.0.0)
- Verify all dependencies are in package.json
- Review build logs for specific errors

---

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review application logs
3. Test locally with Docker first
4. Open an issue on GitHub

---

**Recommended: Start with Railway for the easiest deployment experience!**
