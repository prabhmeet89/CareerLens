'use strict';
/**
 * fetchRealJobs.js — Populate CareerLens job database with real Adzuna listings
 *
 * Usage:
 *   npm run fetch:jobs           (from repo root or backend/)
 *   node scripts/fetchRealJobs.js
 *
 * Prerequisites:
 *   Set ADZUNA_APP_ID and ADZUNA_APP_KEY in backend/.env
 *   Get free credentials at: https://developer.adzuna.com
 *
 * Rate limit notes:
 *   - Adzuna free tier: 1,000 API calls/month
 *   - This script makes 7 calls per run (one per target query)
 *   - Safe to run ~142 times/month (~4-5x per day)
 *
 * Staleness strategy:
 *   - Adzuna jobs older than STALE_DAYS (default 30) are removed before insert
 *   - Fresh jobs are upserted by externalId (Adzuna's own job ID) to prevent duplicates
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const connectDB = require('../src/config/db');
const { fetchAllJobs } = require('../src/services/jobFetcher');

// Jobs older than this many days are pruned before each run
const STALE_DAYS = 30;

// ─── Deduplication ─────────────────────────────────────────────────────────────

/**
 * Deduplicates an array of job objects by their externalId field.
 * When the same Adzuna job ID appears across multiple queries, the first
 * occurrence wins.
 *
 * @param {Object[]} jobs
 * @returns {Object[]}
 */
const deduplicateByExternalId = (jobs) => {
  const seen = new Set();
  return jobs.filter((job) => {
    if (!job.externalId || seen.has(job.externalId)) return false;
    seen.add(job.externalId);
    return true;
  });
};

// ─── Main ──────────────────────────────────────────────────────────────────────

const fetchRealJobs = async () => {
  const startTime = Date.now();
  console.log('\n════════════════════════════════════════════════════');
  console.log('  CareerLens — Adzuna Job Fetch Script');
  console.log('════════════════════════════════════════════════════');

  // ── Validate credentials before touching the database ──
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY || 'in';

  if (!appId || appId === 'your_app_id_here' || !appKey || appKey === 'your_app_key_here') {
    console.error('\n❌  ERROR: Adzuna credentials are not set.');
    console.error('   Add ADZUNA_APP_ID and ADZUNA_APP_KEY to backend/.env');
    console.error('   Get free credentials at: https://developer.adzuna.com\n');
    process.exit(1);
  }

  console.log(`\n[Config] Country: ${country.toUpperCase()} | Stale window: ${STALE_DAYS} days`);

  // ── Connect to MongoDB ──
  console.log('\n[DB] Connecting to MongoDB...');
  const conn = await connectDB();
  if (!conn) {
    console.error('[DB] Failed to establish database connection.');
    process.exit(1);
  }

  // ── Prune stale Adzuna jobs ──
  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
  const pruneResult = await Job.deleteMany({
    source: 'adzuna',
    postedAt: { $lt: cutoff },
  });
  if (pruneResult.deletedCount > 0) {
    console.log(`[Prune] Removed ${pruneResult.deletedCount} stale Adzuna jobs (older than ${STALE_DAYS} days)`);
  } else {
    console.log(`[Prune] No stale jobs to remove.`);
  }

  // ── Fetch from Adzuna ──
  console.log('\n[Fetch] Starting Adzuna API queries...');
  const { jobs: rawJobs, totalApiCalls } = await fetchAllJobs({ appId, appKey, country });

  console.log(`\n[Fetch] Total received: ${rawJobs.length} jobs across ${totalApiCalls} API call(s)`);

  // ── Deduplicate ──
  const uniqueJobs = deduplicateByExternalId(rawJobs);
  const duplicatesDropped = rawJobs.length - uniqueJobs.length;
  console.log(`[Dedup] Unique jobs after dedup: ${uniqueJobs.length} (dropped ${duplicatesDropped} cross-query duplicates)`);

  if (uniqueJobs.length === 0) {
    console.warn('\n⚠️  No jobs to insert. Check your Adzuna credentials and country setting.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Upsert into MongoDB ──
  console.log('\n[DB] Upserting jobs into MongoDB...');

  const bulkOps = uniqueJobs.map((job) => ({
    updateOne: {
      filter: { externalId: job.externalId },
      update: { $set: job },
      upsert: true,
    },
  }));

  const bulkResult = await Job.bulkWrite(bulkOps, { ordered: false });

  const upserted = bulkResult.upsertedCount || 0;
  const modified = bulkResult.modifiedCount || 0;

  // ── Summary ──
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n════════════════════════════════════════════════════');
  console.log('  ✅  Fetch Complete');
  console.log('════════════════════════════════════════════════════');
  console.log(`  Jobs fetched from Adzuna  : ${rawJobs.length}`);
  console.log(`  After deduplication       : ${uniqueJobs.length}`);
  console.log(`  New jobs inserted         : ${upserted}`);
  console.log(`  Existing jobs refreshed   : ${modified}`);
  console.log(`  API calls used this run   : ${totalApiCalls}`);
  console.log(`  Monthly budget remaining  : ~${1000 - totalApiCalls} calls (free tier = 1,000/month)`);
  console.log(`  Time elapsed              : ${elapsedSec}s`);
  console.log('════════════════════════════════════════════════════\n');

  // Print a couple of sample documents for verification
  const samples = await Job.find({ source: 'adzuna' })
    .sort({ postedAt: -1 })
    .limit(3)
    .select('title company location employmentType skills externalId')
    .lean();

  console.log('[Sample] Most recent Adzuna jobs in DB:');
  samples.forEach((j, i) => {
    console.log(`  ${i + 1}. [${j.employmentType}] ${j.title} @ ${j.company} — ${j.location}`);
    console.log(`     Skills: ${(j.skills || []).slice(0, 5).join(', ') || '(none extracted)'}`);
    console.log(`     externalId: ${j.externalId}`);
  });
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
};

fetchRealJobs().catch((err) => {
  console.error('\n[FetchRealJobs] Fatal error:', err.message);
  process.exit(1);
});
