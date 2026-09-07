import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FolderKanban,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';
import { projectsApi } from '../../api/projectsApi';
import { WeeklyReport } from '../../types/report';
import { Project } from '../../types/project';
import { useToast } from '../../context/ToastContext';
import {
  PageHeader,
  SearchInput,
  Select,
  DateInput,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  Button,
  MetricCard,
  Pagination,
} from '../../components/ui';

const STATUS_TABS = [
  { id: 'all', label: 'All Submissions' },
  { id: 'submitted', label: 'Pending Review' },
  { id: 'needs_correction', label: 'Needs Correction' },
  { id: 'approved', label: 'Approved' },
];

export const AllSubmissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectIdFilter, setProjectIdFilter] = useState<string>('all');
  const [searchMember, setSearchMember] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Counts for metric cards
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    needsCorrection: 0,
    approved: 0,
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getAllReports({
        page,
        limit: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
        project_id: projectIdFilter === 'all' ? undefined : parseInt(projectIdFilter, 10),
        search: searchMember.trim() || undefined,
        week_start_date: dateFilter || undefined,
      });

      setReports(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAndProjects = async () => {
    try {
      const [projRes, statsRes] = await Promise.all([
        projectsApi.getProjects(),
        reportsApi.getDashboardStats(),
      ]);
      setProjects(projRes || []);
      setStats({
        total: statsRes.totalReports,
        pending: statsRes.submittedCount,
        needsCorrection: statsRes.needsCorrectionCount,
        approved: statsRes.approvedCount,
      });
    } catch {
      // Soft fail
    }
  };

  useEffect(() => {
    fetchStatsAndProjects();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [page, pageSize, statusFilter, projectIdFilter, dateFilter, searchMember]);

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<FileText className="w-5 h-5" />}
        title="All Weekly Submissions"
        subtitle="Manage, audit, and review all team member weekly report submissions across projects."
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Submissions"
          value={stats.total}
          subtext="Across all team members"
          icon={<FileText className="w-6 h-6" />}
          iconBgClass="bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20"
          valueClass="text-primary-600 dark:text-primary-400"
        />
        <MetricCard
          label="Pending Review"
          value={stats.pending}
          subtext="Awaiting manager decision"
          icon={<Clock className="w-6 h-6" />}
          iconBgClass="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
          valueClass="text-sky-600 dark:text-sky-400"
        />
        <MetricCard
          label="Needs Correction"
          value={stats.needsCorrection}
          subtext="Returned to member"
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          valueClass="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          label="Approved Reports"
          value={stats.approved}
          subtext="Reviewed & signed off"
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-2 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-primary-500" /> Status:
          </span>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-400 font-mono shrink-0">
          Total: <strong className="text-zinc-700 dark:text-zinc-200">{totalCount}</strong> reports
        </span>
      </div>

      {/* Search & Secondary Filter Bar */}
      <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          <SearchInput
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            placeholder="Search by member name or email..."
            containerClassName="w-full sm:w-72"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <FolderKanban className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <Select
              value={projectIdFilter}
              onChange={(e) => {
                setProjectIdFilter(e.target.value);
                setPage(1);
              }}
              containerClassName="min-w-[160px]"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Calendar className="w-3.5 h-3.5 text-primary-500 shrink-0 ml-1" />
            <DateInput
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              containerClassName="w-40"
              placeholder="Filter by week"
            />

            {(dateFilter || projectIdFilter !== 'all' || searchMember) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFilter('');
                  setProjectIdFilter('all');
                  setSearchMember('');
                  setPage(1);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner message="Fetching report submissions..." />
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="No submissions match your filters"
            description="Try selecting a different status or clearing your search filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Team Member</th>
                    <th className="py-3.5 px-4">Week Range</th>
                    <th className="py-3.5 px-4">Project</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Version</th>
                    <th className="py-3.5 px-4">Tasks / Deliverable</th>
                    <th className="py-3.5 px-4">Updated</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                  {reports.map((report) => {
                    const latestVer =
                      report.versions && report.versions.length > 0
                        ? report.versions[report.versions.length - 1]
                        : null;
                    const tasksCount = latestVer?.tasks_json?.length || 0;

                    return (
                      <tr key={report.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        {/* Member */}
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                              {report.user?.name ? report.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-white leading-snug">
                                {report.user?.name || 'Team Member'}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-mono">{report.user?.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Week Range */}
                        <td className="p-4 align-middle font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                            {formatDate(report.week_start_date)} – {formatDate(report.week_end_date)}
                          </div>
                        </td>

                        {/* Project */}
                        <td className="p-4 align-middle">
                          {report.project ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: report.project.color_code || '#6366f1' }}
                              />
                              {report.project.name}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">No Tag</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4 align-middle">
                          <StatusBadge status={report.status} />
                        </td>

                        {/* Version */}
                        <td className="p-4 align-middle font-mono text-zinc-400">v{report.current_version}</td>

                        {/* Tasks breakdown preview */}
                        <td className="p-4 align-middle">
                          <div className="space-y-0.5 max-w-[200px]">
                            <div className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
                              <Layers className="w-3 h-3 text-primary-500 shrink-0" />
                              <span>{tasksCount} {tasksCount === 1 ? 'task logged' : 'tasks logged'}</span>
                            </div>
                            {latestVer?.key_blocker && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                                ⚠️ {latestVer.key_blocker}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Updated */}
                        <td className="p-4 align-middle text-zinc-400 font-mono text-[11px]">
                          {formatDate(report.updated_at)}
                        </td>

                        {/* Actions */}
                        <td className="p-4 align-middle text-right">
                          <Button
                            variant={report.status === 'submitted' ? 'primary' : 'secondary'}
                            size="sm"
                            icon={
                              report.status === 'submitted' ? (
                                <Sparkles className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )
                            }
                            onClick={() =>
                              navigate(
                                report.status === 'submitted'
                                  ? `/reports/${report.id}/review`
                                  : `/reports/${report.id}`,
                              )
                            }
                          >
                            {report.status === 'submitted' ? 'Review Report' : 'View Report'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <div className="px-4 bg-zinc-50/50 dark:bg-zinc-900/40">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setPage(1);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
