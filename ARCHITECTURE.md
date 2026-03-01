# TransitGuard System Architecture

## Overview

TransitGuard is a three-tier web application designed for secure, scalable transit passenger management with biometric authentication.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │  Mobile App  │  │  Biometric   │      │
│  │   (HTML/JS)  │  │   (Future)   │  │   Scanner    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express.js Server                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │   Routes   │  │ Middleware │  │Controllers │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  │                                                       │   │
│  │  Middleware Stack:                                   │   │
│  │  • CORS                                              │   │
│  │  • Rate Limiting                                     │   │
│  │  • JWT Authentication                                │   │
│  │  • Role Authorization                                │   │
│  │  • Input Validation                                  │   │
│  │  • Error Handling                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ MySQL Protocol
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MariaDB Database                         │   │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐   │   │
│  │  │ Users  │ │Passengers│ │Vehicles│ │  Trips   │   │   │
│  │  └────────┘ └──────────┘ └────────┘ └──────────┘   │   │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐                │   │
│  │  │Tickets │ │ Boarding │ │ Audit  │                │   │
│  │  └────────┘ └──────────┘ └────────┘                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Client Layer

#### Web Frontend
- **Technology**: HTML5, Bootstrap 5, Vanilla JavaScript
- **State Management**: localStorage for auth tokens
- **Communication**: REST API via Fetch API
- **Features**:
  - Role-based dashboard routing
  - Real-time data updates (polling)
  - Responsive design
  - Biometric input simulation

#### Future: Mobile App
- Native iOS/Android apps
- Same REST API backend
- Offline capability
- Push notifications

### 2. Application Layer

#### Express.js Server
**Entry Point**: `backend/server.js`

**Middleware Stack** (in order):
1. **CORS** - Cross-origin resource sharing
2. **Body Parser** - JSON/URL-encoded parsing
3. **Rate Limiter** - DDoS protection
4. **Authentication** - JWT verification
5. **Authorization** - Role-based access
6. **Validation** - Input sanitization
7. **Error Handler** - Centralized error handling

#### Route Structure
```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── POST /biometric-login
├── /passengers
│   ├── POST /register
│   ├── GET /
│   └── GET /:id
├── /vehicles
│   ├── POST /
│   ├── GET /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── /trips
│   ├── POST /
│   ├── GET /
│   ├── GET /:id
│   ├── PATCH /:id/status
│   ├── DELETE /:id
│   └── GET /live-trips
├── /tickets
│   ├── POST /
│   ├── GET /
│   ├── GET /:id
│   ├── GET /passenger/:id
│   └── DELETE /:id
├── /boarding
│   ├── POST /scan
│   └── GET /history
└── /dashboard
    └── GET /live
```

### 3. Data Layer

#### Database Schema

**Core Tables**:
- `users` - Staff accounts with roles
- `passengers` - Passenger records with biometric data
- `vehicles` - Fleet management
- `trips` - Trip scheduling
- `tickets` - Ticket assignments
- `boarding_logs` - Boarding events
- `audit_logs` - System audit trail

**Relationships**:
```
users (1) ──── (N) audit_logs
passengers (1) ──── (N) tickets
passengers (1) ──── (N) boarding_logs
vehicles (1) ──── (N) trips
trips (1) ──── (N) tickets
trips (1) ──── (N) boarding_logs
```

## Security Architecture

### Authentication Flow

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│  Client  │                │  Server  │                │ Database │
└────┬─────┘                └────┬─────┘                └────┬─────┘
     │                           │                           │
     │ 1. POST /auth/login       │                           │
     │ {email, password}         │                           │
     ├──────────────────────────>│                           │
     │                           │ 2. Query user             │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ 3. User data              │
     │                           │<──────────────────────────┤
     │                           │                           │
     │                           │ 4. Verify password        │
     │                           │    (bcrypt.compare)       │
     │                           │                           │
     │                           │ 5. Generate JWT           │
     │                           │    (jwt.sign)             │
     │                           │                           │
     │ 6. {token, user}          │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
     │ 7. Store token            │                           │
     │    (localStorage)         │                           │
     │                           │                           │
