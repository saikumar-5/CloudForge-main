import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL;

if (!API_URL && typeof window !== 'undefined') {
  const { protocol, hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    API_URL = 'http://localhost:5000/api';
  } else {
    API_URL = "http://cloudforge.ddns.net:5000";
  }
}

console.log('API Configuration:', {
  baseURL: API_URL,
  fullURL: API_URL ? API_URL + '/auth/guest' : null
});

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Only redirect on 401 if we have a token (authenticated request failed)
    if (error.response?.status === 401 && localStorage.getItem('authToken')) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('gameUser');
      // Don't redirect during login/signup attempts
      if (!error.config?.url?.includes('/auth/')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),

  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  guestLogin: () =>
    api.post('/auth/guest'),

  googleAuth: (userData) =>
    api.post('/auth/google', userData),

  getCurrentUser: () =>
    api.get('/auth/me'),

  updateProfile: (data) =>
    api.put('/auth/profile', data),

  updateGameStats: (won, coinsEarned) =>
    api.post('/auth/update-stats', { won, coinsEarned }),
};

export default api;
