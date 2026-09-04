/**
 * Utility to normalize API and network errors into calm, actionable, user-friendly messages.
 */

import { APP_START_TIME } from '../api/axiosClient';

// ─── Cold-start detection ──────────────────────────────────────────────────────

/**
 * Returns true if a network failure is likely caused by a Render free-tier cold
 * start rather than a genuine connectivity problem. Heuristic: if the error
 * occurred within the first 90 seconds of the app loading, the backend was
 * probably still waking up (Render cold starts take 30–90 s).
 */
export function isColdStartLikely() {
  const elapsedMs = Date.now() - APP_START_TIME;
  return elapsedMs < 90_000; // within 90 seconds of app load
}

// ─── Message normalizer ────────────────────────────────────────────────────────

export function normalizeErrorMessage(error, defaultMessage = 'An unexpected error occurred. Please try again.') {
  if (!error) return defaultMessage;

  // Browser offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return "You're offline. Please check your internet connection and try again.";
  }

  // Network failure / connection refused — most commonly a Render cold-start on
  // the free tier (backend asleep, Render takes 30-90 s to wake, Vercel proxy
  // times out at 60 s and returns a TCP-level failure that looks like this).
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    if (isColdStartLikely()) {
      return 'The server is waking up from sleep — this can take 20–40 seconds on the free tier. Please wait a moment and try again.';
    }
    return 'Unable to reach the server. Please check your connection or try again in a moment.';
  }

  // Timeout — also common during a cold start if the request is made before the
  // backend has fully woken up and the 70-second client timeout is hit.
  if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
    if (isColdStartLikely()) {
      return 'The server took too long to respond — it may still be waking up. Please wait a moment and try again.';
    }
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
