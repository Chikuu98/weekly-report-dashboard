import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, FileCheck2 } from 'lucide-react';
import type { ReportStatus } from '../../types/report';

interface StatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

const statusConfig: Record<
  ReportStatus,
  { icon: React.ElementType; label: string; classes: string }
> = {
  approved: {
    icon: CheckCircle2,
    label: 'Approved',
    classes:
      'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-500/30',
  },
  needs_correction: {
    icon: AlertTriangle,
    label: 'Needs Correction',
    classes:
      'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 dark:border-amber-500/30',
  },
  submitted: {
    icon: Clock,
    label: 'Submitted',
    classes:
      'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400 dark:border-sky-500/30',
  },
  draft: {
    icon: FileCheck2,
    label: 'Draft',
    classes:
      'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${config.classes} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {config.label}
    </span>
  );
};
