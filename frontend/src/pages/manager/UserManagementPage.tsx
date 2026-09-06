import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCog,
  Filter,
  ShieldCheck,
  User as UserIcon,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { usersApi, UserWithStats } from '../../api/usersApi';
import { useToast } from '../../context/ToastContext';
import {
  PageHeader,
  SearchInput,
  Select,
  LoadingSpinner,
  EmptyState,
  Button,
  MetricCard,
  Pagination,
} from '../../components/ui';

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAllTeamMembers();
      setUsers(data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalUsers = users.length;
  const managerCount = users.filter((u) => u.role === 'manager').length;
  const memberCount = users.filter((u) => u.role === 'team_member').length;
  const avgCompliance =
    users.length > 0
      ? Math.round(
          users.reduce((acc, u) => acc + (u.stats?.complianceRate ?? 100), 0) / users.length,
        )
      : 100;

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<UserCog className="w-5 h-5" />}
        title="User & Access Management"
        subtitle="Manage employee system roles, account authorizations, and performance overview."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Registered Users"
          value={totalUsers}
          subtext="Active system accounts"
          icon={<UserCog className="w-6 h-6" />}
          iconBgClass="bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20"
          valueClass="text-primary-600 dark:text-primary-400"
        />
        <MetricCard
          label="Team Members"
          value={memberCount}
          subtext="Report contributors"
          icon={<UserIcon className="w-6 h-6" />}
          iconBgClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
          valueClass="text-indigo-600 dark:text-indigo-400"
        />
        <MetricCard
          label="Managers & Reviewers"
          value={managerCount}
          subtext="Review authorities"
          icon={<ShieldCheck className="w-6 h-6" />}
          iconBgClass="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
          valueClass="text-violet-600 dark:text-violet-400"
        />
        <MetricCard
          label="Team Avg Compliance"
          value={`${avgCompliance}%`}
          subtext="On-time weekly reports"
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <SearchInput
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            containerClassName="w-full sm:w-80"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              containerClassName="w-full sm:w-44"
            >
              <option value="all">All Roles</option>
              <option value="team_member">Team Member</option>
              <option value="manager">Manager</option>
            </Select>
          </div>
        </div>
        <span className="text-xs text-zinc-400 font-mono shrink-0">
          Showing <strong className="text-zinc-700 dark:text-zinc-200">{filteredUsers.length}</strong> of {totalUsers} users
        </span>
      </div>

      {/* Users Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-14 flex justify-center">
            <LoadingSpinner message="Loading user directory..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<UserCog className="w-12 h-12" />}
            title="No users match your filters"
            description="Try adjusting your search criteria or role filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Compliance Rate</th>
                    <th className="py-3.5 px-4">Total Reports</th>
                    <th className="py-3.5 px-4">Approved</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white leading-snug">{u.name}</p>
                            <p className="text-[11px] text-zinc-400 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                            u.role === 'manager'
                              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20'
                              : 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20'
                          }`}
                        >
                          {u.role === 'manager' ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${u.stats?.complianceRate ?? 100}%` }}
                            />
                          </div>
                          <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                            {u.stats?.complianceRate ?? 100}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        {u.stats?.totalReports ?? 0}
                      </td>
                      <td className="p-4 align-middle font-mono text-primary-600 dark:text-primary-400 font-semibold">
                        {u.stats?.approvedCount ?? 0}
                      </td>
                      <td className="p-4 align-middle text-zinc-400 font-mono">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/team/${u.id}`)}
                        >
                          Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <div className="px-4 bg-zinc-50/50 dark:bg-zinc-900/40">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredUsers.length}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setPage(1);
                }}
                pageSizeOptions={[5, 10, 20]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
