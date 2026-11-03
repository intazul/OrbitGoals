import React, { useState, useRef, useMemo } from 'react';
import { TimeCapsule, CapsuleCategory, Goal, Habit, UserProfile } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { GoalIcon } from './GoalIcon';
import {
  ArrowLeft,
  Plus,
  Camera,
  Trash2,
  Share2,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trophy,
  Target,
  Flame,
  Zap,
  Star,
  X,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  History,
  Clock,
  Quote,
  Eye,
} from 'lucide-react';

interface ScrapbookScreenProps {
  capsules: TimeCapsule[];
  goals: Goal[];
  habits: Habit[];
  profile: UserProfile;
  onBack: () => void;
  onAddCapsule: (capsule: Omit<TimeCapsule, 'id' | 'createdAt'>) => void;
  onDeleteCapsule: (id: string) => void;
  onOpenHabitDetail?: (habit: Habit) => void;
  onOpenGoalDetail?: (goal: Goal) => void;
}

export type TimelineFilter = 'all' | 'habits' | 'goals' | 'achievements' | 'memories';

export interface UnifiedTimelineEvent {
  id: string;
  sourceType: 'habit' | 'goal' | 'achievement' | 'memory';
  eventType:
    | 'habit_checkin'
    | 'habit_sets'
    | 'habit_created'
    | 'habit_streak'
    | 'goal_step'
    | 'goal_completed'
    | 'goal_created'
    | 'level_up'
    | 'memory_capsule';
  date: string; // YYYY-MM-DD
  timestamp: number;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  color?: string;
  xpEarned?: number;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  iconId?: string;
  iconEmoji?: string;
  photoUrl?: string;
  sticker?: string;
  reflection?: string;
  progressPct?: number;
  sourceHabit?: Habit;
  sourceGoal?: Goal;
  capsule?: TimeCapsule;
}

const CATEGORY_META: Record<
  CapsuleCategory,
  { label: string; icon: typeof Trophy; color: string; bg: string; border: string }
