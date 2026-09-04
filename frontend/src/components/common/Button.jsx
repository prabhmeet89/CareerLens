import React from 'react';
import Spinner from './Spinner';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-[#141414]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-full gap-1.5',
    md: 'text-sm px-4 py-2 rounded-full gap-2',
    lg: 'text-base px-6 py-2.5 rounded-full gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-linkedin-blue text-white hover:bg-linkedin-blue-hover active:bg-linkedin-blue-hover focus:ring-linkedin-blue shadow-sm border border-transparent',
    secondary:
      'bg-transparent text-linkedin-blue border border-linkedin-blue hover:bg-linkedin-accent-light active:bg-linkedin-accent-light focus:ring-linkedin-blue',
    outline:
      'bg-white dark:bg-transparent text-linkedin-text-primary border border-linkedin-border hover:bg-gray-50 dark:hover:bg-[#1A1A1A] active:bg-gray-100 dark:active:bg-[#222222] focus:ring-gray-300 dark:focus:ring-[#3A3A3A]',
    ghost:
      'bg-transparent text-linkedin-text-secondary hover:text-linkedin-text-primary hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 focus:ring-gray-300 dark:focus:ring-[#3A3A3A]',
    danger:
      'bg-linkedin-danger text-white hover:bg-red-700 dark:hover:bg-red-600 active:bg-red-800 dark:active:bg-red-700 focus:ring-linkedin-danger border border-transparent',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <Spinner
          size="sm"
          color={variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-linkedin-blue'}
        />
      )}
      {!isLoading && Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
