/**
 * companyLogo.js
 *
 * Utility to derive a best-guess brand icon URL from a company name string.
 *
 * DuckDuckGo Icons API: https://icons.duckduckgo.com/ip3/{domain}.ico
 * - Free, public, privacy-focused icon endpoint
 * - Not blocked by browser tracking prevention (Edge Tracking Prevention, Safari ITP, ad-blockers)
 * - Returns the company's brand favicon / icon
 * - Returns a fallback default icon / 404 for unknown domains → triggers onError initials avatar
 *
 * The domain guesser works well for well-known companies and will miss smaller
 * regional/niche companies — that is expected and handled gracefully by the
 * fallback initials avatar in the UI.
 */

// ─── Override Table ───────────────────────────────────────────────────────────
// For companies where the brand name doesn't map cleanly to {name}.com, or
// where the guesser would produce a wrong/generic domain, hardcode the real one.
// Keys are lowercased and trimmed for matching.
const DOMAIN_OVERRIDES = {
  // Major Indian IT / conglomerates
  'infosys': 'infosys.com',
  'infosys bpo': 'infosys.com',
  'infosys bpm': 'infosys.com',
  'tata consultancy services': 'tcs.com',
  'tcs': 'tcs.com',
  'hcl technologies': 'hcltech.com',
  'hcl': 'hcltech.com',
  'wipro': 'wipro.com',
  'tech mahindra': 'techmahindra.com',
  'mahindra': 'mahindra.com',
  'reliance': 'ril.com',
  'reliance industries': 'ril.com',
  'larsen & toubro': 'larsentoubro.com',
  'l&t': 'larsentoubro.com',
  'bajaj auto': 'bajajauto.com',
  'bajaj finserv': 'bajajfinserv.in',
  'hdfc bank': 'hdfcbank.com',
  'icici bank': 'icicibank.com',
  'axis bank': 'axisbank.com',
  'state bank of india': 'sbi.co.in',
  'sbi': 'sbi.co.in',
  'flipkart': 'flipkart.com',
  'snapdeal': 'snapdeal.com',
  'zomato': 'zomato.com',
  'swiggy': 'swiggy.com',
  'ola': 'olacabs.com',
  'paytm': 'paytm.com',
  'razorpay': 'razorpay.com',
  'zerodha': 'zerodha.com',
  'groww': 'groww.in',
  'byju': 'byjus.com',
  'byjus': 'byjus.com',
  'unacademy': 'unacademy.com',
  'naukri': 'naukri.com',
  'freshworks': 'freshworks.com',
  'zoho': 'zoho.com',
  'mphasis': 'mphasis.com',
  'cognizant': 'cognizant.com',
  'capgemini': 'capgemini.com',

  // Global companies with non-obvious domains
  'google': 'google.com',
  'meta': 'meta.com',
  'facebook': 'facebook.com',
  'microsoft': 'microsoft.com',
  'amazon': 'amazon.com',
  'apple': 'apple.com',
  'netflix': 'netflix.com',
  'uber': 'uber.com',
  'airbnb': 'airbnb.com',
  'stripe': 'stripe.com',
  'shopify': 'shopify.com',
  'salesforce': 'salesforce.com',
  'oracle': 'oracle.com',
  'ibm': 'ibm.com',
  'accenture': 'accenture.com',
  'deloitte': 'deloitte.com',
  'pwc': 'pwc.com',
  'kpmg': 'kpmg.com',
  'ey': 'ey.com',
  'mckinsey': 'mckinsey.com',
  'jp morgan': 'jpmorgan.com',
  'jpmorgan': 'jpmorgan.com',
  'goldman sachs': 'goldmansachs.com',
  'deutsche bank': 'db.com',
  'bosch': 'bosch.com',
  'siemens': 'siemens.com',
  'check point software technologies': 'checkpoint.com',
  'checkpoint': 'checkpoint.com',
  'electronic arts': 'ea.com',
  'hp': 'hp.com',
  'dell': 'dell.com',
  'samsung': 'samsung.com',
  'sony': 'sony.com',
  'lg': 'lg.com',
  'intel': 'intel.com',
  'amd': 'amd.com',
  'qualcomm': 'qualcomm.com',
  'factset': 'factset.com',
  'factset research systems': 'factset.com',
  'retool': 'retool.com',
  'linear': 'linear.app',
  'notion': 'notion.so',
  'figma': 'figma.com',
  'scale ai': 'scale.com',
  'cloudflare': 'cloudflare.com',
};

// ─── Strip patterns ───────────────────────────────────────────────────────────
// Ordered most-specific first so compound suffixes match before their parts.
// IMPORTANT: Only put generic legal/descriptor words here — never brand names.
// Adding a brand name here will cause it to be stripped and produce an empty domain.
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
 *   1. Check DOMAIN_OVERRIDES for known companies (exact or prefix match)
 *   2. Strip known legal/descriptor suffixes
 *   3. Lowercase, remove non-alphanumeric, collapse spaces, append ".com"
 *
 * @param {string} companyName
 * @returns {string} best-guess domain, e.g. "stripe.com", or "" if not guessable
 */
export function guessCompanyDomain(companyName) {
  if (!companyName || typeof companyName !== 'string') return '';

  const normalized = companyName.trim().toLowerCase();

  // 1. Check override table (exact match)
  if (DOMAIN_OVERRIDES[normalized]) {
    return DOMAIN_OVERRIDES[normalized];
  }

  // 2. Check override table (prefix match — e.g. "Infosys BPM Limited" → infosys.com)
  for (const [key, domain] of Object.entries(DOMAIN_OVERRIDES)) {
    if (normalized.startsWith(key + ' ') || normalized.startsWith(key + ',')) {
      return domain;
    }
  }

  // 3. Fall back to suffix-stripping heuristic guesser
  let name = companyName.trim();

  for (const pattern of SUFFIX_PATTERNS) {
    name = name.replace(pattern, ' ').trim();
  }

  // Lowercase, remove everything except letters/digits/spaces, collapse spaces
  name = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .trim();

  if (!name) return '';

  return `${name}.com`;
}

/**
 * Returns the DuckDuckGo icon URL for a company name.
 * DuckDuckGo's public icon service is privacy-friendly and not blocked by tracking prevention.
 *
 * @param {string} companyName
 * @returns {string|null} DuckDuckGo icon URL or null
 */
export function getCompanyLogoUrl(companyName) {
  const domain = guessCompanyDomain(companyName);
  if (!domain) return null;
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

// Backward-compatible alias for existing imports
export const getClearbitLogoUrl = getCompanyLogoUrl;
export default getCompanyLogoUrl;
