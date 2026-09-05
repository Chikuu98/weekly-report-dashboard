import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  ArrowLeft,
  Calendar,
  Folder,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  History,
  ShieldAlert,
  Award,
  Sparkles,
  Columns,
} from 'lucide-react';
import { reportsApi } from '../api/reportsApi';
import { WeeklyReport, ReportVersion, ReviewAction } from '../types/report';
import { useToast } from '../context/ToastContext';

export const ManagerReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const reportId = id ? parseInt(id, 10) : null;

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Version Comparison State
  const [currentVerNum, setCurrentVerNum] = useState<number>(1);
  const [compareVerNum, setCompareVerNum] = useState<number | null>(null);
  const [showSideBySide, setShowSideBySide] = useState<boolean>(false);

  // Review Form State
  const [action, setAction] = useState<ReviewAction>('approved');
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchReport = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const data = await reportsApi.getReportById(reportId);
      setReport(data);
      setCurrentVerNum(data.current_version);
      // Default comparison version to previous version if multiple exist
      if (data.versions && data.versions.length > 1) {
        setCompareVerNum(data.versions[data.versions.length - 2].version_number);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load report for review', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId) return;
    if (!comment.trim()) {
      showToast('A general review comment is mandatory', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await reportsApi.reviewReport(reportId, action, comment.trim());
      showToast(
        action === 'approved'
          ? 'Weekly report approved successfully!'
          : 'Changes requested and sent back for correction.',
        'success',
      );
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <div className="w-6 h-6 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading review interface...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Report Not Found</h2>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentVersion: ReportVersion | undefined =
    report.versions?.find((v) => v.version_number === currentVerNum) ||
    (report.versions && report.versions.length > 0 ? report.versions[report.versions.length - 1] : undefined);

  const compareVersion: ReportVersion | undefined =
    compareVerNum ? report.versions?.find((v) => v.version_number === compareVerNum) : undefined;

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderVersionContent = (ver?: ReportVersion, titlePrefix = 'Version') => {
    if (!ver) return <p className="text-slate-500 italic text-xs">No version content selected.</p>;

    return (
      <div className="space-y-4 text-xs">
        {/* Version Badge & Submission Timestamp */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
          <span className="font-bold text-sky-400">
            {titlePrefix} #{ver.version_number}
          </span>
          <span className="text-slate-400">
            Submitted: {ver.submitted_at ? formatDate(ver.submitted_at) : 'Draft / Unsubmitted'}
          </span>
        </div>

        {/* Tasks Breakdown */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Tasks Completed & Work Log
          </h4>
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold">
                  <th className="p-2">Task</th>
                  <th className="p-2 w-[80px]">Status</th>
                  <th className="p-2 w-[90px]">Plan/Act %</th>
                  <th className="p-2 w-[90px]">Hours</th>
                  <th className="p-2">Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {!ver.tasks_json || ver.tasks_json.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 italic">No tasks logged.</td>
                  </tr>
                ) : (
                  ver.tasks_json.map((t: any, idx: number) => (
                    <tr key={t.id || idx}>
                      <td className="p-2 font-medium text-white">{t.task_name}</td>
                      <td className="p-2 capitalize text-slate-300">{t.status?.replace('_', ' ')}</td>
                      <td className="p-2 font-mono text-emerald-400">{t.planned_percentage}% / {t.actual_percentage}%</td>
                      <td className="p-2 font-mono text-sky-400">{t.time_planned}h / {t.time_spent}h</td>
                      <td className="p-2 text-slate-300">{t.output_deliverable || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Next Week Tasks */}
        <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <h4 className="font-semibold text-slate-300 text-[11px]">Tasks Planned for Next Week:</h4>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{ver.next_week_tasks || 'None'}</p>
        </div>

        {/* Blockers & Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-semibold text-amber-400 text-[11px] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Blockers
            </h4>
            <p className="text-slate-300 whitespace-pre-wrap">{ver.blockers || 'None'}</p>
            {ver.key_blocker && (
              <p className="text-amber-400 font-semibold text-[10px]">Key Blocker: "{ver.key_blocker}"</p>
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Achievements
            </h4>
            <p className="text-slate-300 whitespace-pre-wrap">{ver.achievements || 'None'}</p>
            {ver.key_achievement && (
              <p className="text-emerald-400 font-semibold text-[10px]">Key Achievement: "{ver.key_achievement}"</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-6 h-6 text-sky-400" />
                Manager Review Console - Report #{report.id}
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
              Submitted by <strong className="text-slate-200">{report.user?.name || report.user?.email}</strong>
            </p>
          </div>
        </div>

        {/* Side-by-side View Toggle */}
        {report.versions && report.versions.length > 1 && (
          <button
            type="button"
            onClick={() => setShowSideBySide((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
              showSideBySide
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
            }`}
          >
            <Columns className="w-4 h-4 text-sky-400" />
            {showSideBySide ? 'Single View' : 'Side-by-Side Version Compare'}
          </button>
        )}
      </div>

      {/* Meta Info Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Week Range</p>
            <p className="text-xs font-bold text-white">
              {formatDate(report.week_start_date)} – {formatDate(report.week_end_date)}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <Folder className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Project Tag</p>
            <p className="text-xs font-bold text-white">
              {report.project ? report.project.name : 'No Project Tag'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Employee</p>
            <p className="text-xs font-bold text-white">
              {report.user?.name || report.user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Manager Review Action Card */}
      <div className="bg-gradient-to-r from-sky-500/10 via-slate-900 to-slate-900 border border-sky-500/30 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Take Review Action</h3>
            <p className="text-xs text-slate-400">
              Approve this report or request changes with a required comment.
            </p>
          </div>
        </div>

        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="managerAction"
                value="approved"
                checked={action === 'approved'}
                onChange={() => setAction('approved')}
                className="accent-emerald-500 w-4 h-4"
              />
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Approve Report
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="managerAction"
                value="needs_correction"
                checked={action === 'needs_correction'}
                onChange={() => setAction('needs_correction')}
                className="accent-amber-500 w-4 h-4"
              />
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Request Changes (Needs Correction)
              </span>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Manager General Review Comment *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                action === 'approved'
                  ? 'e.g. Great work this week! Deliverables complete and verified.'
                  : 'e.g. Please update the deliverable details for task #1 and adjust time spent.'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Manager Decision
            </button>
          </div>
        </form>
      </div>

      {/* Review Comments History */}
      {report.review_comments && report.review_comments.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            Previous Review Comments History
          </h3>
          <div className="space-y-2">
            {report.review_comments.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-semibold text-slate-200">
                    {rev.manager?.name || rev.manager?.email || `Manager #${rev.manager_id}`} (Version #{rev.version_number})
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
                <p className="text-[10px] text-slate-500 text-right">{formatDate(rev.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Report Inspection View: Single or Side-by-Side */}
      {showSideBySide && report.versions && report.versions.length > 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          {/* Left Column: Previous Version */}
          <div className="space-y-3 border-r border-slate-800/80 pr-0 lg:pr-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400">Previous Version Comparison</h3>
              {report.versions.length > 1 && (
                <select
                  value={compareVerNum || ''}
                  onChange={(e) => setCompareVerNum(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                >
                  {report.versions.map((v) => (
                    <option key={v.id} value={v.version_number}>
                      Version #{v.version_number}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {renderVersionContent(compareVersion, 'Previous Version')}
          </div>

          {/* Right Column: Version Under Review */}
          <div className="space-y-3 pl-0 lg:pl-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-400">Version Under Review (Current)</h3>
              <select
                value={currentVerNum}
                onChange={(e) => setCurrentVerNum(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
              >
                {report.versions.map((v) => (
                  <option key={v.id} value={v.version_number}>
                    Version #{v.version_number}
                  </option>
                ))}
              </select>
            </div>
            {renderVersionContent(currentVersion, 'Current Version')}
          </div>
        </div>
      ) : (
        /* Single View Mode */
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Report Content Breakdown</h3>
            {report.versions && report.versions.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Select Version:</span>
                {report.versions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setCurrentVerNum(v.version_number)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                      currentVerNum === v.version_number
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    v{v.version_number}
                  </button>
                ))}
              </div>
            )}
          </div>
          {renderVersionContent(currentVersion, 'Version')}
        </div>
      )}
    </div>
  );
};
