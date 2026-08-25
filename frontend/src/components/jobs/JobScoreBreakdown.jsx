import React from 'react';
import { Layers } from 'lucide-react';

const JobScoreBreakdown = ({ job = {} }) => {
  const match = job.match;
  if (!match) return null;

  const breakdown = match.breakdown || {};
  const hasSkillRequirements = (job.skills || []).length > 0;

  return (
    <section
      className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-7 shadow-sm space-y-5"
      aria-labelledby="score-breakdown-heading"
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-linkedin-border">
        <div className="w-8 h-8 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center shrink-0">
          <Layers className="w-4.5 h-4.5" aria-hidden="true" />
        </div>
        <div>
          <h2 id="score-breakdown-heading" className="text-base sm:text-lg font-bold text-linkedin-text-primary">
            5-Factor Algorithm Breakdown
          </h2>
          <p className="text-xs text-linkedin-text-secondary">
            Deterministic weighted scoring distribution across candidate profile dimensions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        {/* Skills */}
        <div className="p-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
          <div className="text-[10px] font-bold text-linkedin-text-secondary uppercase tracking-wider">
            Skills (50%)
          </div>
          <div className="text-xl font-black text-linkedin-blue">
            {breakdown.skillsScore ?? 0}/50
          </div>
          <div className="text-[10px] text-linkedin-text-muted">
            {hasSkillRequirements ? 'Direct stack match' : 'Baseline credit'}
          </div>
        </div>

        {/* Projects */}
        <div className="p-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
          <div className="text-[10px] font-bold text-linkedin-text-secondary uppercase tracking-wider">
            Projects (20%)
          </div>
          <div className="text-xl font-black text-emerald-600">
            {breakdown.projectsScore ?? 0}/20
          </div>
          <div className="text-[10px] text-linkedin-text-muted">
            {hasSkillRequirements ? 'Applied in builds' : 'Baseline credit'}
          </div>
        </div>

        {/* Experience */}
        <div className="p-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
          <div className="text-[10px] font-bold text-linkedin-text-secondary uppercase tracking-wider">
            Experience (15%)
          </div>
          <div className="text-xl font-black text-amber-600">
            {breakdown.experienceScore ?? 0}/15
          </div>
          <div className="text-[10px] text-linkedin-text-muted">Internship credit</div>
        </div>

        {/* Education */}
        <div className="p-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
          <div className="text-[10px] font-bold text-linkedin-text-secondary uppercase tracking-wider">
            Education (10%)
          </div>
          <div className="text-xl font-black text-purple-600">
            {breakdown.educationScore ?? 0}/10
          </div>
          <div className="text-[10px] text-linkedin-text-muted">Degree relevance</div>
        </div>

        {/* Location */}
        <div className="p-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-linkedin-text-secondary uppercase tracking-wider">
            Location (5%)
          </div>
          <div className="text-xl font-black text-indigo-600">
            {breakdown.locationScore ?? 0}/5
          </div>
          <div className="text-[10px] text-linkedin-text-muted">Remote / Area</div>
        </div>
      </div>
    </section>
  );
};

export default JobScoreBreakdown;
