'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  validateAndNormalizeUrl,
  getResourcesForSkill,
} = require('./resourceCatalog');

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
 * Strip decorative Unicode emojis and symbols from text
 */
const stripEmojis = (s) =>
  String(s || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/**
 * Sanitize and validate roadmap data with structured tasks, bounded minutes, and verified resources.
 */
const sanitizeRoadmap = (data, previousTasks = []) => {
  // Index previous completion by task title or taskId for progress preservation on regeneration
  const previousCompletionMap = new Map();
  if (Array.isArray(previousTasks)) {
    previousTasks.forEach((t) => {
      if (t && t.completed) {
        if (t.taskId) previousCompletionMap.set(t.taskId, t.completedAt || new Date());
        if (t.title) previousCompletionMap.set(t.title.trim().toLowerCase(), t.completedAt || new Date());
      }
    });
  }

  const rawWeeks = Array.isArray(data?.weeks) ? data.weeks.slice(0, 6) : [];

  const weeks = rawWeeks.map((w, wIdx) => {
    const weekNum = Number(w.week) || wIdx + 1;
    const focus = stripEmojis(String(w.focus || `Skill Focus: Week ${weekNum}`).trim().slice(0, 200));

    const rawTasks = Array.isArray(w.tasks) ? w.tasks : [];

    const tasks = rawTasks
      .map((t, tIdx) => {
        const taskId = String(t.taskId || `w${weekNum}_t${tIdx}`).trim();
        const title = stripEmojis(
          (typeof t === 'string' ? t : t.title || 'Practice and apply skill in project')
            .trim()
            .slice(0, 300)
        );

        if (!title) return null;

        // Bounded estimated minutes (15 to 480 minutes)
        let estimatedMinutes = 60;
        if (typeof t === 'object' && t !== null && typeof t.estimatedMinutes === 'number') {
          estimatedMinutes = Math.min(480, Math.max(15, Math.round(t.estimatedMinutes)));
        }

        // Sanitize resource links
        const resources = [];
        if (typeof t === 'object' && Array.isArray(t.resources)) {
          for (const res of t.resources) {
            if (res && res.url) {
              const validated = validateAndNormalizeUrl(res.url);
              if (validated) {
                resources.push({
                  title: stripEmojis(String(res.title || 'Official Documentation').trim().slice(0, 200)),
                  url: validated.url,
                  type: String(res.type || 'documentation'),
                  domain: validated.domain,
                });
              }
            }
            if (resources.length >= 3) break;
          }
        }

        // If no valid resources from AI, attach curated resource based on focus/task
        if (resources.length === 0) {
          const curated = getResourcesForSkill(focus);
          if (curated && curated.length > 0) {
            resources.push(...curated.slice(0, 2));
          }
        }

        // Check if previously completed
        const normalizedTitle = title.toLowerCase();
        const isPreviouslyCompleted =
          previousCompletionMap.has(taskId) || previousCompletionMap.has(normalizedTitle);
        const completedAt = isPreviouslyCompleted
          ? previousCompletionMap.get(taskId) || previousCompletionMap.get(normalizedTitle)
          : null;

        const description =
          typeof t === 'object' && t?.description
            ? stripEmojis(String(t.description).trim().slice(0, 500))
            : '';

        return {
          taskId,
          title,
          description,
          estimatedMinutes,
          resources: resources.slice(0, 3),
          completed: Boolean(isPreviouslyCompleted),
          completedAt,
        };
      })
      .filter(Boolean);

    return {
      week: weekNum,
      focus,
      tasks,
    };
  });

  return {
    totalWeeks: Number(data?.totalWeeks) || Math.min(6, Math.max(1, weeks.length)) || 4,
    weeks,
  };
};

/**
 * Heuristic fallback roadmap when GEMINI_API_KEY is not configured or fails
 */
const fallbackHeuristicRoadmap = ({ missingSkills = [], job = {} }) => {
  const skills = missingSkills.length > 0 ? missingSkills : ['Cloud Deployment', 'Testing Automation', 'System Design'];
  const jobTitle = job.title || 'Target Engineering Role';

  const weeks = [];
  const chunkSize = Math.max(1, Math.ceil(skills.length / 4));

  for (let i = 0; i < skills.length && weeks.length < 4; i += chunkSize) {
    const weekNum = weeks.length + 1;
    const currentSkills = skills.slice(i, i + chunkSize);
    const focusSkill = currentSkills.join(' & ');
    const curatedResources = getResourcesForSkill(currentSkills[0]);

    weeks.push({
      week: weekNum,
      focus: `Mastering ${focusSkill}`,
      tasks: [
        {
          taskId: `w${weekNum}_t0`,
          title: `Complete interactive fundamentals tutorial and official docs for ${currentSkills[0]}.`,
          description: `Study core syntax, conventions, and architectural best practices.`,
          estimatedMinutes: 90,
          resources: curatedResources.slice(0, 2),
          completed: false,
          completedAt: null,
        },
        {
          taskId: `w${weekNum}_t1`,
          title: `Build a hands-on mini project demonstrating practical usage of ${currentSkills[0]}.`,
          description: `Implement a working proof-of-concept module with clean error handling.`,
          estimatedMinutes: 120,
          resources: curatedResources.slice(0, 1),
          completed: false,
          completedAt: null,
        },
        {
          taskId: `w${weekNum}_t2`,
          title: `Integrate ${currentSkills.join(', ')} into your portfolio project and document on GitHub.`,
          description: `Showcase real-world integration in a GitHub repository README.`,
          estimatedMinutes: 90,
          resources: curatedResources.slice(0, 1),
          completed: false,
          completedAt: null,
        },
      ],
    });
  }

  // Ensure at least 3 weeks in roadmap
  while (weeks.length < 3) {
    const weekNum = weeks.length + 1;
    if (weekNum === 3) {
      const testingResources = getResourcesForSkill('testing');
      weeks.push({
        week: 3,
        focus: 'End-to-End Integration & Real-World Testing',
        tasks: [
          {
            taskId: `w3_t0`,
            title: `Implement automated unit and integration tests covering your new skill stack.`,
            description: `Write automated test assertions with high code coverage.`,
            estimatedMinutes: 90,
            resources: testingResources.slice(0, 2),
            completed: false,
            completedAt: null,
          },
          {
            taskId: `w3_t1`,
            title: `Set up CI/CD GitHub Actions pipeline to automatically lint and test code.`,
            description: `Configure workflow yaml to run tests on every git push.`,
            estimatedMinutes: 60,
            resources: getResourcesForSkill('ci/cd').slice(0, 1),
            completed: false,
            completedAt: null,
          },
        ],
      });
    } else if (weekNum === 4) {
      weeks.push({
        week: 4,
        focus: `Interview Preparation & Portfolio Polish for ${jobTitle}`,
        tasks: [
          {
            taskId: `w4_t0`,
            title: `Review system architecture and technical interview questions related to ${jobTitle}.`,
            description: `Practice explaining trade-offs and design choices clearly.`,
            estimatedMinutes: 90,
            resources: getResourcesForSkill('system design').slice(0, 1),
            completed: false,
            completedAt: null,
          },
          {
            taskId: `w4_t1`,
            title: `Update your CareerLens profile and GitHub README with your newly built proof-of-work project.`,
            description: `Add a live demo link and summary of implemented features.`,
            estimatedMinutes: 45,
            resources: getResourcesForSkill('git').slice(0, 1),
            completed: false,
            completedAt: null,
          },
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
      "focus": "string (e.g. Docker & Containerization Fundamentals)",
      "tasks": [
        {
          "taskId": "w1_t0",
          "title": "string (actionable objective, under 25 words)",
          "estimatedMinutes": 90,
          "resources": [
            {
              "title": "string",
              "url": "https://example.com/valid-url",
              "type": "documentation"
            }
          ]
        }
      ]
    }
  ]
}

Guidelines:
- Cap roadmap at 3 to 5 weeks total. Group related skills into the same week.
- "estimatedMinutes": Realistic integer between 30 and 180 minutes per task.
- "tasks": 2-3 specific, hands-on, achievable coding tasks per week.
- "resources": Include valid documentation or tutorial URLs only (https). Never invent fake URLs.
- Do not promise guaranteed jobs or certified hiring outcomes.
- Do not use emojis, emoticons, or decorative Unicode symbols anywhere in your output. Use plain, professional text only.`;

/**
 * Generate AI Learning Roadmap using Google Gemini with native JSON mode and heuristic fallback
 *
 * @param {Object} params - { missingSkills, job, candidateProfile, matchedSkills, previousTasks }
 * @returns {Promise<Object>} { totalWeeks: number, weeks: Array<{ week, focus, tasks }> }
 */
const generateLearningRoadmap = async ({
  missingSkills = [],
  job = {},
  candidateProfile = {},
  matchedSkills = [],
  previousTasks = [],
}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    console.log('[RoadmapGenerator] GEMINI_API_KEY is not set. Using heuristic fallback roadmap.');
    const fallback = fallbackHeuristicRoadmap({ missingSkills, job, candidateProfile });
    return sanitizeRoadmap(fallback, previousTasks);
  }

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const REAL_FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash'];
  const fallbackModels = [primaryModel, ...REAL_FALLBACK_MODELS]
    .filter((m, idx, arr) => arr.indexOf(m) === idx);

  const genAI = new GoogleGenerativeAI(apiKey);

  const userPrompt = `Create an accelerated learning roadmap for this student:
TARGET JOB: ${job.title} at ${job.company}
EXISTING CANDIDATE SKILLS: ${(candidateProfile.skills || []).join(', ') || matchedSkills.join(', ')}
MISSING REQUIRED SKILLS TO BRIDGE: ${missingSkills.join(', ') || 'General Cloud & System Design'}

Generate a 3-5 week structured learning roadmap with time estimates in minutes:`;

  const startTime = performance.now();
  let attempts = 0;

  for (const modelName of fallbackModels) {
    attempts++;
    const modelStart = performance.now();
    try {
      console.log(`[RoadmapGenerator] Requesting Gemini (${modelName}) for learning roadmap...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      let responseText = '';
      try {
        const result = await model.generateContent(userPrompt);
        responseText = result.response.text() || '';
      } catch (apiError) {
        const durationMs = Math.round(performance.now() - modelStart);
        console.warn(`[RoadmapGenerator] Model ${modelName} API error (${durationMs}ms): ${apiError.message}`);
        continue;
      }

      const cleanedText = stripMarkdownFences(responseText);

      try {
        const parsed = JSON.parse(cleanedText);
        const totalDurationMs = Math.round(performance.now() - startTime);
        console.log(`[AI Metric] type=roadmap_generation model=${modelName} durationMs=${totalDurationMs} status=${attempts > 1 ? 'fallback_used' : 'success'} attempts=${attempts}`);
        return sanitizeRoadmap(parsed, previousTasks);
      } catch (parseError) {
        console.warn(`[RoadmapGenerator] Initial JSON parsing failed on ${modelName}. Retrying...`, parseError.message);

        const retryPrompt = `${userPrompt}\n\nYour previous response was not valid JSON (${parseError.message}). Return ONLY raw valid JSON matching the schema.`;
        const retryResult = await model.generateContent(retryPrompt);
        const retryText = stripMarkdownFences(retryResult.response.text() || '');
        const retryParsed = JSON.parse(retryText);
        const totalDurationMs = Math.round(performance.now() - startTime);
        console.log(`[AI Metric] type=roadmap_generation model=${modelName} durationMs=${totalDurationMs} status=repaired_json attempts=${attempts}`);
        return sanitizeRoadmap(retryParsed, previousTasks);
      }
    } catch (error) {
      console.warn(`[RoadmapGenerator] Model ${modelName} encountered error:`, error.message);
    }
  }

  const totalDurationMs = Math.round(performance.now() - startTime);
  console.warn(`[AI Metric] type=roadmap_generation model=heuristic_fallback durationMs=${totalDurationMs} status=heuristic_fallback attempts=${attempts}`);
  const fallback = fallbackHeuristicRoadmap({ missingSkills, job, candidateProfile });
  return sanitizeRoadmap(fallback, previousTasks);
};

module.exports = {
  generateLearningRoadmap,
  fallbackHeuristicRoadmap,
  stripMarkdownFences,
  sanitizeRoadmap,
};
