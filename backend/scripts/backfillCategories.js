'use strict';
/**
 * backfillCategories.js — Backfill category for existing jobs in MongoDB
 *
 * Usage:
 *   node backend/scripts/backfillCategories.js
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const connectDB = require('../src/config/db');
const { inferCategory } = require('../src/services/jobFetcher');

const backfillCategories = async () => {
  console.log('\n[Backfill] Connecting to MongoDB...');
  const conn = await connectDB();
  if (!conn) {
    console.error('[Backfill] Failed to connect to MongoDB');
    process.exit(1);
  }

  const jobs = await Job.find({}).lean();
  console.log(`[Backfill] Found ${jobs.length} total jobs in database`);

  let updatedCount = 0;
  const bulkOps = [];

  for (const job of jobs) {
    const inferred = inferCategory(job.title, job.description);
    // If job has no category or is default 'Technology' but title suggests something else
    if (!job.category || (job.category === 'Technology' && inferred !== 'Technology' && inferred !== 'Other')) {
      bulkOps.push({
        updateOne: {
          filter: { _id: job._id },
          update: { $set: { category: inferred } },
        },
      });
      updatedCount++;
    } else if (!job.category) {
      bulkOps.push({
        updateOne: {
          filter: { _id: job._id },
          update: { $set: { category: 'Technology' } },
        },
      });
      updatedCount++;
    }
  }

  if (bulkOps.length > 0) {
    await Job.bulkWrite(bulkOps);
    console.log(`[Backfill] Successfully updated ${bulkOps.length} jobs with categories.`);
  } else {
    console.log('[Backfill] All jobs already have valid categories.');
  }

  const counts = await Job.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log('\n[Backfill] Current Category Distribution:');
  counts.forEach((c) => {
    console.log(`  • ${c._id || 'Unassigned'}: ${c.count} jobs`);
  });

  await mongoose.disconnect();
  console.log('\n[Backfill] Complete.\n');
  process.exit(0);
};

backfillCategories().catch((err) => {
  console.error('[Backfill] Error:', err);
  process.exit(1);
});
