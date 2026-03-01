# Station Management System Guide

## Overview

The Station Management System allows Company Admins to create, manage, and assign transit stations throughout the network. This enables proper organization of staff, vehicles, and routes.

## Features

### Station Management
- ✅ Create new stations
- ✅ Edit station details
- ✅ Deactivate stations
- ✅ View station details
- ✅ Search and filter stations
- ✅ Assign officers to stations
- ✅ Track assigned staff per station

### Station Information
Each station includes:
- **Name**: Station identifier (e.g., "Byumba Station")
- **Location**: Physical address
- **City**: City name
- **Region**: Province/Region
- **Coordinates**: Latitude and Longitude (optional)
- **Status**: Active/Inactive
- **Assigned Officers**: Count of staff assigned

## Database Schema

### Stations Table
```sql
CREATE TABLE stations (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  location VARCHAR(200),
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  company_id INT,
  is_active BOOLEAN,
  created_by INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Routes Table
```sql
CREATE TABLE routes (
  id INT PRIMARY KEY,
  route_name VARCHAR(100),
  origin_station_id INT,
  destination_station_id INT,
  distance_km DECIMAL(10, 2),
  estimated_duration_minutes INT,
  is_active BOOLEAN
);
```

## API Endpoints

### Create Station
```http
POST /api/stations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Byumba Station",
  "location": "Main Street, Byumba Town",
  "city": "Byumba",
  "region": "Northern Province",
  "latitude": -1.5760,
  "longitude": 30.0670
}
```

**Response:**
```json
{
  "message": "Station created successfully",
  "station": {
    "id": 1,
    "name": "Byumba Station",
    "location": "Main Street, Byumba Town",
    "city": "Byumba",
    "region": "Northern Province"
  }
}
```

### Get All Stations
```http
GET /api/stations?page=1&limit=20&search=byumba&city=Kigali
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Search by name, location, or city
- `city` - Filter by city
- `region` - Filter by region
- `is_active` - Filter by status (true/false)

