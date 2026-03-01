# TransitGuard API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes
- Boarding scans: 30 requests per minute

---

## Authentication Endpoints

### POST /auth/register
⚠️ **DISABLED** - Public registration is disabled. Use `/api/users/create` instead.

**Note:** Super admins create company admins, company admins create other users.

### POST /auth/login
Login with email and password

**Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "role": "conductor",
    "station_id": null
  }
}
```

### POST /auth/biometric-login
Login with email and fingerprint

**Body:**
```json
{
  "email": "john@example.com",
  "fingerprint_template": "BIOMETRIC_DATA"
}
```

**Response:** `200 OK` (same as /auth/login)

---

## User Management Endpoints

### POST /users/create
Create a new user (role-based hierarchy)

**Roles:** 
- `super_admin` can create: `company_admin`
- `company_admin` can create: `station_officer`, `authority`, `conductor`

**Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "fingerprint_template": "BIOMETRIC_DATA",
  "role": "station_officer",
  "station_id": 1
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "id": 5,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "station_officer",
    "station_id": 1
  }
}
```

### GET /users
Get all users with filtering and pagination

**Roles:** super_admin, company_admin

**Query Parameters:**
- `role` - Filter by role
- `search` - Search by name or email
- `page` (default: 1)
- `limit` (default: 50)

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "station_officer",
      "station_id": 1,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "created_by_name": "Admin User"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "pages": 1
  }
}
```

### GET /users/:id
Get user by ID

**Roles:** super_admin, company_admin

**Response:** `200 OK`
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "station_officer",
  "station_id": 1,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "created_by_name": "Admin User"
}
```

### PUT /users/:id
Update user information

**Roles:** super_admin, company_admin (can only update users they created)

**Body:**
```json
{
  "full_name": "John Updated",
  "email": "john.new@example.com",
  "station_id": 2,
  "is_active": true
}
```

**Response:** `200 OK`
```json
{
  "message": "User updated successfully"
}
```

### DELETE /users/:id
Deactivate a user (soft delete)

**Roles:** super_admin, company_admin (can only delete users they created)

**Response:** `200 OK`
```json
{
  "message": "User deactivated successfully"
}
```

### POST /users/:id/reset-password
Reset user password

**Roles:** super_admin, company_admin (can only reset for users they created)

**Body:**
```json
{
  "new_password": "NewSecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully"
}
```

---

## Passenger Endpoints

### POST /passengers/register
Register a new passenger (requires auth)

**Roles:** station_officer, company_admin, super_admin

**Body:**
```json
{
  "full_name": "Jane Smith",
  "national_id": "1234567890",
  "passport_number": "AB123456",
  "phone": "+1234567890",
  "fingerprint_template": "BIOMETRIC_DATA"
}
```

**Response:** `201 Created`
```json
{
  "message": "Passenger registered successfully",
  "passenger_id": 1
}
```

### GET /passengers
Get all passengers with pagination

**Roles:** station_officer, company_admin, super_admin, authority

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)

**Response:** `200 OK`
```json
{
  "passengers": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### GET /passengers/:id
Get passenger by ID

**Roles:** station_officer, company_admin, super_admin, authority

**Response:** `200 OK`

---

## Vehicle Endpoints

### POST /vehicles
Create a new vehicle

**Roles:** company_admin, super_admin

**Body:**
```json
{
  "plate_number": "ABC-1234",
  "company_name": "Transit Co",
  "capacity": 50
}
```

**Response:** `201 Created`

### GET /vehicles
Get all vehicles with pagination

**Roles:** company_admin, super_admin, station_officer, authority

### GET /vehicles/:id
Get vehicle by ID

### PUT /vehicles/:id
Update vehicle details

**Roles:** company_admin, super_admin

### DELETE /vehicles/:id
Delete vehicle

**Roles:** super_admin

---

## Trip Endpoints

### POST /trips
Create a new trip

**Roles:** company_admin, super_admin, station_officer

**Body:**
```json
{
  "vehicle_id": 1,
  "route_id": 1,
  "departure_time": "2024-01-15T10:00:00"
}
```

**Response:** `201 Created`

### GET /trips
Get all trips with pagination

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `status` (optional: scheduled, departed, arrived, cancelled)

### GET /trips/:id
Get trip by ID

### PATCH /trips/:id/status
Update trip status

**Body:**
```json
{
  "status": "departed"
}
```

### DELETE /trips/:id
Delete trip

**Roles:** company_admin, super_admin

### GET /trips/live-trips
Get live trips overview with boarding counts

**Roles:** super_admin, authority, company_admin, station_officer

---

## Ticket Endpoints

### POST /tickets
Assign ticket to passenger

**Roles:** station_officer, company_admin, super_admin

**Body:**
```json
{
  "passenger_id": 1,
  "trip_id": 1
}
```

**Response:** `201 Created`

### GET /tickets
Get all tickets with pagination

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `is_used` (optional: true/false)

### GET /tickets/:id
Get ticket by ID

### GET /tickets/passenger/:passenger_id
Get all tickets for a passenger

### DELETE /tickets/:id
Cancel ticket (only unused tickets)

**Roles:** station_officer, company_admin, super_admin

---

## Boarding Endpoints

### POST /boarding/scan
Scan passenger fingerprint for boarding

**Roles:** conductor, station_officer, super_admin

**Body:**
```json
{
  "fingerprint_template": "BIOMETRIC_DATA"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Boarding successful",
  "passenger": {
    "id": 1,
    "full_name": "Jane Smith",
    "ticket_id": 5
  }
}
```

**Error Response:** `403 Forbidden`
```json
{
  "success": false,
  "message": "No valid ticket found"
}
```

### GET /boarding/history
Get boarding history with pagination

**Roles:** conductor, station_officer, company_admin, super_admin, authority

---

## Dashboard Endpoints

### GET /dashboard/live
Get live dashboard data (today's stats + recent boarding)

**Roles:** super_admin, company_admin, station_officer, authority

**Response:** `200 OK`
```json
{
  "stats": {
    "total_scans": 150,
    "approved": 145,
    "denied": 5
  },
  "records": [
    {
      "scan_time": "2024-01-15T10:30:00",
      "status": "approved",
      "full_name": "Jane Smith",
      "seat_number": "A12"
    }
  ]
}
```

---

## Role Permissions

| Role | Description | Access Level |
|------|-------------|--------------|
| super_admin | System administrator | Full access to all resources |
| company_admin | Company manager | Manage company vehicles, trips, staff |
| station_officer | Station manager | Register passengers, assign tickets, view reports |
| authority | Monitoring authority | Read-only access to all data |
| conductor | Bus conductor | Scan passengers, view assigned trips |

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": ["email is required", "password must be at least 8 characters"]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication failed"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "message": "Email already registered"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests from this IP, please try again later"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```
