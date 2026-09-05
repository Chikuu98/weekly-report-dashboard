import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  PlusCircle,
  Eye,
  Edit,
  Send,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck,
} from 'lucide-react';
import { reportsApi } from '../api/reportsApi';
import { WeeklyReport, ReportStatus } from '../types/report';
import { useToast } from '../context/ToastContext';

export const ReportHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getMyReports({
        page,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setReports(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to fetch report history',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, [page, statusFilter]);

  const handleSubmitReport = async (id: number) => {
    setSubmittingId(id);
    try {
      await reportsApi.submitReport(id);
      showToast('Report submitted for manager review!', 'success');
      fetchMyReports();
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to submit report',
        'error',
      );
    } finally {
      setSubmittingId(null);
    }
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
            Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
            <FileCheck className="w-3.5 h-3.5" />
            Draft
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-7 h-7 text-sky-400" />
            My Report History
          </h1>
          <p className="text-sm text-slate-400">
            View your weekly work report submissions, review statuses, and version histories.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/report/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Submit New Report
        </button>
      </div>

      {/* Filter Tabs & Counter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-sky-400" /> Filter Status:
          </span>
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'draft', label: 'Drafts' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'needs_correction', label: 'Needs Correction' },
            { id: 'approved', label: 'Approved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Total Reports: <strong className="text-white">{totalCount}</strong>
        </span>
      </div>

      {/* Reports List Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Fetching your weekly reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <History className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
            <p className="text-sm">
              {statusFilter === 'all'
                ? 'No weekly reports submitted yet.'
                : `No reports found with status '${statusFilter}'.`}
            </p>
            <button
              type="button"
              onClick={() => navigate('/report/new')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Weekly Report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-[220px]">Week Date Range</th>
                  <th className="py-3.5 px-4 w-[180px]">Project / Tag</th>
                  <th className="py-3.5 px-4 w-[140px]">Status</th>
                  <th className="py-3.5 px-4 w-[110px]">Version</th>
                  <th className="py-3.5 px-4 w-[160px]">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Week Range */}
                    <td className="p-4 align-middle font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
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
                    <td className="p-4 align-middle text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/reports/${report.id}`)}
                        className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition-all inline-flex items-center gap-1 text-xs font-medium"
                        title="View Report Details"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>

                      {(report.status === 'draft' || report.status === 'needs_correction') && (
                        <button
                          type="button"
                          onClick={() => navigate(`/report/edit/${report.id}`)}
                          className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all inline-flex items-center gap-1 text-xs font-medium"
                          title="Edit Report"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}

                      {report.status === 'draft' && (
                        <button
                          type="button"
                          disabled={submittingId === report.id}
                          onClick={() => handleSubmitReport(report.id)}
                          className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-all inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                          title="Submit Report for Manager Review"
                        >
                          {submittingId === report.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Submit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/80">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-xs text-slate-400 font-mono">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
