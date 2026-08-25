import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  FileText,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Building2,
  MapPin,
  Sparkles,
  AlertCircle,
  Clock,
  Info,
  ShieldCheck,
  Edit3,
  UploadCloud,
} from 'lucide-react';
import api from '../../api/axiosClient';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

/**
 * ApplyModal — 3-Step In-App Apply Experience
 *
 * Step 1: Review Profile & Resume on file
 * Step 2: Add Personal Application Note (Optional, for internal tracking only)
 * Step 3: Confirm & Open Employer's Official Portal (Tracks in DB + Redirects)
 */
const ApplyModal = ({ isOpen, onClose, job, onApplicationSuccess }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Check if already applied
  const isAlreadyApplied = Boolean(job?.alreadyApplied || job?.application);
  const appliedDate = job?.application?.appliedAt
    ? new Date(job.application.appliedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Fetch candidate profile when modal opens
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    // Reset flow
    setStep(1);
    setNotes('');
    setSubmitError(null);

    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        setProfileError(null);
        const res = await api.get('/profile/me');
        if (res.data?.success && res.data?.data) {
          setProfile(res.data.data);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.warn('[ApplyModal] Failed to load candidate profile:', err);
        setProfileError('Failed to load profile details.');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [isOpen, isAuthenticated]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const matchedSkills = job?.match?.matchedSkills || [];
  const resumeName = profile?.resumeId?.originalFileName || profile?.resumeFileName || 'Resume on File.pdf';
  const companyName = job?.company || 'Employer';

  // Final Submit Handler
  const handleFinalApply = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.post('/applications', {
        jobId: job.id || job._id,
        notes: notes.trim(),
      });

      if (res.data?.success) {
        const appData = res.data.data;

        // 1. Open external employer URL in new tab
        if (job.applicationUrl && job.applicationUrl.startsWith('http')) {
          window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
          toast.success(
            `Application tracked! We've opened ${companyName}'s application page in a new tab — complete your application there to finish applying.`
          );
        } else {
          toast.info(
            `Application tracked in your Application Tracker! (Note: No direct application URL was provided for this listing).`
          );
        }

        // 2. Notify parent to update button state
        if (onApplicationSuccess) {
          onApplicationSuccess(appData);
        }

        // 3. Close modal
        onClose();
      } else {
        setSubmitError(res.data?.message || 'Failed to record application.');
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Already applied
        setSubmitError(
          err.response.data?.message || `You have already submitted an application to this job.`
        );
      } else {
        const msg = err.response?.data?.message || err.customMessage || 'Network error while recording application.';
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Card */}
      <div
        className="relative bg-white rounded-2xl border border-linkedin-border shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-linkedin-border bg-gray-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-linkedin-blue bg-linkedin-blue-light px-2.5 py-0.5 rounded-full">
                Apply Flow
              </span>
              <span className="text-xs text-linkedin-text-muted">Step {step} of 3</span>
            </div>
            <h2 className="text-base font-bold text-linkedin-text-primary mt-1 line-clamp-1">
              Apply to {job?.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/60 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-gray-100 h-1">
          <div
            className="bg-linkedin-blue h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Edge Case 1: Already Applied */}
          {isAlreadyApplied ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-linkedin-text-primary">
                  Already Applied
                </h3>
                <p className="text-xs text-linkedin-text-secondary max-w-sm mx-auto">
                  You already applied to <strong>{job?.title}</strong> at {companyName}
                  {appliedDate ? ` on ${appliedDate}` : ''}. You can track your progress in your dashboard.
                </p>
              </div>

              {job?.application?.notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-left text-xs text-linkedin-text-secondary space-y-1">
                  <div className="font-semibold text-linkedin-text-primary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-linkedin-blue" />
                    Your Saved Note:
                  </div>
                  <p className="italic">{job.application.notes}</p>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    onClose();
                    navigate('/applications');
                  }}
                >
                  View Application Tracker
                </Button>
                {job?.applicationUrl && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => window.open(job.applicationUrl, '_blank', 'noopener,noreferrer')}
                    icon={ExternalLink}
                  >
                    Revisit Job Portal
                  </Button>
                )}
              </div>
            </div>
          ) : loadingProfile ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Spinner size="md" color="text-linkedin-blue" />
              <p className="text-xs text-linkedin-text-secondary font-medium">
                Loading your profile &amp; resume details...
              </p>
            </div>
          ) : !profile ? (
            /* Edge Case 2: No Resume / Profile Uploaded */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-linkedin-text-primary">
                  Resume Required
                </h3>
                <p className="text-xs text-linkedin-text-secondary max-w-sm mx-auto">
                  Upload your resume to unlock personalized match scores and let CareerLens accurately track your application progress.
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <Button
                  variant="primary"
                  size="md"
                  icon={UploadCloud}
                  onClick={() => {
                    onClose();
                    navigate('/upload');
                  }}
                >
                  Upload Resume (PDF)
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Review Profile */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="border border-linkedin-border rounded-xl p-4 bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-linkedin-text-primary uppercase tracking-wider">
                        Candidate Profile on File
                      </span>
                      <Link
                        to="/profile"
                        onClick={onClose}
                        className="text-xs font-semibold text-linkedin-blue hover:underline inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Profile
                      </Link>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-linkedin-text-primary">
                        {user?.name || 'Student Candidate'}
                      </h4>
                      <p className="text-xs text-linkedin-text-secondary">
                        {user?.email || ''}
                      </p>
                    </div>

                    {/* Resume File Chip */}
                    <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-gray-200 text-xs">
                      <div className="w-8 h-8 rounded-md bg-blue-50 text-linkedin-blue flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-linkedin-text-primary truncate">
                          {resumeName}
                        </div>
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Verified Profile
                        </div>
                      </div>
                      <Link
                        to="/upload"
                        onClick={onClose}
                        className="text-xs font-semibold text-linkedin-blue hover:underline shrink-0"
                      >
                        Update
                      </Link>
                    </div>
                  </div>

                  {/* Top Matched Skills Preview */}
                  {matchedSkills.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-linkedin-text-primary">
                          Top Matched Skills for this Role ({matchedSkills.length})
                        </span>
                        {job?.match?.score && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                            {job.match.score}% Fit
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.slice(0, 6).map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-linkedin-blue space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Next: Add a note
                    </div>
                    <p className="text-[11px] text-blue-900/80 leading-relaxed">
                      Confirm your profile information above. You will be able to add an optional private note in the next step.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: Add Personal Note */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="apply-notes"
                      className="block text-xs font-bold text-linkedin-text-primary uppercase tracking-wider"
                    >
                      Personal Application Note (Optional)
                    </label>
                    <p className="text-xs text-linkedin-text-secondary">
                      Keep track of referral contacts, custom portfolio links, or key highlights for your own interview preparation.
                    </p>
                  </div>

                  <textarea
                    id="apply-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={1000}
                    placeholder="e.g., Referred by John Doe; highlighted React + AWS microservices project in application submission..."
                    className="w-full text-xs sm:text-sm p-3 bg-[#F9FAFB] border border-gray-300 rounded-xl text-linkedin-text-primary placeholder:text-gray-400 focus:bg-white focus:border-linkedin-blue focus:outline-none transition-all leading-relaxed resize-none"
                  />

                  <div className="flex justify-between items-center text-[11px] text-gray-400">
                    <span>{1000 - notes.length} characters left</span>
                    <span>Saved to your internal tracker</span>
                  </div>

                  {/* Explicit Non-Misleading Disclaimer */}
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Info className="w-3.5 h-3.5 text-amber-700" /> Private Tracker Note
                    </div>
                    <p className="text-[11px] text-amber-900/90 leading-relaxed">
                      This note is stored securely in your CareerLens dashboard for your personal reference. It is <strong>not</strong> transmitted to {companyName}.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: Confirm & Apply */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* Job Overview Card */}
                  <div className="p-4 bg-gray-50 border border-linkedin-border rounded-xl space-y-2">
                    <div className="text-xs font-bold text-linkedin-text-secondary uppercase">
                      Target Opportunity
                    </div>
                    <h4 className="text-base font-bold text-linkedin-text-primary">
                      {job?.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-linkedin-text-secondary font-medium">
                      <span className="flex items-center gap-1 font-semibold text-linkedin-text-primary">
                        <Building2 className="w-3.5 h-3.5 text-linkedin-blue" />
                        {companyName}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {job?.location || 'India'}
                      </span>
                    </div>
                  </div>

                  {/* Transparent Explanation Box */}
                  <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-linkedin-blue">
                      <ExternalLink className="w-4 h-4 text-linkedin-blue shrink-0" />
                      What happens when you click Apply:
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-blue-900/90 leading-relaxed pl-1">
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-linkedin-blue">1.</span>
                        <span>
                          <strong>{companyName}'s official job portal</strong> will open in a new tab for you to complete and submit your application.
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-linkedin-blue">2.</span>
                        <span>
                          CareerLens will simultaneously <strong>record this application in your dashboard</strong> so you can track interviews, offers, and deadlines.
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Submit Error banner if any */}
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!isAlreadyApplied && profile && (
          <div className="px-6 py-4 border-t border-linkedin-border bg-gray-50/70 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep((s) => s - 1)}
                disabled={submitting}
                icon={ChevronLeft}
              >
                Back
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep((s) => s + 1)}
                className="font-bold gap-1.5"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleFinalApply}
                loading={submitting}
                disabled={submitting}
                icon={ExternalLink}
                className="font-bold bg-linkedin-blue hover:bg-linkedin-blue-hover text-white shadow-sm"
              >
                {submitting ? 'Tracking...' : `Apply on ${companyName}'s site`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyModal;
