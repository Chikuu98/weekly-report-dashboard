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
import { reportsApi } from '../../api/reportsApi';
import { WeeklyReport, ReportVersion, ReviewAction } from '../../types/report';
import { useToast } from '../../context/ToastContext';
import {
  StatusBadge,
  LoadingSpinner,
  Button,
  Textarea,
  Card,
  Select,
} from '../../components/ui';

export const ManagerReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const reportId = id ? parseInt(id, 10) : null;
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentVerNum, setCurrentVerNum] = useState<number>(1);
  const [compareVerNum, setCompareVerNum] = useState<number | null>(null);
  const [showSideBySide, setShowSideBySide] = useState<boolean>(false);

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
      if (data.versions && data.versions.length > 1) {
        setCompareVerNum(data.versions[data.versions.length - 2].version_number);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load report for review', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [reportId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId) return;
    if (!comment.trim()) { showToast('A review comment is mandatory', 'warning'); return; }
    setSubmitting(true);
    try {
      await reportsApi.reviewReport(reportId, action, comment.trim());
      showToast(action === 'approved' ? 'Report approved successfully!' : 'Changes requested.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderVersionContent = (ver?: ReportVersion, titlePrefix = 'Version') => {
    if (!ver) return <p className="text-zinc-400 italic text-xs">No version selected.</p>;
    return (
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]">
          <span className="font-bold text-primary-600 dark:text-primary-400">{titlePrefix} #{ver.version_number}</span>
          <span className="text-zinc-500">{ver.submitted_at ? formatDate(ver.submitted_at) : 'Draft'}</span>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" /> Tasks Completed
          </h4>
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-xl">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 font-semibold">
                  <th className="p-2">Task</th>
                  <th className="p-2 w-[80px]">Status</th>
                  <th className="p-2 w-[90px]">Plan/Act %</th>
                  <th className="p-2 w-[90px]">Hours</th>
                  <th className="p-2">Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {!ver.tasks_json || ver.tasks_json.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-zinc-400 italic">No tasks logged.</td></tr>
                ) : (
                  ver.tasks_json.map((t: any, idx: number) => (
                    <tr key={t.id || idx}>
                      <td className="p-2 font-medium text-zinc-900 dark:text-white">{t.task_name}</td>
                      <td className="p-2 capitalize">{t.status?.replace('_', ' ')}</td>
                      <td className="p-2 font-mono text-emerald-600 dark:text-emerald-400">{t.planned_percentage}% / {t.actual_percentage}%</td>
                      <td className="p-2 font-mono text-primary-600 dark:text-primary-400">{t.time_planned}h / {t.time_spent}h</td>
                      <td className="p-2">{t.output_deliverable || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1">
          <h4 className="font-semibold text-zinc-600 dark:text-zinc-400 text-[11px]">Tasks Planned for Next Week:</h4>
          <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{ver.next_week_tasks || 'None'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1">
            <h4 className="font-semibold text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Blockers</h4>
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{ver.blockers || 'None'}</p>
            {ver.key_blocker && <p className="text-amber-600 dark:text-amber-400 font-semibold text-[10px]">Key: "{ver.key_blocker}"</p>}
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1">
            <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Achievements</h4>
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{ver.achievements || 'None'}</p>
            {ver.key_achievement && <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">Key: "{ver.key_achievement}"</p>}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center pt-16"><LoadingSpinner message="Loading review interface..." /></div>;

  if (!report) return (
    <div className="p-12 text-center space-y-4">
      <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Report Not Found</h2>
      <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  );

  const currentVersion: ReportVersion | undefined = report.versions?.find((v) => v.version_number === currentVerNum) || (report.versions && report.versions.length > 0 ? report.versions[report.versions.length - 1] : undefined);
  const compareVersion: ReportVersion | undefined = compareVerNum ? report.versions?.find((v) => v.version_number === compareVerNum) : undefined;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/dashboard')} aria-label="Back" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-primary-500" />
                Manager Review — Report #{report.id}
              </h1>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Submitted by <strong className="text-zinc-700 dark:text-zinc-200">{report.user?.name || report.user?.email}</strong>
            </p>
          </div>
        </div>
        {report.versions && report.versions.length > 1 && (
          <Button
            variant={showSideBySide ? 'primary' : 'secondary'}
            size="sm"
            icon={<Columns className="w-4 h-4" />}
            onClick={() => setShowSideBySide((prev) => !prev)}
          >
            {showSideBySide ? 'Single View' : 'Side-by-Side Compare'}
          </Button>
        )}
      </div>

      {/* Meta Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Calendar className="w-4 h-4 text-primary-500" />, label: 'Week Range', value: `${formatDate(report.week_start_date)} – ${formatDate(report.week_end_date)}` },
          { icon: <Folder className="w-4 h-4 text-emerald-500" />, label: 'Project', value: report.project ? report.project.name : 'No Project' },
          { icon: <UserCheck className="w-4 h-4 text-amber-500" />, label: 'Employee', value: report.user?.name || report.user?.email },
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

      {/* Review Action Card */}
      <Card className="border-primary-500/20 bg-primary-500/3 dark:bg-primary-500/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Take Review Action</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Approve this report or request changes with a required comment.</p>
          </div>
        </div>

        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="radio" name="managerAction" value="approved" checked={action === 'approved'} onChange={() => setAction('approved')} className="accent-emerald-500 w-4 h-4" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Approve Report
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="radio" name="managerAction" value="needs_correction" checked={action === 'needs_correction'} onChange={() => setAction('needs_correction')} className="accent-amber-500 w-4 h-4" />
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Request Changes
              </span>
            </label>
          </div>

          <Textarea
            label="Manager Review Comment *"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={action === 'approved' ? 'e.g. Great work this week! Deliverables complete.' : 'e.g. Please update deliverable details for task #1.'}
          />

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate('/dashboard')}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting} icon={<Send className="w-4 h-4" />}>Submit Decision</Button>
          </div>
        </form>
      </Card>

      {/* Previous Comments */}
      {report.review_comments && report.review_comments.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-amber-500" /> Previous Review Comments
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

      {/* Report Content */}
      {showSideBySide && report.versions && report.versions.length > 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400">Previous Version</h3>
              <Select value={compareVerNum || ''} onChange={(e) => setCompareVerNum(Number(e.target.value))}>
                {report.versions.map((v) => <option key={v.id} value={v.version_number}>Version #{v.version_number}</option>)}
              </Select>
            </div>
            {renderVersionContent(compareVersion, 'Previous')}
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Current Version</h3>
              <Select value={currentVerNum} onChange={(e) => setCurrentVerNum(Number(e.target.value))}>
                {report.versions.map((v) => <option key={v.id} value={v.version_number}>Version #{v.version_number}</option>)}
              </Select>
            </div>
            {renderVersionContent(currentVersion, 'Current')}
          </Card>
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Report Content</h3>
            {report.versions && report.versions.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Version:</span>
                {report.versions.map((v) => (
                  <button key={v.id} type="button" onClick={() => setCurrentVerNum(v.version_number)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${currentVerNum === v.version_number ? 'bg-primary-500 text-white font-bold' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700'}`}>
                    v{v.version_number}
                  </button>
                ))}
              </div>
            )}
          </div>
          {renderVersionContent(currentVersion, 'Version')}
        </Card>
      )}
    </div>
  );
};
