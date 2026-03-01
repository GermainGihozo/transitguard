// Super Admin Dashboard JavaScript

// Check authentication and role
const user = Auth.getUser();
if (!user || user.role !== 'super_admin') {
  alert('Access denied. Super Admin only.');
  window.location.href = 'login.html';
}

// Display user info
document.getElementById('userName').textContent = user.full_name;

// Global state
let currentPage = 1;
let currentRole = '';
let currentSearch = '';
let activityChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  loadOverviewData();
  initializeChart();
  
  // Auto-refresh every 30 seconds
  setInterval(refreshData, 30000);
  
  // Generate random fingerprint for modal
  document.getElementById('randomFp').textContent = Math.random().toString(36).substring(7);
});

// Navigation
function initializeNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      showSection(section);
      
      // Update active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });
  
  // Sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show selected section
  const section = document.getElementById(`section-${sectionName}`);
  if (section) {
    section.classList.add('active');
    
    // Load section data
    switch(sectionName) {
      case 'overview':
        loadOverviewData();
        break;
      case 'users':
        loadUsers();
        break;
      case 'companies':
        loadCompanyAdmins();
        break;
      case 'trips':
        loadAllTrips();
        break;
    }
  }
}

// Load Overview Data
async function loadOverviewData() {
  try {
    // Load dashboard stats
    const dashboardRes = await API.get('/dashboard/live');
    if (dashboardRes.ok) {
      const { stats, records } = dashboardRes.data;
      
      document.getElementById('todayScans').textContent = stats.total_scans || 0;
      const approvedPercent = stats.total_scans > 0 
        ? Math.round((stats.approved / stats.total_scans) * 100) 
        : 0;
      document.getElementById('approvedPercent').textContent = approvedPercent;
      
      // Update recent activity table
      updateRecentActivity(records);
    }
    
    // Load active trips
    const tripsRes = await API.get('/trips/live-trips');
    if (tripsRes.ok) {
      const trips = tripsRes.data;
      document.getElementById('activeTrips').textContent = trips.length;
      updateActiveTrips(trips);
    }
    
    // Load users count
    const usersRes = await API.get('/users?limit=1');
    if (usersRes.ok) {
      document.getElementById('totalUsers').textContent = usersRes.data.pagination.total;
    }
    
    // Load passengers count (if endpoint exists)
    try {
      const passengersRes = await API.get('/passengers?limit=1');
      if (passengersRes.ok) {
        document.getElementById('totalPassengers').textContent = passengersRes.data.pagination?.total || 0;
      }
    } catch (e) {
      document.getElementById('totalPassengers').textContent = '-';
    }
    
  } catch (error) {
    console.error('Error loading overview:', error);
  }
}

