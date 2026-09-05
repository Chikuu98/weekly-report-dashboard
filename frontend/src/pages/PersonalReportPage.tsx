import React from 'react';
import { PlusCircle } from 'lucide-react';

export const PersonalReportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-7 h-7 text-emerald-400" />
            Weekly Work Report
          </h1>
          <p className="text-sm text-slate-400">
            Submit your weekly work report, task breakdown, blockers & achievements
          </p>
        </div>
      </div>
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
        Personal Weekly Report Form (Hours 6–8)
      </div>
    </div>
  );
};
