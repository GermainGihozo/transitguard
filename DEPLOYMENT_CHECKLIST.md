# 🚀 Pre-Deployment Checklist

Use this checklist before deploying TransitGuard to production.

## ✅ Code Preparation

- [ ] All code committed to Git
- [ ] No sensitive data in code (passwords, API keys, etc.)
- [ ] `.env` file is in `.gitignore`
- [ ] Frontend build tested locally: `cd frontend && npm run build`
- [ ] Backend tested locally: `npm start`
- [ ] All dependencies listed in `package.json`

## ✅ Environment Variables

Generate strong secrets (use this command):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Required variables:
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000` (or platform default)
- [ ] `DB_HOST` - Database host
- [ ] `DB_USER` - Database user
- [ ] `DB_PASSWORD` - Strong password
- [ ] `DB_NAME=transitguard_prod`
- [ ] `JWT_SECRET` - 32+ character random string
- [ ] `BIOMETRIC_SECRET` - Random string
- [ ] `RATE_LIMIT_MAX=100`

## ✅ Database Setup

- [ ] Database created
- [ ] Schema imported: `mysql < backend/database/schema.sql`
- [ ] Seed data imported (optional): `mysql < backend/database/seed.sql`
- [ ] Database user has proper permissions
- [ ] Database backups configured
- [ ] Connection tested from application

## ✅ Security

- [ ] Strong JWT_SECRET generated (min 32 chars)
- [ ] Strong BIOMETRIC_SECRET generated
- [ ] Strong database password
- [ ] HTTPS/SSL enabled (usually automatic on platforms)
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled (already in code)
- [ ] SQL injection protection verified (using parameterized queries)
- [ ] Input validation enabled (already in code)

## ✅ Frontend Configuration

- [ ] API URL updated in `frontend/js/config.js` for production
- [ ] Build command works: `npm run build`
- [ ] Static files optimized
- [ ] Assets loading correctly

## ✅ Platform-Specific

### Railway
- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] MySQL database added
- [ ] Environment variables set
- [ ] Database schema imported
- [ ] Deployment successful

### Render
- [ ] Render account created
- [ ] Web service created
- [ ] Database connected (external MySQL)
- [ ] Environment variables set
- [ ] Build and start commands configured
- [ ] Deployment successful

### Docker
- [ ] Docker installed
- [ ] `.env` file created with production values
- [ ] `docker-compose.yml` configured
- [ ] Images built successfully
- [ ] Containers running
- [ ] Health checks passing

### Vercel (Frontend only)
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Build settings configured
- [ ] API URL environment variable set
- [ ] Deployment successful

## ✅ Post-Deployment

- [ ] Health check endpoint working: `GET /`
- [ ] API endpoints responding: `GET /api/`
- [ ] Frontend loading correctly
- [ ] Login functionality working
- [ ] Database queries executing
- [ ] Create test user: `npm run create-user`
- [ ] Test all user roles
- [ ] Test passenger registration
- [ ] Test trip creation
- [ ] Test boarding scan
- [ ] Monitor logs for errors
- [ ] Set up monitoring/alerts
- [ ] Document deployment URL
- [ ] Update README with live URL

## ✅ Monitoring & Maintenance

- [ ] Error logging configured
- [ ] Performance monitoring set up
- [ ] Database backup schedule
- [ ] SSL certificate auto-renewal
- [ ] Update plan documented
- [ ] Rollback plan documented

## 🆘 Quick Tests

After deployment, run these quick tests:

1. **Health Check**
   ```bash
   curl https://your-domain.com/
   ```
   Should return: `{"service":"TransitGuard API","status":"running",...}`

2. **API Test**
   ```bash
   curl https://your-domain.com/api/
   ```

3. **Login Test**
   - Open frontend URL
   - Try logging in with test user
   - Check browser console for errors

4. **Database Test**
   ```bash
   # Create a test user
   curl -X POST https://your-domain.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"Test123!","role":"station_officer"}'
   ```

## 📊 Success Criteria

Your deployment is successful when:
- ✅ Health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ Users can log in
- ✅ Database queries work
- ✅ All API endpoints respond
- ✅ No errors in logs
- ✅ HTTPS is working
- ✅ Performance is acceptable

## 🔄 Rollback Plan

If deployment fails:
1. Check logs for errors
2. Verify environment variables
3. Test database connection
4. Revert to previous version if needed
5. Fix issues locally first
6. Redeploy

---

**Ready to deploy? Choose your platform and follow DEPLOYMENT_INSTRUCTIONS.md!**
