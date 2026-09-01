/**
 * Utility to normalize API and network errors into calm, actionable, user-friendly messages.
 */

export function normalizeErrorMessage(error, defaultMessage = 'An unexpected error occurred. Please try again.') {
  if (!error) return defaultMessage;

  // Browser offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return "You're offline. Please check your internet connection and try again.";
  }

  // Network failure / connection refused
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Unable to reach the server. Please check your connection or try again in a moment.';
  }

  // Timeout
  if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
    return 'The request timed out. Please check your connection and try again.';
  }

  // HTTP Status Code specific handling
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message || error.customMessage;

  if (status === 401) {
    return serverMsg || 'Authentication required. Please sign in to continue.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (status === 404) {
    return serverMsg || 'The requested resource could not be found.';
  }

  if (status === 409) {
    return serverMsg || 'A conflict occurred. This action may already have been performed.';
  }

  if (status === 422 || status === 400) {
    return serverMsg || 'Please check your inputs and try again.';
  }

  if (status === 429) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  if (status >= 500) {
    return 'The server is temporarily unavailable. Please try again in a few moments.';
  }

  // Fallback to custom server message or default
  return serverMsg || defaultMessage;
}
