import React, { useState, useEffect } from 'react';
import { X, Filter, MapPin, Briefcase, IndianRupee, Calendar, CheckSquare, Square } from 'lucide-react';
import Button from '../common/Button';

const WORK_ARRANGEMENT_OPTIONS = [
  { val: 'remote', label: 'Remote' },
  { val: 'hybrid', label: 'Hybrid' },
  { val: 'on-site', label: 'On-site' },
];

const EMPLOYMENT_OPTIONS = [
  { val: 'all', label: 'All Types' },
  { val: 'internship', label: 'Internship' },
  { val: 'full-time', label: 'Full-time' },
  { val: 'part-time', label: 'Part-time' },
  { val: 'contract', label: 'Contract' },
];

const SALARY_PRESETS = [
  { label: 'Any Salary', min: null, max: null },
  { label: '₹3L - ₹6L', min: 300000, max: 600000 },
  { label: '₹6L - ₹12L', min: 600000, max: 1200000 },
  { label: '₹12L - ₹20L', min: 1200000, max: 2000000 },
  { label: '₹20L+', min: 2000000, max: null },
];

const DATE_POSTED_OPTIONS = [
  { val: 'all', label: 'Any time' },
  { val: '1d', label: 'Past 24 hours' },
  { val: '3d', label: 'Past 3 days' },
  { val: '7d', label: 'Past week' },
  { val: '14d', label: 'Past 2 weeks' },
  { val: '30d', label: 'Past month' },
];

const MobileFilterSheet = ({
  isOpen = false,
  onClose,
  currentLocation = 'all',
  currentEmployment = 'all',
  currentWorkArrangements = [],
  currentMinSalary = null,
  currentMaxSalary = null,
  currentDatePosted = 'all',
  onApplyFilters,
  onClearFilters,
}) => {
  const [selectedLoc, setSelectedLoc] = useState(currentLocation);
  const [selectedEmp, setSelectedEmp] = useState(currentEmployment);
  const [selectedArrangements, setSelectedArrangements] = useState(currentWorkArrangements);
  const [selectedMinSalary, setSelectedMinSalary] = useState(currentMinSalary);
  const [selectedMaxSalary, setSelectedMaxSalary] = useState(currentMaxSalary);
  const [selectedDatePosted, setSelectedDatePosted] = useState(currentDatePosted);

  useEffect(() => {
    setSelectedLoc(currentLocation);
    setSelectedEmp(currentEmployment);
    setSelectedArrangements(currentWorkArrangements);
    setSelectedMinSalary(currentMinSalary);
    setSelectedMaxSalary(currentMaxSalary);
    setSelectedDatePosted(currentDatePosted);
  }, [
    currentLocation,
    currentEmployment,
    currentWorkArrangements,
    currentMinSalary,
    currentMaxSalary,
    currentDatePosted,
    isOpen,
  ]);

  if (!isOpen) return null;

  const toggleArrangement = (val) => {
    if (selectedArrangements.includes(val)) {
      setSelectedArrangements(selectedArrangements.filter((a) => a !== val));
    } else {
      setSelectedArrangements([...selectedArrangements, val]);
    }
  };

  const handlePresetSalary = (min, max) => {
    setSelectedMinSalary(min);
    setSelectedMaxSalary(max);
  };

  const activeCount =
    (selectedLoc !== 'all' ? 1 : 0) +
    (selectedEmp !== 'all' ? 1 : 0) +
    selectedArrangements.length +
    (selectedMinSalary !== null || selectedMaxSalary !== null ? 1 : 0) +
    (selectedDatePosted !== 'all' ? 1 : 0);

  const handleApply = () => {
    onApplyFilters({
      location: selectedLoc,
      employmentType: selectedEmp,
      workArrangement: selectedArrangements,
      minSalary: selectedMinSalary,
      maxSalary: selectedMaxSalary,
      datePosted: selectedDatePosted,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedLoc('all');
    setSelectedEmp('all');
    setSelectedArrangements([]);
    setSelectedMinSalary(null);
    setSelectedMaxSalary(null);
    setSelectedDatePosted('all');
    onClearFilters();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filter-title"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl border border-linkedin-border overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-linkedin-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-linkedin-text-primary">
            <Filter className="w-4 h-4 text-linkedin-blue" aria-hidden="true" />
            <h2 id="mobile-filter-title" className="text-base font-bold">
              Filter Opportunities
            </h2>
            {activeCount > 0 && (
              <span className="text-[11px] font-bold text-white bg-linkedin-blue px-2 py-0.5 rounded-full">
                {activeCount} active
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-linkedin-blue min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Filter Form */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. Work Arrangement (Multi-Select) */}
          <div className="space-y-2.5">
            <label className="font-bold text-linkedin-text-primary uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-linkedin-blue" aria-hidden="true" />
              <span>Work Arrangement</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {WORK_ARRANGEMENT_OPTIONS.map((arr) => {
                const isSelected = selectedArrangements.includes(arr.val);
                return (
                  <button
                    key={arr.val}
                    type="button"
                    onClick={() => toggleArrangement(arr.val)}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50 text-linkedin-blue border-linkedin-blue shadow-2xs font-bold'
                        : 'bg-white text-linkedin-text-secondary border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-linkedin-blue shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <span>{arr.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Employment Type */}
          <div className="space-y-2.5">
            <label className="font-bold text-linkedin-text-primary uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Briefcase className="w-3.5 h-3.5 text-linkedin-blue" aria-hidden="true" />
              <span>Employment Type</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EMPLOYMENT_OPTIONS.map((emp) => {
                const isSelected = selectedEmp === emp.val;
                return (
                  <button
                    key={emp.val}
                    type="button"
                    onClick={() => setSelectedEmp(emp.val)}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all min-h-[44px] flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-linkedin-blue border-linkedin-blue shadow-2xs'
                        : 'bg-white text-linkedin-text-secondary border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{emp.label}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-linkedin-blue" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Expected Salary Range */}
          <div className="space-y-2.5">
            <label className="font-bold text-linkedin-text-primary uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <IndianRupee className="w-3.5 h-3.5 text-linkedin-blue" aria-hidden="true" />
              <span>Salary Range (Annual)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SALARY_PRESETS.map((preset, idx) => {
                const isSelected =
                  selectedMinSalary === preset.min && selectedMaxSalary === preset.max;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSalary(preset.min, preset.max)}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all min-h-[44px] flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-linkedin-blue border-linkedin-blue shadow-2xs'
                        : 'bg-white text-linkedin-text-secondary border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-linkedin-blue" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Date Posted */}
          <div className="space-y-2.5">
            <label className="font-bold text-linkedin-text-primary uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-linkedin-blue" aria-hidden="true" />
              <span>Date Posted</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DATE_POSTED_OPTIONS.map((dp) => {
                const isSelected = selectedDatePosted === dp.val;
                return (
                  <button
                    key={dp.val}
                    type="button"
                    onClick={() => setSelectedDatePosted(dp.val)}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all min-h-[44px] flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-linkedin-blue border-linkedin-blue shadow-2xs'
                        : 'bg-white text-linkedin-text-secondary border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{dp.label}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-linkedin-blue" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-linkedin-border bg-[#F8FAFC] flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 underline px-3 py-2 min-h-[44px]"
          >
            Clear All
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            className="text-xs font-bold px-6 shadow-sm min-h-[44px]"
          >
            Apply Filters {activeCount > 0 ? `(${activeCount})` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterSheet;
