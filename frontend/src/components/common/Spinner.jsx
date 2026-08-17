import React from 'react';

const Spinner = ({ size = 'md', className = '', color = 'text-linkedin-blue' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClasses[size] || sizeClasses.md} ${color} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
