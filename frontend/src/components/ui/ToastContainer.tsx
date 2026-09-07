import React, { useEffect } from 'react';
import { Toast, ToastType } from '../../types/toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  error: {
    bg: 'bg-white/95 dark:bg-zinc-900/95 shadow-rose-500/10',
    border: 'border-rose-200 dark:border-rose-500/30',
    text: 'text-rose-900 dark:text-rose-200',
    icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  },
  success: {
    bg: 'bg-white/95 dark:bg-zinc-900/95 shadow-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    text: 'text-emerald-900 dark:text-emerald-200',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  },
  warning: {
    bg: 'bg-white/95 dark:bg-zinc-900/95 shadow-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
    text: 'text-amber-900 dark:text-amber-200',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  },
  info: {
    bg: 'bg-white/95 dark:bg-zinc-900/95 shadow-indigo-500/10',
    border: 'border-indigo-200 dark:border-indigo-500/30',
    text: 'text-indigo-900 dark:text-indigo-200',
    icon: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
  },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const duration = toast.duration || 4000;
  const style = toastStyles[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border ${style.bg} ${style.border} shadow-xl backdrop-blur-md min-w-[300px] max-w-md w-full transition-all duration-300 animate-in slide-in-from-bottom-5 slide-in-from-right-5 fade-in`}
      role="alert"
    >
      <div className="mt-0.5">{style.icon}</div>
      <div className={`flex-1 text-sm font-medium leading-snug ${style.text}`}>{toast.message}</div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2.5 max-w-full px-4 sm:px-0 pointer-events-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};
