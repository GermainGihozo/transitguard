# Super Admin Dashboard Guide

## Overview

The new Super Admin Dashboard is a modern, feature-rich interface for managing the TransitGuard system. It includes real-time monitoring, user management, and analytics.

## Features

### 1. Modern UI/UX
- **Dark Theme**: Professional dark mode interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Polished transitions and interactions
- **Icon System**: Bootstrap Icons for clear visual communication

### 2. Dashboard Sections

#### Overview (Home)
- **Real-time Statistics**
  - Total Users
  - Today's Scans (with approval rate)
  - Active Trips
  - Total Passengers
  
- **Activity Chart**: 7-day boarding activity visualization
- **System Status**: Database, API, and session monitoring
- **Active Trips**: Live view of ongoing trips
- **Recent Activity**: Latest boarding records

#### User Management
- **Create Users**: Add new Company Admins
- **User List**: View all users with filtering
- **Search & Filter**: By role, name, or email
- **User Actions**:
  - Edit user details
  - Reset passwords
  - Deactivate users
- **Pagination**: Navigate through large user lists

#### Company Admins
- **Grid View**: Visual cards for each company admin
- **Quick Actions**: Edit and reset password
- **Status Indicators**: Active/Inactive badges
- **Empty State**: Helpful prompt when no admins exist

### 3. Navigation

**Sidebar Menu**:
- Overview - Dashboard home
- User Management - Manage all users
- Company Admins - Manage company administrators
- Trips & Vehicles - (Coming soon)
- Passengers - (Coming soon)
- Analytics - (Coming soon)
- Settings - (Coming soon)

**Top Bar**:
- Global search
- Refresh button
- Notifications (badge indicator)
- User profile

### 4. User Management Features

#### Creating Users
1. Click "Create User" button
2. Fill in the form:
   - Full Name
   - Email
   - Password (min 8 characters)
   - Role (Company Admin only for Super Admins)
   - Fingerprint Template
3. Click "Create User"

#### Editing Users
1. Click the edit icon (pencil) on any user
2. Update:
   - Full Name
   - Email
   - Status (Active/Inactive)
3. Save changes

#### Resetting Passwords
1. Click the key icon on any user
2. Enter new password (min 8 characters)
3. Confirm

#### Deactivating Users
1. Click the trash icon on any user
2. Confirm deactivation
3. User is soft-deleted (can be reactivated)

### 5. Real-time Features

- **Auto-refresh**: Dashboard updates every 30 seconds
- **Live Stats**: Real-time boarding activity
- **Active Trips**: Current trip status
- **System Monitoring**: Server and database status

## How to Access

1. **Login**: Use super admin credentials
   - Default: admin@test.com / password123

2. **Navigate**: Use the sidebar menu to switch sections

3. **Search**: Use the top bar search for quick access

4. **Refresh**: Click the refresh icon to update data manually

## Keyboard Shortcuts

- **Esc**: Close modals
- **Ctrl/Cmd + K**: Focus search (coming soon)

## Technical Details

### Files Structure
```
frontend/
├── super_admin_dashboard.html  # Main dashboard HTML
├── css/
│   └── super-admin.css         # Dashboard styles
└── js/
    ├── config.js               # API configuration
    └── super-admin.js          # Dashboard logic
```

### Dependencies
- Bootstrap 5.3.2 (CSS & JS)
- Bootstrap Icons 1.11.1
- Chart.js 4.4.0
- Custom CSS and JavaScript

### API Endpoints Used
- `GET /api/dashboard/live` - Dashboard statistics
- `GET /api/trips/live-trips` - Active trips
- `GET /api/users` - User list
- `POST /api/users/create` - Create user
- `GET /api/users/:id` - User details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `POST /api/users/:id/reset-password` - Reset password

## Customization

### Colors
Edit `frontend/css/super-admin.css`:
```css
:root {
  --primary: #3b82f6;    /* Blue */
  --success: #22c55e;    /* Green */
  --warning: #f59e0b;    /* Orange */
  --danger: #ef4444;     /* Red */
  --info: #06b6d4;       /* Cyan */
}
```

### Auto-refresh Interval
Edit `frontend/js/super-admin.js`:
```javascript
// Change 30000 (30 seconds) to your preferred interval
setInterval(refreshData, 30000);
```

## Troubleshooting

### Dashboard not loading
- Check if backend server is running
- Verify you're logged in as super_admin
- Check browser console for errors

### Users not showing
- Ensure database migration is complete
- Check API endpoint `/api/users` is accessible
- Verify authentication token is valid

### Charts not displaying
- Ensure Chart.js is loaded
- Check browser console for errors
- Verify canvas element exists

### Styles not applying
- Clear browser cache
- Check if CSS file is loaded
- Verify file path is correct

## Best Practices

1. **Regular Monitoring**: Check dashboard daily for system health
2. **User Management**: Review user list periodically
3. **Security**: Change default passwords immediately
4. **Backups**: Regular database backups recommended
5. **Updates**: Keep dependencies up to date

## Future Enhancements

- [ ] Advanced analytics and reporting
- [ ] Bulk user operations
- [ ] Email notifications
- [ ] Activity logs and audit trail
- [ ] Export data to CSV/PDF
- [ ] Dark/Light theme toggle
- [ ] Customizable dashboard widgets
- [ ] Real-time notifications
- [ ] Advanced search filters
- [ ] User activity tracking

## Support

For issues or questions:
1. Check the console for error messages
2. Review API documentation
3. Check network tab for failed requests
4. Verify user permissions

## Screenshots

The dashboard features:
- Clean, modern dark interface
- Intuitive navigation
- Real-time data visualization
- Responsive design for all devices
- Professional color scheme
- Clear typography and spacing

## Performance

- Optimized for fast loading
- Efficient API calls
- Minimal dependencies
- Smooth animations
- Responsive interactions

## Security

- JWT authentication required
- Role-based access control
- Secure password handling
- Session management
- CSRF protection (via JWT)
