import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Compass,
  ChevronLeft,
  Building2,
  CheckCircle2,
  Circle,
  RefreshCw,
  AlertCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  BookOpen,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { useToast } from '../context/ToastContext';
import {
  formatGeneratedDate,
  formatEstimatedMinutes,
} from '../utils/jobHelpers';
import { normalizeErrorMessage } from '../utils/errorHelpers';

const RoadmapPage = () => {
  const { id, jobId } = useParams();
  const targetJobId = id || jobId;
  const navigate = useNavigate();
  const toast = useToast();

  const [roadmap, setRoadmap] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [noProfile, setNoProfile] = useState(false);

  // Expanded weeks state (default open all or first incomplete week)
  const [expandedWeeks, setExpandedWeeks] = useState({ 1: true });
  // Task mutation loading map { [taskId]: boolean }
  const [updatingTaskIds, setUpdatingTaskIds] = useState(new Set());
  // Regeneration confirmation modal state
  const [showRegenModal, setShowRegenModal] = useState(false);

  const toggleWeek = (weekNum) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  const fetchJobAndRoadmap = useCallback(async (force = false) => {
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
        // Expand all weeks by default
        const initExpanded = {};
        (roadmapRes.data.data.weeks || []).forEach((w) => {
          initExpanded[w.week] = true;
        });
        setExpandedWeeks(initExpanded);

        if (force) {
          toast.success('Learning roadmap refreshed. Previous completed tasks were preserved.');
        }
      } else if (roadmapRes.data?.success && roadmapRes.data?.data === null) {
        setNoProfile(true);
      } else {
        setError(roadmapRes.data?.message || 'Unable to load learning roadmap.');
      }
    } catch (err) {
      console.error('[RoadmapPage Error]:', err);
      setError(normalizeErrorMessage(err, 'Failed to generate learning roadmap. Please try again.'));
      if (force) {
        toast.error('Failed to regenerate roadmap. Previous roadmap kept.');
      }
    } finally {
      setLoading(false);
      setRegenerating(false);
      setShowRegenModal(false);
    }
  }, [targetJobId, toast]);

  useEffect(() => {
    fetchJobAndRoadmap(false);
  }, [fetchJobAndRoadmap]);

  // Handle task completion toggle with optimistic update and rollback
  const handleToggleTask = async (taskId, currentCompleted) => {
    if (updatingTaskIds.has(taskId) || !roadmap) return;

    // Set updating indicator
    setUpdatingTaskIds((prev) => new Set(prev).add(taskId));

    const nextCompleted = !currentCompleted;

    // Deep clone for optimistic state update
    const previousWeeks = roadmap.weeks;
    const optimisticWeeks = previousWeeks.map((week) => ({
      ...week,
      tasks: week.tasks.map((task) => {
        if (task.taskId === taskId) {
          return {
            ...task,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date() : null,
          };
        }
        return task;
      }),
    }));

    // Optimistically update
    setRoadmap((prev) => ({
      ...prev,
      weeks: optimisticWeeks,
    }));

    try {
      const res = await api.patch(`/jobs/${targetJobId}/roadmap/tasks/${taskId}`, {
        completed: nextCompleted,
      });

      if (res.data?.success && res.data?.data) {
        const { overallProgress, weeklyProgress } = res.data.data;
        setRoadmap((prev) => ({
          ...prev,
          overallProgress,
          weeklyProgress,
        }));
      } else {
        // Rollback
        setRoadmap((prev) => ({ ...prev, weeks: previousWeeks }));
        toast.error(res.data?.message || 'Could not update task progress.');
      }
    } catch {
      // Rollback
      setRoadmap((prev) => ({ ...prev, weeks: previousWeeks }));
      toast.error('Network error updating task. Please try again.');
    } finally {
      setUpdatingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" color="text-linkedin-blue" />
        <div className="text-center">
          <h2 className="text-lg font-bold text-linkedin-text-primary">
            Synthesizing Your Custom Learning Roadmap...
          </h2>
          <p className="text-xs text-linkedin-text-secondary mt-1">
            Analyzing your skill gaps and sequencing weekly milestones with authoritative resources.
          </p>
        </div>
      </div>
    );
  }

  // No Profile State
  if (noProfile) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white border border-linkedin-border rounded-[12px] p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <FileText className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-linkedin-text-primary">
            Resume Profile Required
          </h1>
          <p className="text-xs sm:text-sm text-linkedin-text-secondary max-w-md mx-auto leading-relaxed">
            Upload your resume so CareerLens can evaluate your skills against this role and generate a personalized learning roadmap.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate(`/jobs/${targetJobId}`)}>
              Back to Job Details
            </Button>
            <Button variant="primary" onClick={() => navigate('/upload')}>
              Upload Resume (PDF)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !roadmap) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white border border-linkedin-border rounded-[12px] p-8 text-center shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" aria-hidden="true" />
          <h1 className="text-xl font-bold text-linkedin-text-primary">
            Roadmap Generation Error
          </h1>
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

  // Special State: Candidate matches 100% of listed requirements
  if (roadmap.noGaps) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white border border-linkedin-border rounded-[12px] p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <Award className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-linkedin-text-primary">
            No Skill Gaps Identified
          </h1>
          <p className="text-xs sm:text-sm text-linkedin-text-secondary max-w-md mx-auto leading-relaxed">
            Your profile already covers all {roadmap.matchedSkills?.length || 'the'} listed requirements for{' '}
            <span className="font-bold text-linkedin-text-primary">{roadmap.jobTitle || 'this role'}</span>.
            There are no missing skill gaps to build a learning roadmap around.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {(roadmap.matchedSkills || []).map((skill, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate(`/jobs/${targetJobId}`)}>
              Back to Job Details
            </Button>
            <Button variant="primary" onClick={() => navigate('/jobs')}>
              Browse More Opportunities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const weeks = roadmap.weeks || [];
  const missingSkills = roadmap.missingSkills || [];
  const isGenericRoadmap = !!roadmap.isGenericRoadmap;
  const generatedDate = formatGeneratedDate(roadmap.generatedAt);

  // Compute canonical progress numbers from task subdocuments
  let totalTasksCount = 0;
  let completedTasksCount = 0;
  let remainingMinutesTotal = 0;

  weeks.forEach((w) => {
    (w.tasks || []).forEach((t) => {
      totalTasksCount++;
      if (t.completed) {
        completedTasksCount++;
      } else {
        remainingMinutesTotal += Number(t.estimatedMinutes) || 60;
      }
    });
  });

  const overallPercent =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Find next incomplete week milestone
  const nextIncompleteWeek = weeks.find((w) => (w.tasks || []).some((t) => !t.completed));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Back link */}
      <div>
        <button
          type="button"
          onClick={() => navigate(`/jobs/${targetJobId}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-linkedin-blue hover:text-linkedin-blue-hover transition-colors focus:outline-none focus:underline"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Job Details</span>
        </button>
      </div>

      {/* ── 1. Overall Progress & Roadmap Header Banner ── */}
      <header className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-linkedin-blue bg-linkedin-blue-light px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Personalized Career Roadmap</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-linkedin-text-primary tracking-tight leading-tight">
              {job?.title || roadmap.jobTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-linkedin-text-secondary">
              <span className="font-semibold text-linkedin-text-primary flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-linkedin-blue" aria-hidden="true" />
                {job?.company || roadmap.jobCompany}
              </span>
              <span>&bull;</span>
              <span>{roadmap.totalWeeks}-Week Structured Curriculum</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (completedTasksCount > 0) {
                  setShowRegenModal(true);
                } else {
                  fetchJobAndRoadmap(true);
                }
              }}
              disabled={regenerating}
              icon={RefreshCw}
              className={`text-xs font-semibold min-h-[44px] ${regenerating ? 'animate-spin' : ''}`}
            >
              {regenerating ? 'Regenerating…' : 'Regenerate'}
            </Button>
          </div>
        </div>

        {/* Missing Skills Addressed */}
        {missingSkills.length > 0 && (
          <div className="pt-2 border-t border-linkedin-border flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-linkedin-text-secondary">
              Gaps Targeted:
            </span>
            {missingSkills.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Generic roadmap note if job lacked explicit skills */}
        {isGenericRoadmap && (
          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs">
            <Info className="w-4 h-4 text-linkedin-blue shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-linkedin-blue leading-relaxed">
              <span className="font-bold">General Engineering Curriculum: </span>
              This job posting did not specify individual required technical keywords. This plan covers foundational cloud, architecture, and testing competencies valuable for the role.
            </p>
          </div>
        )}

        {/* Overall Completion Progress Bar & Metrics */}
        <div className="pt-3 border-t border-linkedin-border space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Completion Percentage */}
            <div className="p-3 bg-[#F8FAFC] border border-gray-200/80 rounded-xl">
              <div className="text-xl font-black text-linkedin-blue">{overallPercent}%</div>
              <div className="text-[11px] font-semibold text-linkedin-text-secondary">Progress</div>
            </div>

            {/* Completed Tasks Count */}
            <div className="p-3 bg-[#F8FAFC] border border-gray-200/80 rounded-xl">
              <div className="text-xl font-black text-emerald-600">
                {completedTasksCount}/{totalTasksCount}
              </div>
              <div className="text-[11px] font-semibold text-linkedin-text-secondary">Tasks Done</div>
            </div>

            {/* Remaining Effort */}
            <div className="p-3 bg-[#F8FAFC] border border-gray-200/80 rounded-xl">
              <div className="text-xl font-black text-amber-600">
                {formatEstimatedMinutes(remainingMinutesTotal)}
              </div>
              <div className="text-[11px] font-semibold text-linkedin-text-secondary">Remaining Effort</div>
            </div>

            {/* Current Focus */}
            <div className="p-3 bg-[#F8FAFC] border border-gray-200/80 rounded-xl">
              <div className="text-base font-black text-purple-600 truncate">
                {nextIncompleteWeek ? `Week ${nextIncompleteWeek.week}` : 'All Complete!'}
              </div>
              <div className="text-[11px] font-semibold text-linkedin-text-secondary">Next Focus</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-linkedin-text-primary">
              <span>Overall Roadmap Completion</span>
              <span>{completedTasksCount} of {totalTasksCount} Objectives Completed ({overallPercent}%)</span>
            </div>
            <div
              className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200"
              role="progressbar"
              aria-valuenow={overallPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall roadmap completion progress: ${overallPercent}%`}
            >
              <div
                className="h-full bg-linkedin-blue transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(3, overallPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* AI Guidance Disclosure Footer */}
        <div className="pt-2 border-t border-linkedin-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-linkedin-text-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            <span>AI-suggested learning plan based on required job skills. Adjust the pace to your schedule.</span>
          </div>

          {generatedDate && (
            <div className="flex items-center gap-1 font-medium text-gray-500">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span>{generatedDate}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── 2. Week-by-Week Accordion Modules ── */}
      <div className="space-y-4">
        {weeks.map((weekItem) => {
          const weekNum = weekItem.week;
          const isExpanded = !!expandedWeeks[weekNum];
          const tasks = weekItem.tasks || [];
          const weekCompletedTasks = tasks.filter((t) => t.completed).length;
          const weekTotalTasks = tasks.length;
          const weekPercent = weekTotalTasks > 0 ? Math.round((weekCompletedTasks / weekTotalTasks) * 100) : 0;
          const isWeekFinished = weekTotalTasks > 0 && weekCompletedTasks === weekTotalTasks;

          // Estimate total weekly time
          const weeklyTotalMinutes = tasks.reduce((sum, t) => sum + (Number(t.estimatedMinutes) || 60), 0);

          return (
            <section
              key={weekNum}
              className={`bg-white border rounded-[12px] shadow-sm transition-all overflow-hidden ${
                isWeekFinished
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : 'border-linkedin-border'
              }`}
              aria-labelledby={`week-${weekNum}-heading`}
            >
              {/* Accordion Header Bar */}
              <button
                type="button"
                onClick={() => toggleWeek(weekNum)}
                aria-expanded={isExpanded}
                className="w-full text-left p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors focus:outline-none focus:ring-2 focus:ring-linkedin-blue"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shadow-xs shrink-0 ${
                      isWeekFinished
                        ? 'bg-emerald-600 text-white'
                        : 'bg-linkedin-blue text-white'
                    }`}
                  >
                    {isWeekFinished ? <Check className="w-5 h-5" aria-hidden="true" /> : `W${weekNum}`}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-linkedin-blue tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Week {weekNum} Milestone
                      </span>
                      <span className="text-xs text-linkedin-text-muted flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{formatEstimatedMinutes(weeklyTotalMinutes)} total</span>
                      </span>
                    </div>

                    <h2
                      id={`week-${weekNum}-heading`}
                      className="text-base font-bold text-linkedin-text-primary mt-1 truncate"
                    >
                      {weekItem.focus}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Weekly Progress Counter */}
                  <div className="text-right">
                    <div className="text-xs font-bold text-linkedin-text-primary">
                      {weekCompletedTasks} of {weekTotalTasks} Completed
                    </div>
                    <div className="text-[11px] font-semibold text-linkedin-text-muted">
                      {weekPercent}% Finished
                    </div>
                  </div>

                  <div className="p-1 rounded-lg border border-gray-200 text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                </div>
              </button>

              {/* Weekly Mini Progress Bar */}
              <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isWeekFinished ? 'bg-emerald-500' : 'bg-linkedin-blue'
                  }`}
                  style={{ width: `${weekPercent}%` }}
                />
              </div>

              {/* Accordion Tasks Content */}
              {isExpanded && (
                <div className="p-5 sm:p-6 pt-4 space-y-3 border-t border-linkedin-border/60 bg-[#FCFCFD]">
                  <h3 className="text-xs font-bold text-linkedin-text-secondary uppercase tracking-wider">
                    Hands-On Objectives &amp; Verified Resources
                  </h3>

                  <div className="space-y-3">
                    {tasks.map((task) => {
                      const taskId = task.taskId;
                      const isDone = !!task.completed;
                      const isMutating = updatingTaskIds.has(taskId);

                      return (
                        <div
                          key={taskId}
                          className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                            isDone
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 shadow-2xs'
                              : 'bg-white border-linkedin-border text-linkedin-text-primary hover:border-linkedin-blue/40 shadow-xs'
                          }`}
                        >
                          {/* Task Checkbox & Title */}
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(taskId, isDone)}
                              disabled={isMutating}
                              aria-pressed={isDone}
                              aria-label={isDone ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
                              className={`-mt-1 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue shrink-0 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                isMutating ? 'opacity-50' : 'hover:scale-105 active:scale-95'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" aria-hidden="true" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-300 hover:text-linkedin-blue" aria-hidden="true" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p
                                  className={`text-sm font-bold leading-snug ${
                                    isDone ? 'line-through text-emerald-900 opacity-90' : 'text-linkedin-text-primary'
                                  }`}
                                >
                                  {task.title}
                                </p>

                                {task.estimatedMinutes && (
                                  <span className="shrink-0 text-[11px] font-semibold text-linkedin-text-muted bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                    {formatEstimatedMinutes(task.estimatedMinutes)}
                                  </span>
                                )}
                              </div>

                              {task.description && (
                                <p className="text-xs text-linkedin-text-secondary leading-relaxed">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Resource Links */}
                          {task.resources && task.resources.length > 0 && (
                            <div className="pl-8 pt-1 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-linkedin-text-muted flex items-center gap-1">
                                <BookOpen className="w-3 h-3" aria-hidden="true" />
                                <span>Suggested Resources:</span>
                              </span>

                              {task.resources.map((res, rIdx) => (
                                <a
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-linkedin-blue bg-blue-50/80 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-linkedin-blue"
                                >
                                  <span>{res.title}</span>
                                  {res.domain && (
                                    <span className="text-[10px] text-gray-400">({res.domain})</span>
                                  )}
                                  <ExternalLink className="w-3 h-3 text-linkedin-blue shrink-0" aria-hidden="true" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ── 3. Completion Summary & Resume Benchmark Footer ── */}
      <footer className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-7 shadow-sm text-center space-y-3">
        <Award className="w-10 h-10 text-amber-500 mx-auto" aria-hidden="true" />
        <h3 className="text-base font-bold text-linkedin-text-primary">
          Ready to Benchmark Your Built Projects?
        </h3>
        <p className="text-xs text-linkedin-text-secondary max-w-md mx-auto leading-relaxed">
          Once you complete hands-on projects covering these milestones, update your resume to refresh your personalized match scores and unlock new opportunities.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/upload')}>
            Upload Updated Resume
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/jobs/${targetJobId}`)}>
            Back to Job Details
          </Button>
        </div>
      </footer>

      {/* ── 4. Regeneration Confirmation Modal ── */}
      {showRegenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="regen-modal-title"
        >
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-linkedin-border">
            <div className="flex items-center gap-3 text-purple-700">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200">
                <RefreshCw className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 id="regen-modal-title" className="text-base font-bold text-linkedin-text-primary">
                Regenerate Learning Roadmap?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-linkedin-text-secondary leading-relaxed">
              You currently have <span className="font-bold text-linkedin-text-primary">{completedTasksCount} completed objective{completedTasksCount !== 1 ? 's' : ''}</span> in this roadmap. CareerLens will preserve your completed progress where matching tasks are identified.
            </p>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRegenModal(false)}
                disabled={regenerating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => fetchJobAndRoadmap(true)}
                disabled={regenerating}
                className="bg-purple-700 hover:bg-purple-800 text-white font-bold"
              >
                {regenerating ? 'Regenerating…' : 'Confirm & Regenerate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
