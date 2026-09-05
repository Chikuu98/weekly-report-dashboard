import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-sky-400" />
            Team Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Consolidated overview and performance insights across all team members
          </p>
        </div>
      </div>
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
        Dashboard Analytics & Summary Widgets (Hours 9–10)
      </div>
    </div>
  );
};
