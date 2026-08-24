'use strict';
const { delCache } = require('../config/redis');

/**
 * Centralized Redis key builders.
 *
 * Keeping the key format in one place means a writer and an invalidator can
 * never drift apart — the recommendations cache previously went stale because
 * its key was built inline at the write site with no matching delete anywhere.
 */

/** Key for one page of a user's ranked recommendations. */
const recommendedKey = (userId, page, limit) => `recommended:${userId}:p${page}:l${limit}`;

/** Glob matching every cached recommendation page for a user. */
const recommendedPattern = (userId) => `recommended:${userId}:*`;

/**
 * Drop every cached recommendation page for a user.
 *
 * Call this whenever an input to match scoring or job decoration changes:
 * a re-analyzed resume (new skills), a new application or a save/unsave
 * (both are embedded in the cached payload as alreadyApplied / isSaved).
 * Without it the 2-minute TTL keeps serving rankings built from the old
 * profile. Best-effort — a cache failure must never fail the request.
 *
 * @param {string} userId
 */
async function invalidateRecommendations(userId) {
  if (!userId) return;
  try {
    await delCache(recommendedPattern(userId));
  } catch (err) {
    console.warn(`[Cache] Failed to invalidate recommendations for ${userId}: ${err.message}`);
  }
}

module.exports = {
  recommendedKey,
  recommendedPattern,
  invalidateRecommendations,
};
