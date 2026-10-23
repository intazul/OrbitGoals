import React from 'react';
import { Goal } from '../types';
import { ArrowLeft, Plus, Minus, Target, Trash2, Calendar } from 'lucide-react';
import { sound } from '../utils/sound';
import { GoalIcon } from './GoalIcon';

interface GoalsScreenProps {
  goals: Goal[];
  onBack: () => void;
  onOpenNewGoal: () => void;
  onUpdateGoalValue: (goalId: string, delta: number) => void;
  onDeleteGoal: (goalId: string) => void;
  currency: string;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  onBack,
  onOpenNewGoal,
  onUpdateGoalValue,
  onDeleteGoal,
  currency,
}) => {
  const formatFrequency = (goal: Goal) => {
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
            <Target className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-black text-on-surface tracking-tight">
            My Goals
          </h1>
        </div>

        <button
          onClick={onOpenNewGoal}
          className="m3-primary-btn text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Goal</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            All Active Goals ({goals.length})
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            Tap + to add or - to undo
          </span>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

            return (
              <div
                key={goal.id}
                className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 shadow-xs space-y-4 transition-all"
              >
                {/* Header: Icon, Title, Frequency Badge & Delete Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Custom Goal Icon Badge */}
                      <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/20">
                        <GoalIcon iconId={goal.icon} className="w-4 h-4" color={goal.color} />
                      </div>

                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface">
                        {goal.category}
                      </span>

                      {/* Frequency Badge */}
                      <span className="text-xs font-bold text-on-surface-variant px-2.5 py-0.5 rounded-full bg-surface-container flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-primary" />
                        <span>{formatFrequency(goal)}</span>
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-black text-on-surface break-words leading-snug pt-0.5">
                      {goal.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${goal.title}"?`)) {
                        onDeleteGoal(goal.id);
                        sound.playPop();
                      }
                    }}
                    className="p-2 rounded-xl text-on-surface-variant hover:text-red-500 hover:bg-surface-container active:scale-95 transition-colors cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Target Complete in Percentage - Big, Prominent, Clear */}
                <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant/20 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-primary font-mono tabular-nums leading-none">
                        {pct}%
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
                        Complete
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">
                      Target Completion
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-on-surface tabular-nums block">
                      {goal.category === 'finance' ? currency : ''}
                      {goal.currentValue.toLocaleString()} / {goal.category === 'finance' ? currency : ''}
                      {goal.targetValue.toLocaleString()} {goal.unit}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {goal.targetValue - goal.currentValue > 0
                        ? `${(goal.targetValue - goal.currentValue).toLocaleString()} ${goal.unit} left`
                        : 'Goal reached! 🎉'}
                    </span>
                  </div>
                </div>

                {/* Linear Progress Bar */}
                <div className="w-full bg-surface-container-highest rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: goal.color }}
                  />
                </div>

                {/* Quick Add / Minus Progress Controls */}
                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-on-surface-variant">
                    Update Progress:
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Minus Button to subtract one if mistakenly added */}
                    <button
                      onClick={() => onUpdateGoalValue(goal.id, -1)}
                      disabled={goal.currentValue <= 0}
                      className="py-1.5 px-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer min-h-[38px] flex items-center justify-center border border-outline-variant/30 disabled:opacity-30 disabled:cursor-not-allowed gap-1"
                      title="Undo / Subtract 1 unit"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5] text-red-500" />
                      <span>-1</span>
                    </button>

                    {/* Plus Quick Increments */}
                    {(goal.category === 'finance' ? [25, 50, 100] : [1, 5, 10]).map((amt) => (
                      <button
                        key={amt}
                        onClick={() => onUpdateGoalValue(goal.id, amt)}
                        className="py-1.5 px-3 rounded-xl bg-surface-container text-on-surface hover:bg-primary hover:text-on-primary text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer min-h-[38px] flex items-center justify-center border border-outline-variant/30"
                      >
                        +{goal.category === 'finance' ? `${currency}${amt}` : `${amt} ${goal.unit}`}
                      </button>
                    ))}
                  </div>
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
                Start fresh by creating your first milestone goal with target numbers and frequency.
              </p>
              <button
                onClick={onOpenNewGoal}
                className="m3-primary-btn text-xs sm:text-sm py-2.5 px-6 inline-flex items-center gap-2 cursor-pointer shadow-sm font-bold mt-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Your First Goal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