function updateRecentActivity(records) {
  const tbody = document.getElementById('recentActivity');
  
  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No recent activity</td></tr>';
    return;
  }
  
  tbody.innerHTML = records.slice(0, 10).map(record => `
    <tr>
      <td>${formatTime(record.scan_time)}</td>
      <td>${record.full_name}</td>
      <td>${record.seat_number || '-'}</td>
      <td>
        <span class="badge bg-${record.status === 'approved' ? 'success' : 'danger'}">
          ${record.status.toUpperCase()}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="viewDetails(${record.id})">
          <i class="bi bi-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function updateActiveTrips(trips) {
  const container = document.getElementById('activeTripsContainer');
  
  if (!trips || trips.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted py-4">No active trips</div>';
    return;
  }
  
  container.innerHTML = trips.map(trip => `
    <div class="col-md-4">
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0">${trip.plate_number}</h6>
            <span class="badge bg-${trip.status === 'departed' ? 'success' : 'warning'}">
              ${trip.status.toUpperCase()}
            </span>
          </div>
          <p class="text-muted small mb-2">${trip.company_name}</p>
          <div class="d-flex justify-content-between text-sm">
            <span><i class="bi bi-clock"></i> ${formatDateTime(trip.departure_time)}</span>
            <span><i class="bi bi-people"></i> ${trip.onboard}/${trip.capacity}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// User Management
async function loadUsers(page = 1) {
  currentPage = page;
  const role = document.getElementById('filterRole')?.value || '';
  const search = document.getElementById('searchUsers')?.value || '';
  
  try {
    let url = `/users?page=${page}&limit=20`;
    if (role) url += `&role=${role}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const res = await API.get(url);
    
    if (res.ok) {
      const { users, pagination } = res.data;
      updateUsersTable(users);
      updatePagination(pagination, 'usersPagination');
    } else {
      showError('Failed to load users');
    }
  } catch (error) {
    console.error('Error loading users:', error);
    showError('Error loading users');
  }
}

function updateUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users found</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.full_name}</td>
      <td>${user.email}</td>
      <td><span class="badge bg-primary">${user.role.replace('_', ' ').toUpperCase()}</span></td>
      <td>
        <span class="badge bg-${user.is_active ? 'success' : 'danger'}">
          ${user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>${formatDate(user.created_at)}</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="editUser(${user.id})" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-warning" onclick="resetPassword(${user.id})" title="Reset Password">
            <i class="bi bi-key"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteUser(${user.id}, '${user.full_name}')" title="Deactivate">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updatePagination(pagination, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const { page, pages, total } = pagination;
  
  let html = `<div class="text-muted">Showing page ${page} of ${pages} (${total} total)</div>`;
  
  if (pages > 1) {
    html += '<div class="btn-group">';
    
    if (page > 1) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadUsers(${page - 1})">Previous</button>`;
    }
    
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      html += `<button class="btn btn-sm btn-${i === page ? 'primary' : 'outline-primary'}" onclick="loadUsers(${i})">${i}</button>`;
    }
    
    if (page < pages) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadUsers(${page + 1})">Next</button>`;
    }
    
    html += '</div>';
  }
  
  container.innerHTML = html;
}

function filterUsers() {
  loadUsers(1);
}

// Create User
function showCreateUserModal() {
  const modal = new bootstrap.Modal(document.getElementById('createUserModal'));
  document.getElementById('createUserForm').reset();
  document.getElementById('createUserError').classList.add('d-none');
  document.getElementById('randomFp').textContent = Math.random().toString(36).substring(7);
  modal.show();
}

function showCreateCompanyAdminModal() {
  showCreateUserModal();
}

async function createUser() {
  const form = document.getElementById('createUserForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const errorDiv = document.getElementById('createUserError');
  
  errorDiv.classList.add('d-none');
  
  // Client-side validation
  const errors = [];
  
  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  
  if (!data.email || !data.email.includes('@')) {
    errors.push('Please enter a valid email address');
  }
  
  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!data.role) {
    errors.push('Please select a role');
  }
  
  if (!data.fingerprint_template || data.fingerprint_template.length < 10) {
    errors.push('Fingerprint template must be at least 10 characters');
  }
  
  if (errors.length > 0) {
    errorDiv.innerHTML = '<strong>Please fix the following:</strong><ul class="mb-0 mt-2">' + 
      errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  try {
    const res = await API.post('/users/create', data);
    
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
      showSuccess('User created successfully!');
      loadUsers();
      loadCompanyAdmins();
    } else {
      let errorMessage = res.data.message || 'Failed to create user';
      
      if (res.data.errors && Array.isArray(res.data.errors)) {
        errorMessage = '<strong>Validation errors:</strong><ul class="mb-0 mt-2">' + 
          res.data.errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
      }
      
      errorDiv.innerHTML = errorMessage;
      errorDiv.classList.remove('d-none');
    }
  } catch (error) {
    errorDiv.innerHTML = 'Unable to connect to server. Please check your connection.';
    errorDiv.classList.remove('d-none');
  }
}

