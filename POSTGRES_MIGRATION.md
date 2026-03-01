# 🔄 MySQL to PostgreSQL Migration Guide

This guide helps you migrate TransitGuard from MySQL to PostgreSQL for easier Render deployment.

## ✅ What's Changed

### Files Updated:
- ✅ `package.json` - Changed `mysql2` to `pg`
- ✅ `backend/config/db-postgres.js` - New PostgreSQL connection
- ✅ `backend/database/schema-postgres.sql` - PostgreSQL-compatible schema
- ✅ `backend/.env.example` - Updated for PostgreSQL

### Key Differences:

| Feature | MySQL | PostgreSQL |
|---------|-------|------------|
| Auto Increment | `AUTO_INCREMENT` | `SERIAL` |
| Enum Types | `ENUM('a','b')` | `VARCHAR CHECK (col IN ('a','b'))` |
| Boolean | `BOOLEAN` | `BOOLEAN` (native) |
| Connection | `mysql2` package | `pg` package |
| Updated At | `ON UPDATE CURRENT_TIMESTAMP` | Trigger function |

## 🚀 Migration Steps

### Step 1: Update Dependencies

```bash
# Remove MySQL
npm uninstall mysql2

# Install PostgreSQL
npm install pg
```

### Step 2: Update Database Configuration

Replace `backend/config/db.js` with PostgreSQL version:

```bash
# Backup old config
mv backend/config/db.js backend/config/db-mysql.js

# Use PostgreSQL config
cp backend/config/db-postgres.js backend/config/db.js
```

Or manually update `backend/config/db.js` to use the PostgreSQL connection code.

### Step 3: Update Environment Variables

Update your `.env` file:

```env
# PostgreSQL connection (Render provides this automatically)
DATABASE_URL=postgresql://user:password@host:5432/database

# Or individual parameters
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=transitguard_prod
DB_PORT=5432
```

### Step 4: Update Schema

Use the PostgreSQL schema:

```bash
# Local PostgreSQL
psql -U postgres -d transitguard_prod -f backend/database/schema-postgres.sql

# Or create database first
createdb transitguard_prod
psql -U postgres -d transitguard_prod -f backend/database/schema-postgres.sql
```

### Step 5: Update Query Syntax (If Needed)

Most queries work the same, but watch for:

**Parameter Placeholders:**
```javascript
// MySQL uses ?
db.query('SELECT * FROM users WHERE id = ?', [id])

// PostgreSQL uses $1, $2, etc.
db.query('SELECT * FROM users WHERE id = $1', [id])
```

**LIMIT/OFFSET:**
```javascript
// Both work the same
db.query('SELECT * FROM users LIMIT 10 OFFSET 20')
```

**RETURNING Clause:**
```javascript
// PostgreSQL can return inserted data
db.query('INSERT INTO users (...) VALUES (...) RETURNING *')
```

### Step 6: Test Locally

```bash
# Start PostgreSQL (if not running)
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Start PostgreSQL service

# Test connection
npm run test-connection

# Start server
npm start
```

## 🔧 Code Changes Needed

### Update db.js

Replace the entire file with:

```javascript
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

// Test connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("✓ PostgreSQL Connected...");
    client.release();
  } catch (err) {
    console.error("✗ Database connection failed:", err.message);
    process.exit(1);
  }
})();

module.exports = pool;
```

### Update Query Syntax in Controllers

Find and replace in all controller files:

```javascript
// OLD (MySQL)
const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);

// NEW (PostgreSQL)
const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
const rows = result.rows;
```

## 🎯 Render Deployment with PostgreSQL

### Advantages:
- ✅ PostgreSQL included in Render free tier
- ✅ No external database needed
- ✅ Automatic DATABASE_URL environment variable
- ✅ Automatic backups
- ✅ Better performance

### Deployment Steps:

1. **Push PostgreSQL changes to GitHub**
   ```bash
   git add .
   git commit -m "Migrate to PostgreSQL"
   git push origin main
   ```

2. **Create Render Web Service**
   - Go to render.com
   - New Web Service
   - Connect GitHub repo

3. **Add PostgreSQL Database**
   - In Render dashboard
   - Click "New +" → "PostgreSQL"
   - Name: `transitguard-db`
   - Plan: Free

4. **Link Database to Web Service**
   - Go to your web service
   - Environment tab
   - Add environment variable:
     - Key: `DATABASE_URL`
     - Value: Select "From Database" → Choose your PostgreSQL database

5. **Deploy!**
   - Render automatically deploys
   - Database schema is created on first run

## 🐛 Troubleshooting

### "Cannot find module 'pg'"
```bash
npm install pg
```

### "Connection refused"
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Check firewall settings

### "Syntax error near 'AUTO_INCREMENT'"
- You're using MySQL schema with PostgreSQL
- Use `schema-postgres.sql` instead

### "Column does not exist"
- PostgreSQL is case-sensitive
- Use lowercase column names
- Or quote identifiers: `"columnName"`

## 📊 Performance Comparison

| Feature | MySQL | PostgreSQL |
|---------|-------|------------|
| ACID Compliance | ✅ | ✅ |
| JSON Support | Basic | Advanced |
| Full Text Search | Basic | Advanced |
| Concurrent Writes | Good | Excellent |
| Complex Queries | Good | Excellent |
| Free Hosting | Limited | Render, Heroku, etc. |

## 🔄 Rollback to MySQL

If you need to rollback:

```bash
# Reinstall MySQL
npm uninstall pg
npm install mysql2

# Restore old config
mv backend/config/db-mysql.js backend/config/db.js

# Use MySQL schema
mysql -u root -p transitguard_prod < backend/database/schema.sql
```

## ✅ Migration Checklist

- [ ] Install `pg` package
- [ ] Remove `mysql2` package
- [ ] Update `backend/config/db.js`
- [ ] Update `.env` with DATABASE_URL
- [ ] Import PostgreSQL schema
- [ ] Update query syntax (? to $1)
- [ ] Test locally
- [ ] Update Render configuration
- [ ] Deploy to Render
- [ ] Verify deployment

## 🎉 Benefits of PostgreSQL

1. **Free Hosting**: Render, Heroku, Railway all offer free PostgreSQL
2. **Better JSON Support**: Native JSON columns and queries
3. **Advanced Features**: Full-text search, arrays, custom types
4. **Better Concurrency**: MVCC for better concurrent access
5. **Open Source**: Truly open source with no licensing concerns

---

**Ready to migrate?** Follow the steps above and you'll be on PostgreSQL in minutes!
