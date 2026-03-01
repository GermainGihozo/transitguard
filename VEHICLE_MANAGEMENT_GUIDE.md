# Vehicle Management Guide

## Overview
The Vehicle Management system allows Company Admins to manage their fleet of vehicles through an intuitive interface.

## Features Implemented

### 1. Vehicle List View
- Grid layout showing all vehicles
- Each vehicle card displays:
  - Plate number
  - Company name
  - Passenger capacity
  - Date added
  - Status badge (Active)
- Empty state with "Add First Vehicle" button

### 2. Search and Filter
- **Search**: Search by plate number or company name
- **Filter by Company**: Dropdown to filter vehicles by company
- **Apply Filters**: Button to apply search and filter criteria

### 3. Add New Vehicle
**Access**: Click "Add Vehicle" button in the header

**Required Fields:**
- **Plate Number** (3-20 characters)
  - Unique identifier for the vehicle
  - Example: RAB-123A, KG-456B
  
- **Company Name** (2-100 characters)
  - Name of the transport company
  - Example: Transit Express Ltd
  
- **Passenger Capacity** (1-200)
  - Number of passenger seats
  - Example: 50, 30, 70

**Validation:**
- Plate number must be unique
- All fields are required
- Capacity must be a positive number
- Client-side and server-side validation

### 4. Edit Vehicle
**Access**: Click "Edit" button on any vehicle card

**Features:**
- Pre-filled form with current vehicle data
- Same validation as create
- Updates vehicle information
- Cannot change to duplicate plate number

### 5. View Vehicle Details
**Access**: Click "View" button on any vehicle card

**Displays:**
- Complete vehicle information
- Date added
- All vehicle specifications

### 6. Delete Vehicle
**Access**: Click "Delete" button on any vehicle card

**Features:**
- Confirmation dialog before deletion
- Permanent deletion (cannot be undone)
- Only Super Admins can delete vehicles
- Company Admins can only edit

### 7. Pagination
- Shows 20 vehicles per page
- Page navigation buttons
- Shows current page and total pages
- Shows total vehicle count

## User Interface

### Vehicle Card Layout
```
┌─────────────────────────────────┐
│ 🚌 RAB-123A          [Active]  │
│ Transit Express Ltd             │
│                                 │
│ 👥 Capacity: 50 seats          │
│ 📅 Added: Jan 15, 2024         │
│                                 │
│ [View] [Edit] [Delete]         │
└─────────────────────────────────┘
```

### Search and Filter Bar
```
┌─────────────────────────────────────────────────┐
│ 🔍 Search...  | [All Companies ▼] | [Apply]    │
└─────────────────────────────────────────────────┘
```

## API Endpoints Used

### GET /api/vehicles
Get all vehicles with pagination
- Query params: page, limit, search, company
- Returns: vehicles array and pagination info

### POST /api/vehicles
Create a new vehicle
- Body: plate_number, company_name, capacity
- Returns: success message and vehicle_id

### GET /api/vehicles/:id
Get vehicle by ID
- Returns: complete vehicle information

### PUT /api/vehicles/:id
Update vehicle information
- Body: plate_number, company_name, capacity
- Returns: success message

### DELETE /api/vehicles/:id
Delete a vehicle
- Returns: success message
- Restricted to Super Admins only

## Validation Rules

### Plate Number
- Required: Yes
- Min length: 3 characters
- Max length: 20 characters
- Must be unique
- Example: RAB-123A

### Company Name
- Required: Yes
- Min length: 2 characters
- Max length: 100 characters
- Example: Transit Express Ltd

### Capacity
- Required: Yes
- Type: Number
- Min value: 1
- Max value: 200
- Example: 50

## Error Handling

### Client-Side Validation
- Checks all fields before API call
- Shows multiple errors as bulleted list
- Prevents invalid data submission

### Server-Side Validation
- Validates all fields
- Checks for duplicate plate numbers
- Returns clear error messages

### Connection Errors
- Displays user-friendly message
- Suggests checking connection
- Allows retry

## Success Messages

All operations show success messages with checkmarks:
- ✓ Vehicle added successfully!
- ✓ Vehicle updated successfully!
- ✓ Vehicle deleted successfully!

