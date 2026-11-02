import React, { useState } from 'react';
import { Goal, Habit, SubTask } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { GoalIcon } from './GoalIcon';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Target,
  Award,
  TrendingUp,
  History,
  CheckSquare,
  FileText,
  Link,
  Flame,
  AlertCircle,
  Download,
  ExternalLink,
} from 'lucide-react';
import { getGoogleCalendarUrlForGoal, downloadCalendarICS } from '../utils/calendarExport';

interface GoalDetailScreenProps {
  goal: Goal;
  onBack: () => void;
  onUpdateGoalValue: (goalId: string, delta: number) => void;
  onToggleSubtask?: (goalId: string, subtaskId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onEditGoal?: (goal: Goal) => void;
  onOpenCalendar?: (goalId?: string) => void;
  currency: string;
  linkedHabit?: Habit;
  onOpenHabitDetail?: (habit: Habit) => void;
}

export const GoalDetailScreen: React.FC<GoalDetailScreenProps> = ({
  goal,
  onBack,
  onUpdateGoalValue,
  onToggleSubtask,
  onDeleteGoal,
  onEditGoal,
  onOpenCalendar,
  currency,
  linkedHabit,
  onOpenHabitDetail,
}) => {
  const target = typeof goal.targetValue === 'number' && !isNaN(goal.targetValue) && goal.targetValue > 0 ? goal.targetValue : 1;
  const current = typeof goal.currentValue === 'number' && !isNaN(goal.currentValue) ? Math.max(0, goal.currentValue) : 0;
  const pct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const isFinished = current >= target;
  const remaining = Math.max(0, target - current);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatFrequency = (g: Goal) => {
    if (g.frequency === 'long_term') return 'Long Term · Every Day';
    if (g.frequency === 'weekly') {
      if (g.frequencyDays && g.frequencyDays.length > 0) {
        return `Weekly · ${g.frequencyDays.join(', ')}`;
      }
      return 'Weekly';
    }
    if (g.frequency === 'monthly') return 'Monthly';
    return 'Daily';
  };

  // Combine and sort history from beginning
  const historyList = [...(goal.history || [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex-1 flex flex-col h-full bg-surface text-on-surface overflow-hidden">
      {/* Top Header */}
      <header
        style={{ marginTop: '32px', marginLeft: '0px' }}
        className="px-4 mt-8 pt-6 pb-3 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface/90 backdrop-blur-md z-10"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer border border-outline-variant/30"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[18px] font-black tracking-tight text-on-surface leading-none">
              Goal Details
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
              Full Overview & History From Inception
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenCalendar && (
            <button
              type="button"
              onClick={() => onOpenCalendar(goal.id)}
              className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
              title="Open Progress Heatmap Calendar"
            >
              <Calendar className="w-4 h-4 text-primary" />
            </button>
          )}

          {onEditGoal && (
            <button
              type="button"
              onClick={() => onEditGoal(goal)}
              className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
              title="Edit goal"
            >
              <Edit2 className="w-4 h-4 text-primary" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${goal.title}"?`)) {
                onDeleteGoal(goal.id);
                onBack();
              }
            }}
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:text-red-500 hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
            title="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {/* Hero Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-surface-container via-surface-container-low to-surface border border-outline-variant/30 shadow-xs space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md border-2 border-surface"
              style={{ backgroundColor: `${goal.color}25`, color: goal.color }}
            >
              <GoalIcon iconId={goal.icon} className="w-7 h-7" color={goal.color} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs uppercase font-black tracking-wider text-primary">
                  {goal.category}
                </span>
                <span
                  style={{ fontSize: '11px' }}
                  className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    goal.priority === 'high'
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                      : 'bg-surface-container border border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  {goal.priority} priority
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant font-bold capitalize">
                  {goal.difficulty}
                </span>
              </div>

              <h2 className="text-xl font-black text-on-surface tracking-tight mt-1 leading-tight">
                {goal.title}
              </h2>

              {goal.description && (
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {goal.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-medium mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 opacity-70" />
                  <span>{formatFrequency(goal)}</span>
                </span>
                {goal.deadline && (
                  <span className="flex items-center gap-1 text-primary font-bold">
                    <Calendar className="w-3 h-3" />
                    <span>Target: {formatDate(goal.deadline)}</span>
                  </span>
                )}
                <span>Created: {formatDate(goal.createdAt)}</span>
              </div>

              {goal.deadline && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-outline-variant/20 flex-wrap">
                  <a
                    href={getGoogleCalendarUrlForGoal(goal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Add to Google Calendar</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      downloadCalendarICS([], [goal]);
                      sound.playSuccessChime();
                      triggerHaptic('success');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold transition-all cursor-pointer border border-outline-variant/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export .ics</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Big Progress Gauge & Stats */}
          <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block">
                  Overall Completion
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black font-mono text-primary">{pct}%</span>
                  <span className="text-xs font-mono font-bold text-on-surface-variant">
                    ({goal.category === 'finance' ? currency : ''}
                    {current.toLocaleString()} / {goal.category === 'finance' ? currency : ''}
                    {target.toLocaleString()} {goal.unit || 'units'})
                  </span>
                </div>
              </div>

              {isFinished ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Goal Achieved! 🎉</span>
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-lg">
                  {remaining.toLocaleString()} {goal.unit || 'units'} left
                </span>
              )}
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-surface-container-highest rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isFinished ? '#10b981' : goal.color,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium pt-0.5">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span style={{ fontSize: '9px', color: '#000000' }}>Earn +{goal.xpReward || 50} XP with every step!</span>
              </span>
              <span className="font-mono text-xs font-bold text-on-surface">
                {goal.completedDates?.length || 0} days recorded
              </span>
            </div>
          </div>
        </div>

        {/* Subtasks Section (if any defined at creation) */}
        {goal.subtasks && goal.subtasks.length > 0 && (
          <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-on-surface">Subtasks Checklist</h3>
              </div>
              <span className="text-xs font-mono font-bold text-on-surface-variant">
                {goal.subtasks.filter((s) => s.completed).length} / {goal.subtasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {goal.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  onClick={() => onToggleSubtask && onToggleSubtask(goal.id, subtask.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    subtask.completed
                      ? 'bg-surface-container-highest/60 border-primary/20 text-on-surface-variant line-through'
                      : 'bg-surface border-outline-variant/20 text-on-surface hover:border-primary/40'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      subtask.completed
                        ? 'bg-primary border-primary text-on-primary'
                        : 'border-outline-variant/50 bg-surface'
                    }`}
                  >
                    {subtask.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-semibold flex-1">{subtask.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Daily Habit (if linked) */}
        {goal.linkedHabitId && (
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">Connected Daily Habit</span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                +50 XP Synced
              </span>
            </div>
            <p className="text-xs text-on-surface font-semibold">
              Completing the connected daily habit automatically powers progress on this goal!
            </p>
            {linkedHabit && onOpenHabitDetail && (
              <button
                type="button"
                onClick={() => onOpenHabitDetail(linkedHabit)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer"
              >
                <span>View connected habit full details ({linkedHabit.title})</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}

        {/* Goal Notes (from creation) */}
        {goal.notes && (
          <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">Notes & Strategy</h3>
            </div>
            <p className="text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed bg-surface p-3 rounded-xl border border-outline-variant/20">
              {goal.notes}
            </p>
          </div>
        )}

        {/* Complete Historical Timeline From Beginning */}
        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">
                Complete Progress History
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-on-surface-variant">
              {historyList.length} Entries
            </span>
          </div>

          <p className="text-[11px] text-on-surface-variant">
            Full audit log of values recorded from day 1 to present:
          </p>

          {historyList.length === 0 ? (
            <div className="text-center py-8 bg-surface rounded-2xl border border-dashed border-outline-variant/40 p-4 space-y-2">
              <History className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
              <h4 className="text-xs font-bold text-on-surface">No history entries yet</h4>
              <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto">
                Log a step above to record your initial progress entry!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {historyList.map((entry, idx) => {
                const prevEntry = historyList[idx + 1];
                const delta = prevEntry ? entry.value - prevEntry.value : entry.value;

                return (
                  <div
                    key={`${entry.date}-${idx}`}
                    className="p-2.5 rounded-xl border border-outline-variant/20 bg-surface flex items-center justify-between gap-2 text-xs transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold truncate">{formatDate(entry.date)}</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          Value: {goal.category === 'finance' ? currency : ''}
                          {entry.value.toLocaleString()} {goal.unit || 'units'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {delta !== 0 && (
                        <span
                          className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${
                            delta > 0
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
