import React from 'react';
import { Users } from 'lucide-react';

export const TeamPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-7 h-7 text-sky-400" />
          Team Members
        </h1>
        <p className="text-sm text-slate-400">View team member report submission status and profiles</p>
      </div>
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
        Team Members List
      </div>
    </div>
  );
};
