/**
 * Pure calculation helpers for the CareerLens Candidate Dashboard.
 */
import {
  UploadCloud,
  User,
  Sparkles,
  ClipboardList,
  Compass,
  Briefcase,
} from 'lucide-react';

/**
 * Calculates profile completion percentage and section breakdown
 * honestly from real CandidateProfile fields.
 */
export function calculateProfileCompletion(profile) {
  if (!profile) {
    return {
      percentage: 0,
      label: 'Build your profile',
      items: [
        { id: 'resume', label: 'Resume uploaded', completed: false, tip: 'Upload a PDF to parse your background' },
        { id: 'skills', label: 'Technical skills verified', completed: false, tip: 'No skills indexed yet' },
        { id: 'roles', label: 'Target role preferences', completed: false, tip: 'Add desired job tracks' },
        { id: 'projects', label: 'Projects portfolio', completed: false, tip: 'Showcase hands-on builds' },
        { id: 'education', label: 'Education background', completed: false, tip: 'Add degree & coursework' },
        { id: 'experience', label: 'Experience / internships', completed: false, tip: 'Add past work or internships' },
      ],
      completedCount: 0,
      totalCount: 6,
    };
  }

  const items = [
    {
      id: 'resume',
      label: 'Resume uploaded',
      completed: Boolean(profile.resumeId || profile._id),
      tip: profile.resumeId?.originalFileName || 'PDF parsed and indexed',
    },
    {
      id: 'skills',
      label: 'Technical skills',
      completed: Array.isArray(profile.skills) && profile.skills.length > 0,
      tip: profile.skills?.length > 0 ? `${profile.skills.length} skills verified` : 'Add your core tech stack',
    },
    {
      id: 'roles',
      label: 'Target role preferences',
      completed: Array.isArray(profile.preferredRoles) && profile.preferredRoles.length > 0,
      tip: profile.preferredRoles?.[0] || 'Specify preferred positions',
    },
    {
      id: 'projects',
      label: 'Projects portfolio',
      completed: Array.isArray(profile.projects) && profile.projects.length > 0,
      tip: profile.projects?.length > 0 ? `${profile.projects.length} project${profile.projects.length > 1 ? 's' : ''}` : 'Document practical projects',
    },
    {
      id: 'education',
      label: 'Education background',
      completed: Array.isArray(profile.education) && profile.education.length > 0,
      tip: profile.education?.[0]?.degree ? `${profile.education[0].degree} in ${profile.education[0].field || 'CS'}` : 'Add academic credentials',
    },
    {
      id: 'experience',
      label: 'Experience / internships',
      completed: Array.isArray(profile.experience) && profile.experience.length > 0,
      tip: profile.experience?.length > 0 ? `${profile.experience.length} position${profile.experience.length > 1 ? 's' : ''}` : 'Optional for early students',
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  let label = 'Build your profile';
  if (percentage >= 90) label = 'Profile ready';
  else if (percentage >= 70) label = 'Almost match-ready';
  else if (percentage >= 40) label = 'Good start';

  return { percentage, label, items, completedCount, totalCount: items.length };
}

/**
 * Derives aggregate match readiness honestly from recommended jobs and candidate profile.
 */
export function calculateMatchReadiness({ profile, jobs = [] }) {
  if (!profile || jobs.length === 0) {
    return {
      score: null,
      status: 'Incomplete',
      level: 'early',
      label: 'Complete profile to calculate readiness',
      description: 'Upload your resume so CareerLens can benchmark your verified skills against live openings.',
      topStrengths: [],
      topGaps: [],
      recommendationCount: 0,
    };
  }

  // Calculate average match score across returned recommendation page
  const validScores = jobs.map((j) => j.match?.score).filter((s) => typeof s === 'number');
  const avgScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, val) => sum + val, 0) / validScores.length)
    : 0;

  // Aggregate matched skills frequency
  const matchedFreq = {};
  const missingFreq = {};

  jobs.forEach((job) => {
    (job.match?.matchedSkills || []).forEach((skill) => {
      matchedFreq[skill] = (matchedFreq[skill] || 0) + 1;
    });
    (job.match?.missingSkills || []).forEach((skill) => {
      missingFreq[skill] = (missingFreq[skill] || 0) + 1;
    });
  });

  const topStrengths = Object.keys(matchedFreq)
    .sort((a, b) => matchedFreq[b] - matchedFreq[a])
    .slice(0, 4);

  const topGaps = Object.keys(missingFreq)
    .sort((a, b) => missingFreq[b] - missingFreq[a])
    .slice(0, 3);

  let status = 'Developing Readiness';
  let level = 'developing';
  let label = 'Developing Alignment';
  let description = 'You have relevant technical foundations with a few recurring skill gaps across top recommendations.';

  if (avgScore >= 75) {
    status = 'Strong Readiness';
    level = 'strong';
    label = 'Strong Match Readiness';
    description = 'Your verified skills and projects align well with the technical requirements of current recommendations.';
  } else if (avgScore < 50) {
    status = 'Early Readiness';
    level = 'early';
    label = 'Early Alignment';
    description = 'Building your core technical stack or projects will significantly lift match scores.';
  }

  return {
    score: avgScore,
    status,
    level,
    label,
    description,
    topStrengths,
    topGaps,
    recommendationCount: jobs.length,
  };
}

