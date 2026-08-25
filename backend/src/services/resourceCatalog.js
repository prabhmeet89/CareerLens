'use strict';

/**
 * Curated, authoritative resource catalog for common technical skills and developer topics.
 * Every entry points to official documentation, standard specifications, or reputable tutorials.
 */
const RESOURCE_CATALOG = {
  react: [
    {
      title: 'React Official Documentation',
      url: 'https://react.dev/learn',
      type: 'documentation',
      domain: 'react.dev',
    },
    {
      title: 'MDN: Getting Started with React',
      url: 'https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started',
      type: 'guide',
      domain: 'developer.mozilla.org',
    },
  ],
  typescript: [
    {
      title: 'TypeScript Handbook for Developers',
      url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
      type: 'documentation',
      domain: 'typescriptlang.org',
    },
    {
      title: 'Total TypeScript Essentials',
      url: 'https://www.totaltypescript.com/tutorials',
      type: 'tutorial',
      domain: 'totaltypescript.com',
    },
  ],
  'node.js': [
    {
      title: 'Node.js Official Developer Guides',
      url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
      type: 'documentation',
      domain: 'nodejs.org',
    },
  ],
  nodejs: [
    {
      title: 'Node.js Official Developer Guides',
      url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
      type: 'documentation',
      domain: 'nodejs.org',
    },
  ],
  docker: [
    {
      title: 'Docker Official Getting Started Guide',
      url: 'https://docs.docker.com/get-started/',
      type: 'documentation',
      domain: 'docs.docker.com',
    },
  ],
  kubernetes: [
    {
      title: 'Kubernetes Official Basics Tutorial',
      url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
      type: 'documentation',
      domain: 'kubernetes.io',
    },
  ],
  aws: [
    {
      title: 'AWS Fundamentals & Cloud Practitioner Guide',
      url: 'https://aws.amazon.com/getting-started/',
      type: 'documentation',
      domain: 'aws.amazon.com',
    },
  ],
  postgresql: [
    {
      title: 'PostgreSQL Official Tutorial & Manual',
      url: 'https://www.postgresql.org/docs/current/tutorial.html',
      type: 'documentation',
      domain: 'postgresql.org',
    },
  ],
  sql: [
    {
      title: 'SQL Tutorial & Relational Database Concepts',
      url: 'https://developer.mozilla.org/en-US/docs/Glossary/SQL',
      type: 'guide',
      domain: 'developer.mozilla.org',
    },
  ],
  mongodb: [
    {
      title: 'MongoDB University & Developer Manual',
      url: 'https://www.mongodb.com/docs/manual/tutorial/getting-started/',
      type: 'documentation',
      domain: 'mongodb.com',
    },
  ],
  python: [
    {
      title: 'The Python Official Tutorial',
      url: 'https://docs.python.org/3/tutorial/',
      type: 'documentation',
      domain: 'docs.python.org',
    },
  ],
  graphql: [
    {
      title: 'Introduction to GraphQL',
      url: 'https://graphql.org/learn/',
      type: 'documentation',
      domain: 'graphql.org',
    },
  ],
  git: [
    {
      title: 'Pro Git Book & Official Reference',
      url: 'https://git-scm.com/doc',
      type: 'documentation',
      domain: 'git-scm.com',
    },
  ],
  testing: [
    {
      title: 'JavaScript Testing Fundamentals (Jest / Vitest)',
      url: 'https://jestjs.io/docs/getting-started',
      type: 'documentation',
      domain: 'jestjs.io',
    },
  ],
  'system design': [
    {
      title: 'System Design Primer (Open Source Architecture)',
      url: 'https://github.com/donnemartin/system-design-primer',
      type: 'guide',
      domain: 'github.com',
    },
  ],
  'ci/cd': [
    {
      title: 'GitHub Actions Documentation & Quickstart',
      url: 'https://docs.github.com/en/actions/quickstart',
      type: 'documentation',
      domain: 'docs.github.com',
    },
  ],
  redis: [
    {
      title: 'Redis Documentation & Quick Start',
      url: 'https://redis.io/docs/latest/',
      type: 'documentation',
      domain: 'redis.io',
    },
  ],
};

/**
 * Validates and normalizes external learning URLs.
 * Rejects javascript:, data:, file:, and invalid schemes.
 */
function validateAndNormalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return {
      url: parsed.href,
      domain: parsed.hostname.replace(/^www\./, ''),
    };
  } catch {
    return null;
  }
}

/**
 * Finds authoritative curated resources matching a skill keyword or topic.
 */
function getResourcesForSkill(skillName) {
  if (!skillName || typeof skillName !== 'string') return [];

  const normalized = skillName.trim().toLowerCase();

  // Direct match
  if (RESOURCE_CATALOG[normalized]) {
    return RESOURCE_CATALOG[normalized];
  }

  // Partial match
  for (const [key, resources] of Object.entries(RESOURCE_CATALOG)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return resources;
    }
  }

  // Generic MDN fallback for web technologies
  return [
    {
      title: `${skillName} Documentation on MDN Web Docs`,
      url: 'https://developer.mozilla.org/en-US/',
      type: 'documentation',
      domain: 'developer.mozilla.org',
    },
  ];
}

module.exports = {
  RESOURCE_CATALOG,
  validateAndNormalizeUrl,
  getResourcesForSkill,
};
