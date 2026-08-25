import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, AlertCircle, TrendingUp } from 'lucide-react';
import Button from '../common/Button';
import { calculateMatchReadiness } from '../../utils/dashboardHelpers';

const MatchReadinessCard = ({ profile, jobs = [], loading, error }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white border border-linkedin-border rounded-[12px] p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-12 bg-gray-100 rounded-xl w-full" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-gray-100 rounded-lg" />
          <div className="h-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const readiness = calculateMatchReadiness({ profile, jobs });

  // Tone styling based on readiness level
  const theme = {
    strong: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      ring: 'ring-emerald-500 text-emerald-700',
      bar: 'bg-emerald-500',
    },
    developing: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      ring: 'ring-amber-500 text-amber-700',
      bar: 'bg-amber-500',
    },
    early: {
      badge: 'bg-blue-50 text-linkedin-blue border-blue-200',
      ring: 'ring-linkedin-blue text-linkedin-blue',
      bar: 'bg-linkedin-blue',
    },
  }[readiness.level] || {
    badge: 'bg-gray-100 text-gray-700 border-gray-300',
    ring: 'ring-gray-300 text-gray-600',
    bar: 'bg-gray-400',
  };

  return (
    <section
      className="bg-white border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm space-y-5"
      aria-labelledby="readiness-summary-heading"
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-linkedin-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center shrink-0">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 id="readiness-summary-heading" className="text-base font-bold text-linkedin-text-primary">
              Your Match Readiness
            </h2>
            <p className="text-xs text-linkedin-text-secondary">
              Aggregated across {readiness.recommendationCount} active personalized recommendation{readiness.recommendationCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {readiness.score !== null && (
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full border text-xs font-bold ${theme.badge}`}>
              {readiness.status}
            </div>
          </div>
        )}
      </div>

      {/* Score and Plain Language Interpretation */}
      {readiness.score !== null ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#F8FAFC] border border-gray-200/80 rounded-xl p-4">
            <div className="shrink-0 flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-full ring-4 ${theme.ring} bg-white flex flex-col items-center justify-center shadow-xs`}
              >
                <span className="text-lg font-black leading-tight text-linkedin-text-primary">{readiness.score}%</span>
                <span className="text-[9px] font-semibold text-linkedin-text-muted uppercase">Avg Fit</span>
              </div>
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <h3 className="text-sm font-bold text-linkedin-text-primary">{readiness.label}</h3>
              <p className="text-xs text-linkedin-text-secondary leading-relaxed">{readiness.description}</p>
            </div>
          </div>

          {/* Strengths vs Skill Gaps Split Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Top Strengths */}
            <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Top Profile Strengths</span>
              </div>
              {readiness.topStrengths.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {readiness.topStrengths.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs"
                    >
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-700 italic">No recurring matched skills identified yet.</p>
              )}
            </div>

            {/* Top Recurring Skill Gaps */}
            <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Key Missing Skills Across Roles</span>
              </div>
              {readiness.topGaps.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {readiness.topGaps.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] font-medium text-amber-900 bg-white border border-amber-200 border-dashed px-2 py-0.5 rounded-md shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-amber-800">Great alignment — zero major recurring skill gaps.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-6 px-4 bg-[#F8FAFC] border border-dashed border-gray-300 rounded-xl space-y-3">
          <Sparkles className="w-8 h-8 text-linkedin-blue mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-linkedin-text-primary">Match Readiness Not Yet Available</h3>
            <p className="text-xs text-linkedin-text-secondary mt-1">
              Upload your PDF resume to allow CareerLens to calculate your match readiness score and identify skill gaps.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/upload')}
            className="font-bold text-xs"
          >
            Upload Resume
          </Button>
        </div>
      )}
    </section>
  );
};

export default MatchReadinessCard;
