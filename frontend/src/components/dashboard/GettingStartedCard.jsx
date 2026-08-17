import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import api from '../../api/axiosClient';

const GettingStartedCard = () => {
  const navigate = useNavigate();
  const [hasProfile, setHasProfile] = useState(false);
  const [skillsCount, setSkillsCount] = useState(0);

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const res = await api.get('/profile/me');
        if (res.data?.success && res.data?.data) {
          setHasProfile(true);
          setSkillsCount(res.data.data.skills?.length || 0);
        }
      } catch {
        // Ignore error
      }
    };
    checkProfileStatus();
  }, []);

  const steps = [
    {
      id: 1,
      title: 'Create account & verify session',
      subtitle: 'HTTP-only JWT cookie auth setup',
      completed: true,
      phase: 'Phase 1',
    },
    {
      id: 2,
      title: 'Upload your student resume',
      subtitle: hasProfile ? 'PDF uploaded & processed' : 'PDF / DOCX parser & extraction',
      completed: hasProfile,
      phase: 'Phase 2',
      action: !hasProfile ? () => navigate('/upload') : null,
    },
    {
      id: 3,
      title: 'Complete candidate profile',
      subtitle: hasProfile ? `${skillsCount} skills extracted via Claude AI` : 'Target roles, skills, graduation year',
      completed: hasProfile,
      phase: 'Phase 2',
      action: hasProfile ? () => navigate('/profile') : () => navigate('/upload'),
    },
    {
      id: 4,
      title: 'Generate AI match scores',
      subtitle: 'Match against real job listings',
      completed: false,
      phase: 'Phase 3',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-white border border-linkedin-border rounded-[10px] p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-linkedin-border mb-3">
        <div>
          <h3 className="text-sm font-bold text-linkedin-text-primary">
            Getting Started
          </h3>
          <p className="text-[11px] text-linkedin-text-secondary mt-0.5">
            Your journey on Resume2Role
          </p>
        </div>
        <span className="text-xs font-bold text-linkedin-blue bg-linkedin-blue-light px-2 py-0.5 rounded-full">
          {completedCount}/4 Done
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={step.action || undefined}
            className={`flex items-start gap-2.5 ${
              step.action ? 'cursor-pointer hover:bg-gray-50 p-1 -m-1 rounded-md transition-colors' : ''
            }`}
          >
            {step.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p
                  className={`text-xs font-semibold ${
                    step.completed
                      ? 'text-linkedin-text-primary line-through decoration-gray-400 decoration-1'
                      : 'text-linkedin-text-secondary'
                  }`}
                >
                  {step.title}
                </p>
                <span className="text-[9px] text-linkedin-text-muted shrink-0 font-medium">
                  {step.phase}
                </span>
              </div>
              <p className="text-[11px] text-linkedin-text-muted leading-tight mt-0.5">
                {step.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 pt-3 border-t border-linkedin-border">
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-linkedin-blue h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-linkedin-text-muted text-center mt-1.5">
          {progressPercent}% Onboarding Completed
        </p>
      </div>
    </div>
  );
};

export default GettingStartedCard;
