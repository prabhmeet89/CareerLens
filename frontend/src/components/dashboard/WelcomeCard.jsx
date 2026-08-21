import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck, UploadCloud, User } from 'lucide-react';
import Button from '../common/Button';
import api from '../../api/axiosClient';

const WelcomeCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await api.get('/profile/me');
        if (res.data?.success && res.data?.data) {
          setHasProfile(true);
        }
      } catch {
        // ignore
      }
    };
    checkProfile();
  }, []);

  return (
    <div className="bg-white border border-linkedin-border rounded-[10px] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-linkedin-blue-light text-linkedin-blue text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Student Career Recommendation Platform</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-linkedin-text-primary">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-1 max-w-xl">
            {hasProfile
              ? 'Your candidate profile has been extracted by Claude AI. You can view your verified skills, projects, and target roles.'
              : "Upload your resume PDF to extract your skills, coursework, and projects into a structured AI candidate profile."}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {hasProfile ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/profile')}
              icon={User}
            >
              View Profile
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/upload')}
              icon={UploadCloud}
              className="font-bold shadow"
            >
              Upload Resume
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-linkedin-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-linkedin-text-secondary">
          Current State:{' '}
          <span className="font-semibold text-linkedin-text-primary">
            {hasProfile ? '✅ Profile Ready' : '⚡ Ready for Resume Upload'}
          </span>
        </div>
        <span className="text-[11px] font-medium text-linkedin-blue bg-linkedin-blue-light/50 px-2 py-0.5 rounded">
          Cookie Auth &amp; Session Verified
        </span>
      </div>
    </div>
  );
};

export default WelcomeCard;
