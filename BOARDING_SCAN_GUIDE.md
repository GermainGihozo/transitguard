# Boarding Scan Guide

## Overview
The Boarding Scan system allows Station Officers and Conductors to verify passengers using fingerprint biometric scanning. When passengers scan their fingerprint, the system automatically creates a ticket for the selected trip and approves boarding in real-time.

## Key Feature: Auto-Ticket Creation
When a passenger scans their fingerprint to board:
1. System checks if passenger is registered
2. System checks if passenger already has a ticket for this trip
3. If no ticket exists, system automatically creates one
4. System marks ticket as used and logs boarding
5. Passenger is approved to board

This eliminates the need for passengers to purchase tickets separately before boarding.

## Features Implemented

### 1. Enhanced Boarding API
**Endpoint**: `POST /api/boarding/scan`

**Key Features:**
- **Auto-Ticket Creation**: Automatically creates tickets when passengers scan
- Trip selection required (trip_id parameter is mandatory)
- Comprehensive passenger and trip information in response
- Vehicle capacity checking before ticket creation
- Trip status validation
- Prevents duplicate boarding (checks if already boarded)
- Real-time occupancy calculation
- Dual logging (boarding_logs + boarding_history)

### 2. Boarding Scan Interface

#### Trip Selection
- View all active (scheduled) trips at your station
- Select specific trip for boarding
- Real-time trip information display:
  - Vehicle details
  - Route information
  - Departure time
  - Current occupancy
  - Visual progress bar

#### Biometric Scanner
- Large fingerprint icon for visual feedback
- Text area for fingerprint template input
- "Scan & Verify" button
- Clear button to reset
- Real-time scanning status

#### Scan Result Display
- **Success (Green)**:
  - Passenger information
  - Ticket details
  - Trip information
  - Updated occupancy
  - Visual confirmation

- **Failure (Red)**:
  - Clear denial message
  - Reason for denial
  - Visual warning

#### Recent Boardings
- Last 10 scans displayed
- Passenger name
- Vehicle
- Timestamp
- Status indicator

## User Workflow

### Step 1: Select Trip (Required)
1. Navigate to "Scan Boarding" section
2. Click "Refresh Trips" to load active trips
3. Select a trip from the dropdown (this is mandatory)
4. View trip details and current occupancy

### Step 2: Scan Passenger
1. Passenger presents fingerprint
2. Enter/paste fingerprint template in text area
3. Click "Scan & Verify"
4. System processes in real-time

### Step 3: Auto-Ticket Creation & Boarding
**System automatically:**
- Verifies passenger is registered
- Checks if ticket already exists for this trip
- If no ticket: Creates new ticket automatically
- If ticket exists: Uses existing ticket
- Checks vehicle capacity
- Marks ticket as used
- Logs boarding event
- Updates occupancy

### Step 4: View Result
**If Approved:**
- ✓ Green success message
- Shows if ticket was auto-created
- Passenger details displayed
- Ticket marked as used
- Boarding logged
- Occupancy updated

**If Denied:**
- ✗ Red denial message
- Reason displayed (e.g., vehicle full, already boarded)
- No changes made
- Passenger must resolve issue

## Boarding Validation Rules

### Passenger Validation
1. **Fingerprint Match**: Must match registered passenger
2. **Trip Selection**: Trip must be selected before scanning
3. **Not Already Boarded**: Cannot board same trip twice

### Trip Validation
1. **Trip Status**: Must be "scheduled" or "departed"
2. **Not Cancelled**: Cannot board cancelled trips
3. **Not Arrived**: Cannot board completed trips

### Capacity Validation
1. **Vehicle Capacity**: Cannot exceed vehicle capacity
2. **Real-time Check**: Checks current boarding count before creating ticket
3. **Visual Warning**: Shows when near capacity (>80%)

### Ticket Handling
1. **Auto-Creation**: If passenger has no ticket for trip, creates one automatically
2. **Existing Ticket**: If passenger already has ticket, uses that ticket
3. **Duplicate Prevention**: Cannot board twice with same ticket

## API Request/Response

### Request
```http
POST /api/boarding/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "fingerprint_template": "BIOMETRIC_DATA_HERE",
  "trip_id": 123  // Required - must select trip before scanning
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "✓ Ticket created and boarding approved!",
  "ticket_created": true,
  "passenger": {
    "id": 45,
    "full_name": "John Doe",
    "national_id": "1234567890",
    "phone": "+250788123456"
  },
  "ticket": {
    "id": 789,
    "trip_id": 123
  },
  "trip": {
    "id": 123,
    "plate_number": "RAB-123A",
    "company_name": "ABC Transport",
    "route": "Kigali to Musanze",
    "origin": "Kigali Central",
    "destination": "Musanze Station",
    "departure_time": "2024-01-15T10:00:00",
    "passengers_boarded": 35,
    "capacity": 50,
    "occupancy_percent": 70
  }
}
```

