import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  valueClass?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  iconBgClass = 'bg-primary-500/10 text-primary-500 border-primary-500/20 dark:text-primary-400',
  valueClass = 'text-zinc-900 dark:text-white',
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p className={`text-3xl font-bold font-mono ${valueClass}`}>{value}</p>
        {subtext && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{subtext}</p>
        )}
      </div>
      <div
        className={`p-3 rounded-2xl border shrink-0 ${iconBgClass}`}
      >
        {icon}
      </div>
    </div>
  );
};
