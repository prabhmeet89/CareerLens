import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, Award, Target } from 'lucide-react';

const QuickStatsCard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const hasResume = !!profile?.resumeId || !!profile;
  const skillsCount = profile?.skills?.length || 0;
  const topRole = profile?.preferredRoles?.[0] || '--';

  return (
    <div className="bg-white border border-linkedin-border rounded-[10px] p-3 shadow-sm text-xs">
      <div className="flex items-center justify-between font-semibold text-linkedin-text-primary mb-2.5 px-1">
        <span>CareerLens Toolkit</span>
      </div>

      <div className="space-y-1">
        <div
          onClick={() => navigate(hasResume ? '/profile' : '/upload')}
          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#1A1A1A] text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-linkedin-blue" />
            <span className="font-medium">Uploaded Resumes</span>
          </div>
          <span className="text-xs font-semibold text-linkedin-blue">
            {hasResume ? '1/1' : '0/1'}
          </span>
        </div>

        <div
          onClick={() => navigate('/profile')}
          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#1A1A1A] text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Verified Skills</span>
          </div>
          <span className="text-xs font-semibold text-emerald-600 font-bold">
            {skillsCount}
          </span>
        </div>

        <div
          onClick={() => navigate('/profile')}
          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#1A1A1A] text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-linkedin-purple" />
            <span className="font-medium">Top Target Role</span>
          </div>
          <span className="text-[11px] font-semibold text-linkedin-purple max-w-[90px] truncate">
            {topRole}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsCard;
