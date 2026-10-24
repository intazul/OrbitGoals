export type GoalCategory = 'creator' | 'finance' | 'fitness' | 'learning' | 'wellness' | 'career' | (string & {});

export type GoalFrequency = 'daily' | 'weekly' | 'monthly' | 'long_term';

export type GoalDifficulty = 'easy' | 'medium' | 'hard';

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

export interface SecurityConfig {
  enabled: boolean;
  pin: string;
  biometricEnabled: boolean;
}

export interface UserProfile {
  name: string;
  age: number | null;
  onboarded: boolean;
  avatarId?: string;
  avatarBaseImage?: string;
  title?: string;
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
  streakShields?: number;
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
}
