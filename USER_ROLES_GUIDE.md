# TransitGuard User Roles & Permissions Guide

## Table of Contents
1. [Overview](#overview)
2. [User Hierarchy](#user-hierarchy)
3. [Role Descriptions](#role-descriptions)
4. [Detailed Permissions](#detailed-permissions)
5. [Dashboard Features](#dashboard-features)
6. [Common Workflows](#common-workflows)
7. [Access Control Matrix](#access-control-matrix)

---

## Overview

TransitGuard implements a hierarchical role-based access control (RBAC) system with 5 distinct user roles. Each role has specific permissions and capabilities designed for their responsibilities in the transit management system.

### The 5 User Roles

1. **Super Admin** - System administrator with full access
2. **Company Admin** - Manages transport company operations
3. **Station Officer** - Manages station operations and trip scheduling
4. **Authority** - Government oversight and compliance monitoring
5. **Conductor** - Handles passenger boarding on vehicles

---

## User Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                     SUPER ADMIN                         │
│  • System-wide access                                   │
│  • Creates Company Admins                               │
│  • Views all data across system                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   COMPANY ADMIN                         │
│  • Company-level access                                 │
│  • Creates Station Officers, Authority, Conductors      │
│  • Manages company resources                            │
└─────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                ↓           ↓           ↓
    ┌──────────────┐ ┌──────────┐ ┌──────────┐
    │   STATION    │ │ AUTHORITY│ │CONDUCTOR │
    │   OFFICER    │ │          │ │          │
    └──────────────┘ └──────────┘ └──────────┘
```

### Hierarchy Rules

- **Super Admins** can only create **Company Admins**
- **Company Admins** can create:
  - Station Officers
  - Authority Officers
  - Conductors
- Users can only manage users they created
- Each user has a `created_by` field tracking their creator

---

## Role Descriptions

### 1. Super Admin

**Purpose**: System administrator with complete control over the TransitGuard platform.

**Responsibilities**:
- Oversee entire system operation
- Create and manage Company Admins
- Monitor system-wide statistics
- View all trips, users, and activities
- Ensure system health and performance

**Access Level**: Full system access (read-only for most operations, write for user management)

**Dashboard**: `super_admin_dashboard.html`

**Key Characteristics**:
- Cannot create users other than Company Admins
- Can view but not modify trips or vehicles
- Focuses on oversight and monitoring
- Has access to system-wide analytics

---

### 2. Company Admin

**Purpose**: Manages all operations for a transport company.

**Responsibilities**:
- Manage company staff (Station Officers, Authority, Conductors)
- Manage vehicle fleet
- Manage stations
- Schedule and monitor trips
- View company statistics and reports
- Oversee boarding activities

**Access Level**: Full access to company resources

**Dashboard**: `company_dashboard.html`

**Key Characteristics**:
- Can create multiple user types
- Manages company assets (vehicles, stations)
- Schedules trips for company vehicles
- Views company-wide statistics
- Cannot access other companies' data

---

### 3. Station Officer

**Purpose**: Manages operations at a specific station.

**Responsibilities**:
- Schedule trips from their station
- Assign vehicles to trips
- Scan passenger fingerprints for boarding
- Monitor trip departures and arrivals
- Update trip status
- Manage boarding at their station

**Access Level**: Station-specific access

**Dashboard**: `station_dashboard.html`

**Key Characteristics**:
- Assigned to a specific station
- Can only schedule trips originating from their station
- Can scan passengers for any trip at their station
- Views station-specific statistics
- Cannot manage users or vehicles

---

### 4. Authority

**Purpose**: Government oversight and compliance monitoring.

**Responsibilities**:
- Monitor all transit activities
- View all trips across companies
- Access passenger records
- Generate compliance reports
- Ensure regulatory compliance
- Investigate incidents

**Access Level**: Read-only system-wide access

**Dashboard**: `authority_dashboard.html`

**Key Characteristics**:
- Read-only access to all data
- Cannot create or modify trips
- Cannot manage users
- Focuses on monitoring and reporting
- Can view all companies' activities

---

### 5. Conductor

**Purpose**: Manages passenger boarding on assigned vehicles.

**Responsibilities**:
- Scan passenger fingerprints
- Verify boarding eligibility
- Monitor vehicle occupancy
- Track boarding history
- Ensure passenger safety

**Access Level**: Limited to boarding operations

**Dashboard**: `conductor_dashboard.html`

**Key Characteristics**:
- Can only scan passengers
- Views assigned trip information
- Cannot schedule or modify trips
- Cannot manage users or vehicles
- Focuses solely on boarding operations

---

## Detailed Permissions

### Super Admin Permissions

#### ✅ CAN DO:
- **User Management**
  - Create Company Admins
  - View all users in system
  - Edit user details (name, email, status)
  - Deactivate/activate users
  - Reset user passwords

- **Monitoring**
  - View all trips across all companies
  - View all boarding activities
  - View system-wide statistics
  - Access all dashboard data
  - Monitor system health

- **Analytics**
  - Generate system-wide reports
  - View activity trends
  - Access compliance data

#### ❌ CANNOT DO:
- Create Station Officers, Authority, or Conductors directly
- Modify trips or trip status
- Create or manage vehicles
- Create or manage stations
- Scan passengers
- Schedule trips

---

### Company Admin Permissions

#### ✅ CAN DO:
- **User Management**
  - Create Station Officers
  - Create Authority Officers
  - Create Conductors
  - View all company staff
  - Edit staff details
  - Deactivate/activate staff
  - Reset staff passwords
  - Assign staff to stations

- **Station Management**
  - Create new stations
  - Edit station details
  - Deactivate/activate stations
  - View all company stations
  - Assign coordinates to stations

- **Vehicle Management**
  - Register new vehicles
  - Edit vehicle details (plate number, capacity, company name)
  - View all company vehicles
  - Search and filter vehicles
  - Delete vehicles (if not in use)

- **Trip Management**
  - Schedule new trips
  - View all company trips
  - Update trip status (departed, arrived, cancelled)
  - Filter trips by status and date
  - View trip details and occupancy
  - Monitor passenger boarding

- **Monitoring**
  - View company statistics
  - View boarding activities
  - Monitor active trips
  - Access company reports

#### ❌ CANNOT DO:
- Create Super Admins or other Company Admins
- Access other companies' data
- Scan passengers (must assign Conductors/Station Officers)
- View system-wide data outside their company

---

### Station Officer Permissions

#### ✅ CAN DO:
- **Trip Management**
  - Schedule trips from their station
  - Select destination stations
  - Assign vehicles to trips
  - Set departure times
  - View trips at their station
  - Update trip status (departed, arrived, cancelled)
  - Monitor trip occupancy

- **Boarding Operations**
  - Select active trips for boarding
  - Scan passenger fingerprints
  - Verify boarding eligibility
  - Approve/deny boarding
  - View boarding history
  - Monitor vehicle capacity
  - Track recent scans

- **Monitoring**
  - View station statistics
  - View active trips at station
  - Monitor boarding activities
  - Access station reports

#### ❌ CANNOT DO:
- Create or manage users
- Create or manage vehicles
- Create or manage stations
- Schedule trips from other stations
- Access other stations' data
- Modify system settings

---

### Authority Permissions

#### ✅ CAN DO:
- **Monitoring**
  - View all trips across all companies
  - View all boarding activities
  - Access passenger records
  - View system statistics
  - Monitor compliance
  - Track trip status

- **Reporting**
  - Generate compliance reports
  - Access activity logs
  - View boarding history
  - Export data for analysis

- **Passenger Data**
  - View registered passengers
  - Access passenger boarding history
  - View passenger details

#### ❌ CANNOT DO:
- Create or modify trips
- Create or manage users
- Create or manage vehicles
- Create or manage stations
- Scan passengers
- Update trip status
- Modify any data (read-only access)

---

### Conductor Permissions

#### ✅ CAN DO:
- **Boarding Operations**
  - Select assigned trips
  - Scan passenger fingerprints
  - Verify boarding eligibility
  - Approve/deny boarding
  - View boarding results
  - Monitor vehicle occupancy
  - Track recent scans

- **Trip Information**
  - View assigned trip details
  - View current trip status
  - View passenger count
  - View vehicle capacity

- **History**
  - View boarding history
  - View scan logs
  - Access recent activities

#### ❌ CANNOT DO:
- Create or schedule trips
- Modify trip status
- Create or manage users
- Create or manage vehicles
- Create or manage stations
- Access other trips' data
- View system-wide statistics

---

## Dashboard Features

### Super Admin Dashboard

**URL**: `/super_admin_dashboard.html`

**Sections**:

1. **Overview**
   - Total users count
   - Today's scans (approved/denied)
   - Active trips count
   - Total passengers
   - Activity chart (last 7 days)
   - System status indicators
   - Active trips grid
   - Recent boarding activity

2. **User Management**
   - User list with filters (role, search)
   - Create Company Admin button
   - Edit user details
   - Deactivate/activate users
   - Pagination

3. **Company Admins**
   - List of all Company Admins
   - Company Admin details
   - Creation date and status

4. **Trips & Vehicles**
   - All trips across system
   - Filter by status
   - Trip details modal
   - Occupancy monitoring
   - Pagination

5. **Passengers**
   - Registered passengers list
   - Passenger details
   - Registration dates

6. **Analytics**
   - System-wide reports
   - Activity trends
   - Performance metrics

7. **Settings**
   - System configuration
   - Security settings

---

### Company Admin Dashboard

**URL**: `/company_dashboard.html`

**Sections**:

1. **Overview**
   - Total staff count
   - Active vehicles count
   - Active trips count
   - Today's boardings
   - Quick actions
   - Active trips preview
   - Recent boarding activity

2. **Stations**
   - Station list with filters
   - Create station button
   - Edit station details
   - Activate/deactivate stations
   - Station location and coordinates

3. **Staff Management**
   - Staff list with role filters
   - Create staff button (Station Officer, Authority, Conductor)
   - Edit staff details
   - Assign to stations
   - Deactivate/activate staff

4. **Vehicles**
   - Vehicle fleet grid
   - Create vehicle button
   - Edit vehicle details
   - Search and filter
   - Vehicle capacity info
   - Pagination

5. **Trips**
   - Trip list with filters
   - Schedule trip button
   - View trip details
   - Update trip status
   - Filter by status and date
   - Occupancy monitoring
   - Pagination

6. **Passengers**
   - Passenger records
   - Boarding history

7. **Reports**
   - Company analytics
   - Performance reports

---

### Station Officer Dashboard

**URL**: `/station_dashboard.html`

**Sections**:

1. **Overview**
   - Station statistics
   - Today's trips
   - Boarding count
   - Quick actions

2. **Trips**
   - Trip list (station-specific)
   - Schedule trip button
   - View trip details
   - Update trip status
   - Filter by status and date
   - Occupancy monitoring

3. **Scan Boarding**
   - Trip selection dropdown
   - Selected trip info
   - Biometric scanner interface
   - Fingerprint input
   - Scan & Verify button
   - Scan result display
   - Recent boardings list

4. **Stations**
   - Station information
   - Station details

---

### Authority Dashboard

**URL**: `/authority_dashboard.html`

**Sections**:

1. **Overview**
   - System activity stats
   - Today's scans
   - Active trips
   - Recent activity table

2. **Live Monitoring**
   - Real-time activity feed
   - Active trips map

3. **All Trips**
   - Complete trip list
   - Filter by status
   - Trip details modal
   - Occupancy monitoring
   - Pagination

4. **Passengers**
   - Registered passengers
   - Passenger details
   - Boarding history

5. **Reports**
   - Daily boarding report
   - Trip summary report
   - Compliance report

6. **Compliance**
   - Compliance monitoring
   - Violation tracking

---

### Conductor Dashboard

**URL**: `/conductor_dashboard.html`

**Sections**:

1. **Overview**
   - Today's scans count
   - Approved scans
   - Denied scans
   - Current trip status
   - Recent scans table

2. **Scan Boarding**
   - Trip selection dropdown
   - Selected trip info
   - Biometric scanner interface
   - Fingerprint input
   - Scan & Verify button
   - Scan result display
   - Recent boardings list

3. **Current Trip**
   - Assigned trip details
   - Vehicle information
   - Route details
   - Passenger statistics
   - Occupancy progress
   - Start boarding button

4. **Passengers**
   - Boarded passengers list
   - Passenger details

5. **History**
   - Boarding history
   - Scan logs
   - Activity timeline

---

## Common Workflows

### Workflow 1: System Setup (Super Admin)

1. **Initial Setup**
   - Super Admin logs in
   - Creates first Company Admin
   - Provides credentials to Company Admin

2. **Company Admin Setup**
   - Company Admin logs in
   - Creates stations
   - Registers vehicles
   - Creates Station Officers
   - Creates Conductors
   - Creates Authority Officers

3. **Station Setup**
   - Station Officer logs in
   - Reviews station details
   - Prepares for trip scheduling

---

### Workflow 2: Trip Scheduling (Station Officer)

1. **Schedule Trip**
   - Navigate to "Trips" section
   - Click "Schedule Trip"
   - Select origin station (pre-selected)
   - Select destination station
   - Select vehicle
   - Set departure date and time
   - Click "Schedule Trip"

2. **System Actions**
   - Validates input
   - Creates route automatically (if doesn't exist)
   - Creates trip record
   - Assigns vehicle to trip
   - Sets status to "scheduled"

3. **Result**
   - Trip appears in trip list
   - Available for boarding
   - Visible to all relevant roles

---

### Workflow 3: Passenger Boarding (Conductor/Station Officer)

1. **Preparation**
   - Navigate to "Scan Boarding"
   - Click "Refresh Trips"
   - Select active trip from dropdown
   - View trip details and occupancy

2. **Passenger Arrives**
   - Passenger presents fingerprint
   - Enter/paste fingerprint template
   - Click "Scan & Verify"

3. **System Processing**
   - Verifies passenger is registered
   - Checks if passenger has ticket for trip
   - If no ticket: Creates ticket automatically
   - If ticket exists: Uses existing ticket
   - Checks vehicle capacity
   - Validates trip status
   - Checks for duplicate boarding

4. **Result Display**
   - **Success**: Green checkmark, passenger details, ticket info, updated occupancy
   - **Failure**: Red X, reason for denial

5. **Post-Boarding**
   - Ticket marked as used
   - Boarding logged in database
   - Occupancy updated
   - Recent scans list updated

---

### Workflow 4: Trip Monitoring (Company Admin)

1. **View Trips**
   - Navigate to "Trips" section
   - View all company trips
   - Filter by status or date

2. **Monitor Progress**
   - View trip details
   - Check occupancy
   - Monitor boarding activity

3. **Update Status**
   - When trip departs: Click "Depart" button
   - When trip arrives: Click "Arrive" button
   - If needed: Click "Cancel" button

4. **Result**
   - Trip status updated
   - Visible to all users
   - Logged in system

---

### Workflow 5: Compliance Monitoring (Authority)

1. **System Overview**
   - View dashboard statistics
   - Check active trips
   - Review recent activity

2. **Trip Monitoring**
   - Navigate to "All Trips"
   - Filter by status
   - View trip details
   - Check occupancy compliance

3. **Passenger Records**
   - Navigate to "Passengers"
   - View registered passengers
   - Check boarding history

4. **Report Generation**
   - Navigate to "Reports"
   - Select report type
   - Generate report
   - Export data

---

### Workflow 6: Fleet Management (Company Admin)

1. **Add Vehicle**
   - Navigate to "Vehicles"
   - Click "Add Vehicle"
   - Enter plate number
   - Enter company name
   - Enter capacity
   - Click "Add Vehicle"

2. **Manage Vehicles**
   - Search vehicles
   - Filter by company
   - Edit vehicle details
   - View vehicle usage

3. **Vehicle Assignment**
   - When scheduling trip
   - Select vehicle from dropdown
   - View capacity info
   - Assign to trip

---

### Workflow 7: Staff Management (Company Admin)

1. **Create Staff**
   - Navigate to "Staff Management"
   - Click "Add Staff Member"
   - Enter full name
   - Enter email
   - Set password
   - Select role (Station Officer, Authority, Conductor)
   - Assign to station (optional)
   - Enter fingerprint template
   - Click "Add Staff"

2. **Manage Staff**
   - View staff list
   - Filter by role
   - Search by name/email
   - Edit staff details
   - Deactivate/activate staff
   - Reset passwords

---

## Access Control Matrix

### Feature Access by Role

| Feature | Super Admin | Company Admin | Station Officer | Authority | Conductor |
|---------|-------------|---------------|-----------------|-----------|-----------|
| **User Management** |
| Create Company Admins | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Station Officers | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create Authority | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create Conductors | ❌ | ✅ | ❌ | ❌ | ❌ |
| View All Users | ✅ | ✅ (company) | ❌ | ❌ | ❌ |
| Edit Users | ✅ | ✅ (company) | ❌ | ❌ | ❌ |
| Deactivate Users | ✅ | ✅ (company) | ❌ | ❌ | ❌ |
| **Station Management** |
| Create Stations | ❌ | ✅ | ❌ | ❌ | ❌ |
| Edit Stations | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Stations | ✅ | ✅ | ✅ (assigned) | ✅ | ❌ |
| Delete Stations | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Vehicle Management** |
| Register Vehicles | ❌ | ✅ | ❌ | ❌ | ❌ |
| Edit Vehicles | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Vehicles | ✅ | ✅ | ✅ | ✅ | ✅ (assigned) |
| Delete Vehicles | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Trip Management** |
| Schedule Trips | ❌ | ✅ | ✅ (from station) | ❌ | ❌ |
| View All Trips | ✅ | ✅ (company) | ✅ (station) | ✅ | ✅ (assigned) |
| Update Trip Status | ❌ | ✅ | ✅ | ❌ | ❌ |
| Cancel Trips | ❌ | ✅ | ✅ | ❌ | ❌ |
| View Trip Details | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Boarding Operations** |
| Scan Passengers | ❌ | ❌ | ✅ | ❌ | ✅ |
| View Boarding History | ✅ | ✅ | ✅ | ✅ | ✅ (own) |
| Approve Boarding | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Passenger Management** |
| Register Passengers | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Passengers | ✅ | ✅ | ✅ | ✅ | ✅ (boarded) |
| Edit Passengers | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reporting** |
| System Reports | ✅ | ❌ | ❌ | ✅ | ❌ |
| Company Reports | ❌ | ✅ | ❌ | ✅ | ❌ |
| Station Reports | ❌ | ✅ | ✅ | ✅ | ❌ |
| Compliance Reports | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Monitoring** |
| System-wide Stats | ✅ | ❌ | ❌ | ✅ | ❌ |
| Company Stats | ✅ | ✅ | ❌ | ✅ | ❌ |
| Station Stats | ✅ | ✅ | ✅ | ✅ | ❌ |
| Trip Stats | ✅ | ✅ | ✅ | ✅ | ✅ (assigned) |

### API Endpoint Access

| Endpoint | Super Admin | Company Admin | Station Officer | Authority | Conductor |
|----------|-------------|---------------|-----------------|-----------|-----------|
| `POST /auth/register` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /users` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `GET /users` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `PATCH /users/:id` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `DELETE /users/:id` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /stations` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `GET /stations` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `PATCH /stations/:id` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `POST /vehicles` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `GET /vehicles` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `PATCH /vehicles/:id` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `POST /trips` | ❌ | ✅ | ✅ | ❌ | ❌ |
| `GET /trips` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `PATCH /trips/:id/status` | ❌ | ✅ | ✅ | ❌ | ❌ |
| `POST /boarding/scan` | ✅ | ❌ | ✅ | ❌ | ✅ |
| `GET /boarding/history` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /passengers` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /passengers` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /dashboard/live` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Security & Best Practices

### Password Requirements
- Minimum 8 characters
- Must be unique per user
- Stored as bcrypt hash
- Can be reset by creator

### Fingerprint Templates
- Minimum 10 characters
- Used for biometric authentication
- Unique per user/passenger
- Cannot be changed after registration

### Session Management
- JWT tokens for authentication
- Tokens expire after inactivity
- Automatic logout on token expiration
- Secure token storage

### Role Enforcement
- Middleware validates role on every request
- Frontend hides unauthorized features
- Backend enforces permissions
- Audit trail for all actions

### Data Isolation
- Company Admins see only their company data
- Station Officers see only their station data
- Conductors see only assigned trips
- Authority sees all data (read-only)
- Super Admins see all data

---

## Quick Reference

### Login Credentials Format
```
Email: user@example.com
Password: minimum 8 characters
```

### Default Test Users
```
Super Admin:
- Email: superadmin@transitguard.com
- Password: SuperAdmin123

Company Admin:
- Email: company@example.com
- Password: Company123

Station Officer:
- Email: station@example.com
- Password: Station123

Authority:
- Email: authority@example.com
- Password: Authority123

Conductor:
- Email: conductor@example.com
- Password: Conductor123
```

### Dashboard URLs
```
Super Admin:    /super_admin_dashboard.html
Company Admin:  /company_dashboard.html
Station Officer: /station_dashboard.html
Authority:      /authority_dashboard.html
Conductor:      /conductor_dashboard.html
```

### Common Actions

**Schedule a Trip** (Station Officer/Company Admin):
1. Navigate to Trips
2. Click "Schedule Trip"
3. Select origin and destination
4. Select vehicle
5. Set departure time
6. Submit

**Scan Passenger** (Conductor/Station Officer):
1. Navigate to Scan Boarding
2. Select active trip
3. Enter fingerprint
4. Click "Scan & Verify"
5. View result

**Create User** (Super Admin/Company Admin):
1. Navigate to User Management
2. Click "Create User"
3. Fill in details
4. Select role
5. Submit

**Register Vehicle** (Company Admin):
1. Navigate to Vehicles
2. Click "Add Vehicle"
3. Enter plate number, company, capacity
4. Submit

---

## Summary

TransitGuard's role-based system ensures:

✅ **Clear Separation of Duties**: Each role has specific responsibilities
✅ **Hierarchical Control**: Users can only manage users they created
✅ **Data Isolation**: Users see only relevant data
✅ **Security**: Role enforcement at frontend and backend
✅ **Flexibility**: Roles can be assigned based on organizational needs
✅ **Scalability**: System supports multiple companies and stations
✅ **Compliance**: Authority role ensures regulatory oversight
✅ **Efficiency**: Each role has tools for their specific tasks

The system is designed to be intuitive, secure, and efficient for all user types, from system administrators to frontline conductors.

---

**For more information, see**:
- [USER_MANAGEMENT_GUIDE.md](USER_MANAGEMENT_GUIDE.md) - User creation and management
- [TRIP_SCHEDULING_GUIDE.md](TRIP_SCHEDULING_GUIDE.md) - Trip scheduling workflows
- [BOARDING_SCAN_GUIDE.md](BOARDING_SCAN_GUIDE.md) - Boarding operations
- [VEHICLE_MANAGEMENT_GUIDE.md](VEHICLE_MANAGEMENT_GUIDE.md) - Vehicle management
- [STATION_MANAGEMENT_GUIDE.md](STATION_MANAGEMENT_GUIDE.md) - Station management
