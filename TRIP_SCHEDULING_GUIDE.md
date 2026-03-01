# Trip Scheduling Guide for Station Officers

## Overview
Station Officers can now schedule trips from their station to other stations, assign vehicles, and manage passenger boarding through fingerprint scanning.

## Features Implemented

### 1. Backend API Enhancements

#### New Routes Management API (`/api/routes`)
- **POST /api/routes** - Create station-to-station routes
- **GET /api/routes** - List all routes with filtering
- **GET /api/routes/:id** - Get route details
- **PUT /api/routes/:id** - Update route information
- **DELETE /api/routes/:id** - Delete route (Super Admin only)

#### Enhanced Trips API (`/api/trips`)
- Updated to include full station and route information
- Added passenger boarding statistics
- Added station-based filtering
- Shows tickets sold vs passengers boarded
- Displays occupancy percentage

### 2. Station Officer Dashboard

#### Trip Management Section
- **Schedule New Trips** - Create trips from your station
- **View All Trips** - See trips originating from or arriving at your station
- **Filter Trips** - By status (scheduled, departed, arrived, cancelled) and date
- **Update Trip Status** - Mark trips as departed, arrived, or cancelled
- **View Trip Details** - Complete trip information with passenger statistics

### 3. Trip Scheduling Workflow

#### Step 1: Schedule a Trip (Simplified)
1. Click "Schedule Trip" button
2. Select origin station (your station is pre-selected)
3. Select destination station
4. Assign a vehicle
5. Set departure date and time
6. Click "Schedule Trip"

**Note**: The system automatically creates or uses the route between the selected stations. No need to manage routes separately!

#### Step 2: Passenger Boarding
- Passengers scan their fingerprints at the station
- System validates tickets and allows boarding
- Real-time passenger count updates
- Occupancy percentage displayed

#### Step 3: Trip Departure
- When ready to depart, click "Depart" button
- Trip status changes to "departed"
- No more passengers can board

#### Step 4: Trip Arrival
- When trip arrives, click "Arrive" button
- Trip status changes to "arrived"
- Trip is completed

## User Interface

### Trip Card Layout
```
┌─────────────────────────────────────┐
│ 🚌 RAB-123A    [SCHEDULED]         │
│ Transit Express Ltd                 │
│                                     │
│ 📍 Kigali Central                  │
│ ↓  Kigali → Musanze                │
│ 📍 Musanze Station                 │
│                                     │
│ 📅 Departure: Jan 15, 10:00 AM    │
│ 👥 Passengers: 35 / 50            │
│ [████████░░] 70% occupied          │
│                                     │
│ [View] [Depart] [Cancel]           │
└─────────────────────────────────────┘
```

### Schedule Trip Modal (Simplified)
```
┌─────────────────────────────────────┐
│ Schedule New Trip                   │
├─────────────────────────────────────┤
│ From (Origin):  [Kigali Central ▼] │
│ To (Destination): [Musanze ▼]      │
│ Vehicle:        [RAB-123A ▼]       │
│ Date:           [2024-01-15]       │
│ Time:           [10:00]            │
│                                     │
│ [Cancel] [Schedule Trip]           │
└─────────────────────────────────────┘
```

**Note**: Routes are created automatically based on origin and destination!

## API Endpoints

### Routes Management

#### Create Route
```http
POST /api/routes
Authorization: Bearer <token>
Content-Type: application/json

{
  "route_name": "Kigali to Musanze Express",
  "origin_station_id": 1,
  "destination_station_id": 2,
  "distance_km": 85,
  "estimated_duration_minutes": 120
}
```

#### Get Routes
```http
GET /api/routes?origin_station_id=1&is_active=true
Authorization: Bearer <token>
```

### Trip Management

#### Create Trip (Simplified - No Route Selection)
```http
POST /api/trips
Authorization: Bearer <token>
Content-Type: application/json

{
  "origin_station_id": 1,
  "destination_station_id": 2,
  "vehicle_id": 5,
  "departure_time": "2024-01-15 10:00:00"
}
```

