import React from 'react';
import { History } from 'lucide-react';

export const ReportHistoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-7 h-7 text-sky-400" />
            My Report History
          </h1>
          <p className="text-sm text-slate-400">
            View your past weekly report submissions and review status history
          </p>
        </div>
      </div>
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
        Report History & Submission List
      </div>
    </div>
  );
};
