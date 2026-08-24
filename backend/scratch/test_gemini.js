require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
console.log('Testing model:', modelName);
console.log('API Key present:', !!apiKey);

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.1,
  },
});

const sampleResumeText = `
John Doe
john.doe@example.com | github.com/johndoe
Stanford University, B.S. Computer Science, 2026

Skills: JavaScript, React, Node.js, Python, MongoDB, Docker, AWS, Git

Projects:
- CareerLens: Built AI-powered career matching platform using React, Node.js, MongoDB
- Portfolio Site: Personal site built with Next.js and TailwindCSS

Experience:
- Software Engineering Intern, Stripe, Summer 2025
`;

(async () => {
  try {
    // Test 1: Simple JSON generation
    console.log('\n--- Test 1: Basic JSON generation ---');
    const result1 = await model.generateContent('Return only this exact JSON: {"status":"ok","model":"working"}');
    console.log('SUCCESS:', result1.response.text().trim().slice(0, 200));

    // Test 2: Resume parsing (as aiResumeAnalyzer would call it)
    console.log('\n--- Test 2: Resume text parsing ---');
    const prompt = `Analyze this resume and return a JSON object with keys: skills (array), education (array of {degree, field, institution}), projects (array of {name, technologies, description}), experience (array of {role, company, duration}), preferredRoles (array). Resume:\n${sampleResumeText}`;
    const result2 = await model.generateContent(prompt);
    const raw = result2.response.text();
    const parsed = JSON.parse(raw);
    console.log('SUCCESS: Got', Object.keys(parsed).length, 'keys:', Object.keys(parsed).join(', '));
    console.log('Skills extracted:', (parsed.skills || []).slice(0, 4).join(', '));
    console.log('Education:', (parsed.education || []).map(e => e.institution).join(', '));

    // Test 3: Match explainer
    console.log('\n--- Test 3: Match explanation ---');
    const prompt3 = 'Return only: {"strengths":["Strong React expertise","Solid backend experience"],"gaps":["Needs Kubernetes"],"verdict":"Competitive Match"}';
    const result3 = await model.generateContent(prompt3);
    const parsed3 = JSON.parse(result3.response.text());
    console.log('SUCCESS: verdict =', parsed3.verdict, '| strengths:', parsed3.strengths?.length);

    // Test 4: Roadmap generator
    console.log('\n--- Test 4: Roadmap generation ---');
    const prompt4 = 'Return only: {"totalWeeks":3,"weeks":[{"week":1,"focus":"Docker Basics","tasks":["Install Docker","Build first container","Push to registry"]},{"week":2,"focus":"Kubernetes Intro","tasks":["Deploy a pod","Create a service","Scale deployments"]},{"week":3,"focus":"CI/CD with GitHub Actions","tasks":["Write a workflow","Run tests on push","Auto-deploy to staging"]}]}';
    const result4 = await model.generateContent(prompt4);
    const parsed4 = JSON.parse(result4.response.text());
    console.log('SUCCESS: totalWeeks =', parsed4.totalWeeks, '| weeks:', parsed4.weeks?.length);

    console.log('\n✅ All 4 tests passed! Model', modelName, 'is fully operational.');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
})();
