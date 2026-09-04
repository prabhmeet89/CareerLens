import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are currently no items to display.',
  actionText,
  onAction,
  actionTo,
  actionIcon,
  secondaryActionText,
  onSecondaryAction,
  secondaryActionTo,
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`text-center flex flex-col items-center justify-center ${
        compact
          ? 'py-6 px-4 bg-[#F8FAFC] dark:bg-[#1A1A1A] border border-dashed border-gray-300 dark:border-[#2A2A2A] rounded-xl space-y-2.5'
          : 'py-12 px-6 bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] shadow-sm space-y-4 max-w-lg mx-auto'
      } ${className}`}
      role="status"
      aria-label={title}
    >
      {/* Icon Badge */}
      <div
        className={`rounded-full flex items-center justify-center border shadow-2xs select-none ${
          compact
            ? 'w-10 h-10 bg-blue-50 dark:bg-linkedin-accent-light text-linkedin-blue border-blue-200 dark:border-linkedin-blue/30'
            : 'w-16 h-16 bg-blue-50 dark:bg-linkedin-accent-light text-linkedin-blue border-blue-200 dark:border-linkedin-blue/30'
        }`}
      >
        <Icon className={compact ? 'w-5 h-5' : 'w-8 h-8'} aria-hidden="true" />
      </div>

      {/* Text Hierarchy */}
      <div className="space-y-1 max-w-md mx-auto">
        <h3
          className={`font-bold text-linkedin-text-primary ${
            compact ? 'text-sm' : 'text-base sm:text-lg'
          }`}
        >
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-linkedin-text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {(actionText || secondaryActionText) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          {actionText && (
            actionTo ? (
              <Link to={actionTo}>
                <Button
                  variant="primary"
                  size={compact ? 'sm' : 'md'}
                  icon={actionIcon}
                  className="text-xs font-bold shadow-xs"
                >
                  {actionText}
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size={compact ? 'sm' : 'md'}
                onClick={onAction}
                icon={actionIcon}
                className="text-xs font-bold shadow-xs"
              >
                {actionText}
              </Button>
            )
          )}

          {secondaryActionText && (
            secondaryActionTo ? (
              <Link to={secondaryActionTo}>
                <Button
                  variant="outline"
                  size={compact ? 'sm' : 'md'}
                  className="text-xs font-semibold"
                >
                  {secondaryActionText}
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size={compact ? 'sm' : 'md'}
                onClick={onSecondaryAction}
                className="text-xs font-semibold"
              >
                {secondaryActionText}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
