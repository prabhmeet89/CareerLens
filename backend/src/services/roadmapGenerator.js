const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Clean and strip markdown code fences
 */
const stripMarkdownFences = (text) => {
  if (!text) return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
};

/**
 * Sanitize and validate roadmap data
 */
const sanitizeRoadmap = (data) => {
  const weeks = Array.isArray(data?.weeks)
    ? data.weeks.map((w, idx) => ({
        week: Number(w.week) || idx + 1,
        focus: String(w.focus || `Skill Focus: Week ${idx + 1}`).trim(),
        tasks: Array.isArray(w.tasks)
          ? w.tasks.map((t) => String(t).trim()).filter(Boolean)
          : [],
      }))
    : [];

  return {
    totalWeeks: Number(data?.totalWeeks) || Math.min(6, Math.max(1, weeks.length)) || 4,
    weeks: weeks.slice(0, 6),
  };
};

/**
 * Heuristic fallback roadmap when GEMINI_API_KEY is not configured
 */
const fallbackHeuristicRoadmap = ({ missingSkills = [], job = {}, candidateProfile = {} }) => {
  const skills = missingSkills.length > 0 ? missingSkills : ['Cloud Deployment', 'Testing Automation', 'System Design'];
  const jobTitle = job.title || 'Target Engineering Role';

  const weeks = [];
  const chunkSize = Math.max(1, Math.ceil(skills.length / 4));

  for (let i = 0; i < skills.length && weeks.length < 4; i += chunkSize) {
    const weekNum = weeks.length + 1;
    const currentSkills = skills.slice(i, i + chunkSize);
    const focusSkill = currentSkills.join(' & ');

    weeks.push({
      week: weekNum,
      focus: `Mastering ${focusSkill}`,
      tasks: [
        `Complete interactive fundamentals tutorial and official docs for ${currentSkills[0]}.`,
        `Build a hands-on mini project demonstrating practical usage of ${currentSkills[0]}.`,
        `Integrate ${currentSkills.join(', ')} into your existing portfolio project to showcase on your resume.`,
      ],
    });
  }

  // Ensure at least 3 weeks in roadmap
  while (weeks.length < 3) {
    const weekNum = weeks.length + 1;
    if (weekNum === 3) {
      weeks.push({
        week: 3,
        focus: 'End-to-End Integration & Real-World Testing',
        tasks: [
          `Implement automated unit and integration tests covering your new skill stack.`,
          `Set up CI/CD GitHub Actions pipeline to automatically lint and test code.`,
        ],
      });
    } else if (weekNum === 4) {
      weeks.push({
        week: 4,
        focus: `Interview Preparation & Portfolio Polish for ${jobTitle}`,
        tasks: [
          `Review system architecture and technical interview questions related to ${jobTitle}.`,
          `Update your CareerLens profile and GitHub repository README with your newly built proof-of-work project.`,
        ],
      });
    }
  }

  return {
    totalWeeks: weeks.length,
    weeks,
  };
};

const SYSTEM_PROMPT = `You are a Senior Tech Lead and Career Mentor for student software engineers at CareerLens.
Generate a structured, actionable, week-by-week learning roadmap designed to bridge the candidate's missing skill gaps for their target job.

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT. DO NOT INCLUDE ANY MARKDOWN CODE BLOCKS, WRAPPERS, OR CONVERSATIONAL TEXT.

The JSON MUST strictly match this schema:
{
  "totalWeeks": 4,
  "weeks": [
    {
      "week": 1,
      "focus": "string",
      "tasks": ["string", "string", "string"]
    }
  ]
}

Guidelines:
- Cap the roadmap at between 3 to 6 weeks total. Group related skills into the same week.
- "focus": A clear, inspiring headline for the week (e.g. "Docker & Containerization Fundamentals", "PostgreSQL Query Optimization & Indexing").
- "tasks": 2-3 specific, hands-on, actionable tasks (under 20 words each) focusing on building and demonstrating the skill in code.`;

/**
 * Generate AI Learning Roadmap using Google Gemini with native JSON mode and heuristic fallback
 *
 * @param {Object} params - { missingSkills, job, candidateProfile, matchedSkills }
 * @returns {Promise<Object>} { totalWeeks: number, weeks: Array<{ week, focus, tasks }> }
 */
const generateLearningRoadmap = async ({
  missingSkills = [],
  job = {},
  candidateProfile = {},
  matchedSkills = [],
}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    console.log('[RoadmapGenerator] GEMINI_API_KEY is not set. Using heuristic fallback roadmap.');
    return fallbackHeuristicRoadmap({ missingSkills, job, candidateProfile });
  }

  // Use the version-agnostic 'latest' alias so this never silently breaks on model deprecations
  const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const userPrompt = `Create an accelerated learning roadmap for this student:
TARGET JOB: ${job.title} at ${job.company}
EXISTING CANDIDATE SKILLS: ${(candidateProfile.skills || []).join(', ') || matchedSkills.join(', ')}
MISSING REQUIRED SKILLS TO BRIDGE: ${missingSkills.join(', ') || 'General Cloud & System Design'}

Generate a 3-5 week structured learning roadmap:`;

  try {
    console.log(`[RoadmapGenerator] Requesting Gemini (${modelName}) for learning roadmap...`);
    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text() || '';
    const cleanedText = stripMarkdownFences(responseText);

    try {
      const parsed = JSON.parse(cleanedText);
      return sanitizeRoadmap(parsed);
    } catch (parseError) {
      console.warn('[RoadmapGenerator] Initial JSON parsing failed. Retrying with formatting correction...', parseError.message);

      const retryPrompt = `${userPrompt}\n\nYour previous response was not valid JSON (${parseError.message}). Return ONLY raw valid JSON matching the schema.`;
      const retryResult = await model.generateContent(retryPrompt);
      const retryText = stripMarkdownFences(retryResult.response.text() || '');
      const retryParsed = JSON.parse(retryText);
      return sanitizeRoadmap(retryParsed);
    }
  } catch (error) {
    const msg = error?.message || '';
    const isModelNotFound = msg.includes('404') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('not supported');
    if (isModelNotFound) {
      console.error(`[RoadmapGenerator] Model not found or deprecated: ${modelName}. Update GEMINI_MODEL in backend/.env.`);
      console.error('[RoadmapGenerator] Raw error:', msg);
    } else {
      console.error('[RoadmapGenerator Error]: Failed to call Google Gemini:', msg);
    }
    return fallbackHeuristicRoadmap({ missingSkills, job, candidateProfile });
  }
};

module.exports = {
  generateLearningRoadmap,
  fallbackHeuristicRoadmap,
  stripMarkdownFences,
  sanitizeRoadmap,
};
