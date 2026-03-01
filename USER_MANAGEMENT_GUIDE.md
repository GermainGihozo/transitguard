# User Management Guide

## Overview
TransitGuard now implements a hierarchical user management system where:
- **Super Admins** can create **Company Admins**
- **Company Admins** can create **Station Officers**, **Authority**, and **Conductors**

## Role Hierarchy

```
Super Admin
    └── Company Admin
            ├── Station Officer
            ├── Authority
            └── Conductor
```

## Setup Instructions

### 1. Run Database Migration

Add the `created_by` column to track user creation:

```bash
npm run migrate 002_add_created_by.sql
```

### 2. Create Initial Super Admin

If you don't have a super admin yet:

```bash
npm run create-user
```

This creates:
- Email: admin@test.com
- Password: password123
- Role: super_admin

## API Usage

### Super Admin: Create Company Admin

```bash
curl -X POST http://localhost:5000/api/users/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super_admin_token>" \
  -d '{
    "full_name": "Company Admin Name",
    "email": "company@example.com",
    "password": "SecurePass123",
    "fingerprint_template": "biometric_data_here",
    "role": "company_admin"
  }'
```

### Company Admin: Create Other Users

```bash
curl -X POST http://localhost:5000/api/users/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <company_admin_token>" \
  -d '{
    "full_name": "Station Officer Name",
    "email": "officer@example.com",
    "password": "SecurePass123",
    "fingerprint_template": "biometric_data_here",
    "role": "station_officer",
    "station_id": 1
  }'
```

**Allowed roles for Company Admin:**
- station_officer
- authority
- conductor

## User Management Operations

### List All Users

```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=50" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**
- `role` - Filter by role (e.g., `?role=conductor`)
- `search` - Search by name or email (e.g., `?search=john`)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

### Get User Details

```bash
curl -X GET http://localhost:5000/api/users/5 \
  -H "Authorization: Bearer <token>"
```

### Update User

```bash
curl -X PUT http://localhost:5000/api/users/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "full_name": "Updated Name",
    "email": "newemail@example.com",
    "station_id": 2,
    "is_active": true
  }'
```

**Note:** Company admins can only update users they created.

### Deactivate User

```bash
curl -X DELETE http://localhost:5000/api/users/5 \
  -H "Authorization: Bearer <token>"
```

**Note:** 
- This is a soft delete (sets `is_active = false`)
- Company admins can only deactivate users they created
- Super admins cannot be deleted

### Reset User Password

```bash
curl -X POST http://localhost:5000/api/users/5/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "new_password": "NewSecurePass123"
  }'
```

## Permissions Matrix

| Action | Super Admin | Company Admin | Others |
|--------|-------------|---------------|--------|
| Create Company Admin | ✓ | ✗ | ✗ |
| Create Station Officer | ✗ | ✓ | ✗ |
| Create Authority | ✗ | ✓ | ✗ |
| Create Conductor | ✗ | ✓ | ✗ |
| View All Users | ✓ | ✓ (own only) | ✗ |
| Update Users | ✓ | ✓ (own only) | ✗ |
| Delete Users | ✓ | ✓ (own only) | ✗ |
| Reset Passwords | ✓ | ✓ (own only) | ✗ |

## Security Features

1. **Role-based Access Control**: Each role has specific permissions
2. **Ownership Tracking**: Company admins can only manage users they created
3. **Soft Delete**: Users are deactivated, not permanently deleted
4. **Password Hashing**: All passwords are hashed with bcrypt
5. **JWT Authentication**: All endpoints require valid authentication tokens
6. **Rate Limiting**: Protection against brute force attacks

## Error Responses

### Insufficient Permissions
```json
{
  "message": "company_admin cannot create super_admin users",
  "allowed_roles": ["station_officer", "authority", "conductor"]
}
```

### User Not Found
```json
{
  "message": "User not found"
}
```

### Email Already Exists
```json
{
  "message": "Email already registered"
}
```

### Unauthorized Access
```json
{
  "message": "You can only update users you created"
}
```

## Best Practices

1. **Initial Setup**: Create one super admin account first
2. **Company Admins**: Create one company admin per organization
3. **Regular Users**: Let company admins manage their own staff
4. **Password Policy**: Enforce strong passwords (min 8 chars, mixed case, numbers)
5. **Regular Audits**: Review user list periodically
6. **Deactivate, Don't Delete**: Use soft delete to maintain audit trails
7. **Secure Tokens**: Keep JWT tokens secure and rotate regularly

## Migration from Old System

If you have existing users without `created_by`:

```sql
-- Set all existing company_admins as created by super_admin (id=1)
UPDATE users 
SET created_by = 1 
WHERE role = 'company_admin' AND created_by IS NULL;

-- Set all other users as created by first company_admin
UPDATE users 
SET created_by = (SELECT id FROM users WHERE role = 'company_admin' LIMIT 1)
WHERE role IN ('station_officer', 'authority', 'conductor') 
AND created_by IS NULL;
```

## Testing

Use the test page to verify the API:

1. Open `frontend/test-api.html` in your browser
2. Login as super admin
3. Test creating a company admin
4. Login as company admin
5. Test creating other users

## Troubleshooting

### "Public registration is disabled"
- This is expected. Use `/api/users/create` instead
- Make sure you're authenticated with proper role

### "Cannot create X users"
- Check your role permissions
- Super admin → company_admin only
- Company admin → station_officer, authority, conductor only

### "You can only update users you created"
- Company admins have limited scope
- They can only manage users they personally created
- Super admins have full access

### Migration fails
- Make sure MySQL is running
- Check database connection in `.env`
- Verify you have proper permissions
