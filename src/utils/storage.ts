import { Goal, UserProfile, AvatarItem, CommunityChallenge, AppSettings, DailyReflection, SecurityConfig } from '../types';
import { INITIAL_GOALS, INITIAL_USER_PROFILE, AVATAR_CATALOG, INITIAL_CHALLENGES, INITIAL_SETTINGS, DEFAULT_SECURITY } from './initialData';

const KEYS = {
  GOALS: 'orbitgoals_data_goals_v3',
  PROFILE: 'orbitgoals_data_profile_v2',
  SECURITY: 'orbitgoals_data_security_v1',
  AVATARS: 'orbitgoals_data_avatars_v1',
  CHALLENGES: 'orbitgoals_data_challenges_v1',
  SETTINGS: 'orbitgoals_data_settings_v1',
  REFLECTIONS: 'orbitgoals_data_reflections_v1',
};

export const storage = {
  getGoals(): Goal[] {
    try {
      const data = localStorage.getItem(KEYS.GOALS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((g: Partial<Goal>) => ({
            id: g.id || `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: g.title || 'Untitled Goal',
            description: g.description || '',
            category: g.category || 'creator',
            targetValue: typeof g.targetValue === 'number' && g.targetValue > 0 ? g.targetValue : 1,
            currentValue: typeof g.currentValue === 'number' ? g.currentValue : 0,
            unit: g.unit || 'units',
            frequency: g.frequency || 'daily',
            frequencyDays: Array.isArray(g.frequencyDays) ? g.frequencyDays : [],
            color: g.color || '#6750a4',
            icon: g.icon || 'target',
            priority: g.priority || 'normal',
            difficulty: g.difficulty || 'medium',
            xpReward: g.xpReward || 50,
            completedDates: Array.isArray(g.completedDates) ? g.completedDates : [],
            history: Array.isArray(g.history) ? g.history : [],
            subtasks: Array.isArray(g.subtasks) ? g.subtasks : [],
            notes: g.notes || '',
            createdAt: g.createdAt || new Date().toISOString().split('T')[0],
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

  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return {
            name: typeof parsed.name === 'string' ? parsed.name : '',
            age: typeof parsed.age === 'number' ? parsed.age : null,
            onboarded: Boolean(parsed.onboarded),
            title: parsed.title || 'Goal Achiever',
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
      if (data) return JSON.parse(data);
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

  exportFullBackup(): string {
    const backup = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      goals: this.getGoals(),
      profile: this.getProfile(),
      security: this.getSecurity(),
      avatars: this.getAvatarCatalog(),
      challenges: this.getChallenges(),
      settings: this.getSettings(),
      reflections: this.getReflections(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string): boolean {
    try {
      const backup = JSON.parse(jsonString);
      if (backup.goals) this.saveGoals(backup.goals);
      if (backup.profile) this.saveProfile(backup.profile);
      if (backup.security) this.saveSecurity(backup.security);
      if (backup.avatars) this.saveAvatarCatalog(backup.avatars);
      if (backup.challenges) this.saveChallenges(backup.challenges);
      if (backup.settings) this.saveSettings(backup.settings);
      if (backup.reflections) this.saveReflections(backup.reflections);
      return true;
    } catch {
      return false;
    }
  },

  resetToDefault() {
    localStorage.removeItem(KEYS.GOALS);
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.SECURITY);
    localStorage.removeItem(KEYS.AVATARS);
    localStorage.removeItem(KEYS.CHALLENGES);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.REFLECTIONS);
  },
};
