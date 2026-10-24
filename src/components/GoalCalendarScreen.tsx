import React, { useState } from 'react';
import { Goal } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame, Sparkles } from 'lucide-react';
import { GoalIcon } from './GoalIcon';
import { sound, triggerHaptic } from '../utils/sound';

interface GoalCalendarScreenProps {
  goals: Goal[];
  selectedGoalId?: string;
  onBack: () => void;
  currency: string;
}

export const GoalCalendarScreen: React.FC<GoalCalendarScreenProps> = ({
  goals,
  selectedGoalId,
  onBack,
  currency,
}) => {
  const [activeGoalId, setActiveGoalId] = useState<string>(() => {
    if (selectedGoalId && goals.some((g) => g.id === selectedGoalId)) {
      return selectedGoalId;
    }
    return goals[0]?.id || '';
  });

  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const activeGoal = goals.find((g) => g.id === activeGoalId) || goals[0];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    sound.playPop();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    sound.playPop();
  };

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Create lookup for goal progress on specific dates
  const historyMap: Record<string, number> = {};
  if (activeGoal) {
    activeGoal.history.forEach((h) => {
      historyMap[h.date] = h.value;
    });
    // Also include completedDates as full target value if not in history
    activeGoal.completedDates.forEach((d) => {
      if (historyMap[d] === undefined) {
        historyMap[d] = activeGoal.targetValue;
      }
    });
  }

  // Selected day details modal/tooltip
  const [inspectedDay, setInspectedDay] = useState<{ date: string; value: number } | null>(null);

  // Compute stats for current month
  let daysCompletedInMonth = 0;
  let totalUnitsInMonth = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const val = historyMap[dStr] || 0;
    if (val > 0) totalUnitsInMonth += val;
    if (activeGoal && val >= activeGoal.targetValue) daysCompletedInMonth += 1;
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface text-on-surface">
      {/* Top Header with Back Button */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-4 py-3 shrink-0 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer font-bold text-sm min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 text-primary stroke-[2.5]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-black text-on-surface tracking-tight">
            Goals Heat Zone
          </h1>
        </div>

        <div className="w-16" />
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto pb-10">
        {/* Goal Selector (Horizontal scrollable pills) */}
        {goals.length > 0 ? (
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2 px-1">
              Select Goal to View Heat Zone:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              {goals.map((g) => {
                const isSelected = g.id === activeGoal?.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setActiveGoalId(g.id);
                      setInspectedDay(null);
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className={`px-3 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-xs scale-102 font-black'
                        : 'bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <GoalIcon iconId={g.icon} className="w-4 h-4" color={isSelected ? undefined : g.color} />
                    <span className="truncate max-w-[140px]">{g.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6">
            <CalendarIcon className="w-10 h-10 text-on-surface-variant mx-auto mb-2 opacity-50" />
            <h3 className="text-base font-bold text-on-surface">No goals available</h3>
            <p className="text-xs text-on-surface-variant mt-1">Add goals to visualize your activity heat zone.</p>
          </div>
        )}

        {activeGoal && (
          <>
            {/* Heat Zone Calendar Card */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 shadow-xs space-y-4">
              {/* Month Selector Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/30">
                    <GoalIcon iconId={activeGoal.icon} className="w-5 h-5" color={activeGoal.color} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-on-surface leading-tight">
                      {monthName} {year}
                    </h2>
                    <span className="text-[11px] font-bold text-on-surface-variant block">
                      Target: {activeGoal.targetValue} {activeGoal.unit} / day
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="w-8 h-8 rounded-xl bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="w-8 h-8 rounded-xl bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-on-surface-variant">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={idx} className="py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Heat Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Blank days before 1st of month */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`blank-${idx}`} className="h-10 rounded-xl bg-transparent" />
                ))}

                {/* Actual Month Days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const value = historyMap[dStr] || 0;
                  const ratio = activeGoal.targetValue > 0 ? value / activeGoal.targetValue : 0;
                  const isComplete = ratio >= 1.0;
                  const isSelected = inspectedDay?.date === dStr;

                  // Determine heat level styling
                  let cellBg = 'bg-surface text-on-surface-variant';
                  let borderStyle = 'border border-outline-variant/20';

                  if (value > 0) {
                    if (isComplete) {
                      cellBg = 'bg-primary text-on-primary font-black shadow-xs';
                      borderStyle = 'border border-primary';
                    } else if (ratio >= 0.5) {
                      cellBg = 'bg-primary/50 text-on-primary font-bold';
                      borderStyle = 'border border-primary/60';
                    } else {
                      cellBg = 'bg-primary/20 text-on-surface font-semibold';
                      borderStyle = 'border border-primary/30';
                    }
                  }

                  if (isSelected) {
                    borderStyle = 'ring-2 ring-primary ring-offset-1 ring-offset-surface';
                  }

                  return (
                    <button
                      key={dayNum}
                      onClick={() => {
                        setInspectedDay({ date: dStr, value });
                        sound.playPop();
                        triggerHaptic('light');
                      }}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${cellBg} ${borderStyle}`}
                    >
                      <span className="text-xs leading-none font-bold">{dayNum}</span>
                      {value > 0 && (
                        <span className="text-[9px] font-mono leading-none mt-1 opacity-90 truncate max-w-[90%]">
                          {value}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Inspected Day Feedback Panel */}
              {inspectedDay && (
                <div className="p-3 bg-surface rounded-2xl border border-primary/30 flex items-center justify-between gap-2 animate-in fade-in">
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      {new Date(`${inspectedDay.date}T12:00:00`).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Progress: {inspectedDay.value} / {activeGoal.targetValue} {activeGoal.unit}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-xl font-mono ${
                      inspectedDay.value >= activeGoal.targetValue
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : inspectedDay.value > 0
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {activeGoal.targetValue > 0
                      ? `${Math.min(100, Math.round((inspectedDay.value / activeGoal.targetValue) * 100))}%`
                      : '0%'}
                  </span>
                </div>
              )}

              {/* Heat Zone Legend */}
              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
                <span>Heat Zone:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">None</span>
                  <div className="w-3.5 h-3.5 rounded-md bg-surface border border-outline-variant/30" />
                  <div className="w-3.5 h-3.5 rounded-md bg-primary/20 border border-primary/30" />
                  <div className="w-3.5 h-3.5 rounded-md bg-primary/50 border border-primary/60" />
                  <div className="w-3.5 h-3.5 rounded-md bg-primary shadow-2xs" />
                  <span className="text-[10px] font-bold text-primary">100% Done</span>
                </div>
              </div>
            </div>

            {/* Monthly Zone Stats Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Days Target Reached
                </span>
                <span className="text-2xl font-black text-primary font-mono tabular-nums block mt-1">
                  {daysCompletedInMonth}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  {daysCompletedInMonth > 0 ? 'Full completion days' : 'No 100% days yet this month'}
                </span>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4 shadow-xs">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Total Month Volume
                </span>
                <span className="text-2xl font-black text-on-surface font-mono tabular-nums block mt-1">
                  {activeGoal.category === 'finance' ? currency : ''}
                  {totalUnitsInMonth.toLocaleString()}
                </span>
                <span className="text-[10px] text-on-surface-variant truncate block">
                  Total {activeGoal.unit} logged
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
