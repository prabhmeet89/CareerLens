import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';

const WelcomeCard = () => {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

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
            You've successfully created your account on <strong>Resume2Role</strong>. This is your personal career feed where AI-tailored role matches, skill benchmarks, and industry internships will be published.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Account Active
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-linkedin-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-linkedin-text-secondary">
          Next up: <span className="font-semibold text-linkedin-text-primary">Phase 2 — Resume Upload & Skill Extraction</span>
        </div>
        <span className="text-[11px] font-medium text-linkedin-blue bg-linkedin-blue-light/50 px-2 py-0.5 rounded">
          Cookie Auth &amp; Session Verified
        </span>
      </div>
    </div>
  );
};

export default WelcomeCard;
