# TransitGuard - Smart Biometric Passenger Tracking System

A secure, role-based, biometric-enabled transit management system with live boarding monitoring, trip tracking, ticket validation, and real-time dashboards.

## 🚀 Features

### Core Functionality
- **Biometric Authentication** - Fingerprint-based login for staff and passenger verification
- **Role-Based Access Control** - 5 distinct user roles with granular permissions
- **Real-Time Boarding** - Live passenger scanning and verification
- **Trip Management** - Complete CRUD operations for trips, vehicles, and routes
- **Ticket System** - Digital ticket assignment and validation
- **Live Dashboards** - Role-specific dashboards with real-time updates
- **Audit Logging** - Comprehensive activity tracking

### Security Features
- JWT-based authentication
- bcrypt password hashing
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection protection via parameterized queries
- Role-based middleware authorization

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MariaDB/MySQL
- **Authentication**: JWT + bcrypt
- **Connection Pooling**: mysql2/promise

### Frontend Stack
- **UI Framework**: Bootstrap 5
- **JavaScript**: Vanilla JS (ES6+)
- **State Management**: localStorage
- **Real-time Updates**: Polling (5s intervals)

## 📋 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | System administrator | Full access to all resources |
| **Company Admin** | Company manager | Manage vehicles, trips, staff within company |
| **Station Officer** | Station manager | Register passengers, assign tickets, view reports |
| **Authority** | Monitoring authority | Read-only access to all data |
| **Conductor** | Bus conductor | Scan passengers, view assigned trips |

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- MariaDB/MySQL (v10.5 or higher)
- npm or yarn

### Step 1: Clone Repository
```bash
git clone https://github.com/GermainGihozo/transitguard.git
cd transitguard
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies (if using build tools)
cd frontend
npm install
cd ..
```

### Step 3: Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Create database and import schema
mysql -u root -p < backend/database/schema.sql

# (Optional) Import seed data
mysql -u root -p < backend/database/seed.sql
```

### Step 4: Environment Configuration
```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit .env with your configuration
nano backend/.env
```

Required environment variables:
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=transitguard_prod

JWT_SECRET=your_jwt_secret_min_32_characters_long
BIOMETRIC_SECRET=your_biometric_secret_key

RATE_LIMIT_MAX=100
```

### Step 5: Start the Server
```bash
# Development mode
node backend/server.js

# Or with nodemon for auto-reload
npx nodemon backend/server.js
```

### Step 6: Access the Application
- Frontend: `http://localhost:5000` (or serve frontend separately)
- API: `http://localhost:5000/api`
- API Docs: See `backend/API_DOCUMENTATION.md`

## 📁 Project Structure

```
transitguard/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection pool
│   ├── controllers/
│   │   └── passengerController.js
│   ├── database/
│   │   ├── schema.sql            # Database schema
│   │   ├── seed.sql              # Seed data
│   │   └── migrations/           # Migration files
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── roleMiddleware.js     # Role-based access
│   │   ├── validator.js          # Input validation
│   │   ├── errorHandler.js       # Error handling
│   │   └── rateLimiter.js        # Rate limiting
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── passengers.js         # Passenger management
│   │   ├── vehicles.js           # Vehicle management
│   │   ├── trips.js              # Trip management
│   │   ├── tickets.js            # Ticket management
│   │   ├── boarding.js           # Boarding operations
│   │   ├── dashboard.js          # Dashboard data
│   │   └── routes.js             # Route aggregator
│   ├── utils/
│   │   ├── encryption.js         # Biometric encryption
│   │   ├── logger.js             # Logging utility
│   │   └── validateEnv.js        # Environment validation
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   ├── server.js                 # Application entry point
│   └── API_DOCUMENTATION.md      # API documentation
├── frontend/
│   ├── js/
│   │   ├── config.js             # Frontend configuration
│   │   ├── auth.js               # Authentication logic
│   │   └── dashboard.js          # Dashboard utilities
│   ├── super_admin_dashboard.html
│   ├── company_dashboard.html
│   ├── station_dashboard.html
│   ├── authority_dashboard.html
│   ├── conductor_dashboard.html
│   ├── login.html
│   └── index.html
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Password login
- `POST /api/auth/biometric-login` - Biometric login

### Passengers
- `POST /api/passengers/register` - Register passenger
- `GET /api/passengers` - List passengers (paginated)
- `GET /api/passengers/:id` - Get passenger details

### Vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles` - List vehicles
- `GET /api/vehicles/:id` - Get vehicle details
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Trips
- `POST /api/trips` - Create trip
- `GET /api/trips` - List trips (with filters)
- `GET /api/trips/:id` - Get trip details
- `PATCH /api/trips/:id/status` - Update trip status
- `GET /api/trips/live-trips` - Get active trips overview

### Tickets
- `POST /api/tickets` - Assign ticket
- `GET /api/tickets` - List tickets
- `GET /api/tickets/:id` - Get ticket details
- `GET /api/tickets/passenger/:id` - Get passenger tickets
- `DELETE /api/tickets/:id` - Cancel ticket

### Boarding
- `POST /api/boarding/scan` - Scan passenger for boarding
- `GET /api/boarding/history` - Get boarding history

### Dashboard
- `GET /api/dashboard/live` - Get live dashboard data

See `backend/API_DOCUMENTATION.md` for complete API documentation.

## 🔒 Security Best Practices

1. **Change default secrets** in `.env` before production
2. **Use HTTPS** in production environments
3. **Enable CORS** only for trusted domains
4. **Regular backups** of database
5. **Monitor rate limits** and adjust as needed
6. **Implement proper biometric** matching algorithm (currently simulated)
7. **Regular security audits** and dependency updates

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Configure proper database credentials
- [ ] Enable HTTPS/SSL
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Implement proper biometric hardware integration

### Recommended Production Setup
```
[Internet] → [Nginx/Apache] → [Node.js App] → [MariaDB]
                ↓
           [SSL/TLS]
```

## 📊 Database Schema

Key tables:
- `users` - Staff accounts with roles
- `passengers` - Passenger records with biometric data
- `vehicles` - Fleet management
- `trips` - Trip scheduling
- `tickets` - Ticket assignments
- `boarding_logs` - Boarding events
- `audit_logs` - System audit trail

See `backend/database/schema.sql` for complete schema.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 📝 Development Roadmap

### Phase 1: Foundation ✅
- [x] Database connection pooling
- [x] Environment validation
- [x] Input validation middleware
- [x] Error handling middleware
- [x] Rate limiting
- [x] JWT authentication
- [x] Role-based access control

### Phase 2: Core Features ✅
- [x] User management
- [x] Passenger registration
- [x] Vehicle management
- [x] Trip management
- [x] Ticket system
- [x] Boarding operations
- [x] Role-specific dashboards

### Phase 3: Production Ready (In Progress)
- [ ] Comprehensive testing suite
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Logging system (Winston/Pino)
- [ ] Database migrations tool
- [ ] Biometric hardware integration
- [ ] Mobile app support
- [ ] Advanced reporting
- [ ] Email notifications
- [ ] SMS alerts

### Phase 4: Advanced Features
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics
- [ ] Route optimization
- [ ] Revenue management
- [ ] Multi-language support
- [ ] Offline mode support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Germain Gihozo - Initial work

## 🙏 Acknowledgments

- Bootstrap team for the UI framework
- Express.js community
- MariaDB Foundation

## 📞 Support

For support, email support@transitguard.com or open an issue in the repository.

---

**Built with ❤️ for safer, smarter transit management**
