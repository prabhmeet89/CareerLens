import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  FileText,
  TrendingUp,
  Target,
  Compass,
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  BrainCircuit,
  Briefcase,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import heroImg from '../assets/hero.png';

const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();

  // If already authenticated and not loading, redirect to dashboard
  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: FileText,
      title: 'Resume Parsing',
      description: 'Upload your PDF resume to extract structured technical skills, project stacks, and education automatically.',
      color: 'bg-blue-50 text-linkedin-blue border-blue-100',
    },
    {
      icon: TrendingUp,
      title: '5-Factor Weighted Matching',
      description: 'Transparent candidate-job fit scoring across Skills (50%), Projects (20%), Experience (15%), Education (10%), and Location (5%).',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      icon: Target,
      title: 'Skill Gap Breakdown',
      description: 'Instantly view matched competencies alongside missing requirements for every internship and full-time role.',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      icon: Compass,
      title: 'Personalized Learning Roadmaps',
      description: 'Targeted 3-6 week project-backed curriculum designed to close critical skill gaps for your top matched jobs.',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
  ];

  const steps = [
    {
      number: '01',
      icon: UploadCloud,
      title: 'Upload Resume',
      description: 'Drop your standard PDF resume into our secure parsing pipeline.',
    },
    {
      number: '02',
      icon: BrainCircuit,
      title: 'Profile Generation',
      description: 'Automatically structure your technical stack and index verified competencies.',
    },
    {
      number: '03',
      icon: Target,
      title: 'Explore Matches',
      description: 'Review curated tech opportunities dynamically ranked by quantitative fit score.',
    },
    {
      number: '04',
      icon: Briefcase,
      title: 'Track & Accelerate',
      description: 'Track submissions through Kanban stages and follow actionable skill roadmaps.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F3F2EF] text-linkedin-text-primary flex flex-col font-sans">
      {/* ─── Top Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-linkedin-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-[4px] bg-linkedin-blue flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-linkedin-blue-hover transition-colors">
              <span>CL</span>
            </div>
            <span className="font-bold text-lg text-linkedin-blue tracking-tight">
              Career<span className="text-linkedin-text-primary">Lens</span>
            </span>
          </Link>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-linkedin-text-secondary hover:text-linkedin-text-primary px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs sm:text-sm font-semibold bg-linkedin-blue text-white px-4 py-1.5 rounded-full hover:bg-linkedin-blue-hover transition-colors shadow-sm"
            >
              Join Now
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main Content ───────────────────────────────────────── */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-linkedin-blue text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Career Intelligence for Students</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-linkedin-text-primary tracking-tight leading-[1.15]">
                Find jobs and internships that{' '}
                <span className="text-linkedin-blue">actually match</span> your skills
              </h1>

              <p className="text-sm sm:text-base text-linkedin-text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed">
                CareerLens parses your student resume to extract verified competencies, calculate weighted job fit scores, and build personalized skill acceleration roadmaps.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-linkedin-blue text-white text-sm font-bold hover:bg-linkedin-blue-hover transition-all shadow-md hover:shadow-lg"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-linkedin-border bg-white text-linkedin-text-primary text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span>Log In to Account</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-linkedin-text-muted">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>No data sold</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Instant parsing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-linkedin-blue" />
                  <span>100% Free for students</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-white border border-linkedin-border rounded-2xl p-4 shadow-linkedin-card overflow-hidden">
                <img
                  src={heroImg}
                  alt="CareerLens Job Matching Interface Preview"
                  className="w-full h-auto rounded-xl object-cover shadow-sm border border-gray-100"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm border border-linkedin-border rounded-xl p-3.5 shadow-lg flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                    94%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-linkedin-text-primary truncate">
                      Full Stack Engineer Intern
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      High Skill &amp; Project Alignment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Feature Highlights Section */}
        <section className="bg-white border-y border-linkedin-border py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-linkedin-text-primary">
                Built specifically for student tech careers
              </h2>
              <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-2">
                Traditional job boards treat student resumes like black boxes. CareerLens gives you deep, transparent intelligence into every application.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="bg-[#F9FAFB] border border-linkedin-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 ${f.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-linkedin-text-primary mb-2">
                        {f.title}
                      </h3>
                      <p className="text-xs text-linkedin-text-secondary leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. How It Works Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-linkedin-text-primary">
              How CareerLens Works
            </h2>
            <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-2">
              Four automated steps from raw PDF to ranked opportunities and targeted growth plans.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-linkedin-border rounded-xl p-5 shadow-sm relative group hover:border-linkedin-blue transition-colors"
                >
                  <div className="text-[11px] font-black text-linkedin-blue bg-linkedin-blue-light/50 px-2 py-0.5 rounded-full inline-block mb-3">
                    Step {s.number}
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-linkedin-text-primary mb-3 group-hover:bg-blue-50 group-hover:text-linkedin-blue group-hover:border-blue-200 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-linkedin-text-primary mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-linkedin-text-secondary leading-relaxed">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Final CTA Banner */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <div className="bg-linkedin-blue rounded-2xl p-8 sm:p-12 text-white shadow-xl text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Ready to find your next tech internship or role?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
              Join students who use CareerLens to discover best-fit opportunities and level up their skill sets with personalized career guidance.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-linkedin-blue text-sm font-bold hover:bg-gray-100 transition-colors shadow-md"
              >
                <span>Create Your Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-linkedin-border py-6 text-center text-xs text-linkedin-text-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-linkedin-blue text-sm">
            <div className="w-5 h-5 rounded bg-linkedin-blue text-white text-[10px] flex items-center justify-center font-bold">
              CL
            </div>
            <span>CareerLens</span>
          </div>
          <p>
            CareerLens &copy; {new Date().getFullYear()} &bull; Student Career Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
