import { Trophy, TrophyTier, Habit, Goal, UserProfile } from '../types';

export const XP_PER_HABIT = 8;
export const XP_PER_GOAL_STEP = 15;

/**
 * Boundless Escalating XP Curve:
 * With each increase in level, the XP required to reach the next level increases progressively.
 * Level 1 -> 2: 100 XP
 * Level 2 -> 3: 161 XP (+61 more)
 * Level 3 -> 4: 247 XP (+86 more)
 * Level 4 -> 5: 351 XP (+104 more)
 * Level 5 -> 6: 470 XP (+119 more)
 * Level 10 -> 11: 1,280 XP
 * Level 20 -> 21: 4,050 XP
 * Level 50 -> 51: 19,300 XP
 * Level 100 -> 101: 64,500 XP
 * Level 500 -> 501: 1,020,000 XP
 * Infinite progression without any 1000 level limitation!
 */
export function getXpRequiredForLevel(level: number): number {
  if (level <= 0) return 100;
  const l = Math.max(0, level - 1);
  return Math.round(100 + 45 * l + 16 * Math.pow(l, 1.72));
}

// Dynamic Cumulative XP Cache (grows on demand, no fixed 1000 ceiling)
const CUMULATIVE_XP_CACHE: number[] = [0, 0]; // Index 1 is Lv 1 (0 XP needed)

export function getCumulativeXpForLevel(targetLevel: number): number {
  if (targetLevel <= 1) return 0;
  while (CUMULATIVE_XP_CACHE.length <= targetLevel) {
    const lvl = CUMULATIVE_XP_CACHE.length - 1;
    const nextTotal = CUMULATIVE_XP_CACHE[lvl] + getXpRequiredForLevel(lvl);
    CUMULATIVE_XP_CACHE.push(nextTotal);
  }
  return CUMULATIVE_XP_CACHE[targetLevel];
}

export const RANK_TITLES: { minLevel: number; title: string; badge: string; color: string }[] = [
  { minLevel: 5000, title: 'Infinite Primordial Reality', badge: '🪐', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 3000, title: 'Cosmic Singularity Master', badge: '🌌', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 2000, title: 'Astral Demiurge', badge: '💫', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 1500, title: 'Eternal Nexus Sovereign', badge: '⚡', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 1000, title: 'Omnipotent Sovereign', badge: '🏆', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 950, title: 'Cosmic Singularity', badge: '🌌', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 900, title: 'Omniscient Overlord', badge: '👑', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 850, title: 'Universal Arbiter', badge: '🔱', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 800, title: 'Infinite Primordial', badge: '🌀', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 750, title: 'Eternal Ascendant', badge: '⚡', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 700, title: 'Pantheon Emperor', badge: '🏛️', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 650, title: 'Galaxy Forger', badge: '🪐', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 600, title: 'Solar Deity', badge: '☀️', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 550, title: 'Supernova Titan', badge: '🌟', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 500, title: 'Cosmic Architect', badge: '🪐', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 450, title: 'Reality Weaver', badge: '🧬', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 400, title: 'Nebula Voyager', badge: '🌌', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 350, title: 'Astral Chronomancer', badge: '💫', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 300, title: 'Dragon Sovereign', badge: '🐉', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 250, title: 'Infernal Titan', badge: '🌋', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 200, title: 'Arcane Conqueror', badge: '🔮', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 175, title: 'Divine Luminary', badge: '⚜️', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 150, title: 'Aegis Guardian', badge: '🛡️', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 125, title: 'Eclipse Warden', badge: '🌙', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 100, title: 'Stellar Paragon', badge: '🌟', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 75, title: 'Diamond Strategist', badge: '💎', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 50, title: 'Grandmaster Vanguard', badge: '👑', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 40, title: 'Skyward Ascendant', badge: '🦅', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 30, title: 'Apex Gladiator', badge: '⚔️', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 25, title: 'Discipline Champion', badge: '🛡️', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 20, title: 'Lightning Prodigy', badge: '⚡', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 15, title: 'Vanguard Achiever', badge: '🔱', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 10, title: 'Focus Master', badge: '⚔️', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 7, title: 'Goal Striker', badge: '🎯', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 5, title: 'Consistency Prodigy', badge: '⚡', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 3, title: 'Habit Apprentice', badge: '🔥', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 2, title: 'Momentum Builder', badge: '🚀', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
  { minLevel: 1, title: 'Novice Achiever', badge: '🌱', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' },
];

export function getRankInfo(level: number): { title: string; badge: string; color: string } {
  const match = RANK_TITLES.find((r) => level >= r.minLevel);
  return match || { title: 'Novice Achiever', badge: '🌱', color: 'from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500' };
}

/**
 * Calculates current level dynamically using the boundless escalating XP curve.
 */
export function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) return 1;

  let level = 1;
  while (true) {
    const nextCumulative = getCumulativeXpForLevel(level + 1);
    if (totalXp < nextCumulative) {
      return level;
    }
    level += 1;
    // Safety guard
    if (level > 100000) return level;
  }
}

