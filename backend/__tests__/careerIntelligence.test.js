const {
  fallbackHeuristicExplainer,
  stripMarkdownFences: stripExplainerFences,
  sanitizeExplanation,
} = require('../src/services/matchExplainer');

const {
  fallbackHeuristicRoadmap,
  stripMarkdownFences: stripRoadmapFences,
  sanitizeRoadmap,
} = require('../src/services/roadmapGenerator');

describe('AI Career Intelligence - Match Explainer', () => {
  test('strips markdown code fences properly', () => {
    const rawWithFences = '```json\n{"strengths": ["React expert"], "gaps": ["Docker"], "verdict": "Strong Candidate"}\n```';
    const cleaned = stripExplainerFences(rawWithFences);
    expect(cleaned).toBe('{"strengths": ["React expert"], "gaps": ["Docker"], "verdict": "Strong Candidate"}');
  });

  test('sanitizes explanation data structure', () => {
    const dirtyData = {
      strengths: ['  Solid full-stack skills  ', null, ''],
      gaps: ['  Needs AWS experience  '],
      verdict: '  Strong Candidate  ',
    };
    const sanitized = sanitizeExplanation(dirtyData);
    expect(sanitized.strengths).toEqual(['Solid full-stack skills']);
    expect(sanitized.gaps).toEqual(['Needs AWS experience']);
    expect(sanitized.verdict).toBe('Strong Candidate');
  });

  test('heuristic fallback generates specific bullets from candidate profile and job data', () => {
    const candidate = {
      skills: ['React', 'TypeScript', 'Node.js'],
      projects: [{ name: 'E-Commerce App', technologies: ['React', 'Node.js'] }],
      education: [{ degree: 'B.S.', field: 'Computer Science', institution: 'Stanford' }],
    };
    const job = {
      title: 'Full Stack Engineer',
      company: 'Stripe',
    };

    const explanation = fallbackHeuristicExplainer({
      candidateProfile: candidate,
      job,
      matchedSkills: ['React', 'Node.js'],
      missingSkills: ['PostgreSQL', 'Docker'],
      matchScore: 88,
    });

    expect(explanation.verdict).toBe('Strong Candidate');
    expect(explanation.strengths.length).toBeGreaterThan(0);
    expect(explanation.strengths.some((s) => s.includes('E-Commerce App'))).toBe(true);
    expect(explanation.gaps.some((g) => g.includes('PostgreSQL'))).toBe(true);
  });
});

describe('AI Career Intelligence - Roadmap Generator', () => {
  test('strips markdown code fences in roadmap responses', () => {
    const raw = '```\n{"totalWeeks": 4, "weeks": []}\n```';
    expect(stripRoadmapFences(raw)).toBe('{"totalWeeks": 4, "weeks": []}');
  });

  test('sanitizes roadmap data and caps max weeks at 6', () => {
    const rawRoadmap = {
      totalWeeks: 10,
      weeks: [
        { week: 1, focus: 'Docker', tasks: ['Task 1', 'Task 2'] },
        { week: 2, focus: 'Kubernetes', tasks: ['Task 3'] },
        { week: 3, focus: 'AWS', tasks: ['Task 4'] },
        { week: 4, focus: 'CI/CD', tasks: ['Task 5'] },
        { week: 5, focus: 'Terraform', tasks: ['Task 6'] },
        { week: 6, focus: 'Prometheus', tasks: ['Task 7'] },
        { week: 7, focus: 'Extra week', tasks: ['Task 8'] },
      ],
    };

    const sanitized = sanitizeRoadmap(rawRoadmap);
    expect(sanitized.weeks.length).toBe(6);
    expect(sanitized.weeks[0].focus).toBe('Docker');
    expect(sanitized.weeks[0].tasks.length).toBe(2);
  });

  test('heuristic fallback generates structured weekly action plan for missing skills', () => {
    const roadmap = fallbackHeuristicRoadmap({
      missingSkills: ['Docker', 'PostgreSQL', 'Kubernetes'],
      job: { title: 'Backend Engineer' },
    });

    expect(roadmap.totalWeeks).toBeGreaterThanOrEqual(3);
    expect(roadmap.weeks.length).toBeGreaterThanOrEqual(3);
    expect(roadmap.weeks[0].tasks.length).toBeGreaterThan(0);
    expect(roadmap.weeks[0].focus.toLowerCase()).toContain('docker');
  });
});