**Note**: If passenger already had a ticket, `ticket_created` will be `false` and message will be "✓ Boarding approved!"

### Error Responses

#### Passenger Not Found (404)
```json
{
  "success": false,
  "message": "Passenger not found. Please register first."
}
```

#### Trip Not Selected (400)
```json
{
  "success": false,
  "message": "Trip ID is required"
}
```

#### Already Boarded (400)
```json
{
  "success": false,
  "message": "Passenger has already boarded this trip"
}
```

#### Trip Not Active (400)
```json
{
  "success": false,
  "message": "Trip is cancelled. Boarding not allowed."
}
```

#### Vehicle Full (400)
```json
{
  "success": false,
  "message": "Vehicle is at full capacity"
}
```

## User Interface

### Boarding Screen Layout
```
┌─────────────────────────────────────────────────────────┐
│ SELECT ACTIVE TRIP (Required)                           │
│ [Dropdown: RAB-123A - Kigali → Musanze (10:00 AM)]    │
│                                                         │
│ Vehicle: RAB-123A | Route: Kigali to Musanze          │
│ Boarded: 35 / 50  [████████░░] 70%                    │
└─────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────────────┐
│ BIOMETRIC SCANNER    │  │ SCAN RESULT                  │
│                      │  │                              │
│      🖐️              │  │   ✓ TICKET CREATED &         │
│   Ready to scan      │  │     BOARDING APPROVED!       │
│                      │  │                              │
│ [Fingerprint Input]  │  │ Ticket automatically created │
│                      │  │                              │
│ [Scan & Verify]      │  │ Name: John Doe               │
│ [Clear]              │  │ Ticket: #789 (Auto-created)  │
│                      │  │ Vehicle: RAB-123A            │
│                      │  │ Boarded: 36/50 (72%)         │
└──────────────────────┘  └──────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ RECENT BOARDINGS                                        │
│ • John Doe - RAB-123A ✓ 10:05 AM                      │
│ • Jane Smith - RAB-123A ✓ 10:03 AM                    │
│ • Bob Johnson - RAB-123A ✓ 10:01 AM                   │
└─────────────────────────────────────────────────────────┘
```

### Visual Feedback

#### Scanning Status
1. **Ready**: Gray fingerprint icon
2. **Scanning**: Blue spinner with "Verifying..."
3. **Success**: Green checkmark
4. **Failure**: Red X

#### Occupancy Indicators
- **0-80%**: Green progress bar
- **81-100%**: Red progress bar (warning)
- **100%**: Boarding blocked

## Permissions

### Station Officer
- ✅ Scan passengers at their station
- ✅ View all active trips at station
- ✅ Approve boarding
- ✅ View boarding history

### Conductor
- ✅ Scan passengers on assigned vehicle
- ✅ Approve boarding
- ✅ View boarding for their trips

### Super Admin
- ✅ All boarding permissions
- ✅ System-wide access

## Security Features

1. **Authentication Required**: JWT token mandatory
2. **Role-Based Access**: Only authorized roles can scan
3. **Rate Limiting**: 30 scans per minute per user
4. **Fingerprint Validation**: Minimum 10 characters
5. **Ticket Verification**: Cannot reuse tickets
6. **Capacity Enforcement**: Prevents overbooking
7. **Audit Trail**: All scans logged with timestamp

## Database Logging

### boarding_logs Table
```sql
INSERT INTO boarding_logs 
(passenger_id, trip_id, station_id, verification_status) 
VALUES (45, 123, 1, 'verified')
```

### boarding_history Table
```sql
INSERT INTO boarding_history 
(passenger_id, ticket_id, trip_id, status) 
VALUES (45, 789, 123, 'approved')
```

### tickets Table
```sql
UPDATE tickets 
SET is_used = TRUE 
WHERE id = 789
```

## Error Handling

### Client-Side Validation
- Empty fingerprint → Warning message
- Short fingerprint (<10 chars) → Error message
- No trip selected → Uses first valid ticket

### Server-Side Validation
- Passenger not found → 404 error
- No valid ticket → 403 error
- Trip not active → 400 error
- Vehicle full → 400 error
- Database error → 500 error

### User-Friendly Messages
- "Passenger not found. Please register first."
- "No valid ticket found. Please purchase a ticket first."
- "Trip is cancelled. Boarding not allowed."
- "Vehicle is at full capacity"
- "Unable to connect to server. Please check your connection."

## Best Practices

### For Station Officers

1. **Pre-Select Trip (Required)**
   - Always select the trip before scanning
   - Verify trip details are correct
   - Check current occupancy
   - Scanning without trip selection will fail