export function calculateLevelProgress(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  percent: number;
  totalXp: number;
  xpToNextLevel: number;
  isMaxLevel: boolean;
} {
  const safeXp = Math.max(0, totalXp);
  const level = calculateLevel(safeXp);
  const baseForCurrent = getCumulativeXpForLevel(level);
  const requiredForNext = getXpRequiredForLevel(level);
  const currentLevelXp = Math.max(0, safeXp - baseForCurrent);
  const percent = Math.min(100, Math.max(0, Math.round((currentLevelXp / requiredForNext) * 100)));
  const xpToNextLevel = Math.max(0, requiredForNext - currentLevelXp);

  return {
    level,
    currentLevelXp,
    nextLevelXp: requiredForNext,
    percent,
    totalXp: safeXp,
    xpToNextLevel,
    isMaxLevel: false, // Boundless progression - no 1000 ceiling!
  };
}


/**
 * Calculates current streak (consecutive days) counting backwards from today or yesterday.
 */
export function calculateStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0;

  const dateSet = new Set(completedDates);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If neither today nor yesterday is completed, the streak has lapsed
  if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
    return 0;
  }

  // Count backwards from starting day (today if completed, otherwise yesterday)
  let checkDate = dateSet.has(todayStr) ? new Date(today) : new Date(yesterday);
  let streak = 0;

  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(checkStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Returns the current week's 7 days (Monday to Sunday)
 */
export function getCurrentWeekDays(): {
  dateStr: string;
  dayLetter: string;
  dayNum: number;
  isToday: boolean;
}[] {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);

  const days = [];
  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayStr = now.toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    days.push({
      dateStr,
      dayLetter: dayLetters[i],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

/**
 * Tier styling helper
 */
export const TIER_CONFIG: Record<
  TrophyTier,
  { label: string; bg: string; text: string; border: string; glow: string; icon: string }
> = {
  bronze: {
    label: 'Bronze',
    bg: 'bg-surface-container',
    text: 'text-on-surface-variant',
    border: 'border-outline-variant/40',
    glow: 'shadow-xs',
    icon: '🥉',
  },
  silver: {
    label: 'Silver',
    bg: 'bg-surface-container-high',
    text: 'text-on-surface',
    border: 'border-outline-variant/50',
    glow: 'shadow-xs',
    icon: '🥈',
  },
  gold: {
    label: 'Gold',
    bg: 'bg-surface-container-high',
    text: 'text-on-surface',
    border: 'border-on-surface/40',
    glow: 'shadow-xs',
    icon: '🥇',
  },
  platinum: {
    label: 'Platinum',
    bg: 'bg-surface-container-high',
    text: 'text-on-surface',
    border: 'border-on-surface/50',
    glow: 'shadow-sm',
    icon: '💠',
  },
  diamond: {
    label: 'Diamond',
    bg: 'bg-primary text-on-primary',
    text: 'text-on-primary',
    border: 'border-primary',
    glow: 'shadow-sm',
    icon: '💎',
  },
  mythic: {
    label: 'Mythic',
    bg: 'bg-primary text-on-primary',
    text: 'text-on-primary',
    border: 'border-primary',
    glow: 'shadow-md',
    icon: '🔮',
  },
  cosmic: {
    label: 'Cosmic Legend',
    bg: 'bg-primary text-on-primary',
    text: 'text-on-primary font-black',
    border: 'border-primary',
    glow: 'shadow-md',
    icon: '👑',
  },
};

/**
 * Generate comprehensive Trophies and Achievements catalog evaluated dynamically
 */
export function getTrophies(params: {
  habits: Habit[];
  goals: Goal[];
  profile: UserProfile;
  claimedIds?: string[];
}): Trophy[] {
  const { habits, goals, profile, claimedIds = [] } = params;
  const claimedSet = new Set(claimedIds);

  const highestStreak = habits.reduce((max, h) => Math.max(max, h.streakDays || 0, h.bestStreak || 0), 0);
  const totalHabitCheckins = habits.reduce((acc, h) => acc + (h.completedDates?.length || 0), 0);
  const totalCompletedGoals = goals.filter((g) => (g.currentValue || 0) >= (g.targetValue || 1)).length;
  const totalGoalSteps = goals.reduce((acc, g) => acc + (g.currentValue || 0), 0);

  // Sum total sets logged across all habits
  let totalSets = 0;
  habits.forEach((h) => {
    if (h.progressHistory) {
      Object.values(h.progressHistory).forEach((val) => {
        if (typeof val === 'number') {
          const step = h.stepValue || 10;
          totalSets += Math.floor(val / step);
        }
      });
    }
  });
  if (typeof profile.totalSetsCompleted === 'number') {
    totalSets = Math.max(totalSets, profile.totalSetsCompleted);
  }

  // Count creator uploads (YouTube, videos, reels, posts)
  const creatorGoals = goals.filter(
    (g) => g.category === 'creator' || g.unit === 'videos' || g.unit === 'reels' || g.icon === 'youtube'
  );
  const totalVideosUploaded = creatorGoals.reduce((sum, g) => sum + (g.currentValue || 0), 0);

  const levelInfo = calculateLevelProgress(profile.xp || 0);
  const userLevel = levelInfo.level;

  const catalog: Omit<Trophy, 'claimed' | 'unlocked'>[] = [
    // --- STREAKS DOMINANCE ---
    {
      id: 'streak-3',
      title: 'Flame Starter',
      description: 'Achieve a 3-day consecutive habit streak',
      category: 'streaks',
      tier: 'bronze',
      badge: '🔥',
      xpReward: 100,
      currentProgress: Math.min(3, highestStreak),
      maxProgress: 3,
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintain an unbroken 7-day habit streak',
      category: 'streaks',
      tier: 'silver',
      badge: '⚡',
      xpReward: 250,
      currentProgress: Math.min(7, highestStreak),
      maxProgress: 7,
    },
    {
      id: 'streak-14',
      title: 'Iron Discipline',
      description: 'Build a two-week 14-day unbreakable streak',
      category: 'streaks',
      tier: 'gold',
      badge: '🛡️',
      xpReward: 500,
      currentProgress: Math.min(14, highestStreak),
      maxProgress: 14,
    },
    {
      id: 'streak-30',
      title: 'Monthly Habit Icon',
      description: 'Dominate 30 consecutive days of daily focus',
      category: 'streaks',
      tier: 'platinum',
      badge: '💫',
      xpReward: 1200,
      currentProgress: Math.min(30, highestStreak),
      maxProgress: 30,
    },
    {
      id: 'streak-60',
      title: 'Diamond Resolve',
      description: 'Forge an incredible 60-day unstoppable streak',
      category: 'streaks',
      tier: 'diamond',
      badge: '💎',
      xpReward: 3000,
      currentProgress: Math.min(60, highestStreak),
      maxProgress: 60,
    },
    {
      id: 'streak-100',
      title: 'Centurion Master',
      description: 'Legendary 100-day continuous streak milestone',
      category: 'streaks',
      tier: 'mythic',
      badge: '🏛️',
      xpReward: 7500,
      currentProgress: Math.min(100, highestStreak),
      maxProgress: 100,
    },
    {
      id: 'streak-365',
      title: 'Solar Year Immortal',
      description: 'Ascend to godhood with 365 days of unbroken consistency',
      category: 'streaks',
      tier: 'cosmic',
      badge: '👑',
      xpReward: 25000,
      currentProgress: Math.min(365, highestStreak),
      maxProgress: 365,
    },

    // --- REPS & SETS CONQUEROR ---
    {
      id: 'sets-1',
      title: 'First Rep Set',
      description: 'Log your first set of 5 or 10 reps in any habit',
      category: 'sets',
      tier: 'bronze',
      badge: '🌱',
      xpReward: 50,
      currentProgress: Math.min(1, totalSets),
      maxProgress: 1,
    },
    {
      id: 'sets-25',
      title: 'Rep Vanguard',
      description: 'Complete 25 total sets across exercise & daily habits',
      category: 'sets',
      tier: 'silver',
      badge: '💪',
      xpReward: 300,
      currentProgress: Math.min(25, totalSets),
      maxProgress: 25,
    },
    {
      id: 'sets-100',
      title: 'Century Setter',
      description: 'Complete 100 sets of target-based habit increments',
      category: 'sets',
      tier: 'gold',
      badge: '⚡',
      xpReward: 1000,
      currentProgress: Math.min(100, totalSets),
      maxProgress: 100,
    },
    {
      id: 'sets-500',
      title: 'Rep Beast Machine',
      description: 'Smash through 500 lifetime habit sets',
      category: 'sets',
      tier: 'diamond',
      badge: '🌋',
      xpReward: 4000,
      currentProgress: Math.min(500, totalSets),
      maxProgress: 500,
    },
    {
      id: 'sets-2000',
      title: 'Titan of Movement',
      description: 'Log over 2,000 lifetime sets across all habits',
      category: 'sets',
      tier: 'cosmic',
      badge: '🔱',
      xpReward: 15000,
      currentProgress: Math.min(2000, totalSets),
      maxProgress: 2000,
    },

    // --- GOALS SMASHER ---
    {
      id: 'goals-step-5',
      title: 'Objective Pioneer',
      description: 'Log 5 goal increment steps (+50 XP per step)',
      category: 'goals',
      tier: 'bronze',
      badge: '🎯',
      xpReward: 150,
      currentProgress: Math.min(5, totalGoalSteps),
      maxProgress: 5,
    },
    {
      id: 'goals-1-done',
      title: 'Goal Crusher',
      description: 'Reach 100% completion on your first goal',
      category: 'goals',
      tier: 'silver',
      badge: '🏆',
      xpReward: 400,
      currentProgress: Math.min(1, totalCompletedGoals),
      maxProgress: 1,
    },
    {
      id: 'goals-5-done',
      title: 'Pentathlon Victor',
      description: 'Conquer and fully complete 5 major goals',
      category: 'goals',
      tier: 'gold',
      badge: '🎖️',
      xpReward: 1500,
      currentProgress: Math.min(5, totalCompletedGoals),
      maxProgress: 5,
    },
    {
      id: 'goals-15-done',
      title: 'Grand Goal Sovereign',
      description: 'Conquer and finish 15 complete goals across your life',
      category: 'goals',
      tier: 'diamond',
      badge: '🪐',
      xpReward: 6000,
      currentProgress: Math.min(15, totalCompletedGoals),
      maxProgress: 15,
    },

    // --- CREATOR & YOUTUBE ---
    {
      id: 'creator-1',
      title: 'YouTube Creator Seed',
      description: 'Upload your first YouTube video or short',
      category: 'creator',
      tier: 'bronze',
      badge: '🎬',
      xpReward: 200,
      currentProgress: Math.min(1, totalVideosUploaded),
      maxProgress: 1,
    },
    {
      id: 'creator-10',
      title: 'Consistent Content Maker',
      description: 'Upload 10 YouTube videos connected to your creator goals',
      category: 'creator',
      tier: 'gold',
      badge: '📹',
      xpReward: 1000,
      currentProgress: Math.min(10, totalVideosUploaded),
      maxProgress: 10,
    },
    {
      id: 'creator-50',
      title: 'Studio Veteran',
      description: 'Upload 50 videos and establish your audience empire',
      category: 'creator',
      tier: 'diamond',
      badge: '🌟',
      xpReward: 5000,
      currentProgress: Math.min(50, totalVideosUploaded),
      maxProgress: 50,
    },

    // --- LEVEL CLIMBER (UP TO LEVEL 1000) ---
    {
      id: 'level-5',
      title: 'Consistency Prodigy',
      description: 'Reach Level 5 in OrbitGoals',
      category: 'levels',
      tier: 'bronze',
      badge: '🌱',
      xpReward: 200,
      currentProgress: Math.min(5, userLevel),
      maxProgress: 5,
    },
    {
      id: 'level-10',
      title: 'Focus Master (Lv.10)',
      description: 'Climb through early levels to reach Level 10',
      category: 'levels',
      tier: 'silver',
      badge: '⚔️',
      xpReward: 500,
      currentProgress: Math.min(10, userLevel),
      maxProgress: 10,
    },
    {
      id: 'level-25',
      title: 'Discipline Champion (Lv.25)',
      description: 'Advance to Level 25 and master daily focus',
      category: 'levels',
      tier: 'gold',
      badge: '🛡️',
      xpReward: 1200,
      currentProgress: Math.min(25, userLevel),
      maxProgress: 25,
    },
    {
      id: 'level-50',
      title: 'Grandmaster Vanguard (Lv.50)',
      description: 'Reach Level 50 and earn the grandmaster status',
      category: 'levels',
      tier: 'platinum',
      badge: '👑',
      xpReward: 2500,
      currentProgress: Math.min(50, userLevel),
      maxProgress: 50,
    },
    {
      id: 'level-100',
      title: 'Century Paragon (Lv.100)',
      description: 'Surpass Level 100 in the 1,000-level ascent',
      category: 'levels',
      tier: 'diamond',
      badge: '💎',
      xpReward: 6000,
      currentProgress: Math.min(100, userLevel),
      maxProgress: 100,
    },
    {
      id: 'level-250',
      title: 'Infernal Titan (Lv.250)',
      description: 'Conquer a quarter of the grand mountain at Level 250',
      category: 'levels',
      tier: 'diamond',
      badge: '🌋',
      xpReward: 15000,
      currentProgress: Math.min(250, userLevel),
      maxProgress: 250,
    },
    {
      id: 'level-500',
      title: 'Cosmic Architect (Lv.500)',
      description: 'Reach Level 500 — Halfway to the celestial summit',
      category: 'levels',
      tier: 'mythic',
      badge: '🪐',
      xpReward: 35000,
      currentProgress: Math.min(500, userLevel),
      maxProgress: 500,
    },
    {
      id: 'level-750',
      title: 'Eternal Ascendant (Lv.750)',
      description: 'Reach Level 750 with unshakeable discipline',
      category: 'levels',
      tier: 'mythic',
      badge: '⚡',
      xpReward: 60000,
      currentProgress: Math.min(750, userLevel),
      maxProgress: 750,
    },
    {
      id: 'level-1000',
      title: 'Omnipotent Sovereign (Lv.1000)',
      description: 'Achieve the monumental Level 1000 milestone in your boundless ascension',
      category: 'levels',
      tier: 'cosmic',
      badge: '🏆',
      xpReward: 50000,
      currentProgress: Math.min(1000, userLevel),
      maxProgress: 1000,
    },

    // --- SPECIAL ACHIEVEMENTS ---
    {
      id: 'special-checkins-50',
      title: 'Habit Centurion',
      description: 'Log 50 total habit completions',
      category: 'special',
      tier: 'gold',
      badge: '✨',
      xpReward: 750,
      currentProgress: Math.min(50, totalHabitCheckins),
      maxProgress: 50,
    },
    {
      id: 'special-vault',
      title: 'Cyber Vault Guardian',
      description: 'Enable PIN Security & custom Auto-Lock in settings',
      category: 'special',
      tier: 'bronze',
      badge: '🔒',
      xpReward: 100,
      currentProgress: 1,
      maxProgress: 1,
    },
  ];

  return catalog.map((item) => {
    const unlocked = item.currentProgress >= item.maxProgress;
    const claimed = claimedSet.has(item.id);
    return {
      ...item,
      unlocked,
      claimed,
    };
  });
}
