import React, { useState } from 'react';
import { Habit, HabitTimeOfDay, GoalCategory } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { GoalIcon } from './GoalIcon';
import { getCurrentWeekDays } from '../utils/gamification';
import {
  ArrowLeft,
  Plus,
  Flame,
  Check,
  Sparkles,
  Calendar,
  Trash2,
  Edit2,
  Clock,
  Filter,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface HabitsScreenProps {
  habits: Habit[];
  onBack: () => void;
  onOpenAddHabit: () => void;
  onToggleHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit?: (habit: Habit) => void;
  todayStr: string;
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({
  habits,
  onBack,
  onOpenAddHabit,
  onToggleHabit,
  onDeleteHabit,
  onEditHabit,
  todayStr,
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
  const earnedXpToday = completedTodayCount * 10;

  const handleToggle = (habitId: string) => {
    setJustCompletedId(habitId);
    setTimeout(() => setJustCompletedId(null), 1200);
    onToggleHabit(habitId);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface text-on-surface overflow-hidden">
      {/* Top Header */}
      <header className="px-4 pt-8 pb-3 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface/90 backdrop-blur-md z-10">
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
              Daily streaks · +10 XP per completion
            </p>
          </div>
        </div>

        {/* Add Habit Button in Header */}
        <button
          onClick={onOpenAddHabit}
          className="h-9 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Today's Habits Progress Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low border border-outline-variant/30 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              Daily Habit Momentum
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-black">
              <Sparkles className="w-3 h-3" />
              <span>+{earnedXpToday} XP earned today</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-black text-on-surface leading-tight">
                {totalCount === 0
                  ? 'No Habits Yet'
                  : completionPct === 100
                  ? 'All Habits Done! 🌟'
                  : `${completedTodayCount} of ${totalCount} Done`}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {completionPct === 100
                  ? 'Incredible consistency! Maximum XP secured.'
                  : `${totalCount - completedTodayCount} habits left for today.`}
              </p>
            </div>

            {/* Circular Indicator */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-highest"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary transition-all duration-700 ease-out"
                  strokeDasharray={`${completionPct}, 100`}
                  strokeLinecap="round"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-[13px] font-black text-on-surface font-mono tabular-nums leading-none">
                  {completionPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Current Week Header Strip */}
          <div className="pt-2 border-t border-outline-variant/20">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              This Week's Horizon
            </span>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d) => (
                <div
                  key={d.dateStr}
                  className={`text-center py-1.5 rounded-xl border text-[10px] transition-all ${
                    d.isToday
                      ? 'bg-primary/15 border-primary text-primary font-black shadow-xs'
                      : 'bg-surface border-outline-variant/20 text-on-surface-variant'
                  }`}
                >
                  <span className="block text-[8px] font-bold opacity-75">{d.dayLetter}</span>
                  <span className="block font-mono font-black">{d.dayNum}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time of Day Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Habits', count: habits.length },
            { id: 'morning', label: '🌅 Morning', count: habits.filter((h) => h.timeOfDay === 'morning').length },
            { id: 'afternoon', label: '☀️ Afternoon', count: habits.filter((h) => h.timeOfDay === 'afternoon').length },
            { id: 'evening', label: '🌙 Evening', count: habits.filter((h) => h.timeOfDay === 'evening').length },
            { id: 'anytime', label: '⏰ Anytime', count: habits.filter((h) => h.timeOfDay === 'anytime').length },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFilter(f.id as typeof selectedFilter);
                sound.playPop();
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedFilter === f.id
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Habits List */}
        <div className="space-y-2 pb-8">
          {filteredHabits.map((habit) => {
            const isCompletedToday = (habit.completedDates || []).includes(todayStr);
            const isJustFinished = justCompletedId === habit.id && isCompletedToday;

            return (
              <div
                key={habit.id}
                className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                  isCompletedToday
                    ? 'bg-surface-container-low/70 border-primary/30 opacity-95'
                    : 'bg-surface-container-low border-outline-variant/30 hover:border-outline-variant/60 shadow-xs'
                }`}
              >
                {/* Floating XP Animation when checked */}
                {isJustFinished && (
                  <div className="absolute top-2 right-12 z-20 px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-xs shadow-md animate-bounce">
                    +10 XP!
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  {/* Left: Custom Checkbox Button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(habit.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer active:scale-90 ${
                      isCompletedToday
                        ? 'border-transparent text-white shadow-xs'
                        : 'border-outline-variant/50 hover:border-primary text-transparent bg-surface'
                    }`}
                    style={isCompletedToday ? { backgroundColor: habit.color } : undefined}
                    title={isCompletedToday ? 'Mark as incomplete (-10 XP)' : 'Mark as completed (+10 XP)'}
                  >
                    <Check
                      className={`w-5 h-5 stroke-[3] transition-transform ${
                        isCompletedToday ? 'scale-100 text-white' : 'scale-0'
                      }`}
                    />
                  </button>

                  {/* Middle: Icon, Title, Streaks, Description */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-outline-variant/20"
                        style={{ backgroundColor: `${habit.color}18`, color: habit.color }}
                      >
                        <GoalIcon iconId={habit.icon} className="w-3.5 h-3.5" color={habit.color} />
                      </div>
                      <span
                        className={`text-sm font-bold truncate ${
                          isCompletedToday ? 'line-through text-on-surface-variant' : 'text-on-surface'
                        }`}
                      >
                        {habit.title}
                      </span>
                    </div>

                    {/* Metadata Strip: Streak, Time of day, XP badge */}
                    <div className="flex items-center gap-2 text-[10px] flex-wrap">
                      {/* Streak Flame Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-black tabular-nums ${
                          habit.streakDays > 0
                            ? 'bg-orange-500/15 text-orange-500 border border-orange-500/30'
                            : 'bg-surface text-on-surface-variant border border-outline-variant/20'
                        }`}
                      >
                        <Flame className="w-3 h-3 fill-current" />
                        <span>{habit.streakDays}d streak</span>
                      </span>

                      {/* Time of Day Pill */}
                      <span className="capitalize px-1.5 py-0.5 rounded-md bg-surface text-on-surface-variant font-medium border border-outline-variant/20">
                        {habit.timeOfDay}
                      </span>

                      {/* Best Streak */}
                      {habit.bestStreak > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-surface text-on-surface-variant font-medium border border-outline-variant/20">
                          Best: {habit.bestStreak}d
                        </span>
                      )}

                      {/* XP Pill */}
                      <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-500/25 px-1.5 py-0.5 rounded-md">
                        +10 XP
                      </span>
                    </div>
                  </div>

                  {/* Right Actions: Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDeleteHabit(habit.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-red-500 hover:bg-surface active:scale-95 transition-all cursor-pointer"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom 7-day mini calendar dots */}
                <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Past 7 Days:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {weekDays.map((d) => {
                      const completedOnDay = (habit.completedDates || []).includes(d.dateStr);
                      return (
                        <div
                          key={d.dateStr}
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                            completedOnDay
                              ? 'text-white shadow-xs'
                              : d.isToday
                              ? 'border-2 border-primary text-primary bg-surface'
                              : 'bg-surface border border-outline-variant/20 text-on-surface-variant opacity-40'
                          }`}
                          style={completedOnDay ? { backgroundColor: habit.color } : undefined}
                          title={`${d.dateStr}: ${completedOnDay ? 'Completed' : 'Missed'}`}
                        >
                          {completedOnDay ? '✓' : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredHabits.length === 0 && (
            <div className="text-center py-10 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-on-surface">No habits found</h4>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                {selectedFilter === 'all'
                  ? 'Start your daily streak by creating your first habit.'
                  : `No ${selectedFilter} habits yet. Tap below to add one.`}
              </p>
              <button
                type="button"
                onClick={onOpenAddHabit}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Habit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
