import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Sparkles,
  GraduationCap,
  Briefcase,
  Code2,
  UploadCloud,
  FileText,
  Clock,
  Target,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile: contextProfile, refreshProfile } = useAuth();

  const [profile, setProfile] = useState(contextProfile || null);
  const [loading, setLoading] = useState(!contextProfile);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      if (!contextProfile) setLoading(true);
      setError(null);
      const res = await api.get('/profile/me');
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('[ProfilePage] Error fetching profile:', err);
      setError(err.customMessage || 'Failed to load candidate profile.');
    } finally {
      setLoading(false);
    }
  }, [contextProfile]);

  useEffect(() => {
    if (contextProfile) {
      setProfile(contextProfile);
      setLoading(false);
    }
    fetchProfile();
  }, [fetchProfile, contextProfile]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" color="text-linkedin-blue" />
        <p className="text-sm font-medium text-linkedin-text-secondary">
          Loading your candidate profile...
        </p>
      </div>
    );
  }

  // Empty State: No Profile Uploaded Yet
  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-linkedin-border rounded-[12px] p-8 text-center shadow-sm space-y-5">
          <div className="w-20 h-20 rounded-full bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center mx-auto border border-linkedin-blue/30 shadow-sm">
            <FileText className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-linkedin-text-primary">
              No Resume Uploaded Yet
            </h2>
            <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-1.5 leading-relaxed">
              Upload your resume to extract your skills, coursework, and projects into a verified candidate profile.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/upload')}
              icon={UploadCloud}
              className="font-bold shadow-md"
            >
              Upload Resume (PDF)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header Banner & Profile Card */}
      <div className="bg-white border border-linkedin-border rounded-[12px] overflow-hidden shadow-sm">
        {/* Cover gradient banner */}
        <div className="h-32 bg-gradient-to-r from-[#0A66C2] via-[#004182] to-[#001D3D] relative" />

        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar and Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-14 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <div className="w-28 h-28 rounded-full bg-linkedin-blue text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-lg shrink-0">
                {getInitials(user?.name)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/upload')}
                icon={UploadCloud}
                className="font-semibold text-xs"
              >
                Re-upload Resume
              </Button>
            </div>
          </div>

          {/* User Details */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-linkedin-text-primary">
                {user?.name || 'Candidate'}
              </h1>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Profile
              </span>
            </div>

            <p className="text-sm sm:text-base text-linkedin-text-secondary mt-1 font-medium">
              {user?.tagline || (profile.preferredRoles?.[0] || 'Aspiring Software Engineer')}
            </p>

            <p className="text-xs text-linkedin-text-muted mt-0.5">
              {user?.email} &bull; Verified Profile
            </p>

            {/* Preferred Roles Pills */}
            {profile.preferredRoles && profile.preferredRoles.length > 0 && (
              <div className="mt-4 pt-3 border-t border-linkedin-border flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-linkedin-text-secondary flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-linkedin-blue" />
                  Target Roles:
                </span>
                {profile.preferredRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold text-linkedin-blue bg-linkedin-blue-light px-3 py-1 rounded-full border border-blue-200"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Skills Section */}
      <div className="bg-white border border-linkedin-border rounded-[12px] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-linkedin-border mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-linkedin-text-primary">
                Skills &amp; Technologies
              </h2>
              <p className="text-xs text-linkedin-text-secondary">
                {profile.skills?.length || 0} skills extracted from your resume
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            Verified
          </span>
        </div>

        {profile.skills && profile.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.skills.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs font-medium text-linkedin-text-primary bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-gray-200 px-3 py-1.5 rounded-full transition-colors select-none"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-linkedin-text-muted italic">No skills extracted.</p>
        )}
      </div>

      {/* 3. Education Section */}
      <div className="bg-white border border-linkedin-border rounded-[12px] p-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-linkedin-border mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-linkedin-text-primary">
              Education
            </h2>
            <p className="text-xs text-linkedin-text-secondary">
              Academic background and degrees
            </p>
          </div>
        </div>

        {profile.education && profile.education.length > 0 ? (
          <div className="space-y-4">
            {profile.education.map((edu, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-5 h-5 text-linkedin-text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-linkedin-text-primary">
                    {edu.institution || 'University / College'}
                  </h3>
                  <p className="text-xs font-medium text-linkedin-text-secondary mt-0.5">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-linkedin-text-muted italic">No education records found.</p>
        )}
      </div>

      {/* 4. Projects Section */}
      <div className="bg-white border border-linkedin-border rounded-[12px] p-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-linkedin-border mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-linkedin-text-primary">
              Key Projects
            </h2>
            <p className="text-xs text-linkedin-text-secondary">
              Extracted project portfolio and technical contributions
            </p>
          </div>
        </div>

        {profile.projects && profile.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-linkedin-border bg-[#FBFBFA] hover:shadow-sm transition-shadow flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-linkedin-text-primary">
                    {proj.name || `Project ${idx + 1}`}
                  </h3>
                  <p className="text-xs text-linkedin-text-secondary mt-1.5 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-200/60">
                    {proj.technologies.map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-semibold text-linkedin-blue bg-linkedin-blue-light px-2 py-0.5 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-linkedin-text-muted italic">No projects found on resume.</p>
        )}
      </div>

      {/* 5. Experience Section */}
      <div className="bg-white border border-linkedin-border rounded-[12px] p-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-linkedin-border mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-linkedin-text-primary">
              Experience &amp; Internships
            </h2>
            <p className="text-xs text-linkedin-text-secondary">
              Work history and industry experience
            </p>
          </div>
        </div>

        {profile.experience && profile.experience.length > 0 ? (
          <div className="space-y-4">
            {profile.experience.map((exp, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="w-5 h-5 text-linkedin-text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-linkedin-text-primary">
                    {exp.role || 'Role'}
                  </h3>
                  <p className="text-xs font-medium text-linkedin-text-secondary mt-0.5">
                    {exp.company} &bull; <span className="text-linkedin-text-muted">{exp.duration}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <p className="text-xs text-linkedin-text-secondary font-medium">
              No formal industry experience listed yet.
            </p>
            <p className="text-[11px] text-linkedin-text-muted mt-0.5">
              Most student profiles highlight personal projects, hackathons, and coursework for entry-level matching!
            </p>
          </div>
        )}
      </div>

      {/* 6. Resume File Metadata Card */}
      {profile.resumeId && (
        <div className="bg-white border border-linkedin-border rounded-[12px] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
              PDF
            </div>
            <div>
              <p className="font-bold text-linkedin-text-primary">
                {profile.resumeId.originalFileName || 'Resume.pdf'}
              </p>
              <p className="text-linkedin-text-muted text-[11px] mt-0.5">
                Uploaded {formatDate(profile.resumeId.uploadedAt || profile.updatedAt)} &bull; Status: {profile.resumeId.status || 'processed'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/upload')}
            icon={RefreshCw}
          >
            Update Resume
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
