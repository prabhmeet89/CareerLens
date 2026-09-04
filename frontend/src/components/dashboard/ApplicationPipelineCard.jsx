import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Award } from 'lucide-react';
import Button from '../common/Button';

const ApplicationPipelineCard = ({ stats = {}, total = 0, loading = false, error = null }) => {
  const navigate = useNavigate();

  const stages = [
    { key: 'Applied', label: 'Applied', count: stats.Applied || 0, color: 'text-linkedin-blue bg-blue-50 dark:bg-linkedin-accent-light border-blue-200 dark:border-linkedin-blue/30' },
    { key: 'Shortlisted', label: 'Shortlisted', count: stats.Shortlisted || 0, color: 'text-linkedin-purple bg-linkedin-purple-bg border-linkedin-purple/30' },
    { key: 'Interview', label: 'Interview', count: stats.Interview || 0, color: 'text-linkedin-green bg-linkedin-green-bg border-linkedin-green/30', highlight: true },
    { key: 'Offer', label: 'Offer', count: stats.Offer || 0, color: 'text-linkedin-amber bg-linkedin-amber-bg border-linkedin-amber/30', highlight: true },
    { key: 'Rejected', label: 'Archived', count: stats.Rejected || 0, color: 'text-linkedin-text-secondary bg-linkedin-inset border-linkedin-border' },
  ];

  const activeInterviews = stats.Interview || 0;
  const activeOffers = stats.Offer || 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[10px] p-4 shadow-sm animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded w-1/2" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 bg-gray-100 dark:bg-[#222222] rounded" />
          <div className="h-12 bg-gray-100 dark:bg-[#222222] rounded" />
          <div className="h-12 bg-gray-100 dark:bg-[#222222] rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="bg-white border border-linkedin-border rounded-[10px] p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-red-600 text-xs font-bold">
          <ClipboardList className="w-4 h-4" />
          <span>Application Tracker</span>
        </div>
        <p className="text-xs text-linkedin-text-secondary">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/applications')}
          className="text-xs text-linkedin-blue hover:underline font-semibold"
        >
          View Tracker
        </button>
      </section>
    );
  }

  return (
    <section
      className="bg-white border border-linkedin-border rounded-[10px] p-4 shadow-sm space-y-3.5"
      aria-labelledby="application-pipeline-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-linkedin-blue" />
          <h3 id="application-pipeline-heading" className="text-xs font-bold text-linkedin-text-primary uppercase tracking-wider">
            Application Tracker
          </h3>
        </div>
        <span className="text-xs font-bold text-linkedin-blue bg-linkedin-blue-light px-2.5 py-0.5 rounded-full">
          {total} Total
        </span>
      </div>

      {/* Active High-Priority Alerts (Interviews or Offers) */}
      {(activeInterviews > 0 || activeOffers > 0) && (
        <div className="p-2.5 bg-emerald-50/70 dark:bg-linkedin-green-bg border border-emerald-200 dark:border-linkedin-green/30 rounded-lg text-xs flex items-center justify-between text-emerald-900 dark:text-linkedin-green">
          <div className="flex items-center gap-1.5 font-bold">
            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {activeInterviews > 0 && `${activeInterviews} active interview${activeInterviews > 1 ? 's' : ''}`}
              {activeInterviews > 0 && activeOffers > 0 && ' & '}
              {activeOffers > 0 && `${activeOffers} offer received!`}
            </span>
          </div>
          <button
            onClick={() => navigate('/applications')}
            className="text-[11px] font-bold text-emerald-800 underline hover:no-underline"
          >
            View
          </button>
        </div>
      )}

      {total === 0 ? (
        /* Empty State */
        <div className="text-center py-4 px-2 bg-gray-50/60 dark:bg-[#1A1A1A] rounded-lg border border-dashed border-gray-200 dark:border-[#2A2A2A] space-y-2">
          <p className="text-xs text-linkedin-text-secondary">
            You haven’t tracked any job applications yet.
          </p>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="text-xs font-bold text-linkedin-blue hover:underline"
          >
            Browse and apply to jobs &rarr;
          </button>
        </div>
      ) : (
        /* Stages Grid */
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {stages.map((stage) => (
            <div
              key={stage.key}
              className={`p-2 rounded-lg border flex flex-col justify-between ${stage.color}`}
            >
              <div className="text-base font-black leading-none">{stage.count}</div>
              <div className="text-[10px] font-semibold mt-1 truncate">{stage.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 border-t border-linkedin-border">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => navigate('/applications')}
          className="text-xs font-semibold"
        >
          Manage Application Pipeline
        </Button>
      </div>
    </section>
  );
};

export default ApplicationPipelineCard;
