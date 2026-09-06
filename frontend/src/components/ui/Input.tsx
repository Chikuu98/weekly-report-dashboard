import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  iconRight,
  containerClassName = '',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          {...props}
          className={[
            'w-full rounded-xl border text-sm transition-all duration-150',
            'bg-white dark:bg-zinc-900/80',
            'text-zinc-900 dark:text-zinc-100',
            'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30',
            error
              ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/30 focus:border-rose-400'
              : 'border-zinc-200 dark:border-zinc-700 focus:border-primary-500 dark:focus:border-primary-500',
            icon ? 'pl-10' : 'pl-3.5',
            iconRight ? 'pr-10' : 'pr-3.5',
            'py-2.5',
            props.disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {iconRight && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            {iconRight}
          </div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-500 dark:text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
};
