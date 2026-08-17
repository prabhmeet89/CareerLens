import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
          {required && <span className="text-red-500 ml-1">*</span>}
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
            w-full px-3 py-2 text-sm bg-white text-linkedin-text-primary rounded-[4px]
            border transition-all duration-150
            placeholder:text-linkedin-text-muted
            focus:outline-none focus:ring-1
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${Icon ? 'pl-9' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-900 bg-red-50/20'
                : 'border-[#00000040] hover:border-[#00000080] focus:border-linkedin-blue focus:ring-linkedin-blue'
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
              <Eye className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5" role="alert">
          <span>⚠️</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-linkedin-text-secondary mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
