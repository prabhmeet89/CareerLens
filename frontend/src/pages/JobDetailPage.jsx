import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  ExternalLink,
  Bookmark,
  ChevronLeft,
  Check,
  X,
  Sparkles,
  Layers,
  GraduationCap,
  Award,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ClipboardCheck,
} from 'lucide-react';
import api from '../api/axiosClient';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ApplyModal from '../components/jobs/ApplyModal';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { isAuthenticated } = useAuth();

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
    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/jobs/${id}`);
        if (res.data?.success && res.data?.data) {
          setJob(res.data.data);
          setIsSaved(res.data.data.isSaved || false);
          if (res.data.data.alreadyApplied) {
            setApplied(true);
          }
        } else {
          setError('Job not found.');
        }
      } catch (err) {
        console.error('[JobDetailPage] Error fetching job:', err);
        setError(err.customMessage || 'Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // Phase 5: Toggle save job
  const handleToggleSave = useCallback(async () => {
    if (saveLoading) return;
    setSaveLoading(true);
    const prevSaved = isSaved;
    setIsSaved(!prevSaved); // Optimistic
    try {
      const { data } = await api.post(`/jobs/${id}/save`);
      if (data.success) {
        setIsSaved(data.saved);
        toast[data.saved ? 'success' : 'info'](data.message || (data.saved ? 'Job saved!' : 'Job removed from saved.'));
      } else {
        setIsSaved(prevSaved); // Revert
      }
    } catch {
      setIsSaved(prevSaved);
      toast.error('Failed to update saved status.');
    } finally {
      setSaveLoading(false);
    }
  }, [id, isSaved, saveLoading, toast]);

  // Open In-App Apply Modal
  const handleApplyClick = useCallback(() => {
    if (!isAuthenticated) {
      toast.info('Please sign in to apply for this job.');
      navigate('/login');
      return;
    }
    setIsApplyModalOpen(true);
  }, [isAuthenticated, navigate, toast]);

  // 2. Asynchronously fetch AI Match Explanation
  useEffect(() => {
    if (!job || !job.match) return;

    const fetchExplanation = async () => {
      try {
        setExplanationLoading(true);
        setExplanationError(null);
        const res = await api.get(`/jobs/${id}/explain`);
        if (res.data?.success && res.data?.data) {
          setExplanation(res.data.data);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[JobDetailPage] Failed to load AI match explanation:', err);
        }
        setExplanationError('AI explanation unavailable right now.');
      } finally {
        setExplanationLoading(false);
      }
    };

    fetchExplanation();
  }, [id, job]);

  const getScoreColor = (score) => {
    if (score >= 80) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' };
    if (score >= 50) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' };
    return { text: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300' };
  };

  const formatEmploymentType = (type) => {
    if (!type) return 'Full-time';
    return type
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('-');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" color="text-linkedin-blue" />
        <p className="text-sm font-medium text-linkedin-text-secondary">
          Loading job opportunity details...
        </p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-white border border-linkedin-border rounded-[12px] p-8 text-center shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-linkedin-text-primary">
            Job Opportunity Not Found
          </h2>
          <p className="text-xs sm:text-sm text-linkedin-text-secondary">
            {error || 'The job listing you requested does not exist or has been removed.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/jobs')}>
            Back to All Jobs
          </Button>
        </div>
      </div>
    );
  }

  const match = job.match;
  const scoreColor = match ? getScoreColor(match.score) : null;
  const matchedSkills = match?.matchedSkills || [];
  const missingSkills = match?.missingSkills || [];
  const breakdown = match?.breakdown || {};
  const totalSkillsCount = (job.skills || []).length;
  const hasSkillRequirements = totalSkillsCount > 0;
  const readinessScore = typeof job.readinessScore === 'number' ? job.readinessScore : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-linkedin-blue hover:text-linkedin-blue-hover transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </button>
      </div>

      {/* 1. Job Header Card */}
      <div className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-linkedin-text-primary">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-linkedin-text-secondary font-medium">
              <span className="font-semibold text-linkedin-text-primary flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-linkedin-blue" />
                {job.company}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                {job.location}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-gray-400" />
                {formatEmploymentType(job.employmentType)}
              </span>
            </div>
          </div>

          {/* Match Badge + AI Verdict */}
          {match && (
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold ${scoreColor.bg} ${scoreColor.border} ${scoreColor.text}`}
              >
                <Sparkles className="w-4 h-4" />
                <div className="text-right">
                  <div className="text-lg leading-none">{match.score}%</div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
                    Fit Score
                  </div>
                </div>
              </div>

              {/* AI Verdict badge */}
              {explanation?.verdict && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {explanation.verdict}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Highlight Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs">
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">
            Experience: {job.experienceRequired || '0-1 years'}
          </span>
          {job.salary && (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
              Salary: {job.salary}
            </span>
          )}
          <span className="bg-blue-50 text-linkedin-blue border border-blue-200 px-3 py-1 rounded-full font-medium">
            Posted Recently
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-linkedin-border">
          <div className="flex flex-wrap items-center gap-3">
            {/* Apply Button — opens ApplyModal */}
            <button
              type="button"
              onClick={handleApplyClick}
              className={`inline-flex items-center justify-center font-bold text-sm px-6 py-2.5 rounded-full transition-all shadow-sm gap-2 ${
                applied
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-linkedin-blue text-white hover:bg-linkedin-blue-hover'
              }`}
            >
              {applied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <span>Apply Now</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Save Job Toggle */}
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saveLoading}
              className={`inline-flex items-center justify-center font-semibold text-sm px-4 py-2.5 rounded-full border transition-all gap-1.5 ${
                isSaved
                  ? 'bg-linkedin-blue/10 border-linkedin-blue text-linkedin-blue'
                  : 'border-gray-300 text-gray-600 hover:border-linkedin-blue hover:text-linkedin-blue bg-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 transition-all ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save Job'}</span>
            </button>
          </div>

          {/* Improve My Match CTA */}
          {match && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(`/jobs/${id}/roadmap`)}
              icon={Zap}
              className="font-bold border-linkedin-blue/30 text-linkedin-blue hover:bg-linkedin-blue-light"
            >
              Improve Match (Skill Roadmap)
            </Button>
          )}
        </div>
      </div>

      {/* 2. Phase 4: Match Explanation ("Why this match?") */}
      {match && (
        <div className="bg-white border border-linkedin-border rounded-[12px] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-linkedin-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-linkedin-text-primary">
                  Why this match?
                </h2>
                <p className="text-xs text-linkedin-text-secondary">
                  Assessment tailored to your portfolio and skills
                </p>
              </div>
            </div>
          </div>

          {explanationLoading ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2 text-center">
              <Spinner size="md" color="text-linkedin-blue" />
              <p className="text-xs font-semibold text-linkedin-text-secondary">
                Analyzing match strengths and gaps...
              </p>
            </div>
          ) : explanation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Strengths */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Key Candidate Strengths</span>
                </div>
                <ul className="space-y-1.5">
                  {explanation.strengths?.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-emerald-950 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-emerald-600 font-bold mt-0.5">&bull;</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Growth Areas & Gaps */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Growth Areas / Gaps to Address</span>
                </div>
                <ul className="space-y-1.5">
                  {explanation.gaps?.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-amber-950 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-amber-600 font-bold mt-0.5">&bull;</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">
              {explanationError || 'Match breakdown is currently unavailable.'}
            </div>
          )}
        </div>
      )}

      {/* 3. Skill Readiness & Gap Analysis */}
      {match && (
        <div className="bg-white border border-linkedin-border rounded-[12px] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-linkedin-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-linkedin-text-primary">
                  Skill Readiness &amp; Gap Analysis
                </h3>
                <p className="text-xs text-linkedin-text-secondary">
                  Compare your technical capabilities with required job qualifications
                </p>
              </div>
            </div>

            {hasSkillRequirements ? (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                (readinessScore || 0) >= 80
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : (readinessScore || 0) >= 50
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-blue-700 bg-blue-50 border-blue-200'
              }`}>
                {readinessScore}% Stack Readiness
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">
                General Match
              </span>
            )}
          </div>

          {hasSkillRequirements ? (
            <>
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-linkedin-text-primary">
                  <span>Required Skill Coverage</span>
                  <span>
                    {matchedSkills.length} of {totalSkillsCount} Skills Matched ({readinessScore}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200/80">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      (readinessScore || 0) >= 80
                        ? 'bg-emerald-500'
                        : (readinessScore || 0) >= 50
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(5, readinessScore || 0)}%` }}
                  />
                </div>
              </div>

              {/* Numbered Missing Skills List */}
              <div className="pt-2 space-y-3">
                <h4 className="text-xs font-bold text-linkedin-text-primary uppercase tracking-wider">
                  {missingSkills.length > 0
                    ? `Missing Skills to Bridge (${missingSkills.length})`
                    : 'All Required Skills Matched!'}
                </h4>

                {missingSkills.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {missingSkills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-gray-200 bg-[#F9FAFB] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-linkedin-text-primary">{skill}</span>
                        </div>
                        <span className="text-[10px] text-linkedin-blue font-bold uppercase">
                          Skill Gap
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>You match all {totalSkillsCount} of the required skills listed for this position!</span>
                  </div>
                )}

                {/* CTA to Roadmap */}
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/jobs/${id}/roadmap`)}
                    icon={Sparkles}
                    className="font-bold shadow-xs"
                  >
                    Generate Week-by-Week Learning Roadmap &rarr;
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Honest state when job listing does not specify explicit skill requirements */
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-linkedin-text-primary">
                    No explicit technical skills listed in this job posting
                  </p>
                  <p className="text-xs text-linkedin-text-secondary leading-relaxed">
                    This employer's listing does not specify individual required technology keywords. Your match score ({match.score}%) is calculated based on your target role alignment, project portfolio, experience, education, and location.
                  </p>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/jobs/${id}/roadmap`)}
                  icon={Sparkles}
                  className="font-semibold text-xs border-linkedin-blue/30 text-linkedin-blue"
                >
                  View Role Roadmap &rarr;
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. 5-Factor Weighted Score Breakdown */}
      {match && (
        <div className="bg-white border border-linkedin-border rounded-[12px] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-linkedin-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-linkedin-text-primary">
                  5-Factor Algorithm Breakdown
                </h2>
                <p className="text-xs text-linkedin-text-secondary">
                  Weighted scoring distribution across profile dimensions
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-linkedin-blue bg-linkedin-blue-light px-2.5 py-1 rounded-full">
              Algorithm v1.0
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
              <div className="text-[11px] font-bold text-linkedin-text-secondary uppercase">
                Skills (50%)
              </div>
              <div className="text-lg font-black text-linkedin-blue">
                {breakdown.skillsScore}/50
              </div>
              <div className="text-[10px] text-gray-400">Direct stack match</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
              <div className="text-[11px] font-bold text-linkedin-text-secondary uppercase">
                Projects (20%)
              </div>
              <div className="text-lg font-black text-emerald-600">
                {breakdown.projectsScore}/20
              </div>
              <div className="text-[10px] text-gray-400">Applied in builds</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
              <div className="text-[11px] font-bold text-linkedin-text-secondary uppercase">
                Experience (15%)
              </div>
              <div className="text-lg font-black text-amber-600">
                {breakdown.experienceScore}/15
              </div>
              <div className="text-[10px] text-gray-400">Internship credit</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1">
              <div className="text-[11px] font-bold text-linkedin-text-secondary uppercase">
                Education (10%)
              </div>
              <div className="text-lg font-black text-purple-600">
                {breakdown.educationScore}/10
              </div>
              <div className="text-[10px] text-gray-400">Degree relevance</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-bold text-linkedin-text-secondary uppercase">
                Location (5%)
              </div>
              <div className="text-lg font-black text-indigo-600">
                {breakdown.locationScore}/5
              </div>
              <div className="text-[10px] text-gray-400">Remote / Area</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Job Description & Required Skills */}
      <div className="bg-white border border-linkedin-border rounded-[12px] p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-linkedin-text-primary border-b border-linkedin-border pb-3">
          About the Role
        </h2>

        <div className="text-sm text-linkedin-text-primary leading-relaxed whitespace-pre-line">
          {job.description}
        </div>

        {/* Required Skills list */}
        {job.skills && job.skills.length > 0 && (
          <div className="pt-4 border-t border-linkedin-border space-y-3">
            <h3 className="text-sm font-bold text-linkedin-text-primary">
              Required Technical Stack &amp; Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold text-linkedin-text-primary bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* In-App Apply Modal */}
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
