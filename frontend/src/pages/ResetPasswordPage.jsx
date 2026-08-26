import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/auth/AuthCard';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import api from '../api/axiosClient';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Missing token or email parameter
  if (!token || !email) {
    return (
      <AuthCard
        title="Invalid Reset Link"
        subtitle="This password reset link is invalid or incomplete."
        footerPrompt="Need help?"
        footerLinkText="Sign in"
        footerLinkHref="/login"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-red-950">Missing Reset Token</p>
              <p className="text-red-800 leading-relaxed">
                The password reset link you followed is missing required security parameters. Please request a fresh reset link.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/forgot-password')}
            icon={RefreshCw}
          >
            Request New Reset Link
          </Button>
        </div>
      </AuthCard>
    );
  }

  const validate = () => {
    const errors = {};

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        token: token.trim(),
        newPassword: formData.newPassword,
      });

      setIsSuccess(true);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to reset password. The link may have expired.';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create new password"
      subtitle={`Choose a secure new password for ${email}`}
      footerPrompt="Remember your password?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
      error={apiError}
    >
      {isSuccess ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-emerald-950">Password reset complete</p>
              <p className="text-emerald-800 leading-relaxed">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/login', { replace: true })}
              icon={ArrowRight}
            >
              Sign In to CareerLens
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="newPassword"
            name="newPassword"
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
            value={formData.newPassword}
            onChange={handleChange}
            error={formErrors.newPassword}
            required
            autoComplete="new-password"
            icon={Lock}
            autoFocus
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter your new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formErrors.confirmPassword}
            required
            autoComplete="new-password"
            icon={Lock}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              icon={Lock}
            >
              Reset Password
            </Button>
          </div>

          {apiError && (
            <div className="text-center pt-2">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-linkedin-blue hover:text-linkedin-blue-hover underline"
              >
                Request a new password reset link
              </Link>
            </div>
          )}
        </form>
      )}
    </AuthCard>
  );
};

export default ResetPasswordPage;
