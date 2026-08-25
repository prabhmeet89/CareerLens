import React from 'react';
import { STAGES } from '../../utils/applicationHelpers';
import ApplicationCard from './ApplicationCard';
import { Inbox } from 'lucide-react';

const ApplicationKanbanBoard = ({
  applications = [],
  onStatusSelect,
  onSaveNotes,
  updatingTaskIds = new Set(),
}) => {
  // Group applications by status stage
  const groupedApps = {
    Applied: [],
    Shortlisted: [],
    Interview: [],
    Offer: [],
    Rejected: [],
  };

  applications.forEach((app) => {
    const st = app.status || 'Applied';
    if (groupedApps[st]) {
      groupedApps[st].push(app);
    } else {
      groupedApps.Applied.push(app);
    }
  });

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start"
      role="region"
      aria-label="Application Pipeline Kanban Board"
    >
      {STAGES.map((stage) => {
        const stageApps = groupedApps[stage.key] || [];
        const Icon = stage.icon;

        return (
          <section
            key={stage.key}
            className="bg-[#F8FAFC] border border-linkedin-border rounded-[12px] p-3.5 space-y-3 flex flex-col min-h-[400px]"
            aria-labelledby={`col-${stage.key}-title`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg border text-xs font-bold ${stage.color}`}>
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <h3 id={`col-${stage.key}-title`} className="text-xs font-bold text-linkedin-text-primary uppercase tracking-wider">
                  {stage.label}
                </h3>
              </div>

              <span className="text-xs font-bold bg-white text-linkedin-text-secondary border border-gray-200 px-2 py-0.5 rounded-full shadow-2xs">
                {stageApps.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1">
              {stageApps.length > 0 ? (
                stageApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    compact={true}
                    onStatusSelect={onStatusSelect}
                    onSaveNotes={onSaveNotes}
                    isUpdatingStatus={updatingTaskIds.has(app.id)}
                  />
                ))
              ) : (
                <div className="py-8 px-2 text-center text-gray-400 space-y-1.5 border border-dashed border-gray-200 rounded-xl bg-white/60">
                  <Inbox className="w-6 h-6 mx-auto opacity-50" aria-hidden="true" />
                  <p className="text-[11px] font-medium">No {stage.label.toLowerCase()} roles</p>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default ApplicationKanbanBoard;