2. **Verify Passenger**
   - Ensure fingerprint is captured correctly
   - Wait for confirmation before allowing boarding
   - Check passenger details match
   - Note if ticket was auto-created

3. **Monitor Capacity**
   - Watch occupancy percentage
   - Alert when approaching capacity
   - System prevents overbooking automatically
   - Coordinate with other staff

4. **Handle Denials**
   - Explain reason to passenger
   - Common reasons: already boarded, vehicle full
   - Direct to registration if not found
   - Log issues for follow-up

### For Passengers

1. **Registration Required**
   - Must be registered in system first
   - Fingerprint must be on file
   - No need to purchase ticket separately

2. **Boarding Process**
   - Arrive at station
   - Wait for your turn
   - Present fingerprint to station officer
   - System creates ticket automatically
   - Board immediately when approved

3. **If Denied**
   - Ask station officer for reason
   - If not registered: Complete registration
   - If already boarded: Cannot board again
   - If vehicle full: Wait for next trip

## Troubleshooting

### Fingerprint Not Recognized
- **Issue**: "Passenger not found"
- **Solution**: 
  - Verify fingerprint template is correct
  - Check passenger is registered in system
  - Complete registration if needed
  - Try re-scanning fingerprint

### Trip Not Selected
- **Issue**: "Please select a trip first"
- **Solution**:
  - Select a trip from dropdown before scanning
  - Refresh trips list if empty
  - Verify trip is active (scheduled status)

### Already Boarded
- **Issue**: "Passenger has already boarded this trip"
- **Solution**:
  - Cannot board same trip twice
  - Check if correct trip is selected
  - Contact station officer if error

### Vehicle Full
- **Issue**: "Vehicle is at full capacity"
- **Solution**:
  - Wait for next trip
  - Check alternative routes
  - Contact station officer for options

## Testing

### Test Scenarios

1. **Successful Auto-Ticket Boarding**
   - Register passenger with fingerprint
   - Station officer selects active trip
   - Scan passenger fingerprint
   - Verify ticket is auto-created
   - Verify boarding approved
   - Check occupancy updated

2. **Boarding with Existing Ticket**
   - Register passenger
   - Manually create ticket for trip
   - Scan fingerprint
   - Verify existing ticket is used (not new one created)
   - Verify boarding approved

3. **Duplicate Boarding Prevention**
   - Register passenger
   - Scan once (approved, ticket created)
   - Scan again immediately
   - Verify denial: "already boarded"

4. **No Trip Selected**
   - Register passenger
   - Don't select trip
   - Scan fingerprint
   - Verify error: "Please select a trip first"

5. **Full Vehicle**
   - Fill vehicle to capacity
   - Try to board one more passenger
   - Verify denial: "Vehicle is at full capacity"
   - Verify no ticket created

6. **Unregistered Passenger**
   - Don't register passenger
   - Select trip
   - Scan unknown fingerprint
   - Verify denial: "Passenger not found"

## Future Enhancements

### Planned Features
- [ ] Hardware fingerprint scanner integration
- [ ] QR code ticket scanning
- [ ] Facial recognition backup
- [ ] Offline mode support
- [ ] Mobile app for conductors
- [ ] Real-time notifications
- [ ] Passenger photos
- [ ] Boarding pass printing

### Advanced Features
- [ ] Multi-factor authentication
- [ ] Fraud detection
- [ ] Predictive capacity alerts
- [ ] Automated check-in
- [ ] Self-service kiosks
- [ ] Integration with payment systems

## Files Modified/Created

### Backend
- ✅ `backend/routes/boardingRoutes.js` - Enhanced scan API

### Frontend
- ✅ `frontend/station_dashboard.html` - Added scan interface
- ✅ `frontend/js/station-officer.js` - Added scan functions

### Documentation
- ✅ `BOARDING_SCAN_GUIDE.md` - This file

## Summary

The Boarding Scan system provides:
1. ✅ Real-time fingerprint verification
2. ✅ Automatic ticket creation on boarding
3. ✅ Trip-specific boarding with mandatory trip selection
4. ✅ Capacity management with overbooking prevention
5. ✅ Duplicate boarding prevention
6. ✅ Visual feedback with ticket creation indicator
7. ✅ Comprehensive logging
8. ✅ Error handling with clear messages
9. ✅ User-friendly interface

Station Officers and Conductors can now efficiently manage passenger boarding with biometric verification and automatic ticket creation, eliminating the need for separate ticket purchase and ensuring security while preventing fraud.

**Key Workflow**: Register → Select Trip → Scan Fingerprint → Auto-Create Ticket → Board

**Status: ✅ COMPLETE AND READY FOR USE**
