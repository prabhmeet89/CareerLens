import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  Clock,
  ChevronLeft,
  Globe,
} from 'lucide-react';
import {
  getCompanyInitials,
  formatPostedDate,
  formatEmploymentType,
} from '../../utils/jobHelpers';

const JobDetailHeader = ({ job = {} }) => {
  const navigate = useNavigate();
  const [logoFailed, setLogoFailed] = useState(false);

  const companyName = job.company || 'Company';
  const initials = getCompanyInitials(companyName);
  const location = job.location || 'Remote';
  const employmentType = formatEmploymentType(job.employmentType);
  const postedDate = formatPostedDate(job.postedAt || job.createdAt);
  const source = job.source || 'adzuna';

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/jobs');
    }
  };

  return (
    <header className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-7 shadow-sm space-y-4">
      {/* Back Navigation Button */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-linkedin-blue hover:text-linkedin-blue-hover transition-colors focus:outline-none focus:underline"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Jobs</span>
        </button>
      </div>

      {/* Main Identity Row */}
      <div className="flex items-start gap-4">
        {/* Company Avatar / Logo */}
        <div className="shrink-0 w-14 h-14 rounded-xl bg-linkedin-blue-light border border-blue-200/80 text-linkedin-blue flex items-center justify-center font-black text-lg select-none shadow-2xs">
          {job.logo && !logoFailed ? (
            <img
              src={job.logo}
              alt={`${companyName} logo`}
              onError={() => setLogoFailed(true)}
              className="w-full h-full object-contain rounded-xl p-1"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Title, Company, Source */}
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-linkedin-text-primary tracking-tight leading-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-linkedin-text-primary">
            <span>{companyName}</span>
            {source && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-linkedin-text-muted bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                <Globe className="w-3 h-3 text-gray-400" aria-hidden="true" />
                <span>Via {source.charAt(0).toUpperCase() + source.slice(1)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Badges Row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-linkedin-text-secondary border-t border-linkedin-border">
        <span className="flex items-center gap-1.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <span>{location}</span>
        </span>

        <span className="flex items-center gap-1.5 font-medium">
          <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <span>{employmentType}</span>
        </span>

        {postedDate && (
          <span className="flex items-center gap-1.5 text-linkedin-text-muted">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Posted {postedDate}</span>
          </span>
        )}

        {job.salary && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {job.salary}
          </span>
        )}
      </div>
    </header>
  );
};

export default JobDetailHeader;
