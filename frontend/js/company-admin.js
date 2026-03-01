// Company Admin Dashboard JavaScript

const user = Auth.getUser();
if (!user || user.role !== 'company_admin') {
  alert('Access denied. Company Admin only.');
  window.location.href = 'login.html';
}

document.getElementById('userName').textContent = user.full_name;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  loadOverviewData();
  setInterval(refreshData, 30000);
  document.getElementById('randomFp').textContent = Math.random().toString(36).substring(7);
});

function initializeNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      showSection(section);
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });
  
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });
}

function showSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  const section = document.getElementById(`section-${sectionName}`);
  if (section) {
    section.classList.add('active');
    
    switch(sectionName) {
      case 'overview':
        loadOverviewData();
        break;
      case 'staff':
        loadStaff();
        loadStationsForDropdown();
        break;
      case 'stations':
        loadStations();
        loadFilterOptions();
        break;
      case 'vehicles':
        loadVehicles();
        break;
      case 'trips':
        loadTrips();
        break;
    }
  }
}

async function loadOverviewData() {
  try {
    // Load dashboard statistics
    const dashboardRes = await API.get('/dashboard/live');
    if (dashboardRes.ok) {
      const { stats, records } = dashboardRes.data;
      document.getElementById('todayBoardings').textContent = stats.total_scans || 0;
      const approvalRate = stats.total_scans > 0 
        ? Math.round((stats.approved / stats.total_scans) * 100) 
        : 0;
      document.getElementById('approvalRate').textContent = approvalRate;
      updateRecentActivity(records);
    }
    
    // Load active trips
    const tripsRes = await API.get('/trips/live-trips');
    if (tripsRes.ok) {
      const trips = tripsRes.data;
      document.getElementById('activeTrips').textContent = trips.length;
      updateActiveTrips(trips);
    }
    
    // Load staff count
    const staffRes = await API.get('/users?limit=1');
    if (staffRes.ok) {
      document.getElementById('totalStaff').textContent = staffRes.data.pagination.total;
    }
    
    // Load vehicles count
    const vehiclesRes = await API.get('/vehicles?limit=1');
    if (vehiclesRes.ok) {
      const total = vehiclesRes.data.pagination.total;
      document.getElementById('totalVehicles').textContent = total;
      document.getElementById('activeVehicles').textContent = total; // Assuming all are active
    }
  } catch (error) {
    console.error('Error loading overview:', error);
  }
}

function updateRecentActivity(records) {
  const tbody = document.getElementById('recentActivity');
  
  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No recent activity</td></tr>';
    return;
  }
  
  tbody.innerHTML = records.slice(0, 10).map(record => `
    <tr>
      <td>${formatDateTime(record.boarding_time)}</td>
      <td>${record.passenger_name || 'Unknown'}</td>
      <td>${record.plate_number || 'N/A'}</td>
      <td>
        <span class="badge bg-${record.verification_status === 'verified' ? 'success' : 'danger'}">
          ${record.verification_status === 'verified' ? 'Approved' : 'Denied'}
        </span>
      </td>
    </tr>
  `).join('');
}

