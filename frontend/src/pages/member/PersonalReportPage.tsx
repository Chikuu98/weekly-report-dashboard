import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FilePlus,
  Save,
  Send,
  Calendar,
  Folder,
  Clock,
  Sparkles,
  ArrowLeft,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';
import { projectsApi } from '../../api/projectsApi';
import { Project } from '../../types/project';
import { TaskItem, HoursByType, ReportStatus, ReviewComment } from '../../types/report';
import { useToast } from '../../context/ToastContext';
import { ManagerFeedbackBanner } from '../../components/reports/ManagerFeedbackBanner';
import { TasksTable } from '../../components/reports/TasksTable';
import { BlockersList } from '../../components/reports/BlockersList';
import { AchievementsList } from '../../components/reports/AchievementsList';
import { StatusBadge, LoadingSpinner, Button, DateInput, Select, Textarea, Card } from '../../components/ui';

export const PersonalReportPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEditing = Boolean(id);
  const reportId = id ? parseInt(id, 10) : null;

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<string>('');
  const [weekEndDate, setWeekEndDate] = useState<string>('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [nextWeekTasks, setNextWeekTasks] = useState<string>('');
  const [blockers, setBlockers] = useState<string>('');
  const [keyBlocker, setKeyBlocker] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<string>('');
  const [keyAchievement, setKeyAchievement] = useState<string | null>(null);
  const [hoursByType, setHoursByType] = useState<HoursByType>({ development: 20, testing: 10, meetings: 5, documentation: 5, other: 0 });
  const [notes, setNotes] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<ReportStatus>('draft');
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);

  const computeWeekRange = (dateStr?: string) => {
    const target = dateStr ? new Date(dateStr) : new Date();
    const day = target.getDay();
    const diffToMon = target.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(target.setDate(diffToMon));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const projList = await projectsApi.getProjects();
        setProjects(projList);

        if (reportId) {
          const report = await reportsApi.getReportById(reportId);
          setProjectId(report.project_id || null);
          setWeekStartDate(typeof report.week_start_date === 'string' ? report.week_start_date.split('T')[0] : new Date(report.week_start_date).toISOString().split('T')[0]);
          setWeekEndDate(typeof report.week_end_date === 'string' ? report.week_end_date.split('T')[0] : new Date(report.week_end_date).toISOString().split('T')[0]);
          setReportStatus(report.status);
          setCurrentVersion(report.current_version);
          setReviewComments(report.review_comments || []);
          const latestVer = report.versions && report.versions.length > 0 ? report.versions[report.versions.length - 1] : null;
          if (latestVer) {
            setTasks(latestVer.tasks_json || []);
            setNextWeekTasks(latestVer.next_week_tasks || '');
            setBlockers(latestVer.blockers || '');
            setKeyBlocker(latestVer.key_blocker || null);
            setAchievements(latestVer.achievements || '');
            setKeyAchievement(latestVer.key_achievement || null);
            if (latestVer.hours_by_type_json) {
              setHoursByType({ development: latestVer.hours_by_type_json.development || 0, testing: latestVer.hours_by_type_json.testing || 0, meetings: latestVer.hours_by_type_json.meetings || 0, documentation: latestVer.hours_by_type_json.documentation || 0, other: latestVer.hours_by_type_json.other || 0 });
            }
            setNotes(latestVer.notes || '');
          }
        } else {
          const range = computeWeekRange();
          setWeekStartDate(range.start);
          setWeekEndDate(range.end);
          if (projList.length > 0) setProjectId(projList[0].id);
          setTasks([{ id: Date.now().toString(), task_name: '', priority: 'medium', planned_percentage: 100, actual_percentage: 100, status: 'completed', time_planned: 8, time_spent: 8, output_deliverable: '' }]);
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to load report data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reportId]);

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const range = computeWeekRange(val);
    setWeekStartDate(range.start);
    setWeekEndDate(range.end);
  };

  const isFormLocked = reportStatus === 'submitted' || reportStatus === 'approved';

  const preparePayload = (statusOverride?: ReportStatus) => ({
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    project_id: projectId || undefined,
    tasks_json: tasks,
    next_week_tasks: nextWeekTasks,
    blockers,
    key_blocker: keyBlocker,
    achievements,
    key_achievement: keyAchievement,
    hours_by_type_json: hoursByType,
    notes,
    status: statusOverride,
  });

  const handleSaveDraft = async () => {
    if (!weekStartDate || !weekEndDate) { showToast('Please select a week start date', 'warning'); return; }
    setSaving(true);
    try {
      if (isEditing && reportId) {
        await reportsApi.updateReport(reportId, preparePayload());
        showToast('Draft saved successfully!', 'success');
      } else {
        const created = await reportsApi.createReport({ ...preparePayload(), status: 'draft' });
        showToast('Report draft created!', 'success');
        navigate(`/report/edit/${created.id}`, { replace: true });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!weekStartDate || !weekEndDate) { showToast('Please select a valid week range', 'warning'); return; }
    if (tasks.length === 0) { showToast('Please log at least one task', 'warning'); return; }
    setSubmitting(true);
    try {
      if (isEditing && reportId) {
        await reportsApi.updateReport(reportId, preparePayload());
        await reportsApi.submitReport(reportId);
        showToast(reportStatus === 'needs_correction' ? 'Report resubmitted for review!' : 'Report submitted successfully!', 'success');
      } else {
        await reportsApi.createReport({ ...preparePayload(), status: 'submitted' });
        showToast('Report created and submitted!', 'success');
      }
      navigate('/my-reports');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalHoursWorked = (hoursByType.development || 0) + (hoursByType.testing || 0) + (hoursByType.meetings || 0) + (hoursByType.documentation || 0) + (hoursByType.other || 0);

  if (loading) return <div className="flex justify-center pt-16"><LoadingSpinner message="Loading report editor..." /></div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Sticky Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl sticky top-0 z-20 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/my-reports')} aria-label="Back" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-emerald-500" />
                {isEditing ? `Edit Report #${reportId}` : 'Create Weekly Report'}
              </h1>
              <StatusBadge status={reportStatus} />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Structured weekly work report with tasks, blockers & achievements.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFormLocked && (
            <>
              <Button variant="secondary" icon={<Save className="w-4 h-4" />} loading={saving} onClick={handleSaveDraft}>
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button variant="primary" icon={<Send className="w-4 h-4" />} loading={submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting...' : reportStatus === 'needs_correction' ? 'Resubmit' : 'Submit Report'}
              </Button>
            </>
          )}
          {isFormLocked && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              {reportStatus === 'approved' ? 'Approved — Locked' : 'Under Review — Read Only'}
            </div>
          )}
        </div>
      </div>

      {/* Locked Banner */}
      {isFormLocked && (
        <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-xs flex items-center gap-3">
          <FileCheck2 className="w-5 h-5 shrink-0" />
          <span>This report is currently <strong>{reportStatus.toUpperCase()}</strong>. Changes are read-only while under review or after approval.</span>
        </div>
      )}

      {/* Manager Feedback */}
      {reportStatus === 'needs_correction' && <ManagerFeedbackBanner comments={reviewComments} currentVersion={currentVersion} />}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Row 1: Date Range & Project */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-500" /> Report Week Range *
              </label>
              <div className="flex items-center gap-2">
                <DateInput
                  disabled={isFormLocked}
                  value={weekStartDate}
                  onChange={handleWeekChange}
                  containerClassName="flex-1"
                  aria-label="Week start date"
                />
                <span className="text-zinc-400 text-xs font-medium shrink-0">to</span>
                <DateInput
                  disabled={isFormLocked}
                  value={weekEndDate}
                  onChange={(e) => setWeekEndDate(e.target.value)}
                  containerClassName="flex-1"
                  aria-label="Week end date"
                />
              </div>
              <p className="text-[11px] text-zinc-400">Selecting a date auto-snaps to Monday–Sunday week bounds.</p>
            </div>

            <Select
              label="Project or Category Tag"
              disabled={isFormLocked}
              value={projectId || ''}
              onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
              icon={<Folder className="w-4 h-4" />}
              hint="Assign this report to a client project or category."
            >
              <option value="">-- Select Project / Category --</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} {proj.description ? `(${proj.description})` : ''}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {/* Tasks Table */}
        <TasksTable tasks={tasks} onChange={setTasks} disabled={isFormLocked} />

        {/* Next Week Tasks */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Tasks Planned for Next Week</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Outline upcoming objectives, planned deliverables, and roadmap items.</p>
            </div>
          </div>
          <Textarea
            disabled={isFormLocked}
            rows={4}
            value={nextWeekTasks}
            onChange={(e) => setNextWeekTasks(e.target.value)}
            placeholder={"1. Finalize backend integration...\n2. Implement unit tests...\n3. Prepare client demo deck..."}
          />
        </Card>

        {/* Blockers & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BlockersList blockersText={blockers} keyBlocker={keyBlocker} onBlockersChange={setBlockers} onKeyBlockerChange={setKeyBlocker} disabled={isFormLocked} />
          <AchievementsList achievementsText={achievements} keyAchievement={keyAchievement} onAchievementsChange={setAchievements} onKeyAchievementChange={setKeyAchievement} disabled={isFormLocked} />
        </div>

        {/* Hours Breakdown + Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Hours Worked Breakdown</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Distribution across task categories.</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500">Total: </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">{totalHoursWorked}h</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { key: 'development' as keyof HoursByType, label: 'Dev' },
                { key: 'testing' as keyof HoursByType, label: 'Testing' },
                { key: 'meetings' as keyof HoursByType, label: 'Meetings' },
                { key: 'documentation' as keyof HoursByType, label: 'Docs' },
                { key: 'other' as keyof HoursByType, label: 'Other' },
              ].map(({ key, label }) => (
                <div key={key} className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1.5 col-span-1">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">{label}</span>
                  <input
                    type="number"
                    min="0"
                    disabled={isFormLocked}
                    value={hoursByType[key]}
                    onChange={(e) => setHoursByType({ ...hoursByType, [key]: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-primary-500 disabled:opacity-60"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Optional Notes or Links</h3>
            <Textarea
              disabled={isFormLocked}
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. PR links, docs URLs, design specs..."
            />
          </Card>
        </div>
      </form>
    </div>
  );
};
