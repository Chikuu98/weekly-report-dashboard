import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../ui';
import {
  LayoutDashboard,
  FileText,
  History,
  FolderKanban,
  Users,
  UserCog,
  PlusCircle,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  accent?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isManager = user?.role === 'manager';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
      isActive
        ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-semibold shadow-xs'
        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 border border-transparent',
    ].join(' ');

  const managerItems: NavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reports', icon: FileText, label: 'All Submissions' },
    { to: '/team', icon: Users, label: 'Team Members' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/users', icon: UserCog, label: 'User Management' },
  ];

  const memberItems: NavItem[] = [
    { to: '/report/new', icon: PlusCircle, label: 'Submit Report', accent: true },
    { to: '/my-reports', icon: History, label: 'My Reports' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
  ];

  const items = isManager ? managerItems : memberItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 md:top-16 md:bottom-0 left-0 z-50 md:z-30 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Section label */}
          <div className="px-3 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {isManager ? 'Manager Console' : 'Member Workspace'}
            </span>
          </div>

          {/* Nav links */}
          <nav className="space-y-1" role="navigation" aria-label="Sidebar navigation">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={linkClass}
              >
                <item.icon
                  className={`w-4 h-4 shrink-0 ${item.accent ? 'text-emerald-500' : ''}`}
                />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Profile & Logout */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60">
          {user && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/60 shadow-xs">
              {/* Profile Link */}
              <NavLink
                to="/profile"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 p-1.5 rounded-lg flex-1 min-w-0 transition-colors ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200'
                  }`
                }
                title="View profile"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight text-zinc-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate capitalize flex items-center gap-1 mt-0.5">
                    {user.role === 'manager' ? (
                      <>
                        <ShieldCheck className="w-2.5 h-2.5 text-violet-500 shrink-0" />
                        <span>Manager</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-2.5 h-2.5 text-primary-500 shrink-0" />
                        <span>Team Member</span>
                      </>
                    )}
                  </p>
                </div>
              </NavLink>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onClose();
          logout();
        }}
        title="Log Out"
        message="Are you sure you want to log out of your account? You will need to sign back in to access your reports and dashboard."
        confirmText="Log Out"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};
