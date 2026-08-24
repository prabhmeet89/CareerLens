import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  Search,
  Building2,
  Filter,
  Check,
  XCircle,
  Bookmark,
  X,
} from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { useToast } from '../context/ToastContext';

const JobsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const activeTab = searchParams.get('tab') || 'recommended';
  const currentPage = parseInt(searchParams.get('page'), 10) || 1;

  // Search & filter state (synced to URL)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || 'all');
  const [employmentFilter, setEmploymentFilter] = useState(searchParams.get('employmentType') || 'all');
  const debounceRef = useRef(null);

  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [hasProfile, setHasProfile] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search input 300ms
  const handleSearchInput = (val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        if (val) p.set('search', val); else p.delete('search');
        p.set('page', '1');
        return p;
      });
    }, 300);
  };

  const setFilter = (key, val) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (val && val !== 'all') p.set(key, val); else p.delete(key);
      p.set('page', '1');
      return p;
    });
    if (key === 'location') setLocationFilter(val);
    if (key === 'employmentType') setEmploymentFilter(val);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearch('');
    setLocationFilter('all');
    setEmploymentFilter('all');
    setSearchParams({ tab: activeTab, page: '1' });
  };

  const hasActiveFilters = search || locationFilter !== 'all' || employmentFilter !== 'all';

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint;
      if (activeTab === 'recommended') {
        endpoint = `/jobs/recommended?page=${currentPage}&limit=8`;
      } else {
        const params = new URLSearchParams({ page: currentPage, limit: 8 });
        if (search) params.set('search', search);
        if (locationFilter && locationFilter !== 'all') params.set('location', locationFilter);
        if (employmentFilter && employmentFilter !== 'all') params.set('employmentType', employmentFilter);
        endpoint = `/jobs?${params.toString()}`;
      }

      const res = await api.get(endpoint);

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
      console.error('[JobsPage] Error fetching jobs:', err);
      setError(err.customMessage || 'Failed to load job listings.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, search, locationFilter, employmentFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Toggle save job
  const handleToggleSave = useCallback(async (jobId, currentlySaved, jobTitle) => {
    const prev = new Set(savedJobIds);
    const next = new Set(savedJobIds);
    if (currentlySaved) next.delete(jobId); else next.add(jobId);
    setSavedJobIds(next); // Optimistic
    try {
      const { data } = await api.post(`/jobs/${jobId}/save`);
      if (!data.success) setSavedJobIds(prev);
    } catch {
      setSavedJobIds(prev);
    }
  }, [savedJobIds]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab, page: 1 });
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

  const getScoreBadge = (score) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        dot: 'bg-emerald-500',
        label: 'High Match',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-300',
        dot: 'bg-amber-500',
        label: 'Good Match',
      };
    }
    return {
      bg: 'bg-gray-100 text-gray-600 border-gray-300',
      dot: 'bg-gray-400',
      label: 'Low Match',
    };
  };

  const formatEmploymentType = (type) => {
    if (!type) return 'Full-time';
    return type
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('-');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-linkedin-border rounded-[12px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-linkedin-blue text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Personalized Matching</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-linkedin-text-primary">
              Student Opportunities Hub
            </h1>
            <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-1 max-w-xl">
              Explore curated tech internships and entry-level positions ranked against your verified skills.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/upload')}
              icon={UploadCloud}
              className="text-xs font-semibold"
            >
              Update Resume
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-linkedin-border pb-px">
          <button
            type="button"
            onClick={() => handleTabChange('recommended')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'recommended'
                ? 'border-linkedin-blue text-linkedin-blue'
                : 'border-transparent text-linkedin-text-secondary hover:text-linkedin-text-primary'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Recommended for You</span>
            {activeTab === 'recommended' && !loading && totalJobs > 0 && (
              <span className="text-xs bg-linkedin-blue-light text-linkedin-blue font-bold px-2 py-0.5 rounded-full">
                {totalJobs}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-linkedin-blue text-linkedin-blue'
                : 'border-transparent text-linkedin-text-secondary hover:text-linkedin-text-primary'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Browse All Tech Jobs</span>
            {activeTab === 'all' && !loading && totalJobs > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                {totalJobs}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Filter Panel — only shown on Browse All tab */}
      {activeTab === 'all' && (
        <div className="bg-white border border-linkedin-border rounded-[12px] p-4 shadow-sm space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-linkedin-text-secondary" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search by title, company, or skill…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#EDF3F8] border border-transparent rounded-lg text-linkedin-text-primary placeholder:text-linkedin-text-secondary focus:bg-white focus:border-linkedin-blue focus:outline-none transition-all"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter chips row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-linkedin-text-secondary flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>

            {/* Location filter */}
            {['all', 'remote', 'on-site', 'hybrid'].map((loc) => (
              <button
                key={loc}
                onClick={() => setFilter('location', loc)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  locationFilter === loc
                    ? 'bg-linkedin-blue text-white border-linkedin-blue'
                    : 'bg-white text-linkedin-text-secondary border-gray-200 hover:border-linkedin-blue hover:text-linkedin-blue'
                }`}
              >
                {loc === 'all' ? 'All Locations' : loc.charAt(0).toUpperCase() + loc.slice(1)}
              </button>
            ))}

            <div className="w-px h-4 bg-gray-200 mx-0.5" />

            {/* Employment type filter */}
            {[
              { val: 'all', label: 'All Types' },
              { val: 'internship', label: 'Internship' },
              { val: 'full-time', label: 'Full-time' },
              { val: 'part-time', label: 'Part-time' },
              { val: 'contract', label: 'Contract' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setFilter('employmentType', val)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  employmentFilter === val
                    ? 'bg-linkedin-blue text-white border-linkedin-blue'
                    : 'bg-white text-linkedin-text-secondary border-gray-200 hover:border-linkedin-blue hover:text-linkedin-blue'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Active filter chips + Clear all */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-gray-100">
              <span className="text-xs text-linkedin-text-secondary">Active:</span>
              {search && (
                <span className="inline-flex items-center gap-1 text-xs bg-linkedin-blue/10 text-linkedin-blue border border-linkedin-blue/20 px-2 py-1 rounded-full">
                  "{search}"
                  <button onClick={() => handleSearchInput('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {locationFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 text-xs bg-linkedin-blue/10 text-linkedin-blue border border-linkedin-blue/20 px-2 py-1 rounded-full">
                  {locationFilter}
                  <button onClick={() => setFilter('location', 'all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {employmentFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 text-xs bg-linkedin-blue/10 text-linkedin-blue border border-linkedin-blue/20 px-2 py-1 rounded-full">
                  {employmentFilter}
                  <button onClick={() => setFilter('employmentType', 'all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-500 hover:underline font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white border border-linkedin-border rounded-[12px] p-5 shadow-sm animate-pulse space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-7 bg-gray-200 rounded-full w-20" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-2/3" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 bg-gray-100 rounded-full w-16" />
                <div className="h-6 bg-gray-100 rounded-full w-16" />
                <div className="h-6 bg-gray-100 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'recommended' && !hasProfile ? (
        /* Empty State: No Candidate Profile Uploaded */
        <div className="bg-white border border-linkedin-border rounded-[12px] p-8 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center mx-auto shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-linkedin-text-primary">
              Unlock Personalized Job Recommendations
            </h2>
            <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-1.5 leading-relaxed">
              Upload your PDF resume so our matching algorithm can benchmark your verified skills against live tech listings and rank your best matches.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/upload')}
              icon={UploadCloud}
              className="font-bold shadow"
            >
              Upload Resume (PDF)
            </Button>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State: No jobs found */
        <div className="bg-white border border-linkedin-border rounded-[12px] p-8 text-center shadow-sm space-y-3">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-linkedin-text-primary">
            {hasActiveFilters ? 'No jobs match your filters' : 'No Jobs Found'}
          </h3>
          <p className="text-xs text-linkedin-text-secondary">
            {hasActiveFilters
              ? 'Try adjusting your search terms or removing some filters to see more results.'
              : 'Check back soon as new tech internships and roles are posted regularly.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-linkedin-blue font-semibold hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        /* Job Listings Feed */
        <div className="space-y-4">
          {jobs.map((job) => {
            const jobId = job.id || job._id?.toString();
            const hasMatch = job.match && typeof job.match.score === 'number';
            const badge = hasMatch ? getScoreBadge(job.match.score) : null;
            const matchedSkills = job.match?.matchedSkills || [];
            const missingSkills = job.match?.missingSkills || [];
            const isSaved = savedJobIds.has(jobId) || job.isSaved;

            return (
              <div
                key={job.id || job._id}
                onClick={() => navigate(`/jobs/${job.id || job._id}`)}
                className="bg-white border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-linkedin-blue/50 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
              >
                {/* Header: Title, Company, Match Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-linkedin-text-primary group-hover:text-linkedin-blue transition-colors truncate">
                      {job.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-linkedin-text-secondary font-medium">
                      <span className="font-semibold text-linkedin-text-primary flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-linkedin-blue" />
                        {job.company}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {job.location}
                      </span>
                    </div>
                  </div>

                  {/* Match Percentage Badge */}
                  {badge && (
                    <div
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      <span>{job.match.score}% Match</span>
                    </div>
                  )}
                </div>

                {/* Metadata Pills: Type, Experience, Salary */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-linkedin-text-secondary">
                  <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">
                    {formatEmploymentType(job.employmentType)}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">
                    Exp: {job.experienceRequired || '0-1 years'}
                  </span>
                  {job.salary && (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                      {job.salary}
                    </span>
                  )}
                </div>

                {/* Brief description snippet */}
                <p className="text-xs text-linkedin-text-secondary line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Skills tags preview (Matched vs Missing) */}
                <div className="pt-3 border-t border-linkedin-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                    {/* Matched skills with checkmark */}
                    {matchedSkills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        {skill}
                      </span>
                    ))}

                    {/* Missing skills with dashed border */}
                    {missingSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-dashed border-gray-300 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}

                    {matchedSkills.length + missingSkills.length > 7 && (
                      <span className="text-[10px] text-linkedin-text-muted font-medium">
                        +{matchedSkills.length + missingSkills.length - 7} more
                      </span>
                    )}

                    {matchedSkills.length === 0 && missingSkills.length === 0 && (
                      <span className="text-[11px] text-gray-400 italic">
                        No specific skills listed
                      </span>
                    )}
                  </div>

                  {/* View Details Link */}
                  <div className="flex items-center gap-1 text-xs font-bold text-linkedin-blue group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>View Match</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="bg-white border border-linkedin-border rounded-[12px] p-4 flex items-center justify-between shadow-sm text-xs">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="flex items-center gap-1 font-semibold text-linkedin-blue disabled:text-gray-300 disabled:cursor-not-allowed hover:underline"
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
            className="flex items-center gap-1 font-semibold text-linkedin-blue disabled:text-gray-300 disabled:cursor-not-allowed hover:underline"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
