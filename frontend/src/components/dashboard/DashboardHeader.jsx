import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { getPrimaryNextAction } from '../../utils/dashboardHelpers';

const DashboardHeader = ({ user, profile, topJobs = [], applications = [] }) => {
  const navigate = useNavigate();

  const rawName = user?.name ? user.name.split(' ')[0] : 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const nextAction = getPrimaryNextAction({ profile, topJobs, applications });
  const ActionIcon = nextAction.icon;

  return (
    <header className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Welcome Text */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-linkedin-blue bg-linkedin-blue-light px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {nextAction.tag}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-linkedin-text-primary">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-linkedin-text-secondary max-w-xl">
            {nextAction.description}
          </p>
        </div>

        {/* Single Primary Action Button */}
        <div className="shrink-0 flex items-center gap-2.5">
          <Button
            variant={nextAction.variant}
            size="md"
            onClick={() => navigate(nextAction.route)}
            icon={ActionIcon}
            className="font-bold shadow-sm text-xs sm:text-sm"
          >
            {nextAction.label}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
