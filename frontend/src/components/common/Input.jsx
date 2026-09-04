import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Input = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  autoComplete,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="text-xs font-semibold text-linkedin-text-primary tracking-tight"
        >
          {label}
          {required && <span className="text-linkedin-danger ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-linkedin-text-secondary pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={id || name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            w-full px-3 py-2 text-sm bg-white dark:bg-[#141414] text-linkedin-text-primary rounded-[4px]
            border transition-all duration-150
            placeholder:text-linkedin-text-muted
            focus:outline-none focus:ring-1
            disabled:bg-gray-50 dark:disabled:bg-[#1A1A1A] disabled:text-gray-400 dark:disabled:text-[#555555] disabled:cursor-not-allowed
            ${Icon ? 'pl-9' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${
              error
                ? 'border-linkedin-danger focus:border-linkedin-danger focus:ring-linkedin-danger text-linkedin-danger dark:text-red-300 bg-linkedin-danger-bg/20 dark:bg-linkedin-danger-bg'
                : 'border-[#00000040] dark:border-[#ffffff18] hover:border-[#00000080] dark:hover:border-[#ffffff30] focus:border-linkedin-blue focus:ring-linkedin-blue'
            }
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 text-linkedin-text-secondary hover:text-linkedin-text-primary text-xs font-semibold focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-linkedin-blue" />
            ) : (
              <Eye className="w-4 h-4 text-linkedin-text-muted" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-linkedin-danger font-medium flex items-center gap-1.5 mt-0.5" role="alert">
          <AlertCircle className="w-3.5 h-3.5 text-linkedin-danger shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-linkedin-text-secondary mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
