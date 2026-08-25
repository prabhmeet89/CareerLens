import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Lock, Database, UserCheck, HelpCircle, ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-[#F4F2EE] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-linkedin-text-secondary hover:text-linkedin-blue mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CareerLens Home</span>
        </Link>

        {/* Policy Header Card */}
        <div className="bg-white border border-linkedin-border rounded-2xl p-6 sm:p-10 shadow-xs mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-linkedin-blue text-xs font-bold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy & Data Handling</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-linkedin-text-primary tracking-tight">
            How CareerLens Protects Your Privacy
          </h1>

          <p className="text-xs sm:text-sm text-linkedin-text-secondary mt-3 leading-relaxed">
            CareerLens is built to help candidates discover job opportunities through automated skill extraction and personalized matching. This document explains plainly what information we collect, how it is processed, where it is stored, and how you retain full control over your data.
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-6 text-xs text-linkedin-text-muted">
            <span><strong>Effective Date:</strong> August 25, 2026</span>
            <span><strong>Last Updated:</strong> August 25, 2026</span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-linkedin-text-primary text-sm sm:text-base leading-relaxed">
          {/* Section 1: Information We Collect */}
          <section className="bg-white border border-linkedin-border rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-linkedin-blue font-bold text-lg">
              <Database className="w-5 h-5" />
              <h2>1. Information We Collect</h2>
            </div>

            <p className="text-xs sm:text-sm text-linkedin-text-secondary">
              We collect only the data necessary to provide personalized job discovery and application tracking:
            </p>

            <ul className="list-disc pl-5 text-xs sm:text-sm text-linkedin-text-secondary space-y-2">
              <li>
                <strong>Account Credentials:</strong> Your name, email address, and a securely salted and hashed password used exclusively for authenticated access.
              </li>
              <li>
                <strong>Uploaded Resume Files:</strong> PDF resume documents uploaded by you to extract skills, project stacks, and work history.
              </li>
              <li>
                <strong>Extracted Candidate Profile:</strong> Structured data parsed from your resume (skills list, education entries, project descriptions, and inferred experience levels).
              </li>
              <li>
                <strong>Application & Activity Records:</strong> Jobs you save, applications you submit through CareerLens, personal interview notes, and notification preferences.
              </li>
            </ul>
          </section>

          {/* Section 2: How We Use Your Data */}
          <section className="bg-white border border-linkedin-border rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-linkedin-blue font-bold text-lg">
              <FileText className="w-5 h-5" />
              <h2>2. Purpose and AI Analysis Disclosure</h2>
            </div>

            <p className="text-xs sm:text-sm text-linkedin-text-secondary leading-relaxed">
              Your resume text is parsed using automated language models (Google Gemini API) to extract technical skills and generate candidate profile summaries.
            </p>

            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 leading-relaxed">
              <strong>AI Disclosure:</strong> Automated AI text parsing and match explanations are provided as informational tools to assist your job search. They do not constitute formal hiring guarantees or professional career advisory. Always review your extracted profile to ensure technical skills and experience levels are accurate.
            </div>

            <p className="text-xs sm:text-sm text-linkedin-text-secondary">
              CareerLens never sells your resume or personal details to data brokers or advertisers.
            </p>
          </section>

          {/* Section 3: Storage & Security */}
          <section className="bg-white border border-linkedin-border rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-linkedin-blue font-bold text-lg">
              <Lock className="w-5 h-5" />
              <h2>3. Data Storage & Security Controls</h2>
            </div>

            <ul className="list-disc pl-5 text-xs sm:text-sm text-linkedin-text-secondary space-y-2">
              <li>
                <strong>File Storage:</strong> Resumes are stored on secure local server storage or authenticated cloud asset storage (Cloudinary) with access restricted to your account.
              </li>
              <li>
                <strong>Authentication:</strong> Sessions use secure HTTP-only cookies to prevent client-side script interception (XSS cookie theft).
              </li>
              <li>
                <strong>Ownership Verification:</strong> All profile, application, and resume routes enforce strict server-side ownership verification based on your authenticated user ID.
              </li>
            </ul>
          </section>

          {/* Section 4: Your Data Rights and Deletion */}
          <section className="bg-white border border-linkedin-border rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-linkedin-blue font-bold text-lg">
              <UserCheck className="w-5 h-5" />
              <h2>4. Your Data Deletion & Erasure Rights</h2>
            </div>

            <p className="text-xs sm:text-sm text-linkedin-text-secondary">
              You maintain full ownership of your data and can exercise the following options at any time from your Profile settings:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="border border-gray-200 rounded-lg p-4 space-y-1.5 bg-gray-50/60">
                <h3 className="font-bold text-xs sm:text-sm text-linkedin-text-primary">
                  Option 1: Delete Resume & Profile
                </h3>
                <p className="text-xs text-linkedin-text-secondary">
                  Permanently deletes your uploaded PDF resume file, extracted profile data, and cached AI match explanations. Keeps your user account, saved jobs, and application tracking history intact.
                </p>
              </div>

              <div className="border border-red-200 rounded-lg p-4 space-y-1.5 bg-red-50/40">
                <h3 className="font-bold text-xs sm:text-sm text-red-900">
                  Option 2: Delete Entire Account
                </h3>
                <p className="text-xs text-red-700">
                  Permanently deletes your user account, stored resume files, profile, applications, saved jobs, notifications, and revokes your active session.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Contact Information */}
          <section className="bg-white border border-linkedin-border rounded-xl p-6 sm:p-8 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-linkedin-blue font-bold text-lg">
              <HelpCircle className="w-5 h-5" />
              <h2>5. Contact & Privacy Inquiries</h2>
            </div>

            <p className="text-xs sm:text-sm text-linkedin-text-secondary">
              If you have questions regarding our privacy practices or data handling, please contact our team at{' '}
              <a
                href="mailto:support@careerlens.io"
                className="text-linkedin-blue font-bold hover:underline"
              >
                support@careerlens.io
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
