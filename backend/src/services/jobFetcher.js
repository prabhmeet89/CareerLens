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

// ─── Country → Currency Mapping ────────────────────────────────────────────────

/**
 * Maps Adzuna country codes to ISO 4217 currency codes.
 * Add entries here if more countries are supported in the future.
 */
const COUNTRY_CURRENCY = {
  in: 'INR',
  us: 'USD',
  gb: 'GBP',
  au: 'AUD',
  ca: 'CAD',
  de: 'EUR',
  fr: 'EUR',
  nl: 'EUR',
  nz: 'NZD',
  sg: 'SGD',
  za: 'ZAR',
};

// ─── Configuration ─────────────────────────────────────────────────────────────

/**
 * Target search queries structured across career tracks for all student backgrounds.
 * Covers Technology, Marketing, Sales & Business, Finance, HR, Design, Operations, Data & Analytics.
 */
const TARGET_QUERIES = [
  // Technology
  { query: 'software engineer intern', category: 'Technology' },
  { query: 'full stack developer', category: 'Technology' },
  { query: 'backend developer', category: 'Technology' },
  { query: 'frontend developer', category: 'Technology' },
  { query: 'devops engineer', category: 'Technology' },
  { query: 'junior developer', category: 'Technology' },
  { query: 'qa engineer', category: 'Technology' },
  { query: 'mobile developer', category: 'Technology' },

  // Marketing
  { query: 'digital marketing executive', category: 'Marketing' },
  { query: 'marketing intern', category: 'Marketing' },
  { query: 'seo specialist', category: 'Marketing' },
  { query: 'content marketing', category: 'Marketing' },
  { query: 'social media manager', category: 'Marketing' },
  { query: 'brand marketing', category: 'Marketing' },

  // Sales & Business
  { query: 'business development executive', category: 'Sales & Business' },
  { query: 'sales intern', category: 'Sales & Business' },
  { query: 'account manager', category: 'Sales & Business' },
  { query: 'business analyst', category: 'Sales & Business' },

  // Finance
  { query: 'finance intern', category: 'Finance' },
  { query: 'accounts executive', category: 'Finance' },
  { query: 'financial analyst', category: 'Finance' },

  // HR
  { query: 'hr intern', category: 'HR' },
  { query: 'recruiter', category: 'HR' },
  { query: 'hr generalist', category: 'HR' },
  { query: 'talent acquisition', category: 'HR' },

  // Design
  { query: 'graphic designer', category: 'Design' },
  { query: 'ui ux designer', category: 'Design' },
  { query: 'product designer intern', category: 'Design' },

  // Operations
  { query: 'operations executive', category: 'Operations' },
  { query: 'supply chain intern', category: 'Operations' },
  { query: 'project coordinator', category: 'Operations' },

  // Data & Analytics
  { query: 'data analyst', category: 'Data & Analytics' },
  { query: 'data entry', category: 'Data & Analytics' },
  { query: 'research analyst', category: 'Data & Analytics' },
  { query: 'mis executive', category: 'Data & Analytics' },
];

const RESULTS_PER_PAGE = 15;

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

// ─── Category Inference ───────────────────────────────────────────────────────

/**
 * Infers a standard career category from title and description keywords.
 * Used as fallback or validation when mapping external jobs.
 *
 * @param {string} [title='']
 * @param {string} [description='']
 * @returns {'Technology' | 'Marketing' | 'Sales & Business' | 'Finance' | 'HR' | 'Design' | 'Operations' | 'Data & Analytics' | 'Other'}
 */
const inferCategory = (title = '', description = '') => {
  const t = title.toLowerCase();
  const full = `${title} ${description}`.toLowerCase();

  // 1. Title-first high-precision matching
  if (/\b(ui.?ux|graphic design(er)?|product design(er)?|figma|illustrator|photoshop|visual design(er)?|animator|motion design|creative director)\b/i.test(t)) {
    return 'Design';
  }
  if (/\b(hr\b|human resources|recruiter|talent acquisition|recruitment|people ops|talent management|hr generalist|hr executive)\b/i.test(t)) {
    return 'HR';
  }
  if (/\b(finance|accountant|accounts? executive|auditor|financial analyst|taxation|tally|bookkeeper|audit|gst|accounts? assistant)\b/i.test(t)) {
    return 'Finance';
  }
  if (/\b(marketing|seo|sem|social media|content writer|copywriter|brand manager|growth hacker|digital marketing|brand marketing)\b/i.test(t)) {
    return 'Marketing';
  }
  if (/\b(sales|business development|bde|bdr|account manager|client servicing|inside sales|relationship manager|telecaller)\b/i.test(t)) {
    return 'Sales & Business';
  }
  if (/\b(data analyst|analytics|data scientist|data engineer|business intelligence|bi analyst|mis executive|research analyst|data entry)\b/i.test(t)) {
    return 'Data & Analytics';
  }
  if (/\b(operations?|supply chain|logistics|inventory|procurement|project coordinator|facility|administrative|admin executive)\b/i.test(t)) {
    return 'Operations';
  }
  if (/\b(software|developer|engineer|full.?stack|backend|frontend|devops|qa\b|programmer|coder|cloud|node|react|java|python|system admin|web developer|ios|android)\b/i.test(t)) {
    return 'Technology';
  }

  // 2. Secondary fallback matching on full description text
  if (/\b(ui.?ux design|graphic design|figma|adobe photoshop)\b/i.test(full)) return 'Design';
  if (/\b(human resources|talent acquisition|employee onboarding)\b/i.test(full)) return 'HR';
  if (/\b(financial modeling|accounting principles|tally prime|financial reporting)\b/i.test(full)) return 'Finance';
  if (/\b(digital marketing|search engine optimization|content marketing|social media marketing)\b/i.test(full)) return 'Marketing';
  if (/\b(business development|b2b sales|lead generation|client acquisition)\b/i.test(full)) return 'Sales & Business';
  if (/\b(data analytics|data visualization|tableau dashboard|power bi report)\b/i.test(full)) return 'Data & Analytics';
  if (/\b(supply chain management|logistics operations|procurement management)\b/i.test(full)) return 'Operations';
  if (/\b(software development|web application|database design|programming)\b/i.test(full)) return 'Technology';

  return 'Other';
};

