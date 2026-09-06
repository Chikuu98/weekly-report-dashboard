import React from 'react';
import { AlertTriangle, UserCheck, Calendar } from 'lucide-react';
import { ReviewComment } from '../../types/report';

interface ManagerFeedbackBannerProps {
  comments?: ReviewComment[];
  currentVersion?: number;
}

export const ManagerFeedbackBanner: React.FC<ManagerFeedbackBannerProps> = ({
  comments = [],
}) => {
  const latestComment = comments.length > 0 ? comments[comments.length - 1] : null;

  if (!latestComment) return null;

  const formattedDate = latestComment.created_at
    ? new Date(latestComment.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Action Required: Needs Correction
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-400/80 font-medium">
                Version #{latestComment.version_number} Feedback
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              {latestComment.manager && (
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {latestComment.manager.name || latestComment.manager.email}
                </span>
              )}
              <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950/60 p-3.5 rounded-xl border border-amber-500/20 text-zinc-800 dark:text-zinc-200 text-sm font-normal leading-relaxed">
            "{latestComment.comment}"
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-300/80">
            💡 Please review the manager's comment above, update the necessary sections of your report below, and click <span className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Resubmit Report</span> when ready.
          </p>
        </div>
      </div>
    </div>
  );
};
