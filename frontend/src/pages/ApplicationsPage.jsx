import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Briefcase,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronRight,
  XCircle,
  CheckCircle,
  Clock,
  Star,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_STEPS = ['Applied', 'Shortlisted', 'Interview', 'Offer'];
const STATUS_ICONS = {
  Applied: Clock,
  Shortlisted: Star,
  Interview: Briefcase,
  Offer: Trophy,
  Rejected: XCircle,
};
const STATUS_COLORS = {
  Applied: 'text-blue-600 bg-blue-50 border-blue-200',
  Shortlisted: 'text-purple-600 bg-purple-50 border-purple-200',
  Interview: 'text-amber-600 bg-amber-50 border-amber-200',
  Offer: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Rejected: 'text-red-600 bg-red-50 border-red-200',
};
const ALL_STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];

const StatsBar = ({ stats }) => (
  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
    {Object.entries(stats).map(([status, count]) => {
      const Icon = STATUS_ICONS[status];
      return (
        <div
          key={status}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold ${STATUS_COLORS[status]}`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span>{count} {status}</span>
        </div>
      );
    })}
  </div>
);

const ApplicationStepper = ({ status }) => {
  if (status === 'Rejected') {
    return (
      <div className="flex items-center gap-2 mt-3">
        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        <div className="flex-1 h-1.5 bg-red-200 rounded-full" />
        <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          Rejected
        </span>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0 mt-3">
      {STATUS_STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === STATUS_STEPS.length - 1;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all ${
                  isCompleted
                    ? 'bg-linkedin-blue border-linkedin-blue text-white'
                    : isCurrent
                    ? 'bg-white border-linkedin-blue text-linkedin-blue'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircle className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={`text-[9px] mt-1 font-medium whitespace-nowrap ${
                  isCurrent ? 'text-linkedin-blue' : isCompleted ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-3 rounded-full transition-all ${
                  i < currentIndex ? 'bg-linkedin-blue' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ApplicationCard = ({ app, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const toast = useToast();
  const job = app.job || {};

  const handleStatusChange = async (newStatus) => {
    setStatusOpen(false);
    if (newStatus === app.status) return;

    // Optimistic update
    onStatusChange(app.id, newStatus);
    setUpdating(true);

    try {
      const res = await fetch(`${API_BASE}/applications/${app.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        onStatusChange(app.id, app.status); // Revert
        toast.error('Failed to update status.');
      } else {
        toast.success(`Status updated to "${newStatus}".`);
      }
    } catch {
      onStatusChange(app.id, app.status);
      toast.error('Network error updating status.');
    } finally {
      setUpdating(false);
    }
  };

  const StatusIcon = STATUS_ICONS[app.status] || Clock;

  return (
    <div className="bg-white border border-linkedin-border rounded-xl p-5 hover:border-linkedin-blue/30 hover:shadow-md transition-all">
      <div className="flex gap-4">
        {/* Company avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-linkedin-blue/10 to-linkedin-blue/20 rounded-lg flex items-center justify-center text-linkedin-blue font-bold text-lg shrink-0 border border-linkedin-blue/10">
          {(job.company || 'C').charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <Link
                to={`/jobs/${app.jobId || job.id}`}
                className="text-sm font-semibold text-linkedin-text-primary hover:text-linkedin-blue transition-colors"
              >
                {job.title || 'Unknown Position'}
              </Link>
              <p className="text-xs text-linkedin-text-secondary mt-0.5">{job.company || 'Unknown Company'}</p>
            </div>

            {/* Status selector */}
            <div className="relative">
              <button
                onClick={() => setStatusOpen((v) => !v)}
                disabled={updating}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  STATUS_COLORS[app.status]
                } ${updating ? 'opacity-60 cursor-wait' : 'hover:opacity-80 cursor-pointer'}`}
              >
                <StatusIcon className="w-3 h-3" />
                {app.status}
                <ChevronDown className="w-3 h-3" />
              </button>
              {statusOpen && (
                <div className="absolute right-0 top-8 w-40 bg-white border border-linkedin-border rounded-lg shadow-lg py-1 z-20">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors ${
                        s === app.status ? 'text-linkedin-blue font-semibold' : 'text-linkedin-text-primary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-linkedin-text-secondary">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {job.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </span>
          </div>

          {/* Visual stepper */}
          <ApplicationStepper status={app.status} />

          {app.notes && (
            <p className="mt-3 text-xs text-linkedin-text-secondary bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 italic line-clamp-2">
              {app.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-linkedin-border p-5 animate-pulse">
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-100 rounded w-full mt-4" />
      </div>
    </div>
  </div>
);

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ Applied: 0, Shortlisted: 0, Interview: 0, Offer: 0, Rejected: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/applications?page=${page}&limit=8`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data.applications || []);
        setStats(data.data.stats || {});
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setError('Failed to load applications.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Optimistic status update
  const handleStatusChange = useCallback((appId, newStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    // Update stats
    setStats((prev) => {
      const app = applications.find((a) => a.id === appId);
      if (!app) return prev;
      const updated = { ...prev };
      if (updated[app.status] !== undefined) updated[app.status] = Math.max(0, updated[app.status] - 1);
      if (updated[newStatus] !== undefined) updated[newStatus] += 1;
      return updated;
    });
  }, [applications]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-linkedin-blue" />
          <h1 className="text-xl font-bold text-linkedin-text-primary">My Applications</h1>
        </div>
        <p className="text-sm text-linkedin-text-secondary">
          {loading ? 'Loading…' : `${total} application${total !== 1 ? 's' : ''} tracked`}
        </p>
      </div>

      {/* Stats bar */}
      {!loading && total > 0 && <StatsBar stats={stats} />}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-700 font-medium mb-3">{error}</p>
          <button onClick={fetchApplications} className="text-sm text-linkedin-blue hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && applications.length === 0 && (
        <div className="bg-white border border-linkedin-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-linkedin-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-linkedin-blue" />
          </div>
          <h2 className="text-lg font-semibold text-linkedin-text-primary mb-2">No applications yet</h2>
          <p className="text-sm text-linkedin-text-secondary mb-6 max-w-xs mx-auto">
            When you apply to a job, it will appear here so you can track your progress.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkedin-blue text-white text-sm font-semibold rounded-lg hover:bg-linkedin-blue-hover transition-colors"
          >
            Browse Jobs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Application cards */}
      {!loading && !error && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onStatusChange={handleStatusChange}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-medium border border-linkedin-border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-xs text-linkedin-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-medium border border-linkedin-border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
