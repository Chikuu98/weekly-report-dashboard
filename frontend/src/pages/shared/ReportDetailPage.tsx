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
import { reportsApi } from '../../api/reportsApi';
import { WeeklyReport, ReportVersion, ReviewAction } from '../../types/report';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, LoadingSpinner, Button, Textarea, Card } from '../../components/ui';

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
      showToast(err.response?.data?.message || 'Failed to load report details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReportDetails(); }, [reportId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId) return;
    if (!reviewComment.trim()) { showToast('A review comment is mandatory', 'warning'); return; }
    setReviewing(true);
    try {
      await reportsApi.reviewReport(reportId, reviewAction, reviewComment.trim());
      showToast(reviewAction === 'approved' ? 'Report approved!' : 'Changes requested.', 'success');
      setReviewComment('');
      fetchReportDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="flex justify-center pt-16"><LoadingSpinner message="Loading report detail..." /></div>;

  if (!report) return (
    <div className="p-12 text-center space-y-4">
      <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Report Not Found</h2>
      <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const selectedVersion: ReportVersion | undefined = report.versions?.find((v) => v.version_number === selectedVersionNum) || (report.versions && report.versions.length > 0 ? report.versions[report.versions.length - 1] : undefined);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)} aria-label="Back" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Report Details #{report.id}
              </h1>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Submitted by <strong className="text-zinc-700 dark:text-zinc-200">{report.user?.name || report.user?.email || `User #${report.user_id}`}</strong>
            </p>
          </div>
        </div>
        {!isManager && (report.status === 'draft' || report.status === 'needs_correction') && (
          <Button variant="secondary" icon={<CheckCircle2 className="w-4 h-4 text-amber-500" />} onClick={() => navigate(`/report/edit/${report.id}`)}>
            Edit & Resubmit
          </Button>
        )}
      </div>

      {/* Version Selector */}
      {report.versions && report.versions.length > 1 && (
        <Card padding="sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <History className="w-4 h-4 text-primary-500" /> Revision Snapshots:
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {report.versions.map((ver) => (
                <button key={ver.id || ver.version_number} type="button" onClick={() => setSelectedVersionNum(ver.version_number)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${selectedVersionNum === ver.version_number ? 'bg-primary-500 text-white font-bold shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700'}`}>
                  v{ver.version_number} {ver.version_number === report.current_version ? '(Current)' : ''}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Meta Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Calendar className="w-4 h-4 text-primary-500 shrink-0" />, label: 'Week Range', value: `${formatDate(report.week_start_date)} – ${formatDate(report.week_end_date)}` },
          { icon: <Folder className="w-4 h-4 text-emerald-500 shrink-0" />, label: 'Project', value: report.project ? report.project.name : 'No Project Tag' },
          { icon: <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />, label: 'Team Member', value: report.user?.name || report.user?.email || `User #${report.user_id}` },
        ].map((item, i) => (
          <Card key={i} padding="sm">
            <div className="flex items-center gap-3">
              {item.icon}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">{item.label}</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Manager Review Panel */}
      {isManager && report.status === 'submitted' && (
        <Card className="border-primary-500/20 bg-primary-500/3 dark:bg-primary-500/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Manager Review Panel</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Approve or request changes with a mandatory comment.</p>
            </div>
          </div>
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="radio" name="reviewAction" value="approved" checked={reviewAction === 'approved'} onChange={() => setReviewAction('approved')} className="accent-emerald-500 w-4 h-4" />
                <span className="text-emerald-600 dark:text-emerald-400">Approve Report</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="radio" name="reviewAction" value="needs_correction" checked={reviewAction === 'needs_correction'} onChange={() => setReviewAction('needs_correction')} className="accent-amber-500 w-4 h-4" />
                <span className="text-amber-600 dark:text-amber-400">Request Changes</span>
              </label>
            </div>
            <Textarea label="Review Comment *" rows={3} required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
              placeholder={reviewAction === 'approved' ? 'e.g. Great work this week! Approved.' : 'e.g. Please clarify deliverable for task #2.'} />
            <Button type="submit" variant="primary" loading={reviewing} icon={<Send className="w-4 h-4" />}>Submit Review</Button>
          </form>
        </Card>
      )}

      {/* Review History */}
      {report.review_comments && report.review_comments.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-amber-500" /> Review Comments & Feedback History
          </h3>
          <div className="space-y-2">
            {report.review_comments.map((rev) => (
              <div key={rev.id} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{rev.manager?.name || `Manager #${rev.manager_id}`} (v{rev.version_number})</span>
                  <span className={`font-semibold capitalize ${rev.action === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{rev.action.replace('_', ' ')}</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 italic">"{rev.comment}"</p>
                <p className="text-[10px] text-zinc-400 text-right">{formatDate(rev.created_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tasks Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-500" />
          Tasks Completed & Work Log (Version #{selectedVersionNum})
        </h3>
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Plan / Actual %</th>
                  <th className="py-3 px-3">Time (Plan / Spent)</th>
                  <th className="py-3 px-4">Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                {!selectedVersion?.tasks_json || selectedVersion.tasks_json.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-zinc-400 italic">No tasks logged in this version.</td></tr>
                ) : (
                  selectedVersion.tasks_json.map((task: any, idx: number) => (
                    <tr key={task.id || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="p-4 align-middle font-medium text-zinc-900 dark:text-white">{task.task_name}</td>
                      <td className="p-3 align-middle capitalize text-zinc-600 dark:text-zinc-400">{task.priority}</td>
                      <td className="p-3 align-middle capitalize text-zinc-600 dark:text-zinc-400">{task.status?.replace('_', ' ')}</td>
                      <td className="p-3 align-middle font-mono">{task.planned_percentage}% / <span className="text-emerald-600 dark:text-emerald-400 font-bold">{task.actual_percentage}%</span></td>
                      <td className="p-3 align-middle font-mono">{task.time_planned}h / <span className="text-primary-600 dark:text-primary-400 font-bold">{task.time_spent}h</span></td>
                      <td className="p-4 align-middle text-zinc-600 dark:text-zinc-300">{task.output_deliverable || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Next Week / Blockers / Achievements */}
      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Tasks Planned for Next Week</h3>
        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
          {selectedVersion?.next_week_tasks || 'No next week tasks specified.'}
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Blockers & Challenges
          </h3>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
            {selectedVersion?.blockers || 'No blockers reported.'}
          </p>
          {selectedVersion?.key_blocker && (
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 mt-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Key Issue: "{selectedVersion.key_blocker}"
            </div>
          )}
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-emerald-500" /> Achievements & Highlights
          </h3>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
            {selectedVersion?.achievements || 'No achievements reported.'}
          </p>
          {selectedVersion?.key_achievement && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 mt-2">
              <Star className="w-3.5 h-3.5 fill-emerald-500" /> Key Highlight: "{selectedVersion.key_achievement}"
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
