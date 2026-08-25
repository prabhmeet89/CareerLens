const {
  fallbackHeuristicExplainer,
  stripMarkdownFences: stripExplainerFences,
  sanitizeExplanation,
  AI_DISCLOSURE,
} = require('../src/services/matchExplainer');

const {
  fallbackHeuristicRoadmap,
  stripMarkdownFences: stripRoadmapFences,
  sanitizeRoadmap,
} = require('../src/services/roadmapGenerator');

const {
  validateAndNormalizeUrl,
  getResourcesForSkill,
} = require('../src/services/resourceCatalog');

const {
  normalizeRoadmapWeeks,
  calculateRoadmapProgress,
} = require('../src/models/Roadmap');

describe('AI Career Intelligence - Match Explainer', () => {
  test('strips markdown code fences properly', () => {
    const rawWithFences = '```json\n{"strengths": ["React expert"], "gaps": ["Docker"], "verdict": "Strong Match"}\n```';
    const cleaned = stripExplainerFences(rawWithFences);
    expect(cleaned).toBe('{"strengths": ["React expert"], "gaps": ["Docker"], "verdict": "Strong Match"}');
  });

  test('sanitizes explanation data structure and attaches AI disclosure', () => {
    const dirtyData = {
      strengths: ['  Solid full-stack skills  ', null, ''],
      gaps: ['  Needs AWS experience  '],
      verdict: '  Strong Match  ',
    };
    const sanitized = sanitizeExplanation(dirtyData);
    expect(sanitized.strengths).toEqual(['Solid full-stack skills']);
    expect(sanitized.gaps).toEqual(['Needs AWS experience']);
    expect(sanitized.verdict).toBe('Strong Match');
    expect(sanitized.aiDisclaimer).toBe(AI_DISCLOSURE);
  });

  test('heuristic fallback generates unified score verdicts', () => {
    const candidate = {
      skills: ['React', 'TypeScript', 'Node.js'],
      projects: [{ name: 'E-Commerce App', technologies: ['React', 'Node.js'] }],
      education: [{ degree: 'B.S.', field: 'Computer Science', institution: 'Stanford' }],
    };
    const job = {
      title: 'Full Stack Engineer',
      company: 'Stripe',
    };

    const strongMatch = fallbackHeuristicExplainer({
      candidateProfile: candidate,
      job,
      matchedSkills: ['React', 'Node.js'],
      missingSkills: ['PostgreSQL', 'Docker'],
      matchScore: 88,
    });
    expect(strongMatch.verdict).toBe('Strong Match');

    const promisingMatch = fallbackHeuristicExplainer({
      candidateProfile: candidate,
      job,
      matchedSkills: ['React'],
      missingSkills: ['AWS', 'Docker', 'Kubernetes'],
      matchScore: 65,
    });
    expect(promisingMatch.verdict).toBe('Promising Match');

    const developingMatch = fallbackHeuristicExplainer({
      candidateProfile: { skills: [] },
      job,
      matchedSkills: [],
      missingSkills: ['C++', 'Rust', 'Assembly'],
      matchScore: 30,
    });
    expect(developingMatch.verdict).toBe('Needs Skill Development');
  });
});

