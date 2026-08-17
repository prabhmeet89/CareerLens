import React from 'react';
import { FileText, Award, Target, ExternalLink } from 'lucide-react';

const QuickStatsCard = () => {
  return (
    <div className="bg-white border border-linkedin-border rounded-[10px] p-3 shadow-sm text-xs">
      <div className="flex items-center justify-between font-semibold text-linkedin-text-primary mb-2.5 px-1">
        <span>Career Lens Toolkit</span>
        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
          Phase 1
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-linkedin-blue" />
            <span className="font-medium">Uploaded Resumes</span>
          </div>
          <span className="text-xs font-semibold text-gray-400 group-hover:text-linkedin-blue">
            0/1
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Verified Skills</span>
          </div>
          <span className="text-xs font-semibold text-gray-400 group-hover:text-emerald-600">
            0
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="font-medium">Target Role Matches</span>
          </div>
          <span className="text-xs font-semibold text-gray-400 group-hover:text-purple-600">
            --
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-linkedin-border px-1">
        <p className="text-[11px] text-linkedin-text-muted leading-tight">
          ⚡ AI Resume Analysis & Matching engine unlocks in Phase 2.
        </p>
      </div>
    </div>
  );
};

export default QuickStatsCard;
