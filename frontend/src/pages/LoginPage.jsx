import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/auth/AuthCard';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Mail, Lock, LogIn } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear any global errors on component mount or field change
  useEffect(() => {
    clearError();
  }, [clearError]);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear inline error when typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login(formData.email.trim(), formData.password);
    setIsSubmitting(false);

    if (result.success) {
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    }
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle="Stay updated on your AI role matches and student opportunities"
      footerPrompt="New to Resume2Role?"
      footerLinkText="Join now"
      footerLinkHref="/register"
      error={authError}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          name="email"
          label="Email"
          type="email"
          placeholder="student@university.edu"
          value={formData.email}
          onChange={handleChange}
          error={formErrors.email}
          required
          autoComplete="email"
          icon={Mail}
        />

        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          required
          autoComplete="current-password"
          icon={Lock}
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-linkedin-text-secondary">
            <input
              type="checkbox"
              defaultChecked
              className="rounded text-linkedin-blue focus:ring-linkedin-blue"
            />
            <span>Remember me</span>
          </label>
          <a
            href="#forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert('Password reset will be available in Phase 2.');
            }}
            className="text-linkedin-blue font-semibold hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            icon={LogIn}
          >
            Sign in
          </Button>
        </div>
      </form>
    </AuthCard>
  );
};

export default LoginPage;
