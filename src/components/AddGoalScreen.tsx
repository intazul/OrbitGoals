import React, { useState } from 'react';
import { ArrowLeft, Target, ChevronDown, ChevronUp, Check, Plus, Sparkles, X } from 'lucide-react';
import { Goal, GoalFrequency } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { AVAILABLE_GOAL_ICONS, GoalIcon } from './GoalIcon';

interface AddGoalScreenProps {
  onBack: () => void;
  onSaveGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completedDates' | 'history'>, autoCreateHabit?: boolean) => void;
  currency: string;
  existingGoal?: Goal;
  defaultXpPerStep?: number;
}

const QUICK_NAME_OPTIONS = [
  { name: 'YouTube Video', unit: 'videos', category: 'creator', target: 20, icon: 'youtube', color: '#ef4444' },
  { name: 'Instagram Reel', unit: 'reels', category: 'creator', target: 30, icon: 'instagram', color: '#ec4899' },
  { name: 'Facebook Post', unit: 'posts', category: 'creator', target: 25, icon: 'facebook', color: '#3b82f6' },
  { name: 'Save Money', unit: '$', category: 'finance', target: 1000, icon: 'finance', color: '#059669' },
  { name: '10,000 Daily Steps', unit: 'steps', category: 'fitness', target: 10000, icon: 'fitness', color: '#10b981' },
  { name: 'Drink Water', unit: 'ml', category: 'wellness', target: 2500, icon: 'water', color: '#06b6d4' },
  { name: 'Read Book Pages', unit: 'pages', category: 'learning', target: 20, icon: 'book', color: '#f97316' },
  { name: 'Gym Workout', unit: 'sessions', category: 'fitness', target: 15, icon: 'fitness', color: '#10b981' },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AddGoalScreen: React.FC<AddGoalScreenProps> = ({
  onBack,
  onSaveGoal,
  currency,
  existingGoal,
  defaultXpPerStep = 50,
}) => {
  const [title, setTitle] = useState(existingGoal?.title || '');
  const [targetValue, setTargetValue] = useState<number>(existingGoal?.targetValue ?? 1);
  const [currentValue, setCurrentValue] = useState<number>(existingGoal?.currentValue ?? 0);
  const [unit, setUnit] = useState(existingGoal?.unit || 'times');
  const [category, setCategory] = useState<string>(existingGoal?.category || 'creator');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [frequency, setFrequency] = useState<GoalFrequency>(existingGoal?.frequency || 'daily');
  const [frequencyDays, setFrequencyDays] = useState<string[]>(existingGoal?.frequencyDays || []);
  const [selectedIcon, setSelectedIcon] = useState(existingGoal?.icon || 'youtube');
  const [color, setColor] = useState(existingGoal?.color || '#ef4444');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [createLinkedHabit, setCreateLinkedHabit] = useState<boolean>(!existingGoal);
  const [xpReward, setXpReward] = useState<number>(existingGoal?.xpReward ?? defaultXpPerStep);

  const handleSelectQuickName = (item: typeof QUICK_NAME_OPTIONS[0]) => {
    setTitle(item.name);
    setUnit(item.unit === '$' ? currency : item.unit);
    setTargetValue(item.target);
    setCategory(item.category);
    setSelectedIcon(item.icon);
    setColor(item.color);
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

  const handleAddCustomCategory = () => {
    if (customCategoryInput.trim()) {
      setCategory(customCategoryInput.trim());
      setIsAddingCustomCategory(false);
      sound.playPop();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetValue <= 0) return;

    onSaveGoal(
      {
        title: title.trim(),
        description: existingGoal?.description || `Target: ${targetValue} ${unit.trim() || 'units'} (${frequency === 'long_term' ? 'Long Term · Every Day' : frequency})`,
        category: category.trim() || 'general',
        targetValue,
        currentValue: Math.max(0, currentValue),
        unit: unit.trim() || 'units',
        frequency,
        frequencyDays: frequency === 'weekly' && frequencyDays.length > 0 ? frequencyDays : undefined,
        color,
        icon: selectedIcon,
        priority: existingGoal?.priority || 'high',
        difficulty: existingGoal?.difficulty || 'medium',
        xpReward: Math.max(1, xpReward),
        subtasks: existingGoal?.subtasks || [],
        notes: existingGoal?.notes || '',
        linkedHabitId: existingGoal?.linkedHabitId,
      },
      !existingGoal && createLinkedHabit
    );

    sound.playSuccessChime();
    triggerHaptic('success');
    onBack();
  };

  const currentIconObj = AVAILABLE_GOAL_ICONS.find((i) => i.id === selectedIcon) || AVAILABLE_GOAL_ICONS[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to dismiss backdrop */}
      <div className="flex-1 w-full" onClick={onBack} />

      {/* Bottom Sheet Modal Container */}
      <div className="w-full max-h-[90vh] bg-surface text-on-surface rounded-t-[32px] border-t border-x border-outline-variant/30 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 relative z-10">
        {/* Grab Handle Pill */}
        <div className="w-12 h-1.5 rounded-full bg-outline-variant/60 mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Top Header */}
        <header className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-on-surface leading-tight">
                {existingGoal ? 'Edit Target Goal' : 'New Target Goal'}
              </h1>
              <p className="text-[10px] text-on-surface-variant font-medium">
                {existingGoal ? 'Modify target, units, progress & rewards' : 'Set milestones & earn +XP per step'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black shrink-0">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>+{xpReward} XP / step</span>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Form Content */}
        <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-10">
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Name Input with Scrollable Chips right inside the typing area */}
          <div className="space-y-2 bg-surface-container-low p-4 rounded-3xl border border-outline-variant/30 shadow-xs">
            <label className="text-xs font-bold text-on-surface block">
              Goal Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Type goal name..."
              className="w-full bg-surface border border-outline-variant/40 rounded-2xl px-3.5 py-3 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {/* Scrollable category/preset chips right with typing */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Quick select while typing (scroll horizontally):
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {QUICK_NAME_OPTIONS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectQuickName(item)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-surface border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5"
                  >
                    <GoalIcon iconId={item.icon} className="w-3.5 h-3.5" color={item.color} />
                    <span>{item.name}</span>
                  </button>
                ))}

                {/* Create own goal category chip */}
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Custom Category</span>
                </button>
              </div>

              {/* Custom category entry drawer if open */}
              {isAddingCustomCategory && (
                <div className="mt-2.5 p-3 rounded-2xl bg-surface border border-outline-variant/30 flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Enter custom category name..."
                    className="flex-1 bg-surface-container text-xs px-3 py-2 rounded-xl text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    className="px-3 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer active:scale-95"
                  >
                    Set
                  </button>
                </div>
              )}

              {category && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                  <span>Selected Category:</span>
                  <span className="font-bold text-primary px-2 py-0.5 rounded-md bg-surface-container capitalize">
                    {category}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Goal Icon: Inside the Icon Choose Option Dropdown */}
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/30 shadow-xs space-y-2.5">
            <label className="text-xs font-bold text-on-surface block">
              Goal Icon *
            </label>

            {/* Collapsed Button: Choose Goal Icon option */}
            <button
              type="button"
              onClick={() => {
                setIsIconPickerOpen(!isIconPickerOpen);
                sound.playPop();
              }}
              className="w-full p-3 rounded-2xl bg-surface border border-outline-variant/30 hover:bg-surface-container flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/20">
                  <GoalIcon iconId={selectedIcon} className="w-5 h-5" color={color} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-on-surface block leading-tight">
                    {currentIconObj.label} Icon
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {isIconPickerOpen ? 'Tap to close icon options' : 'Tap to choose YouTube, Instagram, Facebook or other icons'}
                  </span>
                </div>
              </div>

              {isIconPickerOpen ? (
                <ChevronUp className="w-5 h-5 text-on-surface-variant" />
              ) : (
                <ChevronDown className="w-5 h-5 text-on-surface-variant" />
              )}
            </button>

            {/* Expandable Icon Selection Grid */}
            {isIconPickerOpen && (
              <div className="p-3 bg-surface rounded-2xl border border-outline-variant/30 animate-in fade-in duration-200">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {AVAILABLE_GOAL_ICONS.map((item) => {
                    const isSelected = selectedIcon === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setSelectedIcon(item.id);
                          setColor(item.color);
                          setIsIconPickerOpen(false);
                          sound.playPop();
                          triggerHaptic('light');
                        }}
                        className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                          isSelected
                            ? 'border-primary bg-primary/15 shadow-xs ring-2 ring-primary scale-105'
                            : 'border-outline-variant/20 bg-surface-container hover:bg-surface-container-high'
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
            )}
          </div>

          {/* Target Value and Unit */}
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/30 shadow-xs space-y-3">
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
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-on-surface"
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
                  placeholder="videos / reels / $"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-sm text-on-surface font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/30 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface block">
                Frequency *
              </label>
              {frequency === 'long_term' && (
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Appears Everyday
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'daily' as const, label: 'Daily', sub: 'Resets each day' },
                { id: 'long_term' as const, label: 'Long Term', sub: 'Appears every day', tag: 'Everyday' },
                { id: 'weekly' as const, label: 'Weekly', sub: 'Specific days/wk' },
                { id: 'monthly' as const, label: 'Monthly', sub: 'Monthly milestone' },
              ].map((item) => {
                const isSelected = frequency === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setFrequency(item.id);
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className={`py-2.5 px-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-center min-h-[56px] ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-xs font-black'
                        : 'bg-surface text-on-surface border-outline-variant/20 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-xs font-bold leading-tight">
                        {item.label}
                      </span>
                      {item.tag && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-on-primary/20 text-on-primary'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        isSelected
                          ? 'text-on-primary/80 font-medium'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {item.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Long Term Info Box */}
            {frequency === 'long_term' && (
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
                <Sparkles className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span className="leading-snug">
                  <strong>Long Term Goal:</strong> This goal will appear every day on your dashboard to keep your continuous targets in sight without resetting your progress.
                </span>
              </div>
            )}

            {/* If Weekly: Optional Specific Days Selector */}
            {frequency === 'weekly' && (
              <div className="pt-2 p-3 rounded-2xl bg-surface border border-outline-variant/20 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Specific Days (Optional)
                  </span>
                  <span className="text-[11px] text-primary font-bold">
                    {frequencyDays.length === 0
                      ? 'Any days of week'
                      : `${frequencyDays.length} selected`}
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
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
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

          {/* Progress & XP tuning when editing */}
          {existingGoal && (
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 grid grid-cols-2 gap-3 shadow-xs">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Current Progress ({unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/30 text-sm font-bold text-on-surface font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  XP / Step Reward
                </label>
                <input
                  type="number"
                  min="1"
                  value={xpReward}
                  onChange={(e) => setXpReward(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/30 text-sm font-bold text-amber-600 dark:text-amber-400 font-mono"
                />
              </div>
            </div>
          )}

          {/* Connected Daily Habit Toggle Card (only for new goals) */}
          {!existingGoal && (
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface block leading-tight">
                    Connect to Daily Habit (+50 XP)
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Auto-create daily habit with sets (e.g. video uploads or reps) that syncs progress
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={createLinkedHabit}
                onChange={(e) => {
                  setCreateLinkedHabit(e.target.checked);
                  sound.playPop();
                }}
                className="w-4 h-4 accent-primary rounded cursor-pointer shrink-0"
              />
            </div>
          )}

          {/* Action Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-primary text-on-primary font-black text-sm sm:text-base shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[56px]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{existingGoal ? 'Save Goal Changes' : 'Create Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};
