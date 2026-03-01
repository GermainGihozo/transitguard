// Dashboard functionality
// Include config.js before this file

// Check authentication on page load
if (!Auth.isAuthenticated()) {
  window.location.href = "login.html";
}

// Logout function
function logout() {
  Auth.clearAuth();
  window.location.href = "login.html";
}

// Format date/time helpers
function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString();
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString();
}

// Show loading state
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
  }
}

// Show error message
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="alert alert-danger">${message}</div>`;
  }
}

// Toast notification
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
  toast.style.zIndex = "9999";
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
