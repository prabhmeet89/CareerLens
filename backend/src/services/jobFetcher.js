'use strict';
/**
 * jobFetcher.js — Adzuna API integration service for CareerLens
 *
 * Fetches real job listings from the Adzuna API and maps them to the
 * CareerLens Job schema. Skills and experience level are extracted via
 * keyword matching since Adzuna does not return them directly.
 *
 * Rate limit: Adzuna free tier = 1,000 calls/month.
 * Each call to fetchJobsForQuery() = 1 API call.
 * Default: 7 queries × 1 page = 7 calls per full run.
 */

const https = require('https');
const { SKILL_SYNONYMS } = require('../utils/normalizeSkills');

// ─── Configuration ─────────────────────────────────────────────────────────────

/**
 * Target search queries optimised for student/entry-level/internship roles.
 * Multiple targeted queries beat one generic query for relevance.
 */
const TARGET_QUERIES = [
  'software engineer intern',
  'full stack developer',
  'backend developer',
  'frontend developer',
  'data analyst',
  'devops engineer',
  'junior developer',
];

const RESULTS_PER_PAGE = 20;

// ─── Skill Extraction ──────────────────────────────────────────────────────────

/**
 * All canonical skill names from the normalizeSkills synonym map.
 * Used as a matching vocabulary for keyword scanning.
 */
const CANONICAL_SKILLS = [...new Set(Object.values(SKILL_SYNONYMS))];

/**
 * All synonym keys from the synonym map, sorted longest-first so that
 * multi-word skills (e.g. "react native") match before shorter substrings.
 */
const SYNONYM_KEYS = Object.keys(SKILL_SYNONYMS).sort((a, b) => b.length - a.length);

/**
 * Extract recognised tech skills from a block of text by scanning for
 * all synonym keys against the lowercased text with word-boundary awareness.
 *
 * @param {string} text - Combined title + description text
 * @returns {string[]} Deduplicated array of canonical skill names
 */
const extractSkills = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Set();

  for (const key of SYNONYM_KEYS) {
    // Word-boundary check: ensure the key is not embedded inside a longer word
    const idx = lower.indexOf(key);
    if (idx === -1) continue;

    const before = idx === 0 ? ' ' : lower[idx - 1];
    const after = idx + key.length >= lower.length ? ' ' : lower[idx + key.length];
    const isBoundary = /[\s,.()\-/\\]/.test(before) && /[\s,.()\-/\\]/.test(after);

    if (isBoundary) {
      found.add(SKILL_SYNONYMS[key]);
    }
  }

  return Array.from(found);
};

// ─── Employment Type Mapping ───────────────────────────────────────────────────

/**
 * Maps Adzuna contract fields and title/description hints to CareerLens
 * employmentType enum: 'internship' | 'full-time' | 'part-time' | 'contract'
 */
const mapEmploymentType = ({ title = '', description = '', contract_time, contract_type }) => {
  const text = `${title} ${description}`.toLowerCase();

  // Intern/internship keyword overrides everything
  if (/\bintern(ship)?\b/.test(text)) return 'internship';

  // Explicit Adzuna contract_time field
  if (contract_time === 'part_time') return 'part-time';
  if (contract_time === 'full_time') return 'full-time';

  // Explicit Adzuna contract_type field
  if (contract_type === 'contract') return 'contract';

  // Default for permanent/unspecified
  return 'full-time';
};

// ─── Experience Heuristic ──────────────────────────────────────────────────────

/**
 * Infers an experience range string from the job title.
 * Adzuna does not expose years-of-experience directly.
 */
const inferExperience = (title = '') => {
  const lower = title.toLowerCase();
  if (/\b(junior|jr\.?|intern(ship)?|entry.?level|graduate|fresher|trainee|associate)\b/.test(lower)) {
    return '0-1 years';
  }
  return '1-3 years';
};

// ─── Work Arrangement Heuristic ───────────────────────────────────────────────

/**
 * Infers work arrangement from location string, title, and description.
 * @returns {'remote' | 'hybrid' | 'on-site' | 'unspecified'}
 */
const inferWorkArrangement = ({ title = '', description = '', location = '' }) => {
  const locLower = location.toLowerCase();
  const text = `${title} ${description}`.toLowerCase();

  if (/\bremote\b/.test(locLower) || /\b(fully remote|100% remote|work from home|wfh)\b/.test(text)) {
    return 'remote';
  }
  if (/\bhybrid\b/.test(locLower) || /\b(hybrid work|hybrid role|hybrid model)\b/.test(text)) {
    return 'hybrid';
  }
  if (/\b(on.?site|in.?office|in.?person)\b/.test(text) || (location && locLower !== 'india' && locLower !== 'remote')) {
    return 'on-site';
  }
  return 'unspecified';
};

// ─── Salary Formatting ─────────────────────────────────────────────────────────

/**
 * Formats Adzuna's numeric salary_min / salary_max into a human-readable string.
 * Returns null when both values are absent (schema default will apply).
 */
const formatSalary = (salary_min, salary_max) => {
  if (!salary_min && !salary_max) return null;
  const fmt = (n) => `₹${(Number(n) / 100000).toFixed(1)}L`;
  if (salary_min && salary_max) return `${fmt(salary_min)} - ${fmt(salary_max)} / yr`;
  if (salary_min) return `${fmt(salary_min)}+ / yr`;
  return `Up to ${fmt(salary_max)} / yr`;
};

// ─── HTML Stripping ────────────────────────────────────────────────────────────

