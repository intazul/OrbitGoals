import React, { useState } from 'react';
import { ArrowLeft, Target, ChevronDown, ChevronUp, Check, Plus, Sparkles } from 'lucide-react';
import { Goal, GoalFrequency } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { AVAILABLE_GOAL_ICONS, GoalIcon } from './GoalIcon';

interface AddGoalScreenProps {
  onBack: () => void;
  onSaveGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completedDates' | 'history'>) => void;
  currency: string;
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
}) => {
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('times');
  const [category, setCategory] = useState<string>('creator');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [frequency, setFrequency] = useState<GoalFrequency>('daily');
  const [frequencyDays, setFrequencyDays] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState('youtube');
  const [color, setColor] = useState('#ef4444');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

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

    onSaveGoal({
      title: title.trim(),
      description: `Target: ${targetValue} ${unit.trim() || 'units'} (${frequency === 'long_term' ? 'Long Term · Every Day' : frequency})`,
      category: category.trim() || 'general',
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
    onBack();
  };

  const currentIconObj = AVAILABLE_GOAL_ICONS.find((i) => i.id === selectedIcon) || AVAILABLE_GOAL_ICONS[0];

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

        <h1 className="text-lg font-black text-on-surface tracking-tight">
          Create Goal
        </h1>

        <div className="w-16" /> {/* Balance spacer */}
      </header>

      {/* Form Content */}
      <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto pb-10">
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

          {/* Action Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-primary text-on-primary font-black text-sm sm:text-base shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[56px]"
            >
              <span>Create Goal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
