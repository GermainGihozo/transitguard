// Station Officer Dashboard JavaScript

const user = Auth.getUser();
if (!user || user.role !== 'station_officer') {
  alert('Access denied. Station Officer only.');
  window.location.href = 'login.html';
}

// Get user's station ID
const userStationId = user.station_id;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filterTripDate').value = today;
  
  // Load initial data
  loadStationsForDropdowns();
  loadVehiclesForDropdown();
});

// ==================== TRIP MANAGEMENT ====================

async function loadTrips(page = 1) {
  const status = document.getElementById('filterTripStatus')?.value || '';
  const date = document.getElementById('filterTripDate')?.value || '';
  
  try {
    let url = `/trips?page=${page}&limit=20`;
    if (userStationId) url += `&station_id=${userStationId}`;
    if (status) url += `&status=${status}`;
    // Note: Date filtering would need backend support
    
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
                <i class="bi bi-eye"></i> View
              </button>
              ${trip.status === 'scheduled' && isUpcoming ? `
                <button class="btn btn-sm btn-outline-success" onclick="updateTripStatus(${trip.id}, 'departed')" title="Mark as Departed">
                  <i class="bi bi-play-circle"></i> Depart
                </button>
              ` : ''}
              ${trip.status === 'departed' ? `
                <button class="btn btn-sm btn-outline-secondary" onclick="updateTripStatus(${trip.id}, 'arrived')" title="Mark as Arrived">
                  <i class="bi bi-check-circle"></i> Arrive
                </button>
              ` : ''}
              ${trip.status === 'scheduled' ? `
                <button class="btn btn-sm btn-outline-danger" onclick="updateTripStatus(${trip.id}, 'cancelled')" title="Cancel Trip">
                  <i class="bi bi-x-circle"></i> Cancel
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

// ==================== CREATE TRIP ====================

async function showCreateTripModal() {
  const modal = new bootstrap.Modal(document.getElementById('createTripModal'));
  document.getElementById('createTripForm').reset();
  document.getElementById('createTripError').classList.add('d-none');
  
  // Set default date and time
  const now = new Date();
  document.getElementById('tripDepartureDate').value = now.toISOString().split('T')[0];
  document.getElementById('tripDepartureTime').value = now.toTimeString().slice(0, 5);
  
  // Pre-select user's station as origin
  if (userStationId) {
    document.getElementById('tripOriginStation').value = userStationId;
  }
  
  modal.show();
}

async function loadStationsForDropdowns() {
  try {
    const res = await API.get('/stations?limit=100&is_active=true');
    if (res.ok) {
      const stations = res.data.stations;
      
      const originSelect = document.getElementById('tripOriginStation');
      const destSelect = document.getElementById('tripDestinationStation');
      
      if (originSelect) {
        originSelect.innerHTML = '<option value="">Select origin station...</option>' +
          stations.map(s => `<option value="${s.id}" ${s.id === userStationId ? 'selected' : ''}>${s.name} - ${s.location}</option>`).join('');
      }
      
      if (destSelect) {
        destSelect.innerHTML = '<option value="">Select destination...</option>' +
          stations.map(s => `<option value="${s.id}" ${s.id === userStationId ? 'disabled' : ''}>${s.name} - ${s.location}</option>`).join('');
      }
    }
  } catch (error) {
    console.error('Error loading stations:', error);
  }
}

async function loadVehiclesForDropdown() {
  try {
    const res = await API.get('/vehicles?limit=100');
    if (res.ok) {
      const vehicles = res.data.vehicles;
      const vehicleSelect = document.getElementById('tripVehicle');
      
      if (vehicleSelect) {
        vehicleSelect.innerHTML = '<option value="">Select vehicle...</option>' +
          vehicles.map(v => `<option value="${v.id}" data-capacity="${v.capacity}">${v.plate_number} - ${v.company_name} (${v.capacity} seats)</option>`).join('');
        
        // Add change listener to show capacity
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
  
  // Client-side validation
  const errors = [];
  
  if (!originStationId) {
    errors.push('Please select origin station');
  }
  
  if (!destinationStationId) {
    errors.push('Please select destination station');
  }
  
  if (originStationId === destinationStationId) {
    errors.push('Origin and destination cannot be the same');
  }
  
  if (!vehicleId) {
    errors.push('Please select a vehicle');
  }
  
  if (!departureDate) {
    errors.push('Please select departure date');
  }
  
  if (!departureTime) {
    errors.push('Please select departure time');
  }
  
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

// ==================== VIEW TRIP DETAILS ====================

async function viewTripDetails(tripId) {
  try {
    const res = await API.get(`/trips/${tripId}`);
    if (res.ok) {
      const trip = res.data;
      const content = document.getElementById('tripDetailsContent');
      
      const statusColors = {
        scheduled: 'primary',
        departed: 'success',
        arrived: 'secondary',
        cancelled: 'danger'
      };
      
      content.innerHTML = `
        <div class="row">
          <div class="col-md-6">
            <h6 class="text-muted mb-3">Trip Information</h6>
            <table class="table table-sm">
              <tr>
                <td><strong>Status:</strong></td>
                <td><span class="badge bg-${statusColors[trip.status]}">${trip.status.toUpperCase()}</span></td>
              </tr>
              <tr>
                <td><strong>Vehicle:</strong></td>
                <td>${trip.plate_number} (${trip.company_name})</td>
              </tr>
              <tr>
                <td><strong>Capacity:</strong></td>
                <td>${trip.capacity} seats</td>
              </tr>
              <tr>
                <td><strong>Departure:</strong></td>
                <td>${formatDateTime(trip.departure_time)}</td>
              </tr>
            </table>
          </div>
          <div class="col-md-6">
            <h6 class="text-muted mb-3">Route Information</h6>
            <table class="table table-sm">
              <tr>
                <td><strong>Route:</strong></td>
                <td>${trip.route_name}</td>
              </tr>
              <tr>
                <td><strong>Origin:</strong></td>
                <td>${trip.origin_station}</td>
              </tr>
              <tr>
                <td><strong>Destination:</strong></td>
                <td>${trip.destination_station}</td>
              </tr>
            </table>
          </div>
        </div>
        <hr>
        <div class="row">
          <div class="col-md-6">
            <h6 class="text-muted mb-3">Passenger Statistics</h6>
            <table class="table table-sm">
              <tr>
                <td><strong>Tickets Sold:</strong></td>
                <td>${trip.tickets_sold}</td>
              </tr>
              <tr>
                <td><strong>Passengers Boarded:</strong></td>
                <td>${trip.passengers_boarded}</td>
              </tr>
              <tr>
                <td><strong>Available Seats:</strong></td>
                <td>${trip.capacity - trip.passengers_boarded}</td>
              </tr>
            </table>
          </div>
          <div class="col-md-6">
            <h6 class="text-muted mb-3">Occupancy</h6>
            <div class="progress" style="height: 30px;">
              <div class="progress-bar ${trip.passengers_boarded / trip.capacity > 0.8 ? 'bg-danger' : 'bg-success'}" 
                   style="width: ${(trip.passengers_boarded / trip.capacity * 100)}%">
                ${Math.round(trip.passengers_boarded / trip.capacity * 100)}%
              </div>
            </div>
          </div>
        </div>
      `;
      
      const modal = new bootstrap.Modal(document.getElementById('viewTripModal'));
      modal.show();
    }
  } catch (error) {
    alert('Error loading trip details');
  }
}

// ==================== UPDATE TRIP STATUS ====================

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

function showTripError(message) {
  const container = document.getElementById('tripsContainer');
  container.innerHTML = `
    <div class="col-12">
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> ${message}
      </div>
    </div>
  `;
}

// Load trips when section is shown
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    const section = item.dataset.section;
    if (section === 'trips') {
      loadTrips();
    }
  });
});


// ==================== BOARDING SCAN ====================

let selectedTripForScan = null;
let recentScansArray = [];

async function loadActiveTripsForScan() {
  try {
    const res = await API.get(`/trips?station_id=${userStationId}&status=scheduled`);
    if (res.ok) {
      const trips = res.data.trips;
      const select = document.getElementById('scanTripSelect');
      
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
      
      // Add change listener
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
  
  // Validation
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
  
  // Show scanning status
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
      // Success!
      const result = res.data;
      showScanSuccess(result);
      addToRecentScans(result);
      
      // Update trip info with new passenger count
      selectedTripForScan.passengers_boarded = result.trip.passengers_boarded;
      selectTripForScan(selectedTripForScan);
      
      // Clear input
      fingerprintInput.value = '';
      
      // Play success sound (optional)
      playSuccessSound();
    } else {
      // Failure
      showScanFailure(res.data.message || 'Boarding denied');
      playErrorSound();
    }
  } catch (error) {
    showScanFailure('Unable to connect to server. Please check your connection.');
    playErrorSound();
  } finally {
    scanButton.disabled = false;
    scanButton.innerHTML = '<i class="bi bi-fingerprint"></i> Scan & Verify';
    
    // Reset scanner status after 3 seconds
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
  
  // Update scanner status
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
  
  // Update scanner status
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
  // const audio = new Audio('/sounds/success.mp3');
  // audio.play();
}

function playErrorSound() {
  // Optional: Add error sound
  // const audio = new Audio('/sounds/error.mp3');
  // audio.play();
}

// Load active trips when scan section is shown
const scanNavItem = document.querySelector('[data-section="scan"]');
if (scanNavItem) {
  scanNavItem.addEventListener('click', () => {
    loadActiveTripsForScan();
  });
}
