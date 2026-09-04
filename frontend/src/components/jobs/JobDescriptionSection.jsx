import React from 'react';
import { FileText, ExternalLink, Globe } from 'lucide-react';

const JobDescriptionSection = ({ job = {} }) => {
  const description = job.description || 'No detailed role description provided for this listing.';
  const applicationUrl = job.applicationUrl;
  const isExternalUrl = applicationUrl && applicationUrl.startsWith('http');

  return (
    <section
      className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-6 sm:p-7 shadow-sm space-y-5"
      aria-labelledby="job-description-heading"
    >
      <div className="flex items-center justify-between pb-3 border-b border-linkedin-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-linkedin-accent-light text-linkedin-blue flex items-center justify-center shrink-0">
            <FileText className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="job-description-heading" className="text-base sm:text-lg font-bold text-linkedin-text-primary">
              Full Job Description
            </h2>
            <p className="text-xs text-linkedin-text-secondary">
              Direct overview and responsibilities provided by the employer
            </p>
          </div>
        </div>
      </div>

      {/* Description Content */}
      <div className="prose prose-sm max-w-none text-linkedin-text-primary dark:prose-invert text-sm leading-relaxed whitespace-pre-line break-words">
        {description}
      </div>

      {/* External Source Link */}
      {isExternalUrl && (
        <div className="pt-4 border-t border-linkedin-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-linkedin-text-muted">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            <span>Listing sourced from {job.source || 'Adzuna'} aggregator.</span>
          </div>

          <a
            href={applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-linkedin-blue hover:underline"
          >
            <span>View Original Posting</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
    </section>
  );
};

export default JobDescriptionSection;
