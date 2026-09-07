import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  as?: React.ElementType;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  as: Component = 'div',
}) => {
  return (
    <Component
      className={`bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </Component>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div
    className={`flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4 ${className}`}
  >
    {children}
  </div>
);
