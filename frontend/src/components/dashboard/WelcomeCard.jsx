import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, UploadCloud } from 'lucide-react';
import Button from '../common/Button';

const WelcomeCard = () => {
  const navigate = useNavigate();
  const { user, hasProfile } = useAuth();
  const rawName = user?.name ? user.name.split(' ')[0] : 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[10px] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-linkedin-text-primary">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-1 max-w-xl">
            {hasProfile
              ? "Your profile is ready — here's a look at your skills, projects, and target roles."
              : "Upload your resume to extract your skills, coursework, and projects into a structured candidate profile."}
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
    </div>
  );
};

export default WelcomeCard;
