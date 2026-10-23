import React, { useState } from 'react';
import { X, Target, Sparkles, Check } from 'lucide-react';
import { Goal, GoalCategory, GoalFrequency } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { AVAILABLE_GOAL_ICONS } from './GoalIcon';

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completedDates' | 'history'>) => void;
  currency: string;
}

const PRESETS = [
  { label: '🎬 YouTube Video', title: 'Post YouTube Video', target: 50, unit: 'videos', category: 'creator' as GoalCategory, color: '#ef4444', icon: 'youtube', frequency: 'weekly' as GoalFrequency, days: ['Tue', 'Thu'] },
  { label: '📸 Instagram Reel', title: 'Upload Instagram Reel', target: 30, unit: 'reels', category: 'creator' as GoalCategory, color: '#ec4899', icon: 'instagram', frequency: 'daily' as GoalFrequency, days: [] },
  { label: '📘 Facebook Post', title: 'Share Facebook Post', target: 20, unit: 'posts', category: 'creator' as GoalCategory, color: '#3b82f6', icon: 'facebook', frequency: 'weekly' as GoalFrequency, days: ['Mon', 'Fri'] },
  { label: '💰 Save Money', title: 'Weekly Vault Savings', target: 2000, unit: '$', category: 'finance' as GoalCategory, color: '#059669', icon: 'finance', frequency: 'weekly' as GoalFrequency, days: [] },
  { label: '🏃 10k Steps', title: '10,000 Daily Steps', target: 10000, unit: 'steps', category: 'fitness' as GoalCategory, color: '#10b981', icon: 'fitness', frequency: 'daily' as GoalFrequency, days: [] },
  { label: '💧 2L Water', title: 'Drink 2,500ml Water', target: 2500, unit: 'ml', category: 'wellness' as GoalCategory, color: '#06b6d4', icon: 'water', frequency: 'daily' as GoalFrequency, days: [] },
  { label: '📖 Read 20 Pgs', title: 'Read 20 Book Pages', target: 20, unit: 'pages', category: 'learning' as GoalCategory, color: '#f97316', icon: 'book', frequency: 'daily' as GoalFrequency, days: [] },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const NewGoalModal: React.FC<NewGoalModalProps> = ({
  isOpen,
  onClose,
  onSaveGoal,
  currency,
}) => {
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('times');
  const [category, setCategory] = useState<GoalCategory>('creator');
  const [frequency, setFrequency] = useState<GoalFrequency>('daily');
  const [frequencyDays, setFrequencyDays] = useState<string[]>([]);
  const [color, setColor] = useState('#8b5cf6');
  const [selectedIcon, setSelectedIcon] = useState('youtube');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setTargetValue(preset.target);
    setUnit(preset.unit === '$' ? currency : preset.unit);
    setCategory(preset.category);
    setColor(preset.color);
    setSelectedIcon(preset.icon);
    setFrequency(preset.frequency);
    setFrequencyDays(preset.days);
    sound.playPop();
    triggerHaptic('light');
  };

  const toggleDay = (day: string) => {
    sound.playPop();
    triggerHaptic('light');
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetValue <= 0) return;

    onSaveGoal({
      title: title.trim(),
      description: `Target: ${targetValue} ${unit.trim() || 'units'} (${frequency})`,
      category,
      targetValue,
      currentValue: 0,
      unit: unit.trim() || 'units',
      frequency,
      frequencyDays: frequency === 'weekly' && frequencyDays.length > 0 ? frequencyDays : undefined,
      color,
      icon: selectedIcon,
      priority: 'high',
      difficulty: 'medium',
      xpReward: 40,
      subtasks: [],
      notes: '',
    });

    sound.playSuccessChime();
    triggerHaptic('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-surface-container-low border-t sm:border border-outline-variant/30 rounded-t-[32px] sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 bg-surface-container sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-on-surface">New Goal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick 1-Tap Presets */}
          <div>
            <span className="text-xs font-bold text-on-surface flex items-center gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>1-Tap Popular Goal Presets:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => handleSelectPreset(p)}
                  className="px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface hover:bg-surface-container text-xs font-semibold text-on-surface transition-all cursor-pointer active:scale-95"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector (YouTube, Instagram, Facebook, Fitness, etc.) */}
          <div>
            <label className="text-xs font-bold text-on-surface block mb-2">
              Choose Goal Icon *
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVAILABLE_GOAL_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setSelectedIcon(item.id);
                      setColor(item.color);
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-xs ring-2 ring-primary scale-105'
                        : 'border-outline-variant/30 bg-surface hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <IconComp className="w-5 h-5" style={{ color: item.color }} />
                    <span className="text-[10px] font-bold text-on-surface truncate w-full text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Name */}
          <div>
            <label className="text-xs font-bold text-on-surface block mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. YouTube Video, Instagram Reel, Save $50"
              className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Target Value and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                Target Number *
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-on-surface"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="videos / reels / $ / times"
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-sm text-on-surface"
              />
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface block">
              Frequency *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((freq) => {
                const isSelected = frequency === freq;
                return (
                  <button
                    type="button"
                    key={freq}
                    onClick={() => {
                      setFrequency(freq);
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-xs font-black'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                    }`}
                  >
                    {freq}
                  </button>
                );
              })}
            </div>

            {/* If Weekly: Optional Specific Days Selector */}
            {frequency === 'weekly' && (
              <div className="pt-2 p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/30 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Specific Days (Optional)
                  </span>
                  <span className="text-[11px] text-primary font-bold">
                    {frequencyDays.length === 0
                      ? 'Any days of week'
                      : `${frequencyDays.length} day${frequencyDays.length === 1 ? '' : 's'} selected`}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {WEEK_DAYS.map((day) => {
                    const selected = frequencyDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center ${
                          selected
                            ? 'bg-primary text-on-primary font-black shadow-2xs'
                            : 'bg-surface text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                        }`}
                      >
                        <span>{day[0]}</span>
                        <span className="text-[9px] opacity-80">{day.slice(1)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="m3-primary-btn text-xs sm:text-sm px-6 py-2.5 cursor-pointer font-bold active:scale-95 shadow-sm"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
