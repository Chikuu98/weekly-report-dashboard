import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  FolderKanban,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { reportsApi } from '../../api/reportsApi';
import { projectsApi } from '../../api/projectsApi';
import { WeeklyReport } from '../../types/report';
import { Project } from '../../types/project';
import { useToast } from '../../context/ToastContext';
import {
  MetricCard,
  StatusBadge,
  PageHeader,
  LoadingSpinner,
  SearchInput,
  Select,
  Button,
  Card,
  Pagination,
} from '../../components/ui';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-zinc-900 dark:text-white mb-1 border-b border-zinc-100 dark:border-zinc-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span>{entry.name}:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchMember, setSearchMember] = useState<string>('');

  const [tablePage, setTablePage] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(5);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsRes, projectsRes] = await Promise.all([
        reportsApi.getAllReports({ limit: 100 }),
        projectsApi.getProjects(),
      ]);
      setReports(reportsRes.data || []);
      setProjects(projectsRes || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const totalReports = reports.length;
  const submittedCount = reports.filter((r) => r.status === 'submitted').length;
  const needsCorrectionCount = reports.filter((r) => r.status === 'needs_correction').length;
  const approvedCount = reports.filter((r) => r.status === 'approved').length;
  const complianceRate = totalReports > 0 ? Math.round(((submittedCount + approvedCount) / totalReports) * 100) : 100;

  const totalOpenBlockers = reports.reduce((acc, r) => {
    const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
    return acc + (latestVer?.key_blocker ? 1 : 0);
  }, 0);

  // Chart 1: Tasks trend
  const trendDataMap: Record<string, { week: string; tasksCompleted: number }> = {};
  reports.forEach((r) => {
    const weekLabel = typeof r.week_start_date === 'string' ? r.week_start_date.split('T')[0] : new Date(r.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!trendDataMap[weekLabel]) trendDataMap[weekLabel] = { week: weekLabel, tasksCompleted: 0 };
    const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
    if (latestVer?.tasks_json && Array.isArray(latestVer.tasks_json)) {
      trendDataMap[weekLabel].tasksCompleted += latestVer.tasks_json.filter((t: any) => t.status === 'completed' || t.actual_percentage === 100).length;
    }
  });
  const trendChartData = Object.values(trendDataMap).sort((a, b) => a.week > b.week ? 1 : -1);

  // Chart 2: Status distribution
  const statusCounts = {
    Approved: approvedCount,
    'Pending Review': submittedCount,
    'Needs Correction': needsCorrectionCount,
    Draft: reports.filter((r) => r.status === 'draft').length,
  };
  const statusPieData = Object.entries(statusCounts)
    .filter(([_, val]) => val > 0)
    .map(([name, value]) => ({ name, value }));
  const PIE_COLORS: Record<string, string> = {
    Approved: '#10b981',
    'Pending Review': '#6366f1',
    'Needs Correction': '#f59e0b',
    Draft: '#71717a',
  };

  // Chart 3: Hours by type
  const hoursTypeMap: Record<string, { category: string; Development: number; Testing: number; Meetings: number; Documentation: number; Other: number }> = {};
  reports.forEach((r) => {
    const weekLabel = typeof r.week_start_date === 'string' ? r.week_start_date.split('T')[0] : new Date(r.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!hoursTypeMap[weekLabel]) {
      hoursTypeMap[weekLabel] = { category: weekLabel, Development: 0, Testing: 0, Meetings: 0, Documentation: 0, Other: 0 };
    }
    const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
    if (latestVer?.hours_by_type_json) {
      hoursTypeMap[weekLabel].Development += Number(latestVer.hours_by_type_json.development || 0);
      hoursTypeMap[weekLabel].Testing += Number(latestVer.hours_by_type_json.testing || 0);
      hoursTypeMap[weekLabel].Meetings += Number(latestVer.hours_by_type_json.meetings || 0);
      hoursTypeMap[weekLabel].Documentation += Number(latestVer.hours_by_type_json.documentation || 0);
      hoursTypeMap[weekLabel].Other += Number(latestVer.hours_by_type_json.other || 0);
    }
  });
  const hoursTypeChartData = Object.values(hoursTypeMap).sort((a, b) => a.category > b.category ? 1 : -1);

  // Top 5 recent activities
  const topActivities = reports
    .flatMap((r) => {
      const acts: { id: string; type: string; text: string; timestamp: string; reportId: number; userName: string }[] = [];
      if (r.review_comments) {
        r.review_comments.forEach((rc) => {
          acts.push({
            id: `rc-${rc.id}`,
            type: rc.action,
            text: rc.action === 'approved' ? `approved report for ${r.user?.name}` : `requested changes on report for ${r.user?.name}`,
            timestamp: rc.created_at,
            reportId: r.id,
            userName: rc.manager?.name || 'Manager',
          });
        });
      }
      return acts;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Filtered table
  const filteredReports = reports.filter((r) => {
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (selectedProjectId !== 'all' && r.project_id !== parseInt(selectedProjectId, 10)) return false;
    if (searchMember.trim()) {
      const m = r.user?.name || r.user?.email || '';
      if (!m.toLowerCase().includes(searchMember.toLowerCase())) return false;
    }
    return true;
  });

  const totalTablePages = Math.ceil(filteredReports.length / tablePageSize) || 1;
  const paginatedReports = filteredReports.slice(
    (tablePage - 1) * tablePageSize,
    tablePage * tablePageSize,
  );

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const chartAxisStyle = { stroke: '#71717a', fontSize: 11 };
  const chartGridStyle = { strokeDasharray: '3 3', stroke: '#3f3f46', opacity: 0.5 };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<LayoutDashboard className="w-5 h-5" />}
        title="Manager Analytics & Team Dashboard"
        subtitle="Real-time insights, performance trends, workload breakdown & review actions."
        action={
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchDashboardData}>
            Refresh
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Pending Review" value={submittedCount} subtext="Awaiting manager decision"
          icon={<Clock className="w-6 h-6" />}
          iconBgClass="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
          valueClass="text-sky-600 dark:text-sky-400" />
        <MetricCard label="Submission Compliance" value={`${complianceRate}%`} subtext="On-time submission rate"
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          valueClass="text-emerald-600 dark:text-emerald-400" />
        <MetricCard label="Needs Correction" value={needsCorrectionCount} subtext="Sent back for member edit"
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          valueClass="text-amber-600 dark:text-amber-400" />
        <MetricCard label="Open Key Blockers" value={totalOpenBlockers} subtext="Flagged across team"
          icon={<TrendingUp className="w-6 h-6" />}
          iconBgClass="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          valueClass="text-rose-600 dark:text-rose-400" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1 */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary-500" /> Tasks Completed by Week
          </h3>
          <div className="h-56 w-full">
            {trendChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400 italic">No task trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis dataKey="week" {...chartAxisStyle} />
                  <YAxis {...chartAxisStyle} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 2 */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-emerald-500" /> Report Submission Status Distribution
          </h3>
          <div className="h-56 w-full flex items-center justify-center">
            {statusPieData.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No reports found.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 3 */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-violet-500" /> Workload Hours Breakdown by Activity
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursTypeChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid {...chartGridStyle} />
                <XAxis dataKey="category" {...chartAxisStyle} />
                <YAxis {...chartAxisStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Development" fill="#6366f1" stackId="h" />
                <Bar dataKey="Testing" fill="#10b981" stackId="h" />
                <Bar dataKey="Meetings" fill="#f59e0b" stackId="h" />
                <Bar dataKey="Documentation" fill="#8b5cf6" stackId="h" />
                <Bar dataKey="Other" fill="#ec4899" stackId="h" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Activity Feed + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Feed */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary-500" /> Recent Activity
          </h3>
          <div className="space-y-2.5">
            {topActivities.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-4 text-center">No recent activity.</p>
            ) : (
              topActivities.map((act) => (
                <div key={act.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shrink-0">
                    {act.type === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : act.type === 'needs_correction' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> : <Clock className="w-3.5 h-3.5 text-primary-500" />}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
                      <strong className="text-zinc-900 dark:text-white">{act.userName}</strong> {act.text}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span>{formatDate(act.timestamp)}</span>
                      <button onClick={() => navigate(`/reports/${act.reportId}/review`)} className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">Inspect</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Filter + Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card padding="sm">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <SearchInput
                value={searchMember}
                onChange={(e) => {
                  setSearchMember(e.target.value);
                  setTablePage(1);
                }}
                placeholder="Search member..."
                containerClassName="w-full sm:w-52"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                <Select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setTablePage(1);
                  }}
                  containerClassName="min-w-[160px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Pending Review</option>
                  <option value="needs_correction">Needs Correction</option>
                  <option value="approved">Approved</option>
                  <option value="draft">Draft</option>
                </Select>
                <FolderKanban className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <Select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setTablePage(1);
                  }}
                  containerClassName="min-w-[140px]"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </div>
              <span className="text-xs text-zinc-400 font-mono shrink-0 ml-auto">{filteredReports.length} results</span>
            </div>
          </Card>

          {/* Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-12 flex justify-center"><LoadingSpinner message="Loading submissions..." /></div>
            ) : filteredReports.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400">No reports match the selected filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Team Member</th>
                        <th className="py-3 px-4">Week Range</th>
                        <th className="py-3 px-4">Project</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                      {paginatedReports.map((report) => (
                        <tr key={report.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3.5 align-middle">
                            <p className="font-semibold text-zinc-900 dark:text-white">{report.user?.name || 'Team Member'}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">{report.user?.email}</p>
                          </td>
                          <td className="p-3.5 align-middle text-zinc-700 dark:text-zinc-300">{formatDate(report.week_start_date)} – {formatDate(report.week_end_date)}</td>
                          <td className="p-3.5 align-middle">
                            {report.project ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: report.project.color_code || '#6366f1' }} />
                                {report.project.name}
                              </span>
                            ) : <span className="text-zinc-400 italic">No Tag</span>}
                          </td>
                          <td className="p-3.5 align-middle"><StatusBadge status={report.status} /></td>
                          <td className="p-3.5 align-middle text-right">
                            <Button
                              variant={report.status === 'submitted' ? 'primary' : 'secondary'}
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5" />}
                              onClick={() => navigate(report.status === 'submitted' ? `/reports/${report.id}/review` : `/reports/${report.id}`)}
                            >
                              {report.status === 'submitted' ? 'Review' : 'View'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 bg-zinc-50/50 dark:bg-zinc-900/40">
                  <Pagination
                    currentPage={tablePage}
                    totalPages={totalTablePages}
                    totalItems={filteredReports.length}
                    pageSize={tablePageSize}
                    onPageChange={(p) => setTablePage(p)}
                    onPageSizeChange={(sz) => {
                      setTablePageSize(sz);
                      setTablePage(1);
                    }}
                    pageSizeOptions={[5, 10, 20]}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
