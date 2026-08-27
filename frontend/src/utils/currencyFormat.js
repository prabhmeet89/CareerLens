/**
 * currencyFormat.js — Currency display utilities for CareerLens
 *
 * All salary data from the backend carries a `currency` field (ISO 4217 code,
 * e.g. "INR", "USD"). Use the helpers here to produce locale-correct output
 * rather than hardcoding any currency symbol anywhere in the UI.
 */

/** Maps ISO 4217 currency codes to their display symbols */
export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  NZD: 'NZ$',
  ZAR: 'R',
};

/**
 * Returns the symbol for a given currency code.
 * Falls back to the code itself (e.g. "INR") if not in the map.
 *
 * @param {string} currency - ISO 4217 code
 * @returns {string}
 */
export const getCurrencySymbol = (currency = 'INR') =>
  CURRENCY_SYMBOLS[currency] ?? currency;

/**
 * Formats a raw numeric salary amount using locale-aware digit grouping.
 *
 * - INR uses Indian number formatting (e.g. ₹8,00,000)
 * - All others use en-US (e.g. $80,000)
 *
 * @param {number} amount - Raw salary figure
 * @param {string} currency - ISO 4217 code
 * @returns {string} Formatted string including the currency symbol
 */
export const formatSalaryAmount = (amount, currency = 'INR') => {
  if (amount == null || isNaN(Number(amount))) return '';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    // Fallback for unsupported currency codes
    return `${getCurrencySymbol(currency)}${Number(amount).toLocaleString()}`;
  }
};

/**
 * Returns whether the job's salary is in Indian Rupees.
 * Used to decide icon and filter-chip formatting.
 *
 * @param {Object} job
 * @returns {boolean}
 */
export const isINR = (job) =>
  !job?.currency || job.currency === 'INR';
