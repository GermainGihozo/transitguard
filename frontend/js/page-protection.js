// Page Protection - Prevents direct access to dashboard pages
// This script should be included at the top of every protected page

(function() {
  'use strict';
  
  // Check if user is authenticated
  function isAuthenticated() {
    const token = localStorage.getItem('token');
    return token !== null && token !== undefined && token !== '';
  }
  
  // Get user from localStorage
  function getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  
  // Check if user has required role for this page
  function hasRequiredRole(requiredRole) {
    const user = getUser();
    if (!user || !user.role) return false;
    
    return user.role === requiredRole;
  }
  
  // Redirect to login page
  function redirectToLogin() {
    // Clear any existing auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = '/login.html';
  }
  
  // Redirect to appropriate dashboard based on role
  function redirectToDashboard(userRole) {
    const dashboardMap = {
      'super_admin': '/super_admin_dashboard.html',
      'company_admin': '/company_dashboard.html',
      'station_officer': '/station_dashboard.html',
      'authority': '/authority_dashboard.html',
      'conductor': '/conductor_dashboard.html'
    };
    
    const dashboard = dashboardMap[userRole];
    if (dashboard) {
      window.location.href = dashboard;
    } else {
      redirectToLogin();
    }
  }
  
  // Main protection function
  window.protectPage = function(requiredRole) {
    // Check if authenticated
    if (!isAuthenticated()) {
      redirectToLogin();
      return;
    }
    
    // Check if user has required role
    if (!hasRequiredRole(requiredRole)) {
      const user = getUser();
      if (user && user.role) {
        // User is logged in but accessing wrong dashboard
        // Redirect to their correct dashboard
        redirectToDashboard(user.role);
      } else {
        // Invalid user data, redirect to login
        redirectToLogin();
      }
      return;
    }
    
    // User is authenticated and has correct role
    // Page can load normally
  };
  
  // Protect index.html and other public pages from logged-in users
  window.protectPublicPage = function() {
    if (isAuthenticated()) {
      const user = getUser();
      if (user && user.role) {
        redirectToDashboard(user.role);
      }
    }
  };
  
})();
