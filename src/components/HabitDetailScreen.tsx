import React, { useState } from 'react';
import { Habit, Goal } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { notificationManager } from '../utils/notifications';
import { GoalIcon } from './GoalIcon';
import {
  ArrowLeft,
  Flame,
  Check,
  Sparkles,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Target,
  Plus,
  Minus,
  Link,
  Award,
  TrendingUp,
  Layers,
  History,
  CheckCircle2,
  Circle,
  Bell,
  Volume2,
  RotateCcw,
} from 'lucide-react';

interface HabitDetailScreenProps {
  habit: Habit;
  onBack: () => void;
  onToggleHabit: (habitId: string) => void;
  onLogHabitSet?: (habitId: string, delta: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onResetHabit?: (habitId: string, resetAll?: boolean) => void;
  onEditHabit?: (habit: Habit) => void;
  onUpdateHabit?: (habitId: string, updates: Partial<Habit>) => void;
  todayStr: string;
  linkedGoal?: Goal;
  onOpenGoalDetail?: (goal: Goal) => void;
}

export const HabitDetailScreen: React.FC<HabitDetailScreenProps> = ({
  habit,
  onBack,
  onToggleHabit,
  onLogHabitSet,
  onDeleteHabit,
  onResetHabit,
  onEditHabit,
  onUpdateHabit,
  todayStr,
  linkedGoal,
  onOpenGoalDetail,
}) => {
  const [customDelta, setCustomDelta] = useState<string>('');

  const isDoneToday = (habit.completedDates || []).includes(todayStr);
  const isSets = habit.trackingType === 'sets';
  const target = habit.targetValue || 30;
  const current = typeof habit.todayProgress === 'number' ? habit.todayProgress : (isDoneToday ? target : 0);
  const step = habit.stepValue || (habit.unit === 'videos' ? 1 : 10);
  const xpReward = habit.xpPerSet || (habit.unit === 'videos' ? 50 : 10);
  const pct = Math.min(100, Math.round((current / target) * 100));
  const isTargetExceeded = current > target;

  // Complete history calculations
  const completedDates = [...(habit.completedDates || [])].sort((a, b) => b.localeCompare(a));
  const totalCheckins = completedDates.length;
  const totalXpEarned = totalCheckins * (habit.xpPerSet || 10);

  // Format date helper
  const formatDate = (dateStr: string) => {
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

  const createdDateFormatted = habit.createdAt ? formatDate(habit.createdAt) : 'Initial setup';

  // Last 14 days activity visualization
  const last14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const iso = d.toISOString().split('T')[0];
    const isCompleted = (habit.completedDates || []).includes(iso);
    const dayName = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const dayNum = d.getDate();
    return { iso, isCompleted, dayName, dayNum };
  });

