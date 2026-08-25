import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  UploadCloud,
  Briefcase,
  Target,
  ClipboardList,
  ArrowRight,
  CheckCircle,
  MapPin,
  Building2,
  Clock,
  ChevronRight,
  FileText,
  TrendingUp,
  BookOpen,
  Check,
} from 'lucide-react';

/* ─── Static illustrative job card data ────────────────────────────── */
const PREVIEW_JOB = {
  title: 'Frontend Engineer Intern',
  company: 'Stripe',
  location: 'Remote',
  type: 'Internship',
  score: 87,
  matchedSkills: ['React', 'TypeScript', 'Node.js', 'REST APIs'],
  missingSkills: ['GraphQL', 'AWS'],
};

/* ─── Score → colour helper (mirrors actual app logic) ─────────────── */
function scoreMeta(score) {
  if (score >= 80) return { ring: 'ring-emerald-500', bg: 'bg-emerald-500', label: 'High Match', labelCls: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (score >= 50) return { ring: 'ring-amber-400',   bg: 'bg-amber-400',   label: 'Good Match', labelCls: 'text-amber-700  bg-amber-50  border-amber-200'  };
  return             { ring: 'ring-gray-300',          bg: 'bg-gray-400',    label: 'Low Match',  labelCls: 'text-gray-600   bg-gray-100  border-gray-200'   };
}

/* ─── Inline product-preview card ──────────────────────────────────── */
function JobPreviewCard() {
  const meta = scoreMeta(PREVIEW_JOB.score);
  return (
    <div
      className="w-full max-w-sm bg-white rounded-2xl border border-linkedin-border shadow-linkedin-card overflow-hidden"
      role="img"
      aria-label="Example CareerLens job recommendation for Frontend Engineer Intern at Stripe"
    >
      {/* Card header bar */}
      <div className="px-5 py-3 bg-[#F3F2EF] border-b border-linkedin-border flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-400 block" />
        <span className="w-3 h-3 rounded-full bg-amber-400 block" />
        <span className="w-3 h-3 rounded-full bg-emerald-400 block" />
        <span className="ml-3 text-[11px] font-semibold text-linkedin-text-muted tracking-wide">CareerLens — Job Match</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-linkedin-text-primary leading-snug">
              {PREVIEW_JOB.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-linkedin-text-secondary">
              <Building2 className="w-3.5 h-3.5 text-linkedin-blue shrink-0" />
              <span className="font-semibold text-linkedin-text-primary">{PREVIEW_JOB.company}</span>
              <span className="text-gray-300">·</span>
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{PREVIEW_JOB.location}</span>
            </div>
          </div>

          {/* Match score ring */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <div
              className={`w-12 h-12 rounded-full ring-[3px] ${meta.ring} flex items-center justify-center`}
            >
              <span className="text-sm font-black text-linkedin-text-primary">{PREVIEW_JOB.score}%</span>
            </div>
            <span className="text-[10px] font-semibold text-linkedin-text-muted">Match</span>
          </div>
        </div>

        {/* Meta pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.labelCls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.bg}`} />
            {meta.label}
          </span>
          <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
            {PREVIEW_JOB.type}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-linkedin-text-muted">
            <Clock className="w-3 h-3" />
            Posted 2 days ago
          </span>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-linkedin-text-secondary uppercase tracking-wider">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {PREVIEW_JOB.matchedSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                {s}
              </span>
            ))}
            {PREVIEW_JOB.missingSkills.map((s) => (
              <span
                key={s}
                className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-dashed border-gray-300 px-2 py-0.5 rounded-md"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-linkedin-text-muted">
            <span className="font-semibold text-emerald-700">{PREVIEW_JOB.matchedSkills.length} matched</span>
            {' · '}
            <span className="font-semibold text-amber-600">{PREVIEW_JOB.missingSkills.length} to learn</span>
          </p>
        </div>

        {/* Action row */}
        <div className="pt-1 flex items-center justify-between border-t border-linkedin-border">
          <span className="text-[11px] text-linkedin-text-muted">87/100 overall fit</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-bold text-linkedin-blue hover:text-linkedin-blue-hover transition-colors"
            tabIndex={-1}
            aria-hidden="true"
          >
            View Job <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  /* CTA targets — /jobs is protected so unauthenticated users hit /register */
  const uploadCTA   = '/register';
  const exploresCTA = '/register';

  /* ── Section: How it works ── */
  const steps = [
    {
      icon: UploadCloud,
      number: '01',
      title: 'Upload your resume',
      body: 'Drop your PDF resume. CareerLens extracts your skills, projects, and experience automatically.',
    },
    {
      icon: Sparkles,
      number: '02',
      title: 'Get personalized matches',
      body: 'Jobs are ranked by a weighted match score that reflects your actual technical profile.',
    },
    {
      icon: Target,
      number: '03',
      title: 'Close skill gaps',
      body: 'See exactly what you\'re missing for each role, then follow a targeted learning roadmap.',
    },
  ];

  /* ── Section: Capabilities ── */
  const capabilities = [
    {
      icon: FileText,
      color: 'bg-blue-50 text-linkedin-blue border-blue-100',
      title: 'Resume Intelligence',
      body: 'Structured skill extraction from your PDF — no manual tagging, no guesswork.',
    },
    {
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      title: 'Personalized Job Matching',
      body: 'Weighted scoring across skills, projects, experience, education, and location for every role.',
    },
    {
      icon: Target,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      title: 'Skill Gap Insights',
      body: 'Every job card shows what you already have and what you\'d need to strengthen your application.',
    },
    {
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      title: 'Learning Roadmaps',
      body: 'Week-by-week, project-backed plans to close the gaps between your current skills and the role requirements.',
    },
    {
      icon: ClipboardList,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      title: 'Application Tracking',
      body: 'Keep every application organized across stages — from applied to offer — in one place.',
    },
    {
      icon: Briefcase,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      title: 'Real Job Listings',
      body: 'Live tech internships and entry-level roles pulled from real postings, matched to your profile.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-linkedin-text-primary flex flex-col font-sans">

      {/* ──────────────────────────────────────────────────────────────
          HEADER / NAV
      ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-linkedin-border shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0" aria-label="CareerLens home">
            <div className="w-8 h-8 rounded-[6px] bg-linkedin-blue flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:bg-linkedin-blue-hover transition-colors">
              CL
            </div>
            <span className="font-bold text-lg text-linkedin-blue tracking-tight">
              Career<span className="text-linkedin-text-primary">Lens</span>
            </span>
          </Link>

          {/* Nav actions */}
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-linkedin-text-secondary hover:text-linkedin-text-primary px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs sm:text-sm font-bold bg-linkedin-blue text-white px-4 py-2 rounded-lg hover:bg-linkedin-blue-hover transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────
          MAIN
      ────────────────────────────────────────────────────────────── */}
      <main className="flex-1">

        {/* ── 1. HERO ─────────────────────────────────────────────── */}
        <section className="bg-white" aria-labelledby="hero-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Left: copy */}
              <div className="space-y-6 text-center lg:text-left">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linkedin-blue-light border border-blue-200 text-linkedin-blue text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>For students &amp; early-career engineers</span>
                </div>

                {/* Headline */}
                <h1
                  id="hero-heading"
                  className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-linkedin-text-primary tracking-tight leading-[1.15]"
                >
                  Find jobs that{' '}
                  <span className="text-linkedin-blue">match your skills.</span>
                </h1>

                {/* Supporting copy */}
                <p className="text-sm sm:text-[15px] text-linkedin-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Upload your resume to discover relevant roles, understand your match score, identify skill gaps, and build a clear path toward your next opportunity.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                  <Link
                    to={uploadCTA}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-linkedin-blue text-white text-sm font-bold hover:bg-linkedin-blue-hover transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:ring-offset-2"
                  >
                    <UploadCloud className="w-4 h-4" aria-hidden="true" />
                    Upload Resume
                  </Link>
                  <Link
                    to={exploresCTA}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-linkedin-border bg-white text-linkedin-text-primary text-sm font-semibold hover:bg-gray-50 hover:border-linkedin-blue/40 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  >
                    <Briefcase className="w-4 h-4 text-linkedin-blue" aria-hidden="true" />
                    Explore Jobs
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-linkedin-text-secondary">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Resume analysis</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-linkedin-text-secondary">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Personalized match scores</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-linkedin-text-secondary">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Application tracking</span>
                  </div>
                </div>
              </div>

              {/* Right: product preview */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  <JobPreviewCard />
                  {/* Decorative blur blob — pure visual, hidden from AT */}
                  <div
                    className="absolute -z-10 -bottom-6 -right-6 w-48 h-48 rounded-full bg-linkedin-blue/8 blur-2xl"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute -z-10 -top-4 -left-4 w-32 h-32 rounded-full bg-emerald-400/10 blur-xl"
                    aria-hidden="true"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 2. DIVIDER / SECTION BREAK ─────────────────────────── */}
        <div className="border-t border-linkedin-border" aria-hidden="true" />

        {/* ── 3. HOW IT WORKS ─────────────────────────────────────── */}
        <section className="bg-[#F8F9FA]" aria-labelledby="how-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
            <div className="text-center mb-10">
              <h2
                id="how-heading"
                className="text-2xl sm:text-3xl font-bold text-linkedin-text-primary"
              >
                How CareerLens works
              </h2>
              <p className="text-sm text-linkedin-text-secondary mt-2 max-w-md mx-auto">
                Three steps from your resume to a clear, personalized career path.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
              {/* Connector line (desktop only) */}
              <div
                className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-linkedin-border"
                aria-hidden="true"
              />

              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="relative bg-white border border-linkedin-border rounded-xl p-6 shadow-sm text-center flex flex-col items-center gap-3"
                  >
                    {/* Step bubble */}
                    <div className="w-10 h-10 rounded-full bg-linkedin-blue text-white font-black text-sm flex items-center justify-center shadow-sm z-10">
                      {step.number}
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-linkedin-blue-light text-linkedin-blue flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-bold text-linkedin-text-primary">{step.title}</h3>
                    <p className="text-xs text-linkedin-text-secondary leading-relaxed">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. CAPABILITIES ─────────────────────────────────────── */}
        <section className="bg-white border-t border-linkedin-border" aria-labelledby="capabilities-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
            <div className="text-center mb-10">
              <h2
                id="capabilities-heading"
                className="text-2xl sm:text-3xl font-bold text-linkedin-text-primary"
              >
                Everything you need to find the right role
              </h2>
              <p className="text-sm text-linkedin-text-secondary mt-2 max-w-lg mx-auto">
                CareerLens gives you clear, evidence-based intelligence for every step of the job search.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {capabilities.map((cap, idx) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={idx}
                    className="border border-linkedin-border rounded-xl p-5 bg-[#FAFAFA] hover:bg-white hover:shadow-linkedin-hover hover:border-linkedin-blue/30 transition-all duration-150 flex gap-4"
                  >
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${cap.color}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-linkedin-text-primary mb-1">{cap.title}</h3>
                      <p className="text-xs text-linkedin-text-secondary leading-relaxed">{cap.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 5. FINAL CTA ─────────────────────────────────────────── */}
        <section className="bg-[#F3F2EF] border-t border-linkedin-border" aria-labelledby="cta-heading">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-5">
            <h2
              id="cta-heading"
              className="text-2xl sm:text-3xl font-extrabold text-linkedin-text-primary tracking-tight"
            >
              Know exactly where you stand — before you apply.
            </h2>
            <p className="text-sm text-linkedin-text-secondary max-w-lg mx-auto leading-relaxed">
              Upload your resume and CareerLens will show you your match score, skill gaps, and a targeted learning plan for every role you care about.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to={uploadCTA}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-linkedin-blue text-white text-sm font-bold hover:bg-linkedin-blue-hover transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:ring-offset-2"
              >
                <UploadCloud className="w-4 h-4" aria-hidden="true" />
                Upload Resume
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to={exploresCTA}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-linkedin-border bg-white text-linkedin-text-primary text-sm font-semibold hover:bg-white hover:border-linkedin-blue/40 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                Explore Jobs
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ──────────────────────────────────────────────────────────────
          FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-linkedin-border" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">

            {/* Brand block */}
            <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[4px] bg-linkedin-blue text-white text-[10px] font-black flex items-center justify-center">
                  CL
                </div>
                <span className="text-sm font-bold text-linkedin-blue tracking-tight">
                  Career<span className="text-linkedin-text-primary">Lens</span>
                </span>
              </div>
              <p className="text-xs text-linkedin-text-muted max-w-xs">
                Resume-driven job matching, skill gap insights, and learning roadmaps for students and early-career engineers.
              </p>
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2" aria-label="Footer navigation">
              <Link to="/login"    className="text-xs text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors">Sign In</Link>
              <Link to="/register" className="text-xs text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors">Get Started</Link>
            </nav>

          </div>

          <div className="mt-6 pt-5 border-t border-linkedin-border text-center text-xs text-linkedin-text-muted">
            CareerLens &copy; {new Date().getFullYear()} &bull; Student Career Platform
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
