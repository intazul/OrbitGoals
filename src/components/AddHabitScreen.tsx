import React, { useState } from 'react';
import { Habit, GoalCategory, HabitTimeOfDay, HabitFrequency } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { GoalIcon } from './GoalIcon';
import {
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  Droplets,
  BookOpen,
  Dumbbell,
  Heart,
  Clock,
  Calendar,
  Flame,
} from 'lucide-react';

interface AddHabitScreenProps {
  onBack: () => void;
  onSaveHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streakDays' | 'bestStreak'>) => void;
  existingHabit?: Habit;
}

const PRESET_HABITS = [
  {
    title: 'Morning Hydration (1L)',
    description: 'Drink fresh water first thing upon waking up',
    category: 'wellness' as GoalCategory,
    timeOfDay: 'morning' as HabitTimeOfDay,
    icon: 'water',
    color: '#06b6d4',
  },
  {
    title: '15-Min Morning Movement',
    description: 'Stretch, yoga, or quick bodyweight reps',
    category: 'fitness' as GoalCategory,
    timeOfDay: 'morning' as HabitTimeOfDay,
    icon: 'fitness',
    color: '#10b981',
  },
  {
    title: 'Deep Focus Sprint (45m)',
    description: 'Work with zero distractions or social media',
    category: 'creator' as GoalCategory,
    timeOfDay: 'afternoon' as HabitTimeOfDay,
    icon: 'target',
    color: '#8b5cf6',
  },
  {
    title: 'Read 15 Pages',
    description: 'High-value reading to expand knowledge',
    category: 'learning' as GoalCategory,
    timeOfDay: 'evening' as HabitTimeOfDay,
    icon: 'book',
    color: '#f59e0b',
  },
  {
    title: 'Evening Gratitude & Journal',
    description: 'Write 3 highlights and plan tomorrow',
    category: 'wellness' as GoalCategory,
    timeOfDay: 'evening' as HabitTimeOfDay,
    icon: 'heart',
    color: '#ec4899',
  },
  {
    title: '8,000 Daily Steps',
    description: 'Stay active and walk throughout the day',
    category: 'fitness' as GoalCategory,
    timeOfDay: 'anytime' as HabitTimeOfDay,
    icon: 'trophy',
    color: '#14b8a6',
  },
];

const HABIT_ICONS = [
  'water',
  'fitness',
  'target',
  'book',
  'heart',
  'trophy',
  'star',
  'video',
  'youtube',
  'finance',
  'briefcase',
];

const HABIT_COLORS = [
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#f97316', // Orange
];

