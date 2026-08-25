const { normalizeSkill, normalizeSkills } = require('../utils/normalizeSkills');

/**
 * ============================================================================
 * CAREERLENS MATCHING ENGINE
 * ============================================================================
 *
 * Weighting Rationale:
 * -------------------
 * - Skills (50%): The strongest predictor of technical capability. We evaluate
 *   the proportion of mandatory job skills possessed by the student candidate.
 * - Projects (20%): For students and early-career engineers, hands-on projects
 *   provide crucial verification that theoretical skills were applied in real
 *   software builds and architectures.
 * - Experience (15%): Evaluates prior internships/roles. To prevent unfair
 *   penalties on entry-level candidates, internships and "0-1 year" roles award
 *   full credit regardless of prior employment count.
 * - Education (10%): Validates degree progression in Computer Science, Software
 *   Engineering, or related STEM fields.
 * - Location (5%): Accounts for remote flexibility vs on-site work location.
 * ============================================================================
 */

/**
 * Calculates a comprehensive match score (0-100) between a CandidateProfile and a Job.
 *
 * @param {Object} candidateProfile - Extracted candidate profile object
 * @param {Object} job - Job document or plain object
 * @returns {Object} { score, matchedSkills, missingSkills, breakdown }
 */
const calculateMatchScore = (candidateProfile, job) => {
  const profile = candidateProfile || {};
  const targetJob = job || {};

  // 1. Prepare and Normalize Job Skills
  const rawJobSkills = Array.isArray(targetJob.skills) ? targetJob.skills : [];
  const normalizedJobSkillsMap = new Map(); // normalized -> original
  for (const raw of rawJobSkills) {
    const norm = normalizeSkill(raw);
    if (norm && !normalizedJobSkillsMap.has(norm)) {
      normalizedJobSkillsMap.set(norm, raw);
    }
  }
  const normalizedJobSkills = Array.from(normalizedJobSkillsMap.keys());

  // 2. Prepare Candidate Skills
  const rawCandidateSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const normalizedCandidateSkills = new Set(normalizeSkills(rawCandidateSkills));

  // 3. Prepare Candidate Project Technologies
  const projectTechSet = new Set();
  if (Array.isArray(profile.projects)) {
    for (const project of profile.projects) {
      if (Array.isArray(project.technologies)) {
        for (const tech of project.technologies) {
          const norm = normalizeSkill(tech);
          if (norm) projectTechSet.add(norm);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Category A: Skills Score (50% weight)
  // --------------------------------------------------------------------------
  let skillsScore = 0;
  const matchedSkills = [];
  const missingSkills = [];

  if (normalizedJobSkills.length === 0) {
    // Job specifies no explicit skills — assign a neutral mid-range baseline
    // rather than full marks. Awarding 50/50 would contradict the honest UI
    // message 'No explicit technical skills listed' shown on the job detail page.
    skillsScore = 25;
  } else {
    for (const normSkill of normalizedJobSkills) {
      const originalSkillName = normalizedJobSkillsMap.get(normSkill);
      if (normalizedCandidateSkills.has(normSkill)) {
        matchedSkills.push(originalSkillName);
      } else {
        missingSkills.push(originalSkillName);
      }
    }
    const skillMatchRatio = matchedSkills.length / normalizedJobSkills.length;
    skillsScore = Number((skillMatchRatio * 50).toFixed(2));
  }

  // --------------------------------------------------------------------------
  // Category B: Projects Tech Stack Score (20% weight)
  // --------------------------------------------------------------------------
  let projectsScore = 0;
  if (normalizedJobSkills.length === 0) {
    // Neutral mid-range baseline when no job skills are listed — mirrors the
    // rationale for skillsScore above to keep the breakdown internally consistent.
    projectsScore = 10;
  } else {
    let projectMatchCount = 0;
    for (const normSkill of normalizedJobSkills) {
      if (projectTechSet.has(normSkill)) {
        projectMatchCount++;
      }
    }
    const projectMatchRatio = projectMatchCount / normalizedJobSkills.length;
    projectsScore = Number((projectMatchRatio * 20).toFixed(2));
  }

  // --------------------------------------------------------------------------
  // Category C: Experience Score (15% weight)
  // --------------------------------------------------------------------------
  let experienceScore = 0;
  const hasExperience = Array.isArray(profile.experience) && profile.experience.length > 0;
  const expReq = String(targetJob.experienceRequired || '').toLowerCase();
  const jobTitle = String(targetJob.title || '').toLowerCase();
  const empType = String(targetJob.employmentType || '').toLowerCase();

  const isEntryLevelOrInternship =
    empType === 'internship' ||
    jobTitle.includes('intern') ||
    jobTitle.includes('entry') ||
    jobTitle.includes('junior') ||
    jobTitle.includes('associate') ||
    expReq.includes('0-1') ||
    expReq.includes('entry') ||
    expReq.includes('intern') ||
    expReq === '' ||
    expReq === '0';

  if (hasExperience) {
    // Candidate has work experience
    experienceScore = 15;
  } else if (isEntryLevelOrInternship) {
    // Student candidate applying for internship / entry role is not penalized
    experienceScore = 15;
  } else {
    // Candidate has no experience for non-entry role -> partial credit
    experienceScore = 7.5;
  }

  // --------------------------------------------------------------------------
  // Category D: Education Score (10% weight)
  // --------------------------------------------------------------------------
  let educationScore = 0;
  const educationList = Array.isArray(profile.education) ? profile.education : [];

  if (educationList.length > 0) {
    const relevantKeywords = [
      'computer science',
      'software',
      'engineering',
      'data',
      'information technology',
      'cs',
      'math',
      'physics',
      'statistics',
      'cybersecurity',
      'ai',
    ];

    let hasRelevantDegree = false;
    for (const edu of educationList) {
      const field = String(edu.field || '').toLowerCase();
      const degree = String(edu.degree || '').toLowerCase();
      if (
        relevantKeywords.some((kw) => field.includes(kw) || degree.includes(kw))
      ) {
        hasRelevantDegree = true;
        break;
      }
    }

    educationScore = hasRelevantDegree ? 10 : 8; // 10 for STEM, 8 for general degree
  } else {
    educationScore = 5; // Neutral baseline if education was not extracted
  }

  // --------------------------------------------------------------------------
  // Category E: Location Score (5% weight)
  // --------------------------------------------------------------------------
  let locationScore = 0;
  const jobLocation = String(targetJob.location || '').toLowerCase();
  const candidateLocation = String(profile.location || '').toLowerCase();

  if (jobLocation.includes('remote')) {
    locationScore = 5;
  } else if (candidateLocation && jobLocation.includes(candidateLocation)) {
    locationScore = 5;
  } else if (!candidateLocation) {
    // Default neutral score when candidate has no location preference set
    locationScore = 4;
  } else {
    locationScore = 2.5;
  }

  // --------------------------------------------------------------------------
  // Aggregate & Round Total Score
  // --------------------------------------------------------------------------
  const rawTotal =
    skillsScore + projectsScore + experienceScore + educationScore + locationScore;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  return {
    score: finalScore,
    matchedSkills,
    missingSkills,
    breakdown: {
      skillsScore: Math.round(skillsScore),
      projectsScore: Math.round(projectsScore),
      experienceScore: Math.round(experienceScore),
      educationScore: Math.round(educationScore),
      locationScore: Math.round(locationScore),
    },
  };
};

module.exports = {
  calculateMatchScore,
};
