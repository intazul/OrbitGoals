import React, { useState } from 'react';
import { UserProfile, Habit, Goal } from '../types';
import { calculateLevelProgress, getRankInfo, calculateStreak } from '../utils/gamification';
import { sound, triggerHaptic } from '../utils/sound';
import { GoalIcon } from './GoalIcon';
import { UserAvatar } from './UserAvatar';
import { AvatarPickerModal } from './AvatarPickerModal';
import {
  ArrowLeft,
  Flame,
  Zap,
  Sparkles,
  Trophy,
  Shield,
  CheckCircle2,
  Calendar,
  Edit3,
  Check,
  Target,
  Repeat,
  Share2,
  Clock,
  Award,
  ChevronRight,
  X,
  Plus,
  Camera,
} from 'lucide-react';

interface ProfileScreenProps {
  profile: UserProfile;
  habits: Habit[];
  goals: Goal[];
  onBack: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onToggleHabit: (habitId: string) => void;
  onRestoreStarterHabits?: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'habits' | 'goals' | 'level';
  isUnlocked: boolean;
  progress: number; // 0 to 100
  progressText: string;
  xpReward: number;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  habits,
  goals,
  onBack,
  onUpdateProfile,
  onToggleHabit,
  onRestoreStarterHabits,
}) => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'recent' | 'ongoing'>('achievements');
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name || '');
  const [editAge, setEditAge] = useState(profile.age ? String(profile.age) : '');
  const [editTitle, setEditTitle] = useState(profile.title || 'Novice Achiever');
  const [editMotto, setEditMotto] = useState(
    profile.motto || 'Consistency turns small steps into unstoppable momentum.'
  );
  const [copiedToast, setCopiedToast] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const userXp = profile.xp || 0;
  const levelInfo = calculateLevelProgress(userXp);
  const rankInfo = getRankInfo(levelInfo.level);

  // Best streak across all habits
  const highestStreak = habits.reduce((max, h) => Math.max(max, h.streakDays || 0, h.bestStreak || 0), 0);

  // Total habit check-ins all time
  const totalHabitCheckins = habits.reduce((acc, h) => acc + (h.completedDates?.length || 0), 0);

  // Total completed goals
  const totalCompletedGoals = goals.filter((g) => (g.currentValue || 0) >= (g.targetValue || 1)).length;

  // Goals progress steps taken (sum of currentValue)
  const totalGoalSteps = goals.reduce((acc, g) => acc + (g.currentValue || 0), 0);

  // Compute Achievements dynamically
  const achievements: Achievement[] = [
    {
      id: 'first-habit',
      title: 'First Spark',
      description: 'Complete your first daily habit',
      icon: '🌱',
      category: 'habits',
      isUnlocked: totalHabitCheckins >= 1,
      progress: Math.min(100, (totalHabitCheckins / 1) * 100),
      progressText: `${Math.min(1, totalHabitCheckins)}/1 habit completed`,
      xpReward: 50,
    },
    {
      id: 'flame-starter',
      title: 'Flame Starter',
      description: 'Achieve a 3-day streak on any daily habit',
      icon: '🔥',
      category: 'streak',
      isUnlocked: highestStreak >= 3,
      progress: Math.min(100, Math.round((highestStreak / 3) * 100)),
      progressText: `${Math.min(3, highestStreak)}/3 days`,
      xpReward: 100,
    },
    {
      id: 'week-warrior',
      title: 'Week Warrior',
      description: 'Build an unbroken 7-day habit streak',
      icon: '⚡',
      category: 'streak',
      isUnlocked: highestStreak >= 7,
      progress: Math.min(100, Math.round((highestStreak / 7) * 100)),
      progressText: `${Math.min(7, highestStreak)}/7 days`,
      xpReward: 200,
    },
    {
      id: 'iron-discipline',
      title: 'Iron Discipline',
      description: 'Reach an exceptional 14-day habit streak',
      icon: '🛡️',
      category: 'streak',
      isUnlocked: highestStreak >= 14,
      progress: Math.min(100, Math.round((highestStreak / 14) * 100)),
      progressText: `${Math.min(14, highestStreak)}/14 days`,
      xpReward: 350,
    },
    {
      id: 'goal-pioneer',
      title: 'Objective Pioneer',
      description: 'Log at least 5 step increments towards any goal',
      icon: '🎯',
      category: 'goals',
      isUnlocked: totalGoalSteps >= 5,
      progress: Math.min(100, Math.round((totalGoalSteps / 5) * 100)),
      progressText: `${Math.min(5, totalGoalSteps)}/5 steps taken`,
      xpReward: 150,
    },
    {
      id: 'goal-crusher',
      title: 'Goal Crusher',
      description: 'Reach 100% completion on a target goal',
      icon: '🏆',
      category: 'goals',
      isUnlocked: totalCompletedGoals >= 1,
      progress: Math.min(100, totalCompletedGoals >= 1 ? 100 : 0),
      progressText: `${Math.min(1, totalCompletedGoals)}/1 goal crushed`,
      xpReward: 300,
    },
    {
      id: 'level-three',
      title: 'Rising Star',
      description: 'Reach Account Level 3 with earned XP',
      icon: '⭐',
      category: 'level',
      isUnlocked: levelInfo.level >= 3,
      progress: Math.min(100, Math.round((levelInfo.level / 3) * 100)),
      progressText: `Level ${levelInfo.level}/3`,
      xpReward: 150,
    },
    {
      id: 'level-five',
      title: 'Vanguard Leader',
      description: 'Reach Account Level 5 and unlock elite status',
      icon: '👑',
      category: 'level',
      isUnlocked: levelInfo.level >= 5,
      progress: Math.min(100, Math.round((levelInfo.level / 5) * 100)),
      progressText: `Level ${levelInfo.level}/5`,
      xpReward: 500,
    },
    {
      id: 'century-club',
      title: 'Consistency Centurion',
      description: 'Complete 25 total daily habit check-ins',
      icon: '💎',
      category: 'habits',
      isUnlocked: totalHabitCheckins >= 25,
      progress: Math.min(100, Math.round((totalHabitCheckins / 25) * 100)),
      progressText: `${Math.min(25, totalHabitCheckins)}/25 check-ins`,
      xpReward: 400,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  // Recent completed habits (extracted chronologically)
  interface RecentCompletion {
    habitId: string;
    habitTitle: string;
    habitColor: string;
    habitIcon: string;
    category: string;
    dateStr: string;
    timeOfDay: string;
  }

  const recentCompletions: RecentCompletion[] = [];
  habits.forEach((h) => {
    (h.completedDates || []).forEach((d) => {
      recentCompletions.push({
        habitId: h.id,
        habitTitle: h.title,
        habitColor: h.color,
        habitIcon: h.icon,
        category: h.category,
        dateStr: d,
        timeOfDay: h.timeOfDay,
      });
    });
  });

  // Sort newest first
  recentCompletions.sort((a, b) => b.dateStr.localeCompare(a.dateStr));

  // Format readable date
  const formatRecentDate = (dStr: string) => {
    if (dStr === todayStr) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    const parts = dStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return dStr;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: editName.trim() || 'Achiever',
      age: editAge ? parseInt(editAge, 10) || null : null,
      title: editTitle.trim() || rankInfo.title,
      motto: editMotto.trim(),
    });
    setIsEditing(false);
    sound.playSuccessChime();
    triggerHaptic('success');
  };

  const handleShareSummary = () => {
    const text = `🌟 OrbitGoals Profile Summary\n👤 ${profile.name || 'Achiever'} (${rankInfo.title})\n⚡ Level ${levelInfo.level} · ${userXp} XP\n🔥 Best Habit Streak: ${highestStreak} days\n🏆 Trophies: ${unlockedCount}/${achievements.length} Unlocked\n✅ Total Habit Check-ins: ${totalHabitCheckins}`;
    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    sound.playPop();
    triggerHaptic('light');
    setTimeout(() => setCopiedToast(false), 2500);
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
            title="Go back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[19px] font-black tracking-tight text-on-surface leading-tight">
              Player Profile
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium">
              Rank, trophies, history & streak momentum
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Share summary button */}
          <button
            type="button"
            onClick={handleShareSummary}
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer border border-outline-variant/30"
            title="Copy Profile Progress Summary"
          >
            <Share2 className="w-4 h-4 text-primary" />
          </button>

          {/* Edit profile button */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="h-9 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Edit</span>
          </button>
        </div>
      </header>

      {/* Copied toast notification */}
      {copiedToast && (
        <div className="px-4 pt-2">
          <div className="p-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Summary copied to clipboard!</span>
          </div>
        </div>
      )}

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-20">
        {/* User Identity Hero Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-surface-container via-surface-container-low to-surface border border-outline-variant/30 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            {/* Avatar Badge with Tap to Change */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAvatarModalOpen(true);
                  sound.playPop();
                  triggerHaptic('light');
                }}
                className="block cursor-pointer transition-transform active:scale-95 hover:opacity-90 rounded-2xl relative"
                title="Tap to change avatar portrait"
              >
                <UserAvatar
                  avatarId={profile.avatarId}
                  avatarUrl={profile.avatarUrl}
                  fallbackText={profile.name}
                  size="lg"
                  className="shadow-sm"
                />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md border-2 border-surface">
                  <Camera className="w-3 h-3 stroke-[2.5]" />
                </div>
              </button>
              <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] shadow-sm flex items-center gap-0.5 border border-amber-300 pointer-events-none">
                <span>Lv.{levelInfo.level}</span>
              </div>
            </div>

            {/* Name, Title, Age */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[20px] font-black tracking-tight text-on-surface truncate">
                  {profile.name || 'Orbit Achiever'}
                </h2>
                {profile.age && (
                  <span className="text-xs text-on-surface-variant font-medium">
                    · {profile.age} yrs
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1">
                  <span>{rankInfo.badge}</span>
                  <span className="truncate">{profile.title || rankInfo.title}</span>
                </span>
              </div>

              {profile.motto && (
                <p className="text-[11px] text-on-surface-variant italic mt-1 leading-snug line-clamp-2">
                  "{profile.motto}"
                </p>
              )}
            </div>
          </div>

          {/* XP PROGRESS BAR (Relocated from main screen to profile as requested) */}
          <div className="pt-2 border-t border-outline-variant/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface flex items-center gap-1 text-[11px]">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>Level {levelInfo.level} Progress</span>
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-primary">
                <span>{userXp} XP</span>
                <span className="text-on-surface-variant font-normal text-[10px]">
                  ({levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} to Lv.{levelInfo.level + 1})
                </span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-primary to-primary transition-all duration-500"
                style={{ width: `${levelInfo.percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-medium text-on-surface-variant">
              <span>+10 XP per habit check-off</span>
              <span>+50 XP per goal step</span>
            </div>
          </div>
        </div>

        {/* Core Stats 4-Grid Strip */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-black font-mono tabular-nums">{userXp}</span>
            </div>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block mt-0.5">
              Total XP
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-500">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-black font-mono tabular-nums">{highestStreak}d</span>
            </div>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block mt-0.5">
              Record
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-center">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Repeat className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-xs font-black font-mono tabular-nums">{totalHabitCheckins}</span>
            </div>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block mt-0.5">
              Habits
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-500">
              <Shield className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-black font-mono tabular-nums">{profile.streakShields ?? 2}</span>
            </div>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block mt-0.5">
              Shields
            </span>
          </div>
        </div>

        {/* SEGMENTED TAB SWITCH: Achievements | Recent Completed | Ongoing Habits */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-surface-container border border-outline-variant/30 shadow-inner gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('achievements');
              sound.playPop();
              triggerHaptic('light');
            }}
            className={`py-2 px-1 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Trophies ({unlockedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('recent');
              sound.playPop();
              triggerHaptic('light');
            }}
            className={`py-2 px-1 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'recent'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({recentCompletions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ongoing');
              sound.playPop();
              triggerHaptic('light');
            }}
            className={`py-2 px-1 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'ongoing'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Ongoing ({habits.length})</span>
          </button>
        </div>

        {/* TAB CONTENT: 1. ACHIEVEMENTS & TROPHIES */}
        {activeTab === 'achievements' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Unlockable Trophies ({unlockedCount}/{achievements.length})
              </span>
              <span className="text-[11px] text-amber-500 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Earn Bonus XP</span>
              </span>
            </div>

            <div className="space-y-2">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    ach.isUnlocked
                      ? 'bg-gradient-to-r from-amber-500/10 via-surface-container to-surface-container-low border-amber-500/30'
                      : 'bg-surface-container-low border-outline-variant/30 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                        ach.isUnlocked
                          ? 'bg-amber-500/20 border-amber-500/40 shadow-xs'
                          : 'bg-surface-container-high border-outline-variant/30 grayscale'
                      }`}
                    >
                      {ach.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-on-surface truncate">
                          {ach.title}
                        </h4>
                        {ach.isUnlocked ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-black text-[10px] shrink-0 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                            +{ach.xpReward} XP
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                        {ach.description}
                      </p>

                      {/* Progress Bar for Locked */}
                      {!ach.isUnlocked && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-medium text-on-surface-variant">
                            <span>Progress</span>
                            <span className="font-mono">{ach.progressText}</span>
                          </div>
                          <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${ach.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: 2. RECENT HABITS COMPLETED (HISTORY AUDIT LOG) */}
        {activeTab === 'recent' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Completion History ({recentCompletions.length})
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Latest check-ins
              </span>
            </div>

            {recentCompletions.length === 0 ? (
              <div className="text-center py-10 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6 space-y-2">
                <Clock className="w-8 h-8 text-on-surface-variant mx-auto opacity-50" />
                <h4 className="text-sm font-bold text-on-surface">No Completed Habits Yet</h4>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                  Complete your first daily habit to start building your streak history and earn +10 XP.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentCompletions.slice(0, 25).map((comp, idx) => (
                  <div
                    key={`${comp.habitId}-${comp.dateStr}-${idx}`}
                    className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${comp.habitColor}15`, color: comp.habitColor }}
                      >
                        <GoalIcon iconId={comp.habitIcon} className="w-4 h-4" color={comp.habitColor} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-on-surface block truncate">
                          {comp.habitTitle}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                          <span className="capitalize">{comp.category}</span>
                          <span>·</span>
                          <span className="capitalize">{comp.timeOfDay}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface border border-outline-variant/20 text-on-surface">
                        {formatRecentDate(comp.dateStr)}
                      </span>
                      <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        +10 XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 3. ONGOING HABITS WITH LIVE STATS */}
        {activeTab === 'ongoing' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Active Habits ({habits.length})
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Tap checkbox to toggle today
              </span>
            </div>

            {habits.length === 0 ? (
              <div className="text-center py-10 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6 space-y-3">
                <Repeat className="w-8 h-8 text-on-surface-variant mx-auto opacity-50" />
                <h4 className="text-sm font-bold text-on-surface">No Habits Active</h4>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                  Load starter habits or create a new habit to start your streak.
                </p>
                {onRestoreStarterHabits && (
                  <button
                    type="button"
                    onClick={onRestoreStarterHabits}
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Load Starter Daily Habits</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {habits.map((habit) => {
                  const isDoneToday = (habit.completedDates || []).includes(todayStr);

                  return (
                    <div
                      key={habit.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isDoneToday
                          ? 'bg-surface-container-low/70 border-primary/30'
                          : 'bg-surface-container-low border-outline-variant/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onToggleHabit(habit.id)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer active:scale-90 ${
                            isDoneToday
                              ? 'border-transparent text-white shadow-xs'
                              : 'border-outline-variant/50 hover:border-primary text-transparent bg-surface'
                          }`}
                          style={isDoneToday ? { backgroundColor: habit.color } : undefined}
                          title={isDoneToday ? 'Completed today' : 'Tap to complete today'}
                        >
                          <Check
                            className={`w-4 h-4 stroke-[3] transition-transform ${
                              isDoneToday ? 'scale-100 text-white' : 'scale-0'
                            }`}
                          />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-sm font-bold truncate ${
                                isDoneToday ? 'line-through text-on-surface-variant' : 'text-on-surface'
                              }`}
                            >
                              {habit.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold tabular-nums ${
                                habit.streakDays > 0
                                  ? 'bg-orange-500/15 text-orange-500 border border-orange-500/30'
                                  : 'bg-surface text-on-surface-variant border border-outline-variant/20'
                              }`}
                            >
                              <Flame className="w-2.5 h-2.5 fill-current" />
                              <span>{habit.streakDays}d streak</span>
                            </span>

                            <span className="text-on-surface-variant font-medium">
                              Best: {habit.bestStreak}d
                            </span>

                            <span className="capitalize px-1.5 py-0.5 rounded bg-surface text-on-surface-variant border border-outline-variant/20">
                              {habit.timeOfDay}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                              isDoneToday
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                : 'bg-surface text-on-surface-variant border border-outline-variant/20'
                            }`}
                          >
                            {isDoneToday ? 'Done Today' : 'Due Today'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Restore Recommended Habits Prompt if any were deleted */}
        {onRestoreStarterHabits && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onRestoreStarterHabits}
              className="w-full py-2.5 px-3 rounded-2xl bg-surface-container border border-dashed border-outline-variant/40 text-on-surface-variant hover:text-on-surface font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              <Repeat className="w-3.5 h-3.5 text-primary" />
              <span>Restore Recommended Starter Daily Habits</span>
            </button>
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL DRAWER */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-md bg-surface border-t border-outline-variant/30 rounded-t-3xl p-5 space-y-4 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-on-surface">Edit Profile Details</h3>
                <p className="text-xs text-on-surface-variant">Update your achiever identity</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              {/* Avatar Selector in Edit modal */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatarId={profile.avatarId}
                    avatarUrl={profile.avatarUrl}
                    fallbackText={editName || profile.name}
                    size="sm"
                  />
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Profile Avatar</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">Customize your achiever portrait</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm font-semibold focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-1">
                    Custom Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Habit Titan"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">
                  Personal Motto / Mantra
                </label>
                <textarea
                  value={editMotto}
                  onChange={(e) => setEditMotto(e.target.value)}
                  placeholder="What drives your daily consistency?"
                  rows={2}
                  className="w-full p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-medium focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface font-bold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-xs active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AVATAR PICKER MODAL */}
      {isAvatarModalOpen && (
        <AvatarPickerModal
          currentAvatarId={profile.avatarId}
          onSelectAvatar={(avatarId) => {
            onUpdateProfile({ avatarId });
          }}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}
    </div>
  );
};
