import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const AuthCard = ({
  title,
  subtitle,
  children,
  footerPrompt,
  footerLinkText,
  footerLinkHref,
  error,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-linkedin-bg flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Logo & Theme Toggle */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2 sm:pt-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-[4px] bg-linkedin-blue flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-linkedin-blue-hover transition-colors">
            <span>CL</span>
          </div>
          <span className="font-bold text-xl text-linkedin-blue tracking-tight">
            Career<span className="text-linkedin-text-primary">Lens</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center justify-center w-9 h-9 rounded-full text-linkedin-text-secondary hover:text-linkedin-text-primary hover:bg-gray-100 dark:hover:bg-[#1C1C1E] transition-colors focus:outline-none focus:ring-2 focus:ring-linkedin-blue"
        >
          {isDark ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Main Centered Auth Card */}
      <div className="max-w-[400px] w-full mx-auto my-auto">
        <div className="bg-white dark:bg-[#141414] p-6 sm:p-8 rounded-[12px] shadow-linkedin-card border border-linkedin-border">
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
              className="mb-5 p-3 rounded-[6px] bg-red-50 dark:bg-linkedin-danger-bg border border-red-200 dark:border-linkedin-danger/30 text-red-700 dark:text-linkedin-danger text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
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
        <p>CareerLens &copy; {new Date().getFullYear()} &bull; Student Career Platform</p>
      </footer>
    </div>
  );
};

export default AuthCard;
