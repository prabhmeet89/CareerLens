'use strict';
/**
 * backfillCurrency.js — One-time script to fix currency data on existing Adzuna jobs.
 *
 * What it does:
 *   1. Sets currency: 'INR' on all Adzuna-sourced jobs that are missing the field.
 *   2. Nullifies the salary field on jobs that still carry the old hardcoded
 *      '$80,000 - $110,000 / yr' default so the UI hides them instead of
 *      displaying a wrong-currency placeholder.
 *
 * Usage:
 *   node backend/scripts/backfillCurrency.js
 *
 * Safe to run multiple times — uses $set so it's idempotent.
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const connectDB = require('../src/config/db');

const run = async () => {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  CareerLens — Currency Backfill Script');
  console.log('════════════════════════════════════════════════════\n');

  console.log('[DB] Connecting to MongoDB...');
  const conn = await connectDB();
  if (!conn) {
    console.error('[DB] Failed to connect. Check MONGODB_URI in .env');
    process.exit(1);
  }

  // 1. Set currency: 'INR' on all Adzuna jobs missing the currency field
  const currencyResult = await Job.updateMany(
    { source: 'adzuna', currency: { $exists: false } },
    { $set: { currency: 'INR' } }
  );
  console.log(`[Backfill] Set currency='INR' on ${currencyResult.modifiedCount} jobs (was missing the field).`);

  // Also fix jobs that have currency but it's null/undefined
  const currencyNullResult = await Job.updateMany(
    { source: 'adzuna', $or: [{ currency: null }, { currency: '' }] },
    { $set: { currency: 'INR' } }
  );
  console.log(`[Backfill] Fixed null/empty currency on ${currencyNullResult.modifiedCount} additional jobs.`);

  // 2. Null out the hardcoded USD placeholder salary string
  const salaryResult = await Job.updateMany(
    { salary: '$80,000 - $110,000 / yr' },
    { $set: { salary: null } }
  );
  console.log(`[Backfill] Cleared hardcoded '$80,000 - $110,000 / yr' salary on ${salaryResult.modifiedCount} jobs.`);

  // 3. Summary
  const totalJobs = await Job.countDocuments({ source: 'adzuna' });
  const withSalary = await Job.countDocuments({ source: 'adzuna', salary: { $ne: null } });
  const withCurrency = await Job.countDocuments({ source: 'adzuna', currency: 'INR' });

  console.log('\n════════════════════════════════════════════════════');
  console.log('  Backfill Complete');
  console.log('════════════════════════════════════════════════════');
  console.log(`  Total Adzuna jobs in DB  : ${totalJobs}`);
  console.log(`  Jobs with salary string  : ${withSalary}`);
  console.log(`  Jobs with currency=INR   : ${withCurrency}`);
  console.log('════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[BackfillCurrency] Fatal error:', err.message);
  process.exit(1);
});
