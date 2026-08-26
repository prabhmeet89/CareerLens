/**
 * companyLogo.js
 *
 * Utility to derive a best-guess Clearbit logo URL from a company name string.
 *
 * Clearbit's free Logo API: https://logo.clearbit.com/{domain}
 * - No API key required
 * - Returns the company's logo image directly for known domains
 * - Returns a 404/broken image for unknown domains → trigger onError fallback
 *
 * The domain guesser works well for well-known tech companies (Google, Stripe,
 * Amazon, Atlassian, etc.) and will miss smaller/regional companies — that is
 * expected and handled gracefully by the fallback initials avatar in the UI.
 */

// ─── Strip patterns ───────────────────────────────────────────────────────────
// Ordered most-specific first so compound suffixes match before their parts.
// These are stripped from the end of the name (word-boundary aware).
const SUFFIX_PATTERNS = [
  // Compound Indian corporate suffixes
  /\bprivate\s+limited\b/gi,
  /\bpvt\.?\s+ltd\.?\b/gi,
  /\bpvt\s+limited\b/gi,

  // General legal suffixes
  /\bincorporated\b/gi,
  /\bcorporation\b/gi,
  /\bcorporate\b/gi,
  /\blimited\s+liability\s+company\b/gi,
  /\blimited\b/gi,
  /\bcorp\.?\b/gi,
  /\binc\.?\b/gi,
  /\bllc\.?\b/gi,
  /\bltd\.?\b/gi,
  /\bllp\.?\b/gi,
  /\bplc\.?\b/gi,

  // Common descriptor words that don't form part of the brand domain
  /\btechnologies\b/gi,
  /\btechnology\b/gi,
  /\bsolutions\b/gi,
  /\bsoftware\b/gi,
  /\bsystems\b/gi,
  /\bservices\b/gi,
  /\bservice\b/gi,
  /\bconsulting\b/gi,
  /\bconsultancy\b/gi,
  /\bdigital\b/gi,
  /\binnovations\b/gi,
  /\binnovation\b/gi,
  /\benterprises\b/gi,
  /\benterprise\b/gi,
  /\bventures\b/gi,
  /\bventure\b/gi,
  /\bglobal\b/gi,
  /\bworldwide\b/gi,
  /\binternational\b/gi,
  /\bgroup\b/gi,
  /\bholdings\b/gi,
  /\bholding\b/gi,
  /\bnetworks\b/gi,
  /\bnetwork\b/gi,
  /\binfosys\b/gi, // Infosys BPO → infosys (already a known domain)
  /\banalytics\b/gi,
  /\bstudio\b/gi,
  /\bstudios\b/gi,
  /\bproducts\b/gi,
  /\bplatform\b/gi,
  /\bplatforms\b/gi,
  /\bassociates\b/gi,
  /\bassociate\b/gi,
  /\bpartners\b/gi,
  /\bpartner\b/gi,
];

/**
 * Derives a best-guess domain from a company name string.
 *
 * Algorithm:
 *   1. Strip known legal/descriptor suffixes
 *   2. Lowercase
 *   3. Remove all non-alphanumeric characters
 *   4. Append ".com"
 *
 * Examples:
 *   "Stripe" → "stripe.com"
 *   "Google LLC" → "google.com"
 *   "Qadir IT Services Private Limited" → "qadirit.com"  (removes "Services Private Limited", keeps "Qadir IT")
 *   "Synapsica Technologies" → "synapsica.com"
 *   "Ace Analytics" → "ace.com"  (strips "Analytics")
 *   "Kuku FM" → "kukufm.com"
 *
 * @param {string} companyName
 * @returns {string} best-guess domain, e.g. "stripe.com"
 */
export function guessCompanyDomain(companyName) {
  if (!companyName || typeof companyName !== 'string') return '';

  let name = companyName.trim();

  // Strip all suffix patterns
  for (const pattern of SUFFIX_PATTERNS) {
    name = name.replace(pattern, ' ').trim();
  }

  // Lowercase, remove everything except letters, digits and spaces, collapse spaces
  name = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .trim();

  if (!name) return '';

  return `${name}.com`;
}

/**
 * Returns the full Clearbit logo URL for a company name.
 * If the domain guess is empty, returns null (use fallback immediately).
 *
 * @param {string} companyName
 * @returns {string|null} Clearbit logo URL or null
 */
export function getClearbitLogoUrl(companyName) {
  const domain = guessCompanyDomain(companyName);
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}
