import React from 'react';
import { Goal } from '../types';
import { ArrowLeft, Plus, Minus, Target, Trash2, Calendar } from 'lucide-react';
import { sound } from '../utils/sound';
import { GoalIcon } from './GoalIcon';

interface GoalsScreenProps {
  goals: Goal[];
  onBack: () => void;
  onOpenCalendar: (goalId?: string) => void;
  onUpdateGoalValue: (goalId: string, delta: number) => void;
  onDeleteGoal: (goalId: string) => void;
  currency: string;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  onBack,
  onOpenCalendar,
  onUpdateGoalValue,
  onDeleteGoal,
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

        {/* Goals List - Single-line non-stacking clean layout */}
        <div className="space-y-2.5">
          {goals.map((goal) => {
            const target = typeof goal.targetValue === 'number' && !isNaN(goal.targetValue) && goal.targetValue > 0 ? goal.targetValue : 1;
            const current = typeof goal.currentValue === 'number' && !isNaN(goal.currentValue) ? Math.max(0, goal.currentValue) : 0;
            const pct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));

            return (
              <div
                key={goal.id}
                className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-3 shadow-xs space-y-2.5 transition-all"
              >
                {/* Single Non-Stacking Top Row: Icon, Title, and Action Buttons */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/20">
                      <GoalIcon iconId={goal.icon} className="w-4 h-4" color={goal.color} />
                    </div>
                    <span className="text-sm font-bold text-on-surface truncate">
                      {goal.title}
                    </span>
                  </div>

                  {/* Compact Right Control Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* View Calendar Heat Zone */}
                    <button
                      onClick={() => onOpenCalendar(goal.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:text-primary active:scale-95 transition-all border border-outline-variant/20 cursor-pointer"
                      title="View Heat Zone Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>

                    {/* Minus button to subtract one if mistakenly added */}
                    <button
                      onClick={() => onUpdateGoalValue(goal.id, -1)}
                      disabled={current <= 0}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-container text-red-500 hover:bg-surface-container-high font-bold active:scale-95 transition-all border border-outline-variant/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Subtract 1 unit (-1)"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {/* Plus button to add 1 unit */}
                    <button
                      onClick={() => onUpdateGoalValue(goal.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-container text-primary hover:bg-surface-container-high font-bold active:scale-95 transition-all border border-outline-variant/20 cursor-pointer"
                      title="Add 1 unit (+1)"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {/* Delete goal */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${goal.title}"?`)) {
                          onDeleteGoal(goal.id);
                          sound.playPop();
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-red-500 hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Second Row: Fits perfectly in one line without stacking */}
                <div className="flex items-center justify-between gap-2 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg text-xs tabular-nums shrink-0">
                      {pct}% Complete
                    </span>

                    <span className="font-mono tabular-nums text-on-surface font-semibold text-xs truncate">
                      {goal.category === 'finance' ? currency : ''}
                      {current.toLocaleString()} / {goal.category === 'finance' ? currency : ''}
                      {target.toLocaleString()} {goal.unit || 'units'}
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-on-surface-variant px-2 py-0.5 rounded-md bg-surface-container shrink-0 truncate max-w-[130px]">
                    {formatFrequency(goal)}
                  </span>
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
