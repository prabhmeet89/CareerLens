const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Clean and strip markdown code fences (```json ... ``` or ``` ...)
 */
const stripMarkdownFences = (text) => {
  if (!text) return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
};

/**
 * Sanitize and validate match explanation data
 */
const sanitizeExplanation = (data) => {
  return {
    strengths: Array.isArray(data?.strengths)
      ? data.strengths
          .filter((s) => s !== null && s !== undefined)
          .map((s) => String(s).trim())
          .filter(Boolean)
      : [],
    gaps: Array.isArray(data?.gaps)
      ? data.gaps
          .filter((g) => g !== null && g !== undefined)
          .map((g) => String(g).trim())
          .filter(Boolean)
      : [],
    verdict: String(data?.verdict || 'Good Potential Fit').trim(),
  };
};

/**
 * Heuristic fallback explanation when GEMINI_API_KEY is not configured
 */
const fallbackHeuristicExplainer = ({ candidateProfile, job, matchedSkills, missingSkills, matchScore }) => {
  const profile = candidateProfile || {};
  const targetJob = job || {};
  const matched = matchedSkills || [];
  const missing = missingSkills || [];
  const score = matchScore || 50;

  const strengths = [];
  const gaps = [];

  // Determine strengths from matched skills and projects
  if (matched.length > 0) {
    strengths.push(`Direct technical match on core stack: ${matched.slice(0, 3).join(', ')}.`);
  }

  if (Array.isArray(profile.projects) && profile.projects.length > 0) {
    const topProj = profile.projects[0];
    strengths.push(`Hands-on project experience building '${topProj.name}' demonstrating practical implementation.`);
  }

  if (Array.isArray(profile.education) && profile.education.length > 0) {
    const edu = profile.education[0];
    strengths.push(`Relevant academic background in ${edu.field || 'Computer Science'} at ${edu.institution || 'University'}.`);
  }

  if (strengths.length === 0) {
    strengths.push('Strong foundational technical problem-solving capabilities.');
  }

  // Determine gaps from missing skills
  if (missing.length > 0) {
    gaps.push(`Familiarity with ${missing.slice(0, 3).join(', ')} would make you a standout candidate.`);
  } else {
    gaps.push('No significant technical skill gaps detected for this role requirements.');
  }

  // Verdict based on match score
  let verdict = 'Good Potential Fit';
  if (score >= 85) verdict = 'Strong Candidate';
  else if (score >= 70) verdict = 'Competitive Match';
  else if (score < 50) verdict = 'Growth Opportunity';

  return {
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 2),
    verdict,
  };
};

const SYSTEM_PROMPT = `You are an expert AI Career Match Analyst for CareerLens.
Analyze the candidate profile and job requirements, then generate a concise, tailored match explanation.

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT. DO NOT INCLUDE ANY MARKDOWN CODE BLOCKS, WRAPPERS, OR CONVERSATIONAL TEXT.

The JSON MUST strictly match this schema:
{
  "strengths": ["string", "string"],
  "gaps": ["string"],
  "verdict": "string"
}

Guidelines:
- "strengths": 2-3 concise bullet points (under 15 words each). Explicitly reference candidate's actual matched skills and specific project names where applicable.
- "gaps": 1-2 constructive bullet points (under 15 words each) highlighting the top missing skills for this role.
- "verdict": A single punchy phrase (e.g. "Strong Candidate", "Competitive Match", "High Potential", "Skill Gap in Cloud Stack").`;

/**
 * Generate AI Match Explanation using Google Gemini with native JSON mode and heuristic fallback
 *
 * @param {Object} params - { candidateProfile, job, matchedSkills, missingSkills, matchScore }
 * @returns {Promise<Object>} { strengths: string[], gaps: string[], verdict: string }
 */
const generateMatchExplanation = async ({
  candidateProfile,
  job,
  matchedSkills = [],
  missingSkills = [],
  matchScore = 0,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    console.log('[MatchExplainer] GEMINI_API_KEY is not set. Using heuristic fallback explanation.');
    return fallbackHeuristicExplainer({
      candidateProfile,
      job,
      matchedSkills,
      missingSkills,
      matchScore,
    });
  }

  // Use real, stable Gemini model names. The primary comes from env; the
  // chain below are genuine model identifiers as of the Gemini 1.5/2.0 era.
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const REAL_FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash'];
  const fallbackModels = [primaryModel, ...REAL_FALLBACK_MODELS]
    .filter((m, idx, arr) => arr.indexOf(m) === idx);

  const genAI = new GoogleGenerativeAI(apiKey);

  const candidateProjects = (candidateProfile.projects || [])
    .map((p) => `- ${p.name} (Tech: ${(p.technologies || []).join(', ')}): ${p.description}`)
    .join('\n');

  const candidateEdu = (candidateProfile.education || [])
    .map((e) => `- ${e.degree} in ${e.field} from ${e.institution}`)
    .join('\n');

  const userPrompt = `Evaluate this candidate for the following job:
JOB TITLE: ${job.title}
COMPANY: ${job.company}
JOB LOCATION: ${job.location}
JOB REQUIRED SKILLS: ${(job.skills || []).join(', ')}
CALCULATED MATCH SCORE: ${matchScore}%
MATCHED SKILLS: ${matchedSkills.join(', ') || 'None'}
MISSING SKILLS: ${missingSkills.join(', ') || 'None'}

CANDIDATE PROFILE:
- Skills: ${(candidateProfile.skills || []).join(', ')}
- Education:
${candidateEdu || 'None provided'}
- Projects:
${candidateProjects || 'None provided'}

Provide the JSON match explanation:`;

  for (const modelName of fallbackModels) {
    try {
      console.log(`[MatchExplainer] Requesting Gemini (${modelName}) for match explanation...`);
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
        console.warn(`[MatchExplainer] Model ${modelName} API error: ${apiError.message}`);
        continue; // Try next fallback model
      }

      const cleanedText = stripMarkdownFences(responseText);

      try {
        const parsed = JSON.parse(cleanedText);
        return sanitizeExplanation(parsed);
      } catch (parseError) {
        console.warn(`[MatchExplainer] Initial JSON parsing failed on ${modelName}. Retrying with formatting correction...`, parseError.message);

        const retryPrompt = `${userPrompt}\n\nYour previous response was not valid JSON (${parseError.message}). Return ONLY the raw valid JSON matching the schema.`;
        const retryResult = await model.generateContent(retryPrompt);
        const retryText = stripMarkdownFences(retryResult.response.text() || '');
        const retryParsed = JSON.parse(retryText);
        return sanitizeExplanation(retryParsed);
      }
    } catch (error) {
      console.warn(`[MatchExplainer] Model ${modelName} encountered error:`, error.message);
    }
  }

  console.warn('[MatchExplainer] Gemini models unavailable, using heuristic explainer fallback.');
  return fallbackHeuristicExplainer({
    candidateProfile,
    job,
    matchedSkills,
    missingSkills,
    matchScore,
  });
};

module.exports = {
  generateMatchExplanation,
  fallbackHeuristicExplainer,
  stripMarkdownFences,
  sanitizeExplanation,
};
