const Anthropic = require('@anthropic-ai/sdk');

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
 * Heuristic fallback explanation when ANTHROPIC_API_KEY is not configured
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

const SYSTEM_PROMPT = `You are an expert AI Career Match Analyst for Resume2Role.
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
 * Generate AI Match Explanation using Anthropic Claude with defensive retry and heuristic fallback
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
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_anthropic_api_key')) {
    console.log('[MatchExplainer] ANTHROPIC_API_KEY is not set. Using heuristic fallback explanation.');
    return fallbackHeuristicExplainer({
      candidateProfile,
      job,
      matchedSkills,
      missingSkills,
      matchScore,
    });
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  const anthropic = new Anthropic({ apiKey });

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

  try {
    console.log(`[MatchExplainer] Requesting Claude (${model}) for match explanation...`);
    const response = await anthropic.messages.create({
      model,
      max_tokens: 600,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText = response.content?.[0]?.text || '';
    const cleanedText = stripMarkdownFences(responseText);

    try {
      const parsed = JSON.parse(cleanedText);
      return sanitizeExplanation(parsed);
    } catch (parseError) {
      console.warn('[MatchExplainer] Initial JSON parsing failed. Retrying with formatting correction...', parseError.message);

      const retryResponse = await anthropic.messages.create({
        model,
        max_tokens: 600,
        temperature: 0.0,
        messages: [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: responseText },
          {
            role: 'user',
            content: 'Your previous response was not valid JSON. Return ONLY the raw valid JSON matching the schema, with no markdown code blocks.',
          },
        ],
      });

      const retryText = stripMarkdownFences(retryResponse.content?.[0]?.text || '');
      const retryParsed = JSON.parse(retryText);
      return sanitizeExplanation(retryParsed);
    }
  } catch (error) {
    console.error('[MatchExplainer Error]: Failed to call Anthropic Claude:', error.message);
    return fallbackHeuristicExplainer({
      candidateProfile,
      job,
      matchedSkills,
      missingSkills,
      matchScore,
    });
  }
};

module.exports = {
  generateMatchExplanation,
  fallbackHeuristicExplainer,
  stripMarkdownFences,
  sanitizeExplanation,
};
