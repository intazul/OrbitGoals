export type GoalCategory = 'creator' | 'finance' | 'fitness' | 'learning' | 'wellness' | 'career' | (string & {});

export type GoalFrequency = 'daily' | 'weekly' | 'monthly' | 'long_term';

export type GoalDifficulty = 'easy' | 'medium' | 'hard';

export type HabitTimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  timeOfDay: HabitTimeOfDay;
  frequency: HabitFrequency;
  frequencyDays?: string[];
  icon: string;
  color: string;
  streakDays: number;
  bestStreak: number;
  completedDates: string[]; // ISO 'YYYY-MM-DD'
  reminderTime?: string;
  createdAt: string;
  archived?: boolean;
  // --- Sets & Target Features ---
  trackingType?: 'simple' | 'sets'; // 'simple' = single check, 'sets' = set-based target
  targetValue?: number; // e.g. 30 reps, 1 video, 20 mins
  unit?: string; // e.g. "reps", "mins", "videos", "pages", "sets"
  stepValue?: number; // size of each set (e.g. 5, 10, 1), user editable
  xpPerSet?: number; // XP gained per set (e.g. 10 XP per set, 50 XP for YouTube video)
  todayProgress?: number; // current count for today (can exceed target!)
  progressHistory?: { [dateStr: string]: number }; // date -> numeric progress
  // --- Goal Linking ---
  linkedGoalId?: string; // ID of the Goal this habit connects to
  linkedGoalTitle?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g. "videos", "$", "mins", "reps", "steps", "pages"
  frequency: GoalFrequency;
  frequencyDays?: string[]; // e.g. ['Mon', 'Wed', 'Fri']
  deadline?: string;
  streakDays?: number;
  bestStreak?: number;
  color: string;
  icon: string;
  priority: 'high' | 'medium' | 'normal';
  difficulty: GoalDifficulty;
  xpReward: number;
  completedDates: string[]; // ['2026-10-22', '2026-10-21']
  history: { date: string; value: number }[];
  subtasks: SubTask[];
  notes: string;
  linkedPlatform?: 'youtube' | 'instagram' | 'facebook';
  linkedHabitId?: string;
  reminderTime?: string;
  createdAt: string;
}

export interface AvatarItem {
  id: string;
  name: string;
  type: 'hat' | 'outfit' | 'aura' | 'badge' | 'companion';
  unlockRequirement: string;
  unlockLevel: number;
  unlockStreak?: number;
  unlocked: boolean;
  iconEmoji: string;
  assetUrl?: string;
  styleClass?: string;
}

export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'mythic' | 'cosmic';

export interface Trophy {
  id: string;
  title: string;
  description: string;
  category: 'streaks' | 'sets' | 'goals' | 'levels' | 'creator' | 'special';
  tier: TrophyTier;
  badge: string;
  xpReward: number;
  currentProgress: number;
  maxProgress: number;
  unlocked: boolean;
  claimed: boolean;
}

export interface SecurityConfig {
  enabled: boolean;
  pin: string;
  biometricEnabled: boolean;
  autoLockMinutes: number; // 0 = Immediately, 1 = 1 min, 5 = 5 min, 15 = 15 min, -1 = Never / Manual
  lastActiveTimestamp?: number;
}

export interface UserProfile {
  name: string;
  age: number | null;
  onboarded: boolean;
  avatarId?: string;
  avatarUrl?: string;
  avatarBaseImage?: string;
  title?: string;
  motto?: string;
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
  streakShields?: number;
  claimedTrophyIds?: string[];
  totalSetsCompleted?: number;
  equippedItems?: {
    hat: string;
    outfit: string;
    aura: string;
    badge: string;
    companion: string;
  };
  socialSync?: {
    youtube?: {
      connected: boolean;
      channelName: string;
      handle: string;
      subscribers: number;
      videosCount: number;
      targetVideos: number;
      lastSynced: string;
    };
    instagram?: {
      connected: boolean;
      handle: string;
      followers: number;
      reelsCount: number;
      lastSynced: string;
    };
    facebook?: {
      connected: boolean;
      pageName: string;
      followers: number;
      postsCount: number;
      lastSynced: string;
    };
  };
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  participantsCount: number;
  durationDays: number;
  progressPct: number;
  userJoined: boolean;
  rewardXP: number;
  rewardBadge: string;
  leaderboard: { rank: number; name: string; avatar: string; score: string }[];
}

export type CapsuleCategory = 'milestone' | 'goal' | 'streak' | 'level' | 'win';

export interface TimeCapsule {
  id: string;
  title: string;
  date: string; // ISO 'YYYY-MM-DD'
  reflection: string;
  category: CapsuleCategory;
  photoUrl?: string; // Base64 image data URL
  sticker?: string; // Emoji sticker e.g. '🚀', '🏆', '💎'
  tag?: string;
  linkedGoalTitle?: string;
  linkedHabitTitle?: string;
  xpBonus: number;
  createdAt: string;
}

export interface DailyReflection {
  date: string;
  mood: 'great' | 'good' | 'neutral' | 'tough';
  notes: string;
  highlight: string;
  energyLevel: number; // 1-5
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  lowPowerMode: boolean;
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  streakSaverTime: string;
  currency: string;
  fastTapMode: boolean;
  goalXpPerStep?: number; // Configurable XP per goal step
  habitXpPerSet?: number; // Configurable XP per habit set
}
