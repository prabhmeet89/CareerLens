import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-[#141414] border-t border-linkedin-border py-8 text-xs text-linkedin-text-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Mission */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-linkedin-blue text-white font-black text-xs flex items-center justify-center">
            CL
          </div>
          <span className="font-bold text-linkedin-text-primary">CareerLens</span>
          <span className="text-gray-300 dark:text-[#333333]">|</span>
          <span className="text-linkedin-text-muted">Personalized Career Intelligence</span>
        </div>

        {/* Legal & Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
          <Link
            to="/jobs"
            className="hover:text-linkedin-blue transition-colors"
          >
            Explore Jobs
          </Link>

          <Link
            to="/privacy"
            className="inline-flex items-center gap-1 hover:text-linkedin-blue transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-linkedin-blue" />
            <span>Privacy Policy</span>
          </Link>

          <Link
            to="/terms"
            className="hover:text-linkedin-blue transition-colors"
          >
            Terms of Service
          </Link>

          <a
            href="mailto:support@careerlens.io"
            className="hover:text-linkedin-blue transition-colors"
          >
            Support
          </a>
        </div>

        {/* Copyright */}
        <div className="text-linkedin-text-muted text-[11px]">
          &copy; {new Date().getFullYear()} CareerLens. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
