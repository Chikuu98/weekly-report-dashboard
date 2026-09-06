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
} from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';
import { WeeklyReport } from '../../types/report';
import { useToast } from '../../context/ToastContext';
import {
  PageHeader,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  Button,
  Pagination,
} from '../../components/ui';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'needs_correction', label: 'Needs Correction' },
  { id: 'approved', label: 'Approved' },
];

export const ReportHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getMyReports({
        page,
        limit: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setReports(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch report history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, [page, pageSize, statusFilter]);

  const handleSubmitReport = async (id: number) => {
    setSubmittingId(id);
    try {
      await reportsApi.submitReport(id);
      showToast('Report submitted for manager review!', 'success');
      fetchMyReports();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<History className="w-5 h-5" />}
        title="My Report History"
        subtitle="View your weekly work report submissions, review statuses, and version histories."
        action={
          <Button
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/report/new')}
          >
            Submit New Report
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-2 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-primary-500" /> Filter:
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
          Total: <strong className="text-zinc-700 dark:text-zinc-200">{totalCount}</strong>
        </span>
      </div>

      {/* Reports Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-14 flex justify-center">
            <LoadingSpinner message="Fetching your reports..." />
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<History className="w-12 h-12" />}
            title={statusFilter === 'all' ? 'No weekly reports yet.' : `No '${statusFilter}' reports found.`}
            description="Create your first weekly report to get started."
            action={
              <Button
                variant="ghost"
                icon={<PlusCircle className="w-4 h-4" />}
                onClick={() => navigate('/report/new')}
                className="border border-primary-500/20 text-primary-600 dark:text-primary-400 bg-primary-500/5"
              >
                Create First Report
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Week Range</th>
                    <th className="py-3.5 px-4">Project</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Version</th>
                    <th className="py-3.5 px-4">Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                  {reports.map((report) => (
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
                      <td className="p-4 align-middle">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="p-4 align-middle font-mono text-zinc-400">v{report.current_version}</td>
                      <td className="p-4 align-middle text-zinc-400 font-mono">{formatDate(report.updated_at)}</td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => navigate(`/reports/${report.id}`)}
                          >
                            View
                          </Button>
                          {(report.status === 'draft' || report.status === 'needs_correction') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit className="w-3.5 h-3.5" />}
                              onClick={() => navigate(`/report/edit/${report.id}`)}
                            >
                              Edit
                            </Button>
                          )}
                          {report.status === 'draft' && (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={submittingId === report.id}
                              icon={<Send className="w-3.5 h-3.5" />}
                              onClick={() => handleSubmitReport(report.id)}
                            >
                              Submit
                            </Button>
                          )}
                        </div>
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
                totalItems={totalCount}
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
