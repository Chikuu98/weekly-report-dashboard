import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  containerClassName = '',
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        {...props}
        className={[
          'w-full rounded-xl border text-sm transition-all duration-150 resize-none leading-relaxed',
          'bg-white dark:bg-zinc-900/80',
          'text-zinc-900 dark:text-zinc-100',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/30',
          error
            ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/30 focus:border-rose-400'
            : 'border-zinc-200 dark:border-zinc-700 focus:border-primary-500 dark:focus:border-primary-500',
          'px-3.5 py-2.5',
          props.disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
      )}
      {!error && hint && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
};
