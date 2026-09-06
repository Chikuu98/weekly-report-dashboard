import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  containerClassName = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative ${containerClassName}`}>
      <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        {...props}
        className={[
          'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-150',
          'bg-white dark:bg-zinc-900',
          'text-zinc-900 dark:text-zinc-100',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
          'border-zinc-200 dark:border-zinc-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />
    </div>
  );
};
