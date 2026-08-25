import React, { useState } from 'react';
import {
  Check,
  Briefcase,
  MapPin,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatEmploymentType } from '../../utils/jobHelpers';

const JobKeyRequirements = ({ job = {} }) => {
  const [expanded, setExpanded] = useState(false);

  const skills = job.skills || [];
  const matchedSkillsSet = new Set((job.match?.matchedSkills || []).map((s) => s.toLowerCase()));
  const employmentType = formatEmploymentType(job.employmentType);
  const location = job.location || 'Remote';
  const experience = job.experienceRequired || '0-1 years (Entry / Student level)';

  const displayedSkills = expanded ? skills : skills.slice(0, 10);
  const hasMoreSkills = skills.length > 10;

  return (
    <section
      className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-7 shadow-sm space-y-5"
      aria-labelledby="key-requirements-heading"
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-linkedin-border">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-linkedin-blue flex items-center justify-center shrink-0">
          <Layers className="w-4.5 h-4.5" aria-hidden="true" />
        </div>
        <div>
          <h2 id="key-requirements-heading" className="text-base sm:text-lg font-bold text-linkedin-text-primary">
            Key Role Requirements
          </h2>
          <p className="text-xs text-linkedin-text-secondary">
            Core qualifications and technical prerequisites for this opportunity
          </p>
        </div>
      </div>

      {/* Structured Requirements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        {/* Experience Required */}
        <div className="p-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-linkedin-text-secondary uppercase text-[10px]">
            <Briefcase className="w-3.5 h-3.5 text-linkedin-blue" aria-hidden="true" />
            <span>Experience Level</span>
          </div>
          <p className="font-semibold text-linkedin-text-primary text-sm">{experience}</p>
        </div>

        {/* Location / Arrangement */}
        <div className="p-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-linkedin-text-secondary uppercase text-[10px]">
            <MapPin className="w-3.5 h-3.5 text-linkedin-blue" aria-hidden="true" />
            <span>Work Arrangement</span>
          </div>
          <p className="font-semibold text-linkedin-text-primary text-sm">{location}</p>
        </div>

        {/* Employment Type */}
        <div className="p-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-linkedin-text-secondary uppercase text-[10px]">
            <GraduationCap className="w-3.5 h-3.5 text-linkedin-blue" aria-hidden="true" />
            <span>Position Type</span>
          </div>
          <p className="font-semibold text-linkedin-text-primary text-sm">{employmentType}</p>
        </div>
      </div>

      {/* Technical Skills Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-linkedin-text-primary uppercase tracking-wider">
            Required Technical Stack &amp; Keywords ({skills.length})
          </h3>
          {job.match && skills.length > 0 && (
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {(job.match.matchedSkills || []).length} Matched in Profile
            </span>
          )}
        </div>

        {skills.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {displayedSkills.map((skill, idx) => {
                const isMatched = matchedSkillsSet.has(skill.toLowerCase());
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      isMatched
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {isMatched && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />}
                    <span>{skill}</span>
                  </span>
                );
              })}
            </div>

            {/* Expand / Collapse Button */}
            {hasMoreSkills && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-xs font-bold text-linkedin-blue hover:underline focus:outline-none"
              >
                <span>{expanded ? 'Show less skills' : `+ Show ${skills.length - 10} more skills`}</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-linkedin-text-secondary leading-relaxed">
            No discrete technical skills were tagged on this imported listing. Please review the full job description below for specific role requirements.
          </div>
        )}
      </div>
    </section>
  );
};

export default JobKeyRequirements;
