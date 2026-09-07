import React, { useState } from 'react';
import { AlertTriangle, UserCheck, Calendar, History, ChevronDown, ChevronUp } from 'lucide-react';
import { ReviewComment } from '../../types/report';

interface ManagerFeedbackBannerProps {
  comments?: ReviewComment[];
  currentVersion?: number;
}

export const ManagerFeedbackBanner: React.FC<ManagerFeedbackBannerProps> = ({
  comments = [],
}) => {
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const latestComment = comments.length > 0 ? comments[comments.length - 1] : null;
  const pastComments = comments.length > 1 ? comments.slice(0, comments.length - 1) : [];

  if (!latestComment) return null;

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Recently';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 p-5 shadow-sm space-y-4">
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
                {formatDate(latestComment.created_at)}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950/60 p-3.5 rounded-xl border border-amber-500/20 text-zinc-800 dark:text-zinc-200 text-sm font-normal leading-relaxed">
            "{latestComment.comment}"
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-300/80">
            💡 Please review the manager's comment above, update the necessary sections of your report below, and click <span className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Resubmit</span> when ready.
          </p>
        </div>
      </div>

      {pastComments.length > 0 && (
        <div className="border-t border-amber-500/20 pt-3">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline"
          >
            <History className="w-3.5 h-3.5" />
            <span>{showHistory ? 'Hide earlier review cycles' : `View earlier review cycles (${pastComments.length})`}</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {pastComments.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-amber-500/20 text-xs space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {c.manager?.name || 'Manager'} (v{c.version_number})
                    </span>
                    <span className="font-mono text-[10px]">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 italic">"{c.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
