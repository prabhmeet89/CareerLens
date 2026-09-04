import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorState = ({
  icon: Icon = AlertCircle,
  title = 'Unable to load content',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  isRetrying = false,
  actionText,
  onAction,
  actionTo,
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div
        className={`p-3.5 rounded-xl bg-red-50/80 dark:bg-linkedin-danger-bg border border-red-200 dark:border-linkedin-danger/30 text-red-900 dark:text-linkedin-danger text-xs flex items-center justify-between gap-3 ${className}`}
        role="alert"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className="w-4 h-4 text-red-600 dark:text-linkedin-danger shrink-0" aria-hidden="true" />
          <span className="truncate">{message}</span>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1 font-bold text-red-700 dark:text-linkedin-danger hover:text-red-900 dark:hover:text-red-400 underline disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isRetrying ? 'Retrying…' : 'Retry'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`text-center flex flex-col items-center justify-center py-10 px-6 bg-red-50/40 dark:bg-linkedin-danger-bg border border-red-200 dark:border-linkedin-danger/30 rounded-[12px] shadow-sm space-y-4 max-w-lg mx-auto ${className}`}
      role="alert"
    >
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-[#3D1A1C] text-red-600 dark:text-linkedin-danger flex items-center justify-center border border-red-200 dark:border-linkedin-danger/30 shadow-2xs">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      {/* Text Hierarchy */}
      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-red-950 dark:text-linkedin-danger">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-red-800/90 dark:text-red-300 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            icon={RefreshCw}
            className={`text-xs font-bold bg-red-700 hover:bg-red-800 text-white border-red-800 ${
              isRetrying ? 'animate-spin' : ''
            }`}
          >
            {isRetrying ? 'Retrying…' : 'Try Again'}
          </Button>
        )}

        {actionText && (
          actionTo ? (
            <Link to={actionTo}>
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                {actionText}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={onAction} className="text-xs font-semibold">
              {actionText}
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default ErrorState;
