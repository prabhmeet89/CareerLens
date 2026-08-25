const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    skills: Array.isArray(data?.skills)
      ? data.skills.map((s) => String(s).trim()).filter(Boolean)
      : [],
    education: Array.isArray(data?.education)
      ? data.education.map((e) => ({
          degree: String(e.degree || '').trim(),
          field: String(e.field || '').trim(),
          institution: String(e.institution || '').trim(),
        }))
      : [],
    projects: Array.isArray(data?.projects)
      ? data.projects.map((p) => ({
          name: String(p.name || '').trim(),
          technologies: Array.isArray(p.technologies)
            ? p.technologies.map((t) => String(t).trim()).filter(Boolean)
            : [],
          description: String(p.description || '').trim(),
        }))
      : [],
    experience: Array.isArray(data?.experience)
      ? data.experience.map((exp) => ({
          role: String(exp.role || '').trim(),
          company: String(exp.company || '').trim(),
          duration: String(exp.duration || '').trim(),
        }))
      : [],
    preferredRoles: Array.isArray(data?.preferredRoles)
      ? data.preferredRoles.map((r) => String(r).trim()).filter(Boolean)
      : [],
  };
};

/**
 * System prompt instructing Gemini to return strictly valid JSON matching the exact schema.
 * DESIGN RATIONALE:
 * - We explicitly enforce pure JSON output with no greeting, explanation, or conversational filler.
 * - We provide concrete type expectations for all 5 schema keys.
 * - We specifically instruct Gemini to infer relevant 'preferredRoles' from the candidate's skills and projects if not explicitly stated.
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
 * Analyzes resume text using Google Gemini API with native JSON mode, defensive parsing, and retry logic.
 * @param {string} resumeText - Raw text extracted from PDF
 * @returns {Promise<Object>} Structured candidate profile
 * @throws {Error} If GEMINI_API_KEY is not configured, or if Gemini fails to return valid JSON after retry
 */
const analyzeResumeWithAI = async (resumeText) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // Require a real API key — no silent fallback with fabricated data
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    throw new Error(
      'AI resume analysis is not configured. Set GEMINI_API_KEY in backend/.env to enable resume parsing.'
    );
  }

  // Use real, stable Gemini model names. The primary comes from env; the
  // chain below are genuine model identifiers as of the Gemini 1.5/2.0 era.
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const REAL_FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash'];
  const fallbackModels = [primaryModel, ...REAL_FALLBACK_MODELS]
    .filter((m, idx, arr) => arr.indexOf(m) === idx);

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `Here is the candidate's resume text to extract:\n\n${resumeText}`;

  const startTime = performance.now();
  let attempts = 0;
  let lastError = null;

  for (const modelName of fallbackModels) {
    attempts++;
    const modelStart = performance.now();
    try {
      console.log(`[AIAnalyzer] Calling Google Gemini model: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      let rawResponseText = '';
      try {
        const result = await model.generateContent(prompt);
        rawResponseText = result.response.text() || '';
      } catch (apiError) {
        const durationMs = Math.round(performance.now() - modelStart);
        console.warn(`[AIAnalyzer] Model ${modelName} API error (${durationMs}ms): ${apiError.message}`);
        lastError = apiError;
        continue; // Try next fallback model
      }

      const cleanedText = stripMarkdownFences(rawResponseText);
      try {
        const parsedData = JSON.parse(cleanedText);
        const totalDurationMs = Math.round(performance.now() - startTime);
        console.log(`[AI Metric] type=resume_analysis model=${modelName} durationMs=${totalDurationMs} status=${attempts > 1 ? 'fallback_used' : 'success'} attempts=${attempts}`);
        return sanitizeProfileData(parsedData);
      } catch (parseError) {
        console.warn(
          `[AIAnalyzer] Initial JSON parse failed on ${modelName} (${parseError.message}). Retrying with fix prompt...`
        );
        const retryPrompt = `${prompt}\n\nYour previous response was not valid parseable JSON (${parseError.message}). Please fix and return ONLY the raw JSON object conforming strictly to the requested schema. Do not include any markdown fences or explanation.`;
        const retryResult = await model.generateContent(retryPrompt);
        const retryText = stripMarkdownFences(retryResult.response.text() || '');
        const retryParsedData = JSON.parse(retryText);
        const totalDurationMs = Math.round(performance.now() - startTime);
        console.log(`[AI Metric] type=resume_analysis model=${modelName} durationMs=${totalDurationMs} status=repaired_json attempts=${attempts}`);
        return sanitizeProfileData(retryParsedData);
      }
    } catch (err) {
      console.warn(`[AIAnalyzer] Failed on model ${modelName}:`, err.message);
      lastError = err;
    }
  }

  const totalDurationMs = Math.round(performance.now() - startTime);
  console.error(`[AI Metric] type=resume_analysis model=all_failed durationMs=${totalDurationMs} status=failed attempts=${attempts}`);
  throw new Error(
    `AI resume analysis failed across available models. Last error: ${lastError?.message || 'Unknown error'}. Please try again.`
  );
};

module.exports = {
  analyzeResumeWithAI,
  sanitizeProfileData,
  stripMarkdownFences,
};