describe('AI Career Intelligence - Resource Catalog & URL Validation', () => {
  test('validates safe http and https URLs and extracts domain', () => {
    const validHttps = validateAndNormalizeUrl('https://react.dev/learn');
    expect(validHttps).not.toBeNull();
    expect(validHttps.url).toBe('https://react.dev/learn');
    expect(validHttps.domain).toBe('react.dev');

    const validWithWww = validateAndNormalizeUrl('https://www.docker.com/get-started');
    expect(validWithWww.domain).toBe('docker.com');
  });

  test('rejects unsafe protocols like javascript:, data:, file:', () => {
    expect(validateAndNormalizeUrl('javascript:alert(1)')).toBeNull();
    expect(validateAndNormalizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(validateAndNormalizeUrl('file:///etc/passwd')).toBeNull();
    expect(validateAndNormalizeUrl('')).toBeNull();
    expect(validateAndNormalizeUrl(null)).toBeNull();
  });

  test('retrieves curated resources for common skills', () => {
    const reactResources = getResourcesForSkill('React');
    expect(reactResources.length).toBeGreaterThan(0);
    expect(reactResources[0].domain).toBe('react.dev');

    const dockerResources = getResourcesForSkill('Docker & Containers');
    expect(dockerResources.length).toBeGreaterThan(0);
    expect(dockerResources[0].url).toContain('docker.com');
  });
});

describe('AI Career Intelligence - Roadmap Generator & Sanitization', () => {
  test('strips markdown code fences in roadmap responses', () => {
    const raw = '```\n{"totalWeeks": 4, "weeks": []}\n```';
    expect(stripRoadmapFences(raw)).toBe('{"totalWeeks": 4, "weeks": []}');
  });

  test('sanitizes structured roadmap data, bounds minutes, and caps max weeks at 6', () => {
    const rawRoadmap = {
      totalWeeks: 10,
      weeks: [
        {
          week: 1,
          focus: 'Docker',
          tasks: [
            {
              title: 'Learn Dockerfile directives',
              estimatedMinutes: 9999, // Should clamp to 480
              resources: [{ url: 'https://docs.docker.com', title: 'Docker Docs' }],
            },
            {
              title: 'Build multi-stage image',
              estimatedMinutes: 5, // Should clamp to 15
              resources: [{ url: 'javascript:void(0)' }], // Should reject
            },
          ],
        },
        { week: 2, focus: 'Kubernetes', tasks: ['Legacy string task 1'] },
        { week: 3, focus: 'AWS', tasks: [] },
        { week: 4, focus: 'CI/CD', tasks: [] },
        { week: 5, focus: 'Terraform', tasks: [] },
        { week: 6, focus: 'Prometheus', tasks: [] },
        { week: 7, focus: 'Extra week', tasks: [] }, // Should drop
      ],
    };

    const sanitized = sanitizeRoadmap(rawRoadmap);
    expect(sanitized.weeks.length).toBe(6);
    expect(sanitized.weeks[0].focus).toBe('Docker');
    expect(sanitized.weeks[0].tasks.length).toBe(2);
    expect(sanitized.weeks[0].tasks[0].estimatedMinutes).toBe(480);
    expect(sanitized.weeks[0].tasks[1].estimatedMinutes).toBe(15);
    expect(sanitized.weeks[0].tasks[0].resources[0].domain).toBe('docs.docker.com');
  });

  test('preserves completed tasks across roadmap regeneration', () => {
    const previousTasks = [
      {
        taskId: 'w1_t0',
        title: 'Learn Dockerfile directives',
        completed: true,
        completedAt: new Date('2026-08-20T10:00:00Z'),
      },
    ];

    const rawNewRoadmap = {
      totalWeeks: 4,
      weeks: [
        {
          week: 1,
          focus: 'Docker Fundamentals',
          tasks: [
            {
              taskId: 'w1_t0',
              title: 'Learn Dockerfile directives',
              estimatedMinutes: 60,
            },
            {
              taskId: 'w1_t1',
              title: 'Docker compose setup',
              estimatedMinutes: 90,
            },
          ],
        },
      ],
    };

    const sanitized = sanitizeRoadmap(rawNewRoadmap, previousTasks);
    expect(sanitized.weeks[0].tasks[0].completed).toBe(true);
    expect(sanitized.weeks[0].tasks[0].completedAt).toBeDefined();
    expect(sanitized.weeks[0].tasks[1].completed).toBe(false);
  });
});

describe('AI Career Intelligence - Roadmap Progress Math & Normalization', () => {
  test('normalizes legacy roadmap string tasks to structured tasks', () => {
    const legacyWeeks = [
      {
        week: 1,
        focus: 'React Basics',
        tasks: ['Build a todo app', 'Read React docs'],
      },
    ];

    const normalized = normalizeRoadmapWeeks(legacyWeeks);
    expect(normalized[0].tasks[0].taskId).toBe('w1_t0');
    expect(normalized[0].tasks[0].title).toBe('Build a todo app');
    expect(normalized[0].tasks[0].completed).toBe(false);
    expect(normalized[0].tasks[0].estimatedMinutes).toBe(60);
  });

  test('computes accurate weekly and overall progress percentages', () => {
    const weeks = [
      {
        week: 1,
        focus: 'Week 1',
        tasks: [
          { taskId: 'w1_t0', title: 'T1', completed: true, estimatedMinutes: 60 },
          { taskId: 'w1_t1', title: 'T2', completed: true, estimatedMinutes: 60 },
        ],
      },
      {
        week: 2,
        focus: 'Week 2',
        tasks: [
          { taskId: 'w2_t0', title: 'T3', completed: false, estimatedMinutes: 90 },
          { taskId: 'w2_t1', title: 'T4', completed: false, estimatedMinutes: 90 },
        ],
      },
    ];

    const { weeklyProgress, overallProgress } = calculateRoadmapProgress(weeks);

    expect(overallProgress.totalTasks).toBe(4);
    expect(overallProgress.completedTasks).toBe(2);
    expect(overallProgress.progressPercent).toBe(50);
    expect(overallProgress.estimatedRemainingMinutes).toBe(180);

    expect(weeklyProgress[0].progressPercent).toBe(100);
    expect(weeklyProgress[1].progressPercent).toBe(0);
  });
});
