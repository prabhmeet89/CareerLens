const {
  stripMarkdownFences,
  stripEmojis,
  executeGeminiWithFallback,
} = require('./geminiClient');

/**
 * Validate and sanitize the parsed profile object against the expected schema
 */
const sanitizeProfileData = (data) => {
  return {
    skills: Array.isArray(data?.skills)
      ? data.skills.map((s) => stripEmojis(String(s).trim())).filter(Boolean)
      : [],
    education: Array.isArray(data?.education)
      ? data.education.map((e) => ({
          degree: stripEmojis(String(e.degree || '').trim()),
          field: stripEmojis(String(e.field || '').trim()),
          institution: stripEmojis(String(e.institution || '').trim()),
        }))
      : [],
    projects: Array.isArray(data?.projects)
      ? data.projects.map((p) => ({
          name: stripEmojis(String(p.name || '').trim()),
          technologies: Array.isArray(p.technologies)
            ? p.technologies.map((t) => stripEmojis(String(t).trim())).filter(Boolean)
            : [],
          description: stripEmojis(String(p.description || '').trim()),
        }))
      : [],
    experience: Array.isArray(data?.experience)
      ? data.experience.map((exp) => ({
          role: stripEmojis(String(exp.role || '').trim()),
          company: stripEmojis(String(exp.company || '').trim()),
          duration: stripEmojis(String(exp.duration || '').trim()),
        }))
      : [],
    preferredRoles: Array.isArray(data?.preferredRoles)
      ? data.preferredRoles.map((r) => stripEmojis(String(r).trim())).filter(Boolean)
      : [],
  };
};

/**
 * System prompt instructing Gemini to return strictly valid JSON matching the exact schema.
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
- Do not use emojis, emoticons, or decorative Unicode symbols anywhere in your output. Use plain, professional text only.
- IMPORTANT: Never invent or fabricate information that is not present in the resume. If a field cannot be determined from the resume text, return an empty array [] for that field.`;

/**
 * Analyzes resume text using Google Gemini API with native JSON mode, defensive parsing, and retry logic.
 * @param {string} resumeText - Raw text extracted from PDF
 * @returns {Promise<Object>} Structured candidate profile
 * @throws {Error} If GEMINI_API_KEY is not configured, or if Gemini fails to return valid JSON after retry
 */
const analyzeResumeWithAI = async (resumeText) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    throw new Error(
      'AI resume analysis is not configured. Set GEMINI_API_KEY in backend/.env to enable resume parsing.'
    );
  }

  const prompt = `Here is the candidate's resume text to extract:\n\n${resumeText}`;

  const { data } = await executeGeminiWithFallback({
    type: 'resume_analysis',
    systemInstruction: SYSTEM_PROMPT,
    prompt,
    temperature: 0.1,
    expectJson: true,
    timeoutMs: 15000,
  });

  return sanitizeProfileData(data);
};

module.exports = {
  analyzeResumeWithAI,
  sanitizeProfileData,
  stripMarkdownFences,
  stripEmojis,
};
