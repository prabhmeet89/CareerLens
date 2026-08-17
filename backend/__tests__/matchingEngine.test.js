const { calculateMatchScore } = require('../src/services/matchingEngine');
const { normalizeSkill, normalizeSkills } = require('../src/utils/normalizeSkills');

describe('Skill Normalization Utility', () => {
  test('normalizes varied skill aliases to canonical names', () => {
    expect(normalizeSkill('NodeJS')).toBe('node.js');
    expect(normalizeSkill('Node.js')).toBe('node.js');
    expect(normalizeSkill('ReactJS')).toBe('react');
    expect(normalizeSkill('React.js')).toBe('react');
    expect(normalizeSkill('Postgre SQL')).toBe('postgresql');
    expect(normalizeSkill('Postgres')).toBe('postgresql');
    expect(normalizeSkill('TypeScript')).toBe('typescript');
    expect(normalizeSkill('TS')).toBe('typescript');
    expect(normalizeSkill('AWS')).toBe('aws');
  });

  test('normalizes array of skills removing duplicates', () => {
    const raw = ['React', 'React.js', 'node', 'Node.js', 'TypeScript', 'TS', ''];
    const normalized = normalizeSkills(raw);
    expect(normalized).toEqual(['react', 'node.js', 'typescript']);
  });
});

describe('Matching Engine - calculateMatchScore', () => {
  const fullCandidate = {
    skills: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Docker', 'AWS'],
    projects: [
      {
        name: 'Full Stack App',
        technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        description: 'Built a scalable e-commerce application',
      },
    ],
    experience: [
      {
        role: 'Software Engineer Intern',
        company: 'Tech Corp',
        duration: 'Summer 2025 (3 mos)',
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'Stanford University',
      },
    ],
    location: 'San Francisco, CA',
  };

  test('returns 100 score for a perfect skill & project match on Remote job', () => {
    const job = {
      title: 'Full Stack Developer Intern',
      company: 'Stripe',
      location: 'Remote',
      employmentType: 'internship',
      experienceRequired: '0-1 years',
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    };

    const result = calculateMatchScore(fullCandidate, job);

    expect(result.score).toBe(100);
    expect(result.matchedSkills).toEqual(['React', 'TypeScript', 'Node.js', 'PostgreSQL']);
    expect(result.missingSkills).toEqual([]);
    expect(result.breakdown.skillsScore).toBe(50);
    expect(result.breakdown.projectsScore).toBe(20);
    expect(result.breakdown.experienceScore).toBe(15);
    expect(result.breakdown.educationScore).toBe(10);
    expect(result.breakdown.locationScore).toBe(5);
  });

  test('correctly handles skill aliases and partial matches', () => {
    const candidate = {
      skills: ['ReactJS', 'NodeJS', 'Python'], // Aliases
      projects: [],
      experience: [],
      education: [{ degree: 'B.S.', field: 'Software Engineering' }],
    };

    const job = {
      title: 'Full Stack Engineer',
      company: 'Notion',
      location: 'Remote',
      employmentType: 'full-time',
      experienceRequired: '0-1 years',
      skills: ['React', 'Node.js', 'Go', 'Kubernetes'], // 2 matched, 2 missing
    };

    const result = calculateMatchScore(candidate, job);

    expect(result.matchedSkills).toEqual(['React', 'Node.js']);
    expect(result.missingSkills).toEqual(['Go', 'Kubernetes']);
    expect(result.breakdown.skillsScore).toBe(25); // (2/4) * 50 = 25
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  test('does not penalize students for 0-1 year or internship roles when they have no experience entries', () => {
    const studentCandidate = {
      skills: ['React', 'TypeScript'],
      projects: [{ technologies: ['React', 'TypeScript'] }],
      experience: [], // No formal work experience
      education: [{ degree: 'B.S.', field: 'Computer Science' }],
    };

    const entryJob = {
      title: 'Frontend Developer Intern',
      employmentType: 'internship',
      experienceRequired: '0-1 years',
      skills: ['React', 'TypeScript'],
      location: 'Remote',
    };

    const result = calculateMatchScore(studentCandidate, entryJob);

    // Full 15 experience points awarded for internship / entry role
    expect(result.breakdown.experienceScore).toBe(15);
    expect(result.score).toBe(100);
  });

  test('handles empty job skills array gracefully without crashing or returning NaN', () => {
    const candidate = {
      skills: ['Python', 'SQL'],
      projects: [],
      experience: [],
      education: [],
    };

    const jobWithoutSkills = {
      title: 'General Technologist',
      skills: [],
      location: 'Remote',
    };

    const result = calculateMatchScore(candidate, jobWithoutSkills);

    expect(Number.isNaN(result.score)).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual([]);
  });

  test('handles null or empty candidate profile safely', () => {
    const job = {
      title: 'Backend Engineer',
      skills: ['Java', 'Spring Boot', 'SQL'],
      location: 'Remote',
    };

    const result = calculateMatchScore(null, job);

    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual(['Java', 'Spring Boot', 'SQL']);
    expect(result.breakdown.skillsScore).toBe(0);
    expect(typeof result.score).toBe('number');
  });
});
