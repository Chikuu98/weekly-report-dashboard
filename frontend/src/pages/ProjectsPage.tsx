import React from 'react';
import { FolderKanban } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FolderKanban className="w-7 h-7 text-sky-400" />
          Projects & Work Categories
        </h1>
        <p className="text-sm text-slate-400">Manage client projects and team work categories</p>
      </div>
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
        Projects Management Page
      </div>
    </div>
  );
};
