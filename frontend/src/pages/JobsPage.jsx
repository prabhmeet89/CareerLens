import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Target,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  X,
  Calendar,
  Layers,
  Tag,
} from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonJobCard } from '../components/common/LoadingSkeletons';
import { normalizeErrorMessage } from '../utils/errorHelpers';
import { useToast } from '../context/ToastContext';
import JobCard from '../components/jobs/JobCard';
import MobileFilterSheet from '../components/jobs/MobileFilterSheet';
import ActiveFilterChips from '../components/jobs/ActiveFilterChips';
import SearchAutocomplete from '../components/jobs/SearchAutocomplete';
import LocationCombobox from '../components/jobs/LocationCombobox';

const JobsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // Read URL parameters
  const activeTab = searchParams.get('tab') || 'recommended';
  const currentPage = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const searchUrl = searchParams.get('search') || '';
  const locationUrl = searchParams.get('location') || 'all';
  const employmentUrl = searchParams.get('employmentType') || 'all';
  const categoryUrl = searchParams.get('category') || 'all';
  const workArrangementParam = searchParams.get('workArrangement') || '';
  const workArrangementUrl = React.useMemo(
    () => (workArrangementParam ? workArrangementParam.split(',').filter(Boolean) : []),
    [workArrangementParam]
  );
  const minSalaryUrl = searchParams.get('minSalary') ? Number(searchParams.get('minSalary')) : null;
  const maxSalaryUrl = searchParams.get('maxSalary') ? Number(searchParams.get('maxSalary')) : null;
  const datePostedUrl = searchParams.get('datePosted') || 'all';

  // Search input local state
  const [searchInput, setSearchInput] = useState(searchUrl);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Results state
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [hasProfile, setHasProfile] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Sync search input when user uses browser back/forward buttons
  useEffect(() => {
    setSearchInput(searchUrl);
  }, [searchUrl]);

  // Handle debounced search keystrokes (350ms)
  const handleSearchChange = (val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = val.trim();
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        if (trimmed) {
          p.set('search', trimmed);
        } else {
          p.delete('search');
        }
        p.set('page', '1');
        return p;
      });
    }, 350);
  };

  // Immediate submit on Enter or Search button
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = searchInput.trim();
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (trimmed) {
        p.set('search', trimmed);
      } else {
        p.delete('search');
      }
      p.set('page', '1');
      return p;
    });
  };

  // Called by autocomplete when a suggestion is selected (receives the string value)
  const handleAutocompleteSelect = (val) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = (val || '').trim();
    setSearchInput(trimmed);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (trimmed) {
        p.set('search', trimmed);
      } else {
        p.delete('search');
      }
      p.set('tab', 'all'); // autocomplete is only shown on the All tab
      p.set('page', '1');
      return p;
    });
  };

  // Clear search immediately
  const handleClearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchInput('');
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('search');
      p.set('page', '1');
      return p;
    });
  };

  // Generic filter update helper
  const updateFilters = (updates = {}) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === 'all' || val === '' || (Array.isArray(val) && val.length === 0)) {
          p.delete(key);
        } else if (Array.isArray(val)) {
          p.set(key, val.join(','));
        } else {
          p.set(key, String(val));
        }
      });
      p.set('page', '1');
      return p;
    });
  };

  // Remove single active filter chip
  const handleRemoveFilter = (filterType, itemValue) => {
    if (filterType === 'search') {
      handleClearSearch();
    } else if (filterType === 'category') {
      updateFilters({ category: 'all' });
    } else if (filterType === 'location') {
      updateFilters({ location: 'all' });
    } else if (filterType === 'employmentType') {
      updateFilters({ employmentType: 'all' });
    } else if (filterType === 'workArrangement') {
      const updated = workArrangementUrl.filter((a) => a !== itemValue);
      updateFilters({ workArrangement: updated });
    } else if (filterType === 'salary') {
      updateFilters({ minSalary: null, maxSalary: null });
    } else if (filterType === 'datePosted') {
      updateFilters({ datePosted: 'all' });
    }
  };

  // Clear all active filters
  const handleClearAllFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchInput('');
    setSearchParams({ tab: activeTab, page: '1' });
  };

  const hasActiveFilters =
    Boolean(searchUrl.trim()) ||
    locationUrl !== 'all' ||
    employmentUrl !== 'all' ||
    categoryUrl !== 'all' ||
    workArrangementUrl.length > 0 ||
    minSalaryUrl !== null ||
    maxSalaryUrl !== null ||
    datePostedUrl !== 'all';

  // Fetch jobs driven entirely by URL parameters
  const fetchJobs = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      let endpoint;
      if (activeTab === 'recommended') {
        endpoint = `/jobs/recommended?page=${currentPage}&limit=8`;
      } else {
        const params = new URLSearchParams({ page: String(currentPage), limit: '8' });
        if (searchUrl.trim()) params.set('search', searchUrl.trim());
        if (locationUrl && locationUrl !== 'all') params.set('location', locationUrl);
        if (employmentUrl && employmentUrl !== 'all') params.set('employmentType', employmentUrl);
        if (categoryUrl && categoryUrl !== 'all') params.set('category', categoryUrl);
        if (workArrangementParam) params.set('workArrangement', workArrangementParam);
        if (minSalaryUrl !== null) params.set('minSalary', String(minSalaryUrl));
        if (maxSalaryUrl !== null) params.set('maxSalary', String(maxSalaryUrl));
        if (datePostedUrl && datePostedUrl !== 'all') params.set('datePosted', datePostedUrl);
        endpoint = `/jobs?${params.toString()}`;
      }

      const res = await api.get(endpoint, { signal: controller.signal });

      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setJobs(data.jobs || []);
        setHasProfile(data.hasProfile !== false);
        setTotalPages(data.totalPages || 1);
        setTotalJobs(data.total || 0);
      } else {
        setJobs([]);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return; // Request was aborted for newer search
      }
      console.error('[JobsPage] Error fetching jobs:', err);
      setError(normalizeErrorMessage(err, 'Failed to load job listings.'));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [
    activeTab,
    currentPage,
    searchUrl,
    locationUrl,
    employmentUrl,
    categoryUrl,
    workArrangementParam,
    minSalaryUrl,
    maxSalaryUrl,
    datePostedUrl,
  ]);

  useEffect(() => {
    fetchJobs();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchJobs]);

  // Toggle save job with toast notifications and optimistic rollback
  const handleToggleSave = useCallback(async (e, job) => {
    const jobId = job.id || job._id?.toString();
    const isCurrentlySaved = savedJobIds.has(jobId) || job.isSaved;
    const prev = new Set(savedJobIds);
    const next = new Set(savedJobIds);
    if (isCurrentlySaved) next.delete(jobId); else next.add(jobId);
    setSavedJobIds(next);

    try {
      const { data } = await api.post(`/jobs/${jobId}/save`);
      if (data.success) {
        if (data.saved) {
          toast.success(`Saved "${job.title}" to your jobs!`);
        } else {
          toast.info(`Removed "${job.title}" from saved jobs.`);
        }
      } else {
        setSavedJobIds(prev);
        toast.error(data.message || 'Could not update saved job status.');
      }
    } catch {
      setSavedJobIds(prev);
      toast.error('Network error while updating saved job.');
    }
  }, [savedJobIds, toast]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab, page: '1' });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('page', String(newPage));
        return p;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Result count formatting
  const renderResultsSummary = () => {
    if (loading) return null;
    if (totalJobs === 0) return 'No jobs found';
    if (totalJobs === 1) return '1 job opportunity found';
    return `${totalJobs} job opportunities found`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-linkedin-blue text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Personalized Career Matching</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-linkedin-text-primary tracking-tight">
              Opportunities Hub
            </h1>
            <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-1 max-w-xl">
              Explore curated roles, internships, and entry-level positions across every field, benchmarked against your skills.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/upload')}
              icon={UploadCloud}
              className="text-xs font-semibold min-h-[44px]"
            >
              Update Resume
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-linkedin-border pb-px" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recommended'}
            onClick={() => handleTabChange('recommended')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 min-h-[44px] ${
              activeTab === 'recommended'
                ? 'border-linkedin-blue text-linkedin-blue'
                : 'border-transparent text-linkedin-text-secondary hover:text-linkedin-text-primary'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Recommended for You</span>
            {activeTab === 'recommended' && !loading && totalJobs > 0 && (
              <span className="text-xs bg-linkedin-blue-light text-linkedin-blue font-bold px-2 py-0.5 rounded-full">
                {totalJobs}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => handleTabChange('all')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 min-h-[44px] ${
              activeTab === 'all'
                ? 'border-linkedin-blue text-linkedin-blue'
                : 'border-transparent text-linkedin-text-secondary hover:text-linkedin-text-primary'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Browse All Jobs</span>
            {activeTab === 'all' && !loading && totalJobs > 0 && (
              <span className="text-xs bg-gray-100 dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 font-bold px-2 py-0.5 rounded-full">
                {totalJobs}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar — Active on Browse All tab */}
      {activeTab === 'all' && (
        <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-4 sm:p-5 shadow-sm space-y-4">
          {/* Search Input Bar with Autocomplete */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-linkedin-text-secondary pointer-events-none z-10" />
              <SearchAutocomplete
                id="jobs-search-input"
                value={searchInput}
                onChange={handleSearchChange}
                onSubmit={handleAutocompleteSelect}
                placeholder="Search by title, company, or skills (e.g. Marketing, React, Finance)…"
                inputClassName="w-full pl-10 pr-9 py-2.5 text-sm bg-[#EDF3F8] dark:bg-[#1A1A1A] border border-transparent dark:border-[#2A2A2A] rounded-xl text-linkedin-text-primary placeholder:text-linkedin-text-secondary focus:bg-white dark:focus:bg-[#141414] focus:border-linkedin-blue focus:outline-none transition-all min-h-[44px]"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-full z-10"
                  aria-label="Clear search keyword"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Filter Button (< sm) */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="sm:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-[#EDF3F8] dark:bg-[#1A1A1A] text-linkedin-text-primary hover:bg-blue-50 dark:hover:bg-[#1A2B3C] hover:text-linkedin-blue border border-transparent hover:border-blue-200 dark:hover:border-[#4C9EEB]/30 rounded-xl text-xs font-bold transition-colors shrink-0"
              aria-label="Open job filters"
            >
              <Filter className="w-4 h-4 text-linkedin-blue" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-linkedin-blue" />
              )}
            </button>
          </form>

          {/* Desktop Filter Row 1: Career Track / Field Selector (sm:) */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5 bg-gray-50/80 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] p-1.5 rounded-xl text-xs">
            <span className="text-[11px] font-bold text-linkedin-text-secondary px-2 flex items-center gap-1 shrink-0">
              <Tag className="w-3.5 h-3.5 text-linkedin-blue" /> Field:
            </span>
            {[
              { val: 'all', label: 'All Fields' },
              { val: 'Technology', label: 'Tech' },
              { val: 'Marketing', label: 'Marketing' },
              { val: 'Sales & Business', label: 'Sales & Business' },
              { val: 'Finance', label: 'Finance' },
              { val: 'HR', label: 'HR' },
              { val: 'Design', label: 'Design' },
              { val: 'Operations', label: 'Operations' },
              { val: 'Data & Analytics', label: 'Data & Analytics' },
            ].map((cat) => {
              const isSelected = categoryUrl === cat.val;
              return (
                <button
                  key={cat.val}
                  type="button"
                  onClick={() => updateFilters({ category: cat.val })}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all min-h-[34px] text-[11px] shrink-0 ${
                    isSelected
                      ? 'bg-linkedin-blue text-white shadow-2xs font-bold'
                      : 'bg-white dark:bg-[#141414] text-linkedin-text-secondary hover:text-linkedin-blue border border-gray-200/80 dark:border-[#2A2A2A] hover:border-linkedin-blue/30 dark:hover:bg-[#1A1A1A]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Desktop Filter Row 2: Location, Mode, Type, Date (sm:) */}
          <div className="hidden sm:flex flex-wrap gap-2 items-center text-xs">
            {/* Searchable Location Filter Combobox */}
            <LocationCombobox
              value={locationUrl}
              onChange={(loc) => updateFilters({ location: loc })}
            />

            {/* Work Arrangement Pills */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] p-1 rounded-xl">
              <span className="text-[11px] font-bold text-linkedin-text-secondary px-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-linkedin-blue" /> Mode:
              </span>
              {[
                { val: 'remote', label: 'Remote' },
                { val: 'hybrid', label: 'Hybrid' },
                { val: 'on-site', label: 'On-site' },
              ].map((arr) => {
                const isSelected = workArrangementUrl.includes(arr.val);
                return (
                  <button
                    key={arr.val}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? workArrangementUrl.filter((a) => a !== arr.val)
                        : [...workArrangementUrl, arr.val];
                      updateFilters({ workArrangement: next });
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all min-h-[36px] ${
                      isSelected
                        ? 'bg-linkedin-blue text-white shadow-2xs font-bold'
                        : 'bg-white dark:bg-[#141414] text-linkedin-text-secondary hover:text-linkedin-blue border border-gray-200/80 dark:border-[#2A2A2A] dark:hover:bg-[#1A1A1A]'
                    }`}
                  >
                    {arr.label}
                  </button>
                );
              })}
            </div>

            {/* Employment Type Selector */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] p-1 rounded-xl">
              <span className="text-[11px] font-bold text-linkedin-text-secondary px-2 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-linkedin-blue" /> Type:
              </span>
              {[
                { val: 'all', label: 'All' },
                { val: 'internship', label: 'Intern' },
                { val: 'full-time', label: 'Full-time' },
                { val: 'contract', label: 'Contract' },
              ].map((emp) => (
                <button
                  key={emp.val}
                  type="button"
                  onClick={() => updateFilters({ employmentType: emp.val })}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all min-h-[36px] ${
                    employmentUrl === emp.val
                      ? 'bg-linkedin-blue text-white shadow-2xs font-bold'
                      : 'bg-white dark:bg-[#141414] text-linkedin-text-secondary hover:text-linkedin-blue border border-gray-200/80 dark:border-[#2A2A2A] dark:hover:bg-[#1A1A1A]'
                  }`}
                >
                  {emp.label}
                </button>
              ))}
            </div>

            {/* Date Posted Quick Selector */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] p-1 rounded-xl">
              <span className="text-[11px] font-bold text-linkedin-text-secondary px-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-linkedin-blue" /> Posted:
              </span>
              {[
                { val: 'all', label: 'Any' },
                { val: '24h', label: '24h' },
                { val: '7d', label: 'Week' },
                { val: '30d', label: 'Month' },
              ].map((dp) => (
                <button
                  key={dp.val}
                  type="button"
                  onClick={() => updateFilters({ datePosted: dp.val })}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all min-h-[36px] ${
                    datePostedUrl === dp.val
                      ? 'bg-linkedin-blue text-white shadow-2xs font-bold'
                      : 'bg-white dark:bg-[#141414] text-linkedin-text-secondary hover:text-linkedin-blue border border-gray-200/80 dark:border-[#2A2A2A] dark:hover:bg-[#1A1A1A]'
                  }`}
                >
                  {dp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Chips & Clear All */}
          <ActiveFilterChips
            search={searchUrl}
            location={locationUrl}
            employmentType={employmentUrl}
            category={categoryUrl}
            workArrangements={workArrangementUrl}
            minSalary={minSalaryUrl}
            maxSalary={maxSalaryUrl}
            datePosted={datePostedUrl}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />

          {/* Mobile Filter Sheet Component */}
          <MobileFilterSheet
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            currentLocation={locationUrl}
            currentEmployment={employmentUrl}
            currentCategory={categoryUrl}
            currentWorkArrangements={workArrangementUrl}
            currentMinSalary={minSalaryUrl}
            currentMaxSalary={maxSalaryUrl}
            currentDatePosted={datePostedUrl}
            onApplyFilters={(filters) => updateFilters(filters)}
            onClearFilters={handleClearAllFilters}
          />
        </div>
      )}

      {/* Results Header with Live Count */}
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-linkedin-text-primary">
            {activeTab === 'recommended' ? 'Top AI Recommendations' : 'Opportunities Feed'}
          </h2>
          <p
            className="text-xs text-linkedin-text-secondary flex items-center gap-1.5"
            aria-live="polite"
          >
            <span>{renderResultsSummary()}</span>
            {isRefreshing && (
              <span className="text-linkedin-blue font-semibold animate-pulse">(Refreshing...)</span>
            )}
          </p>
        </div>

        {totalJobs > 8 && (
          <span className="text-xs text-linkedin-text-muted">
            Showing {(currentPage - 1) * 8 + 1}–{Math.min(currentPage * 8, totalJobs)} of {totalJobs}
          </span>
        )}
      </div>

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Unable to load job listings"
          message={error}
          onRetry={fetchJobs}
          actionText="Explore Saved Jobs"
          actionTo="/saved"
        />
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <SkeletonJobCard count={4} />
      ) : activeTab === 'recommended' && !hasProfile ? (
        /* Empty State: No Candidate Profile Uploaded */
        <EmptyState
          icon={UploadCloud}
          title="Unlock Personalized Job Recommendations"
          description="Upload your PDF resume so our matching algorithm can benchmark your verified skills against live listings and rank your best matches."
          actionText="Upload Resume (PDF)"
          actionTo="/upload"
          actionIcon={UploadCloud}
          secondaryActionText="Browse All Jobs"
          secondaryActionTo="/jobs?tab=all"
        />
      ) : jobs.length === 0 ? (
        /* Empty State: No jobs matching filters */
        <EmptyState
          icon={Briefcase}
          title={hasActiveFilters ? 'No jobs match your active filters' : 'No Job Opportunities Available'}
          description={
            hasActiveFilters
              ? 'Try widening your salary range, selecting "All Fields", or including Remote/Hybrid arrangements to discover more openings.'
              : 'New student opportunities and career roles are regularly added. Check back soon.'
          }
          actionText={hasActiveFilters ? 'Clear filters' : 'View Saved Jobs'}
          onAction={hasActiveFilters ? handleClearAllFilters : undefined}
          actionTo={!hasActiveFilters ? '/saved' : undefined}
          secondaryActionText={hasActiveFilters ? 'Browse All Roles' : undefined}
          secondaryActionTo={hasActiveFilters ? '/jobs?tab=all' : undefined}
        />
      ) : (
        /* Job Listings Feed */
        <div className={`space-y-4 transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
          {jobs.map((job) => {
            const jobId = job.id || job._id?.toString();
            const decoratedJob = {
              ...job,
              id: jobId,
              isSaved: savedJobIds.has(jobId) || job.isSaved,
            };

            return (
              <JobCard
                key={jobId}
                job={decoratedJob}
                variant="standard"
                onToggleSave={handleToggleSave}
              />
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <nav
          className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[12px] p-4 flex items-center justify-between shadow-sm text-xs"
          aria-label="Jobs Pagination"
        >
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="flex items-center gap-1 font-semibold text-linkedin-blue disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed hover:underline min-h-[44px] px-3 py-2 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-linkedin-text-secondary font-medium">
            Page <strong className="text-linkedin-text-primary">{currentPage}</strong> of{' '}
            <strong className="text-linkedin-text-primary">{totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="flex items-center gap-1 font-semibold text-linkedin-blue disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed hover:underline min-h-[44px] px-3 py-2 rounded-lg"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default JobsPage;
