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
  ChevronRight,
} from 'lucide-react';

interface HabitsScreenProps {
  habits: Habit[];
  onBack: () => void;
  onOpenAddHabit: () => void;
  onToggleHabit: (habitId: string) => void;
  onLogHabitSet?: (habitId: string, delta: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit?: (habit: Habit) => void;
  onSelectHabit?: (habit: Habit) => void;
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
  onSelectHabit,
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
            <h1 className="text-[19px] font-black tracking-tight text-on-surface leading-none whitespace-nowrap">
              Habits Studio
            </h1>
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

        {/* Habit Cards - Summarised with Percentage and Tap for Full Info */}
        <div className="space-y-2.5">
          {filteredHabits.map((habit) => {
            const isDoneToday = (habit.completedDates || []).includes(todayStr);
            const isSets = habit.trackingType === 'sets';
            const target = habit.targetValue || 30;
            const current = typeof habit.todayProgress === 'number' ? habit.todayProgress : (isDoneToday ? target : 0);
            const pct = isSets ? Math.min(100, Math.round((current / target) * 100)) : (isDoneToday ? 100 : 0);

            return (
              <div
                key={habit.id}
                onClick={() => {
                  if (onSelectHabit) {
                    onSelectHabit(habit);
                    sound.playPop();
                  }
                }}
                className={`rounded-2xl border p-3 shadow-xs space-y-2 transition-all cursor-pointer hover:border-primary/40 active:scale-[0.99] ${
                  isDoneToday
                    ? 'bg-surface-container-low/80 border-primary/30'
                    : 'bg-surface-container-low border-outline-variant/30'
                }`}
              >
                {/* Summary Row: Check circle, Icon & Title, % Pill, Streak, Chevron */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(habit.id);
                      }}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer active:scale-90 ${
                        isDoneToday
                          ? 'border-transparent text-white shadow-xs'
                          : 'border-outline-variant/50 hover:border-primary text-transparent bg-surface'
                      }`}
                      style={isDoneToday ? { backgroundColor: habit.color } : undefined}
                      title={isDoneToday ? 'Mark as incomplete' : 'Mark completed today'}
                    >
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] transition-transform ${
                          isDoneToday ? 'scale-100 text-white' : 'scale-0'
                        }`}
                      />
                    </button>

                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                    >
                      <GoalIcon iconId={habit.icon} className="w-3.5 h-3.5" color={habit.color} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-sm font-bold truncate ${
                            isDoneToday ? 'line-through text-on-surface-variant' : 'text-on-surface'
                          }`}
                        >
                          {habit.title}
                        </span>

                        {habit.streakDays > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black tabular-nums bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                            <Flame className="w-2.5 h-2.5 fill-current" />
                            <span>{habit.streakDays}d</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right summary: % Pill & Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black tabular-nums border ${
                        pct === 100
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : pct > 0
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-surface text-on-surface-variant border-outline-variant/30'
                      }`}
                    >
                      {pct}%
                    </span>

                    <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-60" />
                  </div>
                </div>

                {/* Sleek Progress Bar */}
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isDoneToday ? '#10b981' : habit.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

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
  );
};
