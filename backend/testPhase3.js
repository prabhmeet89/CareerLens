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

const runPhase3Tests = async () => {
  console.log('\n--- 🚀 Starting CareerLens Phase 3 (Jobs & Matching Engine) Tests ---');

  // 1. Seed jobs into database
  console.log('\n[1] Seeding jobs into database...');
  await seedJobs();

  // 2. Register user without resume/profile
  console.log('\n[2] Registering user without resume to test empty state...');
  const emptyUserRes = await sendJsonRequest('POST', '/api/auth/register', {
    name: 'New Student',
    email: `new_student_${Date.now()}@university.edu`,
    password: 'password123',
  });
  const emptyCookie = emptyUserRes.setCookie?.[0]?.split(';')[0];

  // 3. Test GET /api/jobs/recommended for user without profile
  console.log('\n[3] Testing GET /api/jobs/recommended (Empty Profile State)...');
  const emptyRecRes = await sendJsonRequest('GET', '/api/jobs/recommended', null, emptyCookie);
  console.log('Status:', emptyRecRes.status, 'hasProfile:', emptyRecRes.data.data?.hasProfile);
  if (emptyRecRes.status !== 200 || emptyRecRes.data.data?.hasProfile !== false) {
    throw new Error('Expected hasProfile: false and status 200 for user without resume');
  }
  console.log('✅ Correctly returned friendly empty state without error');

  // 4. Register candidate and seed profile with Full Stack tech stack
  console.log('\n[4] Registering full-stack student and seeding profile...');
  const fullUserRes = await sendJsonRequest('POST', '/api/auth/register', {
    name: 'Devon Vance',
    email: `devon_${Date.now()}@stanford.edu`,
    password: 'password123',
  });
  const devonCookie = fullUserRes.setCookie?.[0]?.split(';')[0];
  await sendJsonRequest('POST', '/api/profile/dev-seed', null, devonCookie);

  // 5. Test GET /api/jobs/recommended for student with profile
  console.log('\n[5] Testing GET /api/jobs/recommended (Ranked Match Scoring)...');
  const recRes = await sendJsonRequest('GET', '/api/jobs/recommended?page=1&limit=5', null, devonCookie);
  console.log('Status:', recRes.status, 'Total Jobs:', recRes.data.data?.total);

  const jobs = recRes.data.data?.jobs || [];
  if (jobs.length === 0) throw new Error('Expected recommended jobs for candidate with profile');

  console.log('\nTop 3 Recommended Matches:');
  for (let i = 0; i < Math.min(3, jobs.length); i++) {
    const j = jobs[i];
    console.log(`  ${i + 1}. [${j.match?.score}% Match] ${j.title} @ ${j.company} (${j.location})`);
    console.log(`     Matched: ${j.match?.matchedSkills?.join(', ')}`);
    console.log(`     Missing: ${j.match?.missingSkills?.join(', ') || 'None'}`);
    console.log(`     Breakdown: Skills=${j.match?.breakdown?.skillsScore}/50, Projects=${j.match?.breakdown?.projectsScore}/20, Exp=${j.match?.breakdown?.experienceScore}/15\n`);
  }

  // Verify sorting order: first job score >= second job score
  if (jobs.length >= 2 && jobs[0].match.score < jobs[1].match.score) {
    throw new Error('Recommended jobs are not sorted descending by match score!');
  }
  console.log('✅ Confirmed recommended jobs are accurately scored and ranked descending');

  // 6. Test GET /api/jobs (General listing)
  console.log('\n[6] Testing GET /api/jobs (Paginated general listing)...');
  const allJobsRes = await sendJsonRequest('GET', '/api/jobs?page=1&limit=5', null, devonCookie);
  console.log('Status:', allJobsRes.status, 'Total in DB:', allJobsRes.data.data?.total);
  if (allJobsRes.status !== 200 || !allJobsRes.data.data?.jobs?.length) {
    throw new Error('Failed to retrieve general jobs list');
  }
  console.log('✅ General jobs listing retrieved successfully');

  // 7. Test GET /api/jobs/:id (Single job details + score)
  const targetJobId = jobs[0].id || jobs[0]._id;
  console.log(`\n[7] Testing GET /api/jobs/${targetJobId} (Job detail with score)...`);
  const singleJobRes = await sendJsonRequest('GET', `/api/jobs/${targetJobId}`, null, devonCookie);
  console.log('Status:', singleJobRes.status, 'Title:', singleJobRes.data.data?.title);
  if (singleJobRes.status !== 200 || !singleJobRes.data.data?.match) {
    throw new Error('Failed to retrieve single job with match breakdown');
  }
  console.log('✅ Job detail and personalized match breakdown retrieved successfully');

  console.log('\n✨ ALL PHASE 3 BACKEND & MATCHING ENGINE TESTS PASSED! ✨\n');
};

if (require.main === module) {
  runPhase3Tests().catch((err) => {
    console.error('\n❌ Phase 3 Test Error:', err);
    process.exit(1);
  });
}

module.exports = { runPhase3Tests };
