# TransitGuard Testing Guide

Guide for implementing comprehensive testing for TransitGuard.

## Testing Strategy

### Testing Pyramid
```
        /\
       /  \
      / E2E \
     /--------\
    /Integration\
   /--------------\
  /   Unit Tests   \
 /------------------\
```

## 1. Unit Tests

### Setup

```bash
# Install testing dependencies
npm install --save-dev jest supertest @types/jest

# Update package.json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

### Jest Configuration

Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/server.js',
    '!backend/database/**'
  ]
};
```

### Example Unit Tests

#### Testing Validation Middleware
`backend/middleware/__tests__/validator.test.js`:
```javascript
const { validateEmail, validatePassword, validateRole } = require('../validator');

describe('Validator', () => {
  describe('validateEmail', () => {
    test('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    test('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should accept password with 8+ characters', () => {
      expect(validatePassword('Password123')).toBe(true);
    });

    test('should reject short password', () => {
      expect(validatePassword('Pass1')).toBe(false);
    });
  });

  describe('validateRole', () => {
    test('should accept valid roles', () => {
      expect(validateRole('super_admin')).toBe(true);
      expect(validateRole('conductor')).toBe(true);
    });

    test('should reject invalid role', () => {
      expect(validateRole('invalid_role')).toBe(false);
    });
  });
});
```

#### Testing Authentication Logic
`backend/routes/__tests__/auth.test.js`:
```javascript
const request = require('supertest');
const app = require('../../server');
const db = require('../../config/db');

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup
    await db.end();
  });

  describe('POST /api/auth/register', () => {
    test('should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
          fingerprint_template: 'TEST_TEMPLATE'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
    });

    test('should reject duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'Test User',
          email: 'duplicate@example.com',
          password: 'Password123',
          fingerprint_template: 'TEST_TEMPLATE'
        });

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'Test User 2',
          email: 'duplicate@example.com',
          password: 'Password123',
          fingerprint_template: 'TEST_TEMPLATE'
        });

      expect(response.status).toBe(409);
    });

    test('should reject invalid input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'T',
          email: 'invalid-email',
          password: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
    });
  });
});
```

## 2. Integration Tests

### Testing Complete Workflows

`backend/__tests__/integration/boarding.test.js`:
```javascript
const request = require('supertest');
const app = require('../../server');

describe('Boarding Workflow', () => {
  let authToken;
  let passengerId;
  let tripId;
  let ticketId;

  beforeAll(async () => {
    // Login as conductor
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'conductor@test.com',
        password: 'Password123'
      });

    authToken = loginResponse.body.token;
  });

  test('Complete boarding flow', async () => {
    // 1. Register passenger
    const passengerResponse = await request(app)
      .post('/api/passengers/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        full_name: 'Test Passenger',
        national_id: '1234567890',
        phone: '+1234567890',
        fingerprint_template: 'TEST_FINGERPRINT'
      });

    expect(passengerResponse.status).toBe(201);
    passengerId = passengerResponse.body.passenger_id;

    // 2. Create trip
    const tripResponse = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vehicle_id: 1,
        route_id: 1,
        departure_time: new Date().toISOString()
      });

    expect(tripResponse.status).toBe(201);
    tripId = tripResponse.body.trip_id;

    // 3. Assign ticket
    const ticketResponse = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        passenger_id: passengerId,
        trip_id: tripId
      });

    expect(ticketResponse.status).toBe(201);
    ticketId = ticketResponse.body.ticket_id;

    // 4. Scan for boarding
    const scanResponse = await request(app)
      .post('/api/boarding/scan')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fingerprint_template: 'TEST_FINGERPRINT'
      });

    expect(scanResponse.status).toBe(200);
    expect(scanResponse.body.success).toBe(true);

    // 5. Verify ticket is used
    const ticketCheck = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(ticketCheck.body.is_used).toBe(true);
  });
});
```

## 3. API Tests

### Postman Collection

Create `postman_collection.json`:
```json
{
  "info": {
    "name": "TransitGuard API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"full_name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"Password123\",\n  \"fingerprint_template\": \"TEST_TEMPLATE\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/api/auth/register",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "register"]
            }
          }
        }
      ]
    }
  ]
}
```

