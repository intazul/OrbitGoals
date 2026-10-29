import React, { useState } from 'react';
import { Habit, HabitTimeOfDay, Goal } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { GoalIcon } from './GoalIcon';
import { getCurrentWeekDays } from '../utils/gamification';
import {
  ArrowLeft,
  Plus,
  Flame,
  Check,
  Sparkles,
  Trash2,
  Edit2,
  Clock,
  Layers,
  Minus,
  Link,
  Target,
} from 'lucide-react';

interface HabitsScreenProps {
  habits: Habit[];
  onBack: () => void;
  onOpenAddHabit: () => void;
  onToggleHabit: (habitId: string) => void;
  onLogHabitSet?: (habitId: string, delta: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit?: (habit: Habit) => void;
  todayStr: string;
  goals?: Goal[];
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({
  habits,
  onBack,
  onOpenAddHabit,
  onToggleHabit,
  onLogHabitSet,
  onDeleteHabit,
  onEditHabit,
  todayStr,
  goals = [],
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | HabitTimeOfDay>('all');
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  const weekDays = getCurrentWeekDays();

  const filteredHabits = habits.filter((h) => {
    if (selectedFilter === 'all') return true;
    return h.timeOfDay === selectedFilter;
  });

  const completedTodayCount = habits.filter((h) => (h.completedDates || []).includes(todayStr)).length;
  const totalCount = habits.length;
  const completionPct = totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0;

  const handleToggle = (habitId: string) => {
    setJustCompletedId(habitId);
    setTimeout(() => setJustCompletedId(null), 1200);
    onToggleHabit(habitId);
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
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[19px] font-black tracking-tight text-on-surface leading-tight">
              Habits Studio
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium">
              Daily sets, rep targets & synced goals
            </p>
          </div>
        </div>

        {/* Add Habit Button */}
        <button
          type="button"
          onClick={onOpenAddHabit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Habit</span>
        </button>
      </header>

      {/* Scrollable Habit Studio List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Daily Completion Header Summary Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-surface-container-low border border-primary/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                Today's Overview
              </span>
              <h2 className="text-xl font-black text-on-surface tracking-tight mt-0.5">
                {completedTodayCount} of {totalCount} Completed
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-sm border border-primary/30">
              {completionPct}%
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-on-surface-variant pt-0.5">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sets award custom XP & power your goals!</span>
            </span>
            <span className="text-xs font-mono font-bold text-on-surface">
              {completionPct === 100 && totalCount > 0 ? '🎉 All Done!' : `${totalCount - completedTodayCount} Left`}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All (${habits.length})` },
            { id: 'morning', label: '🌅 Morning' },
            { id: 'afternoon', label: '☀️ Afternoon' },
            { id: 'evening', label: '🌙 Evening' },
            { id: 'anytime', label: '⏰ Anytime' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setSelectedFilter(f.id as typeof selectedFilter);
                sound.playPop();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                selectedFilter === f.id
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Habit Cards */}
        <div className="space-y-3">
          {filteredHabits.map((habit) => {
            const isDoneToday = (habit.completedDates || []).includes(todayStr);
            const isSets = habit.trackingType === 'sets';
            const target = habit.targetValue || 30;
            const current = typeof habit.todayProgress === 'number' ? habit.todayProgress : (isDoneToday ? target : 0);
            const step = habit.stepValue || (habit.unit === 'videos' ? 1 : 10);
            const xpReward = habit.xpPerSet || (habit.unit === 'videos' ? 50 : 10);
            const isTargetExceeded = current > target;
            const pct = Math.min(100, Math.round((current / target) * 100));

            return (
              <div
                key={habit.id}
                className={`rounded-2xl border p-3.5 shadow-xs space-y-3 transition-all ${
                  isDoneToday
                    ? 'bg-surface-container-low/80 border-primary/30'
                    : 'bg-surface-container-low border-outline-variant/30'
                }`}
              >
                {/* Row 1: Checkbox/Icon, Title & Linked Goal, Actions */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(habit.id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer active:scale-90 mt-0.5 ${
                        isDoneToday
                          ? 'border-transparent text-white shadow-xs'
                          : 'border-outline-variant/50 hover:border-primary text-transparent bg-surface'
                      }`}
                      style={isDoneToday ? { backgroundColor: habit.color } : undefined}
                      title={isDoneToday ? 'Mark as incomplete' : 'Mark completed today'}
                    >
                      <Check
                        className={`w-4 h-4 stroke-[3] transition-transform ${
                          isDoneToday ? 'scale-100 text-white' : 'scale-0'
                        }`}
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                        >
                          <GoalIcon iconId={habit.icon} className="w-3 h-3" color={habit.color} />
                        </div>
                        <span
                          className={`text-sm font-bold truncate ${
                            isDoneToday ? 'line-through text-on-surface-variant' : 'text-on-surface'
                          }`}
                        >
                          {habit.title}
                        </span>

                        {/* Streak Pill */}
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black tabular-nums ${
                            habit.streakDays > 0
                              ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30'
                              : 'bg-surface text-on-surface-variant border border-outline-variant/20'
                          }`}
                        >
                          <Flame className="w-2.5 h-2.5 fill-current" />
                          <span>{habit.streakDays}d</span>
                        </span>
                      </div>

                      {/* Description or motivation */}
                      {habit.description && (
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug line-clamp-1">
                          {habit.description}
                        </p>
                      )}

                      {/* Connected Goal Badge */}
                      {habit.linkedGoalTitle && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                          <Link className="w-2.5 h-2.5" />
                          <span>Connected to: {habit.linkedGoalTitle} (+50 XP synced)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top-right Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onEditHabit && (
                      <button
                        type="button"
                        onClick={() => onEditHabit(habit)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface active:scale-95 transition-all cursor-pointer"
                        title="Edit habit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteHabit(habit.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-red-500 hover:bg-surface active:scale-95 transition-all cursor-pointer"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* SETS INTERACTIVE LOGGER SECTION (If trackingType === 'sets') */}
                {isSets && (
                  <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-black text-on-surface">
                          {current} / {target} {habit.unit || 'reps'}
                        </span>
                        {isTargetExceeded && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            +{current - target} Exceeded!
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        <span>+{xpReward} XP / set</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isDoneToday ? '#10b981' : habit.color,
                        }}
                      />
                    </div>

                    {/* Quick Set Logging Controls */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      {/* Minus Set button */}
                      <button
                        type="button"
                        onClick={() => onLogHabitSet && onLogHabitSet(habit.id, -step)}
                        disabled={current <= 0}
                        className="px-2.5 py-1.5 rounded-lg bg-surface-container text-red-500 hover:bg-surface-container-high border border-outline-variant/20 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title={`Subtract ${step} ${habit.unit || 'reps'}`}
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                        <span>-{step}</span>
                      </button>

                      {/* Alternate Half Step Button if step >= 10 */}
                      {step >= 10 && (
                        <button
                          type="button"
                          onClick={() => onLogHabitSet && onLogHabitSet(habit.id, 5)}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/20 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          title="Log +5 reps set (+5 XP)"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5] text-primary" />
                          <span>+5 {habit.unit || 'reps'}</span>
                        </button>
                      )}

                      {/* Plus Main Set button */}
                      <button
                        type="button"
                        onClick={() => onLogHabitSet && onLogHabitSet(habit.id, step)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-primary text-on-primary text-xs font-black flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                        title={`Log set of +${step} ${habit.unit || 'reps'} (+${xpReward} XP)`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Log Set (+{step} {habit.unit || 'reps'})</span>
                        <span className="text-[10px] bg-on-primary/20 px-1 rounded ml-1">+{xpReward} XP</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 7-day mini matrix */}
                <div className="pt-1 flex items-center justify-between text-[9px] text-on-surface-variant">
                  <span className="font-bold uppercase tracking-wider text-[8px]">
                    Week Progress:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {weekDays.map((d) => {
                      const completed = (habit.completedDates || []).includes(d.dateStr);
                      return (
                        <div
                          key={d.dateStr}
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                            completed
                              ? 'text-white'
                              : d.isToday
                              ? 'border border-primary text-primary bg-surface'
                              : 'bg-surface border border-outline-variant/20 text-on-surface-variant opacity-40'
                          }`}
                          style={completed ? { backgroundColor: habit.color } : undefined}
                          title={`${d.dateStr}: ${completed ? 'Done' : 'Missed'}`}
                        >
                          {completed ? '✓' : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredHabits.length === 0 && (
            <div className="text-center py-10 bg-surface-container-low rounded-3xl border border-outline-variant/30 p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-container-high text-on-surface-variant flex items-center justify-center mx-auto">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-on-surface">No habits found</h4>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                No habits match this filter. Create your first habit with set targets or sync to a goal.
              </p>
              <button
                type="button"
                onClick={onOpenAddHabit}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create Habit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
