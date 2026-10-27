import React, { useState } from 'react';
import { Goal, Habit } from '../types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Target,
  Repeat,
  Sparkles,
  Flame,
  Check,
  Filter,
} from 'lucide-react';
import { GoalIcon } from './GoalIcon';
import { sound, triggerHaptic } from '../utils/sound';

interface GoalCalendarScreenProps {
  goals: Goal[];
  habits?: Habit[];
  selectedGoalId?: string;
  onBack: () => void;
  currency: string;
  onToggleHabit?: (habitId: string) => void;
}

export const GoalCalendarScreen: React.FC<GoalCalendarScreenProps> = ({
  goals,
  habits = [],
  selectedGoalId,
  onBack,
  currency,
  onToggleHabit,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewFilter, setViewFilter] = useState<'all' | 'habits' | 'goals'>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDayStr, setSelectedDayStr] = useState<string>(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    sound.playPop();
    triggerHaptic('light');
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    sound.playPop();
    triggerHaptic('light');
  };

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Build maps of completions
  // Date string format: YYYY-MM-DD
  const habitCompletionsMap: Record<string, Habit[]> = {};
  habits.forEach((h) => {
    (h.completedDates || []).forEach((d) => {
      if (!habitCompletionsMap[d]) habitCompletionsMap[d] = [];
      habitCompletionsMap[d].push(h);
    });
  });

  const goalCompletionsMap: Record<string, { goal: Goal; value: number }[]> = {};
  goals.forEach((g) => {
    // Check history
    (g.history || []).forEach((item) => {
      if (item.value > 0) {
        if (!goalCompletionsMap[item.date]) goalCompletionsMap[item.date] = [];
        if (!goalCompletionsMap[item.date].some((entry) => entry.goal.id === g.id)) {
          goalCompletionsMap[item.date].push({ goal: g, value: item.value });
        }
      }
    });

    // Check completedDates
    (g.completedDates || []).forEach((d) => {
      if (!goalCompletionsMap[d]) goalCompletionsMap[d] = [];
      if (!goalCompletionsMap[d].some((entry) => entry.goal.id === g.id)) {
        goalCompletionsMap[d].push({ goal: g, value: g.targetValue });
      }
    });
  });

  // Calculate monthly stats
  let totalHabitCheckinsInMonth = 0;
  let totalGoalAdvancesInMonth = 0;
  let activeDaysCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hCount = (habitCompletionsMap[dStr] || []).length;
    const gCount = (goalCompletionsMap[dStr] || []).length;
    if (hCount > 0 || gCount > 0) activeDaysCount++;
    totalHabitCheckinsInMonth += hCount;
    totalGoalAdvancesInMonth += gCount;
  }

  // Selected Day Details
  const selectedDayHabits = habitCompletionsMap[selectedDayStr] || [];
  const selectedDayGoals = goalCompletionsMap[selectedDayStr] || [];
  const isSelectedToday = selectedDayStr === todayStr;

  const formatSelectedDateHeader = (dStr: string) => {
    if (dStr === todayStr) return 'Today';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
    return dStr;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface text-on-surface">
      {/* Top Header - Space Upwards */}
      <header
        style={{ marginTop: '20px', marginLeft: '0px' }}
        className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-4 mt-5 pt-8 pb-3 shrink-0 flex items-center justify-between gap-3"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 py-2 px-3 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer font-bold text-sm min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-primary stroke-[2.5]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shadow-xs">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h1 className="text-base font-black text-on-surface tracking-tight leading-tight">
              Progress Calendar
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium">
              Habits & Goals Contrast View
            </p>
          </div>
        </div>

        <div className="w-16" />
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 pt-3 pb-12 space-y-4 overflow-y-auto">
        {/* Month Summary Bar (Habits vs Goals Contrast) */}
        <div className="grid grid-cols-3 gap-2">
          {/* Habits KPI Card (Emerald Accent) */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Habits
              </span>
              <Repeat className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="mt-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-300 tabular-nums">
                {totalHabitCheckinsInMonth}
              </span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 block font-medium">
                Check-ins
              </span>
            </div>
          </div>

          {/* Goals KPI Card (Indigo Accent) */}
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Goals
              </span>
              <Target className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="mt-1">
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-300 tabular-nums">
                {totalGoalAdvancesInMonth}
              </span>
              <span className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 block font-medium">
                Log entries
              </span>
            </div>
          </div>

          {/* Active Days KPI Card */}
          <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Consistency
              </span>
              <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-1">
              <span className="text-xl font-black text-on-surface tabular-nums">
                {activeDaysCount}
              </span>
              <span className="text-[10px] text-on-surface-variant block font-medium">
                Active Days
              </span>
            </div>
          </div>
        </div>

        {/* View Filter Segmented Controls */}
        <div className="flex items-center justify-between p-1 rounded-2xl bg-surface-container border border-outline-variant/30 text-xs font-bold">
          <button
            onClick={() => {
              setViewFilter('all');
              sound.playPop();
              triggerHaptic('light');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
              viewFilter === 'all'
                ? 'bg-surface text-on-surface shadow-xs font-black'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All (Habits + Goals)
          </button>
          <button
            onClick={() => {
              setViewFilter('habits');
              sound.playPop();
              triggerHaptic('light');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              viewFilter === 'habits'
                ? 'bg-emerald-500 text-white shadow-xs font-black'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-on-surface'
            }`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Habits Only</span>
          </button>
          <button
            onClick={() => {
              setViewFilter('goals');
              sound.playPop();
              triggerHaptic('light');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              viewFilter === 'goals'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-indigo-600 dark:text-indigo-400 hover:text-on-surface'
            }`}
          >
            <Target className="w-3 h-3" />
            <span>Goals Only</span>
          </button>
        </div>

        {/* Calendar Surface Card */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4 shadow-xs space-y-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-on-surface">
                {monthName} {year}
              </h2>
              <span className="text-[10px] text-on-surface-variant font-medium">
                Tap any day to inspect details
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-xl bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 cursor-pointer transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDayStr(todayStr);
                  sound.playPop();
                }}
                className="px-2.5 h-8 rounded-xl bg-surface border border-outline-variant/30 text-[11px] font-bold text-primary hover:bg-surface-container active:scale-95 cursor-pointer transition-all"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-xl bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 cursor-pointer transition-all"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* High Contrast Legend */}
          <div className="flex items-center justify-center gap-4 py-1 text-[11px] font-bold border-y border-outline-variant/20">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs inline-block" />
              <span>Habits (Emerald)</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs inline-block" />
              <span>Goals (Indigo)</span>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold text-on-surface-variant/80 py-1"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-13 rounded-2xl" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDayStr;

              const habitsCompleted = habitCompletionsMap[dateStr] || [];
              const goalsAdvanced = goalCompletionsMap[dateStr] || [];

              const hasHabits = habitsCompleted.length > 0;
              const hasGoals = goalsAdvanced.length > 0;

              const showHabits = viewFilter === 'all' || viewFilter === 'habits';
              const showGoals = viewFilter === 'all' || viewFilter === 'goals';

              const activeHabit = showHabits && hasHabits;
              const activeGoal = showGoals && hasGoals;

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => {
                    setSelectedDayStr(dateStr);
                    sound.playPop();
                    triggerHaptic('light');
                  }}
                  className={`h-13 rounded-2xl p-1 flex flex-col items-center justify-between text-xs transition-all cursor-pointer relative border ${
                    isSelected
                      ? 'ring-2 ring-primary border-primary bg-primary/10 shadow-sm scale-102 font-black'
                      : isToday
                      ? 'border-primary/60 bg-surface'
                      : 'border-outline-variant/20 bg-surface/60 hover:bg-surface'
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between w-full px-1">
                    <span
                      className={`text-[11px] font-bold ${
                        isSelected
                          ? 'text-primary font-black'
                          : isToday
                          ? 'text-primary font-bold'
                          : 'text-on-surface'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Today" />
                    )}
                  </div>

                  {/* High Contrast Contrast Indicators (Habits vs Goals) */}
                  <div className="w-full flex items-center justify-center gap-1 mt-auto pb-0.5">
                    {/* Emerald Habit Pip */}
                    {activeHabit && (
                      <div
                        className="flex items-center justify-center h-3.5 min-w-[14px] px-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] shadow-xs"
                        title={`${habitsCompleted.length} Habit(s) Completed`}
                      >
                        ✓{habitsCompleted.length > 1 ? habitsCompleted.length : ''}
                      </div>
                    )}

                    {/* Indigo Goal Pip */}
                    {activeGoal && (
                      <div
                        className="flex items-center justify-center h-3.5 min-w-[14px] px-0.5 rounded-full bg-indigo-600 text-white font-black text-[9px] shadow-xs"
                        title={`${goalsAdvanced.length} Goal(s) Advanced`}
                      >
                        🎯{goalsAdvanced.length > 1 ? goalsAdvanced.length : ''}
                      </div>
                    )}

                    {!activeHabit && !activeGoal && (
                      <span className="h-3.5 w-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector */}
        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 shadow-xs space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                <CalendarIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-on-surface">
                  {formatSelectedDateHeader(selectedDayStr)}
                </h3>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  {selectedDayHabits.length} habits · {selectedDayGoals.length} goals logged
                </span>
              </div>
            </div>
            {isSelectedToday && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                Today
              </span>
            )}
          </div>

          {/* 1. Habits Section (High Contrast Emerald) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Habits Completed</span>
              </span>
              <span className="text-[11px] font-mono font-bold">
                {selectedDayHabits.length} finished
              </span>
            </div>

            {selectedDayHabits.length > 0 ? (
              <div className="space-y-1.5">
                {selectedDayHabits.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-on-surface block truncate">
                          {h.title}
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium capitalize">
                          {h.category} · {h.timeOfDay}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      Streak: {h.streakDays || 1}d
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-surface border border-outline-variant/20 text-center text-xs text-on-surface-variant font-medium">
                No habits logged for this date.
              </div>
            )}
          </div>

          {/* 2. Goals Section (High Contrast Indigo) */}
          <div className="space-y-2 pt-1 border-t border-outline-variant/20">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Target className="w-3.5 h-3.5" />
                <span>Goals Advanced / Reached</span>
              </span>
              <span className="text-[11px] font-mono font-bold">
                {selectedDayGoals.length} active
              </span>
            </div>

            {selectedDayGoals.length > 0 ? (
              <div className="space-y-2">
                {selectedDayGoals.map(({ goal, value }) => {
                  const pct = Math.min(100, Math.round((value / goal.targetValue) * 100));
                  return (
                    <div
                      key={goal.id}
                      className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <GoalIcon iconId={goal.icon} className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-on-surface truncate">
                            {goal.title}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
                          {value} / {goal.targetValue} {goal.unit}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-surface border border-outline-variant/20 text-center text-xs text-on-surface-variant font-medium">
                No goal milestones logged for this date.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
