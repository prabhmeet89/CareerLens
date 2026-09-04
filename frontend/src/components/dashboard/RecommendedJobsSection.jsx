import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, UploadCloud, Briefcase, AlertCircle, ChevronRight } from 'lucide-react';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import { SkeletonJobCard } from '../common/LoadingSkeletons';
import api from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import JobCard from '../jobs/JobCard';

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
    const jobId = job.id || job._id?.toString();
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

  return (
    <section
      className="bg-white border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm space-y-4"
      aria-labelledby="recommended-jobs-heading"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-linkedin-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center shrink-0">
            <Target className="w-4.5 h-4.5" />
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
        <div className="p-2.5 bg-blue-50/60 dark:bg-linkedin-accent-light border border-blue-200 dark:border-linkedin-blue/30 rounded-lg text-[11px] text-linkedin-blue flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Recommendations ranked from top active listings in our student opportunities hub.</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          compact={true}
          message={error}
          onRetry={onRetry}
        />
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <SkeletonJobCard count={3} />
      ) : !hasProfile || jobs.length === 0 ? (
        /* Empty State */
        <EmptyState
          compact={true}
          icon={!hasProfile ? UploadCloud : Briefcase}
          title={!hasProfile ? 'Unlock Personalized Recommendations' : 'No Recommended Jobs Available'}
          description={
            !hasProfile
              ? 'Upload your PDF resume so our matching engine can calculate personalized match scores and rank top roles.'
              : 'We could not find active matches for your current profile. Explore all jobs or refine your skills.'
          }
          actionText={!hasProfile ? 'Upload Resume' : 'Explore All Jobs'}
          actionTo={!hasProfile ? '/upload' : '/jobs'}
          secondaryActionText={!hasProfile ? 'Browse All Jobs' : undefined}
          secondaryActionTo={!hasProfile ? '/jobs' : undefined}
        />
      ) : (
        /* Jobs List */
        <div className="space-y-3">
          {jobs.slice(0, 4).map((job) => {
            const jobId = job.id || job._id?.toString();
            const decoratedJob = {
              ...job,
              id: jobId,
              isSaved: savedJobIds.has(jobId) || job.isSaved,
            };

            return (
              <JobCard
                key={jobId}
                job={decoratedJob}
                variant="compact"
                onToggleSave={handleToggleSave}
                isSaving={savingId === jobId}
              />
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