// ─── Job Mapping ───────────────────────────────────────────────────────────────

/**
 * Maps a single raw Adzuna job object to the CareerLens Job schema shape.
 *
 * @param {Object} raw - Raw Adzuna API job object
 * @param {string} [assignedCategory] - Explicit category from the query config
 * @param {string} [country] - Adzuna country code used for this query (e.g. 'in')
 * @returns {Object} CareerLens-shaped job document (not yet saved)
 */
const mapAdzunaJob = (raw, assignedCategory = null, country = 'in') => {
  const title = stripHtml(raw.title || '');
  const description = stripHtml(raw.description || 'No description provided.');
  // Use 'Confidential' as fallback — industry standard for employers who hide their name
  const company = (raw.company && raw.company.display_name) || 'Confidential';
  const location = (raw.location && raw.location.display_name) || 'India';

  const skills = extractSkills(`${title} ${description}`);
  const category = assignedCategory || inferCategory(title, description);
  const employmentType = mapEmploymentType({
    title,
    description,
    contract_time: raw.contract_time,
    contract_type: raw.contract_type,
  });
  const workArrangement = inferWorkArrangement({ title, description, location });
  const experienceRequired = inferExperience(title);

  // Derive currency from the country the query was run against
  const currency = COUNTRY_CURRENCY[country.toLowerCase()] || 'INR';

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
    category,
    employmentType,
    workArrangement,
    experienceRequired,
    skills,
    currency,
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
 * @param {string} opts.query       - Search keyword string (e.g. "digital marketing executive")
 * @param {string} [opts.category]  - Target category (e.g. "Marketing")
 * @param {string} [opts.appId]     - Adzuna app_id (defaults to ADZUNA_APP_ID env var)
 * @param {string} [opts.appKey]    - Adzuna app_key (defaults to ADZUNA_APP_KEY env var)
 * @param {string} [opts.country]   - ISO country code (defaults to ADZUNA_COUNTRY env var, fallback 'in')
 * @param {number} [opts.page]      - Page number (1-indexed, default 1)
 * @returns {Promise<{ jobs: Object[], apiCallsUsed: number }>}
 */
const fetchJobsForQuery = async ({
  query,
  category = null,
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

  console.log(`[JobFetcher] Fetching: "${query}" (category=${category || 'auto'}, country=${country}, page=${page})`);

  const { statusCode, body } = await getJson(url);

  if (statusCode !== 200) {
    throw new Error(
      `Adzuna API returned HTTP ${statusCode} for query "${query}". ` +
        `Response: ${JSON.stringify(body).slice(0, 300)}`
    );
  }

  const rawJobs = body.results || [];
  const jobs = rawJobs.map((raw) => mapAdzunaJob(raw, category, country));

  console.log(`[JobFetcher]   → ${jobs.length} jobs received for "${query}"`);
  return { jobs, apiCallsUsed: 1 };
};

/**
 * Fetches jobs for all default target queries across career categories.
 *
 * @param {Object} [opts] - Optional overrides (appId, appKey, country)
 * @returns {Promise<{ jobs: Object[], totalApiCalls: number }>}
 */
const fetchAllJobs = async (opts = {}) => {
  let allJobs = [];
  let totalApiCalls = 0;

  for (const item of TARGET_QUERIES) {
    const query = typeof item === 'string' ? item : item.query;
    const category = typeof item === 'object' ? item.category : null;

    try {
      const { jobs, apiCallsUsed } = await fetchJobsForQuery({ query, category, ...opts });
      allJobs = allJobs.concat(jobs);
      totalApiCalls += apiCallsUsed;

      // Brief pause between requests to be a polite API client
      await new Promise((r) => setTimeout(r, 250));
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
  inferCategory,
  extractSkills,
  mapEmploymentType,
  inferExperience,
  stripHtml,
};
