import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import { normalizeErrorMessage } from '../utils/errorHelpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ApplyModal from '../components/jobs/ApplyModal';
import JobDetailHeader from '../components/jobs/JobDetailHeader';
import JobMatchSidebar from '../components/jobs/JobMatchSidebar';
import JobKeyRequirements from '../components/jobs/JobKeyRequirements';
import JobMatchExplanation from '../components/jobs/JobMatchExplanation';
import JobSkillGapsRoadmap from '../components/jobs/JobSkillGapsRoadmap';
import JobScoreBreakdown from '../components/jobs/JobScoreBreakdown';
import JobDescriptionSection from '../components/jobs/JobDescriptionSection';
import JobMobileActionBar from '../components/jobs/JobMobileActionBar';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, hasProfile } = useAuth();

  // Base job state
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Save & Apply state
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // AI Match Explanation state (loaded asynchronously without blocking base job)
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState(null);

  // 1. Fetch base job details & match score immediately
  useEffect(() => {
    let isMounted = true;

    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/jobs/${id}`);
        if (!isMounted) return;

        if (res.data?.success && res.data?.data) {
          const jobData = res.data.data;
          setJob(jobData);
          setIsSaved(Boolean(jobData.isSaved));
          if (jobData.alreadyApplied) {
            setApplied(true);
          }
        } else {
          setError('Job not found.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[JobDetailPage] Error fetching job:', err);
        setError(err.customMessage || 'Failed to load job details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJob();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const [explanationRegenerating, setExplanationRegenerating] = useState(false);

  // 2. Asynchronously fetch AI Match Explanation (with force regeneration support)
  const fetchExplanation = useCallback(async (force = false) => {
    if (!id || !job?.match) return;

    try {
      if (force) {
        setExplanationRegenerating(true);
      } else {
        setExplanationLoading(true);
      }
      setExplanationError(null);

      const endpoint = force ? `/jobs/${id}/explain?force=true` : `/jobs/${id}/explain`;
      const res = await api.get(endpoint);
      if (res.data?.success && res.data?.data) {
        setExplanation(res.data.data);
        if (force) {
          toast.success('Match analysis refreshed based on current profile.');
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[JobDetailPage] Failed to load match explanation:', err);
      }
      setExplanationError('Match explanation is temporarily unavailable. Check back in a moment.');
      if (force) {
        toast.error('Failed to regenerate match analysis.');
      }
    } finally {
      setExplanationLoading(false);
      setExplanationRegenerating(false);
    }
  }, [id, job?.match, toast]);

  useEffect(() => {
    if (job?.match) {
      fetchExplanation(false);
    }
  }, [fetchExplanation, job?.match]);

  // Toggle save job with optimistic update
  const handleToggleSave = useCallback(async () => {
    if (saveLoading || !job) return;
    setSaveLoading(true);
    const prevSaved = isSaved;
    setIsSaved(!prevSaved); // Optimistic

    try {
      const { data } = await api.post(`/jobs/${id}/save`);
      if (data.success) {
        setIsSaved(data.saved);
        toast[data.saved ? 'success' : 'info'](
          data.message || (data.saved ? `Saved "${job.title}" to your jobs!` : `Removed "${job.title}" from saved jobs.`)
        );
      } else {
        setIsSaved(prevSaved); // Revert
        toast.error(data.message || 'Could not update saved job status.');
      }
    } catch {
      setIsSaved(prevSaved);
      toast.error('Failed to update saved status.');
    } finally {
      setSaveLoading(false);
    }
  }, [id, isSaved, job, saveLoading, toast]);

  // Open In-App Apply Modal
  const handleApplyClick = useCallback(() => {
    if (!isAuthenticated) {
      toast.info('Please sign in to apply for this job.');
      navigate('/login');
      return;
    }
    setIsApplyModalOpen(true);
  }, [isAuthenticated, navigate, toast]);

  // Loading State
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" color="text-linkedin-blue" />
        <p className="text-sm font-semibold text-linkedin-text-secondary">
          Loading job opportunity details...
        </p>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          title="Job Opportunity Not Found"
          message={error || 'The job listing you requested does not exist or has been removed.'}
          actionText="Browse Available Jobs"
          actionTo="/jobs"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 lg:pb-8">
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Column (8 cols on lg) */}
        <main className="lg:col-span-8 space-y-6">
          {/* 1. Job Header (Identity & Metadata) */}
          <JobDetailHeader job={job} />

          {/* 2. Key Role Requirements */}
          <JobKeyRequirements job={job} />

          {/* 3. Why This Job Matches (Asynchronous) */}
          {job.match && (
            <JobMatchExplanation
              explanation={explanation}
              loading={explanationLoading}
              regenerating={explanationRegenerating}
              error={explanationError}
              onRegenerate={() => fetchExplanation(true)}
            />
          )}

          {/* 4. Skill Readiness & Roadmap */}
          {job.match && <JobSkillGapsRoadmap job={job} />}

          {/* 5. 5-Factor Algorithm Breakdown */}
          {job.match && <JobScoreBreakdown job={job} />}

          {/* 6. Full Job Description & Source */}
          <JobDescriptionSection job={job} />
        </main>

        {/* Sticky Action & Match Sidebar (4 cols on lg) */}
        <div className="hidden lg:block lg:col-span-4">
          <JobMatchSidebar
            job={job}
            isSaved={isSaved}
            saveLoading={saveLoading}
            applied={applied}
            onApplyClick={handleApplyClick}
            onToggleSave={handleToggleSave}
            hasProfile={hasProfile}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <JobMobileActionBar
        job={job}
        isSaved={isSaved}
        saveLoading={saveLoading}
        applied={applied}
        onApplyClick={handleApplyClick}
        onToggleSave={handleToggleSave}
        isVisible={!isApplyModalOpen}
      />

      {/* In-App Application Modal */}
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        job={job}
        onApplicationSuccess={(appData) => {
          setApplied(true);
          setJob((prev) => (prev ? { ...prev, alreadyApplied: true, application: appData } : prev));
        }}
      />
    </div>
  );
};

export default JobDetailPage;
