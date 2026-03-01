# TransitGuard Setup Instructions

## Current Status
✅ Backend server is running on http://localhost:5000
✅ API routes are working correctly
✅ Environment variables are configured

## Next Steps

### 1. Database Setup
You need to create and populate the MySQL database:

```bash
# Login to MySQL
mysql -u root -p

# Run the schema
source backend/database/schema.sql

# (Optional) Run seed data if available
source backend/database/seed.sql
```

Or use a MySQL client like MySQL Workbench, phpMyAdmin, or DBeaver to run the SQL files.

### 2. Start the Frontend

Open a new terminal and run:

```bash
cd frontend
npm run dev
```

This will start the Vite dev server on http://localhost:3000

### 3. Access the Application

- Frontend: http://localhost:3000/login.html
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/

### 4. Create a Test User

After the database is set up, create a test user:

```bash
npm run create-user
```

This will create:
- Email: admin@test.com
- Password: password123
- Role: super_admin

### 5. Test Login

Now you can login at http://localhost:3000/login.html with:
- Email: admin@test.com
- Password: password123

After login, you'll be redirected based on your role:
- Super Admin → super_admin_dashboard.html
- Company Admin → company_dashboard.html
- Station Officer → station_dashboard.html
- Authority → authority_dashboard.html
- Conductor → conductor_dashboard.html

## Troubleshooting

### APIs not accessible
- ✅ Fixed: Routes are now properly configured
- ✅ Fixed: Database connection path corrected
- ✅ Fixed: Environment variables loading correctly

### CORS Issues
The backend has CORS enabled for all origins in development.

### Database Connection Failed
Check your `.env` file in the `backend` folder:
- DB_HOST=localhost
- DB_USER=root
- DB_PASSWORD=(your password)
- DB_NAME=transitguard_prod

Make sure MySQL is running and the database exists.
