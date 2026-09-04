import React from 'react';
import { Info } from 'lucide-react';
import { STAGES } from '../../utils/applicationHelpers';

const PipelineSummary = ({
  stats = {},
  total = 0,
  activeFilter = 'All',
  onFilterChange,
}) => {
  return (
    <div className="space-y-3">
      {/* Clickable Stage Filter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5" role="tablist" aria-label="Filter applications by stage">
        {/* All Applications Filter */}
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'All'}
          onClick={() => onFilterChange('All')}
          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-linkedin-blue ${
            activeFilter === 'All'
              ? 'bg-linkedin-blue text-white border-linkedin-blue shadow-xs font-bold'
              : 'bg-white dark:bg-[#141414] text-linkedin-text-primary border-linkedin-border hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
          }`}
        >
          <span className="text-[11px] uppercase font-bold tracking-wider opacity-90">All Stages</span>
          <span className="text-xl font-black mt-1">{total}</span>
        </button>

        {/* Individual Stage Pills */}
        {STAGES.map((stage) => {
          const count = stats[stage.key] || 0;
          const isSelected = activeFilter === stage.key;
          const Icon = stage.icon;

          return (
            <button
              key={stage.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onFilterChange(stage.key)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-linkedin-blue ${
                isSelected
                  ? 'ring-2 ring-linkedin-blue font-bold shadow-xs ' + stage.color
                  : 'bg-white dark:bg-[#141414] text-linkedin-text-primary border-linkedin-border hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider">
                <span className="truncate">{stage.label}</span>
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
              </div>
              <span className="text-xl font-black mt-1">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Information Disclosure Banner */}
      <div className="p-3.5 bg-blue-50/70 dark:bg-[#1A2B3C]/40 border border-blue-200/80 dark:border-[#4C9EEB]/30 rounded-xl text-xs text-linkedin-blue flex items-start gap-2.5">
        <Info className="w-4 h-4 text-linkedin-blue shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-0.5">
          <span className="font-bold text-blue-950 dark:text-blue-200">Self-Managed Tracking</span>
          <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-relaxed">
            Applications tracked here help organize your interview preparation and personal notes. Status updates remain local to your CareerLens dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PipelineSummary;
