import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  ChevronRight,
  Check,
  Clock,
} from 'lucide-react';
import Button from '../common/Button';
import api from '../../api/axiosClient';

export const FeedPlaceholderCards = () => {
  const navigate = useNavigate();
  const [topJobs, setTopJobs] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopMatches = async () => {
      try {
        setLoading(true);
        const res = await api.get('/jobs/recommended?limit=3');
        if (res.data?.success && res.data?.data) {
          setTopJobs(res.data.data.jobs || []);
          setHasProfile(res.data.data.hasProfile === true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchTopMatches();
  }, []);

  const getScoreBadge = (score) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        dot: 'bg-emerald-500',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-300',
        dot: 'bg-amber-500',
      };
    }
    return {
      bg: 'bg-gray-100 text-gray-600 border-gray-300',
      dot: 'bg-gray-400',
    };
  };

  return (
    <div className="space-y-4">
      {/* Top AI Job Matches Widget (When Candidate Profile exists) */}
      {hasProfile && topJobs.length > 0 && (
        <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[10px] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-linkedin-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-linkedin-text-primary">
                  Recommended For You
                </h3>
                <p className="text-xs text-linkedin-text-secondary">
                  Ranked by your verified skills and project portfolio
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/jobs')}
              className="text-xs font-semibold"
            >
              Browse All Jobs
            </Button>
          </div>

          {/* Top Job Cards */}
          <div className="space-y-3">
            {topJobs.map((job) => {
              const badge = getScoreBadge(job.match?.score || 0);
              return (
                <div
                  key={job.id || job._id}
                  onClick={() => navigate(`/jobs/${job.id || job._id}`)}
                  className="p-4 rounded-xl border border-linkedin-border bg-linkedin-inset hover:bg-white dark:hover:bg-[#1A1A1A] hover:shadow-sm hover:border-linkedin-blue/40 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-linkedin-text-primary group-hover:text-linkedin-blue transition-colors truncate">
                        {job.title}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {job.match?.score}% Match
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-linkedin-text-secondary">
                      <span className="font-semibold text-linkedin-text-primary">{job.company}</span>
                      <span>&bull;</span>
                      <span>{job.location}</span>
                      {job.salary && (
                        <>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-medium">{job.salary}</span>
                        </>
                      )}
                    </div>

                    {/* Matched skills pill preview */}
                    {job.match?.matchedSkills && job.match.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {job.match.matchedSkills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-800 dark:text-linkedin-green bg-emerald-50 dark:bg-linkedin-green-bg border border-emerald-200 dark:border-linkedin-green/30 px-1.5 py-0.5 rounded"
                          >
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            {skill}
                          </span>
                        ))}
                        {job.match.matchedSkills.length > 3 && (
                          <span className="text-[10px] text-linkedin-text-muted font-medium">
                            +{job.match.matchedSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-linkedin-blue group-hover:translate-x-1 transition-transform shrink-0">
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs font-bold text-linkedin-blue hover:underline"
            >
              View all personalized recommendations &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Career Advice Card */}
      <div className="bg-white dark:bg-[#141414] border border-linkedin-border rounded-[10px] p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-700 dark:text-linkedin-green bg-emerald-50 dark:bg-linkedin-green-bg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded border bg-emerald-50 dark:bg-linkedin-green-bg text-emerald-700 dark:text-linkedin-green border-emerald-200 dark:border-linkedin-green/30">
                Personalized Match Scoring
              </span>
              <p className="text-[11px] text-linkedin-text-muted mt-0.5">
                5-Factor Scoring: Skills (50%), Projects (20%), Experience (15%), Education (10%), Location (5%)
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-base font-bold text-linkedin-text-primary mb-1.5">
          How CareerLens scores your job fit
        </h3>
        <p className="text-xs sm:text-sm text-linkedin-text-secondary leading-relaxed mb-4">
          Our algorithm compares your normalized tech skills, project stacks, degree field, and experience level with live requirements to provide transparent, unbiased fit scoring.
        </p>

        <div className="pt-3 border-t border-linkedin-border flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-linkedin-text-muted">
            <Clock className="w-3.5 h-3.5 text-linkedin-blue" />
            <span>Matches updated in real time</span>
          </div>

          <Button variant="secondary" size="sm" onClick={() => navigate('/jobs')}>
            Explore Jobs Hub
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedPlaceholderCards;