  const handleCustomSetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customDelta, 10);
    if (!isNaN(val) && val !== 0 && onLogHabitSet) {
      onLogHabitSet(habit.id, val);
      setCustomDelta('');
    }
  };

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
            <h1
              style={{ fontSize: '16px' }}
              className="text-[18px] font-black tracking-tight text-on-surface leading-none"
            >
              Habit Details
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
              Full History & Stats From Inception
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onResetHabit && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Reset today's progress for "${habit.title}" to 0?`)) {
                  onResetHabit(habit.id, false);
                }
              }}
              className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:text-amber-500 hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
              title="Reset today's progress"
            >
              <RotateCcw className="w-4 h-4 text-amber-500" />
            </button>
          )}

          {onEditHabit && (
            <button
              type="button"
              onClick={() => onEditHabit(habit)}
              className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
              title="Edit habit"
            >
              <Edit2 className="w-4 h-4 text-primary" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${habit.title}"?`)) {
                onDeleteHabit(habit.id);
                onBack();
              }
            }}
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:text-red-500 hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
            title="Delete habit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {/* Hero Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-surface-container via-surface-container-low to-surface border border-outline-variant/30 shadow-xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md border-2 border-surface"
              style={{ backgroundColor: `${habit.color}25`, color: habit.color }}
            >
              <GoalIcon iconId={habit.icon} className="w-7 h-7" color={habit.color} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-black tracking-wider text-primary">
                  {habit.category}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant font-bold capitalize">
                  {habit.timeOfDay}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant font-bold capitalize">
                  {habit.frequency}
                </span>
              </div>

              <h2 className="text-xl font-black text-on-surface tracking-tight mt-1 leading-tight">
                {habit.title}
              </h2>

              {habit.description && (
                <p
                  style={{ fontSize: '11px' }}
                  className="text-xs text-on-surface-variant mt-1 leading-relaxed"
                >
                  {habit.description}
                </p>
              )}

              <p className="text-[10px] text-on-surface-variant font-medium mt-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 opacity-70" />
                <span>Created {createdDateFormatted}</span>
              </p>
            </div>
          </div>

          {/* Today's Quick Status Bar */}
          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface">Today's Status:</span>
              <span
                style={{ width: '106px' }}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                  isDoneToday
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                {isDoneToday ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span style={{ fontSize: '9px' }}>Completed Today</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5 text-amber-500" />
                    <span style={{ fontSize: '9px' }}>Pending Check-in</span>
                  </>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggleHabit(habit.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs ${
                isDoneToday
                  ? 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                  : 'bg-primary text-on-primary hover:brightness-105'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isDoneToday ? 'Undo Check' : 'Check In'}</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Grid: From the Beginning */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
            <div className="flex items-center justify-between text-orange-500">
              <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                Current Streak
              </span>
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div className="text-2xl font-black font-mono text-on-surface">
              {habit.streakDays}
              <span className="text-xs font-sans text-on-surface-variant font-medium ml-1">days</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium">Keep it burning today!</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
            <div className="flex items-center justify-between text-amber-500">
              <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                Best All-Time
              </span>
              <Award className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-on-surface">
              {habit.bestStreak || habit.streakDays || 0}
              <span className="text-xs font-sans text-on-surface-variant font-medium ml-1">days</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium">Personal record</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
            <div className="flex items-center justify-between text-emerald-500">
              <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                Total Check-Ins
              </span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-on-surface">
              {totalCheckins}
              <span className="text-xs font-sans text-on-surface-variant font-medium ml-1">times</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium">Since day 1</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
            <div className="flex items-center justify-between text-purple-500">
              <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                XP Earned
              </span>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-on-surface">
              +{totalXpEarned}
              <span className="text-xs font-sans text-on-surface-variant font-medium ml-1">XP</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium">Added to player rank</p>
          </div>
        </div>

        {/* Sets Logger & Target Tracker (if sets-based tracking) */}
        {isSets && (
          <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Daily Sets & Target</h3>
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    +{xpReward} XP per set of {step} {habit.unit || 'reps'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-black font-mono text-primary">
                  {pct}%
                </span>
              </div>
            </div>

            {/* Progress Value & Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-on-surface">
                  {current} / {target} {habit.unit || 'reps'}
                </span>
                {isTargetExceeded && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    +{current - target} exceeded!
                  </span>
                )}
              </div>

              <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isDoneToday ? '#10b981' : habit.color,
                  }}
                />
              </div>
            </div>

            {/* Quick Set Logging Controls */}
            {onLogHabitSet && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLogHabitSet(habit.id, -step)}
                    disabled={current <= 0}
                    className="flex-1 py-2 rounded-xl bg-surface-container text-red-500 hover:bg-surface-container-high text-xs font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 border border-outline-variant/30"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{step} {habit.unit || 'reps'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLogHabitSet(habit.id, step)}
                    className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-xs font-black flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-xs hover:brightness-105"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{step} {habit.unit || 'reps'}</span>
                    <span className="text-[9px] bg-on-primary/20 px-1 rounded ml-1">+{xpReward} XP</span>
                  </button>
                </div>

                {/* Custom set amount input */}
                <form onSubmit={handleCustomSetSubmit} className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={`Custom amount (+/- ${habit.unit || 'reps'})...`}
                    value={customDelta}
                    onChange={(e) => setCustomDelta(e.target.value)}
                    className="rounded-xl bg-surface border border-outline-variant/40 font-mono text-on-surface focus:outline-none focus:border-primary"
                    style={{
                      width: '200.28125px',
                      fontSize: '13px',
                      paddingTop: '6px',
                      paddingLeft: '11px',
                      paddingRight: '8px',
                      height: '33px',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!customDelta}
                    className="px-3 py-1.5 rounded-xl bg-surface-container font-bold text-xs text-primary hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30 disabled:opacity-40"
                  >
                    Apply
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Connected Goal Section */}
        {habit.linkedGoalTitle && (
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">Connected Goal</span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                +50 XP Synced
              </span>
            </div>
            <p className="text-xs text-on-surface font-semibold">
              {habit.linkedGoalTitle}
            </p>
            {linkedGoal && onOpenGoalDetail && (
              <button
                type="button"
                onClick={() => onOpenGoalDetail(linkedGoal)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer"
              >
                <span>View connected goal full details</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}

        {/* Push Notification & Reminder Alert Card */}
        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Push Notification & Alert</h3>
                <p className="text-[10px] text-on-surface-variant font-medium">
                  {habit.reminderEnabled && habit.reminderTime
                    ? `Active · ${habit.reminderTime} (${(habit.reminderDays || ['Daily']).join(', ')})`
                    : 'Reminders disabled for this habit'}
                </p>
              </div>
            </div>

            {onUpdateHabit && (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(habit.reminderEnabled)}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    onUpdateHabit(habit.id, {
                      reminderEnabled: enabled,
                      reminderTime: habit.reminderTime || '09:00',
                    });
                    sound.playPop();
                    triggerHaptic('light');
                    if (enabled && notificationManager.permission !== 'granted') {
                      notificationManager.requestPermission();
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline-variant/20 flex-wrap">
            <button
              type="button"
              onClick={() => {
                notificationManager.testAlert(
                  habit.title,
                  habit.reminderMessage || `Time for "${habit.title}"! Build your consistency streak 🔥`,
                  habit.reminderSound || 'chime',
                  'habit'
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Test Notification Alert</span>
            </button>

            {onEditHabit && (
              <button
                type="button"
                onClick={() => onEditHabit(habit)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/30 text-on-surface hover:bg-surface-container text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span>Configure Alert Time & Days</span>
              </button>
            )}
          </div>
        </div>

        {/* Recent 14-Day Consistency Matrix */}
        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>Past 14 Days Activity</span>
            </h3>
            <span className="text-[10px] text-on-surface-variant font-medium">
              {last14Days.filter((d) => d.isCompleted).length} / 14 days active
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {last14Days.map((day) => (
              <div
                key={day.iso}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all ${
                  day.isCompleted
                    ? 'bg-primary/20 border-primary/40 text-primary font-black shadow-xs'
                    : 'bg-surface border-outline-variant/20 text-on-surface-variant font-medium'
                }`}
                title={`${day.iso}: ${day.isCompleted ? 'Checked in' : 'Missed'}`}
              >
                <span className="text-[9px] uppercase">{day.dayName}</span>
                <span className="text-[11px] font-mono mt-0.5">{day.dayNum}</span>
                <div className="mt-1">
                  {day.isCompleted ? (
                    <Check className="w-2.5 h-2.5 stroke-[3] text-primary" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/40 block" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete Historical Timeline From Beginning */}
        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">
                Complete Check-In History
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-on-surface-variant">
              {completedDates.length} Logged
            </span>
          </div>

          <p className="text-[11px] text-on-surface-variant">
            Every recorded completion since this habit was created:
          </p>

          {completedDates.length === 0 ? (
            <div className="text-center py-8 bg-surface rounded-2xl border border-dashed border-outline-variant/40 p-4 space-y-2">
              <Circle className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
              <h4 className="text-xs font-bold text-on-surface">No check-ins logged yet</h4>
              <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto">
                Tap "Check In" above to record your very first completion for today!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {completedDates.map((dateStr, idx) => {
                const isToday = dateStr === todayStr;
                const progressValue = habit.progressHistory?.[dateStr];

                return (
                  <div
                    key={`${dateStr}-${idx}`}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                      isToday
                        ? 'bg-primary/10 border-primary/30 text-on-surface font-semibold'
                        : 'bg-surface border-outline-variant/20 text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold truncate">{formatDate(dateStr)}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary text-[9px] font-black">
                              Today
                            </span>
                          )}
                        </div>
                        {typeof progressValue === 'number' && (
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            Logged: {progressValue} {habit.unit || 'reps'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 font-mono">
                        +{xpReward} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Manage Habit: Reset & Delete Card */}
        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-surface-container text-on-surface flex items-center justify-center font-bold shrink-0">
              <RotateCcw className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">Manage Habit</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">
                Reset progress or delete this habit
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {onResetHabit && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Reset today's progress on "${habit.title}" to 0?`)) {
                    onResetHabit(habit.id, false);
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-surface hover:bg-surface-container border border-outline-variant/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Today's Progress</span>
              </button>
            )}

            {onResetHabit && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Full Reset: This will reset streak, history and progress back to 0 for "${habit.title}". Continue?`)) {
                    onResetHabit(habit.id, true);
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-surface hover:bg-surface-container border border-outline-variant/30 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Stats (Streak to 0)</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to permanently delete "${habit.title}"?`)) {
                onDeleteHabit(habit.id);
                onBack();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mt-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Habit Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
};
