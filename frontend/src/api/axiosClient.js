import axios from 'axios';

// ─── Startup timestamp ─────────────────────────────────────────────────────────
// Used by isColdStartLikely() in errorHelpers to detect first-request failures.
export const APP_START_TIME = Date.now();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  // 70 seconds — intentionally longer than Vercel's 60s proxy cap so we get a
  // clean ECONNABORTED (timeout) code rather than a silent TCP kill, which lets
  // errorHelpers give a friendlier "server is waking up" message.
  timeout: 70000,
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

/**
 * Silently ping the backend health endpoint to wake it from Render free-tier
 * sleep. Call this proactively (e.g. on app init, on Upload page mount) so the
 * backend has time to start before the user triggers a real API request.
 *
 * Errors are intentionally swallowed — this is a best-effort warm-up only.
 */
export async function warmUpServer() {
  try {
    // Use a shorter timeout for the warm-up ping so it doesn't hold up startup.
    // We don't need a response — just need the TCP handshake to wake Render.
    await api.get('/health', { timeout: 75000 });
  } catch {
    // Intentionally silent — warm-up failures must never surface to the user
  }
}

export default api;
