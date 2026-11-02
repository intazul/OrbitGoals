import React from 'react';
import { Goal } from '../types';
import { ArrowLeft, Plus, Minus, Target, Trash2, Calendar, Sparkles, Edit2, ChevronRight } from 'lucide-react';
import { sound } from '../utils/sound';
import { GoalIcon } from './GoalIcon';

interface GoalsScreenProps {
  goals: Goal[];
  onBack: () => void;
  onOpenCalendar: (goalId?: string) => void;
  onUpdateGoalValue: (goalId: string, delta: number) => void;
  onDeleteGoal: (goalId: string) => void;
  onEditGoal?: (goal: Goal) => void;
  onSelectGoal?: (goal: Goal) => void;
  currency: string;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  onBack,
  onOpenCalendar,
  onUpdateGoalValue,
  onDeleteGoal,
  onEditGoal,
  onSelectGoal,
  currency,
}) => {
  const formatFrequency = (goal: Goal) => {
    if (goal.frequency === 'long_term') return 'Long Term · Every Day';
    if (goal.frequency === 'weekly') {
      if (goal.frequencyDays && goal.frequencyDays.length > 0) {
        return `Weekly · ${goal.frequencyDays.join(', ')}`;
      }
      return 'Weekly';
    }
    if (goal.frequency === 'monthly') return 'Monthly';
    return 'Daily';
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface text-on-surface">
      {/* Top Header with Back Button (Add Goal removed from top right) */}
      <header
        style={{ marginTop: '32px', marginLeft: '0px' }}
        className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-4 mt-8 pt-6 pb-3 shrink-0 flex items-center justify-between gap-3"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer font-bold text-sm min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 text-primary stroke-[2.5]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
            <Target className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-black text-on-surface tracking-tight">
            My Goals
          </h1>
        </div>

        {/* Calendar launcher icon on top right instead of Add Goal */}
        <button
          onClick={() => onOpenCalendar()}
          className="w-10 h-10 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-outline-variant/30 shadow-2xs"
          title="Open Progress Calendar"
        >
          <Calendar className="w-4 h-4 text-primary" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-10">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            All Goals ({goals.length})
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            Tap - / + to update
          </span>
        </div>

        {/* Goals List - Clean Summarised Cards with Tap to Open Full Details */}
        <div className="space-y-2.5">
          {goals.map((goal) => {
            const target = typeof goal.targetValue === 'number' && !isNaN(goal.targetValue) && goal.targetValue > 0 ? goal.targetValue : 1;
            const current = typeof goal.currentValue === 'number' && !isNaN(goal.currentValue) ? Math.max(0, goal.currentValue) : 0;
            const pct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));

            return (
              <div
                key={goal.id}
                onClick={() => {
                  if (onSelectGoal) {
                    onSelectGoal(goal);
                    sound.playPop();
                  }
                }}
                className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-3 shadow-xs space-y-2 transition-all cursor-pointer hover:border-primary/40 active:scale-[0.99]"
              >
                {/* Single Row: Icon, Title & % Pill, Quick Steppers, Chevron */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-outline-variant/20"
                      style={{ backgroundColor: `${goal.color}15`, color: goal.color }}
                    >
                      <GoalIcon iconId={goal.icon} className="w-4 h-4" color={goal.color} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-on-surface truncate">
                          {goal.title}
                        </span>
                        {goal.linkedHabitId && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded-full">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Synced</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="font-mono font-black text-primary text-[11px] tabular-nums">
                          {pct}% Complete
                        </span>
                        <span className="font-mono tabular-nums text-on-surface-variant text-[11px] truncate">
                          {goal.category === 'finance' ? currency : ''}
                          {current.toLocaleString()} / {goal.category === 'finance' ? currency : ''}
                          {target.toLocaleString()} {goal.unit || 'units'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Right Control Buttons: Minus, Plus, Chevron */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Minus button to subtract 1 unit */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateGoalValue(goal.id, -1);
                      }}
                      disabled={current <= 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface text-red-500 hover:bg-surface-container font-bold active:scale-95 transition-all border border-outline-variant/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Subtract 1 unit (-1)"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>

                    {/* Plus button to add 1 unit */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateGoalValue(goal.id, 1);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-on-primary font-black active:scale-95 transition-all cursor-pointer shadow-xs hover:brightness-105"
                      title="Add 1 unit (+1)"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-60 ml-0.5" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: goal.color }}
                  />
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="text-center py-16 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-on-surface">No goals created yet</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                Add your first goal from the dashboard to track your progress and heat zone.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
