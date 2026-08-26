import React from 'react';
import { X, RotateCcw } from 'lucide-react';

const DATE_LABELS = {
  '1d': 'Past 24 hours',
  '24h': 'Past 24 hours',
  '3d': 'Past 3 days',
  '7d': 'Past week',
  '1w': 'Past week',
  '14d': 'Past 2 weeks',
  '2w': 'Past 2 weeks',
  '30d': 'Past month',
  '1m': 'Past month',
};

const ActiveFilterChips = ({
  search = '',
  location = 'all',
  employmentType = 'all',
  category = 'all',
  workArrangements = [],
  minSalary = null,
  maxSalary = null,
  datePosted = 'all',
  onRemoveFilter,
  onClearAll,
}) => {
  const chips = [];

  // 1. Search Query Chip
  if (search && search.trim()) {
    chips.push({
      id: 'search',
      label: `"${search.trim()}"`,
      onRemove: () => onRemoveFilter('search'),
      ariaLabel: `Remove search query "${search}"`,
    });
  }

  // 2. Category Chip
  if (category && category !== 'all') {
    chips.push({
      id: 'category',
      label: `Field: ${category}`,
      onRemove: () => onRemoveFilter('category'),
      ariaLabel: `Remove category filter "${category}"`,
    });
  }

  // 3. Location Chip
  if (location && location !== 'all') {
    chips.push({
      id: 'location',
      label: location.charAt(0).toUpperCase() + location.slice(1),
      onRemove: () => onRemoveFilter('location'),
      ariaLabel: `Remove location filter "${location}"`,
    });
  }

  // 4. Employment Type Chip
  if (employmentType && employmentType !== 'all') {
    chips.push({
      id: 'employmentType',
      label: employmentType.charAt(0).toUpperCase() + employmentType.slice(1),
      onRemove: () => onRemoveFilter('employmentType'),
      ariaLabel: `Remove employment type filter "${employmentType}"`,
    });
  }

  // 4. Work Arrangement Chips (Remote, Hybrid, On-site)
  workArrangements.forEach((arr) => {
    chips.push({
      id: `workArrangement-${arr}`,
      label: arr.charAt(0).toUpperCase() + arr.slice(1),
      onRemove: () => onRemoveFilter('workArrangement', arr),
      ariaLabel: `Remove ${arr} work arrangement filter`,
    });
  });

  // 5. Combined Salary Range Chip
  if (minSalary !== null || maxSalary !== null) {
    let salaryLabel = '';
    const formatSal = (s) => (s >= 100000 ? `₹${(s / 100000).toFixed(0)}L` : `$${(s / 1000).toFixed(0)}k`);

    if (minSalary !== null && maxSalary !== null) {
      salaryLabel = `${formatSal(minSalary)} - ${formatSal(maxSalary)}`;
    } else if (minSalary !== null) {
      salaryLabel = `${formatSal(minSalary)}+`;
    } else {
      salaryLabel = `Up to ${formatSal(maxSalary)}`;
    }

    chips.push({
      id: 'salary',
      label: salaryLabel,
      onRemove: () => onRemoveFilter('salary'),
      ariaLabel: `Remove salary filter "${salaryLabel}"`,
    });
  }

  // 6. Date Posted Chip
  if (datePosted && datePosted !== 'all') {
    const dateLabel = DATE_LABELS[datePosted] || datePosted;
    chips.push({
      id: 'datePosted',
      label: dateLabel,
      onRemove: () => onRemoveFilter('datePosted'),
      ariaLabel: `Remove date posted filter "${dateLabel}"`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100"
      role="region"
      aria-label="Active Filters"
    >
      <span className="text-xs font-semibold text-linkedin-text-secondary">
        Active Filters:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 text-xs font-semibold bg-linkedin-blue/10 text-linkedin-blue border border-linkedin-blue/25 px-2.5 py-1 rounded-full animate-in fade-in zoom-in-95 duration-150 shadow-2xs"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="p-0.5 hover:bg-linkedin-blue/20 rounded-full text-linkedin-blue transition-colors focus:outline-none focus:ring-1 focus:ring-linkedin-blue"
            aria-label={chip.ariaLabel}
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:underline px-2 py-1 ml-auto sm:ml-2 focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
      >
        <RotateCcw className="w-3 h-3" aria-hidden="true" />
        <span>Clear filters</span>
      </button>
    </div>
  );
};

export default ActiveFilterChips;
