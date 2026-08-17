const http = require('http');
const { seedJobs } = require('./scripts/seedJobs');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

const sendJsonRequest = (method, path, body = null, cookie = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (cookie) options.headers['Cookie'] = cookie;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          setCookie: res.headers['set-cookie'],
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runPhase4Tests = async () => {
  console.log('\n--- 🚀 Starting Resume2Role Phase 4 (AI Career Intelligence) Tests ---');

  // 1. Seed jobs into database
  console.log('\n[1] Seeding jobs into database...');
  await sendJsonRequest('POST', '/api/jobs/dev-seed');

  // 2. Register full-stack student and seed profile
  console.log('\n[2] Registering candidate and seeding profile...');
  const userRes = await sendJsonRequest('POST', '/api/auth/register', {
    name: 'Kai Thorne',
    email: `kai_${Date.now()}@stanford.edu`,
    password: 'password123',
  });
  const cookie = userRes.setCookie?.[0]?.split(';')[0];
  await sendJsonRequest('POST', '/api/profile/dev-seed', null, cookie);

  // 3. Fetch recommended jobs to pick a target job
  console.log('\n[3] Fetching candidate top recommended jobs...');
  const recRes = await sendJsonRequest('GET', '/api/jobs/recommended?limit=3', null, cookie);
  const targetJob = recRes.data?.data?.jobs?.[0];
  if (!targetJob) throw new Error('Failed to retrieve target job');

  const jobId = targetJob.id || targetJob._id;
  console.log(`Target Job: ${targetJob.title} @ ${targetJob.company} (Score: ${targetJob.match?.score}%)`);

  // 4. Test GET /api/jobs/:id/explain (Initial generation - uncached)
  console.log(`\n[4] Testing GET /api/jobs/${jobId}/explain (Initial AI Generation)...`);
  const explainRes1 = await sendJsonRequest('GET', `/api/jobs/${jobId}/explain`, null, cookie);
  console.log('Status:', explainRes1.status);
  console.log('Verdict:', explainRes1.data.data?.verdict);
  console.log('Strengths:', explainRes1.data.data?.strengths);
  console.log('Gaps:', explainRes1.data.data?.gaps);
  console.log('Cached:', explainRes1.data.data?.cached);

  if (explainRes1.status !== 200 || !explainRes1.data.data?.verdict || explainRes1.data.data?.cached !== false) {
    throw new Error('Initial match explanation generation failed or incorrectly marked cached');
  }
  console.log('✅ Initial AI match explanation generated and saved to MongoDB');

  // 5. Test GET /api/jobs/:id/explain (Second call - should hit cache)
  console.log(`\n[5] Testing GET /api/jobs/${jobId}/explain (Cache Hit Check)...`);
  const explainRes2 = await sendJsonRequest('GET', `/api/jobs/${jobId}/explain`, null, cookie);
  console.log('Status:', explainRes2.status, 'Cached:', explainRes2.data.data?.cached);
  if (explainRes2.status !== 200 || explainRes2.data.data?.cached !== true) {
    throw new Error('Expected explanation to be served directly from MongoDB cache');
  }
  console.log('✅ Match explanation successfully served from cache (Zero AI latency)');

  // 6. Test POST /api/jobs/:id/roadmap (AI Learning Roadmap generation)
  console.log(`\n[6] Testing POST /api/jobs/${jobId}/roadmap (Learning Roadmap Generation)...`);
  const roadmapRes1 = await sendJsonRequest('POST', `/api/jobs/${jobId}/roadmap`, {}, cookie);
  console.log('Status:', roadmapRes1.status);
  console.log('Total Weeks:', roadmapRes1.data.data?.totalWeeks);
  console.log('Week 1 Focus:', roadmapRes1.data.data?.weeks?.[0]?.focus);
  console.log('Week 1 Tasks:', roadmapRes1.data.data?.weeks?.[0]?.tasks);
  console.log('Cached:', roadmapRes1.data.data?.cached);

  if (roadmapRes1.status !== 200 || !roadmapRes1.data.data?.weeks?.length || roadmapRes1.data.data?.cached !== false) {
    throw new Error('Initial roadmap generation failed');
  }
  console.log('✅ AI Learning Roadmap generated with weekly action items and cached');

  // 7. Test GET /api/jobs/:id/roadmap (Roadmap Cache Hit Check)
  console.log(`\n[7] Testing GET /api/jobs/${jobId}/roadmap (Roadmap Cache Hit Check)...`);
  const roadmapRes2 = await sendJsonRequest('GET', `/api/jobs/${jobId}/roadmap`, null, cookie);
  console.log('Status:', roadmapRes2.status, 'Cached:', roadmapRes2.data.data?.cached);
  if (roadmapRes2.status !== 200 || roadmapRes2.data.data?.cached !== true) {
    throw new Error('Expected roadmap to be served from cache');
  }
  console.log('✅ Learning roadmap served directly from cache');

  // 8. Test Staleness Invalidation upon candidate resume update
  console.log('\n[8] Testing Staleness Invalidation on Resume Update...');
  // Sleep a brief moment then trigger dev-seed profile update
  await new Promise((r) => setTimeout(r, 100));
  await sendJsonRequest('POST', '/api/profile/dev-seed', null, cookie);

  const explainResStale = await sendJsonRequest('GET', `/api/jobs/${jobId}/explain`, null, cookie);
  console.log('Status after profile update:', explainResStale.status, 'Cached:', explainResStale.data.data?.cached);
  if (explainResStale.status !== 200 || explainResStale.data.data?.cached !== false) {
    throw new Error('Expected stale cache entry to be invalidated and regenerated on resume update');
  }
  console.log('✅ Stale cache entry detected and successfully regenerated');

  console.log('\n✨ ALL PHASE 4 BACKEND & AI CAREER INTELLIGENCE TESTS PASSED! ✨\n');
};

if (require.main === module) {
  runPhase4Tests().catch((err) => {
    console.error('\n❌ Phase 4 Test Error:', err);
    process.exit(1);
  });
}

module.exports = { runPhase4Tests };
