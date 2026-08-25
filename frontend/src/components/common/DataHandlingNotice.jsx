import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const DataHandlingNotice = ({ className = '' }) => {
  return (
    <div
      className={`rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-linkedin-text-secondary flex items-start gap-3 ${className}`}
      role="region"
      aria-label="Data Privacy and Usage Notice"
    >
      <ShieldCheck className="w-4 h-4 text-linkedin-blue shrink-0 mt-0.5" aria-hidden="true" />
      <div className="space-y-1 leading-relaxed">
        <p className="font-semibold text-linkedin-text-primary">
          Your Privacy & Data Control
        </p>
        <p>
          CareerLens uses your resume exclusively to extract verified skills, benchmark job fit, and generate personalized recommendations. We never sell your resume or personal details to third parties. You can delete your resume and profile data at any time in{' '}
          <Link to="/profile" className="font-bold text-linkedin-blue hover:underline">
            Profile Settings
          </Link>
          .
        </p>
        <p className="pt-0.5">
          <Link to="/privacy" className="font-bold text-linkedin-blue hover:underline">
            Read our full Privacy Policy &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
};

export default DataHandlingNotice;
