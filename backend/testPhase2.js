const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper function to create a valid minimal PDF buffer with embedded text
const createSamplePDFBuffer = (name, textContent) => {
  const content = `BT /F1 12 Tf 50 750 Td (${name} Resume) Tj ET
BT /F1 10 Tf 50 720 Td (${textContent.replace(/[()]/g, '')}) Tj ET`;
  
  const contentStream = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  
  const body = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj
${contentStream}
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000340 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
420
%%EOF`;

  return Buffer.from(body, 'utf-8');
};

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

const uploadMultipart = (path, fileName, fileBuffer, mimeType, cookie = null) => {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const url = new URL(path, BASE_URL);

    let headerPart = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    let footerPart = Buffer.from(`\r\n--${boundary}--\r\n`);
    let fullPayload = Buffer.concat([headerPart, fileBuffer, footerPart]);

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullPayload.length,
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
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.write(fullPayload);
    req.end();
  });
};

const runPhase2Tests = async () => {
  console.log('\n--- 🚀 Starting CareerLens Phase 2 (Resume Upload & AI Profile) Tests ---');
  let authCookie = null;
  const testEmail = `student_${Date.now()}@university.edu`;
  const testPassword = 'password123';

  // 1. Register User
  console.log('\n[1] Registering test student user');
  const regRes = await sendJsonRequest('POST', '/api/auth/register', {
    name: 'Elena Rostova',
    email: testEmail,
    password: testPassword,
  });
  if (regRes.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(regRes.data));
  authCookie = regRes.setCookie?.[0]?.split(';')[0];
  console.log('✅ Registered and got auth cookie:', authCookie.substring(0, 25) + '...');

  // 2. Fetch Profile before upload (Expect null)
  console.log('\n[2] Testing GET /api/profile/me before resume upload');
  const initialProfile = await sendJsonRequest('GET', '/api/profile/me', null, authCookie);
  console.log('Status:', initialProfile.status, 'Response:', initialProfile.data);
  if (initialProfile.status !== 200 || initialProfile.data.data !== null) {
    throw new Error('Expected profile to be null before upload');
  }
  console.log('✅ Confirmed profile is empty prior to upload');

  // 3. Reject non-PDF upload
  console.log('\n[3] Testing rejection of non-PDF upload (.txt)');
  const fakeTxtBuffer = Buffer.from('This is a text file, not a PDF');
  const badUpload = await uploadMultipart(
    '/api/resume/upload',
    'resume.txt',
    fakeTxtBuffer,
    'text/plain',
    authCookie
  );
  console.log('Status:', badUpload.status, 'Response:', badUpload.data);
  if (badUpload.status !== 400 || badUpload.data.success !== false) {
    throw new Error('Expected 400 rejection for non-PDF file');
  }
  console.log('✅ Correctly rejected invalid file MIME type');

  // 4. Upload valid PDF Resume
  console.log('\n[4] Testing POST /api/resume/upload (Valid PDF)');
  const samplePdf = createSamplePDFBuffer(
    'Elena Rostova',
    'Computer Science Student at Stanford. Skills: React, TypeScript, Node.js, Python, Docker, MongoDB. Project: E-Commerce Platform using React and Node.js. Experience: Software Engineer Intern at Tech Corp.'
  );
  const uploadRes = await uploadMultipart(
    '/api/resume/upload',
    'Elena_Rostova_Resume.pdf',
    samplePdf,
    'application/pdf',
    authCookie
  );
  console.log('Status:', uploadRes.status, 'Response:', uploadRes.data);
  if (uploadRes.status !== 201 || !uploadRes.data.data?.resumeId) {
    throw new Error('Resume upload failed: ' + JSON.stringify(uploadRes.data));
  }
  const resumeId = uploadRes.data.data.resumeId;
  console.log('✅ Successfully uploaded resume with ID:', resumeId);

  // 5. Test Resume Status Endpoint
  console.log(`\n[5] Testing GET /api/resume/${resumeId}/status`);
  const statusRes = await sendJsonRequest('GET', `/api/resume/${resumeId}/status`, null, authCookie);
  console.log('Status:', statusRes.status, 'Response:', statusRes.data);
  if (statusRes.status !== 200 || statusRes.data.data?.status !== 'pending') {
    throw new Error('Expected initial resume status to be pending');
  }
  console.log('✅ Verified initial resume status: pending');

  // 6. Test AI Analyze Endpoint
  console.log(`\n[6] Testing POST /api/resume/${resumeId}/analyze (Text extraction & AI Pipeline)`);
  const analyzeRes = await sendJsonRequest('POST', `/api/resume/${resumeId}/analyze`, null, authCookie);
  console.log('Status:', analyzeRes.status, 'Response:', JSON.stringify(analyzeRes.data, null, 2));
  if (analyzeRes.status !== 200 || !analyzeRes.data.success) {
    throw new Error('AI analysis failed: ' + JSON.stringify(analyzeRes.data));
  }
  console.log('✅ AI analysis successfully extracted candidate profile!');

  // 7. Verify GET /api/profile/me returns populated CandidateProfile
  console.log('\n[7] Testing GET /api/profile/me (Populated Candidate Profile)');
  const populatedProfile = await sendJsonRequest('GET', '/api/profile/me', null, authCookie);
  console.log('Status:', populatedProfile.status);
  const profile = populatedProfile.data?.data;
  console.log('Profile Skills:', profile?.skills);
  console.log('Profile Education:', profile?.education);
  console.log('Profile Projects:', profile?.projects?.length, 'project(s)');
  console.log('Profile Experience:', profile?.experience);
  console.log('Profile Preferred Roles:', profile?.preferredRoles);

  if (!profile || !profile.skills || profile.skills.length === 0) {
    throw new Error('Expected populated profile with extracted skills');
  }
  console.log('✅ Candidate profile verified in database with populated resume details');

  // 8. Re-upload / Update Resume Test
  console.log('\n[8] Testing re-upload / profile update flow');
  const secondPdf = createSamplePDFBuffer(
    'Elena Rostova',
    'Senior CS Major. Skills: Go, Kubernetes, AWS, PostgreSQL, GraphQL, Python. Experience: Backend Intern at Cloud Solutions.'
  );
  const secondUpload = await uploadMultipart(
    '/api/resume/upload',
    'Elena_Updated_Resume.pdf',
    secondPdf,
    'application/pdf',
    authCookie
  );
  const secondResumeId = secondUpload.data?.data?.resumeId;
  const secondAnalyze = await sendJsonRequest('POST', `/api/resume/${secondResumeId}/analyze`, null, authCookie);
  if (secondAnalyze.status !== 200) {
    throw new Error('Re-upload analysis failed');
  }
  console.log('✅ Successfully updated candidate profile with new resume');

  console.log('\n✨ ALL PHASE 2 BACKEND ENDPOINTS & AI EXTRACTION TESTS PASSED! ✨\n');
};

if (require.main === module) {
  runPhase2Tests().catch((err) => {
    console.error('\n❌ Phase 2 Test Error:', err);
    process.exit(1);
  });
}

module.exports = { runPhase2Tests };
