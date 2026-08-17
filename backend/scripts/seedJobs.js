const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const connectDB = require('../src/config/db');

const SAMPLE_JOBS = [
  {
    title: 'Full Stack Engineering Intern',
    company: 'Stripe',
    description:
      'Join Stripe’s Core Payments Infrastructure team for Summer 2026. You will build user-facing merchant dashboards in React and TypeScript while engineering robust backend payment processing services in Node.js and PostgreSQL. You will collaborate closely with senior engineers on distributed microservices handling millions of transactions daily.',
    location: 'Remote',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'REST APIs', 'Git', 'Docker'],
    salary: '$48 - $58 / hr',
    applicationUrl: 'https://stripe.com/jobs',
    source: 'seed',
  },
  {
    title: 'Junior Frontend Developer',
    company: 'Vercel',
    description:
      'We are looking for an ambitious frontend developer to join our Developer Experience team. You will work directly on Next.js documentation components, preview workflows, and high-performance interactive UIs using React, Tailwind CSS, and TypeScript. Ideal for graduates who love clean design systems and modern web performance.',
    location: 'Remote',
    employmentType: 'full-time',
    experienceRequired: '0-1 years',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'HTML5', 'CSS3', 'Git'],
    salary: '$95,000 - $115,000 / yr',
    applicationUrl: 'https://vercel.com/careers',
    source: 'seed',
  },
  {
    title: 'Backend Software Engineer (Entry Level)',
    company: 'Notion',
    description:
      'Help us scale the collaborative workspace powering millions of teams worldwide. You will write high-throughput services in Node.js and TypeScript, optimize complex queries across PostgreSQL and Redis, and architect real-time collaboration engines using WebSockets and microservices.',
    location: 'San Francisco, CA',
    employmentType: 'full-time',
    experienceRequired: '0-2 years',
    skills: ['Node.js', 'TypeScript', 'Express.js', 'PostgreSQL', 'Redis', 'Microservices', 'Git'],
    salary: '$120,000 - $140,000 / yr',
    applicationUrl: 'https://notion.so/careers',
    source: 'seed',
  },
  {
    title: 'AI / Machine Learning Intern',
    company: 'Anthropic',
    description:
      'Work alongside research scientists and engineers building Claude. You will develop evaluation pipelines, fine-tuning datasets, and model benchmark harnesses using Python, PyTorch, and distributed computing on AWS. Strong math background and Python fundamentals required.',
    location: 'San Francisco, CA',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['Python', 'PyTorch', 'Machine Learning', 'NLP', 'TensorFlow', 'Docker', 'AWS'],
    salary: '$55 - $65 / hr',
    applicationUrl: 'https://anthropic.com/careers',
    source: 'seed',
  },
  {
    title: 'DevOps & Cloud Infrastructure Intern',
    company: 'Cloudflare',
    description:
      'Help protect and accelerate the Internet. As a Cloud Infrastructure Intern, you will automate multi-region Kubernetes clusters, build CI/CD pipelines with GitHub Actions, and deploy Terraform configurations across edge network environments.',
    location: 'Austin, TX',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Terraform', 'Go', 'Bash'],
    salary: '$45 - $55 / hr',
    applicationUrl: 'https://cloudflare.com/careers',
    source: 'seed',
  },
  {
    title: 'Data Analyst & Insights Intern',
    company: 'Airbnb',
    description:
      'Analyze search conversion, host supply dynamics, and booking trends. You will write advanced SQL queries, clean large datasets in Python (Pandas/NumPy), and build executive dashboard visualizations in Tableau for global product teams.',
    location: 'Remote',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['SQL', 'Python', 'Pandas', 'Tableau', 'Data Analysis', 'PostgreSQL'],
    salary: '$42 - $50 / hr',
    applicationUrl: 'https://airbnb.com/careers',
    source: 'seed',
  },
  {
    title: 'Full Stack Web Developer',
    company: 'Linear',
    description:
      'Build the issue tracker software teams actually love. We craft ultra-fast, keyboard-first desktop and web applications. You will work across React, TypeScript, Node.js, and GraphQL, shipping polished features weekly to thousands of engineering organizations.',
    location: 'Remote',
    employmentType: 'full-time',
    experienceRequired: '1-2 years',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Tailwind CSS', 'PostgreSQL'],
    salary: '$125,000 - $150,000 / yr',
    applicationUrl: 'https://linear.app/careers',
    source: 'seed',
  },
  {
    title: 'Mobile App Developer Intern (React Native / iOS)',
    company: 'Duolingo',
    description:
      'Make language learning free, fun, and accessible to everyone. You will develop gamified interactive lessons and offline sync engines using React Native and TypeScript, ensuring 60fps animations across iOS and Android devices.',
    location: 'Pittsburgh, PA',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['React Native', 'React', 'TypeScript', 'JavaScript', 'Git', 'Mobile App Development'],
    salary: '$45 - $52 / hr',
    applicationUrl: 'https://duolingo.com/careers',
    source: 'seed',
  },
  {
    title: 'Software Engineer - Distributed Systems',
    company: 'Snowflake',
    description:
      'Build the future of the Data Cloud. You will work on massive-scale data processing engines, storage tier caching, and distributed query execution using Java, C++, and Go across AWS and Azure multi-cloud infrastructure.',
    location: 'Seattle, WA',
    employmentType: 'full-time',
    experienceRequired: '0-2 years',
    skills: ['Java', 'C++', 'Go', 'Distributed Systems', 'SQL', 'AWS', 'Linux'],
    salary: '$135,000 - $160,000 / yr',
    applicationUrl: 'https://snowflake.com/careers',
    source: 'seed',
  },
  {
    title: 'Junior Cloud Security Engineer',
    company: 'Datadog',
    description:
      'Help secure observability infrastructure processing trillions of events daily. You will analyze vulnerability feeds, write automated compliance scanners in Python, and configure cloud IAM access controls across AWS and Kubernetes environments.',
    location: 'New York, NY',
    employmentType: 'full-time',
    experienceRequired: '0-1 years',
    skills: ['Python', 'AWS', 'Docker', 'Linux', 'Cybersecurity', 'Terraform', 'CI/CD'],
    salary: '$105,000 - $125,000 / yr',
    applicationUrl: 'https://datadoghq.com/careers',
    source: 'seed',
  },
  {
    title: 'Backend API Developer (Python / FastAPI)',
    company: 'Supabase',
    description:
      'Build the open-source Firebase alternative. You will engineer scalable auth microservices, database triggers, and REST / GraphQL APIs using Python, FastAPI, PostgreSQL, and Docker.',
    location: 'Remote',
    employmentType: 'full-time',
    experienceRequired: '0-1 years',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'REST APIs', 'Git'],
    salary: '$110,000 - $130,000 / yr',
    applicationUrl: 'https://supabase.com/careers',
    source: 'seed',
  },
  {
    title: 'Software Quality & Automation Intern',
    company: 'Figma',
    description:
      'Ensure the world’s leading collaborative design platform is bug-free and rock solid. You will build automated end-to-end testing frameworks using TypeScript, Playwright, and Jest, integrating tests directly into our continuous deployment pipeline.',
    location: 'San Francisco, CA',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['TypeScript', 'JavaScript', 'Jest', 'CI/CD', 'Git', 'Testing Automation'],
    salary: '$46 - $54 / hr',
    applicationUrl: 'https://figma.com/careers',
    source: 'seed',
  },
  {
    title: 'Junior React UI Developer',
    company: 'HubSpot',
    description:
      'Join HubSpot’s CRM UI team to build accessible, customer-centric web applications using modern React, Redux/Zustand, and CSS-in-JS design tokens. Perfect launchpad for graduates passionate about frontend engineering.',
    location: 'Boston, MA',
    employmentType: 'full-time',
    experienceRequired: '0-1 years',
    skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'REST APIs', 'Git'],
    salary: '$90,000 - $110,000 / yr',
    applicationUrl: 'https://hubspot.com/careers',
    source: 'seed',
  },
  {
    title: 'Data Engineering Intern',
    company: 'Palantir',
    description:
      'Design, build, and optimize large-scale ETL data pipelines connecting enterprise sources to real-time analytics platforms. Hands-on experience with Python, Spark, SQL, and Docker is highly preferred.',
    location: 'New York, NY',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['Python', 'SQL', 'PostgreSQL', 'Docker', 'Linux', 'Data Pipelines'],
    salary: '$50 - $60 / hr',
    applicationUrl: 'https://palantir.com/careers',
    source: 'seed',
  },
  {
    title: 'Full Stack Developer - MERN Stack',
    company: 'MongoDB',
    description:
      'Work on developer tools, tutorials, and community cloud portals. You will build robust web services using MongoDB Atlas, Express.js, React, and Node.js, helping hundreds of thousands of developers worldwide build modern applications.',
    location: 'New York, NY',
    employmentType: 'full-time',
    experienceRequired: '0-2 years',
    skills: ['MongoDB', 'Express.js', 'React', 'Node.js', 'JavaScript', 'REST APIs', 'Git'],
    salary: '$115,000 - $135,000 / yr',
    applicationUrl: 'https://mongodb.com/careers',
    source: 'seed',
  },
  {
    title: 'Site Reliability Engineering Intern (SRE)',
    company: 'Twilio',
    description:
      'Keep Twilio’s global communications APIs online with 99.999% uptime. You will automate cloud deployment monitors, analyze latency metrics with Prometheus/Grafana, and script auto-scaling policies using Python, Docker, and AWS.',
    location: 'Remote',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['Python', 'Docker', 'AWS', 'Linux', 'Bash', 'CI/CD', 'Git'],
    salary: '$44 - $52 / hr',
    applicationUrl: 'https://twilio.com/careers',
    source: 'seed',
  },
  {
    title: 'Frontend Engineer - Design Systems',
    company: 'Canva',
    description:
      'Help Canva empower the world to design. You will build reusable, accessible UI component libraries in React, TypeScript, and Tailwind CSS that scale across dozens of product feature teams.',
    location: 'Remote',
    employmentType: 'full-time',
    experienceRequired: '0-2 years',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'CSS3', 'HTML5', 'Git'],
    salary: '$100,000 - $125,000 / yr',
    applicationUrl: 'https://canva.com/careers',
    source: 'seed',
  },
  {
    title: 'Systems & Embedded Software Intern',
    company: 'Tesla',
    description:
      'Develop real-time embedded firmware, hardware-in-the-loop diagnostics, and telemetry modules for vehicle computing platforms. Strong proficiency in C/C++ and Linux fundamentals required.',
    location: 'Palo Alto, CA',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['C++', 'Linux', 'Python', 'Git', 'Embedded Systems'],
    salary: '$48 - $58 / hr',
    applicationUrl: 'https://tesla.com/careers',
    source: 'seed',
  },
  {
    title: 'Junior Java / Spring Backend Developer',
    company: 'Capital One',
    description:
      'Build secure, low-latency financial transaction APIs. You will implement microservices in Java with Spring Boot, deploy containerized workloads to AWS, and integrate resilient PostgreSQL databases.',
    location: 'Chicago, IL',
    employmentType: 'full-time',
    experienceRequired: '0-1 years',
    skills: ['Java', 'Spring Boot', 'SQL', 'PostgreSQL', 'AWS', 'REST APIs', 'Git'],
    salary: '$105,000 - $120,000 / yr',
    applicationUrl: 'https://capitalonecareers.com',
    source: 'seed',
  },
  {
    title: 'Computer Vision & AI Intern',
    company: 'Scale AI',
    description:
      'Build automated data annotation and machine perception pipelines for autonomous driving and generative AI models. You will train models in PyTorch, write OpenCV image preprocessing scripts, and deploy models with Docker.',
    location: 'San Francisco, CA',
    employmentType: 'internship',
    experienceRequired: '0-1 years',
    skills: ['Python', 'PyTorch', 'OpenCV', 'Machine Learning', 'Docker', 'Git'],
    salary: '$52 - $62 / hr',
    applicationUrl: 'https://scale.com/careers',
    source: 'seed',
  },
  {
    title: 'Junior Full Stack Developer',
    company: 'Retool',
    description:
      'Empower teams to build internal software 10x faster. You will work on both our frontend builder canvas (React, TypeScript) and backend query execution engine (Node.js, PostgreSQL, MongoDB, Redis).',
    location: 'San Francisco, CA',
    employmentType: 'full-time',
    experienceRequired: '0-1 years',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'MongoDB', 'REST APIs'],
    salary: '$120,000 - $145,000 / yr',
    applicationUrl: 'https://retool.com/careers',
    source: 'seed',
  },
  {
    title: 'Associate Cloud Support Engineer',
    company: 'Amazon Web Services (AWS)',
    description:
      'Serve as the technical guide for AWS customers deploying enterprise cloud solutions. You will troubleshoot Linux server configurations, container networking in Docker/ECS, and cloud security architecture.',
    location: 'Seattle, WA',
    employmentType: 'full-time',
    experienceRequired: '0-1 years',
    skills: ['AWS', 'Linux', 'Bash', 'Networking', 'Python', 'Docker'],
    salary: '$95,000 - $115,000 / yr',
    applicationUrl: 'https://amazon.jobs',
    source: 'seed',
  },
];

const seedJobs = async () => {
  try {
    console.log('[SeedJobs] Connecting to database...');
    const conn = await connectDB();
    if (!conn) {
      console.error('[SeedJobs] Failed to establish database connection.');
      process.exit(1);
    }

    console.log('[SeedJobs] Clearing existing seed jobs...');
    const deleteResult = await Job.deleteMany({ source: 'seed' });
    console.log(`[SeedJobs] Removed ${deleteResult.deletedCount} previous seed jobs.`);

    console.log(`[SeedJobs] Inserting ${SAMPLE_JOBS.length} realistic diverse tech jobs...`);
    const insertedJobs = await Job.insertMany(SAMPLE_JOBS);
    console.log(`[SeedJobs] ✅ Successfully seeded ${insertedJobs.length} jobs into MongoDB!\n`);

    const categories = insertedJobs.reduce((acc, job) => {
      acc[job.employmentType] = (acc[job.employmentType] || 0) + 1;
      return acc;
    }, {});
    console.log('[SeedJobs] Job distribution by type:', categories);

    if (require.main === module) {
      process.exit(0);
    }
    return insertedJobs;
  } catch (error) {
    console.error('[SeedJobs Error]:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedJobs();
}

module.exports = { seedJobs, SAMPLE_JOBS };
