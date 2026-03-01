// Common Dashboard Functions - Shared across all dashboards

function initializeDashboard(requiredRole, roleTitle) {
  const user = Auth.getUser();
  if (!user || user.role !== requiredRole) {
    alert(`Access denied. ${roleTitle} only.`);
    window.location.href = 'login.html';
    return null;
  }
  
  document.getElementById('userName').textContent = user.full_name;
  
  document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadDashboardData();
    setInterval(() => loadDashboardData(), 30000);
  });
  
  return user;
}

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
  }
}

async function loadDashboardData() {
  try {
    const dashboardRes = await API.get('/dashboard/live');
    if (dashboardRes.ok) {
      const { stats, records } = dashboardRes.data;
      
      if (document.getElementById('todayScans')) {
        document.getElementById('todayScans').textContent = stats.total_scans || 0;
      }
      if (document.getElementById('approvedScans')) {
        document.getElementById('approvedScans').textContent = stats.approved || 0;
      }
      if (document.getElementById('deniedScans')) {
        document.getElementById('deniedScans').textContent = stats.denied || 0;
      }
      
      updateRecentActivity(records);
    }
    
    const tripsRes = await API.get('/trips/live-trips');
    if (tripsRes.ok) {
      const trips = tripsRes.data;
      if (document.getElementById('activeTrips')) {
        document.getElementById('activeTrips').textContent = trips.length;
      }
      updateActiveTrips(trips);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

function updateRecentActivity(records) {
  const tbody = document.getElementById('recentActivity');
  if (!tbody) return;
  
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
  if (!container) return;
  
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

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    Auth.clearAuth();
    window.location.href = 'login.html';
  }
}

function viewDetails(id) {
  alert('View details for record #' + id);
}