function updateActiveTrips(trips) {
  const container = document.getElementById('activeTripsContainer');
  
  if (!container) return;
  
  if (!trips || trips.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <i class="bi bi-bus-front fs-1 text-muted"></i>
        <p class="text-muted mt-3">No active trips at the moment</p>
        <button class="btn btn-primary" onclick="showSection('trips'); showCreateTripModal();">
          <i class="bi bi-plus-circle"></i> Schedule a Trip
        </button>
      </div>
    `;
    return;
  }
  
  // Show only first 3 trips in overview
  const displayTrips = trips.slice(0, 3);
  
  container.innerHTML = displayTrips.map(trip => {
    const occupancy = trip.capacity > 0 ? Math.round((trip.passengers_boarded / trip.capacity) * 100) : 0;
    const statusColors = {
      scheduled: 'primary',
      departed: 'success',
      arrived: 'secondary',
      cancelled: 'danger'
    };
    
    return `
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="mb-0">${trip.plate_number}</h6>
              <span class="badge bg-${statusColors[trip.status]}">${trip.status.toUpperCase()}</span>
            </div>
            <p class="text-muted small mb-2">${trip.route_name}</p>
            <p class="small mb-2">
              <i class="bi bi-geo-alt"></i> ${trip.origin_station} → ${trip.destination_station}
            </p>
            <div class="progress mb-2" style="height: 6px;">
              <div class="progress-bar ${occupancy > 80 ? 'bg-danger' : 'bg-success'}" 
                   style="width: ${occupancy}%"></div>
            </div>
            <small class="text-muted">${trip.passengers_boarded}/${trip.capacity} passengers</small>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add "View All" message if there are more trips
  if (trips.length > 3) {
    container.innerHTML += `
      <div class="col-12 text-center mt-3">
        <button class="btn btn-outline-primary btn-sm" onclick="showSection('trips')">
          View All ${trips.length} Trips <i class="bi bi-arrow-right"></i>
        </button>
      </div>
    `;
  }
}
    <tr>
      <td>${formatTime(record.scan_time)}</td>
      <td>${record.full_name}</td>
      <td>-</td>
      <td>
        <span class="badge bg-${record.status === 'approved' ? 'success' : 'danger'}">
          ${record.status.toUpperCase()}
        </span>
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

// Staff Management
async function loadStaff(page = 1) {
  const role = document.getElementById('filterStaffRole')?.value || '';
  const search = document.getElementById('searchStaff')?.value || '';
  
  try {
    let url = `/users?page=${page}&limit=20`;
    if (role) url += `&role=${role}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const res = await API.get(url);
    if (res.ok) {
      const { users, pagination } = res.data;
      updateStaffTable(users);
      updatePagination(pagination);
    }
  } catch (error) {
    console.error('Error loading staff:', error);
  }
}

function updateStaffTable(staff) {
  const tbody = document.getElementById('staffTableBody');
  if (!staff || staff.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No staff found</td></tr>';
    return;
  }
  
  tbody.innerHTML = staff.map(member => `
    <tr>
      <td>${member.full_name}</td>
      <td>${member.email}</td>
      <td><span class="badge bg-primary">${member.role.replace('_', ' ').toUpperCase()}</span></td>
      <td>${member.station_id || '-'}</td>
      <td>
        <span class="badge bg-${member.is_active ? 'success' : 'danger'}">
          ${member.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="editStaff(${member.id})" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-warning" onclick="resetPassword(${member.id})" title="Reset Password">
            <i class="bi bi-key"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteStaff(${member.id}, '${member.full_name}')" title="Deactivate">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updatePagination(pagination) {
  const container = document.getElementById('staffPagination');
  if (!container) return;
  
  const { page, pages, total } = pagination;
  let html = `<div class="text-muted">Showing page ${page} of ${pages} (${total} total)</div>`;
  
  if (pages > 1) {
    html += '<div class="btn-group">';
    if (page > 1) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadStaff(${page - 1})">Previous</button>`;
    }
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      html += `<button class="btn btn-sm btn-${i === page ? 'primary' : 'outline-primary'}" onclick="loadStaff(${i})">${i}</button>`;
    }
    if (page < pages) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadStaff(${page + 1})">Next</button>`;
    }
    html += '</div>';
  }
  
  container.innerHTML = html;
}

function filterStaff() {
  loadStaff(1);
}

function showCreateStaffModal() {
  const modal = new bootstrap.Modal(document.getElementById('createStaffModal'));
  document.getElementById('createStaffForm').reset();
  document.getElementById('createStaffError').classList.add('d-none');
  document.getElementById('randomFp').textContent = Math.random().toString(36).substring(7);
  modal.show();
}

