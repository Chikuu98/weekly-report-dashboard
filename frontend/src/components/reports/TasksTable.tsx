import React from 'react';
import { Plus, Trash2, CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '../../types/report';

interface TasksTableProps {
  tasks: TaskItem[];
  onChange: (tasks: TaskItem[]) => void;
  disabled?: boolean;
}

export const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  onChange,
  disabled = false,
}) => {
  const addTask = () => {
    const newTask: TaskItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      task_name: '',
      priority: 'medium',
      planned_percentage: 100,
      actual_percentage: 0,
      status: 'in_progress',
      time_planned: 4,
      time_spent: 0,
      output_deliverable: '',
    };
    onChange([...tasks, newTask]);
  };

  const updateTask = (id: string, field: keyof TaskItem, value: any) => {
    const updated = tasks.map((task) => {
      if (task.id === id) {
        const newTask = { ...task, [field]: value };
        // Auto-update status if actual % is set to 100
        if (field === 'actual_percentage') {
          const pct = Number(value);
          if (pct === 100 && newTask.status !== 'completed') {
            newTask.status = 'completed';
          } else if (pct < 100 && pct > 0 && newTask.status === 'completed') {
            newTask.status = 'in_progress';
          }
        }
        return newTask;
      }
      return task;
    });
    onChange(updated);
  };

  const removeTask = (id: string) => {
    onChange(tasks.filter((t) => t.id !== id));
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-primary-500" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Circle className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Tasks Completed & Work Breakdown
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-mono">
              {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Specify task details, planned vs actual progress %, effort spent, and deliverables.
          </p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={addTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/30 text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Task Row
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm">
        <table className="w-full text-left text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-[260px]">Task Name & Description</th>
              <th className="py-3 px-2 w-[110px]">Priority</th>
              <th className="py-3 px-2 w-[120px]">Status</th>
              <th className="py-3 px-2 w-[150px]">Planned % / Actual %</th>
              <th className="py-3 px-2 w-[130px]">Time (Planned / Spent)</th>
              <th className="py-3 px-3">Deliverable / Output</th>
              {!disabled && <th className="py-3 px-2 w-[50px] text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 6 : 7} className="py-8 text-center text-zinc-400 dark:text-zinc-500 italic">
                  No tasks added yet. Click "Add Task Row" above to start logging your weekly work.
                </td>
              </tr>
            ) : (
              tasks.map((task, idx) => (
                <tr key={task.id || idx} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                  {/* Task Name */}
                  <td className="p-2 align-top">
                    <input
                      type="text"
                      disabled={disabled}
                      value={task.task_name}
                      onChange={(e) => updateTask(task.id, 'task_name', e.target.value)}
                      placeholder="e.g. Implement JWT authentication module"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-60"
                    />
                  </td>

                  {/* Priority */}
                  <td className="p-2 align-top">
                    <select
                      disabled={disabled}
                      value={task.priority}
                      onChange={(e) => updateTask(task.id, 'priority', e.target.value as TaskPriority)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-primary-500 disabled:opacity-60 capitalize"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🔵 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="p-2 align-top">
                    <div className="flex items-center gap-1.5">
                      <div className="shrink-0">{getStatusIcon(task.status)}</div>
                      <select
                        disabled={disabled}
                        value={task.status}
                        onChange={(e) => updateTask(task.id, 'status', e.target.value as TaskStatus)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-primary-500 disabled:opacity-60"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </td>

                  {/* Planned % vs Actual % */}
                  <td className="p-2 align-top space-y-1">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="text-zinc-500 dark:text-zinc-400">P:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={disabled}
                        value={task.planned_percentage}
                        onChange={(e) =>
                          updateTask(task.id, 'planned_percentage', Math.max(0, Math.min(100, Number(e.target.value))))
                        }
                        className="w-14 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-right font-mono text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-primary-500 disabled:opacity-60"
                      />
                      <span className="text-zinc-500 dark:text-zinc-400">%</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">A:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={disabled}
                        value={task.actual_percentage}
                        onChange={(e) =>
                          updateTask(task.id, 'actual_percentage', Math.max(0, Math.min(100, Number(e.target.value))))
                        }
                        className="w-14 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                      />
                      <span className="text-zinc-500 dark:text-zinc-400">%</span>
                    </div>
                    {/* Progress Bar preview */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-200 dark:border-zinc-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, task.actual_percentage || 0))}%` }}
                      />
                    </div>
                  </td>

                  {/* Time Planned vs Spent */}
                  <td className="p-2 align-top space-y-1">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="text-zinc-500 dark:text-zinc-400">Plan:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={disabled}
                        value={task.time_planned}
                        onChange={(e) => updateTask(task.id, 'time_planned', Math.max(0, Number(e.target.value)))}
                        className="w-14 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-right font-mono text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-primary-500 disabled:opacity-60"
                      />
                      <span className="text-zinc-500 dark:text-zinc-400">hrs</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="text-zinc-500 dark:text-zinc-400">Spent:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={disabled}
                        value={task.time_spent}
                        onChange={(e) => updateTask(task.id, 'time_spent', Math.max(0, Number(e.target.value)))}
                        className="w-14 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-right font-mono text-xs font-semibold text-primary-600 dark:text-primary-400 focus:outline-none focus:border-primary-500 disabled:opacity-60"
                      />
                      <span className="text-zinc-500 dark:text-zinc-400">hrs</span>
                    </div>
                  </td>

                  {/* Output Deliverable */}
                  <td className="p-2 align-top">
                    <input
                      type="text"
                      disabled={disabled}
                      value={task.output_deliverable || ''}
                      onChange={(e) => updateTask(task.id, 'output_deliverable', e.target.value)}
                      placeholder="e.g. PR #42 merged, API documentation updated"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-primary-500 disabled:opacity-60"
                    />
                  </td>

                  {/* Actions */}
                  {!disabled && (
                    <td className="p-2 align-top text-center">
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