export const AddHabitScreen: React.FC<AddHabitScreenProps> = ({
  onBack,
  onSaveHabit,
  existingHabit,
}) => {
  const [title, setTitle] = useState(existingHabit?.title || '');
  const [description, setDescription] = useState(existingHabit?.description || '');
  const [category, setCategory] = useState<GoalCategory>(existingHabit?.category || 'wellness');
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>(existingHabit?.timeOfDay || 'morning');
  const [frequency, setFrequency] = useState<HabitFrequency>(existingHabit?.frequency || 'daily');
  const [icon, setIcon] = useState(existingHabit?.icon || 'water');
  const [color, setColor] = useState(existingHabit?.color || '#06b6d4');
  const [reminderTime, setReminderTime] = useState(existingHabit?.reminderTime || '');
  const [error, setError] = useState<string | null>(null);

  const handleApplyPreset = (preset: typeof PRESET_HABITS[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setTimeOfDay(preset.timeOfDay);
    setIcon(preset.icon);
    setColor(preset.color);
    sound.playPop();
    triggerHaptic('light');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a habit name.');
      sound.playErrorTone();
      triggerHaptic('medium');
      return;
    }

    onSaveHabit({
      title: title.trim(),
      description: description.trim(),
      category,
      timeOfDay,
      frequency,
      icon,
      color,
      reminderTime: reminderTime || undefined,
    });
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
              {existingHabit ? 'Edit Habit' : 'Create New Habit'}
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium">
              Daily micro-actions build unstoppable momentum
            </p>
          </div>
        </div>

        {/* XP Reward Pill */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-black shrink-0">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>+10 XP / day</span>
        </div>
      </header>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Preset Quick Starters (Only when creating new) */}
        {!existingHabit && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary block px-1">
              ⚡ Quick Popular Presets (Tap to Fill)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_HABITS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-left transition-all active:scale-98 flex items-start gap-2 cursor-pointer group"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${p.color}20`, color: p.color }}
                  >
                    <GoalIcon iconId={p.icon} className="w-3.5 h-3.5" color={p.color} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-on-surface block truncate group-hover:text-primary transition-colors">
                      {p.title}
                    </span>
                    <span className="text-[9px] font-semibold text-on-surface-variant block capitalize">
                      {p.timeOfDay} · {p.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs font-bold animate-in fade-in">
              {error}
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface block px-1">
              Habit Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Hydration, Read 15 Pages"
              className="w-full px-3.5 py-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary font-semibold text-sm transition-all"
              maxLength={60}
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface block px-1">
              Description or Why (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 1L water with lemon right after waking up"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary text-xs transition-all"
              maxLength={120}
            />
          </div>

          {/* Time of Day Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block px-1">
              Time of Day
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'morning', label: 'Morning', icon: '🌅' },
                { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
                { id: 'evening', label: 'Evening', icon: '🌙' },
                { id: 'anytime', label: 'Anytime', icon: '⏰' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTimeOfDay(t.id as HabitTimeOfDay);
                    sound.playPop();
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    timeOfDay === t.id
                      ? 'bg-primary text-on-primary border-primary font-black shadow-xs'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant font-bold hover:bg-surface-container-high'
                  }`}
                >
                  <span className="text-sm block">{t.icon}</span>
                  <span className="text-[10px] block mt-0.5">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block px-1">
              Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'daily', label: 'Every Day', desc: '7 days / week' },
                { id: 'weekdays', label: 'Weekdays Only', desc: 'Mon - Fri' },
                { id: 'weekends', label: 'Weekends Only', desc: 'Sat - Sun' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFrequency(f.id as HabitFrequency);
                    sound.playPop();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    frequency === f.id
                      ? 'bg-primary/10 border-primary text-on-surface font-bold ring-1 ring-primary'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="text-xs font-black block text-on-surface">{f.label}</span>
                  <span className="text-[9px] text-on-surface-variant block mt-0.5">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block px-1">
              Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'wellness', label: 'Wellness' },
                { id: 'fitness', label: 'Fitness' },
                { id: 'learning', label: 'Learning' },
                { id: 'creator', label: 'Creator' },
                { id: 'finance', label: 'Finance' },
                { id: 'career', label: 'Career' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategory(c.id as GoalCategory);
                    sound.playPop();
                  }}
                  className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer text-xs ${
                    category === c.id
                      ? 'bg-surface-container-highest border-primary text-primary font-black ring-1 ring-primary'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant font-medium hover:bg-surface-container-high'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block px-1">
              Habit Icon
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {HABIT_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => {
                    setIcon(ic);
                    sound.playPop();
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                    icon === ic
                      ? 'bg-surface-container-highest border-primary ring-2 ring-primary/40'
                      : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  <GoalIcon iconId={ic} className="w-5 h-5" color={color} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block px-1">
              Accent Color
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    sound.playPop();
                  }}
                  className={`w-8 h-8 rounded-full shrink-0 border-2 transition-all flex items-center justify-center cursor-pointer ${
                    color === c ? 'border-on-surface scale-110 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Time (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface block px-1">
              Daily Reminder (Optional)
            </label>
            <div className="relative">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-hidden focus:border-primary text-xs"
              />
            </div>
          </div>

          {/* Gamification Reminder Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-on-surface block leading-tight">
                  Earn +10 XP Every Day
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  Complete this habit to maintain your streak and level up!
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-primary text-on-primary font-black text-base shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{existingHabit ? 'Save Changes' : 'Create Habit (+10 XP)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