/**
 * Strips HTML tags and decodes common HTML entities from Adzuna's
 * title and description strings (which contain <strong> tags etc.)
 */
const stripHtml = (str = '') =>
  str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

// ─── Job Mapping ───────────────────────────────────────────────────────────────

/**
 * Maps a single raw Adzuna job object to the CareerLens Job schema shape.
 *
 * @param {Object} raw - Raw Adzuna API job object
 * @returns {Object} CareerLens-shaped job document (not yet saved)
 */
const mapAdzunaJob = (raw) => {
  const title = stripHtml(raw.title || '');
  const description = stripHtml(raw.description || 'No description provided.');
  const company = (raw.company && raw.company.display_name) || 'Unknown Company';
  const location = (raw.location && raw.location.display_name) || 'India';

  const skills = extractSkills(`${title} ${description}`);
  const employmentType = mapEmploymentType({
    title,
    description,
    contract_time: raw.contract_time,
    contract_type: raw.contract_type,
  });
  const workArrangement = inferWorkArrangement({ title, description, location });
  const experienceRequired = inferExperience(title);
  
  const minSalary = typeof raw.salary_min === 'number' ? raw.salary_min : (Number(raw.salary_min) || null);
  const maxSalary = typeof raw.salary_max === 'number' ? raw.salary_max : (Number(raw.salary_max) || null);
  const salary = formatSalary(minSalary, maxSalary);
  const applicationUrl = raw.redirect_url || 'https://www.adzuna.in/jobs';
  const postedAt = raw.created ? new Date(raw.created) : new Date();

  return {
    title,
    company,
    description,
    location,
    employmentType,
    workArrangement,
    experienceRequired,
    skills,
    minSalary,
    maxSalary,
    ...(salary ? { salary } : {}),
    applicationUrl,
    source: 'adzuna',
    externalId: String(raw.id),
    postedAt,
  };
};

// ─── HTTP Helper ───────────────────────────────────────────────────────────────

/**
 * Performs a GET request and returns parsed JSON.
 *
 * @param {string} url - Full URL to fetch
 * @returns {Promise<Object>} Parsed JSON response
 */
const getJson = (url) =>
  new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`Failed to parse Adzuna response: ${e.message}. Raw: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error(`Adzuna API request timed out for: ${url.slice(0, 80)}`));
    });
    req.end();
  });

// ─── Main Fetch Function ───────────────────────────────────────────────────────

/**
 * Fetches jobs for a single search query from Adzuna.
 *
 * @param {Object} opts
 * @param {string} opts.query       - Search keyword string (e.g. "full stack developer")
 * @param {string} [opts.appId]     - Adzuna app_id (defaults to ADZUNA_APP_ID env var)
 * @param {string} [opts.appKey]    - Adzuna app_key (defaults to ADZUNA_APP_KEY env var)
 * @param {string} [opts.country]   - ISO country code (defaults to ADZUNA_COUNTRY env var, fallback 'in')
 * @param {number} [opts.page]      - Page number (1-indexed, default 1)
 * @returns {Promise<{ jobs: Object[], apiCallsUsed: number }>}
 */
const fetchJobsForQuery = async ({
  query,
  appId = process.env.ADZUNA_APP_ID,
  appKey = process.env.ADZUNA_APP_KEY,
  country = process.env.ADZUNA_COUNTRY || 'in',
  page = 1,
}) => {
  if (!appId || !appKey) {
    throw new Error(
      'Adzuna credentials are not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY in backend/.env.\n' +
        'Get a free key at: https://developer.adzuna.com'
    );
  }

  const encodedQuery = encodeURIComponent(query);
  const url =
    `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}` +
    `?app_id=${appId}&app_key=${appKey}` +
    `&results_per_page=${RESULTS_PER_PAGE}` +
    `&what=${encodedQuery}` +
    `&content-type=application/json`;

  console.log(`[JobFetcher] Fetching: "${query}" (country=${country}, page=${page})`);

  const { statusCode, body } = await getJson(url);

  if (statusCode !== 200) {
    throw new Error(
      `Adzuna API returned HTTP ${statusCode} for query "${query}". ` +
        `Response: ${JSON.stringify(body).slice(0, 300)}`
    );
  }

  const rawJobs = body.results || [];
  const jobs = rawJobs.map(mapAdzunaJob);

  console.log(`[JobFetcher]   → ${jobs.length} jobs received for "${query}"`);
  return { jobs, apiCallsUsed: 1 };
};

/**
 * Fetches jobs for all default target queries.
 *
 * @param {Object} [opts] - Optional overrides (appId, appKey, country)
 * @returns {Promise<{ jobs: Object[], totalApiCalls: number }>}
 */
const fetchAllJobs = async (opts = {}) => {
  let allJobs = [];
  let totalApiCalls = 0;

  for (const query of TARGET_QUERIES) {
    try {
      const { jobs, apiCallsUsed } = await fetchJobsForQuery({ query, ...opts });
      allJobs = allJobs.concat(jobs);
      totalApiCalls += apiCallsUsed;

      // Brief pause between requests to be a polite API client
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`[JobFetcher] Failed to fetch query "${query}": ${err.message}`);
      // Continue with remaining queries rather than aborting the whole run
    }
  }

  return { jobs: allJobs, totalApiCalls };
};

module.exports = {
  fetchJobsForQuery,
  fetchAllJobs,
  TARGET_QUERIES,
  RESULTS_PER_PAGE,
  // Exported for testing
  mapAdzunaJob,
  extractSkills,
  mapEmploymentType,
  inferExperience,
  stripHtml,
};
