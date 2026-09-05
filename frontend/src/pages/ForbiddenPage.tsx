import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Home, User, ShieldCheck } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Gradient Blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative z-10 space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-10 h-10" />
          </div>
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 mb-3 tracking-wide">
            ERROR 403 - FORBIDDEN
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Access Denied</h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            You do not have permission to access this resource or execute this action. Role-based security limits access to authorized accounts.
          </p>
        </div>

        {user && (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Role:</span>
            {isManager ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Manager / Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <User className="w-3.5 h-3.5" />
                Team Member
              </span>
            )}
          </div>
        )}

        <div className="pt-2">
          <Link
            to={isManager ? '/dashboard' : '/my-reports'}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            Return to Authorized Workspace
          </Link>
        </div>
      </div>
    </div>
  );
};
