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
import { reportsApi } from '../api/reportsApi';
import { projectsApi } from '../api/projectsApi';
import { Project } from '../types/project';
import {
  TaskItem,
  HoursByType,
  ReportStatus,
  ReviewComment,
} from '../types/report';
import { useToast } from '../context/ToastContext';
import { ManagerFeedbackBanner } from '../components/reports/ManagerFeedbackBanner';
import { TasksTable } from '../components/reports/TasksTable';
import { BlockersList } from '../components/reports/BlockersList';
import { AchievementsList } from '../components/reports/AchievementsList';

export const PersonalReportPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEditing = Boolean(id);
  const reportId = id ? parseInt(id, 10) : null;

  // Form States
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

  const [hoursByType, setHoursByType] = useState<HoursByType>({
    development: 20,
    testing: 10,
    meetings: 5,
    documentation: 5,
    other: 0,
  });

  const [notes, setNotes] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<ReportStatus>('draft');
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);

  // Helper to compute Monday & Sunday for a given date string or current date
  const computeWeekRange = (dateStr?: string) => {
    const target = dateStr ? new Date(dateStr) : new Date();
    const day = target.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = target.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(target.setDate(diffToMon));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects list
        const projList = await projectsApi.getProjects();
        setProjects(projList);

        if (reportId) {
          // Edit Mode: Fetch existing report
          const report = await reportsApi.getReportById(reportId);
          setProjectId(report.project_id || null);
          setWeekStartDate(
            typeof report.week_start_date === 'string'
              ? report.week_start_date.split('T')[0]
              : new Date(report.week_start_date).toISOString().split('T')[0],
          );
          setWeekEndDate(
            typeof report.week_end_date === 'string'
              ? report.week_end_date.split('T')[0]
              : new Date(report.week_end_date).toISOString().split('T')[0],
          );
          setReportStatus(report.status);
          setCurrentVersion(report.current_version);
          setReviewComments(report.review_comments || []);

          // Load latest version details
          const latestVer = report.versions && report.versions.length > 0
            ? report.versions[report.versions.length - 1]
            : null;

          if (latestVer) {
            setTasks(latestVer.tasks_json || []);
            setNextWeekTasks(latestVer.next_week_tasks || '');
            setBlockers(latestVer.blockers || '');
            setKeyBlocker(latestVer.key_blocker || null);
            setAchievements(latestVer.achievements || '');
            setKeyAchievement(latestVer.key_achievement || null);
            if (latestVer.hours_by_type_json) {
              setHoursByType({
                development: latestVer.hours_by_type_json.development || 0,
                testing: latestVer.hours_by_type_json.testing || 0,
                meetings: latestVer.hours_by_type_json.meetings || 0,
                documentation: latestVer.hours_by_type_json.documentation || 0,
                other: latestVer.hours_by_type_json.other || 0,
              });
            }
            setNotes(latestVer.notes || '');
          }
        } else {
          // Create Mode: Set default week start (Monday) and end (Sunday)
          const range = computeWeekRange();
          setWeekStartDate(range.start);
          setWeekEndDate(range.end);
          if (projList.length > 0) {
            setProjectId(projList[0].id);
          }
          // Seed default sample task row for smooth UX
          setTasks([
            {
              id: Date.now().toString(),
              task_name: '',
              priority: 'medium',
              planned_percentage: 100,
              actual_percentage: 100,
              status: 'completed',
              time_planned: 8,
              time_spent: 8,
              output_deliverable: '',
            },
          ]);
        }
      } catch (err: any) {
        showToast(
          err.response?.data?.message || 'Failed to load report data',
          'error',
        );
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

  const preparePayload = (statusOverride?: ReportStatus) => {
    return {
      week_start_date: weekStartDate,
      week_end_date: weekEndDate,
      project_id: projectId || undefined,
      tasks_json: tasks,
      next_week_tasks: nextWeekTasks,
      blockers: blockers,
      key_blocker: keyBlocker,
      achievements: achievements,
      key_achievement: keyAchievement,
      hours_by_type_json: hoursByType,
      notes: notes,
      status: statusOverride,
    };
  };

  const handleSaveDraft = async () => {
    if (!weekStartDate || !weekEndDate) {
      showToast('Please select a week start date', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && reportId) {
        await reportsApi.updateReport(reportId, preparePayload());
        showToast('Weekly report draft saved successfully!', 'success');
      } else {
        const created = await reportsApi.createReport({
          ...preparePayload(),
          status: 'draft',
        });
        showToast('Weekly report draft created!', 'success');
        navigate(`/report/edit/${created.id}`, { replace: true });
      }
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to save draft report',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!weekStartDate || !weekEndDate) {
      showToast('Please select a valid week range', 'warning');
      return;
    }

    if (tasks.length === 0) {
      showToast('Please log at least one task in the tasks table', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && reportId) {
        // Save current changes first
        await reportsApi.updateReport(reportId, preparePayload());
        // Call submit endpoint to update status & snapshot version
        await reportsApi.submitReport(reportId);
        showToast(
          reportStatus === 'needs_correction'
            ? 'Report resubmitted for manager review!'
            : 'Weekly report submitted successfully!',
          'success',
        );
      } else {
        // Create directly as submitted
        await reportsApi.createReport({
          ...preparePayload(),
          status: 'submitted',
        });
        showToast('Weekly report created and submitted for review!', 'success');
      }
      navigate('/my-reports');
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to submit report',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalHoursWorked =
    (hoursByType.development || 0) +
    (hoursByType.testing || 0) +
    (hoursByType.meetings || 0) +
    (hoursByType.documentation || 0) +
    (hoursByType.other || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <div className="w-6 h-6 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading report editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/my-reports')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Back to my reports"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <FilePlus className="w-6 h-6 text-emerald-400" />
                {isEditing ? `Edit Report #${reportId}` : 'Create Weekly Report'}
              </h1>

              {/* Status Badge */}
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                  reportStatus === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : reportStatus === 'needs_correction'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : reportStatus === 'submitted'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {reportStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Complete your structured weekly work report, task breakdown, blockers & achievements.
            </p>
          </div>
        </div>

        {/* Header CTA Buttons */}
        <div className="flex items-center gap-3">
          {!isFormLocked && (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-all disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-slate-400" />
                )}
                Save Draft
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {reportStatus === 'needs_correction'
                  ? 'Resubmit Report'
                  : 'Submit Report'}
              </button>
            </>
          )}

          {isFormLocked && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold">
              <Lock className="w-4 h-4 text-emerald-400" />
              Report Locked ({reportStatus === 'approved' ? 'Approved' : 'Under Review'})
            </div>
          )}
        </div>
      </div>

      {/* Locked Alert if Submitted/Approved */}
      {isFormLocked && (
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs flex items-center gap-3">
          <FileCheck2 className="w-5 h-5 shrink-0 text-sky-400" />
          <span>
            This report is currently <strong>{reportStatus.toUpperCase()}</strong>. Changes are read-only while under review or after approval.
          </span>
        </div>
      )}

      {/* Manager Feedback Banner (if status === 'needs_correction') */}
      {reportStatus === 'needs_correction' && (
        <ManagerFeedbackBanner
          comments={reviewComments}
          currentVersion={currentVersion}
        />
      )}

      {/* Main Report Form Controls */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Row 1: Week Selector & Project Tag */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-sm">
          {/* Week Date Range */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              Report Week / Date Range *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                disabled={isFormLocked}
                value={weekStartDate}
                onChange={handleWeekChange}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-60"
              />
              <span className="text-slate-500 text-xs font-medium">to</span>
              <input
                type="date"
                disabled={isFormLocked}
                value={weekEndDate}
                onChange={(e) => setWeekEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-60"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Selecting any date automatically snaps to the Monday–Sunday week bounds.
            </p>
          </div>

          {/* Project Tag Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-emerald-400" />
              Project or Category Tag
            </label>
            <select
              disabled={isFormLocked}
              value={projectId || ''}
              onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-60"
            >
              <option value="">-- Select Project / Category --</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} {proj.description ? `(${proj.description})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Assign your work log to a specific client project or category.
            </p>
          </div>
        </div>

        {/* Section 1: Tasks Completed Table */}
        <TasksTable
          tasks={tasks}
          onChange={setTasks}
          disabled={isFormLocked}
        />

        {/* Section 2: Tasks Planned For Next Week */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Tasks Planned for Next Week
              </h3>
              <p className="text-xs text-slate-400">
                Outline upcoming objectives, planned deliverables, and roadmap items for next week.
              </p>
            </div>
          </div>
          <textarea
            disabled={isFormLocked}
            rows={4}
            value={nextWeekTasks}
            onChange={(e) => setNextWeekTasks(e.target.value)}
            placeholder="1. Finalize backend integration for team dashboard...&#10;2. Implement unit tests for role-based access...&#10;3. Prepare client demo deck..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 disabled:opacity-60 leading-relaxed"
          />
        </div>

        {/* Section 3 & 4: Blockers and Achievements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BlockersList
            blockersText={blockers}
            keyBlocker={keyBlocker}
            onBlockersChange={setBlockers}
            onKeyBlockerChange={setKeyBlocker}
            disabled={isFormLocked}
          />
          <AchievementsList
            achievementsText={achievements}
            keyAchievement={keyAchievement}
            onAchievementsChange={setAchievements}
            onKeyAchievementChange={setKeyAchievement}
            disabled={isFormLocked}
          />
        </div>

        {/* Section 5: Hours Worked Breakdown by Category & Optional Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hours Breakdown */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Hours Worked Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">
                    Distribution of working hours across task categories.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Hours: </span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {totalHoursWorked} hrs
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">Dev</span>
                <input
                  type="number"
                  min="0"
                  disabled={isFormLocked}
                  value={hoursByType.development}
                  onChange={(e) =>
                    setHoursByType({ ...hoursByType, development: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500 disabled:opacity-60"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">Testing</span>
                <input
                  type="number"
                  min="0"
                  disabled={isFormLocked}
                  value={hoursByType.testing}
                  onChange={(e) =>
                    setHoursByType({ ...hoursByType, testing: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500 disabled:opacity-60"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">Meetings</span>
                <input
                  type="number"
                  min="0"
                  disabled={isFormLocked}
                  value={hoursByType.meetings}
                  onChange={(e) =>
                    setHoursByType({ ...hoursByType, meetings: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500 disabled:opacity-60"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">Docs</span>
                <input
                  type="number"
                  min="0"
                  disabled={isFormLocked}
                  value={hoursByType.documentation}
                  onChange={(e) =>
                    setHoursByType({ ...hoursByType, documentation: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500 disabled:opacity-60"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-slate-400">Other</span>
                <input
                  type="number"
                  min="0"
                  disabled={isFormLocked}
                  value={hoursByType.other}
                  onChange={(e) =>
                    setHoursByType({ ...hoursByType, other: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Optional Notes / Links */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-base font-semibold text-white">
              Optional Notes or Links
            </h3>
            <textarea
              disabled={isFormLocked}
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. PR links, documentation URLs, design specs..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 disabled:opacity-60 leading-relaxed"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
