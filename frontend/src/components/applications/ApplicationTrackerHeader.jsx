import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Briefcase } from 'lucide-react';
import Button from '../common/Button';

const ApplicationTrackerHeader = ({ total = 0 }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-7 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-linkedin-blue text-xs font-bold uppercase tracking-wider">
            <ClipboardList className="w-4 h-4" aria-hidden="true" />
            <span>Candidate Dashboard</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-linkedin-text-primary tracking-tight">
              Application Tracker
            </h1>
            <span className="text-xs font-bold text-linkedin-blue bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              {total} tracked
            </span>
          </div>

          <p className="text-xs sm:text-sm text-linkedin-text-secondary max-w-xl">
            Keep your job applications organized, manage your pipeline stages, and track personal interview notes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Explore Jobs Primary Action */}
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/jobs')}
            icon={Briefcase}
            className="text-xs font-bold shadow-sm"
          >
            Explore Jobs
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ApplicationTrackerHeader;
