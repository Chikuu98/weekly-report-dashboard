import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'w-5 h-5 border-2',
  md: 'w-7 h-7 border-[3px]',
  lg: 'w-10 h-10 border-4',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'md',
  fullPage = false,
}) => {
  const content = (
    <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-3.5 rounded-2xl shadow-sm">
      <div
        className={`${sizeClasses[size]} border-primary-500 border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{message}</span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        {content}
      </div>
    );
  }

  return content;
};
