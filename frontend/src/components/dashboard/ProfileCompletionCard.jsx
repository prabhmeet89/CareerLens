import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, UploadCloud, UserCheck, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { calculateProfileCompletion } from '../../utils/dashboardHelpers';

const ProfileCompletionCard = ({ profile, loading, error }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[10px] p-4 shadow-sm animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded w-1/2" />
        <div className="h-2 bg-gray-100 dark:bg-[#222222] rounded w-full" />
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-gray-100 dark:bg-[#222222] rounded w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-[#222222] rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[10px] p-4 shadow-sm text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
          <AlertCircle className="w-4 h-4" />
          <span>Profile Status Unavailable</span>
        </div>
        <p className="text-linkedin-text-secondary">Could not load profile details at this moment.</p>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="text-linkedin-blue font-bold hover:underline"
        >
          View Profile Page &rarr;
        </button>
      </div>
    );
  }

  const { percentage, label, items, completedCount, totalCount } = calculateProfileCompletion(profile);
  const hasResume = Boolean(profile?.resumeId || profile);

  return (
    <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[10px] p-4 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-linkedin-text-primary uppercase tracking-wider">
            Profile Completion
          </h3>
          <p className="text-xs font-semibold text-linkedin-blue mt-0.5">{label}</p>
        </div>
        <span
          className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
            percentage >= 80
              ? 'bg-emerald-50 dark:bg-linkedin-green-bg text-emerald-700 dark:text-linkedin-green border-emerald-200 dark:border-linkedin-green/30'
              : percentage >= 50
              ? 'bg-blue-50 dark:bg-linkedin-accent-light text-linkedin-blue border-blue-200 dark:border-linkedin-blue/30'
              : 'bg-amber-50 dark:bg-linkedin-amber-bg text-amber-700 dark:text-linkedin-amber border-amber-200 dark:border-linkedin-amber/30'
          }`}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div
          className="w-full bg-gray-100 dark:bg-[#2A2A2A] rounded-full h-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Profile completion: ${percentage}%`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-linkedin-blue' : 'bg-amber-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-linkedin-text-muted">
          <span>{completedCount} of {totalCount} sections complete</span>
          <span>{percentage < 100 ? 'Higher score = better matches' : 'Ready for matching'}</span>
        </div>
      </div>

      {/* Profile Checklist */}
      <div className="space-y-2 pt-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2 text-xs">
            {item.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <Circle className="w-4 h-4 text-gray-300 dark:text-[#3A3A3A] shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <span
                className={`font-medium ${
                  item.completed ? 'text-linkedin-text-primary' : 'text-linkedin-text-secondary'
                }`}
              >
                {item.label}
              </span>
              <p className="text-[11px] text-linkedin-text-muted truncate">{item.tip}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-linkedin-border">
        {hasResume ? (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => navigate('/profile')}
            icon={UserCheck}
            className="text-xs font-semibold"
          >
            Review Full Profile
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => navigate('/upload')}
            icon={UploadCloud}
            className="text-xs font-bold shadow-sm"
          >
            Upload Resume (PDF)
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletionCard;
