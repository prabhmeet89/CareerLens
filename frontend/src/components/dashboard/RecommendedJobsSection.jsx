import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  Building2,
  MapPin,
  Bookmark,
  ChevronRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import Button from '../common/Button';
import api from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';

/**
 * Builds a deterministic summary of why a job matches without expensive per-card AI calls.
 */
function buildMatchSummary(match = {}) {
  const matched = match.matchedSkills || [];
  const missing = match.missingSkills || [];

  if (matched.length > 0 && missing.length > 0) {
    return `Matches your ${matched.slice(0, 2).join(' & ')} skills, with ${missing[0]} as a key learning gap.`;
  }
  if (matched.length > 0) {
    return `Strong direct alignment on your core stack: ${matched.slice(0, 3).join(', ')}.`;
  }
  if (missing.length > 0) {
    return `Potential growth role — introduces ${missing.slice(0, 2).join(' & ')}.`;
  }
  return 'General tech opportunity aligned with your academic background and level.';
}

const RecommendedJobsSection = ({
  jobs = [],
  total = 0,
  hasProfile = true,
  loading = false,
  error = null,
  onRetry,
  truncated = false,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  // Toggle save/unsave job optimistically
  const handleToggleSave = async (e, job) => {
    e.stopPropagation();
    const jobId = job.id || job._id;
    const isCurrentlySaved = savedJobIds.has(jobId) || job.isSaved;

    // Optimistic toggle
    const nextSaved = new Set(savedJobIds);
    if (isCurrentlySaved) nextSaved.delete(jobId);
    else nextSaved.add(jobId);
    setSavedJobIds(nextSaved);
    setSavingId(jobId);

    try {
      const res = await api.post(`/jobs/${jobId}/save`);
      if (res.data?.success) {
        if (res.data.saved) {
          toast.success(`Saved "${job.title}" to your jobs!`);
        } else {
          toast.info(`Removed "${job.title}" from saved jobs.`);
        }
      }
    } catch {
      // Revert optimistic update
      setSavedJobIds(new Set(savedJobIds));
      toast.error('Could not update saved job status. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const getScoreBadge = (score = 0) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        dot: 'bg-emerald-500',
        label: 'High Match',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-300',
        dot: 'bg-amber-500',
        label: 'Good Match',
      };
    }
    return {
      bg: 'bg-gray-100 text-gray-600 border-gray-300',
      dot: 'bg-gray-400',
      label: 'Low Match',
    };
  };

  return (
    <section
      className="bg-white border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm space-y-4"
      aria-labelledby="recommended-jobs-heading"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-linkedin-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 id="recommended-jobs-heading" className="text-base font-bold text-linkedin-text-primary">
              Recommended Jobs For You
            </h2>
            <p className="text-xs text-linkedin-text-secondary">
              Personalized opportunities ranked by verified skill overlap
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/jobs')}
          className="text-xs font-semibold shrink-0"
        >
          View All ({total || jobs.length})
        </Button>
      </div>

      {/* Truncated pool notice if active */}
      {truncated && (
        <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg text-[11px] text-linkedin-blue flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Recommendations ranked from top active listings in our student opportunities hub.</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-bold text-red-900 underline hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 rounded-xl border border-linkedin-border bg-gray-50/50 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-20" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : !hasProfile || jobs.length === 0 ? (
        /* Empty State */
        <div className="text-center py-8 px-4 space-y-3 bg-[#F8FAFC] border border-dashed border-gray-300 rounded-xl">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-linkedin-text-primary">
              {!hasProfile ? 'Unlock Personalized Recommendations' : 'No Recommended Jobs Available'}
            </h3>
            <p className="text-xs text-linkedin-text-secondary mt-1">
              {!hasProfile
                ? 'Upload your PDF resume so our matching engine can calculate personalized match scores and rank top roles.'
                : 'We could not find active matches for your current profile. Explore all jobs or refine your skills.'}
            </p>
          </div>
          <div className="pt-1 flex justify-center gap-2">
            {!hasProfile ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/upload')}
                className="text-xs font-bold"
              >
                Upload Resume
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/jobs')}
                className="text-xs font-bold"
              >
                Explore All Jobs
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Jobs List */
        <div className="space-y-3">
          {jobs.slice(0, 4).map((job) => {
            const jobId = job.id || job._id;
            const isSaved = savedJobIds.has(jobId) || job.isSaved;
            const badge = getScoreBadge(job.match?.score || 0);
            const matchedSkills = job.match?.matchedSkills || [];
            const missingSkills = job.match?.missingSkills || [];
            const whySummary = buildMatchSummary(job.match);

            return (
              <article
                key={jobId}
                onClick={() => navigate(`/jobs/${jobId}`)}
                className="p-4 rounded-xl border border-linkedin-border bg-[#FCFCFD] hover:bg-white hover:border-linkedin-blue/50 hover:shadow-xs transition-all cursor-pointer group space-y-3"
              >
                {/* Header: Title, Company, Match Badge, Save Bookmark */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-linkedin-text-primary group-hover:text-linkedin-blue transition-colors truncate">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-linkedin-text-secondary">
                      <span className="font-semibold text-linkedin-text-primary flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-linkedin-blue shrink-0" />
                        {job.company}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        {job.location}
                      </span>
                      {job.employmentType && (
                        <>
                          <span>&bull;</span>
                          <span className="capitalize">{job.employmentType}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Score */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {job.match?.score || 0}% Match
                    </span>

                    {/* Bookmark Save Action */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(e, job)}
                      disabled={savingId === jobId}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isSaved
                          ? 'bg-blue-50 text-linkedin-blue border-blue-200'
                          : 'bg-white text-gray-400 border-gray-200 hover:text-linkedin-blue hover:border-linkedin-blue/30'
                      }`}
                      aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
                      title={isSaved ? 'Saved' : 'Save'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-linkedin-blue' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Why It Matches Deterministic Explanation */}
                <p className="text-xs text-linkedin-text-secondary leading-relaxed bg-[#F8FAFC] border border-gray-200/60 p-2 rounded-lg">
                  <span className="font-semibold text-linkedin-text-primary">Match Analysis: </span>
                  {whySummary}
                </p>

                {/* Skill Pills & View Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Matched skills */}
                    {matchedSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        {skill}
                      </span>
                    ))}

                    {/* Missing skills */}
                    {missingSkills.slice(0, 2).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium text-gray-500 bg-gray-50 border border-dashed border-gray-300 px-1.5 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}

                    {matchedSkills.length + missingSkills.length > 5 && (
                      <span className="text-[10px] text-linkedin-text-muted">
                        +{matchedSkills.length + missingSkills.length - 5} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-linkedin-blue group-hover:translate-x-0.5 transition-transform">
                    <span>Review Match</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </article>
            );
          })}

          <div className="pt-2 text-center">
            <Link
              to="/jobs"
              className="text-xs font-bold text-linkedin-blue hover:underline inline-flex items-center gap-1"
            >
              <span>Explore all {total} personalized recommendations</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};

export default RecommendedJobsSection;
