import React, { useState } from 'react';
import { Habit, GoalCategory, HabitTimeOfDay, HabitFrequency, Goal } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { notificationManager } from '../utils/notifications';
import { GoalIcon } from './GoalIcon';
import {
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  Target,
  Link,
  Plus,
  Minus,
  Dumbbell,
  Clock,
  Layers,
  X,
  Bell,
  Volume2,
  Calendar,
} from 'lucide-react';

interface AddHabitScreenProps {
  onBack: () => void;
  onSaveHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streakDays' | 'bestStreak'>) => void;
  existingHabit?: Habit;
  goals?: Goal[];
}

const PRESET_HABITS = [
  {
    title: '5 Daily Namaz (Salah)',
    description: 'Perform all 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) (+15 XP per prayer)',
    category: 'wellness' as GoalCategory,
    timeOfDay: 'anytime' as HabitTimeOfDay,
    icon: 'namaz',
    color: '#10b981',
    trackingType: 'sets' as const,
    targetValue: 5,
    unit: 'prayers',
    stepValue: 1,
    xpPerSet: 15,
  },
  {
    title: '10,000 Real Steps (Pedometer)',
    description: 'Walk 10,000 steps daily tracked with real motion sensor (+15 XP)',
    category: 'fitness' as GoalCategory,
    timeOfDay: 'anytime' as HabitTimeOfDay,
    icon: 'steps',
    color: '#3b82f6',
    trackingType: 'sets' as const,
    targetValue: 10000,
    unit: 'steps',
    stepValue: 1000,
    xpPerSet: 15,
  },
  {
    title: 'Exercise Reps (Target: 30)',
    description: 'Hit 30 reps or more with sets of 5 or 10 (+10 XP per set)',
    category: 'fitness' as GoalCategory,
    timeOfDay: 'afternoon' as HabitTimeOfDay,
    icon: 'fitness',
    color: '#10b981',
    trackingType: 'sets' as const,
    targetValue: 30,
    unit: 'reps',
    stepValue: 10,
    xpPerSet: 10,
  },
  {
    title: 'YouTube Video Upload',
    description: 'Upload daily video / short connected to YouTube Goal (+50 XP)',
    category: 'creator' as GoalCategory,
    timeOfDay: 'afternoon' as HabitTimeOfDay,
    icon: 'youtube',
    color: '#ef4444',
    trackingType: 'sets' as const,
    targetValue: 1,
    unit: 'videos',
    stepValue: 1,
    xpPerSet: 50,
  },
  {
    title: 'Read Book Pages (Target: 30)',
    description: 'Read in sets of 10 pages (+10 XP per set)',
    category: 'learning' as GoalCategory,
    timeOfDay: 'evening' as HabitTimeOfDay,
    icon: 'book',
    color: '#f59e0b',
    trackingType: 'sets' as const,
    targetValue: 30,
    unit: 'pages',
    stepValue: 10,
    xpPerSet: 10,
  },
  {
    title: 'Morning Hydration (8 Glasses)',
    description: 'Drink 8 glasses of water in steps throughout the day',
    category: 'wellness' as GoalCategory,
    timeOfDay: 'morning' as HabitTimeOfDay,
    icon: 'water',
    color: '#06b6d4',
    trackingType: 'sets' as const,
    targetValue: 8,
    unit: 'glasses',
    stepValue: 1,
    xpPerSet: 5,
  },
  {
    title: 'Deep Focus Sprint (45m)',
    description: 'Zero distractions focus session',
    category: 'creator' as GoalCategory,
    timeOfDay: 'morning' as HabitTimeOfDay,
    icon: 'target',
    color: '#8b5cf6',
    trackingType: 'simple' as const,
    targetValue: 1,
    unit: 'times',
    stepValue: 1,
    xpPerSet: 25,
  },
  {
    title: 'Evening Gratitude & Journal',
    description: 'Reflect on 3 daily wins before bed',
    category: 'wellness' as GoalCategory,
    timeOfDay: 'evening' as HabitTimeOfDay,
    icon: 'heart',
    color: '#ec4899',
    trackingType: 'simple' as const,
    targetValue: 1,
    unit: 'times',
    stepValue: 1,
    xpPerSet: 10,
  },
];

const HABIT_ICONS = [
  'namaz',
  'steps',
  'fitness',
  'youtube',
  'target',
  'book',
  'water',
  'heart',
  'trophy',
  'star',
  'finance',
  'briefcase',
];

const HABIT_COLORS = [
  '#10b981', // Emerald
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
];

