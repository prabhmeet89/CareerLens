import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

const SkillGapsRoadmapCard = ({ topJobs = [], loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-5 shadow-sm animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-[#222222] rounded w-1/3" />
        <div className="h-10 bg-gray-100 dark:bg-[#1A1A1A] rounded" />
      </div>
    );
  }

  // Aggregate missing skills across top recommendation cards
  const missingSkillCount = {};
  topJobs.forEach((job) => {
    (job.match?.missingSkills || []).forEach((skill) => {
      missingSkillCount[skill] = (missingSkillCount[skill] || 0) + 1;
    });
  });

  const recurringGaps = Object.keys(missingSkillCount)
    .sort((a, b) => missingSkillCount[b] - missingSkillCount[a])
    .slice(0, 4);

  // Target job to build roadmap around (first job with gaps, or first job)
  const targetJob = topJobs.find((j) => (j.match?.missingSkills || []).length > 0) || topJobs[0];

  return (
    <section
      className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm space-y-4"
      aria-labelledby="skill-gaps-heading"
    >
      <div className="flex items-center justify-between pb-3 border-b border-linkedin-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linkedin-purple-bg text-linkedin-purple flex items-center justify-center shrink-0">
            <Compass className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 id="skill-gaps-heading" className="text-base font-bold text-linkedin-text-primary">
              Skill Gap &amp; Learning Roadmaps
            </h2>
            <p className="text-xs text-linkedin-text-secondary">
              Close key requirements to unlock higher-tier match scores
            </p>
          </div>
        </div>
      </div>

      {recurringGaps.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-linkedin-text-secondary leading-relaxed">
            The following technical skills appear most frequently as gaps across your recommended roles:
          </p>

          {/* Gaps List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recurringGaps.map((skill) => (
              <div
                key={skill}
                className="p-3 bg-amber-50/60 dark:bg-linkedin-amber-bg border border-amber-200/80 dark:border-linkedin-amber/30 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-950 dark:text-linkedin-amber">{skill}</span>
                </div>
                <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-white dark:bg-[#141414] border border-amber-200 dark:border-linkedin-amber/30 px-2 py-0.5 rounded-full">
                  Appears in {missingSkillCount[skill]} role{missingSkillCount[skill] > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="p-4 bg-linkedin-inset border border-linkedin-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-linkedin-text-primary">
                Accelerate with a 4-Week Project Roadmap
              </h3>
              <p className="text-[11px] text-linkedin-text-secondary">
                Generate a structured curriculum tailored to {targetJob?.title ? `"${targetJob.title}"` : 'your target career track'}.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (targetJob?.id || targetJob?._id) {
                  navigate(`/jobs/${targetJob.id || targetJob._id}/roadmap`);
                } else {
                  navigate('/jobs');
                }
              }}
              icon={BookOpen}
              className="text-xs font-bold shrink-0"
            >
              View Role Roadmap
            </Button>
          </div>
        </div>
      ) : (
        /* No Gaps State */
        <div className="text-center py-6 px-4 bg-emerald-50/40 dark:bg-linkedin-green-bg border border-emerald-200/70 dark:border-linkedin-green/30 rounded-xl space-y-2">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
          <h3 className="text-xs font-bold text-emerald-900 dark:text-linkedin-green">
            Strong Skill Alignment
          </h3>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto">
            Your current profile covers the primary technical requirements for your top recommendations.
          </p>
        </div>
      )}
    </section>
  );
};

export default SkillGapsRoadmapCard;
