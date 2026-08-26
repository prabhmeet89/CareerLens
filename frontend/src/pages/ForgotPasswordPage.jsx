import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/auth/AuthCard';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import api from '../api/axiosClient';
import { Mail, ArrowLeft, CheckCircle2, Send } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Email address is required.');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setIsSubmitted(true);
    } catch (err) {
      // Even if network or server error, handle gracefully
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to send reset email. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="Enter the email associated with your CareerLens account and we'll send you a reset link."
      footerPrompt="Remembered your password?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
      error={error}
    >
      {isSubmitted ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-emerald-950">Check your email</p>
              <p className="text-emerald-800 leading-relaxed">
                If an account exists for <span className="font-semibold text-emerald-950">{email}</span>, you will receive a password reset link shortly.
              </p>
              <p className="text-emerald-700 text-xs pt-1">
                Be sure to check your spam/junk folder if it doesn't appear within a minute.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
            >
              Try another email address
            </Button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-linkedin-blue hover:text-linkedin-blue-hover py-2 text-center"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="forgot-email"
            name="email"
            label="Email"
            type="email"
            placeholder="student@university.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            error={error}
            required
            autoComplete="email"
            icon={Mail}
            autoFocus
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              icon={Send}
            >
              Send Reset Link
            </Button>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-linkedin-text-secondary hover:text-linkedin-blue transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
};

export default ForgotPasswordPage;