// Edit User
async function editUser(userId) {
  try {
    const res = await API.get(`/users/${userId}`);
    
    if (res.ok) {
      const user = res.data;
      document.getElementById('editUserId').value = user.id;
      document.getElementById('editUserName').value = user.full_name;
      document.getElementById('editUserEmail').value = user.email;
      document.getElementById('editUserStatus').value = user.is_active ? '1' : '0';
      
      const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
      modal.show();
    }
  } catch (error) {
    showError('Error loading user details');
  }
}

async function updateUser() {
  const userId = document.getElementById('editUserId').value;
  const formData = {
    full_name: document.getElementById('editUserName').value,
    email: document.getElementById('editUserEmail').value,
    is_active: document.getElementById('editUserStatus').value === '1'
  };
  const errorDiv = document.getElementById('editUserError');
  
  errorDiv.classList.add('d-none');
  
  // Client-side validation
  const errors = [];
  
  if (!formData.full_name || formData.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  
  if (!formData.email || !formData.email.includes('@')) {
    errors.push('Please enter a valid email address');
  }
  
  if (errors.length > 0) {
    errorDiv.innerHTML = '<strong>Please fix the following:</strong><ul class="mb-0 mt-2">' + 
      errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  try {
    const res = await API.put(`/users/${userId}`, formData);
    
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
      showSuccess('User updated successfully!');
      loadUsers();
    } else {
      let errorMessage = res.data.message || 'Failed to update user';
      
      if (res.data.errors && Array.isArray(res.data.errors)) {
        errorMessage = '<strong>Validation errors:</strong><ul class="mb-0 mt-2">' + 
          res.data.errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
      }
      
      errorDiv.innerHTML = errorMessage;
      errorDiv.classList.remove('d-none');
    }
  } catch (error) {
    errorDiv.innerHTML = 'Unable to connect to server. Please check your connection.';
    errorDiv.classList.remove('d-none');
  }
}

// Delete User
async function deleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to deactivate ${userName}?`)) {
    return;
  }
  
  try {
    const res = await API.delete(`/users/${userId}`);
    
    if (res.ok) {
      showSuccess('User deactivated successfully!');
      loadUsers();
    } else {
      showError(res.data.message || 'Failed to deactivate user');
    }
  } catch (error) {
    showError('Error deactivating user');
  }
}

// Reset Password
async function resetPassword(userId) {
  const newPassword = prompt('Enter new password (min 8 characters):');
  
  if (!newPassword || newPassword.length < 8) {
    alert('Password must be at least 8 characters');
    return;
  }
  
  try {
    const res = await API.post(`/users/${userId}/reset-password`, {
      new_password: newPassword
    });
    
    if (res.ok) {
      showSuccess('Password reset successfully!');
    } else {
      showError(res.data.message || 'Failed to reset password');
    }
  } catch (error) {
    showError('Error resetting password');
  }
}

// Load Company Admins
async function loadCompanyAdmins() {
  try {
    const res = await API.get('/users?role=company_admin&limit=100');
    
    if (res.ok) {
      const { users } = res.data;
      updateCompanyAdminsGrid(users);
    }
  } catch (error) {
    console.error('Error loading company admins:', error);
  }
}

function updateCompanyAdminsGrid(admins) {
  const container = document.getElementById('companyAdminsContainer');
  
  if (!admins || admins.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-building fs-1 text-muted"></i>
        <p class="text-muted mt-3">No company administrators yet</p>
        <button class="btn btn-primary" onclick="showCreateCompanyAdminModal()">
          <i class="bi bi-plus-circle"></i> Add First Company Admin
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = admins.map(admin => `
    <div class="col-md-6 col-lg-4">
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="mb-1">${admin.full_name}</h5>
              <p class="text-muted small mb-0">${admin.email}</p>
            </div>
            <span class="badge bg-${admin.is_active ? 'success' : 'danger'}">
              ${admin.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div class="text-muted small mb-3">
            <i class="bi bi-calendar"></i> Created ${formatDate(admin.created_at)}
          </div>
          <div class="btn-group w-100">
            <button class="btn btn-sm btn-outline-primary" onclick="editUser(${admin.id})">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-warning" onclick="resetPassword(${admin.id})">
              <i class="bi bi-key"></i> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Chart
function initializeChart() {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;
  
  activityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Approved',
        data: [65, 78, 90, 81, 95, 72, 88],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }, {
        label: 'Denied',
        data: [12, 15, 8, 10, 5, 8, 6],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

// Utility Functions
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showSuccess(message) {
  alert('✓ ' + message);
}

function showError(message) {
  alert('✗ ' + message);
}

function refreshData() {
  const activeSection = document.querySelector('.content-section.active');
  if (activeSection) {
    const sectionId = activeSection.id.replace('section-', '');
    showSection(sectionId);
  }
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    Auth.clearAuth();
    window.location.href = 'login.html';
  }
}

function viewDetails(id) {
  alert('View details for record #' + id);
}


// ==================== TRIP MANAGEMENT ====================

async function loadAllTrips(page = 1) {
  const section = document.getElementById('section-trips');
  const existingCard = section.querySelector('.card');
  
  if (existingCard) {
    existingCard.remove();
  }
  
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5><i class="bi bi-bus-front"></i> All System Trips</h5>
      <div>
        <select class="form-select form-select-sm d-inline-block w-auto me-2" id="filterTripStatus" onchange="filterSystemTrips()">
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="departed">Departed</option>
          <option value="arrived">Arrived</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button class="btn btn-sm btn-outline-primary" onclick="loadAllTrips()">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>
    <div class="card-body">
      <div class="text-center py-4">
        <div class="spinner-border"></div>
        <p class="text-muted mt-2">Loading trips...</p>
      </div>
    </div>
  `;
  
  section.querySelector('.section-header').after(card);
  
  try {
    const res = await API.get(`/trips?page=${page}&limit=20`);
    if (res.ok) {
      displaySystemTrips(res.data.trips, res.data.pagination);
    }
  } catch (error) {
    card.querySelector('.card-body').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> Error loading trips
      </div>
    `;
  }
}

function displaySystemTrips(trips, pagination) {
  const card = document.querySelector('#section-trips .card .card-body');
  
  if (!trips || trips.length === 0) {
    card.innerHTML = '<p class="text-muted text-center py-4">No trips found</p>';
    return;
  }
  
  card.innerHTML = `
    <div class="row g-3" id="systemTripsContainer">
      ${trips.map(trip => createSystemTripCard(trip)).join('')}
    </div>
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Showing page ${pagination.page} of ${pagination.pages} (${pagination.total} total trips)
      </div>
      <div class="btn-group">
        ${pagination.page > 1 ? `<button class="btn btn-sm btn-outline-primary" onclick="loadAllTrips(${pagination.page - 1})">Previous</button>` : ''}
        ${pagination.page < pagination.pages ? `<button class="btn btn-sm btn-outline-primary" onclick="loadAllTrips(${pagination.page + 1})">Next</button>` : ''}
      </div>
    </div>
  `;
}

function createSystemTripCard(trip) {
  const occupancy = Math.round((trip.passengers_boarded / trip.capacity) * 100);
  const statusColors = {
    scheduled: 'primary',
    departed: 'success',
    arrived: 'secondary',
    cancelled: 'danger'
  };
  
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="mb-1">${trip.plate_number}</h5>
              <p class="text-muted small mb-0">${trip.company_name}</p>
            </div>
            <span class="badge bg-${statusColors[trip.status]}">${trip.status.toUpperCase()}</span>
          </div>
          
          <div class="mb-3">
            <p class="mb-1"><strong>Route:</strong> ${trip.route_name}</p>
            <p class="mb-1"><strong>From:</strong> ${trip.origin_station}</p>
            <p class="mb-1"><strong>To:</strong> ${trip.destination_station}</p>
            <p class="mb-1"><strong>Departure:</strong> ${formatDateTime(trip.departure_time)}</p>
          </div>
          
          <div class="mb-2">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-sm">Occupancy:</span>
              <strong>${trip.passengers_boarded} / ${trip.capacity}</strong>
            </div>
            <div class="progress" style="height: 8px;">
              <div class="progress-bar ${occupancy > 80 ? 'bg-danger' : 'bg-success'}" 
                   style="width: ${occupancy}%"></div>
            </div>
          </div>
          
          <button class="btn btn-sm btn-outline-primary w-100" onclick="viewSystemTripDetails(${trip.id})">
            <i class="bi bi-eye"></i> View Details
          </button>
        </div>
      </div>
    </div>
  `;
}

async function filterSystemTrips() {
  const status = document.getElementById('filterTripStatus')?.value || '';
  const container = document.getElementById('systemTripsContainer');
  
  if (!container) return;
  
  container.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border"></div></div>';
  
  try {
    let url = '/trips?limit=20';
    if (status) url += `&status=${status}`;
    
    const res = await API.get(url);
    if (res.ok) {
      container.innerHTML = res.data.trips.map(trip => createSystemTripCard(trip)).join('');
    }
  } catch (error) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i> Error loading trips
        </div>
      </div>
    `;
  }
}

