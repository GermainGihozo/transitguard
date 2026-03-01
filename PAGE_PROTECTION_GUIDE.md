# Page Protection Guide

## Overview

TransitGuard implements client-side page protection to prevent unauthorized access to dashboard pages. Users who try to access pages directly via URL will be redirected appropriately based on their authentication status and role.

---

## How It Works

### Protection Mechanism

The system uses a JavaScript-based protection layer (`page-protection.js`) that:

1. **Checks Authentication**: Verifies if user has a valid JWT token
2. **Validates Role**: Ensures user has the required role for the page
3. **Redirects Appropriately**: 
   - Unauthenticated users → Login page
   - Wrong role → Their correct dashboard
   - Correct role → Page loads normally

### Protection Script

**File**: `frontend/js/page-protection.js`

**Functions**:
- `protectPage(requiredRole)` - Protects dashboard pages
- `protectPublicPage()` - Redirects logged-in users from public pages

---

## Protected Pages

### Dashboard Pages (Role-Specific)

| Page | Required Role | Protection |
|------|--------------|------------|
| `super_admin_dashboard.html` | super_admin | ✅ Protected |
| `company_dashboard.html` | company_admin | ✅ Protected |
| `station_dashboard.html` | station_officer | ✅ Protected |
| `authority_dashboard.html` | authority | ✅ Protected |
| `conductor_dashboard.html` | conductor | ✅ Protected |

### Public Pages (Redirect if Logged In)

| Page | Behavior |
|------|----------|
| `index.html` | Redirects to user's dashboard if logged in |
| `login.html` | Redirects to user's dashboard if logged in |
| `register.html` | Redirects to user's dashboard if logged in |

---

## User Scenarios

### Scenario 1: Unauthenticated User Tries to Access Dashboard

**Action**: User types `http://localhost:3000/super_admin_dashboard.html` in browser

**Result**:
1. Page protection script runs
2. Detects no authentication token
3. Redirects to `/login.html`
4. User must log in first

### Scenario 2: User Tries to Access Wrong Dashboard

**Action**: Company Admin tries to access `http://localhost:3000/super_admin_dashboard.html`

**Result**:
1. Page protection script runs
2. Detects user is authenticated
3. Checks required role (super_admin) vs user role (company_admin)
4. Roles don't match
5. Redirects to `/company_dashboard.html` (their correct dashboard)

### Scenario 3: User Accesses Correct Dashboard

**Action**: Company Admin accesses `http://localhost:3000/company_dashboard.html`

**Result**:
1. Page protection script runs
2. Detects user is authenticated
3. Checks required role (company_admin) vs user role (company_admin)
4. Roles match ✅
5. Page loads normally

### Scenario 4: Logged-In User Tries to Access Login Page

**Action**: Logged-in user types `http://localhost:3000/login.html`

**Result**:
1. Public page protection script runs
2. Detects user is authenticated
3. Redirects to their dashboard based on role
4. User doesn't see login page

---

## Implementation Details

### Adding Protection to a Dashboard Page

```html
<!-- At the end of the page, before closing </body> tag -->
<script src="js/page-protection.js"></script>
<script>
  // Protect this page - only Super Admins can access
  protectPage('super_admin');
</script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/config.js"></script>
<script src="js/super-admin.js"></script>
</body>
</html>
```

### Adding Protection to a Public Page

```html
<!-- At the end of the page, before closing </body> tag -->
<script src="js/page-protection.js"></script>
<script>
  // Redirect logged-in users to their dashboard
  protectPublicPage();
</script>
</body>
</html>
```

---

## Role-Dashboard Mapping

The protection script uses this mapping to redirect users:

```javascript
const dashboardMap = {
  'super_admin': '/super_admin_dashboard.html',
  'company_admin': '/company_dashboard.html',
  'station_officer': '/station_dashboard.html',
  'authority': '/authority_dashboard.html',
  'conductor': '/conductor_dashboard.html'
};
```

---

## Security Considerations

### Client-Side Protection

**What It Does**:
- ✅ Prevents casual unauthorized access
- ✅ Improves user experience with automatic redirects
- ✅ Hides UI from wrong users
- ✅ Provides immediate feedback

**What It Doesn't Do**:
- ❌ Does NOT provide server-side security
- ❌ Can be bypassed by disabling JavaScript
- ❌ Does NOT protect API endpoints

### Server-Side Protection (Already Implemented)

The backend provides the real security:

```javascript
// Backend middleware protects all API endpoints
router.get('/users', 
  authMiddleware,  // Checks JWT token
  roleMiddleware('super_admin', 'company_admin'),  // Checks role
  async (req, res) => {
    // Only authenticated users with correct role can access
  }
);
```

**Backend Security**:
- ✅ JWT token validation
- ✅ Role-based authorization
- ✅ Cannot be bypassed
- ✅ Protects all data access

---

## Testing Page Protection

