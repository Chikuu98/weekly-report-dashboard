import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../../components/ui';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-primary-500/5 dark:bg-primary-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl relative z-10 space-y-6 animate-slide-up">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20 relative">
            <Search className="w-10 h-10 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500" />
            </span>
          </div>
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 mb-3 tracking-wide">
            ERROR 404
          </span>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Page Not Found</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            The page you're looking for doesn't exist, has been removed, or the link is invalid.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" fullWidth icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Link to="/" className="flex-1">
            <Button variant="primary" fullWidth icon={<Home className="w-4 h-4" />}>
              Home Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