**Response:**
```json
{
  "stations": [
    {
      "id": 1,
      "name": "Byumba Station",
      "location": "Main Street, Byumba Town",
      "city": "Byumba",
      "region": "Northern Province",
      "latitude": -1.5760,
      "longitude": 30.0670,
      "is_active": true,
      "assigned_officers": 3,
      "created_by_name": "Admin User",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

### Get Station by ID
```http
GET /api/stations/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "name": "Byumba Station",
  "location": "Main Street, Byumba Town",
  "city": "Byumba",
  "region": "Northern Province",
  "assigned_officers": 3,
  "officers": [
    {
      "id": 5,
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "station_officer"
    }
  ]
}
```

### Update Station
```http
PUT /api/stations/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Byumba Central Station",
  "location": "Updated Address",
  "is_active": true
}
```

### Delete Station (Soft Delete)
```http
DELETE /api/stations/:id
Authorization: Bearer <token>
```

**Note:** Cannot delete stations with assigned officers.

### Get Cities
```http
GET /api/stations/meta/cities
Authorization: Bearer <token>
```

Returns list of unique cities.

### Get Regions
```http
GET /api/stations/meta/regions
Authorization: Bearer <token>
```

Returns list of unique regions.

## Usage Guide

### For Company Admins

#### 1. Add a New Station

1. Navigate to **Stations** section in dashboard
2. Click **Add Station** button
3. Fill in the form:
   - **Station Name**: e.g., "Byumba Station"
   - **Location**: Full address
   - **City**: City name
   - **Region**: Province/Region
   - **Coordinates**: Optional GPS coordinates
4. Click **Create Station**

#### 2. Assign Staff to Station

1. Go to **Staff Management** section
2. Click **Add Staff Member**
3. Fill in staff details
4. Select station from **Station** dropdown
5. Click **Add Staff**

#### 3. View Station Details

1. In **Stations** section
2. Click **View** on any station card
3. See station info and assigned officers

#### 4. Edit Station

1. Click **Edit** on station card
2. Update information
3. Click **Save Changes**

#### 5. Deactivate Station

1. Click **Delete** (trash icon) on station card
2. Confirm deactivation
3. Station is soft-deleted (can be reactivated)

**Note:** Cannot deactivate stations with assigned officers. Reassign them first.

#### 6. Search and Filter

- **Search**: Type in search box to find stations
- **Filter by City**: Select city from dropdown
- **Filter by Region**: Select region from dropdown
- **Refresh**: Click refresh button to reload

## Example Stations (Rwanda)

### Northern Province
- **Byumba Station** - Main Street, Byumba Town
- **Gatuna Border Station** - Gatuna Border Post
- **Musanze Station** - Musanze Town Center

### Eastern Province
- **Kagitumba Border Station** - Kagitumba Border Crossing
- **Rwamagana Station** - Rwamagana Town
- **Kayonza Station** - Kayonza District Center

### Kigali City
- **Kigali Central Station** - KN 3 Ave, Nyarugenge
- **Nyabugogo Station** - Nyabugogo Bus Terminal

### Western Province
- **Rubavu Station** - Rubavu Town, Gisenyi
- **Rusizi Station** - Rusizi District, Kamembe

### Southern Province
- **Huye Station** - Huye Town, Butare
- **Muhanga Station** - Muhanga Town Center

## Setup Instructions

### 1. Run Migration
```bash
npm run migrate 003_create_stations.sql
```

### 2. Seed Sample Data (Optional)
```bash
mysql -u root -p transitguard_prod < backend/database/seed_stations.sql
```

### 3. Verify Installation
```bash
npm run test-connection
```

## Integration with Other Features

### Staff Assignment
When creating staff members:
- Station Officers can be assigned to specific stations
- Conductors can be assigned to stations
- Authority personnel can monitor all stations

### Vehicle Assignment
Vehicles can be assigned to:
- Origin station (departure point)
- Destination station (arrival point)
- Current station (for tracking)

### Trip Scheduling
Trips are created with:
- Origin station
- Destination station
- Route information
- Estimated duration

### Route Management
Routes connect stations:
- Origin → Destination
- Distance in kilometers
- Estimated travel time
- Active/Inactive status

## Best Practices

1. **Naming Convention**
   - Use clear, descriptive names
   - Include location type (Station, Terminal, Border Post)
   - Example: "Byumba Station", "Gatuna Border Station"

2. **Location Details**
   - Provide full address
   - Include landmarks if helpful
   - Be specific for easy identification

3. **Coordinates**
   - Add GPS coordinates when available
   - Helps with mapping and route planning
   - Use decimal degrees format

4. **Organization**
   - Group stations by region
   - Use consistent city/region names
   - Keep active stations up to date

5. **Staff Assignment**
   - Assign station officers to their primary station
   - Update assignments when staff relocates
   - Monitor officer distribution

## Permissions

### Super Admin
- ✅ Create stations
- ✅ Edit all stations
- ✅ Delete stations
- ✅ View all stations

### Company Admin
- ✅ Create stations
- ✅ Edit stations
- ✅ Delete stations (own company)
- ✅ View all stations
- ✅ Assign staff to stations

### Station Officer
- ✅ View assigned station
- ❌ Cannot create/edit stations

### Others
- ✅ View stations (read-only)
- ❌ Cannot manage stations

## Troubleshooting

### Cannot Delete Station
**Error:** "Cannot delete station with assigned officers"

**Solution:** 
1. Go to Staff Management
2. Find officers assigned to this station
3. Reassign them to another station or remove assignment
4. Try deleting again

### Station Not Showing in Dropdown
**Issue:** Station not appearing in staff assignment dropdown

**Solution:**
1. Check if station is active
2. Refresh the page
3. Verify station was created successfully

### Duplicate Station Error
**Error:** "Station already exists at this location"

**Solution:**
1. Check if station with same name and location exists
2. Use different name or location
3. Or edit existing station instead

## Future Enhancements

- [ ] Map view of all stations
- [ ] Route visualization
- [ ] Distance calculator between stations
- [ ] Station capacity management
- [ ] Real-time occupancy tracking
- [ ] Station performance metrics
- [ ] Automated route suggestions
- [ ] Integration with GPS tracking
- [ ] Station photos and images
- [ ] Amenities tracking (parking, facilities, etc.)

## API Testing

### Test Station Creation
```bash
curl -X POST http://localhost:5000/api/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Test Station",
    "location": "Test Location",
    "city": "Test City",
    "region": "Test Region"
  }'
```

### Test Station Listing
```bash
curl http://localhost:5000/api/stations \
  -H "Authorization: Bearer <token>"
```

## Summary

The Station Management System provides a complete solution for organizing transit stations, assigning staff, and managing routes. Company Admins can easily create and manage stations, while the system ensures data integrity and proper staff assignment.

Key benefits:
- Organized station network
- Easy staff assignment
- Route planning support
- Scalable architecture
- User-friendly interface