### Test 1: Unauthenticated Access

1. Clear browser localStorage (or use incognito mode)
2. Try to access: `http://localhost:3000/super_admin_dashboard.html`
3. **Expected**: Redirected to `/login.html`

### Test 2: Wrong Role Access

1. Log in as Company Admin
2. Try to access: `http://localhost:3000/super_admin_dashboard.html`
3. **Expected**: Redirected to `/company_dashboard.html`

### Test 3: Correct Role Access

1. Log in as Super Admin
2. Access: `http://localhost:3000/super_admin_dashboard.html`
3. **Expected**: Page loads normally

### Test 4: Public Page When Logged In

1. Log in as any user
2. Try to access: `http://localhost:3000/login.html`
3. **Expected**: Redirected to your dashboard

### Test 5: Logout and Access

1. Log in and access your dashboard
2. Click logout
3. Try to access dashboard again
4. **Expected**: Redirected to `/login.html`

---

## Troubleshooting

### Issue: Infinite Redirect Loop

**Symptom**: Page keeps redirecting

**Causes**:
- Corrupted localStorage data
- Invalid user object

**Solution**:
```javascript
// Clear localStorage
localStorage.clear();
// Refresh page
location.reload();
```

### Issue: Can Still Access Wrong Dashboard

**Symptom**: Protection not working

**Causes**:
- JavaScript disabled
- Protection script not loaded
- Script error

**Solution**:
1. Check browser console for errors
2. Ensure `page-protection.js` is loaded
3. Verify script is called before other scripts

### Issue: Logged Out But Still See Dashboard

**Symptom**: Dashboard visible after logout

**Causes**:
- localStorage not cleared on logout
- Token still present

**Solution**:
```javascript
// In logout function, ensure:
localStorage.removeItem('token');
localStorage.removeItem('user');
window.location.href = '/login.html';
```

---

## Best Practices

### For Developers

1. **Always Load Protection First**
   ```html
   <script src="js/page-protection.js"></script>
   <script>protectPage('role');</script>
   <!-- Then load other scripts -->
   ```

2. **Use Correct Role Names**
   - super_admin
   - company_admin
   - station_officer
   - authority
   - conductor

3. **Test All Scenarios**
   - Test with each role
   - Test without authentication
   - Test wrong role access

4. **Clear localStorage on Logout**
   ```javascript
   function logout() {
     localStorage.removeItem('token');
     localStorage.removeItem('user');
     window.location.href = '/login.html';
   }
   ```

### For Users

1. **Always Use Logout Button**
   - Don't just close the browser
   - Properly log out to clear session

2. **Don't Share Login Credentials**
   - Each user should have their own account
   - Roles are assigned for a reason

3. **Report Access Issues**
   - If you can't access your dashboard
   - If you see someone else's dashboard
   - Contact system administrator

---

## Advanced Configuration

### Custom Redirect Logic

You can customize the redirect behavior in `page-protection.js`:

```javascript
// Example: Redirect to custom page on unauthorized access
function redirectToLogin() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Custom redirect with message
  window.location.href = '/login.html?error=unauthorized';
}
```

### Adding New Protected Pages

1. Create your new page
2. Add protection script at the end:
   ```html
   <script src="js/page-protection.js"></script>
   <script>
     protectPage('required_role');
   </script>
   ```

3. Test with different roles

### Logging Access Attempts

You can add logging to track unauthorized access attempts:

```javascript
// In page-protection.js
function logAccessAttempt(page, userRole, requiredRole) {
  console.log(`Access attempt: ${page}`);
  console.log(`User role: ${userRole}`);
  console.log(`Required role: ${requiredRole}`);
  
  // Send to analytics or logging service
  // analytics.track('unauthorized_access', { page, userRole, requiredRole });
}
```

---

## Summary

### What's Protected

✅ All 5 dashboard pages (role-specific)
✅ Public pages redirect logged-in users
✅ Automatic role-based redirects
✅ Clear localStorage on unauthorized access

### How It Works

1. Script loads before page content
2. Checks authentication and role
3. Redirects if necessary
4. Page loads only for authorized users

### Security Layers

1. **Client-Side** (page-protection.js)
   - User experience
   - Immediate feedback
   - Prevents casual access

2. **Server-Side** (backend middleware)
   - Real security
   - Cannot be bypassed
   - Protects all data

### Result

Users cannot access dashboards they're not authorized for by typing URLs directly in the browser. They will be automatically redirected to the appropriate page based on their authentication status and role.

---

**Status**: ✅ Page Protection Implemented and Active

**Files Modified**:
- `frontend/js/page-protection.js` (new)
- `frontend/super_admin_dashboard.html`
- `frontend/company_dashboard.html`
- `frontend/station_dashboard.html`
- `frontend/authority_dashboard.html`
- `frontend/conductor_dashboard.html`
- `frontend/login.html`
- `frontend/register.html`
- `frontend/index.html`
