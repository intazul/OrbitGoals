import { Goal, UserProfile, AvatarItem, CommunityChallenge, AppSettings, SecurityConfig } from '../types';

export const AVATAR_IMAGES = {
  creator: '/src/assets/images/avatar_creator_master_1792734990553.jpg',
  fitness: '/src/assets/images/avatar_fitness_champion_1792734990718.jpg',
  wealth: '/src/assets/images/avatar_wealth_builder_1792734991678.jpg',
  trophy: '/src/assets/images/trophy_milestone_streak_1792735062833.jpg',
};

// Generate realistic last 14 days dates
export function getRecentDates(days: number = 14): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export const INITIAL_GOALS: Goal[] = [];

export const DEFAULT_SECURITY: SecurityConfig = {
  enabled: true,
  pin: '0000',
  biometricEnabled: false,
};

export const INITIAL_USER_PROFILE: UserProfile = {
  name: '',
  age: null,
  onboarded: false,
  title: 'Goal Achiever',
};


export const AVATAR_CATALOG: AvatarItem[] = [
  // Hats & Headwear
  { id: 'item-headphones', name: 'Studio Monitor Cans', type: 'hat', unlockRequirement: 'Starter Creator Gear', unlockLevel: 1, unlocked: true, iconEmoji: '🎧' },
  { id: 'item-cap', name: 'Minimal Snapback', type: 'hat', unlockRequirement: 'Reach Level 2', unlockLevel: 2, unlocked: true, iconEmoji: '🧢' },
  { id: 'item-headband', name: 'Athletic Runner Band', type: 'hat', unlockRequirement: 'Reach Level 3', unlockLevel: 3, unlocked: true, iconEmoji: '🎗️' },
  { id: 'item-crown', name: 'Golden Champion Crown', type: 'hat', unlockRequirement: 'Reach Level 8', unlockLevel: 8, unlocked: false, iconEmoji: '👑' },
  { id: 'item-halo', name: 'Halo of Consistency', type: 'hat', unlockRequirement: '30-Day Total Streak', unlockLevel: 10, unlockStreak: 30, unlocked: false, iconEmoji: '✨' },

  // Outfits
  { id: 'item-hoodie', name: 'Creator Minimal Hoodie', type: 'outfit', unlockRequirement: 'Starter Outfit', unlockLevel: 1, unlocked: true, iconEmoji: '🧥' },
  { id: 'item-jersey', name: 'Pro Athletic Jersey', type: 'outfit', unlockRequirement: 'Reach Level 3', unlockLevel: 3, unlocked: true, iconEmoji: '🎽' },
  { id: 'item-blazer', name: 'Founder Tailored Blazer', type: 'outfit', unlockRequirement: 'Reach Level 5', unlockLevel: 5, unlocked: true, iconEmoji: '👔' },
  { id: 'item-armor', name: 'Cyber Titanium Weave', type: 'outfit', unlockRequirement: 'Reach Level 9', unlockLevel: 9, unlocked: false, iconEmoji: '🛡️' },

  // Auras
  { id: 'item-aura-slate', name: 'Calm Studio Mist', type: 'aura', unlockRequirement: 'Default Aura', unlockLevel: 1, unlocked: true, iconEmoji: '🌫️' },
  { id: 'item-aura-solar', name: 'Golden Solar Radiance', type: 'aura', unlockRequirement: 'Reach Level 4', unlockLevel: 4, unlocked: true, iconEmoji: '☀️', styleClass: 'ring-4 ring-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.5)]' },
  { id: 'item-aura-neon', name: 'Cyber Neon Pulse', type: 'aura', unlockRequirement: 'Reach Level 7', unlockLevel: 7, unlocked: false, iconEmoji: '⚡', styleClass: 'ring-4 ring-cyan-400/60 shadow-[0_0_30px_rgba(34,211,238,0.6)]' },
  { id: 'item-aura-flame', name: 'Blazing Streak Fire', type: 'aura', unlockRequirement: '21-Day Streak Milestone', unlockLevel: 6, unlockStreak: 21, unlocked: false, iconEmoji: '🔥', styleClass: 'ring-4 ring-orange-500/70 shadow-[0_0_30px_rgba(249,115,22,0.7)]' },

  // Badges
  { id: 'item-badge-first', name: 'First Spark Badge', type: 'badge', unlockRequirement: 'First completed habit', unlockLevel: 1, unlocked: true, iconEmoji: '🥉' },
  { id: 'item-badge-streak', name: 'Flame Centurion (14d)', type: 'badge', unlockRequirement: '14-Day Streak', unlockLevel: 4, unlocked: true, iconEmoji: '🔥' },
  { id: 'item-badge-creator', name: 'YouTube Silver Creator', type: 'badge', unlockRequirement: 'Upload 40+ Videos', unlockLevel: 5, unlocked: true, iconEmoji: '🎬' },
  { id: 'item-badge-vault', name: 'Financial Vault Master', type: 'badge', unlockRequirement: 'Save $3,000+', unlockLevel: 5, unlocked: true, iconEmoji: '💎' },
  { id: 'item-badge-legend', name: 'Grandmaster Habit Titan', type: 'badge', unlockRequirement: 'Reach Level 10', unlockLevel: 10, unlocked: false, iconEmoji: '🏆' },

  // Companions
  { id: 'item-pet-owl', name: 'Archimedes the Focus Owl', type: 'companion', unlockRequirement: 'Complete 10 Deep Focus Sessions', unlockLevel: 2, unlocked: true, iconEmoji: '🦉' },
  { id: 'item-pet-shiba', name: 'Turbo the Athletic Shiba', type: 'companion', unlockRequirement: 'Reach Level 4', unlockLevel: 4, unlocked: true, iconEmoji: '🐕' },
  { id: 'item-pet-cat', name: 'Pixel the Hacker Cat', type: 'companion', unlockRequirement: 'Reach Level 6', unlockLevel: 6, unlocked: true, iconEmoji: '🐈‍⬛' },
  { id: 'item-pet-drone', name: 'Orbit-1 Productivity Drone', type: 'companion', unlockRequirement: 'Reach Level 9', unlockLevel: 9, unlocked: false, iconEmoji: '🛸' },
];