## Permissions

### Company Admin
- ✅ View all vehicles
- ✅ Add new vehicles
- ✅ Edit vehicles
- ❌ Delete vehicles (Super Admin only)

### Super Admin
- ✅ View all vehicles
- ✅ Add new vehicles
- ✅ Edit vehicles
- ✅ Delete vehicles

### Station Officer
- ✅ View vehicles (read-only)
- ❌ Cannot modify

### Authority
- ✅ View vehicles (read-only)
- ❌ Cannot modify

### Conductor
- ❌ No access to vehicle management

## Usage Examples

### Adding a New Vehicle
1. Navigate to "Vehicles" section
2. Click "Add Vehicle" button
3. Fill in the form:
   - Plate Number: RAB-123A
   - Company Name: Transit Express Ltd
   - Capacity: 50
4. Click "Add Vehicle"
5. Vehicle appears in the list

### Editing a Vehicle
1. Find the vehicle in the list
2. Click "Edit" button
3. Modify the information
4. Click "Save Changes"
5. Changes are reflected immediately

### Searching for Vehicles
1. Type in the search box (plate number or company)
2. Select company from dropdown (optional)
3. Click "Apply Filters"
4. Results are filtered

### Deleting a Vehicle (Super Admin only)
1. Find the vehicle in the list
2. Click "Delete" button
3. Confirm deletion in the dialog
4. Vehicle is removed from the list

## Integration with Other Features

### Trip Management
- Vehicles are used when creating trips
- Vehicle capacity determines trip capacity
- Vehicle availability is checked

### Boarding System
- Vehicles are associated with trips
- Boarding logs reference vehicles
- Capacity tracking per vehicle

### Reports
- Vehicle utilization reports
- Revenue per vehicle
- Maintenance scheduling

## Future Enhancements

### Planned Features
- [ ] Vehicle status (Active, Maintenance, Retired)
- [ ] Maintenance scheduling
- [ ] Vehicle photos
- [ ] GPS tracking integration
- [ ] Fuel consumption tracking
- [ ] Driver assignment
- [ ] Vehicle documents (insurance, registration)
- [ ] Maintenance history
- [ ] Vehicle performance metrics
- [ ] Export vehicle list to Excel/PDF

### Advanced Features
- [ ] Vehicle availability calendar
- [ ] Automatic maintenance reminders
- [ ] Real-time vehicle location
- [ ] Vehicle condition reports
- [ ] Accident/incident logging
- [ ] Vehicle depreciation tracking

## Troubleshooting

### Vehicle Not Appearing
- Check if you're on the correct page
- Try refreshing the page
- Check search/filter settings
- Verify vehicle was created successfully

### Cannot Edit Vehicle
- Ensure you have Company Admin or Super Admin role
- Check if vehicle exists
- Verify you're logged in

### Cannot Delete Vehicle
- Only Super Admins can delete vehicles
- Check if vehicle is assigned to active trips
- Verify you have proper permissions

### Duplicate Plate Number Error
- Each plate number must be unique
- Check if vehicle already exists
- Use a different plate number

## Best Practices

1. **Consistent Naming**: Use consistent format for plate numbers
2. **Accurate Capacity**: Enter correct passenger capacity
3. **Regular Updates**: Keep vehicle information up to date
4. **Proper Deletion**: Only delete vehicles no longer in service
5. **Search First**: Search before adding to avoid duplicates

## Technical Details

### Files Modified
- `frontend/company_dashboard.html` - Added vehicles section and modals
- `frontend/js/company-admin.js` - Added vehicle management functions
- `backend/routes/vehicles.js` - Already existed with complete API

### Dependencies
- Bootstrap 5.3.2 - UI components and modals
- Bootstrap Icons - Icons for UI
- Custom CSS - Dashboard styling

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Summary

The Vehicle Management system is now fully functional with:
- ✅ Complete CRUD operations
- ✅ Search and filter functionality
- ✅ Client and server-side validation
- ✅ User-friendly interface
- ✅ Proper error handling
- ✅ Role-based permissions
- ✅ Responsive design
- ✅ Pagination support

Company Admins can now efficiently manage their vehicle fleet through an intuitive, modern interface.
