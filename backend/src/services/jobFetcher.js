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
 * Curated career track queries with nationwide & major Indian employment hubs.
 * Covers Technology, Marketing, Sales & Business, Finance, HR, Design, Operations, Data & Analytics.
 */
const NATIONWIDE_QUERIES = [
  // Technology (Pages 1 & 2)
  { query: 'software engineer intern', category: 'Technology', maxPages: 2 },
  { query: 'full stack developer', category: 'Technology', maxPages: 2 },
  { query: 'backend developer', category: 'Technology', maxPages: 2 },
  { query: 'frontend developer', category: 'Technology', maxPages: 2 },
  { query: 'devops engineer', category: 'Technology', maxPages: 2 },
  { query: 'junior developer', category: 'Technology', maxPages: 2 },
  { query: 'qa engineer', category: 'Technology', maxPages: 2 },
  { query: 'mobile developer', category: 'Technology', maxPages: 2 },
  { query: 'python developer', category: 'Technology', maxPages: 2 },
  { query: 'java developer', category: 'Technology', maxPages: 2 },
  { query: 'react developer', category: 'Technology', maxPages: 2 },

  // Data & Analytics (Pages 1 & 2)
  { query: 'data analyst', category: 'Data & Analytics', maxPages: 2 },
  { query: 'data science intern', category: 'Data & Analytics', maxPages: 2 },
  { query: 'business intelligence analyst', category: 'Data & Analytics', maxPages: 2 },
  { query: 'research analyst', category: 'Data & Analytics', maxPages: 2 },
  { query: 'mis executive', category: 'Data & Analytics', maxPages: 2 },

  // Marketing (Pages 1 & 2)
  { query: 'digital marketing executive', category: 'Marketing', maxPages: 2 },
  { query: 'marketing intern', category: 'Marketing', maxPages: 2 },
  { query: 'seo specialist', category: 'Marketing', maxPages: 2 },
  { query: 'content marketing', category: 'Marketing', maxPages: 2 },
  { query: 'social media manager', category: 'Marketing', maxPages: 2 },
  { query: 'growth marketing', category: 'Marketing', maxPages: 2 },

  // Sales & Business (Pages 1 & 2)
  { query: 'business development executive', category: 'Sales & Business', maxPages: 2 },
  { query: 'sales intern', category: 'Sales & Business', maxPages: 2 },
  { query: 'account manager', category: 'Sales & Business', maxPages: 2 },
  { query: 'business analyst', category: 'Sales & Business', maxPages: 2 },
  { query: 'client relationship executive', category: 'Sales & Business', maxPages: 2 },

  // Finance (Pages 1 & 2)
  { query: 'finance intern', category: 'Finance', maxPages: 2 },
  { query: 'accounts executive', category: 'Finance', maxPages: 2 },
  { query: 'financial analyst', category: 'Finance', maxPages: 2 },
  { query: 'junior accountant', category: 'Finance', maxPages: 2 },

  // HR (Pages 1 & 2)
  { query: 'hr intern', category: 'HR', maxPages: 2 },
  { query: 'talent acquisition specialist', category: 'HR', maxPages: 2 },
  { query: 'hr generalist', category: 'HR', maxPages: 2 },
  { query: 'technical recruiter', category: 'HR', maxPages: 2 },

  // Design (Pages 1 & 2)
  { query: 'graphic designer', category: 'Design', maxPages: 2 },
  { query: 'ui ux designer', category: 'Design', maxPages: 2 },
  { query: 'product designer intern', category: 'Design', maxPages: 2 },
  { query: 'visual designer', category: 'Design', maxPages: 2 },

  // Operations (Pages 1 & 2)
  { query: 'operations executive', category: 'Operations', maxPages: 2 },
  { query: 'supply chain intern', category: 'Operations', maxPages: 2 },
  { query: 'project coordinator', category: 'Operations', maxPages: 2 },
  { query: 'logistics coordinator', category: 'Operations', maxPages: 2 },
];

