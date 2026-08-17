import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Award, Target, ExternalLink } from 'lucide-react';
import api from '../../api/axiosClient';

const QuickStatsCard = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/profile/me');
        if (res.data?.success && res.data?.data) {
          setProfileData(res.data.data);
        }
      } catch {
        // ignore
      }
    };
    loadProfile();
  }, []);

  const hasResume = !!profileData?.resumeId;
  const skillsCount = profileData?.skills?.length || 0;
  const topRole = profileData?.preferredRoles?.[0] || '--';

  return (
    <div className="bg-white border border-linkedin-border rounded-[10px] p-3 shadow-sm text-xs">
      <div className="flex items-center justify-between font-semibold text-linkedin-text-primary mb-2.5 px-1">
        <span>Career Lens Toolkit</span>
        <span className="text-[10px] bg-blue-100 text-linkedin-blue font-bold px-1.5 py-0.5 rounded">
          Phase 2 Active
        </span>
      </div>

      <div className="space-y-1">
        <div
          onClick={() => navigate(hasResume ? '/profile' : '/upload')}
          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors cursor-pointer group"
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
          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors cursor-pointer group"
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
          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="font-medium">Top Target Role</span>
          </div>
          <span className="text-[11px] font-semibold text-purple-700 max-w-[90px] truncate">
            {topRole}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-linkedin-border px-1">
        <p className="text-[11px] text-linkedin-text-muted leading-tight">
          ⚡ AI Resume Analysis &amp; Profile Extraction is active.
        </p>
      </div>
    </div>
  );
};

export default QuickStatsCard;
