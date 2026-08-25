/**
 * Pure formatting and score classification helpers for Job Cards, Job Detail, and Roadmaps.
 */

/**
 * Generates up to two stable uppercase initials from a company name.
 * Handles single words, multi-words, and missing names safely.
 * Example: "Stripe" -> "S", "Acme Corp" -> "AC", "The Example Co" -> "EC"
 */
export function getCompanyInitials(companyName) {
  if (!companyName || typeof companyName !== 'string') {
    return 'CO';
  }

  const clean = companyName.trim();
  if (!clean) return 'CO';

  // Strip leading "The " for cleaner abbreviation if multiple words exist
  const normalized = clean.replace(/^the\s+/i, '');
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Formats a posted date into a safe, human-friendly relative string.
 * Examples: "Today", "1d ago", "3d ago", "2w ago", "1mo ago", "3mo ago"
 * Fallback to localized date string if older than 6 months or invalid.
 */
export function formatPostedDate(dateInput) {
  if (!dateInput) return null;

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Prevent negative future dates
    if (diffMs < 0) return 'Just now';

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffDays === 0) {
      if (diffHours === 0) {
        return diffMinutes <= 5 ? 'Just now' : `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 6) return `${diffMonths}mo ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

/**
 * Formats server generation timestamps into human-readable strings.
 * Examples: "Generated today", "Generated yesterday", "Generated 3d ago", "Generated Oct 12, 2026"
 */
export function formatGeneratedDate(dateInput) {
  if (!dateInput) return null;

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Generated today';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Generated today';
    if (diffDays === 1) return 'Generated yesterday';
    if (diffDays < 7) return `Generated ${diffDays}d ago`;

    return `Generated ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } catch {
    return null;
  }
}

/**
 * Formats duration in minutes into a human-readable estimate.
 * Examples: 45 -> "45 min", 60 -> "1 hr", 90 -> "1 hr 30 min", 120 -> "2 hrs"
 */
export function formatEstimatedMinutes(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
    return 'Time estimate unavailable';
  }

  const rounded = Math.round(minutes);
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;

  if (hrs === 0) return `~${mins} min`;
  if (mins === 0) return `~${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
  return `~${hrs} hr ${mins} min`;
}

/**
 * Normalizes employment type string for consistent title-case display.
 * Example: "full-time" -> "Full-time", "internship" -> "Internship"
 */
export function formatEmploymentType(type) {
  if (!type || typeof type !== 'string') return 'Full-time';

  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('-');
}

/**
 * Classifies deterministic match score into standard CareerLens status tiers:
 * - 75–100%: "Strong Match"
 * - 50–74%: "Promising Match"
 * - 0–49%: "Needs Skill Development"
 */
export function getScoreClassification(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    return null;
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  if (clamped >= 75) {
    return {
      tier: 'strong',
      score: clamped,
      label: 'Strong Match',
      explanation: "Your profile aligns with many of this role's listed signals.",
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    };
  }

  if (clamped >= 50) {
    return {
      tier: 'promising',
      score: clamped,
      label: 'Promising Match',
      explanation: 'You have relevant foundations, with some areas to strengthen.',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-700',
    };
  }

  return {
    tier: 'developing',
    score: clamped,
    label: 'Needs Skill Development',
    explanation: 'Several listed skills are not yet represented in your profile.',
    badgeBg: 'bg-blue-50 text-linkedin-blue border-blue-200',
    dotColor: 'bg-linkedin-blue',
    textColor: 'text-linkedin-blue',
  };
}

/**
 * Returns clean readiness score styling and accessible tooltip description.
 */
export function getReadinessClassification(readinessScore) {
  if (typeof readinessScore !== 'number' || isNaN(readinessScore)) {
    return null;
  }

  const clamped = Math.max(0, Math.min(100, Math.round(readinessScore)));

  if (clamped >= 75) {
    return {
      score: clamped,
      label: 'Ready',
      pillClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      tooltip: 'Readiness: 75%+ of listed technical requirements matched.',
    };
  }

  if (clamped >= 40) {
    return {
      score: clamped,
      label: 'Developing',
      pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
      tooltip: 'Readiness: Partially matches listed skills. Gaps can be bridged with a learning roadmap.',
    };
  }

  return {
    score: clamped,
    label: 'Early',
    pillClass: 'bg-gray-100 text-gray-700 border-gray-300',
    tooltip: 'Readiness: Foundational coverage of listed requirements.',
  };
}
