import React, { useState } from 'react';
import { UserProfile, Habit, Goal, Trophy } from '../types';
import {
  calculateLevelProgress,
  getRankInfo,
  calculateStreak,
  getTrophies,
  TIER_CONFIG,
  calculateLevel,
  MAX_LEVEL,
} from '../utils/gamification';
import { sound, triggerHaptic } from '../utils/sound';
import { GoalIcon } from './GoalIcon';
import {
  ArrowLeft,
  Flame,
  Zap,
  Sparkles,
  Trophy as TrophyIcon,
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
  Gift,
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
  const [editName, setEditName] = useState(profile.name || '');
  const [editAge, setEditAge] = useState(profile.age ? String(profile.age) : '');
  const [editTitle, setEditTitle] = useState(profile.title || 'Novice Achiever');
  const [editMotto, setEditMotto] = useState(
    profile.motto || 'Consistency turns small steps into unstoppable momentum.'
  );
  const [copiedToast, setCopiedToast] = useState(false);
  const [claimToast, setClaimToast] = useState<{ title: string; xp: number } | null>(null);
  const [trophyCategory, setTrophyCategory] = useState<string>('all');
  const [showClaimableOnly, setShowClaimableOnly] = useState(false);

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

  // Generate dynamic trophies
  const allTrophies = getTrophies({
    habits,
    goals,
    profile,
    claimedIds: profile.claimedTrophyIds || [],
  });

  const unlockedCount = allTrophies.filter((t) => t.unlocked).length;
  const claimableCount = allTrophies.filter((t) => t.unlocked && !t.claimed).length;

  const handleClaimTrophy = (trophy: Trophy) => {
    if (!trophy.unlocked || trophy.claimed) return;
    const currentClaimed = profile.claimedTrophyIds || [];
    if (currentClaimed.includes(trophy.id)) return;

    const newClaimed = [...currentClaimed, trophy.id];
    const newXp = (profile.xp || 0) + trophy.xpReward;
    const newLevel = calculateLevel(newXp);
    const oldLevel = profile.level || 1;

    if (newLevel > oldLevel) {
      sound.playLevelUp();
    } else {
      sound.playSuccessChime();
    }
    triggerHaptic('success');

    onUpdateProfile({
      claimedTrophyIds: newClaimed,
      xp: newXp,
      level: newLevel,
      title: getRankInfo(newLevel).title,
    });

    setClaimToast({ title: trophy.title, xp: trophy.xpReward });
    setTimeout(() => setClaimToast(null), 3000);
  };

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
    const text = `🌟 OrbitGoals Profile Summary\n👤 ${profile.name || 'Achiever'} (${rankInfo.title})\n⚡ Level ${levelInfo.level} · ${userXp.toLocaleString()} XP\n🔥 Best Habit Streak: ${highestStreak} days\n🏆 Trophies: ${unlockedCount}/${allTrophies.length} Unlocked\n✅ Total Habit Check-ins: ${totalHabitCheckins}`;
    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    sound.playPop();
    triggerHaptic('light');
    setTimeout(() => setCopiedToast(false), 2500);
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
            title="Go back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[19px] font-black tracking-tight text-on-surface leading-tight">
              Player Profile & Trophies
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium">
              1,000 Levels, Trophies, XP Scaling & Rank Mastery
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

      {/* Claim Toast / Celebration */}
      {claimToast && (
        <div className="px-4 pt-2">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-primary text-black font-black text-xs flex items-center justify-between shadow-lg animate-fade-in border border-amber-300">
            <span className="flex items-center gap-1.5">
              <Gift className="w-4 h-4 animate-bounce" />
              <span>Trophy Claimed: {claimToast.title}!</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
              +{claimToast.xp} XP
            </span>
          </div>
        </div>
      )}

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
            {/* User Profile Monogram Badge */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-md border-2 border-surface">
                {profile.name ? profile.name.trim().charAt(0).toUpperCase() : 'G'}
              </div>
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
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-500/25 px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1">
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

          {/* XP PROGRESS BAR (1,000 Levels Ascent) */}
          <div className="pt-2 border-t border-outline-variant/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface flex items-center gap-1 text-[11px]">
                <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-current" />
                <span>Level {levelInfo.level} / {MAX_LEVEL}</span>
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-primary">
                <span>{userXp.toLocaleString()} XP</span>
                <span className="text-on-surface-variant font-normal text-[10px]">
                  {levelInfo.isMaxLevel
                    ? '(Max Level Pinnacle!)'
                    : `(${levelInfo.currentLevelXp.toLocaleString()}/${levelInfo.nextLevelXp.toLocaleString()} to Lv.${levelInfo.level + 1})`}
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
              <span>{levelInfo.isMaxLevel ? 'Ultimate Legend' : `${levelInfo.xpToNextLevel.toLocaleString()} XP to next level`}</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">Scaling Curve Active</span>
            </div>
          </div>
        </div>

        {/* Core Stats 4-Grid Strip */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-black font-mono tabular-nums">{userXp.toLocaleString()}</span>
            </div>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block mt-0.5">
              Total XP
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
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
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
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
            <TrophyIcon className="w-3.5 h-3.5" />
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

        {/* TAB CONTENT: 1. ACHIEVEMENTS & TROPHIES GALLERY */}
        {activeTab === 'achievements' && (
          <div className="space-y-3">
            {/* Trophies Header & Claimable alert */}
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  <TrophyIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Trophies ({unlockedCount}/{allTrophies.length})</span>
                </span>
                <p className="text-[10px] text-on-surface-variant font-medium">
                  {claimableCount > 0 ? `🎉 ${claimableCount} trophies ready to claim!` : 'Unlock trophies across habits, streaks & levels'}
                </p>
              </div>

              {claimableCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClaimableOnly(!showClaimableOnly)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                    showClaimableOnly
                      ? 'bg-amber-500 text-black border border-amber-300 animate-pulse'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <Gift className="w-3 h-3" />
                  <span>{claimableCount} Claimable</span>
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: `All (${allTrophies.length})` },
                { id: 'streaks', label: '🔥 Streaks' },
                { id: 'sets', label: '⚡ Sets' },
                { id: 'goals', label: '🎯 Goals' },
                { id: 'levels', label: '👑 Levels' },
                { id: 'creator', label: '🎬 Creator' },
                { id: 'special', label: '✨ Special' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setTrophyCategory(cat.id);
                    sound.playPop();
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                    trophyCategory === cat.id
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Trophies Grid / List */}
            <div className="space-y-2">
              {allTrophies
                .filter((t) => {
                  if (showClaimableOnly && (!t.unlocked || t.claimed)) return false;
                  if (trophyCategory === 'all') return true;
                  return t.category === trophyCategory;
                })
                .map((trophy) => {
                  const tierStyle = TIER_CONFIG[trophy.tier] || TIER_CONFIG.bronze;
                  const canClaim = trophy.unlocked && !trophy.claimed;
                  const pct = Math.min(100, Math.round((trophy.currentProgress / trophy.maxProgress) * 100));

                  return (
                    <div
                      key={trophy.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        trophy.claimed
                          ? 'bg-surface-container/70 border-outline-variant/30'
                          : canClaim
                          ? 'bg-gradient-to-r from-amber-500/15 via-surface-container to-primary/10 border-amber-400/60 shadow-md ring-1 ring-amber-400/30'
                          : 'bg-surface-container-low border-outline-variant/30 opacity-80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Trophy Icon */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
                            canClaim
                              ? 'bg-gradient-to-tr from-amber-500/30 to-yellow-400/20 border-amber-400 shadow-sm animate-bounce-short'
                              : trophy.unlocked
                              ? 'bg-surface-container-high border-outline-variant/40'
                              : 'bg-surface-container-low border-outline-variant/20 grayscale opacity-60'
                          }`}
                        >
                          {trophy.badge}
                        </div>

                        {/* Trophy Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="text-sm font-black text-on-surface truncate">
                                {trophy.title}
                              </h4>
                              {/* Tier Badge */}
                              <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                                {tierStyle.label}
                              </span>
                            </div>

                            {/* Status or Claim Button */}
                            {canClaim ? (
                              <button
                                type="button"
                                onClick={() => handleClaimTrophy(trophy)}
                                className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs flex items-center gap-1 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>CLAIM +{trophy.xpReward} XP</span>
                              </button>
                            ) : trophy.claimed ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Claimed (+{trophy.xpReward} XP)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                +{trophy.xpReward} XP
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                            {trophy.description}
                          </p>

                          {/* Progress Bar */}
                          {!trophy.claimed && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-medium text-on-surface-variant">
                                <span>{canClaim ? 'Ready to claim!' : 'Progress'}</span>
                                <span className="font-mono tabular-nums">
                                  {trophy.currentProgress.toLocaleString()} / {trophy.maxProgress.toLocaleString()} ({pct}%)
                                </span>
                              </div>
                              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    canClaim
                                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                                      : 'bg-primary'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-500/25 px-1.5 py-0.5 rounded">
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

    </div>
  );
};
