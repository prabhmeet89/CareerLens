import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, Briefcase, ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linkedin-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="bg-white border border-linkedin-border rounded-2xl p-8 sm:p-12 shadow-sm w-full space-y-6">
          <div className="w-20 h-20 bg-linkedin-blue/10 text-linkedin-blue rounded-full flex items-center justify-center mx-auto">
            <Compass className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-linkedin-blue uppercase tracking-widest bg-linkedin-blue/10 px-3 py-1 rounded-full">
              404 Error
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-linkedin-text-primary">
              Page Not Found
            </h1>
            <p className="text-xs sm:text-sm text-linkedin-text-secondary max-w-md mx-auto leading-relaxed">
              We couldn't find the page you were looking for. It might have been moved, renamed, or is temporarily unavailable.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 text-xs sm:text-sm font-semibold text-linkedin-text-primary hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-linkedin-blue text-white text-xs sm:text-sm font-semibold hover:bg-linkedin-blue-hover transition-colors shadow-sm"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>

            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-linkedin-blue/30 text-xs sm:text-sm font-semibold text-linkedin-blue hover:bg-linkedin-blue-light transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              Explore Jobs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