**Response:**
```json
{
  "message": "Trip scheduled successfully",
  "trip_id": 123,
  "route_id": 45
}
```

**Note**: The system automatically creates a route if one doesn't exist between the stations.

#### Get Trips (Station-Filtered)
```http
GET /api/trips?station_id=1&status=scheduled
Authorization: Bearer <token>
```

#### Update Trip Status
```http
PATCH /api/trips/123/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "departed"
}
```

## Permissions

### Station Officer
- ✅ Create routes from their station
- ✅ Schedule trips from their station
- ✅ View trips at their station
- ✅ Update trip status (depart, arrive, cancel)
- ✅ View passenger boarding statistics
- ❌ Cannot delete trips (Company Admin only)

### Company Admin
- ✅ All Station Officer permissions
- ✅ Create routes between any stations
- ✅ Schedule trips from any station
- ✅ View all trips
- ✅ Delete trips

### Super Admin
- ✅ All permissions
- ✅ Delete routes
- ✅ System-wide management

## Validation Rules

### Trip Creation
- **Origin Station**: Must exist and be active, required
- **Destination Station**: Must exist and be active, required
- **Origin ≠ Destination**: Cannot be the same station
- **Vehicle**: Must exist, required
- **Departure Time**: Must be in the future
- **Status**: Defaults to "scheduled"
- **Route**: Automatically created if doesn't exist

### Trip Status Updates
- **Valid Statuses**: scheduled, departed, arrived, cancelled
- **Scheduled → Departed**: Allowed
- **Departed → Arrived**: Allowed
- **Scheduled → Cancelled**: Allowed
- **Cannot revert**: Once departed/arrived, cannot go back

## Passenger Boarding Process

### 1. Passenger Registration
- Passenger registers with fingerprint at station
- Receives ticket for specific trip
- Ticket linked to passenger and trip

### 2. Boarding Scan
- Passenger arrives at station
- Scans fingerprint at boarding point
- System validates:
  - Passenger identity (fingerprint match)
  - Valid ticket for this trip
  - Ticket not already used
  - Trip status is "scheduled" or "departed"

### 3. Boarding Approval
- If valid: Passenger boards, ticket marked as used
- If invalid: Boarding denied with reason
- Real-time updates to trip occupancy

### 4. Trip Capacity Management
- System tracks passengers boarded vs vehicle capacity
- Visual indicators when trip is near capacity
- Prevents overbooking

## Trip Status Workflow

```
┌──────────┐
│SCHEDULED │ ← Trip created
└────┬─────┘
     │
     │ Station Officer clicks "Depart"
     ▼
┌──────────┐
│ DEPARTED │ ← Trip in progress
└────┬─────┘
     │
     │ Station Officer clicks "Arrive"
     ▼
┌──────────┐
│ ARRIVED  │ ← Trip completed
└──────────┘

     OR

┌──────────┐
│SCHEDULED │
└────┬─────┘
     │
     │ Station Officer clicks "Cancel"
     ▼
┌──────────┐
│CANCELLED │ ← Trip cancelled
└──────────┘
```

## Real-Time Features

### Dashboard Updates
- Trip list refreshes automatically
- Passenger count updates in real-time
- Status changes reflect immediately
- Occupancy percentage updates

### Notifications (Future Enhancement)
- Alert when trip is near capacity
- Notify when trip should depart
- Alert for delayed trips
- Passenger boarding notifications

## Best Practices

### For Station Officers

1. **Schedule in Advance**
   - Create trips at least 24 hours ahead
   - Allows passengers time to book tickets
   - Better vehicle and route planning

2. **Monitor Occupancy**
   - Check passenger count regularly
   - Add trips if demand is high
   - Cancel underbooked trips early

3. **Update Status Promptly**
   - Mark as "departed" when leaving
   - Mark as "arrived" when reaching destination
   - Cancel trips as soon as known

4. **Vehicle Assignment**
   - Choose vehicles with appropriate capacity
   - Consider route distance and duration
   - Ensure vehicle is available

5. **Route Selection**
   - Use existing routes when possible
   - Create new routes only when needed
   - Verify station names and locations

