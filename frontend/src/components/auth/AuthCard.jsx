import React from 'react';
import { Link } from 'react-router-dom';

const AuthCard = ({
  title,
  subtitle,
  children,
  footerPrompt,
  footerLinkText,
  footerLinkHref,
  error,
}) => {
  return (
    <div className="min-h-screen bg-linkedin-bg flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Logo */}
      <div className="max-w-md w-full mx-auto flex items-center justify-center sm:justify-start pt-2 sm:pt-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-[4px] bg-linkedin-blue flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-linkedin-blue-hover transition-colors">
            <span>R2R</span>
          </div>
          <span className="font-bold text-xl text-linkedin-blue tracking-tight">
            Resume<span className="text-linkedin-text-primary">2Role</span>
          </span>
        </Link>
      </div>

      {/* Main Centered Auth Card */}
      <div className="max-w-[400px] w-full mx-auto my-auto">
        <div className="bg-white p-6 sm:p-8 rounded-[12px] shadow-linkedin-card border border-linkedin-border">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-[28px] font-bold text-linkedin-text-primary leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-1.5 font-normal">
                {subtitle}
              </p>
            )}
          </div>

          {/* Global Alert Error */}
          {error && (
            <div
              className="mb-5 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200"
              role="alert"
            >
              <span className="text-sm shrink-0">⚠️</span>
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form Content */}
          <div>{children}</div>
        </div>

        {/* Footer switch prompt */}
        {footerPrompt && footerLinkText && footerLinkHref && (
          <div className="text-center mt-6 text-xs sm:text-sm text-linkedin-text-secondary">
            {footerPrompt}{' '}
            <Link
              to={footerLinkHref}
              className="font-semibold text-linkedin-blue hover:text-linkedin-blue-hover hover:underline transition-colors ml-1"
            >
              {footerLinkText}
            </Link>
          </div>
        )}
      </div>

      {/* Footer copyright / info */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] text-linkedin-text-muted pb-2">
        <p>Resume2Role &copy; {new Date().getFullYear()} &bull; Student Career Platform &bull; Phase 1</p>
      </footer>
    </div>
  );
};

export default AuthCard;
