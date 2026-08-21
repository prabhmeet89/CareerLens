import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/auth/AuthCard';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Passwords must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await register(
      formData.name.trim(),
      formData.email.trim(),
      formData.password
    );
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <AuthCard
      title="Make the most of your professional life"
      subtitle="Join CareerLens to unlock AI job matching and skill gap insights"
      footerPrompt="Already on CareerLens?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
      error={authError}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="name"
          name="name"
          label="Full Name"
          type="text"
          placeholder="e.g. Alex Chen"
          value={formData.name}
          onChange={handleChange}
          error={formErrors.name}
          required
          autoComplete="name"
          icon={User}
        />

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
          label="Password (8+ characters)"
          type="password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          required
          autoComplete="new-password"
          icon={Lock}
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={formErrors.confirmPassword}
          required
          autoComplete="new-password"
          icon={Lock}
        />

        <p className="text-[11px] text-linkedin-text-muted leading-relaxed">
          By clicking Agree &amp; Join, you agree to the CareerLens User Agreement, Privacy Policy, and Cookie Policy.
        </p>

        <div className="pt-1">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            icon={UserPlus}
          >
            Agree &amp; Join
          </Button>
        </div>
      </form>
    </AuthCard>
  );
};

export default RegisterPage;
