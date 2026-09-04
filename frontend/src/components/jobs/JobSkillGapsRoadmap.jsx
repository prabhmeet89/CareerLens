import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Check,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import Button from '../common/Button';

const JobSkillGapsRoadmap = ({ job = {} }) => {
  const navigate = useNavigate();
  const jobId = job.id || job._id?.toString() || '';

  const match = job.match;
  const missingSkills = match?.missingSkills || [];
  const matchedSkills = match?.matchedSkills || [];
  const totalSkillsCount = (job.skills || []).length;
  const hasSkillRequirements = totalSkillsCount > 0;
  const readinessScore = typeof job.readinessScore === 'number' ? job.readinessScore : null;

  if (!match) return null;

  return (
    <section
      className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-6 sm:p-7 shadow-sm space-y-5"
      aria-labelledby="skills-roadmap-heading"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-linkedin-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-linkedin-green-bg text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="skills-roadmap-heading" className="text-base sm:text-lg font-bold text-linkedin-text-primary">
              Skill Readiness &amp; Learning Roadmap
            </h2>
            <p className="text-xs text-linkedin-text-secondary">
              Understand your skill coverage and bridge gaps before applying
            </p>
          </div>
        </div>

        {hasSkillRequirements && readinessScore !== null ? (
          <span className="shrink-0 text-xs font-bold px-3 py-1 rounded-full border bg-emerald-50 dark:bg-linkedin-green-bg text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-linkedin-green/30">
            {readinessScore}% Readiness Score
          </span>
        ) : (
          <span className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2A2A2A] px-3 py-1 rounded-full">
            General Role
          </span>
        )}
      </div>

      {hasSkillRequirements ? (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-linkedin-text-primary">
              <span>Required Skill Coverage</span>
              <span>
                {matchedSkills.length} of {totalSkillsCount} Skills Matched ({readinessScore}%)
              </span>
            </div>
            <div
              className="w-full h-2.5 bg-gray-100 dark:bg-[#1C1C1E] rounded-full overflow-hidden border border-gray-200 dark:border-[#2A2A2A]"
              role="progressbar"
              aria-valuenow={readinessScore || 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Skill readiness score: ${readinessScore || 0}%`}
            >
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  (readinessScore || 0) >= 75
                    ? 'bg-emerald-500'
                    : (readinessScore || 0) >= 40
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.max(4, readinessScore || 0)}%` }}
              />
            </div>
          </div>

          {/* Missing Skills or All Matched Celebration */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-linkedin-text-primary uppercase tracking-wider">
              {missingSkills.length > 0
                ? `Skills to Strengthen (${missingSkills.length})`
                : 'All Required Skills Matched!'}
            </h3>

            {missingSkills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {missingSkills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-amber-200/80 dark:border-linkedin-amber/30 bg-amber-50/50 dark:bg-linkedin-amber-bg/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-amber-950 dark:text-amber-200">{skill}</span>
                    </div>
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase bg-white dark:bg-[#141414] border border-amber-200 dark:border-linkedin-amber/30 px-2 py-0.5 rounded-full">
                      Growth Area
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-linkedin-green-bg border border-emerald-200 dark:border-linkedin-green/30 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-medium flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Your profile covers all {totalSkillsCount} listed technical requirements for this position.</span>
              </div>
            )}
          </div>

          {/* Roadmap Action Card */}
          <div className="p-4 bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-linkedin-text-primary">
                Accelerate with a 4-Week Role Roadmap
              </h4>
              <p className="text-[11px] text-linkedin-text-secondary leading-relaxed">
                Generate a week-by-week curriculum with practical projects to bridge your skill gaps.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/jobs/${jobId}/roadmap`)}
              icon={BookOpen}
              className="text-xs font-bold shrink-0"
            >
              Generate Role Roadmap
            </Button>
          </div>
        </div>
      ) : (
        /* Honest fallback when no discrete skills are tagged */
        <div className="p-4 bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-bold text-linkedin-text-primary">
                No discrete technical skills listed on this posting
              </p>
              <p className="text-linkedin-text-secondary leading-relaxed">
                This employer did not include explicit skill keywords. Your match score ({match.score}%) is calculated based on overall role alignment, projects, and coursework.
              </p>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/jobs/${jobId}/roadmap`)}
              icon={TrendingUp}
              className="text-xs font-semibold"
            >
              View General Roadmap
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default JobSkillGapsRoadmap;
