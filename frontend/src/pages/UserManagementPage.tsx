import React from 'react';
import { UserCog } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCog className="w-7 h-7 text-sky-400" />
          User Management
        </h1>
        <p className="text-sm text-slate-400">Admin control panel for user roles and team access</p>
      </div>
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
        User Management Page
      </div>
    </div>
  );
};