/**
 * Determines the single highest-priority next action for the candidate.
 */
export function getPrimaryNextAction({ profile, topJobs = [], applications = [] }) {
  const hasResume = Boolean(profile?.resumeId || profile);
  const skillsCount = profile?.skills?.length || 0;
  const resumeStatus = profile?.resumeId?.status;

  // 1. No resume uploaded
  if (!hasResume) {
    return {
      label: 'Upload Your Resume',
      description: 'Upload your PDF resume so CareerLens can benchmark your skills against live opportunities.',
      icon: UploadCloud,
      route: '/upload',
      variant: 'primary',
      tag: 'Step 1 of Journey',
    };
  }

  // 2. Resume uploaded but failed or pending analysis
  if (resumeStatus === 'failed' || resumeStatus === 'pending') {
    return {
      label: 'Complete Resume Analysis',
      description: 'Your resume needs analysis to index your skills and build match scores.',
      icon: UploadCloud,
      route: '/upload',
      variant: 'primary',
      tag: 'Action Required',
    };
  }

  // 3. Candidate profile incomplete (zero skills or zero target roles)
  if (skillsCount === 0 || !(profile?.preferredRoles?.length > 0)) {
    return {
      label: 'Improve Your Profile',
      description: 'Add your target roles and technical skills to sharpen recommendation accuracy.',
      icon: User,
      route: '/profile',
      variant: 'primary',
      tag: 'Profile Incomplete',
    };
  }

  // 4. Active applications in interview or offer stage that need attention
  const activeApps = applications.filter((a) => a.status === 'Interview' || a.status === 'Offer');
  if (activeApps.length > 0) {
    return {
      label: 'Update Active Applications',
      description: `You have ${activeApps.length} application${activeApps.length > 1 ? 's' : ''} in active interview/offer stages. Keep notes up to date.`,
      icon: ClipboardList,
      route: '/applications',
      variant: 'secondary',
      tag: 'Active Pipeline',
    };
  }

  // 5. Recommended jobs available with skill gaps to bridge
  if (topJobs.length > 0) {
    const firstWithGaps = topJobs.find((j) => j.match?.missingSkills?.length > 0);
    if (firstWithGaps) {
      return {
        label: 'Review Recommended Jobs',
        description: `Explore top match: "${topJobs[0].title}" at ${topJobs[0].company} (${topJobs[0].match?.score || 0}% match).`,
        icon: Sparkles,
        route: `/jobs/${topJobs[0].id || topJobs[0]._id}`,
        variant: 'primary',
        tag: 'Top Recommendation',
      };
    }

    return {
      label: 'Review Recommended Jobs',
      description: `You have ${topJobs.length} personalized opportunities ready for review.`,
      icon: Briefcase,
      route: '/jobs',
      variant: 'primary',
      tag: 'Ready to Review',
    };
  }

  // 6. Default fallback
  return {
    label: 'Explore Job Matches',
    description: 'Browse curated student career opportunities and benchmark your verified skills.',
    icon: Compass,
    route: '/jobs',
    variant: 'primary',
    tag: 'Explore Hub',
  };
}
