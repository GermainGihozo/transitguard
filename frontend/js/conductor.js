// Conductor Dashboard JavaScript

const user = Auth.getUser();
if (!user || user.role !== 'conductor') {
  alert('Access denied. Conductor only.');
  window.location.href = 'login.html';
}

document.getElementById('userName').textContent = user.full_name;

// Global state
let selectedTripForScan = null;
let recentScansArray = [];

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
      case 'scan':
        loadActiveTripsForScan();
        break;
      case 'current-trip':
        loadCurrentTrip();
        break;
      case 'history':
        loadBoardingHistory();
        break;
    }
  }
}

async function loadDashboardData() {
  try {
    const res = await API.get('/dashboard/live');
    if (res.ok) {
      const { stats } = res.data;
      document.getElementById('todayScans').textContent = stats.total_scans || 0;
      document.getElementById('approvedScans').textContent = stats.approved || 0;
      document.getElementById('deniedScans').textContent = stats.denied || 0;
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// ==================== BOARDING SCAN ====================

async function loadActiveTripsForScan() {
  try {
    const res = await API.get('/trips?status=scheduled,departed&limit=50');
    if (res.ok) {
      const trips = res.data.trips;
      const select = document.getElementById('scanTripSelect');
      
      if (!select) return;
      
      if (trips.length === 0) {
        select.innerHTML = '<option value="">No active trips available</option>';
        return;
      }
      
      select.innerHTML = '<option value="">Select a trip to start boarding...</option>' +
        trips.map(trip => {
          const departureTime = new Date(trip.departure_time).toLocaleString();
          return `<option value="${trip.id}" data-trip='${JSON.stringify(trip)}'>
            ${trip.plate_number} - ${trip.origin_station} → ${trip.destination_station} (${departureTime})
          </option>`;
        }).join('');
      
      select.addEventListener('change', (e) => {
        if (e.target.value) {
          const selectedOption = e.target.options[e.target.selectedIndex];
          const tripData = JSON.parse(selectedOption.getAttribute('data-trip'));
          selectTripForScan(tripData);
        } else {
          selectedTripForScan = null;
          document.getElementById('selectedTripInfo').classList.add('d-none');
        }
      });
    }
  } catch (error) {
    console.error('Error loading trips:', error);
  }
}

function selectTripForScan(trip) {
  selectedTripForScan = trip;
  const infoDiv = document.getElementById('selectedTripInfo');
  const occupancy = trip.capacity > 0 ? Math.round((trip.passengers_boarded / trip.capacity) * 100) : 0;
  
  infoDiv.innerHTML = `
    <div class="alert alert-success">
      <div class="row">
        <div class="col-md-6">
          <strong><i class="bi bi-bus-front"></i> Vehicle:</strong> ${trip.plate_number}<br>
          <strong><i class="bi bi-map"></i> Route:</strong> ${trip.route_name}<br>
          <strong><i class="bi bi-geo-alt"></i> From:</strong> ${trip.origin_station}<br>
          <strong><i class="bi bi-geo-alt-fill"></i> To:</strong> ${trip.destination_station}
        </div>
        <div class="col-md-6">
          <strong><i class="bi bi-calendar"></i> Departure:</strong> ${formatDateTime(trip.departure_time)}<br>
          <strong><i class="bi bi-people"></i> Boarded:</strong> ${trip.passengers_boarded} / ${trip.capacity}<br>
          <div class="progress mt-2" style="height: 20px;">
            <div class="progress-bar ${occupancy > 80 ? 'bg-danger' : 'bg-success'}" 
                 style="width: ${occupancy}%">
              ${occupancy}%
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  infoDiv.classList.remove('d-none');
}

async function scanFingerprint() {
  const fingerprintInput = document.getElementById('fingerprintInput');
  const fingerprint = fingerprintInput.value.trim();
  const scanButton = document.getElementById('scanButton');
  const scanResult = document.getElementById('scanResult');
  
  if (!fingerprint) {
    showScanError('Please enter fingerprint template');
    return;
  }
  
  if (fingerprint.length < 10) {
    showScanError('Fingerprint template too short (minimum 10 characters)');
    return;
  }
  
  if (!selectedTripForScan) {
    showScanError('Please select a trip first');
    return;
  }
  
  scanButton.disabled = true;
  scanButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Scanning...';
  
  const scannerStatus = document.getElementById('scannerStatus');
  scannerStatus.innerHTML = `
    <div class="spinner-border text-primary" style="width: 5rem; height: 5rem;" role="status">
      <span class="visually-hidden">Scanning...</span>
    </div>
    <p class="text-primary mt-3"><strong>Verifying fingerprint...</strong></p>
  `;
  
  try {
    const data = {
      fingerprint_template: fingerprint,
      trip_id: selectedTripForScan.id
    };
    
    const res = await API.post('/boarding/scan', data);
    
    if (res.ok) {
      const result = res.data;
      showScanSuccess(result);
      addToRecentScans(result);
      
      selectedTripForScan.passengers_boarded = result.trip.passengers_boarded;
      selectTripForScan(selectedTripForScan);
      
      fingerprintInput.value = '';
      playSuccessSound();
    } else {
      showScanFailure(res.data.message || 'Boarding denied');
      playErrorSound();
    }
  } catch (error) {
    showScanFailure('Unable to connect to server. Please check your connection.');
    playErrorSound();
  } finally {
    scanButton.disabled = false;
    scanButton.innerHTML = '<i class="bi bi-fingerprint"></i> Scan & Verify';
    
    setTimeout(() => {
      scannerStatus.innerHTML = `
        <i class="bi bi-fingerprint" style="font-size: 5rem; color: #6c757d;"></i>
        <p class="text-muted mt-3">Ready to scan</p>
      `;
    }, 3000);
  }
}

function showScanSuccess(result) {
  const scanResult = document.getElementById('scanResult');
  const occupancyColor = result.trip.occupancy_percent > 80 ? 'danger' : 'success';
  const ticketMessage = result.ticket_created ? '(Auto-created)' : '';
  
  scanResult.innerHTML = `
    <div class="alert alert-success border-success">
      <div class="text-center mb-3">
        <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
        <h4 class="text-success mt-2">${result.message}</h4>
        ${result.ticket_created ? '<p class="text-muted mb-0">Ticket automatically created for this trip</p>' : ''}
      </div>
      
      <hr>
      
      <div class="text-start">
        <h6 class="text-muted mb-3">Passenger Information</h6>
        <p class="mb-1"><strong>Name:</strong> ${result.passenger.full_name}</p>
        <p class="mb-1"><strong>ID:</strong> ${result.passenger.national_id || 'N/A'}</p>
        <p class="mb-3"><strong>Ticket:</strong> #${result.ticket.id} ${ticketMessage}</p>
        
        <h6 class="text-muted mb-3">Trip Information</h6>
        <p class="mb-1"><strong>Vehicle:</strong> ${result.trip.plate_number}</p>
        <p class="mb-1"><strong>Route:</strong> ${result.trip.route}</p>
        <p class="mb-1"><strong>From:</strong> ${result.trip.origin}</p>
        <p class="mb-1"><strong>To:</strong> ${result.trip.destination}</p>
        <p class="mb-3"><strong>Departure:</strong> ${formatDateTime(result.trip.departure_time)}</p>
        
        <h6 class="text-muted mb-2">Occupancy</h6>
        <div class="d-flex justify-content-between mb-1">
          <span>Passengers Boarded:</span>
          <strong>${result.trip.passengers_boarded} / ${result.trip.capacity}</strong>
        </div>
        <div class="progress" style="height: 25px;">
          <div class="progress-bar bg-${occupancyColor}" 
               style="width: ${result.trip.occupancy_percent}%">
            ${result.trip.occupancy_percent}%
          </div>
        </div>
      </div>
    </div>
  `;
  
  const scannerStatus = document.getElementById('scannerStatus');
  scannerStatus.innerHTML = `
    <i class="bi bi-check-circle-fill text-success" style="font-size: 5rem;"></i>
    <p class="text-success mt-3"><strong>Verified!</strong></p>
  `;
}

function showScanFailure(message) {
  const scanResult = document.getElementById('scanResult');
  
  scanResult.innerHTML = `
    <div class="alert alert-danger border-danger">
      <div class="text-center">
        <i class="bi bi-x-circle-fill text-danger" style="font-size: 4rem;"></i>
        <h4 class="text-danger mt-2">✗ BOARDING DENIED</h4>
        <p class="mt-3 mb-0">${message}</p>
      </div>
    </div>
  `;
  
  const scannerStatus = document.getElementById('scannerStatus');
  scannerStatus.innerHTML = `
    <i class="bi bi-x-circle-fill text-danger" style="font-size: 5rem;"></i>
    <p class="text-danger mt-3"><strong>Access Denied</strong></p>
  `;
}

function showScanError(message) {
  const scanResult = document.getElementById('scanResult');
  scanResult.innerHTML = `
    <div class="alert alert-warning">
      <i class="bi bi-exclamation-triangle"></i> ${message}
    </div>
  `;
}

function addToRecentScans(result) {
  const scan = {
    time: new Date(),
    passenger: result.passenger.full_name,
    vehicle: result.trip.plate_number,
    status: 'approved'
  };
  
  recentScansArray.unshift(scan);
  if (recentScansArray.length > 10) {
    recentScansArray.pop();
  }
  
  updateRecentScansDisplay();
}

function updateRecentScansDisplay() {
  const container = document.getElementById('recentScans');
  
  if (!container) return;
  
  if (recentScansArray.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No recent scans</p>';
    return;
  }
  
  container.innerHTML = recentScansArray.map(scan => `
    <div class="d-flex justify-content-between align-items-center border-bottom py-2">
      <div>
        <strong>${scan.passenger}</strong><br>
        <small class="text-muted">${scan.vehicle}</small>
      </div>
      <div class="text-end">
        <span class="badge bg-success">✓</span><br>
        <small class="text-muted">${scan.time.toLocaleTimeString()}</small>
      </div>
    </div>
  `).join('');
}

function clearScan() {
  document.getElementById('fingerprintInput').value = '';
  document.getElementById('scanResult').innerHTML = `
    <i class="bi bi-qr-code-scan" style="font-size: 3rem; color: #6c757d;"></i>
    <p class="text-muted mt-3">Scan a passenger to see details</p>
  `;
  
  const scannerStatus = document.getElementById('scannerStatus');
  scannerStatus.innerHTML = `
    <i class="bi bi-fingerprint" style="font-size: 5rem; color: #6c757d;"></i>
    <p class="text-muted mt-3">Ready to scan</p>
  `;
}

function playSuccessSound() {
  // Optional: Add success sound
}

function playErrorSound() {
  // Optional: Add error sound
}

// ==================== CURRENT TRIP ====================

async function loadCurrentTrip() {
  // Load conductor's assigned trip
  const container = document.querySelector('#section-current-trip .card-body');
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
  
  try {
    const res = await API.get('/trips?status=scheduled,departed&limit=1');
    if (res.ok && res.data.trips.length > 0) {
      const trip = res.data.trips[0];
      displayCurrentTrip(trip);
    } else {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> No active trip assigned
        </div>
      `;
    }
  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> Error loading trip
      </div>
    `;
  }
}

function displayCurrentTrip(trip) {
  const container = document.querySelector('#section-current-trip .card-body');
  const occupancy = Math.round((trip.passengers_boarded / trip.capacity) * 100);
  
  container.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h5>${trip.plate_number}</h5>
        <p class="text-muted">${trip.company_name}</p>
        <hr>
        <p><strong>Route:</strong> ${trip.route_name}</p>
        <p><strong>From:</strong> ${trip.origin_station}</p>
        <p><strong>To:</strong> ${trip.destination_station}</p>
        <p><strong>Departure:</strong> ${formatDateTime(trip.departure_time)}</p>
        <p><strong>Status:</strong> <span class="badge bg-primary">${trip.status}</span></p>
      </div>
      <div class="col-md-6">
        <h6>Passenger Status</h6>
        <div class="stat-card mb-3">
          <div class="stat-details">
            <div class="stat-label">Boarded</div>
            <div class="stat-value">${trip.passengers_boarded} / ${trip.capacity}</div>
          </div>
        </div>
        <div class="progress mb-2" style="height: 30px;">
          <div class="progress-bar ${occupancy > 80 ? 'bg-danger' : 'bg-success'}" 
               style="width: ${occupancy}%">
            ${occupancy}%
          </div>
        </div>
        <button class="btn btn-primary w-100 mt-3" onclick="showSection('scan')">
          <i class="bi bi-qr-code-scan"></i> Start Boarding Scan
        </button>
      </div>
    </div>
  `;
}

// ==================== HISTORY ====================

async function loadBoardingHistory() {
  const container = document.querySelector('#section-history .card-body');
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
  
  try {
    const res = await API.get('/boarding/history?limit=50');
    if (res.ok) {
      displayBoardingHistory(res.data.logs);
    }
  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> Error loading history
      </div>
    `;
  }
}

function displayBoardingHistory(logs) {
  const container = document.querySelector('#section-history .card-body');
  
  if (!logs || logs.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No boarding history</p>';
    return;
  }
  
  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Time</th>
            <th>Passenger</th>
            <th>Vehicle</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td>${formatDateTime(log.boarding_time)}</td>
              <td>${log.passenger_name}</td>
              <td>${log.plate_number || 'N/A'}</td>
              <td><span class="badge bg-success">${log.verification_status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
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

function logout() {
  Auth.logout();
}
