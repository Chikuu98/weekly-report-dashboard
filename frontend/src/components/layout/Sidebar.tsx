import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  History,
  FolderKanban,
  Users,
  UserCog,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm shadow-sky-500/5 font-semibold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6">
          <div className="px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isManager ? 'Manager Console' : 'Member Workspace'}
            </span>
          </div>

          <nav className="space-y-1.5">
            {isManager ? (
              <>
                <NavLink to="/dashboard" onClick={onClose} className={linkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  Team Dashboard
                </NavLink>
                <NavLink to="/reports" onClick={onClose} className={linkClass}>
                  <FileText className="w-4 h-4" />
                  All Submissions
                </NavLink>
                <NavLink to="/team" onClick={onClose} className={linkClass}>
                  <Users className="w-4 h-4" />
                  Team Members
                </NavLink>
                <NavLink to="/projects" onClick={onClose} className={linkClass}>
                  <FolderKanban className="w-4 h-4" />
                  Projects & Categories
                </NavLink>
                <NavLink to="/users" onClick={onClose} className={linkClass}>
                  <UserCog className="w-4 h-4" />
                  User Management
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/report/new" onClick={onClose} className={linkClass}>
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  Submit Weekly Report
                </NavLink>
                <NavLink to="/my-reports" onClick={onClose} className={linkClass}>
                  <History className="w-4 h-4" />
                  My Report History
                </NavLink>
                <NavLink to="/projects" onClick={onClose} className={linkClass}>
                  <FolderKanban className="w-4 h-4" />
                  Projects
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Badge */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800/80 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Review Cycle v1.0</p>
              <p className="text-[11px] text-slate-400">Structured Reporting</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
