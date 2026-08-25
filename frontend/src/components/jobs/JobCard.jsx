import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  Clock,
  Bookmark,
  ChevronRight,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  getCompanyInitials,
  formatPostedDate,
  formatEmploymentType,
  getScoreClassification,
  getReadinessClassification,
} from '../../utils/jobHelpers';

const JobCard = ({
  job = {},
  variant = 'standard', // 'standard' | 'saved' | 'compact'
  onToggleSave,
  isSaving = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const [logoFailed, setLogoFailed] = useState(false);

  // Safe identifier fallback
  const jobId = job.id || job._id?.toString() || '';
  const jobUrl = jobId ? `/jobs/${jobId}` : '/jobs';

  // Identity
  const companyName = job.company || 'Company';
  const initials = getCompanyInitials(companyName);

  // Metadata
  const location = job.location || 'Remote';
  const employmentType = formatEmploymentType(job.employmentType);
  const postedDate = formatPostedDate(job.postedAt || job.createdAt);
  const savedDate = variant === 'saved' && job.savedAt ? formatPostedDate(job.savedAt) : null;

  // Scores
  const matchClassification = getScoreClassification(job.match?.score);
  const readinessClassification = getReadinessClassification(job.readinessScore);
  const matchedSkills = job.match?.matchedSkills || [];
  const missingSkills = job.match?.missingSkills || [];

  // Saved & Applied States
  const isSaved = Boolean(job.isSaved);
  const isApplied = Boolean(job.alreadyApplied || job.isApplied);

  const handleCardClick = (e) => {
    // Avoid triggering navigation when clicking interactive child buttons/links
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(jobUrl);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(e, job);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={`bg-white border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-linkedin-blue/40 transition-all duration-150 cursor-pointer group flex flex-col justify-between space-y-4 relative ${className}`}
    >
      {/* ─── A. Header: Company Identity, Title, Save Bookmark ─── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Company Avatar / Logo */}
          <div className="shrink-0 w-11 h-11 rounded-lg bg-linkedin-blue-light border border-blue-200/70 text-linkedin-blue flex items-center justify-center font-black text-sm select-none shadow-2xs">
            {job.logo && !logoFailed ? (
              <img
                src={job.logo}
                alt={`${companyName} logo`}
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-contain rounded-lg p-1"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Job Title & Company */}
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-[17px] font-bold text-linkedin-text-primary group-hover:text-linkedin-blue transition-colors line-clamp-2 leading-snug">
              <Link
                to={jobUrl}
                title={job.title}
                className="focus:outline-none focus:underline"
              >
                {job.title}
              </Link>
            </h2>

            <p className="text-xs text-linkedin-text-secondary font-medium mt-0.5 flex items-center gap-1">
              <span className="font-semibold text-linkedin-text-primary">{companyName}</span>
            </p>
          </div>
        </div>

        {/* Save Bookmark Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          {onToggleSave && (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={isSaving}
              aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
              aria-pressed={isSaved}
              title={isSaved ? 'Saved' : 'Save job'}
              className={`p-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-linkedin-blue ${
                isSaved
                  ? 'bg-blue-50 text-linkedin-blue border-blue-200 shadow-2xs'
                  : 'bg-white text-gray-400 border-gray-200 hover:text-linkedin-blue hover:border-linkedin-blue/40'
              } disabled:opacity-50`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-linkedin-blue' : ''}`} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* ─── B. Metadata Row: Location, Type, Date, Salary ─── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-linkedin-text-secondary">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <span>{location}</span>
        </span>

        <span className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <span>{employmentType}</span>
        </span>

        {postedDate && (
          <span className="flex items-center gap-1.5 text-linkedin-text-muted">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{postedDate}</span>
          </span>
        )}

        {job.salary && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {job.salary}
          </span>
        )}
      </div>

      {/* ─── C. Scores and Status Badges ─── */}
      {(matchClassification || readinessClassification || isApplied) && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {/* Match Score Badge */}
          {matchClassification && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${matchClassification.badgeBg}`}
              title={`Match Score: ${matchClassification.score}% candidate alignment`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${matchClassification.dotColor}`} aria-hidden="true" />
              <span>{matchClassification.score}% Match</span>
            </div>
          )}

          {/* Readiness Score Badge */}
          {readinessClassification && (
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${readinessClassification.pillClass}`}
              title={readinessClassification.tooltip}
            >
              <Sparkles className="w-3 h-3 text-current shrink-0" aria-hidden="true" />
              <span>{readinessClassification.score}% Readiness</span>
            </div>
          )}

          {/* Applied Status Badge */}
          {isApplied && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Applied</span>
            </span>
          )}
        </div>
      )}

      {/* ─── D. Skills Preview or Match Insight ─── */}
      {variant === 'compact' && job.match ? (
        /* Compact Variant Match Summary */
        <p className="text-xs text-linkedin-text-secondary leading-relaxed bg-[#F8FAFC] border border-gray-200/70 p-2.5 rounded-lg">
          <span className="font-semibold text-linkedin-text-primary">Match Insight: </span>
          {matchedSkills.length > 0 && missingSkills.length > 0
            ? `Matches your ${matchedSkills.slice(0, 2).join(' & ')} skills, with ${missingSkills[0]} as a key learning gap.`
            : matchedSkills.length > 0
            ? `Strong technical alignment on ${matchedSkills.slice(0, 3).join(', ')}.`
            : 'Explore this opportunity to evaluate requirements.'}
        </p>
      ) : (
        /* Standard Skill Chips Preview */
        (matchedSkills.length > 0 || missingSkills.length > 0 || (job.skills || []).length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {/* Matched skills with checkmark */}
            {matchedSkills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs"
              >
                <Check className="w-2.5 h-2.5 text-emerald-600" aria-hidden="true" />
                {skill}
              </span>
            ))}

            {/* Missing skills with dashed border */}
            {missingSkills.slice(0, 2).map((skill, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-gray-600 bg-gray-50 border border-dashed border-gray-300 px-2 py-0.5 rounded-md"
              >
                {skill}
              </span>
            ))}

            {/* Fallback skills if match scoring is absent */}
            {matchedSkills.length === 0 &&
              missingSkills.length === 0 &&
              (job.skills || []).slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md"
                >
                  {skill}
                </span>
              ))}

            {/* Overflow counter */}
            {matchedSkills.length + missingSkills.length > 5 && (
              <span className="text-[10px] text-linkedin-text-muted font-medium">
                +{matchedSkills.length + missingSkills.length - 5} more
              </span>
            )}
          </div>
        )
      )}

      {/* ─── E. Footer Action: Status & View Details Link ─── */}
      <div className="pt-3 border-t border-linkedin-border flex items-center justify-between gap-3 mt-auto">
        <div className="text-[11px] text-linkedin-text-muted font-medium min-w-0 truncate">
          {variant === 'saved' && savedDate ? (
            <span>Saved {savedDate}</span>
          ) : job.match?.score ? (
            <span>5-factor weighted fit score</span>
          ) : (
            <span>Opportunity details</span>
          )}
        </div>

        <Link
          to={jobUrl}
          className="inline-flex items-center gap-1 text-xs font-bold text-linkedin-blue hover:text-linkedin-blue-hover transition-colors group-hover:translate-x-0.5 duration-150 shrink-0"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

export default JobCard;
