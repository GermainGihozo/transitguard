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
      case 'passengers':
        loadPassengers();
        break;
      case 'analytics':
        loadAnalytics();
        break;
      case 'settings':
        loadSettings();
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
    } else {
      console.error('Failed to load dashboard stats:', dashboardRes);
    }
    
    // Load active trips
    const tripsRes = await API.get('/trips/live-trips');
    if (tripsRes.ok) {
      const trips = tripsRes.data;
      document.getElementById('activeTrips').textContent = trips.length;
      updateActiveTrips(trips);
    } else {
      console.error('Failed to load active trips:', tripsRes);
      updateActiveTrips([]);
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
    container.innerHTML = '<div class="col-12 text-center text-muted py-4"><i class="bi bi-bus-front fs-1 d-block mb-2"></i>No active trips at the moment</div>';
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
          ${trip.route_name ? `<p class="text-muted small mb-2"><i class="bi bi-signpost"></i> ${trip.route_name}</p>` : ''}
          <div class="d-flex justify-content-between text-sm">
            <span><i class="bi bi-clock"></i> ${formatDateTime(trip.departure_time)}</span>
            <span><i class="bi bi-people"></i> ${trip.onboard || 0}/${trip.capacity}</span>
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


// ==================== PASSENGER MANAGEMENT ====================

let currentPassengerPage = 1;

async function loadPassengers(page = 1) {
  currentPassengerPage = page;
  const search = document.getElementById('searchPassengers')?.value || '';
  const period = document.getElementById('filterPassengerPeriod')?.value || '';
  
  try {
    let url = `/passengers?page=${page}&limit=20`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (period) url += `&period=${period}`;
    
    const res = await API.get(url);
    
    if (res.ok) {
      const { passengers, pagination, stats } = res.data;
      updatePassengersTable(passengers);
      updatePassengersPagination(pagination);
      updatePassengerStats(stats);
    } else {
      showError('Failed to load passengers');
    }
  } catch (error) {
    console.error('Error loading passengers:', error);
    showError('Error loading passengers');
  }
}

function updatePassengersTable(passengers) {
  const tbody = document.getElementById('passengersTableBody');
  
  if (!passengers || passengers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No passengers found</td></tr>';
    return;
  }
  
  tbody.innerHTML = passengers.map(passenger => `
    <tr>
      <td>#${passenger.id}</td>
      <td>${passenger.full_name}</td>
      <td>${passenger.national_id || '-'}</td>
      <td>${passenger.phone || '-'}</td>
      <td><span class="badge bg-info">${passenger.ticket_count || 0}</span></td>
      <td>${passenger.last_boarding ? formatDateTime(passenger.last_boarding) : 'Never'}</td>
      <td>${formatDate(passenger.created_at)}</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="viewPassengerDetails(${passenger.id})" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-success" onclick="assignTicket(${passenger.id})" title="Assign Ticket">
            <i class="bi bi-ticket"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deletePassenger(${passenger.id}, '${passenger.full_name}')" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updatePassengersPagination(pagination) {
  const container = document.getElementById('passengersPagination');
  if (!container) return;
  
  const { page, pages, total } = pagination;
  
  let html = `<div class="text-muted">Showing page ${page} of ${pages} (${total} total passengers)</div>`;
  
  if (pages > 1) {
    html += '<div class="btn-group">';
    
    if (page > 1) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadPassengers(${page - 1})">Previous</button>`;
    }
    
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      html += `<button class="btn btn-sm btn-${i === page ? 'primary' : 'outline-primary'}" onclick="loadPassengers(${i})">${i}</button>`;
    }
    
    if (page < pages) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadPassengers(${page + 1})">Next</button>`;
    }
    
    html += '</div>';
  }
  
  container.innerHTML = html;
}

function updatePassengerStats(stats) {
  if (!stats) return;
  
  document.getElementById('totalPassengersCount').textContent = stats.total || 0;
  document.getElementById('activeTicketsCount').textContent = stats.active_tickets || 0;
  document.getElementById('todayBoardingsCount').textContent = stats.today_boardings || 0;
  document.getElementById('newPassengersCount').textContent = stats.new_this_week || 0;
}

function filterPassengers() {
  loadPassengers(1);
}

