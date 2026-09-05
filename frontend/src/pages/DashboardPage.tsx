import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  FolderKanban,
  Search,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Activity,
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
import { reportsApi } from '../api/reportsApi';
import { projectsApi } from '../api/projectsApi';
import { WeeklyReport, ReportStatus } from '../types/report';
import { Project } from '../types/project';
import { useToast } from '../context/ToastContext';

// Custom Glassmorphic Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1">
        <p className="font-bold text-white mb-1 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span>{entry.name}:</span>
            <span className="font-mono font-bold text-white">{entry.value}</span>
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

  // Filters State
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchMember, setSearchMember] = useState<string>('');

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ─── 1. COMPUTE METRICS ───────────────────────────────────────────────────
  const totalReports = reports.length;
  const submittedCount = reports.filter((r) => r.status === 'submitted').length;
  const needsCorrectionCount = reports.filter((r) => r.status === 'needs_correction').length;
  const approvedCount = reports.filter((r) => r.status === 'approved').length;

  // Compliance Rate (submitted + approved vs total expected reports, e.g. 88%)
  const complianceRate = totalReports > 0 ? Math.round(((submittedCount + approvedCount) / totalReports) * 100) : 100;

  // Open Blockers Count
  const totalOpenBlockers = reports.reduce((acc, r) => {
    const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
    return acc + (latestVer?.key_blocker ? 1 : 0);
  }, 0);

  // ─── 2. CHART 1: TASKS COMPLETED TREND OVER TIME ────────────────────────
  // Group reports by week start date and count total completed tasks
  const trendDataMap: Record<string, { week: string; tasksCompleted: number; totalHours: number }> = {};

  reports.forEach((r) => {
    const weekLabel = typeof r.week_start_date === 'string'
      ? r.week_start_date.split('T')[0]
      : new Date(r.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!trendDataMap[weekLabel]) {
      trendDataMap[weekLabel] = { week: weekLabel, tasksCompleted: 0, totalHours: 0 };
    }

    const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
    if (latestVer?.tasks_json && Array.isArray(latestVer.tasks_json)) {
      const completedInReport = latestVer.tasks_json.filter((t: any) => t.status === 'completed' || t.actual_percentage === 100).length;
      trendDataMap[weekLabel].tasksCompleted += completedInReport;

      const spentInReport = latestVer.tasks_json.reduce((sum: number, t: any) => sum + (t.time_spent || 0), 0);
      trendDataMap[weekLabel].totalHours += spentInReport;
    }
  });

  const trendChartData = Object.values(trendDataMap).sort((a, b) => (a.week > b.week ? 1 : -1));

  // ─── 3. CHART 2: REPORT SUBMISSION STATUS BY TEAM MEMBER ─────────────────
  const memberStatusMap: Record<string, { name: string; Approved: number; Submitted: number; NeedsCorrection: number; Draft: number }> = {};

  reports.forEach((r) => {
    const name = r.user?.name || 'Unknown User';
    if (!memberStatusMap[name]) {
      memberStatusMap[name] = { name, Approved: 0, Submitted: 0, NeedsCorrection: 0, Draft: 0 };
    }

    if (r.status === 'approved') memberStatusMap[name].Approved += 1;
    else if (r.status === 'submitted') memberStatusMap[name].Submitted += 1;
    else if (r.status === 'needs_correction') memberStatusMap[name].NeedsCorrection += 1;
    else if (r.status === 'draft') memberStatusMap[name].Draft += 1;
  });

  const memberStatusChartData = Object.values(memberStatusMap);

  // ─── 4. CHART 3: WORKLOAD DISTRIBUTION BY PROJECT (PIE CHART) ─────────────
  const projectWorkloadMap: Record<string, { name: string; value: number; color: string }> = {};

  projects.forEach((p) => {
    projectWorkloadMap[p.id] = { name: p.name, value: 0, color: p.color_code || '#3B82F6' };
  });

  reports.forEach((r) => {
    if (r.project_id && projectWorkloadMap[r.project_id]) {
      projectWorkloadMap[r.project_id].value += 1;
    }
  });

  const projectPieChartData = Object.values(projectWorkloadMap).filter((p) => p.value > 0);

  // ─── 5. CHART 4: TIME SPENT BY TASK TYPE TEAM-WIDE ────────────────────────
  let devHours = 0;
  let testingHours = 0;
  let meetingsHours = 0;
  let docsHours = 0;
  let otherHours = 0;

  reports.forEach((r) => {
    const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
    if (latestVer?.hours_by_type_json) {
      devHours += latestVer.hours_by_type_json.development || 0;
      testingHours += latestVer.hours_by_type_json.testing || 0;
      meetingsHours += latestVer.hours_by_type_json.meetings || 0;
      docsHours += latestVer.hours_by_type_json.documentation || 0;
      otherHours += latestVer.hours_by_type_json.other || 0;
    }
  });

  const hoursTypeChartData = [
    {
      category: 'Hours Worked',
      Development: devHours,
      Testing: testingHours,
      Meetings: meetingsHours,
      Documentation: docsHours,
      Other: otherHours,
    },
  ];

  // ─── 6. RECENT ACTIVITY FEED ─────────────────────────────────────────────
  const recentActivities: Array<{
    id: string;
    userName: string;
    type: 'submitted' | 'approved' | 'needs_correction' | 'draft';
    text: string;
    timestamp: string;
    reportId: number;
  }> = [];

  reports.forEach((r) => {
    const userName = r.user?.name || 'Team Member';
    if (r.review_comments && r.review_comments.length > 0) {
      r.review_comments.forEach((comment) => {
        recentActivities.push({
          id: `comment-${comment.id}`,
          userName: comment.manager?.name || 'Manager',
          type: comment.action === 'approved' ? 'approved' : 'needs_correction',
          text: `${comment.action === 'approved' ? 'Approved' : 'Requested changes for'} ${userName}'s report`,
          timestamp: comment.created_at,
          reportId: r.id,
        });
      });
    }

    if (r.status === 'submitted') {
      recentActivities.push({
        id: `submit-${r.id}`,
        userName: userName,
        type: 'submitted',
        text: `Submitted weekly report for review`,
        timestamp: r.updated_at,
        reportId: r.id,
      });
    }
  });

  recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const topActivities = recentActivities.slice(0, 6);

  // ─── FILTERED REPORTS FOR DATA TABLE ─────────────────────────────────────
  const filteredReports = reports.filter((r) => {
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (selectedProjectId !== 'all' && String(r.project_id) !== selectedProjectId) return false;
    if (searchMember.trim()) {
      const memberName = r.user?.name || r.user?.email || '';
      if (!memberName.toLowerCase().includes(searchMember.toLowerCase())) return false;
    }
    return true;
  });

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'needs_correction':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs Correction
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
            <FileCheck2 className="w-3.5 h-3.5" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-sky-400" />
            Manager Analytics & Team Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Real-time insights, performance trends, workload breakdown & review actions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 font-semibold transition-all shrink-0"
        >
          Refresh Analytics
        </button>
      </div>

      {/* SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submitted */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reports Pending Review</p>
            <p className="text-3xl font-bold text-sky-400 font-mono mt-1">{submittedCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting manager decision</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Compliance Rate */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Submission Compliance</p>
            <p className="text-3xl font-bold text-emerald-400 font-mono mt-1">{complianceRate}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">On-time submission rate</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Needs Correction */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Needs Correction</p>
            <p className="text-3xl font-bold text-amber-400 font-mono mt-1">{needsCorrectionCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sent back for member edit</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Open Blockers */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Open Key Blockers</p>
            <p className="text-3xl font-bold text-rose-400 font-mono mt-1">{totalOpenBlockers}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Flagged across team</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* RECHARTS ANALYTICS GRID (4 CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: TASKS COMPLETED TREND OVER TIME */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Chart 1: Tasks Completed Trend Over Time
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Weekly Trend</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: REPORT SUBMISSION STATUS BY TEAM MEMBER */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Chart 2: Submission Status by Team Member
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Team Breakdown</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberStatusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Approved" stackId="a" fill="#10b981" />
                <Bar dataKey="Submitted" stackId="a" fill="#38bdf8" />
                <Bar dataKey="NeedsCorrection" name="Needs Correction" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Draft" stackId="a" fill="#64748b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: WORKLOAD DISTRIBUTION BY PROJECT */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-400" />
              Chart 3: Workload Distribution by Project
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Project Share</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {projectPieChartData.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No project data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={projectPieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {projectPieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 4: TIME SPENT BY TASK TYPE TEAM-WIDE */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Chart 4: Time Spent by Task Type Team-Wide
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Category Hours</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursTypeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Development" fill="#38bdf8" stackId="hours" />
                <Bar dataKey="Testing" fill="#10b981" stackId="hours" />
                <Bar dataKey="Meetings" fill="#f59e0b" stackId="hours" />
                <Bar dataKey="Documentation" fill="#8b5cf6" stackId="hours" />
                <Bar dataKey="Other" fill="#ec4899" stackId="hours" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY FEED & SUBMISSIONS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ACTIVITY FEED */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Recent Activity Feed
          </h3>

          <div className="space-y-3">
            {topActivities.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No recent activity.</p>
            ) : (
              topActivities.map((act) => (
                <div key={act.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 shrink-0 mt-0.5">
                    {act.type === 'approved' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : act.type === 'needs_correction' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-slate-200 leading-snug">
                      <strong className="text-white">{act.userName}</strong> {act.text}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{formatDate(act.timestamp)}</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/reports/${act.reportId}/review`)}
                        className="text-sky-400 hover:underline font-semibold"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FILTER CONTROLS & SUBMISSIONS DATA TABLE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  placeholder="Search team member..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 capitalize"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Pending Review (Submitted)</option>
                  <option value="needs_correction">Needs Correction</option>
                  <option value="approved">Approved</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <span className="text-xs text-slate-400 font-mono shrink-0">
              {filteredReports.length} Submissions
            </span>
          </div>

          <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Loading submissions...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                <p className="text-xs">No team reports match the selected filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Team Member</th>
                      <th className="py-3 px-4">Week Range</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 align-middle font-semibold text-white">
                          <p>{report.user?.name || 'Team Member'}</p>
                          <p className="text-[10px] text-slate-500 font-mono font-normal">{report.user?.email}</p>
                        </td>

                        <td className="p-3.5 align-middle text-slate-200">
                          {formatDate(report.week_start_date)} – {formatDate(report.week_end_date)}
                        </td>

                        <td className="p-3.5 align-middle">
                          {report.project ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: report.project.color_code || '#3B82F6' }} />
                              {report.project.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">No Tag</span>
                          )}
                        </td>

                        <td className="p-3.5 align-middle">{getStatusBadge(report.status)}</td>

                        <td className="p-3.5 align-middle text-right">
                          <button
                            type="button"
                            onClick={() => navigate(report.status === 'submitted' ? `/reports/${report.id}/review` : `/reports/${report.id}`)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                              report.status === 'submitted'
                                ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-md shadow-sky-500/20'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{report.status === 'submitted' ? 'Review' : 'View'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
