import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  ChevronDown,
  ExternalLink,
  Edit3,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Briefcase,
  Trophy,
  ChevronRight,
  FileText,
} from 'lucide-react';
import {
  getCompanyInitials,
  formatPostedDate,
  formatEmploymentType,
} from '../../utils/jobHelpers';

const STATUS_STEPS = ['Applied', 'Shortlisted', 'Interview', 'Offer'];

const STATUS_CONFIG = {
  Applied: { icon: Clock, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  Shortlisted: { icon: Star, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  Interview: { icon: Briefcase, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  Offer: { icon: Trophy, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  Rejected: { icon: XCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

const ALL_STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];

const ApplicationCard = ({
  app = {},
  onStatusSelect,
  onSaveNotes,
  isUpdatingStatus = false,
  compact = false,
}) => {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState(app.notes || '');
  const [savingNote, setSavingNote] = useState(false);

  const job = app.job || {};
  const hasJob = Boolean(job.title && job.title !== 'Unknown Position');
  const jobId = job.id || job._id || app.jobId;
  const companyName = job.company || 'Company';
  const initials = getCompanyInitials(companyName);
  const appliedDate = formatPostedDate(app.appliedAt);
  const currentStatus = app.status || 'Applied';
  const statusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Applied;
  const StatusIcon = statusMeta.icon;

  const handleSaveNoteClick = async () => {
    if (!onSaveNotes) return;
    setSavingNote(true);
    try {
      await onSaveNotes(app.id, noteDraft.trim());
      setIsEditingNotes(false);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <article
      className="bg-white border border-linkedin-border rounded-[12px] p-5 shadow-sm hover:border-linkedin-blue/40 hover:shadow-md transition-all space-y-4"
      aria-labelledby={`app-${app.id}-title`}
    >
      {/* Header Row: Company Avatar, Title, Status Dropdown */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <div className="shrink-0 w-11 h-11 rounded-xl bg-linkedin-blue-light border border-blue-200 text-linkedin-blue flex items-center justify-center font-black text-sm select-none shadow-2xs">
            {initials}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 id={`app-${app.id}-title`} className="text-sm sm:text-base font-bold text-linkedin-text-primary truncate">
              {hasJob ? (
                <Link
                  to={`/jobs/${jobId}`}
                  className="hover:text-linkedin-blue transition-colors"
                >
                  {job.title}
                </Link>
              ) : (
                <span className="text-gray-500 italic">Job Listing No Longer Active</span>
              )}
            </h2>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-linkedin-text-secondary">
              <span className="font-semibold text-linkedin-text-primary">{companyName}</span>
              {job.location && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" aria-hidden="true" />
                    <span>{job.location}</span>
                  </span>
                </>
              )}
              {job.employmentType && (
                <>
                  <span>&bull;</span>
                  <span>{formatEmploymentType(job.employmentType)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Dropdown Control */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            disabled={isUpdatingStatus}
            aria-expanded={statusMenuOpen}
            aria-label={`Current status: ${currentStatus}. Click to change status.`}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-linkedin-blue ${
              statusMeta.color
            } ${isUpdatingStatus ? 'opacity-50 cursor-wait' : 'hover:opacity-90'}`}
          >
            <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{currentStatus}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
          </button>

          {statusMenuOpen && (
            <div
              className="absolute right-0 top-9 w-44 bg-white border border-linkedin-border rounded-xl shadow-xl py-1 z-30 space-y-0.5"
              role="menu"
            >
              {ALL_STATUSES.map((s) => {
                const sMeta = STATUS_CONFIG[s];
                const SIcon = sMeta.icon;
                const isSelected = s === currentStatus;

                return (
                  <button
                    key={s}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setStatusMenuOpen(false);
                      if (s !== currentStatus && onStatusSelect) {
                        onStatusSelect(app.id, s, app);
                      }
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-linkedin-blue font-bold'
                        : 'text-linkedin-text-primary hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <SIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{s}</span>
                    </span>
                    {isSelected && <span className="text-[10px] uppercase font-bold text-linkedin-blue">Active</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Visual Stepper (when not compact) */}
      {!compact && (
        <div className="pt-1">
          {currentStatus === 'Rejected' ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
              <XCircle className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <span>Application Marked as Rejected (Archived)</span>
            </div>
          ) : (
            <div className="flex items-center gap-0" role="group" aria-label="Application Progress Stepper">
              {STATUS_STEPS.map((step, idx) => {
                const currentIndex = STATUS_STEPS.indexOf(currentStatus);
                const isCompleted = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                const isLast = idx === STATUS_STEPS.length - 1;

                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all ${
                          isCompleted
                            ? 'bg-linkedin-blue border-linkedin-blue text-white'
                            : isCurrent
                            ? 'bg-white border-linkedin-blue text-linkedin-blue shadow-2xs'
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle className="w-3 h-3" aria-hidden="true" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[9px] mt-1 font-semibold whitespace-nowrap ${
                          isCurrent ? 'text-linkedin-blue font-bold' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={`flex-1 h-0.5 mx-1.5 mb-3.5 rounded-full transition-all ${
                          idx < currentIndex ? 'bg-linkedin-blue' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notes & Actions Section */}
      <div className="pt-2 border-t border-linkedin-border space-y-2.5">
        {/* Notes Editor or Preview */}
        {isEditingNotes ? (
          <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-xl border border-gray-200">
            <label htmlFor={`note-${app.id}`} className="text-[11px] font-bold text-linkedin-text-primary uppercase tracking-wider block">
              Private Application Notes
            </label>
            <textarea
              id={`note-${app.id}`}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Record recruiter contacts, interview questions, salary discussions, or next steps..."
              className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-lg text-linkedin-text-primary focus:border-linkedin-blue focus:outline-none focus:ring-1 focus:ring-linkedin-blue resize-none"
            />
            <div className="flex items-center justify-between text-[11px] text-linkedin-text-muted">
              <span>{noteDraft.length}/1000 characters</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNoteDraft(app.notes || '');
                    setIsEditingNotes(false);
                  }}
                  disabled={savingNote}
                  className="px-2.5 py-1 text-gray-600 hover:text-gray-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNoteClick}
                  disabled={savingNote}
                  className="px-3 py-1 bg-linkedin-blue text-white rounded-md font-bold hover:bg-linkedin-blue-hover transition-colors disabled:opacity-50"
                >
                  {savingNote ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        ) : app.notes ? (
          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-200/80 space-y-1 group">
            <div className="flex items-center justify-between text-[11px] text-linkedin-text-secondary font-bold">
              <span className="flex items-center gap-1 text-linkedin-blue">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Personal Notes</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingNotes(true)}
                className="text-linkedin-blue hover:underline inline-flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>
            <p className="text-xs text-linkedin-text-primary leading-relaxed whitespace-pre-wrap">
              {app.notes}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingNotes(true)}
            className="text-[11px] text-gray-500 hover:text-linkedin-blue font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3 h-3" aria-hidden="true" />
            <span>+ Add private notes</span>
          </button>
        )}

        {/* Footer Meta & Quick Links */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-linkedin-text-secondary">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            <span>Tracked {appliedDate || 'recently'}</span>
          </span>

          <div className="flex items-center gap-3 font-semibold">
            {job.applicationUrl && (
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-linkedin-blue hover:underline inline-flex items-center gap-1"
              >
                <span>Job Portal</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            )}

            {hasJob && (
              <Link
                to={`/jobs/${jobId}`}
                className="text-linkedin-blue hover:underline inline-flex items-center gap-0.5"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ApplicationCard;
