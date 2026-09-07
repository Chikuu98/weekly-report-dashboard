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
  Calendar,
  Columns,
  ShieldAlert,
  Award,
  Sparkles,
  FileText,
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
import { usersApi, UserWithStats } from '../../api/usersApi';
import { WeeklyReport, DashboardStatsResponse } from '../../types/report';
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

  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States - These trigger real backend DB queries
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [searchMember, setSearchMember] = useState<string>('');

  // View Mode: 'overview' | 'tracker' | 'comparison'
  const [activeTab, setActiveTab] = useState<'overview' | 'tracker' | 'comparison'>('overview');
  const [comparisonSection, setComparisonSection] = useState<'blockers' | 'achievements' | 'next_week' | 'hours'>('blockers');

  // Real DB Pagination state for table
  const [tablePage, setTablePage] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(5);
  const [tableReports, setTableReports] = useState<WeeklyReport[]>([]);
  const [totalTableCount, setTotalTableCount] = useState<number>(0);
  const [totalTablePages, setTotalTablePages] = useState<number>(1);

  // Tracker / Comparison Reports fetched for selected week
  const [trackerReports, setTrackerReports] = useState<WeeklyReport[]>([]);

  // Real DB aggregated dashboard metrics
  const [stats, setStats] = useState<DashboardStatsResponse>({
    totalReports: 0,
    submittedCount: 0,
    needsCorrectionCount: 0,
    approvedCount: 0,
    complianceRate: 100,
    totalOpenBlockers: 0,
    availableWeeks: [],
    statusDistribution: [],
    weeklyTrends: [],
    hoursByType: [],
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Initial load for projects & members
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [projectsRes, membersRes] = await Promise.all([
          projectsApi.getProjects(),
          usersApi.getAllTeamMembers(),
        ]);
        setProjects(projectsRes || []);
        setTeamMembers(membersRes.filter((m) => m.role === 'team_member') || []);
      } catch (err: any) {
        console.error('Failed to load initial metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch dashboard data with full DB filter parameters
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const filterParams = {
        week_start_date: selectedWeek !== 'all' ? selectedWeek : undefined,
        status: selectedStatus !== 'all' && selectedStatus !== 'not_started' ? selectedStatus : undefined,
        project_id: selectedProjectId !== 'all' ? parseInt(selectedProjectId, 10) : undefined,
        user_id: selectedMemberId !== 'all' ? parseInt(selectedMemberId, 10) : undefined,
        search: searchMember.trim() || undefined,
      };

      // Query real DB stats and paginated table reports
      const [statsRes, tableRes] = await Promise.all([
        reportsApi.getDashboardStats(filterParams),
        reportsApi.getAllReports({
          page: tablePage,
          limit: tablePageSize,
          ...filterParams,
        }),
      ]);

      setStats(statsRes);
      setTableReports(tableRes.data || []);
      setTotalTableCount(tableRes.total || 0);
      setTotalTablePages(tableRes.totalPages || 1);

      // Determine active tracker week:
      const available = statsRes.availableWeeks || [];
      const activeTrackerWeek =
        selectedWeek !== 'all' ? selectedWeek : (available.length > 0 ? available[0] : '');

      const trackerFilterParams: any = {
        limit: 100,
        project_id: selectedProjectId !== 'all' ? parseInt(selectedProjectId, 10) : undefined,
        user_id: selectedMemberId !== 'all' ? parseInt(selectedMemberId, 10) : undefined,
        search: searchMember.trim() || undefined,
      };

      if (activeTrackerWeek) {
        trackerFilterParams.week_start_date = activeTrackerWeek;
      }

      const trackerRes = await reportsApi.getAllReports(trackerFilterParams);
      setTrackerReports(trackerRes.data || []);

      // Compute recent activities from latest reports
      const acts = (tableRes.data || [])
        .flatMap((r) => {
          const resActs: any[] = [];
          if (r.review_comments) {
            r.review_comments.forEach((rc) => {
              resActs.push({
                id: `rc-${rc.id}`,
                type: rc.action,
                text: rc.action === 'approved' ? `approved report for ${r.user?.name}` : `requested changes on report for ${r.user?.name}`,
                timestamp: rc.created_at,
                reportId: r.id,
                userName: rc.manager?.name || 'Manager',
              });
            });
          }
          return resActs;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
      setRecentActivities(acts);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedWeek, selectedStatus, selectedProjectId, selectedMemberId, searchMember, tablePage, tablePageSize]);

  // Distinct weeks list sorted descending from DB
  const weekOptions = stats.availableWeeks || [];

  const PIE_COLORS: Record<string, string> = {
    Approved: '#10b981',
    'Pending Review': '#6366f1',
    'Needs Correction': '#f59e0b',
  };

  // Helper to normalize any Date / String to YYYY-MM-DD
  const toDateKey = (d?: string | Date) => {
    if (!d) return '';
    if (typeof d === 'string') {
      return d.includes('T') ? d.split('T')[0] : d;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Active week for tracker and comparison views
  const trackerWeek = selectedWeek !== 'all' ? selectedWeek : (weekOptions[0] || '');

  // Team Weekly Submission Tracker Matrix
  const memberSubmissionMatrix = teamMembers.map((member) => {
    const reportForWeek = trackerReports.find((r) => {
      if (r.user_id !== member.id) return false;
      if (!trackerWeek) return true;
      return toDateKey(r.week_start_date) === toDateKey(trackerWeek);
    });

    return {
      member,
      report: reportForWeek || null,
      status: reportForWeek ? reportForWeek.status : 'not_started',
    };
  }).filter((item) => {
    if (searchMember.trim()) {
      const q = searchMember.toLowerCase();
      if (!item.member.name.toLowerCase().includes(q) && !item.member.email.toLowerCase().includes(q)) return false;
    }
    if (selectedMemberId !== 'all' && item.member.id !== parseInt(selectedMemberId, 10)) return false;
    if (selectedProjectId !== 'all') {
      if (!item.report || item.report.project_id !== parseInt(selectedProjectId, 10)) return false;
    }
    if (selectedStatus === 'not_started' && item.status !== 'not_started') return false;
    if (selectedStatus !== 'all' && selectedStatus !== 'not_started' && item.status !== selectedStatus) return false;
    return true;
  });

  // Comparison Data: Reports for the selected week across team members
  const comparisonReports = trackerReports.filter((r) => {
    if (selectedMemberId !== 'all' && r.user_id !== parseInt(selectedMemberId, 10)) return false;
    if (selectedProjectId !== 'all' && r.project_id !== parseInt(selectedProjectId, 10)) return false;
    if (selectedStatus !== 'all' && selectedStatus !== 'not_started' && r.status !== selectedStatus) return false;
    if (searchMember.trim()) {
      const q = searchMember.toLowerCase();
      const name = r.user?.name || '';
      const email = r.user?.email || '';
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    }
    if (trackerWeek) {
      return toDateKey(r.week_start_date) === toDateKey(trackerWeek);
    }
    return true;
  });

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
        subtitle="Real-time insights, weekly submission tracking, workload breakdown & review actions."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchDashboardData}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* Global Filter & Week Selector Bar */}
      <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto flex-1">
          {/* Week Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-500 shrink-0" />
            <Select
              value={selectedWeek}
              onChange={(e) => {
                setSelectedWeek(e.target.value);
                setTablePage(1);
              }}
              containerClassName="min-w-[170px]"
            >
              <option value="all">All Weeks</option>
              {weekOptions.map((wk) => (
                <option key={wk} value={wk}>
                  Week of {formatDate(wk)}
                </option>
              ))}
            </Select>
          </div>

          {/* Member Filter */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-500 shrink-0" />
            <Select
              value={selectedMemberId}
              onChange={(e) => {
                setSelectedMemberId(e.target.value);
                setTablePage(1);
              }}
              containerClassName="min-w-[160px]"
            >
              <option value="all">All Members</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-emerald-500 shrink-0" />
            <Select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setTablePage(1);
              }}
              containerClassName="min-w-[150px]"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500 shrink-0" />
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setTablePage(1);
              }}
              containerClassName="min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Pending Review</option>
              <option value="needs_correction">Needs Correction</option>
              <option value="approved">Approved</option>
              <option value="not_started">Not Yet Submitted</option>
            </Select>
          </div>

          {(selectedWeek !== 'all' || selectedProjectId !== 'all' || selectedMemberId !== 'all' || selectedStatus !== 'all' || searchMember) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedWeek('all');
                setSelectedProjectId('all');
                setSelectedMemberId('all');
                setSelectedStatus('all');
                setSearchMember('');
                setTablePage(1);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Search */}
        <SearchInput
          value={searchMember}
          onChange={(e) => {
            setSearchMember(e.target.value);
            setTablePage(1);
          }}
          placeholder="Search team member..."
          containerClassName="w-full md:w-56"
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Pending Review"
          value={stats.submittedCount}
          subtext="Awaiting manager decision"
          icon={<Clock className="w-6 h-6" />}
          iconBgClass="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
          valueClass="text-sky-600 dark:text-sky-400"
        />
        <MetricCard
          label="Submission Compliance"
          value={`${stats.complianceRate}%`}
          subtext="On-time submission rate"
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="Needs Correction"
          value={stats.needsCorrectionCount}
          subtext="Sent back for member edit"
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          valueClass="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          label="Open Key Blockers"
          value={stats.totalOpenBlockers}
          subtext="Flagged across team"
          icon={<TrendingUp className="w-6 h-6" />}
          iconBgClass="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          valueClass="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Navigation View Switcher (Overview vs Tracker vs Side-by-Side Comparison) */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Overview & Charts
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'tracker'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" /> Weekly Team Submission Tracker
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'comparison'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Columns className="w-4 h-4 text-emerald-400" /> Side-by-Side Team Section View
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {activeTab === 'overview' && (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Tasks Completed */}
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary-500" /> Tasks Completed by Week
              </h3>
              <div className="h-56 w-full">
                {stats.weeklyTrends.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-400 italic">No task trend data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.weeklyTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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

            {/* Chart 2: Status Distribution */}
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                <PieIcon className="w-4 h-4 text-emerald-500" /> Report Submission Status Distribution
              </h3>
              <div className="h-56 w-full flex items-center justify-center">
                {stats.statusDistribution.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No reports found.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={stats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.statusDistribution.map((entry) => (
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

            {/* Chart 3: Workload Hours */}
            <Card className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-violet-500" /> Workload Hours Breakdown by Activity
              </h3>
              <div className="h-56 w-full">
                {stats.hoursByType.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-400 italic">No hours data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.hoursByType} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
                )}
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
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-4 text-center">No recent activity.</p>
                ) : (
                  recentActivities.map((act) => (
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

            {/* Submissions Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
                {loading ? (
                  <div className="py-12 flex justify-center"><LoadingSpinner message="Loading submissions..." /></div>
                ) : tableReports.length === 0 ? (
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
                          {tableReports.map((report) => (
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
                        totalItems={totalTableCount}
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
        </>
      )}

      {/* TAB 2: TEAM SUBMISSION TRACKER */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-500" />
                Team Submission Compliance Status for: <span className="text-primary-600 dark:text-primary-400 font-mono">{trackerWeek ? `Week of ${formatDate(trackerWeek)}` : 'Current Week'}</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Track submitted, approved, needs correction, and missing weekly reports across all engineers.
              </p>
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              Submitted: <strong className="text-emerald-600">{memberSubmissionMatrix.filter((m) => m.status !== 'not_started').length}</strong> / {teamMembers.length} Members
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Project Tag</th>
                    <th className="py-3 px-4">Submission Status</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                  {memberSubmissionMatrix.map(({ member, report, status }) => (
                    <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                            {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white leading-snug">{member.name}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        {report?.project ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: report.project.color_code || '#6366f1' }} />
                            {report.project.name}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">—</span>
                        )}
                      </td>

                      <td className="p-4 align-middle">
                        {status === 'not_started' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Not Yet Submitted
                          </span>
                        ) : (
                          <StatusBadge status={report!.status} />
                        )}
                      </td>

                      <td className="p-4 align-middle text-zinc-400 font-mono text-[11px]">
                        {report ? formatDate(report.updated_at) : 'Not submitted'}
                      </td>

                      <td className="p-4 align-middle text-right">
                        {report ? (
                          <Button
                            variant={report.status === 'submitted' ? 'primary' : 'secondary'}
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => navigate(report.status === 'submitted' ? `/reports/${report.id}/review` : `/reports/${report.id}`)}
                          >
                            {report.status === 'submitted' ? 'Review' : 'View'}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Users className="w-3.5 h-3.5" />}
                            onClick={() => navigate(`/team/${member.id}`)}
                          >
                            View Profile
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BONUS SIDE-BY-SIDE SECTION COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Columns className="w-4 h-4 text-emerald-500" />
                Side-by-Side Team Section View ({trackerWeek ? `Week of ${formatDate(trackerWeek)}` : 'All Weeks'})
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Compare a specific section across all team member submissions simultaneously.
              </p>
            </div>

            {/* Section Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'blockers', label: 'Blockers & Challenges', icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> },
                { id: 'achievements', label: 'Achievements', icon: <Award className="w-3.5 h-3.5 text-emerald-500" /> },
                { id: 'next_week', label: 'Next Week Plans', icon: <Sparkles className="w-3.5 h-3.5 text-primary-500" /> },
                { id: 'hours', label: 'Hours Breakdown', icon: <Clock className="w-3.5 h-3.5 text-violet-500" /> },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setComparisonSection(s.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                    comparisonSection === s.id
                      ? 'bg-primary-500 text-white font-bold shadow-sm'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {comparisonReports.length === 0 ? (
            <Card>
              <div className="py-12 text-center space-y-2">
                <FileText className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No reports found for the selected week</p>
                <p className="text-xs text-zinc-400">Select another week or clear filters to view cross-section comparisons.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {comparisonReports.map((report) => {
                const latestVer = report.versions && report.versions.length > 0 ? report.versions[report.versions.length - 1] : null;

                return (
                  <Card key={report.id} className="flex flex-col h-full space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">{report.user?.name || 'Engineer'}</h4>
                        <p className="text-[10px] text-zinc-400 font-mono">{report.user?.email}</p>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>

                    {/* Section Content */}
                    <div className="flex-1 space-y-2 text-xs">
                      {comparisonSection === 'blockers' && (
                        <>
                          {latestVer?.key_blocker && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold text-xs flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 shrink-0" /> Key: "{latestVer.key_blocker}"
                            </div>
                          )}
                          <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 leading-relaxed">
                            {latestVer?.blockers || 'No blockers reported.'}
                          </p>
                        </>
                      )}

                      {comparisonSection === 'achievements' && (
                        <>
                          {latestVer?.key_achievement && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                              <Award className="w-4 h-4 shrink-0" /> Highlight: "{latestVer.key_achievement}"
                            </div>
                          )}
                          <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 leading-relaxed">
                            {latestVer?.achievements || 'No achievements recorded.'}
                          </p>
                        </>
                      )}

                      {comparisonSection === 'next_week' && (
                        <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 leading-relaxed">
                          {latestVer?.next_week_tasks || 'No plans logged for next week.'}
                        </p>
                      )}

                      {comparisonSection === 'hours' && (
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20">
                            <span className="text-[10px] text-zinc-500 uppercase block">Development</span>
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400 font-mono">{latestVer?.hours_by_type_json?.development || 0}h</span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[10px] text-zinc-500 uppercase block">Testing</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{latestVer?.hours_by_type_json?.testing || 0}h</span>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-[10px] text-zinc-500 uppercase block">Meetings</span>
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">{latestVer?.hours_by_type_json?.meetings || 0}h</span>
                          </div>
                          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                            <span className="text-[10px] text-zinc-500 uppercase block">Documentation</span>
                            <span className="text-sm font-bold text-violet-600 dark:text-violet-400 font-mono">{latestVer?.hours_by_type_json?.documentation || 0}h</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Button */}
                    <Button
                      variant={report.status === 'submitted' ? 'primary' : 'secondary'}
                      size="sm"
                      fullWidth
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => navigate(report.status === 'submitted' ? `/reports/${report.id}/review` : `/reports/${report.id}`)}
                    >
                      {report.status === 'submitted' ? 'Review Report' : 'Inspect Report'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