// Register Passenger
function showRegisterPassengerModal() {
  const modal = new bootstrap.Modal(document.getElementById('registerPassengerModal'));
  document.getElementById('registerPassengerForm').reset();
  document.getElementById('registerPassengerError').classList.add('d-none');
  document.getElementById('randomPassengerFp').textContent = Math.random().toString(36).substring(7);
  modal.show();
}

async function registerPassenger() {
  const form = document.getElementById('registerPassengerForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const errorDiv = document.getElementById('registerPassengerError');
  
  errorDiv.classList.add('d-none');
  
  // Client-side validation
  const errors = [];
  
  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  
  if (!data.fingerprint || data.fingerprint.length < 10) {
    errors.push('Fingerprint template must be at least 10 characters');
  }
  
  if (data.national_id && data.national_id.length !== 16) {
    errors.push('National ID must be exactly 16 digits');
  }
  
  if (data.phone && !data.phone.match(/^\+?[0-9]{10,15}$/)) {
    errors.push('Phone number must be 10-15 digits');
  }
  
  if (errors.length > 0) {
    errorDiv.innerHTML = '<strong>Please fix the following:</strong><ul class="mb-0 mt-2">' + 
      errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  try {
    const res = await API.post('/passengers/register', data);
    
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('registerPassengerModal')).hide();
      showSuccess('Passenger registered successfully!');
      loadPassengers();
    } else {
      let errorMessage = res.data.message || 'Failed to register passenger';
      
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

// View Passenger Details
async function viewPassengerDetails(passengerId) {
  const modal = new bootstrap.Modal(document.getElementById('passengerDetailsModal'));
  const content = document.getElementById('passengerDetailsContent');
  
  content.innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div><p class="text-muted mt-2">Loading...</p></div>';
  modal.show();
  
  try {
    const res = await API.get(`/passengers/${passengerId}`);
    
    if (res.ok) {
      const passenger = res.data;
      displayPassengerDetails(passenger);
    } else {
      content.innerHTML = '<div class="alert alert-danger">Failed to load passenger details</div>';
    }
  } catch (error) {
    content.innerHTML = '<div class="alert alert-danger">Error loading passenger details</div>';
  }
}

function displayPassengerDetails(passenger) {
  const content = document.getElementById('passengerDetailsContent');
  
  content.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h6 class="text-muted mb-3">Personal Information</h6>
        <table class="table table-sm">
          <tr><td><strong>ID:</strong></td><td>#${passenger.id}</td></tr>
          <tr><td><strong>Full Name:</strong></td><td>${passenger.full_name}</td></tr>
          <tr><td><strong>National ID:</strong></td><td>${passenger.national_id || 'Not provided'}</td></tr>
          <tr><td><strong>Passport:</strong></td><td>${passenger.passport_number || 'Not provided'}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${passenger.phone || 'Not provided'}</td></tr>
          <tr><td><strong>Registered:</strong></td><td>${formatDateTime(passenger.created_at)}</td></tr>
        </table>
      </div>
      <div class="col-md-6">
        <h6 class="text-muted mb-3">Travel Statistics</h6>
        <table class="table table-sm">
          <tr><td><strong>Total Tickets:</strong></td><td>${passenger.total_tickets || 0}</td></tr>
          <tr><td><strong>Active Tickets:</strong></td><td>${passenger.active_tickets || 0}</td></tr>
          <tr><td><strong>Total Boardings:</strong></td><td>${passenger.total_boardings || 0}</td></tr>
          <tr><td><strong>Last Boarding:</strong></td><td>${passenger.last_boarding ? formatDateTime(passenger.last_boarding) : 'Never'}</td></tr>
        </table>
        
        <h6 class="text-muted mb-2 mt-3">Biometric Status</h6>
        <div class="alert alert-success">
          <i class="bi bi-fingerprint"></i> Fingerprint registered
        </div>
      </div>
    </div>
    
    ${passenger.tickets && passenger.tickets.length > 0 ? `
      <hr>
      <h6 class="text-muted mb-3">Recent Tickets</h6>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Trip</th>
              <th>Seat</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${passenger.tickets.slice(0, 5).map(ticket => `
              <tr>
                <td>#${ticket.id}</td>
                <td>${ticket.trip_info || 'N/A'}</td>
                <td>${ticket.seat_number || 'Not assigned'}</td>
                <td><span class="badge bg-${ticket.is_used ? 'secondary' : 'success'}">${ticket.is_used ? 'Used' : 'Active'}</span></td>
                <td>${formatDate(ticket.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<p class="text-muted text-center py-3">No tickets found</p>'}
  `;
}

// Assign Ticket
async function assignTicket(passengerId) {
  const tripId = prompt('Enter Trip ID to assign ticket:');
  
  if (!tripId || isNaN(tripId)) {
    alert('Please enter a valid Trip ID');
    return;
  }
  
  try {
    const res = await API.post('/tickets/assign', {
      passenger_id: passengerId,
      trip_id: parseInt(tripId)
    });
    
    if (res.ok) {
      showSuccess('Ticket assigned successfully!');
      loadPassengers();
    } else {
      showError(res.data.message || 'Failed to assign ticket');
    }
  } catch (error) {
    showError('Error assigning ticket');
  }
}

// Delete Passenger
async function deletePassenger(passengerId, passengerName) {
  if (!confirm(`Are you sure you want to delete ${passengerName}? This will also delete all associated tickets and boarding records.`)) {
    return;
  }
  
  try {
    const res = await API.delete(`/passengers/${passengerId}`);
    
    if (res.ok) {
      showSuccess('Passenger deleted successfully!');
      loadPassengers();
    } else {
      showError(res.data.message || 'Failed to delete passenger');
    }
  } catch (error) {
    showError('Error deleting passenger');
  }
}


// ==================== ANALYTICS ====================

let boardingTrendsChart = null;
let boardingStatusChart = null;
let companiesChart = null;
let routesChart = null;
let peakHoursChart = null;

async function loadAnalytics() {
  const timeRange = document.getElementById('analyticsTimeRange')?.value || 30;
  
  console.log(`Loading analytics for ${timeRange} days...`);
  
  try {
    const res = await API.get(`/analytics?days=${timeRange}`);
    
    console.log('Analytics API response:', res);
    
    if (res.ok) {
      const data = res.data;
      console.log('Analytics data received:', data);
      
      updateAnalyticsMetrics(data.metrics || {});
      updateBoardingTrendsChart(data.trends || []);
      updateBoardingStatusChart(data.status || { approved: 0, denied: 0 });
      updateCompaniesChart(data.companies || []);
      updateRoutesChart(data.routes || []);
      updatePeakHoursChart(data.peakHours || Array(24).fill(0));
      updateAnalyticsReportsTable(data.dailyReports || []);
      
      console.log('✓ Analytics loaded successfully');
    } else {
      console.error('Analytics API error:', res);
      alert('Failed to load analytics data: ' + (res.data?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    alert('Error loading analytics: ' + error.message);
  }
}

function updateAnalyticsMetrics(metrics) {
  if (!metrics) return;
  
  document.getElementById('analyticsPassengers').textContent = metrics.totalPassengers || 0;
  document.getElementById('analyticsBoardings').textContent = metrics.totalBoardings || 0;
  document.getElementById('analyticsTrips').textContent = metrics.totalTrips || 0;
  document.getElementById('analyticsApprovalRate').textContent = `${metrics.approvalRate || 0}%`;
  
  // Update change indicators
  updateChangeIndicator('analyticsPassengersChange', metrics.passengersChange);
  updateChangeIndicator('analyticsBoardingsChange', metrics.boardingsChange);
  updateChangeIndicator('analyticsTripsChange', metrics.tripsChange);
}

function updateChangeIndicator(elementId, change) {
  const element = document.getElementById(elementId);
  if (!element || change === undefined) return;
  
  const isPositive = change >= 0;
  element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
  element.innerHTML = `
    <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i> 
    ${Math.abs(change)}% vs previous period
  `;
}

function updateBoardingTrendsChart(trends) {
  const ctx = document.getElementById('boardingTrendsChart');
  if (!ctx) {
    console.warn('boardingTrendsChart canvas not found');
    return;
  }
  
  if (boardingTrendsChart) {
    boardingTrendsChart.destroy();
  }
  
  // Ensure we have data
  if (!trends || trends.length === 0) {
    console.warn('No trends data available');
    trends = [];
  }
  
  const labels = trends.map(t => formatDate(t.date));
  const approved = trends.map(t => t.approved || 0);
  const denied = trends.map(t => t.denied || 0);
  
  console.log('Boarding trends chart data:', { labels, approved, denied });
  
  boardingTrendsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Approved',
        data: approved,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      }, {
        label: 'Denied',
        data: denied,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
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

function updateBoardingStatusChart(status) {
  const ctx = document.getElementById('boardingStatusChart');
  if (!ctx) return;
  
  if (boardingStatusChart) {
    boardingStatusChart.destroy();
  }
  
  boardingStatusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Approved', 'Denied'],
      datasets: [{
        data: [status?.approved || 0, status?.denied || 0],
        backgroundColor: ['#22c55e', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8' }
        }
      }
    }
  });
}

function updateCompaniesChart(companies) {
  const ctx = document.getElementById('companiesChart');
  if (!ctx) {
    console.warn('companiesChart canvas not found');
    return;
  }
  
  if (companiesChart) {
    companiesChart.destroy();
  }
  
  // Handle empty data
  if (!companies || companies.length === 0) {
    console.warn('No companies data available');
    companies = [{ company_name: 'No Data', trip_count: 0 }];
  }
  
  const labels = companies.map(c => c.company_name);
  const data = companies.map(c => c.trip_count || 0);
  
  console.log('Companies chart data:', { labels, data });
  
  companiesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Number of Trips',
        data,
        backgroundColor: '#3b82f6',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

function updateRoutesChart(routes) {
  const ctx = document.getElementById('routesChart');
  if (!ctx) {
    console.warn('routesChart canvas not found');
    return;
  }
  
  if (routesChart) {
    routesChart.destroy();
  }
  
  // Handle empty data
  if (!routes || routes.length === 0) {
    console.warn('No routes data available');
    routes = [{ route_name: 'No Data', boarding_count: 0 }];
  }
  
  const labels = routes.map(r => r.route_name);
  const data = routes.map(r => r.boarding_count || 0);
  
  console.log('Routes chart data:', { labels, data });
  
  routesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Boardings',
        data,
        backgroundColor: '#f59e0b',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

function updatePeakHoursChart(peakHours) {
  const ctx = document.getElementById('peakHoursChart');
  if (!ctx) return;
  
  if (peakHoursChart) {
    peakHoursChart.destroy();
  }
  
  const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
  const data = peakHours || Array(24).fill(0);
  
  peakHoursChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Boardings',
        data,
        backgroundColor: '#06b6d4',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

function updateAnalyticsReportsTable(reports) {
  const tbody = document.getElementById('analyticsReportsTable');
  if (!tbody) return;
  
  if (!reports || reports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No data available</td></tr>';
    return;
  }
  
  tbody.innerHTML = reports.map(report => {
    const approvalRate = report.total > 0 ? Math.round((report.approved / report.total) * 100) : 0;
    return `
      <tr>
        <td>${formatDate(report.date)}</td>
        <td>${report.total}</td>
        <td><span class="badge bg-success">${report.approved}</span></td>
        <td><span class="badge bg-danger">${report.denied}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="progress flex-grow-1" style="height: 8px;">
              <div class="progress-bar bg-success" style="width: ${approvalRate}%"></div>
            </div>
            <span class="text-sm">${approvalRate}%</span>
          </div>
        </td>
        <td>${report.unique_passengers}</td>
      </tr>
    `;
  }).join('');
}

function exportReport() {
  const timeRange = document.getElementById('analyticsTimeRange')?.value || 30;
  alert(`Exporting ${timeRange}-day report... (Feature coming soon)`);
  // TODO: Implement CSV/PDF export
}

// ==================== SETTINGS ====================

async function loadSettings() {
  try {
    const res = await API.get('/settings');
    
    if (res.ok) {
      const settings = res.data;
      populateSettings(settings);
    }
    
    // Load system info
    loadSystemInfo();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function populateSettings(settings) {
  // General Settings
  if (settings.systemName) document.getElementById('settingSystemName').value = settings.systemName;
  if (settings.systemEmail) document.getElementById('settingSystemEmail').value = settings.systemEmail;
  if (settings.language) document.getElementById('settingLanguage').value = settings.language;
  if (settings.timezone) document.getElementById('settingTimezone').value = settings.timezone;
  
  // Security Settings
  if (settings.sessionTimeout) document.getElementById('settingSessionTimeout').value = settings.sessionTimeout;
  if (settings.passwordLength) document.getElementById('settingPasswordLength').value = settings.passwordLength;
  if (settings.maxLoginAttempts) document.getElementById('settingMaxLoginAttempts').value = settings.maxLoginAttempts;
  if (settings.lockoutDuration) document.getElementById('settingLockoutDuration').value = settings.lockoutDuration;
  if (settings.require2FA !== undefined) document.getElementById('settingRequire2FA').checked = settings.require2FA;
  if (settings.passwordExpiry !== undefined) document.getElementById('settingPasswordExpiry').checked = settings.passwordExpiry;
  
  // Biometric Settings
  if (settings.fingerprintThreshold) document.getElementById('settingFingerprintThreshold').value = settings.fingerprintThreshold;
  if (settings.maxVerificationAttempts) document.getElementById('settingMaxVerificationAttempts').value = settings.maxVerificationAttempts;
  if (settings.fallbackToManual !== undefined) document.getElementById('settingFallbackToManual').checked = settings.fallbackToManual;
  if (settings.logBiometricAttempts !== undefined) document.getElementById('settingLogBiometricAttempts').checked = settings.logBiometricAttempts;
  
  // Notification Settings
  if (settings.emailNotifications !== undefined) document.getElementById('settingEmailNotifications').checked = settings.emailNotifications;
  if (settings.smsNotifications !== undefined) document.getElementById('settingSMSNotifications').checked = settings.smsNotifications;
  if (settings.notifyNewUser !== undefined) document.getElementById('settingNotifyNewUser').checked = settings.notifyNewUser;
  if (settings.notifyFailedLogin !== undefined) document.getElementById('settingNotifyFailedLogin').checked = settings.notifyFailedLogin;
  
  // Maintenance Settings
  if (settings.logRetention) document.getElementById('settingLogRetention').value = settings.logRetention;
  if (settings.backupFrequency) document.getElementById('settingBackupFrequency').value = settings.backupFrequency;
  if (settings.maintenanceMode !== undefined) document.getElementById('settingMaintenanceMode').checked = settings.maintenanceMode;
}

async function saveAllSettings() {
  const settings = {
    // General
    systemName: document.getElementById('settingSystemName').value,
    systemEmail: document.getElementById('settingSystemEmail').value,
    language: document.getElementById('settingLanguage').value,
    timezone: document.getElementById('settingTimezone').value,
    
    // Security
    sessionTimeout: parseInt(document.getElementById('settingSessionTimeout').value),
    passwordLength: parseInt(document.getElementById('settingPasswordLength').value),
    maxLoginAttempts: parseInt(document.getElementById('settingMaxLoginAttempts').value),
    lockoutDuration: parseInt(document.getElementById('settingLockoutDuration').value),
    require2FA: document.getElementById('settingRequire2FA').checked,
    passwordExpiry: document.getElementById('settingPasswordExpiry').checked,
    
    // Biometric
    fingerprintThreshold: parseInt(document.getElementById('settingFingerprintThreshold').value),
    maxVerificationAttempts: parseInt(document.getElementById('settingMaxVerificationAttempts').value),
    fallbackToManual: document.getElementById('settingFallbackToManual').checked,
    logBiometricAttempts: document.getElementById('settingLogBiometricAttempts').checked,
    
    // Notifications
    emailNotifications: document.getElementById('settingEmailNotifications').checked,
    smsNotifications: document.getElementById('settingSMSNotifications').checked,
    notifyNewUser: document.getElementById('settingNotifyNewUser').checked,
    notifyFailedLogin: document.getElementById('settingNotifyFailedLogin').checked,
    
    // Maintenance
    logRetention: parseInt(document.getElementById('settingLogRetention').value),
    backupFrequency: document.getElementById('settingBackupFrequency').value,
    maintenanceMode: document.getElementById('settingMaintenanceMode').checked
  };
  
  try {
    const res = await API.post('/settings', settings);
    
    if (res.ok) {
      showSuccess('Settings saved successfully!');
    } else {
      showError('Failed to save settings');
    }
  } catch (error) {
    showError('Error saving settings');
  }
}

async function loadSystemInfo() {
  try {
    const res = await API.get('/system/info');
    
    if (res.ok) {
      const info = res.data;
      document.getElementById('systemUptime').textContent = info.uptime || 'N/A';
      document.getElementById('systemTotalUsers').textContent = info.totalUsers || 0;
      document.getElementById('systemTotalPassengers').textContent = info.totalPassengers || 0;
      document.getElementById('systemTotalTrips').textContent = info.totalTrips || 0;
      document.getElementById('systemDatabaseSize').textContent = info.databaseSize || 'N/A';
    }
  } catch (error) {
    console.error('Error loading system info:', error);
  }
}

function clearCache() {
  if (confirm('Are you sure you want to clear the system cache?')) {
    API.post('/system/clear-cache').then(res => {
      if (res.ok) {
        showSuccess('Cache cleared successfully!');
      } else {
        showError('Failed to clear cache');
      }
    });
  }
}

function runDatabaseBackup() {
  if (confirm('Start database backup now?')) {
    showSuccess('Database backup started. You will be notified when complete.');
    API.post('/system/backup').then(res => {
      if (res.ok) {
        showSuccess('Database backup completed successfully!');
      } else {
        showError('Database backup failed');
      }
    });
  }
}

function viewAuditLogs() {
  alert('Audit logs viewer coming soon...');
  // TODO: Implement audit logs modal
}


// ==================== NOTIFICATIONS ====================

let notificationsLoaded = false;

// Load notifications on page load
document.addEventListener('DOMContentLoaded', () => {
  loadNotifications();
  
  // Refresh notifications every 30 seconds
  setInterval(loadNotifications, 30000);
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    const badge = document.querySelector('.notification-badge');
    
    if (dropdown && !dropdown.contains(e.target) && !badge.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
});

async function loadNotifications() {
  try {
    const res = await API.get('/notifications?limit=10');
    
    if (res.ok) {
      const { notifications, unread_count } = res.data;
      updateNotificationBadge(unread_count);
      
      if (notificationsLoaded) {
        // Only update the list if dropdown is open or this is not the first load
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && dropdown.classList.contains('show')) {
          updateNotificationList(notifications);
        }
      }
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notificationCount');
  if (badge) {
    badge.textContent = count;
    if (count > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById('notificationDropdown');
  
  if (dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  } else {
    dropdown.classList.add('show');
    if (!notificationsLoaded) {
      loadNotificationList();
    }
  }
}

async function loadNotificationList() {
  const list = document.getElementById('notificationList');
  list.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm"></div><p class="text-muted small mt-2">Loading...</p></div>';
  
  try {
    const res = await API.get('/notifications?limit=20');
    
    if (res.ok) {
      const { notifications } = res.data;
      updateNotificationList(notifications);
      notificationsLoaded = true;
    }
  } catch (error) {
    list.innerHTML = '<div class="notification-empty"><i class="bi bi-exclamation-circle"></i><p>Failed to load notifications</p></div>';
  }
}

function updateNotificationList(notifications) {
  const list = document.getElementById('notificationList');
  
  if (!notifications || notifications.length === 0) {
    list.innerHTML = `
      <div class="notification-empty">
        <i class="bi bi-bell-slash"></i>
        <p>No notifications</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = notifications.map(notif => createNotificationItem(notif)).join('');
}

function createNotificationItem(notif) {
  const iconMap = {
    info: 'bi-info-circle',
    success: 'bi-check-circle',
    warning: 'bi-exclamation-triangle',
    error: 'bi-x-circle'
  };
  
  const icon = iconMap[notif.type] || iconMap.info;
  const timeAgo = getTimeAgo(notif.created_at);
  
  return `
    <div class="notification-item ${notif.is_read ? '' : 'unread'}" onclick="handleNotificationClick(${notif.id}, '${notif.link || ''}')">
      <div class="d-flex">
        <div class="notification-icon ${notif.type}">
          <i class="bi ${icon}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-message">${notif.message}</div>
          <div class="notification-time">${timeAgo}</div>
        </div>
      </div>
    </div>
  `;
}

async function handleNotificationClick(notificationId, link) {
  // Mark as read
  await markNotificationAsRead(notificationId);
  
  // Navigate to link if provided
  if (link) {
    window.location.href = link;
  }
}

async function markNotificationAsRead(notificationId) {
  try {
    await API.put(`/notifications/${notificationId}/read`);
    loadNotifications(); // Refresh to update badge
    loadNotificationList(); // Refresh list
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

async function markAllAsRead() {
  try {
    const res = await API.put('/notifications/read-all');
    
    if (res.ok) {
      loadNotifications();
      loadNotificationList();
    }
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
}

function viewAllNotifications() {
  // For now, just show all in the dropdown
  // In the future, could navigate to a dedicated notifications page
  loadNotificationList();
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000); // seconds
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  return time.toLocaleDateString();
}