const LOCATION_SCOPED_QUERIES = [
  // Bangalore (Silicon Valley of India — Tech & Product Hub)
  { query: 'software engineer', where: 'Bangalore', category: 'Technology', maxPages: 1 },
  { query: 'full stack developer', where: 'Bangalore', category: 'Technology', maxPages: 1 },
  { query: 'frontend developer', where: 'Bangalore', category: 'Technology', maxPages: 1 },
  { query: 'backend developer', where: 'Bangalore', category: 'Technology', maxPages: 1 },
  { query: 'data analyst', where: 'Bangalore', category: 'Data & Analytics', maxPages: 1 },
  { query: 'ui ux designer', where: 'Bangalore', category: 'Design', maxPages: 1 },
  { query: 'digital marketing', where: 'Bangalore', category: 'Marketing', maxPages: 1 },
  { query: 'hr executive', where: 'Bangalore', category: 'HR', maxPages: 1 },

  // Hyderabad (Cyberabad / Software & IT Services Hub)
  { query: 'software developer', where: 'Hyderabad', category: 'Technology', maxPages: 1 },
  { query: 'java developer', where: 'Hyderabad', category: 'Technology', maxPages: 1 },
  { query: 'devops engineer', where: 'Hyderabad', category: 'Technology', maxPages: 1 },
  { query: 'data analyst', where: 'Hyderabad', category: 'Data & Analytics', maxPages: 1 },
  { query: 'business analyst', where: 'Hyderabad', category: 'Sales & Business', maxPages: 1 },
  { query: 'qa tester', where: 'Hyderabad', category: 'Technology', maxPages: 1 },

  // Pune (IT, Tech & Analytics Hub)
  { query: 'software engineer', where: 'Pune', category: 'Technology', maxPages: 1 },
  { query: 'python developer', where: 'Pune', category: 'Technology', maxPages: 1 },
  { query: 'full stack developer', where: 'Pune', category: 'Technology', maxPages: 1 },
  { query: 'data analyst', where: 'Pune', category: 'Data & Analytics', maxPages: 1 },
  { query: 'ui designer', where: 'Pune', category: 'Design', maxPages: 1 },
  { query: 'operations executive', where: 'Pune', category: 'Operations', maxPages: 1 },

  // Mumbai (Financial & Commercial Capital)
  { query: 'financial analyst', where: 'Mumbai', category: 'Finance', maxPages: 1 },
  { query: 'investment banking intern', where: 'Mumbai', category: 'Finance', maxPages: 1 },
  { query: 'accounts executive', where: 'Mumbai', category: 'Finance', maxPages: 1 },
  { query: 'digital marketing', where: 'Mumbai', category: 'Marketing', maxPages: 1 },
  { query: 'brand manager', where: 'Mumbai', category: 'Marketing', maxPages: 1 },
  { query: 'business development', where: 'Mumbai', category: 'Sales & Business', maxPages: 1 },
  { query: 'data analyst', where: 'Mumbai', category: 'Data & Analytics', maxPages: 1 },
  { query: 'software engineer', where: 'Mumbai', category: 'Technology', maxPages: 1 },
  { query: 'hr recruiter', where: 'Mumbai', category: 'HR', maxPages: 1 },

  // Delhi / NCR (Gurgaon / Noida / Delhi - Startups, Tech & Corporate HQ)
  { query: 'software engineer', where: 'Gurgaon', category: 'Technology', maxPages: 1 },
  { query: 'backend engineer', where: 'Noida', category: 'Technology', maxPages: 1 },
  { query: 'business development executive', where: 'Delhi', category: 'Sales & Business', maxPages: 1 },
  { query: 'digital marketing executive', where: 'Delhi', category: 'Marketing', maxPages: 1 },
  { query: 'seo specialist', where: 'Noida', category: 'Marketing', maxPages: 1 },
  { query: 'content writer', where: 'Delhi', category: 'Marketing', maxPages: 1 },
  { query: 'data analyst', where: 'Gurgaon', category: 'Data & Analytics', maxPages: 1 },
  { query: 'graphic designer', where: 'Delhi', category: 'Design', maxPages: 1 },
  { query: 'operations coordinator', where: 'Gurgaon', category: 'Operations', maxPages: 1 },
  { query: 'talent acquisition', where: 'Delhi', category: 'HR', maxPages: 1 },

  // Chennai (SaaS, Automotive & IT Services Hub)
  { query: 'software engineer', where: 'Chennai', category: 'Technology', maxPages: 1 },
  { query: 'frontend developer', where: 'Chennai', category: 'Technology', maxPages: 1 },
  { query: 'data analyst', where: 'Chennai', category: 'Data & Analytics', maxPages: 1 },
  { query: 'hr executive', where: 'Chennai', category: 'HR', maxPages: 1 },
  { query: 'supply chain executive', where: 'Chennai', category: 'Operations', maxPages: 1 },

  // Kolkata (Eastern Hub)
  { query: 'software developer', where: 'Kolkata', category: 'Technology', maxPages: 1 },
  { query: 'digital marketing', where: 'Kolkata', category: 'Marketing', maxPages: 1 },
  { query: 'accounts executive', where: 'Kolkata', category: 'Finance', maxPages: 1 },
  { query: 'business development', where: 'Kolkata', category: 'Sales & Business', maxPages: 1 },

  // Ahmedabad (Gujarat Commercial Hub)
  { query: 'software engineer', where: 'Ahmedabad', category: 'Technology', maxPages: 1 },
  { query: 'web developer', where: 'Ahmedabad', category: 'Technology', maxPages: 1 },
  { query: 'digital marketing', where: 'Ahmedabad', category: 'Marketing', maxPages: 1 },
  { query: 'financial accountant', where: 'Ahmedabad', category: 'Finance', maxPages: 1 },
];

const TARGET_QUERIES = [...NATIONWIDE_QUERIES, ...LOCATION_SCOPED_QUERIES];

