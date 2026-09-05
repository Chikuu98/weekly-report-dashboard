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
  Calendar,
  FolderKanban,
  Search,
  PieChart,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { reportsApi } from '../api/reportsApi';
import { projectsApi } from '../api/projectsApi';
import { WeeklyReport, ReportStatus } from '../types/report';
import { Project } from '../types/project';
import { useToast } from '../context/ToastContext';

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
      showToast(
        err.response?.data?.message || 'Failed to load dashboard data',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Metrics
  const totalReports = reports.length;
  const submittedCount = reports.filter((r) => r.status === 'submitted').length;
  const needsCorrectionCount = reports.filter((r) => r.status === 'needs_correction').length;
  const approvedCount = reports.filter((r) => r.status === 'approved').length;
  const draftCount = reports.filter((r) => r.status === 'draft').length;

  const totalOpenBlockers = reports.reduce((acc, r) => {
    const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
    return acc + (latestVer?.key_blocker ? 1 : 0);
  }, 0);

  // Filtered reports list
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
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'needs_correction':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs Correction
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
            <FileCheck2 className="w-3.5 h-3.5" />
            Draft
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
            Manager Console & Team Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Monitor team weekly submissions, analyze review cycles, and approve work reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboardData}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 font-semibold transition-all"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Review</p>
            <p className="text-3xl font-bold text-sky-400 font-mono mt-1">{submittedCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting manager approval</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Needs Correction</p>
            <p className="text-3xl font-bold text-amber-400 font-mono mt-1">{needsCorrectionCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sent back for member updates</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Approved Reports</p>
            <p className="text-3xl font-bold text-emerald-400 font-mono mt-1">{approvedCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Satisfied & finalized</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Open Key Blockers</p>
            <p className="text-3xl font-bold text-rose-400 font-mono mt-1">{totalOpenBlockers}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Flagged across all submissions</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Progress */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-sky-400" />
              Submission Status Distribution
            </h3>
            <span className="text-xs font-mono text-slate-400">{totalReports} Total</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-sky-400">Pending Review (Submitted)</span>
                <span className="text-slate-300 font-mono">{submittedCount}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all"
                  style={{ width: `${totalReports ? (submittedCount / totalReports) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-amber-400">Needs Correction</span>
                <span className="text-slate-300 font-mono">{needsCorrectionCount}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${totalReports ? (needsCorrectionCount / totalReports) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-400">Approved</span>
                <span className="text-slate-300 font-mono">{approvedCount}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${totalReports ? (approvedCount / totalReports) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Draft (In Progress)</span>
                <span className="text-slate-300 font-mono">{draftCount}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-slate-700 h-full rounded-full transition-all"
                  style={{ width: `${totalReports ? (draftCount / totalReports) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Project Workload Distribution */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Project & Category Workload Distribution
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {projects.map((proj) => {
              const count = reports.filter((r) => r.project_id === proj.id).length;
              return (
                <div key={proj.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: proj.color_code || '#3B82F6' }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">{proj.name}</p>
                      <p className="text-[10px] text-slate-500">{proj.description || 'Category tag'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    {count} {count === 1 ? 'Report' : 'Reports'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Member Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Filter by team member..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Status Dropdown */}
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

          {/* Project Dropdown */}
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
          Showing {filteredReports.length} of {reports.length} records
        </span>
      </div>

      {/* Reports Data Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Fetching team submissions...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
            <p className="text-sm">No team reports match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-[200px]">Team Member</th>
                  <th className="py-3.5 px-4 w-[200px]">Week Range</th>
                  <th className="py-3.5 px-4 w-[160px]">Project / Tag</th>
                  <th className="py-3.5 px-4 w-[140px]">Status</th>
                  <th className="py-3.5 px-4 w-[100px]">Version</th>
                  <th className="py-3.5 px-4 w-[150px]">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Member */}
                    <td className="p-4 align-middle font-semibold text-white">
                      <div>
                        <p>{report.user?.name || 'Team Member'}</p>
                        <p className="text-[10px] text-slate-500 font-mono font-normal">
                          {report.user?.email}
                        </p>
                      </div>
                    </td>

                    {/* Week Range */}
                    <td className="p-4 align-middle font-medium text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>
                          {formatDate(report.week_start_date)} – {formatDate(report.week_end_date)}
                        </span>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="p-4 align-middle">
                      {report.project ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: report.project.color_code || '#3B82F6' }}
                          />
                          {report.project.name}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No Project Tag</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 align-middle">
                      {getStatusBadge(report.status)}
                    </td>

                    {/* Version */}
                    <td className="p-4 align-middle font-mono text-slate-400">
                      v{report.current_version}
                    </td>

                    {/* Updated At */}
                    <td className="p-4 align-middle text-slate-400 font-mono">
                      {formatDate(report.updated_at)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/reports/${report.id}`)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          report.status === 'submitted'
                            ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-md shadow-sky-500/20'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{report.status === 'submitted' ? 'Review Submission' : 'View Report'}</span>
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
  );
};
