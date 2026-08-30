import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Clock,
  Info,
} from 'lucide-react';
import Spinner from '../common/Spinner';
import { formatGeneratedDate } from '../../utils/jobHelpers';

const JobMatchExplanation = ({
  explanation = null,
  loading = false,
  regenerating = false,
  error = null,
  onRegenerate,
}) => {
  const generatedDate = formatGeneratedDate(explanation?.generatedAt);

  return (
    <section
      className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-7 shadow-sm space-y-5"
      aria-labelledby="match-explanation-heading"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-linkedin-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center shrink-0">
            <FileText className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="match-explanation-heading" className="text-base sm:text-lg font-bold text-linkedin-text-primary">
                AI Match Synthesis
              </h2>
              <span className="text-[10px] uppercase font-bold text-linkedin-blue bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                AI-Assisted Guidance
              </span>
            </div>
            <p className="text-xs text-linkedin-text-secondary">
              Interpretive evaluation based on your profile and role qualifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {explanation?.verdict && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              <span>{explanation.verdict}</span>
            </span>
          )}

          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={loading || regenerating}
              title="Regenerate AI Match Synthesis with current profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-linkedin-blue hover:text-linkedin-blue-hover border border-linkedin-border hover:border-linkedin-blue/40 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{regenerating ? 'Refreshing…' : 'Regenerate'}</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        /* Async Loading Skeleton */
        <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
          <Spinner size="md" color="text-linkedin-blue" />
          <p className="text-xs font-semibold text-linkedin-text-secondary">
            Synthesizing personalized match analysis...
          </p>
        </div>
      ) : explanation ? (
        <div className="space-y-4">
          {/* Two-Column Strengths vs Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Candidate Strengths */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Profile Strengths</span>
              </div>
              <ul className="space-y-2">
                {explanation.strengths?.map((bullet, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-emerald-950 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-emerald-600 font-bold mt-0.5">&bull;</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Areas / Missing Coverage */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>Skill Gaps &amp; Focus Areas</span>
              </div>
              <ul className="space-y-2">
                {explanation.gaps?.map((bullet, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-amber-950 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-amber-600 font-bold mt-0.5">&bull;</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Disclosure & Generated Timestamp Footer */}
          <div className="pt-2 border-t border-linkedin-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-linkedin-text-muted">
            <div className="flex items-start sm:items-center gap-1.5 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <span>
                AI-assisted guidance based on your analyzed profile. Review the original job description before applying.
              </span>
            </div>

            {generatedDate && (
              <div className="flex items-center gap-1 shrink-0 font-medium text-gray-500">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>{generatedDate}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Error or Unavailable Fallback */
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-xs text-linkedin-text-secondary">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
            <span>{error || 'Match analysis is temporarily unavailable.'}</span>
          </div>
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center gap-1 font-bold text-linkedin-blue hover:underline shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Generate Explanation</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default JobMatchExplanation;
