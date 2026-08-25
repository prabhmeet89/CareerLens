import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Button from '../common/Button';
import { getPrimaryNextAction } from '../../utils/dashboardHelpers';

const DashboardNextStep = ({ profile, topJobs = [], applications = [] }) => {
  const navigate = useNavigate();
  const nextAction = getPrimaryNextAction({ profile, topJobs, applications });
  const ActionIcon = nextAction.icon;

  return (
    <section
      className="bg-gradient-to-r from-[#0A66C2] via-[#08529C] to-[#003870] rounded-[12px] p-6 text-white shadow-md space-y-3"
      aria-labelledby="next-step-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-100 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Recommended Next Focus</span>
          </div>
          <h2 id="next-step-heading" className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {nextAction.label}
          </h2>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            {nextAction.description}
          </p>
        </div>

        <div className="shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(nextAction.route)}
            icon={ActionIcon}
            className="font-bold bg-white text-linkedin-blue hover:bg-gray-100 border-transparent shadow-sm text-xs sm:text-sm"
          >
            {nextAction.label}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DashboardNextStep;
