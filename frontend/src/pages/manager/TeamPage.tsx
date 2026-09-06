import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Eye } from 'lucide-react';
import { usersApi, UserWithStats } from '../../api/usersApi';
import { useToast } from '../../context/ToastContext';
import { PageHeader, SearchInput, LoadingSpinner, EmptyState, Button, Pagination } from '../../components/ui';

export const TeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [members, setMembers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
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
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Users className="w-5 h-5" />}
        title="Team Members Directory"
        subtitle="View employee compliance, performance statistics, and individual report histories."
      />

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <SearchInput
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          containerClassName="w-full sm:w-80"
        />
        <span className="text-xs text-zinc-400 font-mono shrink-0">
          {filteredMembers.length} of {members.length} employees
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center pt-12"><LoadingSpinner message="Loading team directory..." /></div>
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No team members found"
          description={searchQuery ? 'No members match your search criteria.' : 'No team members in the system yet.'}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-500 text-white font-bold text-base flex items-center justify-center shadow-md shrink-0">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">{member.name}</h3>
                        <p className="text-[11px] text-zinc-400 font-mono">{member.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize shrink-0 ${member.role === 'manager' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' : 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20'}`}>
                      {member.role.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Compliance</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{member.stats?.complianceRate ?? 100}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Reports</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{member.stats?.totalReports ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Approved</p>
                      <p className="text-sm font-bold text-primary-600 dark:text-primary-400 font-mono">{member.stats?.approvedCount ?? 0}</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  icon={<Eye className="w-4 h-4" />}
                  onClick={() => navigate(`/team/${member.id}`)}
                  className="mt-auto"
                >
                  View Profile & Reports
                </Button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredMembers.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
              pageSizeOptions={[6, 12, 24]}
            />
          </div>
        </div>
      )}
    </div>
  );
};
