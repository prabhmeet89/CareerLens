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
- "preferredRoles": Infer 2-4 target job/internship titles that best match the candidate's skill set and projects (e.g. "Frontend Engineer", "Full Stack Developer", "Software Engineering Intern").
- IMPORTANT: Never invent or fabricate information that is not present in the resume. If a field cannot be determined from the resume text, return an empty array [] for that field.`;

/**
 * Analyzes resume text using Anthropic Claude API with defensive parsing and retry logic.
 * @param {string} resumeText - Raw text extracted from PDF
 * @returns {Promise<Object>} Structured candidate profile
 * @throws {Error} If ANTHROPIC_API_KEY is not configured, or if Claude fails to return valid JSON after retry
 */
const analyzeResumeWithAI = async (resumeText) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Require a real API key — no silent fallback with fabricated data
  if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.trim() === '') {
    throw new Error(
      'AI resume analysis is not configured. Set ANTHROPIC_API_KEY in backend/.env to enable resume parsing.'
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const modelName = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

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
      throw new Error(
        `AI resume analysis failed: Claude returned invalid JSON on both attempts. ` +
        `Last error: ${retryError.message}. Please try uploading again.`
      );
    }
  }
};

module.exports = {
  analyzeResumeWithAI,
  sanitizeProfileData,
  stripMarkdownFences,
};
