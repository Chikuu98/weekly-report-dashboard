import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Home, User, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui';

export const ForbiddenPage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-rose-500/5 dark:bg-rose-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-primary-500/5 dark:bg-primary-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl relative z-10 space-y-6 animate-slide-up">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 shadow-sm">
            <ShieldAlert className="w-10 h-10" />
          </div>
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 mb-3 tracking-wide">
            ERROR 403 — FORBIDDEN
          </span>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Access Denied</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            You don't have permission to access this resource. Role-based security limits access to authorized accounts only.
          </p>
        </div>

        {user && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Current Role:</span>
            {isManager ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Manager / Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                <User className="w-3.5 h-3.5" /> Team Member
              </span>
            )}
          </div>
        )}

        <Link to={isManager ? '/dashboard' : '/my-reports'}>
          <Button variant="primary" fullWidth icon={<Home className="w-4 h-4" />}>
            Return to Authorized Workspace
          </Button>
        </Link>
      </div>
    </div>
  );
};
