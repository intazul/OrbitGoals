import { Goal, Habit, UserProfile, AvatarItem, CommunityChallenge, AppSettings, DailyReflection, SecurityConfig, TimeCapsule } from '../types';
import { INITIAL_GOALS, INITIAL_HABITS, INITIAL_USER_PROFILE, AVATAR_CATALOG, INITIAL_CHALLENGES, INITIAL_SETTINGS, DEFAULT_SECURITY, INITIAL_CAPSULES } from './initialData';

const KEYS = {
  GOALS: 'orbitgoals_data_goals_v3',
  HABITS: 'orbitgoals_data_habits_v2',
  PROFILE: 'orbitgoals_data_profile_v2',
  SECURITY: 'orbitgoals_data_security_v1',
  AVATARS: 'orbitgoals_data_avatars_v1',
  CHALLENGES: 'orbitgoals_data_challenges_v1',
  SETTINGS: 'orbitgoals_data_settings_v1',
  REFLECTIONS: 'orbitgoals_data_reflections_v1',
  CAPSULES: 'orbitgoals_data_capsules_v1',
};

export const storage = {
  getGoals(): Goal[] {
    try {
      const data = localStorage.getItem(KEYS.GOALS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((g): g is Partial<Goal> => g !== null && typeof g === 'object')
            .map((g: Partial<Goal>) => ({
              id: g.id || `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: typeof g.title === 'string' ? g.title : 'Untitled Goal',
              description: typeof g.description === 'string' ? g.description : '',
              category: typeof g.category === 'string' ? g.category : 'creator',
              targetValue: typeof g.targetValue === 'number' && !isNaN(g.targetValue) && g.targetValue > 0 ? g.targetValue : 1,
              currentValue: typeof g.currentValue === 'number' && !isNaN(g.currentValue) ? Math.max(0, g.currentValue) : 0,
              unit: typeof g.unit === 'string' ? g.unit : 'units',
              frequency: g.frequency || 'daily',
              frequencyDays: Array.isArray(g.frequencyDays) ? g.frequencyDays : [],
              color: typeof g.color === 'string' ? g.color : '#6750a4',
              icon: typeof g.icon === 'string' ? g.icon : 'target',
              priority: g.priority || 'normal',
              difficulty: g.difficulty || 'medium',
              xpReward: typeof g.xpReward === 'number' ? g.xpReward : 50,
              completedDates: Array.isArray(g.completedDates) ? g.completedDates.filter((d): d is string => typeof d === 'string') : [],
              history: Array.isArray(g.history) ? g.history : [],
              subtasks: Array.isArray(g.subtasks) ? g.subtasks : [],
              notes: typeof g.notes === 'string' ? g.notes : '',
              linkedHabitId: typeof g.linkedHabitId === 'string' ? g.linkedHabitId : undefined,
              createdAt: typeof g.createdAt === 'string' ? g.createdAt : new Date().toISOString().split('T')[0],
            }));
        }
      }
    } catch {
      // localStorage error fallback
    }
    return [];
  },

  saveGoals(goals: Goal[]) {
    try {
      localStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
    } catch {
      // ignore
    }
  },

  getHabits(): Habit[] {
    try {
      const data = localStorage.getItem(KEYS.HABITS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const items = parsed
            .filter((h): h is Partial<Habit> => h !== null && typeof h === 'object')
            .map((h: Partial<Habit>) => ({
              id: h.id || `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: typeof h.title === 'string' ? h.title : 'Untitled Habit',
              description: typeof h.description === 'string' ? h.description : '',
              category: typeof h.category === 'string' ? h.category : 'wellness',
              timeOfDay: h.timeOfDay || 'anytime',
              frequency: h.frequency || 'daily',
              frequencyDays: Array.isArray(h.frequencyDays) ? h.frequencyDays : [],
              icon: typeof h.icon === 'string' ? h.icon : 'target',
              color: typeof h.color === 'string' ? h.color : '#06b6d4',
              streakDays: typeof h.streakDays === 'number' && !isNaN(h.streakDays) ? Math.max(0, h.streakDays) : 0,
              bestStreak: typeof h.bestStreak === 'number' && !isNaN(h.bestStreak) ? Math.max(0, h.bestStreak) : 0,
              completedDates: Array.isArray(h.completedDates) ? h.completedDates.filter((d): d is string => typeof d === 'string') : [],
              reminderTime: typeof h.reminderTime === 'string' ? h.reminderTime : '',
              trackingType: h.trackingType || 'sets',
              targetValue: typeof h.targetValue === 'number' && h.targetValue > 0 ? h.targetValue : 30,
              unit: typeof h.unit === 'string' ? h.unit : 'reps',
              stepValue: typeof h.stepValue === 'number' && h.stepValue > 0 ? h.stepValue : 10,
              xpPerSet: typeof h.xpPerSet === 'number' && h.xpPerSet > 0 ? h.xpPerSet : 10,
              todayProgress: typeof h.todayProgress === 'number' ? Math.max(0, h.todayProgress) : 0,
              progressHistory: h.progressHistory && typeof h.progressHistory === 'object' ? h.progressHistory : {},
              linkedGoalId: typeof h.linkedGoalId === 'string' ? h.linkedGoalId : undefined,
              linkedGoalTitle: typeof h.linkedGoalTitle === 'string' ? h.linkedGoalTitle : undefined,
              createdAt: typeof h.createdAt === 'string' ? h.createdAt : new Date().toISOString().split('T')[0],
            }));

          // If the stored data was the old pre-loaded 6 mock habits, clear them as requested
          const isOldMockSet = items.length <= 6 && items.every((h) => /^habit-[1-6]$/.test(h.id));
          if (isOldMockSet) {
            localStorage.setItem(KEYS.HABITS, JSON.stringify([]));
            return [];
          }
          return items;
        }
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveHabits(habits: Habit[]) {
    try {
      localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
    } catch {
      // ignore
    }
  },

  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          const xp = typeof parsed.xp === 'number' ? parsed.xp : 0;
          const level = typeof parsed.level === 'number' ? parsed.level : Math.max(1, Math.floor(xp / 200) + 1);
          return {
            name: typeof parsed.name === 'string' ? parsed.name : '',
            age: typeof parsed.age === 'number' ? parsed.age : null,
            onboarded: Boolean(parsed.onboarded),
            avatarId: typeof parsed.avatarId === 'string' ? parsed.avatarId : 'cosmic-astronaut',
            avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : undefined,
            title: parsed.title || 'Novice Achiever',
            motto: typeof parsed.motto === 'string' ? parsed.motto : INITIAL_USER_PROFILE.motto,
            level,
            xp,
            xpToNextLevel: typeof parsed.xpToNextLevel === 'number' ? parsed.xpToNextLevel : 200,
            streakShields: typeof parsed.streakShields === 'number' ? parsed.streakShields : 2,
          };
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USER_PROFILE;
  },

  saveProfile(profile: UserProfile) {
    try {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
  },

  getSecurity(): SecurityConfig {
    try {
      const data = localStorage.getItem(KEYS.SECURITY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return {
            enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : DEFAULT_SECURITY.enabled,
            pin: typeof parsed.pin === 'string' && parsed.pin.length === 4 ? parsed.pin : DEFAULT_SECURITY.pin,
            biometricEnabled: parsed.biometricEnabled !== undefined ? Boolean(parsed.biometricEnabled) : DEFAULT_SECURITY.biometricEnabled,
            autoLockMinutes: typeof parsed.autoLockMinutes === 'number' ? parsed.autoLockMinutes : 0,
            lastActiveTimestamp: typeof parsed.lastActiveTimestamp === 'number' ? parsed.lastActiveTimestamp : undefined,
          };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_SECURITY;
  },

  saveSecurity(security: SecurityConfig) {
    try {
      localStorage.setItem(KEYS.SECURITY, JSON.stringify(security));
    } catch {
      // ignore
    }
  },

  getAvatarCatalog(): AvatarItem[] {
    try {
      const data = localStorage.getItem(KEYS.AVATARS);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return AVATAR_CATALOG;
  },

  saveAvatarCatalog(catalog: AvatarItem[]) {
    try {
      localStorage.setItem(KEYS.AVATARS, JSON.stringify(catalog));
    } catch {
      // ignore
    }
  },

  getChallenges(): CommunityChallenge[] {
    try {
      const data = localStorage.getItem(KEYS.CHALLENGES);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return INITIAL_CHALLENGES;
  },

  saveChallenges(challenges: CommunityChallenge[]) {
    try {
      localStorage.setItem(KEYS.CHALLENGES, JSON.stringify(challenges));
    } catch {
      // ignore
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          goalXpPerStep: typeof parsed.goalXpPerStep === 'number' ? parsed.goalXpPerStep : 50,
          habitXpPerSet: typeof parsed.habitXpPerSet === 'number' ? parsed.habitXpPerSet : 10,
        };
      }
    } catch {
      // ignore
    }
    return INITIAL_SETTINGS;
  },

  saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  },

  getReflections(): DailyReflection[] {
    try {
      const data = localStorage.getItem(KEYS.REFLECTIONS);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return [
      {
        date: new Date().toISOString().split('T')[0],
        mood: 'great',
        notes: 'Crushed the YouTube video outline and hit 10k steps before sunset.',
        highlight: 'Hit 14 days consecutive streak!',
        energyLevel: 5,
      },
    ];
  },

  saveReflections(reflections: DailyReflection[]) {
    try {
      localStorage.setItem(KEYS.REFLECTIONS, JSON.stringify(reflections));
    } catch {
      // ignore
    }
  },

  getTimeCapsules(): TimeCapsule[] {
    try {
      const data = localStorage.getItem(KEYS.CAPSULES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((c: Partial<TimeCapsule>) => ({
            id: c.id || `capsule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: c.title || 'Milestone Memory',
            date: c.date || new Date().toISOString().split('T')[0],
            reflection: c.reflection || '',
            category: c.category || 'milestone',
            photoUrl: c.photoUrl,
            sticker: c.sticker || '🏆',
            tag: c.tag,
            linkedGoalTitle: c.linkedGoalTitle,
            linkedHabitTitle: c.linkedHabitTitle,
            xpBonus: typeof c.xpBonus === 'number' ? c.xpBonus : 100,
            createdAt: c.createdAt || new Date().toISOString(),
          }));
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_CAPSULES;
  },

  saveTimeCapsules(capsules: TimeCapsule[]) {
    try {
      localStorage.setItem(KEYS.CAPSULES, JSON.stringify(capsules));
    } catch {
      // ignore
    }
  },

  /**
   * Daily 00:00 Habit Reset Check:
   * Compares today's date with the last recorded active date.
   * If a new day has arrived (after midnight 00:00):
   * - Resets all habit todayProgress to 0
   * - Checks streak validity for the previous day
   * - Updates stored habits and records today as the new active date.
   */
  checkAndResetDailyHabits(customTodayStr?: string): {
    didReset: boolean;
    habits: Habit[];
    lastActiveDate: string | null;
    shieldUsed: boolean;
  } {
    const today = customTodayStr || new Date().toISOString().split('T')[0];
    const lastActive = localStorage.getItem('orbitgoals_last_active_date');
    const habits = this.getHabits();

    if (!lastActive) {
      localStorage.setItem('orbitgoals_last_active_date', today);
      return { didReset: false, habits, lastActiveDate: null, shieldUsed: false };
    }

    if (lastActive === today) {
      return { didReset: false, habits, lastActiveDate: lastActive, shieldUsed: false };
    }

    // It is a new day (00:00 rollover has occurred)!
    // Compute yesterday's date
    const todayObj = new Date(today);
    const yesterdayObj = new Date(todayObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    const profile = this.getProfile();
    let shieldsAvailable = profile.streakShields || 0;
    let anyShieldUsed = false;

    const updatedHabits = habits.map((habit) => {
      const completedDates = habit.completedDates || [];
      const completedYesterday = completedDates.includes(yesterdayStr);
      let streakDays = habit.streakDays || 0;

      // If habit was not completed yesterday and has a streak
      if (!completedYesterday && streakDays > 0) {
        if (shieldsAvailable > 0) {
          shieldsAvailable -= 1;
          anyShieldUsed = true;
          // Streak preserved by shield!
        } else {
          streakDays = 0;
        }
      }

      return {
        ...habit,
        todayProgress: 0, // Reset today's progress to 0 for the fresh day!
        streakDays,
      };
    });

    if (anyShieldUsed) {
      this.saveProfile({
        ...profile,
        streakShields: shieldsAvailable,
      });
    }

    this.saveHabits(updatedHabits);
    localStorage.setItem('orbitgoals_last_active_date', today);

    return {
      didReset: true,
      habits: updatedHabits,
      lastActiveDate: lastActive,
      shieldUsed: anyShieldUsed,
    };
  },

  /**
   * Manually reset daily habit progress for testing or on-demand reset
   */
  resetDailyHabitsProgress(): Habit[] {
    const today = new Date().toISOString().split('T')[0];
    const habits = this.getHabits();
    const updated = habits.map((h) => ({
      ...h,
      todayProgress: 0,
      completedDates: (h.completedDates || []).filter((d) => d !== today),
    }));
    this.saveHabits(updated);
    return updated;
  },

  exportFullBackup(): string {
    const backup = {
      app: 'OrbitGoals',
      version: '2.1',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      goals: this.getGoals(),
      habits: this.getHabits(),
      profile: this.getProfile(),
      security: this.getSecurity(),
      avatars: this.getAvatarCatalog(),
      challenges: this.getChallenges(),
      settings: this.getSettings(),
      reflections: this.getReflections(),
      capsules: this.getTimeCapsules(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string): {
    success: boolean;
    error?: string;
    counts?: { goals: number; habits: number; profileName?: string };
    data?: {
      goals: Goal[];
      habits: Habit[];
      profile: UserProfile;
      settings: AppSettings;
      security: SecurityConfig;
    };
  } {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return { success: false, error: 'Empty or invalid file content.' };
      }

      const backup = JSON.parse(jsonString);
      if (!backup || typeof backup !== 'object') {
        return { success: false, error: 'Invalid JSON backup format.' };
      }

      // Restore Goals
      if (Array.isArray(backup.goals)) {
        this.saveGoals(backup.goals);
      }
      // Restore Habits
      if (Array.isArray(backup.habits)) {
        this.saveHabits(backup.habits);
      }
      // Restore Profile
      if (backup.profile && typeof backup.profile === 'object') {
        this.saveProfile(backup.profile);
      }
      // Restore Security
      if (backup.security && typeof backup.security === 'object') {
        this.saveSecurity(backup.security);
      }
      // Restore Avatars
      if (Array.isArray(backup.avatars)) {
        this.saveAvatarCatalog(backup.avatars);
      }
      // Restore Challenges
      if (Array.isArray(backup.challenges)) {
        this.saveChallenges(backup.challenges);
      }
      // Restore Settings
      if (backup.settings && typeof backup.settings === 'object') {
        this.saveSettings(backup.settings);
      }
      // Restore Reflections
      if (Array.isArray(backup.reflections)) {
        this.saveReflections(backup.reflections);
      }
      // Restore Capsules
      if (Array.isArray(backup.capsules)) {
        this.saveTimeCapsules(backup.capsules);
      }

      const restoredGoals = this.getGoals();
      const restoredHabits = this.getHabits();
      const restoredProfile = this.getProfile();
      const restoredSettings = this.getSettings();
      const restoredSecurity = this.getSecurity();

      return {
        success: true,
        counts: {
          goals: restoredGoals.length,
          habits: restoredHabits.length,
          profileName: restoredProfile.name || 'User',
        },
        data: {
          goals: restoredGoals,
          habits: restoredHabits,
          profile: restoredProfile,
          settings: restoredSettings,
          security: restoredSecurity,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Import failed: ${msg}` };
    }
  },

  resetToDefault() {
    localStorage.removeItem(KEYS.GOALS);
    localStorage.removeItem(KEYS.HABITS);
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.SECURITY);
    localStorage.removeItem(KEYS.AVATARS);
    localStorage.removeItem(KEYS.CHALLENGES);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.REFLECTIONS);
    localStorage.removeItem(KEYS.CAPSULES);
    localStorage.removeItem('orbitgoals_last_active_date');
    localStorage.removeItem('orbitgoals_biometric_credential_id');
  },
};
