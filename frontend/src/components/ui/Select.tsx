import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  hint,
  icon,
  options,
  placeholder,
  containerClassName = '',
  className = '',
  children,
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 z-10">
            {icon}
          </div>
        )}
        <select
          id={selectId}
          {...props}
          className={[
            'w-full rounded-xl border text-sm transition-all duration-150 appearance-none',
            'bg-white dark:bg-zinc-900/80',
            'text-zinc-900 dark:text-zinc-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30',
            error
              ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/30 focus:border-rose-400'
              : 'border-zinc-200 dark:border-zinc-700 focus:border-primary-500 dark:focus:border-primary-500',
            icon ? 'pl-10' : 'pl-3.5',
            'pr-9 py-2.5',
            props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {/* Custom arrow */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
      )}
      {!error && hint && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
};
