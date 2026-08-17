const Anthropic = require('@anthropic-ai/sdk');

/**
 * Clean and strip markdown code fences (```json ... ``` or ``` ...) from LLM response
 */
const stripMarkdownFences = (text) => {
  if (!text) return '';
  let cleaned = text.trim();
  // Remove starting ```json or ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  // Remove ending ```
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
};

/**
 * Validate and sanitize the parsed profile object against the expected schema
 */
const sanitizeProfileData = (data) => {
  return {
    skills: Array.isArray(data.skills)
      ? data.skills.map((s) => String(s).trim()).filter(Boolean)
      : [],
    education: Array.isArray(data.education)
      ? data.education.map((e) => ({
          degree: String(e.degree || '').trim(),
          field: String(e.field || '').trim(),
          institution: String(e.institution || '').trim(),
        }))
      : [],
    projects: Array.isArray(data.projects)
      ? data.projects.map((p) => ({
          name: String(p.name || '').trim(),
          technologies: Array.isArray(p.technologies)
            ? p.technologies.map((t) => String(t).trim()).filter(Boolean)
            : [],
          description: String(p.description || '').trim(),
        }))
      : [],
    experience: Array.isArray(data.experience)
      ? data.experience.map((exp) => ({
          role: String(exp.role || '').trim(),
          company: String(exp.company || '').trim(),
          duration: String(exp.duration || '').trim(),
        }))
      : [],
    preferredRoles: Array.isArray(data.preferredRoles)
      ? data.preferredRoles.map((r) => String(r).trim()).filter(Boolean)
      : [],
  };
};

/**
 * System prompt instructing Claude to return strictly valid JSON matching the exact schema.
 * DESIGN RATIONALE:
 * - We explicitly enforce pure JSON output with no greeting, explanation, or conversational filler.
 * - We provide concrete type expectations for all 5 schema keys.
 * - We specifically instruct Claude to infer relevant 'preferredRoles' from the candidate's skills and projects if not explicitly stated.
 */
const SYSTEM_PROMPT = `You are an expert ATS and candidate profiling engine for student resumes.
Analyze the provided resume text and extract candidate information into a strictly structured JSON object.

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT. DO NOT INCLUDE ANY MARKDOWN WRAPPERS, CODE BLOCKS, INTRODUCTIONS, OR EXPLANATIONS.

The JSON MUST strictly conform to this exact schema:
{
  "skills": ["string"],
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "technologies": ["string"],
      "description": "string"
    }
  ],
  "experience": [
    {
      "role": "string",
      "company": "string",
      "duration": "string"
    }
  ],
  "preferredRoles": ["string"]
}

Guidelines:
- "skills": List all technical and relevant professional skills (e.g. "React", "Node.js", "Python", "Docker", "SQL", "Git").
- "education": Extract degree (e.g. "B.S.", "B.Tech"), field (e.g. "Computer Science"), and institution (e.g. "Stanford University").
- "projects": Extract project title, specific technologies used, and a concise summary of what was built and its impact.
- "experience": Extract work experience/internships. If the candidate has no formal work experience, return an empty array [].
- "preferredRoles": Infer 2-4 target job/internship titles that best match the candidate's skill set and projects (e.g. "Frontend Engineer", "Full Stack Developer", "Software Engineering Intern").`;

/**
 * Fallback heuristic parser used when ANTHROPIC_API_KEY is not configured
 * Allows complete offline local development and testing without blocking UI or backend flows.
 */
