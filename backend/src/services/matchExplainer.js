'use strict';

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

const AI_DISCLOSURE =
  'AI-assisted guidance based on your CareerLens profile and this job listing. Review original job requirements before making decisions.';

/**
 * Sanitize and validate match explanation data
 */
const sanitizeExplanation = (data) => {
  return {
    strengths: Array.isArray(data?.strengths)
      ? data.strengths
          .filter((s) => s !== null && s !== undefined)
          .map((s) => String(s).trim().slice(0, 300))
          .filter(Boolean)
          .slice(0, 5)
      : [],
    gaps: Array.isArray(data?.gaps)
      ? data.gaps
          .filter((g) => g !== null && g !== undefined)
          .map((g) => String(g).trim().slice(0, 300))
          .filter(Boolean)
          .slice(0, 5)
      : [],
    verdict: String(data?.verdict || 'Promising Match').trim().slice(0, 100),
    aiDisclaimer: AI_DISCLOSURE,
  };
};

/**
 * Heuristic fallback explanation when GEMINI_API_KEY is not configured
 */
const fallbackHeuristicExplainer = ({ candidateProfile, job, matchedSkills, missingSkills, matchScore }) => {
  const profile = candidateProfile || {};
  const matched = matchedSkills || [];
  const missing = missingSkills || [];
  const score = matchScore || 50;

  const strengths = [];
  const gaps = [];

  // Determine strengths from matched skills and projects
  if (matched.length > 0) {
    strengths.push(`Direct technical alignment on core stack: ${matched.slice(0, 3).join(', ')}.`);
  }

  if (Array.isArray(profile.projects) && profile.projects.length > 0) {
    const topProj = profile.projects[0];
    strengths.push(`Hands-on experience building '${topProj.name}' demonstrating practical implementation.`);
  }

  if (Array.isArray(profile.education) && profile.education.length > 0) {
    const edu = profile.education[0];
    strengths.push(`Academic foundation in ${edu.field || 'Computer Science'} at ${edu.institution || 'University'}.`);
  }

  if (strengths.length === 0) {
    strengths.push('Foundational technical problem-solving capabilities.');
  }

  // Determine gaps from missing skills
  if (missing.length > 0) {
    gaps.push(`Familiarity with ${missing.slice(0, 3).join(', ')} would strengthen profile alignment.`);
  } else {
    gaps.push('Your profile covers all explicitly listed technical skills.');
  }

  // Unified verdict based on score thresholds
  let verdict = 'Promising Match';
  if (score >= 75) verdict = 'Strong Match';
  else if (score < 50) verdict = 'Needs Skill Development';

  return {
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 2),
    verdict,
    aiDisclaimer: AI_DISCLOSURE,
  };
};

const SYSTEM_PROMPT = `You are a Career Match Analyst for CareerLens.
Analyze the candidate profile and job requirements, then generate a concise, truthful match explanation.

CRITICAL RULES:
- The deterministic match score, matched skills, and missing skills are authoritative. Do not redefine or contradict them.
- Do not invent skills, experience, projects, employers, or certifications.
- Do not guarantee interviews, employment, or hiring outcomes.
- Do not claim to speak for the employer.

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT. DO NOT INCLUDE ANY MARKDOWN CODE BLOCKS, WRAPPERS, OR CONVERSATIONAL TEXT.

The JSON MUST strictly match this schema:
{
  "strengths": ["string", "string"],
  "gaps": ["string"],
  "verdict": "string"
}

Guidelines:
- "strengths": 2-3 concise bullet points (under 15 words each). Reference candidate's actual matched skills and projects.
- "gaps": 1-2 constructive bullet points (under 15 words each) highlighting missing technical skills for this role.
- "verdict": One concise phrase: "Strong Match", "Promising Match", or "Needs Skill Development".`;

/**
 * Generate AI Match Explanation using Google Gemini with native JSON mode and heuristic fallback
 *
 * @param {Object} params - { candidateProfile, job, matchedSkills, missingSkills, matchScore }
 * @returns {Promise<Object>} { strengths: string[], gaps: string[], verdict: string, aiDisclaimer: string }
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

Generate a concise match explanation JSON:`;

  const startTime = performance.now();
  let attempts = 0;

  for (const modelName of fallbackModels) {
    attempts++;
    const modelStart = performance.now();
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
        const durationMs = Math.round(performance.now() - modelStart);
        console.warn(`[MatchExplainer] Model ${modelName} API error (${durationMs}ms): ${apiError.message}`);
        continue;
      }

      const cleanedText = stripMarkdownFences(responseText);

      try {
        const parsed = JSON.parse(cleanedText);
        const totalDurationMs = Math.round(performance.now() - startTime);
        console.log(`[AI Metric] type=match_explanation model=${modelName} durationMs=${totalDurationMs} status=${attempts > 1 ? 'fallback_used' : 'success'} attempts=${attempts}`);
        return sanitizeExplanation(parsed);
      } catch (parseError) {
        console.warn(`[MatchExplainer] Initial JSON parsing failed on ${modelName}. Retrying...`, parseError.message);

        const retryPrompt = `${userPrompt}\n\nYour previous response was not valid JSON (${parseError.message}). Return ONLY raw valid JSON matching the schema.`;
        const retryResult = await model.generateContent(retryPrompt);
        const retryText = stripMarkdownFences(retryResult.response.text() || '');
        const retryParsed = JSON.parse(retryText);
        const totalDurationMs = Math.round(performance.now() - startTime);
        console.log(`[AI Metric] type=match_explanation model=${modelName} durationMs=${totalDurationMs} status=repaired_json attempts=${attempts}`);
        return sanitizeExplanation(retryParsed);
      }
    } catch (error) {
      console.warn(`[MatchExplainer] Model ${modelName} encountered error:`, error.message);
    }
  }

  const totalDurationMs = Math.round(performance.now() - startTime);
  console.warn(`[AI Metric] type=match_explanation model=heuristic_fallback durationMs=${totalDurationMs} status=heuristic_fallback attempts=${attempts}`);
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
  AI_DISCLOSURE,
};
