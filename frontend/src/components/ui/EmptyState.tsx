import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`py-16 flex flex-col items-center justify-center text-center space-y-4 ${className}`}
    >
      {icon && (
        <div className="text-zinc-300 dark:text-zinc-600 opacity-80">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{title}</p>
        {description && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