export const INITIAL_CHALLENGES: CommunityChallenge[] = [
  {
    id: 'ch-youtube-30',
    title: '30 Days of YouTube Uploads & Shorts',
    description: 'Post at least 1 video or short every day for 30 consecutive days. Boost your channel algorithm reach.',
    category: 'creator',
    participantsCount: 842,
    durationDays: 30,
    progressPct: 60,
    userJoined: true,
    rewardXP: 500,
    rewardBadge: 'YouTube Sprint Finisher',
    leaderboard: [
      { rank: 1, name: 'Maya Lin', avatar: '👩‍💻', score: '28/30' },
      { rank: 2, name: 'Alex Rivera (You)', avatar: '🎧', score: '26/30' },
      { rank: 3, name: 'David Kim', avatar: '📹', score: '25/30' },
      { rank: 4, name: 'Sarah Chen', avatar: '✨', score: '24/30' },
    ],
  },
  {
    id: 'ch-savings-1000',
    title: '$1,000 Rapid Emergency Fund Sprint',
    description: 'Save $1,000 in 30 days through aggressive expense reduction and supplemental income streams.',
    category: 'finance',
    participantsCount: 1420,
    durationDays: 30,
    progressPct: 75,
    userJoined: true,
    rewardXP: 450,
    rewardBadge: 'Rapid Saver Shield',
    leaderboard: [
      { rank: 1, name: 'Elena Rostova', avatar: '💼', score: '$1,000 (Completed)' },
      { rank: 2, name: 'Alex Rivera (You)', avatar: '🎧', score: '$780 Saved' },
      { rank: 3, name: 'Carlos Mendez', avatar: '📊', score: '$710 Saved' },
      { rank: 4, name: 'Rachel Green', avatar: '🌱', score: '$650 Saved' },
    ],
  },
  {
    id: 'ch-75-hard',
    title: '75 Hard Mental Toughness Challenge',
    description: 'Two 45-min workouts daily, 1 gallon water, 10 pages reading, no alcohol, clean diet for 75 days.',
    category: 'fitness',
    participantsCount: 3820,
    durationDays: 75,
    progressPct: 24,
    userJoined: false,
    rewardXP: 1000,
    rewardBadge: 'Iron Will Legend',
    leaderboard: [
      { rank: 1, name: 'Marcus Steel', avatar: '🏋️', score: '52/75' },
      { rank: 2, name: 'Zoe Vance', avatar: '🏃‍♀️', score: '49/75' },
      { rank: 3, name: 'Sam Thorne', avatar: '🧗', score: '47/75' },
    ],
  },
  {
    id: 'ch-10k-steps',
    title: '10,000 Daily Steps Squad',
    description: 'Never miss a day under 10k steps. Sync with pedometer and take walking meetings.',
    category: 'wellness',
    participantsCount: 2280,
    durationDays: 21,
    progressPct: 80,
    userJoined: true,
    rewardXP: 300,
    rewardBadge: 'Centurion Walker',
    leaderboard: [
      { rank: 1, name: 'Jordan Lee', avatar: '👟', score: '21/21' },
      { rank: 2, name: 'Alex Rivera (You)', avatar: '🎧', score: '19/21' },
      { rank: 3, name: 'Aisha Patel', avatar: '⚡', score: '18/21' },
    ],
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  theme: 'dark',
  soundEnabled: true,
  hapticsEnabled: true,
  lowPowerMode: false,
  notificationsEnabled: true,
  dailyReminderTime: '20:00',
  streakSaverTime: '21:30',
  currency: '$',
  fastTapMode: false,
};