### For Passengers

1. **Book Early**
   - Purchase tickets in advance
   - Arrive at station 15 minutes early
   - Have fingerprint ready for scanning

2. **Boarding Process**
   - Scan fingerprint at boarding point
   - Wait for approval confirmation
   - Board immediately when approved

3. **Trip Information**
   - Check departure time
   - Verify origin and destination
   - Note vehicle plate number

## Troubleshooting

### Cannot Create Trip
- **Issue**: "Route not found"
- **Solution**: Create route first or select existing route

### Cannot Board Passenger
- **Issue**: "No valid ticket found"
- **Solution**: Passenger needs to purchase ticket first

### Trip Not Showing
- **Issue**: Trip not visible in list
- **Solution**: Check filters (status, date, station)

### Cannot Update Status
- **Issue**: "Invalid status transition"
- **Solution**: Follow proper status workflow

### Vehicle Not Available
- **Issue**: Vehicle already assigned to another trip
- **Solution**: Choose different vehicle or reschedule

## Database Schema

### Routes Table
```sql
CREATE TABLE routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_name VARCHAR(100) NOT NULL,
  origin_station_id INT NOT NULL,
  destination_station_id INT NOT NULL,
  distance_km DECIMAL(10, 2),
  estimated_duration_minutes INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (origin_station_id) REFERENCES stations(id),
  FOREIGN KEY (destination_station_id) REFERENCES stations(id)
);
```

### Trips Table (Enhanced)
```sql
CREATE TABLE trips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  route_id INT NOT NULL,
  departure_time DATETIME NOT NULL,
  status ENUM('scheduled', 'departed', 'arrived', 'cancelled'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (route_id) REFERENCES routes(id)
);
```

## Files Modified/Created

### Backend
- ✅ `backend/routes/routes_management.js` - New routes API
- ✅ `backend/routes/trips.js` - Enhanced with station info
- ✅ `backend/routes/routes.js` - Registered new route

### Frontend
- ✅ `frontend/station_dashboard.html` - Added trip management section
- ✅ `frontend/js/station-officer.js` - New JavaScript file
- ✅ Added trip scheduling modals
- ✅ Added trip details modal

### Documentation
- ✅ `TRIP_SCHEDULING_GUIDE.md` - This file

## Testing Checklist

- [x] Create route between stations
- [x] Schedule trip with vehicle
- [x] View trip list
- [x] Filter trips by status
- [x] Filter trips by date
- [x] View trip details
- [x] Update trip status to departed
- [x] Update trip status to arrived
- [x] Cancel scheduled trip
- [x] Passenger boarding (fingerprint scan)
- [x] Real-time occupancy updates
- [x] Pagination
- [x] Error handling
- [x] Validation messages

## Future Enhancements

### Planned Features
- [ ] Recurring trip templates
- [ ] Automatic route suggestions
- [ ] GPS tracking integration
- [ ] Real-time trip location
- [ ] Passenger notifications (SMS/Email)
- [ ] Online ticket booking
- [ ] QR code tickets
- [ ] Mobile app for conductors
- [ ] Revenue tracking per trip
- [ ] Trip performance analytics

### Advanced Features
- [ ] Dynamic pricing based on demand
- [ ] Seat selection by passengers
- [ ] Multi-stop routes
- [ ] Transfer tickets
- [ ] Loyalty programs
- [ ] Trip ratings and reviews
- [ ] Weather-based scheduling
- [ ] Traffic-aware departure times

## Summary

Station Officers can now:
1. ✅ Schedule trips from their station to other stations
2. ✅ Assign vehicles to trips
3. ✅ Manage trip status (scheduled → departed → arrived)
4. ✅ Monitor passenger boarding in real-time
5. ✅ View occupancy and capacity
6. ✅ Filter and search trips
7. ✅ Cancel trips when needed

The system provides a complete trip management workflow from scheduling to completion, with real-time passenger boarding through fingerprint scanning.

**Status: ✅ COMPLETE AND READY FOR USE**