async function viewSystemTripDetails(tripId) {
  try {
    const res = await API.get(`/trips/${tripId}`);
    if (res.ok) {
      const trip = res.data;
      showSystemTripDetailsModal(trip);
    }
  } catch (error) {
    alert('Error loading trip details');
  }
}

function showSystemTripDetailsModal(trip) {
  const occupancy = Math.round((trip.passengers_boarded / trip.capacity) * 100);
  const statusColors = {
    scheduled: 'primary',
    departed: 'success',
    arrived: 'secondary',
    cancelled: 'danger'
  };
  
  const modalHtml = `
    <div class="modal fade" id="systemTripDetailsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-bus-front"></i> Trip Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6 class="text-muted mb-3">Trip Information</h6>
                <table class="table table-sm">
                  <tr><td><strong>Status:</strong></td><td><span class="badge bg-${statusColors[trip.status]}">${trip.status.toUpperCase()}</span></td></tr>
                  <tr><td><strong>Vehicle:</strong></td><td>${trip.plate_number}</td></tr>
                  <tr><td><strong>Company:</strong></td><td>${trip.company_name}</td></tr>
                  <tr><td><strong>Capacity:</strong></td><td>${trip.capacity} seats</td></tr>
                  <tr><td><strong>Departure:</strong></td><td>${formatDateTime(trip.departure_time)}</td></tr>
                </table>
              </div>
              <div class="col-md-6">
                <h6 class="text-muted mb-3">Route Information</h6>
                <table class="table table-sm">
                  <tr><td><strong>Route:</strong></td><td>${trip.route_name}</td></tr>
                  <tr><td><strong>Origin:</strong></td><td>${trip.origin_station}</td></tr>
                  <tr><td><strong>Destination:</strong></td><td>${trip.destination_station}</td></tr>
                </table>
                <h6 class="text-muted mb-2 mt-3">Passenger Statistics</h6>
                <table class="table table-sm">
                  <tr><td><strong>Boarded:</strong></td><td>${trip.passengers_boarded}</td></tr>
                  <tr><td><strong>Available:</strong></td><td>${trip.capacity - trip.passengers_boarded}</td></tr>
                </table>
              </div>
            </div>
            <hr>
            <h6 class="text-muted mb-2">Occupancy</h6>
            <div class="progress" style="height: 30px;">
              <div class="progress-bar ${occupancy > 80 ? 'bg-danger' : 'bg-success'}" 
                   style="width: ${occupancy}%">
                ${occupancy}%
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const existingModal = document.getElementById('systemTripDetailsModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = new bootstrap.Modal(document.getElementById('systemTripDetailsModal'));
  modal.show();
}
