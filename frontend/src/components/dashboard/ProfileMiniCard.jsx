import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bookmark, ShieldCheck } from 'lucide-react';

const ProfileMiniCard = () => {
  const { user, profile } = useAuth();
  const displayRole = profile?.preferredRoles?.[0] || user?.tagline || 'Student Candidate';

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-white border border-linkedin-border rounded-[10px] overflow-hidden shadow-sm">
      {/* Cover Banner */}
      <div className="h-16 bg-gradient-to-r from-[#0A66C2] via-[#004182] to-[#002244] relative" />

      {/* Avatar & User Details */}
      <div className="px-4 pb-4 pt-0 text-center relative -mt-9">
        <div className="inline-block relative">
          <div className="w-16 h-16 rounded-full bg-linkedin-blue text-white font-bold text-xl flex items-center justify-center border-2 border-white shadow-md mx-auto">
            {getInitials(user?.name)}
          </div>
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" title="Active" />
        </div>

        <h2 className="text-base font-bold text-linkedin-text-primary mt-2 hover:underline cursor-pointer">
          {user?.name || 'Student User'}
        </h2>
        <p className="text-xs text-linkedin-text-secondary mt-0.5 line-clamp-2">
          {displayRole}
        </p>

        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-linkedin-blue bg-linkedin-blue-light px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          <span>Role: {user?.role || 'student'}</span>
        </div>
      </div>

      {/* Quick stats section */}
      <div className="border-t border-linkedin-border py-2 text-xs">
        <div className="px-4 py-1.5 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer">
          <span className="text-linkedin-text-secondary">Profile viewers</span>
          <span className="font-semibold text-linkedin-blue">48</span>
        </div>
        <div className="px-4 py-1.5 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer">
          <span className="text-linkedin-text-secondary">Post impressions</span>
          <span className="font-semibold text-linkedin-blue">142</span>
        </div>
      </div>

      {/* Saved items bookmark */}
      <div className="border-t border-linkedin-border px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold text-linkedin-text-primary">
        <Bookmark className="w-3.5 h-3.5 text-linkedin-text-secondary" />
        <span>My Saved Jobs (0)</span>
      </div>
    </div>
  );
};

export default ProfileMiniCard;
