import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Calendar,
  Folder,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  History,
  Star,
  ShieldAlert,
  Award,
  Sparkles,
} from 'lucide-react';
import { reportsApi } from '../api/reportsApi';
import { WeeklyReport, ReportVersion, ReviewAction } from '../types/report';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isManager = user?.role === 'manager';
  const reportId = id ? parseInt(id, 10) : null;

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(1);

  // Manager Review Form state
  const [reviewAction, setReviewAction] = useState<ReviewAction>('approved');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewing, setReviewing] = useState<boolean>(false);

  const fetchReportDetails = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const data = await reportsApi.getReportById(reportId);
      setReport(data);
      setSelectedVersionNum(data.current_version);
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to load report details',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId) return;
    if (!reviewComment.trim()) {
      showToast('A review comment is mandatory for review actions', 'warning');
      return;
    }

    setReviewing(true);
    try {
      await reportsApi.reviewReport(reportId, reviewAction, reviewComment.trim());
      showToast(
        reviewAction === 'approved'
          ? 'Report successfully approved!'
          : 'Report sent back for correction with comment.',
        'success',
      );
      setReviewComment('');
      fetchReportDetails();
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to submit review',
        'error',
      );
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <div className="w-6 h-6 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading report detail view...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Report Not Found</h2>
        <p className="text-sm">The requested report could not be found or accessed.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Selected Version object
  const selectedVersion: ReportVersion | undefined =
    report.versions?.find((v) => v.version_number === selectedVersionNum) ||
    (report.versions && report.versions.length > 0
      ? report.versions[report.versions.length - 1]
      : undefined);

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
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-sky-400" />
                Report Details #{report.id}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                  report.status === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : report.status === 'needs_correction'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : report.status === 'submitted'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {report.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Submitted by <strong className="text-slate-200">{report.user?.name || report.user?.email || `User #${report.user_id}`}</strong>
            </p>
          </div>
        </div>

        {/* Action Button for Team Member if editable */}
        {!isManager && (report.status === 'draft' || report.status === 'needs_correction') && (
          <button
            type="button"
            onClick={() => navigate(`/report/edit/${report.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-semibold transition-all"
          >
            Edit & Resubmit Report
          </button>
        )}
      </div>

      {/* Version Selector Bar (if history exists) */}
      {report.versions && report.versions.length > 1 && (
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <History className="w-4 h-4 text-sky-400" />
            <span>Report Revision Snapshots:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {report.versions.map((ver) => (
              <button
                key={ver.id || ver.version_number}
                type="button"
                onClick={() => setSelectedVersionNum(ver.version_number)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  selectedVersionNum === ver.version_number
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Version #{ver.version_number} {ver.version_number === report.current_version ? '(Current)' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta Info Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Week Date Range</p>
            <p className="text-xs font-bold text-white">
              {formatDate(report.week_start_date)} – {formatDate(report.week_end_date)}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <Folder className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Project / Category</p>
            <p className="text-xs font-bold text-white">
              {report.project ? report.project.name : 'No Project Tag'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Team Member</p>
            <p className="text-xs font-bold text-white">
              {report.user?.name || report.user?.email || `User #${report.user_id}`}
            </p>
          </div>
        </div>
      </div>

      {/* Manager Review Action Box (visible to Managers if report is submitted) */}
      {isManager && report.status === 'submitted' && (
        <div className="bg-gradient-to-r from-sky-500/10 via-slate-900 to-slate-900 border border-sky-500/30 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manager Review Panel</h3>
              <p className="text-xs text-slate-400">
                Review this report and decide whether to Approve or Request Changes (Needs Correction).
              </p>
            </div>
          </div>

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="reviewAction"
                  value="approved"
                  checked={reviewAction === 'approved'}
                  onChange={() => setReviewAction('approved')}
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className="text-emerald-400">Approve Report</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="reviewAction"
                  value="needs_correction"
                  checked={reviewAction === 'needs_correction'}
                  onChange={() => setReviewAction('needs_correction')}
                  className="accent-amber-500 w-4 h-4"
                />
                <span className="text-amber-400">Request Changes (Needs Correction)</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Manager Review Comment *
              </label>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  reviewAction === 'approved'
                    ? 'e.g. Excellent work this week! Approved.'
                    : 'e.g. Please clarify the deliverable for task #2 and update actual %.'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={reviewing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              {reviewing ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Review Action
            </button>
          </form>
        </div>
      )}

      {/* Review Comments History */}
      {report.review_comments && report.review_comments.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            Review Comments & Feedback History
          </h3>
          <div className="space-y-2">
            {report.review_comments.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-semibold text-slate-200">
                    {rev.manager?.name || rev.manager?.email || `Manager #${rev.manager_id}`} (v{rev.version_number})
                  </span>
                  <span
                    className={`font-semibold capitalize ${
                      rev.action === 'approved' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    Action: {rev.action.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-300 italic font-normal">"{rev.comment}"</p>
                <p className="text-[10px] text-slate-500 text-right">
                  {formatDate(rev.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 1: Tasks Completed Table */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          Tasks Completed & Work Log (Version #{selectedVersionNum})
        </h3>
        <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/60 shadow-xl">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Task Name</th>
                <th className="py-3 px-3 w-[110px]">Priority</th>
                <th className="py-3 px-3 w-[120px]">Status</th>
                <th className="py-3 px-3 w-[140px]">Planned / Actual %</th>
                <th className="py-3 px-3 w-[130px]">Time (Plan / Spent)</th>
                <th className="py-3 px-4">Deliverable / Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {!selectedVersion?.tasks_json || selectedVersion.tasks_json.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                    No tasks logged in this version.
                  </td>
                </tr>
              ) : (
                selectedVersion.tasks_json.map((task: any, idx: number) => (
                  <tr key={task.id || idx} className="hover:bg-slate-800/30">
                    <td className="p-4 align-middle font-medium text-white">{task.task_name}</td>
                    <td className="p-3 align-middle capitalize">{task.priority}</td>
                    <td className="p-3 align-middle capitalize">{task.status?.replace('_', ' ')}</td>
                    <td className="p-3 align-middle font-mono">
                      {task.planned_percentage}% / <span className="text-emerald-400 font-bold">{task.actual_percentage}%</span>
                    </td>
                    <td className="p-3 align-middle font-mono">
                      {task.time_planned}h / <span className="text-sky-400 font-bold">{task.time_spent}h</span>
                    </td>
                    <td className="p-4 align-middle text-slate-300">{task.output_deliverable || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Tasks Planned For Next Week */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
        <h3 className="text-base font-semibold text-white">Tasks Planned for Next Week</h3>
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800">
          {selectedVersion?.next_week_tasks || 'No next week tasks specified.'}
        </p>
      </div>

      {/* Section 3 & 4: Blockers & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blockers */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Blockers & Challenges
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800">
            {selectedVersion?.blockers || 'No blockers reported.'}
          </p>
          {selectedVersion?.key_blocker && (
            <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Key Issue: "{selectedVersion.key_blocker}"</span>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            Achievements & Highlights
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800">
            {selectedVersion?.achievements || 'No achievements reported.'}
          </p>
          {selectedVersion?.key_achievement && (
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-emerald-400" />
              <span>Key Highlight: "{selectedVersion.key_achievement}"</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
