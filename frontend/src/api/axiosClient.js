import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to format error messages nicely
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend provided a custom message
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    // Augment error object with clean message
    error.customMessage = message;
    return Promise.reject(error);
  }
);

export default api;