```

### Authorization Flow

```
┌──────────┐                ┌──────────┐
│  Client  │                │  Server  │
└────┬─────┘                └────┬─────┘
     │                           │
     │ 1. API Request            │
     │ Authorization: Bearer JWT │
     ├──────────────────────────>│
     │                           │
     │                           │ 2. authMiddleware
     │                           │    - Verify JWT
     │                           │    - Extract user data
     │                           │
     │                           │ 3. roleMiddleware
     │                           │    - Check user role
     │                           │    - Allow/Deny access
     │                           │
     │                           │ 4. Execute route handler
     │                           │
     │ 5. Response               │
     │<──────────────────────────┤
     │                           │
```

## Data Flow

### Boarding Scan Process

```
1. Conductor scans passenger fingerprint
   ↓
2. POST /api/boarding/scan
   {fingerprint_template}
   ↓
3. Verify conductor authentication (JWT)
   ↓
4. Find passenger by fingerprint
   ↓
5. Check for valid unused ticket
   ↓
6. Mark ticket as used
   ↓
7. Log boarding event
   ↓
8. Return success/failure response
   ↓
9. Update dashboard in real-time
```

## Scalability Considerations

### Current Architecture
- **Single Server**: Suitable for small to medium deployments
- **Connection Pooling**: Handles concurrent requests efficiently
- **Rate Limiting**: Prevents abuse and overload

### Scaling Strategies

#### Horizontal Scaling
```
┌─────────────┐
│Load Balancer│
└──────┬──────┘
       │
   ┌───┴───┬───────┬───────┐
   │       │       │       │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
│App 1│ │App 2│ │App 3│ │App N│
└──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
   │       │       │       │
   └───┬───┴───┬───┴───┬───┘
       │       │       │
   ┌───▼───────▼───────▼───┐
   │   Database Cluster    │
   │  (Master + Replicas)  │
   └───────────────────────┘
```

#### Caching Layer
```
Client → CDN → Load Balancer → App Servers
                                    ↓
                              Redis Cache
                                    ↓
                              Database
```

## Performance Optimization

### Database Optimization
- **Indexes**: All foreign keys and frequently queried columns
- **Connection Pooling**: Reuse database connections
- **Query Optimization**: Use EXPLAIN for slow queries
- **Partitioning**: Consider partitioning large tables (boarding_logs)

### Application Optimization
- **Caching**: Redis for session data and frequent queries
- **Compression**: Gzip response compression
- **Pagination**: Limit result sets
- **Async Operations**: Non-blocking I/O

### Frontend Optimization
- **Minification**: Minify JS/CSS in production
- **CDN**: Serve static assets from CDN
- **Lazy Loading**: Load resources on demand
- **Service Workers**: Offline capability

## Monitoring & Observability

### Metrics to Track
- **Application**: Request rate, response time, error rate
- **Database**: Query performance, connection pool usage
- **System**: CPU, memory, disk I/O
- **Business**: Boarding rate, ticket sales, active trips

### Logging Strategy
```
Application Logs → Log Aggregator → Analysis Tool
                   (Logstash)       (Elasticsearch)
                                          ↓
                                    Visualization
                                      (Kibana)
```

## Disaster Recovery

### Backup Strategy
- **Database**: Daily full backups, hourly incremental
- **Application**: Version control (Git)
- **Configuration**: Encrypted backup of .env files

### Recovery Plan
1. Restore database from latest backup
2. Deploy application from Git
3. Restore configuration
4. Verify system integrity
5. Resume operations

## Future Architecture Enhancements

### Microservices Migration
```
API Gateway
    ↓
┌───┴───┬───────┬───────┬───────┐
│       │       │       │       │
Auth  Passenger Vehicle  Trip  Boarding
Service Service Service Service Service
```

### Event-Driven Architecture
```
Services → Message Queue → Event Handlers
           (RabbitMQ)
```

### Real-time Updates
```
WebSocket Server ← Clients
      ↓
Event Stream (Redis Pub/Sub)
      ↓
Application Servers
```

---

**This architecture is designed to be:**
- **Secure**: Multiple layers of authentication and authorization
- **Scalable**: Can grow from single server to distributed system
- **Maintainable**: Clear separation of concerns
- **Reliable**: Error handling and recovery mechanisms
- **Performant**: Optimized at every layer
