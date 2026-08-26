import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  Clock,
  Bookmark,
  ChevronRight,
  CheckCircle2,
  Zap,
  DollarSign,
} from 'lucide-react';
import {
  getCompanyInitials,
  formatPostedDate,
  formatEmploymentType,
  getScoreClassification,
  getReadinessClassification,
} from '../../utils/jobHelpers';
import { getClearbitLogoUrl } from '../../utils/companyLogo';

// ─── Score badge helpers ───────────────────────────────────────────────────────

/**
 * Returns the colored pill classes for the Match Score — the ONE primary
 * colored signal on the card. Tiers: strong (green) / promising (amber) /
 * developing (blue-gray).
 */
function matchBadgeClasses(tier) {
  switch (tier) {
    case 'strong':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold';
    case 'promising':
      return 'bg-amber-50 text-amber-800 border border-amber-200 font-bold';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200 font-semibold';
  }
}

/**
 * Dot indicator color matching the match tier — used inside the badge.
 */
function matchDotColor(tier) {
  switch (tier) {
    case 'strong':
      return 'bg-emerald-500';
    case 'promising':
      return 'bg-amber-500';
    default:
      return 'bg-slate-400';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const clearbitLogoUrl = getClearbitLogoUrl(companyName);

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

  // Skill rendering: for the skill area, show matched first then missing
  const allJobSkills = job.skills || [];
  const hasMatchData = matchedSkills.length > 0 || missingSkills.length > 0;

  const handleCardClick = (e) => {
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
      className={`bg-white border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-linkedin-blue/30 transition-all duration-150 cursor-pointer group flex flex-col justify-between space-y-3.5 relative ${className}`}
    >
      {/* ─── A. Header: Company Logo, Title, Company Name, Save Button ─── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Company Avatar / Logo — tries Clearbit first, falls back to initials */}
          <div className="shrink-0 w-11 h-11 rounded-lg bg-linkedin-blue-light border border-blue-200/60 text-linkedin-blue flex items-center justify-center font-black text-sm select-none shadow-2xs overflow-hidden">
            {clearbitLogoUrl && !logoFailed ? (
              <img
                src={clearbitLogoUrl}
                alt={`${companyName} logo`}
                loading="lazy"
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Job Title & Company Name */}
          <div className="min-w-0 flex-1">
            {/* Title: boldest, darkest, most prominent element */}
            <h2 className="text-base sm:text-[17px] font-bold text-linkedin-text-primary group-hover:text-linkedin-blue transition-colors line-clamp-2 leading-snug">
              <Link
                to={jobUrl}
                title={job.title}
                className="focus:outline-none focus:underline"
              >
                {job.title}
              </Link>
            </h2>

            {/* Company name: muted, not bold — supporting context below the title */}
            <p className="text-xs text-linkedin-text-secondary mt-0.5 truncate">
              {companyName}
            </p>
          </div>
        </div>

        {/* Save Bookmark Action */}
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

      {/* ─── B. Metadata Row: Location, Type, Date — all plain muted icon+text ─── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-linkedin-text-secondary">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <span>{location}</span>
        </span>

        <span className="text-gray-300" aria-hidden="true">·</span>

        <span className="flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <span>{employmentType}</span>
        </span>

        {postedDate && (
          <>
            <span className="text-gray-300" aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-linkedin-text-muted">
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{postedDate}</span>
            </span>
          </>
        )}

        {/* Salary: plain text with icon — not a colored pill */}
        {job.salary && (
          <>
            <span className="text-gray-300 hidden sm:inline" aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-linkedin-text-muted font-medium">
              <DollarSign className="w-3.5 h-3.5 shrink-0 text-gray-400" aria-hidden="true" />
              <span className="truncate max-w-[140px]">{job.salary}</span>
            </span>
          </>
        )}
      </div>

      {/* ─── C. Score Signals & Applied Status ─── */}
      {(matchClassification || readinessClassification || isApplied) && (
        <div className="flex flex-wrap items-center gap-2">
          {/* ① Match Score — the ONE primary colored badge. Color-coded by tier. */}
          {matchClassification && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${matchBadgeClasses(matchClassification.tier)}`}
              title={`Match Score: ${matchClassification.score}% — ${matchClassification.explanation}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${matchDotColor(matchClassification.tier)}`}
                aria-hidden="true"
              />
              <span>{matchClassification.score}% Match</span>
            </div>
          )}

          {/* ② Readiness Score — visually subordinate: outline-only, no fill, smaller */}
          {readinessClassification && (
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 text-[11px] font-medium text-linkedin-text-secondary bg-transparent"
              title={readinessClassification.tooltip}
            >
              <Zap className="w-3 h-3 text-gray-400 shrink-0" aria-hidden="true" />
              <span>{readinessClassification.score}% Ready</span>
            </div>
          )}

          {/* ③ Applied — blue brand color, distinct from green match tier */}
          {isApplied && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-linkedin-blue bg-linkedin-blue-light border border-blue-200 px-2.5 py-0.5 rounded-full"
              title="You have already applied to this position"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Applied</span>
            </span>
          )}
        </div>
      )}

      {/* ─── D. Skills — restrained dot-separated or outline chips ─── */}
      {variant === 'compact' && job.match ? (
        /* Compact variant: plain prose match insight — no chips */
        <p className="text-xs text-linkedin-text-secondary leading-relaxed bg-[#F8FAFC] border border-gray-100 p-2.5 rounded-lg">
          <span className="font-semibold text-linkedin-text-primary">Match insight: </span>
          {matchedSkills.length > 0 && missingSkills.length > 0
            ? `Matches your ${matchedSkills.slice(0, 2).join(' & ')} skills, with ${missingSkills[0]} as a key learning gap.`
            : matchedSkills.length > 0
            ? `Strong technical alignment on ${matchedSkills.slice(0, 3).join(', ')}.`
            : 'Explore this opportunity to evaluate requirements.'}
        </p>
      ) : hasMatchData ? (
        /* With match data: dot-separated list, matched skills bold/dark, missing skills muted */
        <div className="flex flex-wrap items-center gap-x-0 gap-y-1 text-[11px] leading-relaxed">
          {[
            ...matchedSkills.slice(0, 3).map((s) => ({ s, matched: true })),
            ...missingSkills.slice(0, 2).map((s) => ({ s, matched: false })),
          ].map(({ s, matched }, idx, arr) => (
            <React.Fragment key={`${s}-${idx}`}>
              <span
                className={matched
                  ? 'font-semibold text-linkedin-text-primary'
                  : 'font-normal text-linkedin-text-muted'}
                title={matched ? 'Matched skill' : 'Skill to develop'}
              >
                {s}
              </span>
              {idx < arr.length - 1 && (
                <span className="px-1.5 text-gray-300" aria-hidden="true">·</span>
              )}
            </React.Fragment>
          ))}
          {matchedSkills.length + missingSkills.length > 5 && (
            <span className="pl-1.5 text-linkedin-text-muted">
              +{matchedSkills.length + missingSkills.length - 5}
            </span>
          )}
        </div>
      ) : allJobSkills.length > 0 ? (
        /* No match data: plain dot-separated skill list in muted gray */
        <div className="flex flex-wrap items-center gap-x-0 gap-y-1 text-[11px] text-linkedin-text-secondary">
          {allJobSkills.slice(0, 5).map((skill, idx, arr) => (
            <React.Fragment key={`${skill}-${idx}`}>
              <span>{skill}</span>
              {idx < arr.length - 1 && (
                <span className="px-1.5 text-gray-300" aria-hidden="true">·</span>
              )}
            </React.Fragment>
          ))}
          {allJobSkills.length > 5 && (
            <span className="pl-1.5 text-linkedin-text-muted">+{allJobSkills.length - 5}</span>
          )}
        </div>
      ) : null}

      {/* ─── E. Footer: Supporting caption + View Details link ─── */}
      <div className="pt-3 border-t border-linkedin-border flex items-center justify-between gap-3 mt-auto">
        <div className="text-[11px] text-linkedin-text-muted font-normal min-w-0 truncate">
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
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-linkedin-blue hover:text-linkedin-blue-hover transition-colors shrink-0"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

export default JobCard;
