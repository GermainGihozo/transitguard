// Frontend configuration
const CONFIG = {
  // API URL - can be overridden by environment variable
  API_BASE_URL: window.VITE_API_URL || (
    window.location.hostname === "localhost"
      ? "http://localhost:5000/api"
      : "/api" // Use relative path in production
  )
  
  // Token storage keys
  TOKEN_KEY: "token",
  USER_KEY: "user",
  
  // Refresh intervals (milliseconds)
  DASHBOARD_REFRESH: 5000, // 5 seconds
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 50,
  
  // Role-based dashboard routes
  ROLE_DASHBOARDS: {
    super_admin: "super_admin_dashboard.html",
    company_admin: "company_dashboard.html",
    station_officer: "station_dashboard.html",
    authority: "authority_dashboard.html",
    conductor: "conductor_dashboard.html"
  }
};

// Helper functions
const API = {
  // Get auth headers
  getHeaders: () => {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    };
  },
  
  // Make authenticated request
  request: async (endpoint, options = {}) => {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...API.getHeaders(),
        ...options.headers
      }
    };
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      // Handle auth errors
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = "login.html";
        return null;
      }
      
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      console.error("API request failed:", error);
      return { ok: false, error: error.message };
    }
  },
  
  // Convenience methods
  get: (endpoint) => API.request(endpoint, { method: "GET" }),
  post: (endpoint, body) => API.request(endpoint, {
    method: "POST",
    body: JSON.stringify(body)
  }),
  put: (endpoint, body) => API.request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body)
  }),
  patch: (endpoint, body) => API.request(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body)
  }),
  delete: (endpoint) => API.request(endpoint, { method: "DELETE" })
};

// Auth helpers
const Auth = {
  getToken: () => localStorage.getItem(CONFIG.TOKEN_KEY),
  getUser: () => {
    const user = localStorage.getItem(CONFIG.USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  setAuth: (token, user) => {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.clear();
  },
  isAuthenticated: () => {
    return !!Auth.getToken();
  },
  hasRole: (...roles) => {
    const user = Auth.getUser();
    return user && roles.includes(user.role);
  },
  redirectToDashboard: () => {
    const user = Auth.getUser();
    if (user && CONFIG.ROLE_DASHBOARDS[user.role]) {
      window.location.href = CONFIG.ROLE_DASHBOARDS[user.role];
    } else {
      window.location.href = "login.html";
    }
  }
};
