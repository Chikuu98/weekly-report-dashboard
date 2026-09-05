import React from 'react';
import { FileText } from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-sky-400" />
          Report Detail & Review
        </h1>
        <p className="text-sm text-slate-400">Read-only view, version history & manager review actions</p>
      </div>
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
        Report Detail View & Version Snapshots
      </div>
    </div>
  );
};
