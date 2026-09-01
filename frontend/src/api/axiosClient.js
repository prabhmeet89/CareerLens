import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Authorization Bearer token if stored in client session
api.interceptors.request.use(
  (config) => {
    try {
      const token =
        sessionStorage.getItem('careerlens_token') ||
        localStorage.getItem('careerlens_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage access errors (e.g. strict browser security sandbox)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format error messages nicely and attach correlation request ID
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend provided a custom message
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    // Extract request correlation ID from response headers or body
    const requestId =
      error.response?.headers?.['x-request-id'] ||
      error.response?.data?.requestId ||
      null;

    // Augment error object with clean message and correlation ID
    error.customMessage = message;
    error.requestId = requestId;
    return Promise.reject(error);
  }
);

export default api;