async function createStaff() {
  const form = document.getElementById('createStaffForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const errorDiv = document.getElementById('createStaffError');
  
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
      bootstrap.Modal.getInstance(document.getElementById('createStaffModal')).hide();
      alert('✓ Staff member added successfully!');
      loadStaff();
    } else {
      let errorMessage = res.data.message || 'Failed to create staff member';
      
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

async function editStaff(id) {
  alert('Edit staff #' + id);
}

async function deleteStaff(id, name) {
  if (!confirm(`Deactivate ${name}?`)) return;
  
  try {
    const res = await API.delete(`/users/${id}`);
    if (res.ok) {
      alert('✓ Staff member deactivated');
      loadStaff();
    } else {
      alert('✗ ' + (res.data.message || 'Failed to deactivate'));
    }
  } catch (error) {
    alert('✗ Error deactivating staff member');
  }
}

async function resetPassword(id) {
  const newPassword = prompt('Enter new password (min 8 characters):');
  if (!newPassword || newPassword.length < 8) {
    alert('Password must be at least 8 characters');
    return;
  }
  
  try {
    const res = await API.post(`/users/${id}/reset-password`, { new_password: newPassword });
    if (res.ok) {
      alert('✓ Password reset successfully!');
    } else {
      alert('✗ ' + (res.data.message || 'Failed to reset password'));
    }
  } catch (error) {
    alert('✗ Error resetting password');
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
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

// ==================== STATION MANAGEMENT ====================

async function loadStations(page = 1) {
  const city = document.getElementById('filterCity')?.value || '';
  const region = document.getElementById('filterRegion')?.value || '';
  const search = document.getElementById('searchStations')?.value || '';
  
  try {
    let url = `/stations?page=${page}&limit=20`;
    if (city) url += `&city=${encodeURIComponent(city)}`;
    if (region) url += `&region=${encodeURIComponent(region)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const res = await API.get(url);
    if (res.ok) {
      const { stations, pagination } = res.data;
      updateStationsGrid(stations);
    }
  } catch (error) {
    console.error('Error loading stations:', error);
  }
}

function updateStationsGrid(stations) {
  const container = document.getElementById('stationsContainer');
  
  if (!stations || stations.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-geo-alt fs-1 text-muted"></i>
        <p class="text-muted mt-3">No stations found</p>
        <button class="btn btn-primary" onclick="showCreateStationModal()">
          <i class="bi bi-plus-circle"></i> Add First Station
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = stations.map(station => `
    <div class="col-md-6 col-lg-4">
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="mb-1"><i class="bi bi-geo-alt-fill text-primary"></i> ${station.name}</h5>
              <p class="text-muted small mb-0">${station.location}</p>
            </div>
            <span class="badge bg-${station.is_active ? 'success' : 'danger'}">
              ${station.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div class="mb-3">
            ${station.city ? `<div class="text-sm"><i class="bi bi-building"></i> ${station.city}</div>` : ''}
            ${station.region ? `<div class="text-sm"><i class="bi bi-map"></i> ${station.region}</div>` : ''}
            <div class="text-sm"><i class="bi bi-people"></i> ${station.assigned_officers} officers assigned</div>
          </div>
          
          <div class="btn-group w-100">
            <button class="btn btn-sm btn-outline-primary" onclick="viewStation(${station.id})">
              <i class="bi bi-eye"></i> View
            </button>
            <button class="btn btn-sm btn-outline-warning" onclick="editStation(${station.id})">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteStation(${station.id}, '${station.name}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadFilterOptions() {
  try {
    const citiesRes = await API.get('/stations/meta/cities');
    if (citiesRes.ok) {
      const citySelect = document.getElementById('filterCity');
      citySelect.innerHTML = '<option value="">All Cities</option>' +
        citiesRes.data.map(city => `<option value="${city}">${city}</option>`).join('');
    }
    
    const regionsRes = await API.get('/stations/meta/regions');
    if (regionsRes.ok) {
      const regionSelect = document.getElementById('filterRegion');
      regionSelect.innerHTML = '<option value="">All Regions</option>' +
        regionsRes.data.map(region => `<option value="${region}">${region}</option>`).join('');
    }
  } catch (error) {
    console.error('Error loading filter options:', error);
  }
}

async function loadStationsForDropdown() {
  try {
    const res = await API.get('/stations?limit=100&is_active=true');
    if (res.ok) {
      const select = document.getElementById('staffStationSelect');
      if (select) {
        select.innerHTML = '<option value="">No Station (Optional)</option>' +
          res.data.stations.map(s => `<option value="${s.id}">${s.name} - ${s.location}</option>`).join('');
      }
    }
  } catch (error) {
    console.error('Error loading stations for dropdown:', error);
  }
}

function filterStations() {
  loadStations(1);
}

function showCreateStationModal() {
  const modal = new bootstrap.Modal(document.getElementById('createStationModal'));
  document.getElementById('createStationForm').reset();
  document.getElementById('createStationError').classList.add('d-none');
  modal.show();
}

async function createStation() {
  const form = document.getElementById('createStationForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const errorDiv = document.getElementById('createStationError');
  
  errorDiv.classList.add('d-none');
  
  // Client-side validation
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Station name must be at least 2 characters');
  }
  
  if (!data.location || data.location.trim().length < 2) {
    errors.push('Location must be at least 2 characters');
  }
  
  if (data.latitude && (isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }
  
  if (data.longitude && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }
  
  if (errors.length > 0) {
    errorDiv.innerHTML = '<strong>Please fix the following:</strong><ul class="mb-0 mt-2">' + 
      errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  try {
    const res = await API.post('/stations', data);
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('createStationModal')).hide();
      alert('✓ Station created successfully!');
      loadStations();
      loadFilterOptions();
    } else {
      let errorMessage = res.data.message || 'Failed to create station';
      
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

async function viewStation(id) {
  try {
    const res = await API.get(`/stations/${id}`);
    if (res.ok) {
      const station = res.data;
      let info = `Station: ${station.name}\n`;
      info += `Location: ${station.location}\n`;
      if (station.city) info += `City: ${station.city}\n`;
      if (station.region) info += `Region: ${station.region}\n`;
      info += `Status: ${station.is_active ? 'Active' : 'Inactive'}\n`;
      info += `Assigned Officers: ${station.assigned_officers}\n\n`;
      
      if (station.officers && station.officers.length > 0) {
        info += 'Officers:\n';
        station.officers.forEach(o => {
          info += `- ${o.full_name} (${o.role})\n`;
        });
      }
      
      alert(info);
    }
  } catch (error) {
    alert('Error loading station details');
  }
}

async function editStation(id) {
  try {
    const res = await API.get(`/stations/${id}`);
    if (res.ok) {
      const station = res.data;
      document.getElementById('editStationId').value = station.id;
      document.getElementById('editStationName').value = station.name;
      document.getElementById('editStationLocation').value = station.location;
      document.getElementById('editStationCity').value = station.city || '';
      document.getElementById('editStationRegion').value = station.region || '';
      document.getElementById('editStationStatus').value = station.is_active ? '1' : '0';
      
      const modal = new bootstrap.Modal(document.getElementById('editStationModal'));
      modal.show();
    }
  } catch (error) {
    alert('Error loading station details');
  }
}

async function updateStation() {
  const id = document.getElementById('editStationId').value;
  const data = {
    name: document.getElementById('editStationName').value,
    location: document.getElementById('editStationLocation').value,
    city: document.getElementById('editStationCity').value,
    region: document.getElementById('editStationRegion').value,
    is_active: document.getElementById('editStationStatus').value === '1'
  };
  const errorDiv = document.getElementById('editStationError');
  
  errorDiv.classList.add('d-none');
  
  // Client-side validation
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Station name must be at least 2 characters');
  }
  
  if (!data.location || data.location.trim().length < 2) {
    errors.push('Location must be at least 2 characters');
  }
  
  if (errors.length > 0) {
    errorDiv.innerHTML = '<strong>Please fix the following:</strong><ul class="mb-0 mt-2">' + 
      errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  try {
    const res = await API.put(`/stations/${id}`, data);
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('editStationModal')).hide();
      alert('✓ Station updated successfully!');
      loadStations();
    } else {
      let errorMessage = res.data.message || 'Failed to update station';
      
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

async function deleteStation(id, name) {
  if (!confirm(`Deactivate ${name}?\n\nNote: You cannot delete stations with assigned officers.`)) {
    return;
  }
  
  try {
    const res = await API.delete(`/stations/${id}`);
    if (res.ok) {
      alert('✓ Station deactivated successfully!');
      loadStations();
    } else {
      alert('✗ ' + (res.data.message || 'Failed to deactivate station'));
    }
  } catch (error) {
    alert('✗ Error deactivating station');
  }
}


// ==================== VEHICLE MANAGEMENT ====================

async function loadVehicles(page = 1) {
  const search = document.getElementById('searchVehicles')?.value || '';
  const company = document.getElementById('filterVehicleCompany')?.value || '';
  
  try {
    let url = `/vehicles?page=${page}&limit=20`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (company) url += `&company=${encodeURIComponent(company)}`;
    
    const res = await API.get(url);
    if (res.ok) {
      const { vehicles, pagination } = res.data;
      updateVehiclesGrid(vehicles);
      updateVehiclesPagination(pagination);
      loadCompanyFilterOptions(vehicles);
    }
  } catch (error) {
    console.error('Error loading vehicles:', error);
    showVehicleError('Failed to load vehicles');
  }
}

function updateVehiclesGrid(vehicles) {
  const container = document.getElementById('vehiclesContainer');
  
  if (!vehicles || vehicles.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-bus-front fs-1 text-muted"></i>
        <p class="text-muted mt-3">No vehicles found</p>
        <button class="btn btn-primary" onclick="showCreateVehicleModal()">
          <i class="bi bi-plus-circle"></i> Add First Vehicle
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = vehicles.map(vehicle => `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="mb-1">
                <i class="bi bi-bus-front text-primary"></i> ${vehicle.plate_number}
              </h5>
              <p class="text-muted small mb-0">${vehicle.company_name}</p>
            </div>
            <span class="badge bg-success">Active</span>
          </div>
          
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-sm"><i class="bi bi-people"></i> Capacity:</span>
              <strong>${vehicle.capacity} seats</strong>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-sm"><i class="bi bi-calendar"></i> Added:</span>
              <span class="text-sm">${formatDate(vehicle.created_at)}</span>
            </div>
          </div>
          
          <div class="btn-group w-100">
            <button class="btn btn-sm btn-outline-primary" onclick="viewVehicle(${vehicle.id})" title="View Details">
              <i class="bi bi-eye"></i> View
            </button>
            <button class="btn btn-sm btn-outline-warning" onclick="editVehicle(${vehicle.id})" title="Edit">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteVehicle(${vehicle.id}, '${vehicle.plate_number}')" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function updateVehiclesPagination(pagination) {
  const container = document.getElementById('vehiclesPagination');
  if (!container) return;
  
  const { page, pages, total } = pagination;
  
  let html = `<div class="text-muted">Showing page ${page} of ${pages} (${total} total vehicles)</div>`;
  
  if (pages > 1) {
    html += '<div class="btn-group">';
    
    if (page > 1) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadVehicles(${page - 1})">
        <i class="bi bi-chevron-left"></i> Previous
      </button>`;
    }
    
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      html += `<button class="btn btn-sm btn-${i === page ? 'primary' : 'outline-primary'}" onclick="loadVehicles(${i})">${i}</button>`;
    }
    
    if (page < pages) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadVehicles(${page + 1})">
        Next <i class="bi bi-chevron-right"></i>
      </button>`;
    }
    
    html += '</div>';
  }
  
  container.innerHTML = html;
}

function loadCompanyFilterOptions(vehicles) {
  const select = document.getElementById('filterVehicleCompany');
  if (!select) return;
  
  const companies = [...new Set(vehicles.map(v => v.company_name))];
  const currentValue = select.value;
  
  select.innerHTML = '<option value="">All Companies</option>' +
    companies.map(company => `<option value="${company}">${company}</option>`).join('');
  
  select.value = currentValue;
}

function filterVehicles() {
  loadVehicles(1);
}

function showCreateVehicleModal() {
  const modal = new bootstrap.Modal(document.getElementById('createVehicleModal'));
  document.getElementById('createVehicleForm').reset();
  document.getElementById('createVehicleError').classList.add('d-none');
  modal.show();
}

async function createVehicle() {
  const form = document.getElementById('createVehicleForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const errorDiv = document.getElementById('createVehicleError');
  
  errorDiv.classList.add('d-none');
  
  // Client-side validation
  const errors = [];
  
  if (!data.plate_number || data.plate_number.trim().length < 3) {
    errors.push('Plate number must be at least 3 characters');
  }
  
  if (!data.company_name || data.company_name.trim().length < 2) {
    errors.push('Company name must be at least 2 characters');
  }
  
  if (!data.capacity || data.capacity < 1 || data.capacity > 200) {
    errors.push('Capacity must be between 1 and 200');
  }
  
  if (errors.length > 0) {
    errorDiv.innerHTML = '<strong>Please fix the following:</strong><ul class="mb-0 mt-2">' + 
      errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  try {
    const res = await API.post('/vehicles', data);
    
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('createVehicleModal')).hide();
      alert('✓ Vehicle added successfully!');
      loadVehicles();
    } else {
      let errorMessage = res.data.message || 'Failed to add vehicle';
      
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

async function viewVehicle(id) {
  try {
    const res = await API.get(`/vehicles/${id}`);
    if (res.ok) {
      const vehicle = res.data;
      let info = `Vehicle Details\n\n`;
      info += `Plate Number: ${vehicle.plate_number}\n`;
      info += `Company: ${vehicle.company_name}\n`;
      info += `Capacity: ${vehicle.capacity} seats\n`;
      info += `Added: ${formatDate(vehicle.created_at)}\n`;
      
      alert(info);
    }
  } catch (error) {
    alert('Error loading vehicle details');
  }
}

async function editVehicle(id) {
  try {
    const res = await API.get(`/vehicles/${id}`);
    if (res.ok) {
      const vehicle = res.data;
      document.getElementById('editVehicleId').value = vehicle.id;
      document.getElementById('editVehiclePlateNumber').value = vehicle.plate_number;
      document.getElementById('editVehicleCompanyName').value = vehicle.company_name;
      document.getElementById('editVehicleCapacity').value = vehicle.capacity;
      document.getElementById('editVehicleError').classList.add('d-none');
      
      const modal = new bootstrap.Modal(document.getElementById('editVehicleModal'));
      modal.show();
    }
  } catch (error) {
    alert('Error loading vehicle details');
  }
}

async function updateVehicle() {
  const id = document.getElementById('editVehicleId').value;
  const data = {
    plate_number: document.getElementById('editVehiclePlateNumber').value,
    company_name: document.getElementById('editVehicleCompanyName').value,
    capacity: parseInt(document.getElementById('editVehicleCapacity').value)
  };
  const errorDiv = document.getElementById('editVehicleError');
  
  errorDiv.classList.add('d-none');
  
  // Client-side validation
  const errors = [];
  
  if (!data.plate_number || data.plate_number.trim().length < 3) {
    errors.push('Plate number must be at least 3 characters');
  }
  
  if (!data.company_name || data.company_name.trim().length < 2) {
    errors.push('Company name must be at least 2 characters');
  }
  
  if (!data.capacity || data.capacity < 1 || data.capacity > 200) {
    errors.push('Capacity must be between 1 and 200');
  }
  
  if (errors.length > 0) {
    errorDiv.innerHTML = '<strong>Please fix the following:</strong><ul class="mb-0 mt-2">' + 
      errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  try {
    const res = await API.put(`/vehicles/${id}`, data);
    
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('editVehicleModal')).hide();
      alert('✓ Vehicle updated successfully!');
      loadVehicles();
    } else {
      let errorMessage = res.data.message || 'Failed to update vehicle';
      
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

async function deleteVehicle(id, plateNumber) {
  if (!confirm(`Are you sure you want to delete vehicle ${plateNumber}?\n\nThis action cannot be undone.`)) {
    return;
  }
  
  try {
    const res = await API.delete(`/vehicles/${id}`);
    
    if (res.ok) {
      alert('✓ Vehicle deleted successfully!');
      loadVehicles();
    } else {
      alert('✗ ' + (res.data.message || 'Failed to delete vehicle'));
    }
  } catch (error) {
    alert('✗ Error deleting vehicle');
  }
}

function showVehicleError(message) {
  const container = document.getElementById('vehiclesContainer');
  container.innerHTML = `
    <div class="col-12">
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> ${message}
      </div>
    </div>
  `;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}


// ==================== TRIP MANAGEMENT ====================

async function loadTrips(page = 1) {
  const status = document.getElementById('filterTripStatus')?.value || '';
  const date = document.getElementById('filterTripDate')?.value || '';
  
  try {
    let url = `/trips?page=${page}&limit=20`;
    if (status) url += `&status=${status}`;
    
    const res = await API.get(url);
    if (res.ok) {
      const { trips, pagination } = res.data;
      updateTripsGrid(trips);
      updateTripsPagination(pagination);
    }
  } catch (error) {
    console.error('Error loading trips:', error);
    showTripError('Failed to load trips');
  }
}

function updateTripsGrid(trips) {
  const container = document.getElementById('tripsContainer');
  
  if (!container) return;
  
  if (!trips || trips.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-bus-front fs-1 text-muted"></i>
        <p class="text-muted mt-3">No trips found</p>
        <button class="btn btn-primary" onclick="showCreateTripModal()">
          <i class="bi bi-plus-circle"></i> Schedule First Trip
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = trips.map(trip => {
    const statusColors = {
      scheduled: 'primary',
      departed: 'success',
      arrived: 'secondary',
      cancelled: 'danger'
    };
    
    const departureDate = new Date(trip.departure_time);
    const isUpcoming = departureDate > new Date();
    const occupancy = trip.capacity > 0 ? Math.round((trip.passengers_boarded / trip.capacity) * 100) : 0;
    
    return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 class="mb-1">
                  <i class="bi bi-bus-front text-primary"></i> ${trip.plate_number}
                </h5>
                <p class="text-muted small mb-0">${trip.company_name}</p>
              </div>
              <span class="badge bg-${statusColors[trip.status]}">${trip.status.toUpperCase()}</span>
            </div>
            
            <div class="mb-3">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-geo-alt text-success me-2"></i>
                <strong>${trip.origin_station}</strong>
              </div>
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-arrow-down me-2"></i>
                <span class="text-muted">${trip.route_name}</span>
              </div>
              <div class="d-flex align-items-center">
                <i class="bi bi-geo-alt-fill text-danger me-2"></i>
                <strong>${trip.destination_station}</strong>
              </div>
            </div>
            
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm"><i class="bi bi-calendar"></i> Departure:</span>
                <strong>${formatDateTime(trip.departure_time)}</strong>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm"><i class="bi bi-people"></i> Passengers:</span>
                <strong>${trip.passengers_boarded} / ${trip.capacity}</strong>
              </div>
              <div class="progress" style="height: 8px;">
                <div class="progress-bar ${occupancy > 80 ? 'bg-danger' : 'bg-success'}" 
                     style="width: ${occupancy}%"></div>
              </div>
              <small class="text-muted">${occupancy}% occupied</small>
            </div>
            
            <div class="btn-group w-100">
              <button class="btn btn-sm btn-outline-primary" onclick="viewTripDetails(${trip.id})" title="View Details">
                <i class="bi bi-eye"></i>
              </button>
              ${trip.status === 'scheduled' && isUpcoming ? `
                <button class="btn btn-sm btn-outline-success" onclick="updateTripStatus(${trip.id}, 'departed')" title="Mark as Departed">
                  <i class="bi bi-play-circle"></i>
                </button>
              ` : ''}
              ${trip.status === 'departed' ? `
                <button class="btn btn-sm btn-outline-secondary" onclick="updateTripStatus(${trip.id}, 'arrived')" title="Mark as Arrived">
                  <i class="bi bi-check-circle"></i>
                </button>
              ` : ''}
              ${trip.status === 'scheduled' ? `
                <button class="btn btn-sm btn-outline-danger" onclick="updateTripStatus(${trip.id}, 'cancelled')" title="Cancel Trip">
                  <i class="bi bi-x-circle"></i>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateTripsPagination(pagination) {
  const container = document.getElementById('tripsPagination');
  if (!container) return;
  
  const { page, pages, total } = pagination;
  
  let html = `<div class="text-muted">Showing page ${page} of ${pages} (${total} total trips)</div>`;
  
  if (pages > 1) {
    html += '<div class="btn-group">';
    
    if (page > 1) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadTrips(${page - 1})">
        <i class="bi bi-chevron-left"></i> Previous
      </button>`;
    }
    
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      html += `<button class="btn btn-sm btn-${i === page ? 'primary' : 'outline-primary'}" onclick="loadTrips(${i})">${i}</button>`;
    }
    
    if (page < pages) {
      html += `<button class="btn btn-sm btn-outline-primary" onclick="loadTrips(${page + 1})">
        Next <i class="bi bi-chevron-right"></i>
      </button>`;
    }
    
    html += '</div>';
  }
  
  container.innerHTML = html;
}

function filterTrips() {
  loadTrips(1);
}

function clearTripFilters() {
  document.getElementById('filterTripStatus').value = '';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filterTripDate').value = today;
  loadTrips(1);
}

function showCreateTripModal() {
  const modal = new bootstrap.Modal(document.getElementById('createTripModal'));
  document.getElementById('createTripForm').reset();
  document.getElementById('createTripError').classList.add('d-none');
  
  const now = new Date();
  document.getElementById('tripDepartureDate').value = now.toISOString().split('T')[0];
  document.getElementById('tripDepartureTime').value = now.toTimeString().slice(0, 5);
  
  loadStationsForTripDropdowns();
  loadVehiclesForTripDropdown();
  
  modal.show();
}

async function loadStationsForTripDropdowns() {
  try {
    const res = await API.get('/stations?limit=100&is_active=true');
    if (res.ok) {
      const stations = res.data.stations;
      
      const originSelect = document.getElementById('tripOriginStation');
      const destSelect = document.getElementById('tripDestinationStation');
      
      if (originSelect) {
        originSelect.innerHTML = '<option value="">Select origin station...</option>' +
          stations.map(s => `<option value="${s.id}">${s.name} - ${s.location}</option>`).join('');
      }
      
      if (destSelect) {
        destSelect.innerHTML = '<option value="">Select destination...</option>' +
          stations.map(s => `<option value="${s.id}">${s.name} - ${s.location}</option>`).join('');
      }
    }
  } catch (error) {
    console.error('Error loading stations:', error);
  }
}

async function loadVehiclesForTripDropdown() {
  try {
    const res = await API.get('/vehicles?limit=100');
    if (res.ok) {
      const vehicles = res.data.vehicles;
      const vehicleSelect = document.getElementById('tripVehicle');
      
      if (vehicleSelect) {
        vehicleSelect.innerHTML = '<option value="">Select vehicle...</option>' +
          vehicles.map(v => `<option value="${v.id}" data-capacity="${v.capacity}">${v.plate_number} - ${v.company_name} (${v.capacity} seats)</option>`).join('');
        
        vehicleSelect.addEventListener('change', (e) => {
          const selectedOption = e.target.options[e.target.selectedIndex];
          const capacity = selectedOption.getAttribute('data-capacity');
          const infoDiv = document.getElementById('vehicleCapacityInfo');
          if (capacity) {
            infoDiv.textContent = `Vehicle capacity: ${capacity} passengers`;
            infoDiv.classList.add('text-success');
          } else {
            infoDiv.textContent = '';
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading vehicles:', error);
  }
}

async function createTrip() {
  const errorDiv = document.getElementById('createTripError');
  errorDiv.classList.add('d-none');
  
  const originStationId = document.getElementById('tripOriginStation').value;
  const destinationStationId = document.getElementById('tripDestinationStation').value;
  const vehicleId = document.getElementById('tripVehicle').value;
  const departureDate = document.getElementById('tripDepartureDate').value;
  const departureTime = document.getElementById('tripDepartureTime').value;
  
  const errors = [];
  
  if (!originStationId) errors.push('Please select origin station');
  if (!destinationStationId) errors.push('Please select destination station');
  if (originStationId === destinationStationId) errors.push('Origin and destination cannot be the same');
  if (!vehicleId) errors.push('Please select a vehicle');
  if (!departureDate) errors.push('Please select departure date');
  if (!departureTime) errors.push('Please select departure time');
  
  if (errors.length > 0) {
    errorDiv.innerHTML = '<strong>Please fix the following:</strong><ul class="mb-0 mt-2">' + 
      errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  const departureDateTime = `${departureDate} ${departureTime}:00`;
  
  const data = {
    origin_station_id: parseInt(originStationId),
    destination_station_id: parseInt(destinationStationId),
    vehicle_id: parseInt(vehicleId),
    departure_time: departureDateTime
  };
  
  try {
    const res = await API.post('/trips', data);
    
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('createTripModal')).hide();
      alert('✓ Trip scheduled successfully!');
      loadTrips();
    } else {
      let errorMessage = res.data.message || 'Failed to schedule trip';
      
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

async function viewTripDetails(tripId) {
  try {
    const res = await API.get(`/trips/${tripId}`);
    if (res.ok) {
      const trip = res.data;
      showTripDetailsModal(trip);
    }
  } catch (error) {
    alert('Error loading trip details');
  }
}

function showTripDetailsModal(trip) {
  const statusColors = {
    scheduled: 'primary',
    departed: 'success',
    arrived: 'secondary',
    cancelled: 'danger'
  };
  
  const occupancy = Math.round((trip.passengers_boarded / trip.capacity) * 100);
  
  const modalHtml = `
    <div class="modal fade" id="viewTripModal" tabindex="-1">
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
                  <tr><td><strong>Vehicle:</strong></td><td>${trip.plate_number} (${trip.company_name})</td></tr>
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
              </div>
            </div>
            <hr>
            <div class="row">
              <div class="col-md-6">
                <h6 class="text-muted mb-3">Passenger Statistics</h6>
                <table class="table table-sm">
                  <tr><td><strong>Tickets Sold:</strong></td><td>${trip.tickets_sold || 0}</td></tr>
                  <tr><td><strong>Passengers Boarded:</strong></td><td>${trip.passengers_boarded}</td></tr>
                  <tr><td><strong>Available Seats:</strong></td><td>${trip.capacity - trip.passengers_boarded}</td></tr>
                </table>
              </div>
              <div class="col-md-6">
                <h6 class="text-muted mb-3">Occupancy</h6>
                <div class="progress" style="height: 30px;">
                  <div class="progress-bar ${occupancy > 80 ? 'bg-danger' : 'bg-success'}" 
                       style="width: ${occupancy}%">
                    ${occupancy}%
                  </div>
                </div>
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
  
  const existingModal = document.getElementById('viewTripModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = new bootstrap.Modal(document.getElementById('viewTripModal'));
  modal.show();
}

async function updateTripStatus(tripId, newStatus) {
  const statusMessages = {
    departed: 'Mark this trip as departed?',
    arrived: 'Mark this trip as arrived?',
    cancelled: 'Cancel this trip? This action cannot be undone.'
  };
  
  if (!confirm(statusMessages[newStatus])) {
    return;
  }
  
  try {
    const res = await API.patch(`/trips/${tripId}/status`, { status: newStatus });
    
    if (res.ok) {
      alert(`✓ Trip status updated to ${newStatus}!`);
      loadTrips();
    } else {
      alert('✗ ' + (res.data.message || 'Failed to update trip status'));
    }
  } catch (error) {
    alert('✗ Error updating trip status');
  }
}

function showTripError(message) {
  const container = document.getElementById('tripsContainer');
  if (container) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i> ${message}
        </div>
      </div>
    `;
  }
}
