import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  MapPin,
  Briefcase,
  Clock,
  ExternalLink,
  Sparkles,
  ChevronRight,
  BookmarkX,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MatchBadge = ({ score }) => {
  if (score == null) return null;
  const color =
    score >= 75
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : score >= 50
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      <Sparkles className="w-3 h-3" />
      {score}% match
    </span>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-linkedin-border p-5 animate-pulse">
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-2 mt-3">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  </div>
);

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
      const res = await fetch(`${API_BASE}/saved-jobs?page=${page}&limit=8`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.jobs || []);
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setError('Failed to load saved jobs.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleUnsave = async (jobId, jobTitle) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/save`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && !data.saved) {
        setJobs((prev) => prev.filter((j) => (j.id || j._id?.toString()) !== jobId));
        setTotal((prev) => prev - 1);
        toast.info(`"${jobTitle}" removed from saved jobs.`);
      }
    } catch {
      toast.error('Failed to remove saved job.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Bookmark className="w-5 h-5 text-linkedin-blue" />
          <h1 className="text-xl font-bold text-linkedin-text-primary">Saved Jobs</h1>
        </div>
        <p className="text-sm text-linkedin-text-secondary">
          {loading ? 'Loading…' : `${total} job${total !== 1 ? 's' : ''} saved`}
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-3">{error}</p>
          <button
            onClick={fetchSaved}
            className="text-sm text-linkedin-blue hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && jobs.length === 0 && (
        <div className="bg-white border border-linkedin-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-linkedin-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookmarkX className="w-8 h-8 text-linkedin-blue" />
          </div>
          <h2 className="text-lg font-semibold text-linkedin-text-primary mb-2">
            No saved jobs yet
          </h2>
          <p className="text-sm text-linkedin-text-secondary mb-6 max-w-xs mx-auto">
            Browse recommended jobs and click the bookmark icon to save roles you're interested in.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkedin-blue text-white text-sm font-semibold rounded-lg hover:bg-linkedin-blue-hover transition-colors"
          >
            Browse Jobs
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Job cards */}
      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => {
            const jobId = job.id || job._id?.toString();
            const matchScore = job.match?.score;

            return (
              <div
                key={jobId}
                className="bg-white border border-linkedin-border rounded-xl p-5 hover:border-linkedin-blue/30 hover:shadow-md transition-all group"
              >
                <div className="flex gap-4">
                  {/* Company avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-linkedin-blue/10 to-linkedin-blue/20 rounded-lg flex items-center justify-center text-linkedin-blue font-bold text-lg shrink-0 border border-linkedin-blue/10">
                    {(job.company || 'C').charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/jobs/${jobId}`}
                          className="text-sm font-semibold text-linkedin-text-primary hover:text-linkedin-blue transition-colors line-clamp-1"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-linkedin-text-secondary mt-0.5">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <MatchBadge score={matchScore} />
                        <button
                          onClick={() => handleUnsave(jobId, job.title)}
                          className="text-linkedin-blue hover:text-red-500 transition-colors p-1 rounded"
                          title="Remove from saved"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-linkedin-text-secondary">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        <span className="capitalize">{job.employmentType || 'full-time'}</span>
                      </span>
                      {job.salary && (
                        <span className="text-emerald-700 font-medium">{job.salary}</span>
                      )}
                    </div>

                    {/* Skill pills */}
                    {(job.skills || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.skills.slice(0, 5).map((skill) => {
                          const matched = (job.match?.matchedSkills || [])
                            .map((s) => s.toLowerCase())
                            .includes(skill.toLowerCase());
                          return (
                            <span
                              key={skill}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                matched
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-gray-50 text-gray-600 border-gray-200'
                              }`}
                            >
                              {skill}
                            </span>
                          );
                        })}
                        {job.skills.length > 5 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                            +{job.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] text-linkedin-text-secondary">
                        Saved {job.savedAt ? new Date(job.savedAt).toLocaleDateString() : ''}
                      </span>
                      <Link
                        to={`/jobs/${jobId}`}
                        className="text-xs text-linkedin-blue font-semibold hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View details <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-medium border border-linkedin-border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-xs text-linkedin-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-medium border border-linkedin-border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
