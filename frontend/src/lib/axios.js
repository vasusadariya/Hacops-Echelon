import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or clear token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Optionally redirect to login
        // window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;