// Adzuna API max results per page (Adzuna supports up to 50)
const RESULTS_PER_PAGE = 50;

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
 * @param {string} opts.query       - Search keyword string (e.g. "software engineer")
 * @param {string} [opts.where]     - Location / city filter string (e.g. "Bangalore", "Mumbai")
 * @param {string} [opts.category]  - Target category (e.g. "Technology")
 * @param {string} [opts.appId]     - Adzuna app_id (defaults to ADZUNA_APP_ID env var)
 * @param {string} [opts.appKey]    - Adzuna app_key (defaults to ADZUNA_APP_KEY env var)
 * @param {string} [opts.country]   - ISO country code (defaults to ADZUNA_COUNTRY env var, fallback 'in')
 * @param {number} [opts.page]      - Page number (1-indexed, default 1)
 * @param {number} [opts.resultsPerPage] - Results per page (default RESULTS_PER_PAGE = 50)
 * @returns {Promise<{ jobs: Object[], apiCallsUsed: number, totalCount: number }>}
 */
const fetchJobsForQuery = async ({
  query,
  where = null,
  category = null,
  appId = process.env.ADZUNA_APP_ID,
  appKey = process.env.ADZUNA_APP_KEY,
  country = process.env.ADZUNA_COUNTRY || 'in',
  page = 1,
  resultsPerPage = RESULTS_PER_PAGE,
}) => {
  if (!appId || !appKey) {
    throw new Error(
      'Adzuna credentials are not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY in backend/.env.\n' +
        'Get a free key at: https://developer.adzuna.com'
    );
  }

  const encodedQuery = encodeURIComponent(query);
  let url =
    `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}` +
    `?app_id=${appId}&app_key=${appKey}` +
    `&results_per_page=${resultsPerPage}` +
    `&what=${encodedQuery}` +
    `&content-type=application/json`;

  if (where && where.trim()) {
    url += `&where=${encodeURIComponent(where.trim())}`;
  }

  const locLabel = where ? ` in ${where}` : ' (Nationwide)';
  console.log(`[JobFetcher] Fetching: "${query}"${locLabel} [p.${page}] (category=${category || 'auto'})`);

  const { statusCode, body } = await getJson(url);

  if (statusCode !== 200) {
    throw new Error(
      `Adzuna API returned HTTP ${statusCode} for query "${query}". ` +
        `Response: ${JSON.stringify(body).slice(0, 300)}`
    );
  }

  const rawJobs = body.results || [];
  const totalCount = typeof body.count === 'number' ? body.count : rawJobs.length;
  const jobs = rawJobs.map((raw) => mapAdzunaJob(raw, category, country));

  console.log(`[JobFetcher]   → ${jobs.length} jobs returned (total in Adzuna: ${totalCount})`);
  return { jobs, apiCallsUsed: 1, totalCount };
};

/**
 * Fetches jobs for all configured target queries across career categories and hubs.
 *
 * @param {Object} [opts] - Optional overrides (appId, appKey, country, maxCallsBudget)
 * @returns {Promise<{ jobs: Object[], totalApiCalls: number, plannedCalls: number }>}
 */
const fetchAllJobs = async (opts = {}) => {
  let allJobs = [];
  let totalApiCalls = 0;
  const maxCallsBudget = opts.maxCallsBudget || 200; // Safety cap to avoid exceeding free tier

  const queryList = opts.queries || TARGET_QUERIES;

  // Calculate planned calls
  const plannedCalls = queryList.reduce((sum, item) => sum + (item.maxPages || 1), 0);
  console.log(`[JobFetcher] Planned API calls: ${plannedCalls} across ${queryList.length} query configurations.`);

  for (const item of queryList) {
    if (totalApiCalls >= maxCallsBudget) {
      console.warn(`[JobFetcher] Reached maximum API calls budget cap (${maxCallsBudget}). Halting further queries.`);
      break;
    }

    const query = typeof item === 'string' ? item : item.query;
    const where = typeof item === 'object' ? item.where : null;
    const category = typeof item === 'object' ? item.category : null;
    const maxPages = typeof item === 'object' && item.maxPages ? item.maxPages : 1;

    for (let page = 1; page <= maxPages; page++) {
      if (totalApiCalls >= maxCallsBudget) break;

      try {
        const { jobs, apiCallsUsed, totalCount } = await fetchJobsForQuery({
          query,
          where,
          category,
          page,
          ...opts,
        });

        allJobs = allJobs.concat(jobs);
        totalApiCalls += apiCallsUsed;

        // If this page returned 0 jobs or fewer results than page limit, don't request next page
        if (jobs.length < RESULTS_PER_PAGE || jobs.length === 0) {
          break;
        }

        // Polite delay between requests
        await new Promise((r) => setTimeout(r, 250));
      } catch (err) {
        console.error(`[JobFetcher] Error on "${query}" (where=${where || 'all'}, p.${page}): ${err.message}`);
        break; // Skip to next query on error
      }
    }
  }

  return { jobs: allJobs, totalApiCalls, plannedCalls };
};

module.exports = {
  fetchJobsForQuery,
  fetchAllJobs,
  TARGET_QUERIES,
  NATIONWIDE_QUERIES,
  LOCATION_SCOPED_QUERIES,
  RESULTS_PER_PAGE,
  // Exported for testing
  mapAdzunaJob,
  inferCategory,
  extractSkills,
  mapEmploymentType,
  inferExperience,
  stripHtml,
};
