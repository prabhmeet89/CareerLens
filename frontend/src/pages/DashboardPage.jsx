import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import MatchReadinessCard from '../components/dashboard/MatchReadinessCard';
import RecommendedJobsSection from '../components/dashboard/RecommendedJobsSection';
import ProfileCompletionCard from '../components/dashboard/ProfileCompletionCard';
import ApplicationPipelineCard from '../components/dashboard/ApplicationPipelineCard';
import SkillGapsRoadmapCard from '../components/dashboard/SkillGapsRoadmapCard';
import DashboardNextStep from '../components/dashboard/DashboardNextStep';

const DashboardPage = () => {
  const { user, profile, loading: authLoading, profileLoading } = useAuth();

  // Recommendations state
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recommendedTotal, setRecommendedTotal] = useState(0);
  const [hasProfile, setHasProfile] = useState(true);
  const [isTruncated, setIsTruncated] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(null);

  // Applications state
  const [applications, setApplications] = useState([]);
  const [appStats, setAppStats] = useState({
    Applied: 0,
    Shortlisted: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
  });
  const [appTotal, setAppTotal] = useState(0);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState(null);

  // Fetch dashboard data in parallel using Promise.allSettled
  const fetchDashboardData = useCallback(async () => {
    setJobsLoading(true);
    setAppsLoading(true);
    setJobsError(null);
    setAppsError(null);

    const [jobsRes, appsRes] = await Promise.allSettled([
      api.get('/jobs/recommended?limit=4'),
      api.get('/api/applications?limit=5').catch(() => api.get('/applications?limit=5')),
    ]);

    // Handle Recommendations
    if (jobsRes.status === 'fulfilled' && jobsRes.value.data?.success) {
      const data = jobsRes.value.data.data;
      setRecommendedJobs(data.jobs || []);
      setRecommendedTotal(data.total || 0);
      setHasProfile(data.hasProfile !== false);
      setIsTruncated(data.truncated === true);
    } else {
      const errMsg = jobsRes.reason?.customMessage || jobsRes.reason?.response?.data?.message || 'Could not load recommended jobs.';
      setJobsError(errMsg);
      setRecommendedJobs([]);
    }
    setJobsLoading(false);

    // Handle Applications
    if (appsRes.status === 'fulfilled' && appsRes.value.data?.success) {
      const data = appsRes.value.data.data;
      setApplications(data.applications || []);
      setAppStats(data.stats || { Applied: 0, Shortlisted: 0, Interview: 0, Offer: 0, Rejected: 0 });
      setAppTotal(data.total || 0);
    } else {
      setAppsError('Could not load application pipeline.');
    }
    setAppsLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  const isInitialLoading = authLoading || (jobsLoading && appsLoading);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Welcome & Primary Action Header */}
      <DashboardHeader
        user={user}
        profile={profile}
        topJobs={recommendedJobs}
        applications={applications}
      />

      {/* 2. Main 2-Column Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Dominant Column (8 cols): Match Readiness, Recommended Jobs, Skill Gaps */}
        <main className="lg:col-span-8 space-y-6">
          {/* Match Readiness Summary */}
          <MatchReadinessCard
            profile={profile}
            jobs={recommendedJobs}
            loading={isInitialLoading}
            error={jobsError}
          />

          {/* Top Recommended Jobs */}
          <RecommendedJobsSection
            jobs={recommendedJobs}
            total={recommendedTotal}
            hasProfile={hasProfile}
            loading={jobsLoading}
            error={jobsError}
            onRetry={fetchDashboardData}
            truncated={isTruncated}
          />

          {/* Skill Gaps & Learning Roadmap */}
          <SkillGapsRoadmapCard
            topJobs={recommendedJobs}
            loading={jobsLoading}
          />

          {/* Final Next Step Reinforcement */}
          <DashboardNextStep
            profile={profile}
            topJobs={recommendedJobs}
            applications={applications}
          />
        </main>

        {/* Right / Secondary Column (4 cols): Profile Completion, Application Pipeline */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Profile & Resume Completion */}
          <ProfileCompletionCard
            profile={profile}
            loading={profileLoading || authLoading}
          />

          {/* Application Pipeline Summary */}
          <ApplicationPipelineCard
            stats={appStats}
            total={appTotal}
            loading={appsLoading}
            error={appsError}
          />
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