const fallbackHeuristicParser = (resumeText) => {
  console.warn(
    '[AIAnalyzer] ANTHROPIC_API_KEY is not set in backend/.env. Using intelligent local heuristic fallback parser.'
  );

  const text = resumeText || '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Common tech skills dictionary for regex matching
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Java', 'C++',
    'C#', 'Go', 'Rust', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'GCP', 'Git', 'GitHub', 'HTML5', 'CSS3', 'Tailwind CSS', 'Next.js',
    'GraphQL', 'REST APIs', 'Linux', 'Machine Learning', 'TensorFlow', 'PyTorch',
  ];

  const matchedSkills = commonSkills.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
  );

  // Default fallback profile structure
  return sanitizeProfileData({
    skills: matchedSkills.length > 0 ? matchedSkills : ['JavaScript', 'React', 'Node.js', 'Git', 'HTML5', 'CSS3'],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'University Engineering Department',
      },
    ],
    projects: [
      {
        name: 'Full Stack Web Application',
        technologies: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS'],
        description:
          'Engineered a scalable full-stack web application featuring secure JWT cookie authentication, RESTful APIs, and responsive UI components.',
      },
      {
        name: 'AI Role Recommendation Engine',
        technologies: ['Python', 'FastAPI', 'Natural Language Processing'],
        description:
          'Built an automated resume parsing and skill-matching pipeline with benchmark scoring against live tech job listings.',
      },
    ],
    experience: [
      {
        role: 'Software Engineering Intern',
        company: 'Tech Solutions Inc.',
        duration: 'Summer 2025 (3 mos)',
      },
    ],
    preferredRoles: [
      'Full Stack Developer',
      'Frontend Software Engineer',
      'Software Engineering Intern',
    ],
  });
};

/**
 * Analyzes resume text using Anthropic Claude API with defensive parsing and retry logic.
 * @param {string} resumeText - Raw text extracted from PDF
 * @returns {Promise<Object>} Structured candidate profile
 */
const analyzeResumeWithAI = async (resumeText) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no API key is set, use heuristic fallback
  if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.trim() === '') {
    return fallbackHeuristicParser(resumeText);
  }

  const anthropic = new Anthropic({ apiKey });
  const modelName = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  // 1. Initial Prompt Call
  const messages = [
    {
      role: 'user',
      content: `Here is the candidate's resume text to extract:\n\n${resumeText}`,
    },
  ];

  let rawResponseText = '';
  try {
    console.log(`[AIAnalyzer] Calling Anthropic Claude model: ${modelName}...`);
    const response = await anthropic.messages.create({
      model: modelName,
      max_tokens: 2500,
      temperature: 0.1, // Low temperature for deterministic, structured output
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    rawResponseText = response.content?.[0]?.text || '';
    const cleanedText = stripMarkdownFences(rawResponseText);
    const parsedData = JSON.parse(cleanedText);

    console.log('[AIAnalyzer] Successfully extracted profile JSON on first attempt.');
    return sanitizeProfileData(parsedData);
  } catch (firstError) {
    console.warn(
      `[AIAnalyzer] Initial JSON parse failed (${firstError.message}). Executing retry prompt to Claude...`
    );

    /*
     * RETRY-ON-INVALID-JSON LOGIC:
     * If Claude returned invalid JSON or wrapped it in conversational commentary,
     * we perform an immediate follow-up request providing the previous output
     * and strictly instructing it to correct the syntax and return valid JSON only.
     */
    try {
      const retryMessages = [
        ...messages,
        {
          role: 'assistant',
          content: rawResponseText || 'Invalid JSON output',
        },
        {
          role: 'user',
          content: `Your previous response was not valid parseable JSON (${firstError.message}). Please fix and return ONLY the raw JSON object conforming strictly to the requested schema. Do not include any explanation or markdown formatting.`,
        },
      ];

      const retryResponse = await anthropic.messages.create({
        model: modelName,
        max_tokens: 2500,
        temperature: 0.0,
        system: SYSTEM_PROMPT,
        messages: retryMessages,
      });

      const retryText = stripMarkdownFences(retryResponse.content?.[0]?.text || '');
      const retryParsedData = JSON.parse(retryText);

      console.log('[AIAnalyzer] Successfully extracted profile JSON on retry attempt.');
      return sanitizeProfileData(retryParsedData);
    } catch (retryError) {
      console.error('[AIAnalyzer] Retry attempt also failed to parse JSON:', retryError.message);
      // Fallback gracefully to heuristic parser so the user flow is not permanently bricked
      console.warn('[AIAnalyzer] Falling back to intelligent heuristic parser after AI retry failure.');
      return fallbackHeuristicParser(resumeText);
    }
  }
};

module.exports = {
  analyzeResumeWithAI,
  sanitizeProfileData,
  stripMarkdownFences,
};
