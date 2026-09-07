import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Eye,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { usersApi, UserProfileResponse } from '../../api/usersApi';
import { useToast } from '../../context/ToastContext';
import {
  MetricCard,
  StatusBadge,
  LoadingSpinner,
  Button,
  Card,
  Pagination,
} from '../../components/ui';

export const TeamMemberProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const userId = id ? parseInt(id, 10) : null;
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await usersApi.getUserProfile(userId);
        setProfileData(res);
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to load team member profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <div className="flex justify-center pt-16"><LoadingSpinner message="Loading employee profile..." /></div>;

  if (!profileData) return (
    <div className="p-12 text-center space-y-4">
      <Users className="w-12 h-12 text-primary-500 mx-auto" />
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Employee Not Found</h2>
      <Button variant="secondary" onClick={() => navigate('/team')}>Back to Team</Button>
    </div>
  );

  const { user, stats, reports } = profileData;

  const totalPages = Math.ceil(reports.length / pageSize) || 1;
  const paginatedReports = reports.slice((page - 1) * pageSize, page * pageSize);

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/team')} aria-label="Back" />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-500 text-white font-bold text-lg flex items-center justify-center shadow-md">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-zinc-900 dark:text-white">{user.name}</h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${user.role === 'manager' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' : 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20'}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            </div>
          </div>
        </div>
        <span className="text-xs text-zinc-400 font-mono">Joined: {formatDate(user.created_at)}</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Compliance Rate" value={`${stats.complianceRate}%`} subtext="Submission timeliness"
          icon={<ShieldCheck className="w-6 h-6" />}
          iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          valueClass="text-emerald-600 dark:text-emerald-400" />
        <MetricCard label="Total Reports" value={stats.totalReports} subtext="Lifetime reports created"
          icon={<Calendar className="w-6 h-6" />}
          iconBgClass="bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20"
          valueClass="text-primary-600 dark:text-primary-400" />
        <MetricCard label="Approved Reports" value={stats.approvedCount} subtext="Fully approved & verified"
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          valueClass="text-emerald-600 dark:text-emerald-400" />
        <MetricCard label="Needs Correction" value={stats.needsCorrectionCount} subtext="Correction cycles"
          icon={<TrendingUp className="w-6 h-6" />}
          iconBgClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          valueClass="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Report History Table */}
      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary-500" /> Weekly Report History
        </h3>
        <div className="overflow-x-auto">
          {reports.length === 0 ? (
            <div className="py-10 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-400">No reports submitted by this employee yet.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Week Range</th>
                    <th className="py-3.5 px-4">Project</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Version</th>
                    <th className="py-3.5 px-4">Updated</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                  {paginatedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4 align-middle font-semibold text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                          {formatDate(report.week_start_date)} – {formatDate(report.week_end_date)}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {report.project ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: report.project.color_code || '#6366f1' }} />
                            {report.project.name}
                          </span>
                        ) : <span className="text-zinc-400 italic">No Tag</span>}
                      </td>
                      <td className="p-4 align-middle"><StatusBadge status={report.status} /></td>
                      <td className="p-4 align-middle font-mono text-zinc-400">v{report.current_version}</td>
                      <td className="p-4 align-middle text-zinc-400 font-mono">{formatDate(report.updated_at)}</td>
                      <td className="p-4 align-middle text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => navigate(report.status === 'submitted' ? `/reports/${report.id}/review` : `/reports/${report.id}`)}
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pt-3">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={reports.length}
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
      </Card>
    </div>
  );
};
