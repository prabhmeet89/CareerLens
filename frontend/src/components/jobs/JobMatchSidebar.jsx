import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Check,
  Zap,
  AlertCircle,
} from 'lucide-react';
import Button from '../common/Button';
import {
  getScoreClassification,
  getReadinessClassification,
} from '../../utils/jobHelpers';

const JobMatchSidebar = ({
  job = {},
  isSaved = false,
  saveLoading = false,
  applied = false,
  onApplyClick,
  onToggleSave,
  hasProfile = true,
}) => {
  const navigate = useNavigate();
  const jobId = job.id || job._id?.toString() || '';

  const matchClassification = getScoreClassification(job.match?.score);
  const readinessClassification = getReadinessClassification(job.readinessScore);
  const matchedSkills = job.match?.matchedSkills || [];
  const missingSkills = job.match?.missingSkills || [];

  return (
    <aside
      className="bg-white border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm space-y-5 sticky top-20"
      aria-label="Job Application & Match Summary"
    >
      {/* ── 1. Match & Readiness Scores ── */}
      {job.match && matchClassification ? (
        <div className="space-y-3 pb-4 border-b border-linkedin-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-linkedin-text-secondary">
              Personalized Fit
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${matchClassification.badgeBg}`}>
              {matchClassification.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center">
            {/* Match Score */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-gray-200/80">
              <div className="text-2xl font-black text-linkedin-blue leading-tight">
                {matchClassification.score}%
              </div>
              <div className="text-[11px] font-semibold text-linkedin-text-secondary mt-0.5">
                Match Score
              </div>
              <div className="text-[10px] text-linkedin-text-muted">5-factor fit</div>
            </div>

            {/* Readiness Score */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-gray-200/80">
              <div className="text-2xl font-black text-emerald-600 leading-tight">
                {readinessClassification ? `${readinessClassification.score}%` : 'N/A'}
              </div>
              <div className="text-[11px] font-semibold text-linkedin-text-secondary mt-0.5">
                Skill Readiness
              </div>
              <div className="text-[10px] text-linkedin-text-muted">
                {readinessClassification ? 'Listed skills' : 'General role'}
              </div>
            </div>
          </div>

          {/* Quick Skill Alignment Summary */}
          <div className="space-y-1.5 pt-1 text-xs">
            {matchedSkills.length > 0 && (
              <div className="flex items-start gap-1.5 text-emerald-900">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="line-clamp-2">
                  <span className="font-semibold">Top matches: </span>
                  {matchedSkills.slice(0, 3).join(', ')}
                </span>
              </div>
            )}

            {missingSkills.length > 0 && (
              <div className="flex items-start gap-1.5 text-amber-900">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="line-clamp-1">
                  <span className="font-semibold">Key gap: </span>
                  {missingSkills[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : !hasProfile ? (
        /* No Profile / Signed Out Prompt */
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2 text-center">
          <UploadCloud className="w-6 h-6 text-linkedin-blue mx-auto" aria-hidden="true" />
          <p className="font-bold text-linkedin-text-primary">Unlock Personalized Match Scores</p>
          <p className="text-linkedin-text-secondary leading-relaxed">
            Upload your resume to benchmark your verified skills and coursework against this role.
          </p>
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => navigate('/upload')}
            className="text-xs font-bold text-linkedin-blue"
          >
            Upload Resume
          </Button>
        </div>
      ) : null}

      {/* ── 2. Primary Action Buttons ── */}
      <div className="space-y-2.5">
        {/* Apply Button */}
        <Button
          variant={applied ? 'outline' : 'primary'}
          size="lg"
          fullWidth
          onClick={onApplyClick}
          icon={applied ? CheckCircle2 : ExternalLink}
          className={`text-sm font-bold shadow-sm ${
            applied
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-linkedin-blue text-white hover:bg-linkedin-blue-hover'
          }`}
          aria-label={applied ? 'Application already tracked' : 'Apply for this role'}
        >
          {applied ? 'Application Tracked' : 'Apply for Position'}
        </Button>

        {/* Save Job Toggle */}
        <button
          type="button"
          onClick={onToggleSave}
          disabled={saveLoading}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove from saved jobs' : 'Save this job'}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-linkedin-blue ${
            isSaved
              ? 'bg-blue-50 text-linkedin-blue border-blue-200 shadow-2xs'
              : 'bg-white text-linkedin-text-primary border-linkedin-border hover:bg-gray-50 hover:border-linkedin-blue/40'
          } disabled:opacity-50`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-linkedin-blue text-linkedin-blue' : 'text-gray-500'}`} aria-hidden="true" />
          <span>{isSaved ? 'Saved to Your Jobs' : 'Save Job'}</span>
        </button>
      </div>

      {/* ── 3. Learning Roadmap Quick Action ── */}
      {job.match && (
        <div className="pt-2 border-t border-linkedin-border">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => navigate(`/jobs/${jobId}/roadmap`)}
            icon={Zap}
            className="text-xs font-bold border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100"
          >
            Generate Role Roadmap
          </Button>
        </div>
      )}

      {/* ── 4. Transparency Note ── */}
      <div className="pt-2 text-[11px] text-linkedin-text-muted leading-tight text-center">
        <span>CareerLens application tracking keeps your job pipeline organized across stages.</span>
      </div>
    </aside>
  );
};

export default JobMatchSidebar;
