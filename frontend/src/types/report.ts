import { Project } from './project';
import { User } from './auth';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type ReportStatus = 'draft' | 'submitted' | 'needs_correction' | 'approved';
export type ReviewAction = 'needs_correction' | 'approved';

export interface TaskItem {
  id: string;
  task_name: string;
  priority: TaskPriority;
  planned_percentage: number;
  actual_percentage: number;
  status: TaskStatus;
  time_planned: number;
  time_spent: number;
  output_deliverable: string;
}

export interface HoursByType {
  development: number;
  testing: number;
  meetings: number;
  documentation: number;
  other: number;
}

export interface ReportVersion {
  id: number;
  report_id: number;
  version_number: number;
  tasks_json: TaskItem[];
  next_week_tasks: string;
  blockers: string;
  key_blocker: string | null;
  achievements: string;
  key_achievement: string | null;
  hours_by_type_json: HoursByType | null;
  notes: string | null;
  submitted_at: string | null;
}

export interface ReviewComment {
  id: number;
  report_id: number;
  version_number: number;
  manager_id: number;
  manager?: User;
  comment: string;
  action: ReviewAction;
  created_at: string;
}

export interface WeeklyReport {
  id: number;
  user_id: number;
  user?: User;
  project_id: number | null;
  project?: Project | null;
  week_start_date: string;
  week_end_date: string;
  status: ReportStatus;
  current_version: number;
  created_at: string;
  updated_at: string;
  versions?: ReportVersion[];
  review_comments?: ReviewComment[];
}

export interface CreateReportPayload {
  week_start_date: string;
  week_end_date: string;
  project_id?: number | null;
  tasks_json?: TaskItem[];
  next_week_tasks?: string;
  blockers?: string;
  key_blocker?: string | null;
  achievements?: string;
  key_achievement?: string | null;
  hours_by_type_json?: HoursByType | null;
  notes?: string;
  status?: ReportStatus;
}

export interface UpdateReportPayload {
  week_start_date?: string;
  week_end_date?: string;
  project_id?: number | null;
  tasks_json?: TaskItem[];
  next_week_tasks?: string;
  blockers?: string;
  key_blocker?: string | null;
  achievements?: string;
  key_achievement?: string | null;
  hours_by_type_json?: HoursByType | null;
  notes?: string;
  status?: ReportStatus;
}

export interface ReportsPaginatedResponse {
  data: WeeklyReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
