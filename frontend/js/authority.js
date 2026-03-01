// Authority Dashboard JavaScript

const user = Auth.getUser();
if (!user || user.role !== 'authority') {
  alert('Access denied. Authority only.');
  window.location.href = 'login.html';
}

document.getElementById('userName').textContent = user.full_name;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  loadDashboardData();
  setInterval(loadDashboardData, 30000);
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
        loadDashboardData();
        break;
      case 'trips':
        loadAllTrips();
        break;
      case 'passengers':
        loadPassengers();
        break;
      case 'reports':
        loadReports();
        break;
    }
  }
}

async function loadDashboardData() {
  try {
    const dashboardRes = await API.get('/dashboard/live');
    if (dashboardRes.ok) {
      const { stats, records } = dashboardRes.data;
      document.getElementById('todayScans').textContent = stats.total_scans || 0;
      document.getElementById('approvedScans').textContent = stats.approved || 0;
      document.getElementById('deniedScans').textContent = stats.denied || 0;
      updateRecentActivity(records);
    }
    
    const tripsRes = await API.get('/trips/live-trips');
    if (tripsRes.ok) {
      const trips = tripsRes.data;
      document.getElementById('activeTrips').textContent = trips.length;
      updateActiveTrips(trips);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function updateActiveTrips(trips) {
  const container = document.getElementById('activeTripsContainer');
  
  if (!trips || trips.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <i class="bi bi-bus-front fs-1 text-muted"></i>
        <p class="text-muted mt-3">No active trips</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = trips.map(trip => {
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
            
            <button class="btn btn-sm btn-outline-primary w-100" onclick="viewTripDetails(${trip.id})">
              <i class="bi bi-eye"></i> View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateRecentActivity(records) {
  const tbody = document.getElementById('recentActivity');
  
  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No recent activity</td></tr>';
    return;
  }
  
  tbody.innerHTML = records.slice(0, 10).map(record => `
    <tr>
      <td>${formatDateTime(record.boarding_time)}</td>
      <td>${record.passenger_name}</td>
      <td>${record.seat_number || 'N/A'}</td>
      <td><span class="badge bg-${record.verification_status === 'verified' ? 'success' : 'danger'}">${record.verification_status}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="viewBoardingDetails(${record.id})">
          <i class="bi bi-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ==================== ALL TRIPS ====================

async function loadAllTrips(page = 1) {
  const container = document.querySelector('#section-trips .card-body');
  if (!container) return;
  
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
  
  try {
    const res = await API.get(`/trips?page=${page}&limit=20`);
    if (res.ok) {
      displayAllTrips(res.data.trips, res.data.pagination);
    }
  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> Error loading trips
      </div>
    `;
  }
}

function displayAllTrips(trips, pagination) {
  const section = document.getElementById('section-trips');
  const existingCard = section.querySelector('.card');
  
  if (existingCard) {
    existingCard.remove();
  }
  
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5><i class="bi bi-bus-front"></i> All Trips</h5>
      <div>
        <select class="form-select form-select-sm d-inline-block w-auto me-2" id="filterTripStatus" onchange="filterTrips()">
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
      <div class="row g-3" id="allTripsContainer">
        ${trips.map(trip => createTripCard(trip)).join('')}
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
    </div>
  `;
  
  section.querySelector('.section-header').after(card);
}

function createTripCard(trip) {
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
          
          <button class="btn btn-sm btn-outline-primary w-100" onclick="viewTripDetails(${trip.id})">
            <i class="bi bi-eye"></i> View Details
          </button>
        </div>
      </div>
    </div>
  `;
}

async function filterTrips() {
  const status = document.getElementById('filterTripStatus')?.value || '';
  const container = document.getElementById('allTripsContainer');
  
  container.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border"></div></div>';
  
  try {
    let url = '/trips?limit=20';
    if (status) url += `&status=${status}`;
    
    const res = await API.get(url);
    if (res.ok) {
      container.innerHTML = res.data.trips.map(trip => createTripCard(trip)).join('');
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
  const occupancy = Math.round((trip.passengers_boarded / trip.capacity) * 100);
  const statusColors = {
    scheduled: 'primary',
    departed: 'success',
    arrived: 'secondary',
    cancelled: 'danger'
  };
  
  const modalHtml = `
    <div class="modal fade" id="tripDetailsModal" tabindex="-1">
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
  
  const existingModal = document.getElementById('tripDetailsModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = new bootstrap.Modal(document.getElementById('tripDetailsModal'));
  modal.show();
}

// ==================== PASSENGERS ====================

async function loadPassengers() {
  const container = document.querySelector('#section-passengers');
  const existingCard = container.querySelector('.card');
  
  if (existingCard) {
    existingCard.remove();
  }
  
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-header">
      <h5><i class="bi bi-person-badge"></i> Registered Passengers</h5>
    </div>
    <div class="card-body">
      <div class="text-center py-4">
        <div class="spinner-border"></div>
        <p class="text-muted mt-2">Loading passengers...</p>
      </div>
    </div>
  `;
  
  container.querySelector('.section-header').after(card);
  
  try {
    const res = await API.get('/passengers?limit=50');
    if (res.ok) {
      displayPassengers(res.data.passengers);
    }
  } catch (error) {
    card.querySelector('.card-body').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> Error loading passengers
      </div>
    `;
  }
}

function displayPassengers(passengers) {
  const card = document.querySelector('#section-passengers .card .card-body');
  
  if (!passengers || passengers.length === 0) {
    card.innerHTML = '<p class="text-muted text-center">No passengers registered</p>';
    return;
  }
  
  card.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>National ID</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Registered</th>
          </tr>
        </thead>
        <tbody>
          ${passengers.map(p => `
            <tr>
              <td>${p.full_name}</td>
              <td>${p.national_id || 'N/A'}</td>
              <td>${p.phone || 'N/A'}</td>
              <td>${p.email || 'N/A'}</td>
              <td>${formatDateTime(p.created_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== REPORTS ====================

async function loadReports() {
  const container = document.querySelector('#section-reports');
  const existingCard = container.querySelector('.card');
  
  if (existingCard) {
    existingCard.remove();
  }
  
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-header">
      <h5><i class="bi bi-file-earmark-bar-graph"></i> System Reports</h5>
    </div>
    <div class="card-body">
      <div class="row g-3">
        <div class="col-md-4">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h6>Daily Boarding Report</h6>
              <p class="small mb-3">View today's boarding statistics</p>
              <button class="btn btn-light btn-sm" onclick="generateDailyReport()">
                <i class="bi bi-download"></i> Generate
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h6>Trip Summary Report</h6>
              <p class="small mb-3">Summary of all trips</p>
              <button class="btn btn-light btn-sm" onclick="generateTripReport()">
                <i class="bi bi-download"></i> Generate
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h6>Compliance Report</h6>
              <p class="small mb-3">System compliance overview</p>
              <button class="btn btn-light btn-sm" onclick="generateComplianceReport()">
                <i class="bi bi-download"></i> Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.querySelector('.section-header').after(card);
}

function generateDailyReport() {
  alert('Daily report generation coming soon...');
}

function generateTripReport() {
  alert('Trip report generation coming soon...');
}

function generateComplianceReport() {
  alert('Compliance report generation coming soon...');
}

// ==================== UTILITY FUNCTIONS ====================

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function viewBoardingDetails(id) {
  alert('Boarding details coming soon...');
}

function logout() {
  Auth.logout();
}