## 4. Load Testing

### Using Artillery

Install Artillery:
```bash
npm install -g artillery
```

Create `load-test.yml`:
```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  
scenarios:
  - name: "Boarding scan flow"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "conductor@test.com"
            password: "Password123"
          capture:
            - json: "$.token"
              as: "token"
      
      - post:
          url: "/api/boarding/scan"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            fingerprint_template: "TEST_FINGERPRINT_{{ $randomNumber() }}"
```

Run load test:
```bash
artillery run load-test.yml
```

## 5. Security Testing

### SQL Injection Tests
```javascript
describe('SQL Injection Protection', () => {
  test('should prevent SQL injection in login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: "admin@test.com' OR '1'='1",
        password: "anything"
      });

    expect(response.status).toBe(401);
  });
});
```

### XSS Tests
```javascript
describe('XSS Protection', () => {
  test('should sanitize malicious input', async () => {
    const response = await request(app)
      .post('/api/passengers/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        full_name: '<script>alert("XSS")</script>',
        fingerprint_template: 'TEST'
      });

    expect(response.status).toBe(400);
  });
});
```

## 6. Database Tests

### Testing Database Operations
```javascript
const db = require('../../config/db');

describe('Database Operations', () => {
  test('should connect to database', async () => {
    const [rows] = await db.execute('SELECT 1 as result');
    expect(rows[0].result).toBe(1);
  });

  test('should handle connection errors', async () => {
    // Test with invalid query
    await expect(
      db.execute('INVALID SQL')
    ).rejects.toThrow();
  });
});
```

## 7. Frontend Tests

### Using Jest for Frontend
```javascript
// frontend/js/__tests__/config.test.js
const { API, Auth } = require('../config');

describe('Frontend Config', () => {
  test('API.getHeaders should include token', () => {
    localStorage.setItem('token', 'test-token');
    const headers = API.getHeaders();
    expect(headers.Authorization).toBe('Bearer test-token');
  });

  test('Auth.isAuthenticated should check token', () => {
    localStorage.setItem('token', 'test-token');
    expect(Auth.isAuthenticated()).toBe(true);
    
    localStorage.removeItem('token');
    expect(Auth.isAuthenticated()).toBe(false);
  });
});
```

## 8. Test Coverage

### Running Coverage Reports
```bash
npm run test:coverage
```

### Coverage Goals
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## 9. Continuous Integration

### GitHub Actions Workflow
`.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mariadb:10.11
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: transitguard_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
          DB_HOST: 127.0.0.1
          DB_USER: root
          DB_PASSWORD: root
          DB_NAME: transitguard_test
          JWT_SECRET: test_secret_key_for_testing_only
```

## 10. Test Data Management

### Test Database Setup
```javascript
// backend/__tests__/setup.js
const db = require('../config/db');

beforeAll(async () => {
  // Create test database
  await db.execute('CREATE DATABASE IF NOT EXISTS transitguard_test');
  await db.execute('USE transitguard_test');
  
  // Import schema
  // ... import schema.sql
  
  // Insert test data
  await db.execute(`
    INSERT INTO users (full_name, email, password_hash, role) VALUES
    ('Test Admin', 'admin@test.com', '$2a$10$...', 'super_admin'),
    ('Test Conductor', 'conductor@test.com', '$2a$10$...', 'conductor')
  `);
});

afterAll(async () => {
  // Cleanup
  await db.execute('DROP DATABASE IF EXISTS transitguard_test');
  await db.end();
});
```

## Testing Checklist

- [ ] Unit tests for all utilities
- [ ] Unit tests for all middleware
- [ ] Integration tests for all routes
- [ ] API endpoint tests
- [ ] Authentication flow tests
- [ ] Authorization tests
- [ ] Input validation tests
- [ ] Error handling tests
- [ ] Database operation tests
- [ ] Security tests (SQL injection, XSS)
- [ ] Load tests
- [ ] Frontend tests
- [ ] E2E tests
- [ ] Coverage > 80%
- [ ] CI/CD pipeline configured

---

**Testing ensures reliability and maintainability of TransitGuard**
