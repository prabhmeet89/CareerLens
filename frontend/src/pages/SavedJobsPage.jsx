import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkX, Briefcase } from 'lucide-react';
import api from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import JobCard from '../components/jobs/JobCard';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonJobCard } from '../components/common/LoadingSkeletons';
import { normalizeErrorMessage } from '../utils/errorHelpers';

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/saved-jobs?page=${page}&limit=8`);
      if (data.success) {
        setJobs(data.data.jobs || []);
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setError('Failed to load saved jobs.');
      }
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Failed to load saved jobs. Please check your connection.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleUnsave = async (jobId, jobTitle) => {
    try {
      const { data } = await api.post(`/jobs/${jobId}/save`);
      if (data.success && !data.saved) {
        setJobs((prev) => prev.filter((j) => (j.id || j._id?.toString()) !== jobId));
        setTotal((prev) => Math.max(0, prev - 1));
        toast.info(`"${jobTitle}" removed from saved jobs.`);
      }
    } catch {
      toast.error('Failed to remove saved job. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-linkedin-blue" aria-hidden="true" />
          <h1 className="text-xl sm:text-2xl font-bold text-linkedin-text-primary">Saved Jobs</h1>
        </div>
        <p className="text-xs sm:text-sm text-linkedin-text-secondary">
          {loading ? 'Loading saved roles…' : `${total} job${total !== 1 ? 's' : ''} bookmarked for quick review`}
        </p>
      </header>

      {/* Loading state */}
      {loading && <SkeletonJobCard count={3} />}

      {/* Error state */}
      {!loading && error && (
        <ErrorState
          title="Unable to load your saved jobs"
          message={error}
          onRetry={fetchSaved}
          actionText="Browse Available Jobs"
          actionTo="/jobs"
        />
      )}

      {/* Empty state */}
      {!loading && !error && jobs.length === 0 && (
        <EmptyState
          icon={BookmarkX}
          title="No saved jobs yet"
          description="Browse recommended opportunities and bookmark roles you wish to review later or prepare custom roadmaps for."
          actionText="Browse Jobs"
          actionTo="/jobs"
          actionIcon={Briefcase}
          secondaryActionText="View Application Tracker"
          secondaryActionTo="/applications"
        />
      )}

      {/* Job cards */}
      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => {
            const jobId = job.id || job._id?.toString();

            return (
              <JobCard
                key={jobId}
                job={{ ...job, isSaved: true }}
                variant="saved"
                onToggleSave={() => handleUnsave(jobId, job.title)}
              />
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === 1}
                className="px-3.5 py-1.5 text-xs font-semibold border border-linkedin-border rounded-lg bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3.5 py-1.5 text-xs font-medium text-linkedin-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 text-xs font-semibold border border-linkedin-border rounded-lg bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
