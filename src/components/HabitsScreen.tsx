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
    <div className="flex-1 flex flex-col h-full bg-surface text-on-surface overflow-hidden animate-noir-enter">
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
            <h1
              style={{ fontSize: '16px' }}
              className="text-[19px] font-black tracking-tight text-on-surface leading-none whitespace-nowrap"
            >
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
        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/40 shadow-xs space-y-3 noir-shimmer">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block">
                Today&apos;s Overview
              </span>
              <h2 className="text-xl font-black text-on-surface tracking-tight mt-0.5 tabular-nums">
                {completedTodayCount} of {totalCount} Completed
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-black font-mono tabular-nums text-sm border border-primary shadow-xs">
              {completionPct}%
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-on-surface-variant pt-0.5">
            <span className="flex items-center gap-1 text-on-surface font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sets award custom XP & power your goals</span>
            </span>
            <span className="text-xs font-mono font-bold text-on-surface tabular-nums">
              {completionPct === 100 && totalCount > 0 ? 'All Done' : `${totalCount - completedTodayCount} Left`}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All (${habits.length})` },
            { id: 'morning', label: 'Morning' },
            { id: 'afternoon', label: 'Afternoon' },
            { id: 'evening', label: 'Evening' },
            { id: 'anytime', label: 'Anytime' },
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
                  : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
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
                className={`rounded-2xl border p-3 shadow-xs space-y-2 transition-all cursor-pointer hover:border-on-surface/50 active:scale-[0.99] noir-card ${
                  isDoneToday
                    ? 'bg-surface-container-low/90 border-on-surface/40'
                    : 'bg-surface-container-low border-outline-variant/35'
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
                          ? 'bg-primary border-primary text-on-primary shadow-xs'
                          : 'border-outline-variant/60 hover:border-on-surface text-transparent bg-surface'
                      }`}
                      title={isDoneToday ? 'Mark as incomplete' : 'Mark completed today'}
                    >
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] transition-transform ${
                          isDoneToday ? 'scale-100 text-on-primary' : 'scale-0'
                        }`}
                      />
                    </button>

                    <div className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface border border-outline-variant/40 flex items-center justify-center shrink-0">
                      <GoalIcon iconId={habit.icon} className="w-3.5 h-3.5" />
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
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black font-mono tabular-nums bg-primary text-on-primary border border-primary">
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
                          ? 'bg-primary text-on-primary border-primary'
                          : pct > 0
                          ? 'bg-surface-container-high text-on-surface border-outline-variant/40'
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
                    className="h-full rounded-full transition-all duration-300 bg-primary"
                    style={{ width: `${pct}%` }}
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
