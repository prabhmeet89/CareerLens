/**
 * Skill Normalization Utility
 * Maps various casing, spelling, and alias variations of technical skills
 * to their canonical lowercase representation.
 */

// Editable synonym dictionary mapping normalized aliases to canonical names
const SKILL_SYNONYMS = {
  // JavaScript & Runtimes
  'javascript': 'javascript',
  'js': 'javascript',
  'ecmascript': 'javascript',
  'es6': 'javascript',
  'node': 'node.js',
  'node.js': 'node.js',
  'nodejs': 'node.js',
  'node js': 'node.js',
  'typescript': 'typescript',
  'ts': 'typescript',

  // Frontend Frameworks & Libraries
  'react': 'react',
  'react.js': 'react',
  'reactjs': 'react',
  'react js': 'react',
  'react native': 'react native',
  'reactnative': 'react native',
  'next.js': 'next.js',
  'nextjs': 'next.js',
  'next': 'next.js',
  'vue': 'vue.js',
  'vue.js': 'vue.js',
  'vuejs': 'vue.js',
  'angular': 'angular',
  'angularjs': 'angular',
  'svelte': 'svelte',
  'sveltekit': 'sveltekit',

  // Styling & UI
  'tailwind': 'tailwind css',
  'tailwindcss': 'tailwind css',
  'tailwind css': 'tailwind css',
  'css': 'css',
  'css3': 'css',
  'html': 'html',
  'html5': 'html',
  'sass': 'sass',
  'scss': 'sass',
  'bootstrap': 'bootstrap',
  'material ui': 'material ui',
  'mui': 'material ui',

  // Backend Frameworks
  'express': 'express.js',
  'express.js': 'express.js',
  'expressjs': 'express.js',
  'nest.js': 'nestjs',
  'nestjs': 'nestjs',
  'fastapi': 'fastapi',
  'flask': 'flask',
  'django': 'django',
  'spring': 'spring boot',
  'spring boot': 'spring boot',
  'springboot': 'spring boot',
  'ruby on rails': 'ruby on rails',
  'rails': 'ruby on rails',

  // Databases
  'mongodb': 'mongodb',
  'mongo': 'mongodb',
  'mongo db': 'mongodb',
  'postgresql': 'postgresql',
  'postgres': 'postgresql',
  'postgre sql': 'postgresql',
  'mysql': 'mysql',
  'sqlite': 'sqlite',
  'redis': 'redis',
  'dynamodb': 'dynamodb',
  'cassandra': 'cassandra',
  'oracle': 'oracle sql',
  'sql': 'sql',
  'nosql': 'nosql',

  // Languages
  'python': 'python',
  'py': 'python',
  'java': 'java',
  'c++': 'c++',
  'cpp': 'c++',
  'c#': 'c#',
  'csharp': 'c#',
  'golang': 'go',
  'go': 'go',
  'rust': 'rust',
  'ruby': 'ruby',
  'php': 'php',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'dart': 'dart',

  // Cloud & DevOps
  'aws': 'aws',
  'amazon web services': 'aws',
  'gcp': 'gcp',
  'google cloud': 'gcp',
  'google cloud platform': 'gcp',
  'azure': 'azure',
  'microsoft azure': 'azure',
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  'terraform': 'terraform',
  'ansible': 'ansible',
  'ci/cd': 'ci/cd',
  'cicd': 'ci/cd',
  'github actions': 'github actions',
  'jenkins': 'jenkins',
  'linux': 'linux',
  'unix': 'linux',
  'bash': 'bash',
  'shell': 'bash',

  // AI / ML / Data
  'machine learning': 'machine learning',
  'ml': 'machine learning',
  'deep learning': 'deep learning',
  'ai': 'artificial intelligence',
  'artificial intelligence': 'artificial intelligence',
  'nlp': 'nlp',
  'natural language processing': 'nlp',
  'tensorflow': 'tensorflow',
  'pytorch': 'pytorch',
  'pandas': 'pandas',
  'numpy': 'numpy',
  'scikit-learn': 'scikit-learn',
  'scikit learn': 'scikit-learn',
  'sklearn': 'scikit-learn',
  'opencv': 'opencv',
  'tableau': 'tableau',
  'power bi': 'power bi',
  'powerbi': 'power bi',

  // Architecture & APIs
  'rest': 'rest apis',
  'rest api': 'rest apis',
  'rest apis': 'rest apis',
  'restful': 'rest apis',
  'restful apis': 'rest apis',
  'graphql': 'graphql',
  'grpc': 'grpc',
  'microservices': 'microservices',
  'git': 'git',
  'github': 'git',
  'gitlab': 'git',
};

/**
 * Normalizes a single skill string:
 * 1. Trims and lowercases
 * 2. Removes trailing punctuation / special chars where appropriate
 * 3. Resolves aliases from the synonym dictionary
 *
 * @param {string} skill - Raw skill name
 * @returns {string} Normalized canonical skill name
 */
const normalizeSkill = (skill) => {
  if (!skill || typeof skill !== 'string') return '';

  const clean = skill.trim().toLowerCase();
  if (!clean) return '';

  // Direct match in dictionary
  if (SKILL_SYNONYMS[clean]) {
    return SKILL_SYNONYMS[clean];
  }

  // Remove common punctuation suffixes (e.g. "React,", "Node.js:")
  const stripped = clean.replace(/[,;:]+$/, '').trim();
  if (SKILL_SYNONYMS[stripped]) {
    return SKILL_SYNONYMS[stripped];
  }

  return stripped;
};

/**
 * Normalizes an array of skills, removing duplicates and empty values.
 *
 * @param {Array<string>} skills - Array of raw skill strings
 * @returns {Array<string>} Array of unique, normalized canonical skill names
 */
const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];

  const normalizedSet = new Set();
  for (const s of skills) {
    const normalized = normalizeSkill(s);
    if (normalized) {
      normalizedSet.add(normalized);
    }
  }

  return Array.from(normalizedSet);
};

module.exports = {
  SKILL_SYNONYMS,
  normalizeSkill,
  normalizeSkills,
};
