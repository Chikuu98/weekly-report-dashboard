import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Eye } from 'lucide-react';
import { usersApi, UserWithStats } from '../api/usersApi';
import { useToast } from '../context/ToastContext';

export const TeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [members, setMembers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAllTeamMembers();
      setMembers(data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-sky-400" />
            Team Members Directory & Compliance
          </h1>
          <p className="text-sm text-slate-400">
            View employee submission compliance, performance statistics, and individual report histories.
          </p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members by name or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredMembers.length} of {members.length} employees
        </span>
      </div>

      {/* Team Members Grid / Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm">Loading team directory...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <Users className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
          <p className="text-sm">No team members match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Employee Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 text-slate-950 font-bold text-base flex items-center justify-center shadow-md">
                      {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">{member.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">{member.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                      member.role === 'manager'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    }`}
                  >
                    {member.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Compliance & Reports Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Compliance</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">
                      {member.stats?.complianceRate ?? 100}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Reports</p>
                    <p className="text-sm font-bold text-white font-mono">
                      {member.stats?.totalReports ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Approved</p>
                    <p className="text-sm font-bold text-sky-400 font-mono">
                      {member.stats?.approvedCount ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* View Profile Action CTA */}
              <button
                type="button"
                onClick={() => navigate(`/team/${member.id}`)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-sky-500/10 hover:text-sky-400 text-slate-200 border border-slate-700 hover:border-sky-500/30 text-xs font-semibold transition-all"
              >
                <Eye className="w-4 h-4" />
                View Employee Profile & Reports
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
