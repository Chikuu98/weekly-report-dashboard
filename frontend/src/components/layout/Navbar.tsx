import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 fixed top-0 left-0 right-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between">
      {/* Left — Logo & Mobile Menu Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white md:hidden rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-500/25">
            WR
          </div>
          <div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-[15px] hidden sm:inline-block">
              Weekly Report Engine
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-[15px] sm:hidden">
              WRE
            </span>
          </div>
        </div>
      </div>

      {/* Right — Theme toggle */}
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-xs text-zinc-400 hidden sm:inline-block font-medium">
            Welcome, <strong className="text-zinc-700 dark:text-zinc-200">{user.name}</strong>
          </span>
        )}

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 transition-colors cursor-pointer shadow-2xs"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
