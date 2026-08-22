'use strict';
/**
 * seedJobs.js — RETIRED
 *
 * The fabricated job listings that were previously in this file have been
 * removed. They contained fake job postings falsely attributed to real
 * companies (Stripe, Anthropic, Tesla, etc.) which was misleading.
 *
 * Real job data now comes from the Adzuna API.
 * Run: npm run fetch:jobs
 * See: backend/scripts/fetchRealJobs.js
 * Docs: https://developer.adzuna.com
 *
 * This file is kept as an empty shim to satisfy any remaining imports
 * while the codebase is fully migrated. It exports SAMPLE_JOBS = [] so
 * existing callers don't crash.
 */

const SAMPLE_JOBS = [];

const seedJobs = async () => {
  console.warn(
    '[seedJobs] DEPRECATED: seedJobs.js no longer contains sample data.\n' +
      '  Use "npm run fetch:jobs" to populate the database with real Adzuna job listings.'
  );
  return [];
};

module.exports = { seedJobs, SAMPLE_JOBS };
