import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Filter,
  Inbox,
} from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { useToast } from '../context/ToastContext';
import ApplicationTrackerHeader from '../components/applications/ApplicationTrackerHeader';
import PipelineSummary from '../components/applications/PipelineSummary';
import ApplicationCard from '../components/applications/ApplicationCard';
import ApplicationKanbanBoard from '../components/applications/ApplicationKanbanBoard';
import RejectConfirmModal from '../components/applications/RejectConfirmModal';

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-linkedin-border p-5 animate-pulse space-y-3">
    <div className="flex gap-4">
      <div className="w-11 h-11 bg-gray-200 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-24" />
    </div>
    <div className="h-4 bg-gray-100 rounded w-full pt-2" />
  </div>
);

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    Applied: 0,
    Shortlisted: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active stage filter: 'All' | 'Applied' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected'
  const [activeStageFilter, setActiveStageFilter] = useState('All');
  // View mode: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState('list');
  // Updating status ids map
  const [updatingAppIds, setUpdatingAppIds] = useState(new Set());
  // Reject confirmation modal state
  const [rejectingApp, setRejectingApp] = useState(null);
  const [isConfirmingReject, setIsConfirmingReject] = useState(false);

  // Fetch applications list
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/applications?page=${page}&limit=12`);
      if (data.success) {
        setApplications(data.data.applications || []);
        setStats(data.data.stats || {});
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setError('Failed to load applications.');
      }
    } catch {
      setError('Network error loading applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Execute status update with optimistic rollback
  const executeStatusUpdate = async (appId, newStatus) => {
    const prevApp = applications.find((a) => a.id === appId);
    if (!prevApp || prevApp.status === newStatus) return;

    const oldStatus = prevApp.status;

    // Optimistically update
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    setStats((prev) => {
      const next = { ...prev };
      if (next[oldStatus] !== undefined) next[oldStatus] = Math.max(0, next[oldStatus] - 1);
      if (next[newStatus] !== undefined) next[newStatus] = (next[newStatus] || 0) + 1;
      return next;
    });

    setUpdatingAppIds((prev) => new Set(prev).add(appId));

    try {
      const { data } = await api.patch(`/applications/${appId}`, { status: newStatus });
      if (data.success) {
        toast.success(`Application updated to "${newStatus}".`);
      } else {
        // Rollback
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: oldStatus } : a))
        );
        setStats((prev) => {
          const next = { ...prev };
          if (next[newStatus] !== undefined) next[newStatus] = Math.max(0, next[newStatus] - 1);
          if (next[oldStatus] !== undefined) next[oldStatus] = (next[oldStatus] || 0) + 1;
          return next;
        });
        toast.error(data.message || 'Failed to update application status.');
      }
    } catch {
      // Rollback
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: oldStatus } : a))
      );
      setStats((prev) => {
        const next = { ...prev };
        if (next[newStatus] !== undefined) next[newStatus] = Math.max(0, next[newStatus] - 1);
        if (next[oldStatus] !== undefined) next[oldStatus] = (next[oldStatus] || 0) + 1;
        return next;
      });
      toast.error('Network error updating status.');
    } finally {
      setUpdatingAppIds((prev) => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
      setRejectingApp(null);
      setIsConfirmingReject(false);
    }
  };

  // Status selection dispatcher: intercepts 'Rejected' to show confirmation dialog
  const handleStatusSelect = (appId, newStatus, app) => {
    if (newStatus === 'Rejected') {
      setRejectingApp(app);
    } else {
      executeStatusUpdate(appId, newStatus);
    }
  };

  // Confirm rejection modal action
  const handleConfirmReject = async () => {
    if (!rejectingApp) return;
    setIsConfirmingReject(true);
    await executeStatusUpdate(rejectingApp.id, 'Rejected');
  };

  // Save notes handler
  const handleSaveNotes = async (appId, newNotes) => {
    const prevApp = applications.find((a) => a.id === appId);
    const oldNotes = prevApp?.notes || '';

    // Optimistically update
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, notes: newNotes } : a))
    );

    try {
      const { data } = await api.patch(`/applications/${appId}`, { notes: newNotes });
      if (data.success) {
        toast.success('Note saved.');
      } else {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, notes: oldNotes } : a))
        );
        toast.error(data.message || 'Failed to save note.');
      }
    } catch (err) {
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, notes: oldNotes } : a))
      );
      toast.error(err.customMessage || 'Network error saving note.');
    }
  };

  // Filter applications by active stage
  const filteredApplications =
    activeStageFilter === 'All'
      ? applications
      : applications.filter((app) => (app.status || 'Applied') === activeStageFilter);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* ── 1. Page Header ── */}
      <ApplicationTrackerHeader
        total={total}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* ── 2. Pipeline Summary Bar & Stage Filters ── */}
      {!loading && total > 0 && (
        <PipelineSummary
          stats={stats}
          total={total}
          activeFilter={activeStageFilter}
          onFilterChange={setActiveStageFilter}
        />
      )}

      {/* ── 3. Loading State ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── 4. Error State ── */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" aria-hidden="true" />
          <h2 className="text-base font-bold text-red-900">Unable to Load Applications</h2>
          <p className="text-xs text-red-700 max-w-sm mx-auto">{error}</p>
          <div className="pt-1">
            <Button variant="primary" size="sm" onClick={fetchApplications} className="text-xs font-bold">
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* ── 5. Empty State (No Applications at all) ── */}
      {!loading && !error && applications.length === 0 && (
        <div className="bg-white border border-linkedin-border rounded-xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-linkedin-blue rounded-full flex items-center justify-center mx-auto border border-blue-200">
            <ClipboardList className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-linkedin-text-primary">
              You haven't tracked any applications yet
            </h2>
            <p className="text-xs text-linkedin-text-secondary leading-relaxed">
              When you find a role on CareerLens, click "Apply for Position" to track your submission date, update interview stages, and store personal preparation notes.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/jobs')}
              icon={ChevronRight}
              className="text-xs font-bold"
            >
              Explore Recommended Jobs
            </Button>
          </div>
        </div>
      )}

      {/* ── 6. Filter Empty State (Stage has 0 apps) ── */}
      {!loading && !error && applications.length > 0 && filteredApplications.length === 0 && (
        <div className="bg-white border border-linkedin-border rounded-xl p-10 text-center space-y-3">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto" aria-hidden="true" />
          <h3 className="text-sm font-bold text-linkedin-text-primary">
            No applications in the "{activeStageFilter}" stage
          </h3>
          <p className="text-xs text-linkedin-text-secondary">
            You don't have any job applications currently marked as {activeStageFilter.toLowerCase()}.
          </p>
          <button
            type="button"
            onClick={() => setActiveStageFilter('All')}
            className="text-xs font-bold text-linkedin-blue hover:underline pt-1"
          >
            Show all {total} applications
          </button>
        </div>
      )}

      {/* ── 7. Applications Content (List or Kanban) ── */}
      {!loading && !error && filteredApplications.length > 0 && (
        <>
          {viewMode === 'kanban' ? (
            /* Kanban Board View */
            <ApplicationKanbanBoard
              applications={applications}
              onStatusSelect={handleStatusSelect}
              onSaveNotes={handleSaveNotes}
              updatingTaskIds={updatingAppIds}
            />
          ) : (
            /* Standard List View */
            <div className="space-y-3.5">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onStatusSelect={handleStatusSelect}
                  onSaveNotes={handleSaveNotes}
                  isUpdatingStatus={updatingAppIds.has(app.id)}
                />
              ))}

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
                    className="px-3.5 py-1.5 text-xs font-semibold border border-linkedin-border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs font-medium text-linkedin-text-secondary">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === totalPages}
                    className="px-3.5 py-1.5 text-xs font-semibold border border-linkedin-border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── 8. Reject Confirmation Dialog ── */}
      <RejectConfirmModal
        isOpen={Boolean(rejectingApp)}
        application={rejectingApp}
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectingApp(null)}
        isSubmitting={isConfirmingReject}
      />
    </div>
  );
}