> = {
  milestone: {
    label: 'Milestone',
    icon: Trophy,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  goal: {
    label: 'Goal Achieved',
    icon: Target,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  streak: {
    label: 'Habit Streak',
    icon: Flame,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  level: {
    label: 'Level Up',
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  win: {
    label: 'Personal Win',
    icon: Star,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
};

const STICKER_PRESETS = ['🚀', '🏆', '💎', '👑', '🔥', '⚡', '🎯', '🌟', '🌈', '🥇', '🧘', '📚', '💪', '🎬'];

export const ScrapbookScreen: React.FC<ScrapbookScreenProps> = ({
  capsules,
  goals,
  habits,
  profile,
  onBack,
  onAddCapsule,
  onDeleteCapsule,
  onOpenHabitDetail,
  onOpenGoalDetail,
}) => {
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [viewingCapsule, setViewingCapsule] = useState<TimeCapsule | null>(null);
  const [sharingCapsule, setSharingCapsule] = useState<TimeCapsule | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New capsule form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CapsuleCategory>('milestone');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formReflection, setFormReflection] = useState('');
  const [formSticker, setFormSticker] = useState<string>('🚀');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | undefined>(undefined);
  const [formLinkedGoal, setFormLinkedGoal] = useState<string>('');
  const [formLinkedHabit, setFormLinkedHabit] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper date parser
  const parseDateSafe = (dStr?: string): number => {
    if (!dStr) return Date.now();
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
      }
      return new Date(dStr).getTime() || Date.now();
    } catch {
      return Date.now();
    }
  };

  // Generate the Master Chronological Timeline of all Habits, Goals, Achievements, and Memories
  const masterTimeline = useMemo<UnifiedTimelineEvent[]>(() => {
    const events: UnifiedTimelineEvent[] = [];

    // 1. Time Capsules (Memories with photos & reflections)
    capsules.forEach((capsule) => {
      const meta = CATEGORY_META[capsule.category] || CATEGORY_META.milestone;
      events.push({
        id: `capsule-${capsule.id}`,
        sourceType: 'memory',
        eventType: 'memory_capsule',
        date: capsule.date || todayStr,
        timestamp: parseDateSafe(capsule.date) + 999, // slight offset to place top of that day
        title: capsule.title,
        subtitle: capsule.reflection || 'Saved Time Capsule Victory',
        category: capsule.category,
        badgeLabel: meta.label.toUpperCase(),
        badgeColor: meta.color,
        badgeBg: meta.bg,
        badgeBorder: meta.border,
        sticker: capsule.sticker || '📸',
        photoUrl: capsule.photoUrl,
        reflection: capsule.reflection,
        xpEarned: capsule.xpBonus || 100,
        capsule,
      });
    });

    // 2. Habits History (Creation, Check-ins, Sets, and Streaks)
    habits.forEach((habit) => {
      // Habit Created
      if (habit.createdAt) {
        events.push({
          id: `habit-created-${habit.id}`,
          sourceType: 'habit',
          eventType: 'habit_created',
          date: habit.createdAt,
          timestamp: parseDateSafe(habit.createdAt) + 1,
          title: `Started Habit: ${habit.title}`,
          subtitle: `Target: ${habit.targetValue || 1} ${habit.unit || 'times'} (${habit.frequency}) · Earn +${habit.xpPerSet || 10} XP`,
          category: habit.category,
          color: habit.color,
          badgeLabel: 'NEW HABIT',
          badgeColor: 'text-emerald-700 dark:text-emerald-300',
          badgeBg: 'bg-emerald-500/15',
          badgeBorder: 'border-emerald-500/30',
          iconId: habit.icon,
          sticker: '🌱',
          xpEarned: 25,
          sourceHabit: habit,
        });
      }

      // Check-ins (from completedDates)
      (habit.completedDates || []).forEach((cDate, idx) => {
        const isSets = habit.trackingType === 'sets';
        const recordedVal = habit.progressHistory?.[cDate];
        const valText = typeof recordedVal === 'number' && recordedVal > 0
          ? `${recordedVal} ${habit.unit || 'reps'}`
          : `${habit.targetValue || 30} ${habit.unit || 'reps'}`;

        events.push({
          id: `habit-checkin-${habit.id}-${cDate}-${idx}`,
          sourceType: 'habit',
          eventType: 'habit_checkin',
          date: cDate,
          timestamp: parseDateSafe(cDate) + 500 + idx,
          title: habit.title,
          subtitle: isSets
            ? `Daily set target achieved: ${valText} logged!`
            : 'Daily consistency check-in completed!',
          category: habit.category,
          color: habit.color,
          badgeLabel: isSets ? valText : 'COMPLETED',
          badgeColor: 'text-emerald-600 dark:text-emerald-400',
          badgeBg: 'bg-emerald-500/10',
          badgeBorder: 'border-emerald-500/25',
          iconId: habit.icon,
          sticker: '✅',
          xpEarned: habit.xpPerSet || 10,
          sourceHabit: habit,
        });
      });

      // Sets logged in progressHistory that might not be in completedDates
      if (habit.progressHistory) {
        Object.entries(habit.progressHistory).forEach(([dateStr, pVal], idx) => {
          if (!habit.completedDates?.includes(dateStr) && typeof pVal === 'number' && pVal > 0) {
            events.push({
              id: `habit-sets-${habit.id}-${dateStr}-${idx}`,
              sourceType: 'habit',
              eventType: 'habit_sets',
              date: dateStr,
              timestamp: parseDateSafe(dateStr) + 400 + idx,
              title: habit.title,
              subtitle: `Logged ${pVal} of ${habit.targetValue || 30} ${habit.unit || 'reps'} today`,
              category: habit.category,
              color: habit.color,
              badgeLabel: `${pVal} ${habit.unit || 'reps'}`,
              badgeColor: 'text-blue-600 dark:text-blue-400',
              badgeBg: 'bg-blue-500/10',
              badgeBorder: 'border-blue-500/25',
              iconId: habit.icon,
              sticker: '💪',
              xpEarned: habit.xpPerSet || 10,
              sourceHabit: habit,
            });
          }
        });
      }

      // Streak Achievements
      if (habit.streakDays >= 3) {
        events.push({
          id: `habit-streak-3-${habit.id}`,
          sourceType: 'achievement',
          eventType: 'habit_streak',
          date: todayStr,
          timestamp: Date.now() - 2000,
          title: `🔥 3-Day Momentum Streak: ${habit.title}`,
          subtitle: `Hit consistent daily check-ins for 3 days in a row!`,
          category: 'streak',
          color: '#f97316',
          badgeLabel: '3D STREAK',
          badgeColor: 'text-orange-600 dark:text-orange-400',
          badgeBg: 'bg-orange-500/10',
          badgeBorder: 'border-orange-500/30',
          iconId: habit.icon,
          sticker: '🔥',
          xpEarned: 50,
          sourceHabit: habit,
        });
      }

      if (habit.streakDays >= 7) {
        events.push({
          id: `habit-streak-7-${habit.id}`,
          sourceType: 'achievement',
          eventType: 'habit_streak',
          date: todayStr,
          timestamp: Date.now() - 1000,
          title: `⚡ 7-Day Week Warrior Streak: ${habit.title}`,
          subtitle: `A solid week of unbroken dedication!`,
          category: 'streak',
          color: '#e11d48',
          badgeLabel: '7D STREAK',
          badgeColor: 'text-rose-600 dark:text-rose-400',
          badgeBg: 'bg-rose-500/10',
          badgeBorder: 'border-rose-500/30',
          iconId: habit.icon,
          sticker: '⚡',
          xpEarned: 100,
          sourceHabit: habit,
        });
      }
    });

    // 3. Goals History (Creation, Progress Steps, and 100% Milestones)
    goals.forEach((goal) => {
      // Goal Created
      if (goal.createdAt) {
        events.push({
          id: `goal-created-${goal.id}`,
          sourceType: 'goal',
          eventType: 'goal_created',
          date: goal.createdAt,
          timestamp: parseDateSafe(goal.createdAt) + 2,
          title: `Created Goal: ${goal.title}`,
          subtitle: `Target: ${goal.targetValue.toLocaleString()} ${goal.unit || 'units'} · +${goal.xpReward || 50} XP per step`,
          category: goal.category,
          color: goal.color,
          badgeLabel: 'NEW GOAL',
          badgeColor: 'text-purple-700 dark:text-purple-300',
          badgeBg: 'bg-purple-500/15',
          badgeBorder: 'border-purple-500/30',
          iconId: goal.icon,
          sticker: '🎯',
          xpEarned: 50,
          sourceGoal: goal,
        });
      }

      // Progress Steps from goal.history
      (goal.history || []).forEach((entry, idx) => {
        const pct = Math.min(100, Math.max(0, Math.round((entry.value / (goal.targetValue || 1)) * 100)));
        events.push({
          id: `goal-step-${goal.id}-${entry.date}-${idx}`,
          sourceType: 'goal',
          eventType: 'goal_step',
          date: entry.date,
          timestamp: parseDateSafe(entry.date) + 600 + idx,
          title: goal.title,
          subtitle: `Progress recorded: ${entry.value.toLocaleString()} / ${goal.targetValue.toLocaleString()} ${goal.unit || 'units'} (${pct}%)`,
          category: goal.category,
          color: goal.color,
          badgeLabel: `${pct}%`,
          badgeColor: 'text-primary',
          badgeBg: 'bg-primary/10',
          badgeBorder: 'border-primary/20',
          iconId: goal.icon,
          sticker: '📈',
          progressPct: pct,
          xpEarned: goal.xpReward || 50,
          sourceGoal: goal,
        });
      });

      // Goal 100% Finished Milestone
      const isConquered = goal.currentValue >= goal.targetValue || (goal.completedDates && goal.completedDates.length > 0);
      if (isConquered) {
        const finishDate = goal.completedDates?.[0] || todayStr;
        events.push({
          id: `goal-finished-${goal.id}`,
          sourceType: 'achievement',
          eventType: 'goal_completed',
          date: finishDate,
          timestamp: parseDateSafe(finishDate) + 900,
          title: `🏆 Goal Completed: ${goal.title}!`,
          subtitle: `Target of ${goal.targetValue.toLocaleString()} ${goal.unit || 'units'} conquered at 100%!`,
          category: 'goal',
          color: '#10b981',
          badgeLabel: '100% CONQUERED',
          badgeColor: 'text-emerald-700 dark:text-emerald-300',
          badgeBg: 'bg-emerald-500/15',
          badgeBorder: 'border-emerald-500/30',
          iconId: goal.icon,
          sticker: '🏆',
          xpEarned: (goal.xpReward || 50) * 2,
          sourceGoal: goal,
        });
      }
    });

    // 4. Player Level Up & Genesis Achievements
    events.push({
      id: 'level-1-genesis',
      sourceType: 'achievement',
      eventType: 'level_up',
      date: todayStr,
      timestamp: Date.now() - 10000,
      title: 'Genesis: Began Journey on OrbitGoals',
      subtitle: 'Account activated with 2 Streak Shields & starter habits ready.',
      category: 'level',
      badgeLabel: 'LEVEL 1',
      badgeColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500/15',
      badgeBorder: 'border-amber-500/30',
      sticker: '🚀',
      xpEarned: 50,
    });

    if ((profile.level ?? 1) >= 2) {
      events.push({
        id: 'level-2-pioneer',
        sourceType: 'achievement',
        eventType: 'level_up',
        date: todayStr,
        timestamp: Date.now() - 5000,
        title: '⭐ Level 2 Reached: Goal Pioneer',
        subtitle: 'Unlocked Studio Monitor Cans & Creator gear in Player Catalog.',
        category: 'level',
        badgeLabel: 'LEVEL 2',
        badgeColor: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-500/15',
        badgeBorder: 'border-blue-500/30',
        sticker: '⭐',
        xpEarned: 100,
      });
    }

    if ((profile.level ?? 1) >= 3) {
      events.push({
        id: 'level-3-momentum',
        sourceType: 'achievement',
        eventType: 'level_up',
        date: todayStr,
        timestamp: Date.now() - 3000,
        title: '🌟 Level 3 Reached: Momentum Builder',
        subtitle: 'Unlocked Athletic Runner Band & Pro Jersey in Player Catalog.',
        category: 'level',
        badgeLabel: 'LEVEL 3',
        badgeColor: 'text-indigo-600 dark:text-indigo-400',
        badgeBg: 'bg-indigo-500/15',
        badgeBorder: 'border-indigo-500/30',
        sticker: '🌟',
        xpEarned: 150,
      });
    }

    // Sort newest to oldest
    return events.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.timestamp - a.timestamp;
    });
  }, [capsules, habits, goals, profile, todayStr]);

  // Filtered timeline based on active tab
  const filteredEvents = useMemo(() => {
    return masterTimeline.filter((ev) => {
      if (timelineFilter === 'all') return true;
      if (timelineFilter === 'habits') return ev.sourceType === 'habit';
      if (timelineFilter === 'goals') return ev.sourceType === 'goal';
      if (timelineFilter === 'achievements') return ev.sourceType === 'achievement';
      if (timelineFilter === 'memories') return ev.sourceType === 'memory';
      return true;
    });
  }, [masterTimeline, timelineFilter]);

  // Group events by date for visual timeline headings
  const groupedEvents = useMemo(() => {
    const groups: { date: string; displayDate: string; items: UnifiedTimelineEvent[] }[] = [];
    filteredEvents.forEach((ev) => {
      let group = groups.find((g) => g.date === ev.date);
      if (!group) {
        let display = ev.date;
        if (ev.date === todayStr) {
          display = "Today's Milestones";
        } else {
          try {
            const [y, m, d] = ev.date.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            display = dt.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          } catch {
            display = ev.date;
          }
        }
        group = { date: ev.date, displayDate: display, items: [] };
        groups.push(group);
      }
      group.items.push(ev);
    });
    return groups;
  }, [filteredEvents, todayStr]);

  // High-level KPI Stats
  const totalCheckinsCount = useMemo(() => {
    return habits.reduce((acc, h) => acc + (h.completedDates?.length || 0), 0);
  }, [habits]);

  const totalGoalsCompletedCount = useMemo(() => {
    return goals.filter((g) => g.currentValue >= g.targetValue || (g.completedDates && g.completedDates.length > 0)).length;
  }, [goals]);

  const totalTimelineXp = useMemo(() => {
    return masterTimeline.reduce((acc, ev) => acc + (ev.xpEarned || 0), 0);
  }, [masterTimeline]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo is too large! Please choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormPhotoUrl(reader.result);
        sound.playPop();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    onAddCapsule({
      title: formTitle.trim(),
      category: formCategory,
      date: formDate || todayStr,
      reflection: formReflection.trim(),
      sticker: formSticker,
      photoUrl: formPhotoUrl,
      linkedGoalTitle: formLinkedGoal ? formLinkedGoal : undefined,
      linkedHabitTitle: formLinkedHabit ? formLinkedHabit : undefined,
      xpBonus: 100,
    });

    setFormTitle('');
    setFormReflection('');
    setFormPhotoUrl(undefined);
    setFormLinkedGoal('');
    setFormLinkedHabit('');
    setFormSticker('🚀');
    setIsAdding(false);

    sound.playSuccessChime();
    triggerHaptic('success');
  };

  const handleCopyStory = (capsule: TimeCapsule) => {
    const text = `🌟 OrbitGoals Victory Capsule 📸\n\n"${capsule.title}"\n📅 ${capsule.date}\n👤 ${profile.name || 'Achiever'}\n\n"${capsule.reflection || 'Crushed another milestone on OrbitGoals!'}"\n\n🚀 Track habits & goals on OrbitGoals!`;
    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    sound.playPop();
    triggerHaptic('light');
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface text-on-surface overflow-hidden">
      {/* Top Header */}
      <header
        style={{ marginTop: '32px', marginLeft: '0px' }}
        className="px-4 mt-8 pt-6 pb-3 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface/90 backdrop-blur-md z-10"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer border border-outline-variant/30"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[18px] font-black tracking-tight text-on-surface leading-none whitespace-nowrap">
              Growth Scrapbook
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
              Unified Timeline of Habits, Goals & Victories
            </p>
          </div>
        </div>

        {/* Add Memory Button */}
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            sound.playPop();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Memory</span>
        </button>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 pb-24">
        {/* Hero KPI Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-surface-container-low border border-primary/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                Growth Audit Reel & Timeline
              </span>
              <h2 className="text-xl font-black text-on-surface tracking-tight">
                {masterTimeline.length} Recorded Milestones
              </h2>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-xl border border-primary/30">
              📸
            </div>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-outline-variant/20">
            <div className="bg-surface/80 rounded-xl p-2 text-center border border-outline-variant/20">
              <span className="text-sm font-black text-primary font-mono block leading-none">
                {totalCheckinsCount}
              </span>
              <span className="text-[9px] text-on-surface-variant font-bold block mt-0.5 truncate">
                Check-ins
              </span>
            </div>

            <div className="bg-surface/80 rounded-xl p-2 text-center border border-outline-variant/20">
              <span className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono block leading-none">
                {goals.length}
              </span>
              <span className="text-[9px] text-on-surface-variant font-bold block mt-0.5 truncate">
                Goals Set
              </span>
            </div>

            <div className="bg-surface/80 rounded-xl p-2 text-center border border-outline-variant/20">
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block leading-none">
                {totalGoalsCompletedCount}
              </span>
              <span className="text-[9px] text-on-surface-variant font-bold block mt-0.5 truncate">
                Finished
              </span>
            </div>

            <div className="bg-surface/80 rounded-xl p-2 text-center border border-outline-variant/20">
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono block leading-none">
                +{totalTimelineXp}
              </span>
              <span className="text-[9px] text-on-surface-variant font-bold block mt-0.5 truncate">
                Total XP
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all' as const, label: `All Timeline (${masterTimeline.length})` },
            { id: 'habits' as const, label: `🌱 Habits (${masterTimeline.filter((e) => e.sourceType === 'habit').length})` },
            { id: 'goals' as const, label: `🎯 Goals (${masterTimeline.filter((e) => e.sourceType === 'goal').length})` },
            { id: 'achievements' as const, label: `🏆 Achievements (${masterTimeline.filter((e) => e.sourceType === 'achievement').length})` },
            { id: 'memories' as const, label: `📸 Memories (${capsules.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setTimelineFilter(tab.id);
                sound.playPop();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                timelineFilter === tab.id
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Master Connected Timeline Feed */}
        <div className="space-y-4 pt-1">
          {groupedEvents.map((group) => (
            <div key={group.date} className="space-y-2.5">
              {/* Group Date Header */}
              <div className="sticky top-0 z-10 flex items-center gap-2 py-1 bg-surface/95 backdrop-blur-xs">
                <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{group.displayDate}</span>
                </span>
                <div className="h-px bg-outline-variant/30 flex-1" />
                <span className="text-[10px] font-bold text-on-surface-variant font-mono">
                  {group.items.length} {group.items.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {/* Group Timeline Cards with Vertical Connected Track */}
              <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
                {group.items.map((event) => {
                  const isCapsule = event.sourceType === 'memory' && event.capsule;
                  const isHabit = event.sourceHabit;
                  const isGoal = event.sourceGoal;

                  return (
                    <div
                      key={event.id}
                      className="relative rounded-2xl bg-surface-container-low border border-outline-variant/30 p-3.5 shadow-xs space-y-2 transition-all hover:border-primary/40 group"
                    >
                      {/* Timeline Dot Indicator */}
                      <div
                        className="absolute -left-[19px] top-4 w-3 h-3 rounded-full border-2 border-surface shadow-xs transition-transform group-hover:scale-125"
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      />

                      {/* Header Row: Badge, Date/Source, XP bonus, and Actions */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${event.badgeBg} ${event.badgeColor} ${event.badgeBorder}`}
                          >
                            <span>{event.sticker || '✨'}</span>
                            <span>{event.badgeLabel}</span>
                          </span>

                          <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 opacity-60" />
                            <span>{formatDateLabel(event.date)}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {event.xpEarned && (
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>+{event.xpEarned} XP</span>
                            </span>
                          )}

                          {isCapsule && (
                            <>
                              <button
                                type="button"
                                onClick={() => setSharingCapsule(event.capsule!)}
                                className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 transition-all border border-outline-variant/20 cursor-pointer"
                                title="Share Memory"
                              >
                                <Share2 className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(event.capsule!.id)}
                                className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant hover:text-red-500 active:scale-95 transition-all border border-outline-variant/20 cursor-pointer"
                                title="Delete Memory"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Main Title & Subtitle */}
                      <div className="flex items-start gap-2.5">
                        {event.iconId && (
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-outline-variant/20 mt-0.5"
                            style={{ backgroundColor: `${event.color}15`, color: event.color }}
                          >
                            <GoalIcon iconId={event.iconId} className="w-4 h-4" color={event.color} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-on-surface tracking-tight leading-snug">
                            {event.title}
                          </h4>
                          {event.subtitle && (
                            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                              {event.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Photo Attachment if present */}
                      {event.photoUrl && (
                        <div
                          onClick={() => isCapsule && setViewingCapsule(event.capsule!)}
                          className="relative rounded-xl overflow-hidden max-h-40 bg-black/10 border border-outline-variant/20 cursor-pointer"
                        >
                          <img
                            src={event.photoUrl}
                            alt={event.title}
                            className="w-full h-36 object-cover hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            <span>Tap to view</span>
                          </div>
                        </div>
                      )}

                      {/* Reflection Quote if present */}
                      {event.reflection && (
                        <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/20 relative space-y-1">
                          <div className="flex items-center gap-1 text-on-surface-variant text-[9px] font-bold uppercase tracking-wider">
                            <Quote className="w-2.5 h-2.5 text-primary stroke-[3]" />
                            <span>Memory Note</span>
                          </div>
                          <p className="text-[11px] text-on-surface font-medium leading-relaxed italic">
                            "{event.reflection}"
                          </p>
                        </div>
                      )}

                      {/* Interactive Navigation Link to Open in New Tab */}
                      {isHabit && onOpenHabitDetail && (
                        <button
                          type="button"
                          onClick={() => onOpenHabitDetail(isHabit)}
                          className="w-full pt-1.5 border-t border-outline-variant/15 text-[11px] font-bold text-primary hover:underline flex items-center justify-between cursor-pointer group-hover:text-primary"
                        >
                          <span>Open habit full details & history tab</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isGoal && onOpenGoalDetail && (
                        <button
                          type="button"
                          onClick={() => onOpenGoalDetail(isGoal)}
                          className="w-full pt-1.5 border-t border-outline-variant/15 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-between cursor-pointer group-hover:text-purple-500"
                        >
                          <span>Open goal full overview & milestone tab</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
                📸
              </div>
              <h3 className="text-base font-black text-on-surface">No timeline entries found</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                Log habit check-ins, update goals, or tap "New Memory" above to start populating your growth scrapbook timeline.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  sound.playPop();
                }}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Victory Memory</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NEW MEMORY BOTTOM SHEET MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0">
          <div className="w-full max-w-[430px] bg-surface border-t border-outline-variant/30 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📸</span>
                <h3 className="text-base font-black text-on-surface">New Time Capsule Memory</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30-Day Fitness Streak, Published 20th Video!"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Milestone Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'milestone', label: '🏆 Milestone' },
                      { id: 'goal', label: '🎯 Goal Win' },
                      { id: 'streak', label: '🔥 Streak' },
                      { id: 'level', label: '⚡ Level Up' },
                      { id: 'win', label: '🌟 Personal Win' },
                    ] as { id: CapsuleCategory; label: string }[]
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormCategory(cat.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        formCategory === cat.id
                          ? 'bg-primary text-on-primary border-primary shadow-xs'
                          : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Date of Milestone
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Photo Upload Option */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-on-surface">
                    Photo Attachment (Optional)
                  </label>
                  {formPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormPhotoUrl(undefined)}
                      className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {formPhotoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-outline-variant/30 max-h-48 bg-black/20">
                    <img
                      src={formPhotoUrl}
                      alt="Uploaded preview"
                      className="w-full h-44 object-cover"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-outline-variant/40 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-on-surface-variant hover:border-primary hover:text-primary transition-all cursor-pointer bg-surface-container/50"
                  >
                    <Camera className="w-6 h-6 stroke-[2]" />
                    <span className="text-xs font-bold">Select image from device</span>
                    <span className="text-[10px] text-on-surface-variant/70">JPG, PNG under 2MB</span>
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Celebration Sticker Picker */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Celebration Sticker
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {STICKER_PRESETS.map((sticker) => (
                    <button
                      key={sticker}
                      type="button"
                      onClick={() => setFormSticker(sticker)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                        formSticker === sticker
                          ? 'bg-primary/20 border-primary scale-110 shadow-xs'
                          : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                      }`}
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection Note */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Reflection / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="How did achieving this feel? What habits drove this win?"
                  value={formReflection}
                  onChange={(e) => setFormReflection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Link to Goal / Habit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-on-surface block mb-1">
                    Connect Goal (Optional)
                  </label>
                  <select
                    value={formLinkedGoal}
                    onChange={(e) => setFormLinkedGoal(e.target.value)}
                    className="w-full p-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
                  >
                    <option value="">None</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.title}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface block mb-1">
                    Connect Habit (Optional)
                  </label>
                  <select
                    value={formLinkedHabit}
                    onChange={(e) => setFormLinkedHabit(e.target.value)}
                    className="w-full p-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
                  >
                    <option value="">None</option>
                    {habits.map((h) => (
                      <option key={h.id} value={h.title}>
                        {h.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 pb-6">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-primary text-on-primary font-black text-sm shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Save Memory to Scrapbook (+100 XP)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE / STORY MODAL */}
      {sharingCapsule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Victory Memory Card
              </span>
              <button
                type="button"
                onClick={() => setSharingCapsule(null)}
                className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shareable Card Content */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-surface-container to-surface border border-primary/25 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{sharingCapsule.sticker || '🏆'}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  OrbitGoals Achiever
                </span>
              </div>

              {sharingCapsule.photoUrl && (
                <img
                  src={sharingCapsule.photoUrl}
                  alt={sharingCapsule.title}
                  className="w-full h-36 object-cover rounded-xl border border-outline-variant/20"
                />
              )}

              <div className="space-y-1">
                <h4 className="text-base font-black text-on-surface leading-snug">
                  {sharingCapsule.title}
                </h4>
                {sharingCapsule.reflection && (
                  <p className="text-xs text-on-surface-variant italic leading-relaxed">
                    "{sharingCapsule.reflection}"
                  </p>
                )}
                <span className="text-[10px] text-on-surface-variant font-bold block pt-1">
                  📅 {formatDateLabel(sharingCapsule.date)}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyStory(sharingCapsule)}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                {copiedToast ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToast ? 'Story Copied!' : 'Copy Victory Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSharingCapsule(null)}
                className="w-full py-2 px-4 rounded-xl bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW FULL PHOTO MODAL */}
      {viewingCapsule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl p-4 max-w-sm w-full space-y-3 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface truncate pr-2">
                {viewingCapsule.title}
              </h4>
              <button
                type="button"
                onClick={() => setViewingCapsule(null)}
                className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {viewingCapsule.photoUrl && (
              <img
                src={viewingCapsule.photoUrl}
                alt={viewingCapsule.title}
                className="w-full max-h-72 object-cover rounded-2xl border border-outline-variant/20 shadow-md"
              />
            )}

            {viewingCapsule.reflection && (
              <p className="text-xs text-on-surface italic leading-relaxed bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                "{viewingCapsule.reflection}"
              </p>
            )}

            <button
              type="button"
              onClick={() => setViewingCapsule(null)}
              className="w-full py-2 rounded-xl bg-surface-container font-bold text-xs text-on-surface hover:bg-surface-container-high cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl p-5 max-w-xs w-full space-y-3 shadow-xl">
            <h4 className="text-sm font-black text-on-surface">Delete this memory?</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This capsule will be removed from your Growth Scrapbook.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDeleteCapsule(deleteConfirmId);
                  setDeleteConfirmId(null);
                  sound.playPop();
                }}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Copied Toast */}
      {copiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-primary text-on-primary font-bold text-xs shadow-lg flex items-center gap-1.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Victory summary copied!</span>
        </div>
      )}
    </div>
  );
};
