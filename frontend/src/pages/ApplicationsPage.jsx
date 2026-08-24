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
  Info,
} from 'lucide-react';
import api from '../api/axiosClient';
import { useToast } from '../context/ToastContext';

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

const ApplicationCard = ({ app, onStatusChange, onNotesChange }) => {
  const [updating, setUpdating] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(app.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const toast = useToast();
  const job = app.job || {};

  const handleStatusChange = async (newStatus) => {
    setStatusOpen(false);
    if (newStatus === app.status) return;

    // Optimistic update
    onStatusChange(app.id, newStatus);
    setUpdating(true);

    try {
      const { data } = await api.patch(`/applications/${app.id}`, { status: newStatus });
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

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const { data } = await api.patch(`/applications/${app.id}`, { notes: noteText.trim() });
      if (data.success) {
        setEditingNotes(false);
        if (onNotesChange) onNotesChange(app.id, noteText.trim());
        toast.success('Note saved.');
      } else {
        toast.error(data.message || 'Failed to save note.');
      }
    } catch (err) {
      // axios rejects on 4xx/5xx — surface the server's message when it sent one
      toast.error(err.customMessage || 'Network error saving note.');
    } finally {
      setSavingNotes(false);
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

        <div className="flex-1 min-w-0 space-y-2.5">
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

          <div className="flex flex-wrap items-center gap-3 text-xs text-linkedin-text-secondary">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {job.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </span>
            {job.applicationUrl && (
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-linkedin-blue hover:underline inline-flex items-center gap-1 font-medium ml-auto"
              >
                <span>Job Portal</span>
                <span className="text-[10px]">&nearr;</span>
              </a>
            )}
          </div>

          {/* Visual stepper */}
          <ApplicationStepper status={app.status} />

          {/* Notes Section */}
          <div className="pt-1">
            {editingNotes ? (
              <div className="space-y-2 mt-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Add your notes for this application (referrals, key highlights, interview notes)..."
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-linkedin-text-primary focus:bg-white focus:border-linkedin-blue focus:outline-none transition-all resize-none"
                />
                <div className="flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setNoteText(app.notes || '');
                      setEditingNotes(false);
                    }}
                    disabled={savingNotes}
                    className="px-2.5 py-1 text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3 py-1 bg-linkedin-blue text-white rounded-md font-semibold hover:bg-linkedin-blue-hover transition-colors disabled:opacity-50"
                  >
                    {savingNotes ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            ) : app.notes ? (
              <div className="mt-2 text-xs bg-[#F8FAFC] rounded-lg p-3 border border-gray-200/80 space-y-1 group">
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-linkedin-blue" />
                    Personal Tracker Note:
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingNotes(true)}
                    className="text-linkedin-blue hover:underline opacity-80 group-hover:opacity-100"
                  >
                    Edit Note
                  </button>
                </div>
                <p className="text-linkedin-text-primary text-xs leading-relaxed whitespace-pre-wrap">
                  {app.notes}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingNotes(true)}
                className="text-[11px] text-gray-400 hover:text-linkedin-blue font-medium inline-flex items-center gap-1 mt-1 transition-colors"
              >
                + Add a personal note
              </button>
            )}
          </div>
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
      const { data } = await api.get(`/applications?page=${page}&limit=8`);
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

  // Optimistic notes update
  const handleNotesChange = useCallback((appId, newNotes) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, notes: newNotes } : a))
    );
  }, []);

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

      {/* Information / Disclaimer Banner */}
      {!loading && total > 0 && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-linkedin-blue flex items-start gap-2.5">
          <Info className="w-4 h-4 text-linkedin-blue shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-blue-950">Self-Managed Application Tracker</span>
            <p className="text-[11px] text-blue-900/80 leading-relaxed">
              Applications tracked here are for your personal organization and interview follow-ups. You can update status stages and private notes as you progress with employers.
            </p>
          </div>
        </div>
      )}

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
              onNotesChange={handleNotesChange}
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
