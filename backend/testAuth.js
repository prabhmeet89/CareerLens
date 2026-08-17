const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

const request = (method, path, body = null, cookie = null) => {
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

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }

        const setCookie = res.headers['set-cookie'];
        resolve({
          status: res.statusCode,
          headers: res.headers,
          setCookie,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n--- 🧪 Starting Resume2Role Phase 1 Auth Tests ---');
  let authCookie = null;
  const testEmail = `test_${Date.now()}@university.edu`;
  const testPassword = 'password123';

  // 1. Health check
  console.log('\n[1] Testing GET /api/health');
  const healthRes = await request('GET', '/api/health');
  console.log('Status:', healthRes.status, 'Response:', healthRes.data);
  if (healthRes.status !== 200) throw new Error('Health check failed');

  // 2. Register new user
  console.log('\n[2] Testing POST /api/auth/register (New User)');
  const registerRes = await request('POST', '/api/auth/register', {
    name: 'Sarah Connor',
    email: testEmail,
    password: testPassword,
  });
  console.log('Status:', registerRes.status, 'Response:', registerRes.data);
  if (registerRes.status !== 201 || !registerRes.data.success) {
    throw new Error('User registration failed: ' + JSON.stringify(registerRes.data));
  }

  // Extract auth cookie
  const cookieHeader = registerRes.setCookie?.[0];
  if (cookieHeader && cookieHeader.includes('token=')) {
    authCookie = cookieHeader.split(';')[0];
    console.log('✅ Received HTTP-only session cookie:', authCookie.substring(0, 20) + '...');
  } else {
    throw new Error('Did not receive token cookie on register');
  }

  // 3. Register duplicate user (Expect 409)
  console.log('\n[3] Testing POST /api/auth/register (Duplicate Email)');
  const dupRes = await request('POST', '/api/auth/register', {
    name: 'Sarah Duplicate',
    email: testEmail,
    password: testPassword,
  });
  console.log('Status:', dupRes.status, 'Response:', dupRes.data);
  if (dupRes.status !== 409) throw new Error('Expected 409 Conflict for duplicate user');
  console.log('✅ Correctly rejected duplicate user registration');

  // 4. Verify GET /api/auth/me with session cookie
  console.log('\n[4] Testing GET /api/auth/me (Authenticated)');
  const meRes = await request('GET', '/api/auth/me', null, authCookie);
  console.log('Status:', meRes.status, 'Response:', meRes.data);
  if (meRes.status !== 200 || meRes.data.user?.email !== testEmail) {
    throw new Error('GET /api/auth/me verification failed');
  }
  console.log('✅ Successfully authenticated user:', meRes.data.user.name);

  // 5. Test Login (Success)
  console.log('\n[5] Testing POST /api/auth/login (Correct credentials)');
  const loginRes = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: testPassword,
  });
  console.log('Status:', loginRes.status, 'Response:', loginRes.data);
  if (loginRes.status !== 200 || !loginRes.data.success) {
    throw new Error('Login failed with valid credentials');
  }
  console.log('✅ Successfully logged in');

  // 6. Test Login (Wrong password)
  console.log('\n[6] Testing POST /api/auth/login (Wrong password)');
  const badLoginRes = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: 'wrongpassword',
  });
  console.log('Status:', badLoginRes.status, 'Response:', badLoginRes.data);
  if (badLoginRes.status !== 401) throw new Error('Expected 401 Unauthorized for wrong password');
  console.log('✅ Correctly rejected invalid login');

  // 7. Test Logout
  console.log('\n[7] Testing POST /api/auth/logout');
  const logoutRes = await request('POST', '/api/auth/logout', null, authCookie);
  console.log('Status:', logoutRes.status, 'Response:', logoutRes.data);
  if (logoutRes.status !== 200) throw new Error('Logout failed');
  console.log('✅ Successfully logged out and cleared cookie');

  // 8. Test GET /api/auth/me after logout (Expect 401)
  console.log('\n[8] Testing GET /api/auth/me without cookie (Unauthenticated)');
  const unauthMeRes = await request('GET', '/api/auth/me');
  console.log('Status:', unauthMeRes.status, 'Response:', unauthMeRes.data);
  if (unauthMeRes.status !== 401) throw new Error('Expected 401 Unauthorized without cookie');
  console.log('✅ Protected route correctly blocked unauthenticated request');

  console.log('\n✨ ALL PHASE 1 BACKEND AUTH TESTS PASSED SUCCESSFULLY! ✨\n');
};

module.exports = { runTests };

if (require.main === module) {
  runTests().catch((err) => {
    console.error('\n❌ Test Error:', err);
    process.exit(1);
  });
}
