import React from 'react';

const Card = ({
  children,
  className = '',
  noPadding = false,
  onClick,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-[#141414] border border-linkedin-border rounded-[10px] shadow-sm overflow-hidden
        ${hoverable ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : ''}
        ${noPadding ? '' : 'p-4'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
