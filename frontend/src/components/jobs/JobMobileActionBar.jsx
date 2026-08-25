import React from 'react';
import { Bookmark, CheckCircle2, ExternalLink } from 'lucide-react';
import Button from '../common/Button';
import { getScoreClassification } from '../../utils/jobHelpers';

const JobMobileActionBar = ({
  job = {},
  isSaved = false,
  saveLoading = false,
  applied = false,
  onApplyClick,
  onToggleSave,
  isVisible = true,
}) => {
  if (!isVisible) return null;

  const matchClassification = getScoreClassification(job.match?.score);

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-linkedin-border px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="region"
      aria-label="Mobile Job Actions"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Match Score or Title snippet */}
        <div className="min-w-0 flex items-center gap-2">
          {matchClassification ? (
            <div
              className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-bold ${matchClassification.badgeBg}`}
            >
              {matchClassification.score}% Match
            </div>
          ) : (
            <span className="text-xs font-bold text-linkedin-text-primary truncate">
              {job.title}
            </span>
          )}
        </div>

        {/* Save Bookmark and Apply Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Bookmark Toggle */}
          <button
            type="button"
            onClick={onToggleSave}
            disabled={saveLoading}
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
            className={`p-2.5 rounded-lg border transition-all ${
              isSaved
                ? 'bg-blue-50 text-linkedin-blue border-blue-200'
                : 'bg-white text-gray-500 border-gray-200 hover:text-linkedin-blue'
            } disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-linkedin-blue' : ''}`} aria-hidden="true" />
          </button>

          {/* Apply Button */}
          <Button
            variant={applied ? 'outline' : 'primary'}
            size="md"
            onClick={onApplyClick}
            icon={applied ? CheckCircle2 : ExternalLink}
            className={`text-xs font-bold shadow-sm min-h-[44px] ${
              applied
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-linkedin-blue text-white'
            }`}
          >
            {applied ? 'Applied' : 'Apply Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobMobileActionBar;
