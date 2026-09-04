import React from 'react';

/**
 * Clean, lightweight skeleton for Job Cards matching JobCard.jsx dimensions
 */
export const SkeletonJobCard = ({ count = 3 }) => {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading job opportunities">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-5 animate-pulse space-y-3.5 shadow-2xs"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-11 h-11 bg-gray-200 dark:bg-[#2A2A2A] rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded w-1/2" />
                <div className="h-3 bg-gray-100 dark:bg-[#222222] rounded w-1/3" />
              </div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-[#2A2A2A] rounded-full w-24 shrink-0" />
          </div>

          <div className="flex gap-2 pt-1">
            <div className="h-5 bg-gray-100 dark:bg-[#222222] rounded-md w-16" />
            <div className="h-5 bg-gray-100 dark:bg-[#222222] rounded-md w-20" />
            <div className="h-5 bg-gray-100 dark:bg-[#222222] rounded-md w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for Dashboard metric cards
 */
export const SkeletonMetricCard = () => (
  <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-5 animate-pulse space-y-2.5 shadow-2xs">
    <div className="flex items-center justify-between">
      <div className="h-3 bg-gray-200 dark:bg-[#2A2A2A] rounded w-20" />
      <div className="w-6 h-6 bg-gray-100 dark:bg-[#222222] rounded-md" />
    </div>
    <div className="h-6 bg-gray-200 dark:bg-[#2A2A2A] rounded w-12" />
    <div className="h-2.5 bg-gray-100 dark:bg-[#222222] rounded w-28" />
  </div>
);

/**
 * Skeleton for Profile sections
 */
export const SkeletonProfileCard = () => (
  <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-6 animate-pulse space-y-4 shadow-2xs">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-200 dark:bg-[#2A2A2A] rounded-xl" />
      <div className="space-y-1.5 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded w-1/3" />
        <div className="h-3 bg-gray-100 dark:bg-[#222222] rounded w-1/4" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-100 dark:bg-[#222222] rounded w-full" />
      <div className="h-3 bg-gray-100 dark:bg-[#222222] rounded w-5/6" />
      <div className="h-3 bg-gray-100 dark:bg-[#222222] rounded w-2/3" />
    </div>
  </div>
);