export const AddHabitScreen: React.FC<AddHabitScreenProps> = ({
  onBack,
  onSaveHabit,
  existingHabit,
  goals = [],
}) => {
  const [title, setTitle] = useState(existingHabit?.title || '');
  const [description, setDescription] = useState(existingHabit?.description || '');
  const [category, setCategory] = useState<GoalCategory>(existingHabit?.category || 'fitness');
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>(existingHabit?.timeOfDay || 'anytime');
  const [frequency, setFrequency] = useState<HabitFrequency>(existingHabit?.frequency || 'daily');
  const [icon, setIcon] = useState(existingHabit?.icon || 'fitness');
  const [color, setColor] = useState(existingHabit?.color || '#10b981');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    existingHabit?.reminderEnabled ?? Boolean(existingHabit?.reminderTime)
  );
  const [reminderTime, setReminderTime] = useState<string>(existingHabit?.reminderTime || '09:00');
  const [reminderDays, setReminderDays] = useState<string[]>(
    existingHabit?.reminderDays && existingHabit.reminderDays.length > 0
      ? existingHabit.reminderDays
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  );
  const [reminderSound, setReminderSound] = useState<'chime' | 'bell' | 'melody' | 'silent'>(
    existingHabit?.reminderSound || 'chime'
  );
  const [reminderMessage, setReminderMessage] = useState<string>(existingHabit?.reminderMessage || '');

  // Sets & Target Tracking features
  const [trackingType, setTrackingType] = useState<'simple' | 'sets'>(
    existingHabit?.trackingType || 'sets'
  );
  const [targetValue, setTargetValue] = useState<number>(existingHabit?.targetValue ?? 30);
  const [unit, setUnit] = useState<string>(existingHabit?.unit || 'reps');
  const [stepValue, setStepValue] = useState<number>(existingHabit?.stepValue ?? 10);
  const [xpPerSet, setXpPerSet] = useState<number>(existingHabit?.xpPerSet ?? 10);

  // Goal connection
  const [linkedGoalId, setLinkedGoalId] = useState<string>(existingHabit?.linkedGoalId || '');

  const [error, setError] = useState<string | null>(null);

  const handleApplyPreset = (preset: typeof PRESET_HABITS[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setTimeOfDay(preset.timeOfDay);
    setIcon(preset.icon);
    setColor(preset.color);
    setTrackingType(preset.trackingType);
    setTargetValue(preset.targetValue);
    setUnit(preset.unit);
    setStepValue(preset.stepValue);
    setXpPerSet(preset.xpPerSet);

    // Auto-match linked goal if available
    const matchingGoal = goals.find(
      (g) =>
        g.category === preset.category ||
        (preset.icon === 'youtube' && g.icon === 'youtube') ||
        (preset.category === 'fitness' && g.category === 'fitness')
    );
    if (matchingGoal && !linkedGoalId) {
      setLinkedGoalId(matchingGoal.id);
    }

    sound.playPop();
    triggerHaptic('light');
  };

  const toggleReminderDay = (day: string) => {
    sound.playPop();
    triggerHaptic('light');
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a habit name.');
      sound.playErrorTone();
      triggerHaptic('medium');
      return;
    }

    const linkedGoal = goals.find((g) => g.id === linkedGoalId);

    onSaveHabit({
      title: title.trim(),
      description: description.trim(),
      category,
      timeOfDay,
      frequency,
      icon,
      color,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      reminderEnabled,
      reminderDays: reminderEnabled ? reminderDays : undefined,
      reminderSound: reminderEnabled ? reminderSound : undefined,
      reminderMessage: reminderEnabled && reminderMessage.trim() ? reminderMessage.trim() : undefined,
      trackingType,
      targetValue: trackingType === 'sets' ? Math.max(1, targetValue) : 1,
      unit: trackingType === 'sets' ? (unit.trim() || 'reps') : 'times',
      stepValue: trackingType === 'sets' ? Math.max(1, stepValue) : 1,
      xpPerSet: trackingType === 'sets' ? Math.max(1, xpPerSet) : (title.toLowerCase().includes('youtube') ? 50 : 10),
      todayProgress: existingHabit?.todayProgress || 0,
      progressHistory: existingHabit?.progressHistory || {},
      linkedGoalId: linkedGoalId || undefined,
      linkedGoalTitle: linkedGoal ? linkedGoal.title : undefined,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface text-on-surface overflow-hidden">
      {/* Top Header */}
      <header
        style={{ marginTop: '32px', marginLeft: '0px' }}
        className="px-4 mt-8 pt-6 pb-3 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface/90 backdrop-blur-md z-10"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer border border-outline-variant/30 shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1
                style={{ fontSize: '16px' }}
                className="text-base font-black tracking-tight text-on-surface leading-tight truncate"
              >
                {existingHabit ? 'Edit Habit' : 'New Daily Habit'}
              </h1>
              <p className="text-[10px] text-on-surface-variant font-medium truncate">
                Sets, daily targets, and direct sync with your goals
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Dynamic XP Reward Pill */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black shrink-0">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>+{trackingType === 'sets' ? `${xpPerSet} XP/set` : '8 XP'}</span>
          </div>
        </div>
      </header>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {/* Preset Habit Recommendations */}
        {!existingHabit && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Quick Presets (Exercise Sets & YouTube Sync)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_HABITS.slice(0, 4).map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 text-left transition-all active:scale-98 cursor-pointer flex items-start gap-2"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${p.color}20`, color: p.color }}
                  >
                    <GoalIcon iconId={p.icon} className="w-3.5 h-3.5" color={p.color} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-on-surface block truncate">
                      {p.title}
                    </span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold block">
                      +{p.xpPerSet} XP / set
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Habit Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">
              Habit Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Exercise Reps, YouTube Upload, Read Book"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm font-semibold focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Tracking Mode: Sets vs Simple Check */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <label className="text-xs font-bold text-on-surface-variant block">
              Tracking Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTrackingType('sets');
                  sound.playPop();
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  trackingType === 'sets'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface border-outline-variant/20 text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Sets & Reps Counter</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">
                  Target (e.g. 30) reached in sets of 5 or 10 (+XP per set)
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTrackingType('simple');
                  sound.playPop();
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  trackingType === 'simple'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface border-outline-variant/20 text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>Simple Check-off</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">
                  Single daily checkmark (+8 XP per day)
                </p>
              </button>
            </div>

            {/* SETS CONFIGURATION SECTION */}
            {trackingType === 'sets' && (
              <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Daily Target */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant block">
                      Daily Target
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={targetValue}
                      onChange={(e) => setTargetValue(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/30 text-on-surface font-mono font-bold text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Unit */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant block">
                      Unit (reps, mins, videos)
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="reps"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/30 text-on-surface font-semibold text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Set Size / Increment */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant block">
                      Set Size (+ per tap)
                    </label>
                    <div className="flex items-center gap-1">
                      {[5, 10].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => {
                            setStepValue(step);
                            sound.playPop();
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            stepValue === step
                              ? 'bg-primary text-on-primary border-primary'
                              : 'bg-surface border-outline-variant/20 text-on-surface-variant'
                          }`}
                        >
                          +{step}
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={stepValue}
                        onChange={(e) => setStepValue(parseInt(e.target.value, 10) || 1)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-on-surface font-mono font-bold text-xs text-center focus:outline-none focus:border-primary"
                        title="Custom set increment"
                      />
                    </div>
                  </div>

                  {/* XP Reward per set */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant block">
                      XP Reward per Set
                    </label>
                    <div className="flex items-center gap-1">
                      {[10, 50].map((xp) => (
                        <button
                          key={xp}
                          type="button"
                          onClick={() => {
                            setXpPerSet(xp);
                            sound.playPop();
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            xpPerSet === xp
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-surface border-outline-variant/20 text-on-surface-variant'
                          }`}
                        >
                          +{xp}
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={xpPerSet}
                        onChange={(e) => setXpPerSet(parseInt(e.target.value, 10) || 1)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs text-center focus:outline-none focus:border-primary"
                        title="Custom XP per set"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/20 text-[11px] text-on-surface-variant leading-relaxed">
                  💡 <span className="font-bold text-on-surface">Flexibility:</span> You can reach the target of{' '}
                  <span className="font-bold text-primary">{targetValue} {unit}</span> in sets of{' '}
                  <span className="font-bold text-primary">+{stepValue}</span>, or keep going <span className="font-bold text-primary">above {targetValue}</span>! You earn <span className="font-bold text-amber-600 dark:text-amber-400">+{xpPerSet} XP</span> for each set.
                </div>
              </div>
            )}
          </div>

          {/* CONNECT TO GOAL SECTION */}
          <div className="space-y-2 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Link className="w-4 h-4 text-primary" />
                <label className="text-xs font-bold text-on-surface block">
                  Connect to a Goal
                </label>
              </div>
              <span className="text-[10px] text-primary font-bold">
                Synced Progress & Dual XP
              </span>
            </div>

            <p className="text-[11px] text-on-surface-variant leading-snug">
              Link this habit to a goal (e.g. YouTube video upload habit connected to YouTube Goal). Logging sets will advance both!
            </p>

            <select
              value={linkedGoalId}
              onChange={(e) => {
                setLinkedGoalId(e.target.value);
                sound.playPop();
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-outline-variant/30 text-on-surface text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">-- No connected goal (Standalone habit) --</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  🎯 {g.title} ({g.currentValue}/{g.targetValue} {g.unit})
                </option>
              ))}
            </select>

            {linkedGoalId && (
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs text-primary font-semibold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  Sync active: Completing sets in this habit will also advance the connected goal and award goal step XP (+15 XP)!
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">
              Notes / Motivation (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Do 3 sets of 10 pushups between work sprints"
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-medium focus:outline-none focus:border-primary resize-none placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Icon & Color Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant block">Icon</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-surface-container border border-outline-variant/30">
                {HABIT_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setIcon(i);
                      sound.playPop();
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      icon === i
                        ? 'bg-primary text-on-primary ring-2 ring-primary/40'
                        : 'bg-surface text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <GoalIcon iconId={i} className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant block">Accent Color</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-surface-container border border-outline-variant/30">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      sound.playPop();
                    }}
                    className={`w-7 h-7 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary scale-105' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time of Day */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant block">
              Schedule / Time of Day
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'morning', label: '🌅 Morning' },
                { id: 'afternoon', label: '☀️ Afternoon' },
                { id: 'evening', label: '🌙 Evening' },
                { id: 'anytime', label: '⏰ Anytime' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTimeOfDay(t.id as HabitTimeOfDay);
                    sound.playPop();
                  }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                    timeOfDay === t.id
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Push Notification & Alert Reminders Card */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface block leading-tight">
                    Push Notification & Alert
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Custom daily reminder sound, alert & banner
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => {
                    setReminderEnabled(e.target.checked);
                    sound.playPop();
                    triggerHaptic('light');
                    if (e.target.checked && notificationManager.permission !== 'granted') {
                      notificationManager.requestPermission();
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {reminderEnabled && (
              <div className="space-y-3 pt-1 border-t border-outline-variant/20 animate-in fade-in">
                {/* Reminder Time Picker */}
                <div className="flex items-center justify-between gap-3 bg-surface p-2.5 rounded-xl border border-outline-variant/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Reminder Time</span>
                  </div>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-bold font-mono text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  />
                </div>

                {/* Repeat Days Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" />
                      <span>Repeat Days</span>
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setReminderDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
                        className="px-1.5 py-0.5 rounded bg-surface-container text-primary font-bold hover:underline cursor-pointer"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setReminderDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
                        className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold hover:underline cursor-pointer"
                      >
                        Weekdays
                      </button>
                      <button
                        type="button"
                        onClick={() => setReminderDays(['Sat', 'Sun'])}
                        className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold hover:underline cursor-pointer"
                      >
                        Weekends
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const isSelected = reminderDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleReminderDay(day)}
                          className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-on-primary border-primary shadow-2xs'
                              : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alert Sound Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-primary" />
                    <span>Notification Sound & Tone</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'chime', label: '🔔 Chime' },
                      { id: 'bell', label: '⏰ Bell' },
                      { id: 'melody', label: '🎶 Melody' },
                      { id: 'silent', label: '🔕 Silent' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const chosen = s.id as typeof reminderSound;
                          setReminderSound(chosen);
                          notificationManager.playAlertSound(chosen);
                          triggerHaptic('light');
                        }}
                        className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center ${
                          reminderSound === s.id
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Alert Message */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block">
                    Custom Alert Message (Optional)
                  </label>
                  <input
                    type="text"
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    placeholder={`e.g. Time for ${title || 'your habit'}! Keep the momentum!`}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/30 text-xs font-medium text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/40"
                  />
                </div>

                {/* Action Buttons: Test Notification & Browser Push Request */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      notificationManager.testAlert(
                        title || 'Habit Reminder',
                        reminderMessage || `Time to complete your habit "${title || 'Daily Goal'}"! Keep your streak strong 🔥`,
                        reminderSound,
                        'habit'
                      );
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Test Notification Alert</span>
                  </button>

                  {notificationManager.hasNativeSupport && notificationManager.permission !== 'granted' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const granted = await notificationManager.requestPermission();
                        if (granted) {
                          notificationManager.sendNotification(
                            'Push Notifications Enabled! 🎉',
                            'You will now receive desktop and mobile push alerts.',
                            'reminder'
                          );
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-bold text-[11px] hover:bg-surface-container-high cursor-pointer transition-all active:scale-95"
                    >
                      <span>Enable Browser Push</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Submit Button */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-primary text-on-primary font-black text-sm shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{existingHabit ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
