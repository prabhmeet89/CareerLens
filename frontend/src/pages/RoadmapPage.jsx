import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ChevronLeft,
  Building2,
  Calendar,
  CheckCircle,
  Circle,
  RefreshCw,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Zap,
  Target,
  Clock,
  Layers,
  Award,
} from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const RoadmapPage = () => {
  const { id, jobId } = useParams();
  const targetJobId = id || jobId;
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [noProfile, setNoProfile] = useState(false);

  // Local state to track completed tasks in the checklist during current session
  const [completedTasks, setCompletedTasks] = useState({});

  const toggleTask = (taskKey) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskKey]: !prev[taskKey],
    }));
  };

  const fetchJobAndRoadmap = async (force = false) => {
    if (!targetJobId) {
      setError('Invalid job identifier.');
      setLoading(false);
      return;
    }

    try {
      if (force) {
        setRegenerating(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setNoProfile(false);

      // 1. Fetch Job details
      const jobRes = await api.get(`/jobs/${targetJobId}`);
      if (jobRes.data?.success && jobRes.data?.data) {
        setJob(jobRes.data.data);
      }

      // 2. Fetch or generate Roadmap
      const roadmapEndpoint = force
        ? `/jobs/${targetJobId}/roadmap?force=true`
        : `/jobs/${targetJobId}/roadmap`;
      const roadmapRes = await api.post(roadmapEndpoint, { force });

      if (roadmapRes.data?.success && roadmapRes.data?.data) {
        setRoadmap(roadmapRes.data.data);
      } else if (roadmapRes.data?.success && roadmapRes.data?.data === null) {
        setNoProfile(true);
      } else {
        setError(roadmapRes.data?.message || 'Unable to load learning roadmap.');
      }
    } catch (err) {
      console.error('[RoadmapPage Error]:', err);
      setError(err.customMessage || 'Failed to generate learning roadmap. Please try again.');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchJobAndRoadmap(false);
  }, [targetJobId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-linkedin-blue-light flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-linkedin-blue animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-linkedin-text-primary">
            Synthesizing Your Custom Learning Roadmap...
          </h2>
          <p className="text-xs text-linkedin-text-secondary mt-1">
            Gemini AI is analyzing your skill gaps and sequencing high-impact weekly milestones.
          </p>
        </div>
      </div>
    );
  }

  if (noProfile) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white border border-linkedin-border rounded-[12px] p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-linkedin-text-primary">
            Resume Profile Required
          </h2>
          <p className="text-xs sm:text-sm text-linkedin-text-secondary max-w-md mx-auto">
            Please upload your resume first so CareerLens AI can benchmark your skills and build a tailored learning plan for this role.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate(`/jobs/${targetJobId}`)}>
              Back to Job
            </Button>
            <Button variant="primary" onClick={() => navigate('/upload')}>
              Upload Resume (PDF)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white border border-linkedin-border rounded-[12px] p-8 text-center shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-linkedin-text-primary">
            Roadmap Generation Error
          </h2>
          <p className="text-xs sm:text-sm text-linkedin-text-secondary">
            {error || 'Unable to build a roadmap at this moment.'}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate(`/jobs/${targetJobId}`)}>
              Back to Job
            </Button>
            <Button variant="primary" onClick={() => fetchJobAndRoadmap(true)}>
              Retry Generation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const weeks = roadmap.weeks || [];
  const missingSkills = roadmap.missingSkills || [];

  // Calculate total and completed task counts
  let totalTasks = 0;
  let finishedTasks = 0;
  weeks.forEach((w, wIdx) => {
    (w.tasks || []).forEach((_, tIdx) => {
      totalTasks++;
      if (completedTasks[`w${wIdx}_t${tIdx}`]) finishedTasks++;
    });
  });

  const completionPercent = totalTasks > 0 ? Math.round((finishedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <button
          type="button"
          onClick={() => navigate(`/jobs/${targetJobId}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-linkedin-blue hover:text-linkedin-blue-hover transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Job Opportunity</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-linkedin-blue text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>AI Career Acceleration</span>
            </div>

            <h1 className="text-2xl font-bold text-linkedin-text-primary">
              Targeted Skill Roadmap: {job?.title || roadmap.jobTitle}
            </h1>

            <p className="text-xs sm:text-sm text-linkedin-text-secondary flex items-center gap-2">
              <span className="font-semibold text-linkedin-text-primary flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-linkedin-blue" />
                {job?.company || roadmap.jobCompany}
              </span>
              <span>&bull;</span>
              <span>Accelerated {roadmap.totalWeeks}-Week Action Plan</span>
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchJobAndRoadmap(true)}
              disabled={regenerating}
              icon={RefreshCw}
              className={`text-xs font-semibold ${regenerating ? 'animate-spin' : ''}`}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </div>
        </div>

        {/* Missing Skills Pills */}
        {missingSkills.length > 0 && (
          <div className="pt-2 border-t border-linkedin-border flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-linkedin-text-secondary">
              Gaps Addressed:
            </span>
            {missingSkills.map((skill, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Roadmap Progress Bar */}
        <div className="pt-2 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-linkedin-text-primary">
            <span>Roadmap Completion Progress</span>
            <span>
              {finishedTasks} of {totalTasks} Tasks Done ({completionPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full bg-linkedin-blue transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(4, completionPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Week by Week Roadmap Timeline */}
      <div className="space-y-4">
        {weeks.map((weekItem, wIdx) => {
          return (
            <div
              key={weekItem.week || wIdx}
              className="bg-white border border-linkedin-border rounded-[12px] p-5 sm:p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              {/* Week Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-linkedin-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-linkedin-blue text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                    W{weekItem.week || wIdx + 1}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-linkedin-blue tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Week {weekItem.week || wIdx + 1} Milestone
                    </span>
                    <h2 className="text-base font-bold text-linkedin-text-primary mt-1">
                      {weekItem.focus}
                    </h2>
                  </div>
                </div>

                <div className="text-[11px] text-linkedin-text-muted font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~5-7 hrs</span>
                </div>
              </div>

              {/* Actionable Task Checklist */}
              <div className="space-y-2 pt-1">
                <h3 className="text-xs font-bold text-linkedin-text-secondary uppercase tracking-wider">
                  Hands-On Objectives &amp; Tasks
                </h3>

                <div className="space-y-2">
                  {(weekItem.tasks || []).map((task, tIdx) => {
                    const taskKey = `w${wIdx}_t${tIdx}`;
                    const isDone = !!completedTasks[taskKey];

                    return (
                      <div
                        key={tIdx}
                        onClick={() => toggleTask(taskKey)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                          isDone
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 line-through opacity-80'
                            : 'bg-[#F9FAFB] border-gray-200 text-linkedin-text-primary hover:bg-gray-50'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 text-linkedin-blue focus:outline-none"
                          aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                        >
                          {isDone ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        <span className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                          {task}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Summary Card */}
      <div className="bg-white border border-linkedin-border rounded-[12px] p-6 shadow-sm text-center space-y-3">
        <Award className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-linkedin-text-primary">
          Ready to benchmark your new skills?
        </h3>
        <p className="text-xs text-linkedin-text-secondary max-w-md mx-auto leading-relaxed">
          As you build portfolio projects covering these weeks, update your resume to let Gemini AI automatically refresh your match scores across the platform.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/upload')}>
            Upload Updated Resume
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/jobs/${targetJobId}`)}>
            Back to Job Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;
